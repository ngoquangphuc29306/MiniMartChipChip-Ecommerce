# 🛒 Minimart ChipChip

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg)](https://supabase.com/)

**Minimart ChipChip** là ứng dụng thương mại điện tử hiện đại dành cho siêu thị mini, cung cấp trải nghiệm mua sắm mượt mà với tính năng theo dõi đơn hàng real-time, trợ lý AI chatbot thông minh, và bảng điều khiển quản trị đầy đủ tính năng.

---

## ✨ Tính Năng Chính

| Tính năng                   | Mô tả                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| 🛒 **Quản lý sản phẩm**     | Duyệt sản phẩm với tìm kiếm và lọc nâng cao                      |
| 🛍️ **Mua sắm dễ dàng**      | Giỏ hàng, wishlist, checkout mượt mà                             |
| 👤 **Tài khoản người dùng** | Xác thực bảo mật, quản lý profile, lịch sử đơn hàng              |
| 🤖 **AI Chatbot**           | Tích hợp **Google Gemini AI** cho hỗ trợ tức thì                 |
| ⚡ **Realtime Updates**     | Cập nhật trạng thái đơn hàng trực tiếp với **Supabase Realtime** |
| 📊 **Admin Dashboard**      | Quản lý sản phẩm, đơn hàng, doanh thu với biểu đồ trực quan      |
| 🎁 **Loyalty Program**      | Hệ thống tích điểm, đổi voucher, xếp hạng thành viên             |
| 📱 **Responsive Design**    | Tối ưu cho cả desktop và mobile                                  |

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend

- **React 18** + **Vite** - Build tool siêu nhanh
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI / Shadcn UI** - Component primitives
- **Framer Motion** - Animation library
- **TanStack Query** - Async state management
- **React Router DOM** - Client-side routing

### Backend & Database

- **Supabase** (PostgreSQL, Auth, Realtime, Storage)

### AI Integration

- **Google Gemini API** - Large Language Model cho chatbot

### Utilities

- **Lucide React** - Icons
- **Recharts** - Charts
- **jspdf / xlsx** - Export PDF/Excel

---

## 🚀 Bắt Đầu

### Yêu Cầu Hệ Thống

- **Node.js** v18 hoặc cao hơn
- **npm** hoặc **yarn**
- Tài khoản [Supabase](https://supabase.com/) (Miễn phí)
- Tài khoản [Google AI Studio](https://aistudio.google.com/) (Tùy chọn - cho AI Chatbot)

### 1. Clone Repository

```bash
git clone https://github.com/ngoquangphuc29306/minimartChipChip.git
cd minimartChipChip
```

### 2. Cài Đặt Dependencies

```bash
npm install
```

### 3. Cấu Hình Database (Supabase)

#### Bước 1: Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com/) và đăng nhập
2. Click **"New project"**
3. Ghi lại **Project URL** và **Anon Key** từ **Settings > API**

#### Bước 2: Chạy Database Migration

1. Mở **SQL Editor** trong Supabase Dashboard
2. Copy toàn bộ nội dung file [`database/complete_setup.sql`](database/complete_setup.sql)
3. Paste vào SQL Editor và click **"Run"**

> ⚠️ File này tạo **16 tables**, **RLS policies**, **RPC functions**, **triggers**, và **dữ liệu mẫu** (loyalty tiers).

#### Bước 3: Tạo Storage Bucket

1. Vào **Storage** trong Supabase Dashboard
2. Tạo bucket mới tên `avatars` với chế độ **Public**

#### Bước 4: Bật Realtime (Khuyến nghị)

1. Vào **Database > Replication**
2. Bật realtime cho: `orders`, `chat_conversations`, `chat_messages`

### 4. Cấu Hình Biến Môi Trường

```bash
# Copy file mẫu
cp .env.example .env
```

Mở file `.env` và điền thông tin:

```env
# Supabase Configuration (Bắt buộc)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Service Role Key (Chỉ cần cho seeding - KHÔNG commit lên Git!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI (Tùy chọn)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

> 💡 Lấy **Gemini API key** tại [Google AI Studio](https://aistudio.google.com/app/apikey)

### 5. Seed Dữ Liệu Sản Phẩm (Tùy chọn)

Để import sản phẩm mẫu (87 sản phẩm):

```bash
# Cài dotenv (nếu chưa có)
npm install dotenv

# Chạy script seed
node tools/seedDb.js
```

### 6. Chạy Ứng Dụng

```bash
npm run dev
```

Truy cập: `http://localhost:3000`

---

## 📂 Cấu Trúc Thư Mục

```
chipchipminimart/
├── 📁 database/              # SQL migrations cho Supabase
│   └── complete_setup.sql    # File setup đầy đủ
├── 📁 public/                # Static assets
│   └── products.csv          # Dữ liệu sản phẩm mẫu
├── 📁 src/
│   ├── 📁 api/               # API utilities
│   ├── 📁 components/        # React components
│   │   └── 📁 ui/            # Shadcn UI components
│   ├── 📁 context/           # React Context providers
│   ├── 📁 data/              # Static data & seed
│   ├── 📁 hooks/             # Custom React hooks
│   ├── 📁 lib/               # Utilities (Supabase client, etc.)
│   ├── 📁 pages/             # Page components
│   ├── 📁 services/          # API service functions
│   ├── App.jsx               # Main app component
│   └── main.jsx              # Entry point
├── 📁 tools/                 # Utility scripts
│   ├── generate-llms.js      # Generate SEO sitemap
│   └── seedDb.js             # Database seeder
├── .env.example              # Mẫu biến môi trường
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind configuration
└── vite.config.js            # Vite configuration
```

---

## 📜 Scripts

| Command                | Mô tả                      |
| ---------------------- | -------------------------- |
| `npm run dev`          | Chạy development server    |
| `npm run build`        | Build production bundle    |
| `npm run preview`      | Preview production build   |
| `node tools/seedDb.js` | Seed sản phẩm vào database |

---

## 🗄️ Database Schema

File [`database/complete_setup.sql`](database/complete_setup.sql) bao gồm:

| Bảng                 | Mô tả                  |
| -------------------- | ---------------------- |
| `profiles`           | Thông tin người dùng   |
| `products`           | Danh sách sản phẩm     |
| `orders`             | Đơn hàng               |
| `order_items`        | Chi tiết đơn hàng      |
| `product_reviews`    | Đánh giá sản phẩm      |
| `vouchers`           | Mã giảm giá            |
| `redeemed_vouchers`  | Voucher đã đổi         |
| `used_vouchers`      | Voucher đã sử dụng     |
| `loyalty_tiers`      | Cấp bậc thành viên     |
| `wishlists`          | Danh sách yêu thích    |
| `cart_items`         | Giỏ hàng               |
| `chat_history`       | Lịch sử chat AI        |
| `chat_conversations` | Cuộc hội thoại support |
| `chat_messages`      | Tin nhắn chat          |
| `contact_messages`   | Liên hệ                |
| `settings`           | Cài đặt hệ thống       |

---

## 🔒 Bảo Mật

- ⚠️ **KHÔNG BAO GIỜ** commit file `.env` lên Git
- Service Role Key chỉ dùng cho scripts local, không dùng trong frontend
- Tất cả tables đều có **Row Level Security (RLS)** được bật
- File `.gitignore` đã được cấu hình để loại trừ `.env`

---

## 🤝 Đóng Góp

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push: `git push origin feature/AmazingFeature`
5. Mở Pull Request

---

## 📄 License

Dự án này được cấp phép theo **MIT License** - xem file [LICENSE](LICENSE) để biết chi tiết.

---

## 📞 Liên Hệ

- **GitHub**: [quangphuc29306-cpu](https://github.com/quangphuc29306-cpu)
- **Email**: quangphuc29306@gmail.com

---

<p align="center">
  Made with ❤️ by ChipChip Team
</p>
#

