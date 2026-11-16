(function (g) {
'use strict';

function norm(v) {
var s = String(v == null ? '' : v).trim();
if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
if (/^#[0-9a-fA-F]{3}$/.test(s)) return ('#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]).toLowerCase();
return '';
}
function rgb(hex) {
var h = norm(hex) || '#000000';
return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function hex(arr) {
return '#' + arr.map(function (n) {
var v = Math.max(0, Math.min(255, Math.round(n))).toString(16);
return v.length < 2 ? '0' + v : v;
}).join('');
}
function toHsl(a) {
var r = a[0] / 255, gg = a[1] / 255, b = a[2] / 255;
var mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
var l = (mx + mn) / 2, h = 0, s = 0;
if (mx !== mn) {
var d = mx - mn;
s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
if (mx === r) h = (gg - b) / d + (gg < b ? 6 : 0);
else if (mx === gg) h = (b - r) / d + 2;
else h = (r - gg) / d + 4;
h *= 60;
}
return [h, s, l];
}
function fromHsl(h, s, l) {
h = ((h % 360) + 360) % 360;
s = Math.max(0, Math.min(1, s));
l = Math.max(0, Math.min(1, l));
var c = (1 - Math.abs(2 * l - 1)) * s;
var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
var m = l - c / 2;
var seg = Math.floor(h / 60) % 6;
var t = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][seg];
return hex([(t[0] + m) * 255, (t[1] + m) * 255, (t[2] + m) * 255]);
}
function mix(a, b, t) {
var A = rgb(a), B = rgb(b), k = Math.max(0, Math.min(1, Number(t) || 0));
return hex([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k]);
}
function shade(h, dL, sScale) {
var c = toHsl(rgb(h));
return fromHsl(c[0], c[1] * (sScale === undefined ? 1 : sScale), c[2] + dL);
}
function lum(h) {
var a = rgb(h).map(function (v) {
var c = v / 255;
return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
});
return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(a, b) {
var la = lum(a), lb = lum(b);
return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function inkFor(bg, sScale, l0, want, preferDark, refBg) {
var hs = toHsl(rgb(bg));
var ref = refBg || bg;
var mk = function (l) { return fromHsl(hs[0], hs[1] * sScale, l); };
var dirs = preferDark ? [-1, 1] : [1, -1];
for (var d = 0; d < dirs.length; d++) {
var l = l0;
for (var i = 0; i < 90; i++) {
if (contrast(mk(l), ref) >= want) return mk(l);
var next = l + dirs[d] * 0.02;
if (next <= 0.02 || next >= 0.98) break;
l = next;
}
}
var cands = [mk(0.02), mk(0.98), '#000000', '#ffffff'];
var best = cands[0], bestC = contrast(cands[0], ref);
for (var k = 1; k < cands.length; k++) {
var c = contrast(cands[k], ref);
if (c > bestC) { best = cands[k]; bestC = c; }
}
return best;
}

function sealInk(bg, accent, light) {
var w = mix(bg, '#ffffff', light ? 0.86 : 0.62);
var d = mix('#000000', accent, 0.18);
return contrast(w, accent) >= contrast(d, accent) ? w : d;
}

var STEPS_L = [
{ k: 'ink', l: 0.16, s: 0.60, want: 7 },
{ k: 'ink-soft', l: 0.36, s: 0.48, want: 6 },
{ k: 'ink-light', l: 0.47, s: 0.40, want: 5 },
{ k: 'ink-faint', l: 0.60, s: 0.32, want: 4.5 }
];

function lightPalette(base, accent) {
var bg = norm(base) || '#f6f2ea';
var ac = norm(accent) || '#8c3b2e';
var L = toHsl(rgb(bg))[2];
var p = {
bg: bg,
panel: mix(bg, '#ffffff', L > 0.86 ? 0.55 : 0.32),
'panel-2': shade(bg, L > 0.5 ? -0.035 : 0.035),
tab: shade(bg, L > 0.5 ? -0.06 : 0.05, 1.02),
hover: shade(bg, L > 0.5 ? -0.025 : 0.03),
active: shade(bg, L > 0.5 ? -0.05 : 0.05, 1.02),
accent: ac
};

var surface = p.tab;
STEPS_L.forEach(function (st) {
p[st.k] = inkFor(bg, st.s, st.l, st.want, L > 0.45, surface);
});
p.border = mix(bg, p.ink, 0.14);
p['border-soft'] = mix(bg, p.ink, 0.08);
p['seal-ink'] = sealInk(bg, ac, true);
p.shadow = '0 6px 18px rgba(' + rgb(p.ink).join(',') + ',.13)';
return p;
}

function darkPalette(base, accent) {
var src = norm(base) || '#f6f2ea';
var hs = toHsl(rgb(src));

var S = hs[1] < 0.012 ? 0.012 : Math.min(Math.max(hs[1] * 3.2, 0.10), 0.20);
var bg = fromHsl(hs[0], S * 0.8, 0.095);
var ac = norm(accent) || '#8c3b2e';
var p = {
bg: bg,
panel: fromHsl(hs[0], S * 0.85, 0.128),
'panel-2': fromHsl(hs[0], S * 0.7, 0.072),
tab: fromHsl(hs[0], S * 0.9, 0.145),
hover: fromHsl(hs[0], S * 0.9, 0.158),
active: fromHsl(hs[0], S * 0.9, 0.178),
accent: mix(ac, '#ffffff', toHsl(rgb(ac))[2] < 0.45 ? 0.34 : 0.16)
};

var steps = [
{ k: 'ink', l: 0.90, s: 2.6, want: 7 },
{ k: 'ink-soft', l: 0.74, s: 2.0, want: 6 },
{ k: 'ink-light', l: 0.62, s: 1.5, want: 5 },
{ k: 'ink-faint', l: 0.48, s: 1.1, want: 4.5 }
];
steps.forEach(function (st) {
p[st.k] = inkFor(bg, st.s, st.l, st.want, false, p.active);
});
p.border = mix(bg, p.ink, 0.18);
p['border-soft'] = mix(bg, p.ink, 0.10);
p['seal-ink'] = sealInk(bg, p.accent, false);
p.shadow = '0 6px 18px rgba(0,0,0,.42)';
return p;
}

var TINTS = [
{ id: 'xuan', label: '宣纸', base: '#f7f3ea', accent: '#8c3b2e' },
{ id: 'zhuqing', label: '竹青', base: '#eef3ef', accent: '#2f6b52' },
{ id: 'chayan', label: '茶烟', base: '#f5eee3', accent: '#96602a' },
{ id: 'daishan', label: '黛山', base: '#eef1f6', accent: '#3a5688' },
{ id: 'ouhe', label: '藕荷', base: '#f8f0f2', accent: '#8e4160' },
{ id: 'xiangye', label: '缃叶', base: '#f8f0da', accent: '#9a6b12' },
{ id: 'moyu', label: '墨玉', base: '#f1f1f2', accent: '#4a4a52' },
{ id: 'qiushui', label: '秋水', base: '#eef4f7', accent: '#1f6b85' },
{ id: 'xueqing', label: '雪青', base: '#f3eff7', accent: '#6b4a8c' },
{ id: 'like', label: '栗壳', base: '#efe8de', accent: '#6f4526' },
{ id: 'songhua', label: '松花', base: '#f2f4e3', accent: '#5f7527' },
{ id: 'yanzhi', label: '胭脂', base: '#fbf0ef', accent: '#b03a4e' },
{ id: 'yuebai', label: '月白', base: '#ffffff', accent: '#8c3b2e' },
{ id: 'huijie', label: '灰阶', base: '#f4f4f4', accent: '#2b2b2b' }
];
var CUSTOM = 'custom';

function tint(id) {
for (var i = 0; i < TINTS.length; i++) if (TINTS[i].id === id) return TINTS[i];
return TINTS[0];
}
function palette(id, mode, custom) {
if (id === CUSTOM) {
var c = custom || {};
var base = norm(c.base) || TINTS[0].base;
var ac = norm(c.accent) || TINTS[0].accent;
return mode === 'dark' ? darkPalette(base, ac) : lightPalette(base, ac);
}
var t = tint(id);
return mode === 'dark' ? darkPalette(t.base, t.accent) : lightPalette(t.base, t.accent);
}

function swatch(id, mode, custom) {
var p = palette(id, mode, custom);
return { bg: p.bg, panel: p.panel, ink: p.ink, accent: p.accent, border: p.border };
}

g.Tint = {
TINTS: TINTS, CUSTOM: CUSTOM,
norm: norm, mix: mix, shade: shade, contrast: contrast, luminance: lum,
tint: tint, palette: palette, swatch: swatch,
lightPalette: lightPalette, darkPalette: darkPalette
};
})(window);
