const cfg = window.BEN_CHILL_CMS_CONFIG || {};
const hasSupabase = cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase;
const supa = hasSupabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
const bucket = cfg.storageBucket || "ben-chill-media";
const path = location.pathname.replace(/\/+$/, "");
const route = path.split("/").pop() || "admin";
const adminLinks = [
  ["Tổng quan", "/admin/"],
  ["Nội dung", "/admin/content/"],
  ["Hình ảnh", "/admin/images/"],
  ["Gallery", "/admin/gallery/"],
  ["Video", "/admin/videos/"],
  ["Menu", "/admin/menu/"],
  ["Đặt bàn", "/admin/bookings/"],
  ["Cài đặt", "/admin/settings/"]
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (value = "") => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const parseJSON = (value) => {
  if (!value || !String(value).trim()) return {};
  try { return JSON.parse(value); } catch { return {}; }
};
const toast = (msg, ok = true) => {
  const box = $("#toast");
  if (!box) return;
  box.textContent = msg;
  box.style.borderColor = ok ? "rgba(151,227,173,.35)" : "rgba(255,155,137,.35)";
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 3200);
};
const safeFileName = (name) => `${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
const isSafeUrl = (value = "") => {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};
const normalizeVideo = (type, rawUrl) => {
  const value = String(rawUrl || "").trim();
  if (!value || !isSafeUrl(value)) return { ok: false, embedUrl: "", openUrl: "", message: "URL video không hợp lệ." };
  const url = new URL(value);
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (type === "youtube") {
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
    if (host.endsWith("youtube.com")) {
      if (url.pathname.startsWith("/watch")) id = url.searchParams.get("v") || "";
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] || "";
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2] || "";
    }
    if (!id) return { ok: false, embedUrl: "", openUrl: value, message: "Không nhận diện được YouTube ID." };
    return { ok: true, embedUrl: `https://www.youtube.com/embed/${id}`, openUrl: value, thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
  }
  if (type === "vimeo") {
    if (!host.endsWith("vimeo.com")) return { ok: false, embedUrl: "", openUrl: value, message: "URL Vimeo không hợp lệ." };
    const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
    if (!id) return { ok: false, embedUrl: "", openUrl: value, message: "Không nhận diện được Vimeo ID." };
    return { ok: true, embedUrl: `https://player.vimeo.com/video/${id}`, openUrl: value };
  }
  if (type === "tiktok") return host.endsWith("tiktok.com") ? { ok: true, embedUrl: "", openUrl: value } : { ok: false, embedUrl: "", openUrl: value, message: "URL TikTok không hợp lệ." };
  if (type === "facebook") return host.endsWith("facebook.com") || host === "fb.watch" ? { ok: true, embedUrl: "", openUrl: value } : { ok: false, embedUrl: "", openUrl: value, message: "URL Facebook không hợp lệ." };
  if (type === "mp4") return /\.mp4($|\?)/i.test(url.pathname + url.search) ? { ok: true, embedUrl: value, openUrl: value } : { ok: false, embedUrl: "", openUrl: value, message: "URL MP4 phải kết thúc bằng .mp4." };
  return { ok: true, embedUrl: "", openUrl: value };
};

async function requireAdmin() {
  if (!hasSupabase) return false;
  const { data: { session } } = await supa.auth.getSession();
  if (!session && !path.includes("/admin/login")) {
    location.href = "/admin/login/";
    return false;
  }
  return Boolean(session);
}

function loginPage() {
  const form = $("#loginForm");
  if (!hasSupabase) {
    $("#loginMessage").innerHTML = "Chưa cấu hình Supabase. Hãy điền URL và anon key trong <b>assets/cms/cms-config.js</b> sau khi chạy SQL.";
    form?.classList.add("hide");
    return;
  }
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    $("#loginMessage").textContent = "Đang đăng nhập...";
    const { error } = await supa.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value });
    if (error) {
      $("#loginMessage").textContent = "Không đăng nhập được. Kiểm tra email, mật khẩu hoặc quyền admin.";
      return;
    }
    location.href = "/admin/";
  });
}

function shell(title, subtitle = "") {
  const app = $("#adminApp");
  if (!app) return null;
  app.innerHTML = `
    <aside class="sidebar" id="sidebar">
      <a class="side-brand" href="/admin/"><img src="/ben-chill-logo.png" alt=""><span><b>Bến Chill Garden</b><span>Admin CMS</span></span></a>
      <nav class="nav-list">${adminLinks.map(([label, href]) => `<a class="${location.pathname === href ? "active" : ""}" href="${href}">${label}</a>`).join("")}</nav>
    </aside>
    <main class="main">
      <header class="topbar"><button class="btn mobile-menu" id="drawerBtn">Menu</button><span class="status" id="saveStatus">Sẵn sàng</span><div class="toolbar"><a class="btn" href="/" target="_blank" rel="noopener noreferrer">Xem website</a><button class="btn danger" id="logoutBtn">Đăng xuất</button></div></header>
      <section class="content">
        <div class="page-title"><div><h1>${title}</h1>${subtitle ? `<p class="muted">${subtitle}</p>` : ""}</div></div>
        <div id="pageBody"></div>
      </section>
    </main>
    <div class="toast" id="toast"></div>`;
  $("#drawerBtn")?.addEventListener("click", () => $("#sidebar")?.classList.toggle("open"));
  $("#logoutBtn")?.addEventListener("click", async () => {
    await supa?.auth.signOut();
    location.href = "/admin/login/";
  });
  if (!hasSupabase) {
    $("#pageBody").innerHTML = `<div class="empty-card"><h2>Chưa cấu hình Supabase</h2><p class="muted">Website vẫn chạy bằng dữ liệu mặc định. Để bật admin, hãy tạo Supabase project, chạy file SQL và điền <b>assets/cms/cms-config.js</b>.</p></div>`;
    return null;
  }
  return $("#pageBody");
}

