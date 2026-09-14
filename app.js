const collegeSelect = document.getElementById("collegeSelect");
const sectionPicker = document.getElementById("sectionPicker");
const msgBox = document.getElementById("msg");
const forms = {
  classwise: document.getElementById("form-classwise"),
  unitcommittee: document.getElementById("form-unitcommittee"),
  campusgeneral: document.getElementById("form-campusgeneral"),
  socialmedia: document.getElementById("form-socialmedia"),
  issues: document.getElementById("form-issues")
};

Object.keys(COLLEGES).forEach(c => {
  const opt = document.createElement("option");
  opt.value = c; opt.textContent = c;
  collegeSelect.appendChild(opt);
});

collegeSelect.addEventListener("change", () => {
  if (collegeSelect.value) {
    sectionPicker.classList.remove("hidden");
    populateYearDropdown();
  } else {
    sectionPicker.classList.add("hidden");
    hideAllForms();
  }
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    hideAllForms();
    forms[tab.dataset.section].classList.remove("hidden");
    clearMsg();
  });
});

function hideAllForms(){ Object.values(forms).forEach(f => f.classList.add("hidden")); }
function showMsg(text, type){
  msgBox.textContent = text; msgBox.className = "msg " + type;
  window.scrollTo({top:0, behavior:"smooth"});
  setTimeout(clearMsg, 4000);
}
function clearMsg(){ msgBox.className = "msg"; msgBox.textContent=""; }
function setBusy(form, busy){
  form.querySelector("button[type=submit]").disabled = busy;
}

// ---------- CLASS-WISE ----------
const cwYear = document.getElementById("cw-year");
const cwClass = document.getElementById("cw-class");
const cwClassManual = document.getElementById("cw-class-manual");
const cwRepwrap = document.getElementById("cw-repwrap");

function populateYearDropdown(){
  const college = collegeSelect.value;
  const years = Object.keys(COLLEGES[college] || {});
  cwYear.innerHTML = '<option value="">-- Select Year --</option>';
  years.forEach(y=>{ const o=document.createElement("option"); o.value=y; o.textContent=y; cwYear.appendChild(o); });
  const m=document.createElement("option"); m.value=MANUAL_OPTION; m.textContent="Other / Type manually"; cwYear.appendChild(m);
  cwClass.innerHTML = '<option value="">-- Select Class --</option>';
}

cwYear.addEventListener("change", () => {
  const college = collegeSelect.value;
  cwClass.innerHTML = '<option value="">-- Select Class --</option>';
  cwClassManual.classList.add("hidden");
  if (cwYear.value === MANUAL_OPTION) { cwClassManual.classList.remove("hidden"); return; }
  const classes = (COLLEGES[college] && COLLEGES[college][cwYear.value]) || [];
  classes.forEach(c=>{ const o=document.createElement("option"); o.value=c; o.textContent=c; cwClass.appendChild(o); });
  const m=document.createElement("option"); m.value=MANUAL_OPTION; m.textContent="Other / Type manually"; cwClass.appendChild(m);
});
cwClass.addEventListener("change", () => cwClassManual.classList.toggle("hidden", cwClass.value !== MANUAL_OPTION));

function renderRepFields(){
  const n = parseInt(document.getElementById("cw-repcount").value, 10);
  cwRepwrap.innerHTML = "";
  for (let i=1;i<=n;i++){
    const block = document.createElement("div");
    block.className = "repeat-block";
    block.innerHTML = `
      <strong>Rep ${i}</strong>
      <label>General Seat — Candidate Name</label><input type="text" class="rep-gen-name">
      <label>General Seat — Address</label><input type="text" class="rep-gen-address">
      <label>Reserved Seat — Candidate Name</label><input type="text" class="rep-res-name">
      <label>Reserved Seat — Address</label><input type="text" class="rep-res-address">`;
    cwRepwrap.appendChild(block);
  }
}
document.getElementById("cw-repcount").addEventListener("change", renderRepFields);
renderRepFields();

