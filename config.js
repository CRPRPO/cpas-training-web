// CPAS互動網頁 V8 設定檔

// 請將 Google Apps Script 部署後取得的 Web App URL 貼在這裡。
// URL 必須以 /exec 結尾。
const SUBMIT_ENDPOINT = "";

// V8 分欄送出欄位名稱。
// 若使用 README_V8.txt 提供的 Apps Script，可保持預設。
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
