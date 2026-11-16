(function (g) {
'use strict';

var S = g.S, A = g.App;
var esc = A.esc, $ = A.$;

var st = {
tab: 'posts',

guest: false,

guestTab: 'home',

plat: 'all',

show: 40,

open: {},

q: ''
};

var PLAT = {
weibo:  { n: '微博',   g: '微', c: '#c0392b' },
xhs:    { n: '小红书', g: '书', c: '#d93a4a' },
zhihu:  { n: '知乎',   g: '知', c: '#2f6b9d' },
douban: { n: '豆瓣',   g: '豆', c: '#2f8b4f' },
wx:     { n: '公众号', g: '公', c: '#2f7d5e' },
bili:   { n: 'B 站',   g: '视', c: '#d9758f' },
github: { n: 'GitHub', g: '码', c: '#4a4a52' },
web:    { n: '网页',   g: '网', c: '#5d6470' },
other:  { n: '其他',   g: '记', c: '#8a7f6d' }
};
function plat(k) { return PLAT[k] || PLAT.other; }

function platOf(url) {
var h = '';
try { h = new URL(String(url || ''), g.location.href).hostname.toLowerCase(); } catch (e) { }
if (/weibo\.(com|cn)$/.test(h)) return 'weibo';
if (/xiaohongshu\.com$|xhslink\.com$/.test(h)) return 'xhs';
if (/zhihu\.com$/.test(h)) return 'zhihu';
if (/douban\.com$/.test(h)) return 'douban';
if (/mp\.weixin\.qq\.com$/.test(h)) return 'wx';
if (/bilibili\.com$|b23\.tv$/.test(h)) return 'bili';
if (/github\.com$/.test(h)) return 'github';
return h ? 'web' : 'other';
}

var arc = { items: [], loaded: false, loading: false, err: '', src: {} };

function archiveUrl() {

var q = (g.location.search || '').replace(/^\?/, '');
var v = g.__GZT_BUILD ? ('v=' + g.__GZT_BUILD) : '';
var qs = [q, v].filter(Boolean).join('&');
return '';
}

function loadArchive() {
arc.loaded = true; return;

if (typeof fetch !== 'function') {
arc.loaded = true;
arc.err = '';
return;
}
arc.loading = true;
fetch(archiveUrl())
.then(function (r) {
if (r.status === 404) return null;

if (!r.ok) throw new Error('HTTP ' + r.status);
return r.json();
})
.then(function (d) {
var list = (d && d.items) || [];
list.forEach(function (x, i) {
x.arc = 1;

if (!x.id) x.id = 'arc:' + (x.url || x.at || i);
});
arc.items = list;
arc.src = (d && d.sources) || {};
arc.loaded = true;
})
.catch(function (e) {
arc.err = (e && e.message) || '读取失败';

arc.loaded = true;
})
.then(function () {
arc.loading = false;
if (A.activeId === 'site') A.refresh();
});
}

function allItems() {
var man = S.db.site.items.slice();
var seen = {};
man.forEach(function (x) { if (x.url) seen[x.url] = 1; });
return arc.items.filter(function (x) { return !seen[x.url]; })
.concat(man)
.sort(function (a, b) { return b.at - a.at; });
}

function arcNote() {
if (!arc.loaded) {
return arc.err
? '<div class="st-arc-note bad">归档没读到（' + esc(arc.err) + '）。手工导入的条目不受影响。</div>'
: '<div class="st-arc-note">正在读取归档…</div>';
}
var w = arc.src && arc.src.weibo;
if (!w || !w.n) return '';
return '<div class="st-arc-note">归档 ' + w.n + ' 条' +
(w.first ? ' · ' + S.ymd(w.first).slice(0, 7) + ' 起' : '') + '</div>';
}

function dt(ts) {
var d = new Date(ts);
return d.getFullYear() + '.' + A.pad(d.getMonth() + 1) + '.' + A.pad(d.getDate()) +
' ' + A.pad(d.getHours()) + ':' + A.pad(d.getMinutes());
}

function posts() {
return S.db.site.posts.slice().sort(function (a, b) {
if (!!a.pin !== !!b.pin) return a.pin ? -1 : 1;
return b.at - a.at;
});
}

function linkify(s) {
return esc(s).replace(/(https?:\/\/[^\s<]+)/g, function (u) {
return '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>';
}).replace(/\n/g, '<br>');
}

function postsHtml() {
var list = posts();
var composer =
'<div class="st-composer">' +

'<textarea id="stNew" class="st-in" rows="2" placeholder="' +
(S.narrow() ? '写一句碎碎念，写完点「贴出去」' : '写一句碎碎念。Ctrl / ⌘ + Enter 贴出去') +
'"></textarea>' +
'<div class="st-comp-foot">' +
'<span class="st-tip">发出去的东西在「访客视角」和导出的网页里都能看见</span>' +
'<button class="btn primary" data-act="st-post">贴出去</button></div>' +
'</div>';

if (!list.length) {
return composer + '<div class="empty"><div class="mark">网</div><div class="t">还没有一句话</div>' +
'<div class="d">上面写一句，就是你的网站的第一条</div></div>';
}
return composer + '<div class="st-stream">' + list.map(function (p) {
return '<article class="st-post' + (p.pin ? ' pinned' : '') + '" data-id="' + p.id + '">' +
(p.pin ? '<span class="st-pin">钉</span>' : '') +
'<div class="st-text">' + linkify(p.text) + '</div>' +
'<div class="st-foot"><span class="st-time">' + dt(p.at) + '</span>' +
'<span class="st-ops">' +
'<button class="st-mini" data-act="st-pin" data-id="' + p.id + '">' + (p.pin ? '取下' : '钉住') + '</button>' +
'<button class="st-mini" data-act="st-edit" data-id="' + p.id + '">改</button>' +
'<button class="st-mini del" data-act="st-del" data-id="' + p.id + '">删</button>' +
'</span></div>' +
'</article>';
}).join('') + '</div>';
}

function aboutHtml() {
var a = S.db.site.about;
return '<div class="st-about">' +
'<div class="st-about-card">' +
'<div class="st-about-head">' +
(a.avatar ? '<img class="st-avatar sm" src="' + esc(a.avatar) + '" alt="">'
: '<div class="st-avatar sm st-avatar-empty">' + esc((a.title || '我').slice(0, 1)) + '</div>') +
'<div class="st-about-h-txt">' +
'<div class="st-about-t">' + esc(a.title || '还没起名') + '</div>' +
(a.handle || a.uid ? '<div class="st-ph-handle">' +
esc([a.handle, a.uid ? 'UID ' + a.uid : '', a.joinedAt ? a.joinedAt.slice(0, 4) + ' 年注册' : '']
.filter(Boolean).join(' · ')) + '</div>' : '') +
'</div></div>' +
'<div class="st-about-i">' + (a.intro ? linkify(a.intro) : '<span class="st-empty">还没写简介</span>') + '</div>' +
(a.links.length ? '<div class="st-links">' + a.links.map(function (l) {
return '<a href="' + esc(S.safeUrl(l.url)) + '" target="_blank" rel="noopener">' + esc(l.label || l.url) + '</a>';
}).join('') + '</div>' : '') +
'<div class="st-about-btns">' +
'<button class="btn" data-act="st-edit-about">改简介与链接</button>' +
'<button class="btn ghost" data-act="st-avatar">' + (a.avatar ? '换头像' : '传一张头像') + '</button>' +
'</div>' +
'</div>' +
'<div class="st-hint">' +
'<div class="st-hint-t">这一页是给外面的人看的</div>' +
'<div class="st-hint-d">碎碎念和简介都会出现在「访客视角」与导出的网页里。' +
'不适合公开的话，别写在这里 —— 日记和笔记才是私房话。</div>' +
'</div></div>';
}

function guestHtml() {
var a = S.db.site.about;
var items = allItems();
var posts = S.db.site.posts.slice();
var title = a.title || (S.db.meta.name ? S.db.meta.name + '的书案' : '我的书案');
var tab = st.guestTab || 'home';

var feedAll = items.map(function (it) { return { k: 'i', at: it.at, it: it }; })
.concat(posts.map(function (p) { return { k: 'p', at: p.at, p: p }; }))
.sort(function (x, y) { return y.at - x.at; });

var counts = {};
items.forEach(function (it) { counts[it.p] = (counts[it.p] || 0) + 1; });
var platLine = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; })
.map(function (k) { return plat(k).n + ' ' + counts[k]; }).join(' · ');

var NAV = [['home', '门面'], ['feed', '全部'], ['about', '关于']];
var nav = '<nav class="st-g-nav">' + NAV.map(function (n) {
return '<button class="' + (tab === n[0] ? 'on' : '') + '" data-act="st-gtab" data-k="' +
n[0] + '">' + n[1] + '</button>';
}).join('') + '</nav>';

var preview = function (arr, render, more) {
return arr.length ? arr.slice(0, 3).map(render).join('') +
(arr.length > 3 ? '<button class="st-g-more" data-act="st-gtab" data-k="' + more + '">' +
'还有 ' + (arr.length - 3) + ' 条 →</button>' : '')
: '<div class="st-page-empty">这一栏还空着。</div>';
};
var homeWorks = preview(items, function (it) {
var P = plat(it.p);
return '<article class="st-page-post">' +
'<div class="st-page-time"><span class="st-page-seal" style="--pc:' + P.c + '">' + P.g + '</span>' +
P.n + ' · ' + dt(it.at) + '</div>' +
(it.title ? '<div class="st-page-title">' + esc(it.title) + '</div>' : '') +
(it.text ? '<div class="st-page-text sm">' + linkify(it.text) + '</div>' : '') +
'</article>';
}, 'feed');
var homePosts = preview(posts, function (p) {
return '<article class="st-page-post">' +
'<div class="st-page-time">' + dt(p.at) + '</div>' +
'<div class="st-page-text">' + linkify(p.text) + '</div></article>';
}, 'feed');

var body;
if (tab === 'home') {
body =
(items.length ? '<section class="st-g-sec"><h2 class="st-g-h">作品<b>' + items.length + '</b></h2>' +
homeWorks + '</section>' : '') +
(posts.length ? '<section class="st-g-sec"><h2 class="st-g-h">碎碎念<b>' + posts.length + '</b></h2>' +
homePosts + '</section>' : '');
} else if (tab === 'about') {
body = '<section class="st-g-sec"><h2 class="st-g-h">关于</h2>' +
(a.intro ? '<p class="st-page-i">' + linkify(a.intro) + '</p>' : '<div class="st-page-empty">还没写一句介绍。</div>') +
(a.links.length ? '<div class="st-links">' + a.links.map(function (l) {
return '<a href="' + esc(S.safeUrl(l.url)) + '" target="_blank" rel="noopener">' + esc(l.label || l.url) + '</a>';
}).join('') + '</div>' : '') +
(platLine ? '<div class="st-ph-stat">' + esc(platLine) + '</div>' : '') +
'</section>';
} else {
var feed = feedAll.slice(0, 60);
var rest = feedAll.length - feed.length;
body = '<section class="st-g-sec"><h2 class="st-g-h">全部<b>' + feedAll.length + '</b></h2>' +
(feed.length ? feed.map(function (x) {
if (x.k === 'p') {
return '<article class="st-page-post">' +
'<div class="st-page-time">' + dt(x.p.at) + '</div>' +
'<div class="st-page-text">' + linkify(x.p.text) + '</div></article>';
}
var it = x.it, P = plat(it.p);
return '<article class="st-page-post">' +
'<div class="st-page-time"><span class="st-page-seal" style="--pc:' + P.c + '">' + P.g + '</span>' +
P.n + ' · ' + dt(it.at) + '</div>' +
(it.title ? '<div class="st-page-title">' + esc(it.title) + '</div>' : '') +
(it.text ? '<div class="st-page-text sm">' + linkify(it.text) + '</div>' : '') +
(it.url ? '<a class="st-page-link" href="' + esc(it.url) + '" target="_blank" rel="noopener">看原帖 ↗</a>' : '') +
'</article>';
}).join('') : '<div class="st-page-empty">还没有话要说。</div>') +
(rest > 0 ? '<div class="st-page-more">往下还有 ' + rest + ' 条 · 全量见归档</div>' : '') +
'</section>';
}

return '<div class="st-guest">' +
'<div class="st-g-bar"><span>访客视角 · 外人看到的就是这一页</span>' +
'<button class="btn ghost" data-act="st-guest-off">回到编辑</button>' +
'<button class="btn" data-act="st-export">导出成网页</button></div>' +
'<div class="st-page">' +
'<header class="st-page-h st-face">' +
'<div class="st-ph-row">' +
(a.avatar ? '<img class="st-avatar" src="' + esc(a.avatar) + '" alt="">'
: '<div class="st-avatar st-avatar-empty">' + esc((title || '我').slice(0, 1)) + '</div>') +
'<div class="st-ph-txt">' +
'<h1>' + esc(title) + '</h1>' +
(a.handle ? '<div class="st-ph-handle">' + esc(a.handle) + '</div>' : '') +
'</div>' +

'<div class="st-face-seal" aria-hidden="true">' + esc((title || '案').slice(0, 1)) + '</div>' +
'</div>' +
(tab === 'about' || a.intro ? '' : '') +
'</header>' +
nav +
body +
'<footer class="st-page-f">' + esc(title) + ' · 记于书案</footer>' +
'</div></div>';
}

