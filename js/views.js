(function (g) {
'use strict';

var S = g.S, A = g.App;
var esc = A.esc, $ = A.$, $$ = A.$$, pad = A.pad;

function vHead(kicker, title, lede, acts, stats) {
return '<div class="v-head">' +
'<div class="v-headmain">' +
'<div class="v-kicker">' + esc(kicker) + '</div>' +
'<div class="v-title">' + esc(title) + '<span class="v-dot">.</span></div>' +
(lede ? '<p class="v-lede">' + esc(lede) + '</p>' : '') +
'</div>' +
(acts ? '<div class="v-acts">' + acts + '</div>' : '') +
'</div>' +
(stats && stats.length ? '<div class="v-stats">' + stats.map(function (r) {
return '<div class="v-stat"><div class="n">' + esc(String(r[0])) +
(r[2] ? '<span class="u">' + esc(r[2]) + '</span>' : '') + '</div>' +
'<div class="k">' + esc(r[1]) + '</div></div>';
}).join('') + '</div>' : '');
}

function sbar(o) {
return '<div class="searchbar sbar' + (o.q ? ' has-q' : '') + '" id="' + o.id + '">' +
'<span class="ico">⌕</span>' +
'<input id="' + o.input + '" type="text" autocomplete="off" placeholder="' + esc(o.ph) + '"' +
' data-input="' + o.act + '" data-key="' + o.key + '" value="' + esc(o.q) + '">' +
'<span class="sbar-n" id="' + o.nid + '"' + (o.q ? '' : ' hidden') + '>' + esc(o.n) + '</span>' +
'<button class="sbar-x" type="button" data-act="' + o.clear +
'" title="清空搜索" aria-label="清空搜索">✕</button>' +
(S.narrow() ? '' : '<span class="kbd">/</span>') +
'</div>';
}

function words(q) {
return String(q || '').toLowerCase().split(/\s+/).filter(function (w) { return w; });
}
function hitAll(hay, ws) {
var s = String(hay || '').toLowerCase();
for (var i = 0; i < ws.length; i++) { if (s.indexOf(ws[i]) < 0) return false; }
return true;
}

var bk = { status: 'all', year: 'all', cat: 'all', q: '' };

function facYears() {
var y = {};
S.db.books.forEach(function (b) {
var t = String(b.finish || b.start || '').slice(0, 4);
if (t) y[t] = 1;
});
return Object.keys(y).sort().reverse();
}
function facCats() {
var c = {};
S.db.books.forEach(function (b) { if (b.category) c[b.category] = 1; });
return Object.keys(c);
}

function bkOK(b, f) {
if (f.status !== 'all' && b.status !== f.status) return false;
if (f.year !== 'all' && String(b.finish || b.start || '').slice(0, 4) !== f.year) return false;
if (f.cat !== 'all' && b.category !== f.cat) return false;
return hitAll([b.title, b.author, b.category, b.note].join(' '),
words(f.q === undefined ? bk.q : f.q));
}
function facList(f) { return S.db.books.filter(function (b) { return bkOK(b, f); }); }
function facCount(f) { return ((f || bk).year !== 'all' ? 1 : 0) + ((f || bk).cat !== 'all' ? 1 : 0); }

function bkList() {
return S.db.books.filter(function (b) { return bkOK(b, bk); }).sort(function (a, b) {
if (a.status !== b.status) return a.status === 'reading' ? -1 : 1;
return String(b.finish || b.start || '').localeCompare(String(a.finish || a.start || ''));
});
}

function booksView() {
var all = S.db.books;
var years = {};
facYears().forEach(function (y) { years[y] = 1; });

var list = bkList();
var reading = all.filter(function (b) { return b.status === 'reading'; }).length;
var done = all.length - reading;

return '<div class="view">' +
vHead('LIBRARY · 藏书', '藏书阁',
'架上 ' + all.length + ' 册，读完 ' + done + ' 本，还在读 ' + reading + ' 本。' +
(Object.keys(years).length ? '这些年翻过的书，摊在 ' + Object.keys(years).length + ' 个年份里。' : ''),
(done > 0 ? '<button class="btn" data-act="bk-poster" title="把已读的书排成一张长图">书单图片</button>' : '') +
'<button class="btn primary" data-act="b-add">＋ 添一本</button>') +
sbar({
id: 'bkBar', input: 'bkQ', act: 'bk-q', key: 'bk-q', clear: 'bk-q-clear',
q: bk.q, nid: 'bkN', n: '筛出 ' + list.length + ' 本',
ph: S.narrow() ? '搜书名、作者…' : '搜书名、作者、分类、备注…（空格分词）'
}) +

(function () {
var rated = all.filter(function (b) { return b.rating > 0; });
var avg = rated.length ? (rated.reduce(function (s, b) { return s + b.rating; }, 0) / rated.length).toFixed(1) : '';
var catN = {}, catTop = '', catMax = 0;
all.forEach(function (b) {
if (!b.category) return;
catN[b.category] = (catN[b.category] || 0) + 1;
if (catN[b.category] > catMax) { catMax = catN[b.category]; catTop = b.category; }
});
var chips = [
'在读 ' + reading + ' 本',
'今年读完 ' + S.stats().readYear + ' 本'
];

if (rated.length) chips.push('均分 ' + avg);
chips.push(catTop ? '最多 ' + catTop + ' ' + catMax + ' 本' : '还没分类');
return '<div class="bk-chips">' + chips.map(function (c) {
return '<span class="chip">' + esc(c) + '</span>';
}).join('') + '</div>';
})() +
'<div class="filters">' +
'  <div class="seg">' +
['all', 'reading', 'done'].map(function (k) {
return '<button data-act="b-filter" data-k="status" data-v="' + k + '" class="' + (bk.status === k ? 'on' : '') + '">' +
({ all: '全部', reading: '在读', done: '已读完' })[k] + '</button>';
}).join('') + '</div>' +

'  <button class="btn sm fac-btn" data-act="b-facets">筛选' +
(facCount() ? '<b class="fac-n">' + facCount() + '</b>' : '') + '</button>' +
'</div>' +

'<div class="bk-list" id="bkList">' + bkListHtml() + '</div>' +
'</div>';
}

function bkListHtml() {
var list = bkList();
if (list.length) return '<div class="bookgrid">' + list.map(bookCard).join('') + '</div>';

if (bk.q) {
return '<div class="empty"><div class="mark">藏</div>' +
'<div class="t">没有匹配的</div>' +
'<div class="d">换个词试试 —— 搜的是书名、作者、分类和备注。' +
'点搜索框右边的 ✕ 回到全部。</div></div>';
}
return '<div class="empty"><div class="mark">藏</div><div class="t">这一格是空的</div>' +
'<div class="d">换个筛选条件，或添一本进来</div></div>';
}
function bookCard(b) {
var done = b.status === 'done';
var days = 0;
if (done && b.start && b.finish) {
days = Math.max(1, Math.round((new Date(b.finish) - new Date(b.start)) / 86400000) + 1);
}
var notes = S.liveNotes().filter(function (n) {
return (n.book || '') === b.title || String(n.source).indexOf('《' + b.title + '》') >= 0;
}).length;
var sp = A.spine(b.title);

return '<div class="bkcard" data-id="' + esc(b.id) + '" data-act="b-from" data-t="' + esc(b.title) + '">' +
'<div class="bcover" style="' + sp.style + '"><span>' + esc(sp.chars) + '</span></div>' +
'<div class="bmain">' +
'  <div class="bt" data-act="b-from" data-t="' + esc(b.title) + '">' + esc(b.title) + '</div>' +
'  <div class="ba">' + esc(b.author || '佚名') + (b.category ? ' · ' + esc(b.category) : '') + '</div>' +
(b.note ? '<div class="bnote">' + esc(b.note) + '</div>' : '') +
'  <div class="bmeta">' +
(done ? '<span class="badge-done">已读完</span><span>' + esc(b.finish || '') + (days ? ' · ' + days + ' 天' : '') + '</span>'
: '<span>' + (b.start ? '起读 ' + esc(b.start) : '在架上') + '</span>') +
(notes ? '<span style="margin-left:auto">' + notes + ' 条笔记</span>' : '') +
(b.rating ? '<span class="stars" style="margin-left:auto">' + A.stars(b.rating) + '</span>' : '') +
'  </div>' +

'  <div class="bkacts' + (done ? '' : ' always') + '">' +
(done ? '<button class="btn sm" data-act="b-reading" data-id="' + b.id + '">改回在读</button>'
: '<button class="btn sm primary" data-act="b-done" data-id="' + b.id + '">读完了</button>') +
'  <button class="btn sm ghost" data-act="b-edit" data-id="' + b.id + '">编辑</button>' +
'  <button class="btn sm ghost" data-act="b-del" data-id="' + b.id + '">删</button>' +
'  </div>' +
'</div></div>';
}

function bookForm(id) {
var b = id ? S.db.books.filter(function (x) { return x.id === id; })[0] : null;
b = b || { title: '', author: '', category: '', status: 'reading', rating: 0, start: S.today(), finish: '', note: '' };
A.modal({
title: id ? '编辑这本书' : '添一本',
body: '<div class="field"><label>书名</label><input id="bkTitle" type="text" value="' + esc(b.title) + '"></div>' +
'<div class="row2"><div class="field"><label>作者</label><input id="bkAuthor" type="text" value="' + esc(b.author) + '"></div>' +
'<div class="field"><label>分类</label><input id="bkCat" type="text" value="' + esc(b.category) + '" placeholder="历史 / 文学小说…"></div></div>' +
'<div class="row2"><div class="field"><label>起读</label><input id="bkStart" type="date" value="' + esc(b.start) + '"></div>' +
'<div class="field"><label>读完（留空即在读）</label><input id="bkFinish" type="date" value="' + esc(b.finish) + '"></div></div>' +
'<div class="field"><label>星级</label><select id="bkRate">' +
[0, 1, 2, 3, 4, 5].map(function (n) {
return '<option value="' + n + '"' + (b.rating === n ? ' selected' : '') + '>' + (n ? n + ' 星' : '未评') + '</option>';
}).join('') + '</select></div>' +
'<div class="field"><label>备注</label><input id="bkNote" type="text" value="' + esc(b.note) + '" placeholder="一句话印象"></div>' +
'<p class="hint">填了读完日期，这本书会自己进「大事记」——一次点击两个结果。</p>',
foot: '<button class="btn" data-close>取消</button><button class="btn primary" data-act="b-save" data-id="' + (id || '') + '">存下</button>',
focus: '#bkTitle'
});
}

function closeThen(fn) {
A.closeTopModal();
var tries = 0;
(function wait() {
if (!A.modalStack.length || ++tries > 25) { fn(); return; }
setTimeout(wait, 40);
})();
}

A.act('b-add', function () { bookForm(null); });
A.act('b-edit', function (el) { bookForm(el.dataset.id); });
A.act('b-save', function (el) {
var v = function (id) { var n = $('#' + id); return n ? n.value : ''; };
var title = v('bkTitle').trim();
if (!title) { var t = $('#bkTitle'); if (t) t.focus(); return; }
var finish = v('bkFinish');
var patch = {
title: title, author: v('bkAuthor').trim(), category: v('bkCat').trim(),
start: v('bkStart'), finish: finish,
status: finish ? 'done' : 'reading', rating: Number(v('bkRate')) || 0, note: v('bkNote').trim()
};
if (el.dataset.id) {
S.updateBook(el.dataset.id, patch);
var b = S.db.books.filter(function (x) { return x.id === el.dataset.id; })[0];
if (b) b.bulk = false;
S.syncBooks();
} else {
var nb = S.addBook(patch);

if (nb && nb._dup) {
closeThen(function () {
A.modal({
title: '《' + nb.title + '》已经在架上了',
body: '<p class="hint">架上这本是 ' + (nb.status === 'done'
? '读完的（' + esc(nb.finish || '日期没记') + (nb.rating ? ' · ' + nb.rating + ' 星' : '') + '）'
: '在读的') + '。刚才填的内容没有覆盖它。</p>' +
'<p class="hint">要改这本，点「去编辑」；想另记一本，回去换个书名。</p>',
foot: '<button class="btn" data-close>取消</button>' +
'<button class="btn primary" data-act="b-dup-edit" data-id="' + nb.id + '">去编辑</button>'
});
});
A.refresh();
return;
}
if (nb) { nb.status = patch.status; nb.finish = patch.finish; nb.rating = patch.rating; nb.bulk = false; S.save(); S.syncBooks(); }
}
A.closeTopModal(); A.refresh(); A.refreshOverviewSoft();
A.toast(finish ? '读完了，大事记里多了一笔' : '收进藏书阁了');
});

A.act('b-dup-edit', function (el) {
var id = el.dataset.id;
closeThen(function () { bookForm(id); });
});
A.act('b-done', function (el) {
var b = S.db.books.filter(function (x) { return x.id === el.dataset.id; })[0];
if (!b) return;
A.modal({
title: '读完《' + b.title + '》',
body: '<div class="row2"><div class="field"><label>读完日期</label><input id="dnDate" type="date" value="' + S.today() + '"></div>' +
'<div class="field"><label>给几星</label><select id="dnRate">' +
[5, 4, 3, 2, 1, 0].map(function (n) { return '<option value="' + n + '">' + (n ? n + ' 星' : '不评') + '</option>'; }).join('') +
'</select></div></div>' +
'<p class="hint">确定之后：这本书归入已读，大事记里自动多一行「读完《' + esc(b.title) + '》」，带日期带星级。改回在读，那一行会跟着撤掉。</p>',
foot: '<button class="btn" data-close>取消</button><button class="btn primary" data-act="b-done-ok" data-id="' + b.id + '">读完了</button>'
});
});
A.act('b-done-ok', function (el) {
var d = $('#dnDate'), r = $('#dnRate');
var b = S.db.books.filter(function (x) { return x.id === el.dataset.id; })[0];
if (b) { b.finish = (d && d.value) || S.today(); }
S.markDone(el.dataset.id, Number(r && r.value) || 0);
S.commit(true);
A.closeTopModal(); A.refresh(); A.refreshOverviewSoft();
A.toast('读完了，大事记里多了一笔');
});
A.act('b-reading', function (el) {
S.markReading(el.dataset.id);
A.refresh(); A.refreshOverviewSoft();
A.toast('改回在读，年表里那一行已撤下');
});
A.act('b-del', function (el) {
var removed = S.delBook(el.dataset.id);
if (!removed || !removed.book) return;

A.refresh(); A.refreshOverviewSoft();
A.offerUndo('删了《' + removed.book.title + '》', function () {
S.restoreBook(removed.book, removed.entries);
A.refresh(); A.refreshOverviewSoft(); A.toast('放回来了');
});
});
A.act('b-filter', function (el) { bk[el.dataset.k] = el.dataset.v; A.refresh(); });
A.act('change:b-filter', function (el) { bk[el.dataset.k] = el.value; A.refresh(); });

function paintBk() {
var bar = $('#bkBar'), n = $('#bkN'), box = $('#bkList');
if (bar) {
if (bk.q) bar.classList.add('has-q'); else bar.classList.remove('has-q');
}
if (n) {
n.textContent = '筛出 ' + bkList().length + ' 本';
if (bk.q) n.removeAttribute('hidden'); else n.setAttribute('hidden', 'hidden');
}
if (box) box.innerHTML = bkListHtml();
}
A.act('input:bk-q', function (el) { bk.q = el.value.trim(); paintBk(); });
A.act('key:bk-q', function (el, e) {
if (e.key !== 'Escape' || !el.value) return false;
el.value = ''; bk.q = ''; paintBk();
return true;

});
A.act('bk-q-clear', function () {
bk.q = '';
var el = $('#bkQ');
if (el) { el.value = ''; el.focus(); }
paintBk();
});

var facTmp = null;
A.act('b-facets', function () {
facTmp = { status: bk.status, year: bk.year, cat: bk.cat };
var years = facYears(), cats = facCats();
function chips(list, k, label) {
return '<div class="fac-group"><div class="fac-h">' + label + '</div><div class="fac-chips">' +
'<button class="fchip' + (facTmp[k] === 'all' ? ' on' : '') + '" data-act="b-facet" data-k="' + k + '" data-v="all">全部</button>' +
list.map(function (v) {
return '<button class="fchip' + (facTmp[k] === v ? ' on' : '') + '" data-act="b-facet" data-k="' + k +
'" data-v="' + esc(v) + '">' + esc(k === 'year' ? v + ' 年' : v) + '</button>';
}).join('') + '</div></div>';
}
A.modal({
title: '筛一筛书架',
body: chips(years, 'year', '读完年份') +
(cats.length ? chips(cats, 'cat', '分类') : '') +
'<p class="hint">年份按「读完年份」算，没读完的按开始读的那年。选完点下面那颗按钮，书架才重排。</p>',
foot: '<button class="btn" data-close>取消</button>' +
'<button class="btn primary" data-act="b-facets-ok" id="facOk">看这 ' + facList(facTmp).length + ' 本</button>'
});
});
A.act('b-facet', function (el) {
if (!facTmp) return;
facTmp[el.dataset.k] = el.dataset.v;
var box = el.parentNode;
Array.prototype.forEach.call(box.querySelectorAll('[data-act="b-facet"]'), function (x) {
x.classList.remove('on');
});
el.classList.add('on');
var ok = document.getElementById('facOk');
if (ok) ok.textContent = '看这 ' + facList(facTmp).length + ' 本';
});
A.act('b-facets-ok', function () {
if (facTmp) { bk.year = facTmp.year; bk.cat = facTmp.cat; }
facTmp = null;
A.closeTopModal();
A.refresh();
var pane = document.querySelector('.pane.active');
if (pane) pane.scrollTop = 0;
});
A.act('b-from', function (el) { A.notesOpenLink('book', el.dataset.t); });
A.view('books', { render: booksView });

var poster = { by: 'cat', url: '', w: 0, h: 0, total: 0, groups: 0 };

function posterGroups(by) {
var done = S.db.books.filter(function (b) { return b.status === 'done'; });
var map = {}, order = [];
function key(b) {
if (by === 'year') return String(b.finish || b.start || '').slice(0, 4) || '年份不明';
if (by === 'star') {
var r = Math.round((Number(b.rating) || 0) * 2) / 2;
return r > 0 ? r + ' 星' : '未评星';
}
return b.category || '未分类';
}
done.forEach(function (b) {
var k = key(b);
if (!map[k]) { map[k] = []; order.push(k); }
map[k].push(b);
});

order.forEach(function (k) {
map[k].sort(function (a, b) {
if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
return String(b.finish || '').localeCompare(String(a.finish || ''));
});
});

order.sort(function (a, b) {
if (by === 'year') return b.localeCompare(a);
if (by === 'star') return (parseFloat(b) || -1) - (parseFloat(a) || -1);
if (map[b].length !== map[a].length) return map[b].length - map[a].length;
return a.localeCompare(b, 'zh');
});
return order.map(function (k) { return { name: k, books: map[k] }; });
}

function starText(r) {
r = Number(r) || 0;
var full = Math.floor(r), half = r - full >= 0.5;
var s = '';
for (var i = 0; i < full; i++) s += '★';
if (half) s += '½';
return s;
}
function mdOf(d) {
var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || ''));
return m ? (Number(m[2]) + '月' + Number(m[3]) + '日') : '';
}
function clipCtx(c, txt, max) {
if (c.measureText(txt).width <= max) return txt;
var t = txt;
while (t.length > 1 && c.measureText(t + '…').width > max) t = t.slice(0, -1);
return t + '…';
}

