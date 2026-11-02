# Onchain Mindmap: website package

A static website with three content areas: the **Stablecoins** and **Tokenization** atlases, **Corporate Adoption**, and **Insights**. There is no build step and no server code. Any static host can serve it.

Content and design live in separate places, so you can change one without touching the other.

```
index.html, atlas.html, adoption.html, insights.html, article.html   ← pages (rarely edited)
assets/css/tokens.css      ← DESIGN: colours, fonts, sizes. Change the look here first.
assets/css/site.css        ← DESIGN: layout and components
assets/js/                 ← behaviour (search, filters, panels). No need to edit.
assets/vendor/             ← bundled article renderer
content/site.json          ← CONTENT: site name, your name, contact links, home-page copy
content/stablecoins/       ← CONTENT: atlas.json (layers & explainers), players.json, initiatives.json
content/tokenization/      ← CONTENT: same three files for the tokenization atlas
content/ai/                ← CONTENT: same three files for the AI in finance atlas
content/insights/          ← CONTENT: index.json (article list) + articles/<slug>.md
scripts/export_content.py  ← used by Claude to refresh players and initiatives
```

## Update the content

**Players and corporate initiatives.** These come from your private atlas, the one with the inbox and daily research. When you've approved new findings, ask Claude in your MoonPay project:

> Export the latest atlas content into the website package.

Claude pulls the live data, regenerates `content/stablecoins/*.json`, `content/tokenization/*.json` and `content/ai/*.json`, and gives you an updated package. Your edits to `atlas.json`, `site.json` and insights are never overwritten.

**Site copy.** Edit `content/site.json`: the site name, `author`, contact links and the home-page headline and intros. Replace the `[Your name]` placeholder before launch.

**Atlas explainers.** Edit `content/<atlas>/atlas.json` to change layer names, descriptions, "what to watch" lists, sub-group rules and filter labels.

**Insights.** Each article has two parts:
1. a line in `content/insights/index.json` with its title, summary, topic, date, read time, `featured` and `status`.
2. a text file `content/insights/articles/<slug>.md` with the body.

Write the body with simple formatting: `## Heading`, `**bold**`, `- bullet`, `[link](url)`, `> quote`. The site turns it into a formatted page, so readers never see these symbols. An article shows as "Coming soon" until its `status` is `"published"`.

## Change the design

- **Quick changes:** edit `assets/css/tokens.css`. Every colour, font, radius and width is a named variable with a comment, covering both light and dark mode.
- **Bigger redesigns:** use the **Onchain Mindmap website** canvas in Claude Design. It has artboards for Home, Atlas, Corporate Adoption and Insights. Make your changes there, then ask Claude to "apply the canvas design to the website package"; it will update `tokens.css` and `site.css` to match.

## Preview on your computer

Pages load their content with `fetch`, so open them through a small local server rather than double-clicking:

```
cd onchain-mindmap-site
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Publish on your own domain

Any of these works. All are free for a site this size.

- **Netlify:** drag the whole folder onto app.netlify.com/drop. Then go to Domain settings → Add custom domain.
- **Vercel:** create a new project, import the folder (or a GitHub repo containing it) and choose "Other" as the framework. Add your domain under Settings → Domains.
- **GitHub Pages:** push the folder to a repository, then go to Settings → Pages and deploy from the main branch. Add your domain under Custom domain.

Each host shows the DNS records to add at your domain registrar. HTTPS is automatic.

## Notes

- The private atlas features stay private: the inbox, daily research, "Add a find", notes and the Solution finder. The public site is read-only.
- Fonts load from Google Fonts. Everything else is bundled.
- Data is a snapshot from the date shown in the header ("Updated …").