function siteView() {
loadArchive();

if (st.guest) return '<div class="view st">' + guestHtml() + '</div>';
var site = S.db.site;
var nP = site.posts.length, nI = allItems().length;
var body = st.tab === 'works' ? worksHtml() : st.tab === 'about' ? aboutHtml() : postsHtml();
return '<div class="view st">' +
'<div class="v-head"><div><div class="v-title">我的网站</div>' +
'<div class="v-sub">' +
(nI ? '作品 ' + nI + ' 条 · ' : '') + '碎碎念 ' + nP + ' 条' +
(site.about.title ? ' · ' + esc(site.about.title) : '') +
'</div></div>' +
'<div class="v-acts">' +
'<button class="btn" data-act="st-guest-on">访客视角</button>' +
'<button class="btn" data-act="st-export">导出网页</button>' +
'</div></div>' +
'<div class="vw-tabs">' +
'<button class="vw-tab' + (st.tab === 'posts' ? ' on' : '') + '" data-act="st-tab" data-k="posts">碎碎念<i>想到就写</i></button>' +
'<button class="vw-tab' + (st.tab === 'works' ? ' on' : '') + '" data-act="st-tab" data-k="works">作品<i>各平台收进来</i></button>' +
'<button class="vw-tab' + (st.tab === 'about' ? ' on' : '') + '" data-act="st-tab" data-k="about">关于我<i>名与去处</i></button>' +
'</div>' +
'<div class="st-body">' + body + '</div>' +
'</div>';
}

