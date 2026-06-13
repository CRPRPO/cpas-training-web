
const CATEGORIES = ["個案背景", "現況說明", "過去工作經驗", "求職動機", "求職意願", "求職期待", "不可接受條件", "可妥協條件", "求職行為", "求職態度", "情緒態度", "心理狀態", "職涯問題線索", "可用能力", "工作成就感", "工作價值觀", "經濟壓力", "家庭因素", "限制條件", "求職條件", "求職準備", "行動準備度", "穩定就業風險", "領導潛能", "顧問建議素材", "不保留"];
const MAX_QUESTIONS = 10;
let state = {
  started:false,
  revealed:false,
  current:null,
  asked:[],
  evidence:[],
  seconds:900,
  timer:null,
  filter:"all",
  cpasTab:"short"
};

const $ = id => document.getElementById(id);

function init(){
  $("maxQ").textContent = MAX_QUESTIONS;
  buildFilters();
  buildQuestionList();
  buildCategoryGrid();
  updateBasket();
  updateStatus();
  bindEvents();
  if (typeof SUBMIT_ENDPOINT !== "undefined" && SUBMIT_ENDPOINT && SUBMIT_ENDPOINT.trim() !== "") {
    $("submitOnlineBtn").classList.remove("hidden");
  }
}

function bindEvents(){
  $("startBtn").onclick = start;
  bindCaseModal();
  if($("openCpasSummaryBtnTop")) $("openCpasSummaryBtnTop").onclick = openCpasSummary;
  if($("closeCpasSummaryBtn")) $("closeCpasSummaryBtn").onclick = closeCpasSummary;
  if($("cpasSummaryBackdrop")) $("cpasSummaryBackdrop").onclick = closeCpasSummary;
  if($("goReportBtnTop")) $("goReportBtnTop").onclick = goReportTop;
  $("saveEvidenceBtn").onclick = saveEvidence;
  $("skipBtn").onclick = skipEvidence;
  $("revealBtn").onclick = revealCPAS;
  $("goReportBtn").onclick = showReport;
  $("resetBtn").onclick = () => {
    if(confirm("確定要重新開始？目前紀錄會清除。")) location.reload();
  };
  $("submitOnlineBtn").onclick = submitOnline;
  if($("copyAllBtn")) $("copyAllBtn").onclick = copyAllText;
  if($("downloadPdfBtn")) $("downloadPdfBtn").onclick = downloadPDF;
  if($("clearDraftBtn")) $("clearDraftBtn").onclick = clearDraft;
  bindHelpModal();
  bindDraftAutosave();
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.onclick = () => {
      state.cpasTab = btn.dataset.tab;
      document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      renderCPASText();
    };
  });
}

function start(){
  state.started = true;
  if($("openCaseBtn")) $("openCaseBtn").classList.remove("hidden");
  if($("openJobBtn")) $("openJobBtn").classList.remove("hidden");
  $("introPanel").classList.add("hidden");
  $("appPanel").classList.remove("hidden");
  scrollTopNow();
  startTimer();
}

function startTimer(){
  state.timer = setInterval(() => {
    if(state.seconds > 0 && !state.revealed){
      state.seconds--;
      updateTimer();
    }
  }, 1000);
}

function updateTimer(){
  const m = String(Math.floor(state.seconds/60)).padStart(2,"0");
  const s = String(state.seconds%60).padStart(2,"0");
  $("timer").textContent = `${m}:${s}`;
}

function buildFilters(){
  const sections = [...new Set(QUESTION_BANK.map(q=>q.section))];
  const wrap = document.querySelector(".filters");
  sections.forEach(sec=>{
    const b = document.createElement("button");
    b.className = "chip";
    b.dataset.filter = sec;
    b.textContent = sec;
    b.onclick = () => {
      state.filter = sec;
      document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active"));
      b.classList.add("active");
      buildQuestionList();
    };
    wrap.appendChild(b);
  });
  document.querySelector('[data-filter="all"]').onclick = () => {
    state.filter = "all";
    document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active"));
    document.querySelector('[data-filter="all"]').classList.add("active");
    buildQuestionList();
  };
}

