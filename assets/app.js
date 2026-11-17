(function () {
  "use strict";
  const W = window.WEDDING;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : ""), W);
  const QUEUE_KEY = "rsvpQueue";

  /* ---------- Text bindings ---------- */
  document.title = `${W.siteName} · ${W.groom} & ${W.bride}'s Wedding`;
  W.initials = W.siteName || `${W.groom[0]} & ${W.bride[0]}`;
  const TBA = "Time to be announced";
  W.venues[0].time = W.venues[0].time || (W.muhurta ? `Muhurta (লগ্ন): ${W.muhurta}` : `Muhurta (লগ্ন): ${TBA.toLowerCase()}`);
  if (W.muhurta) W.events.forEach((e) => { if (e.id === "biye" && !e.time) e.time = `Lagna ${W.muhurta}`; });
  $$("[data-bind]").forEach((el) => { el.textContent = get(el.dataset.bind); });

  /* ---------- Nav ---------- */
  const toggle = $(".nav-toggle"), links = $(".nav-links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  links.addEventListener("click", (e) => { if (e.target.tagName === "A") links.classList.remove("open"); });

  /* ---------- Countdown ---------- */
  const target = new Date(W.weddingDateTime).getTime();
  const cd = $("#countdown");
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) { cd.innerHTML = "<p>The celebration has begun! 🎉</p>"; return; }
    const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    cd.innerHTML = [[d, "Days"], [h, "Hours"], [m, "Mins"], [s, "Secs"]].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("");
  }
  tick(); setInterval(tick, 1000);

  /* ---------- Add to calendar (.ics) ---------- */
  $("#addToCal").addEventListener("click", () => {
    const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const icsEsc = (s) => String(s).replace(/([,;\\])/g, "\\$1");
    const events = W.venues.map((v, i) => [
      "BEGIN:VEVENT", `UID:${fmt(v.start)}-${i}@wedding`, `DTSTAMP:${fmt(Date.now())}`, `DTSTART:${fmt(v.start)}`, `DTEND:${fmt(v.end)}`,
      `SUMMARY:${icsEsc(`${v.event}: ${W.groomFull} & ${W.brideFull}`)}`,
      `LOCATION:${icsEsc(`${v.name}, ${v.address}`)}`,
      `DESCRIPTION:${icsEsc(`${v.time}. Map: ${v.mapUrl} — Details & RSVP: ${location.href.split("#")[0]}`)}`,
      "END:VEVENT",
    ].join("\r\n"));
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding//EN", ...events, "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "wedding.ics"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  /* ---------- Venues + maps ---------- */
  $("#venueList").innerHTML = W.venues.map((v) => {
    const q = encodeURIComponent(v.mapQuery);
    return `<div class="card venue">
      <h3>${esc(v.event)}</h3>
      <p class="big">${esc(v.date)}</p>
      <p class="venue-time">${esc(v.time)}</p>
      <p class="venue-name">${esc(v.name)}</p>
      <p class="muted">${esc(v.address)}</p>
      <div class="map-wrap"><iframe title="Map: ${esc(v.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${q}&z=15&output=embed"></iframe></div>
      <div class="venue-actions">
        <a class="btn btn-primary" href="${esc(v.mapUrl)}" target="_blank" rel="noopener">📍 Open in Google Maps</a>
        <a class="link" href="https://www.google.com/maps/dir/?api=1&destination=${q}" target="_blank" rel="noopener">Directions →</a>
      </div>
    </div>`;
  }).join("");

  /* ---------- Timeline ---------- */
  $("#timelineList").innerHTML = W.events.map((e) => `
    <li class="reveal">
      <div class="when">${esc(e.date)} · ${esc(e.time || TBA)}</div>
      <h3>${esc(e.name)}</h3>
      <p>${esc(e.place)}${e.note ? " — " + esc(e.note) : ""}</p>
    </li>`).join("");

  /* ---------- Travel ---------- */
  const card = (i) => {
    let trains = "";
    if (i.trains && i.trains.length) {
      trains = `<div class="table-scroll"><table class="train-table"><tr><th>Train no.</th><th>Train</th>${i.wide ? `<th>Route</th><th>${esc(i.timeLabel || "Time")}</th><th>Runs</th>` : ""}<th></th></tr>${
        i.trains.map((t) => {
          const first = t.no.split("/")[0].trim();
          return `<tr><td><b>${esc(t.no)}</b></td><td>${esc(t.name)}${i.wide ? "" : `<br><small>${esc(t.route)}</small>`}</td>${i.wide
            ? `<td>${esc(t.route)}</td><td class="train-time"><span class="m-label">${esc(i.timeLabel || "Time")} </span>${esc(t.time)}</td><td><span class="m-label">Runs: </span>${esc(t.days)}</td>` : ""}
            <td class="train-links"><a href="https://erail.in/train-enquiry/${esc(first)}" target="_blank" rel="noopener">Timings</a>
            <a href="https://www.irctc.co.in/nget/train-search" target="_blank" rel="noopener">Book on IRCTC</a></td></tr>`;
        }).join("")}</table></div>`;
    }
    return `<div class="card reveal${i.wide ? " wide" : ""}"><h4>${esc(i.title)}</h4><p>${esc(i.text)}</p>${trains}</div>`;
  };
  ["train", "air", "road"].forEach((k) => { $(`#panel-${k}`).innerHTML = W.travel[k].map(card).join(""); });
  $$(".tab").forEach((t) => t.addEventListener("click", () => {
    $$(".tab").forEach((x) => { x.classList.toggle("active", x === t); x.setAttribute("aria-selected", x === t); });
    $$(".tab-panel").forEach((p) => { p.hidden = p.id !== `panel-${t.dataset.tab}`; });
  }));
  $("#cityGrid").innerHTML = W.travel.nearbyCities.map((c) => `<div class="city"><b>${esc(c.name)}</b><span>${esc(c.km)} · ${esc(c.hrs)}</span></div>`).join("");
  $("#usefulLinks").innerHTML = W.travel.usefulLinks.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("");

  /* ---------- Stay & contacts ---------- */
  $("#hotelList").innerHTML = W.stay.hotels.map((h) => `<div class="card"><p class="big">${esc(h.name)}</p><p class="muted">${esc(h.note)}</p></div>`).join("");
  $("#contactList").innerHTML = W.contacts.map((c) => {
    const num = c.phone.replace(/[^\d+]/g, "");
    const pretty = num.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");
    return `<div class="contact"><small>${esc(c.role)}</small><p>${esc(c.name)}</p>
      <span class="contact-num">${esc(pretty)}</span>
      ${c.languages ? `<span class="contact-lang">🗣 ${esc(c.languages)}</span>` : ""}
      <a href="tel:${esc(num)}">📞 Call</a><a href="https://wa.me/${esc(num.replace("+", ""))}" target="_blank" rel="noopener">💬 WhatsApp</a></div>`;
  }).join("");

  /* ---------- Music ---------- */
  if (W.music && W.music.src) {
    const btn = $("#musicBtn"), audio = new Audio(W.music.src);
    audio.loop = true; audio.preload = "none";
    btn.hidden = false; btn.title = W.music.title || "Music";
    let userPaused = false;
    const sync = () => { const on = !audio.paused; btn.classList.toggle("playing", on); btn.setAttribute("aria-pressed", on); btn.setAttribute("aria-label", on ? "Pause music" : "Play music"); };
    audio.addEventListener("play", sync); audio.addEventListener("pause", sync);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (audio.paused) { userPaused = false; audio.play().catch(() => {}); } else { userPaused = true; audio.pause(); }
    });
    // Start softly on the guest's first tap anywhere (autoplay with sound is blocked by browsers)
    const startOnce = () => { if (!userPaused && audio.paused) { audio.volume = 0.6; audio.play().catch(() => {}); } };
    document.addEventListener("click", startOnce, { once: true });
    document.addEventListener("touchend", startOnce, { once: true });
  }

  /* ---------- FAQ ---------- */
  $("#faqList").innerHTML = W.faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.1 });
    $$(".reveal").forEach((el) => io.observe(el));
  } else $$(".reveal").forEach((el) => el.classList.add("in"));

  /* ---------- RSVP ---------- */
  const form = $("#rsvpForm"), status = $("#formStatus"), submitBtn = $("#rsvpSubmit"), attendingBox = $("#attendingFields");
  $("#trainList").innerHTML = W.travel.train.flatMap((g) => g.trains || [])
    .flatMap((t) => t.no.split("/").map((n) => `<option value="${esc(n.trim())} ${esc(t.name)}">`)).join("");
  $("#eventChecks").innerHTML = W.events.map((e) => `<label><input type="checkbox" name="events" value="${esc(e.name)}" checked> ${esc(e.name)}</label>`).join("");

  form.addEventListener("change", (e) => {
    if (e.target.name === "attending") attendingBox.hidden = e.target.value === "No";
    if (e.target.name === "travelMode" && e.target.value === "Already in Balurghat") form.arrivalPoint.value = "Directly at venue";
  });

  // Pre-fill if the guest has already replied from this device
  try {
    const prev = JSON.parse(localStorage.getItem("rsvpLast") || "null");
    if (prev) {
      ["name", "email", "phone", "side"].forEach((k) => { if (prev[k]) form[k].value = prev[k]; });
      setStatus(`Welcome back, ${prev.name}. Submitting again will update your earlier RSVP.`, "");
    }
  } catch (_) { /* storage unavailable */ }

  function setStatus(msg, cls) { status.textContent = msg; status.className = "form-status " + (cls || ""); }

  function collect() {
    const fd = new FormData(form);
    const data = {};
    for (const [k, v] of fd.entries()) {
      if (k === "events") continue;
      data[k] = typeof v === "string" ? v.trim() : v;
    }
    data.events = fd.getAll("events").join(", ");
    data.needPickup = fd.get("needPickup") ? "Yes" : "No";
    data.needStay = fd.get("needStay") ? "Yes" : "No";
    if (data.attending === "No") {
      ["adults", "children", "food", "events", "travelMode", "arrivalPoint", "arrivalDate", "arrivalTime", "transportNo", "departureDate"].forEach((k) => (data[k] = ""));
      data.needPickup = data.needStay = "No";
    }
    data.submittedAt = new Date().toISOString();
    data.userAgent = navigator.userAgent.slice(0, 120);
    return data;
  }

  function validate() {
    let ok = true;
    $$("input[required]", form).forEach((i) => {
      const bad = i.type === "radio" ? !form.attending.value : !i.checkValidity();
      if (i.type !== "radio") i.classList.toggle("invalid", bad);
      if (bad) ok = false;
    });
    return ok;
  }

  async function send(data) {
    if (!W.rsvpEndpoint) throw new Error("NO_ENDPOINT");
    // text/plain avoids a CORS preflight, which Google Apps Script does not support
    const res = await fetch(W.rsvpEndpoint, { method: "POST", body: JSON.stringify(data) });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Server error");
    return json;
  }

  function queue(data) {
    try {
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      q.push(data);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
      return true;
    } catch (_) { return false; }
  }

  async function flushQueue() {
    let q;
    try { q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch (_) { return; }
    if (!q.length || !navigator.onLine) return;
    const left = [];
    for (const item of q) { try { await send(item); } catch (_) { left.push(item); } }
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(left)); } catch (_) {}
    if (!left.length) setStatus("Your saved RSVP has been sent. Thank you! 💛", "ok");
  }
  window.addEventListener("online", flushQueue);
  flushQueue();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.website.value) return; // bot trap
    if (!validate()) { setStatus("Please fill in your name, a valid email, your phone and whether you'll attend.", "err"); return; }
    const data = collect();
    submitBtn.disabled = true; setStatus("Sending…", "");
    try {
      await send(data);
      done(data, false);
    } catch (err) {
      if (err.message === "NO_ENDPOINT") {
        setStatus("RSVP isn't connected yet. Please contact the family directly.", "err");
      } else if (!(err instanceof TypeError)) {
        setStatus(`Couldn't save your RSVP: ${err.message}. Please check the form and try again.`, "err");
      } else if (queue(data)) {
        done(data, true);
      } else {
        setStatus("Couldn't send your RSVP. Please try again or call us.", "err");
      }
    } finally { submitBtn.disabled = false; }
  });

  function done(data, queued) {
    try { localStorage.setItem("rsvpLast", JSON.stringify({ name: data.name, email: data.email, phone: data.phone, side: data.side })); } catch (_) {}
    const msg = data.attending === "No" ? "We'll miss you! Thank you for letting us know." :
      data.attending === "Maybe" ? "Thank you! Please update your RSVP once you know." :
      "We can't wait to celebrate with you!";
    form.innerHTML = `<div class="thanks"><h3>Thank you, ${esc(data.name.split(" ")[0])}! 💛</h3><p>${msg}</p>
      <p class="muted">${queued ? "You seem to be offline. Your RSVP is saved on this device and will be sent automatically when you're back online." : `A confirmation email is on its way to ${esc(data.email)}.`}</p>
      <button class="btn btn-primary" onclick="location.reload()">Edit my RSVP</button></div>`;
  }
})();
