// Sculpted human body (male / female) defined as signed distance fields.
// One primitive list per body drives both the GPU raymarcher (generated GLSL)
// and the CPU surface queries used to place points on the skin.
// Metres, Y up, figure faces +Z, figure's LEFT is +X. Primitives are mirrored with abs(x).

export const v = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
const { add, sub: vsub, mul, dot, len, norm, cross, lerp } = v;
const Z = [0, 0, 1], X = [1, 0, 0], Y = [0, 1, 0];
const sum = (...a) => a.reduce((p, q) => add(p, q), [0, 0, 0]);

// ------------------------------------------------------------------ SDF primitives
function sdRoundCone(p, a, b, r1, r2) {
  const ba = vsub(b, a), l2 = dot(ba, ba), rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  const pa = vsub(p, a), y = dot(pa, ba), z = y - l2;
  const xv = vsub(mul(pa, l2), mul(ba, y));
  const x2 = dot(xv, xv), y2 = y * y * l2, z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
function sdEll0(qx, qy, qz, r) {
  const k0 = Math.hypot(qx / r[0], qy / r[1], qz / r[2]);
  const k1 = Math.hypot(qx / (r[0] * r[0]), qy / (r[1] * r[1]), qz / (r[2] * r[2]));
  return k0 * (k0 - 1) / k1;
}
function sdRB(qx, qy, qz, b, rr) {
  const dx = Math.abs(qx) - b[0], dy = Math.abs(qy) - b[1], dz = Math.abs(qz) - b[2];
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dy, dz), 0) - rr;
}
function smin(a, b, k) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
function evalPrim(o, q) {
  if (o.t === 'rc') return sdRoundCone(q, o.a, o.b, o.r1, o.r2);
  const dx = q[0] - o.c[0], dy = q[1] - o.c[1], dz = q[2] - o.c[2];
  if (o.t === 'el') return sdEll0(dx, dy, dz, o.r);
  const [a0, a1, a2] = o.ax;
  const lx = dx * a0[0] + dy * a0[1] + dz * a0[2], ly = dx * a1[0] + dy * a1[1] + dz * a1[2], lz = dx * a2[0] + dy * a2[1] + dz * a2[2];
  if (o.t === 'oe') return sdEll0(lx, ly, lz, o.r);
  return sdRB(lx, ly, lz, o.b, o.rr);
}
// frame: a1 = long axis, a2 = depth (orthogonalised hint), a0 = a1 x a2
function frame(long, hint = Z) {
  const a1 = norm(long);
  let a2 = vsub(hint, mul(a1, dot(hint, a1)));
  a2 = norm(a2);
  const a0 = norm(cross(a1, a2));
  return [a0, a1, a2];
}

