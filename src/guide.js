// "How to find it": generated step-by-step locating guidance and measuring rulers.
import { F, Fm, B, Bm, Sg, ua, fa, th, llm, lll, scalp, sideHead, Mf, Lf, side, top, Xo, HAND, ab, ics, ICS_Y, Tv, Lv, bt, bl, Sv } from './body.js';
import { FIND } from './find.js';

const r1 = (x) => Math.round(x * 10) / 10;
export function fingers(c) {
  if (!c) return '';
  const parts = [];
  let r = c;
  while (r >= 3 - 1e-6) { parts.push('four fingers'); r -= 3; }
  if (r >= 1.5 - 1e-6) { parts.push('two fingers'); r -= 1.5; }
  while (r >= 1 - 1e-6) { parts.push('one thumb'); r -= 1; }
  if (r >= 0.5 - 1e-6) { parts.push('half a thumb'); r -= 0.5; }
  if (!parts.length) return 'a few millimetres';
  const s = parts.join(' + ');
  return c > 6 ? `${s} — for long distances it is more accurate to divide the bone length proportionally` : s;
}
const cunTxt = (c) => `${r1(c)} cun`;

function armSide(a) {
  const x = ((a % 360) + 540) % 360 - 180; // -180..180
  const ax = Math.abs(x), rad = x >= 0;
  if (ax < 18) return 'the centre of the anterior (palmar) surface';
  if (ax < 62) return `the ${rad ? 'radial (thumb)' : 'ulnar (little-finger)'} side of the anterior surface`;
  if (ax < 118) return `the ${rad ? 'radial (thumb-side)' : 'ulnar (little-finger-side)'} border`;
  if (ax < 162) return `the ${rad ? 'radial' : 'ulnar'} side of the posterior (dorsal) surface`;
  return 'the centre of the posterior (dorsal) surface';
}
function legSide(a) {
  const x = ((a % 360) + 540) % 360 - 180;
  const ax = Math.abs(x), lat = x >= 0;
  if (ax < 18) return 'the front of the leg';
  if (ax < 62) return `the ${lat ? 'anterolateral' : 'anteromedial'} surface`;
  if (ax < 118) return `the ${lat ? 'lateral' : 'medial'} surface`;
  if (ax < 162) return `the ${lat ? 'posterolateral' : 'posteromedial'} surface`;
  return 'the back of the leg (posterior midline)';
}
function findAb(y) { for (let k = -60; k <= 80; k++) if (Math.abs(ab(k / 10) - y) < 1e-9) return k / 10; return null; }
function findIcs(y) { for (let n = 0; n < ICS_Y.length; n++) if (Math.abs(ICS_Y[n] - y) < 1e-9) return n; return null; }
function findSpine(y) {
  for (let n = 1; n <= 12; n++) if (Math.abs(bt(n) - y) < 1e-9) return { label: `below the spinous process of T${n}`, short: `T${n}`, y: Tv(n) };
  for (let n = 1; n <= 5; n++) if (Math.abs(bl(n) - y) < 1e-9) return { label: `below the spinous process of L${n}`, short: `L${n}`, y: Lv(n) };
  for (let n = 1; n <= 4; n++) if (Math.abs(Sv(n) - y) < 1e-9) return { label: `level with the ${['1st', '2nd', '3rd', '4th'][n - 1]} posterior sacral foramen`, short: `S${n}`, y: Sv(n) };
  if (Math.abs(y - 1.49) < 1e-9 || Math.abs(y - 1.5) < 1e-9) return { label: 'below the spinous process of C7', short: 'C7', y: 1.5 };
  return null;
}

// ruler = { path: [[x,y,z]...] (on the surface), cun, la, lb, mark: {from:'a'|'b', c}, ticks?: [{f,label,hi}] }
const limbPath = (M, specFn, cs, a) => cs.map((c) => M.place(specFn(c, a)).p);
const range = (a, b, n) => { const out = []; for (let i = 0; i <= n; i++) out.push(a + ((b - a) * i) / n); return out; };

