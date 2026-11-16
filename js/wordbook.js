(function (g) {
'use strict';

var S = g.S, A = g.App;
var esc = A.esc, $ = A.$, $$ = A.$$;

var TABS = [
{ k: 'wall', n: '词墙', d: '铺开看' },
{ k: 'today', n: '今日拾词', d: '一天一个' },
{ k: 'flip', n: '翻卡', d: '正面英文' },
{ k: 'quiz', n: '默写', d: '看中文写英文' },
{ k: 'list', n: '词表', d: '查改删' }
];

var wb = {
tab: 'wall',
q: '',
lv: 'all',
sort: 'due',

queue: [],
at: 0,
flipped: false,
quiz: null,

got: 0,
miss: 0
};

function lvName(lv) { return S.LV_NAME[lv] || '初见'; }

function dueText(w) {
if (w.lv >= 4) return '已烂熟';
var left = (w.reviewAt || 0) - Date.now();
if (left <= 0) return '该看一眼了';
var min = Math.round(left / 60000);
if (min < 60) return min + ' 分钟后';
var day = Math.round(min / 60 / 24);
if (day <= 1) return '明天';
return day + ' 天后';
}

function sorted(filtered) {
var list = filtered.slice();
if (wb.sort === 'new') {
list.sort(function (a, b) { return b.addedAt - a.addedAt; });
} else {

list.sort(function (a, b) {
if (a.lv !== b.lv) return a.lv - b.lv;
return (a.reviewAt || 0) - (b.reviewAt || 0);
});
}

list.sort(function (a, b) { return (b.pin ? 1 : 0) - (a.pin ? 1 : 0); });
return list;
}

function filtered() {
var q = wb.q.toLowerCase();
return S.db.words.filter(function (w) {
if (wb.lv === 'due' && !(w.lv < 4 && (w.reviewAt || 0) <= Date.now())) return false;
if (wb.lv !== 'all' && wb.lv !== 'due' && String(w.lv) !== wb.lv) return false;
if (!q) return true;
return (w.w + ' ' + w.mean + ' ' + w.tag + ' ' + w.eg).toLowerCase().indexOf(q) >= 0;
});
}

function buildQueue(force) {
if (wb.queue.length && !force) return;
var pool = S.wordsDue();
if (!pool.length) pool = S.db.words.slice();
pool = pool.slice();
for (var i = pool.length - 1; i > 0; i--) {
var j = Math.floor(Math.random() * (i + 1));
var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
}
wb.queue = pool.map(function (w) { return w.id; });
wb.at = 0;
wb.flipped = false;
wb.quiz = null;
wb.got = 0; wb.miss = 0;
}

function curWord() {
for (var i = wb.at; i < wb.queue.length; i++) {
var w = S.wordById(wb.queue[i]);
if (w) return w;

}
return null;
}

function wallHtml() {
var list = sorted(filtered());
if (!list.length) {
return S.db.words.length
? '<div class="empty"><div class="mark">词</div><div class="t">这一筛是空的</div><div class="d">换个状态或清掉搜索词再看看</div></div>'
: '<div class="empty"><div class="mark">词</div><div class="t">从第一个词开始</div>' +
'<div class="d">点上方「＋ 拾一个词」。每天一个，一年就是三百多个</div></div>';
}
return '<div class="vw-wall">' + list.map(function (w) {
return '<div class="vw-card' + (w.pin ? ' pinned' : '') + '" data-act="vw-open-one" data-id="' + w.id + '" title="点开翻一下">' +
'<button class="vw-pin" data-act="vw-pin" data-id="' + w.id + '" title="' +
(w.pin ? '取下' : '钉住，让它一直排在最前面') + '"></button>' +
'<div class="vw-c-top">' +
'<div class="vw-w">' + esc(w.w) + '</div>' +
'<span class="vw-seal lv' + w.lv + '">' + lvName(w.lv) + '</span></div>' +
(w.ph ? '<div class="vw-ph">' + esc(w.ph) + '</div>' : '') +
'<div class="vw-mean"' + (w.ph ? '' : ' style="margin-top:2px"') + '>' + esc(w.mean || '（还没写释义）') + '</div>' +
'<div class="vw-c-foot">' +
'<span class="vw-dots">' + [0, 1, 2, 3, 4].map(function (i) {
return '<i class="' + (i <= w.lv ? 'on lv' + w.lv : '') + '"></i>';
}).join('') + '</span>' +
'<span class="vw-due">' + dueText(w) + '</span></div>' +
'</div>';
}).join('') + '</div>';
}

function dayKey(ts) { return S.ymd(ts); }
function streakDays() {
var days = {};
S.db.words.forEach(function (w) { days[dayKey(w.addedAt)] = 1; });
var d = new Date();

if (!days[S.ymd(d)]) d.setDate(d.getDate() - 1);
var n = 0;
while (days[S.ymd(d)]) { n++; d.setDate(d.getDate() - 1); }
return n;
}
function last14() {
var days = {};
S.db.words.forEach(function (w) {
var k = dayKey(w.addedAt);
days[k] = (days[k] || 0) + 1;
});
var out = [];
for (var i = 13; i >= 0; i--) {
var d = new Date();
d.setDate(d.getDate() - i);
var k = S.ymd(d);
out.push({ k: k, n: days[k] || 0, today: i === 0 });
}
return out;
}

function todayHtml() {
var t = S.today();
var todays = S.db.words.filter(function (w) { return dayKey(w.addedAt) === t; })
.sort(function (a, b) { return b.addedAt - a.addedAt; });
var days = last14();
var max = Math.max.apply(null, days.map(function (x) { return x.n; }).concat([1]));
var streak = streakDays();

var chart = '<div class="vw-chart">' + days.map(function (x) {
var h = x.n ? Math.max(8, Math.round(x.n / max * 44)) : 2;
return '<i class="' + (x.n ? 'has' : '') + (x.today ? ' today' : '') + '" ' +
'style="height:' + h + 'px" title="' + x.k + ' · ' + x.n + ' 个"></i>';
}).join('') + '</div>';

var list = todays.length
? '<div class="vw-today-list">' + todays.map(function (w) {
return '<div class="vw-today-row" data-act="vw-open-one" data-id="' + w.id + '">' +
'<span class="vw-today-w">' + esc(w.w) + '</span>' +
'<span class="vw-today-m">' + esc(w.mean || '还没写释义') + '</span>' +
'<span class="vw-seal lv' + w.lv + '">' + lvName(w.lv) + '</span></div>';
}).join('') + '</div>'
: '<div class="vw-today-empty">今天还一个都没拾。' +
(streak ? '连续 ' + streak + ' 天了，别在今天断掉。' : '一天一个，一年就是三百多个。') + '</div>';

return '<div class="vw-today">' +
'<div class="vw-today-h">' +
'  <div class="vw-today-num"><b>' + todays.length + '</b><span>今天拾到</span></div>' +
'  <div class="vw-today-streak"><b>' + streak + '</b><span>天连续</span></div>' +
'  <div class="vw-today-chart">' + chart +
'    <div class="vw-chart-ax"><span>两周前</span><span>今天</span></div></div>' +
'</div>' +
'<div class="vw-quick">' +
'  <input type="text" id="vwQW" class="vw-q-in2" placeholder="遇见的词" autocomplete="off" spellcheck="false" data-key="vw-quick">' +
'  <input type="text" id="vwQM" class="vw-q-in2 wide" placeholder="它是什么意思" autocomplete="off" data-key="vw-quick">' +
'  <button class="btn primary" data-act="vw-quick-add">收下</button>' +
'</div>' +
'<div class="vw-today-sub">今天收到的</div>' + list +
'</div>';
}

function quickAdd() {
var w = $('#vwQW'), m = $('#vwQM');
if (!w || !w.value.trim()) { if (w) w.focus(); return; }
var dup = S.findWord(w.value);
var n = S.addWord({ w: w.value, mean: m ? m.value : '' });
if (!n) { if (w) w.focus(); return; }
w.value = ''; if (m) m.value = '';
wb.queue = [];
A.toast(dup ? '这个词已经有了，把空的补上了' : '收下了 · 今天就到这儿');
A.refresh();
var again = $('#vwQW');
if (again) { try { again.focus(); } catch (e) { } }
}
A.act('vw-quick-add', quickAdd);
A.act('key:vw-quick', function (el, e) {
if (e.isComposing) return;
if (e.key !== 'Enter') return;
e.preventDefault();
if (el.id === 'vwQW') {

var m = $('#vwQM');
if (m && !m.value) { m.focus(); return true; }
}
quickAdd();
return true;
});

function flipHtml() {
if (!S.db.words.length) {
return '<div class="empty"><div class="mark">词</div><div class="t">词表还是空的</div><div class="d">先拾几个词进来，再来翻卡</div></div>';
}
buildQueue();
var w = curWord();
if (!w) {
return '<div class="vw-done">' +
'<div class="vw-done-mark">完</div>' +
'<div class="vw-done-t">这一轮翻完了</div>' +
'<div class="vw-done-d">共 ' + wb.queue.length + ' 个词 · 认识 ' + wb.got + ' 个 · 不认识 ' + wb.miss + ' 个</div>' +
'<button class="btn primary" data-act="vw-again">再来一轮</button></div>';
}
return '<div class="vw-stage">' +
'<div class="vw-count">第 ' + (wb.at + 1) + ' / ' + wb.queue.length + ' 个 · 点卡片看释义</div>' +
'<div class="vw-flip' + (wb.flipped ? ' on' : '') + '" data-act="vw-flip">' +
'  <div class="vw-face front">' +
'    <div class="vw-big">' + esc(w.w) + '</div>' +
(w.ph ? '<div class="vw-ph big">' + esc(w.ph) + '</div>' : '') +
'    <div class="vw-tap">点一下看释义</div>' +
'  </div>' +
'  <div class="vw-face back">' +
'    <div class="vw-big small">' + esc(w.w) + '</div>' +
'    <div class="vw-back-mean">' + esc(w.mean || '（还没写释义）') + '</div>' +
(w.eg ? '<div class="vw-eg">' + esc(w.eg) + '</div>' : '') +
'    <div class="vw-tap">' + lvName(w.lv) + ' · ' + dueText(w) + '</div>' +
'  </div>' +
'</div>' +
'<div class="vw-judge">' +
'  <button class="btn vw-ng" data-act="vw-ng">不认识</button>' +
'  <button class="btn primary vw-ok" data-act="vw-ok">认识</button>' +
'</div>' +
'<div class="vw-note">判"认识"会往上升一档，判"不认识"退回一档并十分钟后再来</div>' +
'</div>';
}

function quizHtml() {
if (!S.db.words.length) {
return '<div class="empty"><div class="mark">词</div><div class="t">词表还是空的</div><div class="d">先拾几个词进来，再来默写</div></div>';
}
buildQueue();
if (!wb.quiz) {
var w = curWord();
if (!w) {
return '<div class="vw-done">' +
'<div class="vw-done-mark">完</div>' +
'<div class="vw-done-t">这一轮默完了</div>' +
'<div class="vw-done-d">对了 ' + wb.got + ' 个 · 错了 ' + wb.miss + ' 个</div>' +
'<button class="btn primary" data-act="vw-again">再来一轮</button></div>';
}
wb.quiz = { id: w.id, val: '', res: null };
}
var q = wb.quiz;
var word = S.wordById(q.id);
if (!word) { wb.quiz = null; return quizHtml(); }
var hint = word.w.replace(/[a-zA-Z]/g, function (c, i) { return i === 0 ? c : '_'; });

var reW = String(word.w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
var res = q.res;
return '<div class="vw-quiz">' +
'<div class="vw-count">第 ' + (wb.at + 1) + ' / ' + wb.queue.length + ' 个 · 看中文写英文</div>' +
'<div class="vw-q-mean">' + esc(word.mean || '（这个词还没写释义）') + '</div>' +
(word.eg ? '<div class="vw-q-eg">' + esc(word.eg.replace(new RegExp(reW, 'ig'), '____')) + '</div>' : '') +
'<div class="vw-q-hint">' + esc(hint) + ' · 共 ' + word.w.replace(/[^a-zA-Z]/g, '').length + ' 个字母</div>' +
'<input type="text" id="vwQIn" class="vw-q-in' + (res === 'ok' ? ' ok' : res === 'no' ? ' ng' : '') + '" ' +
'data-key="vw-quiz" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ' +
'placeholder="在这里拼出来，按回车判" value="' + esc(q.val) + '"' + (res ? ' readonly' : '') + '>' +
(res === 'ok' ? '<div class="vw-q-res ok">对了 —— ' + esc(word.w) + ' ' + esc(word.ph) + '</div>' : '') +
(res === 'no' ? '<div class="vw-q-res ng">该写 <b>' + esc(word.w) + '</b> · ' + esc(word.mean) + '</div>' : '') +
'<div class="vw-judge">' +
(res
? '<button class="btn primary" data-act="vw-next">下一个</button>'
: '<button class="btn" data-act="vw-skip">想不起来，看答案</button>' +
'<button class="btn primary" data-act="vw-check">判一下</button>') +
'</div>' +
'<div class="vw-note">这一轮 对 ' + wb.got + ' · 错 ' + wb.miss + '</div>' +
'</div>';
}

function listHtml() {
var list = sorted(filtered());
return '<div class="vw-tools">' +
'<input type="text" class="vw-search" data-input="vw-q" placeholder="搜单词、释义或标签" value="' + esc(wb.q) + '">' +
'<select data-change="vw-lv">' +
'<option value="all">全部 ' + S.db.words.length + '</option>' +
'<option value="due"' + (wb.lv === 'due' ? ' selected' : '') + '>待复习 ' + S.wordsDue().length + '</option>' +
[0, 1, 2, 3, 4].map(function (i) {
var n = S.db.words.filter(function (w) { return w.lv === i; }).length;
return '<option value="' + i + '"' + (String(wb.lv) === String(i) ? ' selected' : '') + '>' +
lvName(i) + ' ' + n + '</option>';
}).join('') +
'</select>' +
'<select data-change="vw-sort">' +
'<option value="due"' + (wb.sort === 'due' ? ' selected' : '') + '>最该看的在前</option>' +
'<option value="new"' + (wb.sort === 'new' ? ' selected' : '') + '>新收的在前</option>' +
'</select>' +
'</div>' +
(list.length ? '<div class="vw-list">' + list.map(function (w) {
return '<div class="vw-row">' +
'<div class="vw-r-main"><div class="vw-r-w">' + esc(w.w) +
(w.tag ? '<span class="vw-tag">' + esc(w.tag) + '</span>' : '') + '</div>' +
'<div class="vw-r-m">' + (w.ph ? '<span class="vw-r-ph">' + esc(w.ph) + '</span>' : '') + esc(w.mean) + '</div></div>' +
'<div class="vw-r-lv"><span class="vw-seal lv' + w.lv + '">' + lvName(w.lv) + '</span></div>' +
'<div class="vw-r-ops">' +
'<button class="vw-mini" data-act="vw-edit" data-id="' + w.id + '" title="改这个词">改</button>' +
'<button class="vw-mini del" data-act="vw-del" data-id="' + w.id + '" title="删掉">删</button>' +
'</div></div>';
}).join('') + '</div>'
: '<div class="empty"><div class="mark">词</div><div class="t">一个都没对上</div><div class="d">清掉搜索词或换个状态</div></div>');
}

function wordView() {
var st = S.wordStats();
var body = { wall: wallHtml, today: todayHtml, flip: flipHtml, quiz: quizHtml, list: listHtml }[wb.tab]();
return '<div class="view vw">' +

A.vHead('WORDS · 词本', '日进一词',
st.total

? '收了 ' + st.total + ' 个词' +
(st.due ? '，' + st.due + ' 个该复习了' : '，都过了一遍') +
(st.mastered ? '，' + st.mastered + ' 个已经烂熟。' : '。')
: '还没有词。读到一个不认识的，就拾进来。',
'<button class="btn primary" data-act="vw-add">＋ 拾一个词</button>') +

'<div class="vw-tabs">' + TABS.map(function (t) {
return '<button class="vw-tab' + (wb.tab === t.k ? ' on' : '') + '" data-act="vw-tab" data-k="' + t.k + '">' +
t.n + '<i>' + t.d + '</i></button>';
}).join('') + '</div>' +

'<div class="vw-body">' + body + '</div>' +
'</div>';
}

function editModal(id) {
var it = id ? S.wordById(id) : null;
A.modal({
title: it ? '改一个词' : '拾一个词',
body:
'<div class="vw-form">' +
'<label>单词<input type="text" id="vwW" autocomplete="off" spellcheck="false" placeholder="ephemeral" value="' + esc(it ? it.w : '') + '"></label>' +
'<label>音标<input type="text" id="vwPh" autocomplete="off" placeholder="/ɪˈfem.ər.əl/ 或 I-fem-er-al" value="' + esc(it ? it.ph : '') + '"></label>' +
'<label>释义<input type="text" id="vwMean" autocomplete="off" placeholder="短暂的，朝生暮死的" value="' + esc(it ? it.mean : '') + '"></label>' +
'<label>例句（可不填）<input type="text" id="vwEg" autocomplete="off" placeholder="Fame is ephemeral." value="' + esc(it ? it.eg : '') + '"></label>' +
'<label>标签（可不填）<input type="text" id="vwTag" autocomplete="off" placeholder="读书时遇到的" value="' + esc(it ? it.tag : '') + '"></label>' +
'</div>' +
'<div class="vw-form-tip">同名词只会有一条 —— 再录一次只补空着的字段，不会把熟练度清零</div>',
foot: '<button class="btn" data-close>算了</button>' +
'<button class="btn primary" data-act="vw-save" data-id="' + (it ? it.id : '') + '">收下</button>',
focus: '#vwW'
});
}

function readForm() {
var v = function (sel) { var el = $(sel); return el ? el.value.trim() : ''; };
return { w: v('#vwW'), ph: v('#vwPh'), mean: v('#vwMean'), eg: v('#vwEg'), tag: v('#vwTag') };
}

A.act('vw-tab', function (el) {
var k = el.dataset.k;
if (wb.tab === k) return;
wb.tab = k;
if (k === 'flip' || k === 'quiz') buildQueue(true);
A.refresh();
});
A.act('vw-add', function () { editModal(null); });
A.act('vw-edit', function (el) { editModal(el.dataset.id); });
A.act('vw-save', function (el, e) {
var f = readForm();
if (!f.w) { A.toast('单词总得填一个'); var w = $('#vwW'); if (w) w.focus(); return; }
var mask = e.target.closest('.mask');
var id = el.dataset.id;
if (id) {
S.updateWord(id, f);
A.toast('改好了');
} else {
var dup = S.findWord(f.w);
var n = S.addWord(f);
A.toast(dup ? '这个词已经有了，把空的补上了' : '收下了 · 明天再见');

if (n) wb.queue = [];
}
if (mask) mask.close();
A.refresh();
});
A.act('vw-del', function (el) {
var w = S.wordById(el.dataset.id);
if (!w) return;
S.delWord(w.id);
A.offerUndo('已删掉「' + w.w + '」', function () {
S.db.words.push(w); S.save(); A.refresh();
});
A.refresh();
});
A.act('vw-open-one', function (el) {

var id = el.dataset.id;
buildQueue(true);
var i = wb.queue.indexOf(id);
if (i > 0) { wb.queue.splice(i, 1); wb.queue.unshift(id); wb.at = 0; }
wb.tab = 'flip';
wb.flipped = false;
A.refresh();
});
A.act('vw-flip', function () { wb.flipped = !wb.flipped; A.refresh(); });
A.act('vw-pin', function (el) {
var w = S.wordById(el.dataset.id);
if (!w) return;
S.updateWord(w.id, { pin: !w.pin });
A.toast(w.pin ? '钉住了 · 一直排在最前面' : '取下来了');
A.refresh();
});

function judge(ok) {
var w = curWord();
if (w) {
S.reviewWord(w.id, ok);
if (ok) wb.got++; else wb.miss++;
}
wb.at++;
wb.flipped = false;
A.refresh();
}
A.act('vw-ok', function () { judge(true); });
A.act('vw-ng', function () { judge(false); });
A.act('vw-again', function () {
wb.queue = [];
buildQueue(true);
A.refresh();
});

A.act('vw-check', function () {
var q = wb.quiz;
if (!q) return;
var w = S.wordById(q.id);
if (!w) return;
var inp = $('#vwQIn');
var val = inp ? inp.value.trim() : q.val;
q.val = val;
if (!val) { if (inp) inp.focus(); return; }
var right = val.toLowerCase().replace(/\s+/g, ' ') === w.w.toLowerCase().trim();
q.res = right ? 'ok' : 'no';
S.reviewWord(w.id, right);
if (right) wb.got++; else wb.miss++;
A.refresh();

var nx = $('#vwQIn');
if (nx && nx.blur) nx.blur();
});
A.act('vw-skip', function () {
var q = wb.quiz;
if (!q) return;
q.res = 'no';
var w = S.wordById(q.id);
if (w) S.reviewWord(w.id, false);
wb.miss++;
A.refresh();
});
A.act('vw-next', function () {
wb.at++;
wb.quiz = null;
A.refresh();
});
A.act('key:vw-quiz', function (el, e) {
if (e.isComposing) return;
if (e.key === 'Enter') {
e.preventDefault();
var q = wb.quiz;
if (q && q.res) { A.acts['vw-next'](); return true; }
A.acts['vw-check']();
return true;
}
});
A.act('input:vw-q', function (el) {
wb.q = el.value.trim();
var body = $('.vw-body');
if (body) body.innerHTML = listHtml();
});
A.act('change:vw-lv', function (el) {
wb.lv = el.value;
A.refresh();
});
A.act('change:vw-sort', function (el) {
wb.sort = el.value;
A.refresh();
});

A.view('words', {
render: wordView,
mount: function (pane) {

var inp = $('#vwQIn', pane);
if (inp && !(wb.quiz && wb.quiz.res)) { try { inp.focus(); } catch (e) { } }
}
});

})(window);
