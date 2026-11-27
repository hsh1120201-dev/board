/* 前台與後台共用的工具 */
(function () {
  "use strict";
  var U = (window.U = {});
  U.$ = function (id) { return document.getElementById(id); };
  U.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  U.STATUS = { open: "報名中", feedback: "回饋中", closed: "已結束" };
  var ORDER = { open: 0, feedback: 1, closed: 2 };
  var WD = ["日", "一", "二", "三", "四", "五", "六"];
  U.dparts = function (d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
    if (!m) return { md: "未定", wd: "", full: "日期未定" };
    var dt = new Date(+m[1], +m[2] - 1, +m[3]);
    return { md: +m[2] + "/" + +m[3], wd: "週" + WD[dt.getDay()], full: m[1] + "/" + m[2] + "/" + m[3] + "（" + WD[dt.getDay()] + "）" };
  };
  /* 活動期間：2026/11/20（五）～11/22（日）；沒有迄日就是單日 */
  U.drange = function (a, b) {
    var x = U.dparts(a);
    if (!b || !a || b <= a) return x.full;
    var y = U.dparts(b);
    return x.full + "～" + (a.slice(0, 4) === b.slice(0, 4) ? y.full.slice(5) : y.full);
  };
  U.ftime = function (iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  };
  U.sortActs = function (acts) {
    return acts.slice().sort(function (a, b) {
      var o = (ORDER[a.status] || 0) - (ORDER[b.status] || 0);
      if (o) return o;
      var x = a.date || "", y = b.date || "";
      return a.status === "open" ? (x < y ? -1 : x > y ? 1 : 0) : (x > y ? -1 : x < y ? 1 : 0);
    });
  };
  U.capText = function (a, counts) {
    var n = counts[a.id] || 0;
    return a.capacity > 0 ? "已報名 " + n + " / " + a.capacity + " 人" : "已報名 " + n + " 人";
  };
  var toastT;
  U.toast = function (t) {
    var el = U.$("toast"), d = U.$("dlg");
    var host = d && d.open ? d : document.body; // 對話框開著時，訊息要放進對話框裡才看得到
    if (el.parentNode !== host) host.appendChild(el);
    el.textContent = t;
    el.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove("on"); }, 3600);
  };
  U.configured = function () { return /^https:\/\/script\.google\.com\/.+\/exec$/.test(window.API_URL || ""); };
  /* 用 text/plain 送出，Apps Script 才不會被瀏覽器的跨網域預檢擋下 */
  U.api = function (action, data) {
    var body = JSON.stringify(Object.assign({ action: action }, data || {}));
    return fetch(window.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body })
      .then(function (r) { return r.json(); })
      .catch(function () { throw new Error("連不上伺服器，請檢查網路後再試一次。"); })
      .then(function (j) {
        if (!j.ok) { var e = new Error(j.error || "發生錯誤，請稍後再試。"); e.code = j.code; throw e; }
        return j;
      });
  };
  U.closeDlg = function () { var d = U.$("dlg"); if (d.open) d.close(); };
  U.showDlg = function (html) {
    U.$("dlg-body").innerHTML = html;
    var d = U.$("dlg");
    if (!d.open) { try { d.showModal(); } catch (e) { d.setAttribute("open", ""); } }
  };
  U.head = function (t) {
    return '<div class="dlg-head"><h3 id="dlg-title">' + U.esc(t) + '</h3><button class="x" type="button" data-close aria-label="關閉">✕</button></div>';
  };
  U.fld = function (id, label, val, req, type, extra) {
    return '<label class="f" for="' + id + '"><span>' + label + (req ? " <i>*</i>" : "") + '</span><input id="' + id + '" type="' + (type || "text") +
      '" value="' + U.esc(val == null ? "" : val) + '"' + (req ? " required" : "") + (extra || "") + "></label>";
  };
  /* 回饋問卷：活動沒有自己設定時用這份（與 Code.gs 的 DEFAULT_SURVEY 一致） */
  U.DEFAULT_SURVEY = {"title": "課程滿意度調查", "intro": "這是本次課程的滿意度調查表，謝謝大家參與課程，祝福您事業順利！\n聯絡單位｜新竹社會創新基地（竹北同心樓3樓）\n聯絡電話｜03-5593142 分機 3529", "items": [{"id": "gender", "type": "single", "title": "您的性別：", "required": true, "options": ["男性", "女性", "其他"]}, {"id": "age", "type": "single", "title": "您的年齡區間：", "required": true, "options": ["18歲以下", "19-25歲", "26-35歲", "36-45歲", "46-55歲", "56歲以上"]}, {"id": "m_content", "type": "matrix", "title": "課程內容的安排", "required": true, "options": ["非常滿意", "滿意", "普通", "不滿意", "非常不滿意"], "rows": [{"id": "c_material", "label": "課程教材/投影片"}, {"id": "c_practical", "label": "課程實用性"}, {"id": "c_level", "label": "課程難易度"}, {"id": "c_hours", "label": "課程時數安排"}]}, {"id": "m_teacher", "type": "matrix", "title": "講師授課的情形", "required": true, "options": ["非常滿意", "滿意", "普通", "不滿意", "非常不滿意"], "rows": [{"id": "t_attend", "label": "出席狀況"}, {"id": "t_attitude", "label": "教學態度"}, {"id": "t_express", "label": "表達能力"}, {"id": "t_interact", "label": "互動方式"}, {"id": "t_answer", "label": "回答問題能力"}]}, {"id": "m_admin", "type": "matrix", "title": "相關行政的處理", "required": true, "options": ["非常滿意", "滿意", "普通", "不滿意", "非常不滿意"], "rows": [{"id": "a_promo", "label": "課程宣傳"}, {"id": "a_signup", "label": "報名方式"}, {"id": "a_venue", "label": "場地環境"}, {"id": "a_staff", "label": "人員服務"}]}, {"id": "sugg_host", "type": "text", "title": "對於主辦方的建議：", "required": false}, {"id": "sugg_teacher", "type": "text", "title": "對於講師的建議：", "required": false}, {"id": "note1", "type": "note", "text": "為提供更好的課程內容，請讓我們更了解您一點！\n本問卷蒐集來的資訊，僅會作為內部課程改善使用\n絕不外洩也不會作為其他用途使用，敬請放心填寫！"}, {"id": "again", "type": "slider", "title": "您再次參加主辦方舉辦課程的意願：", "required": true, "min": 0, "max": 100}]};
  U.surveyOf = function (a) { return a && a.survey && a.survey.items ? a.survey : U.DEFAULT_SURVEY; };
  /* 把問卷攤平成一題一欄（矩陣題每一列算一欄） */
  U.surveyFields = function (sv) {
    var f = [];
    (sv.items || []).forEach(function (it) {
      if (it.type === "matrix") (it.rows || []).forEach(function (r) {
        f.push({ key: r.id, head: r.label, group: it.title.replace(/[：:]$/, ""), type: "scale", required: !!it.required, options: it.options });
      });
      else if (it.type !== "note") f.push({ key: it.id, head: it.title.replace(/[：:]$/, ""), type: it.type, required: !!it.required,
        options: it.options, min: it.min, max: it.max, minSel: it.minSel, maxSel: it.maxSel });
    });
    return f;
  };
  /* 評分題的分數：第一個選項分數最高 */
  U.scoreOf = function (options, v) { var i = (options || []).indexOf(v); return i < 0 ? null : options.length - i; };
  /* 信件格式（與 Code.gs 的 mailHtml_ 一致）：**粗體**、[文字](網址)、網址自動連結、單獨一行「-」是分隔線 */
  U.mailHtml = function (text) {
    var h = U.esc(text), links = [];
    h = h.replace(/!\[([^\]\n]*)\]\((https:\/\/[^\s)]+)\)/g, function (_, t, u) { links.push('<img src="' + u + '" alt="' + t + '">'); return "\u0000" + (links.length - 1) + "\u0000"; });
    h = h.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, t, u) { links.push('<a href="' + u + '" target="_blank" rel="noopener">' + t + "</a>"); return "\u0000" + (links.length - 1) + "\u0000"; });
    h = h.replace(/https?:\/\/[^\s<]+/g, function (u) { links.push('<a href="' + u + '" target="_blank" rel="noopener">' + u + "</a>"); return "\u0000" + (links.length - 1) + "\u0000"; });
    h = h.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    h = h.replace(/^[ \t]*-[ \t]*$/gm, "<hr>");
    h = h.replace(/\u0000(\d+)\u0000/g, function (_, i) { return links[+i]; });
    return h.replace(/(<hr>)\n/g, "$1").replace(/\n/g, "<br>");
  };
  /* 公告欄：Google 雲端硬碟分享連結轉成可直接顯示的圖片網址 */
  U.photoUrl = function (u, w) {
    var m = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{20,})/.exec(u || "") || /lh3\.googleusercontent\.com\/d\/([\w-]{20,})/.exec(u || "");
    return m ? "https://lh3.googleusercontent.com/d/" + m[1] + (w ? "=w" + w : "") : u;
  };
  /* 公告欄：YouTube 網址（watch、youtu.be、shorts、live、embed）取出影片 ID */
  U.ytId = function (u) {
    var m = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|live\/|embed\/))([\w-]{11})/.exec(u || "");
    return m ? m[1] : "";
  };
  U.SETUP_NOTE = '<div class="panel"><p><strong>尚未連接資料庫。</strong></p><p class="note">請照「設定步驟」把 Apps Script 網址填進 config.js，再重新整理這個頁面。</p></div>';
})();