export function guideFor(M, pt, ctx = {}) {
  const sp = pt.sp0;
  const m = sp && sp.m ? sp.m : { t: 'misc' };
  const steps = [], rulers = [];
  const find = FIND[pt.code];
  const chip = ctx.chip || ((c) => `<b>${c}</b>`);
  const P = (s) => M.place(s).p;
  switch (m.t) {
    case 'fa': {
      steps.push('Forearm scale: the distance from the cubital (elbow) crease to the wrist crease is <b>12 cun</b>. Bend the elbow slightly so both creases are clear.');
      if (m.c === 0) steps.push('The point lies on the wrist crease itself.');
      else if (m.c >= 12) steps.push('The point lies on the cubital crease.');
      else steps.push(`Measure <b>${cunTxt(m.c)}</b> up from the wrist crease${m.c <= 6 ? ` (≈ ${fingers(m.c)})` : ` — that is ${cunTxt(12 - m.c)} below the elbow crease, a little ${m.c > 6 ? 'above' : 'below'} the midpoint (6 cun)`}.`);
      steps.push(`Stay on ${armSide(m.a)} of the forearm.`);
      rulers.push({ path: limbPath(M, fa, range(12, 0, 24), m.a), cun: 12, la: 'Cubital crease', lb: 'Wrist crease', mark: { from: 'b', c: m.c } });
      break;
    }
    case 'ua': {
      steps.push('Upper-arm scale: from the end of the anterior axillary fold to the cubital crease is <b>9 cun</b>.');
      steps.push(`Measure <b>${cunTxt(m.c)}</b> above the cubital crease${m.c <= 6 ? ` (≈ ${fingers(m.c)})` : ` (= ${cunTxt(9 - m.c)} below the axillary fold)`}.`);
      steps.push(`Stay on ${armSide(m.a)} of the upper arm.`);
      rulers.push({ path: limbPath(M, ua, range(9, 0, 18), m.a), cun: 9, la: 'Axillary fold', lb: 'Cubital crease', mark: { from: 'b', c: m.c } });
      break;
    }
    case 'th': {
      const lateral = Math.abs(m.a) > 60 && Math.abs(m.a) < 120 && m.a > 0;
      const post = Math.abs(m.a) > 150;
      if (post) steps.push('Posterior thigh scale: from the gluteal fold to the popliteal crease is <b>14 cun</b> (the whole thigh, trochanter to popliteal crease, is 19 cun).');
      else if (lateral) steps.push('Lateral thigh scale: from the prominence of the greater trochanter to the popliteal crease is <b>19 cun</b>; the model uses an 18-cun thigh for all sides.');
      else steps.push('Thigh scale: from the upper border of the pubic symphysis to the base of the patella / medial epicondyle of the femur is <b>18 cun</b>.');
      steps.push(`Measure <b>${cunTxt(m.c)}</b> above the knee${m.c <= 6 ? ` (≈ ${fingers(m.c)})` : ''}. Above the patella, measure from its upper border.`);
      steps.push(`Stay on ${legSide(m.a)} of the thigh.`);
      rulers.push({ path: limbPath(M, th, range(18, 0, 30), m.a), cun: 18, la: post ? 'Gluteal region' : lateral ? 'Greater trochanter' : 'Pubic symphysis level', lb: 'Knee', mark: { from: 'b', c: m.c } });
      break;
    }
    case 'llm': {
      steps.push('Medial lower-leg scale: from the lower border of the medial condyle of the tibia (just below the knee) to the tip of the medial malleolus is <b>13 cun</b>.');
      steps.push(`Measure <b>${cunTxt(m.c)}</b> above the tip of the medial malleolus${m.c <= 6 ? ` (≈ ${fingers(m.c)})` : ''}.`);
      steps.push(`Stay on ${legSide(m.a)} — the posterior border of the tibia can be felt as a bony edge.`);
      rulers.push({ path: limbPath(M, llm, range(13, 0, 26), m.a), cun: 13, la: 'Medial tibial condyle', lb: 'Medial malleolus', mark: { from: 'b', c: m.c } });
      break;
    }
    case 'lll': {
      steps.push('Lateral / anterior lower-leg scale: from the popliteal crease (level with the knee joint, or ST35 at the front) to the tip of the lateral malleolus is <b>16 cun</b>.');
      if (m.c >= 15.5) steps.push('The point lies at the level of the knee joint.');
      else steps.push(`Measure <b>${cunTxt(m.c)}</b> above the lateral malleolus${m.c > 8 ? ` — i.e. ${cunTxt(16 - m.c)} below the knee (≈ ${fingers(16 - m.c)})` : ` (≈ ${fingers(m.c)})`}.`);
      steps.push(`Stay on ${legSide(m.a)} of the lower leg.`);
      rulers.push({ path: limbPath(M, lll, range(16, 0, 32), m.a), cun: 16, la: 'Knee joint line', lb: 'Lateral malleolus', mark: m.c >= 8 ? { from: 'a', c: 16 - m.c } : { from: 'b', c: m.c } });
      break;
    }
    case 'F': {
      const k = findAb(m.y), n = findIcs(m.y);
      if (m.cx > 0) {
        steps.push(`Horizontal scale: the distance between the two nipples is <b>8 cun</b>, so the nipple (mid-clavicular) line is 4 cun from the anterior midline. Measure <b>${cunTxt(m.cx)}</b> lateral to the midline${m.cx <= 3 ? ` (≈ ${fingers(m.cx)})` : ''}.`);
        const w = Math.max(m.cx, 4);
        const xs = range(0, w, Math.ceil(w * 3));
        rulers.push({ path: xs.map((x) => P(F(x, m.y))), cun: w, la: 'Midline', lb: w === 4 ? 'Nipple line (4 cun)' : `${r1(w)} cun`, mark: { from: 'a', c: m.cx } });
      } else steps.push('The point lies on the anterior midline.');
      if (k != null && k !== 0) {
        if (k > 0) {
          steps.push(`Vertical scale: from the umbilicus to the xiphisternal junction (where the ribs meet the sternum) is <b>8 cun</b>. Measure <b>${cunTxt(k)}</b> above the centre of the umbilicus${k <= 4 ? ` (≈ ${fingers(k)})` : ` — note ${cunTxt(4)} is the midpoint`}.`);
          rulers.push({ path: range(0, 8, 24).map((c) => P(F(0, ab(c)))), cun: 8, la: 'Umbilicus', lb: 'Xiphisternal junction', mark: { from: 'a', c: k } });
        } else {
          steps.push(`Vertical scale: from the umbilicus to the upper border of the pubic symphysis is <b>5 cun</b>. Measure <b>${cunTxt(-k)}</b> below the centre of the umbilicus (≈ ${fingers(-k)}).`);
          rulers.push({ path: range(0, -5, 20).map((c) => P(F(0, ab(c)))), cun: 5, la: 'Umbilicus', lb: 'Pubic symphysis', mark: { from: 'a', c: -k } });
        }
      } else if (k === 0) steps.push('The point is level with the centre of the umbilicus.');
      else if (n != null && n > 0) {
        steps.push(`Count the intercostal spaces: the 2nd rib joins the sternum at the sternal angle (the ridge about 2 finger-breadths below the suprasternal notch); the space below it is the 2nd intercostal space. In men the nipple lies in the 4th space. The point is in the <b>${['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th'][n]} intercostal space</b>.`);
        const xr = m.cx > 0 ? Math.min(m.cx, 2) : 0.7;
        const ys = range(1.445, ICS_Y[7], 30);
        const ticks = ICS_Y.slice(1).map((y, i) => ({ f: (1.445 - y) / (1.445 - ICS_Y[7]), label: i + 1 === n ? `ICS ${i + 1}` : '', hi: i + 1 === n }));
        rulers.push({ path: ys.map((y) => P(F(xr, y))), cun: 0, ticks, la: 'Suprasternal notch', lb: '7th ICS' });
      } else if (n === 0) steps.push('The point lies just below the clavicle.');
      break;
    }
    case 'B': {
      const lv = findSpine(m.y);
      steps.push('Find the vertebral level: C7 is the most prominent spinous process at the base of the neck (it moves when the head is turned). T3 is level with the medial end of the scapular spine, T7 with the inferior angle of the scapula, and L4 with the top of the iliac crests.');
      if (lv) steps.push(`Count down the spinous processes to <b>${lv.short}</b>; the point is ${lv.label}.`);
      if (m.cx > 0) {
        steps.push(`Horizontal scale: from the posterior midline to the medial border of the scapula is <b>3 cun</b>. Measure <b>${cunTxt(m.cx)}</b> lateral to the midline${m.cx === 1.5 ? ' (≈ two fingers — halfway to the scapular border)' : m.cx <= 3 ? ` (≈ ${fingers(m.cx)})` : ''}.`);
        const w = Math.max(m.cx, 3);
        rulers.push({ path: range(0, w, Math.ceil(w * 4)).map((x) => P(B(x, m.y))), cun: w, la: 'Spine', lb: w === 3 ? 'Scapular border (3 cun)' : `${r1(w)} cun`, mark: { from: 'a', c: m.cx } });
      } else steps.push('The point lies on the posterior midline, in the depression between two spinous processes.');
      const yb = lv && lv.short.startsWith('S') ? Sv(4) - 0.01 : Lv(5) - 0.02;
      const vs = [{ y: 1.5, l: 'C7' }];
      for (let i = 1; i <= 12; i++) vs.push({ y: Tv(i), l: `T${i}` });
      for (let i = 1; i <= 5; i++) vs.push({ y: Lv(i), l: `L${i}` });
      const show = new Set(['C7', 'T3', 'T7', 'T12', 'L4', lv && lv.short]);
      const ticks = vs.filter((q) => q.y > yb).map((q) => ({ f: (1.5 - q.y) / (1.5 - yb), label: show.has(q.l) ? q.l : '', hi: lv && q.l === lv.short }));
      rulers.push({ path: range(1.5, yb, 40).map((y) => P(B(0, y))), cun: 0, ticks, la: '', lb: '' });
      break;
    }
    case 'scalp': {
      steps.push('Head scale: from the anterior hairline to the posterior hairline along the midline is <b>12 cun</b>. If the hairline is unclear, use the glabella (3 cun below the anterior hairline) and C7 (3 cun below the posterior hairline) — 18 cun in total.');
      if (m.c === 5) steps.push('GV20 sits at the vertex, on the line joining the two ear apices — fold the ears forward to find it.');
      steps.push(m.c <= 6 ? `Measure <b>${cunTxt(m.c)}</b> back from the anterior hairline${m.c <= 4 ? ` (≈ ${fingers(m.c)})` : ''}.` : `Measure <b>${cunTxt(12 - m.c)}</b> up from the posterior hairline (≈ ${fingers(12 - m.c)}).`);
      rulers.push({ path: M.arcPoints(0, 12, 60), cun: 12, la: 'Anterior hairline', lb: 'Posterior hairline', mark: m.c <= 6 ? { from: 'a', c: m.c } : { from: 'b', c: 12 - m.c } });
      if (m.lat) {
        const L = Math.abs(m.lat);
        steps.push(`Lateral scale: the distance between the two ST8 points (corners of the forehead hairline) is 9 cun. Measure <b>${cunTxt(L)}</b> lateral to the midline${L === 2.25 ? ' — this line runs straight up from the pupil' : L === 1.5 ? ' — about two finger-breadths' : ''}.`);
        rulers.push({ path: range(0, m.lat, 12).map((x) => P(scalp(m.c, x))), cun: L, la: '', lb: '', mark: { from: 'a', c: L } });
      }
      break;
    }
    case 'side':
      if (!find) steps.push('The mid-axillary line is a vertical line dropped from the apex of the axilla. Count the ribs from the front: the free end of the 11th rib lies at the side of the abdomen, the 12th just behind and below it.');
      break;
    case 'face':
      if (!find) steps.push('Use the facial landmarks in the description (pupil, inner/outer canthus, nostril, corners of the mouth, eyebrow). With the patient looking straight ahead, the vertical line through the pupil is a common reference.');
      break;
    case 'headside':
      if (!find) steps.push('Landmarks around the ear: the tragus, the ear apex (fold the ear forward), the earlobe and the mastoid process behind the ear. Opening the mouth makes the depressions in front of the ear (SJ21, SI19, GB2) easier to feel.');
      break;
    case 'hand':
      if (!find) steps.push('On the hand, locate the metacarpal bones by sliding a finger along them; the points lie in the grooves between them or beside the joints. Making a loose fist helps reveal the palm points.');
      break;
    case 'foot':
      if (!find) steps.push('On the foot, use the malleoli, the navicular tuberosity (medial), the base of the 5th metatarsal (lateral), the metatarsophalangeal joints and the junction of red and white skin (where the sole meets the side of the foot).');
      break;
    case 'seg':
      if (!find) steps.push('On the fingers and toes, the "nail-corner" points lie 0.1 cun (about 2 mm) from the corner of the nail, at the intersection of lines along the side and the base of the nail.');
      break;
    default:
      break;
  }
  if (find) steps.unshift(...find);
  // a measurement relative to another point named in the location text
  if (!rulers.length && ctx.BY) {
    const rel = relativeRuler(pt, ctx.BY);
    if (rel) {
      rulers.push(rel.ruler);
      if (!find && rel.step) steps.push(rel.step.replace('{chip}', chip(rel.ref)));
    }
  }
  const p0 = pt.inst && pt.inst[0] ? [pt.inst[0].p.x, pt.inst[0].p.y, pt.inst[0].p.z] : M.place(sp).p;
  const near = nearLandmarks(M, p0);
  if (near.length) steps.push(`Landmarks marked on the body: ${near.map((l) => `<b>${l.name}</b>`).join(', ')}.`);
  steps.push('Confirm by touch: most points lie in a slight hollow between muscles, tendons or bones, and the right spot is usually more sensitive than the skin around it.');
  return { steps, rulers, near };
}

