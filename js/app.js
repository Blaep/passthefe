/* PassTheFE — web app
   Hash router + quiz engine + analytics, all client-side.
   Progress lives in localStorage; no accounts, no backend. */

(function () {
  "use strict";

  var VIEWS = ["home", "practice", "exam", "formulas", "reference", "flashcards", "analytics", "privacy"];
  var TOPICS = [
    "Mathematics", "Statistics and Probability", "Engineering Economics",
    "Ethics and Professional Practice", "Statics", "Dynamics",
    "Mechanics of Materials", "Materials", "Fluid Mechanics", "Surveying",
    "Structural Engineering", "Geotechnical Engineering",
    "Transportation Engineering", "Water Resources", "Construction Engineering"
  ];

  // ---- storage -----------------------------------------------------------
  var store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem("fecp:" + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem("fecp:" + key, JSON.stringify(value)); }
      catch (e) { /* storage unavailable */ }
    }
  };

  var QUESTIONS = [];
  function loadQuestions(cb) {
    if (QUESTIONS.length) { cb(QUESTIONS); return; }
    fetch("data/questions.json")
      .then(function (r) { return r.json(); })
      .then(function (d) { QUESTIONS = d.questions || []; cb(QUESTIONS); })
      .catch(function () { cb([]); });
  }

  // ---- handbook chapters -------------------------------------------------
  // data/handbook-structure.json maps FE Reference Handbook 10.6 chapters to
  // the question bank's topic names. Navigation only — the quiz engine,
  // analytics, flashcards, and exam views keep using q.topic untouched.
  var CHAPTERS = null;
  function loadChapters(cb) {
    if (CHAPTERS) { cb(CHAPTERS); return; }
    fetch("data/handbook-structure.json")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        CHAPTERS = Array.isArray(d) ? d : (d.chapters || []);
        cb(CHAPTERS);
      })
      .catch(function () { cb([]); });
  }

  function chapterQuestionCount(ch, qs) {
    var n = 0;
    for (var i = 0; i < qs.length; i++) {
      if (ch.topics.indexOf(qs[i].topic) !== -1) n++;
    }
    return n;
  }

  function findChapter(id) {
    if (!CHAPTERS) return null;
    for (var i = 0; i < CHAPTERS.length; i++) {
      if (CHAPTERS[i].id === id) return CHAPTERS[i];
    }
    return null;
  }

  // ---- router ------------------------------------------------------------
  function route() {
    stopQuizTimer(); // navigating away freezes the live timer; resume restarts it
    if (typeof exam !== "undefined" && exam && exam.tick) pauseExamTimer(); // exam sim pauses off-view
    loadCitationLinks(); // fire-and-forget so solution citations can deep-link
    // Deep links look like #/reference#eq-<id>: the view first, then the anchor.
    var parts = (location.hash || "#/").replace("#/", "").split("#");
    var name = parts[0] || "home";
    var anchor = parts[1] || "";
    // #/portable reuses the practice section as its host: the other device
    // types its session code here and runs the quiz with the same cards.
    if (name === "portable") {
      VIEWS.forEach(function (v) {
        var el = document.getElementById("view-" + v);
        if (el) el.classList.toggle("hidden", v !== "practice");
      });
      initPortableEntry();
      window.scrollTo(0, 0);
      return;
    }
    if (VIEWS.indexOf(name) === -1) name = "home";
    VIEWS.forEach(function (v) {
      var el = document.getElementById("view-" + v);
      if (el) el.classList.toggle("hidden", v !== name);
    });
    if (name === "home") renderStats();
    if (name === "practice") initPractice();
    if (name === "exam") initExam();
    if (name === "formulas") initFormulas();
    if (name === "flashcards") initFlashcards();
    if (name === "analytics") renderAnalytics();
    if (name === "reference") {
      initReference(function () { if (anchor) scrollToAnchor(anchor); });
    } else if (!anchor) {
      window.scrollTo(0, 0);
    }
  }

  function scrollToAnchor(anchor) {
    var el = document.getElementById(anchor);
    if (el && el.scrollIntoView) el.scrollIntoView();
  }

  function renderStats() {
    loadQuestions(function (qs) {
      var el = document.getElementById("stat-questions");
      if (el) el.textContent = qs.length > 0 ? qs.length : "–";
      var rEl = document.getElementById("stat-readiness");
      if (rEl) {
        var nAtt = store.get("attempts", []).length;
        if (nAtt) {
          var rp = readiness().pct;
          rEl.textContent = rp + "%";
          rEl.className = readinessClass(rp);
        } else {
          rEl.textContent = "–";
          rEl.className = "";
        }
      }
      var chEl = document.getElementById("stat-chapters");
      if (chEl) {
        loadChapters(function (chapters) {
          var n = 0;
          chapters.forEach(function (c) {
            if (chapterQuestionCount(c, qs) > 0) n++;
          });
          chEl.textContent = n > 0 ? n : "–";
        });
      }
    });
  }

  // ---- quiz engine -------------------------------------------------------
  var quiz = null; // { list, idx, correct, topic, answers: [{qid, topic, correct, chosen, secs}] }
  var quizTick = null; // setInterval handle for the live per-question timer chip

  // Question timers: each question is timed from the moment it renders
  // until the user answers. Reading the solution afterwards doesn't count.
  function fmtSecs(s) {
    s = Math.max(0, Math.round(s));
    var m = Math.floor(s / 60);
    return m + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }

  function totalQuizSecs() {
    if (!quiz || !quiz.t0) return 0;
    return (quiz.elapsedBase || 0) + (Date.now() - quiz.t0) / 1000;
  }

  function stopQuizTimer() {
    if (quizTick) { clearInterval(quizTick); quizTick = null; }
    if (quiz) quiz.qStart = null;
  }

  function updateTimerChip() {
    var qEl = document.getElementById("qt-q");
    if (!qEl || !quiz || !quiz.qStart) return;
    qEl.textContent = fmtSecs((Date.now() - quiz.qStart) / 1000);
    var tEl = document.getElementById("qt-t");
    if (tEl) tEl.textContent = fmtSecs(totalQuizSecs());
  }

  function startQuizTimer() {
    stopQuizTimer();
    quiz.qStart = Date.now();
    updateTimerChip();
    quizTick = setInterval(updateTimerChip, 500);
  }

  // Quizzes list — the practice tab's landing screen, mirroring the Exams
  // list: an in-progress card (tap to resume) plus completed quiz cards.
  function quizScopeLabel(saved) {
    if (saved.topic) return saved.topic;
    if (saved.mode === "adaptive") return "Adaptive Practice";
    return "Quiz";
  }

  function renderQuizList() {
    var el = document.getElementById("quiz-list");
    if (!el) return;
    var saved = store.get("resume", null);
    var valid = saved && saved.v === 1 && saved.qids && saved.qids.length &&
      (saved.idx || 0) < saved.qids.length;
    var sessions = store.get("sessions", []);
    var html = '<h2 class="exams-title">Quizzes</h2>' +
      '<p class="lede">Practice sets, adaptive review, and randomized drills.</p>';
    if (valid) {
      html += '<div class="exam-card in-progress" id="quiz-current-card" role="button" tabindex="0">' +
        "<div><div class=\"exam-card-label\">" + escapeHtml(quizScopeLabel(saved)) + "</div>" +
        '<div class="exam-card-date">Started ' + escapeHtml(fmtLongDate(saved.startedAt || saved.savedAt)) + "</div></div>" +
        '<div><div class="exam-card-label">Progress</div>' +
        '<div class="exam-card-progress">' + (saved.idx || 0) + "/" + saved.qids.length + "</div></div>" +
        "</div>";
    }
    html += '<div class="form-row"><button id="quiz-new-btn" class="btn primary btn-block">Start new quiz</button></div>';
    if (valid) {
      html += '<div class="quiz-nav-sub"><button id="quiz-list-discard-btn" class="btn text">Discard in-progress quiz</button></div>';
    }
    sessions.slice().reverse().forEach(function (s) {
      html += '<div class="exam-card completed">' +
        '<div><span class="exam-card-label">Completed On</span> ' +
        '<span class="exam-card-date-blue">' + escapeHtml(fmtLongDate(s.ts)) + "</span>" +
        (s.scope ? '<div class="exam-card-date">' + escapeHtml(s.scope) + "</div>" : "") +
        '<div class="exam-stats">' +
        '<div><div class="exam-stat-label">Total</div><div class="exam-stat-num">' + s.total + "</div></div>" +
        '<div><div class="exam-stat-label">Correct</div><div class="exam-stat-num">' + s.correct + "</div></div>" +
        '<div><div class="exam-stat-label">% Correct</div><div class="exam-stat-num pct">' + s.pct + "%</div></div>" +
        "</div></div></div>";
    });
    if (!valid && !sessions.length) {
      html += '<p class="muted">No quizzes yet — start your first practice set above.</p>';
    }
    el.innerHTML = html;
    var cc = document.getElementById("quiz-current-card");
    if (cc) {
      var resume = function () { resumeQuiz(store.get("resume", null)); };
      cc.addEventListener("click", resume);
      cc.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); resume(); }
      });
    }
    var db = document.getElementById("quiz-list-discard-btn");
    if (db) db.addEventListener("click", function () { clearResume(); renderQuizList(); });
    document.getElementById("quiz-new-btn").addEventListener("click", openQuizSetup);
  }

  // The setup page: chapter picker, adaptive, and randomized cards.
  function openQuizSetup() {
    renderResumeBanner();
    showOnly("quiz-setup-page");
    window.scrollTo(0, 0);
  }

  function initPractice() {
    loadQuestions(function (qs) {
      loadChapters(function (chapters) {
        var chapSel = document.getElementById("quiz-chapter");
        if (chapSel && !chapSel.options.length) {
          chapSel.appendChild(opt("", "All handbook chapters (" + qs.length + " questions)"));
          chapters.forEach(function (c) {
            var n = chapterQuestionCount(c, qs);
            var o = opt(c.id, c.title + " (" + (n ? n : "coming soon") + ")");
            if (!n) o.disabled = true;
            chapSel.appendChild(o);
          });
          chapSel.addEventListener("change", function () {
            renderTopicChips(qs, chapters);
          });
        }
        if (chapSel && !chapSel.dataset.init) {
          chapSel.dataset.init = "1";
          renderTopicChips(qs, chapters);
        }
        renderStreak();
      });
    });
    renderResumeBanner();
    renderQuizList();
    // Restore the right sub-card: navigating here from #/portable (or a tab
    // reload) must not leave the other device's screens showing.
    var pend = store.get("portableOut", null);
    if (pend && pend.createdAt && Date.now() - pend.createdAt > 60 * 60 * 1000) {
      store.set("portableOut", null); // the code outlived its 60 minutes
      toast("The old session code expired — start a fresh quiz to make a new one.");
      pend = null;
    }
    if (pend && pend.code) {
      renderCodeScreen(pend.code, pend.topic); // parked: show the code again
    } else if (!quiz || quiz.portable) {
      showOnly("quiz-list");
    }
    // else: a live phone quiz is in progress — leave its card alone.
    var qsb = document.getElementById("quiz-setup-back");
    if (qsb && !qsb.dataset.bound) {
      qsb.dataset.bound = "1";
      qsb.addEventListener("click", function () {
        renderQuizList();
        showOnly("quiz-list");
        window.scrollTo(0, 0);
      });
    }
    bindLengthRow("quiz-lengths");
    bindLengthRow("adaptive-lengths");
    var start = document.getElementById("quiz-start");
    if (start && !start.dataset.bound) {
      start.dataset.bound = "1";
      start.addEventListener("click", startQuiz);
    }
    var aStart = document.getElementById("adaptive-start");
    if (aStart && !aStart.dataset.bound) {
      aStart.dataset.bound = "1";
      aStart.addEventListener("click", startAdaptiveQuiz);
    }
    renderAdaptivePanel();
    // Randomized practice card: only shown when at least one generator
    // library (js/generators_math.js, js/generators_econ.js and/or
    // js/generators_stats.js) loaded with at least one generator.
    var rCard = document.getElementById("randomized-setup");
    var gens = randomizedGeneratorsAll();
    if (rCard) {
      if (gens) {
        rCard.classList.remove("hidden");
        updateRandomizedChapters();
        updateRandomizedCount();
        wireRandomizedChapters();
      } else {
        rCard.classList.add("hidden");
      }
    }
    var rStart = document.getElementById("randomized-start");
    if (rStart && !rStart.dataset.bound) {
      rStart.dataset.bound = "1";
      rStart.addEventListener("click", function () { startRandomizedQuiz(null); });
    }
  }

  function bindLengthRow(id) {
    var lens = document.getElementById(id);
    if (lens && !lens.dataset.bound) {
      lens.dataset.bound = "1";
      lens.addEventListener("click", function (e) {
        var b = e.target.closest(".length-btn");
        if (!b) return;
        lens.querySelectorAll(".length-btn").forEach(function (x) {
          x.classList.remove("selected");
        });
        b.classList.add("selected");
      });
    }
  }

  function opt(value, label) {
    var o = document.createElement("option");
    o.value = value; o.textContent = label;
    return o;
  }

  // Practice picker, part 2: topic chips for the selected handbook chapter.
  // The hidden #quiz-topic select keeps holding the quiz's topic id ("" =
  // all topics), so startQuiz and everything downstream are untouched.
  function renderTopicChips(qs, chapters) {
    var chapSel = document.getElementById("quiz-chapter");
    var topicSel = document.getElementById("quiz-topic");
    var chips = document.getElementById("quiz-topic-chips");
    if (!chapSel || !topicSel || !chips) return;
    topicSel.innerHTML = "";
    chips.innerHTML = "";
    chips.classList.add("hidden");
    var ch = findChapter(chapSel.value);
    if (!ch) { // "All handbook chapters"
      topicSel.appendChild(opt("", ""));
      return;
    }
    topicSel.appendChild(opt("", ""));
    ch.topics.forEach(function (t) {
      var n = 0;
      for (var i = 0; i < qs.length; i++) {
        if (qs[i].topic === t) n++;
      }
      if (n) topicSel.appendChild(opt(t, t));
    });
    if (ch.topics.length === 1) {
      // Single-topic chapter: quiz that topic directly, no chips needed.
      if (topicSel.options.length === 2) topicSel.value = ch.topics[0];
      return;
    }
    chips.classList.remove("hidden");
    chips.appendChild(topicChip("", "All " + ch.title, true));
    ch.topics.forEach(function (t) {
      var n = 0;
      for (var i = 0; i < qs.length; i++) {
        if (qs[i].topic === t) n++;
      }
      if (n) chips.appendChild(topicChip(t, t + " (" + n + ")", false));
    });
  }

  function topicChip(value, label, selected) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (selected ? " selected" : "");
    b.textContent = label;
    b.addEventListener("click", function () {
      document.getElementById("quiz-topic").value = value;
      document.getElementById("quiz-topic-chips").querySelectorAll(".chip")
        .forEach(function (x) {
          x.classList.toggle("selected", x === b);
        });
    });
    return b;
  }

  function selectedLength() {
    var b = document.querySelector("#quiz-lengths .length-btn.selected");
    return b ? parseInt(b.dataset.n, 10) : 5;
  }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---- portable sessions -------------------------------------------------
  // Continue a quiz on another device with no login and no server. The
  // phone packs the quiz state into a short typed code; any browser opens
  // #/portable, types it in, and runs the exact same quiz. A result code
  // carries the answers back to the phone's tracker.
  //
  // The phone's localStorage stays the source of truth. The other device
  // keeps its session only in sessionStorage (gone when the tab closes),
  // never writes the tracker's storage, and wipes itself on demand.
  var B32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  var PORTABLE_TTL_MIN = 60;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(arr, seed) {
    var r = mulberry32(seed >>> 0);
    arr = arr.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function bwWrite(bits, val, n) {
    for (var i = n - 1; i >= 0; i--) bits.push((val >> i) & 1);
  }

  function bitsToBytes(bits) {
    var bytes = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0, n = Math.min(8, bits.length - i);
      for (var j = 0; j < n; j++) b = (b << 1) | bits[i + j];
      bytes.push(b << (8 - n));
    }
    return bytes;
  }

  function crc8(bytes) {
    var crc = 0;
    for (var i = 0; i < bytes.length; i++) {
      crc ^= bytes[i];
      for (var j = 0; j < 8; j++) {
        crc = (crc & 0x80) ? (((crc << 1) ^ 0x07) & 0xFF) : ((crc << 1) & 0xFF);
      }
    }
    return crc;
  }

  function b32encodeBytes(bytes) {
    var out = "", acc = 0, accBits = 0;
    for (var i = 0; i < bytes.length; i++) {
      acc = (acc << 8) | bytes[i]; accBits += 8;
      while (accBits >= 5) { accBits -= 5; out += B32_ALPHABET[(acc >> accBits) & 31]; }
    }
    if (accBits > 0) out += B32_ALPHABET[(acc << (5 - accBits)) & 31];
    return out;
  }

  function chunkCode(s) {
    return s.replace(/(.{4})/g, "$1-").replace(/-+$/, "");
  }

  // Decoding tolerates dashes, spaces, and lowercase, and maps the
  // commonly confused I/L/O to 1/1/0 (Crockford base32).
  function b32decodeToBytes(s) {
    var clean = String(s).toUpperCase().replace(/[^0-9A-Z]/g, "")
      .replace(/I/g, "1").replace(/L/g, "1").replace(/O/g, "0");
    if (!clean.length) return null;
    var bits = [];
    for (var i = 0; i < clean.length; i++) {
      var v = B32_ALPHABET.indexOf(clean[i]);
      if (v < 0) return null;
      for (var j = 4; j >= 0; j--) bits.push((v >> j) & 1);
    }
    var nBytes = Math.floor(bits.length / 8);
    if (nBytes < 2) return null;
    var bytes = [];
    for (var k = 0; k < nBytes; k++) {
      var b = 0;
      for (var m = 0; m < 8; m++) b = (b << 1) | bits[k * 8 + m];
      bytes.push(b);
    }
    return bytes;
  }

  function bitReader(bytes) {
    var bits = [];
    bytes.forEach(function (by) {
      for (var j = 7; j >= 0; j--) bits.push((by >> j) & 1);
    });
    var pos = 0;
    return {
      read: function (n) {
        var v = 0;
        for (var i = 0; i < n; i++) v = (v << 1) | (bits[pos++] || 0);
        return v;
      }
    };
  }

  // Short fingerprint of the question bank (order-sensitive). The other
  // device recomputes it from the live bank and refuses the code if the
  // bank changed in between, instead of silently rebuilding a wrong quiz.
  function portableBankHash(ids) {
    var h = 2166136261;
    var s = ids.join(",");
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h & 0xFFFF;
  }

  // Session code (phone -> other device), version 1.
  function encodeSessionCode(f) {
    var bits = [];
    bwWrite(bits, 1, 4);
    bwWrite(bits, f.bankHash & 0xFFFF, 16);
    bwWrite(bits, f.seed & 0xFFFFF, 20);
    bwWrite(bits, f.topicSel & 15, 4);
    bwWrite(bits, f.count & 63, 6);
    bwWrite(bits, f.numAnswered & 63, 6);
    bwWrite(bits, f.genMin & 1023, 10);
    bwWrite(bits, Math.min(4095, f.elapsed) & 4095, 12);
    for (var i = 0; i < f.chosen.length; i++) bwWrite(bits, f.chosen[i] & 3, 2);
    var payload = bitsToBytes(bits);
    payload.push(crc8(payload));
    return chunkCode(b32encodeBytes(payload));
  }

  function decodeSessionCode(s) {
    var bytes = b32decodeToBytes(s);
    if (!bytes || bytes.length < 8) return { error: "checksum" };
    var crc = bytes[bytes.length - 1];
    var payload = bytes.slice(0, -1);
    if (crc8(payload) !== crc) return { error: "checksum" };
    var r = bitReader(payload);
    var version = r.read(4);
    if (version === 2) return { error: "wrongtype", actual: 2 };
    if (version !== 1) return { error: "checksum" };
    // Shortest valid session code: 78 payload bits + CRC = 11 bytes.
    if (bytes.length < 11) return { error: "checksum" };
    var out = {
      bankHash: r.read(16), seed: r.read(20), topicSel: r.read(4),
      count: r.read(6), numAnswered: r.read(6), genMin: r.read(10),
      elapsed: r.read(12), chosen: []
    };
    if (out.topicSel > 15 || out.count < 1 || out.count > 50 ||
        out.numAnswered > out.count) return { error: "checksum" };
    if (out.numAnswered >= out.count) return { error: "finished" };
    for (var i = 0; i < out.numAnswered; i++) out.chosen.push(r.read(2));
    var nowMin = Math.floor(Date.now() / 60000) % 1024;
    var age = (nowMin - out.genMin + 1024) % 1024;
    if (age > PORTABLE_TTL_MIN) return { error: "expired" };
    return out;
  }

  // Result code (other device -> phone), version 2. Carries the seed so the
  // phone can match it to the waiting session, plus per-question choices
  // and times for the questions answered on the other device.
  function encodeResultCode(f) {
    var bits = [];
    bwWrite(bits, 2, 4);
    bwWrite(bits, f.seed & 0xFFFFF, 20);
    bwWrite(bits, f.answers.length & 63, 6);
    for (var i = 0; i < f.answers.length; i++) {
      bwWrite(bits, f.answers[i].chosen & 3, 2);
      bwWrite(bits, Math.min(255, f.answers[i].secs || 0) & 255, 8);
    }
    bwWrite(bits, Math.min(4095, f.pcActiveSecs || 0) & 4095, 12);
    var payload = bitsToBytes(bits);
    payload.push(crc8(payload));
    return chunkCode(b32encodeBytes(payload));
  }

  function decodeResultCode(s) {
    var bytes = b32decodeToBytes(s);
    if (!bytes || bytes.length < 8) return { error: "checksum" };
    var crc = bytes[bytes.length - 1];
    var payload = bytes.slice(0, -1);
    if (crc8(payload) !== crc) return { error: "checksum" };
    var r = bitReader(payload);
    var version = r.read(4);
    if (version === 1) return { error: "wrongtype", actual: 1 };
    if (version !== 2) return { error: "checksum" };
    var seed = r.read(20), n = r.read(6);
    if (n < 1 || n > 50) return { error: "checksum" };
    var answers = [];
    for (var i = 0; i < n; i++) answers.push({ chosen: r.read(2), secs: r.read(8) });
    return { seed: seed, answers: answers, pcActiveSecs: r.read(12) };
  }

  // Exposed for automated tests (harmless in the browser).
  window.PortableCodes = {
    encodeSessionCode: encodeSessionCode,
    decodeSessionCode: decodeSessionCode,
    encodeResultCode: encodeResultCode,
    decodeResultCode: decodeResultCode,
    bankHash: portableBankHash,
    seededShuffle: seededShuffle,
    TTL_MIN: PORTABLE_TTL_MIN
  };

  function startQuiz() {
    loadQuestions(function (qs) {
      // A fresh quiz retires any session code still waiting — its answers
      // no longer line up with this quiz.
      if (store.get("portableOut", null)) {
        store.set("portableOut", null);
        toast("The old session code stopped working — you started a new quiz.");
      }
      var topic = document.getElementById("quiz-topic").value;
      var pool = topic ? qs.filter(function (q) { return q.topic === topic; }) : qs;
      if (!pool.length) {
        document.getElementById("quiz-run").innerHTML =
          "<p>No questions in this topic yet — try All topics.</p>";
        showOnly("quiz-run");
        return;
      }
      var n = Math.min(selectedLength(), pool.length);
      // Portable sessions: the shuffle is seeded so a session code typed on
      // another device regenerates this exact question list. The seed also
      // doubles as the session id that result codes are matched against.
      var seed = Math.floor(Math.random() * 1048576); // 20 bits
      var ti = topic ? TOPICS.indexOf(topic) : -1;
      quiz = {
        list: seededShuffle(pool, seed).slice(0, n),
        idx: 0, correct: 0, topic: topic || "All topics", answers: [],
        t0: Date.now(), elapsedBase: 0, qStart: null,
        seed: seed, topicSel: ti === -1 ? 15 : ti
      };
      saveProgress();
      renderQuestion();
      showOnly("quiz-run");
    });
  }

  // ---- quiz resume -------------------------------------------------------
  // An in-progress quiz is saved to localStorage after every answer and
  // every question advance, so closing the tab mid-quiz loses nothing.
  function saveProgress() {
    if (!quiz || !quiz.list.length) { store.set("resume", null); return; }
    // Randomized variants are ephemeral — their ids resolve to nothing in
    // the bank, so a saved session could never resume. Keep the session
    // in-memory only and never touch an unrelated saved resume.
    if (quiz.mode === "randomized") return;
    // Portable quizzes (other device) never touch the tracker's storage:
    // they persist only in this tab's sessionStorage, gone on tab close.
    if (quiz.portable) { writePortableSave(); return; }
    var prev = store.get("resume", null);
    store.set("resume", {
      v: 1,
      qids: quiz.list.map(function (q) { return q.id; }),
      seed: quiz.seed,
      topicSel: quiz.topicSel,
      idx: quiz.idx,
      correct: quiz.correct,
      topic: quiz.topic,
      mode: quiz.mode || null,
      masteryBefore: quiz.masteryBefore || null,
      answers: quiz.answers,
      elapsedSecs: Math.round(totalQuizSecs()),
      startedAt: (prev && prev.startedAt) || quiz.t0 || Date.now(),
      savedAt: Date.now()
    });
  }

  function clearResume() { store.set("resume", null); }

  function resumeQuiz(saved) {
    loadQuestions(function () {
      var list = (saved.qids || []).map(findQuestion).filter(Boolean);
      if (!list.length || list.length !== saved.qids.length) {
        clearResume();
        renderResumeBanner();
        return;
      }
      quiz = {
        list: list,
        idx: Math.min(saved.idx || 0, list.length - 1),
        correct: saved.correct || 0,
        topic: saved.topic || "Saved quiz",
        mode: saved.mode || null,
        masteryBefore: saved.masteryBefore || null,
        answers: saved.answers || [],
        t0: Date.now(),
        elapsedBase: saved.elapsedSecs || 0,
        qStart: null,
        seed: saved.seed,
        topicSel: saved.topicSel
      };
      renderQuestion();
      showOnly("quiz-run");
    });
  }

  function renderResumeBanner() {
    var el = document.getElementById("quiz-resume");
    if (!el) return;
    // A portable session code is out: the quiz is parked here until the
    // other device's result code comes back (or the session is cancelled).
    var pend = store.get("portableOut", null);
    if (pend) {
      el.innerHTML = '<div class="resume-banner"><div><strong>Session code active</strong><br>' +
        '<span class="muted">Your quiz is parked on this phone until the other device sends its answers back.</span></div>' +
        '<div class="resume-actions"><button id="pb-import-toggle" class="btn primary">Enter result code</button>' +
        '<button id="pb-cancel" class="btn text">Cancel</button></div></div>' +
        '<div id="pb-import" class="hidden" style="margin-top:10px">' +
        '<label for="pb-import-input"><strong>Result code from the other computer</strong></label>' +
        '<input id="pb-import-input" class="code-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX">' +
        '<p class="form-error hidden" id="pb-import-error"></p>' +
        '<div class="quiz-nav"><button id="pb-import-btn" class="btn primary">Import answers</button></div></div>';
      el.classList.remove("hidden");
      document.getElementById("pb-import-toggle").addEventListener("click", function () {
        document.getElementById("pb-import").classList.toggle("hidden");
      });
      document.getElementById("pb-import-btn").addEventListener("click", function () {
        importResultCode(document.getElementById("pb-import-input").value, "pb-import-error");
      });
      document.getElementById("pb-cancel").addEventListener("click", cancelPortableSession);
      return;
    }
    var saved = store.get("resume", null);
    var valid = saved && saved.v === 1 && saved.qids && saved.qids.length &&
      (saved.idx || 0) < saved.qids.length;
    if (!valid) { el.classList.add("hidden"); el.innerHTML = ""; return; }
    el.innerHTML = '<div class="resume-banner"><div><strong>Unfinished quiz</strong><br>' +
      '<span class="muted">' + escapeHtml(saved.topic || "") + " · question " +
      ((saved.idx || 0) + 1) + " of " + saved.qids.length + " · " +
      (saved.correct || 0) + " correct so far" +
      (saved.elapsedSecs ? " · ⏱ " + fmtSecs(saved.elapsedSecs) + " elapsed" : "") +
      "</span></div>" +
      '<div class="resume-actions"><button id="quiz-resume-btn" class="btn primary">Resume</button>' +
      '<button id="quiz-discard-btn" class="btn text">Discard</button></div></div>';
    el.classList.remove("hidden");
    document.getElementById("quiz-resume-btn").addEventListener("click", function () {
      resumeQuiz(store.get("resume", null));
    });
    document.getElementById("quiz-discard-btn").addEventListener("click", function () {
      clearResume();
      renderResumeBanner();
    });
  }

  function showOnly(id) {
    ["quiz-list", "quiz-setup-page", "quiz-run", "quiz-result", "portable-entry"].forEach(function (x) {
      var el = document.getElementById(x);
      if (el) el.classList.toggle("hidden", x !== id);
    });
    // The Quizzes list and the quiz run render their own headers, so the
    // practice tab reads as its own pages.
    var head = document.getElementById("practice-page-head");
    if (head) head.classList.toggle("hidden", id === "quiz-list" || id === "quiz-run");
  }

  // ---- diagrams --------------------------------------------------------
  // Optional textbook-style SVG figure shown between the stem and choices.
  function diagramHtml(q) {
    if (!q || !q.diagram) return "";
    return '<img class="q-diagram" src="' + escapeHtml(q.diagram) + '" alt="' +
      escapeHtml("Figure for " + (q.subtopic || q.topic || "this question")) +
      '" loading="lazy">';
  }

  // Difficulty pill for the clean quiz header (easy/medium/hard).
  function diffBadge(d) {
    var k = (d || "").toLowerCase();
    var cls = k === "hard" ? "hard" : (k === "medium" ? "medium" : "easy");
    return '<span class="badge badge-diff ' + cls + '">' + escapeHtml(d || "") + "</span>";
  }

  // Back chevron shared by the quiz headers — hash routing keeps it safe.
  function quizBackHtml() {
    return '<button class="quiz-back" id="quiz-back" aria-label="Back to practice">‹</button>';
  }

  // Leave the quiz and return to the practice setup card. Setting
  // location.hash would be a no-op here: the quiz already runs under
  // #/practice, so changing the hash to itself fires no event.
  function quizGoBack() {
    stopQuizTimer();
    renderQuizList();
    showOnly("quiz-list");
    window.scrollTo(0, 0);
  }

  function renderQuestion() {
    var q = quiz.list[quiz.idx];
    var box = document.getElementById("quiz-run");
    box.dataset.answered = "";
    var modeTitle = quiz.mode === "adaptive" ? "Adaptive Practice" : "Practice";
    var letters = "ABCDEFGH";
    var html = '<div class="quiz-head">' + quizBackHtml() +
      ' <span class="timer-pill" title="Time on this question · total quiz time">⏱ <b id="qt-q">0:00</b> · <b id="qt-t">0:00</b></span></div>';
    html += '<h2 class="quiz-title">' + escapeHtml(modeTitle) + "</h2>";
    html += '<div class="quiz-badges"><span class="badge badge-topic">' + escapeHtml(q.topic) + "</span>" +
      diffBadge(q.difficulty) + "</div>";
    html += '<p class="question-text">' + inlineMath(q.question) + "</p>";
    html += diagramHtml(q);
    html += '<ul class="choices" id="quiz-choices">';
    var order = shuffle(q.choices.map(function (c, i) { return i; }));
    order.forEach(function (i, pos) {
      html += '<li data-i="' + i + '"><span class="choice-letter">' + letters[pos] +
        '</span><span class="choice-text">' + inlineMath(q.choices[i]) + "</span></li>";
    });
    html += "</ul>";
    html += '<div class="solution" id="quiz-solution" style="display:none"></div>';
    html += '<div class="quiz-bottom"><div class="qcount-wrap"><span class="qcount-pill">Question ' +
      (quiz.idx + 1) + " of " + quiz.list.length + "</span></div>";
    html += '<button id="quiz-next" class="btn primary btn-block" style="display:none">' +
      (quiz.idx + 1 === quiz.list.length ? "See results" : "Next question") + "</button>";
    if (quiz.portable) {
      // Other device: offer the result code once at least one answer was
      // given here. The phone imports it back into its tracker.
      if (quiz.answers.length > quiz.handoff) {
        html += '<div class="quiz-nav-sub"><button id="quiz-resultcode-btn" class="btn">Get result code</button></div>';
      }
    } else if (typeof quiz.seed === "number" && quiz.answers.length < quiz.list.length) {
      html += '<div class="quiz-nav-sub"><button id="quiz-portable-btn" class="btn">Continue on another device</button></div>';
    }
    html += "</div>";
    box.innerHTML = html;
    document.getElementById("quiz-back").addEventListener("click", quizGoBack);
    box.querySelectorAll("#quiz-choices li").forEach(function (li) {
      li.addEventListener("click", function () { answerCurrent(parseInt(li.dataset.i, 10)); });
    });
    document.getElementById("quiz-next").addEventListener("click", function () {
      if (quiz.idx + 1 < quiz.list.length) {
        quiz.idx++;
        saveProgress();
        renderQuestion();
      }
      else showResult();
    });
    var portableBtn = document.getElementById("quiz-portable-btn");
    if (portableBtn) portableBtn.addEventListener("click", openSessionCodeScreen);
    var resultCodeBtn = document.getElementById("quiz-resultcode-btn");
    if (resultCodeBtn) resultCodeBtn.addEventListener("click", openResultCodeScreen);
    // Restoring a saved quiz where the current question was already answered:
    // show it in its answered state without re-logging anything, with the
    // recorded time frozen on the chip. Otherwise start the question timer.
    var prev = quiz.answers.length ? quiz.answers[quiz.answers.length - 1] : null;
    if (prev && prev.qid === q.id && typeof prev.chosen === "number") {
      revealAnswer(q, prev.chosen, prev.correct);
      stopQuizTimer();
      var qEl = document.getElementById("qt-q");
      if (qEl) qEl.textContent = fmtSecs(prev.secs || 0);
      var tEl = document.getElementById("qt-t");
      if (tEl) tEl.textContent = fmtSecs(totalQuizSecs());
    }
    else {
      startQuizTimer();
    }
  }

  function answerCurrent(i) {
    var box = document.getElementById("quiz-run");
    if (box.dataset.answered) return;
    var q = quiz.list[quiz.idx];
    var ok = i === q.answerIndex;
    var secs = quiz.qStart ? Math.round((Date.now() - quiz.qStart) / 1000) : 0;
    stopQuizTimer();
    var qEl = document.getElementById("qt-q");
    if (qEl) qEl.textContent = fmtSecs(secs); // freeze the chip at answer time
    if (ok) quiz.correct++;
    quiz.answers.push({ qid: q.id, topic: q.topic, correct: ok, chosen: i, secs: secs });
    logAttempt(q, ok);
    revealAnswer(q, i, ok);
    saveProgress();
  }

  function videoLinkHtml(q) {
    if (!q.videoUrl) return "";
    var tip = q.videoTitle ? ' title="YouTube: ' + escapeHtml(q.videoTitle) + '"' : "";
    return '<a class="video-link" href="' + escapeHtml(q.videoUrl) + '" target="_blank" rel="noopener"' + tip + '>' +
      '<span class="video-play" aria-hidden="true">\u25B6</span><span>Watch video explanation</span></a>';
  }

  function revealAnswer(q, chosenI, ok) {
    var box = document.getElementById("quiz-run");
    box.dataset.answered = "1";
    box.querySelectorAll("#quiz-choices li").forEach(function (li) {
      var liI = parseInt(li.dataset.i, 10);
      var letter = li.querySelector(".choice-letter");
      if (liI === q.answerIndex) {
        li.style.background = "#e9f9ee";
        if (letter) { letter.style.borderColor = "#34C759"; letter.style.background = "#34C759"; letter.style.color = "#fff"; }
      }
      else if (liI === chosenI) {
        li.style.background = "#fdeceb";
        if (letter) { letter.style.borderColor = "#FF3B30"; letter.style.background = "#FF3B30"; letter.style.color = "#fff"; }
      }
      li.style.cursor = "default";
    });
    var sol = document.getElementById("quiz-solution");
    sol.innerHTML = "<strong>" + (ok ? "Correct." : "Not quite.") + "</strong>" +
      '<p class="explain-head">Explanation</p>' +
      '<div class="explain-body">' + linkifyCitations(renderRich(q.solution)) + "</div>" +
      (q.explanation ? '<div class="explain-body">' + renderRich(q.explanation) + "</div>" : "") +
      videoLinkHtml(q);
    sol.style.display = "block";
    document.getElementById("quiz-next").style.display = "";
  }

  function logAttempt(q, ok) {
    if (quiz && quiz.portable) return; // the other device never writes the tracker
    var attempts = store.get("attempts", []);
    attempts.push({ qid: q.id, topic: q.topic, correct: ok, ts: Date.now() });
    store.set("attempts", attempts.slice(-2000)); // keep it bounded
    bumpStreak();
  }

  function showResult() {
    stopQuizTimer();
    // Other device: show the result code for the phone instead of the
    // phone's share/analytics UI. Nothing is recorded on this device.
    if (quiz && quiz.portable) { renderPortableResult(); return; }
    var box = document.getElementById("quiz-result");
    var pct = Math.round(100 * quiz.correct / quiz.list.length);
    var timed = quiz.answers.filter(function (a) { return typeof a.secs === "number"; });
    var totalSecs = Math.round(totalQuizSecs());
    var solvingSecs = timed.reduce(function (s, a) { return s + a.secs; }, 0);
    var avgSecs = timed.length ? Math.round(solvingSecs / timed.length) : 0;
    quiz.totalSecs = totalSecs;
    quiz.solvingSecs = solvingSecs;
    quiz.avgSecs = avgSecs;
    var html = "<h3>Quiz complete</h3>";
    html += '<p class="result-score">' + quiz.correct + "/" + quiz.list.length +
      " <span>(" + pct + "%)</span></p>";
    // Timing summary vs real FE exam pace (110 questions in 5h20m ≈ 2:55 each).
    // "Solving" = sum of per-question answer times; "Elapsed" = wall clock
    // including explanation review and pauses.
    var FE_PACE_SECS = 175;
    html += '<p class="time-summary">⏱ Solving ' + fmtSecs(solvingSecs) +
      " · Elapsed " + fmtSecs(totalSecs) +
      " · avg " + fmtSecs(avgSecs) + " per question</p>";
    if (avgSecs > 0) {
      var onPace = avgSecs <= FE_PACE_SECS;
      html += '<p class="pace-note ' + (onPace ? "good" : "warn") + '">' +
        (onPace
          ? "On exam pace — the real FE allows about 2:55 per question."
          : "Over exam pace — the real FE allows about 2:55 per question. Speed comes with reps.") +
        "</p>";
    }
    // Per-question time breakdown, in quiz order.
    html += '<div class="qtime-list">';
    quiz.answers.forEach(function (a, n) {
      html += '<div class="qtime-row"><span class="qtime-n">Q' + (n + 1) + "</span>" +
        '<span class="qtime-mark ' + (a.correct ? "good" : "bad") + '">' +
        (a.correct ? "✓" : "✗") + "</span>" +
        '<span class="qtime-topic">' + escapeHtml(a.topic || "") + "</span>" +
        '<span class="qtime-secs">' + fmtSecs(a.secs || 0) + "</span></div>";
    });
    html += "</div>";
    if (quiz && quiz.mode === "adaptive") { html += adaptiveResultHtml(); }
    html += '<div class="quiz-nav"><button id="quiz-again" class="btn primary">New quiz</button> ' +
      '<button id="quiz-share" class="btn">Share my score</button> ' +
      '<a class="btn" href="#/analytics">View analytics</a></div>';
    box.innerHTML = html;
    document.getElementById("quiz-again").addEventListener("click", function () {
      quiz = null;
      clearResume();
      document.getElementById("quiz-run").dataset.answered = "";
      openQuizSetup();
    });
    document.getElementById("quiz-share").addEventListener("click", shareScore);
    showOnly("quiz-result");
    renderStreak();
    clearResume(); // finished quizzes have nothing left to resume
    renderResumeBanner(); // refresh the setup card so it never shows a stale banner
    recordSession();
  }

  // ---- portable sessions: phone side ------------------------------------
  function copyAnswer(a) {
    return { qid: a.qid, topic: a.topic, correct: a.correct, chosen: a.chosen, secs: a.secs };
  }

  // Freeze the live quiz, pack it into a session code, and park it here
  // until the other device's result code arrives (or the session is
  // cancelled). The pending record is what result codes are matched
  // against, which makes each code one-use.
  function openSessionCodeScreen() {
    if (!quiz || quiz.portable) return;
    if (typeof quiz.seed !== "number") {
      toast("This quiz was saved before session codes existed — finish it and start a fresh one to try this.");
      return;
    }
    stopQuizTimer();
    var code = PortableCodes.encodeSessionCode({
      bankHash: PortableCodes.bankHash(QUESTIONS.map(function (q) { return q.id; })),
      seed: quiz.seed,
      topicSel: quiz.topicSel,
      count: quiz.list.length,
      numAnswered: quiz.answers.length,
      genMin: Math.floor(Date.now() / 60000) % 1024,
      elapsed: Math.round(totalQuizSecs()),
      chosen: quiz.answers.map(function (a) { return a.chosen; })
    });
    store.set("portableOut", {
      seed: quiz.seed,
      qids: quiz.list.map(function (q) { return q.id; }),
      topic: quiz.topic,
      topicSel: quiz.topicSel,
      numAnsweredHandoff: quiz.answers.length,
      answers: quiz.answers.map(copyAnswer),
      elapsedBase: Math.round(totalQuizSecs()),
      createdAt: Date.now(),
      code: code // re-displayed if the tab is reloaded or revisited
    });
    quiz.parked = true;
    renderCodeScreen(code, quiz.topic);
  }

  // The parked code screen, rendered either right after generating the code
  // or restored later from the pending record (tab reload, navigating back
  // from #/portable). Import/cancel both work from the pending record, so
  // the in-memory quiz isn't needed here.
  function renderCodeScreen(code, topic) {
    var box = document.getElementById("quiz-run");
    box.dataset.answered = "1";
    var html = '<p class="quiz-progress">Session code · ' + escapeHtml(topic || "") + "</p>";
    html += "<h3>Continue on another device</h3>";
    html += '<div class="code-display" id="sc-code" title="Tap to copy">' + escapeHtml(code) + "</div>";
    html += '<p style="margin-top:12px">On the other computer, go to<br><strong>passthefe.pages.dev/#/portable</strong><br>and type in this code. It opens this exact quiz — same questions, right where you left off.</p>';
    html += '<p class="muted">The code works for 60 minutes and only once. Nothing about you stays on the other computer.</p>';
    html += '<div class="quiz-nav"><button id="sc-import-toggle" class="btn primary">Enter result code</button> ';
    html += '<button id="sc-cancel" class="btn text">Cancel session</button></div>';
    html += '<div id="sc-import" class="hidden" style="margin-top:12px">';
    html += '<label for="sc-import-input"><strong>Result code from the other computer</strong></label>';
    html += '<input id="sc-import-input" class="code-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX">';
    html += '<p class="form-error hidden" id="sc-import-error"></p>';
    html += '<div class="quiz-nav"><button id="sc-import-btn" class="btn primary">Import answers</button></div></div>';
    box.innerHTML = html;
    showOnly("quiz-run");
    document.getElementById("sc-code").addEventListener("click", function () {
      copyText(code, function () { toast("Code copied."); });
    });
    document.getElementById("sc-import-toggle").addEventListener("click", function () {
      document.getElementById("sc-import").classList.toggle("hidden");
    });
    document.getElementById("sc-import-btn").addEventListener("click", function () {
      importResultCode(document.getElementById("sc-import-input").value, "sc-import-error");
    });
    document.getElementById("sc-cancel").addEventListener("click", cancelPortableSession);
  }

  function cancelPortableSession() {
    store.set("portableOut", null);
    if (quiz) quiz.parked = false;
    toast("Session code cancelled — your quiz is back on this phone.");
    if (quiz && !quiz.portable && quiz.list) {
      renderQuestion();
      showOnly("quiz-run");
    } else {
      showOnly("quiz-setup-page");
      renderResumeBanner();
    }
  }

  // Merge the other device's answers into the parked quiz (or rebuild it
  // from the pending record if this phone's tab was closed in between),
  // log them in the tracker, and retire the session code.
  function importResultCode(str, errId) {
    function fail(msg) {
      var errEl = errId && document.getElementById(errId);
      if (errEl) { errEl.textContent = msg; errEl.classList.remove("hidden"); }
      else toast(msg);
    }
    var d = PortableCodes.decodeResultCode(str);
    if (d.error === "checksum") return fail("That code doesn't look right — check it for typos and try again.");
    if (d.error === "wrongtype") return fail("That's a session code — it goes on the other computer, not here.");
    if (d.error) return fail("That code didn't work — try typing it again.");
    var pending = store.get("portableOut", null);
    if (!pending || pending.seed !== d.seed) {
      return fail("That code doesn't match the session waiting on this phone. Make sure you typed the latest result code.");
    }
    loadQuestions(function () {
      var list = (pending.qids || []).map(findQuestion).filter(Boolean);
      if (!list.length || list.length !== pending.qids.length) {
        return fail("The question bank changed since this session started — the answers can't be matched up.");
      }
      var handoff = pending.numAnsweredHandoff || 0;
      if (handoff + d.answers.length > list.length) {
        return fail("That code doesn't match this quiz — it covers more questions than are left.");
      }
      var answers = (pending.answers || []).map(copyAnswer);
      var correct = answers.filter(function (a) { return a.correct; }).length;
      for (var i = 0; i < d.answers.length; i++) {
        var q = list[handoff + i];
        var ok = d.answers[i].chosen === q.answerIndex;
        if (ok) correct++;
        var rec = { qid: q.id, topic: q.topic, correct: ok, chosen: d.answers[i].chosen, secs: d.answers[i].secs };
        answers.push(rec);
        logAttempt(q, ok);
      }
      quiz = {
        list: list,
        idx: Math.min(handoff + d.answers.length, list.length - 1),
        correct: correct,
        topic: pending.topic || "Quiz from another device",
        answers: answers,
        t0: Date.now(),
        elapsedBase: (pending.elapsedBase || 0) + (d.pcActiveSecs || 0),
        qStart: null,
        seed: pending.seed,
        topicSel: pending.topicSel,
        parked: false
      };
      store.set("portableOut", null); // one use
      saveProgress();
      var n = d.answers.length;
      toast("Imported " + n + " answer" + (n === 1 ? "" : "s") + " from the other device.");
      if (answers.length >= list.length) showResult();
      else { renderQuestion(); showOnly("quiz-run"); }
    });
  }

  // ---- portable sessions: other-device side -------------------------------
  // sessionStorage only: reloading this tab keeps the session, closing the
  // tab (or wiping) destroys it. localStorage is never touched here.
  function portableSaveShape() {
    return {
      v: 1,
      portable: true,
      seed: quiz.seed,
      topicSel: quiz.topicSel,
      topic: quiz.topic,
      handoff: quiz.handoff,
      phoneElapsed: quiz.phoneElapsed || 0,
      qids: quiz.list.map(function (q) { return q.id; }),
      idx: quiz.idx,
      correct: quiz.correct,
      answers: quiz.answers.map(copyAnswer),
      elapsedBase: Math.round((quiz.elapsedBase || 0) + (Date.now() - quiz.t0) / 1000),
      savedAt: Date.now()
    };
  }

  function writePortableSave() {
    if (!quiz || !quiz.portable) return;
    try { sessionStorage.setItem("fecp:portableQuiz", JSON.stringify(portableSaveShape())); }
    catch (e) { /* private mode etc: the session just won't survive reload */ }
  }

  function readPortableSave() {
    try {
      var raw = sessionStorage.getItem("fecp:portableQuiz");
      if (!raw) return null;
      var s = JSON.parse(raw);
      return (s && s.v === 1 && s.portable && s.qids && s.qids.length) ? s : null;
    } catch (e) { return null; }
  }

  function clearPortableSave() {
    try { sessionStorage.removeItem("fecp:portableQuiz"); } catch (e) {}
  }

  function initPortableEntry() {
    quiz = null; // the tab's sessionStorage copy is authoritative from here
    stopQuizTimer();
    showOnly("portable-entry");
    var main = document.getElementById("pe-main");
    if (!main) return;
    var saved = readPortableSave();
    if (saved) {
      var doneHere = saved.answers.length - (saved.handoff || 0);
      main.innerHTML = '<div class="resume-banner"><div><strong>A session is open on this device</strong><br>' +
        '<span class="muted">Question ' + (Math.min(saved.idx, saved.qids.length - 1) + 1) +
        " of " + saved.qids.length + " · " + doneHere + " answered here</span></div>" +
        '<div class="resume-actions"><button id="pe-resume" class="btn primary">Keep going</button>' +
        '<button id="pe-fresh" class="btn text">Wipe and start fresh</button></div></div>';
      document.getElementById("pe-resume").addEventListener("click", function () {
        resumePortableSession(saved);
      });
      document.getElementById("pe-fresh").addEventListener("click", function () {
        clearPortableSave();
        initPortableEntry();
      });
      return;
    }
    main.innerHTML =
      '<label for="pe-code"><strong>Session code from your phone</strong></label>' +
      '<input id="pe-code" class="code-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX">' +
      '<p class="form-error hidden" id="pe-error"></p>' +
      '<div class="quiz-nav"><button id="pe-start" class="btn primary">Open my quiz</button></div>';
    document.getElementById("pe-start").addEventListener("click", function () {
      startPortableSession(document.getElementById("pe-code").value);
    });
    document.getElementById("pe-code").addEventListener("keydown", function (e) {
      if (e.key === "Enter") startPortableSession(e.target.value);
    });
  }

  function startPortableSession(codeStr) {
    var errEl = document.getElementById("pe-error");
    function fail(msg) {
      if (errEl) { errEl.textContent = msg; errEl.classList.remove("hidden"); }
    }
    var d = PortableCodes.decodeSessionCode(codeStr);
    if (d.error === "checksum") return fail("That code doesn't look right — check it for typos and try again.");
    if (d.error === "wrongtype") return fail("That's a result code — it goes on your phone, not here.");
    if (d.error === "expired") return fail("That code expired — codes last 60 minutes. Make a fresh one on your phone.");
    if (d.error === "finished") return fail("That quiz was already finished on your phone — there's nothing to continue here.");
    if (d.error) return fail("That code didn't work — try typing it again.");
    loadQuestions(function (qs) {
      if (PortableCodes.bankHash(qs.map(function (q) { return q.id; })) !== d.bankHash) {
        return fail("The question bank changed since this code was made. Make a fresh code on your phone.");
      }
      var pool = d.topicSel === 15 ? qs : qs.filter(function (q) { return q.topic === TOPICS[d.topicSel]; });
      var list = PortableCodes.seededShuffle(pool, d.seed).slice(0, d.count);
      if (list.length !== d.count) {
        return fail("Couldn't rebuild that quiz — make a fresh code on your phone.");
      }
      var answers = [], correct = 0;
      for (var i = 0; i < d.numAnswered; i++) {
        var q = list[i];
        var ok = d.chosen[i] === q.answerIndex;
        if (ok) correct++;
        // secs: null marks "answered on the phone" — shown as – here, and
        // the phone already holds the real times for these.
        answers.push({ qid: q.id, topic: q.topic, correct: ok, chosen: d.chosen[i], secs: null });
      }
      quiz = {
        list: list,
        idx: d.numAnswered,
        correct: correct,
        topic: d.topicSel === 15 ? "All topics" : TOPICS[d.topicSel],
        answers: answers,
        t0: Date.now(),
        elapsedBase: Math.min(4095, d.elapsed),
        qStart: null,
        portable: true,
        seed: d.seed,
        handoff: d.numAnswered,
        phoneElapsed: Math.min(4095, d.elapsed),
        topicSel: d.topicSel
      };
      writePortableSave();
      showOnly("quiz-run");
      renderQuestion();
    });
  }

  function resumePortableSession(saved) {
    loadQuestions(function () {
      var list = (saved.qids || []).map(findQuestion).filter(Boolean);
      if (!list.length || list.length !== saved.qids.length) {
        clearPortableSave();
        initPortableEntry();
        return;
      }
      quiz = {
        list: list,
        idx: Math.min(saved.idx || 0, list.length - 1),
        correct: saved.correct || 0,
        topic: saved.topic || "Quiz from your phone",
        answers: saved.answers || [],
        t0: Date.now(),
        elapsedBase: saved.elapsedBase || 0,
        qStart: null,
        portable: true,
        seed: saved.seed,
        handoff: saved.handoff || 0,
        phoneElapsed: saved.phoneElapsed || 0,
        topicSel: saved.topicSel
      };
      showOnly("quiz-run");
      renderQuestion();
      toast("Picked up right where you left off on this device.");
    });
  }

  function currentResultCode() {
    var pcAnswers = quiz.answers.slice(quiz.handoff);
    var active = Math.max(0, Math.round(totalQuizSecs() - (quiz.phoneElapsed || 0)));
    return PortableCodes.encodeResultCode({
      seed: quiz.seed,
      answers: pcAnswers.map(function (a) {
        return { chosen: a.chosen, secs: Math.min(255, a.secs || 0) };
      }),
      pcActiveSecs: active
    });
  }

  function openResultCodeScreen() {
    if (!quiz || !quiz.portable) return;
    if (quiz.answers.length - quiz.handoff < 1) {
      toast("Answer at least one question here first.");
      return;
    }
    var code = currentResultCode();
    var ov = document.createElement("div");
    ov.className = "portable-overlay";
    ov.innerHTML = '<div class="card"><h3>Result code</h3>' +
      '<p>On your phone, tap <strong>Enter result code</strong> and type this in. Your answers move into your tracker.</p>' +
      '<div class="code-display">' + escapeHtml(code) + "</div>" +
      '<div class="quiz-nav" style="margin-top:12px"><button id="rc-copy" class="btn">Copy code</button> ' +
      '<button id="rc-back" class="btn primary">Back to quiz</button></div>' +
      '<div class="quiz-nav"><button id="rc-wipe" class="btn text">Wipe this device</button></div>' +
      '<p class="muted">Nothing is saved on this computer — wiping clears this tab completely.</p></div>';
    document.body.appendChild(ov);
    document.getElementById("rc-copy").addEventListener("click", function () {
      copyText(code, function () { toast("Result code copied."); });
    });
    document.getElementById("rc-back").addEventListener("click", function () { ov.remove(); });
    document.getElementById("rc-wipe").addEventListener("click", function () {
      ov.remove();
      wipePortableDevice();
    });
  }

  function renderPortableResult() {
    var box = document.getElementById("quiz-result");
    var pct = Math.round(100 * quiz.correct / quiz.list.length);
    var pcCount = quiz.answers.length - quiz.handoff;
    var html = "<h3>Quiz complete</h3>";
    html += '<p class="result-score">' + quiz.correct + "/" + quiz.list.length +
      " <span>(" + pct + "%)</span></p>";
    html += '<div class="qtime-list">';
    quiz.answers.forEach(function (a, n) {
      var secs = (typeof a.secs === "number") ? fmtSecs(a.secs) : "–";
      html += '<div class="qtime-row"><span class="qtime-n">Q' + (n + 1) + "</span>" +
        '<span class="qtime-mark ' + (a.correct ? "good" : "bad") + '">' +
        (a.correct ? "✓" : "✗") + "</span>" +
        '<span class="qtime-topic">' + escapeHtml(a.topic || "") + "</span>" +
        '<span class="qtime-secs">' + secs + "</span></div>";
    });
    html += "</div>";
    if (pcCount > 0) {
      var code = currentResultCode();
      html += '<div class="card" style="margin-top:14px"><h4>Take this back to your phone</h4>' +
        '<p class="muted">On your phone, tap <strong>Enter result code</strong> and type this in. Your answers move into your tracker.</p>' +
        '<div class="code-display">' + escapeHtml(code) + "</div>" +
        '<div class="quiz-nav" style="margin-top:10px"><button id="pr-copy" class="btn">Copy code</button></div></div>';
    }
    html += '<div class="quiz-nav"><button id="pr-wipe" class="btn primary">Wipe this device</button></div>';
    html += '<p class="disclaimer">Nothing from this session is saved on this computer.</p>';
    box.innerHTML = html;
    showOnly("quiz-result");
    // Bind after innerHTML: #pr-copy only exists when pcCount > 0.
    var cpBtn = document.getElementById("pr-copy");
    if (cpBtn) {
      (function (c) {
        cpBtn.addEventListener("click", function () {
          copyText(c, function () { toast("Result code copied."); });
        });
      })(code);
    }
    document.getElementById("pr-wipe").addEventListener("click", wipePortableDevice);
    clearPortableSave();
  }

  function wipePortableDevice() {
    clearPortableSave();
    quiz = null;
    initPortableEntry();
    toast("Wiped — nothing from your session stays on this computer.");
  }

  // ---- score sharing ---------------------------------------------------
  function drawShareCard(pct, scopeLine, fracLine) {
    var W = 1080, H = 1350;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d");
    // background
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#22345c"); g.addColorStop(1, "#141f3a");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.textAlign = "center";
    // brand
    x.fillStyle = "#e8b64c";
    x.font = "700 52px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
    x.fillText("P A S S T H E F E", W / 2, 150);
    // checkmark badge
    x.beginPath(); x.arc(W / 2, 330, 92, 0, Math.PI * 2);
    x.fillStyle = "#2f9e63"; x.fill();
    x.strokeStyle = "#ffffff"; x.lineWidth = 26; x.lineCap = "round"; x.lineJoin = "round";
    x.beginPath();
    x.moveTo(W / 2 - 48, 332); x.lineTo(W / 2 - 12, 368); x.lineTo(W / 2 + 52, 292);
    x.stroke();
    // score
    x.fillStyle = "#ffffff";
    x.font = "800 300px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
    x.fillText(pct + "%", W / 2, 720);
    x.fillStyle = "#e8b64c";
    x.font = "700 46px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
    x.fillText("FE CIVIL PRACTICE QUIZ", W / 2, 810);
    x.fillStyle = "#cdd6ea";
    x.font = "400 44px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
    x.fillText(scopeLine, W / 2, 880);
    x.fillText(fracLine, W / 2, 945);
    // divider
    x.fillStyle = "#e8b64c"; x.fillRect(W / 2 - 120, 1010, 240, 6);
    // call to action
    x.fillStyle = "#ffffff";
    x.font = "600 48px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
    x.fillText("Can you beat it?", W / 2, 1110);
    x.fillStyle = "#e8b64c";
    x.font = "700 44px -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
    x.fillText("Practice free at", W / 2, 1180);
    x.fillStyle = "#ffffff";
    x.fillText("passthefe.pages.dev", W / 2, 1245);
    return c;
  }

  function copyText(t, done) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(done, fallback);
    } else { fallback(); }
  }

  function toast(msg) {
    var el = document.getElementById("share-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "share-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = "show";
    setTimeout(function () { el.className = ""; }, 2600);
  }

  function shareScore() {
    if (!quiz) return;
    var pct = Math.round(100 * quiz.correct / quiz.list.length);
    var scope = quiz.topic && quiz.topic !== "All topics" ? quiz.topic : "All 15 topics";
    var frac = quiz.correct + " of " + quiz.list.length + " correct";
    var text = "I scored " + pct + "% (" + frac + ") on an FE Civil practice quiz" +
      (scope !== "All 15 topics" ? " — " + scope : "") +
      ". Think you can beat it? Practice free: https://passthefe.pages.dev";
    var card = drawShareCard(pct, scope, frac);
    card.toBlob(function (blob) {
      if (!blob) { copyText(text, function () { toast("Score copied — paste it anywhere!"); }); return; }
      var file = new File([blob], "passthefe-score.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: "My PassTheFE score", text: text })
          .catch(function () {});
      } else {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "passthefe-score.png";
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        copyText(text, function () {
          toast("Score card downloaded + caption copied — post it anywhere!");
        });
      }
    }, "image/png");
  }

  // ---- streaks -----------------------------------------------------------
  function dayStr(ts) {
    var d = new Date(ts);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function bumpStreak() {
    var s = store.get("streak", { lastDay: null, count: 0 });
    var today = dayStr(Date.now());
    if (s.lastDay === today) return;
    var y = new Date(Date.now() - 86400000);
    var yesterday = dayStr(y.getTime());
    s.count = (s.lastDay === yesterday) ? s.count + 1 : 1;
    s.lastDay = today;
    store.set("streak", s);
  }

  function renderStreak() {
    var el = document.getElementById("quiz-streak");
    if (!el) return;
    var s = store.get("streak", { count: 0 });
    el.textContent = s.count > 0 ? "🔥 " + s.count + "-day streak" : "";
  }

  // ---- analytics ---------------------------------------------------------
  function scoreClass(p) { return p >= 70 ? "good" : (p >= 50 ? "mid" : "bad"); }

  function topicStats(minN) {
    var attempts = store.get("attempts", []);
    var out = [];
    TOPICS.forEach(function (t) {
      var ts = attempts.filter(function (a) { return a.topic === t; });
      if (ts.length < minN) return;
      var r = ts.filter(function (a) { return a.correct; }).length;
      out.push({ topic: t, n: ts.length, pct: Math.round(100 * r / ts.length) });
    });
    return out;
  }

  // Mastery = accuracy × confidence (confidence fills at ~10 attempts per topic).
  function masteryLevel(m, n) {
    if (!n) return "Not started";
    if (m >= 85) return "Mastered";
    if (m >= 70) return "Proficient";
    if (m >= 40) return "Building";
    return "Learning";
  }

  function topicMastery() {
    var attempts = store.get("attempts", []);
    return TOPICS.map(function (t) {
      var ts = attempts.filter(function (a) { return a.topic === t; });
      var n = ts.length;
      var pct = n ? Math.round(100 * ts.filter(function (a) { return a.correct; }).length / n) : 0;
      var mastery = n ? Math.round(pct * Math.min(1, n / 10)) : 0;
      return { topic: t, n: n, pct: pct, mastery: mastery, level: masteryLevel(mastery, n) };
    });
  }

  function findQuestion(id) {
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (QUESTIONS[i].id === id) return QUESTIONS[i];
    }
    return null;
  }

  // ---- per-skill analytics -------------------------------------------------
  // Attempts are logged with qid = bank question id, or baseId:variantKey
  // for randomized variants. Stripping the variant suffix merges a bank
  // question with its generator (they share the baseId), so accuracy is
  // tracked per SKILL, not per chapter and not per rolled variant.
  function skillKey(qid) {
    if (!qid) return qid;
    var c = qid.indexOf(":");
    return c >= 0 ? qid.slice(0, c) : qid;
  }

  function findGeneratorByBaseId(baseId) {
    var libs = [window.MATH_GENERATORS, window.ECON_GENERATORS,
                window.STATS_GENERATORS, window.MATERIALS_GENERATORS,
                window.STATICS_GENERATORS, window.MECHMAT_GENERATORS];
    for (var i = 0; i < libs.length; i++) {
      var lib = libs[i];
      if (!Array.isArray(lib)) continue;
      for (var j = 0; j < lib.length; j++) {
        if (lib[j] && lib[j].baseId === baseId) return lib[j];
      }
    }
    return null;
  }

  // Per-skill accuracy: { key, topic, subtopic, n, pct, drillable }.
  // A skill is drillable when a generator exists for its baseId.
  function skillStats(minN) {
    var attempts = store.get("attempts", []);
    var bySkill = {};
    attempts.forEach(function (a) {
      var key = skillKey(a.qid);
      (bySkill[key] = bySkill[key] || []).push(a);
    });
    var out = [];
    Object.keys(bySkill).forEach(function (key) {
      var ts = bySkill[key];
      if (ts.length < minN) return;
      var r = ts.filter(function (a) { return a.correct; }).length;
      var gen = findGeneratorByBaseId(key);
      var q = gen ? null : findQuestion(key);
      out.push({
        key: key,
        topic: gen ? gen.topic : (q ? q.topic : (ts[0] ? ts[0].topic : "")),
        subtopic: gen ? (gen.subtopic || key) : (q ? (q.subtopic || key) : key),
        n: ts.length,
        pct: Math.round(100 * r / ts.length),
        drillable: !!gen
      });
    });
    return out;
  }

  // ---- adaptive practice ---------------------------------------------------
  // NCEES FE Civil knowledge areas with the scored item counts from an
  // official NCEES diagnostic report (the "Number of Items" column). These
  // 14 areas sum to 100 — the real 110-question exam adds ~10 unscored
  // pretest items on top, whose areas NCEES doesn't publish.
  // "Mathematics and Statistics" (8) is split 5 / 3 across the bank's
  // separate Mathematics and Statistics topics; "Water Resources and
  // Environmental Engineering" (10) counts fully toward the bank's Water
  // Resources topic.
  var EXAM_AREAS = [
    { area: "Mathematics and Statistics", n: 8, topics: ["Mathematics", "Statistics and Probability"] },
    { area: "Ethics and Professional Practice", n: 4, topics: ["Ethics and Professional Practice"] },
    { area: "Engineering Economics", n: 5, topics: ["Engineering Economics"] },
    { area: "Statics", n: 8, topics: ["Statics"] },
    { area: "Dynamics", n: 4, topics: ["Dynamics"] },
    { area: "Mechanics of Materials", n: 7, topics: ["Mechanics of Materials"] },
    { area: "Materials", n: 5, topics: ["Materials"] },
    { area: "Fluid Mechanics", n: 6, topics: ["Fluid Mechanics"] },
    { area: "Surveying", n: 6, topics: ["Surveying"] },
    { area: "Water Resources and Environmental Engineering", n: 10, topics: ["Water Resources"] },
    { area: "Structural Engineering", n: 10, topics: ["Structural Engineering"] },
    { area: "Geotechnical Engineering", n: 10, topics: ["Geotechnical Engineering"] },
    { area: "Transportation Engineering", n: 9, topics: ["Transportation Engineering"] },
    { area: "Construction Engineering", n: 8, topics: ["Construction Engineering"] }
  ];
  var BLUEPRINT = [
    { topic: "Mathematics", w: 5 },
    { topic: "Statistics and Probability", w: 3 },
    { topic: "Ethics and Professional Practice", w: 4 },
    { topic: "Engineering Economics", w: 5 },
    { topic: "Statics", w: 8 },
    { topic: "Dynamics", w: 4 },
    { topic: "Mechanics of Materials", w: 7 },
    { topic: "Materials", w: 5 },
    { topic: "Fluid Mechanics", w: 6 },
    { topic: "Surveying", w: 6 },
    { topic: "Water Resources", w: 10 },
    { topic: "Structural Engineering", w: 10 },
    { topic: "Geotechnical Engineering", w: 10 },
    { topic: "Transportation Engineering", w: 9 },
    { topic: "Construction Engineering", w: 8 }
  ];

  // Adaptive mastery: recency-weighted accuracy with exponential decay.
  // Each attempt's weight decays by 0.9 per older attempt, giving an
  // effective window of ~10 attempts — matching the app's existing
  // "~10 attempts per topic for full confidence" rule. A neutral prior
  // (50% with a weight of 5 attempts) keeps topics with little history
  // near the middle instead of swinging on one lucky/unlucky answer, and
  // puts unattempted topics at 50 so the sampler rotates through them
  // evenly rather than treating them as mastered (100) or critical (0).
  // As attempts accumulate the prior washes out and mastery converges to
  // recent accuracy.
  var ADAPT_DECAY = 0.9, ADAPT_PRIOR_W = 5, ADAPT_PRIOR_PCT = 50;

  function adaptiveMastery() {
    var attempts = store.get("attempts", []);
    var byTopic = {};
    attempts.forEach(function (a) {
      (byTopic[a.topic] = byTopic[a.topic] || []).push(a);
    });
    return TOPICS.map(function (t) {
      var ts = byTopic[t] || [];
      var wSum = 0, wCorrect = 0, w = 1; // newest attempt weighs 1
      for (var i = ts.length - 1; i >= 0; i--) {
        wSum += w;
        if (ts[i].correct) wCorrect += w;
        w *= ADAPT_DECAY;
      }
      var mastery = Math.round(100 *
        (wCorrect + ADAPT_PRIOR_W * ADAPT_PRIOR_PCT / 100) / (wSum + ADAPT_PRIOR_W));
      return { topic: t, mastery: mastery, n: ts.length };
    });
  }

  // Readiness: per-topic adaptive mastery weighted by the NCEES blueprint
  // weights. An estimate built from practice history — never a prediction
  // of the exam result (that disclaimer travels with every display).
  var READINESS_NOTE = "Based on your practice so far — not a prediction of your exam result.";
  function readiness() {
    var m = adaptiveMastery();
    var byTopic = {};
    m.forEach(function (x) { byTopic[x.topic] = x.mastery; });
    var wSum = 0, wScore = 0;
    BLUEPRINT.forEach(function (b) {
      var mt = byTopic[b.topic];
      wSum += b.w;
      wScore += b.w * (typeof mt === "number" ? mt : ADAPT_PRIOR_PCT);
    });
    return { pct: Math.round(wScore / wSum), perTopic: m };
  }

  function readinessClass(p) { return p >= 70 ? "good" : (p >= 50 ? "mid" : "bad"); }

  function readinessHtml(r, compact) {
    var total = store.get("attempts", []).length;
    var html = '<div class="readiness-panel">';
    if (!total) {
      html += '<p class="muted">Answer practice questions and this panel builds your readiness estimate.</p>';
    } else {
      html += '<div class="readiness-head"><span class="readiness-score ' +
        readinessClass(r.pct) + '">' + r.pct + '%</span>' +
        '<span class="readiness-label">Exam readiness</span></div>' +
        '<p class="disclaimer">' + READINESS_NOTE + '</p>';
      if (!compact) {
        html += '<div class="readiness-topics">';
        r.perTopic.forEach(function (m) {
          var cls = m.n ? readinessClass(m.mastery) : "";
          html += '<div class="topic-row"><span class="topic-name">' +
            escapeHtml(m.topic) + ' <small>(' + (m.n ? m.n + " answered" : "not started") + ")</small></span>" +
            '<span class="bar"><span class="fill ' + cls +
            '" style="width:' + m.mastery + '%"></span></span>' +
            '<span class="mastery-level ' + cls + '">' + m.mastery + "%</span></div>";
        });
        html += "</div>";
      }
    }
    html += "</div>";
    return html;
  }

  // Adaptive session builder: sample n questions weighted toward the
  // lowest-mastery topics, preferring questions never seen (then the
  // least-recently-seen). Topic pick uses (101 - mastery)^2 weighting —
  // a 0% topic is ~85x likelier than a 90% one, but strong topics still
  // surface occasionally. With no attempts every topic sits at the neutral
  // 50, so new users get an even rotation across topics.
  function buildAdaptiveSession(qs, n) {
    var m = adaptiveMastery();
    var byTopic = {};
    m.forEach(function (x) { byTopic[x.topic] = x.mastery; });
    var attempts = store.get("attempts", []);
    var lastSeen = {}; // attempts are chronological; later entries overwrite
    attempts.forEach(function (a) { lastSeen[a.qid] = a.ts; });
    function unseenFirst(a, b) {
      return (lastSeen[a.id] || 0) - (lastSeen[b.id] || 0);
    }
    function pickTopic() {
      var total = 0;
      var entries = TOPICS.map(function (t) {
        var mt = typeof byTopic[t] === "number" ? byTopic[t] : ADAPT_PRIOR_PCT;
        var wgt = Math.pow(101 - mt, 2);
        total += wgt;
        return { topic: t, wgt: wgt };
      });
      var r = Math.random() * total;
      for (var i = 0; i < entries.length; i++) {
        r -= entries[i].wgt;
        if (r <= 0) return entries[i].topic;
      }
      return entries[entries.length - 1].topic;
    }
    var picked = [], pickedIds = {}, guard = 0;
    while (picked.length < n && guard++ < n * 60) {
      var topic = pickTopic();
      var pool = qs.filter(function (q) { return q.topic === topic && !pickedIds[q.id]; });
      var choice;
      if (pool.length) {
        // Fresh questions first (random among the unseen for variety);
        // once a topic's questions have all been seen, cycle back through
        // the least-recently-seen — spaced repetition of the stalest.
        var unseen = pool.filter(function (q) { return !lastSeen[q.id]; });
        var cands = unseen.length ? unseen : pool.slice().sort(unseenFirst).slice(0, 5);
        choice = cands[Math.floor(Math.random() * cands.length)];
      } else {
        // Topic exhausted inside this session: take the stalest remaining
        // question from anywhere in the bank.
        var rest = qs.filter(function (q) { return !pickedIds[q.id]; });
        if (!rest.length) break; // bank exhausted — can't happen via the UI
        rest.sort(unseenFirst);
        choice = rest[0];
      }
      picked.push(choice);
      pickedIds[choice.id] = 1;
    }
    return picked;
  }

  function selectedAdaptiveLength() {
    var b = document.querySelector("#adaptive-lengths .length-btn.selected");
    return b ? parseInt(b.dataset.n, 10) : 10;
  }

  function startAdaptiveQuiz() {
    loadQuestions(function (qs) {
      // A fresh quiz retires any session code still waiting.
      if (store.get("portableOut", null)) {
        store.set("portableOut", null);
        toast("The old session code stopped working — you started a new quiz.");
      }
      var n = Math.min(selectedAdaptiveLength(), qs.length);
      var list = buildAdaptiveSession(qs, n);
      if (!list.length) {
        toast("The question bank failed to load — check your connection and try again.");
        return;
      }
      var before = {};
      adaptiveMastery().forEach(function (x) { before[x.topic] = x.mastery; });
      quiz = {
        list: list,
        idx: 0, correct: 0, topic: "Adaptive Practice", mode: "adaptive",
        answers: [],
        t0: Date.now(), elapsedBase: 0, qStart: null,
        seed: null, // adaptive lists can't be regenerated from a seed,
        topicSel: 15, // so portable sessions stay off for this mode
        masteryBefore: before
      };
      saveProgress();
      renderQuestion();
      showOnly("quiz-run");
    });
  }

  function renderAdaptivePanel() {
    var el = document.getElementById("adaptive-panel");
    if (!el) return;
    el.innerHTML = readinessHtml(readiness(), false);
  }

  // Mastery movement shown after an adaptive session: per-topic before ->
  // after for every topic the session touched, plus updated readiness.
  function adaptiveResultHtml() {
    if (!quiz.masteryBefore) return "";
    var after = adaptiveMastery();
    var byAfter = {};
    after.forEach(function (x) { byAfter[x.topic] = x.mastery; });
    var touched = {};
    quiz.answers.forEach(function (a) { touched[a.topic] = 1; });
    var html = '<div class="adaptive-moves"><h3>Mastery movement</h3>';
    TOPICS.forEach(function (t) {
      if (!touched[t]) return;
      var b = quiz.masteryBefore[t], a = byAfter[t];
      var d = a - b;
      var cls = d > 0 ? "good" : (d < 0 ? "bad" : "");
      var arrow = d > 0 ? "↑" : (d < 0 ? "↓" : "→");
      html += '<div class="move-row"><span class="move-topic">' + escapeHtml(t) + "</span>" +
        '<span class="move-delta ' + cls + '">' + b + "% → " + a + "% " + arrow +
        (d ? " " + (d > 0 ? "+" : "") + d : "") + "</span></div>";
    });
    var r = readiness();
    html += '<div class="readiness-head" style="margin-top:14px"><span class="readiness-score ' +
      readinessClass(r.pct) + '">' + r.pct + '%</span>' +
      '<span class="readiness-label">Updated exam readiness</span></div>' +
      '<p class="disclaimer">' + READINESS_NOTE + "</p></div>";
    return html;
  }

  // ---- randomized practice -------------------------------------------------
  // Infinite generated variants. js/generators_math.js (loaded before this
  // file) defines window.MATH_GENERATORS; each entry exposes generate()
  // returning a bank-shaped question. js/generators_econ.js (also loaded
  // before this file) defines window.ECON_GENERATORS with the identical
  // contract and topic "Engineering Economics". js/generators_stats.js
  // (also loaded before this file) defines window.STATS_GENERATORS with the
  // identical contract and topic "Statistics and Probability".
  // js/generators_materials.js (also loaded before this file) defines
  // window.MATERIALS_GENERATORS with the identical contract and topic
  // "Materials". js/generators_mechmat.js (also loaded before this file)
  // defines window.MECHMAT_GENERATORS with the identical contract and topic
  // "Mechanics of Materials". The econ, stats, materials, statics and
  // mechmat libraries are optional: a missing library's picker button is
  // hidden and the mode falls back to the libraries that are present.
  // The mode card is hidden when all libraries are missing or empty.
  // Sessions are open-ended: after each answer the user can re-roll the
  // same generator ("New numbers") or take a fresh random generator
  // ("Next"); "Finish & results" reuses the standard results screen.
  //
  // Progress logging: the shared answerCurrent/logAttempt path is reused
  // with mode:"randomized", but each variant is stamped with
  // id = baseId + ":" + variantKey. Every bank-driven consumer keyed by
  // question id (adaptive lastSeen, study list via findQuestion, exam
  // rotation) therefore never sees a variant id — variants contribute only
  // to per-topic mastery/readiness through the attempt's topic field, and
  // missed variant ids are silently filtered from the study list.
  // saveProgress skips randomized sessions: variants are not resumable.
  // The chapter picker ("mixed" | "math" | "econ" | "stats" | "mat") filters the
  // combined pool; "Next" draws a different generator from the active
  // (filtered) pool, "New numbers" re-rolls the same generator as before.
  var randomizedChapterSel = "mixed";

  // Unfiltered combined pool (math + econ + stats + materials), or null when all are missing.
  function randomizedGeneratorsAll() {
    var all = [];
    var m = window.MATH_GENERATORS;
    if (Array.isArray(m) && m.length) all = all.concat(m);
    var e = window.ECON_GENERATORS;
    if (Array.isArray(e) && e.length) all = all.concat(e);
    var s = window.STATS_GENERATORS;
    if (Array.isArray(s) && s.length) all = all.concat(s);
    var mt = window.MATERIALS_GENERATORS;
    if (Array.isArray(mt) && mt.length) all = all.concat(mt);
    var st = window.STATICS_GENERATORS;
    if (Array.isArray(st) && st.length) all = all.concat(st);
    var mm = window.MECHMAT_GENERATORS;
    if (Array.isArray(mm) && mm.length) all = all.concat(mm);
    return all.length ? all : null;
  }

  function randomizedChapter() { return randomizedChapterSel; }

  // Active pool: the combined library filtered by the chapter picker, or
  // null when the selected pool is empty.
  function randomizedGenerators() {
    var ch = randomizedChapter();
    var m = window.MATH_GENERATORS;
    var e = window.ECON_GENERATORS;
    var s = window.STATS_GENERATORS;
    var mt = window.MATERIALS_GENERATORS;
    var st = window.STATICS_GENERATORS;
    var mm = window.MECHMAT_GENERATORS;
    var okM = Array.isArray(m) && m.length;
    var okE = Array.isArray(e) && e.length;
    var okS = Array.isArray(s) && s.length;
    var okMt = Array.isArray(mt) && mt.length;
    var okSt = Array.isArray(st) && st.length;
    var okMm = Array.isArray(mm) && mm.length;
    if (ch === "econ") return okE ? e.slice() : null;
    if (ch === "math") return okM ? m.slice() : null;
    if (ch === "stats") return okS ? s.slice() : null;
    if (ch === "mat") return okMt ? mt.slice() : null;
    if (ch === "stat") return okSt ? st.slice() : null;
    if (ch === "mechmat") return okMm ? mm.slice() : null;
    var all = [];
    if (okM) all = all.concat(m);
    if (okE) all = all.concat(e);
    if (okS) all = all.concat(s);
    if (okMt) all = all.concat(mt);
    if (okSt) all = all.concat(st);
    if (okMm) all = all.concat(mm);
    return all.length ? all : null;
  }

  // Chapter picker wiring (setup view only): a chapter button is hidden
  // when its library failed to load; the whole picker is hidden when fewer
  // than two libraries are present. The count line always reflects the
  // ACTIVE pool and refreshes whenever the picker changes.
  function updateRandomizedCount() {
    var rCount = document.getElementById("randomized-count");
    if (!rCount) return;
    var gens = randomizedGenerators();
    var n = gens ? gens.length : 0;
    rCount.textContent = n + " generator" + (n === 1 ? "" : "s") +
      " loaded — every question has fresh numbers.";
  }

  function updateRandomizedChapters() {
    var picker = document.getElementById("randomized-chapters");
    if (!picker) return;
    var okM = Array.isArray(window.MATH_GENERATORS) && window.MATH_GENERATORS.length;
    var okE = Array.isArray(window.ECON_GENERATORS) && window.ECON_GENERATORS.length;
    var okS = Array.isArray(window.STATS_GENERATORS) && window.STATS_GENERATORS.length;
    var okMt = Array.isArray(window.MATERIALS_GENERATORS) && window.MATERIALS_GENERATORS.length;
    var okSt = Array.isArray(window.STATICS_GENERATORS) && window.STATICS_GENERATORS.length;
    var okMm = Array.isArray(window.MECHMAT_GENERATORS) && window.MECHMAT_GENERATORS.length;
    var okMap = { math: okM, econ: okE, stats: okS, mat: okMt, stat: okSt, mechmat: okMm };
    var present = (okM ? 1 : 0) + (okE ? 1 : 0) + (okS ? 1 : 0) + (okMt ? 1 : 0) + (okSt ? 1 : 0) + (okMm ? 1 : 0);
    picker.classList.toggle("hidden", present < 2);
    picker.querySelectorAll(".length-btn").forEach(function (b) {
      var ch = b.dataset.chapter || "mixed";
      if (ch !== "mixed" && !okMap[ch]) b.classList.add("hidden");
      else b.classList.remove("hidden");
    });
    if (randomizedChapterSel !== "mixed" && !okMap[randomizedChapterSel]) randomizedChapterSel = "mixed";
    picker.querySelectorAll(".length-btn").forEach(function (b) {
      b.classList.toggle("selected", (b.dataset.chapter || "mixed") === randomizedChapterSel);
    });
  }

  function wireRandomizedChapters() {
    var picker = document.getElementById("randomized-chapters");
    if (!picker) return;
    picker.querySelectorAll(".length-btn").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        randomizedChapterSel = btn.dataset.chapter || "mixed";
        picker.querySelectorAll(".length-btn").forEach(function (b) {
          b.classList.toggle("selected", b === btn);
        });
        updateRandomizedCount();
      });
    });
  }

  function pickRandomGenerator(prevGen) {
    var gens = randomizedGenerators();
    if (!gens) return null;
    if (gens.length === 1) return gens[0];
    var g = gens[Math.floor(Math.random() * gens.length)];
    if (g === prevGen) g = gens[Math.floor(Math.random() * gens.length)];
    return g;
  }

  // Roll one variant from a generator and stamp it with a globally-unique
  // variant id so per-question stats keyed by qid never merge with a bank
  // entry. The generator reference rides on _gen (never serialized).
  function rollVariant(gen) {
    var v = gen.generate();
    var vk = v.variantKey ||
      ("v" + Math.floor(Math.random() * 60466176).toString(36));
    v.variantKey = vk;
    v.baseId = v.baseId || gen.baseId || "random";
    v.id = v.baseId + ":" + vk;
    v.topic = v.topic || gen.topic || "Mathematics";
    v._gen = gen;
    return v;
  }

  function startRandomizedQuiz(pinnedGen) {
    // pinnedGen: drill one weak skill — every question re-rolls the same
    // generator. Otherwise a random generator from the active chapter pool.
    var gen = pinnedGen || pickRandomGenerator(null);
    if (!gen) {
      toast("The generator library didn't load — check your connection and try again.");
      return;
    }
    // A fresh session retires any session code still waiting.
    if (store.get("portableOut", null)) {
      store.set("portableOut", null);
      toast("The old session code stopped working — you started a new session.");
    }
    var v;
    try { v = rollVariant(gen); }
    catch (e) { toast("That generator failed — try again."); return; }
    quiz = {
      list: [v], idx: 0, correct: 0, topic: "Randomized Practice", mode: "randomized",
      answers: [],
      t0: Date.now(), elapsedBase: 0, qStart: null,
      seed: null, // variants can't be regenerated elsewhere, so portable
      topicSel: 15, // sessions stay off for this mode
      drillBaseId: pinnedGen ? pinnedGen.baseId : null
    };
    renderRandomQuestion();
    showOnly("quiz-run");
  }

  // Same shape as renderQuestion (stem, shuffled choices, instant feedback,
  // KaTeX solution through revealAnswer), but open-ended: the progress line
  // counts answered questions instead of "N of M", and the post-answer nav
  // offers New numbers / Next / Finish & results.
  function renderRandomQuestion() {
    var q = quiz.list[quiz.idx];
    var box = document.getElementById("quiz-run");
    box.dataset.answered = "";
    var modeLabel = (quiz.drillBaseId && q._gen && q._gen.subtopic)
      ? "Drilling " + q._gen.subtopic : "Randomized Practice";
    var letters = "ABCDEFGH";
    var html = '<div class="quiz-head">' + quizBackHtml() +
      ' <span class="timer-pill" title="Time on this question · total session time">⏱ <b id="qt-q">0:00</b> · <b id="qt-t">0:00</b></span></div>';
    html += '<h2 class="quiz-title">' + escapeHtml(modeLabel) + "</h2>";
    html += '<div class="quiz-badges"><span class="badge badge-topic">' + escapeHtml(q.topic) + "</span>" +
      diffBadge(q.difficulty) + "</div>";
    html += '<p class="question-text">' + inlineMath(q.question) + "</p>";
    html += diagramHtml(q);
    html += '<ul class="choices" id="quiz-choices">';
    var order = shuffle(q.choices.map(function (c, i) { return i; }));
    order.forEach(function (i, pos) {
      html += '<li data-i="' + i + '"><span class="choice-letter">' + letters[pos] +
        '</span><span class="choice-text">' + inlineMath(q.choices[i]) + "</span></li>";
    });
    html += "</ul>";
    html += '<div class="solution" id="quiz-solution" style="display:none"></div>';
    html += '<div class="quiz-bottom"><div class="qcount-wrap"><span class="qcount-pill">Question ' +
      (quiz.answers.length + 1) + " · " + quiz.correct + ' correct</span></div>';
    html += '<div id="random-nav" style="display:none">';
    html += '<button id="quiz-next" class="btn primary btn-block">Next</button>';
    html += '<div class="quiz-nav-sub"><button id="quiz-newnums" class="btn">New numbers</button> ' +
      '<button id="quiz-finish" class="btn text">Finish &amp; results</button></div>';
    html += "</div></div>";
    box.innerHTML = html;
    document.getElementById("quiz-back").addEventListener("click", quizGoBack);
    box.querySelectorAll("#quiz-choices li").forEach(function (li) {
      li.addEventListener("click", function () { answerRandom(parseInt(li.dataset.i, 10)); });
    });
    document.getElementById("quiz-next").addEventListener("click", function () {
      // "Next": a fresh variant from a different random generator — unless
      // drilling one weak skill, in which case the same generator re-rolls.
      var gen = quiz.drillBaseId ? q._gen : pickRandomGenerator(q._gen);
      if (!gen) { toast("The generator library didn't load — finish up and check your connection."); return; }
      var nv;
      try { nv = rollVariant(gen); }
      catch (e) { toast("That generator failed — try again."); return; }
      quiz.list.push(nv);
      quiz.idx++;
      renderRandomQuestion();
    });
    document.getElementById("quiz-newnums").addEventListener("click", function () {
      // "New numbers": re-roll the SAME generator — a fresh variant of the
      // same skill to drill again.
      var nv;
      try { nv = rollVariant(q._gen); }
      catch (e) { toast("That generator failed — try again."); return; }
      quiz.list.push(nv);
      quiz.idx++;
      renderRandomQuestion();
    });
    document.getElementById("quiz-finish").addEventListener("click", function () {
      showResult(); // standard results screen; skips the adaptive-only block
    });
    startQuizTimer();
  }

  // Answering reuses the shared path verbatim (scoring, logAttempt with
  // mode:"randomized", instant feedback via revealAnswer); afterwards the
  // randomized nav is revealed instead of the single Next button.
  function answerRandom(i) {
    answerCurrent(i);
    var nav = document.getElementById("random-nav");
    if (nav) nav.style.display = "";
  }

  // ---- exam simulator ------------------------------------------------------
  // Full 110-question timed simulation, like the real FE: 100 scored
  // questions with exactly the NCEES per-area item counts (EXAM_AREAS), plus
  // 10 pretest-style questions mixed in invisibly and excluded from scoring
  // — NCEES doesn't publish which areas its pretest items come from, so ours
  // go one each to the 10 largest areas. No backend, no account — state
  // lives in localStorage like everything else. Answers are NOT revealed
  // during the sim; grading happens once at submit, like the real exam.
  var EXAM_N = 110;
  var EXAM_SCORED = 100;
  var EXAM_SECS = 5 * 3600 + 20 * 60; // 5h20m — the real FE testing time
  var EXAM_BREAK_SECS = 25 * 60;      // one optional scheduled break
  var EXAM_NOTE = "Timed, exam-style practice — not the real NCEES exam.";
  var exam = null; // live sim: {list, idx, chosen, flagged, timeLeft,
                   //  breakUsed, breakActive, breakLeft, tick, submitted,
                   //  startedAt, saveTick}

  function fmtClock(s) {
    s = Math.max(0, Math.round(s));
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
    return h + ":" + (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss;
  }

  // Sample exactly EXAM_AREAS item counts per knowledge area (8/4/5/8/4/7/5
  // Sample the exam: per area, the exact NCEES scored count plus one
  // pretest-style extra for the 10 largest areas. Returns
  // { list, pretest } where pretest maps question id -> true. Prefers
  // questions not used in recent sims so consecutive sims don't repeat;
  // once the 500-question bank is exhausted, the rotation starts over.
  function buildExamSim(qs) {
    var usedSet = {};
    store.get("examUsed", []).forEach(function (id) { usedSet[id] = 1; });
    var pretestAreas = EXAM_AREAS.map(function (a, i) { return i; })
      .sort(function (x, y) { return EXAM_AREAS[y].n - EXAM_AREAS[x].n; })
      .slice(0, EXAM_N - EXAM_SCORED);
    var picked = [], pretest = {};
    EXAM_AREAS.forEach(function (a, i) {
      var need = a.n + (pretestAreas.indexOf(i) !== -1 ? 1 : 0);
      var pool = qs.filter(function (q) { return a.topics.indexOf(q.topic) !== -1; });
      var fresh = shuffle(pool.filter(function (q) { return !usedSet[q.id]; }));
      var stale = shuffle(pool.filter(function (q) { return usedSet[q.id]; }));
      var got = [];
      while (need > 0 && fresh.length) { got.push(fresh.pop()); need--; }
      while (need > 0 && stale.length) { got.push(stale.pop()); need--; }
      got.forEach(function (q, gi) {
        picked.push(q);
        if (gi >= a.n) pretest[q.id] = true; // the extras are pretest
      });
    });
    // Rotation bookkeeping: if this sim covers every bank question, reset.
    var bankIds = {};
    qs.forEach(function (q) { bankIds[q.id] = 1; });
    var nextUsed = store.get("examUsed", []).concat(picked.map(function (q) { return q.id; }));
    var coversAll = Object.keys(bankIds).every(function (id) {
      return nextUsed.indexOf(id) !== -1;
    });
    store.set("examUsed", coversAll
      ? picked.map(function (q) { return q.id; })
      : nextUsed);
    return { list: shuffle(picked), pretest: pretest };
  }

  function examAnsweredCount() {
    if (!exam) return 0;
    var n = 0, c = exam.chosen;
    for (var k in c) { if (c.hasOwnProperty(k) && typeof c[k] === "number") n++; }
    return n;
  }

  function examFlaggedCount() {
    if (!exam) return 0;
    var n = 0, f = exam.flagged;
    for (var k in f) { if (f.hasOwnProperty(k)) n++; }
    return n;
  }

  // ---- exam persistence ----------------------------------------------------
  function saveExamProgress() {
    if (!exam || exam.submitted || !exam.list.length) { store.set("examResume", null); return; }
    store.set("examResume", {
      v: 1,
      qids: exam.list.map(function (q) { return q.id; }),
      pretest: Object.keys(exam.pretest || {}),
      chosen: exam.chosen,
      flagged: exam.flagged,
      idx: exam.idx,
      timeLeft: Math.round(exam.timeLeft),
      breakUsed: exam.breakUsed,
      startedAt: exam.startedAt,
      savedAt: Date.now()
    });
  }

  function clearExamResume() { store.set("examResume", null); }

  function pauseExamTimer() {
    if (!exam || !exam.tick) return;
    clearInterval(exam.tick);
    exam.tick = null;
    saveExamProgress();
  }

  function resumeExam(saved) {
    loadQuestions(function () {
      var list = (saved.qids || []).map(findQuestion).filter(Boolean);
      if (!list.length || list.length !== saved.qids.length) {
        clearExamResume();
        renderExamSetup();
        return;
      }
      exam = {
        list: list,
        pretest: (function () {
          var s = {};
          (saved.pretest || []).forEach(function (id) { s[id] = true; });
          return s;
        })(),
        idx: Math.min(saved.idx || 0, list.length - 1),
        chosen: saved.chosen || {},
        flagged: saved.flagged || {},
        timeLeft: (typeof saved.timeLeft === "number") ? saved.timeLeft : EXAM_SECS,
        breakUsed: !!saved.breakUsed,
        breakActive: false, // a reload forfeits an in-progress break
        breakLeft: EXAM_BREAK_SECS,
        tick: null, submitted: false,
        startedAt: saved.startedAt || Date.now(),
        saveTick: 0
      };
      showExamScreen("exam-run");
      renderExamRun();
      startExamTimer();
    });
  }

  // ---- exam setup ----------------------------------------------------------
  function showExamScreen(id) {
    ["exam-setup", "exam-run", "exam-review", "exam-result"].forEach(function (x) {
      document.getElementById(x).classList.toggle("hidden", x !== id);
    });
    // The setup (Exams list) and the run render their own headers, so the
    // exam tab reads as its own pages.
    var head = document.getElementById("exam-page-head");
    if (head) head.classList.toggle("hidden", id === "exam-setup" || id === "exam-run");
    window.scrollTo(0, 0);
  }

  // "Wednesday, September 30, 2026" — for the Exams list cards.
  function fmtLongDate(ts) {
    try {
      return new Date(ts).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
    } catch (e) { return ""; }
  }

  // (exam history now renders as cards in renderExamSetup)

  function renderExamSetup() {
    var el = document.getElementById("exam-setup");
    var saved = store.get("examResume", null);
    var validResume = saved && saved.v === 1 && saved.qids && saved.qids.length;
    var sims = store.get("examSims", []);
    var html = '<h2 class="exams-title">Exams</h2>' +
      '<p class="lede">Full 110-question simulations · 5h20m timer · 100 scored per the NCEES blueprint, like the real exam.</p>';
    if (validResume) {
      var answered = saved.chosen ? Object.keys(saved.chosen).length : 0;
      html += '<div class="exam-card in-progress" id="exam-current-card" role="button" tabindex="0">' +
        "<div><div class=\"exam-card-label\">Started On</div>" +
        '<div class="exam-card-date">' + escapeHtml(fmtLongDate(saved.startedAt)) + "</div></div>" +
        '<div><div class="exam-card-label">Progress</div>' +
        '<div class="exam-card-progress">' + answered + "/" + saved.qids.length + "</div></div>" +
        "</div>";
    }
    html += '<div class="form-row"><button id="exam-start-btn" class="btn primary btn-block">' +
      (validResume ? "Start a new exam" : "Start full exam") + "</button></div>";
    if (validResume) {
      html += '<div class="quiz-nav-sub"><button id="exam-discard-btn" class="btn text">Discard in-progress exam</button></div>';
    }
    sims.slice().reverse().forEach(function (s) {
      var pct = (typeof s.pct === "number") ? s.pct.toFixed(1) : s.pct;
      html += '<div class="exam-card completed">' +
        '<div><span class="exam-card-label">Completed On</span> ' +
        '<span class="exam-card-date-blue">' + escapeHtml(fmtLongDate(s.ts)) + "</span>" +
        '<div class="exam-stats">' +
        '<div><div class="exam-stat-label">Total</div><div class="exam-stat-num">' + s.total + "</div></div>" +
        '<div><div class="exam-stat-label">Correct</div><div class="exam-stat-num">' + s.score + "</div></div>" +
        '<div><div class="exam-stat-label">% Correct</div><div class="exam-stat-num pct">' + pct + "%</div></div>" +
        "</div></div></div>";
    });
    if (!validResume && !sims.length) {
      html += '<p class="muted">No exams yet — start your first full simulation above.</p>';
    }
    el.innerHTML = html;
    var cc = document.getElementById("exam-current-card");
    if (cc) {
      var resume = function () { resumeExam(store.get("examResume", null)); };
      cc.addEventListener("click", resume);
      cc.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); resume(); }
      });
    }
    var db = document.getElementById("exam-discard-btn");
    if (db) db.addEventListener("click", function () { clearExamResume(); renderExamSetup(); });
    document.getElementById("exam-start-btn").addEventListener("click", startExam);
  }

  function initExam() {
    // The Exams list is always the landing screen; an in-progress exam
    // resumes by tapping its card.
    showExamScreen("exam-setup");
    renderExamSetup();
  }

  // Back out of a live exam to the Exams list. The attempt is saved first,
  // so it stays resumable from its card.
  function examGoBack() {
    pauseExamTimer();
    saveExamProgress();
    showExamScreen("exam-setup");
    renderExamSetup();
  }

  // ---- exam run ------------------------------------------------------------
  function startExam() {
    loadQuestions(function (qs) {
      var built = buildExamSim(qs);
      var list = built.list;
      if (list.length < EXAM_N) {
        toast("The question bank failed to load — check your connection and try again.");
        return;
      }
      exam = {
        list: list, pretest: built.pretest, idx: 0, chosen: {}, flagged: {},
        timeLeft: EXAM_SECS,
        breakUsed: false, breakActive: false, breakLeft: EXAM_BREAK_SECS,
        tick: null, submitted: false,
        startedAt: Date.now(), saveTick: 0
      };
      saveExamProgress();
      showExamScreen("exam-run");
      renderExamRun();
      startExamTimer();
    });
  }

  function startExamTimer() {
    if (!exam || exam.tick || exam.submitted) return;
    exam.tick = setInterval(examTick, 1000);
  }

  function examTick() {
    if (!exam || exam.submitted) return;
    if (exam.breakActive) {
      exam.breakLeft--;
      var bEl = document.getElementById("exam-break-timer");
      if (bEl) bEl.textContent = fmtClock(exam.breakLeft);
      if (exam.breakLeft <= 0) endBreak();
      return;
    }
    exam.timeLeft--;
    var tEl = document.getElementById("exam-timer");
    if (tEl) {
      tEl.textContent = fmtClock(exam.timeLeft);
      tEl.classList.toggle("low", exam.timeLeft <= 600);
    }
    exam.saveTick++;
    if (exam.saveTick % 15 === 0) saveExamProgress();
    if (exam.timeLeft <= 0) {
      toast("Time expired — submitting your exam.");
      submitExam(true);
    }
  }

  function renderExamRun() {
    var box = document.getElementById("exam-run");
    var html = '<div class="quiz-head">' +
      '<button class="quiz-back" id="exam-back" aria-label="Back to exams">‹</button>' +
      ' <span class="timer-pill">⏱ <b id="exam-timer">' + fmtClock(exam.timeLeft) + "</b></span></div>" +
      '<h2 class="quiz-title">Exam Simulation</h2>' +
      '<div class="exam-bar">' +
      '<div><div class="exam-count" id="exam-count"></div></div>' +
      '<div class="exam-actions">' +
      '<button id="exam-flag-btn" class="btn">Flag</button>' +
      (exam.breakUsed ? "" : '<button id="exam-break-btn" class="btn">Take break</button>') +
      '<button id="exam-submit-btn" class="btn primary">Submit exam</button>' +
      "</div></div>" +
      '<div id="exam-palette" class="exam-palette"></div>' +
      '<div id="exam-qcard"></div>' +
      '<div class="quiz-nav exam-nav"><button id="exam-prev" class="btn">← Prev</button>' +
      '<button id="exam-next" class="btn primary">Next →</button></div>' +
      '<div id="exam-break-overlay" class="break-overlay hidden">' +
      '<div class="break-card"><h3>Break</h3>' +
      '<p class="muted">Your exam timer is paused. Questions are hidden during the break.</p>' +
      '<div class="exam-timer" id="exam-break-timer">' + fmtClock(exam.breakLeft) + "</div>" +
      '<button id="exam-endbreak-btn" class="btn primary">End break early</button></div></div>';
    box.innerHTML = html;
    document.getElementById("exam-back").addEventListener("click", examGoBack);
    document.getElementById("exam-flag-btn").addEventListener("click", examToggleFlag);
    var bb = document.getElementById("exam-break-btn");
    if (bb) bb.addEventListener("click", startBreak);
    document.getElementById("exam-endbreak-btn").addEventListener("click", endBreak);
    document.getElementById("exam-submit-btn").addEventListener("click", function () { examReviewScreen(); });
    document.getElementById("exam-prev").addEventListener("click", function () { examGoto(exam.idx - 1); });
    document.getElementById("exam-next").addEventListener("click", function () { examGoto(exam.idx + 1); });
    renderExamPalette();
    renderExamQuestion();
  }

  function renderExamPalette() {
    var pal = document.getElementById("exam-palette");
    if (!pal || !exam) return;
    var html = "";
    exam.list.forEach(function (q, i) {
      var cls = "pal-btn";
      if (i === exam.idx) cls += " cur";
      if (typeof exam.chosen[q.id] === "number") cls += " ans";
      if (exam.flagged[q.id]) cls += " flag";
      html += '<button class="' + cls + '" data-i="' + i + '" aria-label="Question ' + (i + 1) + '">' + (i + 1) + "</button>";
    });
    pal.innerHTML = html;
    pal.querySelectorAll(".pal-btn").forEach(function (b) {
      b.addEventListener("click", function () { examGoto(parseInt(b.dataset.i, 10)); });
    });
    var cEl = document.getElementById("exam-count");
    if (cEl) cEl.textContent = "Q " + (exam.idx + 1) + " of " + exam.list.length +
      " · " + examAnsweredCount() + " answered · " + examFlaggedCount() + " flagged";
  }

  function renderExamQuestion() {
    var q = exam.list[exam.idx];
    var card = document.getElementById("exam-qcard");
    var letters = "ABCDE";
    var html = '<p class="quiz-progress">Question ' + (exam.idx + 1) + " of " + exam.list.length + "</p>";
    html += '<div class="quiz-badges"><span class="badge badge-topic">' + escapeHtml(q.topic) + "</span>" +
      diffBadge(q.difficulty) + "</div>";
    html += '<p class="question-text">' + inlineMath(q.question) + "</p>";
    html += diagramHtml(q);
    html += '<ul class="choices" id="exam-choices">';
    q.choices.forEach(function (c, i) {
      var cls = (exam.chosen[q.id] === i) ? ' class="sel"' : "";
      html += "<li" + cls + ' data-i="' + i + '"><span class="choice-letter">' + letters[i] +
        '</span><span class="choice-text">' + inlineMath(c) + "</span></li>";
    });
    html += "</ul>";
    card.innerHTML = html;
    card.querySelectorAll("#exam-choices li").forEach(function (li) {
      li.addEventListener("click", function () { examSelectChoice(parseInt(li.dataset.i, 10)); });
    });
    var fb = document.getElementById("exam-flag-btn");
    if (fb) {
      fb.textContent = exam.flagged[q.id] ? "Unflag" : "Flag";
      fb.classList.toggle("flagged", !!exam.flagged[q.id]);
    }
    var prev = document.getElementById("exam-prev");
    if (prev) prev.disabled = exam.idx === 0;
    var next = document.getElementById("exam-next");
    if (next) next.textContent = (exam.idx + 1 === exam.list.length) ? "Review →" : "Next →";
  }

  function examGoto(i) {
    if (!exam || exam.submitted) return;
    if (i < 0 || i >= exam.list.length) return;
    if (i === exam.idx) return;
    exam.idx = i;
    saveExamProgress();
    renderExamPalette();
    renderExamQuestion();
  }

  function examSelectChoice(i) {
    if (!exam || exam.submitted || exam.breakActive) return;
    var q = exam.list[exam.idx];
    exam.chosen[q.id] = i;
    saveExamProgress();
    renderExamPalette();
    renderExamQuestion();
  }

  function examToggleFlag() {
    if (!exam || exam.submitted) return;
    var q = exam.list[exam.idx];
    if (exam.flagged[q.id]) delete exam.flagged[q.id];
    else exam.flagged[q.id] = 1;
    saveExamProgress();
    renderExamPalette();
    renderExamQuestion();
  }

  // ---- scheduled break -------------------------------------------------------
  function startBreak() {
    if (!exam || exam.submitted || exam.breakUsed || exam.breakActive) return;
    exam.breakActive = true;
    exam.breakUsed = true;
    exam.breakLeft = EXAM_BREAK_SECS;
    var bEl = document.getElementById("exam-break-timer");
    if (bEl) bEl.textContent = fmtClock(exam.breakLeft);
    document.getElementById("exam-break-overlay").classList.remove("hidden");
    var bb = document.getElementById("exam-break-btn");
    if (bb) bb.style.display = "none";
    saveExamProgress();
  }

  function endBreak() {
    if (!exam || !exam.breakActive) return;
    exam.breakActive = false;
    document.getElementById("exam-break-overlay").classList.add("hidden");
    saveExamProgress();
    toast("Break over — timer resumed.");
  }

  // ---- review + submit -------------------------------------------------------
  function examReviewScreen() {
    if (!exam || exam.submitted) return;
    pauseExamTimer();
    var box = document.getElementById("exam-review");
    var flagged = [], unanswered = [];
    exam.list.forEach(function (q, i) {
      if (exam.flagged[q.id]) flagged.push(i);
      if (typeof exam.chosen[q.id] !== "number") unanswered.push(i);
    });
    function rowList(arr, label) {
      if (!arr.length) return '<p class="muted">None.</p>';
      return '<div class="review-list">' + arr.map(function (i) {
        var q = exam.list[i];
        return '<div class="review-row"><span><strong>Q' + (i + 1) + "</strong> · " +
          escapeHtml(q.topic) + (label === "unanswered" ? ' <span class="unans">unanswered</span>' : " flagged") +
          '</span><button class="btn text" data-i="' + i + '">Go to →</button></div>';
      }).join("") + "</div>";
    }
    var html = "<h3>Review before submitting</h3>" +
      '<p class="lede">' + examAnsweredCount() + " of " + exam.list.length + " answered · " +
      flagged.length + " flagged · " + fmtClock(exam.timeLeft) + " left on the clock.</p>" +
      "<h4>Flagged for review</h4>" + rowList(flagged, "flagged") +
      "<h4>Unanswered</h4>" + rowList(unanswered, "unanswered") +
      '<div class="quiz-nav"><button id="exam-back-btn" class="btn">Back to exam</button> ' +
      '<button id="exam-confirm-btn" class="btn primary">Submit exam</button></div>' +
      '<p class="disclaimer" id="exam-confirm-note" style="display:none">This grades your exam and ends the simulation. ' +
      '<button id="exam-confirm-yes" class="btn primary">Yes, submit</button></p>';
    box.innerHTML = html;
    box.querySelectorAll(".review-row .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        showExamScreen("exam-run");
        renderExamRun();
        startExamTimer();
        examGoto(parseInt(b.dataset.i, 10));
      });
    });
    document.getElementById("exam-back-btn").addEventListener("click", function () {
      showExamScreen("exam-run");
      renderExamRun();
      startExamTimer();
    });
    document.getElementById("exam-confirm-btn").addEventListener("click", function () {
      document.getElementById("exam-confirm-note").style.display = "block";
      this.style.display = "none";
    });
    document.getElementById("exam-confirm-yes").addEventListener("click", function () { submitExam(false); });
    showExamScreen("exam-review");
  }

  function submitExam(auto) {
    if (!exam || exam.submitted) return;
    if (exam.tick) { clearInterval(exam.tick); exam.tick = null; }
    exam.submitted = true;
    var timeUsed = EXAM_SECS - Math.max(0, exam.timeLeft);
    var correct = 0;
    var topicToArea = {};
    EXAM_AREAS.forEach(function (a, i) {
      a.topics.forEach(function (t) { topicToArea[t] = i; });
    });
    var perArea = EXAM_AREAS.map(function (a) {
      return { area: a.area, items: a.n, correct: 0, total: 0 };
    });
    var pretest = exam.pretest || {};
    var attempts = store.get("attempts", []);
    var now = Date.now();
    exam.list.forEach(function (q) {
      var isPretest = !!pretest[q.id];
      var ai = topicToArea[q.topic];
      // Pretest-style questions are never scored — like the real exam —
      // but attempts still feed practice analytics.
      if (!isPretest && typeof ai === "number") perArea[ai].total++;
      var chosen = exam.chosen[q.id];
      if (typeof chosen === "number") {
        var ok = chosen === q.answerIndex;
        if (!isPretest && ok) { correct++; if (typeof ai === "number") perArea[ai].correct++; }
        attempts.push({ qid: q.id, topic: q.topic, correct: ok, ts: now });
      }
    });
    store.set("attempts", attempts.slice(-2000));
    bumpStreak();
    var scoredTotal = exam.list.filter(function (q) { return !pretest[q.id]; }).length;
    var rec = {
      ts: now,
      score: correct,
      total: scoredTotal,
      pct: scoredTotal ? Math.round(100 * correct / scoredTotal) : 0,
      pretestN: exam.list.length - scoredTotal,
      timeSecs: Math.round(timeUsed),
      perArea: perArea,
      qids: exam.list.map(function (q) { return q.id; }),
      answers: exam.list.map(function (q) {
        return (typeof exam.chosen[q.id] === "number") ? exam.chosen[q.id] : -1;
      })
    };
    var sims = store.get("examSims", []);
    sims.unshift(rec);
    store.set("examSims", sims.slice(0, 20));
    clearExamResume();
    renderExamResult(rec);
  }

  // ---- results ---------------------------------------------------------------
  // NCEES-style diagnostic: per-knowledge-area table mirroring the official
  // score report. NCEES never publishes a passing score, so we don't invent
  // one — and the 0–15 column is a transparent linear map of % correct,
  // labeled as the unofficial estimate it is.
  function renderExamResult(rec) {
    var box = document.getElementById("exam-result");
    var perArea = rec.perArea || [];
    var html = "<h3>Exam diagnostic</h3>" +
      '<p class="result-score">' + rec.score + "/" + rec.total +
      " <span>(" + rec.pct + "% of scored questions)</span></p>" +
      '<p class="time-summary">⏱ Time used: ' + fmtClock(rec.timeSecs) + " of " + fmtClock(EXAM_SECS) + "</p>" +
      (rec.pretestN ? '<p class="muted">110 questions · 100 scored · ' + rec.pretestN +
        " pretest-style excluded from scoring, like the real exam.</p>" : "") +
      '<table class="diag-table"><thead><tr><th>Knowledge area</th>' +
      "<th>Items</th><th>Correct</th><th>%</th><th>0–15*</th></tr></thead><tbody>";
    perArea.forEach(function (p) {
      var pct = p.total ? Math.round(100 * p.correct / p.total) : 0;
      var scaled = p.total ? (15 * p.correct / p.total).toFixed(1) : "0.0";
      html += "<tr><td>" + escapeHtml(p.area) + "</td><td>" + p.total +
        "</td><td>" + p.correct + '</td><td class="' + scoreClass(pct) + '">' + pct +
        "%</td><td>" + scaled + "</td></tr>";
    });
    html += "</tbody></table>" +
      '<p class="disclaimer">* NCEES reports each area on a 0–15 scale but publishes neither the formula nor a passing score. ' +
      "This column maps your % correct linearly — an unofficial practice estimate, not a pass/fail prediction. " +
      EXAM_NOTE + "</p>" +
      '<div class="quiz-nav"><button id="exam-review-answers" class="btn primary">Review answers</button> ' +
      '<button id="exam-again" class="btn">New simulation</button> ' +
      '<a class="btn" href="#/practice">Back to practice</a></div>' +
      '<div id="exam-answer-review"></div>';
    box.innerHTML = html;
    document.getElementById("exam-again").addEventListener("click", function () {
      exam = null;
      renderExamSetup();
      showExamScreen("exam-setup");
    });
    document.getElementById("exam-review-answers").addEventListener("click", function () {
      renderExamAnswerReview(rec);
      this.style.display = "none";
    });
    showExamScreen("exam-result");
  }

  // Expandable per-question review: KaTeX renders only when a row opens.
  function renderExamAnswerReview(rec) {
    var host = document.getElementById("exam-answer-review");
    var html = "<h4>Answer review</h4>" + '<div class="review-list">';
    rec.qids.forEach(function (qid, i) {
      var q = findQuestion(qid);
      if (!q) return;
      var chosen = rec.answers[i];
      var mark = chosen === -1 ? '<span class="unans">unanswered</span>'
        : (chosen === q.answerIndex ? '<span class="good">✓ correct</span>' : '<span class="bad">✗ wrong</span>');
      html += '<div class="review-row"><span><strong>Q' + (i + 1) + "</strong> · " +
        escapeHtml(q.topic) + " · " + mark + '</span>' +
        '<button class="btn text" data-i="' + i + '">View</button></div>' +
        '<div class="review-detail hidden" id="exam-rev-' + i + '"></div>';
    });
    html += "</div>";
    host.innerHTML = html;
    host.querySelectorAll(".review-row .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = parseInt(b.dataset.i, 10);
        var det = document.getElementById("exam-rev-" + i);
        if (!det.classList.contains("hidden")) { det.classList.add("hidden"); return; }
        var q = findQuestion(rec.qids[i]);
        var chosen = rec.answers[i];
        var dh = '<p class="question-text">' + inlineMath(q.question) + "</p>" + diagramHtml(q) +
          '<ul class="choices">';
        q.choices.forEach(function (c, ci) {
          var style = "";
          if (ci === q.answerIndex) style = ' style="border-color:#34C759;background:#e9f9ee"';
          else if (ci === chosen) style = ' style="border-color:#FF3B30;background:#fdeceb"';
          dh += "<li" + style + ">" + inlineMath(c) + "</li>";
        });
        dh += "</ul>" +
          '<div class="explain-body">' + linkifyCitations(renderRich(q.solution)) + "</div>" +
          (q.explanation ? '<div class="explain-body">' + renderRich(q.explanation) + "</div>" : "") +
          videoLinkHtml(q);
        det.innerHTML = dh;
        det.classList.remove("hidden");
      });
    });
  }

  // Save the exam clock when the tab hides so a reload keeps honest time.
  window.addEventListener("pagehide", function () { if (exam && exam.tick) saveExamProgress(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && exam && exam.tick) saveExamProgress();
  });

  // One completed quiz = one logged session (score, scope, missed question ids).
  function recordSession() {
    if (!quiz || !quiz.answers.length || quiz.portable) return;
    var missed = [];
    quiz.answers.forEach(function (a) {
      if (!a.correct) missed.push(a.qid);
    });
    var sessions = store.get("sessions", []);
    sessions.push({
      ts: Date.now(),
      correct: quiz.correct,
      total: quiz.list.length,
      pct: Math.round(100 * quiz.correct / quiz.list.length),
      scope: quiz.topic,
      missed: missed,
      totalSecs: quiz.totalSecs || 0,
      solvingSecs: quiz.solvingSecs || 0,
      avgSecs: quiz.avgSecs || 0
    });
    store.set("sessions", sessions.slice(-100));
  }

  function statCard(label, pct) {
    var c = scoreClass(pct);
    return '<div class="stat-card ' + c + '"><div class="k">' + label + "</div>" +
      '<div class="v ' + c + '">' + pct + "%</div></div>";
  }

  function catRows(list) {
    return list.map(function (s) {
      return '<div class="cat-row"><span>' + escapeHtml(s.topic) + "</span>" +
        '<span class="pct ' + scoreClass(s.pct) + '">' + s.pct + "%</span></div>";
    }).join("");
  }

  function renderStudyList(ids) {
    var known = ids.map(findQuestion).filter(Boolean);
    if (!known.length) {
      return '<div class="card"><p class="muted">Nothing to review — no missed questions on record.</p></div>';
    }
    return known.map(function (q) {
      return '<div class="card study-item"><div class="formula-topic">' +
        escapeHtml(q.topic) + '</div><p class="question-text">' +
        inlineMath(q.question) + '</p>' + diagramHtml(q) +
        '<p class="answer-line"><strong>Correct answer:</strong> ' +
        inlineMath(q.choices[q.answerIndex]) + '</p><div class="explain-body">' +
        renderRich(q.solution) + "</div>" + videoLinkHtml(q) + "</div></div>";
    }).join("");
  }

  function renderAnalytics() {
    var body = document.getElementById("analytics-body");
    loadQuestions(function () {
      var sessions = store.get("sessions", []);
      var attempts = store.get("attempts", []);
      if (!sessions.length && !attempts.length) {
        body.innerHTML = '<div class="card"><p>No answers logged yet. Take a practice quiz and your stats will appear here.</p></div>';
        return;
      }
      var html = "";

      // 1. Quiz results bar chart
      html += '<div class="card"><h3>Quiz Results</h3>';
      if (sessions.length) {
        html += '<div class="chart">';
        sessions.forEach(function (s, i) {
          html += '<div class="cbar-wrap"><span class="cbar-val">' + s.pct + "</span>" +
            '<div class="cbar ' + scoreClass(s.pct) + '" style="height:' +
            Math.max(s.pct, 3) + '%"></div>' +
            '<span class="cbar-x">' + (i + 1) + "</span></div>";
        });
        html += '</div><p class="disclaimer" style="margin-top:10px">Oldest on the left · ' +
          sessions.length + (sessions.length === 1 ? " quiz" : " quizzes") + " logged</p>";
      } else {
        html += '<p class="muted">Finish a full practice quiz to log your first result.</p>';
      }
      html += "</div>";

      // 2. Best / average / latest
      if (sessions.length) {
        var pcts = sessions.map(function (s) { return s.pct; });
        var best = Math.max.apply(null, pcts);
        var avg = Math.round(pcts.reduce(function (a, b) { return a + b; }, 0) / pcts.length);
        html += '<div class="stat-cards">' +
          statCard("Best", best) +
          statCard("Average", avg) +
          statCard("Latest", pcts[pcts.length - 1]) +
          "</div>";
      }

      // 3. Study list — missed questions, tap to review with solutions
      var seen = {};
      var missedIds = [];
      sessions.slice(-20).forEach(function (s) {
        (s.missed || []).forEach(function (id) {
          if (!seen[id]) { seen[id] = 1; missedIds.push(id); }
        });
      });
      html += '<button class="list-btn" id="study-toggle">Study List: ' + missedIds.length +
        " Question" + (missedIds.length === 1 ? "" : "s") + "</button>";
      html += '<div id="study-list" class="hidden"></div>';

      // 4. Topic mastery — one meter per topic, all 15 in curriculum order
      var mastery = topicMastery();
      var overall = Math.round(mastery.reduce(function (a, m) { return a + m.mastery; }, 0) / mastery.length);
      html += '<div class="card"><h3>Topic Mastery</h3>';
      html += '<p class="disclaimer" style="margin-top:-4px;margin-bottom:14px">Overall mastery ' + overall +
        "% — meters fill with accuracy and practice (about 10 answered questions per topic for full confidence).</p>";
      mastery.forEach(function (m) {
        var cls = m.n ? scoreClass(m.mastery) : "";
        var sub = m.n ? m.n + " · " + m.pct + "%" : "0";
        html += '<div class="topic-row"><span class="topic-name">' + escapeHtml(m.topic) +
          " <small>(" + sub + ")</small></span>" +
          '<span class="bar"><span class="fill ' + cls +
          '" style="width:' + m.mastery + '%"></span></span>' +
          '<span class="mastery-level ' + cls + '">' + m.level + "</span></div>";
      });
      html += "</div>";

      // 5. Best categories / categories to focus on
      var ranked = topicStats(3);
      if (ranked.length) {
        var best3 = ranked.slice().sort(function (a, b) { return b.pct - a.pct; }).slice(0, 3);
        var worst3 = ranked.slice().sort(function (a, b) { return a.pct - b.pct; }).slice(0, 3);
        html += '<div class="card"><h3>Best Categories</h3>' + catRows(best3) + "</div>";
        html += '<div class="card"><h3>Categories to Focus On</h3>' + catRows(worst3) + "</div>";
      }

      // 6. Skills to focus on — per-question accuracy with drill buttons.
      // Bank attempts and randomized variants merge on the shared baseId,
      // so this names the specific skill (not just the chapter).
      var weakSkills = skillStats(3).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 5);
      html += '<div class="card"><h3>Skills to Focus On</h3>';
      if (!weakSkills.length) {
        html += '<p class="muted">Answer a few questions and your weakest specific skills will appear here, each with a Drill button.</p>';
      } else {
        html += '<p class="disclaimer" style="margin-top:-4px;margin-bottom:14px">Your weakest specific skills — tap Drill to practice one with fresh numbers.</p>';
        weakSkills.forEach(function (s) {
          html += '<div class="cat-row"><span>' + escapeHtml(s.subtopic) +
            " <small>(" + escapeHtml(s.topic) + " · " + s.n + ")</small></span><span>" +
            '<span class="pct ' + scoreClass(s.pct) + '">' + s.pct + "%</span>";
          if (s.drillable) {
            html += ' <button class="btn drill-btn" data-baseid="' + escapeHtml(s.key) + '">Drill</button>';
          }
          html += "</span></div>";
        });
      }
      html += "</div>";

      body.innerHTML = html;

      var toggle = document.getElementById("study-toggle");
      if (toggle) {
        toggle.addEventListener("click", function () {
          var list = document.getElementById("study-list");
          if (!list.dataset.done) {
            list.dataset.done = "1";
            list.innerHTML = renderStudyList(missedIds);
          }
          list.classList.toggle("hidden");
          var label = list.classList.contains("hidden") ? "Study List: " : "Hide Study List: ";
          toggle.textContent = label + missedIds.length +
            " Question" + (missedIds.length === 1 ? "" : "s");
        });
      }

      // Drill buttons: start a randomized session pinned to one generator.
      body.querySelectorAll(".drill-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var gen = findGeneratorByBaseId(btn.dataset.baseid);
          if (!gen) {
            toast("That skill's generator didn't load — check your connection and try again.");
            return;
          }
          startRandomizedQuiz(gen);
        });
      });
    });
  }

  // ---- formula library ---------------------------------------------------
  var FORMULAS = [];
  var formulaTopic = "";
  function loadFormulas(cb) {
    if (FORMULAS.length) { cb(FORMULAS); return; }
    fetch("data/formulas.json")
      .then(function (r) { return r.json(); })
      .then(function (d) { FORMULAS = d.formulas || []; cb(FORMULAS); })
      .catch(function () { cb([]); });
  }

  function initFormulas() {
    loadFormulas(function (fs) {
      var wrap = document.getElementById("formula-filters");
      if (wrap && !wrap.dataset.bound) {
        wrap.dataset.bound = "1";
        var all = document.createElement("button");
        all.className = "chip selected"; all.textContent = "All"; all.dataset.t = "";
        all.addEventListener("click", function () { setFormulaTopic(""); });
        wrap.appendChild(all);
        TOPICS.forEach(function (t) {
          if (!fs.some(function (f) { return f.topic === t; })) return;
          var b = document.createElement("button");
          b.className = "chip"; b.textContent = t; b.dataset.t = t;
          b.addEventListener("click", function () { setFormulaTopic(t); });
          wrap.appendChild(b);
        });
      }
      var search = document.getElementById("formula-search");
      if (search && !search.dataset.bound) {
        search.dataset.bound = "1";
        search.addEventListener("input", renderFormulas);
      }
      renderFormulas();
    });
  }

  function setFormulaTopic(t) {
    formulaTopic = t;
    document.querySelectorAll("#formula-filters .chip").forEach(function (c) {
      c.classList.toggle("selected", c.dataset.t === t);
    });
    renderFormulas();
  }

  // ---- formula library: Unicode -> LaTeX ----------------------------------
  // data/formulas.json stores formulas as plain Unicode text (p1/gamma,
  // V1^2/2g, sqrt(...), ...). formulaToTex converts one such string to LaTeX
  // so the Formulas page renders through the same KaTeX path as quiz cards
  // (texHtml). Returns null for text-only entries (no math characters),
  // which render as plain text instead.
  var FORMULA_SUB = { "₀": "0", "₁": "1", "₂": "2", "₋": "-", "ᵢ": "i" };
  var FORMULA_SUP = { "²": "2", "³": "3", "⁴": "4", "⁻": "-", "ⁿ": "n", "ᵏ": "k", "ᵐ": "m" };
  var FORMULA_GREEK = {
    "γ": "\\gamma", "δ": "\\delta", "ε": "\\epsilon", "μ": "\\mu",
    "ν": "\\nu", "π": "\\pi", "ρ": "\\rho", "σ": "\\sigma",
    "τ": "\\tau", "φ": "\\phi", "Δ": "\\Delta", "Σ": "\\Sigma"
  };
  var FORMULA_SYM = {
    "±": "\\pm", "·": "\\cdot", "½": "\\frac{1}{2}", "≈": "\\approx",
    "→": "\\to", "−": "-", "′": "'", "ȳ": "\\bar{y}"
  };

  function formulaToTex(src) {
    var s = String(src);
    if (!/[0-9²³⁴ⁿᵏᵐᵢ₀₁₂√±·½ΔΣγδεμνπρστφ^_\\⁻₋=]/.test(s)) return null;
    return formulaToTexInner(s);
  }

  // Append a space after a control word when the next char is a letter,
  // so e.g. \gamma followed by D doesn't become the undefined \gammaD.
  function formulaCmdSpace(next) {
    return next && /[A-Za-z]/.test(next) ? " " : "";
  }

  function formulaToTexInner(s) {
    // combining macron (x + U+0304) -> \bar{x}; runs before char mapping
    s = s.replace(/([A-Za-z])\u0304/g, "\\bar{$1}");
    s = formulaSqrt(s);
    // binomial coefficient notation used by the probability formulas
    s = s.replace(/C\(n,k\)/g, "\\binom{n}{k}");
    var out = "", i = 0;
    while (i < s.length) {
      var c = s[i];
      if (FORMULA_SUB[c]) {
        var sub = "";
        while (i < s.length && FORMULA_SUB[s[i]]) { sub += FORMULA_SUB[s[i]]; i++; }
        out += "_{" + sub + "}";
        continue;
      }
      if (FORMULA_SUP[c]) {
        var sup = "";
        while (i < s.length && FORMULA_SUP[s[i]]) { sup += FORMULA_SUP[s[i]]; i++; }
        out += "^{" + sup + "}";
        continue;
      }
      if (FORMULA_GREEK[c]) { out += FORMULA_GREEK[c] + formulaCmdSpace(s[i + 1]); i++; continue; }
      if (FORMULA_SYM[c]) {
        var sym = FORMULA_SYM[c];
        // control words need a terminator before a following letter
        if (/^\\[a-z]+$/.test(sym)) sym += formulaCmdSpace(s[i + 1]);
        out += sym; i++; continue;
      }
      if (c === "^") {
        // already-formed ^{...} (from the \sqrt recursion above): pass through
        if (s[i + 1] === "{") { out += c; i++; continue; }
        // caret groups: R^(2/3) -> R^{2/3} (matching paren becomes the brace)
        i++;
        if (s[i] === "(") {
          var depth = 0, k = i, ok = false;
          for (; k < s.length; k++) {
            if (s[k] === "(") depth++;
            else if (s[k] === ")") { depth--; if (depth === 0) { ok = true; break; } }
          }
          if (ok) { out += "^{" + s.slice(i + 1, k) + "}"; i = k + 1; }
          else { out += "^{}"; }
        } else {
          out += "^{" + (s[i] || "") + "}";
          i++;
        }
        continue;
      }
      out += c; i++;
    }
    s = out;
    // multi-letter lowercase subscripts: i_eff -> i_{eff}, D_f -> D_{f}
    // (single chars like h_L are already fine for KaTeX as-is)
    s = s.replace(/_([a-z][a-z,]*)/g, "_{$1}");
    // trig function names
    s = s.replace(/\bsin\b/g, "\\sin").replace(/\bcos\b/g, "\\cos");
    // divisions -> \frac{}{} where the operands look like math
    s = formulaFrac(s);
    return s;
  }

  // √( ... ) / √[ ... ] -> \sqrt{...}, inner content converted recursively
  function formulaSqrt(s) {
    var out = "", i = 0;
    while (i < s.length) {
      var idx = s.indexOf("√", i);
      if (idx === -1) { out += s.slice(i); break; }
      out += s.slice(i, idx);
      var j = idx + 1;
      while (j < s.length && s[j] === " ") j++;
      var open = s[j], close = open === "(" ? ")" : (open === "[" ? "]" : null);
      if (!close) { out += "\\sqrt{}"; i = j; continue; }
      var depth = 0, k = j, found = false;
      for (; k < s.length; k++) {
        if (s[k] === open) depth++;
        else if (s[k] === close) { depth--; if (depth === 0) { found = true; break; } }
      }
      if (!found) { out += s.slice(idx); break; }
      out += "\\sqrt{" + formulaToTexInner(s.slice(j + 1, k)) + "}";
      i = k + 1;
    }
    return out;
  }

  // Turn a/b divisions into \frac{a}{b}, recursing into balanced bracketed
  // groups first so inner divisions convert too. A division is only
  // converted when an operand looks like math (has a digit, backslash,
  // underscore, caret, or is an ALL-CAPS token), so plain text like
  // "client/employer" is left alone.
  function formulaFrac(s) {
    var out = "", i = 0;
    while (i < s.length) {
      var c = s[i];
      if (c === "(" || c === "[" || c === "{") {
        var close = c === "(" ? ")" : (c === "[" ? "]" : "}");
        var depth = 0, k = i, ok = false;
        for (; k < s.length; k++) {
          if (s[k] === c) depth++;
          else if (s[k] === close) { depth--; if (depth === 0) { ok = true; break; } }
        }
        if (!ok) { out += s.slice(i); break; }
        out += c + formulaFrac(s.slice(i + 1, k)) + close;
        i = k + 1;
      } else {
        out += c; i++;
      }
    }
    return formulaFracTop(out);
  }

  function formulaFracTop(s) {
    var parts = [], depth = 0, cur = "";
    for (var k = 0; k < s.length; k++) {
      var c = s[k];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      if (c === "/" && depth === 0) { parts.push(cur); cur = ""; }
      else cur += c;
    }
    parts.push(cur);
    if (parts.length < 2) return s;
    var acc = parts[0];
    for (var j = 1; j < parts.length; j++) acc = formulaCombineFrac(acc, parts[j]);
    return acc;
  }

  function formulaCombineFrac(left, right) {
    var L = formulaLeftOperand(left), R = formulaRightOperand(right);
    if (!formulaFracGuard(L.tail, R.head)) return left + "/" + right;
    return L.head + "\\frac{" + formulaStripOuter(L.tail) + "}{" +
      formulaStripOuter(R.head) + "}" + R.tail;
  }

  function formulaFracGuard(a, b) {
    if (/[0-9\\_^]/.test(a) || /[0-9\\_^]/.test(b)) return true;
    return /^[A-Z]+$/.test(a.trim()) || /^[A-Z]+$/.test(b.trim());
  }

  function formulaLeftOperand(s) {
    var depth = 0, k = s.length;
    while (k > 0 && s[k - 1] === " ") k--;
    var end = k;
    while (k > 0) {
      var c = s[k - 1];
      if (c === ")" || c === "]" || c === "}") depth++;
      else if (c === "(" || c === "[" || c === "{") {
        if (depth === 0) break;
        depth--;
      }
      else if (depth === 0 && (c === "=" || c === "+" || c === "-" || c === "," || c === ";")) break;
      k--;
    }
    return { head: s.slice(0, k), tail: s.slice(k, end).replace(/^\s+/, "") };
  }

  function formulaRightOperand(s) {
    var depth = 0, k = 0, n = s.length;
    while (k < n && s[k] === " ") k++;
    var start = k;
    while (k < n) {
      var c = s[k];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") {
        if (depth === 0) break;
        depth--;
      }
      else if (depth === 0 && (c === "=" || c === "+" || c === "-" || c === "," || c === ";")) break;
      k++;
    }
    return { head: s.slice(start, k), tail: s.slice(k) };
  }

  function formulaStripOuter(s) {
    s = s.trim();
    var pairs = { "(": ")", "[": "]" };
    var close = pairs[s[0]];
    if (!close || s[s.length - 1] !== close) return s;
    var depth = 0;
    for (var k = 0; k < s.length; k++) {
      if (s[k] === s[0]) depth++;
      else if (s[k] === close) {
        depth--;
        if (depth === 0) return k === s.length - 1 ? s.slice(1, -1) : s;
      }
    }
    return s;
  }

  function formulaExprHtml(formula) {
    var tex = formulaToTex(formula);
    if (tex === null) {
      return '<p class="formula-expr formula-text">' + escapeHtml(formula) + "</p>";
    }
    return '<div class="formula-expr">' + texHtml(tex, true) + "</div>";
  }

  function formulaSymbolsHtml(symbols) {
    if (!symbols) return "";
    var items = String(symbols).split(";").map(function (chunk) {
      var idx = chunk.indexOf("=");
      if (idx === -1) return escapeHtml(chunk.trim());
      var sym = chunk.slice(0, idx).trim(), meaning = chunk.slice(idx + 1).trim();
      var tex = formulaToTex(sym);
      var symHtml = tex === null ? escapeHtml(sym) : texHtml(tex, false);
      return '<span class="formula-sym">' + symHtml + "</span> = " + escapeHtml(meaning);
    });
    return '<p class="formula-symbols">' + items.join("; ") + "</p>";
  }

  function renderFormulas() {
    var list = document.getElementById("formula-list");
    if (!list) return;
    var q = (document.getElementById("formula-search").value || "").toLowerCase();
    var fs = FORMULAS.filter(function (f) {
      if (formulaTopic && f.topic !== formulaTopic) return false;
      if (!q) return true;
      return (f.name + " " + f.formula + " " + (f.symbols || "") + " " +
        (f.notes || "")).toLowerCase().indexOf(q) !== -1;
    });
    if (!fs.length) {
      list.innerHTML = '<div class="card"><p>No formulas match.</p></div>';
      return;
    }
    list.innerHTML = fs.map(function (f) {
      return '<div class="card formula-card"><div class="formula-topic">' +
        escapeHtml(f.topic) + '</div><h3>' + escapeHtml(f.name) + "</h3>" +
        formulaExprHtml(f.formula) +
        formulaSymbolsHtml(f.symbols) +
        (f.notes ? '<p class="formula-notes">' + escapeHtml(f.notes) + "</p>" : "") +
        "</div>";
    }).join("");
  }

  // Citation deep-links: "Refer to the <section> section in the <chapter>
  // chapter" becomes a link into #/reference when data/citation-links.json
  // maps that exact section name to equation ids. Never guess a link.
  function linkifyCitations(html) {
    if (!CITATION_LINKS) return html;
    return html.replace(/Refer to the (.+?) section in the (.+?) chapter/g,
      function (match, section) {
        var ids = CITATION_LINKS[section];
        if (ids && ids.length) {
          return '<a href="#/reference#' + eqAnchorId(ids[0]) + '">' + match + "</a>";
        }
        return match;
      });
  }

  // ---- reference (handbook equations) ------------------------------------
  // data/equations.json: array of {id, chapter, section, title, equation,
  // symbols, explanation, example}. data/citation-links.json:
  // {"<section name>": ["<eq id>", ...]}. Both are optional — the view
  // shows "Reference loading…", then a graceful note if they are missing.
  // The router never crashes on this view.
  var EQUATIONS = null; // null = not fetched yet
  function loadEquations(cb) {
    if (EQUATIONS !== null) { cb(EQUATIONS); return; }
    fetch("data/equations.json")
      .then(function (r) { if (!r.ok) throw new Error("missing"); return r.json(); })
      .then(function (d) {
        EQUATIONS = Array.isArray(d) ? d : (d.equations || []);
        cb(EQUATIONS);
      })
      .catch(function () { EQUATIONS = []; cb([]); });
  }

  var CITATION_LINKS = null; // null = not fetched yet; {} = missing/failed
  function loadCitationLinks(cb) {
    if (CITATION_LINKS !== null) { if (cb) cb(CITATION_LINKS); return; }
    fetch("data/citation-links.json")
      .then(function (r) { if (!r.ok) throw new Error("missing"); return r.json(); })
      .then(function (d) { CITATION_LINKS = d || {}; if (cb) cb(CITATION_LINKS); })
      .catch(function () { CITATION_LINKS = {}; if (cb) cb(CITATION_LINKS); });
  }

  function initReference(done) {
    var search = document.getElementById("ref-search");
    if (search && !search.dataset.bound) {
      search.dataset.bound = "1";
      search.addEventListener("input", function () { renderReference(); });
    }
    loadChapters(function () {
      loadEquations(function () {
        renderReference();
        if (done) done();
      });
    });
  }

  // Equation ids in the data files may or may not carry the "eq-" prefix;
  // anchors are always exactly "eq-<rest>".
  function eqAnchorId(raw) {
    var id = String(raw);
    return id.indexOf("eq-") === 0 ? id : "eq-" + id;
  }

  function refSymbolHay(e) {
    if (!e.symbols) return "";
    if (typeof e.symbols === "string") return e.symbols;
    if (Array.isArray(e.symbols)) {
      return e.symbols.map(function (s) {
        return typeof s === "string"
          ? s
          : ((s.symbol || "") + " " + (s.meaning || s.definition || ""));
      }).join(" ");
    }
    // object map: { "symbol": "meaning", ... }
    return Object.keys(e.symbols).map(function (k) {
      return k + " " + e.symbols[k];
    }).join(" ");
  }

  // Symbol names render as inline KaTeX math; plain multi-letter words
  // (e.g. "Float", "theta") stay as regular text.
  function symNameHtml(s) {
    var t = String(s);
    if (/^[A-Za-z]{2,}$/.test(t)) return escapeHtml(t);
    return texHtml(t, false);
  }

  function refSymbolsHtml(e) {
    if (!e.symbols) return "";
    if (typeof e.symbols === "string") {
      return '<p class="formula-symbols">' + escapeHtml(e.symbols) + "</p>";
    }
    var items = [];
    if (Array.isArray(e.symbols)) {
      e.symbols.forEach(function (s) {
        if (typeof s === "string") {
          items.push("<li>" + escapeHtml(s) + "</li>");
        } else {
          items.push("<li><strong>" + symNameHtml(s.symbol || "") + "</strong> &mdash; " +
            escapeHtml(s.meaning || s.definition || "") + "</li>");
        }
      });
    } else {
      Object.keys(e.symbols).forEach(function (k) {
        items.push("<li><strong>" + symNameHtml(k) + "</strong> &mdash; " +
          escapeHtml(e.symbols[k]) + "</li>");
      });
    }
    if (!items.length) return "";
    return '<ul class="ref-symbols">' + items.join("") + "</ul>";
  }

  function refCardHtml(e, ch) {
    var html = '<div class="card eq-card" id="' + escapeHtml(eqAnchorId(e.id)) + '">';
    html += '<div class="formula-topic">' + escapeHtml(ch.title) + "</div>";
    html += "<h3>" + escapeHtml(e.title || "") + "</h3>";
    if (e.equation) {
      html += '<div class="math-display">' + displayMath(e.equation) + "</div>";
    }
    html += refSymbolsHtml(e);
    html += '<p class="ref-source">FE Reference Handbook 10.6' +
      (e.section ? ", " + escapeHtml(e.section) : "") +
      ", p. " + (e.page || ch.printedPage) + "</p>";
    if (e.explanation) {
      html += '<div class="explain-body">' + renderRich(e.explanation) + "</div>";
    }
    if (e.example) {
      html += '<details class="card"><summary>Worked example</summary><div>' +
        renderRich(e.example) + "</div></details>";
    }
    html += "</div>";
    return html;
  }

  function renderReference() {
    var list = document.getElementById("ref-list");
    if (!list) return;
    if (EQUATIONS === null) {
      list.innerHTML = '<p class="muted">Reference loading…</p>';
      return;
    }
    if (!EQUATIONS.length) {
      list.innerHTML = '<div class="card"><p class="muted">' +
        "Reference data is not available yet — check back soon." +
        "</p></div>";
      return;
    }
    var searchEl = document.getElementById("ref-search");
    var q = searchEl ? (searchEl.value || "").toLowerCase() : "";
    var html = "";
    (CHAPTERS || []).forEach(function (ch) {
      var entries = EQUATIONS.filter(function (e) { return e.chapter === ch.id; });
      if (q) {
        entries = entries.filter(function (e) {
          var hay = ((e.title || "") + " " + (e.section || "") + " " +
            ch.title + " " + refSymbolHay(e) + " " + (e.equation || ""));
          return hay.toLowerCase().indexOf(q) !== -1;
        });
      }
      if (!entries.length) return;
      html += '<h3 class="ref-chapter">' + escapeHtml(ch.title) + "</h3>";
      entries.forEach(function (e) { html += refCardHtml(e, ch); });
    });
    if (!html) {
      list.innerHTML = '<div class="card"><p class="muted">' +
        "No reference entries match your search." + "</p></div>";
      return;
    }
    list.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Rich text for solutions/explanations.
  // Convention: \(...\) = inline math, $$...$$ on its own line(s) = display math.
  // Rendered with KaTeX when available; falls back to monospace otherwise.
  // Plain $ is never math (engineering economics has dollar amounts).
  function texHtml(tex, display) {
    try {
      if (window.katex) {
        return katex.renderToString(tex, { displayMode: display, throwOnError: false });
      }
    } catch (e) { /* fall through to fallback */ }
    return "<code>" + escapeHtml(tex) + "</code>";
  }

  // Inline math for question stems and choices: \(...\) renders via KaTeX,
  // everything else is HTML-escaped plain text. Plain $ is never math.
  function inlineMath(s) {
    return String(s).split(/(\\\([\s\S]+?\\\))/g).map(function (part) {
      var m = part.match(/^\\\(([\s\S]+?)\\\)$/);
      return m ? texHtml(m[1], false) : escapeHtml(part);
    }).join("");
  }

  // Display math for reference equation cards: each \(...\) segment renders
  // via KaTeX in display mode (the equation strings carry their delimiters).
  function displayMath(s) {
    return String(s).split(/(\\\([\s\S]+?\\\))/g).map(function (part) {
      var m = part.match(/^\\\(([\s\S]+?)\\\)$/);
      return m ? texHtml(m[1], true) : escapeHtml(part);
    }).join("");
  }

  // ---- flashcards ----------------------------------------------------------
  var fcDeck = [], fcIndex = 0, fcTopic = "";
  var fcRatings = store.get("fcRatings", {}); // question id -> "know" | "learning"

  function initFlashcards() {
    loadQuestions(function (qs) {
      var deck = qs.filter(function (q) { return q.conceptual; });
      if (!deck.length) {
        document.getElementById("fc-count").textContent = "No flashcards yet.";
        document.getElementById("fc-question").textContent = "";
        return;
      }
      var sel = document.getElementById("fc-topic");
      if (sel && !sel.dataset.bound) {
        sel.dataset.bound = "1";
        var opt0 = document.createElement("option");
        opt0.value = ""; opt0.textContent = "All topics";
        sel.appendChild(opt0);
        TOPICS.forEach(function (t) {
          if (!deck.some(function (q) { return q.topic === t; })) return;
          var o = document.createElement("option");
          o.value = t; o.textContent = t + " (" + deck.filter(function (q) { return q.topic === t; }).length + ")";
          sel.appendChild(o);
        });
        sel.addEventListener("change", function () { fcTopic = sel.value; resetFcDeck(deck); });
        document.getElementById("fc-shuffle").addEventListener("click", function () {
          shuffleFc(deck); fcIndex = 0; renderFcCard();
        });
        var card = document.getElementById("fc-card");
        card.addEventListener("click", function () {
          if (suppressFcClick) { suppressFcClick = false; return; }
          card.classList.toggle("flipped");
        });
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.classList.toggle("flipped"); }
        });
        document.getElementById("fc-flip").addEventListener("click", function (e) {
          e.stopPropagation(); card.classList.toggle("flipped");
        });
        document.getElementById("fc-know").addEventListener("click", function (e) {
          e.stopPropagation(); fcRate("know");
        });
        document.getElementById("fc-learning").addEventListener("click", function (e) {
          e.stopPropagation(); fcRate("learning");
        });
        // ---- Tinder-style swipe rating (flipped card only) ----
        var SWIPE_THRESHOLD = 90;
        card.addEventListener("pointerdown", function (e) {
          if (!card.classList.contains("flipped") || !fcDeck.length) return;
          fcDragStartX = e.clientX;
        });
        card.addEventListener("pointermove", function (e) {
          if (fcDragStartX === null) return;
          var dx = e.clientX - fcDragStartX;
          if (!draggingFc && Math.abs(dx) < 12) return;
          if (!draggingFc) { draggingFc = true; card.classList.add("dragging"); }
          fcDragX = dx;
          card.style.transform =
            "rotateY(180deg) translateX(" + dx + "px) rotate(" + (dx * 0.06) + "deg)";
          document.getElementById("fc-stamp-know").style.opacity =
            Math.min(1, Math.max(0, dx / SWIPE_THRESHOLD));
          document.getElementById("fc-stamp-learning").style.opacity =
            Math.min(1, Math.max(0, -dx / SWIPE_THRESHOLD));
        });
        card.addEventListener("pointerup", fcEndDrag);
        card.addEventListener("pointercancel", fcEndDrag);
        // Stop iOS Safari from hijacking horizontal swipes (back-nav gesture /
        // page sway): claim the gesture as soon as horizontal intent is clear.
        // Vertical scrolling is untouched.
        var tcStartX = null, tcStartY = null;
        card.addEventListener("touchstart", function (e) {
          if (!card.classList.contains("flipped") || !fcDeck.length) return;
          var t = e.touches[0];
          tcStartX = t.clientX; tcStartY = t.clientY;
        }, { passive: true });
        card.addEventListener("touchmove", function (e) {
          if (tcStartX === null) return;
          var t = e.touches[0];
          var dx = t.clientX - tcStartX, dy = t.clientY - tcStartY;
          if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) e.preventDefault();
        }, { passive: false });
        card.addEventListener("touchend", function () { tcStartX = null; });
        card.addEventListener("touchcancel", function () { tcStartX = null; });
        document.getElementById("fc-prev").addEventListener("click", function () { fcStep(-1); });
        document.getElementById("fc-next").addEventListener("click", function () { fcStep(1); });
        document.addEventListener("keydown", function (e) {
          if (document.getElementById("view-flashcards").classList.contains("hidden")) return;
          if (e.key === "ArrowRight") fcStep(1);
          else if (e.key === "ArrowLeft") fcStep(-1);
          else if (e.key === " " && e.target === document.body) {
            e.preventDefault(); card.classList.toggle("flipped");
          }
        });
      }
      // rebuild deck if the bank changed size (new flags deployed)
      if (fcDeck.length !== deck.filter(function (q) { return !fcTopic || q.topic === fcTopic; }).length) {
        resetFcDeck(deck);
      }
    });
  }

  function resetFcDeck(deck) {
    fcDeck = deck.filter(function (q) { return !fcTopic || q.topic === fcTopic; });
    fcIndex = 0;
    renderFcCard();
  }

  function shuffleFc(deck) {
    var pool = deck.filter(function (q) { return !fcTopic || q.topic === fcTopic; });
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    fcDeck = pool;
  }

  function fcStep(d) {
    if (!fcDeck.length) return;
    fcIndex = (fcIndex + d + fcDeck.length) % fcDeck.length;
    renderFcCard();
  }

  function fcSaveRatings() { store.set("fcRatings", fcRatings); }

  function fcKnownCount() {
    return fcDeck.filter(function (q) { return fcRatings[q.id] === "know"; }).length;
  }

  function fcUpdateMeter() {
    var n = fcDeck.length, k = fcKnownCount();
    var pct = n ? Math.round((k / n) * 100) : 0;
    document.getElementById("fc-fill").style.width = pct + "%";
    document.getElementById("fc-count").textContent =
      (n ? "Card " + (fcIndex + 1) + " of " + n + (fcTopic ? " · " + fcTopic : "") + " · " : "") +
      pct + "% known (" + k + "/" + n + ")";
  }

  function fcRate(rating) {
    if (!fcDeck.length) return;
    fcRatings[fcDeck[fcIndex].id] = rating;
    fcSaveRatings();
    fcStep(1); // record and move on
  }

  // swipe-rating drag state + handlers
  var fcDragStartX = null, fcDragX = 0, draggingFc = false, suppressFcClick = false;

  function fcResetStamps() {
    document.getElementById("fc-stamp-know").style.opacity = "0";
    document.getElementById("fc-stamp-learning").style.opacity = "0";
  }

  function fcEndDrag() {
    if (fcDragStartX === null) return;
    var wasDragging = draggingFc;
    fcDragStartX = null; draggingFc = false;
    card0().classList.remove("dragging");
    if (!wasDragging) return;
    suppressFcClick = true; // a drag is not a tap-to-flip
    var c = card0();
    if (fcDragX > 90) fcFlyOff(c, 1, "know");
    else if (fcDragX < -90) fcFlyOff(c, -1, "learning");
    else { c.style.transform = ""; fcResetStamps(); }
  }

  function card0() { return document.getElementById("fc-card"); }

  function fcFlyOff(c, dir, rating) {
    c.style.transition = "transform .25s ease-in, opacity .25s ease-in";
    c.style.transform =
      "rotateY(180deg) translateX(" + (dir * 600) + "px) rotate(" + (dir * 25) + "deg)";
    c.style.opacity = "0";
    setTimeout(function () {
      c.style.transition = ""; c.style.transform = ""; c.style.opacity = "";
      fcResetStamps();
      fcRate(rating);
    }, 260);
  }

  function renderFcCard() {
    var card = document.getElementById("fc-card");
    card.classList.remove("flipped");
    card.style.transform = ""; card.style.transition = ""; card.style.opacity = "";
    card.classList.remove("dragging");
    fcDragStartX = null; draggingFc = false; suppressFcClick = false;
    fcResetStamps();
    if (!fcDeck.length) {
      fcUpdateMeter();
      document.getElementById("fc-question").textContent = "";
      document.getElementById("fc-diagram").innerHTML = "";
      document.getElementById("fc-topic-chip").textContent = "";
      document.getElementById("fc-answer").textContent = "";
      document.getElementById("fc-solution").innerHTML = "";
      return;
    }
    var q = fcDeck[fcIndex];
    fcUpdateMeter();
    var rated = fcRatings[q.id];
    document.getElementById("fc-know").classList.toggle("active", rated === "know");
    document.getElementById("fc-learning").classList.toggle("active", rated === "learning");
    document.getElementById("fc-topic-chip").textContent = q.topic;
    document.getElementById("fc-question").innerHTML = renderRich(q.question);
    document.getElementById("fc-diagram").innerHTML = diagramHtml(q);
    document.getElementById("fc-answer").textContent = q.choices[q.answerIndex];
    document.getElementById("fc-solution").innerHTML = renderRich(q.solution);
  }

  function renderRich(text) {
    return String(text).split(/\n\s*\n/).map(function (para) {
      if (/^\s*$/.test(para)) return "";
      var dm = para.match(/^\s*\$\$([\s\S]+?)\$\$\s*$/);
      if (dm) {
        // Aligned equation blocks (parameter lists) sit left, like the handbook;
        // standalone equations stay centered.
        var left = dm[1].indexOf("\\begin{aligned}") !== -1 ? " left" : "";
        return '<div class="math-display' + left + '">' + texHtml(dm[1], true) + "</div>";
      }
      var inner = para.split(/(\\\([\s\S]+?\\\))/g).map(function (part) {
        var m = part.match(/^\\\(([\s\S]+?)\\\)$/);
        return m ? texHtml(m[1], false) : escapeHtml(part).replace(/\n/g, "<br>");
      }).join("");
      return "<p>" + inner + "</p>";
    }).join("");
  }

  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", route);

  // ---- AdSense -----------------------------------------------------------
  // The adsbygoogle.js script tag lives in <head> (also serves as site
  // verification). Here we only render the ad units: each .ad-slot becomes
  // a responsive display unit once PASSTHEFE_ADSENSE_CLIENT is set.
  // Set it back to "" to hide all ad slots site-wide.
  (function initAds() {
    var client = window.PASSTHEFE_ADSENSE_CLIENT || "";
    if (!client) {
      document.body.classList.add("no-ads");
      return;
    }
    document.querySelectorAll(".ad-slot").forEach(function (slot) {
      var ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.setAttribute("data-ad-client", client);
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");
      slot.appendChild(ins);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  })();

  // ---- PWA install prompt ----
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
  (function initPwaInstall() {
    var banner = document.getElementById("pwa-install-banner");
    if (!banner) return;
    var isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) return; // already installed
    var dismissedAt = 0;
    try { dismissedAt = parseInt(localStorage.getItem("pwaInstallDismissed") || "0", 10); } catch (e) {}
    if (Date.now() - dismissedAt < 14 * 864e5) return; // don't nag more than every 2 weeks
    var isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var installBtn = document.getElementById("pwa-install-btn");
    function dismiss() {
      banner.classList.add("hidden");
      try { localStorage.setItem("pwaInstallDismissed", String(Date.now())); } catch (e) {}
    }
    document.getElementById("pwa-install-dismiss").addEventListener("click", dismiss);
    window.addEventListener("appinstalled", function () { banner.classList.add("hidden"); });
    if (isIos) {
      // iOS Safari has no install prompt: show manual Add to Home Screen instructions
      installBtn.style.display = "none";
      banner.querySelector(".pwa-banner-text span").textContent =
        "Tap Share, then \u201cAdd to Home Screen\u201d to install.";
      setTimeout(function () { banner.classList.remove("hidden"); }, 2500);
      return;
    }
    var deferredPrompt = null;
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredPrompt = e;
      setTimeout(function () { banner.classList.remove("hidden"); }, 2500);
    });
    installBtn.addEventListener("click", function () {
      banner.classList.add("hidden");
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        try { localStorage.setItem("pwaInstallDismissed", String(Date.now())); } catch (e) {}
        deferredPrompt = null;
      }).catch(function () {});
    });
  })();
})();