function buildQuestionList(){
  const list = $("questionList");
  list.innerHTML = "";
  QUESTION_BANK.filter(q => state.filter==="all" || q.section===state.filter).forEach(q=>{
    const div = document.createElement("div");
    div.className = "q-card" + (state.asked.includes(q.id) ? " used" : "");
    div.innerHTML = `<div class="meta">${q.id}｜${q.section}</div><div class="qtext">${q.q}</div>`;
    div.onclick = () => chooseQuestion(q.id);
    list.appendChild(div);
  });
}

function buildCategoryGrid(){
  const grid = $("categoryGrid");
  grid.innerHTML = "";
  CATEGORIES.forEach(c=>{
    const label = document.createElement("label");
    label.className = "cat";
    label.innerHTML = `<input type="checkbox" value="${c}"><span>${c}</span>`;
    grid.appendChild(label);
  });
}

function chooseQuestion(id){
  if(state.revealed){
    alert("已進入CPAS揭示階段，不能再新增晤談問題。");
    return;
  }
  if(!state.asked.includes(id) && state.asked.length >= MAX_QUESTIONS){
    alert(`已達最多${MAX_QUESTIONS}題，請進入CPAS揭示階段。`);
    return;
  }
  const q = QUESTION_BANK.find(x=>x.id===id);
  state.current = q;
  if(!state.asked.includes(id)) state.asked.push(id);
  $("qaBox").classList.remove("empty");
  $("qaBox").innerHTML = `
    <div class="question-title">顧問問題：${q.q}</div>
    <div class="answer">個案回答：<br>${q.a}</div>
  `;
  $("classifyBox").classList.remove("hidden");
  document.querySelectorAll("#categoryGrid input").forEach(i=>i.checked = q.evidence.includes(i.value));
  $("noteText").value = "";
  buildQuestionList();
  updateStatus();
}

function saveEvidence(){
  if(!state.current) return;
  const cats = [...document.querySelectorAll("#categoryGrid input:checked")].map(i=>i.value).filter(v=>v!=="不保留");
  const note = $("noteText").value.trim();
  if(cats.length===0){
    alert("請至少選擇一個報告素材分類，或按「不保留」。");
    return;
  }
  const existing = state.evidence.find(e=>e.id===state.current.id);
  const item = {
    id: state.current.id,
    q: state.current.q,
    a: state.current.a,
    cats,
    note: note || "尚未填寫小組觀察。",
    cpas: state.current.cpas,
    interpret: state.current.interpret
  };
  if(existing){
    Object.assign(existing,item);
  }else{
    state.evidence.push(item);
  }

  const line = `- ${item.note}（${item.id}：${item.a}）`;
  item.cats.forEach(cat=>{
    if(["個案背景"].includes(cat)) appendToTextarea("r1", line);
    if(["現況說明","過去工作經驗","求職行為","求職動機","求職意願","求職態度","求職期待","不可接受條件","可妥協條件","可用能力","限制條件","家庭因素","經濟壓力","工作價值觀","工作成就感","穩定就業風險","行動準備度","心理狀態","情緒態度","學習方式","成功經驗","離職模式","來站期待"].includes(cat)) appendToTextarea("r2", line);
    if(["職涯問題線索"].includes(cat)) appendToTextarea("r3", line);
    if(["顧問建議素材"].includes(cat)) appendToTextarea("r7", line);
  });

  updateBasket();
  $("classifyBox").classList.add("hidden");
  $("qaBox").innerHTML = `<h2>已加入素材籃</h2><p>請繼續選擇下一個問題，或在題數足夠後揭示CPAS。</p>`;
}

function skipEvidence(){
  $("classifyBox").classList.add("hidden");
  $("qaBox").innerHTML = `<h2>此題未保留</h2><p>請繼續選擇下一個問題。</p>`;
}

function updateStatus(){
  $("askedCount").textContent = state.asked.length;
}

function updateBasket(){
  const summary = $("basketSummary");
  summary.innerHTML = "";
  const counts = {};
  CATEGORIES.filter(c=>c!=="不保留").forEach(c=>counts[c]=0);
  state.evidence.forEach(e=>e.cats.forEach(c=>counts[c] = (counts[c]||0)+1));
  ["個案背景","現況說明","過去工作經驗","求職行為","職涯問題線索","CPAS人格證據","五大適性工作證據","顧問建議素材"].forEach(c=>{
    let count = counts[c] || 0;
    if(c==="CPAS人格證據" || c==="五大適性工作證據") count = state.revealed ? state.evidence.length : 0;
    const div = document.createElement("div");
    div.className = "sum-item";
    div.innerHTML = `${c}<br><strong>${count}</strong>筆`;
    summary.appendChild(div);
  });

  const basket = $("basket");
  basket.innerHTML = "";
  if(state.evidence.length===0){
    basket.innerHTML = `<p class="muted">尚未保留資料。</p>`;
    return;
  }
  state.evidence.forEach(e=>{
    const div = document.createElement("div");
    div.className = "evidence";
    div.innerHTML = `
      <div class="tags">${e.cats.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      <div class="evq">${e.id}｜${e.q}</div>
      <div class="note">${e.note}</div>
    `;
    basket.appendChild(div);
  });
}