const CODE = '(LU|LI|ST|SP|HT|SI|BL|KI|PC|SJ|GB|LR|CV|GV)(\\d{1,2})';
const reCun = new RegExp(`(\\d+(?:\\.\\d+)?) cun ((?:directly |)(?:above|below|lateral|medial|anterior|posterior|proximal|distal|superior|inferior|in front|behind|anterosuperior|anteroinferior|posteroinferior|superolateral|inferolateral)[a-z ]{0,24}?)\\b${CODE}\\b`);
const reMid = new RegExp(`(?:midway|midpoint) (?:between|of the line joining) ${CODE} and ${CODE}`);
const reBetween = new RegExp(`between ${CODE} and ${CODE}`);
const reDirect = new RegExp(`(directly (?:above|below|lateral to|medial to)|level with|anterior to|posterior to) ${CODE}\\b`);
const P3 = (ins) => [ins.p.x, ins.p.y, ins.p.z];
function relativeRuler(pt, BY) {
  const loc = pt.loc;
  const me = pt.inst[0];
  let m = loc.match(reCun);
  if (m) {
    const ref = BY[m[3] + m[4]];
    if (ref && ref !== pt) {
      const c = parseFloat(m[1]);
      const dir = m[2].trim().replace(/ (to|of|the)$/, '').replace(/ the$/, '');
      return { ref: ref.code, ruler: { path: [P3(ref.inst[0]), P3(me)], cun: c, la: ref.code, lb: '', mark: { from: 'a', c } }, step: `Start from {chip}: this point is <b>${c} cun</b> ${dir} it (≈ ${fingers(c)}).` };
    }
  }
  m = loc.match(reMid);
  if (m) {
    const a = BY[m[1] + m[2]], b = BY[m[3] + m[4]];
    if (a && b) return { ref: a.code, ruler: { path: [P3(a.inst[0]), P3(me), P3(b.inst[0])], cun: 0, la: a.code, lb: b.code, ticks: [{ f: 0.5, label: 'midpoint', hi: true }] }, step: `Find ${a.code} and ${b.code}; this point is midway between them.` };
  }
  m = loc.match(reBetween);
  if (m) {
    const a = BY[m[1] + m[2]], b = BY[m[3] + m[4]];
    if (a && b && a !== pt && b !== pt) return { ref: a.code, ruler: { path: [P3(a.inst[0]), P3(me), P3(b.inst[0])], cun: 0, la: a.code, lb: b.code }, step: `Find ${a.code} and ${b.code}; this point lies on the line between them.` };
  }
  m = loc.match(reDirect);
  if (m) {
    const ref = BY[m[2] + m[3]];
    if (ref && ref !== pt) return { ref: ref.code, ruler: { path: [P3(ref.inst[0]), P3(me)], cun: 0, la: ref.code, lb: '', midLabel: m[1] }, step: `Start from {chip}: this point is ${m[1]} it.` };
  }
  return null;
}

