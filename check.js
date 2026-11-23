// Validates src/protocols.js against the point data. Run: node check.js
const esbuild = require('esbuild');
const entry = `
import { LU, LI, ST, SP } from './data1.js';
import { HT, SI, BL, KI } from './data2.js';
import { PC, SJ, GB, LR } from './data3.js';
import { CV, GV, EX } from './data4.js';
import { PROTOCOLS, TRADITIONS, SCHOOLS, METHODS, REFS, GROUPS } from './protocols.js';
const RAW = { LU, LI, ST, SP, HT, SI, BL, KI, PC, SJ, GB, LR, CV, GV };
const codes = new Set(EX.map((x) => x.code));
for (const id in RAW) for (const r of RAW[id]) codes.add(id + r.n);
module.exports = { codes, PROTOCOLS, TRADITIONS, SCHOOLS, METHODS, REFS, GROUPS };`;
const out = esbuild.buildSync({ stdin: { contents: entry, resolveDir: __dirname + '/src', loader: 'js' }, bundle: true, format: 'cjs', platform: 'node', write: false });
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, require);
const { codes, PROTOCOLS, TRADITIONS, SCHOOLS, METHODS, REFS, GROUPS } = mod.exports;

const errors = [];
const ids = new Set();
const conds = {};
const err = (p, msg) => errors.push(`${p.id || '?'}: ${msg}`);
const checkPts = (p, list, where) => {
  if (!Array.isArray(list)) return err(p, `${where} is not a list`);
  for (const e of list) {
    if (!Array.isArray(e) || typeof e[0] !== 'string') { err(p, `${where}: bad entry ${JSON.stringify(e)}`); continue; }
    if (!codes.has(e[0])) err(p, `${where}: unknown point ${e[0]}`);
    if (typeof e[1] !== 'string' || !e[1].length || [...e[1]].some((c) => !METHODS[c])) err(p, `${where}: ${e[0]} has unknown method "${e[1]}"`);
  }
};
for (const p of PROTOCOLS) {
  if (!p.id || ids.has(p.id)) err(p, 'missing or duplicate id');
  ids.add(p.id);
  if (!/^[a-z0-9-]+$/.test(p.id || '')) err(p, 'id must be lowercase letters, digits and hyphens');
  if (!p.name) err(p, 'missing name');
  if (!TRADITIONS[p.tradition]) err(p, `tradition must be one of ${Object.keys(TRADITIONS).join('/')}`);
  if (p.school && !SCHOOLS[p.school]) err(p, `unknown school ${p.school}`);
  if (p.school && p.tradition !== 'classical') err(p, 'only Classical protocols have a school');
  if (!GROUPS.includes(p.group)) err(p, `unknown group ${p.group}`);
  if (!Array.isArray(p.conditions)) err(p, 'conditions must be a list');
  else for (const c of p.conditions) { if (c !== c.toLowerCase().trim()) err(p, `condition "${c}" should be lower case`); conds[c] = (conds[c] || 0) + 1; }
  for (const r of p.refs || []) if (!REFS[r]) err(p, `unknown ref ${r}`);
  if (p.sets) {
    if (p.pts) err(p, 'has both pts and sets');
    if (!p.sets.length) err(p, 'empty sets');
    p.sets.forEach((s, i) => { if (!s.name) err(p, `set ${i} has no name`); if (!s.pts || !s.pts.length) err(p, `set ${i} has no points`); else checkPts(p, s.pts, `set "${s.name}"`); });
  } else if (!p.pts || !p.pts.length) err(p, 'has no points');
  else checkPts(p, p.pts, 'pts');
  if (p.add) checkPts(p, p.add, 'add');
}

const by = (t) => PROTOCOLS.filter((p) => p.tradition === t).length;
console.log(`${PROTOCOLS.length} protocols (${by('tcm')} TCM, ${by('classical')} Classical), ${Object.keys(conds).length} distinct conditions`);
if (process.argv.includes('--conditions')) {
  for (const [c, n] of Object.entries(conds).sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  ${String(n).padStart(2)}  ${c}`);
} else console.log('(run with --conditions to list every condition and spot spelling variants)');
if (errors.length) { console.error(`\n${errors.length} problem(s):\n  ` + errors.join('\n  ')); process.exit(1); }
console.log('protocols OK');
