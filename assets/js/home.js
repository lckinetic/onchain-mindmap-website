/* Home page: hero, stack illustration, headline numbers, atlas cards, latest corporate initiatives, about. */
(async () => {
  const { esc, fmtDate, hasApi } = Site;
  const site = await Site.chrome("home");
  const root = document.getElementById("home");
  let S, T, AI;
  try {
    [S, T, AI] = await Promise.all([Site.atlas("stablecoins"), Site.atlas("tokenization"), Site.atlas("ai")]);
  } catch (e) { Site.fail(root, e); return; }
  Site.setUpdated(S.updated);
  const h = site.home || {};
  const LABEL = { live: "Live", pilot: "Pilot", announced: "Announced", paused: "Paused" };

  // Stack illustration: stablecoin layers top-down (user-facing first), regulation as a dashed band.
  const layers = S.cfg.layers.filter(l => l.id !== "regulation").slice().reverse();
  const reg = S.cfg.layers.find(l => l.id === "regulation");
  const adoption = id => S.initiatives.filter(m => (m.solutions || []).includes(id)).length;
  const topNames = lid => S.players.filter(p => p.layer === lid).sort((a, b) => adoption(b.id) - adoption(a.id) || a.name.localeCompare(b.name)).slice(0, 3).map(p => p.name.replace(/\s*\(.*\)/, "")).join(" · ");
  const latest = [...S.initiatives.map(m => ({ ...m, _a: S })), ...T.initiatives.map(m => ({ ...m, _a: T })), ...AI.initiatives.map(m => ({ ...m, _a: AI }))].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 4);
  const ALL = [S, T, AI];
  const totalPlayers = ALL.reduce((n, A) => n + A.players.length, 0);
  const totalInits = ALL.reduce((n, A) => n + A.initiatives.length, 0);
  const totalApi = ALL.reduce((n, A) => n + A.players.filter(hasApi).length, 0);

  // Atlas cards: "N players · N layers (or asset classes) · N initiatives", a short blurb, chips and a named CTA.
  const atlasCard = (A, name, chips, count, cta) => `<a class="card atlas-card" href="atlas.html#${A.slug}">
      <div class="mono muted" style="font-size:12px">${A.players.length} players · ${count} · ${A.initiatives.length} initiatives</div>
      <h3>${esc(name)}</h3><p>${esc(A.cfg.cardIntro || A.cfg.intro || "")}</p>
      <div class="tag-row">${chips.map(c => `<span class="tag">${esc(c)}</span>`).join("")}</div>
      <span class="link-more">${esc(cta)} →</span></a>`;

  root.innerHTML = `
    <section class="wrap hero">
      <div class="hero-copy">
        <div class="eyebrow">${esc(h.eyebrow || site.tagline || "")}</div>
        <h1>${esc(h.headline || "")}</h1>
        <p class="hero-lede">${esc(h.lede || "")}</p>
        <div class="hero-actions"><a class="btn btn-dark" href="atlas.html#stablecoins">Explore stablecoins</a><a class="btn btn-light" href="atlas.html#tokenization">Explore tokenization</a><a class="btn btn-light" href="atlas.html#ai">Explore AI in finance</a></div>
      </div>
      <figure class="card stack" aria-label="The layers of the stablecoin stack">
        <div class="stack-label">THE STABLECOIN STACK · ${S.players.length} players</div>
        ${layers.map(l => `<a class="stack-row" href="atlas.html#stablecoins" style="--lc:${S.color(l.id)}"><b>${esc(l.name)}</b><span>${esc(topNames(l.id))}</span></a>`).join("")}
        ${reg ? `<div class="stack-reg"><b>${esc(reg.name)}</b>${esc(S.players.filter(p => p.layer === "regulation").map(p => p.name.replace(/\s*\(.*\)/, "")).slice(0, 4).join(" · "))}</div>` : ""}
      </figure>
    </section>
    <section class="stats-band" aria-label="Atlas at a glance">
      <div class="wrap stats">
        <div class="stat"><b>${totalPlayers}</b><span>players mapped across three atlases</span></div>
        <div class="stat"><b>${totalInits}</b><span>corporate initiatives since Jan 2024</span></div>
        <div class="stat"><b>${totalApi}</b><span>with public API documentation</span></div>
        <div class="stat"><b>${esc(fmtDate(S.updated))}</b><span>last updated · researched daily</span></div>
      </div>
    </section>
    <section class="wrap section section-first">
      <div class="section-head"><h2>Three atlases</h2></div>
      <div class="atlas-cards">
        ${atlasCard(S, "Stablecoins & payments", S.cfg.layers.map(l => l.short), `${S.cfg.layers.length} layers`, "Open the stablecoin atlas")}
        ${atlasCard(T, "Tokenized real-world assets", T.cfg.filter.options.map(o => o[1]), `${T.cfg.filter.options.length} asset classes`, "Open the tokenization atlas")}
        ${atlasCard(AI, "AI in finance, payments & crypto", AI.cfg.layers.map(l => l.short), `${AI.cfg.layers.length} layers`, "Open the AI atlas")}
      </div>
    </section>
    <section class="wrap section section-last">
      <div class="section-head"><h2>Institution Adoption</h2><a class="link-more" href="adoption.html">See all ${totalInits} initiatives →</a></div>
      <p class="section-intro">${esc(h.adoptionIntro || "")}</p>
      <div class="card feed">${latest.map(m => `<a class="feed-row" href="adoption.html?atlas=${m._a.slug}&q=${encodeURIComponent(m.company)}"><time>${esc(fmtDate(m.date))}</time><span><b>${esc(m.company)}</b> · ${esc(m.headline)}</span><span class="status ${esc(m.status)}">${esc(LABEL[m.status] || m.status)}</span></a>`).join("")}</div>
    </section>
    ${site.about ? `<section class="wrap section about-section" aria-labelledby="about-h">
      <div class="card about">
        ${site.authorPhoto ? `<img class="about-photo" src="${esc(site.authorPhoto)}" alt="Portrait of ${esc(site.author || "")}" width="160" height="160">` : ""}
        <div class="about-copy">
          <div class="eyebrow">${esc(site.about.heading || "About")}</div>
          <h2 id="about-h">${esc(site.author || "")}</h2>
          <p class="about-role">${esc(site.about.role || "")}</p>
          ${site.about.bio ? `<p>${esc(site.about.bio)}</p>` : ""}
          ${(site.contact?.linkedin || site.contact?.email) ? `<div class="hero-actions">${Site.safeUrl(site.contact.linkedin) ? `<a class="btn btn-light" href="${esc(site.contact.linkedin)}" rel="noopener">LinkedIn</a>` : ""}${site.contact.email ? `<a class="btn btn-light" href="mailto:${esc(site.contact.email)}">Email</a>` : ""}</div>` : ""}
        </div>
      </div>
    </section>` : ""}`;
})();
