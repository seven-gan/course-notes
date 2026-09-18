/* 在浏览器里跑 Python 的 Web Worker —— 放在 worker 里是为了**能被强制终止**。
 *
 * 为什么必须用 worker：这个仓库的编程页里**故意有死循环例子**
 * （比如 `while i < 3: print("hello")` 忘了自增）。
 * 如果在主线程里跑，用户一试就**整页卡死**，只能关标签页。
 * 放进 worker 后，主线程可以 `terminate()` 把它掐掉。
 *
 * 载入 pyodide 用的是官方 CDN —— 首次要联网（约几 MB），
 * 之后浏览器会缓存。完全离线时主线程会给出明确提示，
 * 并**回退到页面里已有的 output 块**（那些都实跑核对过，可直接对照）。
 */
/* global importScripts, loadPyodide */

var pyodide = null;

function send(type, payload) {
  self.postMessage(Object.assign({ type: type }, payload || {}));
}

self.onmessage = function (ev) {
  var msg = ev.data || {};
  if (msg.cmd === "init") {
    (async function () {
      try {
        send("status", { text: "正在下载运行环境（首次约几 MB，之后会缓存）…" });
        importScripts(msg.url + "pyodide.js");
        pyodide = await loadPyodide({ indexURL: msg.url });
        // 常用的几个包按需加载 —— 只做基础运行，不自动装 numpy
        send("ready", { version: pyodide.version });
      } catch (e) {
        send("error", { text: "运行环境加载失败：" + (e && e.message || e) });
      }
    })();
    return;
  }

  if (msg.cmd === "run") {
    if (!pyodide) { send("error", { text: "运行环境还没准备好" }); return; }
    (async function () {
      var out = [];
      pyodide.setStdout({ batched: function (s) { out.push(s); } });
      pyodide.setStderr({ batched: function (s) { out.push(s); } });
      try {
        await pyodide.runPythonAsync(msg.code);
        send("done", { text: out.join("\n") });
      } catch (e) {
        // 异常也是**有价值的结果**（这仓库里就有 @expect-error 的例子）
        send("done", {
          text: out.join("\n"),
          error: String(e && e.message || e).split("\n").slice(-3).join("\n")
        });
      }
    })();
  }
};