async function dashboard() {
  const body = shell("Tổng quan", "Quản lý nội dung, hình ảnh, gallery, video, menu và thông tin website.");
  if (!body || !(await requireAdmin())) return;
  const [sections, gallery, videos, menu, bookings] = await Promise.all([
    supa.from("site_sections").select("id", { count: "exact", head: true }),
    supa.from("gallery_items").select("id", { count: "exact", head: true }),
    supa.from("video_items").select("id", { count: "exact", head: true }).then((res) => res).catch(() => ({ count: 0 })),
    supa.from("menu_items").select("id", { count: "exact", head: true }),
    supa.from("booking_requests").select("id", { count: "exact", head: true }).then((res) => res).catch(() => ({ count: 0 }))
  ]);
  body.innerHTML = `<div class="grid">
    <div class="panel"><h2>Nội dung</h2><p class="muted">${sections.count || 0} section có thể chỉnh.</p><a class="btn primary" href="/admin/content/">Sửa nội dung</a></div>
    <div class="panel"><h2>Gallery</h2><p class="muted">${gallery.count || 0} ảnh trong thư viện.</p><a class="btn primary" href="/admin/gallery/">Quản lý gallery</a></div>
    <div class="panel"><h2>Video</h2><p class="muted">${videos.count || 0} video đang lưu.</p><a class="btn primary" href="/admin/videos/">Quản lý video</a></div>
    <div class="panel"><h2>Menu</h2><p class="muted">${menu.count || 0} món đang lưu.</p><a class="btn primary" href="/admin/menu/">Quản lý menu</a></div>
    <div class="panel"><h2>Đặt bàn</h2><p class="muted">${bookings.count || 0} yêu cầu từ khách.</p><a class="btn primary" href="/admin/bookings/">Xem đặt bàn</a></div>
    <div class="panel"><h2>Cài đặt</h2><p class="muted">Hotline, email, Google Maps, social và SEO.</p><a class="btn primary" href="/admin/settings/">Mở cài đặt</a></div>
  </div>`;
}

async function pickImageFromLibrary() {
  const { data: files = [], error } = await supa.storage.from(bucket).list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
  if (error) {
    toast(error.message, false);
    return "";
  }
  const names = files.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file.name)).map((file) => file.name);
  if (!names.length) {
    toast("Chưa có ảnh trong thư viện.", false);
    return "";
  }
  const choice = prompt(`Nhập số ảnh muốn chọn:\n${names.map((name, index) => `${index + 1}. ${name}`).join("\n")}`);
  const picked = names[Number(choice) - 1];
  if (!picked) return "";
  const { data } = supa.storage.from(bucket).getPublicUrl(picked);
  return data.publicUrl;
}

