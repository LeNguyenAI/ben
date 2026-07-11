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
  if (!value || !isSafeUrl(value)) return { ok: false, embedUrl: "", message: "URL video không hợp lệ." };
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
    if (!id) return { ok: false, embedUrl: "", message: "Không nhận diện được YouTube ID." };
    return { ok: true, embedUrl: `https://www.youtube.com/embed/${id}`, thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
  }
  if (type === "vimeo") {
    if (!host.endsWith("vimeo.com")) return { ok: false, embedUrl: "", message: "URL Vimeo không hợp lệ." };
    const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
    if (!id) return { ok: false, embedUrl: "", message: "Không nhận diện được Vimeo ID." };
    return { ok: true, embedUrl: `https://player.vimeo.com/video/${id}` };
  }
  if (type === "tiktok") {
    return host.endsWith("tiktok.com") ? { ok: true, embedUrl: "" } : { ok: false, embedUrl: "", message: "URL TikTok không hợp lệ." };
  }
  if (type === "facebook") {
    return host.endsWith("facebook.com") || host === "fb.watch" ? { ok: true, embedUrl: "" } : { ok: false, embedUrl: "", message: "URL Facebook không hợp lệ." };
  }
  if (type === "mp4") {
    return /\.mp4($|\?)/i.test(url.pathname + url.search) ? { ok: true, embedUrl: value } : { ok: false, embedUrl: "", message: "URL MP4 phải kết thúc bằng .mp4." };
  }
  return { ok: true, embedUrl: "" };
};

