import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize storage bucket for user avatars
const initializeStorage = async () => {
  try {
    // Check if avatar bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'avatars');
  } catch (error) {
    console.error('Storage initialization error:', error);
  }
};

// Call the function but don't wait for it
initializeStorage();

export default supabase;