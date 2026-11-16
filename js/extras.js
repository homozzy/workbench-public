(function (g) {
'use strict';

var S = g.S, A = g.App;
var esc = A.esc, $ = A.$;

var idx = null, idxAt = 0;

function caseText(c) {
return String((c && (c.content || c.text)) || '');
}

function buildIndex() {
var db = S.db, out = [];

function push(mod, kind, title, text, id, tab) {

var tags = S.parseTags ? S.parseTags(title + ' ' + text) : [];
var hay = (title + ' ' + text + ' ' + tags.map(function (t) { return '#' + t; }).join(' ')).toLowerCase();
out.push({ mod: mod, kind: kind, title: title, text: text, id: id || '', hay: hay, tab: tab || '' });
}

(S.liveNotes() || []).forEach(function (n) {
var head = n.book ? '《' + n.book + '》' : (n.source || '笔记');
push('notes', '笔记', head, String(n.content || ''), n.id);

(n.caseNotes || []).forEach(function (c) {
var t = caseText(c);
if (!t) return;
push('notes', '案评', head + ' · 案评', t, n.id);
});
});

(db.todos || []).forEach(function (t) {
var txt = String(t.text || '');
if (!txt) return;
push('overview', '待办', txt,
[t.cat === 'important' ? '重要' : '紧急',
t.due ? String(t.due).replace('T', ' ') : '',
t.done ? '已完成' : ''].join(' '), t.id);
});

(db.keywords || []).forEach(function (k) {
var w = String(k.word || '');
if (!w) return;
push('notes', '关键词', w, (Array.isArray(k.aliases) ? k.aliases : []).join(' '), k.id, 'kw');
});

(db.books || []).forEach(function (b) {
push('books', '书', b.title || '无题',
[b.author, b.category, b.note, b.status === 'done' ? '已读' : '在读'].join(' '), b.id);
});

(db.timeline || []).forEach(function (t) {
push('chronicle', '大事记', t.title || '', [t.date, t.tag].join(' '), t.id);
});

Object.keys(db.diary || {}).forEach(function (d) {
var v = db.diary[d] || {};

push('diary', '日记', d, String(v.text || ''), d);
});

(db.ledger || []).forEach(function (x) {
push('ledger', '账', (x.category || '') + ' ' + (x.amount || 0) + ' 元',
[x.note, x.sub, x.date, x.type === 'in' ? '收入' : '支出'].join(' '), x.id);
});

(db.docs || []).forEach(function (d) {
push('docs', '文档', d.title || '无题', String(d.content || ''), d.id);
});

(db.links || []).forEach(function (l) {

push('beach', '网址', l.name || l.title || l.url || '链接',
[l.url, l.note, l.desc, l.cat, l.tag].join(' '), l.id);
});

(db.words || []).forEach(function (w) {
push('words', '词', w.w || '', [w.ph, w.mean, w.eg, w.tag].join(' '), w.id);
});

((db.site && db.site.posts) || []).forEach(function (p) {
var t = String(p.text || '');
push('site', '碎碎念', t.slice(0, 18) || '碎碎念', t, p.id);
});

((db.site && db.site.items) || []).forEach(function (it) {
var t = String(it.text || '');
push('site', '网站', String(it.title || '') || t.slice(0, 18) || '作品',
[t, it.url, it.p].join(' '), it.id);
});

return out;
}

function getIndex() {
var now = Date.now();

if (!idx || now - idxAt > 8000) { idx = buildIndex(); idxAt = now; }
return idx;
}

function resetIndex() { idx = null; }

function escapeRe(s) {
return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hl(text, terms) {
var out = esc(text);
terms.forEach(function (t) {
if (!t) return;
var e = esc(t);
if (!e) return;
out = out.replace(new RegExp(escapeRe(e), 'gi'), function (m) {
return '<mark>' + m + '</mark>';
});
});
return out;
}

function snippet(item, terms) {
var t = item.text || '';
var low = t.toLowerCase();
var at = -1;
for (var i = 0; i < terms.length && at < 0; i++) at = low.indexOf(terms[i]);
if (at < 0) {
return t ? hl(t.slice(0, 60), terms) + (t.length > 60 ? '…' : '') : '';
}
var from = Math.max(0, at - 24);
var piece = t.slice(from, from + 76).replace(/\s+/g, ' ');
return (from > 0 ? '…' : '') + hl(piece, terms) + (from + 76 < t.length ? '…' : '');
}

var palEl = null, palIn = null, palList = null;
var palHits = [], palSel = 0, palTerms = [];

function ensurePal() {
if (palEl) return;
palEl = document.createElement('div');
palEl.className = 'pal-mask';
palEl.innerHTML =
'<div class="pal">' +
'  <input class="pal-in" type="text" placeholder="搜笔记 · 案评 · 书 · 待办 · 关键词 · 日记 · 账 · 文档 · 网址 · 作品" autocomplete="off" spellcheck="false">' +
'  <div class="pal-list"></div>' +
'  <div class="pal-foot"><span>↑ ↓ 选择</span><span>Enter 打开</span><span>Esc 关闭</span></div>' +
'</div>';
document.body.appendChild(palEl);
palIn = palEl.querySelector('.pal-in');
palList = palEl.querySelector('.pal-list');

palIn.addEventListener('input', function () { renderPal(); });
palIn.addEventListener('keydown', onPalKey);
palEl.addEventListener('mousedown', function (e) {
if (e.target === palEl) closePal();
});
palList.addEventListener('click', function (e) {
var row = e.target.closest('.pal-hit');
if (!row) return;
var it = palHits[Number(row.dataset.i)];
if (it) goHit(it);
});
}

function openPal(pre) {
ensurePal();
resetIndex();
palEl.classList.add('on');
palIn.value = pre || '';
palIn.focus();
renderPal();
}

function closePal() {
if (palEl) palEl.classList.remove('on');
}

A.palOpen = openPal;

function recentList() {
try {
var v = JSON.parse(localStorage.getItem('gzt.recent') || '[]');
return Array.isArray(v) ? v : [];
} catch (e) { return []; }
}
function rememberHit(it) {
if (!it || !it.mod) return;
try {
var list = recentList().filter(function (x) { return !(x.mod === it.mod && x.id === it.id); });
list.unshift({ mod: it.mod, id: it.id, title: it.title, kind: it.kind, tab: it.tab || '', at: Date.now() });
localStorage.setItem('gzt.recent', JSON.stringify(list.slice(0, 8)));
} catch (e) { }
}

function onPalKey(e) {
if (e.key === 'Escape') { e.preventDefault(); closePal(); return; }
if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
e.preventDefault();
if (!palHits.length) return;
palSel += (e.key === 'ArrowDown' ? 1 : -1);
if (palSel < 0) palSel = palHits.length - 1;
if (palSel >= palHits.length) palSel = 0;
paintSel();
return;
}
if (e.key === 'Enter') {
e.preventDefault();
var it = palHits[palSel];
if (it) goHit(it);
}
}

function paintSel() {
var rows = palList.querySelectorAll('.pal-hit');
for (var i = 0; i < rows.length; i++) {
if (i === palSel) {
rows[i].classList.add('on');
if (rows[i].scrollIntoView) rows[i].scrollIntoView({ block: 'nearest' });
} else {
rows[i].classList.remove('on');
}
}
}

function renderPal() {
var q = (palIn.value || '').trim().toLowerCase();
palTerms = q ? q.split(/\s+/) : [];
if (!q) {
var rec = recentList();
if (!rec.length) {
palHits = [];
palSel = 0;
palList.innerHTML = '<div class="pal-empty">输入关键词开始搜；不区分大小写，空格分开表示「都要有」。<br>' +
'也可以在正文里写 <b>#话题</b>，之后在总览点标签就能跨模块找。</div>';
return;
}
palHits = rec.map(function (x) {
return { mod: x.mod, kind: x.kind || '最近', title: x.title, text: '', id: x.id, hay: '', tab: x.tab || '' };
});
palSel = 0;
palList.innerHTML = '<div class="pal-sec">最近打开</div>' + palHits.map(function (it, n) {
return '<div class="pal-hit' + (n === 0 ? ' on' : '') + '" data-i="' + n + '">' +
'<span class="pal-kind">' + esc(it.kind) + '</span>' +
'<span class="pal-t">' + esc(it.title) + '</span>' +
'<span class="pal-s"></span></div>';
}).join('');
return;
}
var all = getIndex();
var hits = [];
for (var i = 0; i < all.length && hits.length < 40; i++) {
var ok = true;
for (var k = 0; k < palTerms.length; k++) {
if (all[i].hay.indexOf(palTerms[k]) < 0) { ok = false; break; }
}
if (ok) hits.push(all[i]);
}
palHits = hits;
palSel = 0;
if (!hits.length) {
palList.innerHTML = '<div class="pal-empty">没找到。换个词试试？</div>';
return;
}
palList.innerHTML = hits.map(function (it, n) {
return '<div class="pal-hit' + (n === 0 ? ' on' : '') + '" data-i="' + n + '">' +
'<span class="pal-kind">' + esc(it.kind) + '</span>' +
'<span class="pal-t">' + hl(it.title, palTerms) + '</span>' +
'<span class="pal-s">' + snippet(it, palTerms) + '</span>' +
'</div>';
}).join('');
paintSel();
}

function moduleName(id) {
var ms = A.MODULES || [];
for (var i = 0; i < ms.length; i++) {
if (ms[i] && ms[i].id === id) return ms[i].name || id;
}
return id;
}

function hitEl(id) {
try {
return document.querySelector('[data-id="' + String(id).replace(/["\\]/g, '') + '"]');
} catch (e) { return null; }
}

function flashHit(it) {
var el = hitEl(it.id);
if (!el) return false;
if (it.mod === 'docs') { el.click(); return true; }
var box = el.closest('.note, .note-quote, .tl-item, tr, .led-row, .diary-paper, ' +
'.bkcard, .bookcard, .bookitem, .linkitem, .bcard, .vw-row, .st-post, ' +
'.td-item, .st-item') ||
el.closest('div') || el;
try { box.scrollIntoView({ block: 'center' }); } catch (e) {}
box.classList.add('hit-flash');
setTimeout(function () { box.classList.remove('hit-flash'); }, 1800);
return true;
}

function pickTab(it) {
if (!it.tab) return;
try {
var b = document.querySelector('.vtab[data-tab="' + it.tab + '"]');
if (b && !b.classList.contains('on')) b.click();
} catch (e) { }
}

function goHit(it) {
closePal();
rememberHit(it);
try { if (A.landReset) A.landReset(it.mod, it.id); } catch (e) { }
A.openModule(it.mod);

setTimeout(function () {
pickTab(it);
if (!it.id) return;
if (flashHit(it)) return;
setTimeout(function () {
if (flashHit(it)) return;
A.toast('这条在「' + moduleName(it.mod) + '」里更靠后，已经先把页面切过去了', 'err');
}, 260);
}, 90);
}

document.addEventListener('keydown', function (e) {
var k = e.key || '';
if ((e.ctrlKey || e.metaKey) && (k === 'k' || k === 'K')) {
e.preventDefault();
openPal();
}
});

function pad2(n) { return (n < 10 ? '0' : '') + n; }

function fmtWhen(sec) {
var d = new Date(sec * 1000);
return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' +
pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

function fmtISO(s) {
var d = new Date(s);
if (isNaN(d.getTime())) return String(s || '').slice(0, 11);
return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' +
pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function histFull(s) {
var d = new Date(s);
return isNaN(d.getTime()) ? String(s || '') :
d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' +
pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function cloudOn() { return !!(g.GZT_CLOUD && g.GZT_CLOUD.on); }

function openVer() {
A.modal({
title: '版本历史',
wide: true,
body: '<p class="hint">' + (cloudOn()
? '服务端每次写入前自动留一份上一版，最多 50 份。可以只看不换（预览），也可以整体恢复到某一版；' +
'恢复前当前这版会自动留档，所以恢复本身还能再恢复回来。'
: '服务端每次保存前，都会把上一份存档压进 <code>_backup</code>，最多留 8 份。' +
'这里可以只看不换（预览），也可以整体还原。') + '</p>' +
'<div id="verList" class="ver-list"><div class="tiny">读取中…</div></div>',
foot: '<button class="btn" data-close>关闭</button>',
onMount: loadVer
});
}

function loadVer() {
var box = $('#verList');
if (!box) return;
var C = g.GZT_CLOUD;

if (cloudOn() && C && C.history) {
box.innerHTML = '<div class="tiny">正在读云端历史…</div>';
C.history().then(function (res) {
if ($('#verList') !== box) return;

if (!res || res.error) {
box.innerHTML = '<div class="tiny">读不到云端历史：' + esc((res && res.error) || '未知原因') + '</div>';
return;
}
var items = res.items || [];
if (!items.length) {
box.innerHTML = '<div class="tiny">还没有历史 —— 改动写回云端之后才会产生。</div>';
return;
}
box.innerHTML = items.map(function (it) {
var when = fmtISO(it.saved_at), id = esc(String(it.id));
return '<div class="ver-row">' +
'<div class="ver-when" title="' + esc(histFull(it.saved_at)) + '">' + esc(when) + '</div>' +
'<div class="ver-meta">rev ' + esc(String(it.rev)) + ' · 服务端自动留档</div>' +
'<div class="ver-acts">' +
'<button class="link-btn" data-act="hist-peek" data-id="' + id + '" data-when="' + esc(when) + '">预览</button>' +
'<button class="link-btn" data-act="hist-back" data-id="' + id + '" data-when="' + esc(when) + '">恢复到这一版</button>' +
'</div></div>';
}).join('');
});
return;
}
box.innerHTML = '<div class="tiny">读取中…</div>';
Promise.resolve({ json: function () { return { ok: true, items: [] }; } }).then(function (r) {
return r.json();
}).then(function (d) {
if (!d || !d.ok) throw new Error('bad');
var items = d.items || [];
if (!items.length) {
box.innerHTML = '<div class="tiny">还没有备份 —— 需要至少保存过一次之后才会产生。</div>';
return;
}
box.innerHTML = items.map(function (it) {
return '<div class="ver-row">' +
'<div class="ver-when">' + esc(fmtWhen(it.mtime)) + '</div>' +
'<div class="ver-meta">笔记 ' + it.notes + ' · 书 ' + it.books +
' · 文档 ' + it.docs + ' · 日记 ' + it.diary + ' · ' +
Math.round(it.size / 1024) + ' KB</div>' +
'<div class="ver-acts">' +
'<button class="link-btn" data-act="ver-peek" data-name="' + it.name + '">预览</button>' +
'<button class="link-btn" data-act="ver-back" data-name="' + it.name + '">还原</button>' +
'</div></div>';
}).join('');
}).catch(function () {
box.innerHTML = '<div class="tiny">这个版本没有服务端备份。请用「导出全部数据」留底。</div>';
});
}

A.act('ver-open', function () { openVer(); });

A.act('ver-peek', function (el) {
var name = el.dataset.name;
A.modal({
title: '预览 · ' + name,
wide: true,
body: '<div id="peekBox"><div class="tiny">读取中…</div></div>',
foot: '<button class="btn" data-close>关闭</button>',
onMount: function () {
var box = $('#peekBox');
fetch('/api/backup?name=' + encodeURIComponent(name), { cache: 'no-store' })
.then(function (r) { return r.json(); })
.then(function (arc) {
var notes = arc.notes || [];
var docs = arc.docs || [];
var html = '<div class="peek-sec"><b>共 ' + notes.length + ' 条笔记，' +
(arc.books || []).length + ' 本书，' + docs.length + ' 篇文档，' +
Object.keys(arc.diary || {}).length + ' 页日记</div>';
var stamp = (arc.meta && arc.meta.updatedAt) || 0;
if (stamp) {
var d = new Date(stamp);
html += '<div class="tiny">存档自报的最后保存：' +
d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + '</div>';
}
html += '</div>';
var pick = notes.slice(0, 5);
if (pick.length) {
html += '<div class="peek-sec"><b>最近 5 条笔记</b>' + pick.map(function (n) {
var s = String(n.content || '').replace(/\s+/g, ' ').slice(0, 70);
return '<div class="peek-line">· ' + esc(s) + '</div>';
}).join('') + '</div>';
}
if (docs.length) {
html += '<div class="peek-sec"><b>文档</b>' + docs.slice(0, 8).map(function (w) {
return '<div class="peek-line">· ' + esc(w.title || '无题') + '</div>';
}).join('') + '</div>';
}
box.innerHTML = html;
})
.catch(function () {
box.innerHTML = '<div class="tiny">这份备份读不出来。</div>';
});
}
});
});

A.act('ver-back', function (el) {
var name = el.dataset.name;
A.modal({
title: '还原到这一份？',
body: '<p class="hint">当前这份会先被压进备份 —— 所以还原本身也能再还原回来。</p>' +
'<p class="hint">确认之后，整个存档换成 <code>' + esc(name) + '</code>，页面会自动重新加载。</p>',
foot: '<button class="btn" data-close>再想想</button>' +
'<button class="btn primary" data-act="ver-back-ok" data-name="' + esc(name) + '">确认还原</button>'
});
});

A.act('ver-back-ok', function (el) {
var name = el.dataset.name;
fetch('/api/restore', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ name: name })
}).then(function (r) { return r.json(); }).then(function (d) {
if (!d || !d.ok) { A.toast('还原失败：' + ((d && d.error) || '未知原因')); return; }
A.toast('已还原（' + d.notes + ' 条笔记），正在重新加载…');
setTimeout(function () { location.reload(); }, 800);
}).catch(function () {
A.toast('还原失败：连不上本机服务');
});
});

A.act('hist-peek', function (el) {
var id = el.dataset.id, when = el.dataset.when;
A.modal({
title: '预览 · ' + when,
wide: true,
body: '<div id="peekBox"><div class="tiny">读取中…</div></div>',
foot: '<button class="btn" data-close>关闭</button>',
onMount: function () {
var box = $('#peekBox');
var C = g.GZT_CLOUD;
if (!C || !C.historyGet) { if (box) box.innerHTML = '<div class="tiny">云端没连上。</div>'; return; }
C.historyGet(id).then(function (res) {
if (!box || !g.document.body.contains(box)) return;
if (!res || res.error || !res.row) {
box.innerHTML = '<div class="tiny">这一版读不出来：' + esc((res && res.error) || '没找到') + '</div>';
return;
}
var p = res.row.payload;
if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = null; } }
if (!p || !Array.isArray(p.notes)) {
box.innerHTML = '<div class="tiny">这一版存档格式不对。</div>';
return;
}
var notes = p.notes || [], books = p.books || [], docs = p.docs || [];
var kb = Math.round(JSON.stringify(p).length / 1024);
var html = '<div class="peek-sec"><b>rev ' + esc(String(res.row.rev)) + ' · ' +
notes.length + ' 条笔记，' + books.length + ' 本书，' + docs.length + ' 篇文档，' +
Object.keys(p.diary || {}).length + ' 页日记，' + (p.ledger || []).length +
' 笔账 · 约 ' + kb + ' KB</b>' +
'<div class="tiny">' + esc(histFull(res.row.saved_at)) + '</div></div>';
if (notes.length) {
html += '<div class="peek-sec"><b>最早 5 条笔记</b>' + notes.slice(0, 5).map(function (n) {
return '<div class="peek-line">· ' + esc(String(n.content || '').replace(/\s+/g, ' ').slice(0, 70)) + '</div>';
}).join('') + '</div>';
}
box.innerHTML = html;
});
}
});
});

A.act('hist-back', function (el) {
var id = esc(String(el.dataset.id)), when = esc(el.dataset.when);
A.modal({
title: '恢复到这一版？',
body: '<p class="hint">把整个存档换成 <b>' + when + '</b> 那一版（编号 ' + id + '）。' +
'当前这版会先自动留进历史，所以恢复错了还能再恢复回来。</p>' +
'<p class="hint">如果另一台设备也正在改，写回云端可能撞上版本冲突 —— 那时会明确提示，不会静默覆盖。</p>',
foot: '<button class="btn" data-close>再想想</button>' +
'<button class="btn primary" data-act="hist-back-ok" data-id="' + id + '" data-when="' + when + '">确认恢复</button>'
});
});

A.act('hist-back-ok', function (el) {
var id = el.dataset.id, when = el.dataset.when;
var C = g.GZT_CLOUD;
if (!C || !C.historyGet || !C.stamp) { A.toast('云端没连上，稍后再试'); return; }
var before = 0;
A.toast('正在取回 ' + when + ' 那一版…');
C.stamp().then(function (r) {
before = Number(r) || 0;
return C.historyGet(id);
}).then(function (res) {
if (!res || res.error || !res.row) {
A.toast('取回失败：' + ((res && res.error) || '没找到这一版'));
return null;
}
var p = res.row.payload;
if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = null; } }
if (!p || !Array.isArray(p.notes)) { A.toast('这一版存档格式不对'); return null; }
return p;
}).then(function (p) {
if (!p) return;
var r = S.importAll(p, 'overwrite');
if (!r.ok) { A.toast('恢复失败：' + r.error); return; }

try { S.mirror.flush(); } catch (e) {}
A.toast('已换成本地这一版，正在写回云端…');
setTimeout(function () {
C.stamp().then(function (after) {
if (Number(after) > before) A.toast('已写回云端，正在重新加载…');
else A.toast('写回没确认成功，留意顶部提示；必要时再试一次');
setTimeout(function () { location.reload(); }, 800);
}, function () { location.reload(); });
}, 1000);
});
});