// ------------------------------------------------------------------ body builder
function buildPrims(sex) {
  const F = sex === 'female';
  const P = [];
  let G = 'torso';
  const push = (o, k = 0, s = false) => { o.k = k; o.s = s; o.g = G; P.push(o); return o; };
  const rc = (a, b, r1, r2, k = 0) => push({ t: 'rc', a, b, r1, r2 }, k);
  const el = (c, r, k = 0) => push({ t: 'el', c, r }, k);
  const subEl = (c, r, k = 0) => push({ t: 'el', c, r }, k, true);
  // oriented ellipsoid: centre, long axis dir, depth hint, [rWidth, rLong, rDepth]
  const oe = (c, long, hint, r, k = 0) => push({ t: 'oe', c, ax: frame(long, hint), r }, k);
  const ob = (c, ax, b, rr, k = 0) => push({ t: 'ob', c, ax, b, rr }, k);
  const m = F ? 0.84 : 1; // muscle scale

  // ---- skeleton
  const S = F ? [0.168, 1.428, 0.0] : [0.186, 1.435, 0.0];
  const dArm = norm([0.643, -0.766, 0]);
  const lArm = [0.766, 0.643, 0]; // lateral / radial direction across the arm & hand
  const E = add(S, mul(dArm, F ? 0.285 : 0.3));
  const W = add(E, mul(dArm, F ? 0.24 : 0.252));
  const H = F ? [0.094, 0.905, 0.0] : [0.087, 0.905, 0.0];
  const K = [0.145, 0.49, 0.012];
  const A = [0.19, 0.085, -0.012];
  const handScale = F ? 0.93 : 1;

  // ---- torso
  G = 'torso';
  el([0, 0.945, 0], F ? [0.166, 0.105, 0.104] : [0.15, 0.1, 0.1]);
  el([0, 1.0, 0.018], F ? [0.13, 0.09, 0.09] : [0.124, 0.09, 0.09], 0.05);
  el([0, 1.09, 0.012], F ? [0.118, 0.12, 0.09] : [0.128, 0.12, 0.094], 0.05);
  el([0, 1.265, -0.004], F ? [0.132, 0.158, 0.094] : [0.143, 0.165, 0.1], 0.05);
  el([0, 1.388, -0.012], F ? [0.144, 0.068, 0.076] : [0.158, 0.07, 0.082], 0.05);
  if (!F) {
    oe([0.07, 1.336, 0.054], [1, 0.3, 0.12], Z, [0.052, 0.08, 0.024], 0.05); // pectorals
    el([0.034, 1.13, 0.075], [0.03, 0.13, 0.027], 0.04); // rectus abdominis
  } else {
    oe([0.064, 1.338, 0.05], [1, 0.3, 0.12], Z, [0.044, 0.068, 0.022], 0.035);
    el([0.092, 1.288, 0.072], [0.056, 0.054, 0.05], 0.035); // breasts
    el([0.1, 1.282, 0.104], [0.012, 0.011, 0.01], 0.012); // areola mound
    el([0.142, 0.87, -0.005], [0.045, 0.08, 0.07], 0.05); // hip contour
  }
  el([0.115, 0.985, 0.03], [0.03, 0.02, 0.04], 0.05); // iliac crest
  el(F ? [0.078, 0.9, -0.056] : [0.07, 0.905, -0.05], F ? [0.09, 0.1, 0.076] : [0.08, 0.092, 0.068], 0.03); // gluteals
  oe([0.11, 1.24, -0.05], [-0.25, -1, -0.1], Z, [0.04 * m, 0.11, 0.035 * m], 0.045); // latissimus
  oe([0.077, 1.362, -0.083], [0.25, 1, 0], Z, [0.052, 0.07, 0.018], 0.03); // scapula
  el([0.028, 1.14, -0.082], [0.024, 0.17, 0.03], 0.04); // erector spinae
  subEl([0, 1.2, -0.114], [0.007, 0.22, 0.014], 0.02); // spinal groove
  rc([0.0, 1.52, -0.035], [0.163, 1.45, -0.012], 0.04 * m, 0.03 * m, 0.03); // upper trapezius
  oe([0.05, 1.42, -0.07], Y, Z, [0.06, 0.09, 0.02], 0.04); // middle trapezius
  rc([0.02, 1.447, 0.038], [0.155, 1.458, 0.0], 0.0075, 0.007, 0.025); // clavicles
  // ---- neck & head
  G = 'neck';
  rc([0, 1.43, -0.012], [0, 1.6, -0.01], F ? 0.05 : 0.057, F ? 0.043 : 0.048, 0.03);
  rc([0.055, 1.615, -0.025], [0.018, 1.455, 0.044], F ? 0.011 : 0.014, F ? 0.009 : 0.011, 0.02); // sternocleidomastoid
  if (!F) el([0, 1.535, 0.05], [0.012, 0.014, 0.009], 0.015); // laryngeal prominence
  G = 'head';
  el([0, 1.672, -0.014], F ? [0.072, 0.087, 0.096] : [0.074, 0.088, 0.097], 0.03);
  el([0, 1.655, 0.03], F ? [0.062, 0.074, 0.069] : [0.064, 0.075, 0.07], 0.03);
  rc(F ? [0.046, 1.6, 0.0] : [0.05, 1.595, -0.004], [0.014, 1.566, 0.076], F ? 0.013 : 0.016, F ? 0.011 : 0.013, 0.03); // mandible
  el([0, 1.567, 0.079], F ? [0.017, 0.015, 0.015] : [0.02, 0.017, 0.016], 0.02); // chin
  el([0, 1.606, 0.06], [0.034, 0.03, 0.04], 0.025); // maxilla / mouth
  el([0.046, 1.642, 0.062], [0.018, 0.012, 0.016], 0.025); // zygomatic
  oe([0.027, 1.687, 0.087], [1, 0, -0.55], Z, F ? [0.006, 0.02, 0.007] : [0.007, 0.022, 0.009], 0.015); // brow ridge
  subEl([0.032, 1.668, 0.1], [0.016, 0.011, 0.012], 0.008); // orbits
  el([0.032, 1.667, 0.08], [0.012, 0.012, 0.012], 0.004); // eyes
  rc([0, 1.675, 0.094], [0, 1.637, 0.112], 0.0055, 0.0085, 0.012); // nasal bridge
  el([0, 1.633, 0.111], [0.0095, 0.0085, 0.009], 0.008); // nose tip
  el([0.0095, 1.628, 0.101], [0.007, 0.006, 0.0075], 0.007); // alae
  el([0, 1.6085, 0.097], [0.019, 0.005, 0.0065], 0.008); // upper lip
  el([0, 1.5975, 0.0955], [0.017, 0.0055, 0.0065], 0.008); // lower lip
  subEl([0, 1.6032, 0.104], [0.017, 0.001, 0.006], 0.002); // mouth line
  oe([0.073, 1.651, -0.004], [0, 1, -0.22], X, [0.017, 0.03, 0.0105], 0.008); // ears
  subEl([0.0835, 1.647, -0.002], [0.006, 0.014, 0.009], 0.004); // concha
  { // enlarge head slightly about the upper neck
    const pv = [0, 1.6, 0], sc = 1.06;
    const tp = (p) => add(pv, mul(vsub(p, pv), sc));
    for (const o of P) if (o.g === 'head') {
      if (o.t === 'rc') { o.a = tp(o.a); o.b = tp(o.b); o.r1 *= sc; o.r2 *= sc; }
      else { o.c = tp(o.c); if (o.r) o.r = mul(o.r, sc); if (o.b) { o.b = mul(o.b, sc); o.rr *= sc; } }
    }
  }
  // ---- arm
  G = 'arm';
  oe(add(S, add(mul(dArm, 0.05), [0.008, 0.0, 0])), dArm, Z, [0.046 * (F ? 0.92 : 1), 0.07, 0.048 * (F ? 0.92 : 1)], 0.035); // deltoid
  rc(S, E, 0.042 * (F ? 0.9 : 1), 0.031 * (F ? 0.9 : 1), 0.02);
  oe(sum(S, mul(dArm, 0.17), mul(Z, 0.016)), dArm, Z, [0.028 * m, 0.085, 0.026 * m], 0.025); // biceps
  oe(sum(S, mul(dArm, 0.13), mul(Z, -0.018)), dArm, Z, [0.03 * m, 0.1, 0.026 * m], 0.025); // triceps
  el(add(E, mul(lArm, -0.03)), [0.012, 0.012, 0.012], 0.012); // medial epicondyle
  el(add(E, mul(lArm, 0.026)), [0.01, 0.01, 0.01], 0.012); // lateral epicondyle
  el(add(E, mul(Z, -0.022)), [0.014, 0.014, 0.013], 0.012); // olecranon
  G = 'forearm';
  rc(E, W, 0.033 * (F ? 0.9 : 1), 0.021 * (F ? 0.92 : 1), 0.02);
  oe(sum(E, mul(dArm, 0.075), mul(Z, 0.012), mul(lArm, -0.006)), dArm, Z, [0.034 * m, 0.09, 0.024 * m], 0.025); // flexors
  oe(sum(E, mul(dArm, 0.06), mul(lArm, 0.014), mul(Z, -0.004)), dArm, Z, [0.026 * m, 0.085, 0.028 * m], 0.025); // extensors
  oe(W, dArm, Z, [0.027 * handScale, 0.02, 0.0165], 0.015); // wrist
  // ---- hand
  G = 'hand';
  const hs = handScale;
  const SEG = {};
  ob(add(W, mul(dArm, 0.049 * hs)), [lArm, dArm, Z], [0.0295 * hs, 0.036 * hs, 0.0055], 0.0105 * hs, 0.012);
  oe(sum(W, mul(dArm, 0.03 * hs), mul(lArm, 0.022 * hs), mul(Z, 0.009)), add(dArm, mul(lArm, 0.6)), Z, [0.016 * hs, 0.03 * hs, 0.013], 0.012); // thenar
  oe(sum(W, mul(dArm, 0.042 * hs), mul(lArm, -0.026 * hs), mul(Z, 0.006)), dArm, Z, [0.012 * hs, 0.032 * hs, 0.011], 0.012); // hypothenar
  const MC_OFF = [0.0235, 0.008, -0.0075, -0.0225];
  const PL = [[0.042, 0.026, 0.02], [0.046, 0.029, 0.021], [0.043, 0.028, 0.02], [0.034, 0.02, 0.018]];
  const PR = [[0.0094, 0.0084, 0.0076, 0.0068], [0.0097, 0.0087, 0.0078, 0.007], [0.0091, 0.0082, 0.0074, 0.0066], [0.0081, 0.0073, 0.0066, 0.006]];
  const CURL = [0.1, 0.24, 0.38];
  MC_OFF.forEach((o, i) => {
    const base = add(W, add(mul(dArm, 0.012 * hs), mul(lArm, o * 0.55 * hs)));
    const kn = add(W, add(mul(dArm, 0.088 * hs), mul(lArm, o * hs)));
    const fd0 = norm(add(dArm, mul(lArm, o * 1.1)));
    const poly = [kn];
    let p = kn;
    for (let j = 0; j < 3; j++) {
      const dir = norm(add(mul(fd0, Math.cos(CURL[j])), mul(Z, Math.sin(CURL[j]))));
      const q = add(p, mul(dir, PL[i][j] * hs));
      rc(p, q, PR[i][j] * hs, PR[i][j + 1] * hs, 0.004);
      poly.push(q); p = q;
    }
    SEG['m' + (i + 2)] = { a: base, b: kn, ref: Z, lat: X };
    SEG['f' + (i + 2)] = { poly, ref: Z, lat: X };
  });
  const CMC = sum(W, mul(dArm, 0.02 * hs), mul(lArm, 0.02 * hs), mul(Z, 0.01));
  const tm = norm(sum(mul(dArm, 0.72), mul(lArm, 0.42), mul(Z, 0.55)));
  const MCP1 = add(CMC, mul(tm, 0.042 * hs));
  const tp = norm(sum(mul(dArm, 0.86), mul(lArm, 0.2), mul(Z, 0.47)));
  const IP1 = add(MCP1, mul(tp, 0.031 * hs));
  const td = norm(sum(mul(dArm, 0.86), mul(lArm, 0.12), mul(Z, 0.5)));
  const TIP1 = add(IP1, mul(td, 0.026 * hs));
  rc(CMC, MCP1, 0.0125 * hs, 0.0105 * hs, 0.01);
  rc(MCP1, IP1, 0.0105 * hs, 0.0095 * hs, 0.004);
  rc(IP1, TIP1, 0.0095 * hs, 0.0082 * hs, 0.004);
  SEG.f1m = { a: CMC, b: MCP1, ref: Z, lat: X };
  SEG.f1d = { poly: [MCP1, IP1, TIP1], ref: Z, lat: X };
  // ---- leg
  G = 'thigh';
  const aT = norm(vsub(K, H)), aS = norm(vsub(A, K));
  rc(H, K, F ? 0.075 : 0.072, F ? 0.046 : 0.044, 0.03);
  oe(sum(lerp(H, K, 0.48), mul(Z, 0.03), mul(X, 0.004)), aT, Z, [0.058 * m, 0.19, 0.045 * m], 0.04); // quadriceps
  oe(sum(lerp(H, K, 0.82), mul(Z, 0.022), mul(X, -0.032)), aT, Z, [0.03 * m, 0.065, 0.03 * m], 0.03); // vastus medialis
  oe(sum(lerp(H, K, 0.5), mul(X, 0.034)), aT, Z, [0.035 * m, 0.17, 0.045 * m], 0.035); // vastus lateralis
  oe(sum(lerp(H, K, 0.45), mul(Z, -0.035)), aT, Z, [0.055 * m, 0.18, 0.04 * m], 0.035); // hamstrings
  oe(sum(lerp(H, K, 0.24), mul(X, -0.036)), aT, Z, [0.045, 0.12, 0.05], 0.04); // adductors
  oe(add(K, mul(Z, 0.036)), aT, Z, [0.023, 0.027, 0.012], 0.02); // patella
  el(sum(K, mul(X, 0.024), mul(Z, -0.004)), [0.026, 0.028, 0.028], 0.03); // femoral condyles
  el(sum(K, mul(X, -0.024), mul(Z, -0.004)), [0.027, 0.028, 0.028], 0.03);
  G = 'shin';
  rc(K, A, 0.042, 0.025, 0.02);
  oe(sum(lerp(K, A, 0.27), mul(Z, -0.03), mul(X, -0.016)), aS, Z, [0.03 * m, 0.09, 0.035 * m], 0.03); // gastrocnemius medial
  oe(sum(lerp(K, A, 0.25), mul(Z, -0.028), mul(X, 0.017)), aS, Z, [0.027 * m, 0.08, 0.031 * m], 0.03); // gastrocnemius lateral
  oe(sum(lerp(K, A, 0.5), mul(Z, -0.022)), aS, Z, [0.04 * m, 0.1, 0.025 * m], 0.03); // soleus
  oe(sum(lerp(K, A, 0.33), mul(Z, 0.016), mul(X, 0.012)), aS, Z, [0.02, 0.1, 0.02], 0.025); // tibialis anterior
  rc(add(lerp(K, A, 0.68), mul(Z, -0.028)), add(A, [0, -0.02, -0.038]), 0.011, 0.009, 0.015); // Achilles
  el(add(A, [0.027, -0.003, -0.004]), [0.0135, 0.016, 0.014], 0.012); // lateral malleolus
  el(add(A, [-0.026, 0.005, 0.004]), [0.0135, 0.016, 0.014], 0.012); // medial malleolus
  // ---- foot (relative to ankle x)
  G = 'foot';
  const ax = A[0];
  const f = (x, y, z) => [ax + x, y, z];
  el(f(0, 0.038, -0.045), [0.029, 0.034, 0.035], 0.02); // heel
  rc(f(0, 0.078, -0.012), f(-0.002, 0.05, 0.045), 0.03, 0.025, 0.03); // instep
  ob(f(-0.003, 0.036, 0.048), [X, Y, Z], [0.024, 0.009, 0.044], 0.015, 0.025); // midfoot
  el(f(0, 0.024, 0.112), [0.046, 0.019, 0.028], 0.02); // forefoot
  subEl(f(-0.038, 0.0, 0.035), [0.022, 0.022, 0.05], 0.015); // medial arch
  const MTH = [-0.027, -0.012, 0.0, 0.012, 0.023];
  const MTB = [-0.016, -0.007, 0.0, 0.007, 0.014];
  const TZ = [0.128, 0.127, 0.122, 0.115, 0.107];
  const TL = [0.045, 0.034, 0.03, 0.026, 0.022];
  const TR = [0.0125, 0.0086, 0.0081, 0.0077, 0.0073];
  const toeDir = norm([0, -0.12, 1]);
  MTH.forEach((hx, i) => {
    const a = f(hx, 0.022, TZ[i] - 0.004);
    const tip = add(a, mul(toeDir, TL[i]));
    rc(a, tip, TR[i], TR[i] * 0.88, 0.006);
    SEG['mt' + (i + 1)] = { a: f(MTB[i], 0.045, 0.0), b: a, ref: Y, lat: X };
    SEG['t' + (i + 1)] = { a, b: tip, ref: Y, lat: X };
  });
  SEG.uarm = { a: S, b: E, ref: Z, lat: X };
  SEG.farm = { a: E, b: W, ref: Z, lat: X };
  SEG.hand = { a: W, b: add(W, mul(dArm, 0.088 * hs)), ref: Z, lat: X };
  SEG.thigh = { a: H, b: K, ref: Z, lat: X };
  SEG.leg = { a: K, b: A, ref: Z, lat: X };
  SEG.foot = { a: f(0, 0.032, -0.07), b: f(0.003, 0.028, 0.13), ref: Y, lat: X };
  for (const k in SEG) {
    const s = SEG[k];
    if (!s.poly) s.poly = [s.a, s.b];
    s.parts = [];
    let L = 0;
    for (let i = 1; i < s.poly.length; i++) {
      const a = s.poly[i - 1], b = s.poly[i];
      const axis = norm(vsub(b, a));
      let fr = vsub(s.ref, mul(axis, dot(s.ref, axis)));
      fr = norm(fr);
      let l = norm(cross(axis, fr));
      if (dot(l, s.lat) < 0) l = mul(l, -1);
      const sl = len(vsub(b, a));
      s.parts.push({ a, b, axis, f: fr, l, L0: L, sl });
      L += sl;
    }
    s.L = L;
    s.a = s.poly[0]; s.b = s.poly[s.poly.length - 1];
  }
  const SK = { S, E, W, H, K, A, dArm, lArm, footX: ax, handScale: hs, HAND_LEN: 0.088 * hs };
  return { P, SEG, SK };
}

