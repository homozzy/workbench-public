(function (g) {
'use strict';

var S = g.S, A = g.App, T = g.Tint, P = g.Pinyin;
var esc = A.esc, $ = A.$, $$ = A.$$, pad = A.pad;

var ui = { tab: 'notes', q: '', qTyping: '', limit: '', open: {}, kwQ: '', bookQ: '', sugSeed: 0, sugSkip: {}, reading: '' };
var lastDeleted = null;

var COLOR = '#a8442a', GLYPH = '读';
var CASE_LABEL = '案';

function notes() {
var list = S.liveNotes().slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
var q = ui.q.trim().toLowerCase();
if (!q) return list;
return list.filter(function (n) {
var hay = (n.content + ' ' + (n.source || '') + ' ' + (n.book || '') + ' ' +
n.caseNotes.map(function (c) { return c.content; }).join(' ')).toLowerCase();
return hay.indexOf(q) >= 0;
});
}

function bookOf(n) {
if (n.book) return n.book;
var m = String((n.source || '') + ' ' + n.content).match(/《([^》]{1,30})》/);
return m ? m[1] : '';
}
function bookMap() {
var map = {};
S.liveNotes().forEach(function (n) {
var b = bookOf(n);
if (!b) return;
if (!map[b]) map[b] = { title: b, count: 0, last: 0, cases: 0 };
map[b].count++;
map[b].cases += n.caseNotes.length;
map[b].last = Math.max(map[b].last, n.createdAt);
});
return map;
}
function kwHit(k) { return S.hitNotes(k); }

function render() {

if (ui.reading) {
var one = S.liveNotes().filter(function (x) { return x.id === ui.reading; })[0];
if (one) return readingView(one);
ui.reading = '';
}
var st = S.stats();
var kw = S.db.keywords.map(function (k) { return { k: k, n: kwHit(k).length }; })
.sort(function (a, b) { return b.n - a.n; });
var bm = bookMap();
var booksN = Object.keys(bm).length;
var tab = ui.tab;

return '<div class="view">' +
A.vHead('NOTES · 摘抄', '读书笔记',
'读过的句子，和后来写下的想法，都放在这里。',
'<button class="btn" data-act="n-recall">翻一条旧的</button>' +
'<button class="btn" data-act="n-hl">导入划线</button>') +
'<div class="vtabs">' +
'  <button class="vtab' + (tab === 'notes' ? ' on' : '') + '" data-act="n-tab" data-tab="notes">笔记<span class="c">' + st.notes + '</span></button>' +

'  <button class="vtab' + (tab === 'kw' ? ' on' : '') + '" data-act="n-tab" data-tab="kw">关键词' +
(st.keywords ? '<span class="c">' + st.keywords + '</span>' : '') + '</button>' +
'  <button class="vtab' + (tab === 'books' ? ' on' : '') + '" data-act="n-tab" data-tab="books">书目<span class="c">' + booksN + '</span></button>' +
'</div>' +
(tab === 'notes' ? panelNotes() : tab === 'kw' ? panelKw(kw) : panelBooks(bm)) +
'</div>';
}

function panelNotes() {
var all = notes();
var expanded = ui.limit === 'all' || !!ui.q;
var LIMIT = 5;
var list = expanded ? all : all.slice(0, LIMIT);
var rest = all.length - list.length;
return '<div class="searchbar"><span class="ico">⌕</span>' +
'<input id="nQ" placeholder="' + (S.narrow()
? '搜正文、案评或书名…'
: '搜正文、案评或书名…（Enter 搜索，Esc 清空）') + '" value="' + esc(ui.q) + '" data-input="n-q" data-enter="n-q-go">' +
(S.narrow() ? '' : '<span class="kbd">Enter</span>') + '</div>' +
(ui.composer ? composerHtml() : '') +
(ui.composer ? '' : '<button class="composer-open' + (readDraft() ? ' has-draft' : '') +
'" data-act="n-compose"' + (readDraft() ? ' title="上次没写完，点开继续"' : '') + '>' +
(S.narrow() ? '＋' : '＋ 记一条') + '</button>') +
'<div class="list-head"><span>' +
(ui.q ? '含「' + esc(ui.q) + '」· ' : '') + '按时间倒序' + '</span>' +
'<span class="acts">' +
(rest > 0 ? '<button class="link-btn" data-act="n-more">查看其余 ' + rest + ' 条</button>' : '') +
(!ui.q && ui.limit === 'all' && all.length > LIMIT ? '<button class="link-btn" data-act="n-less">只看最近 ' + LIMIT + ' 条</button>' : '') +
'</span></div>' +
(list.length ? '<div class="notes">' + list.map(noteHtml).join('') + '</div>'
: '<div class="empty"><div class="mark">册</div><div class="t">' +
(ui.q ? '没有匹配的笔记' : '还没有笔记') + '</div>' +
'<div class="d">' + (ui.q ? '换个词试试，或清空搜索' : '点上面的「记一条」，写下第一段读书感想') + '</div></div>');
}

function fitNotes(pane) {
Array.prototype.forEach.call(pane.querySelectorAll('.note'), function (el) {
var body = el.querySelector('.note-body');
var more = el.querySelector('.note-more');
if (!body || !more) return;
if (body.classList.contains('clamp')) {
if (body.scrollHeight - body.clientHeight > 2) more.classList.remove('hidden');
else body.classList.remove('clamp');
} else if (body.scrollHeight - body.clientHeight > 2) {
more.classList.remove('hidden');
}
});
}

var DRAFT_KEY = 'gzt.draft.note';
var NOTE_MAX = 20000;

var lastSrc = '';

var draftTimer = null;
function readDraft() {
try {
var d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
return d && (d.text || d.src) ? d : null;
} catch (e) { return null; }
}
function writeDraft(text, src) {
try {
if (!text && !src) localStorage.removeItem(DRAFT_KEY);
else localStorage.setItem(DRAFT_KEY, JSON.stringify({ text: text, src: src, at: Date.now() }));
} catch (e) { }
}

function composerHtml() {
var d = readDraft();
return '<div class="composer">' +
(d ? '<div class="composer-revive">上次没记完，已经原样找回。' +
'<button class="link-btn" data-act="n-draft-drop">丢掉它</button></div>' : '') +
'<textarea id="nText" maxlength="' + NOTE_MAX + '" placeholder="写下这条读书笔记……（Ctrl + Enter 存下）" rows="3">' +
esc(d ? d.text : '') + '</textarea>' +
'<div class="composer-bar">' +
'<input class="composer-src" id="nSrc" type="text" placeholder="出处（书名，可留空）" maxlength="120" value="' +
esc(d ? d.src : lastSrc) + '">' +
'<span class="composer-count" id="nCount"></span>' +
'<button class="btn ghost sm" data-act="n-compose-cancel">收起</button>' +
'<button class="btn primary sm" data-act="n-save">记下</button>' +
'</div></div>';
}

function bindComposer(pane) {
var t = pane.querySelector('#nText'), s = pane.querySelector('#nSrc'), c = pane.querySelector('#nCount');
if (!t) return;
function count() {
if (!c) return;
var n = t.value.length;
if (n < NOTE_MAX * 0.9) { c.textContent = ''; c.classList.remove('near'); return; }
c.textContent = n + ' / ' + NOTE_MAX;
c.classList.toggle('near', n >= NOTE_MAX);
}
function flush() {

if (!t.isConnected) return;
writeDraft(t.value, s ? s.value : '');
count();
}
t.addEventListener('input', function () { count(); clearTimeout(draftTimer); draftTimer = setTimeout(flush, 300); });
if (s) s.addEventListener('input', function () { clearTimeout(draftTimer); draftTimer = setTimeout(flush, 300); });
count();
if (s && !t.value && s.value) t.focus();
}

function noteHtml(n) {
var open = ui.open[n.id];
var cases = n.caseNotes || [];
return '<div class="note" data-id="' + n.id + '">' +
'<div class="note-main">' +
'<div class="note-time">' + A.fmtTime(n.createdAt) +
(n.from === 'weibo' ? '<span class="srcmark">微博</span>' : '') +
(cases.length ? '<span style="color:var(--accent)">· 案评 ' + cases.length + '</span>' : '') +
'</div>' +

'<div class="note-quote">' +
'<div class="note-body readable' + (open ? '' : ' clamp') + '" data-act="n-read" data-id="' + n.id + '" ' +
'title="点开，把这一条当一页读">' + esc(n.content) + '</div>' +

'<span class="note-more' + (open ? '' : ' hidden') + '" data-act="n-fold" data-id="' + n.id + '">' +
(open ? '收起' : '… 全文') + '</span>' +
'</div>' +
(cases.length ? '<div class="cases">' + cases.map(function (c) {
return '<div class="case" data-cid="' + c.id + '">' +
'<span class="case-label">' + CASE_LABEL + '：</span>' +
'<span class="case-text">' + esc(c.content) + '</span>' +
'<span class="case-time">' + A.fmtTime(c.createdAt) + '</span>' +
'<button class="case-del" data-act="n-editcase" data-id="' + n.id + '" data-cid="' + c.id + '">改</button>' +
'<button class="case-del" data-act="n-delcase" data-id="' + n.id + '" data-cid="' + c.id + '">删</button>' +
'</div>';
}).join('') + '</div>' : '') +

'<div class="note-src">' +
(n.source
? '<span class="src-val">' + esc(n.source) + '</span>'
: '<button class="src-empty" data-act="n-edit" data-id="' + n.id + '">＋ 补出处</button>') +

(bookOf(n) ? '<button class="to-book" data-act="n-openbook" data-b="' + esc(bookOf(n)) + '">' +
((n.source && n.source.indexOf('《' + bookOf(n) + '》') >= 0)
? '书目 →' : '《' + esc(bookOf(n)) + '》 →') + '</button>' : '') +
(n.url ? '<a class="ext" href="' + esc(n.url) + '" target="_blank" rel="noopener">看原文 ↗</a>' : '') +
'</div>' +
'<div class="note-ops">' +
'<button data-act="n-case" data-id="' + n.id + '">' + (cases.length ? '再写一条案评' : '写案评') + '</button>' +
'<button data-act="n-edit" data-id="' + n.id + '">编辑</button>' +
'<button data-act="n-card" data-id="' + n.id + '">导出图</button>' +
'<span class="spacer"></span>' +
'<button data-act="n-del" data-id="' + n.id + '">删除</button>' +
'</div>' +
'</div>';
}

function fullDate(ts) {
var d = new Date(ts);
return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 ' +
pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function readingView(n) {
var cases = n.caseNotes || [];
var book = bookOf(n);
var list = notes();
var at = -1;
for (var i = 0; i < list.length; i++) { if (list[i].id === n.id) { at = i; break; } }
var prev = at > 0 ? list[at - 1] : null;
var next = at >= 0 && at < list.length - 1 ? list[at + 1] : null;

return '<div class="view reading">' +
'<div class="rd-bar">' +
'  <button class="rd-back" data-act="n-read-close">← 回到列表</button>' +
'  <span class="rd-pos">' + (at >= 0 ? '第 ' + (at + 1) + ' / ' + list.length + ' 条' : '') + '</span>' +
'</div>' +
'<div class="rd-cols">' +
'  <article class="rd-main">' +
'    <div class="rd-time">' + fullDate(n.createdAt) +
(n.from === 'weibo' ? '<span class="srcmark">微博</span>' : '') + '</div>' +
'    <div class="rd-body">' + esc(n.content) + '</div>' +
(cases.length
? '<div class="rd-cases"><div class="rd-case-h">案评<b>' + cases.length + '</b></div>' +
cases.map(function (c) {
return '<div class="rd-case">' +
'<span class="rd-case-label">' + CASE_LABEL + '：</span>' +
'<div class="rd-case-text">' + esc(c.content) + '</div>' +
'<div class="rd-case-time">' + fullDate(c.createdAt) +
'<button class="rd-case-op" data-act="n-editcase" data-id="' + n.id + '" data-cid="' + c.id + '">改</button>' +
'<button class="rd-case-op" data-act="n-delcase" data-id="' + n.id + '" data-cid="' + c.id + '">删</button>' +
'</div></div>';
}).join('') + '</div>'
: '') +
'    <div class="rd-ops">' +
'      <button class="btn" data-act="n-case" data-id="' + n.id + '">' + (cases.length ? '再写一条案评' : '写一条案评') + '</button>' +
'      <button class="btn ghost" data-act="n-edit" data-id="' + n.id + '">编辑</button>' +
'      <button class="btn ghost" data-act="n-card" data-id="' + n.id + '">导出图</button>' +
'      <button class="btn ghost rd-del" data-act="n-del" data-id="' + n.id + '">删除</button>' +
'    </div>' +
'    <div class="rd-nav">' +
'      <button class="rd-turn" data-act="n-read-prev" data-id="' + (prev ? prev.id : '') + '"' + (prev ? '' : ' disabled') + '>← 上一条</button>' +
'      <button class="rd-turn" data-act="n-read-next" data-id="' + (next ? next.id : '') + '"' + (next ? '' : ' disabled') + '>下一条 →</button>' +
'    </div>' +
'  </article>' +

'  <div class="rd-side">' +
'    <div class="rd-side-h">出处</div>' +
'    <div class="rd-src' + (n.source ? '' : ' empty-v') + '">' + (n.source ? esc(n.source) : '（没写出处）') + '</div>' +
(book ? '<button class="to-book" data-act="n-openbook" data-b="' + esc(book) + '">《' + esc(book) + '》书目 →</button>' : '') +
(n.url ? '<a class="ext" href="' + esc(n.url) + '" target="_blank" rel="noopener">看原文 ↗</a>' : '') +
'    <div class="rd-side-h mt">这一条</div>' +
'    <div class="rd-kv"><span>摘于</span><b>' + S.ymd(n.createdAt) + '</b></div>' +
'    <div class="rd-kv"><span>案评</span><b>' + cases.length + ' 条</b></div>' +
'  </div>' +
'</div></div>';
}

function panelKw(kw) {
var sug = suggest();
var q = ui.kwQ.trim().toLowerCase();
var list = kw.filter(function (x) {
if (!q) return true;
if (x.k.word.toLowerCase().indexOf(q) >= 0) return true;
return (x.k.aliases || []).some(function (a) { return a.toLowerCase().indexOf(q) >= 0; });
});
list = list.slice().sort(function (a, b) {
var r = P.cmp(a.k.word, b.k.word);
if (r) return r;
return b.n - a.n;
});
var groups = [], cur = null;
list.forEach(function (x) {
var L = P.initial(x.k.word);
if (!cur || cur.letter !== L) { cur = { letter: L, items: [] }; groups.push(cur); }
cur.items.push(x);
});
return '<div class="searchbar"><span class="ico">⌕</span>' +
'<input id="kQ" placeholder="搜关键词或别名…" value="' + esc(ui.kwQ) + '" data-input="k-q">' + (S.narrow() ? '' : '<span class="kbd">Esc</span>') + '</div>' +
(sug.length ? '<div class="sug"><div class="sug-head"><span class="t">推荐词</span>' +
'<span>从正文里数出 ' + (suggest.total || sug.length) + ' 个候选，这是出现最多的几个</span>' +
'<button class="link-btn" style="margin-left:auto" data-act="n-sug">换一批</button></div>' +
'<div class="sug-chips">' + sug.map(function (x) {
return '<button data-act="n-addkw" data-w="' + esc(x.w) + '" title="正文里出现 ' + x.n + ' 次">' +
esc(x.w) + '<i>' + x.n + '</i></button>';
}).join('') + '</div></div>' : '') +
'<div class="list-head"><span>' + kw.length + ' 个关键词' +
(q ? '　含「' + esc(ui.kwQ.trim()) + '」' : '') + '</span>' +
'<span class="acts"><button class="link-btn" data-act="n-addkw-open">＋ 添加关键词</button></span></div>' +
(groups.length ? '<div class="kw-groups">' + groups.map(function (grp) {
return '<div class="kw-group"><div class="kw-letter">' + esc(grp.letter) + '</div>' +
'<div class="kw-wrap">' + grp.items.map(function (x) {
return '<div class="kw' + (x.n ? '' : ' zero') + '" data-act="n-kw" data-id="' + x.k.id + '" ' +
'title="' + esc(x.k.word) + '">' +
'<span class="w">' + esc(x.k.word) + '</span>' +
(x.k.aliases.length ? '<span class="al">' + (x.k.aliases.length + 1) + ' 名</span>' : '') +
'<button class="kw-merge" data-act="n-merge" data-id="' + x.k.id + '" ' +
'title="并到另一个词名下（同一样东西的两种叫法）">并入</button>' +
'<span class="c">' + x.n + '</span></div>';
}).join('') + '</div></div>';
}).join('') + '</div>'
: '<div class="empty"><div class="mark">键</div><div class="t">' +
(q ? '没有匹配的关键词' : '还没有关键词') + '</div>' +
'<div class="d">' + (q ? '换个词试试' : '记下一个你关心的词 —— 点开它就能看见所有提到它的笔记') + '</div></div>');
}

var STOP = ('的了和是在我为与也就都而这那有不之其所以及等我们你们他们一个这个那个自己可以没有因为如果就是还是但是已经这样那么什么怎么时候什么' +
'其实不是这些那些还有于是然后虽然但是然而因此所以如果只是不过并且或者尽管无论即使假如虽然如此如此这般一样一直一定一些一点一二三四五六七八九十').split('');
function suggest() {
var exist = {};
S.db.keywords.forEach(function (k) {
S.wordsOf(k).forEach(function (w) { for (var i = 0; i < w.length; i++) exist[w.slice(i, i + 2)] = 1; });
});
var freq = {};
S.liveNotes().slice(0, 120).forEach(function (n) {
var text = (n.content + ' ' + n.source).replace(/[^\u4e00-\u9fa5]/g, ' ');
text.split(/\s+/).forEach(function (seg) {
for (var len = 2; len <= 4; len++) {
for (var i = 0; i + len <= seg.length; i++) {
var w = seg.slice(i, i + len);
if (STOP.indexOf(w[0]) >= 0 || STOP.indexOf(w[w.length - 1]) >= 0) continue;
freq[w] = (freq[w] || 0) + 1;
}
}
});
});
var cands = Object.keys(freq).filter(function (w) {
if (freq[w] < 3) return false;
if (exist[w]) return false;
if (S.findOwner(w)) return false;
if (ui.sugSkip[w]) return false;

for (var l = w.length + 1; l <= 4; l++) {
for (var i = 0; i + l <= w.length + 3; i++) {
}
}
return true;
}).sort(function (a, b) { return freq[b] - freq[a]; });

var out = [];
cands.forEach(function (w) {
if (out.length >= 14) return;
if (out.some(function (o) { return o.indexOf(w) >= 0 || w.indexOf(o) >= 0; })) return;
out.push(w);
});
var pick = out.slice(0, 9);

suggest.total = cands.length;
return pick.map(function (w) { return { w: w, n: freq[w] }; });
}

function panelBooks(bm) {
var list = Object.keys(bm).map(function (k) { return bm[k]; })
.sort(function (a, b) { return b.count - a.count || b.last - a.last; });
var q = ui.bookQ.trim().toLowerCase();
if (q) list = list.filter(function (b) { return b.title.toLowerCase().indexOf(q) >= 0; });
return '<div class="searchbar"><span class="ico">⌕</span>' +
'<input id="bQ" placeholder="搜书名…" value="' + esc(ui.bookQ) + '" data-input="b-q">' + (S.narrow() ? '' : '<span class="kbd">Esc</span>') + '</div>' +
'<div class="list-head"><span>《书名》自动认出来的书 · 共 ' + list.length + ' 本</span>' +
'<span class="acts"><button class="link-btn" data-act="open" data-id="books">看藏书阁 →</button></span></div>' +
(list.length ? '<div class="bookrows">' + list.map(function (b) {
var bk = S.bookByTitle(b.title);
var sp = A.spine(b.title);
return '<div class="bookrow" data-act="n-openbook" data-b="' + esc(b.title) + '">' +
'<div class="bspine" style="' + sp.style + '"><span>' + esc(sp.chars) + '</span></div>' +
'<div class="bmeta"><div class="t">《' + esc(b.title) + '》</div>' +
'<div class="m">最近一次 ' + A.dayLabel(S.ymd(b.last)) + ' · ' + b.count + ' 条' + (b.cases ? ' · ' + b.cases + ' 案评' : '') + '</div></div>' +
'<div class="st">' + (bk ? (bk.status === 'done' ? '已读完' : '在读') : '未入藏书阁') + '</div>' +
'<div class="c">' + b.count + '</div></div>';
}).join('') + '</div>'
: '<div class="empty"><div class="mark">书</div><div class="t">还没有认出书名</div>' +
'<div class="d">在笔记正文或出处里用上《书名》，这里就会把它们排起来</div></div>');
}

function openLink(kind, key) {
var id = 'link:' + kind + ':' + encodeURIComponent(key);
if (A.tabs.has(id)) { A.showTab(id); return; }
A.view(id, { render: function () { return linkHtml(kind, key); } });
A.openRaw(id, (kind === 'kw' ? key : '《' + key + '》'), COLOR, kind === 'kw' ? '词' : '书');
}
function linkHtml(kind, key) {
var list, title, alias = '';
if (kind === 'kw') {
var k = S.db.keywords.filter(function (x) { return x.word === key || x.aliases.indexOf(key) >= 0; })[0];
var kk = k || { word: key, aliases: [] };
list = S.hitNotes(kk);
title = kk.word;
alias = kk.aliases.length ? '别名：' + kk.aliases.join('、') : '';
} else {
list = S.liveNotes().filter(function (n) { return bookOf(n) === key; })
.sort(function (a, b) { return b.createdAt - a.createdAt; });
title = '《' + key + '》';
}
list = list.slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
var q = (ui.linkQ && ui.linkQ[id2key(kind, key)]) || '';
var shown = q ? list.filter(function (n) { return (n.content + n.source).toLowerCase().indexOf(q.toLowerCase()) >= 0; }) : list;
return '<div class="view">' +
'<div class="link-head"><span class="lbl">关联到</span><span class="word">' + esc(title) + '</span>' +
(alias ? '<span class="alias">' + esc(alias) + '</span>' : '') +
'<span class="count">' + list.length + ' 条笔记 · ' + list.reduce(function (s, n) { return s + n.caseNotes.length; }, 0) + ' 条案评</span></div>' +
'<div class="searchbar"><span class="ico">⌕</span><input placeholder="在本页结果里找…" value="' + esc(q) + '" data-input="link-q" data-link="' + kind + '" data-kw="' + esc(key) + '"><span class="kbd">Esc</span></div>' +
(shown.length ? '<div class="notes">' + shown.map(noteHtml).join('') + '</div>'
: '<div class="empty"><div class="mark">空</div><div class="t">没有笔记提到它</div>' +
'<div class="d">在正文或案评里用上「' + esc(key) + '」，这里就会列出来</div></div>') +
'</div>';
}
var ui2 = {};
function id2key(kind, key) { return kind + ':' + key; }

function askCase(noteId) {
var n = S.noteById(noteId);
if (!n) return;
A.modal({
title: '添一条案评',
wide: true,
body: '<div class="case" style="margin:0"><span class="case-label">摘：</span>' +
'<span class="case-text">' + esc(n.content.slice(0, 160)) + (n.content.length > 160 ? '…' : '') + '</span></div>' +
'<textarea id="caseText" rows="5" placeholder="写下你的判断 —— 不求正确，只要求是"我的""></textarea>' +
'<p class="hint">案评会挂在摘抄下面，和「' + esc(n.source || '无出处') + '」一起留下。摘抄容易，自己的判断才是留下的东西。</p>',
foot: '<button class="btn" data-close>取消</button><button class="btn primary" data-act="n-case-ok" data-id="' + noteId + '">记下案评</button>',
focus: '#caseText'
});
}
function askEdit(noteId) {
var n = S.noteById(noteId);
if (!n) return;
A.modal({
title: '编辑这条笔记',
wide: true,
body: '<div class="field"><label>正文</label><textarea id="edText" rows="8">' + esc(n.content) + '</textarea></div>' +
'<div class="field"><label>出处</label><input id="edSrc" type="text" value="' + esc(n.source) + '" placeholder="《书名》/ 作者"></div>',
foot: '<button class="btn" data-close>取消</button><button class="btn primary" data-act="n-edit-ok" data-id="' + noteId + '">存下</button>',
focus: '#edText'
});
}

function askEditCase(noteId, caseId) {
var n = S.noteById(noteId);
if (!n) return;
var c = (n.caseNotes || []).filter(function (x) { return x.id === caseId; })[0];
if (!c) return;
A.modal({
title: '改这条案评',
wide: true,
body: '<div class="case" style="margin:0"><span class="case-label">摘：</span>' +
'<span class="case-text">' + esc(n.content.slice(0, 160)) + (n.content.length > 160 ? '…' : '') + '</span></div>' +
'<textarea id="caseEdit" rows="6">' + esc(c.content) + '</textarea>' +
'<p class="hint">直接改字，存下就替换原文；写作时间不动。</p>',
foot: '<button class="btn" data-close>取消</button><button class="btn primary" data-act="n-editcase-ok" data-id="' + noteId + '" data-cid="' + caseId + '">存下</button>',
focus: '#caseEdit'
});
}

var recallId = null;
function openRecall(id) {
var list = S.liveNotes();
if (!list.length) { A.toast('还没有笔记可翻'); return; }
if (!id) {

var pool = list.filter(function (n) { return n.id !== recallId; });

if (!pool.length) pool = list;
id = pool[Math.floor(Math.random() * pool.length)].id;
}
recallId = id;
var n = S.noteById(id);
if (!n) return;
var m = A.modal({
title: '翻一条旧的',
wide: true,
body: '<div class="note-time">' + esc(S.ymd(n.createdAt)) + ' · ' + A.fmtTime(n.createdAt) + '</div>' +
'<div class="note-body" style="font-size:15.5px">' + esc(n.content) + '</div>' +
(n.caseNotes.length ? '<div class="cases">' + n.caseNotes.map(function (c) {
return '<div class="case"><span class="case-label">案：</span><span class="case-text">' + esc(c.content) + '</span>' +
'<span class="case-time">' + esc(S.ymd(c.createdAt)) + '</span></div>';
}).join('') + '</div>' : '') +
(n.source ? '<div class="tiny" style="margin-top:6px">' + esc(n.source) + '</div>' : ''),
foot: '<span class="l">' + (n.caseNotes.length ? '这条有 ' + n.caseNotes.length + ' 条案评' : '这条还没写案评') + '</span>' +
'<button class="btn" data-close>关闭</button>' +
'<button class="btn" data-act="n-recall-next">换一条</button>' +
(n.caseNotes.length ? '' : '<button class="btn primary" data-act="n-case" data-id="' + n.id + '">写案评</button>')
});
return m;
}

var hlParsed = null;
function openHl() {
hlParsed = null;
A.modal({
title: '导入划线',
wide: true,
body: '<p class="hint">把读书 App 里的划线整批复制进来：按空行拆条，自动剪掉页码尾巴；出处填一次，整批共用。</p>' +
'<div class="field"><label>出处</label><input id="hlSrc" type="text" placeholder="《书名》/ 作者（可留空）" maxlength="120"></div>' +
'<div class="field"><label>划线内容</label><textarea id="hlText" rows="8" placeholder="把划线粘到这里……&#10;&#10;条与条之间空一行"></textarea></div>' +
'<div id="hlPreview"></div>',
foot: '<span class="l" id="hlStat"></span><button class="btn" data-close>取消</button>' +
'<button class="btn" data-act="n-hl-parse">拆条预览</button><button class="btn primary hidden" data-act="n-hl-go" id="hlGo">导入</button>'
});
}
function parseHl() {
var src = ($('#hlSrc') || {}).value || '';
var raw = ($('#hlText') || {}).value || '';
var blocks = raw.split(/\n\s*\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
var out = [];
var exist = {};
S.liveNotes().forEach(function (n) { exist[n.content.slice(0, 40)] = 1; });
blocks.forEach(function (b) {
var t = b.replace(/\s*[·•]\s*第?\s*\d+\s*页?.*$/gm, '')
.replace(/^\s*[-—–]\s*/, '')
.replace(/\s+/g, ' ').trim();
if (t.length < 4) return;
out.push({ text: t, dup: !!exist[t.slice(0, 40)], pick: !exist[t.slice(0, 40)] });
});
hlParsed = { src: src.trim(), items: out };
var box = $('#hlPreview');
if (!box) return;
if (!out.length) { box.innerHTML = '<p class="hint">没拆出东西来 —— 检查一下是不是按空行分条。</p>'; return; }
var dupN = out.filter(function (x) { return x.dup; }).length;
box.innerHTML = '<div class="list-head"><span>拆出 ' + out.length + ' 条' + (dupN ? ' · 其中 ' + dupN + ' 条库里已有' : '') + '</span></div>' +
'<div style="max-height:220px;overflow:auto;border:1px solid var(--border-soft);border-radius:9px;padding:8px 12px">' +
out.map(function (x, i) {
return '<label style="display:flex;gap:9px;align-items:flex-start;padding:6px 0;border-bottom:1px solid var(--border-soft);font-size:12.5px;line-height:1.7;font-family:var(--sans)">' +
'<input type="checkbox" data-hl="' + i + '" ' + (x.pick ? 'checked' : '') + (x.dup ? ' disabled' : '') + ' style="width:auto;margin-top:4px">' +
'<span' + (x.dup ? ' style="color:var(--ink-faint);text-decoration:line-through"' : '') + '>' + esc(x.text) + '</span></label>';
}).join('') + '</div>';
var st = $('#hlStat');
if (st) st.textContent = '勾选要导入的条目';
var go = $('#hlGo');
if (go) go.classList.remove('hidden');
}

var CARD_STYLES = [
{
id: 'card', name: '卡片',
paper: '#ffffff', ink: '#1f2328', inkSoft: '#57606a', faint: '#9aa1aa',
accent: '#b03a2e', line: '#e8eaed', width: 760, padX: 54, body: 22, lh: 40,
head: 'seal', bodyFont: '"Microsoft YaHei","PingFang SC",sans-serif',
caseFont: 'KaiTi,serif', caseSize: 19, caseLH: 34, radius: 18
},
{
id: 'plain', name: '素笺',
paper: '#fffdf9', ink: '#2b2621', inkSoft: '#6b6259', faint: '#a49a8e',
accent: '#a8442a', line: '#ebe4da', width: 680, padX: 64, body: 21, lh: 42,
head: 'rule', bodyFont: 'KaiTi,serif', caseFont: '"Microsoft YaHei",sans-serif',
caseSize: 17, caseLH: 32, radius: 8
}
];
var cardOpt = { style: 'card', withCases: true };

function openCard(noteId) {
var n = S.noteById(noteId);
if (!n) return;
if (!n.caseNotes.length) cardOpt.withCases = false;
A.modal({
title: '导出笔记',
wide: true,
body: '<div style="text-align:center;background:var(--panel-2);border-radius:10px;padding:14px;max-height:44vh;overflow:auto">' +
'<img id="cardPrev" alt="预览" style="max-width:100%;display:block;margin:0 auto;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,.14)">' +
'</div>' +
'<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">' +
'<span style="font-size:11px;letter-spacing:2px;color:var(--ink-light)">款式</span>' +
CARD_STYLES.map(function (s) {
return '<button class="btn sm' + (cardOpt.style === s.id ? ' primary' : '') + '" data-act="n-card-style" data-style="' + s.id + '" data-id="' + noteId + '">' + s.name + '</button>';
}).join('') +
(n.caseNotes.length ? '<label style="margin-left:auto;display:flex;gap:6px;align-items:center;font-size:12px;color:var(--ink-light)">' +
'<input type="checkbox" id="cardCases" ' + (cardOpt.withCases ? 'checked' : '') + ' style="width:auto" data-change="card-cases" data-id="' + noteId + '">带上案评</label>' : '') +
'</div>',
foot: '<span class="l">导出的图与屏幕大小、当前纸色无关 —— 同一篇永远是同一张</span>' +
'<button class="btn" data-close>取消</button><button class="btn primary" data-act="n-card-save" data-id="' + noteId + '">保存…</button>',
onMount: function (mask) {
drawPreview(noteId, mask);
}
});
}
function wrapText(ctx, text, maxW) {
var lines = [];
String(text).split('\n').forEach(function (para) {
if (!para) { lines.push(''); return; }
var line = '';
for (var i = 0; i < para.length; i++) {
var ch = para[i];
var test = line + ch;
if (ctx.measureText(test).width > maxW && line) {
lines.push(line);
line = ch;
} else line = test;
}
if (line) lines.push(line);
});
return lines;
}
function buildCanvas(noteId, styleId, withCases) {
var n = S.noteById(noteId);
var st = CARD_STYLES.filter(function (s) { return s.id === styleId; })[0] || CARD_STYLES[0];
var W = st.width;
var c = document.createElement('canvas');
var ctx = c.getContext('2d');
var bodyFont = st.body + 'px ' + st.bodyFont;
var maxW = W - st.padX * 2;

ctx.font = bodyFont;
var bodyLines = wrapText(ctx, n.content, maxW);
var cases = withCases ? n.caseNotes : [];
ctx.font = st.caseSize + 'px ' + st.caseFont;
var caseLines = cases.map(function (cs) { return wrapText(ctx, cs.content, maxW - (st.head === 'seal' ? 0 : 26)); });

var headH = st.head === 'seal' ? 96 : 120;
var bodyH = bodyLines.length * st.lh;
var caseH = 0;
cases.forEach(function (cs, i) { caseH += 34 + caseLines[i].length * st.caseLH + 16; });
var sourceH = n.source ? 46 : 0;
var footH = 84;
var H = st.padX + headH + bodyH + (caseH ? 20 + caseH : 0) + sourceH + footH;

c.width = W * 2; c.height = Math.round(H) * 2;
ctx.scale(2, 2);
ctx.textBaseline = 'top';

ctx.fillStyle = st.paper;
ctx.fillRect(0, 0, W, H);
if (st.head === 'rule') {
ctx.strokeStyle = st.line;
ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(st.padX, 62); ctx.lineTo(W - st.padX, 62); ctx.stroke();
}

var y = st.padX;

if (st.head === 'seal') {
var size = 40;
ctx.fillStyle = st.accent;
var r = size * 0.19, x0 = st.padX, y0 = y;
ctx.beginPath();
ctx.moveTo(x0 + r, y0);
ctx.arcTo(x0 + size, y0, x0 + size, y0 + size, r);
ctx.arcTo(x0 + size, y0 + size, x0, y0 + size, r);
ctx.arcTo(x0, y0 + size, x0, y0, r);
ctx.arcTo(x0, y0, x0 + size, y0, r);
ctx.closePath(); ctx.fill();
ctx.fillStyle = '#fff';
ctx.font = '20px ' + st.caseFont;
ctx.textAlign = 'center';
ctx.fillText('读', x0 + size / 2, y0 + 10);
ctx.textAlign = 'left';
ctx.fillStyle = st.faint;
ctx.font = '13px ' + st.bodyFont;
ctx.fillText(S.ymd(n.createdAt) + ' · 读书笔记', st.padX + size + 14, y + 12);
y += 86;
} else {
ctx.fillStyle = st.faint;
ctx.font = '12px ' + st.bodyFont;
ctx.fillText(S.ymd(n.createdAt) + '　读书笔记', st.padX, y);
y += 92;
}

ctx.fillStyle = st.ink;
ctx.font = bodyFont;
bodyLines.forEach(function (line) {
ctx.fillText(line, st.padX, y);
y += st.lh;
});

if (cases.length) {
y += 20;
cases.forEach(function (cs, i) {
ctx.fillStyle = st.accent;
ctx.font = '14px ' + st.caseFont;
ctx.fillText('案', st.padX, y);
ctx.fillStyle = st.line;
ctx.fillRect(st.padX + 16, y + 20, maxW - 16, 1);
y += 34;
ctx.fillStyle = st.inkSoft;
ctx.font = st.caseSize + 'px ' + st.caseFont;
caseLines[i].forEach(function (line, k) {
ctx.fillText(line, st.padX + (st.head === 'seal' ? 0 : 26), y);
y += st.caseLH;
});
y += 16;
});
}

if (n.source) {
y += 12;
ctx.fillStyle = st.faint;
ctx.font = '13px ' + st.bodyFont;
ctx.fillText('—— ' + n.source, st.padX, y);
y += 34;
}
ctx.strokeStyle = st.line;
ctx.beginPath(); ctx.moveTo(st.padX, H - 54); ctx.lineTo(W - st.padX, H - 54); ctx.stroke();
ctx.fillStyle = st.faint;
ctx.font = '12px ' + st.bodyFont;
ctx.fillText(S.db.meta.name || '我的工作台', st.padX, H - 40);
ctx.textAlign = 'right';
ctx.fillText('我的工作台 · 读书笔记', W - st.padX, H - 40);
ctx.textAlign = 'left';
return c;
}
function drawPreview(noteId, mask) {
var img = mask.querySelector('#cardPrev');
if (!img) return;
var c = buildCanvas(noteId, cardOpt.style, cardOpt.withCases);
img.src = c.toDataURL('image/png');
}
function saveCard(noteId) {
var c = buildCanvas(noteId, cardOpt.style, cardOpt.withCases);
c.toBlob(function (blob) {
var a = document.createElement('a');
a.href = URL.createObjectURL(blob);
var n = S.noteById(noteId);
a.download = '读书笔记-' + S.ymd(n.createdAt) + '.png';
document.body.appendChild(a); a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
A.toast('已存下这张图');
}, 'image/png');
}

A.act('n-tab', function (el) { ui.tab = el.dataset.tab; A.refresh(); });
A.act('n-compose', function () {
ui.composer = true; A.refresh();
setTimeout(function () { var t = $('#nText'); if (t) t.focus(); }, 30);
});
A.act('n-compose-cancel', function () { ui.composer = false; A.refresh(); });
A.act('n-save', function () { saveNote(); });
function saveNote() {
var t = $('#nText'), s = $('#nSrc');
if (!t || !t.value.trim()) {

if (t) t.focus();
A.toast('还没写内容');
return;
}
if (t.value.length > NOTE_MAX) {
A.toast('这一条太长了（上限 ' + NOTE_MAX + ' 字），先分成两条');
t.focus();
return;
}
S.addNote({ content: t.value, source: s ? s.value : '' });

lastSrc = s ? s.value : '';

clearTimeout(draftTimer); draftTimer = null;

writeDraft('', '');

ui.composer = true;
A.refresh();
A.toast('记下了');
setTimeout(function () { var x = $('#nText'); if (x) x.focus(); }, 30);
}

A.act('n-draft-drop', function () {
writeDraft('', '');
A.refresh();
A.toast('草稿已丢掉');
});
A.act('n-fold', function (el) {
ui.open[el.dataset.id] = !ui.open[el.dataset.id];
A.refresh();
});
A.act('n-case', function (el) { askCase(el.dataset.id); });
A.act('n-editcase', function (el) { askEditCase(el.dataset.id, el.dataset.cid); });
A.act('n-editcase-ok', function (el) {
var box = $('#caseEdit');
if (!box || !box.value.trim()) { if (box) box.focus(); return; }
if (S.updateCase(el.dataset.id, el.dataset.cid, box.value)) {
A.closeTopModal(); A.refresh(); A.toast('案评改好了');
}
});
A.act('n-case-ok', function (el) {
var box = $('#caseText');
if (!box || !box.value.trim()) { if (box) box.focus(); return; }
S.addCase(el.dataset.id, box.value);
A.closeTopModal();
A.refresh();
A.toast('案评记下了');
});
A.act('n-delcase', function (el) {
var nid = el.dataset.id, cid = el.dataset.cid;
var snap = JSON.parse(JSON.stringify((S.noteById(nid) || {}).caseNotes || []));
S.delCase(nid, cid);
A.refresh();
A.offerUndo('案评删了', function () {
var n = S.noteById(nid);
if (!n) return;
n.caseNotes = snap;
S.commit(); A.refresh(); A.toast('放回来了');
});
});
A.act('n-edit', function (el) { askEdit(el.dataset.id); });
A.act('n-edit-ok', function (el) {
var t = $('#edText'), s = $('#edSrc');
if (!t || !t.value.trim()) return;
S.updateNote(el.dataset.id, { content: t.value, source: s.value });
A.closeTopModal(); A.refresh(); A.toast('改好了');
});
A.act('n-del', function (el) {
var n = S.noteById(el.dataset.id);
if (!n) return;
lastDeleted = { note: JSON.parse(JSON.stringify(n)) };
S.delNote(el.dataset.id);
A.refresh();
A.offerUndo('这条笔记删了', function () {
S.restoreNote(n.id);
lastDeleted = null;
A.refresh(); A.refreshOverviewSoft(); A.toast('放回来了');
}, function () { lastDeleted = null; });
});
document.addEventListener('keydown', function (e) {
if (!((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && lastDeleted)) return;

if (A.activeId !== 'notes') return;
if (e.target && e.target.closest && e.target.closest('input,textarea,[contenteditable]')) return;
var n = lastDeleted.note;
var target = S.db.notes.filter(function (x) { return x.id === n.id; })[0];
if (target && target.deleted) {
e.preventDefault();
S.restoreNote(n.id);
lastDeleted = null;
A.refresh();
A.toast('回来了');
}
});
A.act('n-recall', function () { openRecall(); });
A.act('n-recall-next', function () {
var m = A.modalStack[A.modalStack.length - 1];
if (m) m.close();
setTimeout(function () { openRecall(); }, 150);
});
A.act('n-hl', openHl);
A.act('n-hl-parse', parseHl);
A.act('n-hl-go', function () {
if (!hlParsed) { parseHl(); return; }
var picks = $$('[data-hl]').filter(function (cb) { return cb.checked && !cb.disabled; });
var n = 0;
picks.forEach(function (cb) {
var it = hlParsed.items[Number(cb.dataset.hl)];
if (!it) return;
S.addNote({ content: it.text, source: hlParsed.src });
n++;
});
A.closeTopModal();
A.refresh();
A.toast(n ? '导入 ' + n + ' 条' : '一条都没选');
});
A.act('n-card', function (el) { openCard(el.dataset.id); });
A.act('n-card-style', function (el) {
cardOpt.style = el.dataset.style;
var m = A.modalStack[A.modalStack.length - 1];
$$('[data-act="n-card-style"]', m).forEach(function (b) {
b.classList.toggle('primary', b.dataset.style === cardOpt.style);
});
drawPreview(el.dataset.id, m);
});
A.act('n-card-save', function (el) { saveCard(el.dataset.id); });
A.act('change:card-cases', function (el) {
cardOpt.withCases = el.checked;
drawPreview(el.dataset.id, A.modalStack[A.modalStack.length - 1]);
});

A.act('n-kw', function (el) {
var k = S.db.keywords.filter(function (x) { return x.id === el.dataset.id; })[0];
if (k) openLink('kw', k.word);
});

function askMerge(k) {
var others = S.db.keywords.filter(function (x) { return x.id !== k.id; })
.map(function (x) { return { k: x, n: kwHit(x).length }; })
.sort(function (a, b) { return b.n - a.n; });
A.modal({
wide: true,
title: '把「' + k.word + '」并入…',
body: (others.length
? '<div class="vw-form-tip" style="margin:0 0 12px">并进去之后，「' + esc(k.word) + '」会变成对方的别名，' +
'两边命中的笔记合成一处。原来的词条不再单独出现。</div>' +
'<div class="mw-list">' + others.slice(0, 200).map(function (x) {
return '<button class="mw-item" data-act="n-merge-do" data-from="' + k.id + '" data-to="' + x.k.id + '">' +
'<span class="mw-w">' + esc(x.k.word) + '</span>' +
(x.k.aliases.length ? '<span class="mw-al">' + (x.k.aliases.length + 1) + ' 名</span>' : '') +
'<span class="mw-c">' + x.n + '</span></button>';
}).join('') + '</div>'
: '<div class="empty"><div class="t">没有别的关键词可以并</div>' +
'<div class="d">只有一个词，那就没有重名的烦恼</div></div>'),
foot: '<button class="btn" data-close>算了</button>'
});
}
A.act('n-merge', function (el) {
var k = S.db.keywords.filter(function (x) { return x.id === el.dataset.id; })[0];
if (k) askMerge(k);
});
A.act('n-merge-do', function (el, e) {
var r = S.mergeKeyword(el.dataset.from, el.dataset.to);
var mask = e.target.closest('.mask');
if (mask) mask.close();
if (!r.ok) { A.toast(r.error); return; }
A.toast('并进「' + r.to.word + '」了 · 搬了 ' + r.moved + ' 个名字');
A.refresh(); A.renderRail();
});

A.act('n-addkw', function (el) {
var w = el.dataset.w;
var r = S.addKeyword(w);
if (!r.ok) { A.toast(r.error); return; }
A.refresh(); A.renderRail();
A.toast('收下「' + w + '」');
});
A.act('n-addkw-open', function () {
A.modal({
title: '添加关键词',
body: '<div class="field"><label>关键词</label><input id="kwNew" type="text" maxlength="30" placeholder="如「赵武灵王」"></div>' +
'<div class="field"><label>别名（可选，逗号分隔）</label><input id="kwAlias" type="text" maxlength="60" placeholder="同一样东西的别的叫法"></div>' +
'<p class="hint">别名把「一个概念的多种写法」收进一条：数字合并、关联页合并，列表里仍只占一行。</p>',
foot: '<button class="btn" data-close>取消</button><button class="btn primary" data-act="n-addkw-ok">添加</button>',
focus: '#kwNew'
});
});
A.act('n-addkw-ok', function () {
var w = ($('#kwNew') || {}).value || '';
var al = ($('#kwAlias') || {}).value || '';
var list = al.split(/[,，、\s]+/).filter(Boolean);
var r = S.addKeyword(w, []);
if (!r.ok) { A.toast(r.error); return; }
list.forEach(function (x) { S.addAlias(r.item.id, x); });
A.closeTopModal(); A.refresh(); A.renderRail();
A.toast('收下「' + r.item.word + '」');
});
A.act('n-sug', function () { ui.sugSeed++; A.refresh(); });

A.act('n-openbook', function (el) { openLink('book', el.dataset.b); });

A.act('n-read', function (el) {
ui.reading = el.dataset.id;
A.refresh();
var p = document.querySelector('#panes .pane.active');
if (p) p.scrollTop = 0;
});
A.act('n-read-close', function () {
ui.reading = '';
A.refresh();
});

A.notesExitReading = function () {
if (!ui.reading) return false;
ui.reading = '';
return true;
};
A.act('n-read-prev', function (el) { if (el.dataset.id) A.acts['n-read']({ dataset: { id: el.dataset.id } }); });
A.act('n-read-next', function (el) { if (el.dataset.id) A.acts['n-read']({ dataset: { id: el.dataset.id } }); });

A.act('input:n-q', function (el) { ui.qTyping = el.value; });
A.act('n-q-go', function () {
var el = $('#nQ');
ui.q = String((el && el.value) || ui.qTyping || '').trim();
ui.limit = ui.q ? 'all' : '';
A.refresh();
setTimeout(function () { var i = $('#nQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0);
});
A.act('n-more', function () { ui.limit = 'all'; A.refresh(); });
A.act('n-less', function () { ui.limit = ''; A.refresh(); });
A.act('input:k-q', function (el) { ui.kwQ = el.value; A.refresh(); setTimeout(function () { var i = $('#kQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); });
A.act('input:b-q', function (el) { ui.bookQ = el.value; A.refresh(); setTimeout(function () { var i = $('#bQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); });
A.act('input:link-q', function (el) {
var kind = el.dataset.link, key = el.dataset.kw;
ui.linkQ = ui.linkQ || {};
ui.linkQ[kind + ':' + key] = el.value;
A.refresh();
setTimeout(function () { var i = $('[data-input="link-q"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0);
});

document.addEventListener('keydown', function (e) {
if (A.activeId !== 'notes' || !ui.reading) return;
if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
if (document.querySelector('#modalRoot .mask')) return;
if (e.ctrlKey || e.metaKey || e.altKey) return;
if (e.key === 'Escape') { e.preventDefault(); A.acts['n-read-close'](); return; }
if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
var btn = document.querySelector(e.key === 'ArrowLeft' ? '[data-act="n-read-prev"]' : '[data-act="n-read-next"]');
if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
}
});

document.addEventListener('keydown', function (e) {
var t = e.target;
if (!t || !t.id) return;
if (t.id === 'nText' && (e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); saveNote(); }
if (t.id === 'nQ' && e.key === 'Enter') { e.preventDefault(); A.acts['n-q-go'](t); }
if ((t.id === 'nQ' || t.id === 'kQ' || t.id === 'bQ') && e.key === 'Escape') {
e.preventDefault();
t.value = '';
if (t.id === 'nQ') { ui.q = ''; A.refresh(); setTimeout(function () { var i = $('#nQ'); if (i) i.focus(); }, 0); }
if (t.id === 'kQ') { ui.kwQ = ''; A.refresh(); }
if (t.id === 'bQ') { ui.bookQ = ''; A.refresh(); }
}
if (t.id === 'hlText' && (e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); parseHl(); }
});

var hushTimer = null;
function bindScrollHush(pane) {
try {
if (!pane || typeof pane.addEventListener !== 'function' || !document.body) return;
if (pane.__notesHush) return;
pane.__notesHush = true;
pane.addEventListener('scroll', function () {
document.body.classList.add('m-scrolling');
if (hushTimer) clearTimeout(hushTimer);
hushTimer = setTimeout(function () {
document.body.classList.remove('m-scrolling');
}, 600);
}, false);
} catch (e) {
}
}

A.view('notes', {
render: render,
mount: function (pane) { fitNotes(pane); bindScrollHush(pane); bindComposer(pane); }
});
A.openRecall = openRecall;
A.notesOpenLink = openLink;
})(window);
