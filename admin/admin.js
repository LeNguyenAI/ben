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
  ["Menu", "/admin/menu/"],
  ["Cài đặt", "/admin/settings/"]
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const toast = (msg, ok = true) => {
  const box = $("#toast");
  if (!box) return;
  box.textContent = msg;
  box.style.borderColor = ok ? "rgba(151,227,173,.35)" : "rgba(255,155,137,.35)";
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 3200);
};
const esc = (value = "") => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const parseJSON = (value) => {
  if (!value || !String(value).trim()) return {};
  try { return JSON.parse(value); } catch { return {}; }
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
    const email = form.email.value.trim();
    const password = form.password.value;
    const { error } = await supa.auth.signInWithPassword({ email, password });
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
  const body = shell("Tổng quan", "Quản lý nội dung, hình ảnh, gallery, menu và thông tin website.");
  if (!body || !(await requireAdmin())) return;
  const [sections, gallery, menu] = await Promise.all([
    supa.from("site_sections").select("id", { count: "exact", head: true }),
    supa.from("gallery_items").select("id", { count: "exact", head: true }),
    supa.from("menu_items").select("id", { count: "exact", head: true })
  ]);
  body.innerHTML = `<div class="grid">
    <div class="panel"><h2>Nội dung</h2><p class="muted">${sections.count || 0} section có thể chỉnh.</p><a class="btn primary" href="/admin/content/">Sửa nội dung</a></div>
    <div class="panel"><h2>Gallery</h2><p class="muted">${gallery.count || 0} ảnh trong thư viện.</p><a class="btn primary" href="/admin/gallery/">Quản lý gallery</a></div>
    <div class="panel"><h2>Menu</h2><p class="muted">${menu.count || 0} món đang lưu.</p><a class="btn primary" href="/admin/menu/">Quản lý menu</a></div>
    <div class="panel"><h2>Cài đặt</h2><p class="muted">Hotline, email, Google Maps, social và SEO.</p><a class="btn primary" href="/admin/settings/">Mở cài đặt</a></div>
  </div>`;
}