var picked = {};

function asmSource(n) {
if (n.book) return '《' + n.book + '》' + (n.author ? ' ' + n.author : '');
return n.source || '';
}

function buildDoc(items) {
var parts = [];
items.forEach(function (n) {
var body = String(n.content || '').trim();
var quoted = body ? body.split(/\r?\n/).map(function (l) { return '> ' + l; }).join('\n') : '> ';
var src = asmSource(n);
parts.push(quoted + (src ? '\n\n—— ' + src : ''));
});
return parts.join('\n\n\n');
}

function renderAsm(all, q) {
var box = $('#asmList');
if (!box) return;
var term = String(q || '').trim().toLowerCase();
var list = all.filter(function (n) {
if (!term) return true;
return (noteText(n) + ' ' + (n.book || '') + ' ' + (n.author || '') + ' ' + (n.source || ''))
.toLowerCase().indexOf(term) >= 0;
});
if (!list.length) {
box.innerHTML = '<div class="tiny" style="padding:8px">没有匹配的笔记</div>';
return;
}
box.innerHTML = list.slice(0, 300).map(function (n) {
var s = String(n.content || '').replace(/\s+/g, ' ');
var d = new Date(n.createdAt || Date.now());
return '<label class="asm-item">' +
'<input type="checkbox" data-nid="' + n.id + '"' + (picked[n.id] ? ' checked' : '') + '>' +
'<span class="asm-t">' + esc(s.slice(0, 90)) + '</span>' +
'<span class="asm-s">' + esc(asmSource(n) || '—') + ' · ' +
pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '</span>' +
'</label>';
}).join('');
}

