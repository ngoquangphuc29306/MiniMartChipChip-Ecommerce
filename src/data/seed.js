import { allProducts } from '@/data/products.js';

export const getSeedData = () => {
    return allProducts.map(p => ({
        name: p.name,
        price: p.price,
        sale_price: p.salePrice || null,
        discount: p.discount || null,
        category: p.category,
        description: p.description,
        image: p.image,
        rating: p.rating,
        unit: 'cái' // Mặc định, có thể cần chỉnh sửa
    }));
}