/* PassTheFE randomized practice — Surveying generators.
 *
 * Plain script (no modules) for the static site. Defines window.SURVEYING_GENERATORS:
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
  var SURVEYING_ENTRIES = [];
  function reg(e) { SURVEYING_ENTRIES.push(e); return e; }

/* ---- surveying diagram helpers (bank compositions, rolled geometry/labels) ---- */

// Coordinate polygon (surveying-039/040): rolled vertices mapped to canvas, uniform scale
function dSurvPoly(pts, labels) {
  var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
  var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs);
  var y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
  var k = Math.min(320 / (x1 - x0), 230 / (y1 - y0));
  function px(x) { return 60 + (x - x0) * k; }
  function py(y) { return 270 - (y - y0) * k; }
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300" role="img" aria-label="Lot boundary polygon through the given corner coordinates"><rect width="480" height="300" fill="#ffffff"/>';
  s += '<polygon points="' + pts.map(function (p) { return px(p[0]).toFixed(1) + ',' + py(p[1]).toFixed(1); }).join(' ') + '" fill="#e9f2e1" stroke="#1a1a1a" stroke-width="3"/>';
  var names = ["A", "B", "C", "D", "E"];
  for (var i = 0; i < pts.length; i++) {
    s += '<circle cx="' + px(pts[i][0]).toFixed(1) + '" cy="' + py(pts[i][1]).toFixed(1) + '" r="4" fill="#1a1a1a"/>';
    s += '<text x="' + (px(pts[i][0]) + 8).toFixed(1) + '" y="' + (py(pts[i][1]) - 6).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">' + names[i] + ' (' + pts[i][0] + ', ' + pts[i][1] + ')</text>';
  }
  return svgURL(s + '</svg>');
}

// Offset boundary (surveying-041/042): polyline follows the rolled offsets
function dSurvOffsets(offsets, w) {
  var n = offsets.length;
  var yBase = 190, k = 18, x0 = 60, dx = 330 / (n - 1);
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="225" viewBox="0 0 480 225" role="img" aria-label="Offsets measured at a common interval of ' + w + ' feet from a straight baseline to an irregular boundary"><rect width="480" height="225" fill="#ffffff"/>' + AH;
  s += '<line x1="40" y1="190" x2="440" y2="190" stroke="#1a1a1a" stroke-width="3"/>';
  var pts = [];
  for (var i = 0; i < n; i++) {
    var x = x0 + i * dx, y = yBase - offsets[i] * k;
    pts.push(x.toFixed(1) + ',' + y.toFixed(1));
    s += '<line x1="' + x.toFixed(1) + '" y1="' + yBase + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#1a1a1a" stroke-width="1.5"/>';
    s += '<text x="' + x.toFixed(1) + '" y="' + (y - 8).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="12" text-anchor="middle" fill="#1a1a1a">' + offsets[i].toFixed(1) + '</text>';
    if (i < n - 1) s += '<text x="' + (x + dx / 2).toFixed(1) + '" y="212" font-family="Helvetica,Arial,sans-serif" font-size="11" text-anchor="middle" fill="#6b7280">' + w + ' ft</text>';
  }
  s += '<polyline points="' + pts.join(' ') + '" fill="#cfe4f5" fill-opacity="0.35" stroke="#1d4ed8" stroke-width="2.5"/>';
  return svgURL(s + '</svg>');
}

// Two end sections L apart (surveying-044/045); widths scale with sqrt(area)
function dSurvEndArea(A1, A2, L, Am) {
  function trap(cx, A, tag) {
    var w = 30 + Math.sqrt(A) * 1.6;
    return '<polygon points="' + (cx - w / 2) + ',150 ' + (cx - w / 2 + 30) + ',' + (150 - Math.sqrt(A) * 2.4).toFixed(1) + ' ' + (cx - w / 2 + 50) + ',' + (150 - Math.sqrt(A) * 2.4).toFixed(1) + ' ' + (cx + w / 2) + ',150" fill="#cfd8c8" stroke="#1a1a1a" stroke-width="2"/>' +
      '<text x="' + cx + '" y="170" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">' + tag + ' = ' + A + ' ft\u00B2</text>';
  }
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="Two cross sections with end areas ' + A1 + ' and ' + A2 + ' square feet, ' + L + ' feet apart"><rect width="480" height="240" fill="#ffffff"/>' + AH;
  s += trap(120, A1, "A\u2081") + trap(370, A2, "A\u2082");
  if (Am) s += '<g opacity="0.55">' + trap(245, Am, "A_m") + '</g>';
  s += '<line x1="120" y1="205" x2="370" y2="205" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="245" y="225" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">L = ' + L + ' ft</text>';
  return svgURL(s + '</svg>');
}

