(function (g) {
'use strict';
function start() {
try {
g.App.boot();
} catch (e) {
console.error('[工作台] 启动失败：', e);
var pane = document.getElementById('pane-overview');
if (pane) {
pane.innerHTML = '<div class="view"><div class="empty"><div class="mark">!</div>' +
'<div class="t">启动出了点问题</div><div class="d">' + (e && e.message ? e.message : '未知错误') + '</div></div></div>';
}
}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
})(window);
