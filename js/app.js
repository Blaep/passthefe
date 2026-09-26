/* PassTheFE — web app
   Hash router + quiz engine + analytics, all client-side.
   Progress lives in localStorage; no accounts, no backend. */

(function () {
  "use strict";

  var VIEWS = ["home", "practice", "exam", "formulas", "flashcards", "analytics"];
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

  // ---- router ------------------------------------------------------------
  function route() {
    var name = (location.hash || "#/").replace("#/", "") || "home";
    if (VIEWS.indexOf(name) === -1) name = "home";
    VIEWS.forEach(function (v) {
      var el = document.getElementById("view-" + v);
      if (el) el.classList.toggle("hidden", v !== name);
    });
    if (name === "home") renderStats();
    if (name === "practice") initPractice();
    if (name === "formulas") initFormulas();
    if (name === "flashcards") initFlashcards();
    if (name === "analytics") renderAnalytics();
    window.scrollTo(0, 0);
  }

  function renderStats() {
    loadQuestions(function (qs) {
      var el = document.getElementById("stat-questions");
      if (el) el.textContent = qs.length > 0 ? qs.length : "–";
    });
  }

  // ---- quiz engine -------------------------------------------------------
  var quiz = null; // { list, idx, correct, topic, answers: [{qid, correct}] }

  function initPractice() {
    loadQuestions(function (qs) {
      var sel = document.getElementById("quiz-topic");
      if (sel && !sel.options.length) {
        sel.appendChild(opt("", "All topics (" + qs.length + " questions)"));
        TOPICS.forEach(function (t) {
          var n = qs.filter(function (q) { return q.topic === t; }).length;
          sel.appendChild(opt(t, t + " (" + n + ")"));
        });
      }
      renderStreak();
    });
    renderResumeBanner();
    var lens = document.getElementById("quiz-lengths");
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
    var start = document.getElementById("quiz-start");
    if (start && !start.dataset.bound) {
      start.dataset.bound = "1";
      start.addEventListener("click", startQuiz);
    }
  }

  function opt(value, label) {
    var o = document.createElement("option");
    o.value = value; o.textContent = label;
    return o;
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

  function startQuiz() {
    loadQuestions(function (qs) {
      var topic = document.getElementById("quiz-topic").value;
      var pool = topic ? qs.filter(function (q) { return q.topic === topic; }) : qs;
      if (!pool.length) {
        document.getElementById("quiz-run").innerHTML =
          "<p>No questions in this topic yet — try All topics.</p>";
        showOnly("quiz-run");
        return;
      }
      var n = Math.min(selectedLength(), pool.length);
      quiz = {
        list: shuffle(pool).slice(0, n),
        idx: 0, correct: 0, topic: topic || "All topics", answers: []
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
    store.set("resume", {
      v: 1,
      qids: quiz.list.map(function (q) { return q.id; }),
      idx: quiz.idx,
      correct: quiz.correct,
      topic: quiz.topic,
      answers: quiz.answers,
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
        answers: saved.answers || []
      };
      renderQuestion();
      showOnly("quiz-run");
    });
  }

  function renderResumeBanner() {
    var el = document.getElementById("quiz-resume");
    if (!el) return;
    var saved = store.get("resume", null);
    var valid = saved && saved.v === 1 && saved.qids && saved.qids.length &&
      (saved.idx || 0) < saved.qids.length;
    if (!valid) { el.classList.add("hidden"); el.innerHTML = ""; return; }
    el.innerHTML = '<div class="resume-banner"><div><strong>Unfinished quiz</strong><br>' +
      '<span class="muted">' + escapeHtml(saved.topic || "") + " · question " +
      ((saved.idx || 0) + 1) + " of " + saved.qids.length + " · " +
      (saved.correct || 0) + " correct so far</span></div>" +
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
    ["quiz-setup", "quiz-run", "quiz-result"].forEach(function (x) {
      document.getElementById(x).classList.toggle("hidden", x !== id);
    });
  }

  // ---- diagrams --------------------------------------------------------
  // Optional textbook-style SVG figure shown between the stem and choices.
  function diagramHtml(q) {
    if (!q || !q.diagram) return "";
    return '<img class="q-diagram" src="' + escapeHtml(q.diagram) + '" alt="' +
      escapeHtml("Figure for " + (q.subtopic || q.topic || "this question")) +
      '" loading="lazy">';
  }

  function renderQuestion() {
    var q = quiz.list[quiz.idx];
    var box = document.getElementById("quiz-run");
    box.dataset.answered = "";
    var html = '<p class="quiz-progress">Question ' + (quiz.idx + 1) + " of " +
      quiz.list.length + " · " + escapeHtml(quiz.topic) + "</p>";
    html += '<p class="quiz-meta">' + escapeHtml(q.topic) + " · " +
      escapeHtml(q.subtopic) + " · " + escapeHtml(q.difficulty) + "</p>";
    html += '<p class="question-text">' + escapeHtml(q.question) + "</p>";
    html += diagramHtml(q);
    html += '<ul class="choices" id="quiz-choices">';
    shuffle(q.choices.map(function (c, i) { return i; })).forEach(function (i) {
      html += '<li data-i="' + i + '">' + escapeHtml(q.choices[i]) + "</li>";
    });
    html += "</ul>";
    html += '<div class="solution" id="quiz-solution" style="display:none"></div>';
    html += '<div class="quiz-nav"><button id="quiz-next" class="btn primary" style="display:none">' +
      (quiz.idx + 1 === quiz.list.length ? "See results" : "Next question") + "</button></div>";
    box.innerHTML = html;
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
    // Restoring a saved quiz where the current question was already answered:
    // show it in its answered state without re-logging anything.
    var prev = quiz.answers.length ? quiz.answers[quiz.answers.length - 1] : null;
    if (prev && prev.qid === q.id && typeof prev.chosen === "number") {
      revealAnswer(q, prev.chosen, prev.correct);
    }
  }

  function answerCurrent(i) {
    var box = document.getElementById("quiz-run");
    if (box.dataset.answered) return;
    var q = quiz.list[quiz.idx];
    var ok = i === q.answerIndex;
    if (ok) quiz.correct++;
    quiz.answers.push({ qid: q.id, topic: q.topic, correct: ok, chosen: i });
    logAttempt(q, ok);
    revealAnswer(q, i, ok);
    saveProgress();
  }

  function revealAnswer(q, chosenI, ok) {
    var box = document.getElementById("quiz-run");
    box.dataset.answered = "1";
    box.querySelectorAll("#quiz-choices li").forEach(function (li) {
      var liI = parseInt(li.dataset.i, 10);
      if (liI === q.answerIndex) { li.style.borderColor = "#34C759"; li.style.background = "#e9f9ee"; }
      else if (liI === chosenI) { li.style.borderColor = "#FF3B30"; li.style.background = "#fdeceb"; }
      li.style.cursor = "default";
    });
    var sol = document.getElementById("quiz-solution");
    sol.innerHTML = "<strong>" + (ok ? "Correct." : "Not quite.") + "</strong>" +
      '<p class="explain-head">Explanation</p>' +
      '<div class="explain-body">' + renderRich(q.solution) + "</div>" +
      (q.explanation ? '<div class="explain-body">' + renderRich(q.explanation) + "</div>" : "");
    sol.style.display = "block";
    document.getElementById("quiz-next").style.display = "inline-block";
  }

  function logAttempt(q, ok) {
    var attempts = store.get("attempts", []);
    attempts.push({ qid: q.id, topic: q.topic, correct: ok, ts: Date.now() });
    store.set("attempts", attempts.slice(-2000)); // keep it bounded
    bumpStreak();
  }

  function showResult() {
    var box = document.getElementById("quiz-result");
    var pct = Math.round(100 * quiz.correct / quiz.list.length);
    var html = "<h3>Quiz complete</h3>";
    html += '<p class="result-score">' + quiz.correct + "/" + quiz.list.length +
      " <span>(" + pct + "%)</span></p>";
    html += '<div class="quiz-nav"><button id="quiz-again" class="btn primary">New quiz</button> ' +
      '<button id="quiz-share" class="btn">Share my score</button> ' +
      '<a class="btn" href="#/analytics">View analytics</a></div>';
    box.innerHTML = html;
    document.getElementById("quiz-again").addEventListener("click", function () {
      quiz = null;
      clearResume();
      document.getElementById("quiz-run").dataset.answered = "";
      showOnly("quiz-setup");
      initPractice();
    });
    document.getElementById("quiz-share").addEventListener("click", shareScore);
    showOnly("quiz-result");
    renderStreak();
    clearResume(); // finished quizzes have nothing left to resume
    renderResumeBanner(); // refresh the setup card so it never shows a stale banner
    recordSession();
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

  // One completed quiz = one logged session (score, scope, missed question ids).
  function recordSession() {
    if (!quiz || !quiz.answers.length) return;
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
      missed: missed
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
        escapeHtml(q.question) + '</p>' + diagramHtml(q) +
        '<p class="answer-line"><strong>Correct answer:</strong> ' +
        escapeHtml(q.choices[q.answerIndex]) + '</p><div class="explain-body">' +
        renderRich(q.solution) + "</div></div>";
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
        '<p class="formula-expr">' + escapeHtml(f.formula) + "</p>" +
        (f.symbols ? '<p class="formula-symbols">' + escapeHtml(f.symbols) + "</p>" : "") +
        (f.notes ? '<p class="formula-notes">' + escapeHtml(f.notes) + "</p>" : "") +
        "</div>";
    }).join("");
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
