/* ============================================================
   PATEL VED — Portfolio form handler
   Sends "Get In Touch" and "Hire Me / Project Request" submissions
   straight to paved2307@gmail.com via EmailJS, and logs every
   submission as a new row in a connected Google Sheet.

   ⚠️  SETUP REQUIRED — see SETUP-INSTRUCTIONS.md in this folder.
   Until the three values below are filled in, forms will
   automatically fall back to opening a pre-filled email in the
   visitor's own email app, so nothing is ever silently lost.
   ============================================================ */

const FORM_CONFIG = {
  // From https://dashboard.emailjs.com  (Account → General)
  EMAILJS_PUBLIC_KEY: "YOUR_EMAILJS_PUBLIC_KEY",
  // From https://dashboard.emailjs.com  (Email Services)
  EMAILJS_SERVICE_ID: "YOUR_EMAILJS_SERVICE_ID",
  // From https://dashboard.emailjs.com  (Email Templates)
  EMAILJS_TEMPLATE_ID: "YOUR_EMAILJS_TEMPLATE_ID",
  // Google Apps Script Web App URL (writes each submission into a Google Sheet)
  SHEET_WEBHOOK_URL: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL",
  // Where everything ultimately lands
  TO_EMAIL: "paved2307@gmail.com",
};

function formsConfigured() {
  return (
    FORM_CONFIG.EMAILJS_PUBLIC_KEY.indexOf("YOUR_") !== 0 &&
    FORM_CONFIG.EMAILJS_SERVICE_ID.indexOf("YOUR_") !== 0 &&
    FORM_CONFIG.EMAILJS_TEMPLATE_ID.indexOf("YOUR_") !== 0
  );
}

function sheetConfigured() {
  return FORM_CONFIG.SHEET_WEBHOOK_URL.indexOf("YOUR_") !== 0;
}

if (window.emailjs && formsConfigured()) {
  emailjs.init({ publicKey: FORM_CONFIG.EMAILJS_PUBLIC_KEY });
}

function setStatus(el, text, kind) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove("sending", "success", "error");
  if (kind) el.classList.add(kind);
}

function buildMailtoFallback(subject, bodyLines) {
  const body = encodeURIComponent(bodyLines.join("\n"));
  return `mailto:${FORM_CONFIG.TO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`;
}

async function logToSheet(payload) {
  if (!sheetConfigured()) return;
  try {
    await fetch(FORM_CONFIG.SHEET_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors", // Apps Script web apps don't return CORS headers; fire-and-forget
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Sheet logging failed:", err);
  }
}

/**
 * Wires a form to: EmailJS (direct email) + Google Sheet (log row),
 * with a graceful mailto: fallback if either isn't configured yet.
 */
function wirePortfolioForm({ formEl, statusEl, buttonEl, formType, getPayload, subject }) {
  if (!formEl) return;

  formEl.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }

    const payload = getPayload();
    payload.form_type = formType;
    payload.submitted_at = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const originalLabel = buttonEl ? buttonEl.innerHTML : "";
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.innerHTML = "Sending…";
    }
    setStatus(statusEl, "Sending your message…", "sending");

    // Always log to the sheet in parallel (fire-and-forget, no-cors)
    logToSheet(payload);

    if (formsConfigured() && window.emailjs) {
      try {
        await emailjs.send(FORM_CONFIG.EMAILJS_SERVICE_ID, FORM_CONFIG.EMAILJS_TEMPLATE_ID, payload);
        setStatus(statusEl, "Thanks! Your message has been sent — I'll reply soon.", "success");
        formEl.reset();
      } catch (err) {
        console.error("EmailJS send failed:", err);
        const mailto = buildMailtoFallback(subject, Object.entries(payload).map(([k, v]) => `${k}: ${v}`));
        setStatus(statusEl, "Direct send failed — opening your email app instead.", "error");
        window.location.href = mailto;
      }
    } else {
      // Not configured yet — fall back to the visitor's own email app so nothing is lost
      const mailto = buildMailtoFallback(subject, Object.entries(payload).map(([k, v]) => `${k}: ${v}`));
      setStatus(statusEl, "Opening your email app to send this to me directly…", "sending");
      window.location.href = mailto;
      setTimeout(() => setStatus(statusEl, "If nothing opened, email me directly at " + FORM_CONFIG.TO_EMAIL, ""), 1200);
    }

    if (buttonEl) {
      buttonEl.disabled = false;
      buttonEl.innerHTML = originalLabel;
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // ---- "Get In Touch" form on index.html ----
  wirePortfolioForm({
    formEl: document.getElementById("connect-form"),
    statusEl: document.getElementById("connect-form-status"),
    buttonEl: document.getElementById("connect-submit-btn"),
    formType: "Get In Touch — Portfolio",
    subject: "New portfolio message",
    getPayload: () => ({
      from_name: document.getElementById("connect-name").value.trim(),
      reply_to: document.getElementById("connect-email").value.trim(),
      message: document.getElementById("connect-message").value.trim(),
    }),
  });

  // ---- "Project Request" form on hire-me.html ----
  wirePortfolioForm({
    formEl: document.getElementById("hire-form"),
    statusEl: document.getElementById("hire-form-status"),
    buttonEl: document.getElementById("send-request-btn"),
    formType: "Project Request — Hire Me",
    subject: "New project request",
    getPayload: () => ({
      from_name: document.getElementById("hire-name").value.trim(),
      reply_to: document.getElementById("hire-email").value.trim(),
      project_type: document.getElementById("hire-project-type").value,
      budget: document.getElementById("hire-budget").value,
      message: document.getElementById("hire-details").value.trim(),
    }),
  });
});
