(function () {
  "use strict";
  const W = window.WEDDING;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} },
  };
  const K_KEY = "adminKey", K_CACHE = "adminCache", K_LOCAL = "adminLocalGuests";
  const COLS = ["Name", "Phone", "Email", "Side", "Attending", "Total Guests", "Adults", "Children", "Food", "Events",
    "Travel Mode", "Arriving At", "Arrival Date", "Arrival Time", "Transport No", "Departure Date",
    "Need Pickup", "Need Stay", "Pickup Assigned", "Room Assigned", "Message", "Notes", "Submitted At", "Updated At"];
  const ADMIN_COLS = ["Pickup Assigned", "Room Assigned", "Notes"];

  let serverRows = [], sortCol = "Arrival Date", sortAsc = true;

  /* ---------- Login ---------- */
  function showDash() { $("#loginView").hidden = true; $("#dashView").hidden = false; load(); }
  $("#loginForm").addEventListener("submit", (e) => { e.preventDefault(); store.set(K_KEY, $("#keyInput").value.trim()); showDash(); });
  $("#logoutBtn").addEventListener("click", () => { store.del(K_KEY); location.reload(); });
  if (store.get(K_KEY)) showDash();

  /* ---------- Data ---------- */
  function banner(msg, cls) { $("#banner").innerHTML = msg ? `<div class="banner ${cls}">${msg}</div>` : ""; }

  async function load() {
    const cache = store.get(K_CACHE, null);
    if (cache) { serverRows = cache.rows; render(); }
    if (!W.rsvpEndpoint) { banner("<b>No RSVP endpoint set.</b> Add your Apps Script URL to <code>config.js</code> (see README). Showing guests added on this device only.", "warn"); render(); return; }
    try {
      const url = `${W.rsvpEndpoint}?action=list&key=${encodeURIComponent(store.get(K_KEY, ""))}&t=${Date.now()}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      serverRows = json.rows;
      store.set(K_CACHE, { rows: serverRows, at: new Date().toISOString() });
      banner("", "");
    } catch (err) {
      if (String(err.message).includes("Unauthorized")) { banner("Wrong admin key. Log out and try again.", "err"); serverRows = []; }
      else banner(`Offline or couldn't reach the server. Showing data saved ${cache ? "at " + new Date(cache.at).toLocaleString() : "(none yet)"}.`, "warn");
    }
    render();
  }
  $("#refreshBtn").addEventListener("click", load);

  const keyOf = (r) => String(r.Email || "").toLowerCase() || `${String(r.Name).toLowerCase()}|${String(r.Phone).replace(/\D/g, "")}`;

  function allRows() {
    const local = store.get(K_LOCAL, []);
    const localByKey = new Map(local.map((r) => [keyOf(r), r]));
    const merged = serverRows.map((r) => {
      const l = localByKey.get(keyOf(r));
      if (!l) return { ...r };
      localByKey.delete(keyOf(r));
      const o = { ...r };
      ADMIN_COLS.forEach((c) => { if (l[c]) o[c] = l[c]; }); // admin notes made offline win
      return o;
    });
    localByKey.forEach((r) => merged.push({ ...r, _local: true }));
    merged.forEach((r) => {
      if (r["Total Guests"] === undefined || r["Total Guests"] === "")
        r["Total Guests"] = r.Attending === "No" ? 0 : (+r.Adults || 0) + (+r.Children || 0);
    });
    return merged;
  }

  /* ---------- Render ---------- */
  function countBy(rows, col) {
    const m = {};
    rows.forEach((r) => { const k = r[col] || "—"; m[k] = (m[k] || 0) + (+r["Total Guests"] || 0); });
    return Object.entries(m).sort((a, b) => (col === "Arrival Date" ? a[0].localeCompare(b[0]) : b[1] - a[1]));
  }
  function bars(el, entries) {
    const max = Math.max(1, ...entries.map((e) => e[1]));
    el.innerHTML = entries.length ? entries.map(([k, v]) => `<div class="bar"><label>${esc(k)}</label><i style="width:${(v / max) * 100}%"></i><b>${v}</b></div>`).join("") : `<p class="note">No data yet</p>`;
  }

  function filtered(rows) {
    const q = $("#search").value.toLowerCase(), fa = $("#fAttending").value, fs = $("#fSide").value, fn = $("#fNeed").value;
    return rows.filter((r) =>
      (!q || COLS.some((c) => String(r[c] || "").toLowerCase().includes(q))) &&
      (!fa || r.Attending === fa) && (!fs || r.Side === fs) &&
      (!fn || (fn === "pickup" ? r["Need Pickup"] === "Yes" : r["Need Stay"] === "Yes")));
  }

  function render() {
    const rows = allRows();
    const yes = rows.filter((r) => r.Attending === "Yes");
    const sum = (arr, c) => arr.reduce((s, r) => s + (+r[c] || 0), 0);
    const stats = [
      ["Responses", rows.length], ["Attending", yes.length], ["Headcount", sum(yes, "Total Guests")],
      ["Maybe", rows.filter((r) => r.Attending === "Maybe").length], ["Declined", rows.filter((r) => r.Attending === "No").length],
      ["Need pickup", yes.filter((r) => r["Need Pickup"] === "Yes").length], ["Need stay", yes.filter((r) => r["Need Stay"] === "Yes").length],
      ["Veg meals", sum(yes.filter((r) => r.Food === "Veg"), "Total Guests")],
    ];
    $("#stats").innerHTML = stats.map(([l, v]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");
    bars($("#byMode"), countBy(yes, "Travel Mode"));
    bars($("#byDate"), countBy(yes, "Arrival Date"));
    bars($("#byPoint"), countBy(yes, "Arriving At"));

    const list = filtered(rows).sort((a, b) => {
      const x = String(a[sortCol] || ""), y = String(b[sortCol] || "");
      return (sortAsc ? 1 : -1) * x.localeCompare(y, undefined, { numeric: true });
    });
    const head = `<tr>${COLS.map((c) => `<th data-col="${esc(c)}">${esc(c)}${c === sortCol ? (sortAsc ? " ▲" : " ▼") : ""}</th>`).join("")}</tr>`;
    const body = list.map((r) => `<tr class="${r._local ? "local" : ""}">${COLS.map((c) =>
      `<td>${c === "Attending" ? `<span class="pill ${esc(r[c])}">${esc(r[c])}</span>` : esc(r[c])}</td>`).join("")}</tr>`).join("");
    $("#table").innerHTML = head + (body || `<tr><td colspan="${COLS.length}" class="note">No guests match.</td></tr>`);
    $("#footNote").textContent = `${list.length} of ${rows.length} shown. Highlighted rows were added or imported on this device only.`;
  }

  $("#table").addEventListener("click", (e) => {
    const c = e.target.closest("th")?.dataset.col; if (!c) return;
    sortAsc = c === sortCol ? !sortAsc : true; sortCol = c; render();
  });
  ["search", "fAttending", "fSide", "fNeed"].forEach((id) => $("#" + id).addEventListener("input", render));

  /* ---------- Add offline guest ---------- */
  const dlg = $("#addDialog");
  $("#addBtn").addEventListener("click", () => { $("#addForm").reset(); dlg.showModal(); });
  dlg.addEventListener("close", () => {
    if (dlg.returnValue !== "save") return;
    const o = Object.fromEntries(new FormData($("#addForm")).entries());
    o["Submitted At"] = new Date().toISOString().slice(0, 16).replace("T", " ");
    o.Source = "Manual";
    const local = store.get(K_LOCAL, []);
    local.push(o); store.set(K_LOCAL, local); render();
  });

  /* ---------- Import Excel (offline edits) ---------- */
  $("#importInput").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const wb = XLSX.read(await file.arrayBuffer());
    const sheet = wb.Sheets["All Guests"] || wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
    const serverKeys = new Set(serverRows.map(keyOf));
    // Keep admin columns for server guests, and the full row for guests that exist only offline
    const local = rows.filter((r) => r.Name).map((r) => (serverKeys.has(keyOf(r))
      ? Object.fromEntries([["Name", r.Name], ["Email", r.Email], ["Phone", r.Phone], ...ADMIN_COLS.map((c) => [c, r[c]])])
      : r));
    store.set(K_LOCAL, local);
    banner(`Imported ${local.length} rows from ${esc(file.name)}.`, "warn");
    e.target.value = ""; render();
  });

  /* ---------- Export Excel plan ---------- */
  $("#exportBtn").addEventListener("click", () => {
    if (!window.XLSX) { alert("The Excel library hasn't loaded. Connect to the internet once and reload this page."); return; }
    const rows = allRows().map((r) => { const o = {}; COLS.forEach((c) => (o[c] = r[c] ?? "")); return o; });
    const coming = rows.filter((r) => r.Attending !== "No");
    const byArrival = (a, b) => `${a["Arrival Date"]} ${a["Arrival Time"]}`.localeCompare(`${b["Arrival Date"]} ${b["Arrival Time"]}`);
    const pick = (arr, cols) => arr.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));

    const wb = XLSX.utils.book_new();
    const add = (name, data, header) => {
      const ws = XLSX.utils.json_to_sheet(data.length ? data : [{}], header ? { header } : undefined);
      const keys = header || Object.keys(data[0] || {});
      ws["!cols"] = keys.map((k) => ({ wch: Math.min(40, Math.max(10, String(k).length + 2, ...data.map((r) => String(r[k] ?? "").length + 1))) }));
      if (keys.length) ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(1, data.length), c: keys.length - 1 } }) };
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    // Summary
    const yes = rows.filter((r) => r.Attending === "Yes");
    const n = (arr) => arr.reduce((s, r) => s + (+r["Total Guests"] || 0), 0);
    const summary = [
      { Item: "Wedding", Value: `${W.bride} & ${W.groom}` },
      { Item: "Exported", Value: new Date().toLocaleString() },
      { Item: "Total responses", Value: rows.length },
      { Item: "Attending (families)", Value: yes.length },
      { Item: "Confirmed headcount", Value: n(yes) },
      { Item: "Maybe (headcount)", Value: n(rows.filter((r) => r.Attending === "Maybe")) },
      { Item: "Declined", Value: rows.filter((r) => r.Attending === "No").length },
      { Item: "Need pickup (families)", Value: yes.filter((r) => r["Need Pickup"] === "Yes").length },
      { Item: "Need stay (people)", Value: n(yes.filter((r) => r["Need Stay"] === "Yes")) },
      { Item: "", Value: "" },
      ...["Non-veg", "Veg", "Jain / special"].map((f) => ({ Item: `Meals: ${f}`, Value: n(yes.filter((r) => r.Food === f)) })),
      { Item: "", Value: "" },
      ...countBy(yes, "Travel Mode").map(([k, v]) => ({ Item: `Travel: ${k}`, Value: v })),
    ];
    add("Summary", summary);

    // Event headcount
    add("Event Headcount", W.events.map((e) => {
      const at = yes.filter((r) => String(r.Events).includes(e.name));
      return { Event: e.name, Date: e.date, Time: e.time, Place: e.place, Families: at.length, People: n(at),
        "Non-veg": n(at.filter((r) => r.Food === "Non-veg")), Veg: n(at.filter((r) => r.Food === "Veg")), "Jain / special": n(at.filter((r) => r.Food === "Jain / special")) };
    }));

    add("Arrival Plan", pick(coming.slice().sort(byArrival),
      ["Arrival Date", "Arrival Time", "Arriving At", "Travel Mode", "Transport No", "Name", "Phone", "Total Guests", "Need Pickup", "Pickup Assigned", "Need Stay", "Room Assigned", "Departure Date", "Attending"]));
    add("Pickup List", pick(coming.filter((r) => r["Need Pickup"] === "Yes").sort(byArrival),
      ["Arrival Date", "Arrival Time", "Arriving At", "Transport No", "Name", "Phone", "Total Guests", "Pickup Assigned", "Notes"]));
    add("Accommodation", pick(coming.filter((r) => r["Need Stay"] === "Yes").sort(byArrival).map((r) => {
      const nights = r["Arrival Date"] && r["Departure Date"] ? Math.max(0, Math.round((new Date(r["Departure Date"]) - new Date(r["Arrival Date"])) / 864e5)) : "";
      return { ...r, Nights: nights };
    }), ["Name", "Phone", "Total Guests", "Adults", "Children", "Arrival Date", "Departure Date", "Nights", "Room Assigned", "Notes"]));
    add("All Guests", rows, COLS);
    add("Not Attending", pick(rows.filter((r) => r.Attending === "No"), ["Name", "Phone", "Email", "Side", "Message"]));

    XLSX.writeFile(wb, `SaMay_Wedding_Plan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  });
})();