function worksHtml() {
var items = allItems();
var count = {};
items.forEach(function (it) { count[it.p] = (count[it.p] || 0) + 1; });
var plats = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; });

var chips = '<div class="st-plats">' +
'<button class="st-plat' + (st.plat === 'all' ? ' on' : '') + '" data-act="st-plat" data-p="all">' +
'全部<b>' + items.length + '</b></button>' +
plats.map(function (k) {
var P = plat(k);
return '<button class="st-plat' + (st.plat === k ? ' on' : '') + '" data-act="st-plat" data-p="' + k + '" ' +
'style="--pc:' + P.c + '"><span class="st-plat-g">' + P.g + '</span>' + P.n + '<b>' + count[k] + '</b></button>';
}).join('') +
'<button class="st-imp-btn" data-act="st-import">＋ 导入</button></div>';

var head = chips + arcNote();

if (!items.length) {
if (!arc.loaded && !arc.err) return head;

return head + '<div class="empty"><div class="mark">作</div><div class="t">还没有收进任何东西</div>' +
'<div class="d">点右上「＋ 导入」贴链接，或者跑一次抓取脚本把平台内容收进归档</div></div>';
}

var list = st.plat === 'all' ? items : items.filter(function (x) { return x.p === st.plat; });
var shown = list.slice(0, st.show);
var rest = list.length - shown.length;
var more = rest > 0
? '<div class="st-more"><button class="btn" data-act="st-more">再看 ' +
Math.min(80, rest) + ' 条<span class="st-more-n">还有 ' + rest + ' 条</span></button></div>'
: (list.length > 40 ? '<div class="st-more-end">到底了 · 共 ' + list.length + ' 条</div>' : '');

