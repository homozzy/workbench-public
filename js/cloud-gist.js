/**
 * 跨网络同步（GitHub 私密 Gist 中转）
 *
 * 为什么要有这一层：本机 sync-server 只能在同一 WiFi 内同步。换网络（4G / 公司 / 家里）
 * 想看到同一份数据，就必须有一个公网可达的中转站。
 * 这里用「你自己 GitHub 账号下的一个私密 Gist」当那个中转站：
 *   - 不用注册任何新服务
 *   - 数据只在你自己的账号里，别人看不到
 *   - 手机、电脑、任何网络，打开同一个网址就是同一份
 *
 * 令牌与 Gist 编号存在本机 localStorage（key: gzt.cloud.gist），不上传任何第三方。
 * 建议用「只勾选 Gists 读写」的细粒度令牌，不要用带 repo 权限的完整令牌。
 *
 * 本文件只负责把 GZT_CLOUD 这个钩子填上，具体什么时候拉、什么时候推，
 * 仍然由 store.js 里原有的 mirrorPull / mirrorPush 那套逻辑决定。
 */

(function (g) {
  'use strict';

  var CFG_KEY = 'gzt.cloud.gist';
  var FILE = 'workbench.json';
  var DESC = '工作台同步 · 私密';
  var API = 'https://api.github.com';

  function readCfg() {
    try {
      var raw = g.localStorage.getItem(CFG_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      return (c && c.token && c.gistId) ? c : null;
    } catch (e) { return null; }
  }

  /* ---------- 同步码：把「令牌 + Gist 编号」打包成一段字符串，换设备粘一次就够 ---------- */

  function encodeCode(c) {
    var s = JSON.stringify({ t: c.token, g: c.gistId });
    try {
      return 'GZT1.' + g.btoa(unescape(encodeURIComponent(s)));
    } catch (e) { return ''; }
  }

  function decodeCode(code) {
    code = String(code || '').trim();
    if (code.indexOf('GZT1.') !== 0) return null;
    try {
      var s = decodeURIComponent(escape(g.atob(code.slice(5))));
      var o = JSON.parse(s);
      if (!o || !o.t || !o.g) return null;
      return { token: String(o.t), gistId: String(o.g) };
    } catch (e) { return null; }
  }

  /* ---------- GitHub API ---------- */

  function hashNum(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return Math.abs(h) || 1;
  }

  function makeClient(c) {
    function authHeaders() {
      return {
        'Authorization': 'Bearer ' + c.token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      };
    }

    /* 每次都拿最新的。
       试过用 If-None-Match 省流量，但 304 时只能复用本地缓存的那份文本，
       一旦缓存的版本和真实版本错位，就会出现"以为是最新、其实没跟上"，
       所以宁可直接读。一次约几百字节，5 秒一轮远低于 GitHub 的限流。 */
    function readGist() {
      return g.fetch(API + '/gists/' + c.gistId, {
        headers: authHeaders(),
        cache: 'no-store'
      }).then(function (r) {
        if (!r.ok) return { status: r.status, text: '', url: 'gist', version: '' };
        return r.json().then(function (j) {
          var f = j.files && j.files[FILE];
          var txt = f ? String(f.content || '') : '';
          var ver = (j.history && j.history[0] && j.history[0].version) || '';
          return { status: 200, text: txt, url: 'gist', version: ver || ('len' + txt.length) };
        });
      });
    }

    function writeGist(txt) {
      var body = { files: {} };
      body.files[FILE] = { content: txt };

      /* 两台设备几乎同时写时，GitHub 会回 409「Gist cannot be updated」。
         这不是失败，是撞车了 —— 退一步重试，最多 3 次。 */
      function attempt(n) {
        return g.fetch(API + '/gists/' + c.gistId, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(body)
        }).then(function (r) {
          if (r.status === 409 && n < 3) {
            return new Promise(function (res) { setTimeout(res, 400 * n); })
              .then(function () { return attempt(n + 1); });
          }
          if (!r.ok) return { status: r.status };
          return r.json().then(function (j) {
            var ver = (j.history && j.history[0] && j.history[0].version) || String(Date.now());
            return { status: 200, text: JSON.stringify({ stamp: hashNum(ver) }) };
          });
        });
      }
      return attempt(1);
    }

    return {
      on: true,
      kind: 'gist',
      /* store.js 的 tryFetch 会先看这个：POST 当写，其余当读 */
      transfer: function (opts) {
        if (opts && opts.method === 'POST') return writeGist(opts.body || '');
        return readGist();
      },
      push: function (txt) { return writeGist(txt); },
      stamp: function () {
        return readGist().then(function (r) {
          return r && r.version ? hashNum(r.version) : 0;
        }, function () { return 0; });
      }
    };
  }

  var cfg = readCfg();
  if (cfg) {
    try { g.GZT_CLOUD = makeClient(cfg); } catch (e) { }
  }

  /* ---------- 给页面用的配置接口 ---------- */

  g.GztCloud = {
    cfg: readCfg,

    connected: function () { return !!readCfg(); },

    /* 用一段输入（令牌 或 同步码）建立连接。返回 Promise<{ok, msg}> */
    connect: function (input) {
      input = String(input || '').trim();
      if (!input) return Promise.resolve({ ok: false, msg: '先贴点东西进来' });

      var code = decodeCode(input);
      if (code) {
        try { g.localStorage.setItem(CFG_KEY, JSON.stringify(code)); } catch (e) { }
        return Promise.resolve({ ok: true, msg: '已连接', reload: true });
      }

      /* 当成令牌：先验证身份，然后「先找后建」。
         这一步很关键 —— 如果每台设备都各建一个新 Gist，
         电脑和手机会指向两个不同的中转站，数据永远对不上。
         所以先翻一遍账号下的 Gist，找到之前建过的那一个就复用。 */
      var h = {
        'Authorization': 'Bearer ' + input,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      };
      return g.fetch(API + '/user', { headers: h })
        .then(function (r) {
          if (!r.ok) throw new Error('令牌无效（HTTP ' + r.status + '）');
          return g.fetch(API + '/gists?per_page=100', { headers: h });
        })
        .then(function (r) {
          if (!r.ok) throw new Error('读不到你的 Gist 列表（HTTP ' + r.status + '），检查令牌是否勾了 gist 权限');
          return r.json();
        })
        .then(function (list) {
          /* 账号下可能有好几个同名的（以前每台设备各建过一次）。
             挑内容最大的那个 —— 空壳只有 11 字节，有数据的那个才该被复用。 */
          var hit = null, best = -1;
          (list || []).forEach(function (it) {
            if (!it || !it.files || !it.files[FILE]) return;
            if (!/工作台同步/.test(String(it.description || ''))) return;
            var size = Number((it.files[FILE] && it.files[FILE].size) || 0);
            if (size > best) { best = size; hit = it.id; }
          });
          if (hit) return { id: hit, reused: true };
          return g.fetch(API + '/gists', {
            method: 'POST',
            headers: h,
            body: JSON.stringify({
              description: DESC,
              public: false,
              /* GitHub 不允许文件内容为空，给个最小占位；
                 客户端判断"空"的门槛是 20 字符，这段不会挡住本机数据上传。 */
              files: (function () { var o = {}; o[FILE] = { content: '{"meta":{}}' }; return o; })()
            })
          }).then(function (r2) {
            if (!r2.ok) throw new Error('建 Gist 失败（HTTP ' + r2.status + '），检查令牌是否勾了 Gists 权限');
            return r2.json();
          }).then(function (j2) { return { id: j2.id, reused: false }; });
        })
        .then(function (got) {
          var c = { token: input, gistId: got.id };
          try { g.localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) { }
          return {
            ok: true,
            msg: got.reused ? '已连上之前建过的那个 Gist' : '已连接',
            reload: true,
            reused: got.reused,
            code: encodeCode(c)
          };
        })
        .catch(function (e) {
          return { ok: false, msg: (e && e.message) || '连接失败' };
        });
    },

    code: function () {
      var c = readCfg();
      return c ? encodeCode(c) : '';
    },

    disconnect: function () {
      try { g.localStorage.removeItem(CFG_KEY); } catch (e) { }
    }
  };

})(window);
