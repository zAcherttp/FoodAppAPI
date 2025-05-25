import { gemini } from "../config/gemini";
import supabase from "../config/supabase";
import { Recipe } from "../types";

import { pipeline, dot } from '@huggingface/transformers';

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
        
        const extractor = await pipeline('feature-extraction', 'Snowflake/snowflake-arctic-embed-m-v2.0', {
          dtype: 'q8',
          revision: 'main',
        });
        
        const response = await extractor(text, { normalize: true, pooling: 'cls' });

        if (response.ort_tensor.data && response.ort_tensor.data.length > 0) {
          // Convert object to array if needed
          const tensorData = response.ort_tensor.data;
          if (Array.isArray(tensorData)) {
            return tensorData as unknown as number[];
          } else {
            // Convert object with numeric keys to array
            return Object.values(tensorData) as unknown as number[];
          }
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
async processRecipes(): Promise<void> {
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
                };                // Generate embedding
                const embedding: number[] = await this.generateEmbedding(this.buildSearchableText(R));

                // Log embedding info for debugging
                console.log(`Embedding dimensions: ${embedding.length}`);
                
                // Update recipe with embedding (store as vector directly)
                const { error: updateError } = await supabase
                    .from('recipes')
                    .update({ embedding: embedding })
                    .eq('id', recipe.id);                if (updateError) {
                    console.error(`Failed to update recipe ${recipe.id}:`, updateError.message);
                    console.error(updateError.message);
                    // Show preview of embedding instead of full vector
                    const preview = embedding.length > 5 
                        ? `[${embedding.slice(0, 3).join(', ')}, ...${embedding.length - 3} more floats]`
                        : `[${embedding.join(', ')}]`;
                    
                    console.error(`Embedding preview: ${preview}`);
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