A.act('w-assemble', function () {
var all = (S.liveNotes() || []).slice().sort(function (a, b) {
return (b.createdAt || 0) - (a.createdAt || 0);
});
if (!all.length) { A.toast('还没有笔记可以装'); return; }
picked = {};
A.modal({
title: '从笔记装配文档',
wide: true,
body: '<div class="field"><label>新文档标题</label>' +
'<input id="asmTitle" type="text" value="读书摘录 · ' + esc(S.today()) + '"></div>' +
'<div class="field"><label>挑几条（按时间倒序）</label>' +
'<input id="asmQ" type="text" placeholder="过滤：书名 / 作者 / 正文关键词" style="margin-bottom:6px">' +
'<div id="asmList" class="asm-list"></div></div>' +
'<p class="hint">装进去的是「摘录 + 出处」，原笔记一个字都不动。装好之后就是一篇普通文档，随便改。</p>',
foot: '<button class="btn" data-close>取消</button>' +
'<button class="btn primary" data-act="asm-ok">装配成文档</button>',
onMount: function (mask) {
renderAsm(all, '');
var q = mask.querySelector('#asmQ');
if (q) q.addEventListener('input', function () { renderAsm(all, q.value); });
mask.addEventListener('change', function (e) {
var cb = e.target;
if (cb && cb.dataset && cb.dataset.nid) picked[cb.dataset.nid] = cb.checked;
});
}
});
});

A.act('asm-ok', function () {
var titleEl = $('#asmTitle');
var title = (titleEl && titleEl.value || '').trim() || ('读书摘录 · ' + S.today());
var all = (S.liveNotes() || []).slice().sort(function (a, b) {
return (b.createdAt || 0) - (a.createdAt || 0);
});
var items = all.filter(function (n) { return picked[n.id]; });
if (!items.length) { A.toast('先勾几条再装'); return; }
var doc = S.addDoc(title, buildDoc(items));
A.closeTopModal();
A.openModule('docs');
setTimeout(function () {
var btn = document.querySelector('.doclist button[data-id="' + doc.id + '"]');
if (btn) btn.click();
}, 100);
A.toast('装好了：' + items.length + ' 条摘录');
});

var navSearch = document.getElementById('navSearch');
if (navSearch) {
navSearch.addEventListener('click', function () { openPal(); });

navSearch.addEventListener('keydown', function (e) {
if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
e.preventDefault(); openPal();
});
}

A.extras = { openPal: openPal, openVer: openVer, resetIndex: resetIndex };
})(window);