const LM_CACHE = new Map();
export function landmarkPositions(M) {
  if (!LM_CACHE.has(M)) LM_CACHE.set(M, LANDMARKS.map(([name, sp]) => { const r = M.place(sp); return { name, p: r.p, n: r.n }; }));
  return LM_CACHE.get(M);
}
export function nearLandmarks(M, p) {
  const q = [Math.abs(p[0]), p[1], p[2]];
  const n = M.grad(q);
  return landmarkPositions(M).map((l) => ({ l, d: Math.hypot(l.p[0] - q[0], l.p[1] - q[1], l.p[2] - q[2]), f: l.n[0] * n[0] + l.n[1] * n[1] + l.n[2] * n[2] }))
    .filter((x) => x.d < 0.12 && x.d > 0.0015 && x.f > -0.1).sort((a, b) => a.d - b.d).slice(0, 3).map((x) => x.l);
}

// Standard proportional measurements (gu du fa)
export function standardMeasures(M) {
  const P = (s) => M.place(s).p;
  const sur = (specs) => specs.map(P);
  return [
    { id: 'head12', group: 'Head', name: 'Anterior to posterior hairline', cun: 12, build: () => [{ path: M.arcPoints(0, 12, 60), cun: 12, la: 'Anterior hairline', lb: 'Posterior hairline' }] },
    { id: 'head3', group: 'Head', name: 'Glabella to anterior hairline', cun: 3, build: () => [{ path: M.arcPoints(-3, 0, 16), cun: 3, la: 'Glabella', lb: 'Anterior hairline' }] },
    { id: 'head9', group: 'Head', name: 'Between the two ST8 (forehead corners)', cun: 9, build: () => [{ path: range(-4.5, 4.5, 30).map((x) => P(scalp(0.5, x))), cun: 9, la: 'ST8', lb: 'ST8' }] },
    { id: 'ch9', group: 'Chest & abdomen', name: 'Suprasternal notch to xiphisternal junction', cun: 9, build: () => [{ path: range(1.449, ics(5), 20).map((y) => P(F(0, y))), cun: 9, la: 'Suprasternal notch', lb: 'Xiphisternal junction' }] },
    { id: 'ab8', group: 'Chest & abdomen', name: 'Xiphisternal junction to umbilicus', cun: 8, build: () => [{ path: range(8, 0, 24).map((c) => P(F(0, ab(c)))), cun: 8, la: 'Xiphisternal junction', lb: 'Umbilicus' }] },
    { id: 'ab5', group: 'Chest & abdomen', name: 'Umbilicus to upper border of pubic symphysis', cun: 5, build: () => [{ path: range(0, -5, 20).map((c) => P(F(0, ab(c)))), cun: 5, la: 'Umbilicus', lb: 'Pubic symphysis' }] },
    { id: 'nip8', group: 'Chest & abdomen', name: 'Between the nipples', cun: 8, build: () => [{ path: range(-4, 4, 32).map((x) => P(F(x, ics(4)))), cun: 8, la: 'Nipple', lb: 'Nipple' }] },
    { id: 'sc3', group: 'Back', name: 'Posterior midline to medial border of scapula', cun: 3, build: () => [{ path: range(0, 3, 12).map((x) => P(B(x, Tv(4)))), cun: 3, la: 'Spine', lb: 'Scapula' }] },
    { id: 'spine', group: 'Back', name: 'Vertebral landmarks (C7, T3, T7, L4)', cun: 0, build: () => {
      const yb = Lv(5) - 0.02; const vs = [{ y: 1.5, l: 'C7' }]; for (let i = 1; i <= 12; i++) vs.push({ y: Tv(i), l: 'T' + i }); for (let i = 1; i <= 5; i++) vs.push({ y: Lv(i), l: 'L' + i });
      const show = { C7: 'C7 · base of neck', T3: 'T3 · scapular spine', T7: 'T7 · inferior angle of scapula', T12: 'T12', L4: 'L4 · iliac crests' };
      return [{ path: range(1.5, yb, 40).map((y) => P(B(0, y))), cun: 0, ticks: vs.map((q) => ({ f: (1.5 - q.y) / (1.5 - yb), label: show[q.l] || '', hi: !!show[q.l] })), la: '', lb: '' }];
    } },
    { id: 'ua9', group: 'Upper limb', name: 'Anterior axillary fold to cubital crease', cun: 9, build: () => [{ path: sur(range(9, 0, 18).map((c) => ua(c, 0))), cun: 9, la: 'Axillary fold', lb: 'Cubital crease' }] },
    { id: 'fa12', group: 'Upper limb', name: 'Cubital crease to wrist crease', cun: 12, build: () => [{ path: sur(range(12, 0, 24).map((c) => fa(c, 0))), cun: 12, la: 'Cubital crease', lb: 'Wrist crease' }] },
    { id: 'th18', group: 'Lower limb', name: 'Pubic symphysis to medial epicondyle of femur', cun: 18, build: () => [{ path: sur(range(18, 0, 30).map((c) => th(c, -62))), cun: 18, la: 'Pubic symphysis level', lb: 'Medial epicondyle' }] },
    { id: 'th19', group: 'Lower limb', name: 'Greater trochanter to popliteal crease', cun: 19, build: () => [{ path: sur(range(18, 0, 30).map((c) => th(c, 92))), cun: 19, la: 'Greater trochanter', lb: 'Popliteal crease level' }] },
    { id: 'gl14', group: 'Lower limb', name: 'Gluteal fold to popliteal crease', cun: 14, build: () => [{ path: sur(range(14, 0, 24).map((c) => th(c, 180))), cun: 14, la: 'Gluteal fold', lb: 'Popliteal crease' }] },
    { id: 'll13', group: 'Lower limb', name: 'Medial tibial condyle to medial malleolus', cun: 13, build: () => [{ path: sur(range(13, 0, 26).map((c) => llm(c, -100))), cun: 13, la: 'Medial tibial condyle', lb: 'Medial malleolus' }] },
    { id: 'll16', group: 'Lower limb', name: 'Popliteal crease to lateral malleolus', cun: 16, build: () => [{ path: sur(range(16, 0, 32).map((c) => lll(c, 100))), cun: 16, la: 'Knee joint line', lb: 'Lateral malleolus' }] },
  ];
}

