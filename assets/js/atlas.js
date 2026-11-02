/* Atlas page: box view, list view, search, filters, layer focus and the player detail panel. */
(async () => {
  const { esc, safeUrl, fmtDate, hasApi } = Site;
  await Site.chrome("atlas");
  const root = document.getElementById("atlas");
  const S = { slug: null, A: null, view: "boxes", focus: null, q: "", filter: "all", sel: null, tab: "overview" };

  function slugFromUrl() {
    const p = Site.params().get("atlas") || location.hash.replace("#", "");
    return Site.ATLASES.includes(p) ? p : "stablecoins";
  }

  async function load(slug) {
    S.slug = slug; S.focus = null; S.filter = "all"; S.q = "";
    try { S.A = await Site.atlas(slug); } catch (e) { Site.fail(root, e); return; }
    Site.setUpdated(S.A.updated);
    document.title = `${S.A.cfg.title} · ${(await Site.json("content/site.json")).name}`;
    renderShell();
    const p = Site.params().get("player");
    if (p && S.A.byId[p]) openPanel(p);
  }

  const matches = p => {
    const f = S.A.cfg.filter;
    if (S.filter === "api" && !hasApi(p)) return false;
    if (S.filter !== "all" && S.filter !== "api") {
      const v = p[f.field];
      if (Array.isArray(v) ? !v.includes(S.filter) : (v || "company") !== S.filter) return false;
    }
    if (S.q) {
      const hay = [p.name, p.category, p.summary, (p.products || []).join(" "), (p.api?.offerings || []).join(" ")].join(" ").toLowerCase();
      if (!hay.includes(S.q)) return false;
    }
    return true;
  };

  function renderShell() {
    const { cfg, players } = S.A;
    root.innerHTML = `
      <section class="wrap wrap-wide page-head">
        <div class="toolbar">
          <div role="tablist" aria-label="Atlas" class="tabs">
            ${Site.ATLASES.map(s => `<button role="tab" data-atlas="${s}" aria-selected="${s === S.slug}">${Site.LABELS[s]}</button>`).join("")}
          </div>
          <span class="atlas-meta">${players.length} players · ${cfg.layers.length} layers · ${players.filter(hasApi).length} with public APIs</span>
        </div>
        <h1>${esc(cfg.title)}</h1>
        <p class="lede">${esc(cfg.intro || "")}</p>
        <div class="toolbar">
          <div class="filter-row" id="filters">
            <span class="filter-label">${esc(cfg.filter.label)}</span>
            <button class="chip" data-f="all" aria-pressed="true">All</button>
            ${cfg.filter.options.map(([v, l]) => `<button class="chip" data-f="${esc(v)}" aria-pressed="false">${esc(l)}</button>`).join("")}
            <button class="chip" data-f="api" aria-pressed="false">Has public API</button>
          </div>
          <div class="toolbar-right">
            <label class="sr-only" for="q">Search the atlas</label>
            <input class="search-input" id="q" type="search" placeholder="Search players, products, APIs" autocomplete="off">
            <div class="seg" role="group" aria-label="View"><button data-v="boxes" aria-pressed="${S.view === "boxes"}">Boxes</button><button data-v="list" aria-pressed="${S.view === "list"}">List</button></div>
          </div>
        </div>
      </section>
      <div class="wrap wrap-wide" id="body"></div>`;
    root.querySelectorAll("[data-atlas]").forEach(b => b.onclick = () => { history.replaceState(null, "", `atlas.html#${b.dataset.atlas}`); Site.markNav(); load(b.dataset.atlas); });
    root.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { S.filter = b.dataset.f; root.querySelectorAll("[data-f]").forEach(x => x.setAttribute("aria-pressed", x === b)); renderBody(); });
    root.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { S.view = b.dataset.v; root.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)); renderBody(); });
    const q = root.querySelector("#q");
    q.oninput = () => { S.q = q.value.trim().toLowerCase(); renderBody(); };
    q.onkeydown = e => { if (e.key === "Enter") { const f = S.A.players.find(matches); if (f) openPanel(f.id); } };
    renderBody();
  }

  function groupsFor(lid) {
    const by = {};
    S.A.players.filter(p => p.layer === lid).forEach(p => { const g = S.A.groupOf(p); (by[g] = by[g] || []).push(p); });
    return Object.entries(by).sort((a, b) => S.A.groupIdx(lid, a[0]) - S.A.groupIdx(lid, b[0]));
  }
  function tile(p, big) {
    const dim = (S.q || S.filter !== "all") && !matches(p);
    const first = String(p.summary || "").split(/(?<=\.)\s/)[0];
    return `<button class="tile${big ? " big" : ""}${dim ? " dim" : ""}${S.sel === p.id ? " sel" : ""}" data-p="${esc(p.id)}" style="--lc:${S.A.color(p.layer)}" title="${esc(p.category || "")}"><span class="nm">${esc(p.name)}</span>${hasApi(p) && !big ? `<span class="api">API</span>` : ""}${big ? `<span class="tc">${esc(p.category || "")}</span><span class="ts">${esc(first)}</span>` : ""}</button>`;
  }

  function renderBody() {
    const body = root.querySelector("#body");
    const { cfg } = S.A;
    if (S.view === "list") {
      body.innerHTML = `<div class="list-view">${cfg.layers.map(l => {
        const items = S.A.players.filter(p => p.layer === l.id && matches(p)).sort((a, b) => a.name.localeCompare(b.name));
        if (!items.length) return "";
        return `<section style="--lc:${S.A.color(l.id)}"><h2>${esc(l.name)}</h2><p class="muted" style="max-width:70ch;margin-top:4px">${esc(l.description)}</p><div class="list-cards">${items.map(p => tile(p, true)).join("")}</div></section>`;
      }).join("") || `<div class="empty"><b>No players match</b><span>Try another search or filter.</span></div>`}</div>`;
    } else if (!S.focus) {
      body.innerHTML = `<div class="boxgrid">${cfg.layers.map(l => {
        const groups = groupsFor(l.id), n = groups.reduce((s, g) => s + g[1].length, 0);
        return `<section class="lbox" style="--lc:${S.A.color(l.id)}"><button class="lbox-h" data-layer="${l.id}" aria-label="Expand ${esc(l.name)}"><b>${esc(l.name)}</b><span class="n">${n}</span><span class="ex">Expand ›</span></button>
          ${groups.map(([g, items]) => `<div class="grp"><div class="grp-h">${esc(g)}</div><div class="tiles">${items.map(p => tile(p)).join("")}</div></div>`).join("")}</section>`;
      }).join("")}</div>`;
    } else {
      const l = cfg.layers.find(x => x.id === S.focus), groups = groupsFor(l.id), n = groups.reduce((s, g) => s + g[1].length, 0);
      body.innerHTML = `<div class="other-layers"><button class="back" data-all>← All layers</button>${cfg.layers.filter(x => x.id !== l.id).map(x => `<button data-layer="${x.id}" style="--lc:${S.A.color(x.id)}">${esc(x.name)}</button>`).join("")}</div>
        <section class="lbox focus-box" style="--lc:${S.A.color(l.id)}"><button class="lbox-h" data-all aria-label="Collapse"><b style="font-size:22px">${esc(l.name)}</b><span class="n">${n} players</span><span class="ex">‹ Collapse</span></button>
          <div class="focus-desc"><p>${esc(l.description)}</p><ul>${(l.watch || []).map(w => `<li>${esc(w)}</li>`).join("")}</ul></div>
          <div class="focus-groups">${groups.map(([g, items]) => `<div class="grp"><div class="grp-h">${esc(g)} · ${items.length}</div><div class="tiles">${items.map(p => tile(p, true)).join("")}</div></div>`).join("")}</div></section>`;
    }
    body.querySelectorAll("[data-layer]").forEach(b => b.onclick = () => { S.focus = b.dataset.layer; S.view = "boxes"; renderBody(); scrollTo({ top: 0 }); });
    body.querySelectorAll("[data-all]").forEach(b => b.onclick = () => { S.focus = null; renderBody(); });
    body.querySelectorAll("[data-p]").forEach(b => b.onclick = () => openPanel(b.dataset.p));
  }

  /* ---------- detail panel ---------- */
  const panel = document.getElementById("panel"), backdrop = document.getElementById("backdrop");
  function initiativesFor(id) { return S.A.initiatives.filter(m => (m.solutions || []).includes(id)); }
  function openPanel(id) {
    const p = S.A.byId[id]; if (!p) return;
    S.sel = id;
    const L = S.A.cfg.layers.find(l => l.id === p.layer) || {};
    const nInit = initiativesFor(id).length;
    const tabs = [["overview", "Overview"], ["uses", "Use cases"], ["api", "API"], ["links", "Connections"], ["adoption", `Corporate adoption${nInit ? " · " + nInit : ""}`], ["news", "Latest"]];
    if (!tabs.some(t => t[0] === S.tab)) S.tab = "overview";
    panel.innerHTML = `<div class="panel-head" style="--lc:${S.A.color(p.layer)}">
        <div class="panel-top"><div><div class="eyebrow" style="color:var(--lc)">${esc(L.name || "")}</div><h2>${esc(p.name)}</h2></div><button class="panel-close" aria-label="Close">×</button></div>
        <div class="tag-row">${p.category ? `<span class="tag">${esc(p.category)}</span>` : ""}${p.hq ? `<span class="tag">${esc(p.hq)}</span>` : ""}</div></div>
      <div class="panel-tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-t="${k}" aria-selected="${k === S.tab}">${esc(l)}</button>`).join("")}</div>
      <div class="panel-body" id="pbody"></div>`;
    panel.hidden = false; backdrop.hidden = false; document.body.style.overflow = "hidden";
    panel.querySelector(".panel-close").onclick = closePanel;
    panel.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { S.tab = b.dataset.t; panel.querySelectorAll("[data-t]").forEach(x => x.setAttribute("aria-selected", x === b)); renderTab(p); });
    renderTab(p);
    const u = new URL(location.href); u.searchParams.set("atlas", S.slug); u.searchParams.set("player", id); u.hash = ""; history.replaceState(null, "", u);
    root.querySelectorAll(".tile.sel").forEach(t => t.classList.remove("sel"));
    root.querySelectorAll(`.tile[data-p="${CSS.escape(id)}"]`).forEach(t => t.classList.add("sel"));
  }
  function closePanel() {
    panel.hidden = true; backdrop.hidden = true; document.body.style.overflow = ""; S.sel = null;
    root.querySelectorAll(".tile.sel").forEach(t => t.classList.remove("sel"));
    const u = new URL(location.href); u.searchParams.delete("player"); history.replaceState(null, "", u);
  }
  backdrop.onclick = closePanel;
  addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) closePanel(); });

  function seenAt(uc) {
    const list = uc.seenAt || [];
    if (!list.length) return "";
    const names = [...new Set(list.map(s => s.company))];
    return `<p class="muted" style="font-size:13px;margin:8px 0 0">${uc.origin === "corporate" ? "Emerging use case. " : ""}Seen at ${names.map(esc).join(", ")}</p>`;
  }
  function renderTab(p) {
    const el = panel.querySelector("#pbody"), k = S.tab;
    let h = "";
    if (k === "overview") {
      h = `<p class="lede">${esc(p.summary)}</p>
        ${p.metrics ? `<h3>Key figure</h3><p class="mono" style="font-size:13px">${esc(p.metrics)}</p>` : ""}
        ${(p.products || []).length ? `<h3>Products</h3><div class="tag-row">${p.products.map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>` : ""}
        ${(p.sources || []).length ? `<h3>Sources</h3><div class="sources">${p.sources.filter(safeUrl).slice(0, 8).map(s => `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s.replace(/^https?:\/\/(www\.)?/, "").slice(0, 80))}</a>`).join("")}</div>` : ""}`;
    } else if (k === "uses") {
      h = (p.useCases || []).length ? p.useCases.map((u, i) => `<details class="uc"${i === 0 ? " open" : ""}><summary>${esc(u.title)}</summary><div>${esc(u.detail)}${seenAt(u)}</div></details>`).join("") : `<div class="empty">No use cases recorded yet.</div>`;
    } else if (k === "api") {
      const a = p.api || {}, offs = a.offerings || [];
      h = `${offs.length ? `<h3>API products</h3><ul class="api-list">${offs.map(o => { const i = String(o).indexOf(":"); return `<li>${i > 0 ? `<b>${esc(o.slice(0, i))}</b>${esc(o.slice(i))}` : esc(o)}</li>`; }).join("")}</ul>` : `<p class="muted">No public API documented.</p>`}
        <h3>Integration profile</h3><table class="spec"><tbody>${[["Style", a.style], ["Auth", a.auth], ["Webhooks", a.webhooks], ["Sandbox", a.sandbox], ["Versioning", a.versioning]].filter(r => r[1]).map(r => `<tr><th>${r[0]}</th><td>${esc(r[1])}</td></tr>`).join("")}
        ${safeUrl(a.docsUrl) ? `<tr><th>Docs</th><td><a href="${esc(a.docsUrl)}" target="_blank" rel="noopener">${esc(a.docsUrl.replace(/^https?:\/\//, ""))}</a></td></tr>` : ""}</tbody></table>`;
    } else if (k === "links") {
      const out = p.connections || [];
      const inc = S.A.players.filter(o => o.id !== p.id && (o.connections || []).some(c => c.id === p.id) && !out.some(c => c.id === o.id));
      const row = (id, rel) => { const t = S.A.byId[id]; return `<button class="conn" data-go="${esc(id)}" ${t ? "" : "disabled"} style="--lc:${t ? S.A.color(t.layer) : "var(--color-line-strong)"}"><span class="sw"></span><span>${esc(t ? t.name : id)}</span><span class="rel">${esc(rel || "")}</span></button>`; };
      h = out.length || inc.length ? `${out.length ? `<h3>${esc(p.name)} →</h3>${out.map(c => row(c.id, c.relation)).join("")}` : ""}${inc.length ? `<h3>→ ${esc(p.name)}</h3>${inc.map(o => row(o.id, (o.connections.find(c => c.id === p.id) || {}).relation)).join("")}` : ""}` : `<div class="empty">No connections recorded yet.</div>`;
    } else if (k === "adoption") {
      const ms = initiativesFor(p.id);
      h = ms.length ? `<p class="muted" style="margin-bottom:12px">Corporate initiatives that use ${esc(p.name)}, newest first.</p>${ms.map(m => `<div class="card" style="padding:12px 14px;margin-bottom:8px;display:grid;gap:4px"><span class="mono muted" style="font-size:12px">${esc(fmtDate(m.date))} · <span class="status ${esc(m.status)}">${esc(m.status)}</span></span><b>${esc(m.company)}</b><span>${esc(m.headline)}</span></div>`).join("")}<p><a class="link-more" href="adoption.html?atlas=${S.slug}">Open Corporate Adoption →</a></p>` : `<div class="empty">No corporate initiatives linked yet.</div>`;
    } else if (k === "news") {
      h = (p.latest || []).length ? `<ul class="news">${[...p.latest].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map(n => `<li><time>${esc(n.date)}</time><span>${safeUrl(n.url) ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.headline)}</a>` : esc(n.headline)}</span></li>`).join("")}</ul>` : `<div class="empty">Nothing recorded yet.</div>`;
    }
    el.innerHTML = h;
    el.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { S.tab = "overview"; openPanel(b.dataset.go); });
  }

  addEventListener("hashchange", () => { const s = slugFromUrl(); if (s !== S.slug) load(s); });
  load(slugFromUrl());
})();
