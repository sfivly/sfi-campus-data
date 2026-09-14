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
    columns: ["Timestamp","Year","Class","Department","Entry Type","Rep #","Seat","Candidate Name","Candidate Address","Current Rep","Winning Chance","Remark"],
    keys: ["timestamp","year","className","department","entryType","repNumber","seatType","candidateName","candidateAddress","currentRep","winningChance","remark"]
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

function render(){
  resultTitle.innerHTML = `<h3>${lastTitle}</h3>`;
  if (!lastRows.length){ resultTable.innerHTML = "<p>No entries found.</p>"; return; }
  let html = "<table><thead><tr>";
  lastColumns.forEach(c => html += `<th>${c}</th>`);
  html += "<th>Action</th></tr></thead><tbody>";
  lastRows.forEach(r => {
    html += "<tr>";
    lastColKeys.forEach(k => { html += `<td>${formatCell(k, r[k])}</td>`; });
    html += `<td><button class="btn small secondary" onclick="deleteRow('${r.id}')">Delete</button></td>`;
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
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(lastTitle, 14, 15);
  const body = lastRows.map(r => lastColKeys.map(k => formatCell(k, r[k])));
  doc.autoTable({ head: [lastColumns], body, startY: 20, styles: { fontSize: 8 }, theme: 'grid' });
  doc.save(lastTitle.replace(/[^a-z0-9]/gi, "_") + ".pdf");
});
