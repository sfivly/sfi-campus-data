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
function uuidLike(){ return "g-" + Date.now() + "-" + Math.random().toString(16).slice(2); }

// ---------- CLASS-WISE (step-by-step wizard) ----------
const cwYear = document.getElementById("cw-year");
const cwClass = document.getElementById("cw-class");
const cwClassManual = document.getElementById("cw-class-manual");
const cwStepBasic = document.getElementById("cw-step-basic");
const cwStepRep = document.getElementById("cw-step-rep");
const cwStepRemark = document.getElementById("cw-step-remark");
const cwRepTitle = document.getElementById("cw-rep-title");

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

// seat type: odd rep number = General, even rep number = Reserved
function seatTypeForRep(n){ return (n % 2 === 1) ? "General" : "Reserved"; }

let cwState = null; // { groupId, repCount, currentRep, base:{college,year,className,department,repCount} }

function resetClasswiseForm(){
  cwState = null;
  document.getElementById("cw-department").value = "";
  cwClassManual.value = "";
  cwClassManual.classList.add("hidden");
  cwStepRep.classList.add("hidden");
  cwStepRemark.classList.add("hidden");
  cwStepBasic.classList.remove("hidden");
  clearRepFields();
  document.getElementById("cw-remark-text").value = "";
}
function clearRepFields(){
  document.getElementById("cw-rep-name").value = "";
  document.getElementById("cw-rep-address").value = "";
  document.getElementById("cw-rep-current").value = "SFI";
  document.getElementById("cw-rep-winchance").value = "High";
}

document.getElementById("cw-start-btn").addEventListener("click", () => {
  const college = collegeSelect.value;
  const yearManual = cwYear.value === MANUAL_OPTION;
  const yearLabel = cwYear.options[cwYear.selectedIndex] ? cwYear.options[cwYear.selectedIndex].text : "";
  const className = cwClass.value === MANUAL_OPTION ? cwClassManual.value.trim() : cwClass.value;
  if (!college || !cwYear.value || !className) { showMsg("Please select year and class.", "error"); return; }

  const repCount = parseInt(document.getElementById("cw-repcount").value, 10);
  cwState = {
    groupId: uuidLike(),
    repCount,
    currentRep: 1,
    base: {
      college,
      year: yearManual ? yearLabel : cwYear.value,
      className,
      department: document.getElementById("cw-department").value.trim(),
      repCount
    }
  };

  cwStepBasic.classList.add("hidden");
  cwStepRep.classList.remove("hidden");
  clearRepFields();
  updateRepStepUI();
});

function updateRepStepUI(){
  const n = cwState.currentRep;
  const seat = seatTypeForRep(n);
  cwRepTitle.textContent = `Rep ${n} — ${seat} Seat`;
  const btn = document.getElementById("cw-rep-submit-btn");
  btn.textContent = (n < cwState.repCount) ? "Save & Continue" : "Save & Continue to Remark";
}

document.getElementById("cw-rep-submit-btn").addEventListener("click", async () => {
  const n = cwState.currentRep;
  const seat = seatTypeForRep(n);
  const data = {
    ...cwState.base,
    groupId: cwState.groupId,
    entryType: "rep",
    repNumber: n,
    seatType: seat,
    candidateName: document.getElementById("cw-rep-name").value.trim(),
    candidateAddress: document.getElementById("cw-rep-address").value.trim(),
    currentRep: document.getElementById("cw-rep-current").value,
    winningChance: document.getElementById("cw-rep-winchance").value,
    remark: ""
  };
  const btn = document.getElementById("cw-rep-submit-btn");
  btn.disabled = true;
  const res = await apiCall({ action:"submit", section:"classwise", data });
  btn.disabled = false;

  if (!res.ok) { showMsg("Error: " + (res.error || "unknown"), "error"); return; }

  if (cwState.currentRep < cwState.repCount) {
    cwState.currentRep += 1;
    clearRepFields();
    updateRepStepUI();
    showMsg(`Rep ${n} saved.`, "success");
  } else {
    cwStepRep.classList.add("hidden");
    cwStepRemark.classList.remove("hidden");
    showMsg(`Rep ${n} saved. Now add the class remark.`, "success");
  }
});

