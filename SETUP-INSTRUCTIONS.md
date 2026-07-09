# Getting form submissions to email you + log to a sheet

Your portfolio is a static site (no server), so it can't send email or write to
a spreadsheet on its own — it needs two small free services connected, both of
which take about 10–15 minutes total to set up. Once connected, **both forms**
(the "Get In Touch" form on the homepage and the "Project Request" form on
Hire Me) will:

1. Email the submission straight to **paved2307@gmail.com**
2. Log the submission as a new row in a Google Sheet (which you can open in
   Excel, Google Sheets, or export as `.xlsx` any time)

All the code is already wired up in **`site-forms.js`** — you just need to
paste four values into the `FORM_CONFIG` object at the top of that file.

Until you do that, the forms still work: they'll open a pre-filled email in
the visitor's own email app addressed to you, so nothing is lost — you just
won't get the automatic inbox + spreadsheet version yet.

---

## Part 1 — Email delivery (EmailJS, free)

1. Go to https://www.emailjs.com and create a free account.
2. **Email Services** → **Add New Service** → connect your Gmail
   (paved2307@gmail.com). Note the **Service ID** it gives you.
3. **Email Templates** → **Create New Template**. Use these variables in the
   template body (they match what the site sends):
   `{{from_name}}`, `{{reply_to}}`, `{{message}}`, `{{form_type}}`,
   `{{submitted_at}}`, and for the Hire Me form also
   `{{project_type}}`, `{{budget}}`.
   Set the template's "To Email" field to `paved2307@gmail.com` and
   "Reply To" to `{{reply_to}}` so you can hit reply directly.
   Note the **Template ID**.
4. **Account** → **General** → copy your **Public Key**.
5. Open `site-forms.js` and fill these in:
   ```js
   EMAILJS_PUBLIC_KEY: "paste your public key",
   EMAILJS_SERVICE_ID: "paste your service id",
   EMAILJS_TEMPLATE_ID: "paste your template id",
   ```

EmailJS's free tier covers 200 emails/month, which is plenty for a portfolio.

---

## Part 2 — Logging to a Google Sheet ("the Excel sheet")

1. Create a new Google Sheet — name it something like **Portfolio Leads**.
   Add a header row: `submitted_at | form_type | from_name | reply_to |
   project_type | budget | message`
2. In the Sheet, go to **Extensions → Apps Script**, delete the placeholder
   code, and paste this:

   ```javascript
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     const data = JSON.parse(e.postData.contents);
     sheet.appendRow([
       data.submitted_at || new Date(),
       data.form_type || "",
       data.from_name || "",
       data.reply_to || "",
       data.project_type || "",
       data.budget || "",
       data.message || ""
     ]);
     return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

3. Click **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorize it, and copy the **Web app URL**.
4. Open `site-forms.js` and paste it in:
   ```js
   SHEET_WEBHOOK_URL: "paste your Apps Script web app URL",
   ```

Every form submission will now also land as a new row in that Google Sheet —
open it in Google Sheets, or **File → Download → Microsoft Excel (.xlsx)**
any time you want an actual Excel file.

---

## That's it

Save `site-forms.js`, re-upload the site (or push to GitHub/Vercel), and both
forms will send directly to your inbox and log to your sheet. No other files
need to change.
