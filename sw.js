/* sw.js —— service worker：让装了 PWA 之后断网还能打开。
 *
 * 构建时会把下面两个占位换掉（ref/build_cloud.py）：
 *   const BUILD  构建号，用来做缓存名 —— 每次发布换一个，旧缓存自动清
 *   const SHELL  要预缓存的文件清单（带 ?v= 版本参数，和页面里引用的完全一致）
 * 注意：注释里不要写出占位符本身（写成"BUILD""SHELL"这种名字就够了），
 * 否则构建时的字符串替换会连注释一起换掉，看着像在讲结果而不是讲规则。
 *
 * 三条策略，各有各的理由：
 *   ① 页面（navigation）走 **network-first**。宁可多等一次网络，也要保证
 *      打开的是最新那版 —— 这个项目最大的历史事故就是"改完看不到"（旧缓存）。
 *      断网时才回退到缓存里的 index.html。
 *   ② 静态资源走 **cache-first，但精确匹配**。URL 里带 ?v=构建号，
 *      所以新版本自然是一批新 URL，不会命中旧条目。**不能对资源用
 *      ignoreSearch** —— 那样 ?v=新的会匹配到 ?v=旧的那条，永远发旧代码。
 *   ③ 只处理同源 GET。云端 API 是跨域的、而且是 POST，一律不碰 ——
 *      要是把存档响应缓存了，断网时会把旧数据当新的推回去，那是丢数据的路子。
 */

const BUILD = '1794823540823';
const SHELL = ["css/theme.css?v=1794823540823", "css/shell.css?v=1794823540823", "css/views.css?v=1794823540823", "css/mobile.css?v=1794823540823", "js/tint.js?v=1794823540823", "js/pinyin-initial.js?v=1794823540823", "js/beach-core.js?v=1794823540823", "js/store.js?v=1794823540823", "js/shell.js?v=1794823540823", "js/views.js?v=1794823540823", "js/extras.js?v=1794823540823", "js/boot.js?v=1794823540823", "./index.html", "manifest.webmanifest", "icons/apple-touch-icon.png?v=1794823540823", "icons/icon-192.png?v=1794823540823", "icons/icon-512.png?v=1794823540823", "icons/icon-maskable-512.png?v=1794823540823", "js/notes.js?v=1794823540823", "js/wordbook.js?v=1794823540823", "js/site.js?v=1794823540823"];

const CACHE = 'gzt-shell-' + BUILD;
const SHELL_PAGE = './index.html';
/* 运行时缓存单独一份。为什么：一旦给"随手存下来的资源"加条数上限，
   被挤掉的很可能正是断网时最需要的预缓存文件。分开之后 shell 那 24 条
   永远不动，超限只淘汰运行时候补的那些。 */
const RT = 'gzt-rt-' + BUILD;
const MAX_RT = 60;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    /* 一个个加，不用 addAll：addAll 是"全成功或全失败"，
       而这张站有访问门禁，某一个文件 403 就会让整个 SW 装不上 ——
       那等于离线能力被一个无关文件拖死。 */
    await Promise.all(SHELL.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok) await c.put(url, res);
      } catch (err) { /* 单个失败不影响整体 */ }
    }));
    /* 这里**不**调 skipWaiting：让它先等着。
       首次安装本来就没有旧 worker 占位，浏览器会直接激活；
       以后每次更新都会停在 waiting，由页面上那条"有新版本了"提示按钮
       发消息过来再切 —— 自动切会 reload，正在写的字就没了。 */
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => (k.indexOf('gzt-shell-') === 0 || k.indexOf('gzt-rt-') === 0) && k !== CACHE && k !== RT)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  /* 页面上的"有新版本，点这里刷新"按钮发过来的 */
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      /* 云端 API / 外链：不碰 */

  /* 归档 JSON 走网络：它是内容源，缓存住了就把"最新"钉死了 */
  if (url.pathname.indexOf('/site-data/') >= 0) return;

  /* 页面回退只有这一处 —— 忽略查询串的宽松匹配也只准在这里用。
     页面可能是 ./?sharecode=xxx 打开的，缓存里存的是 ./index.html；
     而资源那条必须精确匹配（?v= 不同就是不同文件），两边混用会永远发旧代码。 */
  async function pageFallback() {
    const c = await caches.open(CACHE);
    return (await c.match(SHELL_PAGE, { ignoreSearch: true })) || null;
  }

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      let res = null;
      try {
        res = await fetch(req);
        /* 只有 2xx 才算「拿到了页面」。403（口令丢失）、404、5xx 都是
           网关/服务器给的错误页 —— 直接呈现给用户就是"打不开"，
           而我们手里明明有一份能用的缓存。 */
        if (res.ok) return res;
      } catch (err) { /* 断网：直接走缓存 */ }
      const hit = await pageFallback();
      if (hit) return hit;
      if (res) return res;
      return new Response(
          '<!doctype html><meta charset="utf-8"><title>离线</title>' +
          '<body style="font:15px/1.8 -apple-system,\'Microsoft YaHei\',sans-serif;padding:15vh 24px;text-align:center;color:#3a3428">' +
          '<p style="font-size:20px;letter-spacing:2px">现在没网，这一页也还没存下来</p>' +
          '<p style="color:#8a7f6d">联网打开一次之后，就能离线看了。</p></body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    })());
    return;
  }

  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);                     /* 精确匹配，不 ignoreSearch */
    if (hit) return hit;
    const rt = await caches.open(RT);
    const cached = await rt.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok && /\.(js|css|png|jpg|svg|webmanifest|woff2?)$/.test(url.pathname)) {
        /* 写进运行时缓存并限条数。keys() 按插入顺序返回，多出来的
           从最早的开始删 —— 每个 ?v= 都是一条新 entry，不设上限会无限涨。 */
        await rt.put(req, res.clone());
        const keys = await rt.keys();
        if (keys.length > MAX_RT) {
          await Promise.all(keys.slice(0, keys.length - MAX_RT).map(k => rt.delete(k)));
        }
      }
      return res;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'offline' });
    }
  })());
});