function revealCPAS(){
  if(state.evidence.length < 3){
    if(!confirm("目前保留資料少於3筆，仍要揭示CPAS嗎？")) return;
  }
  state.revealed = true;
  clearInterval(state.timer);
  $("classifyBox").classList.add("hidden");
  $("qaBox").classList.add("hidden");
  $("revealPanel").classList.remove("hidden");
  $("reportPanel").classList.add("hidden");
  scrollTopNow();
  renderCPASText();
  buildCompare();
  updateBasket();
}


function renderCPASText(){
  const box = $("cpasTextBox");
  if(!box || typeof CPAS_PROFILE === "undefined") return;
  box.innerHTML = "";
  if(state.cpasTab === "short"){
    const trait = Object.entries(CPAS_PROFILE.traitShort).map(([k,v])=>`<li><strong>${k}：</strong>${v}</li>`).join("");
    const apt = Object.entries(CPAS_PROFILE.aptitudeShort).map(([k,v])=>`<li><strong>${k}：</strong>${v}</li>`).join("");
    box.innerHTML = `
      <div class="cpas-text-card"><h4>4. CPAS人格特質重點｜報告簡短版</h4><ul>${trait}</ul></div>
      <div class="cpas-text-card"><h4>5. 五大適性工作判斷＋6. 領導潛能｜報告簡短版</h4><ul>${apt}</ul></div>
    `;
  }else{
    const trait = Object.entries(CPAS_PROFILE.traitProfile).map(([k,v])=>`<div class="cpas-text-card"><h4>${k}</h4><p>${v}</p></div>`).join("");
    const apt = Object.entries(CPAS_PROFILE.aptitudeProfile).map(([k,v])=>`<div class="cpas-text-card"><h4>${k}</h4><p>${v}</p></div>`).join("");
    box.innerHTML = `<h3>4. CPAS人格特質重點｜個案Profile版</h3>${trait}<h3>5. 五大適性工作與6. 領導潛能｜個案Profile版</h3>${apt}`;
  }
}

function buildCompare(){
  const wrap = $("cpasCompare");
  wrap.innerHTML = "";
  if(state.evidence.length===0){
    wrap.innerHTML = "<p>尚無素材可對照。</p>";
    return;
  }
  state.evidence.forEach(e=>{
    const div = document.createElement("div");
    div.className = "compare-card";
    div.innerHTML = `
      <h4>${e.id}｜${e.q}</h4>
      <p><strong>保留筆記：</strong>${e.note}</p>
      <p><strong>個案回答：</strong>${e.a}</p>
      <div class="cpas-tags">${e.cpas.map(t=>`<span class="cpas-tag">${t}</span>`).join("")}</div>
      <p><strong>可能判讀：</strong>${e.interpret}</p>
    `;
    wrap.appendChild(div);
  });
}

function showReport(){
  $("revealPanel").classList.add("hidden");
  $("reportPanel").classList.remove("hidden");
  scrollTopNow();
  autoFillReport();
  loadDraft();
  bindDraftAutosave();
}

function autoFillReport(){
  loadDraft();
  if($("r4") && !$("r4").value.trim()) $("r4").value = Object.entries(CPAS_PROFILE.traitShort).map(([k,v])=>`${k}：${v}`).join("\n");
  if($("r5") && !$("r5").value.trim()) $("r5").value = Object.entries(CPAS_PROFILE.aptitudeShort).filter(([k,v])=>!k.includes("領導")).map(([k,v])=>`${k}：${v}`).join("\n");
  if($("r6") && !$("r6").value.trim()) $("r6").value = CPAS_PROFILE.aptitudeShort["領導潛能0"] || CPAS_PROFILE.aptitudeShort["領導潛能 0"] || "";
  saveDraft();
}


