-- =============================================
-- MINIMART CHIPCHIP - COMPLETE DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor
-- Version: 1.0
-- =============================================

-- Enable UUID extension (required for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================
-- PART 1: CORE TABLES
-- =============================================

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text,
  phone text,
  address text,
  email text,
  points integer DEFAULT 0,
  total_points integer DEFAULT 0,
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price integer NOT NULL,
  sale_price integer,
  discount integer,
  category text NOT NULL,
  description text,
  image text,
  rating integer DEFAULT 0,
  unit text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);


-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total_price integer NOT NULL,
  status text NOT NULL DEFAULT 'Pending'::text,
  full_name text,
  phone text,
  address text,
  note text,
  voucher_code character varying,
  payment_method text DEFAULT 'cod'::text,
  payment_status text DEFAULT 'unpaid'::text CHECK (payment_status = ANY (ARRAY['unpaid'::text, 'paid'::text, 'refunded'::text])),
  tracking_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 4. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  price integer NOT NULL,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));


-- 5. PRODUCT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT product_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" ON public.product_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.product_reviews
  FOR UPDATE USING (auth.uid() = user_id);


-- 6. VOUCHERS TABLE
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['fixed'::text, 'percent'::text, 'freeship'::text])),
  value integer NOT NULL,
  max_discount integer,
  min_order integer,
  description text,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  usage_limit integer,
  used_count integer DEFAULT 0,
  target_user_id uuid,
  target_category character varying,
  is_public boolean DEFAULT true,
  points_cost integer DEFAULT 0,
  icon character varying DEFAULT '🎁'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vouchers_pkey PRIMARY KEY (id),
  CONSTRAINT vouchers_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id)
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public vouchers are viewable" ON public.vouchers
  FOR SELECT USING (is_public = true OR target_user_id = auth.uid());


-- 7. REDEEMED VOUCHERS TABLE
CREATE TABLE IF NOT EXISTS public.redeemed_vouchers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  voucher_code text NOT NULL,
  original_code character varying,
  description text,
  type character varying,
  value integer,
  min_order integer,
  max_discount integer,
  target_category character varying,
  valid_until timestamp with time zone,
  icon character varying,
  remaining_uses integer DEFAULT 1,
  is_used boolean DEFAULT false,
  redeemed_at timestamp with time zone DEFAULT now(),
  used_at timestamp with time zone,
  CONSTRAINT redeemed_vouchers_pkey PRIMARY KEY (id),
  CONSTRAINT redeemed_vouchers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.redeemed_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redeemed vouchers" ON public.redeemed_vouchers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem vouchers" ON public.redeemed_vouchers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own redeemed vouchers" ON public.redeemed_vouchers
  FOR UPDATE USING (auth.uid() = user_id);


-- 8. USED VOUCHERS TABLE
CREATE TABLE IF NOT EXISTS public.used_vouchers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  voucher_code text NOT NULL,
  used_at timestamp with time zone DEFAULT now(),
  CONSTRAINT used_vouchers_pkey PRIMARY KEY (id),
  CONSTRAINT used_vouchers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.used_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own used vouchers" ON public.used_vouchers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can use vouchers" ON public.used_vouchers
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 9. LOYALTY TIERS TABLE
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  min_points integer NOT NULL DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  free_shipping_threshold integer,
  badge_color character varying,
  icon text,
  benefits jsonb DEFAULT '[]'::jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT loyalty_tiers_pkey PRIMARY KEY (id)
);

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loyalty tiers are viewable by everyone" ON public.loyalty_tiers
  FOR SELECT USING (true);


-- 10. WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  product_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT wishlists_pkey PRIMARY KEY (id),
  CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);


-- 11. CART ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);


-- 12. CHAT HISTORY TABLE (AI Chat Logs)
CREATE TABLE IF NOT EXISTS public.chat_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_message text NOT NULL,
  bot_response text NOT NULL,
  products jsonb DEFAULT '[]'::jsonb,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_history_pkey PRIMARY KEY (id),
  CONSTRAINT chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history" ON public.chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat history" ON public.chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 13. CHAT CONVERSATIONS TABLE (Human Support)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  session_id text NOT NULL,
  status character varying DEFAULT 'ai'::character varying,
  assigned_admin uuid,
  user_name text,
  user_email text,
  user_phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_message_at timestamp with time zone DEFAULT now(),
  closed_at timestamp with time zone,
  CONSTRAINT chat_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT chat_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT chat_conversations_assigned_admin_fkey FOREIGN KEY (assigned_admin) REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.chat_conversations
  FOR SELECT USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can create conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own conversations" ON public.chat_conversations
  FOR UPDATE USING (auth.uid() = user_id OR session_id IS NOT NULL);