async function contentPage() {
  const sectionNames = {
    hero: "Hero đầu trang",
    hero_message: "Thông điệp hero",
    about: "Câu chuyện Nhà Bến",
    intro: "Câu chuyện Nhà Bến",
    story: "Câu chuyện Nhà Bến",
    quote: "Câu trích dẫn",
    spaces: "Không gian",
    sunset: "Landmark & hoàng hôn",
    gallery: "Hình ảnh & video",
    events: "Tiệc cá nhân",
    b2b: "B2B & sự kiện",
    menu: "Menu nổi bật",
    booking: "Đặt bàn",
    faq: "FAQ",
    contact: "Liên hệ",
    closing: "CTA cuối trang",
    footer: "Footer"
  };
  const body = shell("Nội dung website", "Chỉnh chữ, ảnh và trạng thái từng phần trên website.");
  if (!body || !(await requireAdmin())) return;
  const { data = [] } = await supa.from("site_sections").select("*").order("sort_order", { ascending: true });
  const { data: revisions = [] } = await supa.from("content_revisions").select("*").eq("entity_type", "site_sections").order("created_at", { ascending: false }).limit(8);
  body.innerHTML = `<div class="content-manager">
    <div class="content-helper"><div><b>Cách dùng nhanh</b><p class="muted">Chọn đúng khối, sửa tiêu đề hoặc mô tả, đổi ảnh nếu cần rồi bấm lưu. Phần nâng cao chỉ mở khi cần chỉnh dữ liệu đặc biệt.</p></div><a class="btn" href="/" target="_blank" rel="noopener noreferrer">Xem website</a></div>
    <div class="item-list content-section-list">${data.map((row) => {
      const label = sectionNames[row.section_key] || row.section_key || "Section";
      return `<form class="panel section-form content-card" data-id="${row.id}">
        <div class="content-card-head">
          <div><span class="content-kicker">${esc(row.section_key || "")}</span><h2>${esc(label)}</h2></div>
          <div class="content-status">
            <label class="compact-label">Trạng thái<select name="is_visible"><option value="true" ${row.is_visible ? "selected" : ""}>Đang hiển thị</option><option value="false" ${!row.is_visible ? "selected" : ""}>Đang ẩn</option></select></label>
            <label class="compact-label">Thứ tự<input name="sort_order" type="number" value="${row.sort_order || 0}"></label>
          </div>
        </div>
        <div class="content-editor-grid">
          <div class="content-fields">
            <label>Nhãn nhỏ phía trên<input name="eyebrow" value="${esc(row.eyebrow || "")}" placeholder="Ví dụ: CÂU CHUYỆN NHÀ BẾN"></label>
            <label>Tiêu đề<input name="title" value="${esc(row.title || "")}" placeholder="Tiêu đề hiển thị trên website"></label>
            <label>Mô tả<textarea name="description" placeholder="Đoạn mô tả ngắn, dễ đọc">${esc(row.description || "")}</textarea></label>
          </div>
          <div class="content-image-box">
            <b>Ảnh đại diện section</b>
            <div class="content-preview ${row.image_url ? "" : "empty"}">${row.image_url ? `<img src="${esc(row.image_url)}" alt="${esc(row.image_alt || label)}">` : `<span>Chưa chọn ảnh</span>`}</div>
            <input name="image_url" type="hidden" value="${esc(row.image_url || "")}">
            <input class="section-upload-input" type="file" accept="image/png,image/jpeg,image/webp" hidden>
            <div class="toolbar content-image-actions"><button class="btn section-pick-image" type="button">Chọn từ thư viện</button><button class="btn section-upload-image" type="button">Upload ảnh mới</button><button class="btn danger section-clear-image" type="button">Xoá ảnh</button></div>
            <label>Alt ảnh<input name="image_alt" value="${esc(row.image_alt || "")}" placeholder="Mô tả ảnh cho Google và người dùng"></label>
          </div>
        </div>
        <details class="advanced-box"><summary>Nâng cao: URL ảnh thủ công và dữ liệu phụ</summary><div class="grid"><label class="full">URL ảnh thủ công<input class="manual-image-url" value="${esc(row.image_url || "")}" placeholder="https://..."></label><label class="full">Dữ liệu phụ<textarea name="content_json">${esc(JSON.stringify(row.content_json || {}, null, 2))}</textarea></label></div></details>
        <div class="row content-save-row"><span class="mini">Cập nhật: ${esc(row.updated_at || "Chưa có thông tin")}</span><button class="btn primary">Lưu nội dung</button></div>
      </form>`;
    }).join("")}</div>
    <div class="panel revision-panel"><h2>Lịch sử chỉnh sửa gần đây</h2><p class="muted">Dùng khi cần quay lại nội dung trước lần lưu gần nhất.</p><div class="item-list">${revisions.map((item) => `<div class="row"><span class="mini">${esc(item.created_at || "")}</span><button class="btn restore-btn" data-revision="${item.id}" type="button">Khôi phục</button></div>`).join("") || `<p class="muted">Chưa có revision.</p>`}</div></div>
  </div>`;

  const setSectionImage = (form, url) => {
    form.image_url.value = url || "";
    const manual = $(".manual-image-url", form);
    if (manual) manual.value = url || "";
    const preview = $(".content-preview", form);
    preview.classList.toggle("empty", !url);
    preview.innerHTML = url ? `<img src="${esc(url)}" alt="">` : `<span>Chưa chọn ảnh</span>`;
  };
  $$(".section-form").forEach((form) => {
    $(".manual-image-url", form)?.addEventListener("change", (event) => setSectionImage(form, event.target.value.trim()));
    form.addEventListener("click", async (event) => {
      if (event.target.classList.contains("section-upload-image")) $(".section-upload-input", form).click();
      if (event.target.classList.contains("section-clear-image")) setSectionImage(form, "");
      if (event.target.classList.contains("section-pick-image")) {
        const url = await pickImageFromLibrary();
        if (url) setSectionImage(form, url);
      }
    });
    $(".section-upload-input", form)?.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) return toast("Chỉ nhận JPG, PNG, WEBP dưới 8MB.", false);
      const uploadedName = safeFileName(file.name);
      const { error } = await supa.storage.from(bucket).upload(uploadedName, file, { upsert: false });
      if (error) return toast(error.message, false);
      const { data: publicUrl } = supa.storage.from(bucket).getPublicUrl(uploadedName);
      setSectionImage(form, publicUrl.publicUrl);
      toast("Đã upload ảnh");
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      $("#saveStatus").textContent = "Đang lưu...";
      const payload = Object.fromEntries(new FormData(form));
      payload.is_visible = payload.is_visible === "true";
      payload.sort_order = Number(payload.sort_order || 0);
      payload.content_json = parseJSON(payload.content_json);
      const id = form.dataset.id;
      const current = data.find((row) => row.id === id);
      await supa.from("content_revisions").insert({ entity_type: "site_sections", entity_id: id, before_data: current, after_data: payload });
      const { error } = await supa.from("site_sections").update(payload).eq("id", id);
      $("#saveStatus").textContent = error ? "Lỗi lưu" : "Đã lưu";
      toast(error ? error.message : "Đã lưu nội dung", !error);
    });
  });
  $$(".restore-btn").forEach((button) => button.addEventListener("click", async () => {
    const revision = revisions.find((item) => item.id === button.dataset.revision);
    if (!revision?.before_data || !confirm("Khôi phục nội dung này?")) return;
    const { id, created_at, updated_at, ...payload } = revision.before_data;
    const { error } = await supa.from("site_sections").update(payload).eq("id", revision.entity_id);
    toast(error ? error.message : "Đã khôi phục revision", !error);
    if (!error) setTimeout(() => location.reload(), 700);
  }));
}

