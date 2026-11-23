import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeBody } from './bodyShader.js';
import { createModel, v } from './body.js';
import { DEPTH, ANGLES, cm } from './depth.js';
import { guideFor, standardMeasures, LANDMARKS, fingers, landmarkPositions } from './guide.js';
import { LU, LI, ST, SP } from './data1.js';
import { HT, SI, BL, KI } from './data2.js';
import { PC, SJ, GB, LR } from './data3.js';
import { CV, GV, EX } from './data4.js';
import { MERIDIANS, FLOW, STROKES, CATEGORIES, CAT_ORDER, VESSELS, CROSSINGS, FIVE_SHU, SHU_KEYS, FIVE_SHU_NAMES, shuElement, ELEMENTS, EL_INFO, mother, son } from './meta.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mq = (q) => window.matchMedia && matchMedia(q).matches;
const isLandPhone = () => mq('(max-width:950px) and (orientation:landscape) and (max-height:540px)');
const isMobile = () => mq('(max-width:900px)') || isLandPhone();
const isSheet = () => mq('(max-width:900px)') && !isLandPhone();
const isTouch = () => mq('(pointer:coarse)');
const store = { get(k, d) { try { const x = localStorage.getItem('acu.' + k); return x == null ? d : JSON.parse(x); } catch { return d; } }, set(k, val) { try { localStorage.setItem('acu.' + k, JSON.stringify(val)); } catch {} } };

// ------------------------------------------------------------------ data model
const RAW = { LU, LI, ST, SP, HT, SI, BL, KI, PC, SJ, GB, LR, CV, GV };
const EXM = { id: 'EX', name: 'Extra points', zh: '经外奇穴', py: 'Jingwai Qixue', full: 'Extra points (outside the channels)', el: null, yy: '—', limb: 'Various', level: 'Extra', color: '#e9dcc0', time: null,
  path: 'Extra points (qixue) are established points that do not lie on the fourteen channels. The WHO 2008 standard lists 48, grouped by region: head and neck (HN), chest and abdomen (CA), back (B), upper limb (UE) and lower limb (LE). Several, such as Jiaji, Baxie, Bafeng, Shixuan and Sishencong, are groups of points.',
  fn: 'Usually named for their specific effect: Yintang calms the mind, Taiyang clears the temples, Dingchuan calms wheezing, Lanwei treats the appendix, Dannang the gall bladder.' };
const MER = {};
MERIDIANS.forEach((m) => (MER[m.id] = m));
MER.EX = EXM;
const ALLM = [...MERIDIANS, EXM];
const PTS = [];
const BY = {};
const SMALL_SEG = /^(f|t|m)/;
const MODELS = {};
let M = null;

function smallness(spec, p) {
  if (spec.k === 'S' && SMALL_SEG.test(spec.seg)) return 0.62;
  if (spec.k === 'S' && spec.seg === 'hand') return 0.72;
  if (p[1] > 1.56) return 0.72;
  if (p[1] < 0.14) return 0.7;
  const dW = v.len(v.sub([Math.abs(p[0]), p[1], p[2]], M.SK.W));
  if (dW < 0.13) return 0.7;
  return 1;
}
function addPoint(pt, specs, bil) {
  pt.specs = specs; pt.sp0 = specs[0]; pt.bil = bil;
  pt.cats = [];
  PTS.push(pt);
  BY[pt.code] = pt;
}
function computeInst() {
  for (const pt of PTS) {
    pt.inst = [];
    for (const sp of pt.specs) {
      const { p, n } = M.place(sp);
      const sm = smallness(sp, p);
      const mk = (s) => ({ pt, p: new THREE.Vector3(p[0] * s, p[1], p[2]), n: new THREE.Vector3(n[0] * s, n[1], n[2]), side: s, sm });
      pt.inst.push(mk(1));
      if (pt.bil) pt.inst.push(mk(-1));
    }
  }
}
function buildData() {
  for (const m of MERIDIANS) {
    m.points = [];
    const bil = !(m.id === 'CV' || m.id === 'GV');
    for (const r of RAW[m.id]) {
      const pt = { code: m.id + r.n, mer: m.id, n: r.n, py: r.py, zh: r.zh, en: r.en, loc: r.loc, ind: r.ind, act: r.act, bil };
      addPoint(pt, [r.sp], bil);
      m.points.push(pt);
    }
  }
  EXM.points = [];
  EX.forEach((r, i) => {
    const pt = { code: r.code, mer: 'EX', n: i + 1, py: r.py, zh: r.zh, en: r.en, loc: r.loc, ind: r.ind, act: r.act, bil: r.b, region: r.region };
    addPoint(pt, r.sp, r.b);
    EXM.points.push(pt);
  });
  const NCAT = {
    n_obl: ['Oblique (≈45°)', 'Points usually needled at about 45° — often because a lung, joint or bone lies beneath, or to direct the sensation.', ['O']],
    n_tra: ['Transverse (≈15°)', 'Points needled almost flat under the skin: the scalp, face, sternum and over thin tissue.', ['T']],
    n_spec: ['Specialist technique', 'Points around the eye, the suprasternal notch and the upper neck that require a special, cautious technique.', ['SP']],
    n_prick: ['Prick only', 'Points usually pricked very shallowly (often to bleed): finger and toe tips and points inside the mouth.', ['PR']],
    n_moxa: ['Moxa only / not needled', 'Points that are warmed with moxibustion instead of needled, or not treated at all.', ['MX', 'NO']],
  };
  for (const k in NCAT) {
    if (!CATEGORIES[k]) { CATEGORIES[k] = { name: NCAT[k][0], group: 'Needling', desc: NCAT[k][1], pts: PTS.filter((p) => DEPTH[p.code] && NCAT[k][2].includes(DEPTH[p.code].a)).map((p) => p.code) }; CAT_ORDER.splice(CAT_ORDER.indexOf('pregnancy'), 0, k); }
  }
  for (const k of CAT_ORDER) for (const c of CATEGORIES[k].pts) if (BY[c]) BY[c].cats.push(k);
  computeInst();
  for (const vs of VESSELS) for (const c of vs.pts) if (BY[c]) (BY[c].vessels = BY[c].vessels || []).push(vs.id);
}

// ------------------------------------------------------------------ three.js scene
let renderer, scene, camera, controls, body, bodyScene, rt, composite, pointsMesh, instList = [], lineGroups = {}, vesselGroups = {}, flowOrb;
const lineMats = [];
const clock = new THREE.Clock();
let sheetDrag = null, bodyWasMoving = false;
let needBody = true, needRender = true, interacting = false, idleTimer = 0, rtScale = 1, dynScale = 0.6, lastBodyAt = 0;
const state = {
  visible: new Set(store.get('visible', ALLM.map((m) => m.id))),
  focusMer: null, selected: null, hover: null, highlight: null, highlightLabel: '', mode: store.get('mode2', 1), sex: store.get('sex', 'male'), landmarks: store.get('landmarks', false),
  lines: store.get('lines', true), labels: store.get('labels', true), size: store.get('size', 1), vessel: null, flow: false, quiz: null,
};

