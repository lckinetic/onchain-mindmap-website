/* Insights: article cards, the insights index page and the article reader.
   Articles are written in content/insights/articles/<slug>.md and rendered
   to formatted HTML in the browser, so readers never see markdown. */
const Insights = (() => {
  const { esc, fmtDate } = Site;
  const live = a => a.status === "published";
  function card(a) {
    const kicker = live(a) ? [a.topic, fmtDate(a.date), a.readMinutes ? `${a.readMinutes} min read` : ""].filter(Boolean).join(" · ") : `${a.topic ? a.topic + " · " : ""}Coming soon`;
    const inner = `<span class="kicker">${esc(kicker)}</span><h3>${esc(a.title)}</h3><p>${esc(a.summary || "")}</p>`;
    return live(a) ? `<a class="card insight-card" href="article.html?slug=${encodeURIComponent(a.slug)}">${inner}</a>` : `<article class="card insight-card">${inner}</article>`;
  }

  async function indexPage() {
    const site = await Site.chrome("insights");
    const root = document.getElementById("insights");
    let data; try { data = await Site.json("content/insights/index.json"); } catch (e) { Site.fail(root, e); return; }
    const arts = data.articles || [];
    if (!arts.some(live)) { location.replace("index.html"); return; } // nothing published yet: page is hidden
    const feat = arts.find(a => a.featured) || null;
    const rest = arts.filter(a => a !== feat);
    const i = site.insights || {};
    root.innerHTML = `
      <section class="wrap wrap-narrow page-head insights-head">
        <div class="eyebrow">Insights</div>
        <h1>${esc(i.heading || "Insights")}</h1>
        <p class="lede">${esc(i.intro || "")}</p>
      </section>
      ${feat ? `<section class="wrap wrap-narrow" style="padding-top:16px;padding-bottom:24px">
        ${(live(feat) ? `<a class="feature" href="article.html?slug=${encodeURIComponent(feat.slug)}">` : `<article class="feature">`)}
          <div class="feature-copy"><span class="kicker">Featured · ${esc(live(feat) ? feat.topic || "" : "Coming soon")}</span><h2>${esc(feat.title)}</h2><p>${esc(feat.summary || "")}</p></div>
          ${live(feat) ? `<span class="mono" style="font-size:13px;opacity:.8">${esc(fmtDate(feat.date))}${feat.readMinutes ? ` · ${feat.readMinutes} min read` : ""}</span></a>` : `</article>`}
      </section>` : ""}
      <section class="wrap wrap-narrow" style="padding-bottom:56px"><div class="insight-grid">${rest.map(card).join("")}</div></section>`;
  }

  async function articlePage() {
    const site = await Site.chrome("insights");
    const root = document.getElementById("article");
    const slug = Site.params().get("slug") || "";
    let data; try { data = await Site.json("content/insights/index.json"); } catch (e) { Site.fail(root, e); return; }
    const a = (data.articles || []).find(x => x.slug === slug);
    if (!a || !live(a)) {
      root.innerHTML = `<div class="article"><div class="eyebrow">Insights</div><h1>${esc(a ? a.title : "Article not found")}</h1><p class="muted">${a ? "This piece is coming soon." : "This article doesn't exist or has moved."}</p><p style="margin-top:20px"><a class="link-more" href="insights.html">← All insights</a></p></div>`;
      return;
    }
    document.title = `${a.title} · ${document.title}`;
    let html = "";
    try {
      const md = await fetch(`content/insights/articles/${encodeURIComponent(a.slug)}.md`, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); });
      html = window.marked ? window.marked.parse(md) : `<p>${esc(md)}</p>`;
      if (window.DOMPurify) html = window.DOMPurify.sanitize(html);
    } catch (e) { html = `<p class="muted">The article text couldn't be loaded.</p>`; }
    root.innerHTML = `<article class="article">
      <a class="link-more" href="insights.html">← All insights</a>
      <div class="eyebrow" style="margin-top:24px">${esc(a.topic || "Insights")}</div>
      <h1>${esc(a.title)}</h1>
      <div class="byline">${site.authorPhotoSmall ? `<img src="${esc(site.authorPhotoSmall)}" alt="" width="32" height="32">` : ""}<span>${esc(site.author || "")}</span> · ${esc(fmtDate(a.date))}${a.readMinutes ? ` · ${a.readMinutes} min read` : ""}</div>
      <div class="prose">${html}</div></article>`;
  }
  return { card, indexPage, articlePage };
})();