// ------------------------------------------------------------------ GLSL
const fx = (x) => { const s = (+x).toFixed(5); return s.includes('.') ? s : s + '.0'; };
const v3 = (a) => `vec3(${fx(a[0])},${fx(a[1])},${fx(a[2])})`;
function primGLSL(o) {
  if (o.t === 'rc') return `sdRoundCone(q,${v3(o.a)},${v3(o.b)},${fx(o.r1)},${fx(o.r2)})`;
  if (o.t === 'el') return `sdEll(q,${v3(o.c)},${v3(o.r)})`;
  if (o.t === 'oe') return `sdOE(q-${v3(o.c)},${v3(o.ax[0])},${v3(o.ax[1])},${v3(o.ax[2])},${v3(o.r)})`;
  return `sdOB(q-${v3(o.c)},${v3(o.ax[0])},${v3(o.ax[1])},${v3(o.ax[2])},${v3(o.b)},${fx(o.rr)})`;
}
function primBounds(o) {
  if (o.t === 'rc') return [[o.a, o.r1], [o.b, o.r2]];
  if (o.t === 'ob') return [[o.c, len(o.b) + o.rr]];
  return [[o.c, Math.max(...o.r)]];
}
function makeGLSL(P) {
  const groups = [...new Set(P.map((o) => o.g))];
  let s = 'float map(vec3 p){\n vec3 q=vec3(abs(p.x),p.y,p.z);\n float d=1e9; float b;\n';
  for (const g of groups) {
    const ps = P.filter((o) => o.g === g);
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (const o of ps) for (const [c, r] of primBounds(o)) for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], c[i] - r); mx[i] = Math.max(mx[i], c[i] + r); }
    const c = mul(add(mn, mx), 0.5), R = len(vsub(mx, mn)) / 2 + 0.01;
    s += ` b=length(q-${v3(c)})-${fx(R)};\n if(b>0.06){ d=min(d,b); } else {\n`;
    for (const o of ps) {
      if (o.s) s += `  d=-smin(-d,${primGLSL(o)},${fx(o.k)});\n`;
      else if (o.k > 0) s += `  d=smin(d,${primGLSL(o)},${fx(o.k)});\n`;
      else s += `  d=min(d,${primGLSL(o)});\n`;
    }
    s += ' }\n';
  }
  return s + ' return d;\n}\n';
}

