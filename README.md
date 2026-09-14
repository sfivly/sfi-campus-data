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

