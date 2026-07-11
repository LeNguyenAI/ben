insert into public.site_settings (setting_key, setting_value) values
('brand_name','Bến Chill Garden'),
('short_tagline','Chill bên sông'),
('tagline','Chill bên sông. Trọn từng khoảnh khắc.'),
('phone','0869 159 615'),
('email','CskhBenchillgarden@gmail.com'),
('address','1/50 Thanh Đa, Bình Thạnh, TP. Hồ Chí Minh'),
('opening_hours','10:00 - 23:00 mỗi ngày'),
('maps_url','https://www.google.com/maps/place/B%E1%BA%BFn+Chill+Garden/@10.8111234,106.7182749,16z/data=!3m1!4b1!4m6!3m5!1s0x3175290069e851d3:0x35d2839f1e7152b6!8m2!3d10.8111181!4d106.7208498!16s%2Fg%2F11zgqbbg63'),
('zalo_url','https://zalo.me/0869159615'),
('facebook_url',''),
('tiktok_url',''),
('instagram_url',''),
('menu_pdf_url','/menu-ben-chill-garden.pdf'),
('seo_title','Bến Chill Garden | Chill bên sông tại Thanh Đa'),
('meta_description','Bến Chill Garden - không gian sân vườn ven sông tại Thanh Đa, phù hợp hẹn hò, gia đình, sinh nhật, liên hoan và sự kiện riêng.'),
('og_image','/assets/hero-riverside.jpg')
on conflict (setting_key) do update set setting_value = excluded.setting_value;

insert into public.site_sections (section_key, eyebrow, title, description, image_url, image_alt, sort_order) values
('hero','Riverside Garden - Thanh Đa','Bến Chill Garden','Một góc sân vườn ven sông để ngắm Landmark 81, ăn tối cùng người thương, gặp bạn bè và tổ chức những buổi vui vừa đủ riêng tư.','/assets/hero-riverside.jpg','Không gian ven sông Bến Chill Garden',1),
('hero_message',null,'Chill bên sông. Trọn từng khoảnh khắc.',null,null,null,2),
('about','Câu chuyện Nhà Bến','Một nơi để gặp nhau, không phải chỉ để ghé qua','Bến Chill Garden được tạo nên cho những cuộc hẹn đời thường: một bữa tối cùng gia đình, buổi gặp cuối tuần với bạn bè hay một dịp đặc biệt cần không gian riêng. Mỗi khu vực đều được sắp xếp để khách cảm thấy thoải mái, dễ trò chuyện và không bị gò bó.','/assets/cover-main.jpg','Không gian Bến Chill Garden ven sông',3),
('quote',null,null,'“Có những nơi người ta đến để ăn.\nCó những nơi người ta ở lại vì khung cảnh.”',null,null,4),
('spaces','Không gian','Đi bao nhiêu người cũng có một góc phù hợp','Từ bàn ven sông cho buổi hẹn nhẹ nhàng đến khu sân vườn rộng rãi cho gia đình, nhóm bạn và tiệc riêng.',null,null,5),
('sunset','Sunset At Nhà Bến','Một góc ngắm Landmark 81 từ bên kia sông','Tầm chiều xuống, Landmark 81 hiện ra giữa ánh hoàng hôn và mặt sông. Đây là một trong những góc đẹp nhất để bắt đầu buổi tối tại Nhà Bến.','/assets/pano-01.jpg','Hoàng hôn ven sông và Landmark 81',6),
('gallery','Hình ảnh & video','Không gian chill là điểm nhấn của Nhà Bến','Những góc ven sông, bàn tiệc, món ăn và khoảnh khắc khách hàng trong không khí sân vườn.',null,null,7),
('events','Tiệc cá nhân','Sinh nhật, gia đình và những cuộc hẹn riêng','Một buổi tối nhẹ nhàng bên sông, có khu ngồi riêng, món chia sẻ theo nhóm và không khí đủ ấm để mọi người ở lại lâu hơn.','/assets/guest-03.jpg','Không gian ven sông cho tiệc cá nhân tại Bến Chill Garden',8),
('b2b','B2B & Event','Không gian linh hoạt cho doanh nghiệp và thương hiệu','Từ một buổi gặp đối tác bên sông đến chương trình cộng đồng có âm nhạc và trải nghiệm thương hiệu, Nhà Bến có thể linh hoạt theo quy mô và tính chất sự kiện.','/assets/cover-event.jpg','B2B và sự kiện tại Bến Chill Garden',9),
('menu','Menu nổi bật','Món ngon cho những cuộc hẹn thật dài','Các món dễ chia sẻ cho nhóm bạn, gia đình, tiệc sinh nhật và những buổi Food & Beer bên sông.',null,null,10),
('booking','Đặt bàn','Giữ một góc đẹp cho cuộc hẹn sắp tới','Để lại thông tin, Bến Chill sẽ liên hệ xác nhận khu vực ngồi, số khách và nhu cầu setup nếu có.',null,null,11),
('contact','Đến Nhà Bến','Ghé Bến Chill Garden',null,null,null,12),
('closing','Một buổi chiều bên sông?','Giữ một góc đẹp tại Nhà Bến','Chọn ngày, số lượng khách và khu vực mong muốn. Nhà Bến sẽ hỗ trợ sắp xếp phần còn lại.',null,null,13),
('footer',null,'Bến Chill Garden','Chill bên sông. Trọn từng khoảnh khắc.',null,null,14)
on conflict (section_key) do update set eyebrow = excluded.eyebrow, title = excluded.title, description = excluded.description, image_url = excluded.image_url, image_alt = excluded.image_alt, sort_order = excluded.sort_order;

