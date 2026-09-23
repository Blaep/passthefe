/* PassTheFE — web app
   Hash router + quiz engine + analytics, all client-side.
   Progress lives in localStorage; no accounts, no backend. */

(function () {
  "use strict";

  var VIEWS = ["home", "practice", "exam", "formulas", "analytics"];
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
      renderQuestion();
      showOnly("quiz-run");
    });
  }

  function showOnly(id) {
    ["quiz-setup", "quiz-run", "quiz-result"].forEach(function (x) {
      document.getElementById(x).classList.toggle("hidden", x !== id);
    });
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
      if (quiz.idx + 1 < quiz.list.length) { quiz.idx++; renderQuestion(); }
      else showResult();
    });
  }

  function answerCurrent(i) {
    var box = document.getElementById("quiz-run");
    if (box.dataset.answered) return;
    box.dataset.answered = "1";
    var q = quiz.list[quiz.idx];
    var ok = i === q.answerIndex;
    if (ok) quiz.correct++;
    quiz.answers.push({ qid: q.id, topic: q.topic, correct: ok });
    logAttempt(q, ok);
    box.querySelectorAll("#quiz-choices li").forEach(function (li) {
      var liI = parseInt(li.dataset.i, 10);
      if (liI === q.answerIndex) { li.style.borderColor = "#34C759"; li.style.background = "#e9f9ee"; }
      else if (liI === i) { li.style.borderColor = "#FF3B30"; li.style.background = "#fdeceb"; }
      li.style.cursor = "default";
    });
    var sol = document.getElementById("quiz-solution");
    sol.innerHTML = "<strong>" + (ok ? "Correct." : "Not quite.") + "</strong> " +
      escapeHtml(q.solution) +
      (q.explanation ? "<br><em>" + escapeHtml(q.explanation) + "</em>" : "");
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
      '<a class="btn" href="#/analytics">View analytics</a></div>';
    box.innerHTML = html;
    document.getElementById("quiz-again").addEventListener("click", function () {
      quiz = null;
      document.getElementById("quiz-run").dataset.answered = "";
      showOnly("quiz-setup");
      initPractice();
    });
    showOnly("quiz-result");
    renderStreak();
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
  function renderAnalytics() {
    var body = document.getElementById("analytics-body");
    var attempts = store.get("attempts", []);
    if (!attempts.length) {
      body.innerHTML = '<div class="card"><p>No answers logged yet. Take a practice quiz and your stats will appear here.</p></div>';
      return;
    }
    var total = attempts.length;
    var right = attempts.filter(function (a) { return a.correct; }).length;
    var pct = Math.round(100 * right / total);
    var html = '<div class="card"><h3>Overall</h3>' +
      '<p class="result-score">' + pct + '% <span>(' + right + "/" + total + " correct)</span></p></div>";
    html += '<div class="card"><h3>By topic</h3>';
    TOPICS.forEach(function (t) {
      var ts = attempts.filter(function (a) { return a.topic === t; });
      if (!ts.length) return;
      var r = ts.filter(function (a) { return a.correct; }).length;
      var p = Math.round(100 * r / ts.length);
      html += '<div class="topic-row"><span class="topic-name">' + escapeHtml(t) +
        ' <small>(' + ts.length + ")</small></span>" +
        '<span class="bar"><span class="fill" style="width:' + p + '%"></span></span>' +
        '<span class="topic-pct">' + p + "%</span></div>";
    });
    html += "</div>";
    body.innerHTML = html;
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

  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", route);
})();
