# CPAS虛擬個案晤談蒐證模擬器 V7

## V7更新重點

V7把「線上送出給老師」改成細欄位送出，方便 Google Sheet 分欄檢視。

送出欄位包含：

1. 送出時間
2. 小組姓名
3. 個案背景
4. 現況說明
5. 職涯問題
6. CPAS人格特質重點
7. 五大適性工作判斷
8. 領導潛能
9. 顧問建議
10. 晤談素材
11. 完整報告

---

## 一、Google Sheet欄位建議

請建立一個 Google Sheet，第一列建議如下：

送出時間｜小組姓名｜個案背景｜現況說明｜職涯問題｜CPAS人格特質重點｜五大適性工作判斷｜領導潛能｜顧問建議｜晤談素材｜完整報告

---

## 二、Apps Script程式碼

在 Google Sheet 上方選單：

擴充功能 → Apps Script

貼上以下程式碼：

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    const timestamp = e.parameter.timestamp || new Date();
    const name = e.parameter.name || "未填寫";
    const background = e.parameter.background || "";
    const currentStatus = e.parameter.currentStatus || "";
    const careerProblem = e.parameter.careerProblem || "";
    const cpasTraits = e.parameter.cpasTraits || "";
    const aptitude = e.parameter.aptitude || "";
    const leadership = e.parameter.leadership || "";
    const recommendation = e.parameter.recommendation || "";
    const evidence = e.parameter.evidence || "";
    const fullReport = e.parameter.fullReport || "";

    sheet.appendRow([
      timestamp,
      name,
      background,
      currentStatus,
      careerProblem,
      cpasTraits,
      aptitude,
      leadership,
      recommendation,
      evidence,
      fullReport
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "Report received"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 三、部署 Apps Script

1. 按右上角「部署」
2. 選「新增部署作業」
3. 類型選「網頁應用程式」
4. 執行身分：我
5. 誰可以存取：任何人
6. 按部署
7. 授權
8. 複製 Web App URL，通常長這樣：

https://script.google.com/macros/s/一串ID/exec

---

## 四、修改 config.js

打開本資料夾的 config.js。

找到：

```javascript
const SUBMIT_ENDPOINT = "";
```

改成：

```javascript
const SUBMIT_ENDPOINT = "你的AppsScript Web App URL";
```

例如：

```javascript
const SUBMIT_ENDPOINT = "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";
```

下面這段保持預設即可：

```javascript
const SUBMIT_FIELDS = {
  timestamp: "timestamp",
  name: "name",
  background: "background",
  currentStatus: "currentStatus",
  careerProblem: "careerProblem",
  cpasTraits: "cpasTraits",
  aptitude: "aptitude",
  leadership: "leadership",
  recommendation: "recommendation",
  evidence: "evidence",
  fullReport: "fullReport"
};
```

---

## 五、重新上傳 GitHub Pages

修改完 config.js 後，重新上傳或覆蓋 GitHub repo 內的：

- index.html
- style.css
- app.js
- config.js
- data.js
- cpas_profile.js

若有 README 檔案也可以一起上傳，但首頁應該以 index.html 為主。

---

## 六、測試流程

1. 開啟 GitHub Pages 網頁。
2. 開始晤談。
3. 問幾題並加入素材籃。
4. 揭示 CPAS。
5. 進入報告骨架。
6. 填寫小組姓名。
7. 按「線上送出給老師」。
8. 回到 Google Sheet 檢查是否新增一列。

---

## 七、常見問題

### 1. 看不到「線上送出給老師」按鈕
代表 config.js 裡的 SUBMIT_ENDPOINT 還是空白。

### 2. 按了送出，但 Google Sheet 沒有新增
請確認 Apps Script 部署設定：
- 執行身分：我
- 誰可以存取：任何人

### 3. 修改 Apps Script 後仍沒有生效
Apps Script 每次修改程式碼後，要重新「部署」或「管理部署作業」更新版本。

### 4. GitHub Pages 還是舊版
請等待 1～3 分鐘後按 Ctrl + F5 強制重新整理。