async function uploadPage() {
  const body = shell("Tải ảnh lên", "Upload ảnh vào Supabase Storage rồi dùng cho gallery, video, menu hoặc section.");
  if (!body || !(await requireAdmin())) return;
  body.innerHTML = `<form class="panel" id="uploadForm"><label>Chọn ảnh<input name="file" type="file" accept="image/png,image/jpeg,image/webp" required></label><label>Alt / caption<input name="caption" placeholder="Ví dụ: Không gian ven sông lúc hoàng hôn"></label><button class="btn primary full">Tải ảnh</button><p class="muted" id="uploadResult"></p></form>`;
  $("#uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = event.target.file.files[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) return toast("Chỉ nhận JPG, PNG, WEBP dưới 8MB.", false);
    const safeName = safeFileName(file.name);
    const { error } = await supa.storage.from(bucket).upload(safeName, file, { upsert: false });
    if (error) return toast(error.message, false);
    const { data } = supa.storage.from(bucket).getPublicUrl(safeName);
    $("#uploadResult").innerHTML = `URL ảnh: <br><input readonly value="${esc(data.publicUrl)}">`;
    toast("Đã tải ảnh lên");
  });
}

async function tablePage(kind) {
  const isMenu = kind === "menu";
  const table = isMenu ? "menu_items" : "gallery_items";
  const body = shell(isMenu ? "Menu" : "Gallery", isMenu ? "Thêm, sửa, ẩn hiện và sắp xếp món." : "Quản lý ảnh theo tab hiển thị ngoài website. Video thật nằm ở mục Video riêng.");
  if (!body || !(await requireAdmin())) return;
  const { data = [] } = await supa.from(table).select("*").order("sort_order", { ascending: true });
  const empty = { sort_order: data.length + 1, is_visible: true, category: isMenu ? "food" : "space" };
  body.innerHTML = `<div class="content-helper"><div><b>${isMenu ? "Quản lý món" : "Quản lý ảnh Gallery"}</b><p class="muted">${isMenu ? "Cập nhật món nổi bật, giá và ảnh minh hoạ." : "Tab Video không dùng ảnh demo nữa. Muốn thêm video thật hãy vào mục Video."}</p></div>${isMenu ? "" : `<a class="btn primary" href="/admin/videos/">Quản lý video thật</a>`}</div><div class="toolbar page-actions"><button class="btn primary" id="addItem">+ Thêm mới</button></div><div class="item-list" id="items"></div>`;
  const render = (items) => {
    $("#items").innerHTML = items.map((row) => `
      <form class="panel item-form media-admin-card" data-id="${row.id || ""}">
        <div class="media-side">
          <div class="media-preview">${row.image_url ? `<img src="${esc(row.image_url)}" alt="">` : `<span>Chưa chọn ảnh</span>`}</div>
          <input class="item-upload-input" type="file" accept="image/png,image/jpeg,image/webp" hidden>
          <div class="toolbar media-image-actions">
            <button class="btn item-pick-image" type="button">Chọn từ thư viện</button>
            <button class="btn item-upload-image" type="button">Upload ảnh mới</button>
            <button class="btn danger item-clear-image" type="button">Xoá ảnh</button>
          </div>
        </div>
        <div class="grid">
          <label>${isMenu ? "Tên món" : "Caption"}<input name="${isMenu ? "name" : "caption"}" value="${esc(isMenu ? row.name || "" : row.caption || "")}"></label>
          <label>${isMenu ? "Nhóm món" : "Tab ảnh"}<input name="category" value="${esc(row.category || (isMenu ? "food" : "space"))}"></label>
          ${isMenu ? `<label>Giá<input name="price" value="${esc(row.price || "")}"></label>` : ""}
          <label>Thứ tự<input name="sort_order" type="number" value="${row.sort_order || 0}"></label>
          <label class="full">Mô tả<textarea name="description">${esc(row.description || "")}</textarea></label>
          <label class="full">Ảnh URL<input name="image_url" value="${esc(row.image_url || "")}"></label>
          <label>Alt ảnh<input name="image_alt" value="${esc(row.image_alt || "")}"></label>
          <label>Trạng thái<select name="is_visible"><option value="true" ${row.is_visible !== false ? "selected" : ""}>Hiển thị</option><option value="false" ${row.is_visible === false ? "selected" : ""}>Ẩn</option></select></label>
        </div>
        <div class="row"><button class="btn danger delete-btn" type="button">Xóa</button><button class="btn primary">${row.id ? "Lưu" : "Thêm mới"}</button></div>
      </form>`).join("");
  };
  render(data);
  const setItemImage = (form, url) => {
    form.image_url.value = url || "";
    const preview = $(".media-preview", form);
    if (!preview) return;
    preview.innerHTML = url ? `<img src="${esc(url)}" alt="">` : `<span>Chưa chọn ảnh</span>`;
  };
  $("#addItem").addEventListener("click", () => render([empty, ...data]));
  $("#items").addEventListener("change", async (event) => {
    const form = event.target.closest(".item-form");
    if (!form) return;
    if (event.target.name === "image_url") setItemImage(form, event.target.value.trim());
    if (event.target.classList.contains("item-upload-input")) {
      const file = event.target.files[0];
      if (!file) return;
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) return toast("Chỉ nhận JPG, PNG, WEBP dưới 8MB.", false);
      const uploadedName = safeFileName(file.name);
      const { error } = await supa.storage.from(bucket).upload(uploadedName, file, { upsert: false });
      if (error) return toast(error.message, false);
      const { data: publicUrl } = supa.storage.from(bucket).getPublicUrl(uploadedName);
      setItemImage(form, publicUrl.publicUrl);
      toast("Đã upload và gắn ảnh vào mục này");
    }
  });
  $("#items").addEventListener("submit", async (event) => {
    const form = event.target.closest(".item-form");
    if (!form) return;
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form));
    payload.is_visible = payload.is_visible === "true";
    payload.sort_order = Number(payload.sort_order || 0);
    const id = form.dataset.id;
    const request = id ? supa.from(table).update(payload).eq("id", id) : supa.from(table).insert(payload);
    const { error } = await request;
    toast(error ? error.message : "Đã lưu", !error);
    if (!error && !id) setTimeout(() => location.reload(), 600);
  });
  $("#items").addEventListener("click", async (event) => {
    const form = event.target.closest(".item-form");
    if (!form) return;
    if (event.target.classList.contains("item-upload-image")) $(".item-upload-input", form)?.click();
    if (event.target.classList.contains("item-clear-image")) setItemImage(form, "");
    if (event.target.classList.contains("item-pick-image")) {
      const url = await pickImageFromLibrary();
      if (url) setItemImage(form, url);
    }
    if (!event.target.classList.contains("delete-btn")) return;
    if (!form.dataset.id || !confirm("Xóa mục này?")) return;
    const { error } = await supa.from(table).delete().eq("id", form.dataset.id);
    toast(error ? error.message : "Đã xóa", !error);
    if (!error) form.remove();
  });
}