delete from public.menu_items;
insert into public.menu_items (category, name, description, price, image_url, image_alt, sort_order) values
('featured','Món nướng Nhà Bến','Thịt nướng, hải sản nướng, rau củ và sốt chấm đậm vị.','Từ 129K','/assets/food-01.jpg','Món nướng',1),
('featured','Món lai rai','Đậu hũ, khoai chiên, gỏi, mực chiên và các món ăn chơi.','Từ 79K','/assets/food-02.jpg','Món lai rai',2),
('featured','Lẩu nhóm đông','Lẩu hải sản, lẩu Thái, lẩu gà và món nóng dùng chung.','Từ 299K','/assets/food-03.jpg','Lẩu',3),
('featured','Food & Beer','Bia lạnh, đồ uống theo mùa và combo món nhắm cho nhóm bạn.','Combo nhóm','/assets/cover-night.jpg','Food & Beer',4),
('featured','Set tiệc','Menu sinh nhật, liên hoan và sự kiện riêng theo số lượng khách.','Tư vấn riêng','/assets/event-01.jpg','Set tiệc',5),
('featured','Đồ uống','Nước trái cây, soda, cocktail nhẹ và lựa chọn không cồn.','Từ 49K','/assets/space-02.jpg','Đồ uống',6);

delete from public.gallery_items;
insert into public.gallery_items (category, caption, image_url, image_alt, sort_order) values
('space','Toàn cảnh Bến Chill Garden','/assets/hero-riverside.jpg','Toàn cảnh Bến Chill Garden',1),
('space','Không gian chill 1','/assets/space-01.jpg','Không gian chill 1',2),
('space','Không gian chill 2','/assets/space-02.jpg','Không gian chill 2',3),
('space','Toàn cảnh ven sông','/assets/pano-01.jpg','Toàn cảnh ven sông',4),
('space','Không gian chill 3','/assets/space-03.jpg','Không gian chill 3',5),
('space','Không gian chill 4','/assets/space-04.jpg','Không gian chill 4',6),
('guest','Khách tại Bến Chill Garden','/assets/guest-01.jpg','Khách tại Bến Chill Garden',7),
('guest','Khoảnh khắc khách hàng','/assets/guest-02.jpg','Khoảnh khắc khách hàng',8),
('guest','Hình khách','/assets/guest-03.jpg','Hình khách',9),
('food','Food & Beer','/assets/food-01.jpg','Food & Beer',10),
('food','Món ăn Bến Chill','/assets/food-02.jpg','Món ăn Bến Chill',11),
('food','Đồ ăn và bia','/assets/food-03.jpg','Đồ ăn và bia',12),
('event','Tiệc tại Bến Chill','/assets/event-01.jpg','Tiệc tại Bến Chill',13),
('event','Sinh nhật và sự kiện','/assets/event-02.jpg','Sinh nhật và sự kiện',14),
('event','Không gian sự kiện','/assets/cover-event.jpg','Không gian sự kiện',15);