function initScene() {
  const stage = $('#stage');
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x0d0f13, 1);
  stage.prepend(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.02, 30);
  camera.position.set(0, 1.0, 4.4);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.92, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.minDistance = 0.18;
  controls.maxDistance = 8;
  controls.zoomSpeed = 1.1;
  controls.addEventListener('start', () => { interacting = true; clearTimeout(idleTimer); });
  controls.addEventListener('end', () => { idleTimer = setTimeout(() => { interacting = false; needBody = true; needRender = true; }, 180); });
  controls.addEventListener('change', () => { needBody = true; needRender = true; });

  scene.add(new THREE.HemisphereLight(0xffffff, 0x404050, 1.6));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(1, 2, 3); scene.add(dl);

  // body raymarch -> render target -> composited with depth
  bodyScene = new THREE.Scene();
  setBodyMesh();
  rt = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true });
  rt.depthTexture = new THREE.DepthTexture(4, 4);
  rt.depthTexture.type = THREE.UnsignedIntType;
  composite = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, uRes: { value: new THREE.Vector2() } },
    vertexShader: 'void main(){ gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader: `uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uRes;
      void main(){ vec2 uv=gl_FragCoord.xy/uRes; vec4 c=texture2D(tColor,uv); if(c.a<0.004) discard;
      gl_FragDepth=texture2D(tDepth,uv).x; gl_FragColor=c; }`,
    transparent: true, depthTest: true, depthWrite: true,
  }));
  composite.frustumCulled = false;
  composite.renderOrder = 100;
  scene.add(composite);
  body.mat.uniforms.uMode.value = state.mode;

  window.addEventListener('resize', resize);
  let roRaf = 0;
  if (window.ResizeObserver) new ResizeObserver(() => { if (sheetDrag) return; cancelAnimationFrame(roRaf); roRaf = requestAnimationFrame(resize); }).observe(stage);
  resize();
}
const BODIES = {};
function setBodyMesh() {
  if (body) bodyScene.remove(body.mesh);
  body = BODIES[M.sex] || (BODIES[M.sex] = makeBody(M));
  body.mat.blending = THREE.NoBlending;
  body.mat.uniforms.uMode.value = state.mode;
  bodyScene.add(body.mesh);
  needBody = true; needRender = true;
}
function resize() {
  const stage = $('#stage');
  const w = stage.clientWidth, hh = stage.clientHeight;
  renderer.setSize(w, hh);
  camera.aspect = w / hh;
  camera.updateProjectionMatrix();
  needBody = true; needRender = true;
}

// ---- points
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpC = new THREE.Color();
function buildPoints() {
  instList = [];
  for (const pt of PTS) for (const ins of pt.inst) instList.push(ins);
  const geo = new THREE.SphereGeometry(1, 16, 12);
  const mat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 70, specular: 0x666666 });
  pointsMesh = new THREE.InstancedMesh(geo, mat, instList.length);
  pointsMesh.renderOrder = 1;
  instList.forEach((ins, i) => { ins.idx = i; ins.pos = ins.p.clone().addScaledVector(ins.n, 0.0016); });
  pointsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(pointsMesh);
  updatePoints();
}
function pointColor(pt) { return MER[pt.mer].color; }
function updatePoints() {
  const hl = state.highlight, sel = state.selected, fm = state.focusMer, q = state.quiz;
  const base = 0.0043 * state.size;
  instList.forEach((ins, i) => {
    const pt = ins.pt;
    let vis = state.visible.has(pt.mer);
    let s = base * ins.sm, col = pointColor(pt), dim = false;
    if (hl) { if (hl.has(pt.code)) { vis = true; s *= 1.25; } else dim = true; }
    else if (fm && pt.mer !== fm) dim = true;
    if (q && q.mode === 'find' && !q.answered) { dim = false; col = '#d9dde6'; s = base * ins.sm; vis = true; }
    if (q && q.mode === 'name' && q.current === pt && !q.answered) { col = '#ffffff'; }
    if (pt === sel) { s *= needleGroup ? 1.0 : 1.9; vis = true; dim = false; }
    if (pt === state.hover) s *= 1.45;
    if (dim) { s *= 0.62; tmpC.set(col).lerp(new THREE.Color('#5a606c'), 0.75); } else tmpC.set(col);
    if (!vis) s = 0;
    tmpS.set(s, s, s);
    tmpM.compose(ins.pos, tmpQ, tmpS);
    pointsMesh.setMatrixAt(i, tmpM);
    pointsMesh.setColorAt(i, tmpC);
  });
  pointsMesh.instanceMatrix.needsUpdate = true;
  if (pointsMesh.instanceColor) pointsMesh.instanceColor.needsUpdate = true;
  pointsMesh.computeBoundingSphere();
  needRender = true;
}

// ---- pathways
const lineVS = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const lineFS = `uniform vec3 uColor; uniform float uTime; uniform float uLen; uniform float uFlow; uniform float uOpacity; uniform float uDash;
varying vec2 vUv;
void main(){
  float x=vUv.x*uLen;
  float a=1.0;
  if(uDash>0.5){ a=step(0.45,fract(x*45.0-uTime*0.6)); if(a<0.5) discard; }
  float pulse=uFlow*smoothstep(0.75,1.0,fract(x*7.0-uTime*0.9));
  vec3 c=uColor*(0.85+0.9*pulse);
  gl_FragColor=vec4(c,uOpacity);
}`;
function lineMaterial(color, len, dash = 0) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uLen: { value: len }, uFlow: { value: 0 }, uOpacity: { value: 0.9 }, uDash: { value: dash } },
    vertexShader: lineVS, fragmentShader: lineFS, transparent: true, depthWrite: true,
  });
  lineMats.push(m);
  return m;
}
function surfacePath(pts, perSeg = 10) {
  if (pts.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
  const N = Math.max(12, Math.ceil(len / 0.006));
  const out = [];
  for (let i = 0; i <= N; i++) {
    const c = curve.getPoint(i / N);
    const pp = M.project([c.x, c.y, c.z]);
    const nn = M.grad(pp);
    out.push(new THREE.Vector3(pp[0] + nn[0] * 0.0014, pp[1] + nn[1] * 0.0014, pp[2] + nn[2] * 0.0014));
  }
  return out;
}
function tubeFrom(samples, radius, mat) {
  const curve = new THREE.CatmullRomCurve3(samples, false, 'catmullrom', 0.2);
  const g = new THREE.TubeGeometry(curve, samples.length * 2, radius, 5, false);
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 0;
  return m;
}
const mirror = (arr) => arr.map((p) => new THREE.Vector3(-p.x, p.y, p.z));
function buildLines() {
  for (const m of MERIDIANS) {
    const grp = new THREE.Group();
    const strokes = STROKES[m.id] || [m.points.map((p) => p.n)];
    m.samples = [];
    for (const st of strokes) {
      const pts = st.map((n) => BY[m.id + n].inst[0].p);
      const smp = surfacePath(pts);
      if (!smp) continue;
      m.samples.push(smp);
      let L = 0; for (let i = 1; i < smp.length; i++) L += smp[i].distanceTo(smp[i - 1]);
      const mat = lineMaterial(m.color, L);
      grp.add(tubeFrom(smp, 0.0015, mat));
      if (!(m.id === 'CV' || m.id === 'GV')) grp.add(tubeFrom(mirror(smp), 0.0015, mat));
    }
    lineGroups[m.id] = grp;
    scene.add(grp);
  }
  for (const vs of VESSELS) {
    const grp = new THREE.Group();
    const pts = vs.pts.map((c) => BY[c].inst[0].p);
    const smp = surfacePath(pts);
    let L = 0; for (let i = 1; i < smp.length; i++) L += smp[i].distanceTo(smp[i - 1]);
    const mat = lineMaterial(vs.color, L, 1);
    grp.add(tubeFrom(smp, 0.0017, mat));
    grp.add(tubeFrom(mirror(smp), 0.0017, mat));
    grp.visible = false;
    vesselGroups[vs.id] = grp;
    scene.add(grp);
  }
  updateLines();
}
function updateLines() {
  for (const id in lineGroups) {
    const g = lineGroups[id];
    g.visible = state.lines && state.visible.has(id) && !(state.quiz && !state.quiz.answered);
    const focus = state.focusMer === id || (state.selected && state.selected.mer === id);
    const dimmed = (state.focusMer && state.focusMer !== id) || (state.highlight && !focus) || state.vessel;
    g.children.forEach((c) => {
      c.material.uniforms.uOpacity.value = dimmed ? 0.18 : 0.9;
      c.material.uniforms.uFlow.value = focus ? 1 : 0;
    });
    if (state.flow) g.children.forEach((c) => { c.material.uniforms.uOpacity.value = state.flow.cur === id ? 1 : 0.22; c.material.uniforms.uFlow.value = state.flow.cur === id ? 1 : 0; });
  }
  for (const id in vesselGroups) vesselGroups[id].visible = state.vessel === id;
  needRender = true;
}

// ------------------------------------------------------------------ occlusion & projection helpers
const _v = new THREE.Vector3();
function occluded(p) {
  const o = camera.position;
  const d = [p.x - o.x, p.y - o.y, p.z - o.z];
  const L = Math.hypot(...d);
  const dir = [d[0] / L, d[1] / L, d[2] / L];
  let t = 0.0;
  for (let i = 0; i < 160; i++) {
    const q = [o.x + dir[0] * t, o.y + dir[1] * t, o.z + dir[2] * t];
    const s = M.sdf(q);
    if (s < 0.0004) return t < L - 0.006;
    t += s;
    if (t > L - 0.006) return false;
  }
  return false;
}
function visibleFrom(o, p) {
  const d = [p.x - o.x, p.y - o.y, p.z - o.z];
  const L = Math.hypot(...d);
  const dir = [d[0] / L, d[1] / L, d[2] / L];
  let t = 0;
  for (let i = 0; i < 200; i++) {
    const s = M.sdf([o.x + dir[0] * t, o.y + dir[1] * t, o.z + dir[2] * t]);
    if (s < 0.0004) return t >= L - 0.01;
    t += s;
    if (t > L - 0.01) return true;
  }
  return true;
}
// pick a camera position looking at surface point p from roughly direction dir, avoiding other body parts
function clearView(p, dir, dist) {
  const Zv = new THREE.Vector3(0, 0, 1), Yv = new THREE.Vector3(0, 1, 0);
  const cands = [dir.clone(), dir.clone().add(Zv.clone().multiplyScalar(0.7)), dir.clone().add(Zv.clone().multiplyScalar(0.9)).add(Yv.clone().multiplyScalar(0.5)), dir.clone().multiplyScalar(0.4).add(Zv).add(Yv.clone().multiplyScalar(0.3)), dir.clone().add(Zv.clone().multiplyScalar(-0.8)), new THREE.Vector3(dir.x * 0.3, 0.4, 1)];
  for (const c of cands) {
    c.normalize();
    const pos = p.clone().addScaledVector(c, dist);
    if (visibleFrom(pos, p.clone().addScaledVector(dir, 0.003))) return pos;
  }
  return p.clone().addScaledVector(cands[2], dist);
}
function toScreen(p) {
  _v.copy(p).project(camera);
  const r = renderer.domElement.getBoundingClientRect();
  return { x: (_v.x * 0.5 + 0.5) * r.width, y: (-_v.y * 0.5 + 0.5) * r.height, z: _v.z };
}
function bestInst(pt) {
  let best = null, bd = -Infinity;
  for (const ins of pt.inst) {
    const view = _v.copy(camera.position).sub(ins.pos).normalize();
    const d = view.dot(ins.n) - (occluded(ins.pos) ? 2 : 0);
    if (d > bd) { bd = d; best = ins; }
  }
  return best;
}
function rayBody(ndcX, ndcY) {
  const rc = new THREE.Raycaster();
  rc.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const o = rc.ray.origin, d = rc.ray.direction;
  let t = 0;
  for (let i = 0; i < 300; i++) {
    const q = [o.x + d.x * t, o.y + d.y * t, o.z + d.z * t];
    const s = M.sdf(q);
    if (s < 0.0003) return new THREE.Vector3(...q);
    t += s;
    if (t > 30) return null;
  }
  return null;
}

// ------------------------------------------------------------------ picking
const raycaster = new THREE.Raycaster();
function pick(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  const nx = ((ev.clientX - r.left) / r.width) * 2 - 1, ny = -((ev.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera({ x: nx, y: ny }, camera);
  // screen-space nearest visible instance within radius
  let best = null, bd = 1e9;
  const R = ev.pointerType === 'touch' || isTouch() ? 26 : 14;
  for (const ins of instList) {
    const pt = ins.pt;
    if (!state.visible.has(pt.mer) && !(state.highlight && state.highlight.has(pt.code)) && pt !== state.selected && !(state.quiz && state.quiz.mode === 'find')) continue;
    _v.copy(ins.pos).project(camera);
    if (_v.z > 1) continue;
    const sx = (_v.x * 0.5 + 0.5) * r.width, sy = (-_v.y * 0.5 + 0.5) * r.height;
    const dd = Math.hypot(sx - (ev.clientX - r.left), sy - (ev.clientY - r.top));
    if (dd < R && dd < bd + 3) {
      if (state.mode !== 2 && occluded(ins.pos)) continue;
      const dz = camera.position.distanceTo(ins.pos);
      if (!best || dd < bd - 3 || dz < best.dz) { best = { ins, dz }; bd = Math.min(bd, dd); }
    }
  }
  return best ? best.ins : null;
}

// ------------------------------------------------------------------ camera animation
let camAnim = null;
function flyTo(target, pos, ms = 800) {
  camAnim = { t0: performance.now(), ms, ft: controls.target.clone(), fp: camera.position.clone(), tt: target.clone(), tp: pos.clone() };
}
function flyToPoint(pt, dist) {
  const ins = bestInst(pt) || pt.inst[0];
  const d = dist || Math.min(Math.max(camera.position.distanceTo(controls.target), 0.32), 0.75) * (ins.sm < 0.8 ? 0.75 : 1);
  const dir = ins.n.clone().multiplyScalar(0.85).add(new THREE.Vector3(0, 0.12, 0)).normalize();
  if (Math.abs(ins.n.y) > 0.85) dir.set(ins.n.x * 0.5, ins.n.y, ins.n.z * 0.5 + 0.4).normalize();
  flyTo(ins.p, clearView(ins.p, dir, d));
}
const VIEWS = {
  front: () => [[0, 0.9, 0], [0, 1.0, fitDist(0.82)]], back: () => [[0, 0.9, 0], [0, 1.0, -fitDist(0.82)]], left: () => [[0, 0.9, 0], [fitDist(0.3), 1.0, 0]], right: () => [[0, 0.9, 0], [-fitDist(0.3), 1.0, 0]],
  head: [[0, 1.64, 0], [0.42, 1.72, 0.62]], torso: [[0, 1.2, 0], [0.3, 1.3, 1.45]], back2: [[0, 1.2, 0], [0.3, 1.3, -1.45]],
  hand: () => [[M.SK.W[0] + 0.03, M.SK.W[1] - 0.03, 0], [M.SK.W[0] + 0.25, M.SK.W[1] + 0.05, 0.42]], leg: () => [[M.SK.K[0], 0.42, 0], [M.SK.K[0] + 0.65, 0.55, 1.35]], foot: () => [[M.SK.footX, 0.06, 0.03], [M.SK.footX + 0.4, 0.32, 0.55]],
};
function fitDist(halfW, halfH = 0.98) {
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * camera.aspect);
  return Math.max(3.2, Math.max(halfH / Math.tan(vf), halfW / Math.tan(hf)) * 1.06);
}
function frameMeridian(id) {
  const m = MER[id];
  if (id === 'EX') return view('front');
  const ps = [], ns = new THREE.Vector3();
  for (const pt of m.points) for (const ins of pt.inst) if (ins.side > 0) { ps.push(ins.p); ns.add(ins.n); }
  const box = new THREE.Box3().setFromPoints(ps);
  const c = box.getCenter(new THREE.Vector3());
  const r = box.getSize(new THREE.Vector3()).length() / 2;
  ns.y *= 0.3; ns.normalize();
  if (ns.lengthSq() < 0.1) ns.set(0, 0, 1);
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2;
  const hf = Math.atan(Math.tan(vf) * camera.aspect);
  const d = (r * 1.25) / Math.sin(Math.min(vf, hf));
  const dir = ns.clone().add(new THREE.Vector3(0, 0.12, 0)).normalize();
  flyTo(c, c.clone().addScaledVector(dir, Math.max(0.5, d)));
}
function view(name) {
  let vv = VIEWS[name]; if (typeof vv === 'function') vv = vv();
  const t = new THREE.Vector3(...vv[0]), p = new THREE.Vector3(...vv[1]);
  if (!['front', 'back', 'left', 'right'].includes(name) && camera.aspect < 1) p.sub(t).multiplyScalar(Math.min(1.7, 1 / Math.sqrt(camera.aspect))).add(t);
  flyTo(t, p);
}

// ------------------------------------------------------------------ labels
const labelPool = [];
let labelLayer;
function getLabel(i) {
  while (labelPool.length <= i) { const e = h('div', { class: 'lbl' }); labelLayer.appendChild(e); labelPool.push(e); }
  return labelPool[i];
}
function updateLabels() {
  let list = [];
  if (state.labels && !(state.quiz && !state.quiz.answered)) {
    if (state.highlight) list = [...state.highlight].map((c) => BY[c]).filter(Boolean);
    else if (state.focusMer) list = MER[state.focusMer].points;
    else if (state.selected) list = MER[state.selected.mer].points;
  }
  if (state.selected && !list.includes(state.selected) && !(state.quiz && state.quiz.mode === 'name' && !state.quiz.answered)) list = list.concat([state.selected]);
  const r = renderer.domElement.getBoundingClientRect();
  let n = 0;
  const placed = [];
  const extra = [...needleLabels, ...rulerLabels.map((l) => ({ ...l })), ...lmShow.filter((l) => !rulerLabels.some((r) => r.text.startsWith(l.name.split(' ·')[0]))).map((l) => ({ p: l.p, text: l.name, cls: 'rl lm' }))];
  for (const l of extra) {
    const sc = toScreen(l.p);
    if (sc.z > 1 || sc.x < -40 || sc.y < -20 || sc.x > r.width + 40 || sc.y > r.height + 20) continue;
    if (state.mode !== 2 && !l.noOcc && occluded(l.p)) continue;
    const lw = 10 + 6 * l.text.length, rx = sc.x + 8, ry = sc.y - 8;
    if (placed.some((q) => rx < q[0] + q[2] && rx + lw > q[0] && ry < q[1] + 15 && ry + 15 > q[1])) continue;
    placed.push([rx, ry, lw]);
    const e = getLabel(n++);
    e.textContent = l.text;
    e.className = 'lbl ' + l.cls;
    e.style.transform = `translate(${sc.x.toFixed(1)}px, ${sc.y.toFixed(1)}px)`;
    e.style.display = '';
  }
  const camDist = camera.position.distanceTo(controls.target);
  const showAll = camDist < 1.4 || list.length < 40;
  for (const pt of list) {
    for (const ins of pt.inst) {
      if (pt.inst.length > 2 && ins !== pt.inst[0] && ins !== pt.inst[1]) continue;
      const sc = toScreen(ins.pos);
      if (sc.z > 1 || sc.x < -20 || sc.y < -20 || sc.x > r.width + 20 || sc.y > r.height + 20) continue;
      const facing = _v.copy(camera.position).sub(ins.pos).normalize().dot(ins.n);
      if (facing < -0.1 && state.mode !== 2) continue;
      if (state.mode !== 2 && occluded(ins.pos)) continue;
      if (!showAll && pt !== state.selected && n > 60) continue;
      const lw = 8 + 6.2 * pt.code.length, rx = sc.x + 6, ry = sc.y - 22;
      if (pt !== state.selected && placed.some((q) => rx < q[0] + q[2] && rx + lw > q[0] && ry < q[1] + 15 && ry + 15 > q[1])) continue;
      placed.push([rx, ry, lw]);
      const e = getLabel(n++);
      e.textContent = pt.code.replace(/^EX-/, '');
      e.style.transform = `translate(${sc.x.toFixed(1)}px, ${sc.y.toFixed(1)}px)`;
      e.style.setProperty('--c', MER[pt.mer].color);
      e.className = 'lbl' + (pt === state.selected ? ' sel' : '') + (ins.side < 0 ? ' r' : '');
      e.style.display = '';
    }
  }
  for (let i = n; i < labelPool.length; i++) labelPool[i].style.display = 'none';
  // selection ring
  const ring = $('#selring');
  if (state.selected) {
    const ins = bestInst(state.selected);
    const sc = toScreen(ins.pos);
    ring.style.display = '';
    ring.style.transform = `translate(${sc.x}px, ${sc.y}px)`;
    ring.style.setProperty('--c', MER[state.selected.mer].color);
  } else ring.style.display = 'none';
}

// ------------------------------------------------------------------ render loop
function renderBody() {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const moving = interacting || camAnim;
  const sc = moving ? dynScale / Math.min(devicePixelRatio, 2) * 1.0 : (isTouch() && devicePixelRatio > 1.5 ? 0.75 : 1);
  body.mat.uniforms.uQuality.value = moving ? 0 : 1;
  const t0 = performance.now();
  const w = Math.max(4, Math.round(size.x * sc)), hh = Math.max(4, Math.round(size.y * sc));
  if (rt.width !== w || rt.height !== hh) rt.setSize(w, hh);
  body.mat.uniforms.uRes.value.set(w, hh);
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(bodyScene, camera);
  renderer.setRenderTarget(null);
  renderer.setClearColor(0x0d0f13, 1);
  composite.material.uniforms.uRes.value.copy(size);
  rtScale = sc;
  bodyWasMoving = !!moving;
  if (moving) {
    const dt = performance.now() - lastBodyAt; lastBodyAt = performance.now();
    if (dt < 200) { if (dt > 45) dynScale = Math.max(0.3, dynScale * 0.85); else if (dt < 22) dynScale = Math.min(1, dynScale * 1.06); }
  }
}
let lastLabel = 0;
function loop() {
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime();
  if (camAnim) {
    const k = Math.min(1, (performance.now() - camAnim.t0) / camAnim.ms);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    controls.target.lerpVectors(camAnim.ft, camAnim.tt, e);
    camera.position.lerpVectors(camAnim.fp, camAnim.tp, e);
    needBody = true; needRender = true;
    if (k >= 1) { camAnim = null; needBody = true; }
  }
  if (controls.update()) { needBody = true; needRender = true; }
  const animLines = state.focusMer || state.selected || state.vessel || state.flow;
  if (animLines) { lineMats.forEach((m) => (m.uniforms.uTime.value = t)); needRender = true; }
  if (state.flow) stepFlow(t);
  if (!needRender && !needBody) return;
  if (needBody) { renderBody(); needBody = false; }
  else if (bodyWasMoving && !interacting && !camAnim) renderBody();
  renderer.render(scene, camera);
  needRender = false;
  const now = performance.now();
  if (now - lastLabel > 40 || !animLines) { updateLabels(); lastLabel = now; }
}

// ------------------------------------------------------------------ Qi flow animation
function buildFlowPath() {
  const segs = [];
  for (let i = 0; i < FLOW.length; i++) {
    const m = MER[FLOW[i]];
    const pts = [];
    m.samples.forEach((s) => pts.push(...s));
    segs.push({ id: m.id, pts });
    const nx = MER[FLOW[(i + 1) % FLOW.length]];
    const a = pts[pts.length - 1], b = nx.samples[0][0];
    const bridge = surfacePath([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0, 0)), b]) || [a, b];
    segs.push({ id: null, from: m.id, pts: bridge });
  }
  // cumulative arc length per seg
  for (const s of segs) {
    s.cum = [0];
    for (let i = 1; i < s.pts.length; i++) s.cum.push(s.cum[i - 1] + s.pts[i].distanceTo(s.pts[i - 1]));
    s.len = s.cum[s.cum.length - 1];
  }
  return segs;
}
let FLOWSEGS = null;
function startFlow() {
  if (!FLOWSEGS) FLOWSEGS = buildFlowPath();
  if (!flowOrb) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,240,200,0.9)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    flowOrb = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false, transparent: true, blending: THREE.AdditiveBlending }));
    flowOrb.scale.set(0.045, 0.045, 1);
    flowOrb.renderOrder = 200;
    scene.add(flowOrb);
  }
  flowOrb.visible = true;
  state.flow = { t0: clock.getElapsedTime(), seg: 0, s: 0, cur: FLOW[0], speed: 0.12, last: clock.getElapsedTime(), paused: false };
  clearHighlight(true);
  state.focusMer = null;
  $('#flowpanel').classList.add('on');
  view('front');
  updateLines(); updatePoints(); renderClock();
}
function stopFlow() {
  state.flow = false;
  if (flowOrb) flowOrb.visible = false;
  $('#flowpanel').classList.remove('on');
  updateLines(); renderClock(); needRender = true;
}
function stepFlow(t) {
  const f = state.flow;
  const dt = Math.min(0.1, t - f.last); f.last = t;
  if (!f.paused) f.s += dt * f.speed;
  let seg = FLOWSEGS[f.seg];
  while (f.s > seg.len) { f.s -= seg.len; f.seg = (f.seg + 1) % FLOWSEGS.length; seg = FLOWSEGS[f.seg]; }
  let i = 1; while (i < seg.cum.length - 1 && seg.cum[i] < f.s) i++;
  const k = (f.s - seg.cum[i - 1]) / ((seg.cum[i] - seg.cum[i - 1]) || 1);
  const p = seg.pts[i - 1].clone().lerp(seg.pts[i], k);
  flowOrb.position.copy(p);
  flowOrb.material.opacity = state.mode !== 2 && occluded(p) ? 0.35 : 1;
  const cur = seg.id || seg.from;
  if (cur !== f.cur) { f.cur = cur; updateLines(); renderClock(); }
  // progress within channel -> clock hand
  const m = MER[cur];
  const frac = seg.id ? f.s / seg.len : 1;
  const hour = m.time[0] + frac * 2;
  setClockHand(hour);
}

// ------------------------------------------------------------------ UI: sidebar
function setHighlight(set, label, info = '') {
  state.highlight = set && set.size ? set : null;
  state.highlightLabel = label;
  state.vessel = null;
  const bar = $('#hlbar');
  if (state.highlight) { bar.innerHTML = `<span class="dot" style="background:#e3b36a"></span><b>${esc(label)}</b><span class="muted">${state.highlight.size} points</span>${info}<button class="x" title="Clear">✕</button>`; bar.classList.add('on'); $('.x', bar).onclick = () => clearHighlight(); }
  else bar.classList.remove('on');
  updatePoints(); updateLines(); needRender = true;
}
function clearHighlight(silent) {
  state.highlight = null; state.vessel = null;
  $('#hlbar').classList.remove('on');
  $$('.cat.on, .vs.on, .elnode.on').forEach((e) => e.classList.remove('on'));
  if (!silent) { updatePoints(); updateLines(); }
}

function renderChannels() {
  const box = $('#pane-channels');
  box.innerHTML = `<div class="row-actions"><button data-a="all">Show all</button><button data-a="none">Hide all</button><button data-a="flow" class="accent">▶ Qi circulation</button></div><div class="mlist"></div>`;
  const list = $('.mlist', box);
  for (const m of ALLM) {
    const row = h('div', { class: 'mrow' + (state.focusMer === m.id ? ' on' : ''), 'data-id': m.id });
    row.innerHTML = `<button class="eye ${state.visible.has(m.id) ? 'vis' : ''}" title="Show / hide"><span style="background:${m.color}"></span></button>
      <div class="mname"><b>${m.id}</b> ${esc(m.name)}<small>${m.id === 'EX' ? `${m.points.length} extra points` : `${m.points.length} pts · ${m.el ? m.el + ' ' : ''}${m.yy}${m.time ? ` · ${m.time[0]}–${m.time[1]}h` : ''}`}</small></div><span class="zh">${m.zh}</span>`;
    $('.eye', row).onclick = (e) => { e.stopPropagation(); toggleVisible(m.id); };
    row.onclick = () => selectMeridian(m.id);
    list.appendChild(row);
  }
  $('[data-a=all]', box).onclick = () => { ALLM.forEach((m) => state.visible.add(m.id)); afterVis(); };
  $('[data-a=none]', box).onclick = () => { state.visible.clear(); afterVis(); };
  $('[data-a=flow]', box).onclick = () => (state.flow ? stopFlow() : startFlow());
}
const fmtH = (x) => String(x).padStart(2, '0') + ':00';
function toggleVisible(id) { state.visible.has(id) ? state.visible.delete(id) : state.visible.add(id); afterVis(); }
function afterVis() { store.set('visible', [...state.visible]); renderChannels(); updatePoints(); updateLines(); }

function renderCategories() {
  const box = $('#pane-cats');
  box.innerHTML = '<p class="hint">Classical point groups show how points relate across channels. Select a group to light it up on the body.</p>';
  let group = '';
  for (const k of CAT_ORDER) {
    const c = CATEGORIES[k];
    if (c.group !== group) { group = c.group; box.appendChild(h('h4', {}, esc(group))); }
    const e = h('div', { class: 'cat', 'data-k': k });
    e.innerHTML = `<div class="ct"><b>${esc(c.name)}</b><span class="n">${c.pts.length}</span></div><p>${esc(c.desc)}</p>`;
    e.onclick = () => {
      const on = e.classList.contains('on');
      clearHighlight(true);
      if (on) { updatePoints(); updateLines(); return; }
      e.classList.add('on');
      setHighlight(new Set(c.pts), c.name);
      showCategory(k);
    };
    box.appendChild(e);
  }
}
function showCategory(k) {
  const c = CATEGORIES[k];
  const rows = c.pts.map((code) => {
    const pt = BY[code]; if (!pt) return '';
    const role = c.map ? (MER[c.map[code]] ? MER[c.map[code]].name : c.map[code]) : MER[pt.mer].name;
    return `<tr data-code="${code}"><td><span class="chip" style="--c:${MER[pt.mer].color}">${code}</span></td><td>${esc(pt.py)}<small>${esc(pt.en)}</small></td><td class="muted">${esc(role)}</td></tr>`;
  }).join('');
  openDetail(`<div class="dh"><div class="kicker">${esc(c.group)}</div><h2>${esc(c.name)}</h2></div><p>${esc(c.desc)}</p><table class="ptable">${rows}</table>`);
  $$('#detail tr[data-code]').forEach((tr) => (tr.onclick = () => selectPoint(BY[tr.dataset.code], { keepHighlight: true })));
}

function renderVessels() {
  const box = $('#pane-vessels');
  box.innerHTML = '<p class="hint">The eight extraordinary vessels act as reservoirs linking the twelve channels. Ren and Du have their own points; the other six travel through points of other channels.</p>';
  const list = [{ id: 'CV', name: 'Ren Mai', en: 'Conception Vessel', zh: '任脉', color: MER.CV.color, opening: 'LU7', couple: 'KI6' }, { id: 'GV', name: 'Du Mai', en: 'Governing Vessel', zh: '督脉', color: MER.GV.color, opening: 'SI3', couple: 'BL62' }, ...VESSELS];
  for (const vs of list) {
    const e = h('div', { class: 'vs', 'data-id': vs.id });
    e.innerHTML = `<span class="sw" style="background:${vs.color}"></span><div><b>${esc(vs.name)}</b> <span class="zh">${vs.zh}</span><small>${esc(vs.en)} · opens at ${vs.opening}, paired with ${vs.couple}</small></div>`;
    e.onclick = () => {
      if (vs.id === 'CV' || vs.id === 'GV') { clearHighlight(true); selectMeridian(vs.id); return; }
      const on = e.classList.contains('on');
      clearHighlight(true);
      if (on) { updatePoints(); updateLines(); return; }
      e.classList.add('on');
      setHighlight(new Set([...vs.pts, vs.opening, vs.couple]), vs.name);
      state.vessel = vs.id; updateLines();
      showVessel(vs);
      view('front');
    };
    box.appendChild(e);
  }
}
function showVessel(vs) {
  const chips = vs.pts.map((c) => chip(c)).join('');
  openDetail(`<div class="dh"><div class="kicker">Extraordinary vessel</div><h2>${esc(vs.name)} <span class="zh">${vs.zh}</span></h2><div class="sub">${esc(vs.en)}</div></div>
    <p>${esc(vs.desc)}</p>
    <h4>Opening (confluent) point</h4><div class="chips">${chip(vs.opening)} <span class="muted">paired with</span> ${chip(vs.couple)}</div>
    <h4>Pathway — crossing points</h4><div class="chips">${chips}</div>
    <p class="muted small">The dashed line traces the vessel through its crossing points on both sides of the body.</p>`);
  bindChips($('#detail'));
}

// five phases + clock
function renderPhases() {
  const box = $('#pane-phases');
  const R = 92, cx = 130, cy = 122;
  const pos = ELEMENTS.map((e, i) => { const a = -Math.PI / 2 + ((i - 1) * 2 * Math.PI) / 5; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  // order in ELEMENTS: Wood, Fire, Earth, Metal, Water; Fire at top
  let svg = `<svg viewBox="0 0 260 245" class="phases"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#8b93a3"/></marker><marker id="ah2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#5d6472"/></marker></defs>`;
  const shrink = (a, b, r) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); return [a[0] + (dx / L) * r, a[1] + (dy / L) * r, b[0] - (dx / L) * r, b[1] - (dy / L) * r]; };
  for (let i = 0; i < 5; i++) { const [x1, y1, x2, y2] = shrink(pos[i], pos[(i + 1) % 5], 30); svg += `<path d="M${x1},${y1} Q${(x1 + x2) / 2 + (cx - (x1 + x2) / 2) * -0.25},${(y1 + y2) / 2 + (cy - (y1 + y2) / 2) * -0.25} ${x2},${y2}" stroke="#8b93a3" stroke-width="1.4" fill="none" marker-end="url(#ah)"/>`; }
  for (let i = 0; i < 5; i++) { const [x1, y1, x2, y2] = shrink(pos[i], pos[(i + 2) % 5], 30); svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#5d6472" stroke-width="1" stroke-dasharray="3 3" marker-end="url(#ah2)"/>`; }
  ELEMENTS.forEach((e, i) => { const [x, y] = pos[i]; const inf = EL_INFO[e]; svg += `<g class="elnode" data-el="${e}" transform="translate(${x},${y})"><circle r="27" fill="${inf.color}22" stroke="${inf.color}" stroke-width="1.5"/><text y="-2" text-anchor="middle" class="elzh" fill="${inf.color}">${inf.zh}</text><text y="13" text-anchor="middle" class="eln">${e}</text></g>`; });
  svg += '</svg>';
  box.innerHTML = `<p class="hint">Solid arrows: generating (sheng) cycle. Dashed: controlling (ke) cycle. Select a phase.</p>${svg}<div id="elinfo"></div>
    <h4>Chinese clock (horary cycle)</h4><p class="hint">Qi is said to peak in each channel for two hours. Click a segment to open the channel, or play the circulation.</p>
    <div id="clockbox"></div><div class="row-actions"><button class="accent" id="flowbtn2">▶ Animate Qi circulation</button></div>`;
  $$('.elnode', box).forEach((g) => (g.onclick = () => selectElement(g.dataset.el)));
  $('#flowbtn2').onclick = () => (state.flow ? stopFlow() : startFlow());
  renderClock();
}
function selectElement(el) {
  const inf = EL_INFO[el];
  $$('.elnode').forEach((g) => g.classList.toggle('on', g.dataset.el === el));
  const set = new Set();
  inf.organs.forEach((o) => MER[o].points.forEach((p) => set.add(p.code)));
  setHighlight(set, `${el} phase channels`);
  // phase points among five-shu
  const shuPts = [];
  for (const id in FIVE_SHU) FIVE_SHU[id].forEach((n, i) => { if (shuElement(id, SHU_KEYS[i]) === el) shuPts.push(id + n); });
  const html = `<div class="dh"><div class="kicker">Five phases · 五行</div><h2 style="color:${inf.color}">${el} <span class="zh">${inf.zh}</span></h2></div>
    <table class="kv"><tr><td>Channels</td><td>${inf.organs.map((o) => `<span class="chip m" data-m="${o}" style="--c:${MER[o].color}">${o} ${MER[o].name}</span>`).join(' ')}</td></tr>
    <tr><td>Season</td><td>${inf.season}</td></tr><tr><td>Climate</td><td>${inf.climate}</td></tr><tr><td>Sense organ</td><td>${inf.sense}</td></tr><tr><td>Tissue</td><td>${inf.tissue}</td></tr><tr><td>Emotion</td><td>${inf.emotion}</td></tr><tr><td>Colour · taste</td><td>${inf.colour} · ${inf.taste}</td></tr>
    <tr><td>Generates</td><td>${son(el)} <span class="muted">(mother of ${son(el)})</span></td></tr><tr><td>Generated by</td><td>${mother(el)}</td></tr><tr><td>Controls</td><td>${ELEMENTS[(ELEMENTS.indexOf(el) + 2) % 5]}</td></tr><tr><td>Controlled by</td><td>${ELEMENTS[(ELEMENTS.indexOf(el) + 3) % 5]}</td></tr></table>
    <h4>${el} points of the Five-Shu system</h4><p class="muted small">Every channel has one transporting point of each phase. These are the ${el.toLowerCase()} points:</p><div class="chips">${shuPts.map(chip).join('')}</div>
    <button class="ghost" id="hlshu">Highlight only these ${shuPts.length} points</button>`;
  openDetail(html);
  bindChips($('#detail'));
  $('#hlshu').onclick = () => setHighlight(new Set(shuPts), `${el} Five-Shu points`);
}
let clockHand = null;
function renderClock() {
  const box = $('#clockbox'); if (!box) return;
  const cx = 120, cy = 120, R1 = 110, R0 = 62;
  let s = '<svg viewBox="0 0 240 240" class="clock">';
  FLOW.forEach((id) => {
    const m = MER[id];
    const a0 = ((m.time[0] % 24) / 24) * 2 * Math.PI - Math.PI / 2, a1 = a0 + (2 / 24) * 2 * Math.PI;
    const p = (r, a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    const am = (a0 + a1) / 2;
    const cur = state.flow && state.flow.cur === id;
    s += `<g class="cseg${cur ? ' on' : ''}" data-m="${id}"><path d="M${p(R0, a0)} L${p(R1, a0)} A${R1},${R1} 0 0 1 ${p(R1, a1)} L${p(R0, a1)} A${R0},${R0} 0 0 0 ${p(R0, a0)}Z" fill="${m.color}${cur ? 'cc' : '33'}" stroke="#0d0f13" stroke-width="2"/><text x="${cx + 86 * Math.cos(am)}" y="${cy + 86 * Math.sin(am) + 4}" text-anchor="middle">${id}</text></g>`;
  });
  for (let hr = 0; hr < 24; hr += 6) { const a = (hr / 24) * 2 * Math.PI - Math.PI / 2; s += `<text class="hr" x="${cx + 48 * Math.cos(a)}" y="${cy + 48 * Math.sin(a) + 3}" text-anchor="middle">${hr}h</text>`; }
  s += `<line id="hand" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 100}" stroke="#e3b36a" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="4" fill="#e3b36a"/></svg>`;
  box.innerHTML = s;
  clockHand = $('#hand', box);
  $$('.cseg', box).forEach((g) => (g.onclick = () => selectMeridian(g.dataset.m)));
  const now = new Date();
  setClockHand(state.flow ? MER[state.flow.cur].time[0] : now.getHours() + now.getMinutes() / 60);
}
function setClockHand(hr) {
  const a = ((hr % 24) / 24) * 360;
  if (clockHand) clockHand.setAttribute('transform', `rotate(${a} 120 120)`);
  const fp = $('#flowpanel');
  if (state.flow && fp) {
    const m = MER[state.flow.cur];
    $('.fpm', fp).innerHTML = `<span class="dot" style="background:${m.color}"></span>${m.name} <span class="muted">${fmtH(m.time[0])}–${fmtH(m.time[1])}</span>`;
    $('.fpt', fp).textContent = `${String(Math.floor(hr % 24)).padStart(2, '0')}:${String(Math.floor((hr % 1) * 60)).padStart(2, '0')}`;
  }
}

// ------------------------------------------------------------------ search
function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s\-']/g, ''); }
PTS.forEach(() => {});
function search(q) {
  const nq = norm(q);
  if (!nq) return [];
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const res = [];
  for (const pt of PTS) {
    let score = 0, why = '';
    const code = norm(pt.code);
    if (code === nq || code.replace('ex', '') === nq) score = 100;
    else if (code.startsWith(nq) && nq.length >= 2) score = 60;
    else if (norm(pt.py) === nq) score = 90;
    else if (norm(pt.py).startsWith(nq)) score = 70;
    else if (pt.zh.includes(q.trim())) score = 80;
    else if (norm(pt.en).includes(nq)) score = 50;
    else if (words.length) {
      const text = (pt.ind + ' ' + pt.act + ' ' + pt.loc).toLowerCase();
      const hit = words.filter((w) => text.includes(w));
      if (hit.length === words.length) { score = 20 + (pt.ind.toLowerCase().includes(words[0]) ? 10 : 0); why = 'matches “' + hit.join(' ') + '”'; }
    }
    if (score) res.push({ pt, score, why });
  }
  return res.sort((a, b) => b.score - a.score || PTS.indexOf(a.pt) - PTS.indexOf(b.pt));
}
function initSearch() {
  const inp = $('#search'), out = $('#results');
  let last = [];
  const run = () => {
    const q = inp.value.trim();
    last = search(q);
    if (!q) { out.classList.remove('on'); out.innerHTML = ''; return; }
    out.classList.add('on');
    const symptom = last.length > 3 && last[0].score <= 30;
    out.innerHTML = (last.length ? '' : '<div class="none">No points found. Try a code (LI4), a pinyin name (Hegu), an English name or a symptom (insomnia).</div>') +
      (symptom ? `<button class="hlall">Highlight all ${last.length} matching points on the body</button>` : '') +
      last.slice(0, 40).map((r, i) => `<div class="res" data-i="${i}"><span class="chip" style="--c:${MER[r.pt.mer].color}">${r.pt.code}</span><div><b>${esc(r.pt.py)}</b> <span class="zh">${r.pt.zh}</span><small>${esc(r.pt.en)}${r.why ? ' · ' + esc(r.why) : ''}</small></div></div>`).join('');
    $$('.res', out).forEach((e) => (e.onclick = () => { selectPoint(last[+e.dataset.i].pt); if (innerWidth < 900) out.classList.remove('on'); }));
    const b = $('.hlall', out); if (b) b.onclick = () => { setHighlight(new Set(last.map((r) => r.pt.code)), `Search: ${q}`); out.classList.remove('on'); };
  };
  inp.addEventListener('input', run);
  inp.addEventListener('focus', run);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && last[0]) { selectPoint(last[0].pt); out.classList.remove('on'); inp.blur(); } if (e.key === 'Escape') { inp.value = ''; run(); inp.blur(); } });
  document.addEventListener('pointerdown', (e) => { if (!out.contains(e.target) && e.target !== inp) out.classList.remove('on'); });
}