var F_KAI = '"KaiTi","Kaiti SC",STKaiti,"楷体",serif';
var F_SANS = '"Microsoft YaHei","PingFang SC",system-ui,sans-serif';
var F_SERIF = 'Georgia,"Times New Roman",serif';

function drawPoster(by) {
var groups = posterGroups(by);
var total = groups.reduce(function (s, g) { return s + g.books.length; }, 0);
var W = 1800, PAD = 120;

var rowH = total > 40 ? 84 : 96;
var H = PAD + 88 + 50 + 30;
groups.forEach(function (g) { H += 80 + g.books.length * rowH; });
H += 100;

var cv = document.createElement('canvas');
cv.width = W; cv.height = H;
var c = cv.getContext('2d');
if (!c) return null;

var PAPER = '#f7f3ea', INK = '#2f2a24', SOFT = '#6b6157', FAINT = '#9a9184', ACC = '#8c3b2e';
c.fillStyle = PAPER; c.fillRect(0, 0, W, H);

c.strokeStyle = '#e2d9c8'; c.lineWidth = 2;
c.strokeRect(PAD / 3, PAD / 3, W - PAD / 3 * 2, H - PAD / 3 * 2);

var y = PAD + 62;
c.textAlign = 'left'; c.textBaseline = 'alphabetic';
c.font = '500 66px ' + F_KAI; c.fillStyle = INK;
c.fillText('已读书单', PAD, y);
c.font = '28px ' + F_SANS; c.fillStyle = FAINT; c.textAlign = 'right';
c.fillText('全部 ' + total + ' 本 · ' + ({ cat: '按类别', year: '按年份', star: '按星级' })[by],
W - PAD, y - 6);
y += 26;
c.strokeStyle = '#e2d9c8'; c.beginPath(); c.moveTo(PAD, y); c.lineTo(W - PAD, y); c.stroke();
y += 46;

groups.forEach(function (g) {

c.fillStyle = ACC;
c.fillRect(PAD, y - 22, 6, 30);
c.textAlign = 'left';
c.font = '600 32px ' + F_KAI; c.fillStyle = INK;
c.fillText(g.name, PAD + 22, y);
var wName = c.measureText(g.name).width;
c.font = '24px ' + F_SANS; c.fillStyle = FAINT;
c.fillText(g.books.length + ' 本', PAD + 22 + wName + 14, y);
y += 46;

g.books.forEach(function (b, i) {
var base = y + (rowH > 90 ? 40 : 36);

c.textAlign = 'left';
c.font = 'italic 26px ' + F_SERIF; c.fillStyle = FAINT;
c.fillText((i + 1 < 10 ? '0' : '') + (i + 1), PAD, base);

var titleX = PAD + 74;
c.font = '500 38px ' + F_KAI; c.fillStyle = INK;
var title = clipCtx(c, '《' + (b.title || '无题') + '》', W - PAD - titleX - 460);
c.fillText(title, titleX, base);

if (b.author) {
c.font = '23px ' + F_SANS; c.fillStyle = FAINT;
c.fillText(clipCtx(c, b.author, W - PAD - titleX - 460), titleX, base + 30);
}

c.textAlign = 'right';
c.font = '26px ' + F_SERIF; c.fillStyle = '#a3761d';
c.fillText(starText(b.rating), W - PAD - 250, base);

if (b.rating) {
c.font = '22px ' + F_SANS; c.fillStyle = FAINT;
var rn = Number(b.rating);
c.fillText((rn % 1 ? rn.toFixed(1) : rn) + ' 星', W - PAD - 120, base);

}
c.font = '23px ' + F_SANS; c.fillStyle = FAINT;
c.fillText(mdOf(b.finish), W - PAD, base);

y += rowH;
});
y += 34;
});

c.textAlign = 'center'; c.font = '22px ' + F_SANS; c.fillStyle = FAINT;
c.fillText('共 ' + total + ' 本 · ' + new Date().getFullYear() + ' 年 ' +
(new Date().getMonth() + 1) + ' 月 ' + new Date().getDate() + ' 日 整理', W / 2, H - 46);

return { cv: cv, total: total, groups: groups.length };
}

