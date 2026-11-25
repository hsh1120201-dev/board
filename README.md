# 兩基地進駐團隊公告欄

網址：https://hsh1120201-dev.github.io/board/
管理頁：https://hsh1120201-dev.github.io/board/admin.html （用活動報名後台同一組 Google 帳號登入）

- 未來活動：自動顯示活動報名系統（hsh1120201-dev/activity）裡「報名中」的活動，按「我要報名」直接連到報名頁。
- 公告／參訪／課程、成果花絮（照片＋YouTube 影片）：在管理頁新增，存在報名系統同一份 Google 試算表的「公告欄」工作表，也可以直接在試算表打字新增（照片欄可貼 Google 雲端硬碟分享連結，一行一張）。
- 後端是活動報名系統的 Apps Script（Code.gs 的 board / boardAdmin / savePost / deletePost）。config.js 的 API_URL 要和 activity 網站一致。
- 單篇花絮連結：board/#p-編號；只看單一基地：?base=社創 或 ?base=青創。
