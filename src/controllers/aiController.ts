import { gemini } from "../config/gemini";
import supabase from "../config/supabase";
import { Recipe } from "../types";

export class RecipeVectorDB {
  private retryDelay = 2000;
  private maxRetries = 5;

  // Generate embedding with retry logic
  async generateEmbedding(text: string): Promise<number[]> {
    let retries = 0;
    let delay = this.retryDelay;
    
    while (retries <= this.maxRetries) {
      try {
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const response = await gemini.models.embedContent({
          model: 'gemini-embedding-exp-03-07',
          contents: text,
          config: {
            taskType: "RETRIEVAL_DOCUMENT",
          }
        });
        
        if (response.embeddings?.[0]?.values) {
          return response.embeddings[0].values as number[];
        }
        throw new Error('No embedding values returned');
        
      } catch (error: any) {
        if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
          retries++;
          if (retries > this.maxRetries) {
            throw new Error(`Failed to generate embedding after ${this.maxRetries} retries`);
          }
          delay = delay * 2 + Math.floor(Math.random() * 1000);
          console.log(`Rate limit hit. Retrying in ${delay/1000}s... (${retries}/${this.maxRetries})`);
        } else {
          throw error;
        }
      }
    }
    throw new Error('Failed to generate embedding');
  }

  // Build searchable text from recipe data
  buildSearchableText(recipe: Recipe): string {
    const parts = [
      recipe.title,
      recipe.author,
      recipe.tags?.join(', ') || '',
      recipe.ingredients?.join(', ') || '',
      recipe.instructions?.join(' ') || '',
      recipe.time,
    ].filter(Boolean);
    
    return parts.join(' ');
  }

// Generate embeddings for existing recipes and update database
async processExistingRecipes(): Promise<void> {
    try {
        // Fetch all recipes without embeddings
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select('*')
            .is('embedding', null);

        if (error) {
            throw new Error(`Failed to fetch recipes: ${error.message}`);
        }

        if (!recipes || recipes.length === 0) {
            console.log('No recipes found without embeddings');
            return;
        }

        console.log(`Processing ${recipes.length} recipes...`);

        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            
            try {
                let R: Recipe = {
                    id: recipe.id,
                    title: recipe.title,
                    author: recipe.author,
                    tags: recipe.tags as string[],
                    ingredients: recipe.ingredients as string[],
                    instructions: recipe.instructions as string[],
                    time: recipe.time
                };

                // Generate embedding
                const embedding: number[] = await this.generateEmbedding(this.buildSearchableText(R));

                // Log embedding info for debugging
                //console.log(`Embedding dimensions: ${embedding.length}`);
                
                // Convert embedding to string
                const embeddingString = JSON.stringify(embedding);
                //console.log(`JSON string length: ${embeddingString.length} characters`);

                // Update recipe with embedding
                const { error: updateError } = await supabase
                    .from('recipes')
                    .update({ embedding: embeddingString })
                    .eq('id', recipe.id);

                if (updateError) {
                    console.error(`Failed to update recipe ${recipe.id}:`);
                    
                    // Show preview of embedding instead of full vector
                    const preview = embedding.length > 5 
                        ? `[${embedding.slice(0, 3).join(', ')}, ...${embedding.length - 3} more floats]`
                        : `[${embedding.join(', ')}]`;
                    
                    console.error(`Embedding preview: ${preview}`);
                    console.error(`Full JSON string length: ${embeddingString.length} characters`);
                } else {
                    console.log(`Processed recipe ${i + 1}/${recipes.length}: ${recipe.title}`);
                }

            } catch (error: any) {
                console.error(`Error processing recipe ${recipe.id}:`, error.message);
            }
        }

        console.log('Finished processing recipes');
    } catch (error: any) {
        console.error('Error in processExistingRecipes:', error.message);
        throw error;
    }
}
}