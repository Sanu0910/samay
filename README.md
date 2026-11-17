# SaMay: Sanu & Mayuri's Wedding Website

A static wedding site with an RSVP form, a travel guide and an admin dashboard that exports the guest plan to Excel.
It's free to host on GitHub Pages, and Google Sheets + Apps Script act as the database and email sender.

```
index.html          Guest site: details, timeline, travel, stay, FAQ, RSVP
admin.html          Admin dashboard (password = ADMIN_KEY) + Excel export
config.js           ALL wedding content: edit this file
assets/             styles.css, app.js (guest site), admin.js (dashboard)
apps-script/Code.gs Backend: paste into Google Apps Script
```

## 1. Fill in the details
Open `config.js` and replace everything in `[brackets]`: names, date, venue, timeline, hotels and contact numbers.
Set `weddingDateTime` (used by the countdown and calendar invite) and `venue.mapQuery` (for example `"XYZ Banquet Hall, Balurghat"`).
To add confirmed trains, fill the `trains: []` list under "Direct to Balurghat".

## 2. Set up RSVP storage + emails (about 10 minutes)
1. Create a new Google Sheet (for example "Wedding RSVPs").
2. In the sheet, open **Extensions → Apps Script**, delete the sample code and paste in `apps-script/Code.gs`.
3. Edit the top of the script: `ADMIN_KEY` (pick a strong secret), `COUPLE_NAMES`, `NOTIFY_EMAILS`, `SIDE_EMAILS` (bride's and groom's family) and `WEBSITE_URL`.
4. Click **Deploy → New deployment → Web app**. Set Execute as **Me** and Who has access to **Anyone**. Deploy and approve the permissions.
5. Copy the Web app URL (`https://script.google.com/macros/s/…/exec`) into `rsvpEndpoint` in `config.js`.
6. After any later change to the script, use **Deploy → Manage deployments → Edit → New version**. This keeps the same URL.

Each RSVP is then:
- saved as one row in the `RSVPs` tab. If a guest submits again with the same email, their row is updated instead of duplicated.
- emailed to you and to that guest's family side (Bride / Groom).
- confirmed to the guest by email.

Gmail allows about 100 emails a day on a free account. The RSVP is saved even if that limit is hit.

## 3. Run the plan offline in Excel
Open `/admin.html` and enter your `ADMIN_KEY`. Then:
- **⬇ Excel plan** downloads a workbook with these sheets: Summary, Event Headcount, Arrival Plan (sorted by date and time), Pickup List, Accommodation (with nights), All Guests and Not Attending.
- Fill in `Pickup Assigned`, `Room Assigned` and `Notes` in Excel while offline.
- **⬆ Import Excel** brings those edits back into the dashboard.
- **+ Add guest** records replies that came by phone or WhatsApp.
- The dashboard keeps the last downloaded data, so it still opens without internet. Exporting needs the Excel library to have loaded once.

## 4. Publish (GitHub Pages)
```bash
cd wedding_website
git init && git add . && git commit -m "Wedding website"
git branch -M main
git remote add origin https://github.com/Sanu0910/sanuvault.git
git push -u origin main
```
Then on GitHub go to **Settings → Pages**, set Source to **Deploy from branch**, and choose `main` / root.
The site will be at `https://sanu0910.github.io/sanuvault/`. Put that link, or a QR code of it, on the invitation card.

## Test locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