function videoForm(row = {}) {
  return `<form class="panel video-form media-admin-card" data-id="${row.id || ""}">
    <div class="media-preview video-preview">${row.thumbnail_url ? `<img src="${esc(row.thumbnail_url)}" alt="">` : `<span>Chưa chọn thumbnail</span>`}</div>
    <div class="grid">
      <label>Tiêu đề<input name="title" value="${esc(row.title || "")}" required></label>
      <label>Loại video<select name="video_type"><option value="youtube" ${row.video_type === "youtube" ? "selected" : ""}>YouTube</option><option value="vimeo" ${row.video_type === "vimeo" ? "selected" : ""}>Vimeo</option><option value="tiktok" ${row.video_type === "tiktok" ? "selected" : ""}>TikTok</option><option value="facebook" ${row.video_type === "facebook" ? "selected" : ""}>Facebook</option><option value="mp4" ${row.video_type === "mp4" ? "selected" : ""}>MP4</option><option value="external" ${row.video_type === "external" ? "selected" : ""}>Link ngoài</option></select></label>
      <label class="full">URL video<input name="video_url" value="${esc(row.video_url || "")}" placeholder="Dán link YouTube, TikTok, Facebook hoặc MP4" required></label>
      <label>Thumbnail URL<input name="thumbnail_url" value="${esc(row.thumbnail_url || "")}"></label>
      <label>Tab / nhóm<input name="category" value="${esc(row.category || "video")}"></label>
      <label>Thứ tự<input name="sort_order" type="number" value="${row.sort_order || 0}"></label>
      <label>Trạng thái<select name="is_visible"><option value="true" ${row.is_visible !== false ? "selected" : ""}>Hiển thị</option><option value="false" ${row.is_visible === false ? "selected" : ""}>Ẩn</option></select></label>
      <label>Autoplay<select name="autoplay"><option value="false" ${!row.autoplay ? "selected" : ""}>Không</option><option value="true" ${row.autoplay ? "selected" : ""}>Có</option></select></label>
      <label>Muted<select name="muted"><option value="true" ${row.muted !== false ? "selected" : ""}>Có</option><option value="false" ${row.muted === false ? "selected" : ""}>Không</option></select></label>
      <label class="full">Mô tả<textarea name="description">${esc(row.description || "")}</textarea></label>
      <input name="embed_url" type="hidden" value="${esc(row.embed_url || "")}">
    </div>
    <div class="toolbar"><button class="btn choose-thumb" type="button">Chọn thumbnail từ thư viện</button><button class="btn preview-video" type="button">Preview</button>${row.id ? `<button class="btn danger delete-video" type="button">Xóa</button>` : ""}<button class="btn primary">Lưu video</button></div>
    <p class="mini preview-result"></p>
  </form>`;
}