function paintPoster() {
var box = $('#bkPosterBox');
var out = $('#bkPosterMeta');
if (!box) return;
var r = drawPoster(poster.by);
if (!r) { box.innerHTML = '<div class="empty"><div class="t">这个浏览器画不出来</div></div>'; return; }
poster.url = r.cv.toDataURL('image/png');
poster.w = r.cv.width; poster.h = r.cv.height;
poster.total = r.total; poster.groups = r.groups;
var kb = Math.round(poster.url.length * 0.75 / 1024);
box.innerHTML = '<img class="bk-poster-img" src="' + poster.url + '" alt="已读书单">' +
'<div class="bk-poster-tip">手机上看不清就点开图，长按存进相册</div>';
if (out) {
out.textContent = '共 ' + r.total + ' 本 · 分 ' + r.groups + ' 组 · ' +
poster.w + '×' + poster.h + ' 像素 · 约 ' + (kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB');
}
}

A.act('bk-poster', function () {
if (!S.db.books.some(function (b) { return b.status === 'done'; })) {
A.toast('还没有读完的书，标一本读完再来'); return;
}
poster.by = 'cat';
A.modal({
wide: true,
title: '书单图片',
body:
'<div class="bk-poster-by">' +
'<span class="bk-pb-t">先选怎么分段</span>' +
'<div class="seg">' +
[['cat', '按类别'], ['year', '按年份'], ['star', '按星级']].map(function (x) {
return '<button data-act="bk-poster-by" data-k="' + x[0] + '" class="' + (x[0] === 'cat' ? 'on' : '') + '">' + x[1] + '</button>';
}).join('') +
'</div>' +
'<span class="bk-pb-hint">每组里按星级从高到低</span></div>' +
'<div class="bk-poster-box" id="bkPosterBox"></div>' +
'<div class="bk-poster-meta" id="bkPosterMeta"></div>',
foot: '<button class="btn" data-close>关闭</button>' +
'<button class="btn primary" data-act="bk-poster-save">另存为 PNG</button>',
onMount: function () { setTimeout(paintPoster, 30); }
});
});

A.act('bk-poster-by', function (el) {
if (poster.by === el.dataset.k) return;
poster.by = el.dataset.k;
var seg = el.closest('.seg');
if (seg) $$('button', seg).forEach(function (b) { b.classList.toggle('on', b === el); });
paintPoster();
});

A.act('bk-poster-save', function () {
if (!poster.url) { paintPoster(); }
if (!poster.url) { A.toast('还没画出来，稍等一下再点'); return; }

if (S.narrow()) { A.toast('长按上面那张图，选「存储图像」'); return; }
var name = '已读书单-' + ({ cat: '按类别', year: '按年份', star: '按星级' })[poster.by] +
'-' + S.today() + '.png';
try {
var a = document.createElement('a');
a.href = poster.url; a.download = name;
document.body.appendChild(a); a.click(); a.remove();
A.toast('已存下 · ' + poster.w + '×' + poster.h);
} catch (e) {
A.toast('这个浏览器不让下载，长按上面的图存进相册');
}
});

var tlYear = null;

var tlm = { q: '' };

function tlHit(t, ws) { return hitAll([t.title, t.tag, String(t.date).slice(0, 4)].join(' '), ws); }

function tlList() {
return S.db.timeline.filter(function (t) {
if (tlYear && String(t.date).slice(0, 4) !== tlYear) return false;
return tlHit(t, words(tlm.q));
}).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
}

function tlMonthsHtml() {
var list = tlList(), months = [];
list.forEach(function (t) {
var m = String(t.date).slice(0, 7);
var g = months.filter(function (x) { return x.m === m; })[0];
if (!g) { g = { m: m, items: [] }; months.push(g); }
g.items.push(t);
});
if (!list.length) {

return '<div class="empty"><div class="mark">年</div><div class="t">' +
(tlm.q ? '没有匹配的' : (tlYear ? tlYear + ' 年还是空的' : '年表还是空的')) + '</div>' +
'<div class="d">' + (tlm.q
? '换个词试试 —— 搜的是标题、标签和年份。点搜索框右边的 ✕ 回到全部。'
: '读完一本书、勾掉一件待办，这里会自己长出条目') + '</div></div>';
}
return months.map(function (g) {
var p = g.m.split('-');
return '<div class="month"><div class="month-h">' + p[0] + ' 年 ' + Number(p[1]) + ' 月 · ' + g.items.length + ' 件</div>' +
g.items.map(function (t) {
var d = String(t.date).slice(5);
return '<div class="tl-item" data-id="' + t.id + '">' +
'<span class="d">' + d + '</span>' +
'<span class="t">' + esc(t.title) + '</span>' +
(t.tag ? '<span class="tag' + (t.auto ? ' auto' : '') + '">' + esc(t.tag) + '</span>' : '') +
'<button class="del" data-act="tl-del" data-id="' + t.id + '" title="删掉这一条">✕</button>' +
'</div>';
}).join('') + '</div>';
}).join('');
}

function chronicleView() {
var all = S.db.timeline.slice();
var years = {};
all.forEach(function (t) { var y = String(t.date).slice(0, 4); years[y] = (years[y] || 0) + 1; });
var ys = Object.keys(years).sort().reverse();

if (tlYear === undefined || tlYear === null) tlYear = '';
var list = tlList();

return '<div class="view">' +
vHead('CHRONICLE · 年表', '大事记',
all.length ? '一共 ' + all.length + ' 条，跨 ' + ys.length + ' 个年份。最近的一条是「' +
String(all[all.length - 1].title || '').slice(0, 18) + '」。'
: '还没有记下的日子。值得留一笔的事，都从第一次「记一笔」开始。',
'<button class="btn" data-act="tl-from-diary">从日记里摘</button>' +
'<button class="btn primary" data-act="tl-add">＋ 记一笔</button>',
(all.length ? [[all.length, '条记录'], [ys.length, '个年份'],
[years[String(new Date().getFullYear())] || 0, '今年'],
[ys[ys.length - 1], '最早一年']] : null)) +
sbar({
id: 'tlBar', input: 'tlQ', act: 'tl-q', key: 'tl-q', clear: 'tl-q-clear',
q: tlm.q, nid: 'tlN', n: '筛出 ' + list.length + ' 条',
ph: S.narrow() ? '搜标题、标签…' : '搜标题、标签、年份…（空格分词）'
}) +
'<div class="tl-wrap">' +
'  <div class="years">' +
'    <button class="' + (tlYear === '' ? 'on' : '') + '" data-act="tl-year" data-y="">全部' +
'<span class="c">' + all.length + '</span></button>' +
ys.map(function (y) {
return '<button class="' + (y === tlYear ? 'on' : '') + '" data-act="tl-year" data-y="' + y + '">' + y +
'<span class="c">' + years[y] + '</span></button>';
}).join('') + '</div>' +

'  <div class="tl" id="tlList">' + tlMonthsHtml() + '</div>' +
'</div></div>';
}

var EVENT_WORDS = ['决定', '开始', '结束', '终于', '第一次', '去了', '见了', '见到',
'买了', '辞了', '辞职', '入职', '搬', '考上', '拿到', '签了', '定下', '完成',
'写完', '读完', '学会', '戒了', '放弃', '答应', '拒绝', '认识', '加入', '离开',
'换了', '发了', '办了', '通过', '拿下', '搞定', '交了', '报名', '面试', '动手'];

var FEEL_WORDS = ['觉得', '好像', '也许', '可能', '感觉', '似乎', '大概', '希望', '担心', '有点'];

function splitSentences(text) {
var out = [], buf = '';
var s = String(text || '');
for (var i = 0; i < s.length; i++) {
var c = s[i];
buf += c;
if ('。！？!?；;\n'.indexOf(c) >= 0) {
if (buf.trim()) out.push(buf.trim());
buf = '';
}
}
if (buf.trim()) out.push(buf.trim());
return out;
}

function scoreSentence(s) {
var n = 0, i;
for (i = 0; i < EVENT_WORDS.length; i++) {
if (s.indexOf(EVENT_WORDS[i]) >= 0) { n += 3; break; }
}
if (/今天|昨天|前天|上午|下午|晚上|凌晨|周末|周[一二三四五六日]/.test(s)) n += 1;
if (/[0-9０-９]/.test(s)) n += 1;
for (i = 0; i < FEEL_WORDS.length; i++) {
if (s.indexOf(FEEL_WORDS[i]) >= 0) { n -= 2; break; }
}
if (s.length >= 10 && s.length <= 40) n += 1;

return n;
}

function diaryCandidates(date) {
var page = S.db.diary[date];
if (!page || !page.text) return [];
var have = {};
S.db.timeline.forEach(function (t) { have[t.title] = 1; });

return splitSentences(page.text)
.map(function (s) { return s.replace(/[。！？；;\s]+$/, '').trim(); })
.filter(function (s) { return s.length >= 6 && s.length <= 80 && !have[s]; })
.map(function (s) { return { text: s, score: scoreSentence(s) }; })
.sort(function (a, b) { return b.score - a.score; })
.slice(0, 10);
}

function paintCands(mask, date) {
var box = mask.querySelector('#tlCands');
if (!box) return;
var list = diaryCandidates(date);
box._list = list;

var marked = 0;
box.innerHTML = list.length
? list.map(function (c, i) {
var on = c.score >= 3 && marked < 3;
if (on) marked++;
return '<label class="tlc"><input type="checkbox" data-i="' + i + '"' +
(on ? ' checked' : '') + '><span>' + esc(c.text) + '</span></label>';
}).join('')
: '<p class="hint">这一天没有能摘出来的句子 —— 或者值得记的都已经在年表里了。</p>';
refreshOk(mask);
}

function refreshOk(mask) {
var box = mask.querySelector('#tlCands'), ok = mask.querySelector('#tlFromOk');
if (!ok || !box) return;
var n = [].slice.call(box.querySelectorAll('input[type=checkbox]'))
.filter(function (c) { return c.checked; }).length;
ok.textContent = '加进年表（' + n + '）';
ok.disabled = n === 0;
}

A.act('tl-year', function (el) { tlYear = el.dataset.y; A.refresh(); });
A.act('tl-from-diary', function () {
var days = Object.keys(S.db.diary).sort().reverse();
if (!days.length) { A.toast('还没写过日记，先去写一句'); return; }
var pick = days.indexOf(S.today()) >= 0 ? S.today() : days[0];
A.modal({
title: '从日记里摘几件事',
body: '<div class="field"><label>看哪一天的</label><select id="tlDay">' +
days.slice(0, 30).map(function (d) {
return '<option value="' + d + '"' + (d === pick ? ' selected' : '') + '>' + d + '</option>';
}).join('') + '</select></div>' +
'<p class="hint">按「像不像一件事」排过序，勾几行就行。进年表之后照样能改能删。</p>' +
'<div class="tl-cands" id="tlCands"></div>',
foot: '<button class="btn" data-close>取消</button>' +
'<button class="btn primary" data-act="tl-from-diary-ok" id="tlFromOk">加进年表（0）</button>',
onMount: function (mask) {
paintCands(mask, pick);
var sel = mask.querySelector('#tlDay');
if (sel) sel.addEventListener('change', function () { paintCands(mask, sel.value); });
var box = mask.querySelector('#tlCands');
if (box) box.addEventListener('change', function () { refreshOk(mask); });
}
});
});

A.act('tl-from-diary-ok', function () {
var box = $('#tlCands'), day = $('#tlDay');
if (!box || !box._list) return;
var d = (day && day.value) || S.today();
var picked = [].slice.call(box.querySelectorAll('input[type=checkbox]'))
.filter(function (c) { return c.checked; })
.map(function (c) { return box._list[Number(c.dataset.i)]; })
.filter(Boolean);
if (!picked.length) { A.toast('先挑一条'); return; }
picked.forEach(function (c) {

S.addEntry({ title: c.text, date: d, tag: '日记', auto: true, ref: d });
});
tlYear = String(d).slice(0, 4);
A.closeTopModal(); A.refresh(); A.refreshOverviewSoft();
A.toast('摘了 ' + picked.length + ' 条进年表');
});

A.act('tl-add', function () {
A.modal({
title: '记一笔大事',
body: '<div class="row2"><div class="field"><label>日期</label><input id="tlDate" type="date" value="' + S.today() + '"></div>' +
'<div class="field"><label>类别</label><input id="tlTag" type="text" value="手记" maxlength="8"></div></div>' +
'<div class="field"><label>记什么</label><input id="tlTitle" type="text" maxlength="80" placeholder="如：整理完第三讲教案"></div>' +
'<p class="hint">这里只收「大事」—— 待办勾完、书读完会自动落一笔，不必手记。</p>',
foot: '<button class="btn" data-close>取消</button><button class="btn primary" data-act="tl-add-ok">记下</button>',
focus: '#tlTitle'
});
});
A.act('tl-add-ok', function () {
var t = $('#tlTitle'), d = $('#tlDate'), tg = $('#tlTag');
if (!t || !t.value.trim()) { if (t) t.focus(); return; }
S.addEntry({ title: t.value, date: (d && d.value) || S.today(), tag: (tg && tg.value) || '手记' });
tlYear = String((d && d.value) || S.today()).slice(0, 4);
A.closeTopModal(); A.refresh(); A.refreshOverviewSoft();
A.toast('记下了');
});
A.act('tl-del', function (el) {
var snap = JSON.parse(JSON.stringify(S.db.timeline));
S.delEntry(el.dataset.id);
A.refresh(); A.refreshOverviewSoft();
A.offerUndo('年表里这一笔删了', function () {
S.db.timeline = snap; S.commit();
A.refresh(); A.refreshOverviewSoft(); A.toast('放回来了');
});
});

function paintTl() {
var bar = $('#tlBar'), n = $('#tlN'), box = $('#tlList');
if (bar) {
if (tlm.q) bar.classList.add('has-q'); else bar.classList.remove('has-q');
}
if (n) {
n.textContent = '筛出 ' + tlList().length + ' 条';
if (tlm.q) n.removeAttribute('hidden'); else n.setAttribute('hidden', 'hidden');
}
if (box) box.innerHTML = tlMonthsHtml();
}
A.act('input:tl-q', function (el) { tlm.q = el.value.trim(); paintTl(); });
A.act('key:tl-q', function (el, e) {
if (e.key !== 'Escape' || !el.value) return false;
el.value = ''; tlm.q = ''; paintTl();
return true;
});
A.act('tl-q-clear', function () {
tlm.q = '';
var el = $('#tlQ');
if (el) { el.value = ''; el.focus(); }
paintTl();
});

document.addEventListener('keydown', function (e) {
if (A.activeId !== 'books' && A.activeId !== 'chronicle') return;
if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
if (document.querySelector('#modalRoot .mask')) return;
if (e.ctrlKey || e.metaKey || e.altKey) return;
if (e.key !== '/') return;
e.preventDefault();
var q = $(A.activeId === 'books' ? '#bkQ' : '#tlQ');
if (q) { q.focus(); q.select(); }
});

A.view('chronicle', { render: chronicleView });

var diaryDate = S.today();

function shiftDay(ymd, delta) {
var d = new Date(ymd + 'T12:00:00');
d.setDate(d.getDate() + delta);
return S.ymd(d);
}

function flushDiary() {
var ta = $('#diaryText');
if (!ta || !diaryDate) return;
var cur = S.db.diary[diaryDate];
if (!cur || cur.text !== ta.value) S.setDiary(diaryDate, ta.value);
}

function dayChars(k) {
var p = S.db.diary[k];
return p ? String(p.text || '').replace(/\s/g, '').length : 0;
}

function diaryStreak() {
var t = S.today();
var k = dayChars(t) > 0 ? t : shiftDay(t, -1);
var n = 0;
while (dayChars(k) > 0) { n++; k = shiftDay(k, -1); }
return n;
}

function dayPage(k) {
var before = Object.keys(S.db.diary).filter(function (x) {
return x < k && dayChars(x) > 0;
}).length;
return before + 1;
}

function monthCal(y, m) {
var first = new Date(y, m - 1, 1);
var total = new Date(y, m, 0).getDate();
var off = (first.getDay() + 6) % 7;

var today = S.today();
var cells = [];
for (var i = 0; i < off; i++) cells.push('<i class="pad"></i>');
var wrote = 0;
for (var d = 1; d <= total; d++) {
var k = y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
var n = dayChars(k);
if (n > 0) wrote++;

var lv = n === 0 ? 0 : n < 40 ? 1 : n < 150 ? 2 : 3;
cells.push('<button class="dc lv' + lv + (k === today ? ' today' : '') +
(k > today ? ' future' : '') + (k === diaryDate ? ' on' : '') +
'" data-act="d-day" data-d="' + k + '" title="' + k + (n ? ' · ' + n + ' 字' : ' · 没写') + '">' +
(k > today ? '' : d) + '</button>');
}
return '<div class="dcal">' +
'<div class="dcal-h"><span>' + y + ' 年 ' + m + ' 月</span>' +
'<span class="n">写过 ' + wrote + ' 天</span></div>' +
'<div class="dcal-w">' + ['一', '二', '三', '四', '五', '六', '日']
.map(function (w) { return '<i class="wh">' + w + '</i>'; }).join('') + '</div>' +
'<div class="dcal-g">' + cells.join('') + '</div>' +
'</div>';
}

function weekdayOf(k) {
var d = new Date(k + 'T12:00:00');
return '周' + ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
}

function diaryDayHint() {
var t = S.today();
if (diaryDate === t) return '今天';
var diff = Math.round((new Date(t + 'T12:00:00') - new Date(diaryDate + 'T12:00:00')) / 86400000);
return diff > 0 ? diff + ' 天前' : '';
}

function goDay(delta) {
var next = shiftDay(diaryDate, delta);
if (next > S.today()) return;

flushDiary();
diaryDate = next;
A.refresh();
var p = $('.pane.active');
if (p) p.scrollTop = 0;

}

function cnNum(n) {
n = Math.round(Number(n));
if (!(n >= 1 && n <= 99)) return String(n);
var D = '零一二三四五六七八九';
if (n <= 10) return n === 10 ? '十' : D.charAt(n);
var t = Math.floor(n / 10), u = n % 10;
return (t > 1 ? D.charAt(t) : '') + '十' + (u ? D.charAt(u) : '');
}

function diaryView() {
var db = S.db;
var cur = db.diary[diaryDate];
var days = Object.keys(db.diary).sort().reverse();
var se = A.season();
var d = new Date(diaryDate + 'T12:00:00');
var week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
var isToday = diaryDate === S.today();
var streak = diaryStreak();
var page = dayPage(diaryDate);
var written = Object.keys(db.diary).filter(function (k) { return dayChars(k) > 0; }).length;

var groups = [];
days.slice(0, 60).forEach(function (k) {
var m = k.slice(0, 7);
if (!groups.length || groups[groups.length - 1].m !== m) groups.push({ m: m, ks: [] });
groups[groups.length - 1].ks.push(k);
});
return '<div class="view">' +
'<div class="v-head"><div class="v-headmain">' +
'<div class="v-kicker">DIARY · 日课</div>' +
'<div class="v-title">我的日记本<span class="v-dot">.</span></div>' +
'<p class="v-lede">一天一页，纸色随季节。' +
(days.length ? '已经写了 ' + days.length + ' 页。' : '这一页还空着 —— 今天想记点什么。') +
'</p></div>' +
'<div class="v-acts">' +
'<span class="paper-pick" title="这一页用哪种纸">' +
[['plain', '素'], ['lined', '横'], ['grid', '格'], ['old', '旧']].map(function (p) {
return '<button data-act="d-paper" data-k="' + p[0] + '" class="' +
((S.db.meta.diaryPaper || 'plain') === p[0] ? 'on' : '') + '">' + p[1] + '</button>';
}).join('') + '</span>' +
'<button class="btn" data-act="d-era">纪年</button>' +
'<button class="btn" data-act="d-today">回到今天</button>' +
'<button class="btn" data-act="d-card">导出素笺</button>' +
'</div></div>' +
'<div class="diary-wrap">' +
'  <div class="diary-main">' +
'  <div class="diary-paper p-' + (S.db.meta.diaryPaper || 'plain') + '" data-id="' + esc(diaryDate) + '" ' +
'style="--diary-tone:' + se.tone + '">' +
'    <div class="diary-head">' +
'    <div class="diary-date">' + diaryDate + ' · 星期' + week + ' · ' + se.name +
(function () {
var y = d.getFullYear(), n = S.eraYear(y);
return n ? ' · ' + esc(S.db.meta.era.name) + cnNum(n) + '年' : '';
})() + '</div>' +

(streak > 1 ? '<span class="dstreak" title="连续写了 ' + streak + ' 天">连写 ' + streak + ' 天</span>' : '') +
'    </div>' +

(cur ? '    <div class="diary-title">今天这一页</div>' : '') +
'    <textarea class="diary-text" id="diaryText" data-input="d-text" placeholder="今天想留下的一句话……">' + esc(cur ? cur.text : '') + '</textarea>' +
'    <div class="diary-foot">' +
'      <span id="dState">' + (cur ? '已自动保存' : '') + '</span>' +
'      <span class="dpage" title="这是本子里的第几页">第 ' + page + ' 页</span>' +
'      <span class="dchars">' + (cur ? String(cur.text || '').replace(/\s/g, '').length + ' 字' : '') + '</span>' +
'    </div>' +
'    <div class="diary-nav">' +
'      <button class="dnb" data-act="d-prev" title="前一天（Alt + ←）">← 前一天</button>' +
'      <span class="dn-mid">' + diaryDayHint() + '</span>' +
'      <button class="dnb" data-act="d-next" title="后一天（Alt + →）"' + (isToday ? ' disabled' : '') + '>后一天 →</button>' +
'    </div>' +
'  </div>' +

monthCal(d.getFullYear(), d.getMonth() + 1) +
'  </div>' +
'  <div class="daylist">' +
'    <div class="dh">写过的日子<span class="dsum">' + written + ' 页' +
(streak > 1 ? ' · 连写 ' + streak + ' 天' : '') + '</span></div>' +
(days.length ? groups.map(function (g) {
var p = g.m.split('-');
var n = g.ks.filter(function (k) { return dayChars(k) > 0; }).length;
return '<div class="dmonth"><span>' + p[0] + ' 年 ' + Number(p[1]) + ' 月</span>' +
'<span class="n">' + n + ' 天</span></div>' +
g.ks.map(function (k) {
var c = dayChars(k);
return '<button class="' + (k === diaryDate ? 'on' : '') + '" data-act="d-day" data-d="' + k + '">' +
'<span class="dd">' + k.slice(8) + '</span>' +
'<span class="dw">' + weekdayOf(k) + '</span>' +
'<span class="dn' + (c ? '' : ' zero') + '">' + (c ? c : '—') + '</span>' +
'</button>';
}).join('');
}).join('') : '<div class="tiny" style="padding:6px 9px">还一篇都没有</div>') +
'  </div>' +
'</div></div>';
}
A.act('input:d-text', function (el) {

S.setDiary(diaryDate, el.value);
var st = $('#dState');
if (st) st.textContent = '已自动保存';
A.refreshOverviewSoft();
});
A.act('d-day', function (el) { flushDiary(); diaryDate = el.dataset.d; A.refresh(); });
A.act('d-paper', function (el) { S.setDiaryPaper(el.dataset.k); A.refresh(); });
A.act('d-era', function () {
var e = S.db.meta.era || { name: '', start: new Date().getFullYear() };
A.modal({
title: '纪年',
body: '<div class="vw-form-tip" style="margin:0 0 12px">用自己的年号记日子 —— 年号填两个字以内，' +
'元年填哪一年，那一年就是「一年」。</div>' +
'<label class="vw-field">年号<input type="text" id="eraName" maxlength="8" value="' +
esc(e.name || '') + '" placeholder="比如：宫羽"></label>' +
'<label class="vw-field">元年<input type="number" id="eraStart" value="' +
(e.start || new Date().getFullYear()) + '"></label>' +
'<div class="vw-form-tip">留空年号就退回公历。</div>',
foot: '<button class="btn" data-close>算了</button>' +
'<button class="btn primary" data-act="d-era-save">记下</button>'
});
setTimeout(function () { var i = document.querySelector('#eraName'); if (i) i.focus(); }, 40);
});
A.act('d-era-save', function (el, e) {
var n = document.querySelector('#eraName'), y = document.querySelector('#eraStart');
S.setEra(n ? n.value : '', y ? y.value : '');
var mask = e.target.closest('.mask'); if (mask) mask.close();
A.refresh();
});
A.act('d-today', function () { flushDiary(); diaryDate = S.today(); A.refresh(); });
A.act('d-prev', function () { goDay(-1); });
A.act('d-next', function () { goDay(1); });

(function bindDiarySwipe() {
var sx = 0, sy = 0, on = false;
document.addEventListener('touchstart', function (e) {
var paper = (e.target && e.target.closest) ? e.target.closest('.diary-paper') : null;
if (!paper || !e.touches || e.touches.length !== 1) { on = false; return; }
sx = e.touches[0].clientX; sy = e.touches[0].clientY; on = true;
}, { passive: true });
document.addEventListener('touchend', function (e) {
if (!on) return;
on = false;
var t = e.changedTouches && e.changedTouches[0];
if (!t) return;
var dx = t.clientX - sx, dy = t.clientY - sy;

if (Math.abs(dx) < 64 || Math.abs(dy) > 52) return;
var ae = document.activeElement;
if (ae && ae.id === 'diaryText') return;

goDay(dx > 0 ? -1 : 1);

}, { passive: true });
})();

document.addEventListener('keydown', function (e) {
if (!e.altKey) return;
if (!document.querySelector('.diary-paper')) return;
if (e.key === 'ArrowLeft') { e.preventDefault(); goDay(-1); }
else if (e.key === 'ArrowRight') { e.preventDefault(); goDay(1); }
});
A.act('d-card', function () {
var cur = S.db.diary[diaryDate];
if (!cur || !cur.text.trim()) { A.toast('这一页还是空的'); return; }
var W = 720, padX = 64, lh = 42, size = 21;
var c = document.createElement('canvas'), ctx = c.getContext('2d');
ctx.font = size + 'px KaiTi, serif';
var lines = [];
cur.text.split('\n').forEach(function (p) {
if (!p) { lines.push(''); return; }
var line = '';
for (var i = 0; i < p.length; i++) {
if (ctx.measureText(line + p[i]).width > W - padX * 2 && line) { lines.push(line); line = p[i]; }
else line += p[i];
}
if (line) lines.push(line);
});
var H = padX + 120 + lines.length * lh + 110;
c.width = W * 2; c.height = H * 2;
ctx.scale(2, 2);
ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
ctx.textBaseline = 'top';
ctx.strokeStyle = '#e6e6e6'; ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(padX, 56); ctx.lineTo(W - padX, 56); ctx.stroke();
ctx.fillStyle = '#8a8a8a'; ctx.font = '13px "Microsoft YaHei", sans-serif';
ctx.fillText(diaryDate, padX, 74);
ctx.fillStyle = '#1b1b1b'; ctx.font = '28px KaiTi, serif';
ctx.fillText('日记', padX, 100);
ctx.beginPath(); ctx.moveTo(padX, 148); ctx.lineTo(W - padX, 148); ctx.stroke();
ctx.fillStyle = '#2b2b2b'; ctx.font = size + 'px KaiTi, serif';
var y = 180;
lines.forEach(function (l) { ctx.fillText(l, padX, y); y += lh; });
ctx.fillStyle = '#9a9a9a'; ctx.font = '12px "Microsoft YaHei", sans-serif';
ctx.textAlign = 'right';
ctx.fillText(S.db.meta.name || '我的工作台', W - padX, H - 52);
ctx.textAlign = 'left';
c.toBlob(function (blob) {
var a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = '日记-' + diaryDate + '.png';
document.body.appendChild(a); a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
A.toast('素笺存下了');
}, 'image/png');
});

function fitDiary(pane) {
var ta = pane.querySelector('#diaryText');
if (!ta) return;
var set = function () {
ta.style.height = 'auto';
ta.style.height = Math.min(620, Math.max(200, ta.scrollHeight + 4)) + 'px';
};
set();
ta.addEventListener('input', set);

setTimeout(set, 60);
}
A.view('diary', { render: diaryView, mount: fitDiary });

var CATS = {
out: [
{ name: '餐饮', children: ['早餐', '午餐', '晚餐', '外卖', '买菜', '零食饮料', '请客'] },
{ name: '交通', children: ['公交地铁', '打车', '加油', '停车', '火车飞机'] },
{ name: '购物', children: ['日用百货', '服饰', '数码', '家居', '美妆'] },
{ name: '居住', children: ['房租', '物业', '水电燃气', '维修', '家具家电'] },
{ name: '通信', children: ['手机费', '宽带', '会员订阅'] },
{ name: '医疗', children: ['门诊', '药品', '体检', '保健'] },
{ name: '学习', children: ['书籍', '课程', '文具', '考试报名'] },
{ name: '人情', children: ['红包', '礼物', '请客聚餐', '探病'] },
{ name: '娱乐', children: ['电影演出', '旅游', '运动健身', '游戏'] },
{ name: '育儿', children: ['奶粉辅食', '玩具', '学费', '童装'] },
{ name: '宠物', children: ['主粮', '宠物医疗', '用品'] },
{ name: '其他', children: ['未分类'] }
],
in: [
{ name: '工资', children: ['基本工资', '绩效奖金', '补贴'] },
{ name: '奖金', children: ['年终奖', '项目奖'] },
{ name: '兼职', children: ['稿费', '外快', '家教'] },
{ name: '投资', children: ['利息', '分红', '基金', '租金'] },
{ name: '人情', children: ['红包', '礼金', '报销'] },
{ name: '其他收入', children: ['退款', '二手', '未分类'] }
]
};

var CCOLOR = {
'out:居住': '#8c3b2e',

'out:宠物': '#6f3729',
'out:学习': '#7d3f30',
'out:交通': '#9a6742',
'out:通讯': '#a85340',
'out:通信': '#a85340',
'out:餐饮': '#b4573f',
'out:娱乐': '#a3674f',
'out:人情': '#b8684a',
'out:购物': '#c0795c',
'out:医疗': '#c28a72',
'out:育儿': '#cb9a80',
'out:其他': '#8a8078',
'in:工资': '#2f6b52', 'in:奖金': '#3f7a5c', 'in:兼职': '#4a8068',
'in:投资': '#35604a', 'in:人情': '#57806b', 'in:其他收入': '#8a8078'
};
function catColor(type, name) {
var k = (type === 'in' ? 'in:' : 'out:') + name;
if (CCOLOR[k]) return CCOLOR[k];
var h = 0;
for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 9973;

var pool = type === 'in'
? ['#2f6b52', '#3f7a5c', '#4a8068', '#35604a']
: ['#a3674f', '#b8684a', '#9a6742', '#c0795c', '#7d3f30', '#c28a72'];
return pool[h % pool.length];
}
function catKids(type, name) {
var t = CATS[type === 'in' ? 'in' : 'out'];
for (var i = 0; i < t.length; i++) if (t[i].name === name) return t[i].children;
return [];
}

var ledMonth = '';

var lqOpen = false;

var ledMidOpen = false;

var ledFocus = '';

function shiftMonth(k, d) {
var y = Number(k.slice(0, 4)), mo = Number(k.slice(5, 7)) - 1 + d;
var dt = new Date(y, mo, 1);
return dt.getFullYear() + '-' + pad(dt.getMonth() + 1);
}

function daysInMonth(k) {
return new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)), 0).getDate();
}

