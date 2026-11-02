/* Shared helpers: loads site settings, draws the header and footer, and
   provides small utilities used by every page. */
const Site = (() => {
  const cache = {};
  async function json(path) {
    if (!cache[path]) {
      cache[path] = fetch(path, { cache: "no-cache" }).then(r => {
        if (!r.ok) throw new Error(`Couldn't load ${path} (${r.status})`);
        return r.json();
      });
    }
    return cache[path];
  }
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = u => /^https?:\/\//i.test(u || "") ? u : "";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(d) {
    if (!d) return "";
    const [y, m, day] = String(d).split("-");
    const mon = MONTHS[(+m || 1) - 1];
    return day ? `${+day} ${mon} ${y}` : m ? `${mon} ${y}` : y;
  }
  const params = () => new URLSearchParams(location.search);
  const hostOf = u => u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];

  /* Atlas helpers shared by the atlas, adoption and home pages */
  const ATLASES = ["stablecoins", "tokenization", "ai"];
  const LABELS = { stablecoins: "Stablecoins", tokenization: "Tokenization", ai: "AI in finance" };
  async function atlas(slug) {
    const [cfg, players, inits] = await Promise.all([
      json(`content/${slug}/atlas.json`),
      json(`content/${slug}/players.json`),
      json(`content/${slug}/initiatives.json`)
    ]);
    const layerIndex = Object.fromEntries(cfg.layers.map((l, i) => [l.id, i]));
    const rules = Object.fromEntries(Object.entries(cfg.groups).map(([k, g]) => [k, g.rules.map(r => [new RegExp(r.match, "i"), r.group])]));
    const groupOf = p => { for (const [re, g] of rules[p.layer] || []) if (re.test(p.category || "")) return g; return "Other"; };
    const groupIdx = (lid, g) => { const i = (cfg.groups[lid]?.order || []).indexOf(g); return i < 0 ? 99 : i; };
    const color = lid => `var(--layer-${(layerIndex[lid] ?? 5) + 1})`;
    const byId = Object.fromEntries(players.players.map(p => [p.id, p]));
    return { slug, cfg, players: players.players, initiatives: inits.initiatives, updated: players.updated, byId, groupOf, groupIdx, color, layerIndex };
  }
  const hasApi = p => !!(p.api && Array.isArray(p.api.offerings) && p.api.offerings.length && /^https?:/.test(p.api.docsUrl || ""));

  async function chrome(active) {
    const site = await json("content/site.json").catch(() => ({ name: "Onchain Mindmap", nav: [] }));
    document.title = document.title ? `${document.title} · ${site.name}` : site.name;
    // Insights stays hidden (nav link and home section) until at least one article is published.
    const nav = (await hasInsights()) ? (site.nav || []) : (site.nav || []).filter(n => !/^insights\.html/.test(n.href));
    const header = document.querySelector("[data-site-header]");
    if (header) {
      header.className = "site-header";
      header.innerHTML = `<div class="wrap ${active === "atlas" ? "wrap-wide" : ""}">
        <a class="brand" href="index.html"><svg viewBox="0 0 26 26" aria-hidden="true"><circle class="brand-ring" cx="13" cy="13" r="11"></circle><circle class="brand-dot" cx="13" cy="13" r="4"></circle><path class="brand-ring" d="M13 2v7M13 17v7M2 13h7M17 13h7"></path></svg>${esc(site.name)}</a>
        <nav class="site-nav" aria-label="Main">${nav.map(n => `<a href="${esc(n.href)}" data-nav="${esc(n.href)}">${esc(n.label)}</a>`).join("")}</nav>
        <span class="header-meta" data-updated></span></div>`;
      markNav();
      addEventListener("hashchange", markNav);
    }
    const footer = document.querySelector("[data-site-footer]");
    if (footer) {
      const c = site.contact || {};
      const links = [safeUrl(c.linkedin) && `<a href="${esc(c.linkedin)}" rel="noopener">LinkedIn</a>`, c.email && `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`].filter(Boolean).join("");
      footer.className = "site-footer";
      footer.innerHTML = `<div class="wrap"><b>${esc(site.name)}</b><span class="footer-author">${site.authorPhotoSmall ? `<img src="${esc(site.authorPhotoSmall)}" alt="" width="28" height="28">` : ""}Research, curated and maintained daily by ${esc(site.author || "")}</span><span>${esc(site.footerNote || "")}</span>${links ? `<span class="footer-contact">${links}</span>` : ""}</div>`;
    }
    return site;
  }
  async function hasInsights() {
    const data = await json("content/insights/index.json").catch(() => ({}));
    return (data.articles || []).some(a => a.status === "published");
  }
  function markNav() {
    const here = location.pathname.split("/").pop() || "index.html";
    const hash = location.hash.replace("#", "") || params().get("atlas") || "";
    document.querySelectorAll("[data-nav]").forEach(a => {
      const [file, h] = a.dataset.nav.split("#");
      const on = file === here && (!h || h === hash || (!hash && h === "stablecoins"));
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }
  function setUpdated(d) { const el = document.querySelector("[data-updated]"); if (el && d) el.textContent = `Updated ${fmtDate(d)}`; }
  function fail(el, err) { el.innerHTML = `<div class="empty"><b>Content didn't load</b><span>${esc(err.message)}. If you opened the file directly, run a local server (see README).</span></div>`; }

  return { json, esc, hasInsights, safeUrl, fmtDate, params, hostOf, atlas, ATLASES, LABELS, hasApi, chrome, setUpdated, markNav, fail };
})();