function updateVideoPreview(form) {
  const result = normalizeVideo(form.video_type.value, form.video_url.value);
  const message = $(".preview-result", form);
  if (!result.ok) {
    message.textContent = result.message;
    message.className = "mini danger-text preview-result";
    return result;
  }
  form.embed_url.value = result.embedUrl || "";
  if (!form.thumbnail_url.value && result.thumbnail) form.thumbnail_url.value = result.thumbnail;
  const thumb = form.thumbnail_url.value || result.thumbnail;
  const preview = $(".video-preview", form);
  if (thumb) preview.innerHTML = `<img src="${esc(thumb)}" alt="">`;
  message.textContent = result.embedUrl ? "Video có thể nhúng trên website." : "Video sẽ mở trong tab mới khi cần.";
  message.className = "mini ok-text preview-result";
  return result;
}

async function videosPage() {
  const body = shell("Quản lý video", "Thêm video thật cho tab Video ngoài website. Không cần sửa source.");
  if (!body || !(await requireAdmin())) return;
  const { data, error } = await supa.from("video_items").select("*").order("sort_order", { ascending: true });
  const rows = Array.isArray(data) ? data : [];
  body.innerHTML = `<div class="content-helper"><div><b>Video thật</b><p class="muted">Dán link YouTube, TikTok, Facebook hoặc MP4. Website chỉ tải video khi khách bấm play.</p></div><button class="btn primary" id="addVideo" type="button">+ Thêm video</button></div>${error ? `<div class="panel"><h2>Chưa sẵn sàng</h2><p class="muted">Hãy chạy file <b>supabase/004_video_manager.sql</b> trong Supabase rồi quay lại.</p><p class="danger-text">${esc(error.message)}</p></div>` : ""}<div class="item-list" id="videoItems">${rows.length ? rows.map(videoForm).join("") : `<div class="empty-card"><h2>Chưa có video</h2><p class="muted">Bấm “Thêm video” để bắt đầu.</p></div>`}</div>`;
  $("#addVideo").addEventListener("click", () => {
    const list = $("#videoItems");
    if ($(".empty-card", list)) list.innerHTML = "";
    list.insertAdjacentHTML("afterbegin", videoForm({ sort_order: rows.length + 1, is_visible: true, muted: true }));
  });
  $("#videoItems").addEventListener("click", async (event) => {
    const form = event.target.closest(".video-form");
    if (!form) return;
    if (event.target.classList.contains("preview-video")) updateVideoPreview(form);
    if (event.target.classList.contains("choose-thumb")) {
      const url = await pickImageFromLibrary();
      if (url) {
        form.thumbnail_url.value = url;
        $(".video-preview", form).innerHTML = `<img src="${esc(url)}" alt="">`;
      }
    }
    if (event.target.classList.contains("delete-video")) {
      if (!form.dataset.id || !confirm("Xóa video này?")) return;
      const { error } = await supa.from("video_items").delete().eq("id", form.dataset.id);
      toast(error ? error.message : "Đã xóa video", !error);
      if (!error) form.remove();
    }
  });
  $("#videoItems").addEventListener("submit", async (event) => {
    const form = event.target.closest(".video-form");
    if (!form) return;
    event.preventDefault();
    const result = updateVideoPreview(form);
    if (!result.ok) return toast(result.message, false);
    const payload = Object.fromEntries(new FormData(form));
    payload.sort_order = Number(payload.sort_order || 0);
    payload.is_visible = payload.is_visible === "true";
    payload.autoplay = payload.autoplay === "true";
    payload.muted = payload.muted === "true";
    payload.embed_url = result.embedUrl || payload.embed_url || "";
    if (!payload.thumbnail_url && result.thumbnail) payload.thumbnail_url = result.thumbnail;
    const id = form.dataset.id;
    const request = id ? supa.from("video_items").update(payload).eq("id", id) : supa.from("video_items").insert(payload);
    const { error } = await request;
    toast(error ? error.message : "Đã lưu video", !error);
    if (!error && !id) setTimeout(() => location.reload(), 600);
  });
}