// ------------------------------------------------------------------ detail panel
function openDetail(html) {
  const d = $('#detail');
  $('.dbody', d).innerHTML = html;
  $('.dbody', d).scrollTop = 0;
  if (!d.classList.contains('on') || !d.dataset.snap) d.dataset.snap = 'half';
  document.body.dataset.snap = d.dataset.snap;
  d.classList.add('on');
  document.body.classList.add('detail-on');
  closeDrawer(); closePops();
  setTimeout(resize, 270);
}
function setSnap(snap) {
  const d = $('#detail');
  d.dataset.snap = snap;
  document.body.dataset.snap = snap;
  setTimeout(resize, 270);
}
function initSheet() {
  const d = $('#detail');
  const start = (e) => {
    if (!isSheet() || !d.classList.contains('on')) return;
    if (e.target.closest('button, .chip, a, input, select')) return;
    sheetDrag = { y: e.clientY, h: d.getBoundingClientRect().height, t: performance.now(), moved: false, id: e.pointerId, grab: !!e.target.closest('.grab') };
    d.style.transition = 'none';
  };
  const move = (e) => {
    if (!sheetDrag || e.pointerId !== sheetDrag.id) return;
    const dy = e.clientY - sheetDrag.y;
    if (!sheetDrag.moved && Math.abs(dy) < 6) return;
    if (!sheetDrag.moved) { sheetDrag.moved = true; try { e.target.setPointerCapture && $('.grab', d).setPointerCapture(e.pointerId); } catch {} }
    const maxH = innerHeight - 52 - 120;
    d.style.height = Math.max(70, Math.min(maxH, sheetDrag.h - dy)) + 'px';
    e.preventDefault();
  };
  const end = (e) => {
    if (!sheetDrag || e.pointerId !== sheetDrag.id) return;
    const sd = sheetDrag; sheetDrag = null;
    d.style.transition = '';
    if (!sd.moved) { d.style.height = ''; if (sd.grab) setSnap(d.dataset.snap === 'half' ? 'full' : d.dataset.snap === 'full' ? 'peek' : 'half'); return; }
    const h = d.getBoundingClientRect().height, dy = e.clientY - sd.y, v = dy / Math.max(1, performance.now() - sd.t);
    d.style.height = '';
    const H = innerHeight;
    if (h < 90 && dy > 0) { closeDetail(); return; }
    const snaps = [['peek', 128], ['half', H * 0.5], ['full', H - 52 - 130]];
    let pick;
    if (Math.abs(v) > 0.6) { const cur = snaps.findIndex((x) => x[0] === d.dataset.snap); pick = snaps[Math.max(0, Math.min(2, cur + (v < 0 ? 1 : -1)))][0]; if (v > 0 && d.dataset.snap === 'peek') { closeDetail(); return; } }
    else pick = snaps.reduce((a, b) => (Math.abs(b[1] - h) < Math.abs(a[1] - h) ? b : a))[0];
    setSnap(pick);
  };
  // drag from the handle, or from the header while the content is scrolled to the top
  d.addEventListener('pointerdown', (e) => { if (e.target.closest('.grab')) start(e); });
  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', (e) => { if (sheetDrag && e.pointerId === sheetDrag.id) { sheetDrag = null; d.style.transition = ''; d.style.height = ''; resize(); } });
}
function closeDrawer() { document.body.classList.remove('side-open'); }
function closePops() { $$('.pop.open').forEach((p) => p.classList.remove('open')); $$('[data-pop]').forEach((b) => b.classList.remove('on')); }
function closeDetail() {
  $('#detail').classList.remove('on');
  $('#detail').style.height = '';
  document.body.classList.remove('detail-on');
  state.selected = null; state.focusMer = null;
  if (rulerSrc && rulerSrc.point) { clearRulers(); updateLandmarks(); }
  clearNeedle();
  if (!state.quiz) history.replaceState(null, '', location.pathname + location.search);
  $$('.mrow.on').forEach((e) => e.classList.remove('on'));
  updatePoints(); updateLines();
  setTimeout(resize, 260);
}
const chip = (code) => { const pt = BY[code]; if (!pt) return ''; return `<span class="chip p" data-code="${code}" style="--c:${MER[pt.mer].color}" title="${esc(pt.py)} · ${esc(pt.en)}">${code}</span>`; };
function bindChips(root) {
  $$('.chip.p', root).forEach((c) => (c.onclick = () => selectPoint(BY[c.dataset.code], { keepHighlight: true })));
  $$('.chip.m', root).forEach((c) => (c.onclick = () => selectMeridian(c.dataset.m)));
  $$('.chip.cat', root).forEach((c) => (c.onclick = () => { const k = c.dataset.k; clearHighlight(true); $$(`.cat[data-k=${k}]`).forEach((e) => e.classList.add('on')); setHighlight(new Set(CATEGORIES[k].pts), CATEGORIES[k].name); }));
}
function organOf(code) {
  for (const k of ['mu', 'shu', 'lowerhe']) if (CATEGORIES[k].map[code]) return CATEGORIES[k].map[code];
  return null;
}
function organSet(org) {
  const o = { yuan: null, luo: null, xi: null, mu: null, shu: null, he: null };
  const m = MER[org];
  for (const p of m.points) { if (p.cats.includes('yuan')) o.yuan = p.code; if (p.cats.includes('luo') && p.code !== 'SP21') o.luo = p.code; if (p.cats.includes('xi')) o.xi = p.code; }
  for (const k of ['mu', 'shu', 'lowerhe']) for (const c in CATEGORIES[k].map) if (CATEGORIES[k].map[c] === org) o[k === 'lowerhe' ? 'he' : k] = c;
  return o;
}
function catRole(pt, k) {
  const c = CATEGORIES[k];
  const m = MER[pt.mer];
  if (k === 'mu') return `Front-Mu point of the ${MER[c.map[pt.code]].name}`;
  if (k === 'shu') return `Back-Shu point of the ${MER[c.map[pt.code]].name}`;
  if (k === 'lowerhe') return `Lower He-Sea point of the ${MER[c.map[pt.code]].name}`;
  if (k === 'influential') return `Hui-Meeting point of the ${c.map[pt.code]}`;
  if (k === 'confluent') return `Opening point of the ${c.map[pt.code]}`;
  if (k === 'command') return `Command point of the ${c.map[pt.code].toLowerCase()}`;
  if (k === 'seas') return `Point of the ${c.map[pt.code]}`;
  if (k === 'yuan') return `Yuan-Source point of the ${m.name}`;
  if (k === 'luo') return pt.code === 'SP21' ? 'Great Luo of the Spleen' : `Luo-Connecting point of the ${m.name}`;
  if (k === 'xi') return { KI8: 'Xi-Cleft of the Yin Qiao Mai', BL59: 'Xi-Cleft of the Yang Qiao Mai', KI9: 'Xi-Cleft of the Yin Wei Mai', GB35: 'Xi-Cleft of the Yang Wei Mai' }[pt.code] || `Xi-Cleft point of the ${m.name}`;
  if (SHU_KEYS.includes(k)) return `${FIVE_SHU_NAMES[k]} point · ${shuElement(pt.mer, k)} phase`;
  if (k === 'tonify') return `Tonification point (${mother(m.el)} is the mother of ${m.el})`;
  if (k === 'sedate') return `Sedation point (${son(m.el)} is the son of ${m.el})`;
  if (k === 'horary') return `Horary point (${m.el} point of a ${m.el} channel)`;
  if (k === 'entry') return `Entry point of the ${m.name} channel`;
  if (k === 'exit') return `Exit point of the ${m.name} channel`;
  return c.name;
}
const DANGER = [[/medulla/i, 'Medulla'], [/trachea|aortic/i, 'Trachea · aorta'], [/spinal cord/i, 'Spinal cord'], [/heart/i, 'Heart'], [/lung/i, 'Lung'], [/kidney/i, 'Kidney'], [/liver|spleen/i, 'Liver / spleen'], [/carotid|jugular|subclavian|femoral|axillary|brachial|radial artery|ulnar artery|popliteal|dorsalis|tibial artery|facial artery|temporal artery|artery/i, 'Artery'], [/nerve/i, 'Nerve'], [/eye|orbit/i, 'Eyeball'], [/bladder/i, 'Bladder'], [/rectum/i, 'Rectum'], [/trachea|aortic/i, 'Trachea · aorta']];
function dangerOf(d) { if (!d || !d.caution) return null; for (const [re, l] of DANGER) if (re.test(d.caution)) return l; return null; }
function fmtCun(d) { return d.min === d.max ? `${d.min} cun` : `${d.min}–${d.max} cun`; }
function fmtCm(d) { const a = cm(d.min), b = cm(d.max); return a === b ? `≈ ${a}` : `≈ ${a.replace(/ (cm|mm)$/, (m, u) => (b.endsWith(u) ? '' : m))}–${b}`; }
function depthSVG(d, code) {
  const W = 300, H = 172, sy = 44;
  let g = `<svg viewBox="0 0 ${W} ${H}" class="xsec" role="img" aria-label="Cross-section showing needle angle and depth">
  <defs><linearGradient id="mus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2a2a"/><stop offset="1" stop-color="#3a1c20"/></linearGradient></defs>
  <rect x="0" y="${sy}" width="${W}" height="${H - sy}" fill="url(#mus)"/>
  <rect x="0" y="${sy}" width="${W}" height="16" fill="#7a5a45"/><rect x="0" y="${sy}" width="${W}" height="4" fill="#d8a989"/>
  <g stroke="#6d3036" stroke-width="1" opacity=".7">${[82, 100, 118, 136].map((y) => `<path d="M0 ${y} Q75 ${y - 5} 150 ${y} T300 ${y}"/>`).join('')}</g>
  <text x="${W - 6}" y="${sy - 5}" class="xl" text-anchor="end">skin</text><text x="${W - 6}" y="${sy + 13}" class="xl dim" text-anchor="end">fat</text><text x="${W - 6}" y="${sy + 34}" class="xl dim" text-anchor="end">muscle</text>`;
  if (d.a === 'MX' || d.a === 'NO') {
    const x = 150;
    if (d.a === 'MX') g += `<path d="M${x - 14} ${sy} L${x} ${sy - 26} L${x + 14} ${sy}Z" fill="#c7a36b" stroke="#8a6d3f"/><path d="M${x} ${sy - 28} q-6 -6 0 -12 q6 -6 0 -12" stroke="#9aa3b2" fill="none" opacity=".7"/><text x="${x}" y="${H - 10}" class="xl" text-anchor="middle">moxa on the skin — no needle</text>`;
    else g += `<g stroke="#ff6b6b" stroke-width="3"><line x1="${x - 18}" y1="${sy - 30}" x2="${x + 18}" y2="${sy + 6}"/><line x1="${x + 18}" y1="${sy - 30}" x2="${x - 18}" y2="${sy + 6}"/></g><text x="${x}" y="${H - 10}" class="xl" text-anchor="middle">do not needle</text>`;
    return g + '</svg>';
  }
  const deg = d.a === 'PR' ? 90 : d.deg, th = (deg * Math.PI) / 180;
  const maxV = Math.max(0.1, d.max * Math.sin(th));
  const pxc = Math.min(70, 90 / maxV);
  const x0 = deg >= 80 ? 120 : deg > 30 ? 95 : 40;
  const ux = Math.cos(th), uy = Math.sin(th);
  let P = (c) => [x0 + ux * c * pxc, sy + uy * c * pxc];
  if (code === 'CV22') { const kx = x0, ky = sy + 0.2 * pxc * 0.8; P = (c) => [kx + c * pxc * 0.55, ky + c * pxc * 0.45]; }
  const [tx, ty] = P(d.max), [mx, my] = P(d.min);
  const danger = dangerOf(d);
  if (danger && d.a !== 'PR') { const bx = Math.max(4, Math.min(W - 100, tx - 48)), by = Math.min(H - 19, ty + 24); g += `<line x1="${tx}" y1="${ty + 3}" x2="${tx}" y2="${by}" stroke="#ff6b6b" stroke-dasharray="2 2"/><rect x="${bx}" y="${by}" width="96" height="16" rx="8" fill="#3a1418" stroke="#ff6b6b" stroke-dasharray="4 3"/><text x="${bx + 48}" y="${by + 11.5}" class="xl warnc" text-anchor="middle">${danger}</text>`; }
  // outside shaft + handle
  const ox = x0 - ux * 16, oy = sy - uy * 16, hx = x0 - ux * 50, hy = sy - uy * 50;
  g += `<line x1="${x0}" y1="${sy}" x2="${ox}" y2="${oy}" stroke="#d9dde6" stroke-width="1.6"/><line x1="${ox}" y1="${oy}" x2="${hx}" y2="${hy}" stroke="#c99a4b" stroke-width="5" stroke-linecap="round"/>`;
  if (code === 'CV22') { const [kx, ky] = P(0); g += `<line x1="${x0}" y1="${sy}" x2="${kx}" y2="${ky}" stroke="#d9dde6" stroke-width="1.6"/><text x="${kx - 6}" y="${ky + 4}" class="xl dim" text-anchor="end">0.2 cun, then down</text>`; }
  g += `<line x1="${code === 'CV22' ? P(0)[0] : x0}" y1="${code === 'CV22' ? P(0)[1] : sy}" x2="${mx}" y2="${my}" stroke="#d9dde6" stroke-width="1.6"/><line x1="${mx}" y1="${my}" x2="${tx}" y2="${ty}" stroke="#ffc35c" stroke-width="4" stroke-linecap="round"/><circle cx="${tx}" cy="${ty}" r="2" fill="#fff"/>`;
  if (deg < 85) { const r = 26; g += `<path d="M${x0 + r} ${sy} A${r} ${r} 0 0 1 ${x0 + r * ux} ${sy + r * uy}" fill="none" stroke="#e3b36a" stroke-dasharray="2 2"/><text x="${x0 + r + 4}" y="${sy + 14}" class="xl acc">${deg}°</text>`; }
  else g += `<text x="${x0 + 8}" y="${sy + 14}" class="xl acc">90°</text>`;
  const lx = Math.min(W - 92, Math.max(tx, mx) + 10);
  if (d.a !== 'PR') g += `<line x1="${tx}" y1="${ty}" x2="${lx - 2}" y2="${ty}" stroke="#ffc35c" stroke-width=".8" stroke-dasharray="2 2"/><text x="${lx}" y="${ty + 4}" class="xl acc">${fmtCun(d)}</text><text x="${lx}" y="${ty + 16}" class="xl dim">${fmtCm(d)}</text>`;
  else g += `<text x="${x0 + 12}" y="${sy + 30}" class="xl acc">≈ 0.1 cun (2 mm)</text>`;
  return g + '</svg>';
}
function depthHTML(pt) {
  const d = DEPTH[pt.code];
  if (!d) return '';
  const needle = !['MX', 'NO'].includes(d.a);
  const angle = ['PR', 'SP', 'MX', 'NO'].includes(d.a) ? d.name : `${d.name} · ${d.deg}°`;
  const depth = ['MX', 'NO'].includes(d.a) ? '' : d.a === 'PR' ? '<span class="dep">0.1 cun <small>≈ 2 mm</small></span>' : `<span class="dep">${fmtCun(d)} <small>${fmtCm(d)}</small></span>`;
  return `<div class="needlebox"><h4>Needling angle &amp; depth</h4>
    <div class="nhead"><span class="abadge a-${d.a}">${angle}</span>${depth}</div>
    ${depthSVG(d, pt.code)}
    <p class="ndesc">${d.a === 'SP' ? 'Needled only with a special, cautious technique' : esc(d.desc.charAt(0).toUpperCase() + d.desc.slice(1))}${d.dir ? `: <b>${esc(d.dir)}</b>` : ''}.</p>
    ${d.caution ? `<div class="ncaut"><b>${['MX', 'NO'].includes(d.a) ? 'Note' : 'Caution'}:</b> ${esc(d.caution)}.</div>` : ''}
    ${needle ? `<div class="row-actions"><button class="accent" id="n-side">See the angle from the side</button><button id="n-toggle">${needleHidden ? 'Show' : 'Hide'} needle</button></div>` : ''}
    <p class="small muted gnote">Typical depth for an average adult from standard textbooks (1 cun ≈ the patient's thumb width, about 2–2.5 cm). Go shallower on thin people, children and the elderly, and over the chest and back. For study only — needling requires professional training.</p></div>`;
}
function guideHTML(pt) {
  const g = guideFor(M, pt, { BY, chip });
  const has = g.rulers.length > 0, lm = g.near.length > 0;
  const what = has ? (lm ? 'ruler and landmarks' : 'ruler') : 'landmarks';
  const btns = has || lm ? `<div class="row-actions"><button class="accent" id="g-fit" title="Zooms the camera out so the whole ${what} and the point fit on screen">Zoom out to see the ${what}</button>${has ? `<button id="g-toggle">${rulerHidden ? 'Show' : 'Hide'} ruler</button>` : ''}<button id="g-point" title="Zooms back in on the point">Back to point</button></div>
    <p class="small muted gnote">${has ? 'The white ruler is drawn on the body with a tick every cun; the gold part is the distance you measure to reach the point.' : 'White diamonds mark the bony landmarks used to find this point.'}</p>` : '';
  return `<div class="howto"><h4>How to find it</h4><ol class="steps">${g.steps.map((x) => `<li>${x}</li>`).join('')}</ol>${btns}</div>`;
}
function pointHTML(pt) {
  const m = MER[pt.mer];
  const idx = m.points.indexOf(pt);
  const prev = m.points[idx - 1], next = m.points[idx + 1];
  const cats = pt.cats.map((k) => `<li><span class="chip cat" data-k="${k}">${esc(CATEGORIES[k].name)}</span> ${esc(catRole(pt, k))}</li>`).join('');
  // connections
  const conns = [];
  if (pt.cats.includes('luo') && m.partner && pt.code !== 'SP21' && MER[m.partner].points) {
    const y = organSet(m.partner).yuan; if (y) conns.push(`<li>Guest–host: combine with ${chip(y)}, the Yuan point of its paired channel (${MER[m.partner].name}).</li>`);
  }
  if (pt.cats.includes('yuan') && m.partner) { const l = organSet(m.partner).luo; if (l) conns.push(`<li>Host–guest: combine with ${chip(l)}, the Luo point of the paired ${MER[m.partner].name} channel.</li>`); }
  if (pt.cats.includes('confluent')) { const map = { SP4: 'PC6', PC6: 'SP4', SI3: 'BL62', BL62: 'SI3', LU7: 'KI6', KI6: 'LU7', GB41: 'SJ5', SJ5: 'GB41' }; conns.push(`<li>Classical extraordinary-vessel pair: ${chip(pt.code)} + ${chip(map[pt.code])}.</li>`); }
  const org = organOf(pt.code) || (['yuan', 'luo', 'xi'].some((k) => pt.cats.includes(k)) && pt.mer !== 'CV' && pt.mer !== 'GV' && pt.code !== 'SP21' ? pt.mer : null);
  if (org && MER[org].points) {
    const o = organSet(org);
    const items = [['Yuan', o.yuan], ['Luo', o.luo], ['Xi', o.xi], ['Front-Mu', o.mu], ['Back-Shu', o.shu], ['Lower He', o.he]].filter((x) => x[1] && x[1] !== pt.code);
    conns.push(`<li>Key points of the ${MER[org].name}: ${items.map(([n, c]) => `<span class="muted">${n}</span> ${chip(c)}`).join(' ')}</li>`);
  }
  if (CROSSINGS[pt.code]) conns.push(`<li>Crossing point: meets the ${esc(CROSSINGS[pt.code])} ${CROSSINGS[pt.code].includes(',') ? 'channels/vessels' : 'channel/vessel'}.</li>`);
  if (pt.vessels) pt.vessels.forEach((id) => { const vs = VESSELS.find((x) => x.id === id); conns.push(`<li>Lies on the pathway of the <a href="#" class="vlink" data-v="${id}">${vs.name}</a>.</li>`); });
  const shuK = SHU_KEYS.find((k) => pt.cats.includes(k));
  if (shuK) {
    const el = shuElement(pt.mer, shuK);
    const sibs = FIVE_SHU[pt.mer].map((n) => m.id + n).filter((c) => c !== pt.code);
    conns.push(`<li>Other transporting points of this channel: ${sibs.map(chip).join(' ')}</li>`);
    conns.push(`<li>Phase: <b style="color:${EL_INFO[el].color}">${el}</b> on a ${m.el} channel.</li>`);
  }
  const side = pt.bil ? 'Bilateral (both sides of the body)' : (pt.inst.length > 1 ? `${pt.inst.length} points` : 'Single point on the midline');
  return `<div class="dh"><div class="kicker"><span class="chip m" data-m="${m.id}" style="--c:${m.color}">${m.id === 'EX' ? 'Extra point' : m.name + ' channel'}</span> ${m.id !== 'EX' ? `point ${pt.n} of ${m.points.length}` : esc(pt.region || '')}</div>
    <h2><span class="code" style="color:${m.color}">${pt.code}</span> ${esc(pt.py)} <span class="zh">${pt.zh}</span></h2><div class="sub">${esc(pt.en)}</div></div>
    <div class="nav">${prev ? `<button data-code="${prev.code}">‹ ${prev.code}</button>` : '<span></span>'}<span class="muted small">${side}</span>${next ? `<button data-code="${next.code}">${next.code} ›</button>` : '<span></span>'}</div>
    <h4>Location</h4><p>${esc(pt.loc)}</p>
    ${guideHTML(pt)}
    ${depthHTML(pt)}
    ${pt.act ? `<h4>Actions</h4><p>${esc(pt.act)}</p>` : ''}
    <h4>Indications</h4><p>${esc(pt.ind)}</p>
    ${cats ? `<h4>Classical categories</h4><ul class="cats">${cats}</ul>` : ''}
    ${conns.length ? `<h4>Connections</h4><ul class="conns">${conns.join('')}</ul>` : ''}
    <p class="disclaimer">For study only. Locations are shown on a stylised model using proportional (cun) measurement and are approximate. Needling should only be performed by a trained practitioner.</p>`;
}
function selectPoint(pt, opts = {}) {
  if (!pt) return;
  if (state.flow) stopFlow();
  if (!opts.keepHighlight) clearHighlight(true);
  state.selected = pt;
  state.focusMer = null;
  if (!state.visible.has(pt.mer)) { state.visible.add(pt.mer); afterVis(); }
  $$('.mrow').forEach((e) => e.classList.toggle('on', e.dataset.id === pt.mer));
  openDetail(pointHTML(pt));
  const d = $('#detail');
  bindChips(d);
  $$('.nav button', d).forEach((b) => (b.onclick = () => selectPoint(BY[b.dataset.code], { keepHighlight: true })));
  $$('.vlink', d).forEach((a) => (a.onclick = (e) => { e.preventDefault(); $(`.vs[data-id=${a.dataset.v}]`).click(); }));
  if (!opts.noFly) flyToPoint(pt);
  if (!rulerHidden) showGuideFor(pt); else { clearRulers(); updateLandmarks(); }
  const gf = $('#g-fit', d); if (gf) gf.onclick = () => { if (rulerHidden) { rulerHidden = false; showGuideFor(pt); const t = $('#g-toggle', d); if (t) t.textContent = 'Hide ruler'; } frameRulers(bestInst(pt).p); };
  const gt = $('#g-toggle', d); if (gt) gt.onclick = () => { rulerHidden = !rulerHidden; gt.textContent = rulerHidden ? 'Show ruler' : 'Hide ruler'; if (rulerHidden) { clearRulers(); updateLandmarks(); } else showGuideFor(pt); };
  const gp = $('#g-point', d); if (gp) gp.onclick = () => flyToPoint(pt);
  if (!needleHidden) showNeedle(pt); else clearNeedle();
  const ns = $('#n-side', d); if (ns) ns.onclick = () => { if (needleHidden) { needleHidden = false; store.set('needleHidden', false); showNeedle(pt); const t = $('#n-toggle', d); if (t) t.textContent = 'Hide needle'; } sideViewNeedle(); };
  const nt = $('#n-toggle', d); if (nt) nt.onclick = () => { needleHidden = !needleHidden; store.set('needleHidden', needleHidden); nt.textContent = needleHidden ? 'Show needle' : 'Hide needle'; if (needleHidden) clearNeedle(); else showNeedle(pt); };
  if (!state.quiz) history.replaceState(null, '', '#' + pt.code);
  updatePoints(); updateLines();
}
function meridianHTML(m) {
  if (m.id === 'EX') {
    const groups = {};
    m.points.forEach((p) => (groups[p.region] = groups[p.region] || []).push(p));
    return `<div class="dh"><div class="kicker">Extra points</div><h2>${m.name} <span class="zh">${m.zh}</span></h2></div><p>${esc(m.path)}</p><p>${esc(m.fn)}</p>` +
      Object.keys(groups).map((g) => `<h4>${g}</h4><table class="ptable">${groups[g].map((p) => `<tr data-code="${p.code}"><td><span class="chip" style="--c:${m.color}">${p.code.replace('EX-', '')}</span></td><td>${esc(p.py)} <span class="zh">${p.zh}</span><small>${esc(p.en)}</small></td></tr>`).join('')}</table>`).join('');
  }
  const key = (k) => m.points.filter((p) => p.cats.includes(k)).map((p) => chip(p.code)).join(' ') || '<span class="muted">—</span>';
  const fi = FLOW.indexOf(m.id);
  const from = fi >= 0 ? FLOW[(fi + 11) % 12] : null, to = fi >= 0 ? FLOW[(fi + 1) % 12] : null;
  const o = fi >= 0 ? organSet(m.id) : null;
  return `<div class="dh"><div class="kicker">${m.limb !== 'Midline' ? `${m.limb} ${m.level} · ${m.yy}` : 'Extraordinary vessel with its own points'}</div>
    <h2><span class="code" style="color:${m.color}">${m.id}</span> ${esc(m.name)} <span class="zh">${m.zh}</span></h2><div class="sub">${esc(m.full)} · ${esc(m.py)}</div></div>
    <table class="kv">${m.el ? `<tr><td>Phase</td><td style="color:${EL_INFO[m.el].color}">${m.el} ${EL_INFO[m.el].zh}</td></tr>` : ''}
    <tr><td>Paired with</td><td><span class="chip m" data-m="${m.partner}" style="--c:${MER[m.partner].color}">${m.partner} ${MER[m.partner].name}</span></td></tr>
    ${m.time ? `<tr><td>Peak time</td><td>${fmtH(m.time[0])}–${fmtH(m.time[1])}</td></tr>` : ''}
    ${from ? `<tr><td>Qi flows</td><td><span class="chip m" data-m="${from}" style="--c:${MER[from].color}">${from}</span> → <b>${m.id}</b> → <span class="chip m" data-m="${to}" style="--c:${MER[to].color}">${to}</span></td></tr>` : ''}
    <tr><td>Points</td><td>${m.points.length}</td></tr></table>
    <h4>Pathway</h4><p>${esc(m.path)}</p><h4>Functions</h4><p>${esc(m.fn)}</p>
    ${o ? `<h4>Key points</h4><table class="kv"><tr><td>Yuan-Source</td><td>${key('yuan')}</td></tr><tr><td>Luo-Connecting</td><td>${key('luo')}</td></tr><tr><td>Xi-Cleft</td><td>${key('xi')}</td></tr><tr><td>Front-Mu</td><td>${chip(o.mu)}</td></tr><tr><td>Back-Shu</td><td>${chip(o.shu)}</td></tr>${o.he ? `<tr><td>Lower He-Sea</td><td>${chip(o.he)}</td></tr>` : ''}
      <tr><td>Five Shu</td><td>${FIVE_SHU[m.id].map((n, i) => `<span class="muted small">${FIVE_SHU_NAMES[SHU_KEYS[i]].split('-')[1]}</span> ${chip(m.id + n)}`).join(' ')}</td></tr>
      <tr><td>Tonify · Sedate</td><td>${key('tonify')} · ${key('sedate')}</td></tr></table>` : `<h4>Key points</h4><div class="chips">${m.points.filter((p) => p.cats.length).map((p) => chip(p.code)).join('')}</div>`}
    <h4>All points</h4><table class="ptable">${m.points.map((p) => `<tr data-code="${p.code}"><td><span class="chip" style="--c:${m.color}">${p.code}</span></td><td>${esc(p.py)} <span class="zh">${p.zh}</span><small>${esc(p.en)}</small></td></tr>`).join('')}</table>`;
}
const MER_VIEW = { LU: 'torso', LI: 'front', ST: 'front', SP: 'front', HT: 'front', SI: 'back', BL: 'back', KI: 'front', PC: 'front', SJ: 'back', GB: 'left', LR: 'front', CV: 'front', GV: 'back', EX: 'front' };
function selectMeridian(id) {
  if (state.flow) stopFlow();
  clearHighlight(true);
  state.focusMer = id; state.selected = null;
  if (rulerSrc && rulerSrc.point) { clearRulers(); updateLandmarks(); }
  clearNeedle();
  if (!state.visible.has(id)) { state.visible.add(id); afterVis(); }
  $$('.mrow').forEach((e) => e.classList.toggle('on', e.dataset.id === id));
  openDetail(meridianHTML(MER[id]));
  const d = $('#detail');
  bindChips(d);
  $$('tr[data-code]', d).forEach((tr) => (tr.onclick = () => selectPoint(BY[tr.dataset.code])));
  frameMeridian(id);
  if (!state.quiz) history.replaceState(null, '', '#' + id);
  updatePoints(); updateLines();
}