return head + '<div class="st-items">' + shown.map(itemHtml).join('') + '</div>' + more;
}

function longText(t) {

var x = String(t || '');
return x.length > 200 || x.split('\n').length > 6;
}

function itemHtml(it) {
var P = plat(it.p);
return '<article class="st-item" style="--pc:' + P.c + '">' +
'<div class="st-i-top">' +
'<span class="st-i-seal">' + P.g + '</span>' +
'<span class="st-i-plat">' + P.n + '</span>' +
'<span class="st-i-time">' + dt(it.at) + '</span>' +
(it.arc ? '' :
'<button class="st-mini del" data-act="st-item-del" data-id="' + it.id + '">删</button>') +
'</div>' +
(it.title ? '<div class="st-i-title">' + esc(it.title) + '</div>' : '') +
(it.text
? '<div class="st-i-text' + (longText(it.text) && !st.open[it.id] ? ' fold' : '') + '">' +
esc(it.text) + '</div>' +
(longText(it.text)
? '<button class="st-fold" data-act="st-fold" data-id="' + esc(it.id) + '">' +
(st.open[it.id] ? '收起' : '展开全文') + '</button>'
: '')
: '') +
(it.url ? '<a class="st-i-link" href="' + esc(it.url) + '" target="_blank" rel="noopener">看原帖 ↗</a>' : '') +
'</article>';
}