function ledgerView() {
var list = S.db.ledger.slice();
var m = ledMonth || S.today().slice(0, 7);
var thisMonth = S.today().slice(0, 7);
var mIn = 0, mOut = 0;
var byCat = {};
var mine = list.filter(function (x) { return String(x.date).slice(0, 7) === m; });
mine.forEach(function (x) {
if (String(x.date).slice(0, 7) !== m) return;
if (x.type === 'in') mIn += x.amount;
else {
mOut += x.amount;
var c = x.category || '其他';
if (!byCat[c]) byCat[c] = { name: c, sum: 0, n: 0, subs: {} };
byCat[c].sum += x.amount;
byCat[c].n++;
var sub = x.sub || '未分类';
byCat[c].subs[sub] = (byCat[c].subs[sub] || 0) + x.amount;
}
});
var ranks = Object.keys(byCat).map(function (k) { return byCat[k]; })
.sort(function (a, b) { return b.sum - a.sum; });
var top = ranks.length ? ranks[0].sum : 0;

var year = m.slice(0, 4);
var months = [];
for (var i = 1; i <= 12; i++) {
var key = year + '-' + pad(i);
var o = 0, n = 0;
list.forEach(function (x) {
if (String(x.date).slice(0, 7) !== key) return;
if (x.type === 'in') n += x.amount; else o += x.amount;
});
months.push({ k: key, out: o, inn: n });
}
var max = Math.max.apply(null, months.map(function (x) { return Math.max(x.out, x.inn); }).concat([1]));

var pk = shiftMonth(m, -1);
var prevOut = 0;
list.forEach(function (x) {
if (String(x.date).slice(0, 7) === pk && x.type !== 'in') prevOut += x.amount;
});
var elapsed = (m === thisMonth) ? Number(S.today().slice(8, 10)) : daysInMonth(m);
var perDay = mOut / Math.max(1, elapsed);
var biggest = mine.filter(function (x) { return x.type !== 'in'; })
.sort(function (a, b) { return b.amount - a.amount; })[0] || null;
var diff = mOut - prevOut;

return '<div class="view">' +
vHead('LEDGER · 流水', '账本',

(mine.length
? m.replace('-', ' 年 ') + ' 月记了 ' + mine.length + ' 笔' +
(ranks.length ? '，花得最多的是「' + ranks[0].name + '」。' : '。')
: '这个月还没记过账。随手记一笔，月底就不用靠回忆。'),

'<button class="btn" data-act="l-add">完整记账…</button>') +

'<div class="led-monthbar">' +
'  <button class="lm-arrow" data-act="l-prev" title="上一个月">←</button>' +
'  <span class="lm">' + m.slice(0, 4) + ' 年 ' + Number(m.slice(5, 7)) + ' 月</span>' +
'  <button class="lm-arrow" data-act="l-next" title="下一个月"' + (m >= thisMonth ? ' disabled' : '') + '>→</button>' +
(m !== thisMonth ? '<button class="lm-now" data-act="l-now">回到本月</button>' : '') +
'</div>' +

ledgerQuick() +

'<div class="led-sum">' +

'  <div class="led-kpi out"><span class="k">' + (m === thisMonth ? '本月支出' : Number(m.slice(5, 7)) + ' 月支出') +
'<em class="s">' + mine.filter(function (x) { return x.type !== 'in'; }).length + ' 笔</em></span>' +
'<b class="v">' + A.money(mOut) + '</b></div>' +
'  <div class="led-kpi in"><span class="k">' + (m === thisMonth ? '本月收入' : Number(m.slice(5, 7)) + ' 月收入') +
'</span><b class="v">' + A.money(mIn) + '</b></div>' +
'  <div class="led-kpi"><span class="k">' + (m === thisMonth ? '本月结余' : '当月结余') +
'</span><b class="v' + (mIn - mOut < 0 ? ' neg' : '') + '">' +
(mIn - mOut > 0 ? '+' : '') + A.money(mIn - mOut) + '</b></div>' +
'</div>' +

(mine.length ? '<div class="led-recap">' +

(prevOut
? '<span>比上月' + (diff > 0 ? '<b class="up">多花 ' + A.money(diff) + '</b>'
: diff < 0 ? '<b class="down">少花 ' + A.money(-diff) + '</b>'
: '<b>持平</b>') +
'（' + (diff > 0 ? '+' : '') + Math.round(diff / prevOut * 100) + '%）</span>'
: '<span>上月没有记账</span>') +
'<span>日均 <b>' + A.money(Math.round(perDay)) + '</b>' +
(m === thisMonth ? '（已过 ' + elapsed + ' 天）' : '') + '</span>' +
(biggest ? '<span>最大一笔 <b>' + esc(biggest.category || '其他') + ' ' +
A.money(biggest.amount) + '</b></span>' : '') +
'</div>' : '') +

((ranks.length || list.length) ? '<div class="led-mid ' + (ledMidOpen ? 'open' : 'folded') + '">' +
(ledMidOpen && ranks.length ? '<div class="led-rank"><div class="lr-head">本月花在哪</div>' +
ranks.map(function (r) {
var col = catColor('out', r.name);
var subs = Object.keys(r.subs).sort(function (a, b) { return r.subs[b] - r.subs[a]; });
return '<div class="lr-row">' +
'<div class="lr-top"><span class="dot" style="background:' + col + '"></span>' +
'<span class="nm">' + esc(r.name) + '</span>' +
'<span class="pc">' + Math.round(r.sum / (mOut || 1) * 100) + '%</span>' +
'<span class="amt">' + A.money(r.sum) + '</span></div>' +
'<div class="lr-bar"><i style="width:' + Math.max(2, r.sum / (top || 1) * 100) + '%;background:' + col + '"></i></div>' +
(subs.length > 1 ? '<div class="lr-subs">' + subs.map(function (s) {
return '<span>' + esc(s) + '<b>' + A.money(r.subs[s]) + '</b></span>';
}).join('') + '</div>' : '') +
'</div>';
}).join('') + '</div>' : '') +
(list.length ? '<div class="led-trend">' +

'<button type="button" class="lr-head lr-fold" data-act="l-mid" ' +
'aria-expanded="' + (ledMidOpen ? 'true' : 'false') + '" ' +
'title="' + (ledMidOpen ? '收起全年趋势' : '展开分类排行与全年趋势') + '">' +
'<span class="lrf-t">' + (ledMidOpen ? year + ' 年 · 每月' : '全年') + '</span>' +
(ledMidOpen ? '<span class="lg"><i class="o"></i>支出<i class="i"></i>收入</span>' : '') +
'<i class="lrf-a">' + (ledMidOpen ? '▴' : '▾') + '</i></button>' +
'<div class="led-bars">' + months.map(function (x) {

var ho = x.out ? Math.max(2, Math.round(x.out / max * 100)) : 0;
var hi = x.inn ? Math.max(2, Math.round(x.inn / max * 100)) : 0;
return '<button class="led-bar' + (x.k === m ? ' on' : '') + '" data-act="l-month" data-m="' + x.k + '" ' +
'title="' + x.k + '：支出 ' + A.money(x.out) + (x.inn ? '，收入 ' + A.money(x.inn) : '') + '">' +
'<span class="cols">' +
(ho ? '<i class="col o" style="height:' + ho + '%"></i>' : '') +
(hi ? '<i class="col i" style="height:' + hi + '%"></i>' : '') +
'</span>' +
'<span class="m">' + Number(x.k.slice(5)) + '</span></button>';
}).join('') + '</div></div>' : '') +
'</div>' : '') +

ledgerList(mine, S.db.ledger.length > 0) +
'</div>';
}
function catOptions(type, sel) {
return CATS[type === 'in' ? 'in' : 'out'].map(function (c) {
return '<option' + (c.name === sel ? ' selected' : '') + '>' + esc(c.name) + '</option>';
}).join('');
}
function subOptions(type, cat, sel) {
return '<option value="">未分类</option>' + catKids(type, cat).map(function (s) {
return '<option' + (s === sel ? ' selected' : '') + '>' + esc(s) + '</option>';
}).join('');
}