// ------------------------------------------------------------------ quiz
const KEY_CATS = ['yuan', 'luo', 'xi', 'mu', 'shu', 'command', 'star', 'influential', 'confluent', 'lowerhe'];
function quizPool(scope) {
  if (scope === 'key') return PTS.filter((p) => p.cats.some((k) => KEY_CATS.includes(k)));
  if (scope === 'visible') return PTS.filter((p) => state.visible.has(p.mer));
  if (MER[scope]) return MER[scope].points;
  return PTS;
}
function renderQuiz() {
  const box = $('#pane-quiz');
  const q = state.quiz;
  const best = store.get('best', {});
  box.innerHTML = `<p class="hint">Test yourself on the model. Your score is kept for this session.</p>
    <label class="fld">Mode<select id="qmode"><option value="name">Name the highlighted point</option><option value="find">Find the point on the body</option><option value="loc">Which point is described?</option></select></label>
    <label class="fld">Points<select id="qscope"><option value="key">Key points (Yuan, Luo, Xi, Mu, Shu, command…)</option><option value="visible">All visible channels</option><option value="all">All points</option>${ALLM.map((m) => `<option value="${m.id}">${m.id} · ${m.name}</option>`).join('')}</select></label>
    <div class="row-actions"><button class="accent" id="qstart">${q ? 'Restart' : 'Start quiz'}</button>${q ? '<button id="qstop">End</button>' : ''}</div>
    ${q ? `<div class="score"><b>${q.right}</b> / ${q.total} correct${q.streak > 1 ? ` · streak ${q.streak} 🔥` : ''}</div>` : ''}
    <div id="qcard"></div>`;
  if (q) { $('#qmode').value = q.mode; $('#qscope').value = q.scope; }
  $('#qstart').onclick = () => startQuiz($('#qmode').value, $('#qscope').value);
  if ($('#qstop')) $('#qstop').onclick = stopQuiz;
  if (q) renderQuizCard();
}
function startQuiz(mode, scope) {
  if (state.flow) stopFlow();
  clearHighlight(true);
  closeDetail();
  clearRulers(); updateLandmarks(); clearNeedle();
  state.quiz = { mode, scope, pool: quizPool(scope), right: 0, total: 0, streak: 0, current: null, answered: false };
  document.body.classList.add('quiz-on');
  nextQuestion();
}
function stopQuiz() {
  state.quiz = null;
  state.selected = null;
  document.body.classList.remove('quiz-on');
  $('#qfloat').classList.remove('on');
  updatePoints(); updateLines(); renderQuiz();
}
function nextQuestion() {
  const q = state.quiz;
  let pt;
  do { pt = q.pool[Math.floor(Math.random() * q.pool.length)]; } while (q.pool.length > 1 && pt === q.current);
  q.current = pt; q.answered = false; q.pick = null;
  const sameMer = MER[pt.mer].points.filter((p) => p !== pt);
  const others = PTS.filter((p) => p !== pt && p.mer !== pt.mer);
  const opts = new Set([pt]);
  const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  for (const p of shuffle(sameMer).slice(0, 2)) opts.add(p);
  for (const p of shuffle(others)) { if (opts.size >= 4) break; opts.add(p); }
  q.opts = shuffle([...opts]);
  state.selected = q.mode === 'name' ? pt : null;
  if (q.mode === 'name') flyToPoint(pt, 0.62);
  else if (q.mode === 'loc') view('front');
  else if (q.mode === 'find') {
    const ins = pt.inst[0];
    const back = ins.n.z < -0.4, sideV = Math.abs(ins.n.x) > 0.75;
    if (ins.p.y > 1.52) view('head'); else if (sideV) view('left'); else view(back ? 'back' : 'front');
  }
  updatePoints(); updateLines(); renderQuiz();
  needRender = true;
}
function renderQuizCard() {
  const q = state.quiz, pt = q.current;
  const card = $('#qcard'); const fl = $('#qfloat');
  let html = '';
  if (q.mode === 'name' || q.mode === 'loc') {
    html = q.mode === 'name' ? '<div class="qq">Which point is highlighted?</div>' : `<div class="qq">Which point is located here?</div><p class="qloc">${esc(pt.loc)}</p>`;
    html += '<div class="qopts">' + q.opts.map((o, i) => {
      let cls = '';
      if (q.answered) cls = o === pt ? 'ok' : o === q.pick ? 'bad' : 'dim';
      return `<button class="qopt ${cls}" data-i="${i}"><b>${o.code}</b> ${esc(o.py)}<small>${esc(o.en)}</small></button>`;
    }).join('') + '</div>';
  } else {
    html = `<div class="qq">Find <b style="color:${MER[pt.mer].color}">${pt.code}</b> ${esc(pt.py)} <span class="zh">${pt.zh}</span></div><p class="small muted">${esc(pt.en)} · click it on the body (either side). All points are shown in grey.</p>`;
    if (!q.answered) html += '<button class="ghost" id="qhint">Show a hint</button><div id="hintbox"></div>';
    else html += q.pick === pt ? '<div class="qres ok">Correct!</div>' : `<div class="qres bad">That was ${q.pick ? `<b>${q.pick.code}</b> ${esc(q.pick.py)}` : 'not it'}. ${pt.code} is shown now.</div>`;
  }
  if (q.answered) html += `<div class="qexp"><b>${pt.code} ${esc(pt.py)}</b> — ${esc(pt.loc)}</div><button class="accent" id="qnext">Next question →</button>`;
  card.innerHTML = html;
  fl.innerHTML = html;
  fl.classList.add('on');
  for (const root of [card, fl]) {
    $$('.qopt', root).forEach((b) => (b.onclick = () => answer(q.opts[+b.dataset.i])));
    const nb = $('#qnext', root); if (nb) nb.onclick = nextQuestion;
    const hb = $('#qhint', root); if (hb) hb.onclick = () => { $$('#hintbox').forEach((x) => (x.innerHTML = `<p class="small">${MER[pt.mer].name} channel. ${esc(pt.loc)}</p>`)); };
  }
}
function answer(pick) {
  const q = state.quiz;
  if (q.answered) return;
  q.answered = true; q.pick = pick; q.total++;
  if (pick === q.current) { q.right++; q.streak++; } else q.streak = 0;
  state.selected = q.current;
  if (q.mode !== 'name') flyToPoint(q.current);
  updatePoints(); updateLines(); renderQuiz();
}

