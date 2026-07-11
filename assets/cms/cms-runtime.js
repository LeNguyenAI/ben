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
  const esc = (value = "") => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const setLink = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach((el) => el.setAttribute("href", value));
  };
  const phoneHref = (phone) => phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";
  const mailHref = (email) => email ? `mailto:${email}` : "";

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
        const section = document.getElementById(row.section_key);
        const img = section ? section.querySelector("img") : null;
        if (img) {
          img.src = row.image_url;
          if (row.image_alt) img.alt = row.image_alt;
        }
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
      gallery.innerHTML = items.slice(0, 6).map((item, index) => `
        <img class="${index === 0 ? "tall" : index === 3 ? "wide" : ""}" src="${esc(item.image_url)}" alt="${esc(item.image_alt || item.caption || "Bến Chill Garden")}" width="1600" height="1200" loading="lazy">
      `).join("");
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
      await Promise.all([loadSections(), loadMenu(), loadGallery()]);
    } catch (error) {
      console.warn("CMS fallback is active.", error);
    }
  }

  boot();
})();
