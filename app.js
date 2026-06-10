
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
  $("saveEvidenceBtn").onclick = saveEvidence;
  $("skipBtn").onclick = skipEvidence;
  $("revealBtn").onclick = revealCPAS;
  $("goReportBtn").onclick = showReport;
  $("resetBtn").onclick = () => {
    if(confirm("確定要重新開始？目前紀錄會清除。")) location.reload();
  };
  $("copyReportBtn").onclick = copyReport;
  $("downloadReportBtn").onclick = downloadReport;
  $("sendEmailBtn").onclick = sendEmail;
  $("submitOnlineBtn").onclick = submitOnline;
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
  $("openCaseBtn").classList.remove("hidden");
  if($("openJobBtn")) $("openJobBtn").classList.remove("hidden");
  $("introPanel").classList.add("hidden");
  $("appPanel").classList.remove("hidden");
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
  autoFillReport();
}

function autoFillReport(){
  const byCat = cat => state.evidence.filter(e=>e.cats.includes(cat)).map(e=>`- ${e.note}`).join("\n");
  $("r1").value = byCat("個案背景");
  $("r2").value = [byCat("現況說明"), byCat("求職行為"), byCat("過去工作經驗")].filter(Boolean).join("\n");
  $("r3").value = byCat("職涯問題線索");
  $("r4").value = Object.entries(CPAS_PROFILE.traitShort).map(([k,v])=>`${k}：${v}`).join("\n");
  $("r5").value = Object.entries(CPAS_PROFILE.aptitudeShort).filter(([k,v])=>!k.includes("領導")).map(([k,v])=>`${k}：${v}`).join("\n");
  $("r6").value = CPAS_PROFILE.aptitudeShort["領導潛能0"];
  $("r7").value = byCat("顧問建議素材");
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
    "CPAS職涯輔導報告骨架 V2",
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


function sendEmail(){
  const name = $("studentName") ? ($("studentName").value.trim() || "未填寫小組姓名") : "未填寫小組姓名";
  const subject = encodeURIComponent(`CPAS報告骨架｜${name}`);
  const body = encodeURIComponent(reportText());
  const mailto = `mailto:${TEACHER_EMAIL}?subject=${subject}&body=${body}`;
  window.location.href = mailto;
  if($("submitStatus")) $("submitStatus").textContent = "已開啟Email程式。若手機沒有設定Email，請改用『複製報告文字』貼到LINE或表單。";
}

async function submitOnline(){
  if(!SUBMIT_ENDPOINT || SUBMIT_ENDPOINT.trim()===""){
    alert("尚未設定線上送出網址。請先在 config.js 設定 SUBMIT_ENDPOINT。");
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

  $("submitStatus").textContent = "送出中……";
  try{
    await fetch(SUBMIT_ENDPOINT, {
      method:"POST",
      mode:"no-cors",
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body: payload.toString()
    });
    $("submitStatus").textContent = "已送出。請到Google Sheet確認是否新增一列。";
  }catch(err){
    $("submitStatus").textContent = "送出失敗，請改用Email或複製報告文字。";
  }
}

function bindCaseModal(){
  const open = () => $("caseModal").classList.remove("hidden");
  const close = () => $("caseModal").classList.add("hidden");
  if($("openCaseBtn")) $("openCaseBtn").onclick = open;
  if($("openCaseBtnSide")) $("openCaseBtnSide").onclick = open;
  if($("closeCaseBtn")) $("closeCaseBtn").onclick = close;
  if($("caseBackdrop")) $("caseBackdrop").onclick = close;
  const openJob = () => $("jobModal").classList.remove("hidden");
  const closeJob = () => $("jobModal").classList.add("hidden");
  if($("openJobBtn")) $("openJobBtn").onclick = openJob;
  if($("openJobBtnSide")) $("openJobBtnSide").onclick = openJob;
  if($("closeJobBtn")) $("closeJobBtn").onclick = closeJob;
  if($("jobBackdrop")) $("jobBackdrop").onclick = closeJob;
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape" && !$("caseModal").classList.contains("hidden")) close();
    if(e.key === "Escape" && !$("jobModal").classList.contains("hidden")) closeJob();
  });
}

init();