async function contentPage() {
  const body = shell("Nội dung website", "Sửa text, ảnh đại diện section, bật/tắt và lưu lịch sử chỉnh sửa.");
  if (!body || !(await requireAdmin())) return;
  const { data = [] } = await supa.from("site_sections").select("*").order("sort_order", { ascending: true });
  const { data: revisions = [] } = await supa.from("content_revisions").select("*").eq("entity_type", "site_sections").order("created_at", { ascending: false }).limit(8);
  body.innerHTML = `<div class="item-list">${data.map((row) => `
    <form class="panel section-form" data-id="${row.id}">
      <h2>${esc(row.section_key)}</h2>
      <div class="grid">
        <label>Eyebrow<input name="eyebrow" value="${esc(row.eyebrow || "")}"></label>
        <label>Thứ tự<input name="sort_order" type="number" value="${row.sort_order || 0}"></label>
        <label class="full">Tiêu đề<input name="title" value="${esc(row.title || "")}"></label>
        <label class="full">Mô tả<textarea name="description">${esc(row.description || "")}</textarea></label>
        <label>Ảnh URL<input name="image_url" value="${esc(row.image_url || "")}"></label>
        <label>Alt ảnh<input name="image_alt" value="${esc(row.image_alt || "")}"></label>
        <label class="full">JSON phụ<textarea name="content_json">${esc(JSON.stringify(row.content_json || {}, null, 2))}</textarea></label>
        <label><select name="is_visible"><option value="true" ${row.is_visible ? "selected" : ""}>Hiển thị</option><option value="false" ${!row.is_visible ? "selected" : ""}>Ẩn</option></select></label>
      </div>
      <div class="row"><span class="mini">Cập nhật: ${esc(row.updated_at || "")}</span><button class="btn primary">Lưu section</button></div>
    </form>`).join("")}</div>
    <div class="panel" style="margin-top:18px">
      <h2>Lịch sử chỉnh sửa gần đây</h2>
      <p class="muted">Có thể khôi phục về dữ liệu trước lần lưu gần nhất.</p>
      <div class="item-list">${revisions.map((item) => `<div class="row"><span class="mini">${esc(item.created_at || "")}</span><button class="btn restore-btn" data-revision="${item.id}" type="button">Khôi phục</button></div>`).join("") || `<p class="muted">Chưa có revision.</p>`}</div>
    </div>`;
  $$(".section-form").forEach((form) => form.addEventListener("submit", async (event) => {
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
  }));
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
  const body = shell("Tải ảnh lên", "Upload ảnh vào Supabase Storage rồi dùng URL cho gallery, menu hoặc section.");
  if (!body || !(await requireAdmin())) return;
  body.innerHTML = `<form class="panel" id="uploadForm"><label>Chọn ảnh<input name="file" type="file" accept="image/png,image/jpeg,image/webp" required></label><label>Alt / caption<input name="caption" placeholder="Ví dụ: Không gian ven sông lúc hoàng hôn"></label><button class="btn primary full">Tải ảnh</button><p class="muted" id="uploadResult"></p></form>`;
  $("#uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = event.target.file.files[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      toast("Chỉ nhận JPG, PNG, WEBP dưới 8MB.", false);
      return;
    }
    const safeName = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
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
  const body = shell(isMenu ? "Menu" : "Gallery", isMenu ? "Thêm, sửa, ẩn hiện và sắp xếp món." : "Thêm, sửa, ẩn hiện và sắp xếp ảnh theo tab.");
  if (!body || !(await requireAdmin())) return;
  const { data = [] } = await supa.from(table).select("*").order("sort_order", { ascending: true });
  body.innerHTML = `<div class="toolbar" style="margin-bottom:16px"><button class="btn primary" id="addItem">Thêm mới</button></div><div class="item-list" id="items"></div>`;
  const render = (items) => {
    $("#items").innerHTML = items.map((row) => `
      <form class="panel item-form" data-id="${row.id || ""}">
        ${row.image_url ? `<img class="preview-img" src="${esc(row.image_url)}" alt="">` : ""}
        <div class="grid">
          <label>${isMenu ? "Tên món" : "Caption"}<input name="${isMenu ? "name" : "caption"}" value="${esc(isMenu ? row.name || "" : row.caption || "")}"></label>
          <label>${isMenu ? "Nhóm món" : "Tab"}<input name="category" value="${esc(row.category || "space")}"></label>
          ${isMenu ? `<label>Giá<input name="price" value="${esc(row.price || "")}"></label>` : ""}
          <label>Thứ tự<input name="sort_order" type="number" value="${row.sort_order || 0}"></label>
          <label class="full">Mô tả<textarea name="description">${esc(row.description || "")}</textarea></label>
          <label>Ảnh URL<input name="image_url" value="${esc(row.image_url || "")}"></label>
          <label>Alt ảnh<input name="image_alt" value="${esc(row.image_alt || "")}"></label>
          <label><select name="is_visible"><option value="true" ${row.is_visible !== false ? "selected" : ""}>Hiển thị</option><option value="false" ${row.is_visible === false ? "selected" : ""}>Ẩn</option></select></label>
        </div>
        <div class="row"><button class="btn danger delete-btn" type="button">Xóa</button><button class="btn primary">Lưu</button></div>
      </form>`).join("");
  };
  render(data);
  $("#addItem").addEventListener("click", () => render([{ sort_order: data.length + 1, is_visible: true }, ...data]));
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
  });
  $("#items").addEventListener("click", async (event) => {
    if (!event.target.classList.contains("delete-btn")) return;
    const form = event.target.closest(".item-form");
    if (!form.dataset.id || !confirm("Xóa mục này?")) return;
    const { error } = await supa.from(table).delete().eq("id", form.dataset.id);
    toast(error ? error.message : "Đã xóa", !error);
    if (!error) form.remove();
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
else if (route === "menu") tablePage("menu");
else if (route === "settings") settingsPage();
else dashboard();
