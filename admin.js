const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");
const loginMsg = document.getElementById("loginMsg");
const adminCollege = document.getElementById("admin-college");
const adminSection = document.getElementById("admin-section");
const resultTitle = document.getElementById("resultTitle");
const resultTable = document.getElementById("resultTable");

Object.keys(COLLEGES).forEach(c=>{
  const o=document.createElement("option"); o.value=c; o.textContent=c; adminCollege.appendChild(o);
});

// Password is kept only in sessionStorage (cleared when tab closes), sent with every admin request.
function getPassword(){ return sessionStorage.getItem("sfiAdminPw"); }

if (getPassword()) showDashboard();

document.getElementById("loginBtn").addEventListener("click", async () => {
  const pw = document.getElementById("admin-password").value;
  const res = await apiCall({ action: "login", password: pw });
  if (res.ok) {
    sessionStorage.setItem("sfiAdminPw", pw);
    showDashboard();
  } else {
    loginMsg.textContent = "Incorrect password.";
    loginMsg.className = "msg error";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("sfiAdminPw");
  location.reload();
});

function showDashboard(){
  loginBox.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

let lastRows = [];      // raw row objects (with id) for delete
let lastColumns = [];   // display columns
let lastColKeys = [];   // keys matching columns, for table rendering
let lastSection = "";
let lastTitle = "";

const SECTION_META = {
  classwise: {
    label: "Class-wise Details",
    columns: ["Timestamp","Year","Class","Entry Type","Rep #","Seat","Candidate Name","Candidate Address","Current Rep","Winning Chance","Remark"],
    keys: ["timestamp","year","className","entryType","repNumber","seatType","candidateName","candidateAddress","currentRep","winningChance","remark"]
  },
  unitcommittee: {
    label: "Unit Committee Members",
    columns: ["Timestamp","Name","Class","Year","Department","Responsibility","Phone"],
    keys: ["timestamp","name","class","year","department","responsibility","phone"]
  },
  campusgeneral: {
    label: "Campus General",
    columns: ["Timestamp","Entry Type","Current Union","Union Details","Activity Types","Activity (Other)","Activity Remark","Eval Year","Eval Text","Gang Assessment"],
    keys: ["timestamp","entryType","currentUnion","unionDetails","activityTypes","activityOther","activityRemark","evalYear","evalText","gangAssessment"]
  },
  socialmedia: {
    label: "Social Media",
    columns: ["Timestamp","Platform","Account/Group Name","Purpose","Current Usage"],
    keys: ["timestamp","platform","name","purpose","usage"]
  },
  issues: {
    label: "Issues to Address",
    columns: ["Timestamp","Issue","Suggested Action"],
    keys: ["timestamp","issue","action"]
  }
};

document.getElementById("loadBtn").addEventListener("click", loadReport);

async function loadReport(){
  const college = adminCollege.value;
  const section = adminSection.value;
  if (!college){ alert("Select a college."); return; }
  lastSection = section;
  const meta = SECTION_META[section];
  lastTitle = college + " — " + meta.label;
  lastColumns = meta.columns;
  lastColKeys = meta.keys;

  resultTable.innerHTML = "Loading...";
  const res = await apiCall({ action:"list", section, college, password:getPassword() });
  if (!res.ok){ resultTable.innerHTML = "<p>Error loading data.</p>"; return; }
  lastRows = (section === "classwise") ? sortClasswise(res.rows) : res.rows;
  render();
}

// Groups visually (Year -> Class -> Rep Number, remarks last) even though each
// rep/remark was saved as its own independent submission, possibly days apart.
function sortClasswise(rows){
  return rows.slice().sort((a,b) => {
    const ya = a.year || "", yb = b.year || "";
    if (ya !== yb) return ya.localeCompare(yb);
    const ca = a.className || "", cb = b.className || "";
    if (ca !== cb) return ca.localeCompare(cb);
    const ra = a.entryType === "remark" ? Infinity : (Number(a.repNumber) || 0);
    const rb = b.entryType === "remark" ? Infinity : (Number(b.repNumber) || 0);
    return ra - rb;
  });
}

function formatCell(key, value){
  if (value === undefined || value === null || value === "") return "";
  if (key === "timestamp") {
    const d = new Date(value);
    return isNaN(d) ? value : d.toLocaleString();
  }
  if (key === "activityTypes" && Array.isArray(value)) return value.join(", ");
  return value;
}

// Escapes any user-submitted value before it's dropped into innerHTML.
// Without this, anonymous form submissions (candidate names, remarks,
// issue text, etc.) could inject markup/script that runs in the admin's
// browser — which is holding the admin password in sessionStorage.
function escapeHtml(value){
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function render(){
  resultTitle.innerHTML = `<h3>${escapeHtml(lastTitle)}</h3>`;
  if (!lastRows.length){ resultTable.innerHTML = "<p>No entries found.</p>"; return; }
  let html = "<table><thead><tr>";
  lastColumns.forEach(c => html += `<th>${escapeHtml(c)}</th>`);
  html += "<th>Action</th></tr></thead><tbody>";
  lastRows.forEach(r => {
    html += "<tr>";
    lastColKeys.forEach(k => { html += `<td>${escapeHtml(formatCell(k, r[k]))}</td>`; });
    html += `<td><button class="btn small secondary" onclick="deleteRow('${escapeHtml(r.id)}')">Delete</button></td>`;
    html += "</tr>";
  });
  html += "</tbody></table>";
  resultTable.innerHTML = html;
}

async function deleteRow(id){
  if (!confirm("Delete this entry? This cannot be undone.")) return;
  const res = await apiCall({ action:"delete", section: lastSection, id, password:getPassword() });
  if (res.ok) { loadReport(); } else { alert("Delete failed: " + (res.error || "unknown")); }
}

document.getElementById("pdfBtn").addEventListener("click", async () => {
  if (!lastRows.length) { await loadReport(); }
  if (!lastRows.length) { alert("No data to export."); return; }

  const btn = document.getElementById("pdfBtn");
  btn.disabled = true;
  btn.textContent = "Generating PDF...";

  try {
    const exportWrap = document.createElement("div");
    exportWrap.style.position = "fixed";
    exportWrap.style.left = "-99999px";
    exportWrap.style.top = "0";
    exportWrap.style.background = "#fff";
    exportWrap.style.padding = "16px";
    exportWrap.style.width = "1400px";
    exportWrap.style.fontFamily = "'Noto Sans Malayalam','Segoe UI',sans-serif";

    let html = `<h2 style="margin:0 0 12px;">${escapeHtml(lastTitle)}</h2>`;
    html += `<table style="width:100%; border-collapse:collapse; font-size:13px;">`;
    html += "<thead><tr>";
    lastColumns.forEach(c => html += `<th style="border:1px solid #ccc; padding:6px; background:#f0f0f2; text-align:left;">${escapeHtml(c)}</th>`);
    html += "</tr></thead><tbody>";
    lastRows.forEach(r => {
      html += "<tr>";
      lastColKeys.forEach(k => {
        html += `<td style="border:1px solid #ccc; padding:6px; vertical-align:top;">${escapeHtml(formatCell(k, r[k]) ?? "")}</td>`;
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
    exportWrap.innerHTML = html;
    document.body.appendChild(exportWrap);

    const canvas = await html2canvas(exportWrap, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
    document.body.removeChild(exportWrap);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4", compress: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 20;
    const imgData = canvas.toDataURL("image/jpeg", 0.85);

    doc.addImage(imgData, "JPEG", 20, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= (pageHeight - 40);

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 20;
      doc.addPage();
      doc.addImage(imgData, "JPEG", 20, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= (pageHeight - 40);
    }

    doc.save(lastTitle.replace(/[^a-z0-9]/gi, "_") + ".pdf");
  } catch (err) {
    console.error(err);
    alert("PDF generation failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Download as PDF";
  }
});

// ================= FORMATTED REPORT (matches the official Word template) =================

const REPORT_TITLE = "SFI വളാഞ്ചേരി ഏരിയ കമ്മിറ്റി";
const REPORT_SUBTITLE = "ക്യാമ്പസ് തിരഞ്ഞെടുപ്പ് 2026";

function esc(v){ return escapeHtml(v == null ? "" : v); }

function reportHeaderHtml(college){
  return `
    <div style="text-align:center; margin-bottom:10px;">
      <div style="font-weight:700; font-size:20px;">${esc(REPORT_TITLE)}</div>
      <div style="font-weight:700; font-size:15px;">${esc(REPORT_SUBTITLE)}</div>
    </div>
    <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
      <tr>
        <td style="border:1px solid #000; padding:7px; font-weight:700; width:230px; background:#f5f5f5;">ക്യാമ്പസിന്റെ പേര്</td>
        <td style="border:1px solid #000; padding:7px;">${esc(college)}</td>
      </tr>
    </table>
  `;
}

function renderReportPage(college, headingText, bodyHtml){
  return `
    <div class="report-page" style="width:1500px; padding:24px; background:#fff; color:#000;">
      ${reportHeaderHtml(college)}
      ${headingText ? `<div style="font-weight:700; font-size:15px; margin-bottom:10px;">${esc(headingText)}</div>` : ""}
      ${bodyHtml}
    </div>
  `;
}

// ---------- Class-wise: group each class's independent rep/remark submissions into one row ----------
function groupClasswiseForReport(rows){
  const groups = {};
  const order = [];
  rows.forEach(r => {
    const key = r.groupId || (r.year + "|" + r.className);
    if (!groups[key]) {
      groups[key] = { year: r.year, className: r.className, repCount: r.repCount, reps: [], remarks: [] };
      order.push(key);
    }
    const g = groups[key];
    if (r.entryType === "remark") { if (r.remark) g.remarks.push(r.remark); }
    else if (r.entryType === "rep") { g.reps.push(r); }
  });
  const list = order.map(k => groups[k]);
  list.sort((a, b) => {
    const ya = a.year || "", yb = b.year || "";
    if (ya !== yb) return ya.localeCompare(yb);
    return (a.className || "").localeCompare(b.className || "");
  });
  return list;
}

// One class now has at most one General and one Reserved rep entry.
function seatColumns(reps, seatType){
  const matched = reps.find(r => r.seatType === seatType);
  return {
    name: matched ? (matched.candidateName || "") : "",
    address: matched ? (matched.candidateAddress || "") : "",
    current: matched ? (matched.currentRep || "") : "",
    chance: matched ? (matched.winningChance || "") : ""
  };
}

function renderClasswiseSection(rows){
  const groups = groupClasswiseForReport(rows);
  let body = "";
  if (!groups.length) {
    body = `<tr><td colspan="13" style="border:1px solid #000; padding:10px; text-align:center; font-style:italic; color:#777;">No entries found.</td></tr>`;
  } else {
    groups.forEach((g, i) => {
      const gen = seatColumns(g.reps, "General");
      const res = seatColumns(g.reps, "Reserved");
      const remark = g.remarks.join("\n");
      const c = 'style="border:1px solid #000; padding:6px; white-space:pre-line; vertical-align:top; word-wrap:break-word;"';
      body += `<tr>
        <td style="border:1px solid #000; padding:6px; text-align:center;">${i + 1}</td>
        <td style="border:1px solid #000; padding:6px; word-wrap:break-word;">${esc(g.className)}</td>
        <td style="border:1px solid #000; padding:6px; word-wrap:break-word;">${esc(g.year)}</td>
        <td style="border:1px solid #000; padding:6px; text-align:center;">${esc(g.repCount)}</td>
        <td ${c}>${esc(gen.name)}</td>
        <td ${c}>${esc(gen.address)}</td>
        <td ${c}>${esc(res.name)}</td>
        <td ${c}>${esc(res.address)}</td>
        <td ${c}>${esc(gen.current)}</td>
        <td ${c}>${esc(res.current)}</td>
        <td ${c}>${esc(gen.chance)}</td>
        <td ${c}>${esc(res.chance)}</td>
        <td ${c}>${esc(remark)}</td>
      </tr>`;
    });
  }

  const th = 'style="border:1px solid #000; padding:6px; background:#f0f0f2; word-wrap:break-word;"';
  return `
    <table style="width:100%; border-collapse:collapse; font-size:12px; table-layout:fixed;">
      <colgroup>
        <col style="width:4%"><col style="width:8%"><col style="width:7%"><col style="width:6%">
        <col style="width:9%"><col style="width:10%"><col style="width:9%"><col style="width:10%">
        <col style="width:6%"><col style="width:6%"><col style="width:6%"><col style="width:6%">
        <col style="width:13%">
      </colgroup>
      <thead>
        <tr>
          <th rowspan="2" ${th}>ക്രമ നം.</th>
          <th rowspan="2" ${th}>ക്ലാസ്</th>
          <th rowspan="2" ${th}>ഇയര്‍</th>
          <th rowspan="2" ${th}>റെപ്പ്മാരുടെ എണ്ണം</th>
          <th colspan="2" ${th}>ജനറല്‍ സീറ്റ്</th>
          <th colspan="2" ${th}>റിസര്‍വ്ഡ് സീറ്റ്</th>
          <th colspan="2" ${th}>നിലവിലെ റെപ്പ്</th>
          <th colspan="2" ${th}>ജയിക്കാനുള്ള സാധ്യത</th>
          <th rowspan="2" ${th}>ക്ലാസ്സിനെ കുറിച്ചുള്ള വിശദമായ റിമാര്‍ക്ക്</th>
        </tr>
        <tr>
          <th ${th}>പേര്</th><th ${th}>അഡ്രസ്സ്</th>
          <th ${th}>പേര്</th><th ${th}>അഡ്രസ്സ്</th>
          <th ${th}>GENERAL</th><th ${th}>RESERVED</th>
          <th ${th}>GENERAL</th><th ${th}>RESERVED</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

// ---------- Unit Committee ----------
function renderUnitCommitteeSection(rows){
  const th = 'style="border:1px solid #000; padding:6px; background:#f0f0f2;"';
  let body = rows.length
    ? rows.map((r, i) => `<tr>
        <td style="border:1px solid #000; padding:6px; text-align:center;">${i + 1}</td>
        <td style="border:1px solid #000; padding:6px;">${esc(r.name)}</td>
        <td style="border:1px solid #000; padding:6px;">${esc(r.class)}</td>
        <td style="border:1px solid #000; padding:6px;">${esc(r.year)}</td>
        <td style="border:1px solid #000; padding:6px;">${esc(r.department)}</td>
        <td style="border:1px solid #000; padding:6px;">${esc(r.responsibility)}</td>
        <td style="border:1px solid #000; padding:6px;">${esc(r.phone)}</td>
      </tr>`).join("")
    : `<tr><td colspan="7" style="border:1px solid #000; padding:8px; text-align:center; font-style:italic; color:#777;">No entries found.</td></tr>`;

  return `
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <thead><tr>
        <th ${th}>ക്രമ നം.</th><th ${th}>പേര്</th><th ${th}>ക്ലാസ്</th><th ${th}>ഇയര്‍</th>
        <th ${th}>ഡിപ്പാര്‍ട്ട്മെന്‍റ്</th><th ${th}>ചുമതല (ക്ലാസ്/ഡിപ്പാര്‍ട്ട്മെന്‍റ്)</th><th ${th}>ഫോണ്‍ നമ്പര്‍</th>
      </tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

// ---------- Campus General (4 mini-tables) ----------
function latestByType(rows, entryType){
  const filtered = rows.filter(r => r.entryType === entryType);
  if (!filtered.length) return null;
  return filtered.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).pop();
}

function activitiesText(row){
  if (!row) return "";
  const parts = [];
  if (row.activityTypes && row.activityTypes.length) parts.push(row.activityTypes.join(", "));
  if (row.activityOther) parts.push("Other: " + row.activityOther);
  if (row.activityRemark) parts.push(row.activityRemark);
  return parts.join("\n");
}

// evalYear select values map to the report's fixed row labels.
// "PG" is included so it works the moment you add that <option> to the form yourself.
const YEARWISE_ROWS = [
  { label: "First Year", value: "1st Year" },
  { label: "Second Year", value: "2nd Year" },
  { label: "Third Year", value: "3rd Year" },
  { label: "PG", value: "PG" }
];

function renderCampusGeneralSection(rows){
  const tdLabel = 'style="border:1px solid #000; padding:7px; font-weight:700; background:#f5f5f5; width:280px;"';

  const union = latestByType(rows, "union");
  const activities = latestByType(rows, "activities");
  const gangs = latestByType(rows, "gangs");

  const yearMap = {};
  rows.filter(r => r.entryType === "yearwise")
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .forEach(r => { yearMap[r.evalYear] = r.evalText; });

  const yearRows = YEARWISE_ROWS.map(row => `<tr>
      <td style="border:1px solid #000; padding:7px; vertical-align:top;">${esc(row.label)}</td>
      <td style="border:1px solid #000; padding:7px; vertical-align:top; white-space:pre-line;">${esc(yearMap[row.value] || "")}</td>
    </tr>`).join("");

  return `
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:14px;">
      <tr><td ${tdLabel}>നിലവിലെ യൂണിയന്‍ (SFI / Others)</td><td style="border:1px solid #000; padding:7px; vertical-align:top;">${esc(union ? union.currentUnion : "")}</td></tr>
      <tr><td ${tdLabel}>യൂണിയന്റെ ഒരു വര്‍ഷത്തെ പ്രവര്‍ത്തനങ്ങള്‍</td><td style="border:1px solid #000; padding:7px; vertical-align:top; white-space:pre-line;">${esc(union ? union.unionDetails : "")}</td></tr>
    </table>

    <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:14px;">
      <tr><td ${tdLabel}>യൂണിറ്റ് കമ്മിറ്റിയുടെ പ്രവര്‍ത്തനങ്ങള്‍</td><td style="border:1px solid #000; padding:7px; vertical-align:top; white-space:pre-line;">${esc(activitiesText(activities))}</td></tr>
    </table>

    <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:14px;">
      <tr>
        <td style="border:1px solid #000; padding:7px; font-weight:700; background:#f0f0f2;">ഇയറിനെ കുറിച്ചുള്ള വിലയിരുത്തല്‍</td>
        <td style="border:1px solid #000; padding:7px; font-weight:700; background:#f0f0f2;">Remarks</td>
      </tr>
      ${yearRows}
    </table>

    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <tr><td ${tdLabel}>ക്യാമ്പസിലെ ഗ്യാങ്ങുകളെ കുറിച്ചുള്ള വിലയിരുത്തല്‍</td><td style="border:1px solid #000; padding:7px; vertical-align:top; white-space:pre-line;">${esc(gangs ? gangs.gangAssessment : "")}</td></tr>
    </table>
  `;
}

// ---------- Social Media ----------
function renderSocialMediaSection(rows){
  const th = 'style="border:1px solid #000; padding:6px; background:#f0f0f2;"';
  let body = rows.length
    ? rows.map(r => `<tr>
        <td style="border:1px solid #000; padding:6px;">${esc(r.platform)}</td>
        <td style="border:1px solid #000; padding:6px;">${esc(r.name)}</td>
        <td style="border:1px solid #000; padding:6px;">${esc(r.purpose)}</td>
        <td style="border:1px solid #000; padding:6px; white-space:pre-line;">${esc(r.usage)}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" style="border:1px solid #000; padding:8px; text-align:center; font-style:italic; color:#777;">No entries found.</td></tr>`;

  return `
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <thead><tr>
        <th ${th}>പ്ലാറ്റ്ഫോം</th><th ${th}>അക്കൗണ്ട് / ഗ്രൂപ്പ് പേര്</th><th ${th}>purpose</th><th ${th}>നിലവിലെ ഉപയോഗ രീതി / സജീവത</th>
      </tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

// ---------- Issues ----------
function renderIssuesSection(rows){
  const th = 'style="border:1px solid #000; padding:6px; background:#f0f0f2;"';
  let body = rows.length
    ? rows.map((r, i) => `<tr>
        <td style="border:1px solid #000; padding:6px; text-align:center;">${i + 1}</td>
        <td style="border:1px solid #000; padding:6px; white-space:pre-line;">${esc(r.issue)}</td>
        <td style="border:1px solid #000; padding:6px; white-space:pre-line;">${esc(r.action)}</td>
      </tr>`).join("")
    : `<tr><td colspan="3" style="border:1px solid #000; padding:8px; text-align:center; font-style:italic; color:#777;">No entries found.</td></tr>`;

  return `
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <thead><tr><th ${th}>ക്രമ നം.</th><th ${th}>വിഷയം</th><th ${th}>നിര്‍ദ്ദേശിക്കുന്ന നടപടി / സമീപനം</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

// ---------- Capture + assemble the multi-page PDF ----------
async function ensureFontLoaded(){
  try {
    await document.fonts.load("16px 'Anek Malayalam'");
    await document.fonts.ready;
  } catch (e) { console.warn("Font load check failed:", e); }
}

async function captureAndAddToPdf(doc, html, isFirstPage){
  const wrap = document.createElement("div");
  wrap.style.position = "fixed";
  wrap.style.left = "-99999px";
  wrap.style.top = "0";
  wrap.style.background = "#ffffff";
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  const canvas = await html2canvas(wrap, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
  document.body.removeChild(wrap);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 40;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/jpeg", 0.85);

  let heightLeft = imgHeight;
  let position = 20;

  if (!isFirstPage) doc.addPage();
  doc.addImage(imgData, "JPEG", 20, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= (pageHeight - 40);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 20;
    doc.addPage();
    doc.addImage(imgData, "JPEG", 20, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= (pageHeight - 40);
  }
}

document.getElementById("fullReportBtn").addEventListener("click", async () => {
  const college = adminCollege.value;
  if (!college) { alert("Select a college first."); return; }

  const btn = document.getElementById("fullReportBtn");
  btn.disabled = true;
  btn.textContent = "Generating report...";

  try {
    await ensureFontLoaded();

    const [cwRes, ucRes, cgRes, smRes, isRes] = await Promise.all([
      apiCall({ action: "list", section: "classwise", college, password: getPassword() }),
      apiCall({ action: "list", section: "unitcommittee", college, password: getPassword() }),
      apiCall({ action: "list", section: "campusgeneral", college, password: getPassword() }),
      apiCall({ action: "list", section: "socialmedia", college, password: getPassword() }),
      apiCall({ action: "list", section: "issues", college, password: getPassword() })
    ]);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4", compress: true });

    await captureAndAddToPdf(doc, renderReportPage(college, "", renderClasswiseSection(cwRes.ok ? sortClasswise(cwRes.rows) : [])), true);
    await captureAndAddToPdf(doc, renderReportPage(college, "യൂണിറ്റ് കമ്മിറ്റി അംഗങ്ങള്‍", renderUnitCommitteeSection(ucRes.ok ? ucRes.rows : [])), false);
    await captureAndAddToPdf(doc, renderReportPage(college, "", renderCampusGeneralSection(cgRes.ok ? cgRes.rows : [])), false);
    await captureAndAddToPdf(doc, renderReportPage(college, "നിലവിലെ സോഷ്യല്‍ മീഡിയ ഇടപെടല്‍.", renderSocialMediaSection(smRes.ok ? smRes.rows : [])), false);
    await captureAndAddToPdf(doc, renderReportPage(college, "നിര്‍ബന്ധമായും അഡ്രസ്സ് ചെയ്യേണ്ട വിഷയങ്ങള്‍", renderIssuesSection(isRes.ok ? isRes.rows : [])), false);

    doc.save(college.replace(/[^a-z0-9]/gi, "_") + "_Full_Report.pdf");
  } catch (err) {
    console.error(err);
    alert("Report generation failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate Full Report (PDF)";
  }
});
