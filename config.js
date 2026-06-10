// CPAS互動網頁 V7 設定檔

// 老師收件信箱：Email寄送按鈕會使用這個地址。
const TEACHER_EMAIL = "tzaancv@gmail.com";

// 如果你要用 Google Apps Script 收報告，請設定 SUBMIT_ENDPOINT。
// 預設空白時，系統只會顯示「用Email寄給老師」與「複製報告文字」。
// 設定後，「線上送出給老師」按鈕會出現。
const SUBMIT_ENDPOINT = "https://script.google.com/macros/s/AKfycbzeW5DwXYctCa94xrhHOcExxi1Z3R26h-SexMgwvOJ4xw6kGjqfiCU97Jh5xoJqxto/exec";

// V7 分欄送出欄位名稱。
// 若使用本資料夾 README_V7.txt 提供的 Apps Script，可保持預設。
// 若使用 Google Form，需改成 entry.xxxxx 這類欄位名稱。
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