var ledType = 'out';
var ledLast = { out: '餐饮', in: '工资' };
var ledDraft = { amt: '', note: '' };

var DAY_WORDS = [
['大前天', -3], ['前天', -2], ['昨天', -1], ['昨日', -1], ['昨儿', -1],
['今天', 0], ['今日', 0], ['今儿', 0]
];
function parseDayWord(s) {
for (var i = 0; i < DAY_WORDS.length; i++) {
if (s.indexOf(DAY_WORDS[i][0]) >= 0) return { word: DAY_WORDS[i][0], offset: DAY_WORDS[i][1] };
}
return null;
}

function parseOneLine(s) {
var str = String(s || '').trim();

var d = parseDayWord(str);
if (d) str = str.replace(d.word, ' ').replace(/\s+/g, ' ').trim();
var m = str.match(/(\d+(?:\.\d{1,2})?)/);
if (!m) {
return { amt: 0, note: str, dayWord: d ? d.word : '', dayOffset: d ? d.offset : 0 };
}
var amt = parseFloat(m[1]);
var note = (str.slice(0, m.index) + ' ' + str.slice(m.index + m[1].length))
.replace(/\s+/g, ' ').trim();
return {
amt: isFinite(amt) ? amt : 0,
note: note,
dayWord: d ? d.word : '',
dayOffset: d ? d.offset : 0
};
}

var GUESS = [
['餐饮', ['饭', '吃', '早餐', '午饭', '午餐', '晚饭', '晚餐', '夜宵', '外卖', '面', '粉',
'咖啡', '奶茶', '零食', '饮料', '水果', '菜', '火锅', '烧烤', '食堂', '酒', '早点']],
['交通', ['打车', '滴滴', '地铁', '公交', '高铁', '火车', '机票', '飞机', '加油', '油费',
'停车', '单车', '共享', '过路费']],
['通信', ['话费', '流量', '宽带', '会员', '订阅', '充值']],
['居住', ['房租', '水电', '燃气', '物业', '维修', '家具', '家电', '保洁']],
['医疗', ['医院', '门诊', '挂号', '药', '体检', '牙', '看病']],
['学习', ['书', '课', '培训', '考试', '文具', '资料', '报名']],
['娱乐', ['电影', '演出', '旅游', '健身', '游戏', '门票', '唱歌', 'ktv', '剧本']],
['人情', ['红包', '礼', '份子', '随礼', '请客', '探病']],
['购物', ['淘宝', '京东', '拼多多', '网购', '衣服', '鞋', '裤', '包', '化妆品',
'日用', '纸巾', '超市', '耳机']],
['育儿', ['奶粉', '尿不湿', '玩具', '童装', '学费']],
['宠物', ['猫粮', '狗粮', '猫砂', '宠物', '疫苗']]
];
function guessCat(note) {
var s = String(note || '').toLowerCase();
if (!s) return '';
for (var i = 0; i < GUESS.length; i++) {
for (var j = 0; j < GUESS[i][1].length; j++) {
if (s.indexOf(GUESS[i][1][j]) >= 0) return GUESS[i][0];
}
}
return '';
}

function quickTip() {
var t = S.today();
var o = 0, i = 0, n = 0;
S.db.ledger.forEach(function (x) {
if (String(x.date).slice(0, 10) !== t) return;
n++;
if (x.type === 'in') i += x.amount; else o += x.amount;
});
if (!n) return '一句话就记下 —— 写「午饭 25」';
return '今天已记 ' + n + ' 笔 · 支出 ' + A.money(o) + ' · 收入 ' + A.money(i);
}

function ledgerBootstrap() {

var list = S.db.ledger || [];
['out', 'in'].forEach(function (tp) {
for (var i = 0; i < list.length; i++) {
if ((list[i].type === 'in' ? 'in' : 'out') !== tp) continue;
if (list[i].category) ledLast[tp] = list[i].category;
break;
}
});
}

function ledgerQuick() {
ledgerBootstrap();
var cats = CATS[ledType];
var cur = ledLast[ledType];
var names = cats.map(function (c) { return c.name; });
if (names.indexOf(cur) < 0) cur = names[0];
return '<div class="led-quick">' +
'<div class="lq-row">' +
'<div class="lq-type">' +
'  <button type="button" class="' + (ledType === 'out' ? 'on' : '') + '" data-act="l-type" data-v="out">支出</button>' +
'  <button type="button" class="' + (ledType === 'in' ? 'on' : '') + '" data-act="l-type" data-v="in">收入</button>' +
'</div>' +

'<label class="lq-amt"><span>¥</span>' +
'<input id="lqAmt" type="text" autocomplete="off" placeholder="0.00" data-input="lq-amt"></label>' +
'<select class="lq-pick" id="lqCat" data-initial="' + esc(cur) + '">' + names.map(function (n) {
return '<option' + (n === cur ? ' selected' : '') + '>' + esc(n) + '</option>';
}).join('') + '</select>' +
'<button type="button" class="btn primary lq-go" data-act="lq-save">记一笔</button>' +
'</div>' +
'<div class="lq-tipline">' +
'  <span class="lq-tip" id="lqTip">' + quickTip() + '</span>' +

'  <button type="button" class="lq-fold" data-act="lq-detail" aria-controls="lqDetail" ' +
'aria-expanded="' + (lqOpen ? 'true' : 'false') + '">' + (lqOpen ? '收起 ▴' : '日期 / 备注 ▾') + '</button>' +
'</div>' +
'<div class="lq-detail" id="lqDetail"' + (lqOpen ? '' : ' hidden') + '>' +
'  <label class="lq-date"><span>日期</span><input id="lqDate" type="date" autocomplete="off"></label>' +
'  <input class="lq-note" id="lqNote" type="text" autocomplete="off" data-input="lq-note" ' +
'placeholder="备注，可留空">' +
'</div>' +
'</div>';
}

function ledgerList(list, emptyMonth) {
if (!list.length) {
return '<div class="empty"><div class="mark">账</div><div class="t">' +
(emptyMonth ? '这个月还没有账' : '还没有记过账') + '</div>' +
'<div class="d">' + (emptyMonth
? '翻到上个月看看，或者在上面补记一笔'
: (S.narrow() ? '在上面那个框里写「午饭 25」，点「记一笔」就行'
: '上面那个框，输入「午饭 25」回车就记下了')) + '</div></div>';
}
var groups = [], idx = {};
list.slice(0, 400).forEach(function (x) {
var d = String(x.date).slice(0, 10);
if (!idx[d]) { idx[d] = { d: d, out: 0, inn: 0, items: [] }; groups.push(idx[d]); }
idx[d].items.push(x);
if (x.type === 'in') idx[d].inn += x.amount; else idx[d].out += x.amount;
});
return groups.map(function (g) {
var sum = [];
if (g.out) sum.push('支出 ' + A.money(g.out));
if (g.inn) sum.push('收入 ' + A.money(g.inn));
return '<div class="led-day">' +
'<div class="ld-head"><span class="ld-d">' + esc(A.dayLabel(g.d)) + '</span>' +
'<span class="ld-sum">' + sum.join(' · ') + '</span></div>' +
'<table class="led-table"><tbody>' + g.items.map(function (x) {
var isIn = x.type === 'in';
return '<tr class="led-row" data-act="l-edit" data-id="' + x.id + '" title="点一下改这笔">' +
'<td class="cat"><span class="dot" style="background:' + catColor(x.type, x.category || '其他') + '"></span>' +
esc(x.category || '其他') + (x.sub ? '<em>' + esc(x.sub) + '</em>' : '') + '</td>' +
'<td>' + esc(x.note || '') + '</td>' +
'<td class="amt ' + (isIn ? 'in' : '') + '">' + (isIn ? '+' : '−') + A.money(x.amount).slice(1) + '</td>' +
'<td style="width:26px"><button class="del" data-act="l-del" data-id="' + x.id + '">✕</button></td>' +
'</tr>';
}).join('') + '</tbody></table></div>';
}).join('');
}

function saveQuick() {
var a = $('#lqAmt'), n = $('#lqNote'), c = $('#lqCat'), d = $('#lqDate');
var raw = a ? String(a.value || '').trim() : '';

var numOnly = raw.replace(/[,，]/g, '');
var amt = /^\d+(?:\.\d{1,2})?$/.test(numOnly) ? parseFloat(numOnly) : 0;
var phr = (!amt && raw) ? parseOneLine(raw) : null;
if (phr && phr.amt) amt = phr.amt;
var note = n ? n.value.trim() : '';
var dayOffset = 0;

if (note) {
var p = parseOneLine(note);
if (!amt) amt = p.amt;
if (p.dayWord) { note = p.note; dayOffset = p.dayOffset; }
else if (!amt) note = p.note;
}
if (!note && phr && phr.note) note = phr.note;
if (!dayOffset && phr && phr.dayWord) dayOffset = phr.dayOffset;
if (!amt || !isFinite(amt) || amt <= 0) {
A.toast('填个金额，或直接写「午饭 25」');
if (a) a.focus();
return;
}
var cat = (c && c.value) || ledLast[ledType];
ledLast[ledType] = cat;

var dv = (d && d.value) || '';
var date = dv || (dayOffset ? S.daysAgo(-dayOffset) : S.today());
S.addLedger({ amount: amt, date: date, type: ledType, category: cat, sub: '', note: note });

ledMonth = String(date).slice(0, 7);
ledDraft = { amt: '', note: '', date: '' };
A.refresh(); A.refreshOverviewSoft();

A.toast('记下了 · ' + cat + ' ' + A.money(amt) +
(dayOffset ? '（补记 ' + date.slice(5) + '）' : dv ? '（' + date.slice(5) + '）' : ''));
}

function lqEcho(el) {
var tip = $('#lqTip');
if (!tip) return;
var raw = String((el && el.value) || '').trim();
if (!raw) { tip.innerHTML = quickTip(); return; }
var p = parseOneLine(raw);
var amt = p.amt;

if (!amt) {
var av = $('#lqAmt') ? String($('#lqAmt').value || '').replace(/[,，]/g, '') : '';
if (/^\d+(?:\.\d{1,2})?$/.test(av)) amt = parseFloat(av);
}
var bits = [];
if (amt) {

var g = guessCat(p.note);
var c = $('#lqCat');
if (g && c && c.value === c.getAttribute('data-initial')) c.value = g;
bits.push('<b>¥' + (Math.round(amt * 100) / 100) + '</b>');
bits.push((c && c.value) || g || (ledType === 'in' ? '收入' : '其他'));
}
if (p.dayWord) bits.push(p.dayWord);
if (!amt) {
tip.innerHTML = '还没认出金额 —— 写「午饭 25」这样就行';
return;
}
tip.innerHTML = '会记成：' + bits.join(' · ') +
(S.narrow() ? '' : '　<span style="opacity:.55">分类可改，回车就记下</span>');
}

A.act('input:lq-amt', function (el) { lqEcho(el); });
A.act('input:lq-note', function (el) { lqEcho(el); });

A.act('lq-save', function () { saveQuick(); });

A.act('l-type', function (el) {
var a = $('#lqAmt'), n = $('#lqNote'), d = $('#lqDate');
ledDraft = { amt: a ? a.value : '', note: n ? n.value : '', date: d ? d.value : '' };
ledType = el.dataset.v === 'in' ? 'in' : 'out';
A.refresh();
});

A.act('lq-sample', function (el) {
var p = parseOneLine(el.dataset.v || '');
var a = $('#lqAmt'), n = $('#lqNote'), c = $('#lqCat');
if (a) a.value = p.amt || '';
if (n) n.value = p.note || '';
var g = guessCat(el.dataset.v || '');
if (g && c) c.value = g;
if (a) a.focus();
});

function openLedgerModal(item) {
var isNew = !item;
var it = item || {
id: '', date: S.today(), type: ledType, amount: '',
category: ledLast[ledType], sub: '', note: ''
};
var type = it.type === 'in' ? 'in' : 'out';
A.modal({
title: isNew ? '详细记一笔' : '改这一笔',
body: '<div class="row2"><div class="field"><label>日期</label>' +
'<input id="lgDate" type="date" value="' + esc(it.date) + '"></div>' +
'<div class="field"><label>收 / 支</label><select id="lgType" data-change="lg-type">' +
'<option value="out"' + (type === 'out' ? ' selected' : '') + '>支出</option>' +
'<option value="in"' + (type === 'in' ? ' selected' : '') + '>收入</option></select></div></div>' +
'<div class="row2"><div class="field"><label>金额</label>' +
'<input id="lgAmt" type="number" min="0" step="0.01" value="' + (it.amount || '') + '" placeholder="0.00"></div>' +
'<div class="field"><label>项目</label><select id="lgCat" data-change="lg-cat">' +
catOptions(type, it.category) + '</select></div></div>' +
'<div class="field"><label>细目（可留空）</label><select id="lgSub">' +
subOptions(type, it.category || '其他', it.sub) + '</select></div>' +
'<div class="field"><label>备注</label><input id="lgNote" type="text" ' +
'value="' + esc(it.note || '') + '" placeholder="买了什么"></div>',
foot: '<button class="btn" data-close>取消</button>' +
'<button class="btn primary" data-act="led-save" data-id="' + (it.id || '') + '">' +
(isNew ? '记下' : '存下') + '</button>',
focus: '#lgAmt'
});
}

A.act('l-add', function () { openLedgerModal(null); });

A.act('l-prev', function () {
ledMonth = shiftMonth(ledMonth || S.today().slice(0, 7), -1);
A.refresh();
});
A.act('l-next', function () {
var cur = ledMonth || S.today().slice(0, 7);
var nx = shiftMonth(cur, 1);
if (nx > S.today().slice(0, 7)) return;
ledMonth = nx; A.refresh();
});
A.act('l-now', function () { ledMonth = ''; A.refresh(); });
A.act('l-month', function (el) {
var k = el.dataset.m;
if (k > S.today().slice(0, 7)) return;
ledMonth = (k === S.today().slice(0, 7)) ? '' : k;
A.refresh();
});

A.act('l-mid', function () {
ledMidOpen = !ledMidOpen;
ledFocus = 'l-mid';

A.refresh();
});

