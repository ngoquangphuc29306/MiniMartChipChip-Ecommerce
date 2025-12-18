import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getSeedData } from '../src/data/seed.js';

// WARNING: This script will delete all existing products and insert new ones.
// Make sure to backup your data if needed.

// Load from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function seedDatabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or Service Role Key is missing.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const productsToSeed = getSeedData();

  try {
    console.log('Seeding database...');

    // 1. Delete all existing products to avoid duplicates
    console.log('Deleting existing products...');
    const { error: deleteError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // A safe way to delete all
    if (deleteError) {
      throw deleteError;
    }
    console.log('Existing products deleted.');

    // 2. Insert new products
    console.log(`Inserting ${productsToSeed.length} new products...`);
    // Supabase JS v2 has a default limit of 1000 rows per insert.
    // Chunking is a good practice for larger datasets, but 111 is fine.
    const { data, error: insertError } = await supabase.from('products').insert(productsToSeed).select();
    if (insertError) {
      throw insertError;
    }

    console.log(`Successfully inserted ${data.length} products.`);
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
}

seedDatabase();