async function bookingsPage() {
  const body = shell("Đặt bàn", "Danh sách khách đã gửi form đặt bàn trên website.");
  if (!body || !(await requireAdmin())) return;
  const { data = [], error } = await supa
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(120);
  if (error) {
    body.innerHTML = `<div class="panel"><h2>Chưa sẵn sàng</h2><p class="muted">Hãy chạy file <b>supabase/005_booking_requests.sql</b> trong Supabase để bật lưu đặt bàn.</p><p class="danger-text">${esc(error.message)}</p></div>`;
    return;
  }
  const statusMeta = {
    new: ["Khách mới", "Cần gọi/Zalo xác nhận"],
    confirmed: ["Đã xác nhận", "Đã giữ thông tin"],
    cancelled: ["Đã huỷ", "Không còn giữ bàn"],
    done: ["Đã xử lý", "Đã hoàn tất"]
  };
  const currentStatus = new URLSearchParams(location.search).get("status") || "new";
  const statuses = ["new", "confirmed", "cancelled", "done"];
  const rows = data.map((row) => ({ ...row, status: statuses.includes(row.status) ? row.status : "new" }));
  const counts = Object.fromEntries(["all", ...statuses].map((status) => [status, status === "all" ? rows.length : rows.filter((row) => row.status === status).length]));
  const filtered = currentStatus === "all" ? rows : rows.filter((row) => row.status === currentStatus);
  const cleanPhone = (value = "") => String(value || "").replace(/[^0-9]/g, "");
  const formatDateTime = (row) => [row.booking_date || "", row.booking_time || ""].filter(Boolean).join(" ") || "Chưa chọn";
  const bookingSummary = (row) => [
    `Khách: ${row.name || "Chưa nhập tên"}`,
    `SĐT: ${row.phone || "Chưa có"}`,
    `Ngày giờ: ${formatDateTime(row)}`,
    `Số khách: ${row.guests || "Chưa rõ"}`,
    `Khu vực: ${row.area || "Chưa chọn"}`,
    `Nhu cầu: ${row.booking_type || "Đặt bàn"}`,
    row.purpose ? `Mục đích: ${row.purpose}` : "",
    row.note ? `Ghi chú: ${row.note}` : ""
  ].filter(Boolean).join("\n");
  const exportBookings = () => {
    const headers = [
      "Trang thai",
      "Ngay gui",
      "Ho ten",
      "So dien thoai",
      "Ngay dat",
      "Gio dat",
      "So khach",
      "Nhu cau",
      "Muc dich",
      "Khu vuc mong muon",
      "Loai su kien",
      "Quy mo su kien",
      "Ngan sach du kien",
      "Setup / concept",
      "Ghi chu",
      "Nguon",
      "ID"
    ];
    const csvValue = (value = "") => `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ").trim()}"`;
    const lines = rows.map((row) => [
      statusMeta[row.status]?.[0] || row.status || "",
      row.created_at ? new Date(row.created_at).toLocaleString("vi-VN") : "",
      row.name,
      row.phone,
      row.booking_date,
      row.booking_time,
      row.guests,
      row.booking_type,
      row.purpose,
      row.area,
      row.event_type,
      row.event_scale,
      row.budget,
      row.concept,
      row.note,
      row.source,
      row.id
    ].map(csvValue).join(","));
    const csv = `\uFEFF${headers.map(csvValue).join(",")}\n${lines.join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `ben-chill-booking-data-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast(`Đã xuất ${rows.length} booking ra file Excel`, true);
  };
  const renderRow = (row) => {
    const phone = cleanPhone(row.phone);
    const eventText = [row.event_type, row.event_scale, row.budget, row.concept].filter(Boolean).join(" · ");
    return `<article class="booking-row booking-row-${esc(row.status)}">
      <div class="booking-person">
        <span class="booking-dot" aria-hidden="true"></span>
        <div>
          <h2>${esc(row.name || "Khách chưa nhập tên")}</h2>
          <p>${esc(row.created_at ? new Date(row.created_at).toLocaleString("vi-VN") : "")}</p>
        </div>
      </div>
      <div class="booking-details">
        <span><b>SĐT</b><a href="tel:${esc(phone || row.phone || "")}">${esc(row.phone || "Chưa có")}</a></span>
        <span><b>Ngày giờ</b>${esc(formatDateTime(row))}</span>
        <span><b>Số khách</b>${esc(row.guests || "Chưa rõ")}</span>
        <span><b>Khu vực</b>${esc(row.area || "Chưa chọn")}</span>
        <span><b>Nhu cầu</b>${esc(row.booking_type || "Đặt bàn")}</span>
        <span><b>Mục đích</b>${esc(row.purpose || "Chưa ghi")}</span>
        ${row.note ? `<span class="booking-wide"><b>Ghi chú</b>${esc(row.note)}</span>` : ""}
        ${eventText ? `<span class="booking-wide"><b>Sự kiện</b>${esc(eventText)}</span>` : ""}
      </div>
      <div class="booking-actions">
        <span class="booking-status-label">${esc(statusMeta[row.status][0])}</span>
        <a class="btn primary" href="tel:${esc(phone || row.phone || "")}">Gọi</a>
        <a class="btn" href="https://zalo.me/${esc(phone)}" target="_blank" rel="noopener noreferrer">Zalo</a>
        <button class="btn copy-booking" data-copy="${esc(bookingSummary(row))}" type="button">Copy</button>
        ${row.status !== "confirmed" ? `<button class="btn booking-status-action" data-id="${esc(row.id)}" data-status="confirmed" type="button">Xác nhận</button>` : ""}
        ${row.status !== "cancelled" ? `<button class="btn booking-status-action" data-id="${esc(row.id)}" data-status="cancelled" type="button">Huỷ</button>` : ""}
        ${row.status !== "done" ? `<button class="btn booking-status-action" data-id="${esc(row.id)}" data-status="done" type="button">Đã xử lý</button>` : ""}
        <button class="btn danger delete-booking" data-id="${esc(row.id)}" type="button">Xoá vĩnh viễn</button>
      </div>
    </article>`;
  };
  body.innerHTML = `<section class="booking-manager">
    <div class="booking-board-head">
      <div>
        <span class="content-kicker">BOOKING MANAGER</span>
        <h2>${counts.new ? `Có ${counts.new} khách mới cần xác nhận` : "Không có khách mới"}</h2>
        <p class="muted">Form đặt bàn đã lưu vào admin. Khi có khách mới, tab <b>Khách mới</b> sẽ tăng số lượng để bạn vào gọi hoặc nhắn Zalo xác nhận.</p>
        <div class="booking-export-row">
          <button class="btn primary export-bookings" type="button">Xuất Excel</button>
          <span>Xuất toàn bộ ${counts.all} khách để lưu trữ, chăm sóc lại hoặc chạy marketing.</span>
        </div>
      </div>
      <div class="booking-notice">
        <b>Nơi nhận thông tin đặt bàn</b>
        <span>Mỗi khi khách gửi form, thông tin sẽ tự lưu tại đây. Hãy kiểm tra tab Khách mới, gọi hoặc nhắn Zalo để xác nhận lại với khách.</span>
      </div>
    </div>
    <nav class="booking-tabs" aria-label="Lọc đặt bàn">
      <a class="${currentStatus === "all" ? "active" : ""}" href="/admin/bookings/?status=all">Tất cả <b>${counts.all}</b></a>
      ${statuses.map((status) => `<a class="${currentStatus === status ? "active" : ""}" href="/admin/bookings/?status=${status}">${esc(statusMeta[status][0])} <b>${counts[status]}</b></a>`).join("")}
    </nav>
    <div class="booking-status-guide">
      ${statuses.map((status) => `<div><b>${esc(statusMeta[status][0])}</b><span>${esc(statusMeta[status][1])}</span></div>`).join("")}
    </div>
    <div class="booking-table">
      ${filtered.length ? filtered.map(renderRow).join("") : `<div class="empty-card"><h2>Chưa có dữ liệu trong mục này</h2><p class="muted">Khi khách gửi form hoặc khi bạn đổi trạng thái, danh sách sẽ tự phân loại tại đây.</p></div>`}
    </div>
  </section>`;
  body.addEventListener("click", async (event) => {
    if (event.target.closest(".export-bookings")) {
      exportBookings();
      return;
    }
    const copyButton = event.target.closest(".copy-booking");
    if (copyButton) {
      await navigator.clipboard.writeText(copyButton.dataset.copy || "");
      toast("Đã copy thông tin khách", true);
      return;
    }
    const statusButton = event.target.closest(".booking-status-action");
    if (statusButton) {
      const { error } = await supa.from("booking_requests").update({ status: statusButton.dataset.status }).eq("id", statusButton.dataset.id);
      toast(error ? error.message : "Đã cập nhật trạng thái", !error);
      if (!error) setTimeout(() => location.reload(), 450);
      return;
    }
    const deleteButton = event.target.closest(".delete-booking");
    if (deleteButton && confirm("Xoá vĩnh viễn yêu cầu đặt bàn này? Thao tác này không khôi phục được.")) {
      const { error } = await supa.from("booking_requests").delete().eq("id", deleteButton.dataset.id);
      toast(error ? error.message : "Đã xoá vĩnh viễn", !error);
      if (!error) setTimeout(() => location.reload(), 450);
    }
  });
}