// ------------------------------------------------------------------ toolbar & events
function initToolbar() {
  $$('[data-view]').forEach((b) => (b.onclick = () => view(b.dataset.view)));
  const setMode = (m) => { state.mode = m; store.set('mode2', m); body.mat.uniforms.uMode.value = m; $$('[data-mode]').forEach((b) => b.classList.toggle('on', +b.dataset.mode === m)); needBody = true; needRender = true; };
  $$('[data-mode]').forEach((b) => (b.onclick = () => setMode(+b.dataset.mode)));
  setMode(state.mode);
  const tg = (id, key, fn) => { const b = $(id); b.classList.toggle('on', state[key]); b.onclick = () => { state[key] = !state[key]; store.set(key, state[key]); b.classList.toggle('on', state[key]); fn(); }; };
  tg('#t-lines', 'lines', updateLines);
  tg('#t-lm', 'landmarks', () => { updateLandmarks(); renderMeasure(); });
  $$('[data-sex]').forEach((b) => { b.classList.toggle('on', b.dataset.sex === state.sex); b.onclick = () => switchSex(b.dataset.sex); });
  tg('#t-labels', 'labels', () => { needRender = true; updateLabels(); });
  const sz = $('#t-size'); sz.value = state.size; sz.oninput = () => { state.size = +sz.value; store.set('size', state.size); updatePoints(); };
  $('#dclose').onclick = closeDetail;
  $$('.tab').forEach((t) => (t.onclick = () => { $$('.tab').forEach((x) => x.classList.toggle('on', x === t)); $$('.pane').forEach((p) => p.classList.toggle('on', p.id === 'pane-' + t.dataset.tab)); store.set('tab', t.dataset.tab); document.body.classList.add('side-open'); }));
  const tab = store.get('tab', 'channels'); const tb = $(`.tab[data-tab=${tab}]`); if (tb) tb.click();
  document.body.classList.remove('side-open');
  $('#sidetoggle').onclick = () => { closePops(); document.body.classList.toggle('side-open'); };
  $('#scrim').onclick = closeDrawer;
  // on phones, close the drawer after choosing something that shows on the body
  $('aside').addEventListener('click', (e) => {
    if (!isMobile()) return;
    if (e.target.closest('.eye, select, .tab, [data-a=all], [data-a=none], #m-lm, #m-clear, label, #qstop')) return;
    if (e.target.closest('.mrow, .cat, .vs, .elnode, .cseg, .meas, #qstart, [data-a=flow], #flowbtn2, .qopt')) setTimeout(closeDrawer, 60);
  });
  // toolbar popovers (phones)
  $$('[data-pop]').forEach((b) => (b.onclick = (e) => {
    e.stopPropagation();
    const p = $('#' + b.dataset.pop), open = !p.classList.contains('open');
    closePops(); closeDrawer();
    if (open) { p.classList.add('open'); b.classList.add('on'); }
  }));
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.toolbar')) closePops(); });
  $$('#pop-views [data-view]').forEach((b) => b.addEventListener('click', () => { if (isMobile()) closePops(); }));
  if (isMobile() || isTouch()) $('#search').placeholder = 'Search points or symptoms…';
  initSheet();
  $('#help').onclick = () => $('#helpcard').classList.toggle('on');
  $('#helpclose').onclick = () => { $('#helpcard').classList.remove('on'); store.set('helpSeen', true); };
  if (!store.get('helpSeen', false)) $('#helpcard').classList.add('on');
  $('#fp-stop').onclick = stopFlow;
  $('#fp-pause').onclick = () => { state.flow.paused = !state.flow.paused; $('#fp-pause').textContent = state.flow.paused ? '▶' : '❚❚'; };
  $('#fp-speed').oninput = (e) => { if (state.flow) state.flow.speed = +e.target.value; };

  const cv = renderer.domElement;
  let downAt = null;
  let pointers = 0, multi = false, lastTap = null;
  cv.addEventListener('pointerdown', (e) => { pointers++; if (pointers > 1) multi = true; downAt = [e.clientX, e.clientY, performance.now()]; camAnim = null; closePops(); });
  const lift = () => { pointers = Math.max(0, pointers - 1); if (!pointers) setTimeout(() => (multi = false), 0); };
  cv.addEventListener('pointercancel', () => { lift(); downAt = null; });
  const zoomAt = (x, y) => {
    const r = cv.getBoundingClientRect();
    const p = rayBody(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    if (!p) return;
    const d = Math.max(0.3, camera.position.distanceTo(controls.target) * 0.5);
    const dir = camera.position.clone().sub(controls.target).normalize();
    flyTo(p, p.clone().addScaledVector(dir, d), 600);
  };
  let hoverRaf = 0;
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (e.buttons) { $('#tip').classList.remove('on'); return; }
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      const ins = pick(e);
      const pt = ins ? ins.pt : null;
      const tip = $('#tip');
      const hideInfo = state.quiz && !state.quiz.answered;
      if (pt !== state.hover) { state.hover = pt; updatePoints(); }
      cv.style.cursor = pt ? 'pointer' : 'grab';
      if (pt && !hideInfo) {
        const r = cv.getBoundingClientRect();
        tip.innerHTML = `<b style="color:${MER[pt.mer].color}">${pt.code}</b> ${esc(pt.py)} <span class="zh">${pt.zh}</span><small>${esc(pt.en)}</small>`;
        tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`;
        tip.classList.add('on');
      } else tip.classList.remove('on');
    });
  });
  cv.addEventListener('pointerleave', () => { $('#tip').classList.remove('on'); if (state.hover) { state.hover = null; updatePoints(); } });
  cv.addEventListener('pointerup', (e) => {
    const wasMulti = multi;
    lift();
    if (!downAt || wasMulti) { downAt = null; return; }
    const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
    const dt = performance.now() - downAt[2];
    downAt = null;
    const touch = e.pointerType !== 'mouse';
    if (moved > (touch ? 10 : 5) || dt > 600) return;
    const ins = pick(e);
    if (touch && !ins) {
      const now = performance.now();
      if (lastTap && now - lastTap.t < 330 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40) { lastTap = null; zoomAt(e.clientX, e.clientY); return; }
      lastTap = { t: now, x: e.clientX, y: e.clientY };
      return;
    }
    if (state.quiz && state.quiz.mode === 'find' && !state.quiz.answered) { if (ins) answer(ins.pt); return; }
    if (ins) selectPoint(ins.pt, { keepHighlight: true });
  });
  cv.addEventListener('dblclick', (e) => { if (!isTouch()) zoomAt(e.clientX, e.clientY); });
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
    if (e.key === 'Escape') { if (state.quiz) return; closeDetail(); clearHighlight(); }
    const sel = state.selected;
    if (sel && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const pts = MER[sel.mer].points; const i = pts.indexOf(sel) + (e.key === 'ArrowRight' ? 1 : -1);
      if (pts[i]) selectPoint(pts[i], { keepHighlight: true });
    }
    const map = { 1: 'front', 2: 'back', 3: 'left', 4: 'right', 5: 'head', 6: 'hand', 7: 'foot' };
    if (map[e.key]) view(map[e.key]);
  });
  window.addEventListener('hashchange', routeHash);
}
function routeHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  if (BY[id]) { if (state.selected !== BY[id]) selectPoint(BY[id]); }
  else if (MER[id]) { if (state.focusMer !== id) selectMeridian(id); }
}


// ------------------------------------------------------------------ measuring rulers & landmarks
let rulerHidden = false;
let rulerGroup = null, rulerLabels = [], rulerSrc = null, rulerBox = null;
const rulerMat = new THREE.MeshBasicMaterial({ color: 0xf7f1e6 });
const markMat = new THREE.MeshBasicMaterial({ color: 0xe8b04f });
const tickMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const hiMat = new THREE.MeshBasicMaterial({ color: 0xffc35c });
const tickGeo = new THREE.SphereGeometry(1, 10, 8);
function clearRulers() {
  if (rulerGroup) { scene.remove(rulerGroup); rulerGroup.traverse((o) => { if (o.geometry && o.geometry !== tickGeo) o.geometry.dispose(); }); }
  rulerGroup = null; rulerLabels = []; rulerSrc = null; rulerBox = null; needRender = true;
}
function drawRulers(src) {
  const keep = src;
  clearRulers();
  rulerSrc = keep;
  const list = src.build();
  const mx = src.mirror ? -1 : 1;
  rulerGroup = new THREE.Group();
  rulerBox = new THREE.Box3();
  const tick = (p, r, mat) => { const m = new THREE.Mesh(tickGeo, mat); m.position.copy(p); m.scale.setScalar(r); m.renderOrder = 2; rulerGroup.add(m); };
  for (const r of list) {
    const pts = r.path.map((p) => new THREE.Vector3(p[0] * mx, p[1], p[2]));
    const smp = surfacePath(pts);
    if (!smp) continue;
    smp.forEach((p) => rulerBox.expandByPoint(p));
    const cum = [0];
    for (let i = 1; i < smp.length; i++) cum.push(cum[i - 1] + smp[i].distanceTo(smp[i - 1]));
    const L = cum[cum.length - 1];
    const at = (f) => { const t = f * L; let i = 1; while (i < cum.length - 1 && cum[i] < t) i++; const k = (t - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return smp[i - 1].clone().lerp(smp[i], Math.max(0, Math.min(1, k))); };
    const part = (f0, f1) => { const out = [at(f0)]; for (let i = 0; i < smp.length; i++) { const f = cum[i] / L; if (f > f0 && f < f1) out.push(smp[i]); } out.push(at(f1)); return out; };
    rulerGroup.add(tubeFrom(smp, 0.0009, rulerMat));
    if (r.cun > 0) {
      const n = Math.floor(r.cun + 1e-6);
      for (let i = 0; i <= n; i++) tick(at(i / r.cun), i === 0 || i === n ? 0.003 : 0.002, tickMat);
      if (r.cun <= 6) for (let i = 0; i < n; i++) tick(at((i + 0.5) / r.cun), 0.0012, tickMat);
      if (Math.abs(r.cun - n) > 1e-6) tick(at(1), 0.003, tickMat);
    }
    if (r.ticks) for (const t of r.ticks) { tick(at(t.f), t.hi ? 0.0034 : 0.002, t.hi ? hiMat : tickMat); if (t.label) rulerLabels.push({ p: at(t.f), text: t.label, cls: t.hi ? 'rl hi' : 'rl' }); }
    if (r.mark && r.mark.c > 0 && r.cun > 0) {
      const fc = Math.min(1, r.mark.c / r.cun);
      const [f0, f1] = r.mark.from === 'a' ? [0, fc] : [1 - fc, 1];
      const seg = part(f0, f1);
      if (seg.length >= 2 && seg[0].distanceTo(seg[seg.length - 1]) > 0.001) rulerGroup.add(tubeFrom(seg, 0.0016, markMat));
      tick(at(r.mark.from === 'a' ? fc : 1 - fc), 0.0034, hiMat);
      const mid = at((f0 + f1) / 2);
      rulerLabels.push({ p: mid, text: `${Math.round(r.mark.c * 10) / 10} cun`, cls: 'rl mark' });
    }
    if (r.midLabel) rulerLabels.push({ p: at(0.5), text: r.midLabel, cls: 'rl mark' });
    if (r.la) rulerLabels.push({ p: at(0), text: r.la, cls: 'rl end' });
    if (r.lb) rulerLabels.push({ p: at(1), text: r.lb + (r.cun > 0 && !r.mark ? ` · ${r.cun} cun` : ''), cls: 'rl end' });
    if (!r.mark && r.cun > 0 && !r.lb) rulerLabels.push({ p: at(0.5), text: `${r.cun} cun`, cls: 'rl mark' });
  }
  scene.add(rulerGroup);
  needRender = true;
}
function frameRulers(extra) {
  const box = rulerBox ? rulerBox.clone() : new THREE.Box3();
  for (const l of lmShow) box.expandByPoint(l.p);
  if (extra) box.expandByPoint(extra);
  if (box.isEmpty()) return;
  const c = box.getCenter(new THREE.Vector3());
  const r = Math.max(0.09, box.getSize(new THREE.Vector3()).length() / 2);
  const p = M.project([c.x, c.y, c.z]);
  const n = new THREE.Vector3(...M.grad(p));
  const camDir = camera.position.clone().sub(controls.target).normalize();
  const dir = n.multiplyScalar(0.7).add(camDir.multiplyScalar(0.3)).normalize();
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * camera.aspect);
  const d = Math.max(0.25, (r * 1.3) / Math.sin(Math.min(vf, hf)));
  const sp = new THREE.Vector3(...p);
  const pos = clearView(sp, dir, d);
  flyTo(c, c.clone().add(pos.sub(sp)));
}
let LM = null, lmMesh = null, lmShow = [];
function landmarks() {
  if (!LM) LM = landmarkPositions(M).map(({ name, p, n }) => ({ name, p: new THREE.Vector3(...p), n: new THREE.Vector3(...n) }));
  return LM;
}
function updateLandmarks() {
  const all = landmarks();
  let list = [];
  if (state.landmarks) list = all.map((l) => ({ l, s: 1 }));
  else if (state.selected && rulerSrc && rulerSrc.point && rulerSrc.near) {
    const names = new Set(rulerSrc.near.map((l) => l.name));
    list = all.filter((l) => names.has(l.name)).map((l) => ({ l, s: 1 }));
  }
  const mir = rulerSrc && rulerSrc.mirror && !state.landmarks ? -1 : 1;
  lmShow = list.map(({ l }) => ({ name: l.name, p: new THREE.Vector3(l.p.x * mir, l.p.y, l.p.z).addScaledVector(new THREE.Vector3(l.n.x * mir, l.n.y, l.n.z), 0.002) }));
  if (!lmMesh) {
    lmMesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1), new THREE.MeshBasicMaterial({ color: 0xffffff }), LANDMARKS.length);
    lmMesh.renderOrder = 2; scene.add(lmMesh);
  }
  lmShow.forEach((l, i) => { tmpS.setScalar(0.0042); tmpM.compose(l.p, tmpQ, tmpS); lmMesh.setMatrixAt(i, tmpM); });
  lmMesh.count = lmShow.length;
  lmMesh.instanceMatrix.needsUpdate = true;
  needRender = true;
}
// ------------------------------------------------------------------ needle on the body
let needleHidden = store.get('needleHidden', false);
let needleGroup = null, needleLabels = [], needleInfo = null;
const CUN_M = 0.022;
const needleMats = {
  steel: new THREE.MeshPhongMaterial({ color: 0xd9dde6, shininess: 90, specular: 0xffffff }),
  handle: new THREE.MeshPhongMaterial({ color: 0xc99a4b, shininess: 60 }),
  inside: new THREE.MeshBasicMaterial({ color: 0xd9dde6, transparent: true, opacity: 0.8, depthTest: false, depthWrite: false }),
  range: new THREE.MeshBasicMaterial({ color: 0xffc35c, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false }),
  danger: new THREE.MeshBasicMaterial({ color: 0xff5a5a, transparent: true, opacity: 0.22, depthTest: false, depthWrite: false }),
};
function clearNeedle() {
  const had = !!needleGroup;
  if (needleGroup) { scene.remove(needleGroup); needleGroup.traverse((o) => o.geometry && o.geometry.dispose()); }
  needleGroup = null; needleLabels = []; needleInfo = null; needRender = true;
  if (had && pointsMesh) updatePoints();
}
function cyl(a, b, r, mat, order = 3) {
  const dir = b.clone().sub(a), L = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10, 1), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.renderOrder = order;
  return m;
}
function needleDir(pt, ins, d) {
  const p = ins.p, n = ins.n.clone(), s = ins.side;
  const txt = (d.dir || '').toLowerCase();
  let v = null;
  const ref = txt.match(/towards ([A-Z]{2}\d+)/i);
  if (ref && BY[ref[1].toUpperCase()]) { const r = BY[ref[1].toUpperCase()].inst.find((i) => i.side === s) || BY[ref[1].toUpperCase()].inst[0]; v = r.p.clone().sub(p); }
  else if (/tip of the nose/.test(txt)) v = new THREE.Vector3(0, 1.633, 0.111).sub(p);
  else if (/towards the chin/.test(txt)) v = new THREE.Vector3(0, 1.57, 0.09).sub(p);
  else if (/axilla/.test(txt)) v = new THREE.Vector3(s * 0.165, 1.2, 0).sub(p);
  else if (/centre of the knee/.test(txt)) v = new THREE.Vector3(s * M.SK.K[0], M.SK.K[1], M.SK.K[2]).sub(p);
  else if (/root of the tongue/.test(txt)) v = new THREE.Vector3(0, 1.58, 0.02).sub(p);
  else if (/behind the sternum|downward|towards bl1|inferior/.test(txt)) v = new THREE.Vector3(0, -1, 0);
  else if (/upward|superior/.test(txt)) v = new THREE.Vector3(0, 1, 0);
  else if (/medially|towards the spine|towards the centre of the palm/.test(txt)) v = new THREE.Vector3(-s, 0, 0);
  else if (/laterally|away from the eye/.test(txt)) v = new THREE.Vector3(s, 0, 0);
  else if (/backward/.test(txt)) v = new THREE.Vector3(0, 0, -1);
  else if (/forward/.test(txt)) v = new THREE.Vector3(0, 0, 1);
  else if (/proximally|towards the wrist/.test(txt)) {
    const arm = Math.abs(p.x) > 0.2 && p.y > 0.8;
    const j = arm ? M.SK.S : M.SK.H;
    v = new THREE.Vector3(s * j[0], j[1], j[2]).sub(p);
  }
  if (!v) {
    const pts = MER[pt.mer] && MER[pt.mer].points; const i = pts ? pts.indexOf(pt) : -1;
    const nx = i >= 0 ? pts[i + 1] || pts[i - 1] : null;
    if (nx) { const r = nx.inst.find((q) => q.side === s) || nx.inst[0]; v = r.p.clone().sub(p); if (!pts[i + 1]) v.negate(); }
    else v = new THREE.Vector3(0, -1, 0);
  }
  let t = v.clone().addScaledVector(n, -v.dot(n));
  if (t.lengthSq() < 1e-8) { t = new THREE.Vector3(0, 1, 0).addScaledVector(n, -n.y); }
  t.normalize();
  const deg = d.a === 'PR' ? 90 : d.deg;
  const th = (deg * Math.PI) / 180;
  const din = n.clone().multiplyScalar(-Math.sin(th)).addScaledVector(t, Math.cos(th)).normalize();
  return { din, t, n };
}
function showNeedle(pt) {
  clearNeedle();
  const d = DEPTH[pt.code];
  if (!d || ['MX', 'NO'].includes(d.a) || state.quiz) return;
  const ins = bestInst(pt) || pt.inst[0];
  const { din, t, n } = needleDir(pt, ins, d);
  const p = ins.p.clone();
  const maxC = d.a === 'PR' ? 0.1 : d.max, minC = d.a === 'PR' ? 0.05 : d.min;
  const g = new THREE.Group();
  const out1 = p.clone().addScaledVector(din, -0.016), out2 = p.clone().addScaledVector(din, -0.05);
  g.add(cyl(p, out1, 0.00045, needleMats.steel));
  g.add(cyl(out1, out2, 0.0014, needleMats.handle));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.0017, 10, 8), needleMats.handle); knob.position.copy(out2); g.add(knob);
  let a, b, tipDir = din;
  if (pt.code === 'CV22') {
    const k = p.clone().addScaledVector(n, -0.2 * CUN_M);
    const down = new THREE.Vector3(0, -1, 0).addScaledVector(n, -0.15).normalize();
    a = k.clone().addScaledVector(down, minC * CUN_M); b = k.clone().addScaledVector(down, maxC * CUN_M); tipDir = down;
    g.add(cyl(p, k, 0.00055, needleMats.inside, 150)); g.add(cyl(k, a, 0.00055, needleMats.inside, 150));
  } else {
    a = p.clone().addScaledVector(din, minC * CUN_M); b = p.clone().addScaledVector(din, maxC * CUN_M);
    g.add(cyl(p, a, 0.00055, needleMats.inside, 150));
  }
  g.add(cyl(a, b, 0.0012, needleMats.range, 151));
  const tipP = b.clone();
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0011, 8, 6), needleMats.range); tip.position.copy(b); tip.renderOrder = 151; g.add(tip);
  const danger = dangerOf(d);
  if (danger && d.a !== 'PR') { const z = new THREE.Mesh(new THREE.SphereGeometry(0.006, 14, 10), needleMats.danger); z.position.copy(b).addScaledVector(tipDir, 0.008); z.renderOrder = 149; g.add(z); }
  scene.add(g);
  needleGroup = g;
  needleInfo = { p, din, t, n, d };
  updatePoints();
  needleLabels = [];
  if (d.a !== 'PR') needleLabels.push({ p: tipP, text: `${fmtCun(d)} ${fmtCm(d)}`, cls: 'rl mark', noOcc: true });
  if (danger && d.a !== 'PR') needleLabels.push({ p: tipP.clone().addScaledVector(tipDir, 0.014), text: danger, cls: 'rl warn', noOcc: true });
  needRender = true;
}
function sideViewNeedle() {
  if (!needleInfo) return;
  const { p, din, t, n } = needleInfo;
  let side = new THREE.Vector3().crossVectors(n, t).normalize();
  if (side.dot(camera.position.clone().sub(p)) < 0) side.negate();
  const d = needleInfo.d;
  const depthM = (d.a === 'PR' ? 0.1 : d.max) * CUN_M;
  const mid = p.clone().addScaledVector(din, depthM * 0.35).addScaledVector(n, 0.012);
  const dir = side.clone().addScaledVector(n, 0.2).normalize();
  flyTo(mid, clearView(mid, dir, Math.max(0.2, 0.12 + depthM * 2.5)));
}
function showGuideFor(pt) {
  if (!pt || state.quiz) { clearRulers(); updateLandmarks(); return; }
  const ins = bestInst(pt) || pt.inst[0];
  const g = guideFor(M, pt, { BY, chip });
  drawRulers({ point: pt, ins, mirror: ins.side < 0, near: g.near, build: () => guideFor(M, pt, { BY, chip }).rulers });
  updateLandmarks();
}

// ------------------------------------------------------------------ male / female
async function switchSex(sex) {
  if (M && sex === M.sex) return;
  $('#busy').classList.add('on');
  $$('[data-sex]').forEach((b) => b.classList.toggle('on', b.dataset.sex === sex));
  await sleep(60);
  state.sex = sex; store.set('sex', sex);
  M = MODELS[sex] || (MODELS[sex] = createModel(sex));
  computeInst();
  scene.remove(pointsMesh); pointsMesh.geometry.dispose();
  buildPoints();
  for (const g of [...Object.values(lineGroups), ...Object.values(vesselGroups)]) { scene.remove(g); g.traverse((o) => o.geometry && o.geometry.dispose()); }
  lineGroups = {}; vesselGroups = {}; lineMats.length = 0;
  buildLines();
  if (state.flow) stopFlow();
  FLOWSEGS = null;
  LM = null;
  setBodyMesh();
  const src = rulerSrc;
  if (src && src.point) showGuideFor(src.point); else if (src) drawRulers(src);
  if (needleGroup && state.selected) showNeedle(state.selected);
  updateLandmarks(); updatePoints(); updateLines();
  await sleep(30);
  $('#busy').classList.remove('on');
}

// ------------------------------------------------------------------ measure tab
const FINGER_SVG = `<svg viewBox="0 0 300 150" class="fingers">
  <g fill="#2a2f39" stroke="#8a92a2" stroke-width="1.2">
    <rect x="14" y="30" width="22" height="78" rx="11"/><line x1="14" y1="62" x2="36" y2="62" stroke="#5d6472"/>
    <rect x="80" y="20" width="19" height="92" rx="9.5"/><rect x="100" y="12" width="20" height="100" rx="10"/>
    <rect x="170" y="20" width="19" height="92" rx="9.5"/><rect x="190" y="12" width="20" height="100" rx="10"/><rect x="211" y="18" width="19" height="94" rx="9.5"/><rect x="231" y="32" width="17" height="80" rx="8.5"/>
    <line x1="80" y1="70" x2="120" y2="70" stroke="#5d6472"/><line x1="170" y1="70" x2="248" y2="70" stroke="#5d6472"/>
  </g>
  <g stroke="#e3b36a" stroke-width="1.6" fill="none"><path d="M12 62h26M12 58v8M38 58v8"/><path d="M78 76h44M78 72v8M122 72v8"/><path d="M168 76h82M168 72v8M250 72v8"/></g>
  <g fill="#e3b36a" font-size="11" font-family="Inter,sans-serif" text-anchor="middle"><text x="25" y="128">1 cun</text><text x="100" y="128">1.5 cun</text><text x="209" y="128">3 cun</text></g>
  <g fill="#8a92a2" font-size="9.5" font-family="Inter,sans-serif" text-anchor="middle"><text x="25" y="142">thumb width</text><text x="100" y="142">index + middle</text><text x="209" y="142">four fingers</text></g>
</svg>`;
function renderMeasure() {
  const box = $('#pane-measure');
  const list = standardMeasures(M);
  let html = `<p class="hint">Points are located with <b>cun</b> (寸), a proportional "body inch". Because cun are relative to each person's own body, the same point is found the same way on a small or a tall person.</p>
    <h4>Finger cun (同身寸)</h4><p class="hint">Quick measures using the <b>patient's</b> fingers — best for short distances.</p>${FINGER_SVG}
    <p class="hint">The width of the thumb at its joint = 1 cun · index + middle finger = 1.5 cun · four fingers at the middle joints = 3 cun. The middle phalanx of the middle finger (flexed) is also 1 cun.</p>
    <h4>Bone-proportional cun (骨度分寸)</h4><p class="hint">The standard method: a distance between two landmarks is divided into a fixed number of cun. Click one to draw it on the body.</p>`;
  let g = '';
  for (const m of list) {
    if (m.group !== g) { g = m.group; html += `<div class="mgroup">${esc(g)}</div>`; }
    html += `<div class="meas" data-id="${m.id}"><span>${esc(m.name)}</span><b>${m.cun ? m.cun + ' cun' : 'levels'}</b></div>`;
  }
  html += `<div class="row-actions" style="margin-top:12px"><button id="m-lm" class="${state.landmarks ? 'accent' : ''}">${state.landmarks ? 'Hide' : 'Show'} all landmarks</button><button id="m-clear">Clear rulers</button></div>`;
  box.innerHTML = html;
  $$('.meas', box).forEach((e) => (e.onclick = () => {
    const m = standardMeasures(M).find((x) => x.id === e.dataset.id);
    $$('.meas').forEach((x) => x.classList.toggle('on', x === e));
    state.selected = null; updatePoints();
    drawRulers({ build: m.build, id: m.id });
    updateLandmarks();
    frameRulers();
  }));
  $('#m-lm', box).onclick = () => { state.landmarks = !state.landmarks; store.set('landmarks', state.landmarks); $('#t-lm').classList.toggle('on', state.landmarks); updateLandmarks(); renderMeasure(); };
  $('#m-clear', box).onclick = () => { clearRulers(); $$('.meas').forEach((x) => x.classList.remove('on')); updateLandmarks(); };
}

// ------------------------------------------------------------------ boot
async function boot() {
  labelLayer = $('#labels');
  const status = $('#loadmsg');
  status.textContent = 'Placing 409 points on the body…';
  await sleep(30);
  M = MODELS[state.sex] = createModel(state.sex);
  buildData();
  $('#count').textContent = `${PTS.length} points · ${PTS.reduce((a, p) => a + p.inst.length, 0)} locations`;
  status.textContent = 'Building the body and pathways…';
  await sleep(30);
  initScene();
  buildPoints();
  buildLines();
  status.textContent = 'Compiling shaders…';
  await sleep(30);
  renderChannels(); renderCategories(); renderVessels(); renderPhases(); renderQuiz(); renderMeasure(); updateLandmarks();
  initSearch(); initToolbar();
  { const [t, p] = VIEWS.front(); controls.target.set(...t); camera.position.set(...p); controls.update(); }
  renderBody(); renderer.render(scene, camera);
  $('#loading').classList.add('done');
  loop();
  routeHash();
  window.__acu = { side: () => { sideViewNeedle(); return camAnim && camAnim.tp; }, ni: () => needleInfo, ng: () => !!needleGroup, pick: (x, y) => { const i = pick({ clientX: x, clientY: y, pointerType: 'touch' }); return i && i.pt.code; }, dbg: () => ({ rb: rulerBox && [rulerBox.min, rulerBox.max], lm: lmShow.map(l => l.p), cam: camera.position, tgt: controls.target }), M: () => M, PTS, BY, MER, state, view, selectPoint, selectMeridian, camera, controls, startFlow, stopFlow, startQuiz, setHighlight, CATEGORIES, renderer, needs: () => { needBody = true; needRender = true; } };
}
boot().catch((e) => { $('#loadmsg').textContent = 'Something went wrong: ' + e.message; console.error(e); });
