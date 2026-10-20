/* PassTheFE randomized practice — Construction Engineering generators.
 *
 * Plain script (no modules) for the static site. Defines window.CONSTRUCTION_GENERATORS:
 * one entry per NUMERICAL Materials bank question. Skipped (code comments at top
 * of each workstream section): materials-014, materials-016 (diagrams that cannot
 * be cleanly parameterized); materials-001, 002, 003, 004, 006, 007, 008, 013,
 * 018, 019, 031 (purely conceptual — definitions/scenarios with no numbers).
 *
 * LaTeX convention: NATURAL single-backslash LaTeX. In the JS string literals
 * below that means "\\(" for \(, "\\frac" for \frac, and "\\\\" for the "\\"
 * row break inside aligned environments. NEVER write a doubled backslash
 * before (, ), or an ASCII letter.
 */
(function () {
  "use strict";

  var MINUS = "−"; // U+2212, matches bank choice-string style

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a || 1;
  }

  // FE-style number formatting: integers render as integers, others up to
  // 3 decimals with trailing zeros trimmed.
  function fmt(x) {
    if (!isFinite(x)) return "NaN";
    var r = Math.round(x);
    if (Math.abs(x - r) < 1e-9) return String(r);
    return x.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  }
  // Display form with U+2212 minus (bank choice-string style).
  function sgn(x) { return x < -1e-12 ? MINUS + fmt(-x) : fmt(x); }
  // Inside-LaTeX form with ASCII hyphen.
  function texNum(x) { return x < -1e-12 ? "-" + fmt(-x) : fmt(x); }
  // Exact reduced fraction, U+2212 sign: "−3/4", "5", "32/3".
  function fracStr(num, den) {
    var n = Math.round(num), d = Math.round(den);
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d); n /= g; d /= g;
    if (d === 1) return sgn(n);
    return (n < 0 ? MINUS : "") + Math.abs(n) + "/" + d;
  }
  // Exact reduced fraction for inside LaTeX (ASCII hyphen), e.g. \frac{-3}{4}.
  function texFrac(num, den) {
    var n = Math.round(num), d = Math.round(den);
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d); n /= g; d /= g;
    if (d === 1) return texNum(n);
    return "\\frac{" + n + "}{" + d + "}";
  }
  function ri(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function sup(n) { return n === 2 ? "²" : n === 3 ? "³" : n === 4 ? "⁴" : "^" + n; }
  function vecStr(v) { return "(" + v.map(sgn).join(", ") + ")"; }
  function nzComp() { var v = 0; while (v === 0) v = ri(-5, 5); return v; } // nonzero component

  // Wraps a roll() function with the app-integration contract. roll() returns
  // { variantKey, question, options: [{label, num|null, correct}], solution }.
  // The wrapper shuffles the options, enforces pairwise-distinct labels (and
  // pairwise-distinct numeric values where present) with a retry loop, and
  // returns the contracted generate() payload.
  function buildGenerator(meta, roll) {
    return {
      baseId: meta.baseId,
      topic: meta.topic,
      subtopic: meta.subtopic,
      difficulty: meta.difficulty,
      estimatedTimeSeconds: meta.estimatedTimeSeconds,
      explanation: meta.explanation,
      videoUrl: meta.videoUrl,
      videoTitle: meta.videoTitle,
      generate: function () {
        for (var attempt = 0; attempt < 300; attempt++) {
          var r = roll();
          var labels = r.options.map(function (o) { return o.label; });
          if (new Set(labels).size !== 4) continue;
          var nums = r.options
            .filter(function (o) { return typeof o.num === "number"; })
            .map(function (o) { return o.num; });
          var ok = true;
          for (var i = 0; i < nums.length && ok; i++)
            for (var j = i + 1; j < nums.length && ok; j++)
              if (Math.abs(nums[i] - nums[j]) < 1e-9) ok = false;
          if (!ok) continue;
          var correctPos = -1;
          for (var m = 0; m < 4; m++) if (r.options[m].correct) correctPos = m;
          if (correctPos < 0) continue;
          var order = shuffle([0, 1, 2, 3]);
          var correctOpt = r.options[correctPos];
          return {
            id: meta.baseId,
            variantKey: r.variantKey,
            topic: meta.topic,
            subtopic: meta.subtopic,
            difficulty: meta.difficulty,
            estimatedTimeSeconds: meta.estimatedTimeSeconds,
            question: r.question,
            choices: order.map(function (i) { return r.options[i].label; }),
            answerIndex: order.indexOf(correctPos),
            solution: r.solution,
            diagram: r.diagram || null,
            explanation: meta.explanation,
            videoUrl: meta.videoUrl,
            videoTitle: meta.videoTitle,
            // Validation aids (beyond the app contract): numeric value of the
            // correct option when it is numeric, plus its exact label.
            numericAnswer: typeof correctOpt.num === "number" ? correctOpt.num : null,
            correctLabel: correctOpt.label
          };
        }
        throw new Error("distinctness retry exhausted for " + meta.baseId);
      }
    };
  }

  
  // Diagrams for generated variants: build a small SVG from the rolled
  // numbers and hand it to the app as a data URL (q.diagram renders it in
  // an <img>). Setup only — never draw the answer.
  function svgURL(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  var SVG_HDR = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="300" viewBox="0 0 640 300" role="img">';
  var SVG_FTR = '</svg>';
  var AH = '<defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';

  // Registry: workstream files call reg(buildGenerator({...}, rollFn)).
  var CONSTRUCTION_ENTRIES = [];
  function reg(e) { CONSTRUCTION_ENTRIES.push(e); return e; }

/* ---- construction-041/042: CPM network diagram (labels carry rolled durations) ---- */
function dCpmNetwork(a, b, c, d, e, f) {
  function act(x, y, name, dur) {
    return '<rect x="' + (x - 35) + '" y="' + (y - 26) + '" width="70" height="52" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>' +
      '<text x="' + x + '" y="' + (y - 2) + '" font-family="Helvetica,Arial,sans-serif" font-size="16" text-anchor="middle" fill="#1a1a1a">' + name + '</text>' +
      '<text x="' + x + '" y="' + (y + 18) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">' + dur + ' d</text>';
  }
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img" aria-label="CPM network: activity A precedes B and C, B precedes D, C precedes E, and D and E both precede F, all finish-to-start"><rect width="480" height="260" fill="#ffffff"/>' + AH;
  s += '<line x1="95" y1="120" x2="125" y2="60" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ah)"/>';
  s += '<line x1="95" y1="120" x2="125" y2="180" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ah)"/>';
  s += '<line x1="195" y1="60" x2="225" y2="60" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ah)"/>';
  s += '<line x1="195" y1="180" x2="225" y2="180" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ah)"/>';
  s += '<line x1="295" y1="60" x2="345" y2="120" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ah)"/>';
  s += '<line x1="295" y1="180" x2="345" y2="120" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ah)"/>';
  s += act(60, 120, "A", a) + act(160, 60, "B", b) + act(160, 180, "C", c) + act(260, 60, "D", d) + act(260, 180, "E", e) + act(380, 120, "F", f);
  return svgURL(s + '</svg>');
}

/* ---- construction-041: CPM project duration ---- */
reg(buildGenerator({
  baseId: "construction-041", topic: "Construction Engineering", subtopic: "CPM project duration",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "The duration is the longest path A-B-D-F or A-C-E-F; summing all activities or taking the shorter branch gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var a = ri(2, 5), b = ri(3, 6), c = ri(4, 8), d = ri(3, 6), e = ri(2, 4), f = ri(3, 6);
  var pathBD = a + b + d + f, pathCE = a + c + e + f;
  if (pathBD === pathCE) c += 1; // keep one critical path so the float question stays clean
  pathCE = a + c + e + f;
  var correct = Math.max(pathBD, pathCE);
  var dSum = a + b + c + d + e + f;
  var dShort = Math.min(pathBD, pathCE);
  var dDrop = correct - f;
  var question = "Activity A (" + a + " days) precedes B (" + b + ") and C (" + c + "). B precedes D (" + d + "). C precedes E (" + e + "). D and E both precede F (" + f + "). All relationships are finish-to-start, as shown. What is the project duration?";
  var solution = "Refer to CPM Precedence Relationships and Nomenclature in the Civil Engineering (Construction) chapter of the FE Reference Handbook (v10.6), printed page 316 (PDF page 322).\n\n" +
    "Path A-B-D-F: " + a + " + " + b + " + " + d + " + " + f + " = " + pathBD + " days.\n\n" +
    "Path A-C-E-F: " + a + " + " + c + " + " + e + " + " + f + " = " + pathCE + " days.\n\n" +
    "The project duration is the longest path: " + correct + " days.";
  return {
    variantKey: "a" + a + "_b" + b + "_c" + c + "_d" + d + "_e" + e + "_f" + f,
    question: question, diagram: dCpmNetwork(a, b, c, d, e, f),
    options: [
      { label: correct + " days", num: correct, correct: true },
      { label: dSum + " days", num: dSum, correct: false },
      { label: dShort + " days", num: dShort, correct: false },
      { label: dDrop + " days", num: dDrop, correct: false }
    ],
    solution: solution
  };
}));

/* ---- construction-042: total float of activity E ---- */
reg(buildGenerator({
  baseId: "construction-042", topic: "Construction Engineering", subtopic: "Total float of an activity",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Float of E is the difference between the critical path and the path through E; zero float and the other branch's length are the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var a = ri(2, 5), b = ri(3, 6), c = ri(4, 8), d = ri(3, 6), e = ri(2, 4), f = ri(3, 6);
  var pathBD = a + b + d + f, pathCE = a + c + e + f;
  if (pathBD === pathCE) c += 1;
  pathCE = a + c + e + f;
  var correct = Math.abs(pathBD - pathCE); // float of E = critical - path through E
  var question = "In a project network (A " + a + " d, B " + b + " d, C " + c + " d, D " + d + " d, E " + e + " d, F " + f + " d; A precedes B and C, B precedes D, C precedes E, D and E precede F), what is the total float of activity E?";
  var solution = "Refer to CPM Precedence Relationships and Nomenclature in the Civil Engineering (Construction) chapter of the FE Reference Handbook (v10.6), printed page 316 (PDF page 322).\n\n" +
    "Path through E (A-C-E-F): " + pathCE + " days. Other path (A-B-D-F): " + pathBD + " days.\n\n" +
    "Total float of E = " + Math.max(pathBD, pathCE) + " - " + pathCE + " = " + correct + " day" + (correct === 1 ? "" : "s") + ".";
  return {
    variantKey: "a" + a + "_b" + b + "_c" + c + "_d" + d + "_e" + e + "_f" + f,
    question: question, diagram: dCpmNetwork(a, b, c, d, e, f),
    options: [
      { label: correct + (correct === 1 ? " day" : " days"), num: correct, correct: true },
      { label: (correct + 1) + " days", num: correct + 1, correct: false },
      { label: (correct + 2) + " days", num: correct + 2, correct: false },
      { label: Math.max(0, correct - 1) + (Math.max(0, correct - 1) === 1 ? " day" : " days"), num: Math.max(0, correct - 1), correct: false }
    ],
    solution: solution
  };
}));

/* ---- construction-046: estimate at completion ---- */
reg(buildGenerator({
  baseId: "construction-046", topic: "Construction Engineering", subtopic: "Estimate at completion",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "EAC = BAC/CPI with the unrounded CPI; the traps are ETC instead of EAC, ACWP plus remaining budget, and a rounded CPI.",
  videoUrl: null, videoTitle: null
}, function () {
  var BAC = pick([400000, 500000, 600000, 750000]);
  var BCWP = pick([150000, 180000, 200000, 225000, 250000]);
  var ACWP = BCWP + pick([20000, 30000, 40000, 50000]);
  var CPI = BCWP / ACWP;
  var correct = BAC / CPI;
  var dETC = correct - ACWP;
  var dAdd = ACWP + (BAC - BCWP);
  var CPIr = Math.round(CPI * 100) / 100;
  var dRound = BAC / CPIr;
  function usd(x) { return "$" + Math.round(x).toLocaleString("en-US"); }
  var question = "A project has BAC = " + usd(BAC) + ", BCWP = " + usd(BCWP) + ", ACWP = " + usd(ACWP) + ", so CPI = BCWP/ACWP = " + CPI.toFixed(3) + " (carry the unrounded ratio). Assuming the current cost performance continues, what is the estimate at completion?";
  var solution = "Refer to Earned-Value Analysis (Forecasting) in the Civil Engineering (Construction) chapter of the FE Reference Handbook (v10.6), printed page 317 (PDF page 323).\n\n" +
    "$$EAC = \\frac{BAC}{CPI} = \\frac{" + BAC.toLocaleString("en-US") + "}{" + (BCWP + "/" + ACWP) + "} = " + "\\$" + Math.round(correct).toLocaleString("en-US") + "$$";
  return {
    variantKey: "BAC" + BAC + "_BCWP" + BCWP + "_ACWP" + ACWP,
    question: question,
    options: [
      { label: usd(correct), num: correct, correct: true },
      { label: usd(dETC), num: dETC, correct: false },
      { label: usd(dAdd), num: dAdd, correct: false },
      { label: usd(dRound), num: dRound, correct: false }
    ],
    solution: solution
  };
}));

  window.CONSTRUCTION_GENERATORS = CONSTRUCTION_ENTRIES;
})();