A.act('lq-detail', function () {
lqOpen = !lqOpen;
ledFocus = 'lq-detail';
A.refresh();
});
A.act('l-edit', function (el) {
var x = S.db.ledger.filter(function (y) { return y.id === el.dataset.id; })[0];
if (x) openLedgerModal(x);
});
A.act('change:lg-type', function (el) {
var t = el.value;
var c = $('#lgCat');
c.innerHTML = catOptions(t);
$('#lgSub').innerHTML = subOptions(t, c.value);
});
A.act('change:lg-cat', function (el) {
var t = ($('#lgType') || {}).value || 'out';
$('#lgSub').innerHTML = subOptions(t, el.value);
});
A.act('led-save', function (el) {
var id = el.dataset.id || '';
var amt = $('#lgAmt'), d = $('#lgDate'), t = $('#lgType');
var c = $('#lgCat'), s = $('#lgSub'), n = $('#lgNote');
var v = amt ? Math.abs(Number(amt.value)) : 0;
if (!v) { if (amt) amt.focus(); A.toast('金额不能空'); return; }
var o = {
amount: v, date: (d && d.value) || S.today(),
type: (t && t.value) === 'in' ? 'in' : 'out',
category: (c && c.value) || '其他', sub: (s && s.value) || '',
note: (n && n.value) || ''
};
if (id) {
if (!S.updateLedger(id, o)) { A.toast('改不动这笔'); return; }
} else {
S.addLedger(o);
}
ledType = o.type; ledLast[o.type] = o.category;
ledMonth = String(o.date).slice(0, 7);

A.closeTopModal(); A.refresh(); A.refreshOverviewSoft();
A.toast(id ? '改好了' : '记下了 · ' + o.category + ' ' + A.money(o.amount));
});
A.act('l-del', function (el) {
var removed = S.delLedger(el.dataset.id);
if (!removed) return;
A.refresh(); A.refreshOverviewSoft();
A.offerUndo('这笔账删了', function () {
S.restoreLedger(removed);
A.refresh(); A.refreshOverviewSoft(); A.toast('放回来了');
});
});

function ledgerMount(pane) {
var a = $('#lqAmt'), n = $('#lqNote'), d = $('#lqDate');
if (a && ledDraft.amt) a.value = ledDraft.amt;
if (n && ledDraft.note) n.value = ledDraft.note;
if (d && ledDraft.date) d.value = ledDraft.date;
ledDraft = { amt: '', note: '', date: '' };

var back = ledFocus ? pane.querySelector('[data-act="' + ledFocus + '"]') : null;
ledFocus = '';
if (back) { try { back.focus(); } catch (e) { } }
else if (a) { try { a.focus(); } catch (e) { } }
pane.onkeydown = function (e) {
var t = e.target;
if (!t || (t.id !== 'lqAmt' && t.id !== 'lqNote')) return;
if (e.key === 'Enter') { e.preventDefault(); saveQuick(); }
};

pane.oninput = function (e) {
var t = e.target;
if (!t || (t.id !== 'lqNote' && t.id !== 'lqAmt')) return;
if (t.id === 'lqNote') {
var g = guessCat(t.value);
var c = $('#lqCat');
if (g && c && c.value !== g) c.value = g;
}
};
}

A.view('ledger', { render: ledgerView, mount: ledgerMount });

var docId = null;
var docsShowArch = false;

var docMode = 'read';

var docSaveTimer = null;
var docPending = null;
function flushDocSave() {
if (docSaveTimer) { clearTimeout(docSaveTimer); docSaveTimer = null; }
var p = docPending;
docPending = null;
if (p) S.updateDoc(p.id, { content: p.text });
}

function docCatName(c) { return c || '未归档'; }