forms.classwise.addEventListener("submit", async (e) => {
  e.preventDefault();
  const college = collegeSelect.value;
  const yearManual = cwYear.value === MANUAL_OPTION;
  const yearLabel = cwYear.options[cwYear.selectedIndex] ? cwYear.options[cwYear.selectedIndex].text : "";
  const className = cwClass.value === MANUAL_OPTION ? cwClassManual.value.trim() : cwClass.value;
  if (!college || !cwYear.value || !className) { showMsg("Please select year and class.", "error"); return; }

  const reps = [];
  document.querySelectorAll("#cw-repwrap .repeat-block").forEach(block=>{
    reps.push({
      generalName: block.querySelector(".rep-gen-name").value.trim(),
      generalAddress: block.querySelector(".rep-gen-address").value.trim(),
      reservedName: block.querySelector(".rep-res-name").value.trim(),
      reservedAddress: block.querySelector(".rep-res-address").value.trim()
    });
  });

  const data = {
    college, year: yearManual ? yearLabel : cwYear.value, className,
    department: document.getElementById("cw-department").value.trim(),
    repCount: parseInt(document.getElementById("cw-repcount").value,10),
    reps,
    currentRepGeneral: document.getElementById("cw-cur-general").value,
    currentRepReserved: document.getElementById("cw-cur-reserved").value,
    winningChance: document.getElementById("cw-winchance").value,
    remark: document.getElementById("cw-remark").value.trim()
  };

  setBusy(forms.classwise, true);
  const res = await apiCall({ action:"submit", section:"classwise", data });
  setBusy(forms.classwise, false);
  if (res.ok) {
    showMsg("Class details submitted successfully.", "success");
    forms.classwise.reset(); cwClassManual.classList.add("hidden"); renderRepFields();
  } else showMsg("Error: " + (res.error || "unknown"), "error");
});

// ---------- UNIT COMMITTEE ----------
forms.unitcommittee.addEventListener("submit", async (e) => {
  e.preventDefault();
  const college = collegeSelect.value;
  if (!college) { showMsg("Select a college first.", "error"); return; }
  const data = {
    college,
    name: document.getElementById("uc-name").value.trim(),
    class: document.getElementById("uc-class").value.trim(),
    year: document.getElementById("uc-year").value.trim(),
    department: document.getElementById("uc-department").value.trim(),
    responsibility: document.getElementById("uc-responsibility").value.trim(),
    phone: document.getElementById("uc-phone").value.trim()
  };
  if (!data.name){ showMsg("Enter a name.", "error"); return; }
  setBusy(forms.unitcommittee, true);
  const res = await apiCall({ action:"submit", section:"unitcommittee", data });
  setBusy(forms.unitcommittee, false);
  if (res.ok) { showMsg("Committee member added.", "success"); forms.unitcommittee.reset(); }
  else showMsg("Error: " + (res.error || "unknown"), "error");
});

// ---------- CAMPUS GENERAL ----------
forms.campusgeneral.addEventListener("submit", async (e) => {
  e.preventDefault();
  const college = collegeSelect.value;
  if (!college) { showMsg("Select a college first.", "error"); return; }
  const data = {
    college,
    unionAdmin: document.getElementById("cg-admin").value,
    activities: document.getElementById("cg-activities").value.trim(),
    programs: document.getElementById("cg-programs").value.trim(),
    yearwiseEval: document.getElementById("cg-yearwise").value.trim(),
    gangAssessment: document.getElementById("cg-gangs").value.trim()
  };
  setBusy(forms.campusgeneral, true);
  const res = await apiCall({ action:"submit", section:"campusgeneral", data });
  setBusy(forms.campusgeneral, false);
  if (res.ok) showMsg("Campus general info saved.", "success");
  else showMsg("Error: " + (res.error || "unknown"), "error");
});

// ---------- SOCIAL MEDIA ----------
forms.socialmedia.addEventListener("submit", async (e) => {
  e.preventDefault();
  const college = collegeSelect.value;
  if (!college) { showMsg("Select a college first.", "error"); return; }
  const data = {
    college,
    platform: document.getElementById("sm-platform").value,
    name: document.getElementById("sm-name").value.trim(),
    purpose: document.getElementById("sm-purpose").value.trim(),
    usage: document.getElementById("sm-usage").value.trim()
  };
  setBusy(forms.socialmedia, true);
  const res = await apiCall({ action:"submit", section:"socialmedia", data });
  setBusy(forms.socialmedia, false);
  if (res.ok) { showMsg("Social media entry added.", "success"); forms.socialmedia.reset(); }
  else showMsg("Error: " + (res.error || "unknown"), "error");
});

// ---------- ISSUES ----------
forms.issues.addEventListener("submit", async (e) => {
  e.preventDefault();
  const college = collegeSelect.value;
  if (!college) { showMsg("Select a college first.", "error"); return; }
  const data = {
    college,
    issue: document.getElementById("is-issue").value.trim(),
    action: document.getElementById("is-action").value.trim()
  };
  if (!data.issue){ showMsg("Enter the issue.", "error"); return; }
  setBusy(forms.issues, true);
  const res = await apiCall({ action:"submit", section:"issues", data });
  setBusy(forms.issues, false);
  if (res.ok) { showMsg("Issue added.", "success"); forms.issues.reset(); }
  else showMsg("Error: " + (res.error || "unknown"), "error");
});