function selectedEvidenceText(){
  if(state.evidence.length===0) return "尚未保留素材。";
  return state.evidence.map(e=>[
    `${e.id}｜${e.q}`,
    `分類：${e.cats.join("、")}`,
    `小組筆記：${e.note}`,
    `個案回答：${e.a}`,
    `CPAS對應：${e.cpas.join("、")}`,
    `可能判讀：${e.interpret}`
  ].join("\n")).join("\n\n---\n\n");
}

function reportText(){
  const name = $("studentName") ? ($("studentName").value.trim() || "未填寫") : "未填寫";
  return [
    "CPAS職涯輔導報告骨架 V10",
    `小組／姓名：${name}`,
    `送出時間：${new Date().toLocaleString("zh-TW")}`,
    "",
    "1. 個案背景",
    $("r1").value,
    "",
    "2. 現況說明",
    $("r2").value,
    "",
    "3. 職涯問題",
    $("r3").value,
    "",
    "4. CPAS人格特質重點",
    $("r4").value,
    "",
    "5. 五大適性工作判斷",
    $("r5").value,
    "",
    "6. 領導潛能",
    $("r6").value,
    "",
    "7. 顧問建議",
    $("r7").value,
    "",
    "【保留的晤談素材】",
    selectedEvidenceText()
  ].join("\n");
}

async function copyReport(){
  try{
    await navigator.clipboard.writeText(reportText());
    if($("submitStatus")) $("submitStatus").textContent = "已複製報告文字。"; else alert("已複製報告文字。");
  }catch(e){
    alert("複製失敗，請手動選取文字。");
  }
}

function downloadReport(){
  const blob = new Blob([reportText()], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "CPAS報告骨架_V2.txt";
  a.click();
  URL.revokeObjectURL(url);
}




async function submitOnline(){
  if(!SUBMIT_ENDPOINT || SUBMIT_ENDPOINT.trim()===""){
    $("submitStatus").textContent = "尚未設定Google Sheet接收連結，請老師先在 config.js 填入 Apps Script Web App URL。";
    return;
  }

  const name = $("studentName").value.trim() || "未填寫";
  const timestamp = new Date().toLocaleString("zh-TW");

  const payload = new URLSearchParams();
  payload.append(SUBMIT_FIELDS.timestamp, timestamp);
  payload.append(SUBMIT_FIELDS.name, name);
  payload.append(SUBMIT_FIELDS.background, $("r1").value);
  payload.append(SUBMIT_FIELDS.currentStatus, $("r2").value);
  payload.append(SUBMIT_FIELDS.careerProblem, $("r3").value);
  payload.append(SUBMIT_FIELDS.cpasTraits, $("r4").value);
  payload.append(SUBMIT_FIELDS.aptitude, $("r5").value);
  payload.append(SUBMIT_FIELDS.leadership, $("r6").value);
  payload.append(SUBMIT_FIELDS.recommendation, $("r7").value);
  payload.append(SUBMIT_FIELDS.evidence, selectedEvidenceText());
  payload.append(SUBMIT_FIELDS.fullReport, reportText());

  $("submitStatus").textContent = "傳送中……";
  try{
    await fetch(SUBMIT_ENDPOINT, {
      method:"POST",
      mode:"no-cors",
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body: payload.toString()
    });
    $("submitStatus").textContent = "已送出，請老師到Google Sheet確認資料。";
  }catch(err){
    $("submitStatus").textContent = "送出失敗，請確認網路與Google Sheet接收設定。";
  }
}

function bindCaseModal(){
  const open = () => $("caseModal").classList.remove("hidden");
  const close = () => $("caseModal").classList.add("hidden");
  if($("openCaseBtn")) $("openCaseBtn").onclick = open;
  if($("openCaseBtnSide")) $("openCaseBtnSide").onclick = open;
  if($("openCaseBtnTop")) $("openCaseBtnTop").onclick = open;
  if($("closeCaseBtn")) $("closeCaseBtn").onclick = close;
  if($("caseBackdrop")) $("caseBackdrop").onclick = close;
  const openJob = () => $("jobModal").classList.remove("hidden");
  const closeJob = () => $("jobModal").classList.add("hidden");
  if($("openJobBtn")) $("openJobBtn").onclick = openJob;
  if($("openJobBtnSide")) $("openJobBtnSide").onclick = openJob;
  if($("openJobBtnTop")) $("openJobBtnTop").onclick = openJob;
  if($("closeJobBtn")) $("closeJobBtn").onclick = closeJob;
  if($("jobBackdrop")) $("jobBackdrop").onclick = closeJob;
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape" && !$("caseModal").classList.contains("hidden")) close();
    if(e.key === "Escape" && !$("jobModal").classList.contains("hidden")) closeJob();
  });
}


