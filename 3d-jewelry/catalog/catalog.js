// Catalogue mode for Pendant Lab (v22 and later).
// Everything the catalogue needs lives in this folder: this file and pieces.js (the traced outlines).
// The lab only imports this file if it exists; delete the folder and the Catalogue button simply never appears.
import { PIECES } from './pieces.js';

const STONE = {
  labd: ['Lab diamond', '#F3F6F9'], wtop: ['White topaz', '#EAF0F5'], pcz: ['Pink CZ', '#F2A2C3'],
  garnet: ['Garnet', '#6E0F1E'], amethyst: ['Amethyst', '#8A4DB3'], skyt: ['Sky blue topaz', '#A3D2EE'], emerald: ['Emerald', '#1E8A57'],
  pinks: ['Pink sapphire', '#EE8BB4'], ruby: ['Ruby', '#B80F37'], peridot: ['Peridot', '#9BC23C'], citrine: ['Citrine', '#F0AE2E'],
  rhodo: ['Rhodolite', '#A8386A'], blues: ['Blue sapphire', '#1E4CAD'], swiss: ['Swiss blue topaz', '#2BA3D8']
};
const TWELVE = ['garnet', 'amethyst', 'skyt', 'labd', 'emerald', 'pinks', 'ruby', 'peridot', 'citrine', 'rhodo', 'blues', 'swiss'];
const SETNAME = { star: 'star set, flush', bezel: 'bezel', channel: 'between two walls', prong3: '3 ball prongs', prong4: '4 prongs' };
const CUTNAME = { round: 'round', square: 'square' };
const FIN = { polish: 'polished', matte: 'matte', soft: 'soft polish', satin: 'satin' };
const GROUP_OF = { Charm: 'Charms', Pendant: 'Pendants', 'Bracelet link': 'Links and stations', 'Chain station': 'Links and stations' };

