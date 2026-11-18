/* ============================================================
   WEDDING CONFIG — edit ONLY this file to change site content.
   Anything in [square brackets] is a placeholder: replace it.
   ============================================================ */
window.WEDDING = {
  siteName: "SaMay",
  groom: "Sanu",
  bride: "Mayuri",
  groomFull: "Sanu Roy",
  brideFull: "Mayuri Ghosh",
  groomFamily: "Son of Mr. Mantosh Roy & Mrs. Provati Roy",
  groomAddress: "Khadimpur Bottola, Balurghat",
  brideFamily: "Elder daughter of Mr. Dipu Ghosh & Mrs. Poli Ghosh",
  brideAddress: "Usha Ghosh Road, Khadimpur, Balurghat",
  hostedBy: "Mr. Mantosh Roy & Mrs. Provati Roy",
  hashtag: "#SanuWedsMayuri",
  monogram: "SM",
  city: "Balurghat",
  // Used for the weather card (Open-Meteo, free, no key)
  location: { lat: 25.221, lon: 88.777 },
  // "Our families" section
  families: {
    blessings: "With the blessings of our elders",
    names: ["The Roy family, Khadimpur Bottola", "The Ghosh family, Usha Ghosh Road"],
  },
  // Dress code hints: one row per function, three colour swatches each
  dressCode: [
    { event: "Biye", bn: "বিয়ে", colors: ["#a3121f", "#c9a24e", "#f7f0e1"], note: "Red and gold: Banarasi sarees and dhoti-panjabi" },
    { event: "Bou Bhaat", bn: "বৌভাত", colors: ["#7a2e1f", "#c9a24e", "#f7f0e1"], note: "Evening sarees, panjabis and suits" },
  ],
  // Countdown target. Set the time to the muhurta once known (India offset +05:30).
  weddingDateTime: "2027-02-11T19:00:00+05:30",
  dateLabel: "Thursday, 11 February 2027",
  // Muhurta (লগ্ন): leave "" until confirmed, e.g. "9:15 PM"
  muhurta: "",
  tagline: "With the blessings of our elders, we invite you to celebrate our wedding",

  // Each venue gets its own card, map and directions button.
  // `start` / `end` (ISO) are used for the "Add to calendar" file.
  venues: [
    {
      event: "Wedding Ceremony",
      date: "Thursday, 11 February 2027",
      time: "", // filled from `muhurta` above
      start: "2027-02-11T19:00:00+05:30", end: "2027-02-12T01:00:00+05:30",
      name: "Asha Banquet & Hotels",
      address: "Dipali Nagar, Khadimpur, Balurghat, Dakshin Dinajpur, West Bengal",
      mapQuery: "Asha Banquet & Hotels, Khadimpur, Balurghat",
      mapUrl: "https://share.google/hQbLbV4BIdZirKmVt",
    },
    {
      event: "Reception (Bou-bhat)",
      date: "Sunday, 14 February 2027",
      time: "7:30 PM – 10:30 PM",
      start: "2027-02-14T19:30:00+05:30", end: "2027-02-14T22:30:00+05:30",
      name: "Siddhivinayak Bhaban Ceremonial Hall",
      address: "Near Khudiram More, Khadimpur, Balurghat, Dakshin Dinajpur, West Bengal",
      mapQuery: "Siddhivinayak Bhaban, Khudiram More, Balurghat",
      mapUrl: "https://maps.app.goo.gl/Y2X9JSdwN66Xiyrr9",
    },
  ],

  // Background music: put the file at assets/music.mp3 (or any URL) and set src.
  // Empty src = no music button. Browsers only allow sound after the guest taps the page.
  music: { src: "", title: "Our song" },

  // RSVP backend: paste your Google Apps Script Web App URL here (see README.md)
  rsvpEndpoint: "",
  rsvpDeadline: "by 25 January 2027",

  // Timeline: edit, add or remove events freely (e.g. Aashirbad, Gaye Holud).
  // time "" shows "Time to be announced".
  events: [
    // art: "mandap" | "thali" | "holud" (illustration shown beside the event)
    { id: "biye", name: "Biye", bn: "বিয়ে", date: "Thu, 11 Feb", time: "", art: "mandap",
      start: "2027-02-11T19:00:00+05:30", end: "2027-02-12T01:00:00+05:30",
      place: "Asha Banquet & Hotels", note: "Shubho Drishti, Saat Paak, Mala Badal, Sindoor Daan, followed by dinner" },
    { id: "bou_bhaat", name: "Bou Bhaat", bn: "বৌভাত", date: "Sun, 14 Feb", time: "7:30 PM", art: "thali",
      start: "2027-02-14T19:30:00+05:30", end: "2027-02-14T22:30:00+05:30",
      place: "Siddhivinayak Bhaban Ceremonial Hall", note: "Reception dinner, 7:30 – 10:30 PM, hosted by the Roy family" },
  ],

  // Travel guide. Distances and times are approximate; check train times before booking.
  travel: {
    intro: "Balurghat is the district town of Dakshin Dinajpur in North Bengal. It has its own railway station, and Malda, Siliguri (Bagdogra/NJP) and Kolkata connect it to the rest of India.",
    train: [
      // From the official Balurghat station schedule (18 trains). Recheck closer to the date.
      { title: "Trains arriving at Balurghat (BLGT)", wide: true, timeLabel: "Arrives BLGT",
        text: "Station code BLGT. Times are when the train reaches Balurghat. Tap \"Timings\" for the live schedule, and book early because seats fill up in wedding season.",
        trains: [
          { no: "13189", name: "Sealdah – Balurghat Express", route: "Sealdah → Balurghat", time: "08:30", days: "Daily" },
          { no: "55421", name: "Malda Town – Balurghat Passenger", route: "Malda Town → Balurghat", time: "09:30", days: "Daily" },
          { no: "13431", name: "Nabadwip Dham – Balurghat Express", route: "Nabadwip Dham → Balurghat", time: "11:55", days: "Tue, Wed, Fri, Sat, Sun" },
          { no: "15744", name: "Farakka Express", route: "Bathinda / Delhi → Balurghat", time: "12:55", days: "Tue, Thu, Sat, Sun" },
          { no: "15734", name: "Farakka Express", route: "Bathinda / Delhi → Balurghat", time: "12:55", days: "Mon, Wed, Fri" },
          { no: "15464", name: "Haldibari – Balurghat Intercity", route: "Haldibari → Balurghat", time: "15:15", days: "Daily" },
          { no: "13063", name: "Howrah – Balurghat Express", route: "Howrah → Balurghat", time: "17:55", days: "Mon – Fri" },
          { no: "13161", name: "Kolkata – Balurghat Express (Tebhaga)", route: "Kolkata Terminal → Balurghat", time: "22:00", days: "Mon – Fri, Sun" },
          { no: "16523", name: "SMVT Bengaluru – Balurghat Express", route: "Bengaluru → Balurghat", time: "04:15", days: "Fri" },
        ] },
      { title: "Return trains from Balurghat", wide: true, timeLabel: "Departs BLGT",
        text: "For your journey home. Times are when the train leaves Balurghat.",
        trains: [
          { no: "16524", name: "Balurghat – SMVT Bengaluru Express", route: "Balurghat → Bengaluru", time: "05:15", days: "Sat" },
          { no: "13162", name: "Balurghat – Kolkata Express (Tebhaga)", route: "Balurghat → Kolkata Terminal", time: "05:30", days: "Mon – Sat" },
          { no: "15463", name: "Balurghat – Haldibari Intercity", route: "Balurghat → Haldibari", time: "12:15", days: "Daily" },
          { no: "13432", name: "Balurghat – Nabadwip Dham Express", route: "Balurghat → Nabadwip Dham", time: "14:30", days: "Tue, Wed, Fri, Sat, Sun" },
          { no: "15743", name: "Farakka Express", route: "Balurghat → Delhi / Bathinda", time: "17:00", days: "Tue, Wed, Fri, Sun" },
          { no: "15733", name: "Farakka Express", route: "Balurghat → Delhi / Bathinda", time: "17:00", days: "Mon, Sat" },
          { no: "55422", name: "Balurghat – Malda Town Passenger", route: "Balurghat → Malda Town", time: "18:00", days: "Daily" },
          { no: "13190", name: "Balurghat – Sealdah Express", route: "Balurghat → Sealdah", time: "19:00", days: "Daily" },
          { no: "13064", name: "Balurghat – Howrah Express", route: "Balurghat → Howrah", time: "20:30", days: "Mon – Fri" },
        ] },
      { title: "Via Malda Town (MLDT) — most options", text: "Malda Town has trains from Kolkata, Delhi, Guwahati, Patna and many other cities. From Malda it is about 95 km / 2.5–3 hrs by road (taxi or bus via Gajol).",
        trains: [
          { no: "13011 / 13012", name: "Howrah – Malda Town Intercity", route: "Howrah ↔ Malda Town", note: "Day train" },
          { no: "12041 / 12042", name: "Howrah – NJP Shatabdi", route: "Howrah ↔ Malda Town ↔ NJP", note: "Day train" },
          { no: "12343 / 12344", name: "Darjeeling Mail", route: "Sealdah ↔ Malda Town ↔ NJP", note: "Overnight" },
          { no: "12377 / 12378", name: "Padatik Express", route: "Sealdah ↔ Malda Town ↔ NJP", note: "Overnight" },
        ] },
      { title: "Via New Jalpaiguri (NJP)", text: "Good for travellers from the North-East, Sikkim or Darjeeling. NJP to Balurghat is about 230–250 km, roughly 6 hrs by road." },
    ],
    air: [
      { title: "Bagdogra Airport (IXB) — nearest major airport", text: "Direct flights from Delhi, Kolkata, Mumbai, Bengaluru, Hyderabad and more. About 230–250 km / 6–7 hrs by taxi to Balurghat." },
      { title: "Kolkata Airport (CCU)", text: "The best-connected option. From Kolkata take an overnight train to Balurghat or Malda, or a night bus (10–12 hrs)." },
      { title: "Balurghat Airport", text: "There are no regular scheduled flights at the moment. Check the latest UDAN status before you travel." },
    ],
    road: [
      { title: "From Kolkata", text: "About 420–450 km via NH12. Overnight AC buses run from Esplanade and Karunamoyee (10–12 hrs)." },
      { title: "From Malda / Raiganj / Siliguri", text: "Regular government (NBSTC) and private buses run to Balurghat Bus Stand. Shared and private taxis are also available." },
    ],
    nearbyCities: [
      { name: "Malda", km: "~95 km", hrs: "2.5–3 hrs" },
      { name: "Raiganj", km: "~85 km", hrs: "2.5 hrs" },
      { name: "Gangarampur", km: "~30 km", hrs: "1 hr" },
      { name: "Hili", km: "~25 km", hrs: "45 min" },
      { name: "Siliguri / NJP", km: "~240 km", hrs: "6 hrs" },
      { name: "Kolkata", km: "~430 km", hrs: "10–12 hrs" },
    ],
    usefulLinks: [
      { label: "Book tickets on IRCTC", url: "https://www.irctc.co.in/nget/train-search" },
      { label: "All trains to Balurghat", url: "https://erail.in/trains-between-stations/kolkata-KOAA/balurghat-BLGT" },
      { label: "Live train status (NTES)", url: "https://enquiry.indianrail.gov.in/mntes/" },
    ],
  },

  stay: {
    text: "Rooms are arranged for outstation guests. Tell us in your RSVP whether you need one, and we'll share the details.",
    hotels: [
      { name: "Asha Banquet & Hotels", note: "The wedding venue itself — Dipali Nagar, Khadimpur, Balurghat" },
    ],
  },

  contacts: [
    { role: "Groom's Father", name: "Mantosh Roy", phone: "+919547620477", languages: "Bengali" },
    { role: "Family",         name: "Susmita Roy", phone: "+919734153530", languages: "Bengali, Hindi" },
    { role: "Groom",          name: "Sanu Roy",    phone: "+919434047573", languages: "Bengali, Hindi, English" },
  ],

  faqs: [
    { q: "What is the weather like?", a: "North Bengal winters are cool: around 10–25°C in Dec–Feb, and evenings can be chilly. Bring a light shawl or jacket." },
    { q: "Is there a dress code?", a: "Traditional or festive wear is welcome. Yellow for Gaye Holud!" },
    { q: "Will pickup be arranged?", a: "Yes, from Balurghat station and bus stand, and on request from Malda. Fill in your arrival details in the RSVP." },
    { q: "Can I bring my children?", a: "Of course! Please include them in the guest count." },
  ],
};