function docOutline(text) {
var out = [];
String(text == null ? '' : text).split('\n').forEach(function (ln, i) {
var t = ln.trim();
if (!t) return;
var lv = 0, label = t;
var mh = /^(#{1,3})\s+(.+)$/.exec(t);
if (mh) {
lv = mh[1].length;
label = mh[2].trim();
} else if (/^第[〇零一二三四五六七八九十百千0-9]+[章节回卷篇]/.test(t)) {
lv = 1;
} else if (/^[（(][一二三四五六七八九十]+[）)]/.test(t)) {
lv = 2;
} else if (/^[一二三四五六七八九十]+、/.test(t)) {
lv = 2;
}
if (!lv) return;
if (!mh && (label.length > 24 || /[。；]/.test(label))) return;
out.push({ line: i, level: lv, text: label });
});
return out;
}

var RE_HR = /^\s*(?:[-*_—]\s*){3,}$|^\s*[·.。]{3,}\s*$/;
var RE_QUOTE = /^\s*>\s?/;
var RE_LI = /^\s*(?:[-*·]\s+|\d+[.、]\s+)/;

function docBlocks(text) {
var src = String(text == null ? '' : text).split('\n');
var heads = {};
docOutline(text).forEach(function (h) { heads[h.line] = h; });
var out = [];
var quote = null;

for (var i = 0; i < src.length; i++) {
var raw = src[i];
var t = String(raw).trim();
if (heads[i]) {
quote = null;
out.push({ kind: 'h', line: i, level: heads[i].level, text: heads[i].text });
continue;
}
if (!t) { quote = null; continue; }
if (RE_HR.test(t)) { quote = null; out.push({ kind: 'hr', line: i }); continue; }
if (RE_QUOTE.test(t)) {
var q = t.replace(RE_QUOTE, '').trim();
if (quote && quote.line === i - 1) {

quote.lines.push(q); quote.line = i;
} else {
quote = { kind: 'quote', line: i, lines: [q] };
out.push(quote);
}
continue;
}
quote = null;
if (RE_LI.test(t)) {
var item = t.replace(RE_LI, '').trim();
var last = out[out.length - 1];
if (last && last.kind === 'li' && last.line === i - 1) {
last.items.push(item); last.line = i;
} else {
out.push({ kind: 'li', line: i, items: [item] });
}
continue;
}
out.push({ kind: 'p', line: i, text: t });
}
return out;
}

function canDrop(t) {
return /^[\u4e00-\u9fa5A-Za-z0-9]/.test(t) && t.length > 24;
}

function docRender(text) {
var bs = docBlocks(text);
var dropped = false;
var html = bs.map(function (b) {
var ln = ' data-line="' + b.line + '"';
if (b.kind === 'h') {
return '<h' + (b.level === 1 ? 2 : 3) + ' class="dh lv' + b.level + '"' + ln + '>' +
esc(b.text) + '</h' + (b.level === 1 ? 2 : 3) + '>';
}
if (b.kind === 'hr') return '<hr class="orn"' + ln + '>';
if (b.kind === 'quote') {
return '<blockquote' + ln + '>' + b.lines.map(function (l) {
return '<p>' + esc(l) + '</p>';
}).join('') + '</blockquote>';
}
if (b.kind === 'li') {
return '<ul' + ln + '>' + b.items.map(function (l) {
return '<li>' + esc(l) + '</li>';
}).join('') + '</ul>';
}

var cls = '';
if (!dropped) {
dropped = true;
if (canDrop(b.text)) cls = ' class="drop"';
}
return '<p' + cls + ln + '>' + esc(b.text) + '</p>';
}).join('');
return '<article class="doc-read">' + html + '</article>';
}

function tocHtml(list) {
return '<div class="doc-toc-h">目录<span>' + list.length + '</span></div>' +
list.map(function (h) {
return '<button class="lv' + h.level + '" data-act="w-toc" data-line="' + h.line + '" title="' +
esc(h.text) + '">' + esc(h.text) + '</button>';
}).join('');
}

function tocMark(line) {
var box = document.querySelector('#docToc');
if (!box) return;
var btns = Array.prototype.slice.call(box.querySelectorAll('button'));
var on = -1;
btns.forEach(function (b) {
var l = Number(b.getAttribute('data-line'));
if (l <= line) on = l;
});
btns.forEach(function (b) {
b.classList.toggle('on', Number(b.getAttribute('data-line')) === on);
});
}

function lineAtScroll(pane) {
var els = pane.querySelectorAll('.doc-read [data-line]');
if (!els.length) return 0;
var top = pane.scrollTop + 80;

var line = Number(els[0].getAttribute('data-line'));
for (var i = 0; i < els.length; i++) {
if (els[i].offsetTop <= top) line = Number(els[i].getAttribute('data-line'));
else break;
}
return line;
}

function docTocMount(pane) {
var ta = pane.querySelector('#docBody');
var reading = pane.querySelector('.doc-read');
if (!ta && !reading) return;

var scroller = ta || pane;

var pendP = null;
scroller.addEventListener('scroll', function () {
if (pendP) return;
pendP = setTimeout(function () { pendP = null; A.docProgress(scroller); }, 60);
}, { passive: true });
A.docProgress(scroller);
setTimeout(function () { A.docProgress(scroller); }, 60);

var box = pane.querySelector('#docToc');
if (!box) return;
var lineH = function () {
var v = parseFloat(getComputedStyle(ta || reading).lineHeight);
return v > 4 ? v : 30;

};
var pend = null;
scroller.addEventListener('scroll', function () {
if (pend) return;

pend = setTimeout(function () {
pend = null;
tocMark(ta ? Math.floor(ta.scrollTop / lineH()) + 1 : lineAtScroll(pane));
}, 80);
}, { passive: true });
tocMark(ta ? 1 : lineAtScroll(pane));
}

function docsView() {
var all = S.db.docs.slice().sort(function (a, b) { return b.ts - a.ts; });
var list = docsShowArch ? all : all.filter(function (d) { return !d.archived; });
if (!docId && list.length) docId = list[0].id;
var cur = list.filter(function (d) { return d.id === docId; })[0] ||
all.filter(function (d) { return d.id === docId; })[0];
var st = S.stats();
var nArch = all.filter(function (d) { return d.archived; }).length;

var cats = [];
var byCat = {};
list.forEach(function (d) {
var k = docCatName(d.cat);
if (!byCat[k]) { byCat[k] = []; cats.push(k); }
byCat[k].push(d);
});
cats.sort(function (a, b) {
return byCat[b][0].ts - byCat[a][0].ts;
});

var readMode = !!(cur && String(cur.content || '').trim() && docMode === 'read');
var outline = cur ? docOutline(cur.content) : [];

var showToc = outline.length >= 3;

var shelf = cats.length ? cats.map(function (k) {
var docs = byCat[k];
return '<div class="shelf"><div class="shelf-h"><span class="shelf-name">' + esc(k) + '</span>' +
'<span class="shelf-n">' + docs.length + ' 篇</span></div>' +
docs.map(function (d) {
return '<button class="' + (d.id === docId ? 'on' : '') + (d.archived ? ' archived' : '') +
'" data-act="w-open" data-id="' + d.id + '">' +
esc(d.title) + '<span class="n">' + String(d.content || '').replace(/\s/g, '').length + ' 字 · ' +
S.ymd(d.ts) + (d.opens ? ' · 翻过 ' + d.opens + ' 次' : '') + '</span></button>';
}).join('') + '</div>';
}).join('') : '';

return '<div class="view">' +
vHead('DOCS · 文书', '我的文档',
all.length ? '写下来的才算数：' + all.length + ' 篇，约 ' +
st.docChars.toLocaleString('zh-CN') + ' 字，分在 ' + cats.length + ' 个架子上。'
: '还没有存目。长一点的东西，都可以从这里开个头。',
(nArch ? '<button class="btn" data-act="w-arch-show">' + (docsShowArch ? '藏起归档' : '看归档') + '</button>' : '') +
'<button class="btn" data-act="w-assemble">从笔记装配</button>' +
'<button class="btn" data-act="w-pdf" data-id="' + (cur ? cur.id : '') + '">导出 PDF</button>' +
'<button class="btn primary" data-act="w-add">＋ 新建</button>',

(all.length ? [[all.length, '篇'], [st.docChars.toLocaleString('zh-CN'), '字'],
[cats.length, '个架子'], [nArch, '已归档']] : null)) +
'<div class="doc-wrap' + (showToc ? ' has-toc' : '') + '">' +
'  <div class="doclist">' + shelf + '</div>' +
'  <div class="doc-editor">' +
(cur
? '<div class="doc-top">' +
(readMode
? '<h1 class="doc-read-title" id="docTitleShow">' + esc(cur.title) + '</h1>'
: '<input class="doc-title-input" id="docTitle" data-input="w-title" data-id="' + cur.id + '" value="' + esc(cur.title) + '">') +
'<button class="' + (readMode ? 'btn sm' : 'btn ghost sm') + '" data-act="w-mode" ' +
'title="' + (readMode ? '改这一篇' : '看排好版的样子') + '">' +
(readMode ? '编辑' : '阅读') + '</button>' +
'</div>' +
(readMode
? docRender(cur.content)
: '<textarea class="doc-content" id="docBody" data-input="w-body" data-id="' + cur.id + '" placeholder="从这里开始写……">' + esc(cur.content) + '</textarea>') +
'<div class="list-head" style="margin:10px 0 0"><span id="docCount">' + String(cur.content || '').replace(/\s/g, '').length + ' 字</span>' +
'<span id="docState" class="tiny" data-id="' + cur.id + '"></span>' +
'<span class="acts">' +
'<input class="doc-cat-in" list="docCats" data-input="w-cat" data-id="' + cur.id + '" ' +
'value="' + esc(cur.cat || '') + '" placeholder="归到哪个架" title="同一分类的排在一个书架上">' +
'<datalist id="docCats">' + cats.map(function (k) {
return '<option value="' + (k === '未归档' ? '' : esc(k)) + '">';
}).join('') + '</datalist>' +
'<button class="link-btn" data-act="w-arch" data-id="' + cur.id + '">' +
(cur.archived ? '从归档取出' : '归档') + '</button>' +
'<button class="link-btn" data-act="w-del" data-id="' + cur.id + '">删掉这篇</button>' +
'</span></div>'
: '<div class="empty"><div class="mark">文</div><div class="t">还没有文档</div><div class="d">点上方「＋ 新建」，写点长的东西</div></div>') +
'  </div>' +
(showToc ? '<aside class="doc-toc" id="docToc">' + tocHtml(outline) + '</aside>' : '') +
'</div></div>';
}
A.act('input:w-cat', function (el) {
S.updateDoc(el.dataset.id, { cat: el.value.trim() });

A.refreshOverviewSoft();
var t = setTimeout(function () { A.refresh(); }, 900);

clearTimeout(A._catTimer); A._catTimer = t;
});
A.act('w-arch', function (el) {
var d = S.db.docs.filter(function (x) { return x.id === el.dataset.id; })[0];
if (!d) return;
S.updateDoc(el.dataset.id, { archived: !d.archived });
A.toast(d.archived ? '放回书架' : '收进归档');
A.refresh(); A.refreshOverviewSoft();
});
A.act('w-arch-show', function () { docsShowArch = !docsShowArch; A.refresh(); });

A.act('w-toc', function (el) {
var line0 = Number(el.getAttribute('data-line')) || 0;

var art = document.querySelector('.doc-read');
if (art) {
var want = null;
Array.prototype.forEach.call(art.querySelectorAll('[data-line]'), function (b) {
if (want === null && Number(b.getAttribute('data-line')) >= line0) want = b;
});
if (want) {
var pane = want.closest('.pane');
var y = Math.max(0, want.offsetTop - 68);
if (pane) { try { pane.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { pane.scrollTop = y; } }
}
return;
}

var ta = document.querySelector('#docBody');
if (!ta) return;
var line = Number(el.getAttribute('data-line')) || 0;
var lines = String(ta.value || '').split('\n');
var off = 0;
for (var i = 0; i < line && i < lines.length; i++) off += lines[i].length + 1;
try { ta.focus(); } catch (e) { }
if (ta.setSelectionRange) ta.setSelectionRange(off, off + (lines[line] || '').length);
var lh = parseFloat(getComputedStyle(ta).lineHeight);
if (!(lh > 4)) lh = 30;
var top = Math.max(0, (line - 1) * lh);

setTimeout(function () { ta.scrollTop = top; }, 0);
});
A.act('input:w-title', function (el) {
S.updateDoc(el.dataset.id, { title: el.value });

var li = document.querySelector('.doclist button[data-id="' + el.dataset.id + '"]');
if (li && li.firstChild && li.firstChild.nodeType === 3) li.firstChild.nodeValue = el.value || '无题';
A.refreshOverviewSoft();
});
A.act('input:w-body', function (el) {
var val = el.value, id = el.dataset.id;
var c = $('#docCount');
if (c) c.textContent = val.replace(/\s/g, '').length + ' 字';
var st = $('#docState');

var box = document.querySelector('#docToc');
if (box) {
clearTimeout(A._tocTimer);
A._tocTimer = setTimeout(function () {
var list = docOutline(val);
var cur = document.querySelector('#docToc');
if (cur && list.length >= 3) cur.innerHTML = tocHtml(list);
}, 700);
}

S.updateDoc(id, { content: val });
if (st && st.getAttribute('data-id') === id) st.textContent = '已自动保存';
});
A.act('w-open', function (el) {
flushDocSave();

docId = el.dataset.id;
S.openDoc(el.dataset.id);

A.refresh();
});
A.act('w-add', function () {
flushDocSave();
var cur = S.db.docs.filter(function (x) { return x.id === docId; })[0];
var d = S.addDoc('无题', '', cur ? cur.cat : '');

docId = d.id;
docMode = 'write';

A.refresh();
setTimeout(function () { var t = $('#docTitle'); if (t) { t.focus(); t.select(); } }, 40);
});

A.act('w-mode', function () {
flushDocSave();

docMode = docMode === 'read' ? 'write' : 'read';
A.refresh();
if (docMode === 'write') {
setTimeout(function () {
var ta = document.querySelector('#docBody');
if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}, 60);
}
});

A.act('w-del', function (el) {
var d = S.db.docs.filter(function (x) { return x.id === el.dataset.id; })[0];
if (!d) return;
var chars = String(d.content || '').replace(/\s/g, '').length;
A.modal({
title: '删掉这一篇？',
body: '<p class="hint">《' + A.esc(d.title) + '》' +
(chars ? '（' + chars + ' 字）' : '') +
'会一起清掉。删完还有几秒能撤销，过了就找不回来了。</p>',
foot: '<button class="btn" data-close>再想想</button>' +
'<button class="btn danger" data-act="w-del-ok" data-id="' + d.id + '">确认删掉</button>'
});
});
A.act('w-del-ok', function (el) {
A.closeTopModal();
flushDocSave();

var snap = JSON.parse(JSON.stringify(S.db.docs));
S.delDoc(el.dataset.id);
docId = null;
A.refresh(); A.refreshOverviewSoft();
A.offerUndo('这篇文档删了', function () {
S.db.docs = snap; S.commit();
A.refresh(); A.refreshOverviewSoft(); A.toast('放回来了');
});
});
A.act('w-pdf', function (el) {
var d = S.db.docs.filter(function (x) { return x.id === el.dataset.id; })[0];
if (!d) { A.toast('先选一篇'); return; }
var w = window.open('', '_blank');
if (!w) { A.toast('浏览器拦了新窗口'); return; }

var html = docRender(d.content);
w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + esc(d.title) + '</title>' +
'<style>' +
'body{font-family:"KaiTi","Kaiti SC",STKaiti,serif;max-width:38em;margin:56px auto;' +
'line-height:2.0;font-size:16px;color:#2b2622;background:#fff;padding:0 1em}' +
'h1.t{font-size:26px;letter-spacing:2px;font-weight:normal;margin:0 0 26px;' +
'padding-bottom:12px;border-bottom:1px solid #ddd8cc}' +
'p{margin:0 0 .35em;text-indent:2em;text-align:justify}' +
'p.drop{text-indent:0}p.drop::first-letter{float:left;font-size:3.2em;line-height:.9;' +
'padding:.08em .1em 0 0;color:#8c3b2e}' +
'h2{font-size:19.5px;font-weight:normal;margin:1.9em 0 .7em;padding-left:.62em;' +
'border-left:3px solid #8c3b2e;line-height:1.6;text-indent:0}' +
'h3{font-size:17px;font-weight:normal;margin:1.4em 0 .5em;padding-left:.62em;' +
'border-left:2px solid #d8c7b4;line-height:1.6;text-indent:0}' +
'hr.orn{border:0;height:auto;text-align:center;margin:2.1em 0;background:none}' +
'hr.orn::before{content:"\b7  \b7  \b7";letter-spacing:.9em;color:#9a9184;font-size:15px}' +
'blockquote{margin:1.1em 0;padding:.1em 0 .1em 1em;border-left:2px solid #ddd8cc;color:#4a443a}' +
'blockquote p{text-indent:0}' +
'ul{margin:.4em 0 .8em;padding-left:2.2em}li{margin:0 0 .25em;line-height:1.95}' +
'@page{margin:18mm 16mm}' +
'@media print{body{margin:0;padding:0;max-width:none}}' +
'</style></head><body><h1 class="t">' + esc(d.title) + '</h1>' + html +
'<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>');
w.document.close();
});
A.view('docs', { render: docsView, mount: docTocMount });

var BC = g.BeachCore;
var bs = { q: '', cat: '', editing: null, save: null };
var BK_FAV = 'https://www.google.com/s2/favicons?sz=64&domain_url=';
var favTried = {}, favGood = {};

function peekOn() { return S.flag('beach-peek'); }

function beachSub() {
var st = BC.stats(S.db.links);
if (!st.n) return '一条都还没放';
var s = st.n + ' 条 · ' + st.hosts + ' 个站';
if (st.cats) s += ' · ' + st.cats + ' 类';
if (st.pinned) s += ' · 钉了 ' + st.pinned + ' 条';
return s;
}

function beachView() {
return '<div class="view bview">' +
'<div class="v-head"><div class="v-headmain">' +
'<div class="v-kicker">SURF · 沙滩</div>' +
'<div class="v-title">冲浪沙滩<span class="v-dot">.</span></div>' +
'<p class="v-lede">搁在这里的不是网址，是还没读完的念头。</p>' +

'<div class="v-sub" id="bSub">' + esc(beachSub()) + '</div></div>' +
'<div class="v-acts">' +
'<div class="bmore-wrap"><button class="btn" data-act="be-more">更多</button>' +
'<div class="bmenu" id="bMenu">' +
'<div class="mk">打开方式</div>' +
'<label class="row"><input type="checkbox" id="bmPeek"' + (peekOn() ? ' checked' : '') +
'><span class="lb">点卡片先「看一眼」<span class="sub">关着就直接用浏览器打开</span></span></label>' +
'<div class="mk">图标</div>' +
'<button data-act="be-icons">逐个补全图标</button>' +
'<hr>' +
'<button class="danger" data-act="be-clear">清空全部</button>' +
'</div></div>' +
'<button class="btn primary" data-act="be-add">＋ 放一条</button></div></div>' +
'<div class="searchbar"><span class="ico">⌕</span>' +
'<input id="sQ" placeholder="' + (S.narrow()
? '搜名字、网址、备注…'
: '搜名字、网址、备注…（空格分词，回车去网上找）') + '" data-input="be-q" data-key="be-search" value="' + esc(bs.q) + '">' +
(S.narrow() ? '' : '<span class="kbd">/</span>') + '</div>' +
'<div class="bchips" id="bChips">' + chipsHtml() + '</div>' +
'<div class="bgrid" id="bGrid">' + gridHtml() + '</div>' +
'</div>';
}

function chip(val, label, n) {
var on = bs.cat === val;
return '<button class="bchip' + (on ? ' on' : '') + '" data-bcat="' + esc(val) + '">' +
esc(label) + '<span class="n">' + n + '</span></button>';
}
function chipsHtml() {
var items = S.db.links, st = BC.stats(items), cats = BC.categories(items);
var h = chip('', '全部', st.n);
if (st.pinned) h += chip(BC.PIN, '钉住的', st.pinned);
if (cats.length) h += '<span class="gap"></span>';
cats.forEach(function (c) { h += chip(c.name, c.name, c.n); });
return h;
}

function beachFiltered() { return BC.filterEntries(S.db.links, { q: bs.q, cat: bs.cat }); }

function gridHtml() {
var all = S.db.links, list = beachFiltered();
if (!all.length) {
return beEmpty('沙滩上还空着', '把常去、又不用登录的网址放上来 —— 下次一点就到。', true);
}
if (!list.length) {
return beEmpty(
bs.q ? '没找着' : '这一类还空着',
bs.q ? (S.narrow()
? '换个词试试；写完点键盘上的「搜索」键，可以直接去网上找。'
: '换个词试试；按回车直接去网上找「' + bs.q + '」。')
: '这一格还没放东西 —— 放一条进来，或者点「全部」。',
false
);
}
return list.map(linkCard).join('');
}

function beEmpty(t, d, add) {
return '<div class="bempty"><div class="be-mark">滩</div>' +
'<div class="t">' + esc(t) + '</div>' +
'<div class="d">' + esc(d) + '</div>' +
(add
? '<div class="be-acts"><button class="btn primary" data-act="be-add">＋ 放第一条</button>' +
'<button class="btn ghost" data-act="be-seed">先放几条常见的</button></div>'
: '') +
'</div>';
}

var STARTER = [
{ url: 'https://ctext.org/', name: '中国哲学书电子化计划', cat: '查资料、读', note: '查原典，先秦两汉到清代都有' },
{ url: 'https://zh.wikipedia.org/', name: '维基百科', cat: '查资料', note: '查人名、地名、事件' },
{ url: 'https://www.shidianguji.com/', name: '识典古籍', cat: '查资料、读', note: '带标点和译文' },
{ url: 'https://www.douban.com/', name: '豆瓣', cat: '读', note: '挑书之前先看书评' },
{ url: 'https://www.bilibili.com/', name: '哔哩哔哩', cat: '看', note: '课堂素材、纪录片片段' },
{ url: 'https://www.xiaoyuzhoufm.com/', name: '小宇宙', cat: '听', note: '通勤路上听讲座' },
{ url: 'http://www.nmc.cn/', name: '中央气象台', cat: '工具', note: '看云图和降水预报' }
];

A.act('be-seed', function () {
var added = [];
STARTER.forEach(function (s) {
var n = BC.normalizeUrl(s.url);
if (!n.ok) return;
if (S.db.links.some(function (x) { return x.host === n.host; })) return;
var l = S.addLink(s);
if (l) added.push(l);
});
if (!added.length) { A.toast('这几条都已经在沙滩上了'); return; }
paintBoard();
A.refreshOverviewSoft();
A.toast('放了 ' + added.length + ' 条 —— 名字、分类、备注随手改');
A.offerUndo('放了 ' + added.length + ' 条', function () {
added.forEach(function (x) { S.delLink(x.id); });
paintBoard();
A.refreshOverviewSoft();
A.toast('撤掉了');
});
});

function linkCard(l) {
var tags = BC.catList(l.cat).slice(0, 2)
.map(function (c) { return '<span class="btag">' + esc(c) + '</span>'; }).join('');
return '<article class="bcard" data-id="' + esc(l.id) + '" data-url="' + esc(l.url) + '" tabindex="0"' +
' title="点一下' + (peekOn() ? '在这看一眼' : '用浏览器打开') + '：' + esc(l.url) + '">' +
'<div class="bacts">' +
'<button data-bact="peek" title="在这看一眼">▣</button>' +
'<button data-bact="edit" title="改一改">✎</button>' +
'</div>' +
'<div class="bhd"><div class="bico" data-fav="' + esc(l.host || '') + '">' + esc(BC.glyphOf(l)) + '</div>' +
'<div class="bhd-txt"><div class="bnm">' + esc(l.name) + '</div>' +
'<div class="bho">' + esc(String(l.host || '').replace(/^www\./, '')) + '</div></div></div>' +
'<div class="bnt">' + esc(l.note || '') + '</div>' +
'<div class="bft">' +
(l.pinned ? '<span class="bpin" title="钉在最前">📌</span>' : '') +
tags +
(l.hits ? '<span class="bhits">开过 ' + l.hits + ' 次</span>' : '') +

'<button class="bmore-dot" data-bact="more" title="更多操作：钉住 / 复制网址 / 挪走">⋯</button>' +
'</div></article>';
}

function favUrl(host) { return BK_FAV + encodeURIComponent('https://' + host); }

function upgradeIcons(root) {
if (!root) return;
var boxes = root.querySelectorAll('.bico[data-fav]');
Array.prototype.forEach.call(boxes, function (box) {
var host = box.getAttribute('data-fav');
if (!host) return;
if (favGood[host]) { box.innerHTML = '<img class="favimg" alt="" src="' + esc(favUrl(host)) + '">'; return; }
if (favTried[host]) return;
favTried[host] = 1;
var img = new Image();
img.referrerPolicy = 'no-referrer';
img.alt = '';
img.onload = function () {
favGood[host] = 1;
img.className = 'favimg';
box.innerHTML = '';
box.appendChild(img);
};
img.onerror = function () {};
img.src = favUrl(host);
});
}

function paintBoard() {
var chips = $('#bChips'), grid = $('#bGrid'), sub = $('#bSub');
if (!chips || !grid) return;
chips.innerHTML = chipsHtml();
grid.innerHTML = gridHtml();
if (sub) sub.textContent = beachSub();
upgradeIcons(grid);
}

function openLink(it, force) {
if (!it) return;
var usePeek = force === undefined ? peekOn() : !!force;
if (usePeek) { peekLink(it); return; }
var w = window.open(it.url, '_blank', 'noopener');
if (!w) { A.toast('浏览器把新标签页拦了'); return; }
S.hitLink(it.id);
paintBoard();
}

function peekLink(it) {
if (!it) return;
S.hitLink(it.id);
paintBoard();
A.modal({
title: '在这看一眼',
wide: true,
body: '<div class="bpeek">' +
'<div class="bpb"><span class="t">' + esc(it.name) + '</span>' +
'<span class="u">' + esc(it.url) + '</span>' +
'<button class="btn sm" data-act="be-ext" data-url="' + esc(it.url) + '">用浏览器打开</button></div>' +
'<div class="bpf"><iframe src="' + esc(it.url) + '" referrerpolicy="no-referrer" ' +
'sandbox="allow-scripts allow-same-origin allow-forms"></iframe></div>' +
'<div class="bph">这里只看一眼：不登录、不下载、不付款。很多站不许别人把自己嵌进来 —— 一片空白就点上面那个按钮。</div>' +
'</div>',
foot: '<button class="btn" data-close>回来</button>'
});
}

function openLinkEditor(it) {
bs.editing = it ? it.id : null;
A.modal({
title: it ? '改一改' : '放一条网址',
body:
'<div class="field"><label>网址</label>' +
'<input id="bUrl" type="text" spellcheck="false" autocomplete="off" placeholder="比如 qq.com，或 https://…" value="' + esc(it ? it.url : '') + '">' +
'<div class="btip" id="bTip"></div></div>' +
'<div class="field"><label>名字</label>' +
'<input id="bName" type="text" maxlength="60" autocomplete="off" placeholder="自己认得出的叫法（留空就用域名）" value="' + esc(it ? it.name : '') + '"></div>' +
'<div class="field"><label>分类</label>' +
'<input id="bCat" type="text" maxlength="60" autocomplete="off" placeholder="多个用顿号隔开" value="' + esc(it ? it.cat : '') + '">' +
'<div class="bsugs" id="bSugs"></div></div>' +
'<div class="field"><label>备注</label>' +
'<textarea id="bNote" rows="2" maxlength="400" placeholder="记一句为什么留它">' + esc(it ? it.note : '') + '</textarea></div>',
foot: '<span class="b-left" id="bLeft"></span>' +
'<button class="btn" data-close>取消</button>' +
'<button class="btn primary" data-act="be-save">' + (it ? '存下来' : '放上去') + '</button>',
focus: it ? '#bName' : '#bUrl',
onMount: bindEditor
});
}

function bindEditor(mask) {
var url = mask.querySelector('#bUrl'), tip = mask.querySelector('#bTip');
var name = mask.querySelector('#bName'), cat = mask.querySelector('#bCat'), note = mask.querySelector('#bNote');
var sugs = mask.querySelector('#bSugs');

function check() {
var raw = url.value.trim();
if (!raw) { tip.className = 'btip'; tip.textContent = ''; return { ok: false, kind: '' }; }
var n = BC.normalizeUrl(raw);
if (n.ok) {
tip.className = 'btip ok';
tip.textContent = '会存成：' + n.url;
} else if (n.kind === 'search') {
tip.className = 'btip';
tip.textContent = S.narrow()
? '这看着不像网址 —— 存下来会当搜索词用。'
: '这看着不像网址 —— 按回车去网上找它。';
} else {
tip.className = 'btip bad';
tip.textContent = n.error || '这个网址不能用';
}
return n;
}

function renderSugs() {
var seen = {}, list = [];
BC.categories(S.db.links).forEach(function (c) { if (!seen[c.name]) { seen[c.name] = 1; list.push(c.name); } });
BC.CAT_SUGGEST.forEach(function (c) { if (!seen[c]) { seen[c] = 1; list.push(c); } });
var cur = BC.catList(cat.value);
sugs.innerHTML = list.slice(0, 8).map(function (c) {
return '<button class="bsug' + (cur.indexOf(c) >= 0 ? ' on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
}).join('');
}

function save() {
var n = check();
if (!n.ok) {
if (n.kind === 'search') {
var q = url.value.trim();
if (q) window.open(BC.searchUrl(q, 'bing'), '_blank', 'noopener');
mask.close();
return;
}
A.toast(n.error || '网址不对');
url.focus();
return;
}
var selfId = bs.editing;
var dup = S.db.links.filter(function (x) { return x.url === n.url && x.id !== selfId; })[0];
if (dup) { A.toast('这条已经在沙滩上了：' + dup.name); return; }
var payload = { url: n.url, name: name.value, cat: cat.value, note: note.value };
var saved = selfId ? S.updLink(selfId, payload) : S.addLink(payload);
if (!saved) { A.toast('没存上'); return; }
var wasEdit = !!selfId;
mask.close();
bs.editing = null;
bs.save = null;
paintBoard();
A.refreshOverviewSoft();
A.toast(wasEdit ? '改好了' : '放上去了');
}

bs.save = save;

var titleTimer = null, autoName = '';
function autoTitle(n, immediate) {
clearTimeout(titleTimer);
if (bs.editing) return;

if (name.value && name.value !== autoName) return;

if (!n || !n.ok) return;
titleTimer = setTimeout(function () {

if (g.GZT_CLOUD && g.GZT_CLOUD.on) return;
if (!g.fetch || !S.pageKey) return;
var u = 'api/title?url=' + encodeURIComponent(n.url) + '&k=' + encodeURIComponent(S.pageKey());
try {
g.fetch(u, { cache: 'no-store' }).then(function (r) {
return r && r.ok ? r.json() : null;
}).then(function (d) {
if (!d || !d.ok || !d.title) return;
if (name.value && name.value !== autoName) return;

autoName = d.title;
name.value = d.title;
tip.className = 'btip ok';
tip.textContent = '名字是按网页标题自动填的，想改随便改';
}).catch(function () { });
} catch (e) { }
}, immediate ? 0 : 700);
}

url.addEventListener('input', function () {
var n = check();
autoTitle(n, false);
});

url.addEventListener('paste', function () {
setTimeout(function () { autoTitle(check(), true); }, 30);
});
cat.addEventListener('input', renderSugs);
sugs.addEventListener('click', function (e) {
var b = e.target.closest('button[data-cat]');
if (!b) return;
var v = b.getAttribute('data-cat');
var parts = BC.catList(cat.value);
if (parts.indexOf(v) >= 0) parts = parts.filter(function (x) { return x !== v; });
else parts.push(v);
cat.value = parts.join('、');
renderSugs();
});
mask.addEventListener('keydown', function (e) {
if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); save(); return; }
if (e.key === 'Enter' && e.target === url) { e.preventDefault(); save(); }
});
renderSugs();
check();
}