-- 14. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid,
  sender_type character varying NOT NULL,
  sender_id uuid,
  sender_name text,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversation messages" ON public.chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.chat_conversations 
      WHERE user_id = auth.uid() OR session_id IS NOT NULL
    )
  );

CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);


-- 15. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);


-- 16. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are viewable by authenticated" ON public.settings
  FOR SELECT USING (auth.role() = 'authenticated');


-- =============================================
-- PART 2: INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);


-- =============================================
-- PART 3: RPC FUNCTIONS (Order & Points Security)
-- =============================================

-- 3.1 Create order with server-side price validation
CREATE OR REPLACE FUNCTION create_order_with_validation(
    p_user_id UUID,
    p_cart_items JSONB,
    p_customer_info JSONB,
    p_voucher_code TEXT DEFAULT NULL,
    p_discount_amount NUMERIC DEFAULT 0,
    p_shipping_fee NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_calculated_total NUMERIC := 0;
    v_item JSONB;
    v_product RECORD;
    v_order_items JSONB := '[]'::JSONB;
    v_final_total NUMERIC;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
        SELECT id, name, price, sale_price 
        INTO v_product
        FROM products 
        WHERE id = (v_item->>'product_id')::UUID;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
        END IF;
        
        v_calculated_total := v_calculated_total + 
            (COALESCE(v_product.sale_price, v_product.price) * (v_item->>'quantity')::INTEGER);
        
        v_order_items := v_order_items || jsonb_build_object(
            'product_id', v_product.id,
            'quantity', (v_item->>'quantity')::INTEGER,
            'price', COALESCE(v_product.sale_price, v_product.price)
        );
    END LOOP;
    
    v_final_total := GREATEST(0, v_calculated_total + p_shipping_fee - p_discount_amount);
    
    INSERT INTO orders (
        user_id, total_price, status, full_name, phone, address, note,
        payment_method, payment_status, voucher_code, tracking_history
    ) VALUES (
        p_user_id, v_final_total, 'Pending',
        p_customer_info->>'name', p_customer_info->>'phone',
        p_customer_info->>'address', p_customer_info->>'note',
        COALESCE(p_customer_info->>'paymentMethod', 'cod'),
        CASE WHEN p_customer_info->>'paymentMethod' = 'cod' THEN 'unpaid' ELSE 'paid' END,
        p_voucher_code,
        jsonb_build_array(jsonb_build_object('status', 'Pending', 'timestamp', NOW(), 'note', 'Đơn hàng đã được tạo'))
    )
    RETURNING id INTO v_order_id;
    
    INSERT INTO order_items (order_id, product_id, quantity, price)
    SELECT v_order_id, (item->>'product_id')::UUID, (item->>'quantity')::INTEGER, (item->>'price')::NUMERIC
    FROM jsonb_array_elements(v_order_items) AS item;
    
    IF p_voucher_code IS NOT NULL AND p_voucher_code != '' THEN
        IF position('_' IN p_voucher_code) > 0 THEN
            UPDATE redeemed_vouchers SET is_used = true, used_at = NOW()
            WHERE voucher_code = p_voucher_code AND user_id = p_user_id;
        END IF;
        
        INSERT INTO used_vouchers (user_id, voucher_code, used_at)
        VALUES (p_user_id, p_voucher_code, NOW());
        
        UPDATE vouchers SET used_count = COALESCE(used_count, 0) + 1
        WHERE code = split_part(p_voucher_code, '_', 1);
    END IF;
    
    RETURN jsonb_build_object(
        'id', v_order_id, 'total_price', v_final_total, 'subtotal', v_calculated_total,
        'discount', p_discount_amount, 'shipping_fee', p_shipping_fee, 'status', 'Pending',
        'payment_status', CASE WHEN p_customer_info->>'paymentMethod' = 'cod' THEN 'unpaid' ELSE 'paid' END
    );
END;
$$;


-- 3.2 Atomic points update (handles concurrency)
CREATE OR REPLACE FUNCTION update_points_atomic(
    p_user_id UUID,
    p_points_delta INTEGER,
    p_update_total_points BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_points INTEGER;
    v_current_total INTEGER;
    v_new_points INTEGER;
    v_new_total INTEGER;
BEGIN
    SELECT points, total_points INTO v_current_points, v_current_total
    FROM profiles WHERE id = p_user_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'User not found: %', p_user_id; END IF;
    
    v_current_points := COALESCE(v_current_points, 0);
    v_current_total := COALESCE(v_current_total, 0);
    v_new_points := GREATEST(0, v_current_points + p_points_delta);
    
    IF p_update_total_points THEN
        v_new_total := GREATEST(0, v_current_total + p_points_delta);
    ELSE
        v_new_total := v_current_total;
    END IF;
    
    UPDATE profiles SET points = v_new_points, total_points = v_new_total WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true, 'previous_points', v_current_points, 'previous_total_points', v_current_total,
        'new_points', v_new_points, 'new_total_points', v_new_total, 'delta', p_points_delta
    );
END;
$$;


-- 3.3 Deduct points for voucher redemption
CREATE OR REPLACE FUNCTION deduct_points_for_voucher(
    p_user_id UUID,
    p_points_cost INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_points INTEGER;
BEGIN
    SELECT points INTO v_current_points FROM profiles WHERE id = p_user_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'User not found: %', p_user_id; END IF;
    
    v_current_points := COALESCE(v_current_points, 0);
    
    IF v_current_points < p_points_cost THEN
        RETURN jsonb_build_object(
            'success', false, 'error', 'Không đủ điểm',
            'current_points', v_current_points, 'required_points', p_points_cost
        );
    END IF;
    
    UPDATE profiles SET points = v_current_points - p_points_cost WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true, 'previous_points', v_current_points,
        'new_points', v_current_points - p_points_cost, 'deducted', p_points_cost
    );
END;
$$;


-- 3.4 Get product review statistics
CREATE OR REPLACE FUNCTION get_product_review_stats(p_id UUID)
RETURNS TABLE(avg_rating NUMERIC, review_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating)::NUMERIC, 0) as avg_rating,
    COUNT(*)::BIGINT as review_count
  FROM product_reviews
  WHERE product_id = p_id;