// ------------------------------------------------------------------ placement descriptors (model independent)
export const CUN = 0.025;
const Y_UMB = 1.06;
export const ab = (c) => (c >= 0 ? Y_UMB + c * 0.0225 : Y_UMB + c * 0.027);
const ICS = [1.415, 1.38, 1.345, 1.31, 1.275, 1.24, 1.205, 1.17];
export const ics = (n) => ICS[n];
export const ICS_Y = ICS;
export const Tv = (n) => 1.475 - (n - 1) * 0.0265;
export const Lv = (n) => 1.152 - (n - 1) * 0.029;
export const bt = (n) => (n < 12 ? (Tv(n) + Tv(n + 1)) / 2 : (Tv(12) + Lv(1)) / 2);
export const bl = (n) => (n < 5 ? (Lv(n) + Lv(n + 1)) / 2 : Lv(5) - 0.016);
export const Sv = (n) => 1.005 - (n - 1) * 0.025;
const HC = [0, 1.66, 0.0];
const rad = (d) => (d * Math.PI) / 180;

export const F = (cx, y) => ({ k: 'E', o: [cx * CUN, y, 0.5], d: [0, 0, -1], m: { t: 'F', cx, y } });
export const Fm = (x, y) => ({ k: 'E', o: [x, y, 0.5], d: [0, 0, -1], m: { t: 'face' } });
export const B = (cx, y) => ({ k: 'E', o: [cx * CUN, y, -0.5], d: [0, 0, 1], m: { t: 'B', cx, y } });
export const Bm = (x, y) => ({ k: 'E', o: [x, y, -0.5], d: [0, 0, 1], m: { t: 'Bm' } });
export const side = (y, az) => ({ k: 'X', o: [0, y, 0], d: [Math.sin(rad(az)), 0, Math.cos(rad(az))], m: { t: 'side', y, az } });
export const neck = (y, az) => ({ k: 'X', o: [0, y, -0.005], d: [Math.sin(rad(az)), 0, Math.cos(rad(az))], m: { t: 'neck' } });
export const sideHead = (y, z) => ({ k: 'E', o: [0.4, y, z], d: [-1, 0, 0], m: { t: 'headside' } });
export const top = (x, z) => ({ k: 'E', o: [x, 1.9, z], d: [0, -1, 0], m: { t: 'top' } });
export const U = (x, z) => ({ k: 'E', o: [x, 0.45, z], d: [0, 1, 0], m: { t: 'perineum' } });
export const sole = (x, z) => ({ k: 'FT', x, z, up: true, m: { t: 'foot' } });
export const Mf = (y, z) => ({ k: 'MF', y, z, m: { t: 'foot' } });
export const Lf = (y, z) => ({ k: 'LF', y, z, m: { t: 'foot' } });
export const FOOT = (x, z) => ({ k: 'FT', x, z, m: { t: 'foot' } });
export const HAND = (u, w, s) => ({ k: 'HD', u, w, s, m: { t: 'hand' } });
export const Sg = (seg, t, a, m) => ({ k: 'S', seg, t, a, m: m || { t: 'seg' } });
export const ua = (c, a) => Sg('uarm', 1 - (c / 9) * 0.8, a, { t: 'ua', c, a });
export const UA = (t, a) => Sg('uarm', t, a, { t: 'shoulder' });
export const fa = (c, a) => Sg('farm', 1 - c / 12, a, { t: 'fa', c, a });
export const th = (c, a) => Sg('thigh', 1 - (c / 18) * 0.97, a, { t: 'th', c, a });
export const llm = (c, a) => Sg('leg', 1 - c / 13, a, { t: 'llm', c, a });
export const lll = (c, a) => Sg('leg', 1 - c / 16, a, { t: 'lll', c, a });
export const Eo = (o, d) => ({ k: 'E', o, d, m: { t: 'misc' } });
export const Xo = (o, d) => ({ k: 'X', o, d, m: { t: 'misc' } });
export const scalp = (c, lat = 0) => ({ k: 'SC', c, lat, m: { t: 'scalp', c, lat } });

