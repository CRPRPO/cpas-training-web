# CPAS虛擬個案晤談蒐證模擬器 V9

## Google Sheet 第一列欄位
送出時間	小組姓名	個案背景	現況說明	職涯問題	CPAS人格特質重點	五大適性工作判斷	領導潛能	顧問建議	晤談素材	完整報告

## Apps Script 程式碼

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
    sheet.appendRow([timestamp, name, background, currentStatus, careerProblem, cpasTraits, aptitude, leadership, recommendation, evidence, fullReport]);
    return ContentService.createTextOutput(JSON.stringify({status: "success", message: "Report received"})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

## 重要
Apps Script 修改後，不能只按儲存。請執行：部署 → 管理部署作業 → 編輯 → 版本選「新增版本」→ 部署。
