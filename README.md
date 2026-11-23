# Meridian Map 3D

An interactive 3D acupuncture atlas (the app is titled "Acupuncture Atlas") that runs in the browser, on desktop and mobile.

- 361 classical points on the 14 channels, plus the 48 WHO extra points and Anmian, on male and female bodies
- Channel pathways, Qi circulation animation, extraordinary vessels, Five Phases and the Chinese clock
- 30 classical and needling point groups (Yuan, Luo, Xi-Cleft, Front-Mu, Back-Shu, Five-Shu, Influential, Window of Heaven, Ghost points, …)
- **How to find it**: step-by-step locating instructions with cun rulers and bony landmarks drawn on the body
- **Needling angle & depth**: angle, depth range, direction, cautions, a cross-section diagram and a 3D needle at the point
- Measure tab (finger cun and bone-proportional cun), search by code / pinyin / Chinese / English / symptom, and a quiz

> For study only. Locations are shown on a stylised model and are approximate; depths are average-adult textbook values. Needling should only be performed by a trained practitioner.

## Use

**Live app:** https://rsorero.github.io/meridian-map-3d/ (deployed automatically from `main` by GitHub Actions)

Or open `dist/index.html` in a modern browser. It is a single self-contained file (three.js is bundled in); it needs internet only for the Google Fonts.

Links can open a point or channel directly, e.g. `index.html#ST36` or `index.html#LR`.

## Develop

```bash
npm install
node build.js        # bundles src/ into dist/index.html
```

| File | Contents |
|---|---|
| `src/app.js` | Scene, UI, search, quiz, rulers, needle, mobile layout |
| `src/body.js` | Male/female body as signed distance fields; point placement in cun |
| `src/bodyShader.js` | GPU raymarching shader for the body |
| `src/data1.js` – `src/data4.js` | Point data (names, locations, indications, actions, placement) |
| `src/meta.js` | Channels, categories, extraordinary vessels, Five Phases |
| `src/guide.js`, `src/find.js` | "How to find it" steps, rulers and landmarks |
| `src/depth.js` | Needling angle and depth for every point |
| `src/index.html` | Page shell and styles |
| `build.js` | esbuild bundling into one HTML file |