// ------------------------------------------------------------------ model factory
export function createModel(sex) {
  const { P, SEG, SK } = buildPrims(sex);
  // navel: carve at the surface
  const sdf0 = (p) => evalAll(P, p);
  function evalAll(list, p) {
    const q = [Math.abs(p[0]), p[1], p[2]];
    let d = 1e9;
    for (const o of list) {
      const e = evalPrim(o, q);
      d = o.s ? -smin(-d, e, o.k) : smin(d, e, o.k);
    }
    return d;
  }
  {
    let t = 0; const o = [0, Y_UMB, 0.5];
    for (let i = 0; i < 200; i++) { const s = sdf0([0, Y_UMB, 0.5 - t]); if (s < 1e-5) break; t += s; }
    const z = 0.5 - t;
    P.push({ t: 'el', c: [0, Y_UMB, z + 0.004], r: [0.0075, 0.009, 0.008], k: 0.005, s: true, g: 'torso' });
  }
  const sdf = (p) => evalAll(P, p);
  const grad = (p) => {
    const e = 0.0004;
    return norm([sdf([p[0] + e, p[1], p[2]]) - sdf([p[0] - e, p[1], p[2]]), sdf([p[0], p[1] + e, p[2]]) - sdf([p[0], p[1] - e, p[2]]), sdf([p[0], p[1], p[2] + e]) - sdf([p[0], p[1], p[2] - e])]);
  };
  const project = (p) => {
    for (let i = 0; i < 12; i++) { const d = sdf(p); if (Math.abs(d) < 2e-6) break; p = vsub(p, mul(grad(p), d)); }
    return p;
  };
  const entry = (o, d, maxT = 3) => {
    d = norm(d); let t = 0;
    for (let i = 0; i < 500; i++) { const p = add(o, mul(d, t)); const s = sdf(p); if (s < 2e-5) return p; t += s; if (t > maxT) return null; }
    return null;
  };
  const exit = (o, d) => {
    d = norm(d);
    if (sdf(o) >= 0) return project(o);
    let t0 = 0, t1 = 0;
    for (let i = 0; i < 600; i++) { t1 = t0 + 0.002; if (sdf(add(o, mul(d, t1))) > 0) break; t0 = t1; }
    for (let i = 0; i < 24; i++) { const tm = (t0 + t1) / 2; if (sdf(add(o, mul(d, tm))) > 0) t1 = tm; else t0 = tm; }
    return add(o, mul(d, (t0 + t1) / 2));
  };
  // sagittal arc of the scalp for proportional head measurements
  let ARC = null;
  const buildArc = () => {
    const pts = [], s = [0];
    for (let ph = 15; ph <= 245; ph += 0.5) {
      const r = rad(ph);
      pts.push(exit(HC, [0, Math.sin(r), Math.cos(r)]));
      if (pts.length > 1) s.push(s[s.length - 1] + len(vsub(pts[pts.length - 1], pts[pts.length - 2])));
    }
    let iA = 0, iP = pts.length - 1;
    for (let i = 0; i < pts.length; i++) if (pts[i][2] > 0 && pts[i][1] >= 1.735) { iA = i; break; }
    for (let i = pts.length - 1; i >= 0; i--) if (pts[i][2] < 0 && pts[i][1] >= 1.595) { iP = i; break; }
    ARC = { pts, s, sA: s[iA], cun: (s[iP] - s[iA]) / 12 };
  };
  const arcAt = (c) => {
    if (!ARC) buildArc();
    const target = ARC.sA + c * ARC.cun, { s, pts } = ARC;
    let i = 1; while (i < s.length - 1 && s[i] < target) i++;
    const t = (target - s[i - 1]) / (s[i] - s[i - 1] || 1);
    return lerp(pts[i - 1], pts[i], Math.max(0, Math.min(1, t)));
  };
  const segAt = (s, t) => {
    const L = t * s.L;
    let part = s.parts[s.parts.length - 1];
    for (const pp of s.parts) if (L <= pp.L0 + pp.sl + 1e-9) { part = pp; break; }
    const u = Math.max(0, Math.min(1, (L - part.L0) / part.sl));
    return { o: lerp(part.a, part.b, u), part };
  };
  const place = (spec) => {
    let p = null;
    const k = spec.k;
    if (k === 'E') p = entry(spec.o, spec.d);
    else if (k === 'X') p = exit(spec.o, spec.d);
    else if (k === 'SC') {
      const mm = arcAt(spec.c);
      p = spec.lat ? exit(HC, vsub([spec.lat * 0.0135, mm[1], mm[2]], HC)) : mm;
    } else if (k === 'FT') {
      const x = spec.x - 0.115 + SK.footX;
      p = spec.up ? entry([x, -0.2, spec.z], [0, 1, 0]) : entry([x, 0.4, spec.z], [0, -1, 0]);
    } else if (k === 'MF') p = entry([SK.footX - 0.15, spec.y, spec.z], [1, 0, 0]);
    else if (k === 'LF') p = entry([SK.footX + 0.2, spec.y, spec.z], [-1, 0, 0]);
    else if (k === 'HD') {
      const base = add(SK.W, add(mul(SK.dArm, spec.u * SK.HAND_LEN), mul(SK.lArm, spec.w * SK.handScale)));
      const sg = spec.s === 'p' ? 1 : -1;
      p = entry(add(base, [0, 0, 0.2 * sg]), [0, 0, -sg]);
    } else if (k === 'S') {
      const s = SEG[spec.seg];
      if (spec.a === 'tip') { const pp = s.parts[s.parts.length - 1]; p = exit(vsub(pp.b, mul(pp.axis, 0.006)), pp.axis); }
      else {
        const { o, part } = segAt(s, spec.t);
        const a = rad(spec.a);
        p = exit(o, add(mul(part.f, Math.cos(a)), mul(part.l, Math.sin(a))));
      }
    }
    if (!p) p = project(spec.o || [0, 1, 0]);
    p = project(p);
    return { p, n: grad(p) };
  };
  const arcPoints = (c0, c1, n = 40) => { const out = []; for (let i = 0; i <= n; i++) out.push(arcAt(c0 + ((c1 - c0) * i) / n)); return out; };
  return { sex, P, SEG, SK, sdf, grad, project, entry, exit, place, arcPoints, glsl: makeGLSL(P) };
}
