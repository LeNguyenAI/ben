# Bật email tự động khi có booking mới

Website đã gọi sẵn Edge Function `notify-booking` sau khi khách gửi form đặt bàn.

## 1. Tạo API key gửi email

Tạo tài khoản Resend, lấy `RESEND_API_KEY`.

Nên xác minh domain riêng để dùng email gửi chuyên nghiệp, ví dụ:

```txt
Bến Chill Garden <booking@tenmiencuaban.com>
```

Nếu chưa xác minh domain, Resend có thể giới hạn email gửi thử.

## 2. Cấu hình Supabase secrets

Trong Supabase CLI hoặc dashboard, đặt các biến:

```bash
supabase secrets set RESEND_API_KEY="re_xxxxxxxxx"
supabase secrets set BOOKING_NOTIFY_EMAIL="cskhbenchillgarden@gmail.com"
supabase secrets set BOOKING_FROM_EMAIL="Bến Chill Garden <booking@tenmiencuaban.com>"
```

`BOOKING_NOTIFY_EMAIL` là email nhận thông báo booking mới.

## 3. Deploy Edge Function

```bash
supabase functions deploy notify-booking
```

## 4. Kiểm tra

1. Mở website.
2. Gửi thử form đặt bàn.
3. Vào `/admin/bookings/` kiểm tra booking đã lưu.
4. Kiểm tra hộp thư `cskhbenchillgarden@gmail.com`.

Nếu chưa nhận email, booking vẫn không mất vì dữ liệu đã lưu trong admin. Hãy kiểm tra lại `RESEND_API_KEY`, email gửi, hoặc log của Edge Function trong Supabase.
