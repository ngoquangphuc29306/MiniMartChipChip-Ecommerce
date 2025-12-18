-- Xoá bảng 'products' nếu nó đã tồn tại để đảm bảo một khởi đầu sạch.
-- CASCADE sẽ tự động xóa các đối tượng phụ thuộc như khóa ngoại.
DROP TABLE IF EXISTS public.products CASCADE;

-- Tạo lại bảng 'products' với cấu trúc hoàn chỉnh.
-- Bảng này bao gồm các cột được yêu cầu và các cột bổ sung để tương thích với ứng dụng.
CREATE TABLE public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    price integer NOT NULL,
    category text NOT NULL,
    sale_price integer,
    discount integer,
    description text,
    image text,
    rating integer,
    unit text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Kích hoạt Row Level Security (RLS) trên bảng 'products'.
-- Đây là một bước bảo mật quan trọng trong Supabase.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho phép mọi người (cả đã xác thực và chưa xác thực)
-- có thể đọc (SELECT) dữ liệu từ bảng 'products'.
CREATE POLICY "Products are viewable by everyone."
ON public.products FOR SELECT
USING (true);


-- Lưu ý quan trọng:
-- Lệnh COPY dưới đây được thiết kế để chạy trong Supabase SQL Editor.
-- Bạn phải tải file 'products.csv' lên gốc của bucket 'products-assets' trong Supabase Storage trước khi chạy lệnh này.
-- 1. Đi đến Supabase Dashboard > Storage.
-- 2. Tạo một bucket mới tên là 'products-assets' (nếu chưa có).
-- 3. Tải file 'public/products.csv' từ dự án của bạn lên thư mục gốc của bucket này.
-- 4. Chạy lệnh COPY dưới đây trong SQL Editor.

COPY public.products(name, price, category)
FROM 'products.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');