END;
$$;

-- Grant permissions for RPC functions
GRANT EXECUTE ON FUNCTION create_order_with_validation TO authenticated;
GRANT EXECUTE ON FUNCTION update_points_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_points_for_voucher TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_review_stats TO authenticated;


-- =============================================
-- PART 4: CHAT TRIGGERS & REALTIME
-- =============================================

-- Function to update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations 
  SET last_message_at = NOW(), updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_message ON chat_messages;
CREATE TRIGGER trigger_update_last_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Enable Realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;


-- =============================================
-- PART 5: INITIAL DATA (Loyalty Tiers)
-- =============================================

INSERT INTO loyalty_tiers (name, slug, min_points, discount_percent, free_shipping_threshold, badge_color, icon, benefits, sort_order) VALUES
  ('Thành viên Đồng', 'bronze', 0, 0, NULL, 'amber', '🥉', '["Tích điểm mỗi đơn hàng", "Đổi điểm lấy voucher"]', 1),
  ('Thành viên Bạc', 'silver', 1000, 5, 200000, 'gray', '🥈', '["Giảm 5% toàn bộ đơn", "Free ship đơn từ 200k", "Voucher sinh nhật"]', 2),
  ('Thành viên Vàng', 'gold', 5000, 10, 100000, 'yellow', '🥇', '["Giảm 10% toàn bộ đơn", "Free ship đơn từ 100k", "Ưu tiên hỗ trợ", "Early access Flash Sale"]', 3),
  ('Thành viên Kim Cương', 'diamond', 15000, 15, 0, 'cyan', '💎', '["Giảm 15% toàn bộ đơn", "Free ship mọi đơn", "Hotline VIP", "Quà tặng độc quyền"]', 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  min_points = EXCLUDED.min_points,
  discount_percent = EXCLUDED.discount_percent,
  free_shipping_threshold = EXCLUDED.free_shipping_threshold,
  badge_color = EXCLUDED.badge_color,
  icon = EXCLUDED.icon,
  benefits = EXCLUDED.benefits,
  sort_order = EXCLUDED.sort_order;


-- =============================================
-- PART 6: AVATAR STORAGE POLICIES
-- (Run AFTER creating 'avatars' bucket in Dashboard)
-- =============================================

-- NOTE: You must manually create the storage bucket first:
-- Go to Supabase Dashboard > Storage > Create new bucket:
--   Name: avatars
--   Public: Yes
--   File size limit: 2MB

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;

-- Policy 1: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
        (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg') OR
        storage.extension(name) = 'png' OR
        storage.extension(name) = 'gif' OR
        storage.extension(name) = 'webp'
    )
);

-- Policy 2: Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy 3: Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy 4: Allow public access to read avatars
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');


-- =============================================
-- SETUP COMPLETE!
-- =============================================
-- 
-- IMPORTANT: After running this script, you must:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named 'avatars' with Public access
--
-- Then your database is ready!
-- =============================================