function openImport() {
A.modal({
wide: true,
title: '导入平台内容',
body:
'<div class="st-imp-tip">' +
'<b>能贴两种东西：</b><br>' +
'① 一段 JSON —— 一个数组（条目列表），或一个对象（可含 <code>about</code> 与 <code>items</code>）<br>' +
'② 一行一个链接 —— 自动按域名归到微博 / 小红书 / 知乎 / 豆瓣 / 公众号 / B 站，行里别的字当作标题' +
'</div>' +
'<textarea id="stImp" class="st-in" rows="10" spellcheck="false" ' +
'placeholder="https://weibo.com/你的主页/xxxx  今天读了《三国志》&#10;https://www.xiaohongshu.com/explore/xxxx  秋日读书清单&#10;或者直接粘贴一段 JSON"></textarea>' +
'<div class="st-imp-msg" id="stImpMsg"></div>',
foot: '<button class="btn" data-close>算了</button>' +
'<button class="btn primary" data-act="st-import-go">导进来</button>',
onMount: function (m) { setTimeout(function () { var t = m.querySelector('#stImp'); if (t) t.focus(); }, 40); }
});
}

function doImport() {
var box = $('#stImp');
var msg = $('#stImpMsg');
if (!box) return;
var raw = String(box.value || '').trim();
function bad(t) { if (msg) { msg.textContent = t; msg.className = 'st-imp-msg bad'; } }
if (!raw) { bad('先贴点东西进来'); return; }

var added = 0, about = null;
if (raw.charAt(0) === '[' || raw.charAt(0) === '{') {
var obj;
try { obj = JSON.parse(raw); } catch (e) { bad('这段 JSON 读不了：' + e.message); return; }
if (Array.isArray(obj)) {
added = S.addSiteItems(obj).n;
} else {
if (obj.about && typeof obj.about === 'object') about = obj.about;
var arr = Array.isArray(obj.items) ? obj.items
: Array.isArray(obj.posts) ? obj.posts : null;
if (arr) added = S.addSiteItems(arr).n;
if (!arr && !about) { bad('这个对象里既没有 items，也没有 about'); return; }
}
} else {
var lines = raw.split(/\r?\n/).map(function (t) { return t.trim(); }).filter(Boolean);
var arr2 = [];
lines.forEach(function (t, i) {
var m = t.match(/(https?:\/\/\S+)/);
var url = m ? m[1] : '';
if (!url) return;
var title = t.replace(url, '').replace(/^[-–—:：|\s]+/, '').trim();
arr2.push({ p: platOf(url), url: url, title: title || url, text: '', at: Date.now() - i * 1000 });
});
if (!arr2.length) { bad('每行里都没找到链接'); return; }
added = S.addSiteItems(arr2).n;
}
if (about) S.setAbout(about);
if (msg) {
msg.textContent = '收下 ' + added + ' 条' + (about ? '，并更新了「关于我」' : '') +
(added === 0 && !about ? '（都跟已有的重复）' : '');
msg.className = 'st-imp-msg ok';
}
A.toast(added ? ('收下 ' + added + ' 条') : '没有新内容');
st.tab = 'works';
A.refresh();
setTimeout(function () {
var m = document.querySelector('#modalRoot .mask');
if (m && m.close) m.close();
}, 500);
}