// Pyramid stockpile (surveying-046); labels carry rolled dimensions
function dSurvPyramid(a, b, h) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Pyramid-shaped stockpile with a rectangular base of ' + a + ' feet by ' + b + ' feet and a height of ' + h + ' feet"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<polygon points="110,190 320,190 390,150 180,150" fill="#e0d3b8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="250" y1="50" x2="110" y2="190" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="250" y1="50" x2="320" y2="190" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="250" y1="50" x2="390" y2="150" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="250" y1="50" x2="180" y2="150" stroke="#1a1a1a" stroke-width="1.5" stroke-dasharray="4 3"/>';
  s += '<line x1="250" y1="50" x2="250" y2="170" stroke="#c0392b" stroke-width="1.5" stroke-dasharray="4 3"/>';
  s += '<text x="262" y="110" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#c0392b">h = ' + h + ' ft</text>';
  s += '<text x="215" y="208" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">' + a + ' ft</text>';
  s += '<text x="355" y="180" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">' + b + ' ft</text>';
  return svgURL(s + '</svg>');
}

// Conical stockpile (surveying-047); labels carry rolled r and h
function dSurvCone(r, h) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Conical stockpile with base radius ' + r + ' feet and height ' + h + ' feet"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<ellipse cx="240" cy="180" rx="140" ry="30" fill="#e0d3b8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="240" y1="60" x2="100" y2="180" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="240" y1="60" x2="380" y2="180" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="240" y1="60" x2="240" y2="180" stroke="#c0392b" stroke-width="1.5" stroke-dasharray="4 3"/>';
  s += '<text x="252" y="125" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#c0392b">h = ' + h + ' ft</text>';
  s += '<line x1="240" y1="180" x2="380" y2="180" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="310" y="198" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">r = ' + r + ' ft</text>';
  return svgURL(s + '</svg>');
}

