(function (root) {
'use strict';

var MAX_NAME = 60;
var MAX_URL = 2000;
var MAX_NOTE = 400;
var MAX_CAT = 20;

var CAT_SUGGEST = ['常用', '查资料', '工具', '读', '看', '听'];

function clip(s, n) {
var v = String(s == null ? '' : s).trim();
return v.length > n ? v.slice(0, n) : v;
}

var HAS_SCHEME = /^[a-z][a-z0-9+.\-]*:\/\//i;

var BARE_SCHEME = /^([a-z][a-z0-9+.\-]*):(.*)$/i;

var ALLOWED = { 'http:': 1, 'https:': 1 };

function looksLikeHost(s) {
if (!s || /\s/.test(s)) return false;

var host = s.split(/[\/?#]/)[0].replace(/^.*@/, '').replace(/:\d+$/, '');
if (!host) return false;

if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
if (host === 'localhost') return true;

return /^[^\s.]+(\.[^\s.]+)+$/.test(host) && /[a-z\u00a1-\uffff]{2,}$/i.test(host);
}

function isLocalHost(host) {
if (!host) return false;
if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return true;
if (/^10\./.test(host)) return true;
if (/^192\.168\./.test(host)) return true;
if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
return false;
}

function normalizeUrl(input) {
var raw = String(input == null ? '' : input).trim();
if (!raw) return { ok: false, url: '', host: '', kind: '', error: '网址是空的' };
raw = raw.slice(0, MAX_URL);

raw = raw.replace(/[,，。；;、]+$/, '');

var candidate = raw;
var scheme = '';
if (HAS_SCHEME.test(raw)) {
scheme = raw.toLowerCase().slice(0, raw.indexOf(':') + 1);
} else {

var bm = BARE_SCHEME.exec(raw);
if (bm) {
var after = bm[2];
if (!/^\d+([\/?#]|$)/.test(after)) scheme = bm[1].toLowerCase() + ':';
}
}
if (scheme) {
if (!ALLOWED[scheme]) {
return {
ok: false, url: '', host: '', kind: '',
error: '只收 http / https 开头的网址（' + scheme.replace(':', '') + ' 这种不收）'
};
}
} else if (looksLikeHost(raw)) {

var bare = raw.split(/[\/?#]/)[0].replace(/:\d+$/, '');
candidate = (isLocalHost(bare) ? 'http://' : 'https://') + raw;
} else {

return { ok: false, url: '', host: '', kind: 'search', error: '' };
}

var u;
try { u = new URL(candidate); } catch (e) {
return { ok: false, url: '', host: '', kind: 'search', error: '这个网址读不出来' };
}
if (!ALLOWED[u.protocol]) {
return { ok: false, url: '', host: '', kind: '', error: '只收 http / https 网址' };
}
if (!u.hostname) return { ok: false, url: '', host: '', kind: 'search', error: '' };

return { ok: true, url: u.href, host: u.hostname, kind: 'url', error: '' };
}

function faviconUrl(input) {
var n = typeof input === 'object' && input ? input : normalizeUrl(input);
if (!n || !n.ok) return '';
var origin;
try { origin = new URL(n.url).origin; } catch (e) { return ''; }
return 'https://www.google.com/s2/favicons?sz=64&domain_url=' + encodeURIComponent(origin);
}

var SEARCH_ENGINES = {
bing: 'https://cn.bing.com/search?q=',
baidu: 'https://www.baidu.com/s?wd=',
google: 'https://www.google.com/search?q='
};

function searchUrl(q, engine) {
var s = String(q == null ? '' : q).trim();
if (!s) return '';
var base = SEARCH_ENGINES[engine] || SEARCH_ENGINES.bing;
return base + encodeURIComponent(s);
}

function normCat(v) {
var s = clip(v, MAX_CAT * 6);
if (!s) return '';

s = s.replace(/[,，;；\/]+/g, '、');
var seen = {};
var out = [];
s.split('、').forEach(function (x) {
var t = clip(x, MAX_CAT);
if (!t || seen[t]) return;
seen[t] = 1;
out.push(t);
});
return out.join('、');
}

function catList(cat) {
return String(cat || '').split('、').filter(Boolean);
}

function nameFromHost(host) {
var h = String(host || '').replace(/^www\./i, '');
return h ? h : '未命名';
}

function normalizeEntry(raw) {
if (!raw || typeof raw !== 'object') return null;
var n = normalizeUrl(raw.url);
if (!n.ok) return null;
var at = raw.at ? String(raw.at)
: (raw.ts ? new Date(Number(raw.ts)).toISOString() : '');
var name = clip(raw.name || raw.title, MAX_NAME) || nameFromHost(n.host);
return {
id: String(raw.id || ''),
name: name,
url: clip(n.url, MAX_URL),
host: n.host,
cat: normCat(raw.cat || raw.tag),
note: clip(raw.note, MAX_NOTE),
pinned: raw.pinned === true,
hits: Math.max(0, Math.floor(Number(raw.hits) || 0)),
lastAt: String(raw.lastAt || ''),
at: at,
updatedAt: String(raw.updatedAt || at)
};
}

function stamp(e) {
return String(e.lastAt || e.at || '');
}

function sortEntries(list) {
var arr = Array.isArray(list) ? list.slice() : [];

var pos = new Map();
arr.forEach(function (e, i) { pos.set(e, i); });
arr.sort(function (a, b) {
if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
var sa = stamp(a), sb = stamp(b);
if (sa !== sb) return sa > sb ? -1 : 1;
return pos.get(b) - pos.get(a);
});
return arr;
}

function matches(e, q) {
var s = String(q || '').trim().toLowerCase();
if (!s) return true;
var words = s.split(/\s+/).filter(Boolean);
var hay = [e.name, e.url, e.host, e.cat, e.note].join(' ').toLowerCase();
return words.every(function (w) { return hay.indexOf(w) >= 0; });
}

var PIN = '\u0000pin';

function filterEntries(list, opts) {
var o = opts || {};
var q = String(o.q || '');
var cat = String(o.cat || '');
var out = [];
(Array.isArray(list) ? list : []).forEach(function (e) {
if (cat === PIN) { if (!e.pinned) return; }
else if (cat && catList(e.cat).indexOf(cat) < 0) return;
if (!matches(e, q)) return;
out.push(e);
});
return sortEntries(out);
}

function categories(list) {
var cnt = {};
(Array.isArray(list) ? list : []).forEach(function (e) {
catList(e.cat).forEach(function (c) {
var t = String(c || '').trim();
if (!t) return;
cnt[t] = (cnt[t] || 0) + 1;
});
});
return Object.keys(cnt).sort(function (a, b) {
if (cnt[b] !== cnt[a]) return cnt[b] - cnt[a];
return a.localeCompare(b, 'zh');
}).map(function (k) { return { name: k, n: cnt[k] }; });
}

function stats(list) {
var arr = Array.isArray(list) ? list : [];
var hosts = {};
arr.forEach(function (e) { if (e.host) hosts[e.host] = 1; });
return {
n: arr.length,
hosts: Object.keys(hosts).length,
pinned: arr.filter(function (e) { return e.pinned; }).length,
cats: categories(arr).length
};
}

function glyphOf(it) {
var n = String(it.name || '').trim();
if (n) return n.charAt(0);
var h = String(it.host || '').replace(/^www\./i, '');
return h ? h.charAt(0).toUpperCase() : '·';
}

root.BeachCore = {
MAX_NAME: MAX_NAME, MAX_URL: MAX_URL, MAX_NOTE: MAX_NOTE, MAX_CAT: MAX_CAT,
CAT_SUGGEST: CAT_SUGGEST,
SEARCH_ENGINES: SEARCH_ENGINES,
PIN: PIN,
clip: clip,
looksLikeHost: looksLikeHost,
isLocalHost: isLocalHost,
normalizeUrl: normalizeUrl,
faviconUrl: faviconUrl,
searchUrl: searchUrl,
normCat: normCat,
catList: catList,
nameFromHost: nameFromHost,
normalizeEntry: normalizeEntry,
sortEntries: sortEntries,
matches: matches,
filterEntries: filterEntries,
categories: categories,
stats: stats,
glyphOf: glyphOf
};
})(window);
