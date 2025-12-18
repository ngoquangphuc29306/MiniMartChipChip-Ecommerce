import { supabase } from '@/lib/customSupabaseClient';
import { allProducts } from '@/data/products';

export async function seedDatabase() {
    console.log('Starting to seed database...');

    // 1. Delete all existing products
    console.log('Deleting existing products...');
    const { error: deleteError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    if (deleteError) {
        console.error('Error deleting products:', deleteError);
        throw new Error('Không thể xoá sản phẩm cũ: ' + deleteError.message);
    }
    console.log('Existing products deleted.');

    // 2. Prepare new products data
    const productsToInsert = allProducts.map(p => {
        return {
            name: p.name,
            price: p.price,
            category: p.category,
        };
    });
    console.log(`Preparing to insert ${productsToInsert.length} products.`);

    // 3. Insert new products
    const { error: insertError } = await supabase.from('products').insert(productsToInsert);

    if (insertError) {
        console.error('Error inserting products:', insertError);
        throw new Error('Không thể thêm sản phẩm mới: ' + insertError.message);
    }

    console.log('Database seeded successfully!');
    return { message: `Đã nạp thành công ${productsToInsert.length} sản phẩm.` };
}