async function settingsPage() {
  const body = shell("Cài đặt", "Hotline, email, Google Maps, social, SEO và các link quan trọng.");
  if (!body || !(await requireAdmin())) return;
  const keys = ["brand_name","short_tagline","tagline","phone","email","address","opening_hours","maps_url","zalo_url","facebook_url","tiktok_url","instagram_url","menu_pdf_url","seo_title","meta_description","og_image"];
  const { data = [] } = await supa.from("site_settings").select("*");
  const map = Object.fromEntries(data.map((row) => [row.setting_key, row.setting_value || ""]));
  body.innerHTML = `<form class="panel" id="settingsForm"><div class="grid">${keys.map((key) => `<label>${key}<textarea name="${key}">${esc(map[key] || "")}</textarea></label>`).join("")}</div><button class="btn primary full">Lưu cài đặt</button></form>`;
  $("#settingsForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.entries(Object.fromEntries(new FormData(event.target))).map(([setting_key, setting_value]) => ({ setting_key, setting_value }));
    const { error } = await supa.from("site_settings").upsert(values, { onConflict: "setting_key" });
    toast(error ? error.message : "Đã lưu cài đặt", !error);
  });
}

if (path.includes("/admin/login")) loginPage();
else if (route === "content") contentPage();
else if (route === "images") uploadPage();
else if (route === "gallery") tablePage("gallery");
else if (route === "videos") videosPage();
else if (route === "menu") tablePage("menu");
else if (route === "bookings") bookingsPage();
else if (route === "settings") settingsPage();
else dashboard();