function metaDesc(a, title) {
var s = String((a && a.intro) || '').replace(/\s+/g, ' ').trim();
if (s) {
var m = /^[^。！？!?；;]+[。！？!?；;]?/.exec(s);
s = String(m ? m[0] : s).trim();
if (s.length > 80) s = s.slice(0, 79) + '…';
if (s) return s;
}
return title + '：读书笔记、日记与琐事';
}

function buildPage() {
var a = S.db.site.about;
var list = posts();
var title = a.title || (S.db.meta.name ? S.db.meta.name + '的书案' : '我的书案');
var desc = metaDesc(a, title);

var feed = allItems().slice(0, 300).map(function (it) { return { k: 'i', at: it.at, it: it }; })
.concat(list.map(function (p) { return { k: 'p', at: p.at, p: p }; }))
.sort(function (x, y) { return y.at - x.at; });
var body = feed.map(function (x) {
if (x.k === 'p') {
return '<article><div class="t">' + dt(x.p.at) + '</div><div class="x">' + linkify(x.p.text) + '</div></article>';
}
var it = x.it, P = plat(it.p);
return '<article><div class="t"><span class="ps" style="background:' + P.c + '">' + P.g + '</span>' +
P.n + ' · ' + dt(it.at) + '</div>' +
(it.title ? '<div class="h">' + esc(it.title) + '</div>' : '') +
(it.text ? '<div class="x">' + linkify(it.text) + '</div>' : '') +
(it.url ? '<a class="lk" href="' + esc(it.url) + '" target="_blank" rel="noopener">看原帖 ↗</a>' : '') +
'</article>';
}).join('');
return '<!DOCTYPE html>\n<html lang="zh-CN"><head><meta charset="UTF-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'<meta name="description" content="' + esc(desc) + '">' +
'<meta property="og:title" content="' + esc(title) + '">' +
'<meta property="og:description" content="' + esc(desc) + '">' +
'<meta property="og:type" content="website">' +
'<meta property="og:locale" content="zh_CN">' +
'<title>' + esc(title) + '</title><style>' +
'*{box-sizing:border-box}body{margin:0;background:#f7f3ea;color:#2f2a24;' +
'font-family:"Songti SC","SimSun","Noto Serif SC",Georgia,serif;line-height:1.9}' +
'.w{max-width:660px;margin:0 auto;padding:64px 24px 96px}' +
'h1{font-size:30px;font-weight:400;letter-spacing:4px;margin:0 0 18px}' +
'.i{font-size:15px;color:#5d564c;margin:0 0 16px;white-space:normal}' +
'.ls{margin:0 0 44px;display:flex;gap:16px;flex-wrap:wrap}' +
'.ls a{font-size:13px;color:#8a3f2a;text-decoration:none;border-bottom:1px solid #d9cebb}' +
'article{padding:22px 0;border-top:1px solid #e2d9c8}' +
'article .t{font-size:11.5px;color:#9b9384;letter-spacing:1px;margin-bottom:7px;font-family:system-ui,sans-serif}' +
'article .x{font-size:16px;white-space:pre-wrap}' +
'article .x a{color:#8a3f2a}' +
'.av{width:76px;height:76px;border-radius:50%;object-fit:cover;display:block;margin:0 0 18px}' +
'.hd{font-size:12.5px;color:#8a8072;letter-spacing:1.5px;margin:0 0 14px;font-family:system-ui,sans-serif}' +
'.t .ps{display:inline-block;width:15px;height:15px;line-height:15px;text-align:center;' +
'border-radius:2px;color:#fff;font-size:9.5px;margin-right:6px;vertical-align:-1px}' +
'article .h{font-size:17px;color:#2f2a24;margin-bottom:4px}' +
'article .lk{display:inline-block;margin-top:6px;font-size:12px;color:#8a3f2a;' +
'text-decoration:none;border-bottom:1px solid #e0d5c2;font-family:system-ui,sans-serif}' +
'footer{margin-top:56px;font-size:12px;color:#a8a093;letter-spacing:1px;text-align:center}' +
'@media(max-width:520px){.w{padding:36px 18px 64px}h1{font-size:23px}}' +
'</style></head><body><div class="w">' +
(a.avatar ? '<img class="av" src="' + esc(a.avatar) + '" alt="">' : '') +
'<h1>' + esc(title) + '</h1>' +
(a.handle ? '<p class="hd">' + esc(a.handle) + '</p>' : '') +
(a.intro ? '<p class="i">' + linkify(a.intro) + '</p>' : '') +
(a.links.length ? '<div class="ls">' + a.links.map(function (l) {
return '<a href="' + esc(S.safeUrl(l.url)) + '" target="_blank" rel="noopener">' + esc(l.label || l.url) + '</a>';
}).join('') + '</div>' : '') +
(body || '<p class="i">还没有话要说。</p>') +
'<footer>' + esc(title) + ' · 记于书案</footer>' +
'</div></body></html>';
}