A.act('be-save', function () { if (bs.save) bs.save(); });

function closeBMenu() { var m = $('#bMenu'); if (m) m.classList.remove('on'); }
A.act('be-more', function () {
var m = $('#bMenu');
if (m) m.classList.toggle('on');
});
A.act('be-add', function () { closeBMenu(); openLinkEditor(null); });
A.act('be-ext', function (el) { window.open(el.dataset.url, '_blank', 'noopener'); });

A.act('be-icons', function () {
closeBMenu();
var hosts = {};
S.db.links.forEach(function (l) { if (l.host && !favGood[l.host]) hosts[l.host] = 1; });
var list = Object.keys(hosts);
var n = list.length;
if (!n) { A.toast('每条都有图标了'); return; }
list.forEach(function (h) { delete favTried[h]; });
A.toast('开始补 ' + n + ' 个图标，慢一点…');
upgradeIcons($('#bGrid'));

setTimeout(function () {
var ok = 0;
list.forEach(function (h) { if (favGood[h]) ok++; });
A.toast(ok ? '补上了 ' + ok + ' / ' + n + ' 个图标' : '这轮没取到图标，稍后再试');
}, Math.min(6000, 400 + n * 320));
});

A.act('be-clear', function () {
closeBMenu();
var n = S.db.links.length;
if (!n) { A.toast('沙滩本来就空着'); return; }
A.modal({
title: '把整片沙滩清空？',
body: '<p class="hint">' + n + ' 条收藏会全部挪走。挪走之后还有一次「撤销」，' +
'但过了那几秒就找不回来了 —— 想留的先把它们复制出去。</p>',
foot: '<button class="btn" data-close>算了</button>' +
'<button class="btn danger" data-act="be-clear-ok">全部挪走（' + n + ' 条）</button>'
});
});
A.act('be-clear-ok', function () {
A.closeTopModal();
var removed = S.clearLinks();
paintBoard();
A.refreshOverviewSoft();
A.offerUndo('已清空 ' + removed.length + ' 条', function () {
removed.forEach(function (x) { S.putLink(x); });
paintBoard();
A.refreshOverviewSoft();
A.toast('放回去 ' + removed.length + ' 条');
});
});

var ctxEl = null, ctxItem = null;
function closeCtx() {
if (ctxEl && ctxEl.parentNode) ctxEl.parentNode.removeChild(ctxEl);
ctxEl = null; ctxItem = null;
}
function openCtx(x, y, it) {
closeCtx();
ctxItem = it;
ctxEl = document.createElement('div');
ctxEl.className = 'bctx';
ctxEl.innerHTML =
'<button data-bc="open">用浏览器打开</button>' +
'<button data-bc="peek">在这看一眼</button><hr>' +
'<button data-bc="copy">复制网址</button>' +
'<button data-bc="edit">改一改</button>' +
'<button data-bc="pin">' + (it.pinned ? '取消钉住' : '钉在最前') + '</button><hr>' +
'<button class="danger" data-bc="del">挪走</button>';
document.body.appendChild(ctxEl);
var w = ctxEl.offsetWidth, h = ctxEl.offsetHeight;
ctxEl.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + 'px';
ctxEl.style.top = Math.max(8, Math.min(y, window.innerHeight - h - 8)) + 'px';
}

function copyText(s) {
function fallback() {
try {
var ta = document.createElement('textarea');
ta.value = String(s || '');
ta.style.position = 'fixed';
ta.style.opacity = '0';
document.body.appendChild(ta);
ta.select();
var ok = document.execCommand('copy');
document.body.removeChild(ta);
A.toast(ok ? '网址复制好了' : '复制不了，请手动选一下');
} catch (err) { A.toast('复制不了，请手动选一下'); }
}
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(String(s || '')).then(function () { A.toast('网址复制好了'); }, fallback);
} else fallback();
}

function removeLink(it) {
if (!it) return;
S.delLink(it.id);
paintBoard();
A.refreshOverviewSoft();
A.offerUndo('已挪走「' + it.name + '」', function () {
S.putLink(it);
paintBoard();
A.refreshOverviewSoft();
A.toast('又放回去了');
});
}

document.addEventListener('click', function (e) {
var bc = e.target.closest('[data-bc]');
if (bc) {
e.preventDefault();
var c = bc.getAttribute('data-bc');
var it = ctxItem;
closeCtx();
if (!it) return;
if (c === 'open') openLink(it, false);
else if (c === 'peek') peekLink(it);
else if (c === 'copy') copyText(it.url);
else if (c === 'edit') openLinkEditor(it);
else if (c === 'pin') {
S.pinLink(it.id, !it.pinned);
paintBoard();
A.toast(it.pinned ? '不钉了' : '钉在最前了');
} else if (c === 'del') removeLink(it);
return;
}

var chipEl = e.target.closest('.bview [data-bcat]');
if (chipEl) {
bs.cat = chipEl.getAttribute('data-bcat') || '';
paintBoard();
var pane = chipEl.closest('.pane');
if (pane) pane.scrollTop = 0;
return;
}

var card = e.target.closest('.bcard');
if (card) {
var it2 = S.linkById(card.getAttribute('data-id'));
if (!it2) return;
var ba = e.target.closest('[data-bact]');
if (ba) {
e.preventDefault();
var kind = ba.getAttribute('data-bact');
if (kind === 'edit') { openLinkEditor(it2); return; }
if (kind === 'more') {
var br = ba.getBoundingClientRect();
openCtx(br.left, br.bottom + 6, it2);

return;
}
peekLink(it2);
return;
}
openLink(it2);
return;
}

if (!e.target.closest('.bmore-wrap')) closeBMenu();
if (ctxEl && !e.target.closest('.bctx')) closeCtx();
});

document.addEventListener('keydown', function (e) {
if (ctxEl && e.key === 'Escape') { closeCtx(); return; }
if (ctxEl) closeCtx();
});
window.addEventListener('resize', closeCtx);
window.addEventListener('blur', closeCtx);

document.addEventListener('contextmenu', function (e) {
var card = e.target.closest('.bcard');
if (!card) { if (ctxEl) closeCtx(); return; }
e.preventDefault();
var it = S.linkById(card.getAttribute('data-id'));
if (it) openCtx(e.clientX, e.clientY, it);
});

document.addEventListener('keydown', function (e) {
if (e.key !== 'Enter' && e.key !== ' ') return;
var card = e.target.closest && e.target.closest('.bcard');
if (!card || (e.target !== card && e.target.closest('[data-bact]'))) return;
e.preventDefault();
var it = S.linkById(card.getAttribute('data-id'));
if (it) openLink(it);
});

document.addEventListener('keydown', function (e) {
if (A.activeId !== 'beach') return;
if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
if (document.querySelector('#modalRoot .mask')) return;
if (e.ctrlKey || e.metaKey || e.altKey) return;
if (e.key === '/') {
e.preventDefault();
var q = $('#sQ');
if (q) { q.focus(); q.select(); }
} else if (e.key === 'n') {
e.preventDefault();
openLinkEditor(null);
}
});

document.addEventListener('change', function (e) {
if (e.target && e.target.id === 'bmPeek') {
S.flag('beach-peek', e.target.checked);
A.toast(e.target.checked ? '以后点卡片：在这看一眼' : '以后点卡片：用浏览器打开');
paintBoard();
}
});

A.act('input:be-q', function (el) {
bs.q = el.value.trim();
var grid = $('#bGrid');
if (!grid) return;
grid.innerHTML = gridHtml();
upgradeIcons(grid);
});

A.act('key:be-search', function (el, e) {
if (e.key === 'Escape') { el.value = ''; bs.q = ''; paintBoard(); return false; }
if (e.key !== 'Enter' || e.isComposing) return false;
var q = el.value.trim();
if (!q) return false;
var n = BC.normalizeUrl(q);
if (n.ok && BC.looksLikeHost(q)) { window.open(n.url, '_blank', 'noopener'); return true; }
if (beachFiltered().length) return true;
window.open(BC.searchUrl(q, 'bing'), '_blank', 'noopener');
return true;
});

A.view('beach', { render: beachView, mount: function (pane) { upgradeIcons(pane); } });

A.vHead = vHead;

A.landReset = function (mod, id) {
var db = S.db || {};
id = id == null ? '' : String(id);

function run(name, el) {
try {
if (A.acts && typeof A.acts[name] === 'function') { A.acts[name](el || {}); return true; }
} catch (e) { }
return false;
}

function escOn(inputId) {
var el = document.getElementById(inputId);
var fake = false;
if (!el) {
el = document.createElement('input');
el.id = inputId;
document.body.appendChild(el);
fake = true;
}
try {
var ev;
try { ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }); }
catch (e1) {
ev = document.createEvent('Event');
ev.initEvent('keydown', true, true);
ev.key = 'Escape';
}
el.dispatchEvent(ev);
} catch (e2) { }
if (fake && el.parentNode) el.parentNode.removeChild(el);
}

if (mod === 'ledger') {

var row = (db.ledger || []).filter(function (x) { return x.id === id; })[0];
if (row && row.date) ledMonth = String(row.date).slice(0, 7);
return;
}

if (mod === 'diary') {

if (/^\d{4}-\d{2}-\d{2}$/.test(id)) {
diaryDate = id;
} else {
var ks = Object.keys(db.diary || {}).sort();
diaryDate = ks.length ? ks[ks.length - 1] : S.today();
}
return;
}

if (mod === 'beach') {

bs.q = '';
var link = (db.links || []).filter(function (x) { return x.id === id; })[0];
var cs = (link && BC && BC.catList) ? BC.catList(link.cat) : [];
bs.cat = (cs && cs.length) ? cs[0] : '';
return;
}

if (mod === 'words') {

run('vw-tab', { dataset: { k: 'list' } });
run('input:vw-q', { value: '' });
run('change:vw-lv', { value: 'all' });
return;
}

if (mod === 'notes') {

if (typeof A.notesExitReading === 'function') {
try { A.notesExitReading(); } catch (e) { }
} else {
run('n-read-close');

}

run('n-tab', { dataset: { tab: 'notes' } });
escOn('nQ');
run('n-more');

return;
}

if (mod === 'books') {
bk.status = 'all';
bk.year = 'all';
bk.cat = 'all';

bk.q = '';
return;
}

if (mod === 'chronicle') {
tlYear = '';

tlm.q = '';

return;
}

if (mod === 'docs') {
docId = id || docId;
var doc = (db.docs || []).filter(function (x) { return x.id === id; })[0];
if (doc && doc.archived) docsShowArch = true;

return;
}

if (mod === 'site') {
run('st-guest-off');

run('st-tab', { dataset: { k: 'posts' } });
run('st-plat', { dataset: { p: 'all' } });

return;
}
};

})(window);
