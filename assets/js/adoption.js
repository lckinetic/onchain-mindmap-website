/* Corporate Adoption: timeline of big-company initiatives, by date or by company, with search and filters. */
(async () => {
  const { esc, safeUrl, fmtDate, hostOf } = Site;
  await Site.chrome("adoption");
  const root = document.getElementById("adoption");
  const LABEL = { live: "Live", pilot: "Pilot", announced: "Announced", paused: "Paused" };
  const S = { slug: null, A: null, all: {}, group: "date", sector: "all", status: "all", q: "" };

  const startSlug = () => { const p = Site.params().get("atlas") || location.hash.replace("#", ""); return Site.ATLASES.includes(p) ? p : "stablecoins"; };
  try { for (const s of Site.ATLASES) S.all[s] = await Site.atlas(s); } catch (e) { Site.fail(root, e); return; }
  Site.setUpdated(S.all.stablecoins.updated);
  const qp = Site.params().get("q"); if (qp) { S.q = qp.toLowerCase(); S.group = "company"; }

  const hay = (m, A) => [m.company, m.blurb, m.headline, m.detail, m.sector, m.region, (m.partners || []).join(" "), (m.protocols || []).join(" "), (m.solutions || []).map(id => A.byId[id]?.name || id).join(" ")].join(" ").toLowerCase();
  const passes = (m, chips = true) => (!chips || ((S.sector === "all" || m.sector === S.sector) && (S.status === "all" || m.status === S.status))) && (!S.q || hay(m, S.A).includes(S.q));

  function card(m, noCompany) {
    const A = S.A;
    const sol = (m.solutions || []).filter(id => A.byId[id]).map(id => `<a href="atlas.html?atlas=${A.slug}&player=${encodeURIComponent(id)}" style="--lc:${A.color(A.byId[id].layer)}">${esc(A.byId[id].name)}</a>`).join("");
    const extra = [...(m.partners || []).map(x => `<span>${esc(x)}</span>`), ...(m.protocols || []).map(x => `<span class="mono">${esc(x)}</span>`)].join("");
    const src = (m.sources || []).filter(safeUrl).slice(0, 3).map(s => `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(hostOf(s))}</a>`).join(" · ");
    return `<article class="card init">
      <div class="init-when"><time>${esc(fmtDate(m.date))}</time><span class="status ${esc(m.status)}">${esc(LABEL[m.status] || m.status)}</span></div>
      <div class="init-body">
        ${noCompany ? "" : `<div class="init-co"><button data-co="${esc(m.company)}">${esc(m.company)}</button><span>${esc(m.blurb || "")}</span></div>`}
        <h3>${esc(m.headline)}</h3>
        ${m.detail ? `<p>${esc(m.detail)}</p>` : ""}
        ${sol || extra ? `<div class="init-chips">${sol}${extra}</div>` : ""}
        ${src ? `<div class="init-src">Sources: ${src}</div>` : ""}
      </div></article>`;
  }

  function render() {
    const A = S.A = S.all[S.slug];
    const base = A.initiatives.filter(m => passes(m, false));
    const list = A.initiatives.filter(m => passes(m)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const sectors = [...new Set(A.initiatives.map(m => m.sector).filter(Boolean))].sort();
    const cos = new Set(list.map(m => m.companyId || m.company)).size;
    const chip = (kind, v, label, n) => `<button class="chip" data-${kind}="${esc(v)}" aria-pressed="${(kind === "sec" ? S.sector : S.status) === v}">${esc(label)}${n != null ? `<span class="n">${n}</span>` : ""}</button>`;
    let body;
    if (!list.length) body = `<div class="empty"><b>No initiatives match</b><span>Try another company name or clear the filters.</span></div>`;
    else if (S.group === "date") {
      const by = {}; list.forEach(m => { const y = String(m.date || "").slice(0, 4) || "Undated"; (by[y] = by[y] || []).push(m); });
      body = Object.keys(by).sort().reverse().map(y => `<section class="year"><h2>${esc(y)} <span>${by[y].length} initiatives</span></h2><div class="timeline">${by[y].map(m => card(m)).join("")}</div></section>`).join("");
    } else {
      const by = {}; list.forEach(m => { const k = m.companyId || m.company; (by[k] = by[k] || []).push(m); });
      const order = Object.keys(by).sort((a, b) => by[b].length - by[a].length || by[a][0].company.localeCompare(by[b][0].company));
      body = `<div class="co-grid">${order.map(k => { const ms = by[k], m0 = ms[0]; const sol = [...new Set(ms.flatMap(m => m.solutions || []))].filter(id => A.byId[id]);
        return `<section class="card co-card"><header><div><b>${esc(m0.company)}</b><span>${esc(m0.blurb || "")}</span></div><span class="mono muted" style="white-space:nowrap;font-size:12px">${ms.length} ${ms.length === 1 ? "initiative" : "initiatives"}</span></header>
          <div class="co-meta">${esc([m0.sector, m0.region].filter(Boolean).join(" · "))}</div>
          ${sol.length ? `<div class="init-chips">${sol.map(id => `<a href="atlas.html?atlas=${A.slug}&player=${encodeURIComponent(id)}" style="--lc:${A.color(A.byId[id].layer)}">${esc(A.byId[id].name)}</a>`).join("")}</div>` : ""}
          <ol class="co-tl">${ms.map(m => `<li><time>${esc(fmtDate(m.date))}</time><div>${esc(m.headline)} <span class="status ${esc(m.status)}">${esc(LABEL[m.status] || m.status)}</span></div></li>`).join("")}</ol></section>`; }).join("")}</div>`;
    }
    root.innerHTML = `
      <section class="wrap wrap-narrow page-head">
        <div class="eyebrow">Corporate Adoption</div>
        <h1>${esc(A.cfg.initiativesHeading)}</h1>
        <p class="lede">What the Fortune Global 500 and the world's largest banks, asset managers and payment firms have launched, piloted or announced since January 2024, and which providers they built on.</p>
        <div class="toolbar" style="margin-top:8px">
          <div role="tablist" aria-label="Atlas" class="tabs">${Site.ATLASES.map(s => `<button role="tab" data-atlas="${s}" aria-selected="${s === S.slug}">${Site.LABELS[s]} · ${S.all[s].initiatives.length}</button>`).join("")}</div>
          <div class="toolbar-right">
            <label class="sr-only" for="q">Search companies</label>
            <input class="search-input" id="q" type="search" placeholder="Search a company, e.g. JPMorgan" value="${esc(S.q)}" autocomplete="off">
            <div class="seg" role="group" aria-label="Group by"><button data-g="date" aria-pressed="${S.group === "date"}">By date</button><button data-g="company" aria-pressed="${S.group === "company"}">By company</button></div>
          </div>
        </div>
        <p class="muted" style="font-size:14px">${list.length} initiatives by ${cos} companies${S.q ? ` matching “${esc(S.q)}”` : ""}</p>
        <div class="filter-row"><span class="filter-label">Sector</span>${chip("sec", "all", "All", base.length)}${sectors.map(s => chip("sec", s, s, base.filter(m => m.sector === s).length)).join("")}</div>
        <div class="filter-row"><span class="filter-label">Status</span>${chip("st", "all", "All")}${["live", "pilot", "announced", "paused"].filter(s => base.some(m => m.status === s)).map(s => chip("st", s, LABEL[s], base.filter(m => m.status === s).length)).join("")}</div>
      </section>
      <div class="wrap wrap-narrow" style="padding-bottom:48px">${body}</div>`;
    root.querySelectorAll("[data-atlas]").forEach(b => b.onclick = () => { S.slug = b.dataset.atlas; S.sector = "all"; S.status = "all"; history.replaceState(null, "", `adoption.html#${S.slug}`); render(); });
    root.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { S.group = b.dataset.g; render(); });
    root.querySelectorAll("[data-sec]").forEach(b => b.onclick = () => { S.sector = b.dataset.sec; render(); });
    root.querySelectorAll("[data-st]").forEach(b => b.onclick = () => { S.status = b.dataset.st; render(); });
    root.querySelectorAll("[data-co]").forEach(b => b.onclick = () => { S.q = b.dataset.co.toLowerCase(); S.group = "company"; render(); });
    const q = root.querySelector("#q");
    let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { S.q = q.value.trim().toLowerCase(); render(); const n = root.querySelector("#q"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200); };
  }
  S.slug = startSlug();
  render();
})();