function downloadPage() {
var html = buildPage();
var name = (S.db.site.about.title || '我的网站').replace(/[\\/:*?"<>|]/g, '') + '.html';
try {
var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = url; a.download = name;
document.body.appendChild(a); a.click(); a.remove();
setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
A.toast('已导出 · 拿去任何静态托管都能打开');
} catch (e) {
A.toast('这个浏览器不让下载，换个浏览器试试');
}
}

A.act('st-tab', function (el) { st.tab = el.dataset.k; A.refresh(); });
A.act('st-plat', function (el) { st.plat = el.dataset.p; st.show = 40; A.refresh(); });
A.act('st-more', function () { st.show += 80; A.refresh(); });
A.act('st-fold', function (el) {
var k = el.dataset.id;
if (st.open[k]) delete st.open[k]; else st.open[k] = 1;
A.refresh();
});
A.act('st-import', openImport);
A.act('st-import-go', doImport);
A.act('st-item-del', function (el) {
var it = S.db.site.items.filter(function (x) { return x.id === el.dataset.id; })[0];
if (!it) return;
S.delSiteItem(it.id);
A.offerUndo('已删掉这一条', function () {
S.db.site.items.push(it); S.save(); A.refresh();
});
A.refresh();
});
A.act('st-guest-on', function () { st.guest = true; A.refresh(); });
A.act('st-gtab', function (el) { st.guestTab = el.dataset.k; A.refresh(); });
A.act('st-guest-off', function () { st.guest = false; A.refresh(); });
A.act('st-export', function () { downloadPage(); });

function postNow() {
var el = $('#stNew');
if (!el) return;
var t = el.value.trim();
if (!t) { el.focus(); return; }
S.addPost(t);
el.value = '';
A.toast('贴出去了');
A.refresh();
}
A.act('st-post', postNow);

document.addEventListener('keydown', function (e) {
if (!e.target || e.target.id !== 'stNew') return;
if (e.isComposing) return;
if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
e.preventDefault();
postNow();
}
});

A.act('st-del', function (el) {
var p = S.db.site.posts.filter(function (x) { return x.id === el.dataset.id; })[0];
if (!p) return;
S.delPost(p.id);
A.offerUndo('已删掉这条碎碎念', function () {
S.db.site.posts.push(p); S.save(); A.refresh();
});
A.refresh();
});
A.act('st-pin', function (el) {
var p = S.db.site.posts.filter(function (x) { return x.id === el.dataset.id; })[0];
if (!p) return;
S.updatePost(p.id, { pin: !p.pin });
A.toast(p.pin ? '钉住了 · 排在第一条' : '取下来了');
A.refresh();
});
A.act('st-edit', function (el) {
var p = S.db.site.posts.filter(function (x) { return x.id === el.dataset.id; })[0];
if (!p) return;
A.modal({
title: '改这一条',
body: '<textarea id="stEdit" class="st-in big" rows="6">' + esc(p.text) + '</textarea>',
foot: '<button class="btn" data-close>算了</button>' +
'<button class="btn primary" data-act="st-save" data-id="' + p.id + '">改好</button>',
focus: '#stEdit'
});
});
A.act('st-save', function (el, e) {
var ta = $('#stEdit');
if (!ta) return;
var t = ta.value.trim();
if (!t) return;
S.updatePost(el.dataset.id, { text: t });
var mask = e.target.closest('.mask');
if (mask) mask.close();
A.toast('改好了');
A.refresh();
});

function aboutModal() {
var a = S.db.site.about;
var links = a.links.length ? a.links : [{ label: '', url: '' }];
A.modal({
wide: true,
title: '关于我',
body:
'<div class="vw-form">' +
'<label>站点标题<input type="text" id="stATitle" placeholder="唐胡的书案" value="' + esc(a.title) + '"></label>' +
'<label>简介<textarea id="stAIntro" class="st-in" rows="4" placeholder="一句话说清你是谁、这儿写什么">' + esc(a.intro) + '</textarea></label>' +
'<div class="st-link-edit" id="stLinkEdit">' +
links.map(function (l, i) {
return '<div class="st-link-row"><input type="text" class="st-lk-l" placeholder="名字" value="' + esc(l.label || '') + '">' +
'<input type="text" class="st-lk-u" placeholder="https://" value="' + esc(l.url || '') + '"></div>';
}).join('') +
'</div>' +
'<button class="btn ghost" data-act="st-add-link">＋ 加一个链接</button>' +
'</div>',
foot: '<button class="btn" data-close>算了</button>' +
'<button class="btn primary" data-act="st-save-about">存下</button>',
focus: '#stATitle'
});
}

function onAvatarPicked(e) {
var f = e.target.files && e.target.files[0];
if (!f) return;
var fr = new FileReader();
fr.onload = function () {
var img = new Image();
img.onload = function () {
var SZ = 160;
var cv = document.createElement('canvas');
cv.width = cv.height = SZ;
var c = cv.getContext('2d');
var side = Math.min(img.width, img.height);
c.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, SZ, SZ);
S.setAbout({ avatar: cv.toDataURL('image/jpeg', 0.82) });
A.toast('头像换好了');
A.refresh();
};
img.onerror = function () { A.toast('这张图读不了，换一张试试'); };
img.src = fr.result;
};
fr.onerror = function () { A.toast('读不了这个文件'); };
fr.readAsDataURL(f);
}
A.act('st-avatar', function () {
var inp = document.getElementById('stAvaFile');
if (!inp) {
inp = document.createElement('input');
inp.type = 'file';
inp.accept = 'image/*';
inp.id = 'stAvaFile';
inp.style.display = 'none';
document.body.appendChild(inp);
inp.addEventListener('change', onAvatarPicked);
}
inp.value = '';
inp.click();
});

