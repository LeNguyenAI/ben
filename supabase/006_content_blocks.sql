insert into public.site_sections (section_key, eyebrow, title, description, image_url, image_alt, sort_order, content_json)
values (
  'strip',
  null,
  'Dải điểm nổi bật',
  null,
  null,
  null,
  3,
  '{
    "items": [
      {"title": "Ven sông Thanh Đa", "description": "Không gian xanh, nhiều góc ngồi thoáng"},
      {"title": "Góc ngắm Landmark 81", "description": "Đẹp nhất vào chiều tối"},
      {"title": "Tiệc và nhóm đông", "description": "Sinh nhật, liên hoan, họp mặt"},
      {"title": "Food & Beer", "description": "Món ăn chia sẻ, bia lạnh, đồ uống"}
    ]
  }'::jsonb
)
on conflict (section_key) do nothing;

update public.site_sections
set content_json = '{
  "items": [
    {"title": "Ven sông Thanh Đa", "description": "Không gian xanh, nhiều góc ngồi thoáng"},
    {"title": "Góc ngắm Landmark 81", "description": "Đẹp nhất vào chiều tối"},
    {"title": "Tiệc và nhóm đông", "description": "Sinh nhật, liên hoan, họp mặt"},
    {"title": "Food & Beer", "description": "Món ăn chia sẻ, bia lạnh, đồ uống"}
  ]
}'::jsonb
where section_key = 'strip'
  and (content_json = '{}'::jsonb or content_json is null);

update public.site_sections
set content_json = '{
  "event_items": [
    {"title": "Corporate Event", "description": "Tiệc công ty, year-end party, gặp mặt đối tác và networking."},
    {"title": "Team Gathering", "description": "Họp nhóm, liên hoan phòng ban và những buổi gặp sau giờ làm."},
    {"title": "Private Booking", "description": "Nhóm riêng cần khu vực phù hợp, lịch trình rõ và cách phục vụ riêng."},
    {"title": "Brand Activation", "description": "Launch, pop-up, workshop, acoustic night và hoạt động cộng đồng."}
  ],
  "format_items": [
    {"title": "Riverside Corporate Night", "description": "Buổi tối doanh nghiệp có không khí, riêng tư và dễ kết nối."},
    {"title": "Team & Community", "description": "Không gian cho đội nhóm, cộng đồng và những cuộc gặp sau giờ làm."},
    {"title": "Activation & Festival", "description": "Phù hợp workshop, pop-up, launch và hoạt động thương hiệu."},
    {"title": "Private Celebration", "description": "Những dịp riêng cần góc ngồi, menu và setup chỉn chu."}
  ]
}'::jsonb
where section_key = 'b2b'
  and (content_json = '{}'::jsonb or content_json is null);
