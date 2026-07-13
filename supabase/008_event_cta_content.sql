update public.site_sections
set content_json = coalesce(content_json, '{}'::jsonb) || '{
  "personal_items": [
    {"title": "Sinh nhật", "description": "Setup bàn, góc chụp hình và khu vực theo số lượng khách."},
    {"title": "Tiệc gia đình", "description": "Không gian thoáng, dễ ngồi cùng trẻ nhỏ và người lớn tuổi."},
    {"title": "Hẹn hò", "description": "Một góc ven sông vừa đủ riêng cho buổi tối của hai người."},
    {"title": "Họp mặt bạn bè", "description": "Bàn rộng, món chia sẻ và một cuộc vui không cần vội."}
  ],
  "ctas": [
    {"title": "Tư vấn tiệc", "url": "#booking", "variant": "primary"},
    {"title": "Gọi nhanh", "url": "tel:0869159615", "variant": "secondary"}
  ]
}'::jsonb
where section_key = 'events';

update public.site_sections
set content_json = coalesce(content_json, '{}'::jsonb) || '{
  "ctas": [
    {"title": "Trao đổi về sự kiện", "url": "#booking", "variant": "primary"}
  ]
}'::jsonb
where section_key = 'b2b';
