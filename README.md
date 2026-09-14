**# SFI Campus Data Collection — Setup Guide (Google Drive / Sheets backend)**



**## 1. Create the Google Sheet**

**1. Go to Google Drive → New → Google Sheets. Name it e.g. "SFI Campus Data".**

**2. Create 5 tabs (bottom of the sheet), named exactly:**

&#x20;  **`ClassDetails`, `UnitCommittee`, `CampusGeneral`, `SocialMedia`, `Issues`**

&#x20;  **(Header rows aren't required — the script writes them automatically the first time it runs.)**



**## 2. Add the Apps Script**

**1. In the Sheet: \*\*Extensions → Apps Script\*\*.**

**2. Delete any starter code, paste in the full contents of `Code.gs` (below).**

**3. Click the gear icon ⚙ (Project Settings) → \*\*Script Properties\*\* → add a property:**

&#x20;  **- Key: `ADMIN\_PASSWORD`**

&#x20;  **- Value: whatever permanent password you want admins to use.**

&#x20;  **(You can change this anytime without redeploying — it's just a property.)**



**## 3. Deploy as a Web App**

**1. In Apps Script: \*\*Deploy → New deployment\*\*.**

**2. Click the gear next to "Select type" → \*\*Web app\*\*.**

**3. Settings:**

&#x20;  **- Execute as: \*\*Me\*\***

&#x20;  **- Who has access: \*\*Anyone\*\***

**4. Click \*\*Deploy\*\*, authorize when prompted (it's your own script, so this is safe).**

**5. Copy the \*\*Web app URL\*\* it gives you (ends in `/exec`).**



**## 4. Configure the frontend**

**Open `api-config.js` and paste that URL:**

**```js**

**const API\_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";**

**```**



**## 5. Files to upload to GitHub (repo root)\\**

**(`Code.gs` is NOT uploaded to GitHub — it only lives inside the Apps Script editor**

**attached to your Google Sheet.)**



**## 6. Enable GitHub Pages**

**Repo → Settings → Pages → Source: Deploy from branch → main / (root) → Save.**



**## Notes**

**- All data lives in your Google Sheet — open it anytime to eyeball the raw rows.**

**- The admin panel talks to the same Sheet through the Apps Script API; it never**

&#x20; **touches the Sheet directly, so the Sheet itself can stay private.**

**- If you ever need to re-deploy the script after editing `Code.gs` (e.g. to add**

&#x20; **a field), use \*\*Deploy → Manage deployments → Edit (pencil) → New version\*\*,**

&#x20; **so the same URL keeps working.**

**- Because Apps Script has no real login sessions, the admin panel just re-sends**

&#x20; **the password with every admin action (add/list/delete) — the script checks**

&#x20; **it server-side each time.**


CODE FOR THE GOOGLE SHEET

// ====== CONFIG ======
const SHEETS = {
  classwise: {
    name: "ClassDetails",
    cols: ["id","timestamp","college","year","className","department","repCount",
           "groupId","entryType","repNumber","seatType","candidateName","candidateAddress",
           "currentRep","winningChance","remark"]
  },
  unitcommittee: {
    name: "UnitCommittee",
    cols: ["id","timestamp","college","name","class","year","department","responsibility","phone"]
  },
  campusgeneral: {
    name: "CampusGeneral",
    cols: ["id","timestamp","college","entryType",
           "currentUnion","unionDetails",
           "activityTypes","activityOther","activityRemark",
           "evalYear","evalText",
           "gangAssessment"]
  },
  socialmedia: {
    name: "SocialMedia",
    cols: ["id","timestamp","college","platform","name","purpose","usage"]
  },
  issues: {
    name: "Issues",
    cols: ["id","timestamp","college","issue","action"]
  }
};

function getSheet_(section){
  const meta = SHEETS[section];
  if (!meta) throw new Error("Unknown section: " + section);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(meta.name);
  if (!sh) sh = ss.insertSheet(meta.name);
  if (sh.getLastRow() === 0) sh.appendRow(meta.cols);
  return sh;
}

function checkPassword_(password){
  const real = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  return real && password === real;
}

function jsonOut_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === "submit") {
      return jsonOut_(handleSubmit_(body.section, body.data));
    }
    if (action === "login") {
      return jsonOut_({ ok: checkPassword_(body.password) });
    }
    if (action === "list") {
      if (!checkPassword_(body.password)) return jsonOut_({ error: "Unauthorized" });
      return jsonOut_(handleList_(body.section, body.college));
    }
    if (action === "delete") {
      if (!checkPassword_(body.password)) return jsonOut_({ error: "Unauthorized" });
      return jsonOut_(handleDelete_(body.section, body.id));
    }
    return jsonOut_({ error: "Unknown action" });
  } catch(err){
    return jsonOut_({ error: err.message });
  }
}

function handleSubmit_(section, data){
  const meta = SHEETS[section];
  const sh = getSheet_(section);
  const id = Utilities.getUuid();
  const row = meta.cols.map(c => {
    if (c === "id") return id;
    if (c === "timestamp") return new Date();
    let v = data[c];
    if (Array.isArray(v)) return JSON.stringify(v);
    return v === undefined || v === null ? "" : v;
  });
  sh.appendRow(row);
  return { ok: true, id };
}

function handleList_(section, college){
  const meta = SHEETS[section];
  const sh = getSheet_(section);
  const values = sh.getDataRange().getValues();
  const header = values[0];
  const rows = values.slice(1);
  const idIdx = header.indexOf("id");
  const collegeIdx = header.indexOf("college");
  const out = [];
  rows.forEach((r, i) => {
    if (!r[idIdx]) return;
    if (college && r[collegeIdx] !== college) return;
    const obj = {};
    header.forEach((h, j) => {
      let v = r[j];
      if ((h === "activityTypes") && typeof v === "string" && v.startsWith("[")) {
        try { v = JSON.parse(v); } catch(e){}
      }
      if (h === "timestamp" && v instanceof Date) v = v.toISOString();
      obj[h] = v;
    });
    obj._row = i + 2;
    out.push(obj);
  });
  return { ok: true, rows: out };
}

function handleDelete_(section, id){
  const sh = getSheet_(section);
  const values = sh.getDataRange().getValues();
  const idIdx = values[0].indexOf("id");
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIdx] === id) {
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: "Row not found" };
}

function doGet(){
  return jsonOut_({ ok: true, message: "SFI Campus Data API is running." });
}
