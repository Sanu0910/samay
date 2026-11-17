/**
 * Wedding RSVP backend: Google Apps Script bound to a Google Sheet.
 * - doPost: saves or updates an RSVP (matched by email) and sends emails
 * - doGet?action=list&key=ADMIN_KEY: returns all RSVPs as JSON for admin.html
 * Setup steps are in README.md.
 */

// ====== EDIT THESE ======
const ADMIN_KEY = "change-this-secret-key";           // admin.html asks for this
const COUPLE_NAMES = "Sanu & Mayuri";
const NOTIFY_EMAILS = ["you@example.com"];              // gets a copy of every RSVP
const SIDE_EMAILS = {                                   // each family gets its own guests' RSVPs
  Bride: "bride.family@example.com",
  Groom: "groom.family@example.com",
};
const WEBSITE_URL = "https://your-site-url";
const SEND_GUEST_CONFIRMATION = true;
// ========================

const SHEET_NAME = "RSVPs";
const HEADERS = [
  "Submitted At", "Updated At", "Name", "Email", "Phone", "Side", "Attending",
  "Adults", "Children", "Total Guests", "Food", "Events",
  "Travel Mode", "Arriving At", "Arrival Date", "Arrival Time", "Transport No",
  "Departure Date", "Need Pickup", "Need Stay", "Message", "Pickup Assigned", "Room Assigned", "Notes",
];
const FIELD_MAP = {
  "Name": "name", "Email": "email", "Phone": "phone", "Side": "side", "Attending": "attending",
  "Adults": "adults", "Children": "children", "Food": "food", "Events": "events",
  "Travel Mode": "travelMode", "Arriving At": "arrivalPoint", "Arrival Date": "arrivalDate",
  "Arrival Time": "arrivalTime", "Transport No": "transportNo", "Departure Date": "departureDate",
  "Need Pickup": "needPickup", "Need Stay": "needStay", "Message": "message",
};

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#7a1222").setFontColor("#ffffff");
    // Plain-text columns so dates/times/numbers like "08:30" or "+91…" are kept as typed
    sh.getRange("A:X").setNumberFormat("@");
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  // Leading = + - @ would make Sheets treat input as a formula
  let s = String(v == null ? "" : v).slice(0, max || 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function stamp_(d) {
  return Utilities.formatDate(d, "Asia/Kolkata", "yyyy-MM-dd HH:mm");
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const d = JSON.parse(e.postData.contents);
    if (d.website) return json_({ ok: true }); // honeypot
    const email = String(d.email || "").trim().toLowerCase();
    if (!d.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !d.attending) {
      return json_({ ok: false, error: "Missing name, email or attendance" });
    }
    d.email = email;
    const sh = getSheet_();
    const now = stamp_(new Date());
    const values = sh.getDataRange().getValues();
    const emailCol = HEADERS.indexOf("Email");
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][emailCol]).toLowerCase() === email) { rowIndex = i + 1; break; }
    }
    const total = (parseInt(d.adults, 10) || 0) + (parseInt(d.children, 10) || 0);
    const existing = rowIndex > 0 ? values[rowIndex - 1] : null;
    const row = HEADERS.map((h, idx) => {
      if (h === "Submitted At") return existing ? existing[idx] : now;
      if (h === "Updated At") return now;
      if (h === "Total Guests") return String(d.attending === "No" ? 0 : total);
      if (FIELD_MAP[h]) return clean_(d[FIELD_MAP[h]], h === "Message" ? 1000 : 200);
      return existing ? existing[idx] : ""; // keep admin-only columns
    });
    if (rowIndex > 0) sh.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    try { sendEmails_(d, rowIndex > 0, total); } catch (mailErr) { console.error(mailErr); } // RSVP is saved even if mail quota is hit
    return json_({ ok: true, updated: rowIndex > 0 });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== "list") return json_({ ok: true, service: "wedding-rsvp" });
  if (p.key !== ADMIN_KEY) return json_({ ok: false, error: "Unauthorized" });
  const values = getSheet_().getDataRange().getDisplayValues();
  const headers = values.shift();
  const rows = values.map((r) => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
  return json_({ ok: true, rows: rows });
}

function sendEmails_(d, isUpdate, total) {
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lines = [
    ["Attending", d.attending], ["Guests", d.attending === "No" ? "-" : total + " (" + (d.adults || 0) + " adults, " + (d.children || 0) + " children)"],
    ["Side", d.side], ["Phone", d.phone], ["Events", d.events], ["Travel", d.travelMode],
    ["Arriving at", d.arrivalPoint], ["Arrival", (d.arrivalDate || "") + " " + (d.arrivalTime || "")],
    ["Train/Flight", d.transportNo], ["Departure", d.departureDate],
    ["Pickup needed", d.needPickup], ["Stay needed", d.needStay], ["Food", d.food], ["Message", d.message],
  ].filter((l) => l[1] && String(l[1]).trim());
  const table = "<table cellpadding='6' style='border-collapse:collapse;font-family:sans-serif'>" +
    lines.map((l) => "<tr><td style='color:#7a6a5f'>" + l[0] + "</td><td><b>" + esc(l[1]) + "</b></td></tr>").join("") + "</table>";

  // 1. Notify the couple + the guest's family side
  const to = NOTIFY_EMAILS.slice();
  if (SIDE_EMAILS[d.side]) to.push(SIDE_EMAILS[d.side]);
  if (d.side === "Both") Object.keys(SIDE_EMAILS).forEach((k) => to.push(SIDE_EMAILS[k]));
  const uniq = to.filter((v, i, a) => v && a.indexOf(v) === i && v.indexOf("example.com") === -1);
  if (uniq.length) {
    MailApp.sendEmail({
      to: uniq.join(","),
      replyTo: d.email,
      subject: (isUpdate ? "Updated RSVP: " : "New RSVP: ") + d.name + " — " + d.attending,
      htmlBody: "<h2 style='font-family:Georgia;color:#7a1222'>" + esc(d.name) + "</h2><p>" + esc(d.email) + "</p>" + table,
    });
  }

  // 2. Confirmation to the guest
  if (SEND_GUEST_CONFIRMATION) {
    const greet = d.attending === "Yes" ? "We're so happy you'll be joining us!" :
      d.attending === "Maybe" ? "Thanks for letting us know. Please update your RSVP once you're sure." :
      "We'll miss you, and thank you for letting us know.";
    MailApp.sendEmail({
      to: d.email,
      name: COUPLE_NAMES,
      subject: "Your RSVP for the wedding of " + COUPLE_NAMES,
      htmlBody: "<div style='font-family:sans-serif;max-width:560px'><h2 style='font-family:Georgia;color:#7a1222'>Dear " + esc(d.name) + ",</h2><p>" + greet +
        "</p><p>Here's what we received:</p>" + table +
        "<p>Need to change something? Just submit the form again with the same email: <a href='" + WEBSITE_URL + "#rsvp'>" + WEBSITE_URL + "</a></p><p>With love,<br>" + COUPLE_NAMES + "</p></div>",
    });
  }
}