A.act('st-edit-about', aboutModal);
A.act('st-add-link', function () {
var box = $('#stLinkEdit');
if (!box) return;
var d = document.createElement('div');
d.className = 'st-link-row';
d.innerHTML = '<input type="text" class="st-lk-l" placeholder="名字">' +
'<input type="text" class="st-lk-u" placeholder="https://">';
box.appendChild(d);
var first = d.querySelector('input');
if (first) first.focus();
});
A.act('st-save-about', function (el, e) {
var title = ($('#stATitle') || {}).value || '';
var intro = ($('#stAIntro') || {}).value || '';
var links = [];
Array.prototype.forEach.call(document.querySelectorAll('#stLinkEdit .st-link-row'), function (row) {
var l = (row.querySelector('.st-lk-l') || {}).value || '';
var u = (row.querySelector('.st-lk-u') || {}).value || '';
u = u.trim();
if (!u) return;

if (!/^https?:\/\//i.test(u) && !/^mailto:/i.test(u)) u = 'https://' + u;
links.push({ label: l.trim() || u, url: u });
});
S.setAbout({ title: title.trim(), intro: intro.trim(), links: links });
var mask = e.target.closest('.mask');
if (mask) mask.close();
A.toast('存下了');
A.refresh();
});

A.view('site', { render: siteView });

})(window);