function shoelace(pts) {
  var s = 0;
  for (var i = 0; i < pts.length; i++) {
    var j = (i + 1) % pts.length;
    s += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return Math.abs(s) / 2;
}

/* ---- surveying-039: area by coordinates (ft) ---- */
reg(buildGenerator({
  baseId: "surveying-039", topic: "Surveying", subtopic: "Area by coordinates",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Doubling the area (forgetting the 1/2), halving twice, or a mis-scaled shoelace sum gives the traps, all in square feet.",
  videoUrl: null, videoTitle: null
}, function () {
  var sc = pick([0.8, 0.9, 1.0, 1.1, 1.25]);
  var base = [[0, 0], [120, 0], [150, 80], [60, 130], [-20, 70]];
  var pts = base.map(function (p) { return [Math.round(p[0] * sc), Math.round(p[1] * sc)]; });
  var A = shoelace(pts);
  var correct = A;
  var question = "A lot has corners A (" + pts[0][0] + ", " + pts[0][1] + "), B (" + pts[1][0] + ", " + pts[1][1] + "), C (" + pts[2][0] + ", " + pts[2][1] + "), D (" + pts[3][0] + ", " + pts[3][1] + ") and E (" + pts[4][0] + ", " + pts[4][1] + "), listed in order around the boundary (coordinates in ft), as shown. What is its area in square feet?";
  var solution = "Refer to Area formulas (Area by Coordinates) in the Civil Engineering chapter of the FE Reference Handbook (v10.6), printed page 316 (PDF page 322).\n\n" +
    "Applying the coordinate (shoelace) formula around the five corners gives A = " + Math.round(correct).toLocaleString("en-US") + " ft\u00B2.";
  return {
    variantKey: "sc" + sc,
    question: question, diagram: dSurvPoly(pts),
    options: [
      { label: Math.round(correct).toLocaleString("en-US") + " ft\u00B2", num: correct, correct: true },
      { label: Math.round(2 * correct).toLocaleString("en-US") + " ft\u00B2", num: 2 * correct, correct: false },
      { label: Math.round(0.9 * correct).toLocaleString("en-US") + " ft\u00B2", num: 0.9 * correct, correct: false },
      { label: Math.round(0.5 * correct).toLocaleString("en-US") + " ft\u00B2", num: 0.5 * correct, correct: false }
    ],
    solution: solution
  };
}));

/* ---- surveying-040: area by coordinates (acres) ---- */
reg(buildGenerator({
  baseId: "surveying-040", topic: "Surveying", subtopic: "Area by coordinates, house lot with pitched corner",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "The traps are reporting square feet as acres, omitting the triangular cap, and doubling the area.",
  videoUrl: null, videoTitle: null
}, function () {
  var sc = pick([0.9, 1.0, 1.1, 1.2]);
  var base = [[0, 0], [200, 0], [200, 150], [100, 220], [0, 150]];
  var pts = base.map(function (p) { return [Math.round(p[0] * sc / 5) * 5, Math.round(p[1] * sc / 5) * 5]; });
  var Aft = shoelace(pts);
  var correct = Aft / 43560;
  var dFt = Aft;
  var W = pts[1][0], H = pts[2][1];
  var dNoTri = (W * H) / 43560;
  var dDouble = 2 * correct;
  var question = "A parcel has corners at (" + pts[0][0] + ", " + pts[0][1] + "), (" + pts[1][0] + ", " + pts[1][1] + "), (" + pts[2][0] + ", " + pts[2][1] + "), (" + pts[3][0] + ", " + pts[3][1] + ") and (" + pts[4][0] + ", " + pts[4][1] + ") in ft, listed counterclockwise. What is its area in acres? (1 acre = 43,560 ft\u00B2)";
  var solution = "Refer to Area formulas (Area by Coordinates) in the Civil Engineering chapter of the FE Reference Handbook (v10.6), printed page 316 (PDF page 322).\n\n" +
    "Shoelace area = " + Math.round(Aft).toLocaleString("en-US") + " ft\u00B2; dividing by 43,560 ft\u00B2/acre gives " + correct.toFixed(3) + " acres.";
  return {
    variantKey: "sc" + sc,
    question: question, diagram: dSurvPoly(pts),
    options: [
      { label: correct.toFixed(3) + " acres", num: correct, correct: true },
      { label: (dFt / 4356).toFixed(3) + " acres", num: dFt / 4356, correct: false },
      { label: dNoTri.toFixed(3) + " acres", num: dNoTri, correct: false },
      { label: dDouble.toFixed(3) + " acres", num: dDouble, correct: false }
    ],
    solution: solution
  };
}));

/* ---- shared offsets roller (surveying-041/042) ---- */
function rollOffsets() {
  return {
    w: pick([5, 10, 20]),
    o: [0, pick([3.6, 4.2, 4.8]), pick([4.5, 5.1, 5.7]), pick([5.4, 6.0, 6.6]), pick([4.9, 5.5, 6.1]), pick([3.2, 3.8, 4.4]), 0]
  };
}
function offsetsText(o) { return o.map(function (x) { return x.toFixed(1); }).join(", "); }

/* ---- surveying-041: trapezoidal rule ---- */
reg(buildGenerator({
  baseId: "surveying-041", topic: "Surveying", subtopic: "Trapezoidal rule with offsets",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "The traps are the Simpson weighting, halving the whole sum, and mean-offset times total length.",
  videoUrl: null, videoTitle: null
}, function () {
  var r = rollOffsets(), w = r.w, o = r.o;
  var sumIn = o[1] + o[2] + o[3] + o[4] + o[5];
  var correct = w * (o[0] / 2 + sumIn + o[6] / 2);
  var simp = w / 3 * (o[0] + 4 * o[1] + 2 * o[2] + 4 * o[3] + 2 * o[4] + 4 * o[5] + o[6]);
  var dHalf = correct / 2;
  var dMean = (sumIn / 5) * (w * 6);
  var question = "Seven offsets are measured at a common interval of " + w + " ft from a straight baseline to an irregular boundary: " + offsetsText(o) + " ft, as shown. What is the area using the trapezoidal rule?";
  var solution = "Refer to Area formulas (Trapezoidal Rule) in the Civil Engineering chapter of the FE Reference Handbook (v10.6), printed page 316 (PDF page 322).\n\n" +
    "$$A = w\\left(\\frac{h_0}{2} + h_1 + h_2 + h_3 + h_4 + h_5 + \\frac{h_6}{2}\\right) = " + w + "(" + sumIn.toFixed(1) + ") = " + Math.round(correct).toLocaleString("en-US") + "\\ \\text{ft}^2$$";
  return {
    variantKey: "w" + w + "_" + o.join("-"),
    question: question, diagram: dSurvOffsets(o, w),
    options: [
      { label: Math.round(correct).toLocaleString("en-US") + " ft\u00B2", num: correct, correct: true },
      { label: Math.round(simp).toLocaleString("en-US") + " ft\u00B2", num: simp, correct: false },
      { label: Math.round(dHalf).toLocaleString("en-US") + " ft\u00B2", num: dHalf, correct: false },
      { label: Math.round(dMean).toLocaleString("en-US") + " ft\u00B2", num: dMean, correct: false }
    ],
    solution: solution
  };
}));

/* ---- surveying-042: Simpson's 1/3 rule ---- */
reg(buildGenerator({
  baseId: "surveying-042", topic: "Surveying", subtopic: "Simpson's 1/3 rule with offsets",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "The traps are the trapezoidal weighting, tripling, and swapping the 4/2 pattern.",
  videoUrl: null, videoTitle: null
}, function () {
  var r = rollOffsets(), w = r.w, o = r.o;
  var sumIn = o[1] + o[2] + o[3] + o[4] + o[5];
  var correct = w / 3 * (o[0] + 4 * o[1] + 2 * o[2] + 4 * o[3] + 2 * o[4] + 4 * o[5] + o[6]);
  var trap = w * (o[0] / 2 + sumIn + o[6] / 2);
  var dTriple = 3 * correct;
  var dSwap = w / 3 * (o[0] + 2 * o[1] + 4 * o[2] + 2 * o[3] + 4 * o[4] + 2 * o[5] + o[6]);
  var question = "Seven equally spaced offsets (" + offsetsText(o) + " ft) at w = " + w + " ft, what is the area by Simpson's 1/3 rule?";
  var solution = "Refer to Area formulas (Simpson's 1/3 Rule) in the Civil Engineering chapter of the FE Reference Handbook (v10.6), printed page 316 (PDF page 322).\n\n" +
    "$$A = \\frac{w}{3}(h_0 + 4h_1 + 2h_2 + 4h_3 + 2h_4 + 4h_5 + h_6) = " + correct.toFixed(1) + "\\ \\text{ft}^2$$";
  return {
    variantKey: "w" + w + "_" + o.join("-"),
    question: question, diagram: dSurvOffsets(o, w),
    options: [
      { label: correct.toFixed(1) + " ft\u00B2", num: correct, correct: true },
      { label: trap.toFixed(1) + " ft\u00B2", num: trap, correct: false },
      { label: dTriple.toFixed(1) + " ft\u00B2", num: dTriple, correct: false },
      { label: dSwap.toFixed(1) + " ft\u00B2", num: dSwap, correct: false }
    ],
    solution: solution
  };
}));

/* ---- surveying-044: average end area ---- */
reg(buildGenerator({
  baseId: "surveying-044", topic: "Surveying", subtopic: "Average end area volume",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Forgetting to convert ft\u00B3 to yd\u00B3, dropping the 1/2, or halving the volume gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var A1 = pick([400, 450, 500, 550]);
  var A2 = pick([340, 380, 420, 460]);
  var L = pick([50, 100, 150, 200]);
  var ft3 = (A1 + A2) / 2 * L;
  var correct = ft3 / 27;
  var dNo27 = ft3;
  var dNoHalf = (A1 + A2) * L / 27;
  var dDouble = correct / 2;
  var question = "Two cross sections " + L + " ft apart have end areas of " + A1 + " ft\u00B2 and " + A2 + " ft\u00B2. What is the volume between them in cubic yards by the average end area method?";
  var solution = "Refer to Earthwork formulas (Average End Area Formula) in the Civil Engineering chapter of the FE Reference Handbook (v10.6), printed page 315 (PDF page 321).\n\n" +
    "$$V = \\frac{A_1 + A_2}{2} \\times L = \\frac{" + A1 + " + " + A2 + "}{2} \\times " + L + " = " + Math.round(ft3).toLocaleString("en-US") + "\\ \\text{ft}^3 = " + Math.round(correct).toLocaleString("en-US") + "\\ \\text{yd}^3$$";
  return {
    variantKey: "A1_" + A1 + "_A2_" + A2 + "_L" + L,
    question: question, diagram: dSurvEndArea(A1, A2, L),
    options: [
      { label: Math.round(correct).toLocaleString("en-US") + " yd\u00B3", num: correct, correct: true },
      { label: Math.round(dNo27).toLocaleString("en-US") + " yd\u00B3", num: dNo27, correct: false },
      { label: Math.round(dNoHalf).toLocaleString("en-US") + " yd\u00B3", num: dNoHalf, correct: false },
      { label: Math.round(dDouble).toLocaleString("en-US") + " yd\u00B3", num: dDouble, correct: false }
    ],
    solution: solution
  };
}));

/* ---- surveying-045: prismoidal formula ---- */
reg(buildGenerator({
  baseId: "surveying-045", topic: "Surveying", subtopic: "Prismoidal formula",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "The traps are the average-end-area value, leaving the answer in ft\u00B3, and halving the prismoidal volume.",
  videoUrl: null, videoTitle: null
}, function () {
  var A1 = pick([400, 450, 500, 550]);
  var A2 = pick([340, 380, 420, 460]);
  var Am = pick([380, 420, 460, 500]);
  var L = pick([50, 100, 150, 200]);
  var ft3 = L / 6 * (A1 + 4 * Am + A2);
  var correct = ft3 / 27;
  var dAEA = (A1 + A2) / 2 * L / 27;
  var dNo27 = ft3;
  var dHalf = correct / 2;
  var question = "Two cross sections " + L + " ft apart have areas of " + A1 + " ft\u00B2 and " + A2 + " ft\u00B2. The section midway between them has an area of " + Am + " ft\u00B2. What volume in cubic yards does the prismoidal formula give?";
  var solution = "Refer to Earthwork formulas (Prismoidal Formula) in the Civil Engineering chapter of the FE Reference Handbook (v10.6), printed page 315 (PDF page 321).\n\n" +
    "$$V = \\frac{L}{6}(A_1 + 4A_m + A_2) = \\frac{" + L + "}{6}(" + A1 + " + 4(" + Am + ") + " + A2 + ") = " + Math.round(ft3).toLocaleString("en-US") + "\\ \\text{ft}^3 = " + Math.round(correct).toLocaleString("en-US") + "\\ \\text{yd}^3$$";
  return {
    variantKey: "A1_" + A1 + "_Am" + Am + "_A2_" + A2 + "_L" + L,
    question: question, diagram: dSurvEndArea(A1, A2, L, Am),
    options: [
      { label: Math.round(correct).toLocaleString("en-US") + " yd\u00B3", num: correct, correct: true },
      { label: Math.round(dAEA).toLocaleString("en-US") + " yd\u00B3", num: dAEA, correct: false },
      { label: Math.round(dNo27).toLocaleString("en-US") + " yd\u00B3", num: dNo27, correct: false },
      { label: Math.round(dHalf).toLocaleString("en-US") + " yd\u00B3", num: dHalf, correct: false }
    ],
    solution: solution
  };
}));

/* ---- surveying-046: pyramid stockpile ---- */
reg(buildGenerator({
  baseId: "surveying-046", topic: "Surveying", subtopic: "Volume of a pyramid-shaped stockpile",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "V = base area x h/3; omitting the /3, using /2, or converting to yd\u00B3 when ft\u00B3 are asked gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var a = pick([30, 40, 50, 60]);
  var b = pick([20, 30, 40]);
  var h = pick([10, 12, 15, 18]);
  var correct = a * b * h / 3;
  var dNoThird = a * b * h;
  var dHalf = a * b * h / 2;
  var dYd = correct / 27;
  var question = "A pyramid-shaped stockpile has a rectangular base of " + a + " ft by " + b + " ft and a height of " + h + " ft. What is its volume?";
  var solution = "Refer to Earthwork formulas (Pyramid or Cone) in the Civil Engineering chapter of the FE Reference Handbook (v10.6), printed page 315 (PDF page 321).\n\n" +
    "$$V = \\frac{1}{3}(" + a + " \\times " + b + ")(" + h + ") = " + Math.round(correct).toLocaleString("en-US") + "\\ \\text{ft}^3$$";
  return {
    variantKey: "a" + a + "_b" + b + "_h" + h,
    question: question, diagram: dSurvPyramid(a, b, h),
    options: [
      { label: Math.round(correct).toLocaleString("en-US") + " ft\u00B3", num: correct, correct: true },
      { label: Math.round(dNoThird).toLocaleString("en-US") + " ft\u00B3", num: dNoThird, correct: false },
      { label: Math.round(dHalf).toLocaleString("en-US") + " ft\u00B3", num: dHalf, correct: false },
      { label: Math.round(dYd).toLocaleString("en-US") + " ft\u00B3", num: dYd, correct: false }
    ],
    solution: solution
  };
}));

/* ---- surveying-047: conical stockpile ---- */
reg(buildGenerator({
  baseId: "surveying-047", topic: "Surveying", subtopic: "Volume of a conical stockpile",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Leaving the volume in ft\u00B3 or using the cylinder formula gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var r = pick([10, 12, 15, 18, 20]);
  var h = pick([12, 15, 20, 25]);
  var ft3 = Math.PI * r * r * h / 3;
  var correct = ft3 / 27;
  var dFt = ft3;
  var dCyl = Math.PI * r * r * h / 27;
  var dHalf = correct / 2;
  var question = "A conical stockpile of sand has a base radius of " + r + " ft and a height of " + h + " ft. What volume of sand is in the pile, in cubic yards?";
  var solution = "Refer to Earthwork formulas (Pyramid or Cone) in the Civil Engineering chapter of the FE Reference Handbook (v10.6), printed page 315 (PDF page 321).\n\n" +
    "$$V = \\frac{\\pi r^2 h}{3} = \\frac{\\pi (" + r + ")^2 (" + h + ")}{3} = " + Math.round(ft3).toLocaleString("en-US") + "\\ \\text{ft}^3 = " + correct.toFixed(1) + "\\ \\text{yd}^3$$";
  return {
    variantKey: "r" + r + "_h" + h,
    question: question, diagram: dSurvCone(r, h),
    options: [
      { label: correct.toFixed(1) + " yd\u00B3", num: correct, correct: true },
      { label: Math.round(dFt).toLocaleString("en-US") + " yd\u00B3", num: dFt, correct: false },
      { label: dCyl.toFixed(1) + " yd\u00B3", num: dCyl, correct: false },
      { label: dHalf.toFixed(1) + " yd\u00B3", num: dHalf, correct: false }
    ],
    solution: solution
  };
}));

/* ---- surveying-048: shrinkage adjustment ---- */
reg(buildGenerator({
  baseId: "surveying-048", topic: "Surveying", subtopic: "Adjusting fill for shrinkage",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The handbook multiplies by the shrinkage factor; dividing by it, adding only the increment, or squaring it gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([8000, 10000, 12000, 15000, 18000]);
  var s = pick([1.15, 1.20, 1.25, 1.30]);
  var correct = V * s;
  var dDiv = V / s;
  var dIncr = V * (s - 1);
  var dSq = V * s * s;
  var question = "The design requires " + V.toLocaleString("en-US") + " yd\u00B3 of compacted fill. The handbook adjusts earthwork for shrinkage by increasing fill by the shrinkage factor. Using a shrinkage factor of " + s.toFixed(2) + ", what volume of fill must be provided?";
  var solution = "Refer to Mass haul diagram (shrinkage note) in the Civil Engineering chapter of the FE Reference Handbook (v10.6), printed page 315 (PDF page 321).\n\n" +
    "$$V_{fill} = " + V.toLocaleString("en-US") + " \\times " + s.toFixed(2) + " = " + Math.round(correct).toLocaleString("en-US") + "\\ \\text{yd}^3$$";
  return {
    variantKey: "V" + V + "_s" + s,
    question: question,
    options: [
      { label: Math.round(correct).toLocaleString("en-US") + " yd\u00B3", num: correct, correct: true },
      { label: Math.round(dDiv).toLocaleString("en-US") + " yd\u00B3", num: dDiv, correct: false },
      { label: Math.round(dIncr).toLocaleString("en-US") + " yd\u00B3", num: dIncr, correct: false },
      { label: Math.round(dSq).toLocaleString("en-US") + " yd\u00B3", num: dSq, correct: false }
    ],
    solution: solution
  };
}));

/* ---- surveying-049: mass haul ordinate ---- */
reg(buildGenerator({
  baseId: "surveying-049", topic: "Surveying", subtopic: "Mass haul ordinate",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "The traps are the sign flip, the peak ordinate, and the sum of absolute quantities.",
  videoUrl: null, videoTitle: null
}, function () {
  var c1 = pick([800, 1000, 1200]), c2 = pick([600, 800, 1000]), f1 = pick([400, 600, 800]), f2 = pick([1000, 1500, 1800]), c3 = pick([300, 500, 700]);
  var seq = [c1, c2, -f1, -f2, c3];
  var run = 0, peak = 0, absSum = 0;
  for (var i = 0; i < 5; i++) { run += seq[i]; if (run > peak) peak = run; absSum += Math.abs(seq[i]); }
  var correct = run;
  var question = "A roadway has the following net quantities between successive stations: +" + c1.toLocaleString("en-US") + " yd\u00B3 (cut), +" + c2.toLocaleString("en-US") + " yd\u00B3 (cut), -" + f1.toLocaleString("en-US") + " yd\u00B3 (fill), -" + f2.toLocaleString("en-US") + " yd\u00B3 (fill), +" + c3.toLocaleString("en-US") + " yd\u00B3 (cut). The mass haul ordinate is zero at the start. Counting cut as positive and fill as negative, what is the ordinate after the last station?";
  var solution = "Refer to Earthwork formulas (Mass Haul Diagram) in the Civil Engineering chapter of the FE Reference Handbook (v10.6), printed page 315 (PDF page 321).\n\n" +
    "Running sum: " + seq.map(function (v, i) { var t = seq.slice(0, i + 1).reduce(function (a, b) { return a + b; }, 0); return t.toLocaleString("en-US"); }).join(", ") + " yd\u00B3. Final ordinate = " + correct.toLocaleString("en-US") + " yd\u00B3.";
  return {
    variantKey: seq.join("_"),
    question: question,
    options: [
      { label: correct.toLocaleString("en-US") + " yd\u00B3", num: correct, correct: true },
      { label: (-correct).toLocaleString("en-US") + " yd\u00B3", num: -correct, correct: false },
      { label: peak.toLocaleString("en-US") + " yd\u00B3", num: peak, correct: false },
      { label: absSum.toLocaleString("en-US") + " yd\u00B3", num: absSum, correct: false }
    ],
    solution: solution
  };
}));

  window.SURVEYING_GENERATORS = SURVEYING_ENTRIES;
})();
