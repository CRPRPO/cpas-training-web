# CPAS虛擬個案晤談蒐證模擬器 V8

## V8更新重點

1. 刪除 Email 寄送按鈕。
2. 刪除複製報告文字與下載 TXT 按鈕。
3. 刪除網頁上給學員看的技術說明文字。
4. 只保留一個主要按鈕：傳送報告給老師。
5. 報告會分欄送入 Google Sheet。

## Google Sheet 第一列欄位

請在 Google Sheet 第一列貼上：

送出時間	小組姓名	個案背景	現況說明	職涯問題	CPAS人格特質重點	五大適性工作判斷	領導潛能	顧問建議	晤談素材	完整報告

## Apps Script 程式碼

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

## 部署 Apps Script

1. 按「部署」
2. 選「新增部署作業」
3. 類型選「網頁應用程式」
4. 執行身分：我
5. 誰可以存取：任何人
6. 按部署並授權
7. 複製 Web App URL，必須以 `/exec` 結尾

## 修改 config.js

打開 `config.js`，找到：

```javascript
const SUBMIT_ENDPOINT = "";
```

改成：

```javascript
const SUBMIT_ENDPOINT = "https://script.google.com/macros/s/你的部署ID/exec";
```

儲存後重新上傳 GitHub。
