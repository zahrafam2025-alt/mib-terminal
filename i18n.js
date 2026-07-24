/* EN/FR language switch for the immersive homepage.
 *
 * ADDITIVE OVERLAY — loaded AFTER app.js, it never touches the renderer, so it
 * can't break the page: if anything here throws, app.js has already drawn the
 * English page. It adds an EN|FR toggle to the masthead and swaps text to
 * French with three passes, in order of confidence:
 *   1. exact match  — whole-node text == a key in the map (chrome + the
 *      per-day content map the build embeds at window.MIB_BRIEF.i18n_fr);
 *   2. regex rules  — the composed number chips app.js stitches at render time
 *      ("of 268 tracked names advancing", "ADVANCING 102", …) where the digits
 *      vary but the shape is fixed;
 *   3. substring    — multi-word map phrases found INSIDE a composed node
 *      ("consensus: <translated value>", "VIX 21.4 flattening").
 * English is the default and the fallback: anything none of the passes touch
 * stays English. The choice is shared site-wide via localStorage("mib_lang").
 * Telegram stays English. */
(function () {
  "use strict";
  var KEY = "mib_lang";

  // fixed UI strings (exact whole-node textContent match)
  var CHROME = {
    // nav / masthead
    "Today": "Aujourd’hui", "The Week": "La Semaine",
    "Archive": "Archives", "Members": "Abonnés",
    "Free Telegram": "Telegram gratuit",
    "Get the daily brief": "Recevez le brief",
    "Get the daily brief →": "Recevez le brief →",
    "Get the daily brief — before the bell →":
      "Recevez le brief — avant l’ouverture →",
    "Get the free daily brief": "Recevez le brief gratuit",
    "Get the free daily brief →": "Recevez le brief gratuit →",
    "Get the free daily brief — before the bell →":
      "Recevez le brief gratuit — avant l’ouverture →",
    "Get it free on Telegram →": "Gratuit sur Telegram →",
    "Premium": "Premium", "MIB Premium": "MIB Premium",
    "Coming soon": "Bientôt disponible",
    "FREE · FULL BRIEF": "GRATUIT · BRIEF COMPLET",
    "Tomorrow the market tells a different story. Read it here, free, every morning.":
      "Demain, le marché raconte une autre histoire. Lisez-la ici, gratuitement, chaque matin.",
    "Premium is on the way. Today's brief stays free, every trading morning — this is what compounds on top of it.":
      "Premium arrive bientôt. Le brief du jour reste gratuit, chaque matin de bourse — voici ce qui s’y ajoute et se cumule.",
    "MEMBER": "ABONNÉ", "PUBLIC": "PUBLIC", "MEMBERS": "ABONNÉS",
    "MEMBER VIEW": "VUE ABONNÉ",
    "FREE PREVIEW": "APERÇU GRATUIT",
    "TODAY'S BRIEF": "LE BRIEF DU JOUR", "THE ARCHIVE": "LES ARCHIVES",
    "Sign in": "Se connecter", "Log in": "Se connecter",
    "Read the free weekly →": "Lire l’hebdo gratuit →",
    "TODAY": "AUJOURD’HUI", "THE WEEK": "LA SEMAINE",
    "PUBLISHED BEFORE THE US OPEN": "PUBLIÉ AVANT L’OUVERTURE US",
    "published before the US open": "publié avant l’ouverture US",
    "·  published before the US open": "·  publié avant l’ouverture US",
    "Market Intelligence Brief · Terminal":
      "Brief d’intelligence de marché · Terminal",
    "STEP INSIDE TODAY'S MARKET": "ENTREZ DANS LE MARCHÉ DU JOUR",
    "STEP INSIDE TODAY’S MARKET": "ENTREZ DANS LE MARCHÉ DU JOUR",
    "Unlock the full brief — free daily →":
      "Débloquez le brief complet — gratuit chaque jour →",
    "DEMO DATA": "DONNÉES DÉMO", "preview": "aperçu", "free": "gratuit",
    // homepage section labels (app.js literals, both cases)
    "TODAY'S STORY": "L’HISTOIRE DU JOUR", "TODAY’S STORY": "L’HISTOIRE DU JOUR",
    "Today's Story": "L’histoire du jour", "Today’s Story": "L’histoire du jour",
    "THE TAPE": "LE MARCHÉ", "The Tape": "Le marché",
    "Where Money Is Moving": "Où va l’argent",
    "WHERE MONEY IS MOVING": "OÙ VA L’ARGENT",
    "What Changed": "Ce qui a changé", "WHAT CHANGED": "CE QUI A CHANGÉ",
    "What's Driving It": "Ce qui l’anime", "What’s Driving It": "Ce qui l’anime",
    "WHAT'S DRIVING IT": "CE QUI L’ANIME", "WHAT’S DRIVING IT": "CE QUI L’ANIME",
    "The Disconnect": "Le décalage", "THE DISCONNECT": "LE DÉCALAGE",
    "The Consensus View": "Le consensus", "THE CONSENSUS VIEW": "LE CONSENSUS",
    "The Connections": "Les connexions",
    "What To Watch Next": "À surveiller ensuite",
    "WHAT TO WATCH NEXT": "À SURVEILLER ENSUITE",
    "In Plain English": "En langage simple", "IN PLAIN ENGLISH": "EN LANGAGE SIMPLE",
    "Counter-risk": "Risque inverse",
    "AI / SEMIS": "IA / SEMI-CONDUCTEURS", "AI / Semis": "IA / Semi-conducteurs",
    "CROSS-ASSET": "INTER-ACTIFS", "Cross-Asset": "Inter-actifs",
    "Crypto": "Crypto",
    "↑ LEADERS": "↑ EN TÊTE", "↓ LAGGARDS": "↓ EN QUEUE",
    "LEADERS": "EN TÊTE", "LAGGARDS": "EN QUEUE",
    "What most are missing": "Ce que la plupart ratent",
    "What the tape says": "Ce que dit le marché",
    "What the narrative assumes": "Ce que le récit suppose",
    "TODAY'S CATALYST": "LE CATALYSEUR DU JOUR",
    "TODAY’S CATALYST": "LE CATALYSEUR DU JOUR",
    "NEW LEAD": "NOUVEAUTÉ", "THE CATCH": "LE HIC",
    "WHAT FLIPS IT": "CE QUI RENVERSE TOUT",
    "What's the catch": "Le hic", "What’s the catch": "Le hic",
    // sector taxonomy (fixed labels)
    "Energy": "Énergie", "Utilities": "Services publics",
    "Semiconductors": "Semi-conducteurs", "Semis": "Semis",
    "Healthcare": "Santé", "Financials": "Finance",
    "Defense": "Défense", "Defense & Aerospace": "Défense & aérospatiale",
    "Gold": "Or", "Gold & Miners": "Or & mines", "Rates": "Taux",
    "Volatility": "Volatilité", "Materials": "Matériaux",
    "Industrials": "Industrie", "Real Estate": "Immobilier",
    "Communication Services": "Communication",
    "Consumer Discretionary": "Conso. discrétionnaire",
    "Consumer Staples": "Conso. de base",
    "Mega-cap Tech": "Tech méga-cap", "Travel & Airlines": "Voyage & aérien",
    "(Energy)": "(Énergie)", "(Defense)": "(Défense)", "(Gold)": "(Or)",
    "(Semis)": "(Semis)", "(Airlines)": "(Aérien)", "(Autos)": "(Autos)",
    "(Mega-cap)": "(Méga-cap)", "(Financials)": "(Finance)",
    "(Healthcare)": "(Santé)", "(Utilities)": "(Services publics)",
    // MiB Market Health gauge (member home + weekly)
    "MiB MARKET HEALTH": "SANTÉ DU MARCHÉ MiB",
    "Participation": "Participation", "Breadth": "Ampleur",
    "Leadership": "Leadership", "Risk Appetite": "Appétit pour le risque",
    "Cross Asset": "Cohérence des actifs",
    "HEALTHY": "SAINE", "STEADY": "STABLE", "TIRING": "S’ESSOUFFLE",
    "DIVERGENT": "DIVERGENTE", "STRESSED": "SOUS TENSION",
    "How to read this": "Comment le lire",
    "Biggest drag:": "Plus gros frein :", "last week": "sem. dernière",
    "share of stocks actually rising": "part des actions réellement en hausse",
    "how often the broad market confirmed the index":
      "à quelle fréquence le marché large a confirmé l’indice",
    "how many names carry the upside": "combien de valeurs portent la hausse",
    "offense vs defense, fear gauge, mood stability":
      "offensif vs défensif, indice de peur, stabilité de l’humeur",
    "are stocks, crypto and commodities telling one story?":
      "actions, crypto et matières premières racontent-elles la même histoire ?",
    "One score, 0–100, built from five things a healthy market needs at once. Higher means the advance is broader, calmer and better backed by the tape.":
      "Un seul score, 0–100, bâti sur cinq choses qu’un marché sain réunit en même temps. Plus il est haut, plus la hausse est large, calme et confirmée par le marché.",
    // glossary headwords
    "consensus": "consensus", "breadth": "ampleur", "rotation": "rotation",
    "risk-off": "risk-off", "risk-on": "risk-on", "duration": "duration",
    "capex": "capex", "hyperscaler": "hyperscaler", "high": "élevé",
    "moderate": "modéré", "low": "faible",
    // CTA block + locked teaser
    "The full drivers, what's mispriced, the risk that flips the day, and the watchlist — every trading morning, before the bell.":
      "Les drivers complets, ce qui est mal valorisé, le risque qui renverse la séance et la watchlist — chaque matin de bourse, avant l’ouverture.",
    "The full drivers, what’s mispriced, the risk that flips the day, and the watchlist — every trading morning, before the bell.":
      "Les drivers complets, ce qui est mal valorisé, le risque qui renverse la séance et la watchlist — chaque matin de bourse, avant l’ouverture.",
    "Tomorrow the market tells a different story. This page will too.":
      "Demain le marché raconte une autre histoire. Cette page aussi.",
    "Tomorrow the market tells a different story. Members step inside it first.":
      "Demain le marché raconte une autre histoire. Les abonnés y entrent en premier.",
    "Members Read The Rest": "Les abonnés lisent la suite",
    "Join the free channel →": "Rejoignez le canal gratuit →",
    "Join the free channel": "Rejoignez le canal gratuit",
    "Read the free weekly": "Lire l’hebdo gratuit",
    // stat sublabels / fragments
    "cyclicals − defensives": "cycliques − défensives",
    "cyclicals - defensives": "cycliques − défensives",
    "of up-momentum in top 3": "de la hausse dans le top 3",
    "of sectors green": "de secteurs en vert",
    "of up-momentum in top 3": "de la hausse dans le top 3",
    "index momentum": "élan de l’indice",
    "flattening": "aplatissement", "steepening": "pentification",
    "consensus:": "consensus :"
  };

  // composed number chips: fixed shape, variable digits. First match wins.
  var RULES = [
    [/^of ([\d,]+) tracked\s+names advancing$/i, "sur $1 noms suivis\nen hausse"],
    [/^ADVANCING\s+([\d,]+)$/i, "EN HAUSSE $1"],
    [/^DECLINING\s+([\d,]+)$/i, "EN BAISSE $1"],
    [/^of ([\d,]+) sectors green$/i, "sur $1 secteurs en vert"],
    [/^([\d,]+) bid\s*\/\s*([\d,]+) sold$/i, "$1 achetés / $2 vendus"],
    [/^stress\s+([\d,]+)\/100$/i, "tension $1/100"],
    [/^VIX\s+([\d.]+)\s+flattening$/i, "VIX $1 aplatissement"],
    [/^VIX\s+([\d.]+)\s+steepening$/i, "VIX $1 pentification"],
    [/^([+\-]?[\d.]+%)\s*·\s*([\d,]+)\/([\d,]+)\s+advancing$/i,
     "$1 · $2/$3 en hausse"],
    [/^Risk-off\s*\(early\)$/i, "Risk-off (début)"],
    [/^Risk-on\s*\(early\)$/i, "Risk-on (début)"],
    [/^consensus:\s+(.+)$/i, "consensus : $1"]
  ];

  // mirror of app.js firstSentence() — the hero headline renders only the
  // FIRST SENTENCE of the story teaser/lede, so the full-string map entry
  // never exact-matches it
  function firstSentence(t) {
    var m = String(t || "").match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : String(t || "");
  }

  function buildMap() {
    var m = {}, k;
    for (k in CHROME) if (CHROME.hasOwnProperty(k)) m[k] = CHROME[k];
    try {
      var fr = window.MIB_BRIEF && window.MIB_BRIEF.i18n_fr;
      if (fr) for (k in fr) if (fr.hasOwnProperty(k)) m[k] = fr[k];
    } catch (_) {}
    // derived entries: first sentence of every prose pair (hero headline)
    var fs, k2;
    for (k in m) if (m.hasOwnProperty(k)) {
      fs = firstSentence(k);
      if (fs && fs !== k && m[fs] === undefined) {
        k2 = firstSentence(m[k]);
        if (k2) m[fs] = k2;
      }
    }
    return m;
  }
  var MAP = buildMap();
  // multi-word map phrases, longest first, for the substring pass
  var PHRASES = [];
  function rebuildPhrases() {
    PHRASES = Object.keys(MAP).filter(function (k) {
      return k.indexOf(" ") >= 0 && k.length >= 6;
    }).sort(function (a, b) { return b.length - a.length; });
  }
  rebuildPhrases();

  function lang() {
    try { return localStorage.getItem(KEY) === "fr" ? "fr" : "en"; }
    catch (_) { return "en"; }
  }

  // English node text → French, or the same string if nothing applies
  function toFR(en) {
    var key = en.trim();
    if (MAP[key] !== undefined) return en.replace(key, MAP[key]);
    var i;
    for (i = 0; i < RULES.length; i++)
      if (RULES[i][0].test(key)) return en.replace(RULES[i][0], RULES[i][1]);
    // substring pass: translate any known multi-word phrase inside the node
    var s = en, hit = false, p;
    for (i = 0; i < PHRASES.length; i++) {
      p = PHRASES[i];
      if (s.indexOf(p) >= 0) { s = s.split(p).join(MAP[p]); hit = true; }
    }
    return hit ? s : en;
  }

  // Original English keyed by the exact text node — a WeakMap, so we translate
  // per TEXT NODE, not per element. That reaches text stranded next to element
  // siblings (an appended "· published before the US open", the "ADVANCING 102"
  // label beside its bar) that a leaf-element swap skips, and it lets us revert
  // to the stored English on toggle-back.
  var ORIG = new WeakMap();

  function skip(node) {
    var p = node.parentNode;
    if (!p) return true;
    if (p.nodeName === "SCRIPT" || p.nodeName === "STYLE") return true;
    if (p.closest && (p.closest(".lang-toggle") || p.closest("[data-lang-btn]")))
      return true;
    return false;
  }

  function apply(l) {
    var walker = document.createTreeWalker(
      document.body, NodeFilter.SHOW_TEXT, null), n, en, fr, i;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue || !n.nodeValue.trim() || skip(n)) continue;
      en = ORIG.get(n);
      if (en === undefined) {
        en = n.nodeValue;
        fr = toFR(en);
        if (fr === en) continue;               // nothing translates → leave it
        ORIG.set(n, en);
      }
      n.nodeValue = (l === "fr") ? toFR(en) : en;
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
      rebuildPhrases();
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
