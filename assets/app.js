(function () {
  "use strict";
  const W = window.WEDDING;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : ""), W);
  const QUEUE_KEY = "rsvpQueue";
  const TBA = "Time to be announced";
  const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;

  /* ---------- Text bindings ---------- */
  document.title = `${W.siteName} · ${W.groom} & ${W.bride}'s Wedding`;
  W.venues[0].time = W.venues[0].time || (W.muhurta ? `Lagna ${W.muhurta}` : "Lagna (muhurta) to be announced");
  if (W.muhurta) W.events.forEach((e) => { if (e.id === "biye" && !e.time) e.time = W.muhurta; });
  $$("[data-bind]").forEach((el) => { el.textContent = get(el.dataset.bind); });

  /* ---------- Monogram ---------- */
  const mono = (cx, cy, r) => `
    <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="#fbf6ea"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#7a1222" stroke-width="1.6"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="#7a1222" stroke-width=".8"/>
    <text x="${cx}" y="${cy + r * 0.3}" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="${r * 0.95}" font-weight="500" fill="#7a1222" letter-spacing="-1">${esc(W.monogram || W.groom[0] + W.bride[0])}</text>`;
  $("#archMono").innerHTML = mono(200, 178, 34);
  $("#footMono").innerHTML = mono(50, 50, 44);

  /* ---------- Add to calendar (.ics) ---------- */
  function downloadIcs(items, filename) {
    const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const icsEsc = (s) => String(s).replace(/([,;\\])/g, "\\$1");
    const events = items.map((v, i) => [
      "BEGIN:VEVENT", `UID:${fmt(v.start)}-${i}@samay`, `DTSTAMP:${fmt(Date.now())}`, `DTSTART:${fmt(v.start)}`, `DTEND:${fmt(v.end)}`,
      `SUMMARY:${icsEsc(`${v.event}: ${W.groomFull} & ${W.brideFull}`)}`,
      `LOCATION:${icsEsc(`${v.name}, ${v.address}`)}`,
      `DESCRIPTION:${icsEsc(`${v.time}. Map: ${v.mapUrl} — Details & RSVP: ${location.href.split("#")[0]}`)}`,
      "END:VEVENT",
    ].join("\r\n"));
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SaMay//EN", ...events, "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function eventToCal(e) {
    const v = W.venues.find((x) => x.name === e.place) || {};
    return { event: e.name, start: e.start, end: e.end, name: e.place, address: v.address || W.city, time: e.time || TBA, mapUrl: v.mapUrl || "" };
  }
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-cal]"); if (!b) return;
    const v = W.venues[+b.dataset.cal];
    downloadIcs([v], `samay-${+b.dataset.cal === 0 ? "biye" : "bou-bhaat"}.ics`);
  });

  /* ---------- Opening: part the paan leaves ---------- */
  const gate = $("#gate"), reclose = $("#reclose"), paanL = $("#paanL");
  function openGate() {
    if (gate.classList.contains("open")) return;
    gate.classList.add("open");
    setTimeout(() => { document.body.classList.remove("gated"); reclose.hidden = false; }, 900);
  }
  function closeGate() {
    window.scrollTo(0, 0);
    reclose.hidden = true;
    document.body.classList.add("gated");
    gate.classList.remove("open");
    paanL.focus({ preventScroll: true });
  }
  // Where the card sits inside the lifafa and where it ends up, worked out from the real layout
  const lifafa = $("#lifafa"), card = $(".card", gate);
  function placeCard() {
    const stageH = $(".stage", gate).offsetHeight, envH = lifafa.offsetHeight;
    const top = Math.max(12, stageH * 0.07) - lifafa.offsetTop;
    card.style.top = `${top}px`;
    const center = top + card.offsetHeight / 2;
    gate.style.setProperty("--dy0", `${envH * 0.52 - center}px`);
    gate.style.setProperty("--dy1", `${envH * 0.34 - card.offsetHeight * 0.3 - center}px`);
  }
  placeCard();
  addEventListener("resize", placeCard);
  if (document.fonts) document.fonts.ready.then(placeCard);
  // Swipe up to open: the leaves follow the finger apart, then slide to the sides if pulled far enough
  const stage = $(".stage", gate);
  let startY = null, pulled = 0;
  stage.addEventListener("pointerdown", (e) => {
    if (gate.classList.contains("open")) return;
    startY = e.clientY; pulled = 0; gate.classList.add("dragging");
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (startY === null) return;
    pulled = Math.max(0, Math.min(1, (startY - e.clientY) / 180));
    gate.style.setProperty("--pull", pulled.toFixed(3));
  });
  const release = () => {
    if (startY === null) return;
    startY = null; gate.classList.remove("dragging");
    gate.style.setProperty("--pull", 0);
    // a short tap or a real pull both open it; a small accidental drag springs back
    if (pulled > 0.22 || pulled < 0.03) openGate();
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", () => { startY = null; gate.classList.remove("dragging"); gate.style.setProperty("--pull", 0); });
  paanL.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openGate(); } });
  reclose.addEventListener("click", (e) => { e.stopPropagation(); closeGate(); });
  // Deep links (e.g. …/#rsvp from a reminder message) skip the cover
  if (location.hash.length > 1 && location.hash !== "#top") {
    gate.classList.add("open"); document.body.classList.remove("gated"); reclose.hidden = false;
  }

  /* ---------- Scratch to reveal ---------- */
  const scratches = $$(".scratch");
  const detail = $("#dateDetail");
  $("#dateWhen").textContent = `${W.dateLabel.split(",")[0]}, ${W.muhurta ? `lagna at ${W.muhurta}` : "lagna to be announced"}`;
  $("#dateWhere").textContent = `${W.venues[0].name}, ${W.city}`;
  function markDone(s) {
    s.classList.add("done");
    if (scratches.every((x) => x.classList.contains("done"))) { detail.classList.add("show"); $("#date").classList.add("scratched"); }
  }
  scratches.forEach((s) => {
    const cv = s.querySelector("canvas"), ctx = cv.getContext("2d");
    function paint() {
      const ratio = window.devicePixelRatio || 1, w = cv.offsetWidth, h = cv.offsetHeight;
      if (!w || s.classList.contains("done")) return;
      cv.width = w * ratio; cv.height = h * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#f6e2a6"); g.addColorStop(.32, "#c99a42"); g.addColorStop(.5, "#ecd18a"); g.addColorStop(.72, "#b0822f"); g.addColorStop(1, "#8e6522");
      const box = (x, y, bw, bh, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, bw, bh, r) : ctx.rect(x, y, bw, bh); };
      ctx.fillStyle = g; box(0, 0, w, h, 12); ctx.fill();
      ctx.strokeStyle = "rgba(255,244,214,.55)"; ctx.lineWidth = 1; box(5, 5, w - 10, h - 10, 8); ctx.stroke();
      ctx.fillStyle = "rgba(255,250,230,.7)";
      for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.1 + .3, 0, 7); ctx.fill(); }
      // four-point star in the middle
      const cx = w / 2, cy = h / 2, r = Math.min(w, h) * .16;
      ctx.fillStyle = "rgba(255,250,232,.9)"; ctx.beginPath();
      ctx.moveTo(cx, cy - r); ctx.quadraticCurveTo(cx, cy, cx + r, cy); ctx.quadraticCurveTo(cx, cy, cx, cy + r); ctx.quadraticCurveTo(cx, cy, cx - r, cy); ctx.quadraticCurveTo(cx, cy, cx, cy - r);
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
    }
    paint();
    // the canvas has no size while the page is still behind the cover
    gate.addEventListener("transitionend", paint, { once: true });
    let down = false, moves = 0;
    const scratchAt = (e) => {
      const r = cv.getBoundingClientRect();
      ctx.beginPath(); ctx.arc(e.clientX - r.left, e.clientY - r.top, 15, 0, 7); ctx.fill();
      if (++moves % 6 === 0) {
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let clear = 0; for (let i = 3; i < d.length; i += 16) if (d[i] === 0) clear++;
        if (clear / (d.length / 16) > 0.5) markDone(s);
      }
    };
    cv.addEventListener("pointerdown", (e) => { down = true; cv.setPointerCapture(e.pointerId); scratchAt(e); });
    cv.addEventListener("pointermove", (e) => { if (down) scratchAt(e); });
    ["pointerup", "pointercancel"].forEach((ev) => cv.addEventListener(ev, () => { down = false; }));
  });
  $("#revealAll").addEventListener("click", () => scratches.forEach(markDone));

  /* ---------- Invitation ---------- */
  $("#archVenue").textContent = `${W.venues[0].name}, ${W.city}`;

  /* ---------- Timeline ---------- */
  const artImg = { mandap: ["mandap", 800, 800, "The bride and groom under the wedding canopy"], thali: ["thali", 799, 602, "A Bou Bhaat thali with rice, fish and dal"] };
  $("#timelineList").innerHTML = W.events.map((e, i) => `
    <li>
      <div class="art">${(([f, w, h, alt]) => `<img src="assets/img/${f}.webp" width="${w}" height="${h}" alt="${alt}" loading="lazy">`)(artImg[e.art] || artImg.thali)}</div>
      <div class="txt">
        <div class="d">${esc(e.date)}</div>
        <div class="t${e.time ? "" : " tba"}">${esc(e.time || TBA)}</div>
        <p class="n">${esc(e.name)}</p>
        ${e.bn ? `<p class="bn" lang="bn">${esc(e.bn)}</p>` : ""}
        <p class="p">${esc(e.place)}</p>
        ${e.start ? `<button class="cal" data-ev="${i}">Add to calendar</button>` : ""}
      </div>
    </li>`).join("");
  $("#timelineList").addEventListener("click", (ev) => {
    const b = ev.target.closest(".cal"); if (!b) return;
    const e = W.events[+b.dataset.ev];
    downloadIcs([eventToCal(e)], `samay-${e.id}.ics`);
  });

  /* ---------- Countdown ---------- */
  const target = new Date(W.weddingDateTime).getTime();
  const cd = $("#countdown");
  $("#countdownNote").textContent = `until the ${W.events[0].name}, on ${W.dateLabel.replace(/ \d{4}$/, "")}`;
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) { cd.innerHTML = "<p>The celebration has begun</p>"; return; }
    const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    const pad = (n) => String(n).padStart(2, "0");
    cd.innerHTML = [[d, "Days"], [pad(h), "Hours"], [pad(m), "Minutes"], [pad(s), "Seconds"]]
      .map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("<i>:</i>");
  }
  tick(); setInterval(tick, 1000);

  /* ---------- Location ---------- */
  const mapArt = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="300" fill="#f8f2e4"/>
      <g fill="none" stroke="#ece2cd" stroke-width="1.2"><path d="M40 20h90v70H40zM170 30h80v60h-80zM280 10h100v80H280zM20 200h110v80H20zM270 190h110v90H270z"/></g>
      <path d="M-10 230C80 210 140 250 230 236S360 200 420 214" fill="none" stroke="#dfe8e2" stroke-width="16"/>
      <g fill="none" stroke="#e6dac1" stroke-linecap="round">
        <path d="M-10 120C90 110 160 140 240 128S350 104 420 116" stroke-width="10"/>
        <path d="M150 -10C160 70 140 150 170 310" stroke-width="8"/>
        <path d="M290 -10C270 90 300 200 280 310" stroke-width="6"/>
        <path d="M-10 60C60 70 120 40 200 52" stroke-width="4"/>
        <path d="M200 170C250 180 320 160 420 172" stroke-width="4"/>
      </g>
    </svg>`;
  function renderVenue(i) {
    const v = W.venues[i];
    const q = encodeURIComponent(v.mapQuery);
    $$("#venueTabs button").forEach((b, j) => { b.classList.toggle("on", j === i); b.setAttribute("aria-selected", j === i); });
    $("#venuePanel").innerHTML = `
      <p class="city">${esc(W.city)}</p>
      <p class="venue-name">${esc(v.name)}</p>
      <p class="venue-addr">${esc(v.address)}</p>
      <img class="venue-art" src="assets/img/venue.webp" width="799" height="451" alt="Illustration of a courtyard decorated for a Bengali wedding" loading="lazy">
      <p class="venue-when">${esc(v.date)}<br><i>${esc(v.time)}</i></p>
      <div class="map-card" id="mapCard">
        ${mapArt}
        <svg class="pin" viewBox="0 0 30 40" aria-hidden="true"><use href="#ic-pin"/></svg>
        <button class="map-show" type="button" data-q="${esc(q)}" data-name="${esc(v.name)}">Show the map</button>
      </div>
      <a class="btn-gold" href="${esc(v.mapUrl)}" target="_blank" rel="noopener">Open in Google Maps</a><br>
      <a class="dir-link" href="https://www.google.com/maps/dir/?api=1&destination=${q}" target="_blank" rel="noopener">Get directions from where you are</a>`;
  }
  $("#venueTabs").innerHTML = W.venues.map((v, i) => `<button role="tab" type="button" data-v="${i}">${esc(W.events[i] ? W.events[i].name : v.event)}</button>`).join("");
  $("#venueTabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) renderVenue(+b.dataset.v); });
  // The real map only loads when asked for: a faster page, and no Google request until the guest wants it
  $("#venuePanel").addEventListener("click", (e) => {
    const b = e.target.closest(".map-show"); if (!b) return;
    $("#mapCard").innerHTML = `<iframe title="Map: ${esc(b.dataset.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${esc(b.dataset.q)}&z=15&output=embed"></iframe>`;
  });
  renderVenue(0);

  /* ---------- Travel ---------- */
  $("#route").innerHTML = W.travel.nearbyCities.map((c) =>
    `<li><b>${esc(c.name)}</b><span class="lead"></span><span class="km">${esc(c.km)}</span><small>${esc(c.hrs)}</small></li>`).join("");
  const group = (g, open) => {
    const trains = (g.trains || []).map((t) => {
      const no = t.no.split("/")[0].trim();
      return `<div class="train">
        <span class="no">${esc(t.no)}</span>
        ${t.time ? `<span class="tm">${esc(t.time)}<small>${esc(g.timeLabel || "")}</small></span>` : `<span class="tm"><small>${esc(t.note || "")}</small></span>`}
        <p class="nm">${esc(t.name)}</p>
        <p class="rt">${esc(t.route)}${t.days ? `. Runs ${esc(t.days)}` : ""}</p>
        <div class="lk"><a class="chip" href="https://erail.in/train-enquiry/${esc(no)}" target="_blank" rel="noopener">Timings</a><a class="chip" href="https://www.irctc.co.in/nget/train-search" target="_blank" rel="noopener">Book on IRCTC</a></div>
      </div>`;
    }).join("");
    return `<details class="group"${open ? " open" : ""}><summary>${esc(g.title)}</summary><div class="group-body"><p>${esc(g.text)}</p>${trains}</div></details>`;
  };
  ["train", "air", "road"].forEach((k) => { $(`#panel-${k}`).innerHTML = W.travel[k].map((g, i) => group(g, i === 0)).join(""); });
  $("#travelTabs").addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    $$("#travelTabs button").forEach((x) => { x.classList.toggle("on", x === t); x.setAttribute("aria-selected", x === t); });
    $$("#travel .tab-panel").forEach((p) => { p.hidden = p.id !== `panel-${t.dataset.tab}`; });
  });
  $("#usefulLinks").innerHTML = W.travel.usefulLinks.map((l) => `<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("");
  $("#hotelList").innerHTML = W.stay.hotels.map((h) => `<div class="hotel"><b>${esc(h.name)}</b><span>${esc(h.note)}</span></div>`).join("");

  /* ---------- Dress code, families, contacts, FAQ ---------- */
  $("#dressList").innerHTML = (W.dressCode || []).map((d) => `
    <li><b>${esc(d.event)}${d.bn ? `<span lang="bn">${esc(d.bn)}</span>` : ""}</b>
      <span class="swatches">${d.colors.map((c) => `<i style="background:${esc(c)}"></i>`).join("")}</span>
      <p>${esc(d.note)}</p></li>`).join("");
  $("#familyNames").innerHTML = ((W.families && W.families.names) || []).map((n) => `<p>${esc(n)}</p>`).join("");
  $("#contactList").innerHTML = W.contacts.map((c) => {
    const num = c.phone.replace(/[^\d+]/g, "");
    const pretty = num.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");
    return `<li><div class="who"><b>${esc(c.name)}</b><small>${esc(c.role)}, speaks ${esc(c.languages)}</small><small>${esc(pretty)}</small></div>
      <a href="tel:${esc(num)}" aria-label="Call ${esc(c.name)}">${icon("ic-phone")}</a>
      <a href="https://wa.me/${esc(num.replace("+", ""))}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(c.name)}">${icon("ic-chat")}</a></li>`;
  }).join("");
  $("#faqList").innerHTML = W.faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");

  /* ---------- Weather (Open-Meteo: free, no key) ---------- */
  // Two weeks out it shows the live forecast; before that, what the same days were like over the last five years.
  async function weather() {
    if (!W.location) return;
    const { lat, lon } = W.location;
    const days = W.events.filter((e) => e.start).map((e) => ({ name: e.name, date: e.start.slice(0, 10), label: e.date }));
    const DAY = 864e5, now = Date.now();
    const ahead = (d) => (new Date(d + "T12:00:00+05:30") - now) / DAY;
    const fmtTime = (iso) => new Date(iso + "+05:30").toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const shift = (d, n) => new Date(new Date(d + "T00:00:00Z").getTime() + n * DAY).toISOString().slice(0, 10);
    const base = `latitude=${lat}&longitude=${lon}&timezone=Asia%2FKolkata`;
    const live = days.every((d) => ahead(d.date) > -1 && ahead(d.date) < 15);
    let rows, note;

    if (live) {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?${base}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset&start_date=${days[0].date}&end_date=${days[days.length - 1].date}`);
      const j = (await r.json()).daily;
      const iconFor = (c) => c <= 1 ? "wx-sun" : c <= 3 ? "wx-part" : c <= 48 ? "wx-fog" : c >= 95 ? "wx-storm" : c >= 51 ? "wx-rain" : "wx-cloud";
      note = "The forecast for the wedding days.";
      rows = days.map((d) => {
        const i = j.time.indexOf(d.date);
        return { ...d, icon: iconFor(j.weather_code[i]), hi: j.temperature_2m_max[i], lo: j.temperature_2m_min[i],
          rain: `${j.precipitation_probability_max[i]}% chance of rain`, sunset: fmtTime(j.sunset[i]) };
      });
    } else {
      // Same calendar days, ±3 days, over the five most recent years that have already happened
      const years = [];
      for (let y = new Date().getFullYear(); years.length < 5 && y > 2000; y--) {
        if (ahead(`${y}${days[days.length - 1].date.slice(4)}`) < -4) years.push(y);
      }
      const results = await Promise.all(years.map((y) => {
        const from = shift(`${y}${days[0].date.slice(4)}`, -3), to = shift(`${y}${days[days.length - 1].date.slice(4)}`, 3);
        return fetch(`https://archive-api.open-meteo.com/v1/archive?${base}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,sunset&start_date=${from}&end_date=${to}`)
          .then((r) => r.json()).then((j) => j.daily);
      }));
      note = "What these days are usually like, from the last five years. The live forecast shows here two weeks before.";
      rows = days.map((d) => {
        const md = d.date.slice(5);
        let hi = [], lo = [], wet = 0, n = 0, sunset = "";
        results.forEach((j) => j.time.forEach((t, i) => {
          const diff = Math.abs((new Date(t) - new Date(t.slice(0, 5) + md)) / DAY);
          if (diff > 3) return;
          hi.push(j.temperature_2m_max[i]); lo.push(j.temperature_2m_min[i]); n++;
          if (j.precipitation_sum[i] >= 1) wet++;
          if (diff === 0 && !sunset) sunset = fmtTime(j.sunset[i]);
        }));
        const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
        const share = wet / n;
        return { ...d, icon: share > 0.25 ? "wx-rain" : share > 0.1 ? "wx-part" : "wx-sun", hi: avg(hi), lo: avg(lo),
          rain: share < 0.1 ? "Rain is rare" : `Rain on about ${Math.round(share * 10)} in 10 days`, sunset };
      });
    }
    if (rows.some((r) => !isFinite(r.hi))) return;
    $("#weatherNote").textContent = note;
    $("#weatherList").innerHTML = rows.map((r) => `<li>${icon(r.icon)}
      <div><b>${esc(r.name)}, ${esc(r.label)}</b><small>${esc(r.rain)}${r.sunset ? `. Sunset ${esc(r.sunset)}` : ""}</small></div>
      <div class="temp">${Math.round(r.hi)}°<small> / ${Math.round(r.lo)}°</small></div></li>`).join("");
    $("#weather").hidden = false;
  }
  // Load once the guest scrolls near it; the FAQ still covers weather if this fails
  const wxObs = "IntersectionObserver" in window && new IntersectionObserver((ents) => {
    if (ents.some((e) => e.isIntersecting)) { wxObs.disconnect(); weather().catch((err) => console.warn("Weather unavailable:", err)); }
  }, { rootMargin: "800px" });
  if (wxObs) wxObs.observe($("#faq")); else weather().catch((err) => console.warn("Weather unavailable:", err));

  /* ---------- Share + QR (QR Kept: free, no key) ---------- */
  const pageUrl = location.href.split("#")[0].split("?")[0];
  $("#shareQr").src = `https://qrkept.com/api/qr?url=${encodeURIComponent(pageUrl)}&foregroundColor=7a1222&backgroundColor=fbf6ea`;
  $("#shareQr").addEventListener("error", (e) => { e.target.hidden = true; });
  $("#shareBtn").addEventListener("click", async () => {
    const data = { title: `${W.groom} & ${W.bride}'s wedding`, text: `You're invited to ${W.groom} & ${W.bride}'s wedding, ${W.dateLabel}, ${W.city}.`, url: pageUrl };
    if (navigator.share) { try { await navigator.share(data); } catch (_) { /* closed */ } return; }
    try { await navigator.clipboard.writeText(pageUrl); $("#shareBtn").lastChild.textContent = "Link copied"; }
    catch (_) { window.open(`https://wa.me/?text=${encodeURIComponent(`${data.text} ${pageUrl}`)}`, "_blank", "noopener"); }
  });

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
    // Opening the leaves is the guest's first tap, so the song can start then
    gate.addEventListener("click", () => { if (!userPaused && audio.paused) { audio.volume = 0.6; audio.play().catch(() => {}); } }, { once: true });
  }

  /* ---------- Butterflies ---------- */
  // Real flight behaviour: steer toward a spot, beat hard while flying, glide now and then,
  // perch and slowly fan the wings, then take off again.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const layer = document.createElement("div");
    layer.className = "flutter"; layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    // Seven butterflies, each a different species
    const kinds = ["red", "gold", "blue", "pink", "green", "cream", "monarch"].map((k) => [`assets/img/butterfly-${k}.webp`, 0]);
    const small = innerWidth < 560;
    const rand = (a, b) => a + Math.random() * (b - a);
    const flies = kinds.map(([src, hue]) => {
      const el = document.createElement("div");
      const size = Math.round(small ? rand(26, 42) : rand(32, 50));
      el.className = "bfly";
      // absolute URL: a url() inside a custom property resolves against the stylesheet, not the page
      el.style.setProperty("--img", `url("${new URL(src, location.href).href}")`);
      el.style.setProperty("--size", `${size}px`);
      el.style.setProperty("--hue", `${hue}deg`);
      el.innerHTML = '<i class="w l"></i><i class="w r"></i>';
      layer.appendChild(el);
      const f = { el, size, x: rand(0, innerWidth), y: rand(innerHeight * .2, innerHeight * .8), vx: 0, vy: 0,
        heading: rand(0, Math.PI * 2), phase: rand(0, 6), mode: "fly", until: 0, tx: 0, ty: 0, flap: 0 };
      pickTarget(f, 0);
      return f;
    });
    function pickTarget(f, now) {
      const m = 30;
      f.tx = rand(m, innerWidth - m); f.ty = rand(m, innerHeight - m);
      f.mode = "fly"; f.until = now + rand(2500, 6000);
    }
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(50, now - last) / 1000; last = now;
      flies.forEach((f) => {
        const dx = f.tx - f.x, dy = f.ty - f.y, dist = Math.hypot(dx, dy);
        let beat, amp;  // wing beats per second, how far the wings close (degrees)
        if (f.mode === "perch") {
          f.vx *= .85; f.vy *= .85;
          beat = .55; amp = 38;  // slow fanning while resting
          if (now > f.until) pickTarget(f, now);
        } else {
          // turn smoothly toward the target, with a little wander
          const want = Math.atan2(dy, dx) + Math.sin(now / 700 + f.phase) * .5;
          let turn = ((want - f.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          f.heading += turn * Math.min(1, dt * 2.4);
          const speed = f.mode === "glide" ? 70 : 105;
          f.vx += (Math.cos(f.heading) * speed - f.vx) * Math.min(1, dt * 3);
          f.vy += (Math.sin(f.heading) * speed - f.vy) * Math.min(1, dt * 3);
          if (f.mode === "glide") { beat = 1.2; amp = 12; if (now > f.until) { f.mode = "fly"; f.until = now + rand(1500, 4000); } }
          else {
            beat = 7.5; amp = 72;
            if (now > f.until && dist > 120 && Math.random() < .015) { f.mode = "glide"; f.until = now + rand(500, 1100); }
          }
          if (dist < 18) {
            // land and rest for a while, or keep flying elsewhere
            if (Math.random() < .5) { f.mode = "perch"; f.until = now + rand(2000, 4500); } else pickTarget(f, now);
          } else if (now > f.until + 6000) pickTarget(f, now);
        }
        f.x += f.vx * dt; f.y += f.vy * dt;
        f.phase += dt * beat * Math.PI * 2;
        // wings snap closed faster than they open, like a real downstroke
        const wave = (1 - Math.cos(f.phase)) / 2;
        f.flap = amp * Math.pow(wave, f.mode === "fly" ? .7 : 1);
        const bob = f.mode === "perch" ? 0 : Math.sin(f.phase) * 2.2;
        const tilt = f.mode === "perch" ? f.heading : Math.atan2(f.vy, f.vx);
        f.el.style.transform = `translate(${f.x - f.size / 2}px, ${f.y - f.size / 2 + bob}px) rotate(${tilt + Math.PI / 2}rad)`;
        f.el.style.setProperty("--flap", `${f.flap.toFixed(1)}deg`);
        f.el.style.setProperty("--shade", (1 - f.flap / 260).toFixed(3));
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    addEventListener("resize", () => flies.forEach((f) => { f.x = Math.min(f.x, innerWidth); f.y = Math.min(f.y, innerHeight); }));
  }

  /* ---------- RSVP ---------- */
  const form = $("#rsvpForm"), status = $("#formStatus"), submitBtn = $("#rsvpSubmit"), attendingBox = $("#attendingFields");
  const viaSheet = Boolean(W.rsvpEndpoint);
  const host = W.contacts.find((c) => c.role === "Groom") || W.contacts[W.contacts.length - 1];
  submitBtn.innerHTML = viaSheet ? "Send my reply" : `${icon("ic-chat")}Send on WhatsApp`;
  $("#rsvpFine").textContent = viaSheet
    ? "You'll get a confirmation email. Sending again from this phone updates your reply."
    : `This opens WhatsApp with your reply written out to ${host.name}. Nothing is sent until you press send.`;
  form.email.required = viaSheet;
  $("#emailField span").textContent = viaSheet ? "Email" : "Email (optional)";

  $("#trainList").innerHTML = W.travel.train.flatMap((g) => g.trains || [])
    .flatMap((t) => t.no.split("/").map((n) => `<option value="${esc(n.trim())} ${esc(t.name)}">`)).join("");
  $("#eventChecks").innerHTML = W.events.map((e) => `<label><input type="checkbox" name="events" value="${esc(e.name)}" checked><span>${esc(e.name)}, ${esc(e.date)}</span></label>`).join("");

  form.addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]"); if (!b) return;
    const input = b.parentElement.querySelector("input");
    input.value = Math.min(+input.max, Math.max(+input.min, (+input.value || 0) + +b.dataset.step));
  });
  form.addEventListener("change", (e) => {
    if (e.target.name === "attending") attendingBox.hidden = e.target.value === "No";
    if (e.target.name === "travelMode" && e.target.value === "Already in Balurghat") form.arrivalPoint.value = "Directly at venue";
  });

  function setStatus(msg, cls) { status.textContent = msg; status.className = "form-status " + (cls || ""); }

  // Pre-fill if the guest has already replied from this device
  try {
    const prev = JSON.parse(localStorage.getItem("rsvpLast") || "null");
    if (prev) {
      ["name", "email", "phone", "side"].forEach((k) => { if (prev[k]) form[k].value = prev[k]; });
      setStatus(`Welcome back, ${prev.name}. Sending again will update your earlier reply.`, "");
    }
  } catch (_) { /* storage unavailable */ }

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
    // text/plain avoids a CORS preflight, which Google Apps Script does not support
    const res = await fetch(W.rsvpEndpoint, { method: "POST", body: JSON.stringify(data) });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Server error");
    return json;
  }

  function whatsappText(d) {
    const lines = [`RSVP for ${W.groom} & ${W.bride}'s wedding`, `Name: ${d.name}`, `Phone: ${d.phone}`, `Guest of: ${d.side}`, `Attending: ${d.attending}`];
    if (d.attending !== "No") {
      lines.push(`Guests: ${d.adults} adult(s), ${d.children} child(ren)`, `Functions: ${d.events || "-"}`, `Food: ${d.food}`,
        `Travel: ${d.travelMode}, arriving at ${d.arrivalPoint}${d.arrivalDate ? ` on ${d.arrivalDate}` : ""}${d.arrivalTime ? ` ${d.arrivalTime}` : ""}`);
      if (d.transportNo) lines.push(`Train/flight/bus: ${d.transportNo}`);
      if (d.departureDate) lines.push(`Leaving on: ${d.departureDate}`);
      lines.push(`Pickup needed: ${d.needPickup}`, `Room needed: ${d.needStay}`);
    }
    if (d.message) lines.push(`Note: ${d.message}`);
    return lines.join("\n");
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
    if (!viaSheet) return;
    let q;
    try { q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch (_) { return; }
    if (!q.length || !navigator.onLine) return;
    const left = [];
    for (const item of q) { try { await send(item); } catch (_) { left.push(item); } }
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(left)); } catch (_) {}
    if (!left.length) setStatus("Your saved reply has been sent.", "ok");
  }
  window.addEventListener("online", flushQueue);
  flushQueue();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.website.value) return; // bot trap
    if (!validate()) {
      setStatus(viaSheet ? "Add your name, phone, a valid email and whether you'll attend." : "Add your name, phone and whether you'll attend.", "err");
      return;
    }
    const data = collect();
    if (!viaSheet) {
      const num = host.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(whatsappText(data))}`, "_blank", "noopener");
      done(data, "whatsapp");
      return;
    }
    submitBtn.disabled = true; setStatus("Sending your reply…", "");
    try {
      await send(data);
      done(data, "sent");
    } catch (err) {
      if (!(err instanceof TypeError)) setStatus(`Your reply wasn't saved: ${err.message}. Check the form and send again.`, "err");
      else if (queue(data)) done(data, "queued");
      else setStatus("Your reply couldn't be sent. Try again, or call us.", "err");
    } finally { submitBtn.disabled = false; }
  });

  function done(data, how) {
    try { localStorage.setItem("rsvpLast", JSON.stringify({ name: data.name, email: data.email, phone: data.phone, side: data.side })); } catch (_) {}
    const msg = data.attending === "No" ? "We'll miss you. Thank you for letting us know." :
      data.attending === "Maybe" ? "Thank you. Please update your reply once you know." :
      "We can't wait to celebrate with you.";
    const note = {
      sent: data.email ? `A confirmation email is on its way to ${esc(data.email)}.` : "Your reply is saved.",
      queued: "You seem to be offline. Your reply is saved on this phone and will be sent when you're back online.",
      whatsapp: `WhatsApp should have opened with your reply to ${esc(host.name)}. Press send there to finish.`,
    }[how];
    form.innerHTML = `<div class="thanks"><h3>Thank you, ${esc(data.name.split(" ")[0])}</h3><p>${msg}</p>
      <p class="soft">${note}</p>
      <button class="text-btn gold" type="button" onclick="location.reload()">Change my reply</button></div>`;
  }
})();