const HELP_TEXT = {
  background:{title:"1. 個案背景",html:`<p>請整理會影響職涯判斷的基本背景資料。這一欄重點是交代個案的基本身分、學歷與目前角色，不需要寫太多延伸分析。可包含性別、年齡、學歷科系、畢業或肄業狀態、目前在職或在學狀態、公司名稱或學校名稱、目前職務或學生年級等。</p><ul><li>性別</li><li>年齡</li><li>學歷／科系</li><li>畢業或肄業狀態</li><li>公司名稱／學校名稱</li><li>職稱／學生幾年級</li><li>目前在職、待業或在學狀態</li></ul>`},
  currentStatus:{title:"2. 現況說明",html:`<p>請整理個案目前為什麼卡住。重點不是把所有對話照抄，也不是寫流水帳，而是要說明與本次提問相關的現況脈絡。可包含過去經驗、能力基礎、興趣、價值觀、家庭或重要他人期待、目前求職狀態、實際求職行為、待業時間、經濟或家庭壓力、限制條件、可用資源、目前卡住原因，以及後續服務需要優先處理的方向。</p><ul><li>個案過去經驗與本次職涯問題有什麼關聯？</li><li>個案目前具備哪些能力基礎？</li><li>個案興趣所在是什麼？</li><li>個案價值觀想要什麼？不要什麼？</li><li>個案是否在意家庭或重要他人的期待？</li><li>個案目前的求職狀態與實際求職行為如何？</li><li>個案是否有待業時間、經濟壓力、家庭壓力或其他限制？</li><li>個案目前卡住的主要原因是什麼？</li><li>後續服務需要優先處理什麼？</li></ul>`},
  careerProblem:{title:"3. 收斂後職涯問題",html:`<p>職涯問題不是個案原話，而是顧問追問後收斂出的核心問題。這個問題必須能被後面的顧問建議具體回應。</p><p>請不要只寫「不知道要做什麼工作」。請整理成可被回應的問題，例如：個案排斥高人際、高業績、高重複工作，但缺乏明確可投遞的低排斥職務方向，需要協助釐清職務起點。</p>`},
  cpasTraits:{title:"4. CPAS人格特質重點",html:`<p>請挑出最能解釋個案求職困難與工作適配的 CPAS 指標。不要只寫分數高低，要寫出分數、晤談證據、工作行為影響與建議意義。</p><p>請用「分數＋晤談證據＋工作行為影響」來寫。可優先整理行動性、持續性、共感性、情緒安定性、獨立自主性、柔軟性、感受性等與本案最相關的指標。</p>`},
  aptitude:{title:"5. 五大適性工作判斷",html:`<p>請整合定型工作、對人工作、營業工作、非定型工作、具創造性工作五個分數，說明個案適合與不適合的工作型態，並補上可嘗試職務方向。</p><p>請不要只寫高低分。請說明各分數代表的工作型態適配程度，並補上可能職務，例如電商上架助理、商品圖片處理助理、短影音字幕助理、內容上架助理、素材整理助理等。</p>`},
  leadership:{title:"6. 領導潛能",html:`<p>這裡不只看能不能管理別人，也要看個案目前的自我管理、生活節奏、責任承擔、行動穩定度與是否適合承擔主導角色。</p><p>請說明個案目前是否適合帶人、主導、整合或承擔高責任角色。若分數低，可從「先建立自我管理、生活節奏與小任務穩定完成」來寫。</p>`},
  recommendation:{title:"7. 顧問建議",html:`<p>顧問建議必須回應前面的職涯問題，並且要有晤談證據與 CPAS 分數支持。不要只寫一般求職建議。</p><ul><li>個案五大適性工作整合起來，搭配能力、興趣、價值觀，較適合做哪些類型的工作？有哪些分數與原因支持顧問建議？</li><li>個案特質上面，哪些對做特定工作是加分？所以顧問建議應該怎麼做會更好？有哪些分數與原因支持顧問建議？</li><li>個案特質上面，哪些對做特定工作是扣分？所以顧問建議應該怎麼做可以改善？有哪些分數與原因支持顧問建議？</li><li>個案有提到其他哪些考量是顧問可以提供改善建議的？或是提供方法處理的？是否有CPAS指標的依據？</li></ul>`}
};
const DRAFT_KEY="cpas_v9_report_draft";
const REPORT_IDS=["studentName","r1","r2","r3","r4","r5","r6","r7"];
function scrollTopNow(){setTimeout(()=>window.scrollTo({top:0,left:0,behavior:"auto"}),0)}
function saveDraft(){const d={};REPORT_IDS.forEach(id=>{const el=$(id);if(el)d[id]=el.value});try{localStorage.setItem(DRAFT_KEY,JSON.stringify(d))}catch(e){}}
function loadDraft(){try{const raw=localStorage.getItem(DRAFT_KEY);if(!raw)return;const d=JSON.parse(raw);REPORT_IDS.forEach(id=>{const el=$(id);if(el&&d[id]!==undefined)el.value=d[id]})}catch(e){}}
function bindDraftAutosave(){REPORT_IDS.forEach(id=>{const el=$(id);if(el&&!el.dataset.autosaveBound){el.addEventListener("input",saveDraft);el.dataset.autosaveBound="1"}})}
function appendToTextarea(id,text){const el=$(id);if(!el||!text)return;const current=el.value.trim();if(current.includes(text.trim()))return;el.value=current?current+"\n"+text:text;saveDraft()}
function bindHelpModal(){document.querySelectorAll(".help-btn").forEach(btn=>{btn.onclick=()=>{const item=HELP_TEXT[btn.dataset.help];if(!item)return;$("helpTitle").textContent=item.title;$("helpContent").innerHTML=item.html;$("helpModal").classList.remove("hidden");scrollTopNow()}});const close=()=>$("helpModal").classList.add("hidden");if($("closeHelpBtn"))$("closeHelpBtn").onclick=close;if($("helpBackdrop"))$("helpBackdrop").onclick=close}
function clearDraft(){if(confirm("確定要清除本次報告草稿？")){try{localStorage.removeItem(DRAFT_KEY)}catch(e){};REPORT_IDS.forEach(id=>{const el=$(id);if(el)el.value=""});saveDraft();}}
function copyAllText(){navigator.clipboard.writeText(reportText()).then(()=>{$("submitStatus").textContent="已複製全部報告文字。"}).catch(()=>{$("submitStatus").textContent="複製失敗，請改用手動選取。"})}
function downloadPDF(){const text=reportText();try{if(window.jspdf&&window.jspdf.jsPDF){const doc=new window.jspdf.jsPDF({orientation:"p",unit:"mm",format:"a4"});doc.setFont("helvetica");doc.setFontSize(12);const lines=doc.splitTextToSize(text,180);let y=15;lines.forEach(line=>{if(y>285){doc.addPage();y=15}doc.text(line,15,y);y+=7});doc.save("CPAS報告骨架_V9.pdf");$("submitStatus").textContent="已下載PDF。若中文字顯示異常，請使用瀏覽器列印另存PDF。"}else{printReport()}}catch(e){printReport()}}
function printReport(){const w=window.open("","_blank");const safe=reportText().replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m]));w.document.write(`<html><head><title>CPAS報告</title><style>body{font-family:"Microsoft JhengHei",sans-serif;line-height:1.7;font-size:16px;padding:28px;white-space:pre-wrap}h1{font-size:24px}</style></head><body><h1>CPAS職涯輔導報告骨架</h1><pre>${safe}</pre></body></html>`);w.document.close();w.focus();w.print();$("submitStatus").textContent="已開啟列印視窗，請選擇另存為PDF。"}


function openCpasSummary(){
  const m = $("cpasSummaryModal");
  if(m){
    m.classList.remove("hidden");
    scrollTopNow && scrollTopNow();
  }
}
function closeCpasSummary(){
  const m = $("cpasSummaryModal");
  if(m) m.classList.add("hidden");
}
function goReportTop(){
  const report = $("reportPanel");
  if(report){
    report.classList.remove("hidden");
    report.scrollIntoView({behavior:"auto", block:"start"});
    setTimeout(()=>window.scrollTo({top: Math.max(report.getBoundingClientRect().top + window.pageYOffset - 20,0), behavior:"auto"}),0);
  }
}

init();