export function install(L) {
  const { S, SHAPE, GROUPS, TABS, $, THREE } = L;
  const byId = {}, keyOf = id => 'cat_' + id;

  // ---------- 1. the pieces become shapes the lab can load ----------
  for (const p of PIECES) {
    byId[p.id] = p; const r = p.ring, small = Math.min(p.h, p.w || p.h);
    const T = p.t, d = p.depth || (p.style === 'flat'
      ? { thick: T, puff: 0, edgeR: Math.min(0.35, T * 0.3), edgeShape: 0.9, side: T * 0.35, back: 'flat' }
      : { thick: T * 0.5, puff: T * 0.25, edgeR: Math.min(1.6, small * 0.14, T * 0.45), edgeShape: 1, side: 0, back: 'puff' });
    const extra = { soften: 0.06, cornerR: 0.12, wobble: 0, tilt: 0, metal: p.metal, finish: p.finish, chain: p.chain, beadMode: 'off', ribs: 0, winType: 'none', archOn: false, rimOn: false, frameOn: false,
      ...(r ? { ringShape: r.shape, ringSit: r.sit, ringID: r.id, wire: r.wire, ringRatio: r.ratio || 1.3, ringProf: 'round', neckH: r.neck ?? 0.6, neckW: 1.0, attach: r.attach || 'grow', ringAt: r.at.slice() } : { ringShape: 'none' }),
      hamOn: !!p.ham, ...(p.ham || {}), ...(p.ribs ? { ribs: p.ribs.ribs, ribD: p.ribs.ribD } : {}), ...d };
    SHAPE[keyOf(p.id)] = { name: p.id + ' ' + p.name, style: p.style, sym: p.sym, pts: p.pts.map(([x, y, c]) => ({ x, y, c: !!c })), extra, cat: p };
  }
  const groups = {}; for (const p of PIECES) (groups[GROUP_OF[p.kind] || 'Other'] = groups[GROUP_OF[p.kind] || 'Other'] || []).push([keyOf(p.id), p.id + ' ' + p.name]);
  GROUPS.catalog = ['Charms', 'Pendants', 'Links and stations', 'Other'].filter(g => groups[g]).map(g => [g, groups[g]]);

  // the whole outline (mirror filled in), for the sheet size and the extra loops
  const fullOf = s => { const h = s.pts.map(p => [p.x, p.y]); return s.sym ? h.concat(h.slice(1, -1).reverse().map(([x, y]) => [-x, y])) : h; };
  const bboxOf = a => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of a) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 }; };

  L.hooks.loadShape = (k, s) => {
    if (!s.cat) return; const p = s.cat, F = fullOf(s);
    S.cat = p.id; S.ringUp = p.ring ? p.ring.up : null; if (p.ribs) { S.ribTop = !!p.ribs.top; S.ribR0 = p.ribs.r0 ?? null; }
    S.stones = (p.stones || []).map(st => ({ ...st }));
    S.extra = (p.extra || []).map(e => { if (e[0] == null && e[1] === 'bottom') { const b = F.reduce((a, q) => q[1] < a[1] ? q : a, F[0]); return { at: [b[0], b[1]], v: e[2] || null }; } return { at: [e[0], e[1]], v: e[2] || null }; });
    lastKey = k;
  };

  // ---------- 2. the Catalogue button, next to Charm, Pendant and Signet ring ----------
  let lastKey = keyOf(PIECES[0].id);
  const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'modeK'; btn.textContent = 'Catalogue'; btn.setAttribute('aria-pressed', 'false');
  $('modeS').after(btn);
  btn.onclick = () => { if (S.kind === 'catalog') return; if (S.mode !== 'pendant') L.setMode('pendant'); S.kind = 'catalog'; L.fillPresets(); L.redrawPresets(); L.loadShape(lastKey); L.showTab('shape'); L.commit(); L.syncUI(); };

  // ---------- 3. the Sheet tab: what the design sheet says, a check against it, the stone, and Reset to catalogue ----------
  const css = document.createElement('style'); css.textContent = `
  .catfacts{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:12px;line-height:1.35}.catfacts dt{color:var(--soft);white-space:nowrap}.catfacts dd{margin:0;color:var(--ink)}
  .catcheck{display:grid;grid-template-columns:auto auto auto auto;gap:3px 12px;font-size:12px;align-items:baseline}.catcheck .h{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--soft)}
  .catcheck .ok{color:#3D7A4A;font-weight:600}.catcheck .off{color:#9A3324;font-weight:600}.catcheck .soft{color:var(--soft)}
  .catnote{font-size:11.5px;line-height:1.4;color:var(--soft);margin:6px 0 0}
  #catStones .sw{width:18px;height:18px;border-radius:50%;display:block;border:1px solid rgba(0,0,0,.18)}
  #modeK[aria-pressed="true"]{background:var(--act);color:var(--onact)}
  @media (max-width:560px){.catfacts,.catcheck{font-size:11.5px}}`;
  document.head.append(css);
  const tab = document.createElement('button'); tab.type = 'button'; tab.setAttribute('role', 'tab'); tab.dataset.tab = 'piece'; tab.setAttribute('aria-selected', 'false'); tab.id = 'pieceTab'; tab.hidden = true;
  tab.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/></svg>Sheet';
  $('tipsBtn').before(tab); tab.addEventListener('click', () => L.showTab('piece', true));
  TABS.piece = ['piece'];
  const panel = document.createElement('section'); panel.className = 'panel'; panel.dataset.title = 'Sheet'; panel.dataset.panel = 'piece'; panel.hidden = true;
  panel.innerHTML = `
  <div class="grp" data-g="From the design sheet"><dl class="catfacts" id="catFacts"></dl><p class="catnote" id="catNote"></p></div>
  <div class="grp" data-g="Check against the sheet"><div class="catcheck" id="catCheck"></div><p class="catnote">Live: it follows your edits, so a changed size shows here.</p></div>
  <div class="grp" data-g="Stone" id="catStoneGrp">
    <div class="picks" id="catStones"></div>
    <div class="row"><label for="catStoneD">Stone size</label><input type="range" id="catStoneD" min="0.8" max="4" step="0.05"><input type="text" id="catStoneDN" inputmode="decimal" autocomplete="off" class="num" aria-label="Stone size in mm"></div>
  </div>
  <div class="grp" data-g="Back to the sheet"><div class="btns"><button type="button" class="b main" id="catReset">Reset to catalogue</button></div><p class="catnote">Puts the outline, size, bail, stone, metal and finish back exactly as on the sheet.</p></div>`;
  document.querySelector('[data-panel="finish"]').after(panel);

  const fmt = n => (Math.round(n * 100) / 100).toString();
  const facts = p => {
    const st = (p.stones || [])[0], r = p.ring;
    const rows = [['Piece', `${p.id} · ${p.kind.toLowerCase()}`], ['Size', `${fmt(p.h)} mm high${p.w ? ' × ' + fmt(p.w) + ' mm wide' : ''}`], ['Thickness', fmt(p.t) + ' mm'],
      ['Stone', st ? `${STONE[st.color][0]}, ${CUTNAME[st.cut]} ${st.cut === 'square' ? fmt(st.d) + ' × ' + fmt(st.d) : fmt(st.d)} mm, ${SETNAME[st.set]}` : 'none'],
      ['Bail', r ? `${r.attach === 'hole' ? 'ring through a hole' : 'loop'} ${fmt(r.id)} mm inside, ${fmt(r.wire)} mm wire${(p.extra || []).length ? ', plus a second loop' : ''}` : 'none, set straight onto the chain'],
      ['Metal', 'sterling silver 925'], ['Finish', FIN[p.finish] || p.finish], ['Weight', '± ' + fmt(p.g) + ' g silver']];
    $('catFacts').innerHTML = rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join(''); $('catNote').textContent = p.note || '';
  };
  // stone colours: the sheet's own stone first, then the rest
  const stonePicks = p => {
    const box = $('catStones'); box.replaceChildren(); const st = (S.stones || [])[0]; $('catStoneGrp').hidden = !st; if (!st) return;
    const own = (p.stones[0] || {}).color, list = [own, ...(p.colors === 'all' ? TWELVE : []), 'labd', 'wtop', 'pcz', ...TWELVE].filter((c, i, a) => c && a.indexOf(c) === i);
    for (const c of list) { const b = document.createElement('button'); b.type = 'button'; b.className = 'pk'; b.title = STONE[c][0]; b.setAttribute('aria-label', STONE[c][0]); b.setAttribute('aria-pressed', String(st.color === c));
      b.innerHTML = `<span class="sw" style="background:${STONE[c][1]}"></span><small>${STONE[c][0].split(' ').pop().replace('diamond', 'Diamond')}</small>`;
      b.onclick = () => { for (const s2 of S.stones) s2.color = c; L.rebuild(false); L.commit(); stonePicks(p); }; box.append(b); }
    $('catStoneD').value = st.d; $('catStoneDN').value = fmt(st.d);
  };
  { const r = $('catStoneD'), n = $('catStoneDN'), set = x => { x = Math.min(4, Math.max(0.8, x)); for (const s2 of S.stones) s2.d = x; r.value = x; n.value = fmt(x); };
    r.addEventListener('input', () => { set(+r.value); L.rebuild(true); }); r.addEventListener('change', () => { L.rebuild(false); L.commit(); });
    n.addEventListener('change', () => { const x = parseFloat(String(n.value).replace(',', '.')); if (isFinite(x)) { set(x); L.rebuild(false); L.commit(); } else n.value = r.value; }); }
  const resetToSheet = () => { if (!S.cat) return; L.loadShape(keyOf(S.cat)); L.commit(); L.syncUI(); };
  $('catReset').onclick = resetToSheet;

  // the check: what the lab makes now, next to the printed numbers
  let ext = null; // overall sizes including loops and prongs, measured in afterBody
  const check = () => {
    const p = byId[S.cat]; if (!p || !$('catCheck')) return; const I = L.info(), st = (S.stones || [])[0];
    const tol = (a, b, rel = 0.03) => Math.abs(a - b) <= Math.max(0.06, b * rel);
    const hLab = p.fitH === 'ext' ? I.total : p.id === 'D008' && ext ? ext.h : I.h, wLab = p.w && ext && (p.id === 'D007' || p.id === 'D008') ? ext.w : I.w;
    const rows = [['Height', hLab, p.h, p.fitH === 'ext' ? 'with loop' : p.id === 'D008' ? 'with prongs' : ''], ['Width', wLab, p.w, p.id === 'D007' || p.id === 'D008' ? 'with loops' : ''], ['Thickness', I.thick, p.t, ''],
      ...(st ? [['Stone', st.d, p.stones[0].d, '']] : [])];
    let html = '<span class="h">&nbsp;</span><span class="h">Lab</span><span class="h">Sheet</span><span class="h">&nbsp;</span>';
    for (const [k, a, b, n] of rows) { if (!(isFinite(a))) continue; html += `<span>${k}${n ? ' <span class="soft">' + n + '</span>' : ''}</span><span>${fmt(a)}</span><span>${b ? fmt(b) : '<span class="soft">–</span>'}</span>` + (b ? (tol(a, b) ? '<span class="ok">✓</span>' : `<span class="off">${a > b ? '+' : ''}${fmt(a - b)}</span>`) : '<span></span>'); }
    const gw = I.g, gs = p.g; html += `<span>Weight <span class="soft">silver</span></span><span>${fmt(gw)} g</span><span>${fmt(gs)} g</span>` + (Math.abs(gw - gs) <= gs * 0.3 ? '<span class="ok">≈</span>' : `<span class="soft">${gw > gs ? '+' : ''}${Math.round((gw - gs) / gs * 100)}%</span>`);
    $('catCheck').innerHTML = html;
  };

  // ---------- 4. stones and settings, built after the body each time ----------
  const gemMats = {}; const gemMat = c => gemMats[c] || (gemMats[c] = new THREE.MeshPhysicalMaterial({ color: STONE[c] ? STONE[c][1] : '#eee', metalness: 0.35, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0, ior: 2.2, envMapIntensity: 1.6, flatShading: true }));
  const darkMat = new THREE.MeshBasicMaterial({ color: 0x3B2A22, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const lathe = (prof, seg, phi = 0) => { const g = new THREE.LatheGeometry(prof.map(([r, z]) => V2(r, z)), seg, phi); g.rotateX(Math.PI / 2); return g; }; // lathe stands on y; turn it so it stands on z
  const gemGeo = (d, cut) => { const sq = cut === 'square', r = sq ? d / Math.SQRT2 : d / 2;
    return lathe([[0, -0.43 * d], [r, 0], [r, 0.03 * d], [r * (sq ? 0.7 : 0.57), 0.17 * d], [0, 0.17 * d]], sq ? 4 : 16, sq ? Math.PI / 4 : 0); };
  const tube = (ri, ro, z0, z1, seg = 40) => lathe([[ri, z0], [ro, z0], [ro, z1], [ri, z1], [ri, z0]], seg);
  const rod = (x0, y0, z0, x1, y1, z1, rad) => { const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0), g = new THREE.CylinderGeometry(rad, rad, len, 10); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x1 - x0, y1 - y0, z1 - z0).normalize()); g.applyQuaternion(q); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return g; };
  const ball = (x, y, z, r) => { const g = new THREE.SphereGeometry(r, 14, 10); g.translate(x, y, z); return g; };
  const rotAbout = (x, y, c, deg) => { const a = deg * Math.PI / 180, dx = x - c[0], dy = y - c[1]; return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };
  let lastStones = [];
  L.hooks.afterBody = ({ v, O, hz, add, mat }) => {
    ext = null; lastStones = []; if (S.kind !== 'catalog' || !S.cat) return; const p = byId[S.cat];
    const topAt = (x, y) => { const q = hz(x, y); return q.c + q.h; };
    let ex = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 }; const grow = (x, y, r = 0) => { ex.x0 = Math.min(ex.x0, x - r); ex.x1 = Math.max(ex.x1, x + r); ex.y0 = Math.min(ex.y0, y - r); ex.y1 = Math.max(ex.y1, y + r); };
    for (const q of O.full) grow(q[0], q[1]);
    const I = L.info(); for (const r of [I.grow, ...(I.xrings || [])]) if (r && r.gridPath) for (const q of r.gridPath) grow(q[0], q[1], (r.gridW || 0) / 2);
    for (const st0 of S.stones || []) {
      const [x, y] = rotAbout(st0.x, st0.y, O.anU || [0, 0], v.tilt || 0), d = st0.d, r = st0.cut === 'square' ? d / 2 : d / 2, top = topAt(x, y);
      let girdle = top - 0.13 * d; // star and channel: the table sits about level with the metal
      if (st0.set === 'bezel') { girdle = top - 0.06 * d; const g = tube(r - 0.04, r + 0.16, top - 0.35, top + 0.1); g.translate(x, y, 0); add(g); }
      if (st0.set === 'channel') { const bb = L.bbox(O.base), w = 0.32, zt = top + 0.12; for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(w, Math.min(bb.h, d) + 0.02, zt - (top - 0.5)); g.translate(x + sx * (d / 2 + w / 2 - 0.02), y, (zt + top - 0.5) / 2); add(g); } }
      if (st0.set === 'prong3' || st0.set === 'prong4') { girdle = top + 0.32 * d; const n = st0.set === 'prong3' ? 3 : 4, a0 = n === 3 ? 0 : Math.PI / 4, pr = Math.max(0.09, d * 0.075), R = r + pr * (n === 3 ? 1.5 : 0.35);
        const basket = tube(r * 0.55, r * 0.55 + 0.14, top - 0.2, girdle - 0.05 * d, 24); basket.translate(x, y, 0); add(basket);
        for (let k = 0; k < n; k++) { const a = a0 + k * 2 * Math.PI / n, px = x + R * Math.cos(a), py = y + R * Math.sin(a); add(rod(px, py, top - 0.15, px, py, girdle + 0.1 * d, pr)); const tip = n === 3 ? pr * 2.4 : pr * 1.25; add(ball(px, py, girdle + 0.1 * d, tip)); grow(px, py, tip); } }
      if (st0.set === 'star') { const zz = top + 0.012, s2 = Math.max(0.22, d * 0.2), R0 = r + 0.12; // four little cut marks pointing at the stone
        for (let k = 0; k < 4; k++) { const a = Math.PI / 2 + k * Math.PI / 2, ux = Math.cos(a), uy = Math.sin(a), tx = -uy, ty = ux, ax = x + ux * R0, ay = y + uy * R0, bx = x + ux * (R0 + s2 * 1.4), by = y + uy * (R0 + s2 * 1.4);
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([ax, ay, zz, bx + tx * s2 * 0.5, by + ty * s2 * 0.5, zz, bx - tx * s2 * 0.5, by - ty * s2 * 0.5, zz], 3)); add(g, false, darkMat); } }
      const gg = gemGeo(d, st0.cut); gg.translate(x, y, girdle); add(gg, false, gemMat(st0.color));
      lastStones.push({ x, y, d, cut: st0.cut, color: st0.color, set: st0.set });
    }
    if (p.milgrain && L.isoLoop) { try { const lp = L.isoLoop(O.base, p.milgrain), br = 0.085; let acc = 0, prev = lp[lp.length - 1];
      for (const q of lp) { acc += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; if (acc < 0.22) continue; acc = 0; add(ball(q[0], q[1], topAt(q[0], q[1]) - br * 0.25, br)); } } catch (e) {} }
    ext = { w: ex.x1 - ex.x0, h: ex.y1 - ex.y0 };
  };
  L.hooks.grid = ({ svg, el, ink }) => {
    if (S.kind !== 'catalog') return;
    for (const s of lastStones) { const c = STONE[s.color] ? STONE[s.color][1] : '#eee';
      if (s.cut === 'square') svg.append(el('rect', { x: s.x - s.d / 2, y: -s.y - s.d / 2, width: s.d, height: s.d, fill: c, stroke: ink, 'stroke-width': 0.06 }));
      else svg.append(el('circle', { cx: s.x, cy: -s.y, r: s.d / 2, fill: c, stroke: ink, 'stroke-width': 0.06 }));
      svg.append(el('path', { d: `M${s.x - s.d * 0.18} ${-s.y}H${s.x + s.d * 0.18}M${s.x} ${-s.y - s.d * 0.18}V${-s.y + s.d * 0.18}`, stroke: ink, 'stroke-width': 0.04, 'stroke-opacity': 0.5 })); }
    check();
  };
  L.hooks.tryPiece = ({ g, E2, tx }) => { if (S.kind !== 'catalog') return; for (const s of lastStones) { const [cx, cy] = tx([s.x, s.y]); g.append(E2('circle', { cx, cy, r: s.d / 2, fill: STONE[s.color] ? STONE[s.color][1] : '#eee', stroke: '#9C7A3C', 'stroke-width': 0.12 })); } };

  // ---------- 5. size buttons: back to the sheet size, or a few set sizes (longest side of the body) ----------
  const sheetScale = () => { const s = SHAPE[keyOf(S.cat)], a = bboxOf(fullOf(s)), b = bboxOf(fullOf({ sym: S.sym, pts: S.pts })); return Math.max(a.w, a.h) / Math.max(b.w, b.h); };
  L.hooks.sizes = seg => {
    const I = L.info(), bm = Math.max(I.w || 0, I.h || 0), atSheet = S.cat && Math.abs(sheetScale() - 1) < 0.01;
    const mk = (label, on, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', String(on)); b.onclick = e => { e.stopPropagation(); fn(); }; return b; };
    seg.replaceChildren(mk('Sheet', !!atSheet, () => { const g = sheetScale(); if (Math.abs(g - 1) < 1e-3) return; L.scalePts(g, g); L.rebuild(false); L.commit(); L.syncUI(); }),
      ...[5, 10, 15].map((n, i) => mk(n + (i === 0 ? ' mm' : ''), !atSheet && Math.abs(bm - n) < 0.15, () => L.setSize(n))));
  };

  // ---------- 6. keep the buttons, tab and panel in step with the mode ----------
  const sync = () => {
    const on = S.kind === 'catalog' && S.mode === 'pendant'; btn.setAttribute('aria-pressed', String(on)); tab.hidden = !on;
    if (!on && tab.getAttribute('aria-selected') === 'true') L.showTab('shape');
    $('resetB').textContent = on ? 'Reset to catalogue' : 'Reset'; $('resetB').title = on ? 'Back to the design sheet' : 'Back to how this shape started';
    if (on && S.cat) { const p = byId[S.cat]; facts(p); stonePicks(p); }
  };
  L.hooks.sync = sync; L.hooks.mode = sync; L.hooks.reset = () => { L.syncUI(); };
  sync();
}
