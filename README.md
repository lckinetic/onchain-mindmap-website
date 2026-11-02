# Onchain Mindmap: website package

A static website with three content areas: the **Stablecoins** and **Tokenization** atlases, **Institution Adoption**, and **Insights**. There is no build step and no server code. Any static host can serve it.

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

**Insights is hidden until your first article is published.** While no article has `"status": "published"`, the site hides the Insights nav link, and anyone who opens `insights.html` is sent to the home page. This is handled in `assets/js/common.js` and `assets/js/insights.js`. The home page has no Insights section.

To bring it back:
1. Write your article in `content/insights/articles/<slug>.md`.
2. In `content/insights/index.json`, set that article's `"status"` to `"published"` (and fill in its `date` and `readMinutes`).
3. Commit and push (see "Publish with GitHub Pages" below).

The nav link and Insights page reappear on their own. Any other articles still marked `"coming-soon"` show there as "Coming soon" cards, so replace or remove the placeholder entries if you don't want them shown.

## Change the design

- **Quick changes:** edit `assets/css/tokens.css`. Every colour, font, radius and width is a named variable with a comment, covering both light and dark mode.
- **Bigger redesigns:** use the **Onchain Mindmap website** canvas in Claude Design. It has artboards for Home, Atlas, Institution Adoption and Insights. Make your changes there, then ask Claude to "apply the canvas design to the website package"; it will update `tokens.css` and `site.css` to match.

## Preview on your computer

Pages load their content with `fetch`, so open them through a small local server rather than double-clicking:

```
cd onchain-mindmap-site
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Publish with GitHub Pages

The site is hosted on GitHub Pages from the repository `lckinetic/onchain-mindmap-website`.

**First-time setup**

1. Commit and push your changes to the `main` branch:
   ```
   git add -A
   git commit -m "Describe your change"
   git push origin main
   ```
2. On GitHub, open the repository → **Settings → General** and make it **public**. Pages on a free GitHub account only works with public repositories.
3. Go to **Settings → Pages**. Under **Source**, choose **Deploy from a branch**, pick `main` and `/ (root)`, and save.
4. After a minute or two the site is live at `https://lckinetic.github.io/onchain-mindmap-website/`.
5. Optional custom domain: enter it under **Settings → Pages → Custom domain**, add the DNS records GitHub shows at your domain registrar, then tick **Enforce HTTPS**.

**Updating the site later**

Commit and push to `main` (step 1). GitHub Pages republishes the site automatically within a few minutes.

**What is not published**

`.gitignore` keeps macOS `.DS_Store` files and the `claude design/` mockups folder out of the repository, so they never go live. The empty `.nojekyll` file tells GitHub Pages to publish the files exactly as they are.

## Other hosts

Any of these also works. All are free for a site this size.

- **Netlify:** drag the whole folder onto app.netlify.com/drop. Then go to Domain settings → Add custom domain.
- **Vercel:** create a new project, import the folder (or a GitHub repo containing it) and choose "Other" as the framework. Add your domain under Settings → Domains.
Each host shows the DNS records to add at your domain registrar. HTTPS is automatic.

## Notes

- The private atlas features stay private: the inbox, daily research, "Add a find", notes and the Solution finder. The public site is read-only.
- Fonts load from Google Fonts. Everything else is bundled.
- Data is a snapshot from the date shown in the header ("Updated …").
