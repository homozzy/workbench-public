(function (g) {
'use strict';

var KEY = 'gzt.v2';
var OLD = ['gzt.v1', 'gzt.v1.bak'];
var VERSION = '2.0.0';

var mem = {};
var LS = (function () {
try {
var t = '__gzt_probe__';
window.localStorage.setItem(t, '1');
window.localStorage.removeItem(t);
return window.localStorage;
} catch (e) { return null; }
})();
function lsGet(k) {
if (LS) { try { return LS.getItem(k); } catch (e) {} }
return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
}
function lsSet(k, v) {
if (LS) { try { LS.setItem(k, v); return true; } catch (e) {} }
mem[k] = v;
return false;
}
function lsDel(k) {
if (LS) { try { LS.removeItem(k); } catch (e) {} }
delete mem[k];
}

var MIRRORS = [];
var isHttp = false;

var PAGE_KEY = 'public';
try {
var mKey = /[?&]k=([^&#]*)/.exec(location.search || '');
if (mKey && mKey[1]) PAGE_KEY = decodeURIComponent(mKey[1]);
} catch (e) {}
function withKey(u) {
if (!u || u.indexOf('k=') >= 0) return u;
return u + (u.indexOf('?') < 0 ? '?' : '&') + 'k=' + PAGE_KEY;
}

var localHost = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
var onMirrorPort = false;

/* 同源同步接口：页面由 sync-server.js 托管时，这个地址才通。
   GitHub Pages 上探测会 404，同步自动保持关闭，页面照常本地可用。 */
var SYNC_DATA = 'api/data';
var SYNC_HEALTH = 'api/health';

var syncProbed = false;

/* 有没有可用的同步通道：局域网镜像，或云中转（GitHub Gist / 云服务）。 */
function hasSync() { return MIRRORS.length > 0 || !!cloudAPI(); }

/**
 * 探测同步通道。三种情况：
 *   ① 配了云中转（GZT_CLOUD 已由 cloud-gist.js / 平台注入）→ 直接启用，任何网络都通
 *   ② 页面由 sync-server.js 托管（同源有 /api/health）→ 启用局域网同步
 *   ③ 挂在 GitHub Pages 等静态托管上 → 探测失败，保持关闭，页面照常本地可用
 */
function probeSync() {
if (syncProbed || !g.fetch) return;
syncProbed = true;

/* ① 云中转 */
if (cloudAPI()) {
isHttp = true;
try { startWatch(); } catch (e) {}
try { mirrorPull(); } catch (e) {}
try {
setTimeout(function () {
try { if (diskState === 'empty') mirrorPush(true); } catch (e) {}
}, 2200);
} catch (e) {}
return;
}

/* ② 局域网 */
if (!/^https?:$/.test(location.protocol)) return;

/* 只有本机 / 内网地址、或跑在同步服务默认端口上时，才可能挂着 sync-server。
   公网静态托管（GitHub Pages 等）一定没有，就别白发一个注定 404 的请求 ——
   既在控制台留红字，又多一次无用的往返。 */
function maybeLocalHost() {
var h = String(location.hostname || '').toLowerCase();
if (!h || h === 'localhost' || h === '127.0.0.1' || h === '::1') return true;
if (/\.local$/.test(h)) return true;
if (/^192\.168\./.test(h)) return true;
if (/^10\./.test(h)) return true;
if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
if (String(location.port) === '8731') return true;
/* 手动指定：公网域名上挂了本机服务时，地址后加 ?lan=1 强制探测 */
if (/[?&]lan=1(&|$)/.test(location.search)) return true;
return false;
}
if (!maybeLocalHost()) return;

try {
g.fetch(withKey(SYNC_HEALTH), { cache: 'no-store' })
.then(function (r) { return r.ok ? r.json() : null; })
.then(function (d) {
if (!d || !d.ok) return;
isHttp = true;
MIRRORS.push(withKey(SYNC_DATA));

try { startWatch(); } catch (e) {}
try { mirrorPull(); } catch (e) {}
/* 只有"服务端还是空的"才把本机内容推上去（老设备第一次接入的场景）。
   服务端已有数据时上面那次 pull 会把它载进来，这里不再推，
   避免两边互相触发、白白刷新 stamp。 */
try {
setTimeout(function () {
try { if (diskState === 'empty') mirrorPush(true); } catch (e) {}
}, 2200);
} catch (e) {}
}).catch(function () { });
} catch (e) { }
}

var roomEmpty = !((function () { try { return lsGet(KEY) || ''; } catch (e) { return ''; } })()).length;
var mirrorBusy = false;

var mirrorReady = false;

var diskState = null;

var pullTried = false;

var mirrorRefused = '';

var refusedStatus = 0;

var activeMirror = '';

var pushTimer = null;
var pushPending = false;
var pushed = '';

var pushedObj = null;

var dirtyLocal = false;

var lastRaw = '';

var myStamp = 0;
var idleCbs = [];
var loading = false;

function cloudAPI() {
return (g.GZT_CLOUD && g.GZT_CLOUD.on) ? g.GZT_CLOUD : null;
}

function tryFetch(urls, opts) {
var C = cloudAPI();
if (C && C.transfer) {

try {
return C.transfer(opts).then(function (r) { return r || null; },
function () { return null; });
} catch (e) { return Promise.resolve(null); }
}
return new Promise(function (resolve) {
var i = 0;
var failed = null;

(function next() {
if (i >= urls.length) { resolve(opts && opts.report ? failed : null); return; }
var u = urls[i++];
var p;
try { p = g.fetch(u, opts); } catch (e) { next(); return; }
p.then(function (r) {
if (!r.ok) {

if (r.status === 409) {
r.text().then(function (t) { resolve({ status: 409, text: '', url: u, body: t }); },
function () { resolve({ status: 409, text: '', url: u, body: '' }); });
return;
}

failed = { status: r.status, text: '', url: u, body: '' };
next(); return;
}
if (r.status === 204) { resolve({ text: '', url: u, status: 204 }); return; }

r.text().then(function (t) { resolve({ text: t, url: u, status: r.status }); }, next);
}, next);
})();
});
}

var roomFromDisk = false;

function pushAllowed() {

if (corruptBackup) return false;
return !roomEmpty || roomFromDisk || diskState === 'empty';
}

function utf8Bytes(s) {
var n = 0;
for (var i = 0; i < s.length; i++) {
var c = s.charCodeAt(i);
n += c < 0x80 ? 1 : (c < 0x800 ? 2 : 3);
}
return n;
}

function markPushed(txt, obj) {
pushed = txt;
pushedObj = obj || null;
pushPending = false;
dirtyLocal = false;

mirrorReady = true;
repaint();
}

function archiveDiff(cur, base) {
var keys = {};
Object.keys(cur || {}).forEach(function (k) { keys[k] = 1; });
Object.keys(base || {}).forEach(function (k) { keys[k] = 1; });
var patch = {};
var n = 0;
Object.keys(keys).forEach(function (k) {
if (k === 'v' || k === 'version') return;

var a = cur ? cur[k] : undefined;
var b = base ? base[k] : undefined;
var same;
try { same = JSON.stringify(a) === JSON.stringify(b); } catch (e) { same = false; }
if (!same) {
patch[k] = (a === undefined) ? null : a;
n++;
}
});
return n ? patch : null;
}

function mirrorPush(now) {
if ((!MIRRORS.length && !cloudAPI()) || !g.fetch) return;
pushPending = true;
if (mirrorBusy) return;

if (roomEmpty && diskState === 'data' && !roomFromDisk) { pushPending = false; return; }
clearTimeout(pushTimer);
pushTimer = setTimeout(function () {
if (mirrorBusy) return;

if (!pushAllowed()) { pushPending = false; return; }
var txt = lsGet(KEY) || '';
if (!txt || txt === pushed) { pushPending = false; return; }
pushPending = false;
try {
tryFetch(MIRRORS, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: txt,
report: true

}).then(function (r) {

var httpOk = r && typeof r.status === 'number' && r.status >= 200 && r.status < 300;
if (r && r.status === 409) {

mirrorRefused = String(r.body || '').indexOf('shrink') >= 0 ? 'shrink' : 'stale';
updateMirrorNotice();
return;
}
if (httpOk) {
activeMirror = r.url;
mirrorRefused = '';
refusedStatus = 0;
var obj = null;
try { obj = JSON.parse(txt); } catch (e) {}
markPushed(txt, obj);

try {
var rj = JSON.parse(r.text || '');
if (rj && rj.stamp) myStamp = Number(rj.stamp) || 0;
} catch (e) {}
updateMirrorNotice();
} else if (r) {

mirrorRefused = 'http';
refusedStatus = typeof r.status === 'number' ? r.status : 0;
updateMirrorNotice();
}
});
} catch (e) {
}
}, now ? 0 : 250);
}

function mirrorFlush(alive) {
var C = cloudAPI();
if (!MIRRORS.length && !C) return false;
clearTimeout(pushTimer);
var txt = lsGet(KEY) || '';
if (!txt || txt === pushed) return false;

if (!pushAllowed()) return false;

if (C) {
try {
C.push(txt).then(function (r) {
if (r && r.status === 200) {
var o = null;
try { o = JSON.parse(txt); } catch (e) {}
markPushed(txt, o);
} else if (r && r.status === 409) {
mirrorRefused = 'stale';

updateMirrorNotice();
}
}, function () {});
return true;
} catch (e) { return false; }
}

var url = activeMirror || MIRRORS[MIRRORS.length - 1];
var sep = url.indexOf('?') < 0 ? '?' : '&';

if (alive && g.fetch) {
try {
g.fetch(url, {
method: 'POST', headers: { 'Content-Type': 'application/json' }, body: txt
}).then(function (r) {
if (r && r.ok) {
var obj = null;
try { obj = JSON.parse(txt); } catch (e) {}
markPushed(txt, obj);
}
});
return true;

} catch (e) {}
}

var cur = null;
try { cur = JSON.parse(txt); } catch (e) {}
var patch = cur ? archiveDiff(cur, pushedObj) : null;
var body = '';
if (patch) { try { body = JSON.stringify(patch); } catch (e) { body = ''; } }
if (body && utf8Bytes(body) < 50000) {
try {
if (g.navigator && typeof g.navigator.sendBeacon === 'function' &&
g.navigator.sendBeacon(url + sep + 'patch=1', body)) {
markPushed(txt, cur);
return true;
}
} catch (e) {}
}

if (utf8Bytes(txt) < 60000) {
try {
if (g.fetch) {
g.fetch(url, {
method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
body: txt, keepalive: true
}).then(function (r) { if (r.ok) { var o = null; try { o = JSON.parse(txt); } catch (e) {} markPushed(txt, o); } });
pushPending = false;
return true;
}
} catch (e) {}
}

var CH = 18000;
var parts = [];
for (var i = 0; i < txt.length; i += CH) parts.push(txt.slice(i, i + CH));
if (parts.length && parts.length <= 64) {
var cid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
for (var j = 0; j < parts.length; j++) {
var one = false;
try {
one = g.navigator && typeof g.navigator.sendBeacon === 'function' &&
g.navigator.sendBeacon(url + sep + 'cid=' + cid + '&seq=' + j + '&total=' + parts.length, parts[j]);
} catch (e) {}
if (!one) break;
}
}
try {
var xhr = new XMLHttpRequest();
xhr.open('POST', url, false);

xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
xhr.send(txt);
if (xhr.status >= 200 && xhr.status < 300) {
var o2 = null;
try { o2 = JSON.parse(txt); } catch (e) {}
markPushed(txt, o2);
pushPending = false;
return true;
}
} catch (e) {}
return false;
}

if (g.addEventListener) {
g.addEventListener('pagehide', function () { mirrorFlush(false); });
g.addEventListener('beforeunload', function () { mirrorFlush(false); });

g.addEventListener('focus', function () { mirrorPush(); });
g.addEventListener('pageshow', function () { mirrorPush(); });
}
if (g.document && g.document.addEventListener) {
g.document.addEventListener('visibilitychange', function () {
if (g.document.visibilityState === 'hidden') mirrorFlush(true);
else mirrorPush();
});
}

var noticeEl = null;
var noticeShown = '';

var saveFailed = false;
function updateMirrorNotice() {
var msg = '';

if (saveFailed) {
msg = '这次没存进浏览器（可能是空间满了），改动只在这一个页面里，刷新会丢；先在「数据同步」导出一份';
if (msg !== noticeShown) applyNotice(msg);
return;
}
var cloudOn = !!(g.GZT_CLOUD && g.GZT_CLOUD.on);
if (cloudOn) {

if (mirrorRefused === 'shrink') {
msg = '这次的内容比云端少了一大块，为了不丢东西没有覆盖上去。这一页的改动只在本浏览器里 —— 请先在「数据同步」里导出一次，再刷新页面看云端那份';
} else if (mirrorRefused === 'stale') {
msg = '云端有更新的版本，这次没有覆盖上去（你的改动还留在本浏览器里）—— 刷新页面就能载入云端那份';
} else if (mirrorRefused === 'http') {
msg = '这次没存到云端' + (refusedStatus ? '（HTTP ' + refusedStatus + '）' : '（网络失败）') +
'，改动只在这个浏览器里；下次改动会再试，也可以先在「数据同步」里导出一份';
}
if (msg === noticeShown) return;
applyNotice(msg);
return;
}
if (mirrorRefused === 'http') {

msg = '这次没存到服务器' + (refusedStatus ? '（HTTP ' + refusedStatus + '）' : '（网络失败）') +
'，改动还在本机；下次改动会再试，也可以先在「数据同步」里导出一份';
} else if (!LS && !mirrorReady) {
msg = '这个浏览器不允许保存数据，现在敲的内容关掉就丢。换个浏览器或关掉隐私模式再打开';
} else if (!LS) {

msg = '这个浏览器不允许保存数据，改动只在这个页面里；请先在「数据同步」导出一份';
} else if (pullTried && MIRRORS.length && diskState === null) {
msg = '数据只保存在这个浏览器里，换设备或清缓存就看不到了；请定期在「数据同步」导出一份';
}
if (!msg && mirrorRefused === 'shrink') {

msg = '这次的内容比本地存档少了一大块，为了不丢东西没有覆盖上去。这一页的改动只在当前页面里 —— 请先在「数据同步」导出一次';
}
if (!msg && mirrorRefused === 'stale') {
msg = '本地存档比这一页新，这次没有覆盖上去（你的改动还留在这里）—— 刷新页面就能载入';
}
if (msg === noticeShown) return;
applyNotice(msg);
}

function applyNotice(msg) {
noticeShown = msg;
if (!msg) {
if (noticeEl && noticeEl.parentNode) noticeEl.parentNode.removeChild(noticeEl);
noticeEl = null;
return;
}
if (!noticeEl && g.document) {
noticeEl = g.document.createElement('div');
noticeEl.setAttribute('data-gzt-notice', '1');
noticeEl.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;' +
'background:#8a2f2b;color:#fff;font:13px/1.6 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif;' +
'padding:9px 16px;text-align:center;box-shadow:0 -2px 14px rgba(0,0,0,.28)';
}
if (noticeEl) {
noticeEl.textContent = msg;
if (g.document.body && !noticeEl.parentNode) g.document.body.appendChild(noticeEl);
}
}

function settle() {
if (!mirrorBusy) return;
mirrorBusy = false;
pullTried = true;

updateMirrorNotice();
var cbs = idleCbs;
idleCbs = [];
cbs.forEach(function (f) { try { f(); } catch (e) {} });
if (pushPending) mirrorPush();
schedulePullRetry();
}

var pullRetries = 0;
var PULL_RETRY_MAX = 12;

function schedulePullRetry() {
if (!MIRRORS.length || !g.fetch || g.GZT_NO_RETRY) return;
if (diskState === 'data' || roomFromDisk || !roomEmpty) return;
if (db && db.meta && (Number(db.meta.updatedAt) || 0) > 0) return;
if (pullRetries >= PULL_RETRY_MAX) return;
pullRetries++;
setTimeout(function () { if (!mirrorBusy) mirrorPull(); }, 8000);
}

function repaint() {
try { if (g.App && g.App.renderRail) g.App.renderRail(); } catch (e) {}
}

function mirrorPull(force) {
if ((!MIRRORS.length && !cloudAPI()) || !g.fetch) return false;
/* 先确保本机数据已读进内存，否则下面比 updatedAt 时 db 还是 null，
   会被当成"本机什么都没有"，让远端无条件覆盖本机内容。 */
try { load(); } catch (e) {}
if (/[?&]r=1(&|$)/.test(location.search)) {

if (!force) {
try {
var u0 = new URL(location.href);
u0.searchParams.delete('r');
if (g.history && g.history.replaceState) g.history.replaceState(null, '', u0.href);
} catch (e) {}
/* 刚载入过远端那份（地址里带过 r=1）：同步通道本身是好的，
   这里必须把 ready 标上，否则后面的 5 秒轮询会因为 ready=false 一直不跑。 */
mirrorReady = true;
return false;
}
}
mirrorBusy = true;
try {
tryFetch(MIRRORS, { cache: 'no-store' }).then(function (r) {
if (!r) return;

activeMirror = r.url;
var txt = r.text || '';
diskState = txt && txt.length >= 20 ? 'data' : 'empty';
mirrorReady = true;

if (txt && txt.length >= 20) {
try { pushedObj = JSON.parse(txt); } catch (e) {}
} else {
pushedObj = null;

}
if (diskState !== 'data') return;
var remote;
try { remote = JSON.parse(txt); } catch (e) { return; }
if (!remote || !remote.meta || !Array.isArray(remote.notes)) return;
var remoteAt = Number(remote.meta.updatedAt) || 0;
var localAt = db && db.meta ? Number(db.meta.updatedAt) || 0 : 0;

if (remoteAt <= localAt && (localAt > 0 || !roomEmpty)) return;
var stored = lsSet(KEY, txt);

pushed = txt;
pushedObj = remote;
dirtyLocal = false;

myStamp = 0;

roomFromDisk = true;

db = normalize(JSON.parse(txt));
try { if (g.App && g.App.refresh) g.App.refresh(); } catch (e) {}
if (stored) {
var u = new URL(location.href);
u.searchParams.set('r', '1');

location.replace(u.href);
}

}).then(settle, settle);
} catch (e) { settle(); }
setTimeout(settle, 4000);

return true;
}

function mirrorOnIdle(fn) {
if (!mirrorBusy) { try { fn(); } catch (e) {} return; }
idleCbs.push(fn);
}
function storageOk() { return !!LS; }

var remoteTipEl = null;
var seenStamp = 0;

var watchTimer = null;
var softSyncing = false;
var WATCH_MS = 5000;

function hideRemoteTip() {
if (remoteTipEl && remoteTipEl.parentNode) remoteTipEl.parentNode.removeChild(remoteTipEl);
}

function showRemoteTip(msg) {
if (!g.document || !g.document.body) return;
if (!remoteTipEl) {
remoteTipEl = g.document.createElement('div');
remoteTipEl.setAttribute('data-gzt-remote', '1');
remoteTipEl.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);' +
'z-index:2147483646;background:#2f4a3f;color:#f2efe6;cursor:pointer;' +
'font:13px/1.5 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif;' +
'padding:8px 16px;border-radius:999px;box-shadow:0 4px 18px rgba(0,0,0,.25)';
remoteTipEl.addEventListener('click', function () {
hideRemoteTip();
try { pullSoft(true); } catch (e) {}
});
}
remoteTipEl.textContent = msg || '磁盘上有别的设备改过的内容 · 点这里载入';
if (!remoteTipEl.parentNode) g.document.body.appendChild(remoteTipEl);
}

function pendingLocal() {
return dirtyLocal;
}

function canAutoSync() {
var why = 'ok';
if (!db) why = 'no-db';
else if (mirrorBusy) why = 'busy';

else if (dirtyLocal) why = 'dirty';

else {
var d = g.document;
if (!d) why = 'no-doc';
else if (d.querySelector && d.querySelector('.mask')) why = 'mask';

else {
var ae = d.activeElement;
/* 首启的「给工作台起个名字」浮层也带输入框，但它不是在写内容，
   不该因为它挡着就不同步。 */
var inRename = !!(ae && ae.closest && ae.closest('#rename-overlay'));
if (ae && !inRename && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName || '')) why = 'typing';
}
}
try { g.__gztWhy = why; } catch (e) {}
return why === 'ok';
}

function softSync(txt) {
var remote;
try { remote = JSON.parse(txt); } catch (e) { return false; }
if (!remote || !remote.meta || !Array.isArray(remote.notes)) return false;
var pane = g.document && g.document.querySelector('.pane.active');
var sc = pane ? pane.scrollTop : 0;
lsSet(KEY, txt);
pushed = txt;
pushedObj = JSON.parse(txt);

roomFromDisk = true;
db = normalize(JSON.parse(txt));
try { if (g.App && g.App.refresh) g.App.refresh(); } catch (e) {}
var pane2 = g.document && g.document.querySelector('.pane.active');
if (pane2 && sc) pane2.scrollTop = sc;
try { if (g.App && g.App.toast) g.App.toast('已跟上另一台设备的改动'); } catch (e) {}
return true;
}

function pullSoft(manual) {
if (softSyncing || !hasSync() || !g.fetch) return false;
softSyncing = true;
tryFetch(MIRRORS, { cache: 'no-store' }).then(function (r) {
softSyncing = false;
if (!r || !r.text || r.text.length < 20) return;
if (r.text === pushed) {

myStamp = seenStamp;
hideRemoteTip();
return;
}
var remote;
try { remote = JSON.parse(r.text); } catch (e) { return; }
if (!remote || !remote.meta || !Array.isArray(remote.notes)) return;

if (!manual && db && db.meta
&& String(remote.meta.updatedAt || '') === String(db.meta.updatedAt || '')
&& remote.notes.length === (db.notes || []).length) {
pushed = r.text;
try { pushedObj = JSON.parse(r.text); } catch (e) {}
myStamp = seenStamp;
hideRemoteTip();
return;
}
if (!manual && !canAutoSync()) { showRemoteTip(); return; }
if (manual) {

hideRemoteTip();
mirrorPull(true);
return;
}
if (softSync(r.text)) {
myStamp = seenStamp;
hideRemoteTip();
}
}, function () { softSyncing = false; });
return true;
}

function checkRemoteOnce() {
if (!isHttp || !mirrorReady || !g.fetch) return;
if (g.document && g.document.visibilityState === 'hidden') return;

var C = cloudAPI();
if (C) {
try {
C.stamp().then(function (st) {
st = Number(st) || 0;
if (!st) return;

seenStamp = st;
if (st === myStamp) { hideRemoteTip(); return; }
if (canAutoSync()) pullSoft(false);
else {
showRemoteTip(pendingLocal()
? '别的设备也改过；这边还有没存上的改动 · 点这里载入云端那份'
: '云端有别的设备改过的内容 · 点这里载入');
}
}, function () {});
} catch (e) {}
return;
}

try {
g.fetch(withKey('api/health'), { cache: 'no-store' })
.then(function (r) { return r.ok ? r.json() : null; })
.then(function (d) {
if (!d || !d.ok) return;
var st = Number(d.stamp) || 0;
if (!st) return;

seenStamp = st;
if (st === myStamp) { hideRemoteTip(); return; }

if (canAutoSync()) pullSoft(false);
else {
showRemoteTip(pendingLocal()
? '别的设备也改过；这边还有没存上的改动 · 点这里载入磁盘那份'
: '磁盘上有别的设备改过的内容 · 点这里载入');
}
}).catch(function () { });
} catch (e) { }
}

function isJsdom() {
try { return /jsdom/i.test((g.navigator && g.navigator.userAgent) || ''); }
catch (e) { return false; }
}

function startWatch() {
if (!isHttp || watchTimer || !g.setInterval || isJsdom()) return;
watchTimer = g.setInterval(function () {
if (g.document && g.document.visibilityState === 'hidden') return;
checkRemoteOnce();
}, WATCH_MS);
}
function stopWatch() {
if (!watchTimer) return;
try { g.clearInterval(watchTimer); } catch (e) {}
watchTimer = null;
}

if (g.addEventListener) {

g.addEventListener('focus', function () { checkRemoteOnce(); startWatch(); });
}
if (g.document && g.document.addEventListener) {
g.document.addEventListener('visibilitychange', function () {
if (g.document.visibilityState === 'visible') {
checkRemoteOnce();
startWatch();

} else {
stopWatch();

}
});
}
startWatch();

/* 启动时探测同源同步服务：只有 sync-server.js 托管时才打开同步，
   挂在 GitHub Pages 上探测失败，一切照旧（数据仅存本机）。 */
try { probeSync(); } catch (e) {}

var db = null;
var listeners = [];

var corruptBackup = false;
var corruptKey = '';

function uid(p) {
return (p || 'x') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function pad(n) { return String(n).padStart(2, '0'); }
function ymd(d) {
var x = d instanceof Date ? d : new Date(d);
return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
}
function today() { return ymd(new Date()); }
function daysAgo(n) {
var d = new Date();
d.setDate(d.getDate() - n);
return ymd(d);
}
function num(v, d) { var n = Number(v); return isFinite(n) ? n : (d || 0); }

function blank() {
return {
v: 2, version: VERSION,
meta: {
name: '', createdAt: Date.now(), updatedAt: 0, tint: 'xuan', theme: 'auto',
custom: null, cardOrder: [], archive: null, recallOn: true,
wish: '',

era: { name: '', start: 0 },

diaryPaper: 'plain'

},
notes: [], keywords: [], books: [], timeline: [],
todos: [], todosCollapsed: false,
diary: {}, ledger: [], docs: [], links: [],

words: [],

site: {
about: { title: '', intro: '', links: [], avatar: '', handle: '', uid: '', joinedAt: '' },
posts: [],

items: []

}
};
}

function load() {
if (db) return db;
loading = true;
try {
var raw = lsGet(KEY);
lastRaw = raw || '';
if (raw) {
try { db = normalize(JSON.parse(raw)); } catch (e) {

try {
corruptKey = KEY + '.corrupt.' + Date.now();
lsSet(corruptKey, raw);
corruptBackup = true;
} catch (e2) {}
db = blank();
}
} else {
db = migrateOld() || blank();
}

save();

if (!roomEmpty) mirrorPush(true);
return db;
} finally {
loading = false;
}
}
function save() {

if (db && db.meta && !loading) {
db.meta.updatedAt = Date.now();
dirtyLocal = true;

}
var txt = JSON.stringify(db, function (k, v) {

if (k === '_dup') return undefined;
return v;
});

var wrote = lsSet(KEY, txt);
var failed = !!LS && !wrote;
if (failed !== saveFailed) {
saveFailed = failed;
updateMirrorNotice();
}
lastRaw = txt;
mirrorPush();
}

function flag(key, val) {
var k = 'gzt.flag.' + key;
if (val === undefined) return lsGet(k) === '1';
if (val) lsSet(k, '1'); else lsDel(k);
return !!val;
}

function raw() { return lsGet(KEY) || ''; }

var pendingExternal = null;

function busyHere() {
try {
var ae = g.document && g.document.activeElement;
if (ae) {
var tag = String(ae.tagName || '').toLowerCase();
if (tag === 'input' || tag === 'textarea' || ae.isContentEditable) return true;
}
} catch (e) { }

try { if (g.App && g.App.modalStack && g.App.modalStack.length) return true; } catch (e) { }
return false;
}

function adoptExternal(txt) {
var next;
try { next = normalize(JSON.parse(txt)); } catch (e) { return false; }
db = next;
lastRaw = txt;
lsSet(KEY, txt);
pendingExternal = null;
hideOtherTabBar();
return true;
}

function otherTabBar(text, btnLabel, onClick, tail) {
try {
if (g.App && g.App.otherTabBar) { g.App.otherTabBar(text, btnLabel, onClick, tail); return; }
} catch (e) { }
try { applyNotice(btnLabel ? (text + btnLabel + (tail || '')) : text); } catch (e) { }
}
function hideOtherTabBar() {
try { if (g.App && g.App.otherTabBarHide) g.App.otherTabBarHide(); } catch (e) { }
}

function onStorage(e) {
if (!e) return;

var isClear = (e.key === null || e.key === undefined);
if (!isClear && e.key !== KEY) return;
if (!isClear && e.newValue != null && e.newValue === lastRaw) return;

if (isClear || e.newValue == null || e.newValue === '') {

otherTabBar('另一个标签把浏览器里的存档清空了。这一页还留着刚才的内容，' +
'刷新页面才会跟着清空 —— 想留着的话，随便改一个字就会重新存回去。', '知道了', hideOtherTabBar, '');
return;
}
if (busyHere()) {
pendingExternal = e.newValue;
otherTabBar('另一个标签也改了内容。这边正在输入，先没换 —— ', '载入那边的', function () {
var t = pendingExternal;
if (!t) return;
if (!adoptExternal(t)) return;
try { if (g.App && g.App.refresh) g.App.refresh(); } catch (e2) { }
try { if (g.App && g.App.toast) g.App.toast('已载入另一个标签的内容', 'ok'); } catch (e2) { }
}, '（会丢掉这边还没存下的字）');
return;
}
if (adoptExternal(e.newValue)) {
try { if (g.App && g.App.refresh) g.App.refresh(); } catch (e2) { }
try { if (g.App && g.App.toast) g.App.toast('另一个标签改了内容，已同步过来', 'ok'); } catch (e2) { }

otherTabBar('另一个标签改了内容，已同步过来。', '', null, '');
setTimeout(function () { if (!pendingExternal) hideOtherTabBar(); }, 4200);
}
}
if (g.addEventListener) g.addEventListener('storage', onStorage);

function commit(silent) {
save();
if (!silent) listeners.forEach(function (fn) { try { fn(db); } catch (e) {} });
}
function onChange(fn) { listeners.push(fn); }

function normalize(d) {
var b = blank();
d = d || {};
Object.keys(b).forEach(function (k) {
if (d[k] === undefined || d[k] === null) d[k] = b[k];
});
d.meta = Object.assign({}, b.meta, d.meta || {});
['notes', 'keywords', 'books', 'timeline', 'todos', 'ledger', 'docs', 'links', 'words'].forEach(function (k) {
d[k] = (Array.isArray(d[k]) ? d[k] : []).filter(function (n) {

if (!n || typeof n !== 'object' || Array.isArray(n)) return false;
return true;
});
});
if (!d.diary || typeof d.diary !== 'object' || Array.isArray(d.diary)) d.diary = {};

if (!d.site || typeof d.site !== 'object' || Array.isArray(d.site)) d.site = { about: {}, posts: [] };
if (!d.site.about || typeof d.site.about !== 'object' || Array.isArray(d.site.about)) d.site.about = {};

d.docs.forEach(function (x) {
if (typeof x.cat !== 'string') x.cat = '';
if (typeof x.opens !== 'number') x.opens = 0;
if (!x.archived) x.archived = false;
});
d.site.about = Object.assign(
{ title: '', intro: '', links: [], avatar: '', handle: '', uid: '', joinedAt: '' },
d.site.about);

if (!Array.isArray(d.site.about.links)) d.site.about.links = [];
d.site.about.links = d.site.about.links.filter(function (n) {
if (!n || typeof n !== 'object' || Array.isArray(n)) return false;
return true;
});
d.site.posts = (Array.isArray(d.site.posts) ? d.site.posts : []).filter(function (n) {
if (!n || typeof n !== 'object' || Array.isArray(n)) return false;
return true;
});
d.site.items = (Array.isArray(d.site.items) ? d.site.items : []).filter(function (n) {
if (!n || typeof n !== 'object' || Array.isArray(n)) return false;
return true;
});

d.site.items.forEach(function (it) {
if (!it.id) it.id = uid('si');
it.p = String(it.p || 'other');
it.kind = String(it.kind || 'post');
it.title = String(it.title == null ? '' : it.title).slice(0, 120);
it.text = String(it.text == null ? '' : it.text).slice(0, 400);
it.url = String(it.url == null ? '' : it.url);
it.cover = String(it.cover == null ? '' : it.cover);
it.at = num(it.at, Date.now());
});

(function () {
var seen = {}, keep = [];
d.site.items.forEach(function (it) {
var k = (it.url || '') + '|' + it.text.slice(0, 40);
if (seen[k]) return;
seen[k] = 1; keep.push(it);
});
d.site.items = keep;
})();
d.site.posts.forEach(function (p) {
if (!p.id) p.id = uid('s');
p.text = String(p.text == null ? '' : p.text);
p.at = num(p.at, Date.now());
});

d.words.forEach(function (w) {
if (!w.id) w.id = uid('v');
w.w = String(w.w == null ? '' : w.w).trim();
w.mean = String(w.mean == null ? '' : w.mean);
w.ph = String(w.ph == null ? '' : w.ph);
w.eg = String(w.eg == null ? '' : w.eg);
w.tag = String(w.tag == null ? '' : w.tag);
w.lv = Math.max(0, Math.min(4, num(w.lv, 0)));
w.addedAt = num(w.addedAt, Date.now());
w.reviewAt = num(w.reviewAt, w.addedAt);
w.ok = num(w.ok, 0);
w.pin = !!w.pin;

w.ng = num(w.ng, 0);
});

(function () {
var seen = {}, keep = [];
d.words.forEach(function (w) {
var k = w.w.toLowerCase();
if (!k) { keep.push(w); return; }
if (seen[k]) return;
seen[k] = 1; keep.push(w);
});
d.words = keep;
})();
d.v = 2;
d.version = VERSION;
d.notes.forEach(function (n) {
if (!Array.isArray(n.caseNotes)) {
n.caseNotes = [];
if (n.review) n.caseNotes.push({ id: uid('c'), content: String(n.review), createdAt: n.updatedAt || n.createdAt || Date.now() });
}
if (n.content == null) n.content = n.text || '';
n.createdAt = num(n.createdAt, Date.now());
n.updatedAt = num(n.updatedAt, n.createdAt);
});
d.keywords.forEach(function (k) { if (!Array.isArray(k.aliases)) k.aliases = []; });

if (g.BeachCore) {
d.links = d.links.map(function (x) {
var n = g.BeachCore.normalizeEntry(x);
if (!n) {

n = {
id: x.id || uid('l'), name: x.name || x.title || '', url: x.url || '',
host: '', cat: x.cat || x.tag || '', note: x.note || '',
pinned: false, hits: 0, lastAt: '', at: x.at || '', updatedAt: ''
};
}
if (!n.id) n.id = uid('l');
return n;
});
}
return d;
}

function migrateOld() {
var raw = null;
for (var i = 0; i < OLD.length && !raw; i++) {
raw = lsGet(OLD[i]);
}
if (!raw) return null;
var o;
try { o = JSON.parse(raw); } catch (e) { return null; }
if (!o || !Array.isArray(o.notes)) return null;

var d = blank();
d.meta.name = (o.meta && o.meta.name) || '';
d.meta.createdAt = (o.meta && o.meta.createdAt) || Date.now();

o.notes.forEach(function (n) {
var content = String(n.text || n.content || '').trim();
if (!content) return;
var note = {
id: n.id || uid('n'),
content: content,
source: n.source || '',
book: n.book || '',
createdAt: num(n.ts, Date.now()),
updatedAt: num(n.ts, Date.now()),
caseNotes: []
};
if (n.review) note.caseNotes.push({ id: uid('c'), content: String(n.review), createdAt: num(n.ts, Date.now()) });
if (n.from) note.from = n.from;
if (n.url) note.url = n.url;
d.notes.push(note);
});
(o.books || []).forEach(function (b) {
d.books.push({
id: b.id || uid('b'), title: b.title || '', author: b.author || '',
category: b.category || '', status: b.status === 'done' ? 'done' : 'reading',
rating: num(b.rating, 0), start: b.start || '', finish: b.finish || '',
note: b.note || '', from: b.from || ''
});
});
(o.timeline || []).forEach(function (t) {
d.timeline.push({
id: t.id || uid('t'), date: t.date || today(), title: t.title || '',
tag: t.tag || '手记', auto: !!t.auto, ref: t.ref || '', edited: true
});
});
Object.keys(o.diary || {}).forEach(function (k) {
var v = o.diary[k];
d.diary[k] = { text: (v && v.text) || '', ts: num(v && v.ts, Date.now()) };
});
(o.ledger || []).forEach(function (x) {
d.ledger.push({ id: x.id || uid('l'), date: x.date || today(), type: x.type === 'in' ? 'in' : 'out', amount: num(x.amount), category: x.category || '其他', note: x.note || '' });
});
(o.docs || []).forEach(function (x) {
d.docs.push({ id: x.id || uid('d'), title: x.title || '无题', content: x.content || '', ts: num(x.ts, Date.now()) });
});
(o.links || []).forEach(function (x) {
var n = g.BeachCore
? g.BeachCore.normalizeEntry(x)
: { id: x.id || uid('l'), name: x.title || '', url: x.url || '', host: '', cat: x.tag || '', note: x.note || '', pinned: false, hits: 0, lastAt: '', at: '', updatedAt: '' };
if (!n) return;
if (!n.id) n.id = uid('l');
d.links.push(n);
});
d.meta.archive = (o.meta && o.meta.archive) || null;
return d;
}

function liveNotes() {
return db.notes.filter(function (n) { return !n.deleted; });
}
function noteById(id) { return db.notes.filter(function (n) { return n.id === id; })[0] || null; }

function bookOfContent(text) {
var m = String(text || '').match(/《([^》]{1,30})》/);
return m ? m[1] : '';
}
function addNote(o) {
var content = String((o && o.content) || '').trim();
if (!content) return null;
var src = String((o && o.source) || '').trim();
var n = {
id: uid('n'), content: content,
source: src, book: (o && o.book) || bookOfContent(content),
createdAt: Date.now(), updatedAt: Date.now(), caseNotes: []
};
if (o && o.from) n.from = o.from;
db.notes.unshift(n);
save(); return n;
}
function updateNote(id, patch) {
var n = noteById(id);
if (!n) return null;
if (patch.content != null) n.content = String(patch.content).trim();
if (patch.source != null) n.source = String(patch.source).trim();
if (patch.book != null) n.book = patch.book;
if (patch.source != null && !n.book) n.book = bookOfContent(patch.source) || bookOfContent(n.content);
n.updatedAt = Date.now();
save(); return n;
}
function delNote(id) {
var n = noteById(id);
if (!n) return null;
n.deleted = true; n.deletedAt = Date.now();
save(); return n;
}
function restoreNote(id) {
var n = noteById(id);
if (!n) return null;
delete n.deleted; delete n.deletedAt;
save(); return n;
}
function addCase(noteId, text) {
var n = noteById(noteId);
var t = String(text || '').trim();
if (!n || !t) return null;
var c = { id: uid('c'), content: t, createdAt: Date.now() };
n.caseNotes.push(c);
n.updatedAt = Date.now();
save(); return c;
}
function delCase(noteId, caseId) {
var n = noteById(noteId);
if (!n) return;
n.caseNotes = n.caseNotes.filter(function (c) { return c.id !== caseId; });
save();
}

function updateCase(noteId, caseId, text) {
var n = noteById(noteId);
if (!n) return false;
var t = String(text || '').trim();
var c = (n.caseNotes || []).filter(function (x) { return x.id === caseId; })[0];
if (!c || !t) return false;
c.content = t;
c.updatedAt = Date.now();
n.updatedAt = Date.now();
save(); return true;
}

function wordsOf(k) {
var out = [k.word];
(k.aliases || []).forEach(function (a) {
if (a && out.indexOf(a) < 0) out.push(a);
});
return out;
}
function findOwner(word) {
var w = String(word || '').trim();
if (!w) return null;
for (var i = 0; i < db.keywords.length; i++) {
if (wordsOf(db.keywords[i]).indexOf(w) >= 0) return db.keywords[i];
}
return null;
}
function addKeyword(word, aliases) {
var w = String(word || '').trim().slice(0, 30);
if (!w) return { ok: false, error: '关键词不能为空' };
if (findOwner(w)) return { ok: false, error: '「' + w + '」已经是一个关键词或其别名了' };
var k = { id: uid('k'), word: w, aliases: aliases || [], createdAt: Date.now() };
db.keywords.push(k); save();
return { ok: true, item: k };
}
function addAlias(kid, word) {
var k = db.keywords.filter(function (x) { return x.id === kid; })[0];
var w = String(word || '').trim().slice(0, 30);
if (!k) return { ok: false, error: '没有这个词' };
if (!w) return { ok: false, error: '别名不能为空' };
if (wordsOf(k).indexOf(w) >= 0) return { ok: false, error: '「' + w + '」本来就在这一条里' };
var owner = findOwner(w);
if (owner) return { ok: false, error: '「' + w + '」已经归「' + owner.word + '」了' };
k.aliases.push(w); save();
return { ok: true };
}

function mergeKeyword(fromId, toId) {
var from = db.keywords.filter(function (k) { return k.id === fromId; })[0];
var to = db.keywords.filter(function (k) { return k.id === toId; })[0];
if (!from || !to) return { ok: false, error: '找不到这两个词' };
if (from.id === to.id) return { ok: false, error: '不能并到自己' };
db.keywords = db.keywords.filter(function (k) { return k.id !== fromId; });
var add = [from.word].concat(from.aliases || []);
add.forEach(function (w) {
if (wordsOf(to).indexOf(w) < 0) to.aliases.push(w);
});
save();
return { ok: true, to: to, moved: add.length };
}

function delKeyword(kid) {
db.keywords = db.keywords.filter(function (k) { return k.id !== kid; });
save();
}

function hitNotes(k) {
var ws = wordsOf(k).map(function (w) { return w.toLowerCase(); });
return liveNotes().filter(function (n) {
var hay = (n.content + ' ' + (n.source || '') + ' ' +
n.caseNotes.map(function (c) { return c.content; }).join(' ')).toLowerCase();
return ws.some(function (w) { return hay.indexOf(w) >= 0; });
});
}
function countCases() {
return liveNotes().reduce(function (s, n) { return s + (n.caseNotes || []).length; }, 0);
}
function notesWithoutCase() {
return liveNotes().filter(function (n) { return !(n.caseNotes || []).length; }).length;
}

function bookByTitle(t) {
return db.books.filter(function (b) { return b.title === t; })[0] || null;
}
function addBook(o) {
var title = String((o && o.title) || '').trim();
if (!title) return null;
var hit = bookByTitle(title);
if (hit) {

try {
Object.defineProperty(hit, '_dup', {
value: true, configurable: true, writable: true, enumerable: false
});
} catch (e) { hit._dup = true; }
return hit;
}
var b = {
id: uid('b'), title: title, author: String((o && o.author) || '').trim(),
category: (o && o.category) || '', status: (o && o.status) === 'done' ? 'done' : 'reading',
rating: num(o && o.rating, 0), start: (o && o.start) || today(),
finish: (o && o.status) === 'done' ? ((o && o.finish) || today()) : '',
note: (o && o.note) || '', from: (o && o.from) || ''
};
db.books.unshift(b); save(); return b;
}
function updateBook(id, patch) {
var b = db.books.filter(function (x) { return x.id === id; })[0];
if (!b) return null;
Object.assign(b, patch);
if (b.status === 'reading') b.finish = '';
save(); return b;
}

function delBook(id) {
var b = db.books.filter(function (x) { return x.id === id; })[0];
if (!b) return null;

var entries = db.timeline.filter(function (t) { return t.ref === 'book:' + b.title; });
removeByRef('book:' + b.title);
db.books = db.books.filter(function (x) { return x.id !== id; });
save();
return { book: b, entries: entries };
}
function restoreBook(book, entries) {
if (!book || !book.id) return null;
if (!db.books.some(function (x) { return x.id === book.id; })) db.books.push(book);
(entries || []).forEach(function (t) {
if (!t || !t.id) return;
if (db.timeline.some(function (x) { return x.id === t.id; })) return;
db.timeline.push(t);
});
db.books.sort(function (a, b) {
return String(b.finish || b.start || '').localeCompare(String(a.finish || a.start || ''));
});
db.timeline.sort(function (a, b) { return String(a.date) < String(b.date) ? 1 : -1; });
save();
return book;
}

function markDone(id, rating) {
var b = db.books.filter(function (x) { return x.id === id; })[0];
if (!b) return null;
b.status = 'done';
if (!b.finish) b.finish = today();
if (rating) b.rating = rating;
b.bulk = false;
syncBooks();
return b;
}
function markReading(id) {
var b = db.books.filter(function (x) { return x.id === id; })[0];
if (!b) return null;
b.status = 'reading'; b.finish = '';
syncBooks();
return b;
}

function upsertAuto(e) {
if (!e || !e.ref) return { changed: false };
var cur = db.timeline.filter(function (t) { return t.ref === e.ref; })[0];
if (cur) {
if (cur.edited) return { changed: false };
if (cur.date === e.date && cur.title === e.title) return { changed: false };
cur.date = e.date; cur.title = e.title; cur.tag = e.tag;
save();
return { changed: true, entry: cur };
}
var item = {
id: uid('t'), date: e.date, title: e.title, tag: e.tag || '读书',
auto: true, ref: e.ref, edited: false
};
db.timeline.push(item); save();
return { changed: true, entry: item };
}
function removeByRef(ref) {
var n = 0;
db.timeline = db.timeline.filter(function (t) {
if (t.ref === ref && !t.edited) { n++; return false; }
return true;
});
if (n) save();
return n;
}
function syncBooks() {
db.books.forEach(function (b) {
if (b.bulk) return;
if (b.status !== 'done' || !b.finish) { removeByRef('book:' + b.title); return; }
upsertAuto({ ref: 'book:' + b.title, date: b.finish, title: '读完《' + b.title + '》', tag: '读书' });
});
}

function takeTodo(item) {
if (!item || !item.done) { if (item) removeByRef('todo:' + item.id); return; }
upsertAuto({
ref: 'todo:' + item.id,
date: ymd(item.doneAt || Date.now()),
title: item.text,
tag: item.cat === 'urgent' ? '手记' : '手记'
});
}
function addEntry(o) {
var title = String((o && o.title) || '').trim();
if (!title) return null;
var t = {
id: uid('t'), date: (o && o.date) || today(), title: title,
tag: (o && o.tag) || '手记', auto: !!(o && o.auto), ref: (o && o.ref) || '', edited: false
};
db.timeline.push(t); save(); return t;
}
function updateEntry(id, patch) {
var t = db.timeline.filter(function (x) { return x.id === id; })[0];
if (!t) return null;
Object.assign(t, patch);
if (t.auto) t.edited = true;
save(); return t;
}
function delEntry(id) {
db.timeline = db.timeline.filter(function (x) { return x.id !== id; });
save();
}

function defaultDue() {
var now = new Date();
var d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0);
if (d.getTime() <= now.getTime()) d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0);
return localDT(d);
}
function localDT(d) {
return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function addTodo(cat, text, due) {
var t = String(text || '').trim();
if (!t) return null;
var item = {
id: uid('d'), cat: cat === 'important' ? 'important' : 'urgent',
text: t.slice(0, 200), done: false, createdAt: Date.now(), order: Date.now()
};
if (item.cat === 'urgent') item.due = due || defaultDue();
db.todos.push(item); save(); return item;
}
function toggleTodo(id) {
var t = db.todos.filter(function (x) { return x.id === id; })[0];
if (!t) return null;
t.done = !t.done;
if (t.done) t.doneAt = Date.now(); else delete t.doneAt;
takeTodo(t);
save(); return t;
}
function delTodo(id) {
db.todos = db.todos.filter(function (x) { return x.id !== id; });
save();
}
function updateTodo(id, patch) {
var t = db.todos.filter(function (x) { return x.id === id; })[0];
if (!t) return null;
Object.assign(t, patch); save(); return t;
}

function clearDoneTodos() {
var removed = db.todos.filter(function (t) { return t.done; });
if (!removed.length) return removed;
db.todos = db.todos.filter(function (t) { return !t.done; });
save();
return removed;
}

function restoreTodos(arr) {
if (!Array.isArray(arr) || !arr.length) return 0;
var have = {};
db.todos.forEach(function (t) { have[t.id] = true; });
var added = 0;
arr.forEach(function (t) {
if (!t || typeof t !== 'object' || !t.id || have[t.id]) return;
have[t.id] = true;
var key = Number(t.order || t.createdAt || 0);
var at = -1;
for (var i = 0; i < db.todos.length; i++) {
if (Number(db.todos[i].order || db.todos[i].createdAt || 0) > key) { at = i; break; }
}
if (at < 0) db.todos.push(t); else db.todos.splice(at, 0, t);
added++;
});
if (added) save();
return added;
}

function moveTodo(id, beforeId) {
var t = db.todos.filter(function (x) { return x.id === id; })[0];
if (!t) return;
var rest = db.todos.filter(function (x) { return x.id !== id; });
var at = beforeId ? rest.findIndex(function (x) { return x.id === beforeId; }) : -1;
if (at < 0) rest.push(t); else rest.splice(at, 0, t);
db.todos = rest; save();
}

function setDiary(date, text) {
var t = String(text || '');
if (!t.trim()) delete db.diary[date];
else db.diary[date] = { text: t, ts: Date.now() };
save();
}
function addLedger(o) {
var amt = Math.abs(num(o && o.amount));
if (!amt) return null;
var x = {
id: uid('l'), date: (o && o.date) || today(),
type: (o && o.type) === 'in' ? 'in' : 'out',
amount: amt, category: (o && o.category) || '其他', sub: (o && o.sub) || '',
note: (o && o.note) || ''
};
db.ledger.unshift(x); save(); return x;
}

function delLedger(id) {
var x = db.ledger.filter(function (y) { return y.id === id; })[0];
if (!x) return null;
db.ledger = db.ledger.filter(function (y) { return y.id !== id; });
save();
return x;
}
function ledgerNewestFirst(a, b) {
var da = String(a.date || ''), dbDate = String(b.date || '');
if (da !== dbDate) return da < dbDate ? 1 : -1;
return (b.createdAt || 0) - (a.createdAt || 0);
}

function restoreLedger(x) {
if (!x || !x.id) return null;
if (db.ledger.some(function (y) { return y.id === x.id; })) return null;
db.ledger.push(x);
db.ledger.sort(ledgerNewestFirst);
save();
return x;
}

function updateLedger(id, patch) {
var x = db.ledger.filter(function (y) { return y.id === id; })[0];
if (!x) return null;
if (patch && patch.amount != null) {
var amt = Math.abs(num(patch.amount));
if (!amt) return null;
x.amount = amt;
}
if (patch && patch.date) x.date = patch.date;
if (patch && patch.type) x.type = patch.type === 'in' ? 'in' : 'out';
if (patch && patch.category != null) x.category = patch.category || '其他';
if (patch && patch.sub != null) x.sub = patch.sub || '';
if (patch && patch.note != null) x.note = patch.note || '';
save(); return x;
}
function addDoc(title, content, cat) {
var d = { id: uid('w'), title: String(title || '无题').trim() || '无题', content: content || '',
ts: Date.now(), cat: String(cat || '').trim(), opens: 0, archived: false };
db.docs.unshift(d); save(); return d;
}

function openDoc(id) {
var d = db.docs.filter(function (x) { return x.id === id; })[0];
if (!d) return null;
d.opens = (d.opens || 0) + 1;
d.lastOpen = Date.now();
save(); return d;
}
function updateDoc(id, patch) {
var d = db.docs.filter(function (x) { return x.id === id; })[0];
if (!d) return null;
Object.assign(d, patch, { ts: Date.now() }); save(); return d;
}
function delDoc(id) {
db.docs = db.docs.filter(function (x) { return x.id !== id; });
save();
}

var LV_NAME = ['初见', '在学', '将熟', '已熟', '烂熟'];
var LV_GAP = [1, 2, 4, 9, 21];

var DAY = 86400000;

function wordById(id) {
return db.words.filter(function (x) { return x.id === id; })[0] || null;
}
function findWord(w) {
var k = String(w || '').trim().toLowerCase();
if (!k) return null;
return db.words.filter(function (x) { return x.w.toLowerCase() === k; })[0] || null;
}
function addWord(o) {
o = o || {};
var w = String(o.w || '').trim();
if (!w) return null;
var dup = findWord(w);
if (dup) {

['ph', 'mean', 'eg', 'tag'].forEach(function (k) {
if (!dup[k] && o[k]) dup[k] = String(o[k]).trim();
});
save(); return dup;
}
var n = {
id: uid('v'), w: w,
ph: String(o.ph || '').trim(), mean: String(o.mean || '').trim(),
eg: String(o.eg || '').trim(), tag: String(o.tag || '').trim(),
lv: Math.max(0, Math.min(4, num(o.lv, 0))),
addedAt: Date.now(), reviewAt: Date.now(), ok: 0, ng: 0
};
db.words.push(n); save(); return n;
}
function updateWord(id, patch) {
var w = wordById(id);
if (!w) return null;
Object.assign(w, patch || {});
w.w = String(w.w || '').trim() || w.w;
w.lv = Math.max(0, Math.min(4, num(w.lv, 0)));
var dup = findWord(w.w);

if (dup && dup.id !== w.id) {
dup.lv = Math.max(dup.lv, w.lv);
dup.ok += w.ok; dup.ng += w.ng;
['ph', 'mean', 'eg', 'tag'].forEach(function (k) { if (!dup[k] && w[k]) dup[k] = w[k]; });
db.words = db.words.filter(function (x) { return x.id !== w.id; });
save(); return dup;
}
save(); return w;
}
function delWord(id) {
db.words = db.words.filter(function (x) { return x.id !== id; });
save();
}
function reviewWord(id, ok) {
var w = wordById(id);
if (!w) return null;
if (ok) {
w.ok++;
var to = Math.min(4, w.lv + 1);

w.reviewAt = Date.now() + LV_GAP[to] * DAY;
w.lv = to;
} else {
w.ng++;
w.lv = Math.max(0, w.lv - 1);
w.reviewAt = Date.now() + 10 * 60000;
}
save(); return w;
}

function wordsDue(now) {
var t = now || Date.now();
return db.words.filter(function (w) { return w.lv < 4 && num(w.reviewAt, 0) <= t; });
}

function todayWord() {
if (!db.words.length) return null;
var pool = db.words.filter(function (w) { return w.lv < 4; });
if (!pool.length) pool = db.words;
var seed = parseInt(today().replace(/-/g, ''), 10) || 1;
var i = (seed * 2654435761 % 4294967296) % pool.length;
return pool[i] || pool[0];
}
function wordStats() {
var st = { total: db.words.length, due: 0, lv: [0, 0, 0, 0, 0], mastered: 0 };
var t = Date.now();
db.words.forEach(function (w) {
st.lv[w.lv] = (st.lv[w.lv] || 0) + 1;
if (w.lv >= 4) st.mastered++;
else if (num(w.reviewAt, 0) <= t) st.due++;
});
return st;
}

function setEra(name, start) {
db.meta.era = {
name: String(name || '').trim().slice(0, 8),
start: Number(start) || new Date().getFullYear()
};
save(); return db.meta.era;
}
function setDiaryPaper(k) {
db.meta.diaryPaper = ['plain', 'lined', 'grid', 'old'].indexOf(k) >= 0 ? k : 'plain';
save(); return db.meta.diaryPaper;
}

function eraYear(y) {
var e = db.meta.era;
if (!e || !e.name) return 0;
var n = Number(y) - Number(e.start) + 1;
return n > 0 ? n : 0;
}

function setWish(t) {
db.meta.wish = String(t || '').slice(0, 60);
save(); return db.meta.wish;
}

function addSiteItems(list) {
if (!Array.isArray(list)) return { ok: true, n: 0 };
var n = 0;
list.forEach(function (o) {
if (!o) return;
var text = String(o.text || o.content || '').slice(0, 400);
var title = String(o.title || '').slice(0, 120);
if (!text && !title) return;
var url = String(o.url || '');
var dup = db.site.items.some(function (x) {
return (url && x.url === url) || (!url && x.text.slice(0, 40) === text.slice(0, 40));
});
if (dup) return;
db.site.items.push({
id: uid('si'),
p: String(o.p || 'other'),
kind: String(o.kind || 'post'),
title: title, text: text, url: url,
cover: String(o.cover || ''),
at: num(o.at, Date.now())
});
n++;
});
if (n) save();
return { ok: true, n: n, total: db.site.items.length };
}
function delSiteItem(id) {
db.site.items = db.site.items.filter(function (x) { return x.id !== id; });
save();
}
function updateSiteItem(id, patch) {
var it = db.site.items.filter(function (x) { return x.id === id; })[0];
if (!it) return null;
Object.assign(it, patch || {});
save(); return it;
}

function safeUrl(u) {
var s = String(u == null ? '' : u).trim();
if (!s) return '';
if (/^(https?:|mailto:)/i.test(s)) return s;
if (/^\/\//.test(s)) return 'https:' + s;

if (/^[\/#.]/.test(s)) return s;

if (/^[\w-]+(\.[\w-]+)+([\/?#]|$)/.test(s)) return 'https://' + s;

return '';

}

function setAbout(patch) {
var p = Object.assign({}, patch || {});
if (Array.isArray(p.links)) {
p.links = p.links.map(function (l) {
var o = Object.assign({}, l || {});
o.url = safeUrl(o.url);
if (!o.label) o.label = o.url;
return o;
}).filter(function (l) { return l.url; });
}
db.site.about = Object.assign({}, db.site.about, p);
save(); return db.site.about;
}
function addPost(text) {
var t = String(text || '').trim();
if (!t) return null;
var p = { id: uid('s'), text: t, at: Date.now(), pin: false };
db.site.posts.unshift(p);
save(); return p;
}
function updatePost(id, patch) {
var p = db.site.posts.filter(function (x) { return x.id === id; })[0];
if (!p) return null;
Object.assign(p, patch || {});
save(); return p;
}
function delPost(id) {
db.site.posts = db.site.posts.filter(function (x) { return x.id !== id; });
save();
}

function linkById(id) {
return db.links.filter(function (x) { return x.id === id; })[0] || null;
}
function addLink(o) {
o = o || {};

var n = g.BeachCore.normalizeEntry({
url: o.url, name: o.name || o.title, cat: o.cat || o.tag, note: o.note
});
if (!n) return null;
n.id = uid('l');
n.at = n.updatedAt = new Date().toISOString();
db.links.push(n); save(); return n;
}
function updLink(id, patch) {
var l = linkById(id);
if (!l) return null;
var merged = Object.assign({}, l, patch || {});
var n = g.BeachCore.normalizeEntry(merged);
if (!n) return null;
n.id = l.id;
n.at = l.at;
n.lastAt = l.lastAt;
n.hits = l.hits;
n.updatedAt = new Date().toISOString();
Object.keys(l).forEach(function (k) { delete l[k]; });
Object.assign(l, n);
save();
return l;
}

function putLink(item) {
if (!item || !item.id) return null;
if (linkById(item.id)) return null;
db.links.push(item); save(); return item;
}
function hitLink(id) {
var l = linkById(id);
if (!l) return null;
l.hits = Math.max(0, Math.floor(Number(l.hits) || 0)) + 1;
l.lastAt = new Date().toISOString();
save();
return l;
}
function pinLink(id, on) {
var l = linkById(id);
if (!l) return null;
l.pinned = !!on; l.updatedAt = new Date().toISOString();
save(); return l;
}
function delLink(id) {
db.links = db.links.filter(function (x) { return x.id !== id; });
save();
}
function clearLinks() {
var removed = db.links.slice();
db.links = [];
save();
return removed;
}

function importArchive(arc, opts) {
if (!arc || !Array.isArray(arc.notes)) return null;
var notes = arc.notes.map(function (n) {
var d = new Date(n.date + 'T12:00:00');
return {
id: uid('n'), content: n.text || '', source: n.source || '',
book: n.book || '', author: n.author || '',
createdAt: d.getTime(), updatedAt: d.getTime(),
caseNotes: [], from: 'weibo', url: n.url || ''
};
});
db.notes = notes.concat(db.notes.filter(function (n) { return n.from !== 'weibo'; }));

var incoming = (arc.books || []).concat(arc.extraBooks || []);
var added = [];
incoming.forEach(function (b) {
if (!b || !b.title) return;
if (bookByTitle(b.title)) return;
if (added.some(function (x) { return x.title === b.title; })) return;
added.push({
id: uid('b'), title: b.title, author: b.author || '', category: b.category || '',
status: b.status === 'done' ? 'done' : 'reading',
rating: 0, start: b.start || '', finish: b.finish || '',
note: b.note || '', from: 'weibo', bulk: true
});
});
db.books = added.concat(db.books);

var tl = (arc.timeline || []).map(function (t) {
return {
id: uid('t'), date: t.date, title: t.title, tag: t.tag || '读书',
auto: true, ref: 'year:' + (t.year || String(t.date).slice(0, 4)), edited: true
};
});
db.timeline = tl.concat(db.timeline);
db.meta.archive = {
title: (arc.meta && arc.meta.title) || '读书录',
source: (arc.meta && arc.meta.source) || '',
from: (arc.meta && arc.meta.from) || '', to: (arc.meta && arc.meta.to) || '',
importedAt: Date.now(),
notes: notes.length, books: added.length, timeline: tl.length,
totalChars: (arc.meta && arc.meta.totalChars) || 0,
years: (arc.meta && arc.meta.years) || []
};
if (!db.meta.name) db.meta.name = '';
if (!opts || !opts.silent) save();
return db.meta.archive;
}
function removeArchive() {
var had = db.meta.archive;
db.notes = db.notes.filter(function (n) { return n.from !== 'weibo'; });
db.books = db.books.filter(function (b) { return b.from !== 'weibo'; });
db.timeline = db.timeline.filter(function (t) { return String(t.ref || '').indexOf('year:') !== 0; });
db.meta.archive = null;
save(); return had;
}

var TAG_RE = /(^|[\s，。；、！？：,.;:!?（(【\[「『“”"'—…])#([\u4e00-\u9fa5A-Za-z0-9_]{1,12})/g;
function parseTags(text) {
var s = String(text == null ? '' : text), out = [], seen = {};
var m;
TAG_RE.lastIndex = 0;
while ((m = TAG_RE.exec(s))) {
var t = m[2];
if (!t || seen[t]) continue;
seen[t] = 1; out.push(t);
}
return out;
}

function tagIndex() {
var bucket = {};
function eat(text) {
parseTags(text).forEach(function (t) { bucket[t] = (bucket[t] || 0) + 1; });
}
liveNotes().forEach(function (n) { eat(n.content); });
db.books.forEach(function (b) { eat((b.title || '') + ' ' + (b.note || '')); });
db.timeline.forEach(function (t) { eat((t.title || '') + ' ' + (t.tag || '') + ' ' + (t.note || '')); });
Object.keys(db.diary).forEach(function (d) { eat((db.diary[d] || {}).text || ''); });
db.docs.forEach(function (d) { eat((d.title || '') + ' ' + (d.content || '')); });
db.links.forEach(function (l) { eat((l.name || '') + ' ' + (l.note || '') + ' ' + (l.cat || '')); });
(db.site.posts || []).forEach(function (p) { eat(p.text || ''); });
return Object.keys(bucket).map(function (t) { return { tag: t, n: bucket[t] }; })
.sort(function (a, b) { return b.n - a.n || (a.tag < b.tag ? -1 : 1); });
}

function stats() {
var notes = liveNotes();
var year = String(new Date().getFullYear());
var readYear = db.books.filter(function (b) { return b.status === 'done' && String(b.finish).slice(0, 4) === year; }).length;
var m = today().slice(0, 7);
var mIn = 0, mOut = 0;
db.ledger.forEach(function (x) {
if (String(x.date).slice(0, 7) !== m) return;
if (x.type === 'in') mIn += x.amount; else mOut += x.amount;
});
var todayChars = notes.filter(function (n) { return ymd(n.createdAt) === today(); })
.reduce(function (s, n) { return s + n.content.length; }, 0);
var docChars = db.docs.reduce(function (s, d) { return s + String(d.content || '').length; }, 0);
return {
notes: notes.length,
cases: countCases(),
noCase: notesWithoutCase(),
keywords: db.keywords.length,
books: db.books.length,
reading: db.books.filter(function (b) { return b.status === 'reading'; }).length,
done: db.books.filter(function (b) { return b.status === 'done'; }).length,
readYear: readYear,
timeline: db.timeline.length,
tlYear: db.timeline.filter(function (t) { return String(t.date).slice(0, 4) === year; }).length,
diary: Object.keys(db.diary).length,
todos: db.todos.filter(function (t) { return !t.done; }).length,
ledgerIn: mIn, ledgerOut: mOut,
docs: db.docs.length, docChars: docChars,
links: db.links.length,
words: db.words.length,
wordsDue: wordsDue().length,
wordsMastered: db.words.filter(function (w) { return w.lv >= 4; }).length,
posts: db.site.posts.length,
siteItems: db.site.items.length,
todayChars: todayChars
};
}

function exportAll() {
var payload = JSON.parse(JSON.stringify(db));
payload.exportedAt = new Date().toISOString();
return payload;
}
function importAll(obj, mode) {
if (!obj || !Array.isArray(obj.notes)) return { ok: false, error: '不像是工作台的数据包' };
var keep = mode === 'merge' ? JSON.parse(JSON.stringify(db)) : null;
var next = normalize(JSON.parse(JSON.stringify(obj)));
if (keep) {

['notes', 'books', 'timeline', 'ledger', 'docs', 'links', 'keywords', 'todos', 'words'].forEach(function (k) {
var ids = {};
keep[k].forEach(function (x) { ids[x.id] = 1; });
next[k].forEach(function (x) { if (!ids[x.id]) keep[k].push(x); });
});

if (!keep.site.posts.length) keep.site.posts = next.site.posts;
if (!keep.site.about.intro) keep.site.about = next.site.about;
Object.keys(next.diary).forEach(function (d) {
if (!keep.diary[d]) keep.diary[d] = next.diary[d];
});
next = keep;
}
db = next;
save();
return { ok: true, counts: { notes: db.notes.length, books: db.books.length, timeline: db.timeline.length } };
}

function reset(keepName) {
var name = keepName && db ? db.meta.name : '';
db = blank();
db.meta.name = name;
save();
}

g.S = {
get db() { return load(); },
load: load, save: save, commit: commit, onChange: onChange, flag: flag, raw: raw,
storageOk: storageOk,

corrupt: function () { return corruptBackup; },

corruptKey: function () { return corruptKey; },

pageKey: function () { return PAGE_KEY; },

narrow: function () {
try { return !!(g.matchMedia && g.matchMedia('(max-width: 760px)').matches); }
catch (e) { return false; }
},
mirror: { pull: mirrorPull, push: mirrorPush, flush: mirrorFlush, onIdle: mirrorOnIdle,
check: checkRemoteOnce, stamp: function () { return myStamp; },
ready: function () { return mirrorReady; } },
uid: uid, ymd: ymd, today: today, daysAgo: daysAgo, pad: pad, num: num, localDT: localDT,
liveNotes: liveNotes, noteById: noteById, addNote: addNote, updateNote: updateNote,
delNote: delNote, restoreNote: restoreNote, addCase: addCase, delCase: delCase, updateCase: updateCase,
bookOfContent: bookOfContent,
wordsOf: wordsOf, findOwner: findOwner, addKeyword: addKeyword, addAlias: addAlias,
delKeyword: delKeyword, mergeKeyword: mergeKeyword, hitNotes: hitNotes,
bookByTitle: bookByTitle, addBook: addBook, updateBook: updateBook, delBook: delBook,
restoreBook: restoreBook,
markDone: markDone, markReading: markReading,
syncBooks: syncBooks, upsertAuto: upsertAuto, removeByRef: removeByRef, takeTodo: takeTodo,
addEntry: addEntry, updateEntry: updateEntry, delEntry: delEntry,
addTodo: addTodo, toggleTodo: toggleTodo, delTodo: delTodo, updateTodo: updateTodo,
clearDoneTodos: clearDoneTodos, restoreTodos: restoreTodos,
moveTodo: moveTodo, defaultDue: defaultDue,
setDiary: setDiary,
addLedger: addLedger, delLedger: delLedger, restoreLedger: restoreLedger,
updateLedger: updateLedger,
addDoc: addDoc, updateDoc: updateDoc, delDoc: delDoc, openDoc: openDoc,
addLink: addLink, delLink: delLink, linkById: linkById, updLink: updLink,
putLink: putLink, hitLink: hitLink, pinLink: pinLink, clearLinks: clearLinks,
wordById: wordById, findWord: findWord, addWord: addWord, updateWord: updateWord,
delWord: delWord, reviewWord: reviewWord, wordsDue: wordsDue, todayWord: todayWord,
wordStats: wordStats, LV_NAME: LV_NAME, LV_GAP: LV_GAP,
setWish: setWish, setEra: setEra, setDiaryPaper: setDiaryPaper, eraYear: eraYear,
safeUrl: safeUrl, parseTags: parseTags, tagIndex: tagIndex,
setAbout: setAbout, addPost: addPost, addSiteItems: addSiteItems,
delSiteItem: delSiteItem, updateSiteItem: updateSiteItem, updatePost: updatePost, delPost: delPost,
importArchive: importArchive, removeArchive: removeArchive,
stats: stats, exportAll: exportAll, importAll: importAll, reset: reset,
blank: blank, VERSION: VERSION
};
})(window);
