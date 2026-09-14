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

let lastRows = [];      // raw row objects (with _row / id) for delete
let lastColumns = [];   // display columns
let lastColKeys = [];   // keys matching columns, for table rendering
let lastSection = "";
let lastTitle = "";

const SECTION_META = {
  classwise: {
    label: "Class-wise Details",
    columns: ["Year","Class","Department","Reps","Current Rep (Gen)","Current Rep (Res)","Winning Chance","Remark"],
    keys: ["year","className","department","repCount","currentRepGeneral","currentRepReserved","winningChance","remark"]
  },
  unitcommittee: {
    label: "Unit Committee Members",
    columns: ["Name","Class","Year","Department","Responsibility","Phone"],
    keys: ["name","class","year","department","responsibility","phone"]
  },
  campusgeneral: {
    label: "Campus General",
    columns: ["Union Admin","Activities","Programs","Year-wise Eval","Gang Assessment"],
    keys: ["unionAdmin","activities","programs","yearwiseEval","gangAssessment"]
  },
  socialmedia: {
    label: "Social Media",
    columns: ["Platform","Account/Group Name","Purpose","Current Usage"],
    keys: ["platform","name","purpose","usage"]
  },
  issues: {
    label: "Issues to Address",
    columns: ["Issue","Suggested Action"],
    keys: ["issue","action"]
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
  lastRows = res.rows;
  render();
}

function render(){
  resultTitle.innerHTML = `<h3>${lastTitle}</h3>`;
  if (!lastRows.length){ resultTable.innerHTML = "<p>No entries found.</p>"; return; }
  let html = "<table><thead><tr>";
  lastColumns.forEach(c => html += `<th>${c}</th>`);
  html += "<th>Action</th></tr></thead><tbody>";
  lastRows.forEach(r => {
    html += "<tr>";
    lastColKeys.forEach(k => {
      let v = r[k];
      if (k === "reps" && Array.isArray(v)) {
        v = v.map(rp => `Gen: ${rp.generalName||""} (${rp.generalAddress||""}) | Res: ${rp.reservedName||""} (${rp.reservedAddress||""})`).join("<br>");
      }
      html += `<td>${v ?? ""}</td>`;
    });
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
  const body = lastRows.map(r => lastColKeys.map(k => {
    let v = r[k];
    if (k === "reps" && Array.isArray(v)) {
      v = v.map(rp => `Gen: ${rp.generalName||""} (${rp.generalAddress||""}) / Res: ${rp.reservedName||""} (${rp.reservedAddress||""})`).join("; ");
    }
    return v ?? "";
  }));
  doc.autoTable({ head: [lastColumns], body, startY: 20, styles: { fontSize: 8 }, theme: 'grid' });
  doc.save(lastTitle.replace(/[^a-z0-9]/gi, "_") + ".pdf");
});