// Anatomical landmarks shown on the body
export const LANDMARKS = [
  ['Glabella', Fm(0, 1.692)], ['Anterior hairline', scalp(0)], ['Vertex (GV20)', scalp(5)], ['External occipital protuberance', scalp(9.5)], ['Posterior hairline', scalp(12)],
  ['Mastoid process', sideHead(1.625, -0.035)], ['Tragus', sideHead(1.65, 0.012)],
  ['Suprasternal notch', F(0, 1.449)], ['Sternal angle', F(0, 1.395)], ['Xiphisternal junction', F(0, ics(5))], ['Nipple', F(4, ics(4))], ['Umbilicus', F(0, ab(0))], ['Pubic symphysis', F(0, ab(-5))],
  ['C7', B(0, 1.5)], ['T3 · scapular spine level', B(0, Tv(3))], ['T7 · inferior angle of scapula', B(0, Tv(7))], ['L4 · iliac crest level', B(0, Lv(4))], ['Sacral hiatus', B(0, 0.915)],
  ['Anterior axillary fold', ua(9, 0)], ['Cubital crease', fa(12, 0)], ['Lateral epicondyle', fa(12.3, 100)], ['Medial epicondyle', fa(12.2, -90)], ['Olecranon', fa(12.3, 180)], ['Wrist crease', fa(0, 0)], ['Radial styloid', fa(0.6, 90)],
  ['Greater trochanter', side(0.86, 95)], ['Patella', th(1.1, 0)], ['Popliteal crease', lll(16, 180)], ['Medial tibial condyle', llm(13, -100)], ['Head of fibula', lll(14.6, 100)],
  ['Inner canthus', Fm(0.018, 1.668)], ['Outer canthus', Fm(0.05, 1.667)], ['Corner of the mouth', Fm(0.021, 1.6035)], ['Ear apex', Xo([0.076, 1.66, -0.003], [0.15, 1, 0])], ['Angle of the mandible', sideHead(1.588, 0.0)], ['Zygomatic arch', sideHead(1.662, 0.045)],
  ['Laryngeal prominence', F(0, 1.535)], ['Acromion', top(0.172, -0.004)], ['Spine of the scapula', Bm(0.11, 1.418)], ['Superior angle of the scapula', Bm(0.085, 1.462)], ['Inferior angle of the scapula', Bm(0.095, Tv(7))],
  ['Posterior superior iliac spine', B(1.9, 1.022)], ['Tip of the coccyx', B(0, 0.885)], ['Anterior superior iliac spine', F(5.2, ab(-2.4))],
  ['Pisiform', fa(0, -55)], ['Base of the 5th metacarpal', Sg('m5', 0.08, -100)], ['Knuckles (MCP joints)', HAND(1.0, 0.0, 'd')], ['Head of the 1st metatarsal', Mf(0.025, 0.118)],
  ['Medial malleolus', Mf(0.09, -0.01)], ['Lateral malleolus', Lf(0.082, -0.016)], ['Navicular tuberosity', Mf(0.045, 0.035)], ['Base of 5th metatarsal', Lf(0.03, 0.06)],
];
