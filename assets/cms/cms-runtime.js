(function () {
  const config = window.BEN_CHILL_CMS_CONFIG || {};
  const isReady = config.supabaseUrl && config.supabaseAnonKey && window.supabase;
  if (!isReady) return;

  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const text = (selector, value) => {
    if (!value) return;
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  };
  const attr = (selector, name, value) => {
    if (!value) return;
    const el = document.querySelector(selector);
    if (el) el.setAttribute(name, value);
  };
  const renderCmsList = (selector, items = []) => {
    const nodes = [...document.querySelectorAll(selector)];
    items.forEach((item, index) => {
      const node = nodes[index];
      if (!node) return;
      const title = node.querySelector("b,h3,strong");
      const desc = node.querySelector("span,p");
      if (title && item.title !== undefined) title.textContent = item.title || "";
      if (desc && item.description !== undefined) desc.textContent = item.description || "";
    });
  };
  const esc = (value = "") => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const setLink = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach((el) => el.setAttribute("href", value));
  };
  const phoneHref = (phone) => phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";
  const mailHref = (email) => email ? `mailto:${email}` : "";
  const isSafeUrl = (value = "") => {
    try {
      const url = new URL(value.trim());
      return ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  };
  const normalizeVideo = (type, rawUrl, embedUrl = "") => {
    const value = String(rawUrl || "").trim();
    if (!value || !isSafeUrl(value)) return { ok: false, embedUrl: "", openUrl: "" };
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (embedUrl && isSafeUrl(embedUrl)) return { ok: true, embedUrl, openUrl: value };
    if (type === "youtube") {
      let id = "";
      if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
      if (host.endsWith("youtube.com")) {
        if (url.pathname.startsWith("/watch")) id = url.searchParams.get("v") || "";
        else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] || "";
        else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2] || "";
      }
      return id ? { ok: true, embedUrl: `https://www.youtube.com/embed/${id}`, openUrl: value, thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg` } : { ok: false, embedUrl: "", openUrl: value };
    }
    if (type === "vimeo") {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return host.endsWith("vimeo.com") && id ? { ok: true, embedUrl: `https://player.vimeo.com/video/${id}`, openUrl: value } : { ok: false, embedUrl: "", openUrl: value };
    }
    if (type === "mp4" && /\.mp4($|\?)/i.test(url.pathname + url.search)) return { ok: true, embedUrl: value, openUrl: value };
    return { ok: true, embedUrl: "", openUrl: value };
  };

  async function loadSettings() {
    const { data, error } = await client.from("site_settings").select("setting_key,setting_value");
    if (error || !data) return {};
    return data.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
  }

  async function loadSections() {
    const { data, error } = await client
      .from("site_sections")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return;
    const sectionMap = {
      hero: { eyebrow: ".hero .eyebrow", title: ".brand-title", description: ".hero p" },
      hero_message: { title: ".brand-message" },
      about: { eyebrow: "#about .eyebrow", title: "#about h2", description: "#about .copy p" },
      quote: { description: ".quote-section p" },
      spaces: { eyebrow: "#spaces .eyebrow", title: "#spaces h2", description: "#spaces .lead" },
      sunset: { eyebrow: "#sunset .eyebrow", title: "#sunset h2", description: "#sunset p" },
      gallery: { eyebrow: "#gallery .eyebrow", title: "#gallery h2", description: "#gallery .lead" },
      events: { eyebrow: "#events .eyebrow", title: "#events h2", description: "#events .personal-lead" },
      b2b: { eyebrow: "#b2b .eyebrow", title: "#b2b h2", description: "#b2b .lead" },
      menu: { eyebrow: "#menu .eyebrow", title: "#menu h2", description: "#menu .lead" },
      booking: { eyebrow: "#booking .eyebrow", title: "#booking h2", description: "#booking .booking p" },
      contact: { eyebrow: "#contact .eyebrow", title: "#contact h2" },
      closing: { eyebrow: ".closing-cta .eyebrow", title: ".closing-cta h2", description: ".closing-cta p" },
      footer: { title: ".footer-brand strong", description: ".footer-brand p" }
    };
    data.forEach((row) => {
      const target = sectionMap[row.section_key];
      if (!target) return;
      text(target.eyebrow, row.eyebrow);
      text(target.title, row.title);
      text(target.description, row.description);
      if (row.image_url) {
        if (row.section_key === "closing") {
          document.querySelector(".closing-cta")?.style.setProperty("--closing-bg", `url("${row.image_url}")`);
        }
        const section = document.getElementById(row.section_key);
        const img = section ? section.querySelector("img") : null;
        if (img) {
          img.src = row.image_url;
          if (row.image_alt) img.alt = row.image_alt;
        }
      }
      const extra = row.content_json || {};
      if (row.section_key === "strip" && Array.isArray(extra.items)) renderCmsList(".strip-grid > div", extra.items);
      if (row.section_key === "b2b") {
        if (Array.isArray(extra.event_items)) renderCmsList("#b2b .b2b-list .b2b-item", extra.event_items);
        if (Array.isArray(extra.format_items)) renderCmsList("#b2b .format-strip > div", extra.format_items);
      }
    });
  }

  async function loadMenu() {
    const { data, error } = await client
      .from("menu_items")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .limit(6);
    const grid = document.querySelector(".menu-feature-grid");
    if (error || !data || !data.length || !grid) return;
    grid.innerHTML = data.map((item) => `
      <article class="menu-card">
        <img src="${esc(item.image_url || "./assets/food-01.jpg")}" alt="${esc(item.image_alt || item.name || "Món tại Bến Chill Garden")}" width="1200" height="1600" loading="lazy">
        <div><h3>${esc(item.name || "")}</h3><p>${esc(item.description || "")}</p><strong>${esc(item.price || "")}</strong></div>
      </article>
    `).join("");
  }

  async function loadGallery() {
    const { data, error } = await client
      .from("gallery_items")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    if (error || !data || !data.length) return;
    const groups = data.reduce((acc, item) => {
      const key = item.category || "space";
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
    Object.entries(groups).forEach(([key, items]) => {
      const panel = document.getElementById(`tab-${key}`);
      const gallery = panel ? panel.querySelector(".gallery") : null;
      if (!gallery) return;
      gallery.innerHTML = items.map((item, index) => `
        <img class="gallery-frame-${(index % 6) + 1}" src="${esc(item.image_url)}" alt="${esc(item.image_alt || item.caption || "Bến Chill Garden")}" width="1600" height="1200" loading="lazy">
      `).join("");
    });
  }

  function ensureVideoModal() {
    let modal = document.getElementById("videoModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "videoModal";
    modal.className = "lightbox video-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Xem video");
    modal.innerHTML = `<button class="lightbox-close" type="button" aria-label="Đóng">×</button><div class="video-modal-frame"></div><div class="lightbox-caption"></div>`;
    document.body.appendChild(modal);
    modal.querySelector(".lightbox-close").addEventListener("click", closeVideoModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeVideoModal(); });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("open")) closeVideoModal();
    });
    return modal;
  }

  function closeVideoModal() {
    const modal = document.getElementById("videoModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modal.querySelector(".video-modal-frame").innerHTML = "";
    modal.querySelector(".lightbox-caption").textContent = "";
    document.body.style.overflow = "";
  }

  function openVideo(item) {
    const normalized = normalizeVideo(item.video_type, item.video_url, item.embed_url);
    if (!normalized.embedUrl && normalized.openUrl) {
      window.open(normalized.openUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const modal = ensureVideoModal();
    const frame = modal.querySelector(".video-modal-frame");
    if (item.video_type === "mp4") {
      frame.innerHTML = `<video controls playsinline preload="metadata" ${item.thumbnail_url ? `poster="${esc(item.thumbnail_url)}"` : ""} ${item.autoplay && item.muted ? "autoplay" : ""} ${item.muted ? "muted" : ""}><source src="${esc(normalized.embedUrl || item.video_url)}" type="video/mp4"></video>`;
    } else if (normalized.embedUrl) {
      const src = `${normalized.embedUrl}${normalized.embedUrl.includes("?") ? "&" : "?"}autoplay=1`;
      frame.innerHTML = `<iframe src="${esc(src)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="${esc(item.title || "Video Bến Chill Garden")}"></iframe>`;
    } else {
      frame.innerHTML = `<a class="btn primary" href="${esc(normalized.openUrl || item.video_url)}" target="_blank" rel="noopener noreferrer">Mở video</a>`;
    }
    modal.querySelector(".lightbox-caption").textContent = item.description || item.title || "";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  async function loadVideos() {
    const panel = document.getElementById("tab-video");
    const grid = panel ? panel.querySelector(".video-grid") : null;
    if (!grid) return;
    const { data, error } = await client
      .from("video_items")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    if (error || !data || !data.length) return;
    grid.innerHTML = data.map((item) => {
      const normalized = normalizeVideo(item.video_type, item.video_url, item.embed_url);
      const poster = item.thumbnail_url || normalized.thumbnail || "./assets/hero-riverside.jpg";
      return `<article class="video-card cms-video-card" data-video-id="${esc(item.id)}"><img src="${esc(poster)}" alt="${esc(item.title || "Video Bến Chill Garden")}" width="1600" height="900" loading="lazy"><button class="play" type="button" aria-label="Mở video ${esc(item.title || "")}"><span>PLAY</span></button><p>${esc(item.title || "Video Bến Chill Garden")}</p></article>`;
    }).join("");
    grid.querySelectorAll(".cms-video-card").forEach((card) => {
      const item = data.find((row) => row.id === card.dataset.videoId);
      card.addEventListener("click", (event) => {
        event.preventDefault();
        openVideo(item);
      });
    });
  }

  async function boot() {
    try {
      const settings = await loadSettings();
      text(".brand strong", settings.brand_name);
      text(".footer-brand strong", settings.brand_name);
      text(".brand small", settings.short_tagline);
      text(".footer-brand p", settings.tagline);
      text("title", settings.seo_title);
      if (settings.meta_description) attr("meta[name='description']", "content", settings.meta_description);
      if (settings.maps_url) setLink("a[href*='google.com/maps']", settings.maps_url);
      if (settings.phone) {
        setLink("a[href^='tel:']", phoneHref(settings.phone));
        document.querySelectorAll("a[href^='tel:']").forEach((el) => {
          if (/^\d|\+/.test(el.textContent.trim())) el.textContent = settings.phone;
        });
      }
      if (settings.email) setLink("a[href^='mailto:']", mailHref(settings.email));
      const socials = document.querySelector(".social-links");
      if (socials) {
        const links = [
          ["Facebook", settings.facebook_url],
          ["TikTok", settings.tiktok_url],
          ["Instagram", settings.instagram_url]
        ].filter(([, url]) => url);
        if (links.length) {
          socials.dataset.visible = "true";
          socials.removeAttribute("aria-hidden");
          socials.innerHTML = links.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`).join("");
        }
      }
      await Promise.all([loadSections(), loadMenu(), loadGallery(), loadVideos()]);
    } catch (error) {
      console.warn("CMS fallback is active.", error);
    }
  }

  boot();
})();