document.getElementById("cw-remark-submit-btn").addEventListener("click", async () => {
  const data = {
    ...cwState.base,
    groupId: cwState.groupId,
    entryType: "remark",
    repNumber: "",
    seatType: "",
    candidateName: "",
    candidateAddress: "",
    currentRep: "",
    winningChance: "",
    remark: document.getElementById("cw-remark-text").value.trim()
  };
  const btn = document.getElementById("cw-remark-submit-btn");
  btn.disabled = true;
  const res = await apiCall({ action:"submit", section:"classwise", data });
  btn.disabled = false;

  if (res.ok) {
    showMsg("Class entry complete.", "success");
    resetClasswiseForm();
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
function setBusy(form, busy){
  const btn = form.querySelector("button[type=submit]");
  if (btn) btn.disabled = busy;
}

// ---------- CAMPUS GENERAL: Current Union ----------
document.getElementById("form-cg-union").addEventListener("submit", async (e) => {
  e.preventDefault();
  const college = collegeSelect.value;
  if (!college) { showMsg("Select a college first.", "error"); return; }
  const form = e.target;
  const data = {
    college,
    entryType: "union",
    currentUnion: document.getElementById("cg-union").value,
    unionDetails: document.getElementById("cg-union-details").value.trim()
  };
  setBusy(form, true);
  const res = await apiCall({ action:"submit", section:"campusgeneral", data });
  setBusy(form, false);
  if (res.ok) { showMsg("Union info saved.", "success"); form.reset(); }
  else showMsg("Error: " + (res.error || "unknown"), "error");
});

// ---------- CAMPUS GENERAL: Unit Committee Activities ----------
const cgActOtherCheck = document.getElementById("cg-act-other-check");
const cgActOtherText = document.getElementById("cg-act-other-text");
cgActOtherCheck.addEventListener("change", () => cgActOtherText.classList.toggle("hidden", !cgActOtherCheck.checked));

document.getElementById("form-cg-activities").addEventListener("submit", async (e) => {
  e.preventDefault();
  const college = collegeSelect.value;
  if (!college) { showMsg("Select a college first.", "error"); return; }
  const form = e.target;
  const types = Array.from(document.querySelectorAll(".cg-act-type:checked")).map(cb => cb.value);
  if (cgActOtherCheck.checked) types.push("Other");
  const data = {
    college,
    entryType: "activities",
    activityTypes: types,
    activityOther: cgActOtherCheck.checked ? cgActOtherText.value.trim() : "",
    activityRemark: document.getElementById("cg-act-remark").value.trim()
  };
  setBusy(form, true);
  const res = await apiCall({ action:"submit", section:"campusgeneral", data });
  setBusy(form, false);
  if (res.ok) {
    showMsg("Activities saved.", "success");
    form.reset();
    cgActOtherText.classList.add("hidden");
  } else showMsg("Error: " + (res.error || "unknown"), "error");
});

// ---------- CAMPUS GENERAL: Year-wise Evaluation ----------
document.getElementById("form-cg-yearwise").addEventListener("submit", async (e) => {
  e.preventDefault();
  const college = collegeSelect.value;
  if (!college) { showMsg("Select a college first.", "error"); return; }
  const form = e.target;
  const data = {
    college,
    entryType: "yearwise",
    evalYear: document.getElementById("cg-eval-year").value,
    evalText: document.getElementById("cg-eval-text").value.trim()
  };
  setBusy(form, true);
  const res = await apiCall({ action:"submit", section:"campusgeneral", data });
  setBusy(form, false);
  if (res.ok) { showMsg("Year evaluation saved.", "success"); document.getElementById("cg-eval-text").value = ""; }
  else showMsg("Error: " + (res.error || "unknown"), "error");
});

// ---------- CAMPUS GENERAL: Gang Assessment ----------
document.getElementById("form-cg-gangs").addEventListener("submit", async (e) => {
  e.preventDefault();
  const college = collegeSelect.value;
  if (!college) { showMsg("Select a college first.", "error"); return; }
  const form = e.target;
  const data = {
    college,
    entryType: "gangs",
    gangAssessment: document.getElementById("cg-gangs").value.trim()
  };
  setBusy(form, true);
  const res = await apiCall({ action:"submit", section:"campusgeneral", data });
  setBusy(form, false);
  if (res.ok) { showMsg("Gang assessment saved.", "success"); form.reset(); }
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
