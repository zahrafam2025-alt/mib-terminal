/* EN/FR language switch for the immersive homepage.
 *
 * ADDITIVE OVERLAY — loaded AFTER app.js, it never touches the renderer, so it
 * can't break the page: if anything here throws, app.js has already drawn the
 * English page. It adds an EN|FR toggle to the masthead and swaps text by exact
 * match against a French map = built-in CHROME strings + the per-day content
 * map the build embeds at window.MIB_BRIEF.i18n_fr. English is the default and
 * the fallback (unmapped text stays English). The choice is shared with the
 * rest of the site via localStorage("mib_lang"). Telegram stays English. */
(function () {
  "use strict";
  var KEY = "mib_lang";

  // fixed UI strings (exact textContent match)
  var CHROME = {
    "Today": "Aujourd’hui", "The Week": "La Semaine",
    "Archive": "Archives", "Members": "Abonnés",
    "Free Telegram": "Telegram gratuit",
    "Get the daily brief": "Recevez le brief",
    "Get the daily brief →": "Recevez le brief →",
    "MEMBER": "ABONNÉ", "PUBLIC": "PUBLIC", "MEMBERS": "ABONNÉS",
    "FREE PREVIEW": "APERÇU GRATUIT",
    "TODAY'S BRIEF": "LE BRIEF DU JOUR", "THE ARCHIVE": "LES ARCHIVES",
    "Sign in": "Se connecter", "Log in": "Se connecter",
    "Read the free weekly →": "Lire l’hebdo gratuit →",
    "TODAY": "AUJOURD’HUI", "THE WEEK": "LA SEMAINE",
    "PUBLISHED BEFORE THE US OPEN": "PUBLIÉ AVANT L’OUVERTURE US",
    "STEP INSIDE TODAY'S MARKET": "ENTREZ DANS LE MARCHÉ DU JOUR",
    "STEP INSIDE TODAY’S MARKET": "ENTREZ DANS LE MARCHÉ DU JOUR",
    "Unlock the full brief — free daily →":
      "Débloquez le brief complet — gratuit chaque jour →",
    "DEMO DATA": "DONNÉES DÉMO", "preview": "aperçu",
    // hardcoded homepage section labels (app.js)
    "TODAY'S CATALYST": "LE CATALYSEUR DU JOUR",
    "TODAY’S CATALYST": "LE CATALYSEUR DU JOUR",
    "NEW LEAD": "NOUVEAUTÉ", "THE CATCH": "LE HIC",
    "WHAT FLIPS IT": "CE QUI RENVERSE TOUT",
    "What most are missing": "Ce que la plupart ratent",
    "What the tape says": "Ce que dit le marché",
    "What the narrative assumes": "Ce que le récit suppose",
    "What Changed": "Ce qui a changé",
    "What To Watch Next": "À surveiller ensuite",
    "The Tape": "Le marché", "The Disconnect": "Le décalage",
    "The Consensus View": "Le consensus",
    "The Connections": "Les connexions",
    // locked teaser section titles + stat sublabels
    "WHERE MONEY IS MOVING": "OÙ VA L’ARGENT",
    "WHAT CHANGED": "CE QUI A CHANGÉ",
    "THE DISCONNECT": "LE DÉCALAGE",
    "WHAT'S DRIVING IT": "CE QUI L’ANIME",
    "WHAT’S DRIVING IT": "CE QUI L’ANIME",
    "THE CONSENSUS VIEW": "LE CONSENSUS",
    "WHAT TO WATCH NEXT": "À SURVEILLER ENSUITE",
    "IN PLAIN ENGLISH": "EN LANGAGE SIMPLE",
    "cyclicals − defensives": "cycliques − défensives",
    "cyclicals - defensives": "cycliques − défensives",
    "of up-momentum in top 3": "de la hausse dans le top 3",
    "of sectors green": "de secteurs en vert",
    "flattening": "aplatissement",
    "Today's Story": "L’histoire du jour",
    "Today’s Story": "L’histoire du jour",
    "Members Read The Rest": "Les abonnés lisent la suite",
    "index momentum": "élan de l’indice",
    "What's the catch": "Le hic", "What’s the catch": "Le hic"
  };

  function buildMap() {
    var m = {}, k;
    for (k in CHROME) if (CHROME.hasOwnProperty(k)) m[k] = CHROME[k];
    try {
      var fr = window.MIB_BRIEF && window.MIB_BRIEF.i18n_fr;
      if (fr) for (k in fr) if (fr.hasOwnProperty(k)) m[k] = fr[k];
    } catch (_) {}
    return m;
  }
  var MAP = buildMap();

  function lang() {
    try { return localStorage.getItem(KEY) === "fr" ? "fr" : "en"; }
    catch (_) { return "en"; }
  }

  // swap the text of every leaf element whose English text has a translation
  function apply(l) {
    var nodes = document.querySelectorAll("body *"), i, e, en, key;
    for (i = 0; i < nodes.length; i++) {
      e = nodes[i];
      if (e.children.length || e.closest("[data-lang-btn]")) continue;
      en = e.getAttribute("data-en");
      if (en === null) {
        en = e.textContent;
        key = en && en.trim();
        if (!(key && MAP[key] !== undefined)) continue;   // nothing to do
        e.setAttribute("data-en", en);
      }
      key = en.trim();
      if (MAP[key] !== undefined)
        e.textContent = (l === "fr") ? en.replace(key, MAP[key]) : en;
    }
    document.documentElement.setAttribute("lang", l);
    var btns = document.querySelectorAll("[data-lang-btn]"), b;
    for (i = 0; i < btns.length; i++) {
      b = btns[i];
      b.className = (b.getAttribute("data-lang-btn") === l) ? "on" : "";
    }
    try { localStorage.setItem(KEY, l); } catch (_) {}
  }

  function injectCSS() {
    if (document.getElementById("mib-lang-css")) return;
    var s = document.createElement("style");
    s.id = "mib-lang-css";
    s.textContent =
      ".lang-toggle{display:inline-flex;gap:2px;align-items:center;" +
      "border:1px solid var(--panel-line,rgba(88,116,152,.22));" +
      "border-radius:999px;padding:2px;background:rgba(9,20,38,.5);" +
      "pointer-events:auto}" +
      ".lang-toggle button{appearance:none;border:0;cursor:pointer;" +
      "background:transparent;color:var(--muted,#96a8be);" +
      "font:700 11px/1 var(--mono,ui-monospace,Menlo,monospace);" +
      "letter-spacing:1px;padding:6px 10px;border-radius:999px}" +
      ".lang-toggle button.on{color:var(--bg-deep,#060d1a);" +
      "background:var(--gold,#e9b949)}";
    document.head.appendChild(s);
  }

  function mountToggle() {
    injectCSS();
    if (document.querySelector(".lang-toggle")) return;
    // the immersive shell uses header.masthead; the members home uses .bar
    var host = document.querySelector("header.masthead")
      || document.querySelector(".bar")
      || document.querySelector("header");
    if (!host) return;
    var wrap = document.createElement("span");
    wrap.className = "lang-toggle";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Language / Langue");
    ["en", "fr"].forEach(function (code) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-lang-btn", code);
      btn.textContent = code.toUpperCase();
      wrap.appendChild(btn);
    });
    var stamp = host.querySelector(".stamp");
    host.insertBefore(wrap, stamp || host.querySelector(".menu-toggle") || null);
    wrap.addEventListener("click", function (ev) {
      var t = ev.target.closest("[data-lang-btn]");
      if (t) { ev.preventDefault(); apply(t.getAttribute("data-lang-btn")); }
    });
  }

  function boot() {
    try {
      MAP = buildMap();          // manifest may have loaded after us
      mountToggle();
      apply(lang());
    } catch (_) {}
  }

  // app.js renders asynchronously; re-apply as the DOM fills in, debounced
  var timer = null;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = null; boot(); }, 120);
  }
  if (window.MutationObserver) {
    try {
      new MutationObserver(schedule).observe(document.body,
        { childList: true, subtree: true });
    } catch (_) {}
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
  // a couple of delayed passes catch the scene reveal animations
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
})();