const galleryGroups = [
  { code: "space", labels: ["space"], name: "Không gian chill" },
  { code: "guest", labels: ["guest", "friends"], name: "Hình khách" },
  { code: "food", labels: ["food"], name: "Food & Beer" },
  { code: "event", labels: ["event"], name: "Tiệc & đêm chill" },
  { code: "video", labels: ["video"], name: "Video" }
];
const sectionNames = {
  hero: "Hero đầu trang",
  hero_message: "Tagline Hero",
  about: "Câu chuyện Nhà Bến",
  positioning: "Định vị thương hiệu",
  spaces: "Không gian",
  sunset: "Landmark 81 & Hoàng hôn",
  gallery: "Hình ảnh & Video",
  personal_event: "Tiệc cá nhân",
  events: "Tiệc cá nhân",
  b2b: "Sự kiện doanh nghiệp",
  menu: "Menu",
  booking: "Đặt bàn",
  contact: "Liên hệ",
  final_cta: "CTA cuối trang",
  closing: "CTA cuối trang",
  footer: "Chân trang"
};
const sectionAnchors = { hero: "/", hero_message: "/", about: "/#about", spaces: "/#spaces", sunset: "/#sunset", gallery: "/#gallery", events: "/#events", personal_event: "/#events", b2b: "/#b2b", menu: "/#menu", booking: "/#booking", contact: "/#contact", closing: "/#booking", final_cta: "/#booking", footer: "/#contact" };
const groupFor = (category = "") => galleryGroups.find((group) => group.labels.includes(String(category).toLowerCase())) || galleryGroups[0];
const folderLabels = { hero: "Hero", sections: "Section", gallery: "Gallery", menu: "Menu", events: "Sự kiện", video: "Video Thumbnail", general: "Chung", "": "Tất cả" };
const safeFileName = (name = "image") => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
const objectPathFromUrl = (url = "") => {
  const marker = `/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : "";
};
const publicUrlFor = (name) => supa.storage.from(bucket).getPublicUrl(name).data.publicUrl;

function modal(title, bodyHtml, size = "") {
  const wrap = document.createElement("div");
  wrap.className = `admin-modal ${size}`;
  wrap.innerHTML = `<div class="admin-modal-backdrop" data-close="true"></div><section class="admin-modal-panel"><header><h2>${title}</h2><button class="btn" data-close="true" type="button">Đóng</button></header><div class="admin-modal-body">${bodyHtml}</div></section>`;
  document.body.appendChild(wrap);
  document.body.style.overflow = "hidden";
  const close = () => { wrap.remove(); document.body.style.overflow = ""; };
  wrap.addEventListener("click", (event) => { if (event.target.dataset.close) close(); });
  window.addEventListener("keydown", function onKey(event) {
    if (event.key === "Escape" && document.body.contains(wrap)) { close(); window.removeEventListener("keydown", onKey); }
  });
  return { el: wrap, body: $(".admin-modal-body", wrap), close };
}

function confirmModal(message) {
  return new Promise((resolve) => {
    const m = modal("Xác nhận", `<p class="muted">${message}</p><div class="toolbar"><button class="btn danger" data-yes type="button">Xác nhận</button><button class="btn" data-close="true" type="button">Huỷ</button></div>`);
    $("[data-yes]", m.el).addEventListener("click", () => { m.close(); resolve(true); });
    m.el.addEventListener("click", (event) => { if (event.target.dataset.close) resolve(false); });
  });
}

async function listMedia(folder = "") {
  const folders = folder ? [folder] : ["hero", "sections", "gallery", "menu", "events", "video", "general", ""];
  const files = [];
  for (const prefix of folders) {
    const { data = [] } = await supa.storage.from(bucket).list(prefix, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    data.filter((file) => file.name && !file.name.endsWith("/")).forEach((file) => {
      const pathName = prefix ? `${prefix}/${file.name}` : file.name;
      if (/\.(jpg|jpeg|png|webp|gif|mp4)$/i.test(pathName)) files.push({ ...file, pathName, folder: prefix, url: publicUrlFor(pathName) });
    });
  }
  return files;
}

async function mediaPicker({ title = "Chọn ảnh từ thư viện", folder = "" } = {}) {
  const m = modal(title, `<div class="toolbar media-toolbar"><input id="mediaSearch" placeholder="Tìm ảnh..."><select id="mediaFolder">${Object.entries(folderLabels).map(([value, label]) => `<option value="${value}" ${value === folder ? "selected" : ""}>${label}</option>`).join("")}</select></div><div class="media-grid" id="mediaGrid"><p class="muted">Đang tải thư viện...</p></div><div class="toolbar"><button class="btn primary" id="useMedia" type="button" disabled>Dùng ảnh này</button></div>`, "wide");
  let chosen = null;
  const render = async () => {
    const selectedFolder = $("#mediaFolder", m.el).value;
    const query = $("#mediaSearch", m.el).value.toLowerCase();
    const files = (await listMedia(selectedFolder)).filter((file) => /\.(jpg|jpeg|png|webp|gif)$/i.test(file.pathName) && file.pathName.toLowerCase().includes(query));
    $("#mediaGrid", m.el).innerHTML = files.map((file) => `<button class="media-card" type="button" data-url="${esc(file.url)}" data-path="${esc(file.pathName)}"><img src="${esc(file.url)}" alt=""><span>${esc(file.pathName)}</span></button>`).join("") || `<p class="muted">Chưa có ảnh trong thư mục này.</p>`;
  };
  await render();
  $("#mediaSearch", m.el).addEventListener("input", render);
  $("#mediaFolder", m.el).addEventListener("change", render);
  $("#mediaGrid", m.el).addEventListener("click", (event) => {
    const card = event.target.closest(".media-card");
    if (!card) return;
    $$(".media-card", m.el).forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
    chosen = { url: card.dataset.url, path: card.dataset.path };
    $("#useMedia", m.el).disabled = false;
  });
  return new Promise((resolve) => {
    $("#useMedia", m.el).addEventListener("click", () => { m.close(); resolve(chosen); });
  });
}

async function uploadOne(file, folder = "general") {
  const name = `${folder}/${safeFileName(file.name).replace(/(\.[^.]+)$/, `-${Date.now()}$1`)}`;
  const { error } = await supa.storage.from(bucket).upload(name, file, { upsert: false });
  if (error) throw error;
  return { path: name, url: publicUrlFor(name) };
}

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
  const [sections, gallery, videos, menu] = await Promise.all([
    supa.from("site_sections").select("id", { count: "exact", head: true }),
    supa.from("gallery_items").select("id", { count: "exact", head: true }),
    supa.from("video_items").select("id", { count: "exact", head: true }),
    supa.from("menu_items").select("id", { count: "exact", head: true })
  ]);
  body.innerHTML = `<div class="grid">
    <div class="panel"><h2>Nội dung</h2><p class="muted">${sections.count || 0} section có thể chỉnh.</p><a class="btn primary" href="/admin/content/">Sửa nội dung</a></div>
    <div class="panel"><h2>Gallery</h2><p class="muted">${gallery.count || 0} ảnh trong thư viện.</p><a class="btn primary" href="/admin/gallery/">Quản lý gallery</a></div>
    <div class="panel"><h2>Video</h2><p class="muted">${videos.count || 0} video đang lưu.</p><a class="btn primary" href="/admin/videos/">Quản lý video</a></div>
    <div class="panel"><h2>Menu</h2><p class="muted">${menu.count || 0} món đang lưu.</p><a class="btn primary" href="/admin/menu/">Quản lý menu</a></div>
    <div class="panel"><h2>Cài đặt</h2><p class="muted">Hotline, email, Google Maps, social và SEO.</p><a class="btn primary" href="/admin/settings/">Mở cài đặt</a></div>
  </div>`;
}

async function contentPage() {
  const body = shell("Nội dung website", "Sửa chữ và thay ảnh section bằng thao tác chọn ảnh trực quan.");
  if (!body || !(await requireAdmin())) return;
  const { data = [] } = await supa.from("site_sections").select("*").order("sort_order", { ascending: true });
  const { data: revisions = [] } = await supa.from("content_revisions").select("*").eq("entity_type", "site_sections").order("created_at", { ascending: false }).limit(8);
  body.innerHTML = `<div class="item-list">${data.map((row) => `
    <form class="panel section-form friendly-form" data-id="${row.id}">
      <div class="friendly-head"><div><h2>${esc(sectionNames[row.section_key] || row.section_key)}</h2><p class="mini">Key kỹ thuật: ${esc(row.section_key)}</p></div><a class="btn" href="${sectionAnchors[row.section_key] || "/"}" target="_blank" rel="noopener noreferrer">Xem vị trí trên website</a></div>
      <div class="grid">
        <label>Eyebrow<input name="eyebrow" value="${esc(row.eyebrow || "")}"></label>
        <label>Thứ tự<input name="sort_order" type="number" value="${row.sort_order || 0}"></label>
        <label class="full">Tiêu đề<input name="title" value="${esc(row.title || "")}"></label>
        <label class="full">Mô tả<textarea name="description">${esc(row.description || "")}</textarea></label>
        <div class="full image-picker-field">
          <b>Ảnh đang dùng</b>
          <img class="section-image-preview" src="${esc(row.image_url || "/ben-chill-logo.png")}" alt="">
          <input name="image_url" type="hidden" value="${esc(row.image_url || "")}">
          <div class="toolbar"><button class="btn pick-section-image" type="button">Chọn từ thư viện</button><label class="btn file-btn">Upload ảnh mới<input class="section-upload" type="file" accept="image/png,image/jpeg,image/webp"></label><button class="btn danger clear-section-image" type="button">Xoá ảnh khỏi section</button><button class="btn manual-url-toggle" type="button">Nhập URL thủ công</button></div>
          <label class="manual-url hide">URL ảnh<input class="manual-url-input" value="${esc(row.image_url || "")}"></label>
        </div>
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
  $$(".section-form").forEach((form) => {
    const hidden = $("[name='image_url']", form);
    const preview = $(".section-image-preview", form);
    $(".pick-section-image", form).addEventListener("click", async () => {
      const picked = await mediaPicker({ folder: "sections" });
      if (!picked) return;
      hidden.value = picked.url;
      $(".manual-url-input", form).value = picked.url;
      preview.src = picked.url;
      toast("Đã chọn ảnh");
    });
    $(".section-upload", form).addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      $("#saveStatus").textContent = "Đang upload ảnh...";
      try {
        const uploaded = await uploadOne(file, "sections");
        hidden.value = uploaded.url;
        $(".manual-url-input", form).value = uploaded.url;
        preview.src = uploaded.url;
        toast("Đã upload ảnh");
      } catch (error) { toast(error.message || "Có lỗi, vui lòng thử lại", false); }
      $("#saveStatus").textContent = "Sẵn sàng";
    });
    $(".clear-section-image", form).addEventListener("click", () => {
      hidden.value = "";
      $(".manual-url-input", form).value = "";
      preview.src = "/ben-chill-logo.png";
    });
    $(".manual-url-toggle", form).addEventListener("click", () => $(".manual-url", form).classList.toggle("hide"));
    $(".manual-url-input", form).addEventListener("input", (event) => { hidden.value = event.target.value; if (event.target.value) preview.src = event.target.value; });
  });
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
  const body = shell("Thư viện ảnh", "Upload, xem, copy URL và quản lý ảnh đang dùng trên website.");
  if (!body || !(await requireAdmin())) return;
  body.innerHTML = `<div class="panel media-upload-zone"><div><h2>Upload ảnh mới</h2><p class="muted">Kéo thả hoặc chọn nhiều ảnh. File sẽ được đặt tên an toàn và lưu vào thư mục đã chọn.</p></div><div class="toolbar"><select id="uploadFolder">${Object.entries(folderLabels).filter(([value]) => value).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select><label class="btn primary file-btn">Chọn ảnh<input id="mediaFiles" type="file" accept="image/png,image/jpeg,image/webp" multiple></label></div><div id="uploadQueue" class="upload-queue"></div></div><div class="toolbar media-toolbar"><input id="imageSearch" placeholder="Tìm ảnh..."><select id="imageFolder">${Object.entries(folderLabels).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select><button class="btn" id="reloadMedia" type="button">Tải lại</button></div><div class="media-grid admin-card-grid" id="imageLibrary"><p class="muted">Đang tải thư viện...</p></div>`;
  const renderLibrary = async () => {
    const files = (await listMedia($("#imageFolder").value)).filter((file) => /\.(jpg|jpeg|png|webp|gif)$/i.test(file.pathName) && file.pathName.toLowerCase().includes($("#imageSearch").value.toLowerCase()));
    const [sectionRes, galleryRes, menuRes, videoRes] = await Promise.all([
      supa.from("site_sections").select("section_key,image_url"),
      supa.from("gallery_items").select("caption,image_url,category"),
      supa.from("menu_items").select("name,image_url"),
      supa.from("video_items").select("title,thumbnail_url")
    ]);
    const sections = Array.isArray(sectionRes.data) ? sectionRes.data : [];
    const gallery = Array.isArray(galleryRes.data) ? galleryRes.data : [];
    const menu = Array.isArray(menuRes.data) ? menuRes.data : [];
    const videos = Array.isArray(videoRes.data) ? videoRes.data : [];
    const usageFor = (url) => [
      ...sections.filter((item) => item.image_url === url).map((item) => sectionNames[item.section_key] || item.section_key),
      ...gallery.filter((item) => item.image_url === url).map((item) => `Gallery: ${groupFor(item.category).name}`),
      ...menu.filter((item) => item.image_url === url).map((item) => `Menu: ${item.name}`),
      ...videos.filter((item) => item.thumbnail_url === url).map((item) => `Video: ${item.title}`)
    ];
    $("#imageLibrary").innerHTML = files.map((file) => {
      const uses = usageFor(file.url);
      return `<article class="media-card-info"><img src="${esc(file.url)}" alt=""><div><b>${esc(file.pathName)}</b><p class="mini">${folderLabels[file.folder] || "Chung"} · ${Math.round((file.metadata?.size || 0) / 1024)}KB</p>${uses.length ? `<p class="mini ok-text">Đang dùng: ${esc(uses.join(", "))}</p>` : `<p class="mini">Chưa thấy nơi sử dụng</p>`}</div><div class="toolbar"><button class="btn copy-url" data-url="${esc(file.url)}" type="button">Copy URL</button><button class="btn danger delete-media" data-path="${esc(file.pathName)}" data-uses="${esc(uses.join("\\n"))}" type="button">Xoá</button></div></article>`;
    }).join("") || `<p class="muted">Chưa có ảnh.</p>`;
  };
  await renderLibrary();
  $("#imageSearch").addEventListener("input", renderLibrary);
  $("#imageFolder").addEventListener("change", renderLibrary);
  $("#reloadMedia").addEventListener("click", renderLibrary);
  $("#mediaFiles").addEventListener("change", async (event) => {
    const files = [...event.target.files];
    $("#uploadQueue").innerHTML = files.map((file) => `<div class="upload-row"><span>${esc(file.name)}</span><span>Chờ upload</span></div>`).join("");
    for (const [index, file] of files.entries()) {
      $(".upload-row:nth-child(" + (index + 1) + ") span:last-child").textContent = "Đang upload...";
      try { await uploadOne(file, $("#uploadFolder").value); $(".upload-row:nth-child(" + (index + 1) + ") span:last-child").textContent = "Thành công"; }
      catch { $(".upload-row:nth-child(" + (index + 1) + ") span:last-child").textContent = "Lỗi"; }
    }
    toast("Đã xử lý upload");
    renderLibrary();
  });
  $("#imageLibrary").addEventListener("click", async (event) => {
    if (event.target.classList.contains("copy-url")) {
      await navigator.clipboard?.writeText(event.target.dataset.url);
      toast("Đã copy URL");
    }
    if (event.target.classList.contains("delete-media")) {
      const uses = event.target.dataset.uses;
      const message = uses ? `Ảnh này đang được dùng tại:\n${uses}\n\nBạn vẫn muốn xoá?` : "Xoá ảnh này khỏi Storage?";
      if (!(await confirmModal(message.replace(/\n/g, "<br>")))) return;
      const { error } = await supa.storage.from(bucket).remove([event.target.dataset.path]);
      toast(error ? error.message : "Đã xoá ảnh", !error);
      if (!error) renderLibrary();
    }
  });
}

async function tablePage(kind) {
  const isMenu = kind === "menu";
  if (!isMenu) return galleryPage();
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

async function galleryPage() {
  const body = shell("Gallery", "Quản lý ảnh theo đúng tab hiển thị ngoài website.");
  if (!body || !(await requireAdmin())) return;
  let { data: items = [] } = await supa.from("gallery_items").select("*").order("sort_order", { ascending: true });
  let active = galleryGroups[0].code;
  let dirty = false;
  const itemsFor = () => items.filter((item) => groupFor(item.category).code === active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const render = () => {
    const action = active === "video"
      ? `<a class="btn primary" href="/admin/videos/">Quản lý video thật</a><span class="mini">Tab này chỉ dành cho ảnh gallery cũ. Video thật nằm ở trang Video.</span>`
      : `<button class="btn primary" id="addGallery" type="button">+ Thêm ảnh vào ${galleryGroups.find((g) => g.code === active).name}</button><button class="btn ${dirty ? "primary" : ""}" id="saveGalleryOrder" type="button" ${dirty ? "" : "disabled"}>Lưu thứ tự</button><button class="btn" id="cancelGalleryOrder" type="button" ${dirty ? "" : "disabled"}>Huỷ thay đổi</button>`;
    body.innerHTML = `<div class="friendly-tabs">${galleryGroups.map((group) => `<button class="friendly-tab ${active === group.code ? "active" : ""}" data-tab="${group.code}" type="button">${group.name}<span>${items.filter((item) => groupFor(item.category).code === group.code).length}</span></button>`).join("")}</div><div class="toolbar page-actions">${action}</div><div class="admin-card-grid gallery-card-grid" id="galleryCards">${itemsFor().map((item, index) => `<article class="admin-card gallery-card" draggable="true" data-id="${item.id}"><div class="drag-handle">Kéo thả</div><img src="${esc(item.image_url || "/ben-chill-logo.png")}" alt=""><div class="admin-card-body"><b>${esc(item.caption || "Chưa có caption")}</b><p class="mini">${item.is_visible ? "Hiển thị" : "Đang ẩn"} · Vị trí ${index + 1}</p><div class="toolbar"><button class="btn edit-gallery" type="button">Sửa</button><button class="btn toggle-gallery" type="button">${item.is_visible ? "Ẩn" : "Hiện"}</button><button class="btn danger delete-gallery" type="button">Xoá</button></div><div class="toolbar mobile-order"><button class="btn move-gallery" data-move="-1" type="button">Lên</button><button class="btn move-gallery" data-move="1" type="button">Xuống</button><button class="btn move-gallery" data-move="first" type="button">Lên đầu</button><button class="btn move-gallery" data-move="last" type="button">Xuống cuối</button></div></div></article>`).join("") || `<div class="empty-card"><h2>${active === "video" ? "Video thật nằm ở trang Video" : "Chưa có ảnh"}</h2><p class="muted">${active === "video" ? "Bấm “Quản lý video thật” để thêm YouTube, TikTok, Facebook hoặc MP4." : "Bấm “Thêm ảnh” để bắt đầu."}</p></div>`}</div>`;
  };
  const reorder = (fromId, toId) => {
    const list = itemsFor();
    const from = list.findIndex((item) => item.id === fromId);
    const to = list.findIndex((item) => item.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    items = items.filter((item) => groupFor(item.category).code !== active).concat(list.map((item, index) => ({ ...item, sort_order: index + 1 })));
    dirty = true;
    render();
  };
  const openGalleryModal = async (item = null) => {
    const group = galleryGroups.find((g) => g.code === active);
    const current = item || { category: group.code, caption: "", image_alt: "", image_url: "", is_visible: true, sort_order: itemsFor().length + 1 };
    const m = modal(item ? "Sửa ảnh Gallery" : `Thêm ảnh vào ${group.name}`, `<form id="galleryEditForm" class="friendly-form"><img class="modal-preview" src="${esc(current.image_url || "/ben-chill-logo.png")}" alt=""><div class="toolbar"><button class="btn pick-image" type="button">Chọn từ thư viện</button><label class="btn file-btn">Upload ảnh mới<input id="galleryUpload" type="file" accept="image/png,image/jpeg,image/webp"></label></div><input name="image_url" type="hidden" value="${esc(current.image_url || "")}"><label>Caption<input name="caption" value="${esc(current.caption || "")}"></label><label>Alt text<input name="image_alt" value="${esc(current.image_alt || "")}"></label><label>Nhóm ảnh<select name="category">${galleryGroups.map((g) => `<option value="${g.code}" ${groupFor(current.category).code === g.code ? "selected" : ""}>${g.name}</option>`).join("")}</select></label><label>Trạng thái<select name="is_visible"><option value="true" ${current.is_visible !== false ? "selected" : ""}>Hiển thị</option><option value="false" ${current.is_visible === false ? "selected" : ""}>Ẩn</option></select></label><details><summary>Thông tin kỹ thuật</summary><label>URL ảnh<input class="tech-url" value="${esc(current.image_url || "")}"></label><p class="mini">ID: ${esc(current.id || "Ảnh mới")}</p></details><button class="btn primary full">Lưu ảnh</button></form>`, "medium");
    const form = $("#galleryEditForm", m.el);
    $(".pick-image", form).addEventListener("click", async () => {
      const picked = await mediaPicker({ folder: "gallery" });
      if (!picked) return;
      form.image_url.value = picked.url;
      $(".tech-url", form).value = picked.url;
      $(".modal-preview", form).src = picked.url;
    });
    $("#galleryUpload", form).addEventListener("change", async (event) => {
      const file = event.target.files[0]; if (!file) return;
      try { const uploaded = await uploadOne(file, "gallery"); form.image_url.value = uploaded.url; $(".tech-url", form).value = uploaded.url; $(".modal-preview", form).src = uploaded.url; toast("Đã upload ảnh"); }
      catch (error) { toast(error.message, false); }
    });
    $(".tech-url", form).addEventListener("input", (event) => { form.image_url.value = event.target.value; $(".modal-preview", form).src = event.target.value || "/ben-chill-logo.png"; });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form));
      payload.is_visible = payload.is_visible === "true";
      payload.sort_order = current.sort_order || itemsFor().length + 1;
      const request = item?.id ? supa.from("gallery_items").update(payload).eq("id", item.id) : supa.from("gallery_items").insert(payload);
      const { error } = await request;
      toast(error ? error.message : item ? "Đã lưu ảnh" : "Đã thêm vào Gallery", !error);
      if (!error) { m.close(); const res = await supa.from("gallery_items").select("*").order("sort_order", { ascending: true }); items = res.data || items; active = groupFor(payload.category).code; render(); }
    });
  };
  render();
  body.addEventListener("click", async (event) => {
    const tab = event.target.closest(".friendly-tab");
    if (tab) { active = tab.dataset.tab; dirty = false; render(); return; }
    if (event.target.id === "addGallery") return openGalleryModal();
    if (event.target.id === "cancelGalleryOrder") { const res = await supa.from("gallery_items").select("*").order("sort_order", { ascending: true }); items = res.data || items; dirty = false; render(); return; }
    if (event.target.id === "saveGalleryOrder") {
      const list = itemsFor();
      for (const [index, item] of list.entries()) await supa.from("gallery_items").update({ sort_order: index + 1 }).eq("id", item.id);
      dirty = false; toast("Đã lưu thứ tự"); render(); return;
    }
    const card = event.target.closest(".gallery-card");
    if (!card) return;
    const item = items.find((row) => row.id === card.dataset.id);
    if (event.target.classList.contains("edit-gallery")) return openGalleryModal(item);
    if (event.target.classList.contains("toggle-gallery")) {
      const { error } = await supa.from("gallery_items").update({ is_visible: !item.is_visible }).eq("id", item.id);
      toast(error ? error.message : "Đã cập nhật trạng thái", !error);
      if (!error) { item.is_visible = !item.is_visible; render(); }
    }
    if (event.target.classList.contains("delete-gallery")) {
      if (!(await confirmModal("Xoá ảnh khỏi Gallery? Ảnh trong Storage vẫn được giữ."))) return;
      const { error } = await supa.from("gallery_items").delete().eq("id", item.id);
      toast(error ? error.message : "Đã xoá ảnh", !error);
      if (!error) { items = items.filter((row) => row.id !== item.id); render(); }
    }
    if (event.target.classList.contains("move-gallery")) {
      const list = itemsFor();
      const index = list.findIndex((row) => row.id === item.id);
      let target = index;
      if (event.target.dataset.move === "first") target = 0;
      else if (event.target.dataset.move === "last") target = list.length - 1;
      else target = index + Number(event.target.dataset.move);
      if (target < 0 || target >= list.length) return;
      reorder(item.id, list[target].id);
    }
  });
  let dragId = null;
  body.addEventListener("dragstart", (event) => { const card = event.target.closest(".gallery-card"); if (card) dragId = card.dataset.id; });
  body.addEventListener("dragover", (event) => { if (event.target.closest(".gallery-card")) event.preventDefault(); });
  body.addEventListener("drop", (event) => { const card = event.target.closest(".gallery-card"); if (card && dragId) reorder(dragId, card.dataset.id); dragId = null; });
}

async function videosPage() {
  const body = shell("Quản lý video", "Thêm, sửa, preview và sắp xếp video cho tab Video ngoài website.");
  if (!body || !(await requireAdmin())) return;
  const { data, error: loadError } = await supa.from("video_items").select("*").order("sort_order", { ascending: true });
  let rows = Array.isArray(data) ? data : [];
  let dirty = false;
  const updateFormPreview = (form) => {
    const type = form.video_type.value;
    const result = normalizeVideo(type, form.video_url.value);
    if (!result.ok) {
      $(".video-preview", form).innerHTML = `<span class="danger-text">${esc(result.message)}</span>`;
      return result;
    }
    if (!form.thumbnail_url.value && result.thumbnail) form.thumbnail_url.value = result.thumbnail;
    form.embed_url.value = result.embedUrl || "";
    const thumb = form.thumbnail_url.value;
    const preview = $(".video-preview", form);
    if (type === "youtube" || type === "vimeo") preview.innerHTML = `<iframe style="width:100%;aspect-ratio:16/9;border:0;border-radius:14px" src="${esc(result.embedUrl)}" loading="lazy" allowfullscreen></iframe>`;
    else if (type === "mp4") preview.innerHTML = `<video controls preload="metadata" style="width:100%;border-radius:14px" ${thumb ? `poster="${esc(thumb)}"` : ""}><source src="${esc(form.video_url.value)}" type="video/mp4"></video>`;
    else preview.innerHTML = `<a class="btn" href="${esc(form.video_url.value)}" target="_blank" rel="noopener noreferrer">Mở video để xem trước</a>`;
    const img = $(".video-thumb-preview", form);
    if (thumb && img?.tagName === "IMG") img.src = thumb;
    return result;
  };
  const previewVideo = (item) => {
    const result = normalizeVideo(item.video_type, item.video_url);
    const m = modal("Preview video", `<div class="video-preview-box">${item.video_type === "youtube" || item.video_type === "vimeo" ? `<iframe src="${esc(result.embedUrl)}" allowfullscreen loading="lazy"></iframe>` : item.video_type === "mp4" ? `<video controls preload="metadata" ${item.thumbnail_url ? `poster="${esc(item.thumbnail_url)}"` : ""}><source src="${esc(item.video_url)}" type="video/mp4"></video>` : `<a class="btn primary" href="${esc(item.video_url)}" target="_blank" rel="noopener noreferrer">Mở video</a>`}</div><p class="muted">${esc(item.description || item.title || "")}</p>`, "wide");
    return m;
  };
  const render = () => {
    body.innerHTML = `<div class="toolbar page-actions"><button class="btn primary" id="addVideo" type="button">+ Thêm video</button><button class="btn ${dirty ? "primary" : ""}" id="saveVideoOrder" type="button" ${dirty ? "" : "disabled"}>Lưu thứ tự</button></div>${loadError ? `<div class="panel"><h2>Chưa sẵn sàng</h2><p class="muted">Hãy chạy file <b>supabase/004_video_manager.sql</b> trong Supabase. Sau đó quay lại trang này.</p><p class="danger-text">${esc(loadError.message || "")}</p></div>` : ""}<div class="admin-card-grid video-card-grid" id="videoCards">${rows.length ? rows.map((row, index) => `<article class="admin-card video-admin-card" draggable="true" data-id="${row.id}"><div class="drag-handle">Kéo thả</div><img src="${esc(row.thumbnail_url || "/assets/hero-riverside.jpg")}" alt=""><div class="admin-card-body"><b>${esc(row.title || "Chưa đặt tiêu đề")}</b><p class="mini">${esc((row.video_type || "video").toUpperCase())} · ${row.is_visible ? "Hiển thị" : "Đang ẩn"} · Vị trí ${index + 1}</p><div class="toolbar"><button class="btn preview-video-card" type="button">Preview</button><button class="btn edit-video" type="button">Sửa</button><button class="btn danger delete-video" type="button">Xoá</button></div><div class="toolbar mobile-order"><button class="btn move-video" data-move="-1" type="button">Lên</button><button class="btn move-video" data-move="1" type="button">Xuống</button></div></div></article>`).join("") : `<div class="empty-card"><h2>Chưa có video nào</h2><p class="muted">Bấm “Thêm video” để bắt đầu.</p></div>`}</div>`;
  };
  const openVideoForm = (item = null) => {
    const current = item || { title: "", video_type: "youtube", video_url: "", thumbnail_url: "", description: "", is_visible: true, sort_order: rows.length + 1, muted: true, autoplay: false };
    const m = modal(item ? "Sửa video" : "Thêm video", `<form id="videoEditForm" class="friendly-form"><img class="modal-preview video-thumb-preview" src="${esc(current.thumbnail_url || "/assets/hero-riverside.jpg")}" alt=""><div class="grid"><label>Tiêu đề<input name="title" value="${esc(current.title || "")}" required></label><label>Loại video<select name="video_type"><option value="youtube" ${current.video_type === "youtube" ? "selected" : ""}>YouTube</option><option value="vimeo" ${current.video_type === "vimeo" ? "selected" : ""}>Vimeo</option><option value="tiktok" ${current.video_type === "tiktok" ? "selected" : ""}>TikTok</option><option value="facebook" ${current.video_type === "facebook" ? "selected" : ""}>Facebook</option><option value="mp4" ${current.video_type === "mp4" ? "selected" : ""}>MP4</option><option value="external" ${current.video_type === "external" ? "selected" : ""}>External</option></select></label><label class="full">URL video<input name="video_url" value="${esc(current.video_url || "")}" required></label><label>Thumbnail<input name="thumbnail_url" value="${esc(current.thumbnail_url || "")}"></label><label>Thứ tự<input name="sort_order" type="number" value="${current.sort_order || rows.length + 1}"></label><label>Trạng thái<select name="is_visible"><option value="true" ${current.is_visible !== false ? "selected" : ""}>Hiển thị</option><option value="false" ${current.is_visible === false ? "selected" : ""}>Ẩn</option></select></label><label>Âm thanh<select name="muted"><option value="true" ${current.muted !== false ? "selected" : ""}>Muted</option><option value="false" ${current.muted === false ? "selected" : ""}>Có âm thanh khi bấm</option></select></label><label class="full">Mô tả<textarea name="description">${esc(current.description || "")}</textarea></label><input name="embed_url" type="hidden" value="${esc(current.embed_url || "")}"><input name="category" type="hidden" value="${esc(current.category || "video")}"><input name="autoplay" type="hidden" value="false"></div><div class="toolbar"><button class="btn choose-thumb" type="button">Chọn thumbnail từ thư viện</button><button class="btn preview-video" type="button">Preview</button></div><div class="video-preview mini"></div><button class="btn primary full">Lưu video</button></form>`, "medium");
    const form = $("#videoEditForm", m.el);
    $(".choose-thumb", form).addEventListener("click", async () => { const picked = await mediaPicker({ folder: "video" }); if (picked) { form.thumbnail_url.value = picked.url; $(".video-thumb-preview", form).src = picked.url; } });
    form.thumbnail_url.addEventListener("input", () => { if (form.thumbnail_url.value) $(".video-thumb-preview", form).src = form.thumbnail_url.value; });
    $(".preview-video", form).addEventListener("click", () => updateFormPreview(form));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const result = updateFormPreview(form);
      if (!result.ok) return toast(result.message, false);
      const payload = Object.fromEntries(new FormData(form));
      payload.sort_order = Number(payload.sort_order || 0);
      payload.is_visible = payload.is_visible === "true";
      payload.autoplay = false;
      payload.muted = payload.muted === "true";
      payload.embed_url = result.embedUrl || "";
      if (!payload.thumbnail_url && result.thumbnail) payload.thumbnail_url = result.thumbnail;
      const request = item?.id ? supa.from("video_items").update(payload).eq("id", item.id) : supa.from("video_items").insert(payload);
      const { error } = await request;
      toast(error ? error.message : item ? "Đã cập nhật video" : "Đã thêm video", !error);
      if (!error) { m.close(); const res = await supa.from("video_items").select("*").order("sort_order", { ascending: true }); rows = res.data || rows; render(); }
    });
  };
  render();
  body.addEventListener("click", async (event) => {
    if (event.target.id === "addVideo") return openVideoForm();
    if (event.target.id === "saveVideoOrder") {
      for (const [index, item] of rows.entries()) await supa.from("video_items").update({ sort_order: index + 1 }).eq("id", item.id);
      dirty = false; toast("Đã lưu thứ tự"); render(); return;
    }
    const card = event.target.closest(".video-admin-card");
    if (!card) return;
    const item = rows.find((row) => row.id === card.dataset.id);
    if (event.target.classList.contains("preview-video-card")) return previewVideo(item);
    if (event.target.classList.contains("edit-video")) return openVideoForm(item);
    if (event.target.classList.contains("delete-video")) {
      if (!(await confirmModal("Xoá video này?"))) return;
      const { error } = await supa.from("video_items").delete().eq("id", item.id);
      toast(error ? error.message : "Đã xoá video", !error);
      if (!error) { rows = rows.filter((row) => row.id !== item.id); render(); }
    }
    if (event.target.classList.contains("move-video")) {
      const index = rows.findIndex((row) => row.id === item.id);
      const target = index + Number(event.target.dataset.move);
      if (target < 0 || target >= rows.length) return;
      const [moved] = rows.splice(index, 1); rows.splice(target, 0, moved); dirty = true; render();
    }
  });
  let dragId = null;
  body.addEventListener("dragstart", (event) => { const card = event.target.closest(".video-admin-card"); if (card) dragId = card.dataset.id; });
  body.addEventListener("dragover", (event) => { if (event.target.closest(".video-admin-card")) event.preventDefault(); });
  body.addEventListener("drop", (event) => {
    const card = event.target.closest(".video-admin-card");
    if (!card || !dragId) return;
    const from = rows.findIndex((row) => row.id === dragId);
    const to = rows.findIndex((row) => row.id === card.dataset.id);
    if (from >= 0 && to >= 0) { const [moved] = rows.splice(from, 1); rows.splice(to, 0, moved); dirty = true; render(); }
    dragId = null;
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
else if (route === "settings") settingsPage();
else dashboard();
