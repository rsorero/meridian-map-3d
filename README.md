# Meridian Map 3D

An interactive 3D acupuncture atlas (the app is titled "Meridian Map 3D") that runs in the browser, on desktop and mobile.

- 361 classical points on the 14 channels, plus the 48 WHO extra points and Anmian, on male and female bodies
- Channel pathways, Qi circulation animation, extraordinary vessels, Five Phases and the Chinese clock
- **Protocols**: a library of 81 treatment protocols, each tagged **TCM** or **Classical** (pre-TCM, Five Phases: Nan Jing, Japanese meridian therapy, Worsley Five Element). Each one lights up its points on the body and shows method (tonify / reduce / moxa…), conditions and further reading. Every point and channel lists the protocols that use it, and searching a condition (e.g. *insomnia*) finds them
- 30 classical and needling point groups (Yuan, Luo, Xi-Cleft, Front-Mu, Back-Shu, Five-Shu, Influential, Window of Heaven, Ghost points, …)
- **How to find it**: step-by-step locating instructions with cun rulers and bony landmarks drawn on the body
- **Needling angle & depth**: angle, depth range, direction, cautions, a cross-section diagram and a 3D needle at the point
- Measure tab (finger cun and bone-proportional cun), search by code / pinyin / Chinese / English / symptom / condition, and a quiz

> For study only. Locations are shown on a stylised model and are approximate; depths are average-adult textbook values. Needling should only be performed by a trained practitioner.

## Use

**Live app:** https://rsorero.github.io/meridian-map-3d/ (deployed automatically from `main` by GitHub Actions)

**Install it as an app:** on Android or desktop Chrome/Edge, open the live app and choose *Install app* from the browser menu (or the *Install app* button in the **?** help card). On iPhone/iPad, use Safari's *Share → Add to Home Screen*. The installed app opens full screen and works offline after the first visit.

Or open `dist/index.html` in a modern browser. It is a single self-contained file (three.js is bundled in); it needs internet only for the Google Fonts.

Links can open a point, channel, protocol or sidebar tab directly, e.g. `index.html#ST36`, `index.html#LR`, `index.html#rx/four-gates` or `index.html#tab/protocols`.

## Develop

```bash
npm install
node check.js        # validates the protocols against the point data (--conditions lists every condition)
node build.js        # bundles src/ into dist/index.html, plus the manifest, icons and service worker
```

| File | Contents |
|---|---|
| `src/app.js` | Scene, UI, search, quiz, rulers, needle, mobile layout |
| `src/body.js` | Male/female body as signed distance fields; point placement in cun |
| `src/bodyShader.js` | GPU raymarching shader for the body |
| `src/data1.js` – `src/data4.js` | Point data (names, locations, indications, actions, placement) |
| `src/meta.js` | Channels, categories, extraordinary vessels, Five Phases |
| `src/protocols.js` | Treatment protocols (TCM and Classical), references |
| `src/guide.js`, `src/find.js` | "How to find it" steps, rulers and landmarks |
| `src/depth.js` | Needling angle and depth for every point |
| `src/index.html` | Page shell and styles |
| `src/manifest.webmanifest`, `src/sw.js`, `src/icons/` | Installable web app: manifest, offline service worker, app icons |
| `scripts/icons.js` | Renders the PNG icons from the SVGs in `src/icons/` (needs Playwright) |
| `build.js` | esbuild bundling into one HTML file; copies the web app files |
| `check.js` | Validates protocol point codes, methods, tags and references |

### Adding or editing protocols

Each entry in `PROTOCOLS` in `src/protocols.js` is one prescription:

```js
{ id: 'my-protocol', tradition: 'tcm' /* or 'classical' */, school: undefined /* Classical only: five, nanjing, meridian, neijing, combo */,
  group: 'Mind & sleep', name: '…', zh: '…', pattern: '…',
  conditions: ['insomnia', 'anxiety'],          // plain text, lower case; searchable
  signs: '…', principle: '…', notes: '…',
  pts: [['HT7', '+', 'role'], ['SP6', '+M']],   // + tonify, - reduce, = even, M moxa, B bleed, T test
  add: [['ST36', '+', 'if …']],                  // optional additions
  refs: ['cam', 'maciocia'], review: true }      // review = show a “verify” badge
```

Run `node check.js` after editing. The protocol content is written for study and should be checked against your own sources; entries marked *verify* vary between teachers.
