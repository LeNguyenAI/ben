# Bến Chill Garden - Admin CMS

## Cấu hình Supabase

1. Tạo project Supabase mới.
2. Vào Authentication, tắt public signup nếu đang bật.
3. Tạo admin user bằng email và password trong Supabase Auth.
4. Chạy `supabase/001_schema.sql` trong SQL Editor.
5. Lấy `user_id` của admin user trong bảng `auth.users`, rồi chạy:

```sql
insert into public.admin_profiles (user_id, role)
values ('PASTE_ADMIN_USER_ID_HERE', 'admin')
on conflict (user_id) do update set role = 'admin';
```

6. Chạy `supabase/002_seed.sql`.
7. Vào `assets/cms/cms-config.js` và điền:

```js
window.BEN_CHILL_CMS_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  storageBucket: "ben-chill-media"
};
```

Không dùng service role key trong website.

## Các trang quản trị

- `/admin/login`: đăng nhập.
- `/admin`: tổng quan.
- `/admin/content`: sửa text, section, ảnh đại diện section, bật/tắt nội dung.
- `/admin/images`: upload ảnh vào Supabase Storage.
- `/admin/gallery`: quản lý ảnh gallery theo tab.
- `/admin/videos`: quản lý video thật cho tab Video.
- `/admin/menu`: quản lý món, giá, ảnh và thứ tự hiển thị.
- `/admin/settings`: hotline, email, maps, social, SEO.

## Cách hoạt động

Trang chính luôn có dữ liệu mặc định trong `index.html`. Nếu Supabase chưa cấu hình hoặc mất kết nối, website vẫn hiển thị bình thường. Khi Supabase được cấu hình, `assets/cms/cms-runtime.js` sẽ đọc dữ liệu published từ các bảng và cập nhật nội dung trang.

## Bổ sung Video Manager

Sau khi đã chạy schema cũ, chạy thêm `supabase/004_video_manager.sql` trong Supabase SQL Editor. Admin vào `/admin/videos` để thêm video.

Quy trình nhanh:

1. Chọn loại video: YouTube, Vimeo, TikTok, Facebook, MP4 hoặc External.
2. Dán URL video.
3. Chọn hoặc dán thumbnail.
4. Nhập tiêu đề, mô tả và thứ tự.
5. Bấm lưu.

YouTube watch, share và Shorts sẽ tự chuyển thành embed URL. Vimeo cũng tự chuyển embed. TikTok/Facebook được lưu URL gốc và mở tab mới nếu nhúng không ổn định. MP4 chỉ tải khi khách bấm play, dùng poster thumbnail và `preload="metadata"`.

## Bảo mật

- Frontend chỉ dùng anon key.
- RLS đã bật cho tất cả bảng CMS.
- Public chỉ đọc dữ liệu đang hiển thị.
- Chỉ tài khoản có trong `admin_profiles` mới được thêm, sửa hoặc xóa.
- Storage bucket chỉ cho public đọc ảnh; admin mới được upload/sửa/xóa.

## Deploy Vercel/GitHub

Upload toàn bộ thư mục này lên GitHub hoặc Vercel. File `index.html` nằm ở root của gói. Nếu dùng Vercel static site, đảm bảo các folder `/admin`, `/assets`, `/supabase` được upload cùng.

## Social links

Seed đã có sẵn Facebook, TikTok và Instagram chính thức của Bến Chill Garden. Nếu sau này xóa URL trong admin settings, footer sẽ tự ẩn link tương ứng để không có link giả.
