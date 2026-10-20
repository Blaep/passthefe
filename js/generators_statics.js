/* PassTheFE randomized practice — Statics generator templates.
 *
 * Plain script (no modules) for the static site. Defines window.STATICS_GENERATORS:
 * one entry per NUMERICAL Statics bank question. Skipped: statics-014
 * (zero-force members) and statics-020 (two-force members) — purely
 * conceptual, no numbers to roll.
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

  function r0(x) { return Math.round(x); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function r2(x) { return Math.round(x * 100) / 100; }
  // variantKey-safe encoding of a number: "." -> "p", "-" -> "m".
  function pdot(x) { return String(x).replace(/\./g, "p").replace(/-/g, "m"); }

  var SUPD = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  function supInt(e) {
    var s = e < 0 ? "⁻" : "";
    var d = String(Math.abs(e)).split("");
    for (var i = 0; i < d.length; i++) s += SUPD[d[i]];
    return s;
  }
  function sciLbl(mant, e, unit) { return fmt(mant) + " × 10" + supInt(e) + " " + unit; }
  // Two-decimal variant that preserves trailing zeros: sci2(4.5e8, "mm⁴") -> "4.50 × 10⁸ mm⁴".
  function sci2(x, unit) {
    var e = Math.floor(Math.log10(x));
    var m = x / Math.pow(10, e);
    var ms = m.toFixed(2);
    if (ms === "10.00") { ms = "1.00"; e += 1; }
    return ms + " × 10" + supInt(e) + " " + unit;
  }

  // "(3i + 4j - 5k)" for use inside \(...\), ASCII hyphen, \mathbf unit vectors.
  function vec3(x, y, z) {
    var parts = [[x, "i"], [y, "j"], [z, "k"]];
    var s = "(";
    for (var k = 0; k < 3; k++) {
      var v = parts[k][0], u = parts[k][1];
      if (k === 0) s += (v < 0 ? "-" : "") + fmt(Math.abs(v)) + "\\mathbf{" + u + "}";
      else s += (v < 0 ? " - " : " + ") + fmt(Math.abs(v)) + "\\mathbf{" + u + "}";
    }
    return s + ")";
  }
  // Same, but drops zero components: "(3i + 4j)".
  function vec3nz(x, y, z) {
    var parts = [];
    if (x !== 0) parts.push([x, "i"]);
    if (y !== 0) parts.push([y, "j"]);
    if (z !== 0) parts.push([z, "k"]);
    var s = "(";
    for (var k = 0; k < parts.length; k++) {
      var v = parts[k][0], u = parts[k][1];
      if (k === 0) s += (v < 0 ? "-" : "") + fmt(Math.abs(v)) + "\\mathbf{" + u + "}";
      else s += (v < 0 ? " - " : " + ") + fmt(Math.abs(v)) + "\\mathbf{" + u + "}";
    }
    return s + ")";
  }

  // Wraps a roll() function with the app-integration contract. roll() returns
  // { variantKey, question, options: [{label, num|null, correct}], solution }.
  // The wrapper shuffles the options, enforces pairwise-distinct labels (and
  // pairwise-distinct numeric values where present) with a retry loop, and
  // returns the contracted generate() payload.
  function buildGenerator(meta, roll) {
    return {
      baseId: meta.baseId,
      topic: meta.topic || "Statics",
      subtopic: meta.subtopic,
      difficulty: meta.difficulty,
      estimatedTimeSeconds: meta.estimatedTimeSeconds,
      explanation: meta.explanation,
      videoUrl: meta.videoUrl,
      videoTitle: meta.videoTitle,
      tiTip: meta.tiTip,
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
            topic: meta.topic || "Statics",
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
  var STAT_ENTRIES = [];
  function reg(e) { STAT_ENTRIES.push(e); return e; }
/* ---- statics-001: resultant of two perpendicular forces ---- */
reg(buildGenerator({
  baseId: "statics-001",
  topic: "Statics",
  subtopic: "Resultant of concurrent forces",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "The classic 3-4-5 triangle appears constantly in statics. Recognizing Pythagorean triples saves time.",
  videoUrl: "https://www.youtube.com/watch?v=R5NVwAb94Yo",
  videoTitle: "How to Find the Resultant of Three Force Vectors – Statics Components and Resultants Problem 18"
}, function () {
  var F1, F2;
  do { F1 = ri(3, 12); F2 = ri(3, 12); } while (F1 === F2);
  var R = Math.sqrt(F1 * F1 + F2 * F2);
  var dSum = F1 + F2;                 // trap: added the components as scalars
  var dNoRoot = F1 * F1 + F2 * F2;    // trap: skipped the square root
  var dDiff = Math.abs(F1 - F2);      // trap: subtracted instead of Pythagoras
  // Setup diagram (never the answer): the two given forces at right angles
  // acting on one point. The resultant is not drawn.
  var d001 = (function () {
    var ox = 150, oy = 250, k = 15, L1 = 40 + k * F1, L2 = 40 + k * F2, s = "";
    s += SVG_HDR + AH;
    s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + L1) + '" y2="' + oy + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + ox + '" y2="' + (oy - L2) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<path d="M' + (ox + 16) + ',' + oy + ' L' + (ox + 16) + ',' + (oy - 16) + ' L' + ox + ',' + (oy - 16) + '" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>';
    s += '<circle cx="' + ox + '" cy="' + oy + '" r="5" fill="#1a1a1a"/>';
    s += '<text x="' + (ox + L1 + 12) + '" y="' + (oy + 6) + '" font-family="Georgia,serif" font-size="26" fill="#1d4ed8">' + F1 + ' N</text>';
    s += '<text x="' + (ox + 14) + '" y="' + (oy - L2 + 6) + '" font-family="Georgia,serif" font-size="26" fill="#1d4ed8">' + F2 + ' N</text>';
    s += '<text x="' + (ox - 22) + '" y="' + (oy + 22) + '" font-family="Georgia,serif" font-size="22" fill="#1a1a1a">A</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "Two perpendicular forces of " + F1 + " N and " + F2 +
    " N act at a point. What is the magnitude of their resultant?";
  var solution = "Refer to the Concurrent Forces section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(R\\), the magnitude of the resultant. Perpendicular components combine by the Pythagorean theorem:\n\n" +
    "$$R = \\sqrt{F_1^2 + F_2^2}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(R\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "F_1 &= " + F1 + "\\ \\text{N} \\\\\n" +
    "F_2 &= " + F2 + "\\ \\text{N} \\\\\n" +
    "R &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(R) = \\sqrt{(" + F1 + ")^2 + (" + F2 + ")^2} = \\sqrt{" + (F1 * F1 + F2 * F2) + "}$$\n\n" +
    "$$(R) = " + fmt(R) + "\\ \\text{N}$$";
  return {
    variantKey: "res-" + F1 + "-" + F2,
    question: question,
    options: [
      { label: fmt(R) + " N", num: R, correct: true },
      { label: fmt(dSum) + " N", num: dSum, correct: false },
      { label: fmt(dNoRoot) + " N", num: dNoRoot, correct: false },
      { label: fmt(dDiff) + " N", num: dDiff, correct: false }
    ],
    solution: solution,
    diagram: d001
  };
}));

/* ---- statics-002: moment about a point ---- */
reg(buildGenerator({
  baseId: "statics-002",
  topic: "Statics",
  subtopic: "Moment about a point",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Moment problems are gimmes if you use the perpendicular distance and check the rotation direction. Common slips: dividing instead of multiplying, or flipping clockwise/counterclockwise.",
  videoUrl: "https://www.youtube.com/watch?v=QNNnPZ68STI",
  videoTitle: "Moment of a Force"
}, function () {
  var F = pick([100, 150, 200, 250, 300, 400, 500]);
  var d = pick([0.5, 0.75, 1.25, 1.5, 2.0, 2.5, 3.0]); // d = 1 excluded: F/d would equal F*d
  var M = F * d;                    // clockwise
  var dDiv = F / d;                 // trap: divided instead of multiplying
  var dDbl = 2 * F * d;             // trap: doubled the moment arm
  // Direction is sign-encoded in num: clockwise positive.
  // Setup diagram (never the answer): beam, point O, the downward force
  // at distance d. The moment is not drawn.
  var d002 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var ox = 90, fx = ox + 100 * d, s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img">' + AHK2;
    s += '<rect x="40" y="150" width="370" height="10" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<circle cx="' + ox + '" cy="155" r="5" fill="#1a1a1a"/>';
    s += '<text x="' + ox + '" y="135" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#1a1a1a">O</text>';
    s += '<line x1="' + fx + '" y1="70" x2="' + fx + '" y2="146" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + fx + '" y="60" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">' + F + ' N</text>';
    s += '<line x1="' + ox + '" y1="210" x2="' + fx + '" y2="210" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + (ox + 2) + '" y1="210" x2="' + (ox + 26) + '" y2="210" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + (fx - 2) + '" y1="210" x2="' + (fx - 26) + '" y2="210" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + ox + '" y1="204" x2="' + ox + '" y2="216" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + fx + '" y1="204" x2="' + fx + '" y2="216" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<text x="' + r1((ox + fx) / 2) + '" y="202" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">' + fmt(d) + ' m</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A " + F + " N vertical force acts downward at a point located " + fmt(d) +
    " m horizontally from point O on a rigid beam. What is the moment of the force about point O?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(M_O\\), the moment about point O. The moment is the force times the perpendicular distance; the downward force to the right of O tends to rotate the beam clockwise:\n\n" +
    "$$M_O = F\\,d\\ \\text{(clockwise)}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(M_O\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "F &= " + F + "\\ \\text{N} \\\\\n" +
    "d &= " + fmt(d) + "\\ \\text{m} \\\\\n" +
    "M_O &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(M_O) = (" + F + ")(" + fmt(d) + ") = " + fmt(M) + "\\ \\text{N-m clockwise}$$";
  return {
    variantKey: "mom-F" + F + "-d" + pdot(d),
    question: question,
    diagram: d002,
    options: [
      { label: fmt(M) + " N-m clockwise", num: M, correct: true },
      { label: fmt(dDiv) + " N-m clockwise", num: dDiv, correct: false },
      { label: fmt(dDbl) + " N-m clockwise", num: dDbl, correct: false },
      { label: fmt(M) + " N-m counterclockwise", num: -M, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-003: truss analysis, method of joints (roof truss) ---- */
reg(buildGenerator({
  baseId: "statics-003",
  topic: "Statics",
  subtopic: "Truss analysis (method of joints)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Method of joints always starts at a joint with at most two unknowns. The sign convention trap: a negative member force means compression, not tension.",
  videoUrl: "https://www.youtube.com/watch?v=_rK02neOF18",
  videoTitle: "Trusses Method of Joints"
}, function () {
  var L = pick([4, 6, 8]);
  var h = pick([2, 3, 4]);
  var P = pick([5, 10, 15, 20, 25, 30]);
  var half = L / 2;
  var sinT = h / Math.sqrt(half * half + h * h);
  var mag = r2((P / 2) / sinT);          // magnitude of FAC
  var dFull = r2(P / sinT);              // trap: used the full load P at joint A
  var dTan = r2((P / 2) * half / h);     // trap: resolved with tan instead of sin
  // Compression is sign-encoded negative in num.
  // Setup diagram (never the answer): the truss with supports, load P at C,
  // and member AC identified. Tension/compression is not shown.
  var d003 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var sc = Math.min(340 / L, 160 / h, 85);
    var ax = (480 - sc * L) / 2, ay = 250, bx = ax + sc * L, cx = ax + sc * L / 2, cy = 250 - sc * h;
    var acLen = Math.sqrt(h * h + (L / 2) * (L / 2));
    var nx = -h / acLen, ny = -(L / 2) / acLen;   // outward normal of AC (up-left)
    var mx = (ax + cx) / 2 + 20 * nx, my = (ay + cy) / 2 + 20 * ny;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="330" viewBox="0 0 480 330" role="img">' + AHK2;
    s += '<line x1="' + r1(ax) + '" y1="' + ay + '" x2="' + r1(bx) + '" y2="' + ay + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(ax) + '" y1="' + ay + '" x2="' + r1(cx) + '" y2="' + r1(cy) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(bx) + '" y1="' + ay + '" x2="' + r1(cx) + '" y2="' + r1(cy) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(ax) + '" y1="' + ay + '" x2="' + r1(cx) + '" y2="' + r1(cy) + '" stroke="#1d4ed8" stroke-width="5" stroke-opacity="0.45"/>';
    s += '<path d="M' + r1(ax - 17) + ',' + ay + ' L' + r1(ax + 17) + ',' + ay + ' L' + r1(ax) + ',' + (ay + 24) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + r1(ax - 31) + '" y1="' + (ay + 24) + '" x2="' + r1(ax + 31) + '" y2="' + (ay + 24) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(ax - 23) + '" y1="' + (ay + 24) + '" x2="' + r1(ax - 33) + '" y2="' + (ay + 36) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    s += '<line x1="' + r1(ax) + '" y1="' + (ay + 24) + '" x2="' + r1(ax - 10) + '" y2="' + (ay + 36) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    s += '<line x1="' + r1(ax + 23) + '" y1="' + (ay + 24) + '" x2="' + r1(ax + 13) + '" y2="' + (ay + 36) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    s += '<path d="M' + r1(bx - 17) + ',' + ay + ' L' + r1(bx + 17) + ',' + ay + ' L' + r1(bx) + ',' + (ay + 22) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<circle cx="' + r1(bx - 9) + '" cy="' + (ay + 29) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<circle cx="' + r1(bx + 9) + '" cy="' + (ay + 29) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + r1(bx - 31) + '" y1="' + (ay + 36) + '" x2="' + r1(bx + 31) + '" y2="' + (ay + 36) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(bx - 23) + '" y1="' + (ay + 36) + '" x2="' + r1(bx - 33) + '" y2="' + (ay + 48) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    s += '<line x1="' + r1(bx) + '" y1="' + (ay + 36) + '" x2="' + r1(bx - 10) + '" y2="' + (ay + 48) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    s += '<line x1="' + r1(bx + 23) + '" y1="' + (ay + 36) + '" x2="' + r1(bx + 13) + '" y2="' + (ay + 48) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    s += '<line x1="' + r1(cx) + '" y1="' + r1(cy - 58) + '" x2="' + r1(cx) + '" y2="' + r1(cy - 6) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(cx) + '" y="' + r1(cy - 66) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">' + P + ' kN</text>';
    s += '<circle cx="' + r1(ax) + '" cy="' + ay + '" r="4" fill="#1a1a1a"/>';
    s += '<circle cx="' + r1(bx) + '" cy="' + ay + '" r="4" fill="#1a1a1a"/>';
    s += '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="4" fill="#1a1a1a"/>';
    s += '<text x="' + r1(ax - 24) + '" y="' + (ay + 6) + '" text-anchor="end" font-family="Georgia,serif" font-size="18" fill="#1a1a1a">A</text>';
    s += '<text x="' + r1(bx + 24) + '" y="' + (ay + 6) + '" text-anchor="start" font-family="Georgia,serif" font-size="18" fill="#1a1a1a">B</text>';
    s += '<text x="' + r1(cx) + '" y="' + r1(cy + 26) + '" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#1a1a1a">C</text>';
    s += '<text x="' + r1(mx) + '" y="' + r1(my) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">AC</text>';
    s += '<line x1="' + r1(ax) + '" y1="306" x2="' + r1(bx) + '" y2="306" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(ax + 2) + '" y1="306" x2="' + r1(ax + 26) + '" y2="306" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(bx - 2) + '" y1="306" x2="' + r1(bx - 26) + '" y2="306" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(ax) + '" y1="300" x2="' + r1(ax) + '" y2="312" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(bx) + '" y1="300" x2="' + r1(bx) + '" y2="312" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<text x="' + r1((ax + bx) / 2) + '" y="298" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">' + L + ' m</text>';
    var xR = r1(bx + 45);
    s += '<line x1="' + xR + '" y1="' + ay + '" x2="' + xR + '" y2="' + r1(cy + 20) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + xR + '" y1="' + r1(cy) + '" x2="' + xR + '" y2="' + r1(ay - 20) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(bx + 8) + '" y1="' + ay + '" x2="' + r1(bx + 52) + '" y2="' + ay + '" stroke="#1a1a1a" stroke-width="1"/>';
    s += '<line x1="' + r1(cx + 8) + '" y1="' + r1(cy) + '" x2="' + r1(bx + 52) + '" y2="' + r1(cy) + '" stroke="#1a1a1a" stroke-width="1"/>';
    s += '<text x="' + r1(bx + 37) + '" y="' + r1((ay + cy) / 2 + 5) + '" text-anchor="end" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">' + h + ' m</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A simple symmetric roof truss has a pin support at A (0, 0), a roller support at B (" + L +
    " m, 0), and a peak joint C at (" + fmt(half) + " m, " + h + " m). A vertical downward load of " + P +
    " kN acts at joint C. Using the method of joints, determine the force in top-chord member AC.";
  var solution = "Refer to the Plane Truss: Method of Joints section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(F_{AC}\\), the force in top-chord member AC. By symmetry the vertical reactions are:\n\n" +
    "$$A_y = B_y = \\frac{" + P + "}{2} = " + fmt(P / 2) + "\\ \\text{kN}$$\n\n" +
    "The top chord makes an angle \\(\\theta\\) above the horizontal:\n\n" +
    "$$(\\theta) = \\tan^{-1}\\left(\\frac{" + h + "}{" + fmt(half) + "}\\right) = " + fmt(r1(Math.atan(h / half) * 180 / Math.PI)) + "^\\circ,\\quad \\sin\\theta = " + fmt(sinT) + "$$\n\n" +
    "Apply vertical equilibrium at joint A (members AB and AC meet there):\n\n" +
    "$$\\sum F_y = 0 \\;\\rightarrow\\; A_y + F_{AC}\\,\\sin\\theta = 0$$\n\n" +
    "$$(F_{AC}) = \\frac{-" + fmt(P / 2) + "}{" + fmt(sinT) + "} = " + texNum(-mag) + "\\ \\text{kN}$$\n\n" +
    "The negative sign means the member pushes on the joint: \\(" + fmt(mag) + "\\ \\text{kN (C)}\\).";
  return {
    variantKey: "trj-L" + L + "-h" + h + "-P" + P,
    question: question,
    diagram: d003,
    options: [
      { label: fmt(mag) + " kN (C)", num: -mag, correct: true },
      { label: fmt(mag) + " kN (T)", num: mag, correct: false },
      { label: fmt(dFull) + " kN (C)", num: -dFull, correct: false },
      { label: fmt(dTan) + " kN (C)", num: -dTan, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-004: centroid of composite area (rectangle + triangle) ---- */
reg(buildGenerator({
  baseId: "statics-004",
  topic: "Statics",
  subtopic: "Centroid of composite areas",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Composite centroids use area-weighted averages. The classic triangle trap: its centroid is 1/3 of the height from the base, not 1/2.",
  videoUrl: "https://www.youtube.com/watch?v=B6UBikXkAqk",
  videoTitle: "Centroid & Centre of Gravity"
}, function () {
  var b, H, t, A1, y1, A2, y2, yb, dHalf, dMid, dAvg;
  do {
    b = pick([2, 3, 4, 5]);
    H = pick([2, 3, 4]);
    t = pick([1, 2, 3]);
    A1 = b * H; y1 = H / 2;
    A2 = b * t / 2; y2 = H + t / 3;
    yb = r2((A1 * y1 + A2 * y2) / (A1 + A2));
    dHalf = r2((A1 * y1 + A2 * (H + t / 2)) / (A1 + A2)); // trap: triangle centroid at t/2
    dMid = r2(H + t / 2);                                // trap: midpoint of the total height
    dAvg = r2((y1 + y2) / 2);                            // trap: unweighted average of centroids
  } while (new Set([yb, dHalf, dMid, dAvg]).size !== 4);
  // Setup diagram (never the answer): the composite outline with the
  // given dimensions; the centroid location is marked as the unknown.
  var d004 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker></defs>';
    var sc = Math.min(70, 240 / b, 250 / (H + t));
    var w = sc * b, x0 = (480 - w) / 2, yBot = 300, yTop = 300 - sc * H, apx = x0 + w / 2, apy = yTop - sc * t;
    var ybr = yBot - 0.45 * sc * H;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="370" viewBox="0 0 480 370" role="img">' + AHK2;
    s += '<path d="M ' + r1(x0) + ',' + yBot + ' L ' + r1(x0) + ',' + r1(yTop) + ' L ' + r1(apx) + ',' + r1(apy) + ' L ' + r1(x0 + w) + ',' + r1(yTop) + ' L ' + r1(x0 + w) + ',' + yBot + ' Z" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(x0) + '" y1="' + r1(yTop) + '" x2="' + r1(x0 + w) + '" y2="' + r1(yTop) + '" stroke="#1a1a1a" stroke-width="1.6" stroke-dasharray="7,5"/>';
    s += '<line x1="' + r1(x0 - 10) + '" y1="' + r1(ybr) + '" x2="' + r1(x0 + w + 65) + '" y2="' + r1(ybr) + '" stroke="#1a1a1a" stroke-width="1.4" stroke-dasharray="7,5"/>';
    s += '<circle cx="' + r1(x0 + w / 2) + '" cy="' + r1(ybr) + '" r="5" fill="#1d4ed8"/>';
    s += '<line x1="' + r1(x0 - 70) + '" y1="' + r1(ybr) + '" x2="' + r1(x0 - 70) + '" y2="' + yBot + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 - 70) + '" y1="' + r1(ybr + 2) + '" x2="' + r1(x0 - 70) + '" y2="' + r1(ybr + 26) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 - 70) + '" y1="' + (yBot - 2) + '" x2="' + r1(x0 - 70) + '" y2="' + (yBot - 26) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 - 92) + '" y="' + r1((ybr + yBot) / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a" transform="rotate(-90 ' + r1(x0 - 92) + ' ' + r1((ybr + yBot) / 2) + ')">y-bar = ?</text>';
    s += '<line x1="' + r1(x0 - 30) + '" y1="' + r1(yTop) + '" x2="' + r1(x0 - 30) + '" y2="' + yBot + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 - 30) + '" y1="' + r1(yTop + 2) + '" x2="' + r1(x0 - 30) + '" y2="' + r1(yTop + 26) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 - 30) + '" y1="' + (yBot - 2) + '" x2="' + r1(x0 - 30) + '" y2="' + (yBot - 26) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 - 50) + '" y="' + r1((yTop + yBot) / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a" transform="rotate(-90 ' + r1(x0 - 50) + ' ' + r1((yTop + yBot) / 2) + ')">' + H + ' m</text>';
    s += '<line x1="' + r1(x0 + w + 30) + '" y1="' + r1(apy) + '" x2="' + r1(x0 + w + 30) + '" y2="' + r1(yTop) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 + w + 30) + '" y1="' + r1(apy + 2) + '" x2="' + r1(x0 + w + 30) + '" y2="' + r1(apy + 26) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 + w + 30) + '" y1="' + r1(yTop - 2) + '" x2="' + r1(x0 + w + 30) + '" y2="' + r1(yTop - 26) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 + w + 52) + '" y="' + r1((apy + yTop) / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a" transform="rotate(-90 ' + r1(x0 + w + 52) + ' ' + r1((apy + yTop) / 2) + ')">' + t + ' m</text>';
    s += '<line x1="' + r1(x0) + '" y1="330" x2="' + r1(x0 + w) + '" y2="330" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 + 2) + '" y1="330" x2="' + r1(x0 + 26) + '" y2="330" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 + w - 2) + '" y1="330" x2="' + r1(x0 + w - 26) + '" y2="330" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 + w / 2) + '" y="322" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">' + b + ' m</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A composite cross-section consists of a " + b + " m wide by " + H +
    " m tall rectangle with a triangle (base " + b + " m, height " + t +
    " m) sitting on top of it, the triangle's base coinciding with the top of the rectangle. " +
    "Measured from the bottom of the rectangle, what is the y-coordinate of the centroid of the composite area?";
  var solution = "Refer to the Centroids of Masses, Areas, Lengths, and Volumes section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\bar{y}\\), the y-coordinate of the centroid. The composite centroid is the area-weighted average:\n\n" +
    "$$\\bar{y} = \\frac{A_1 y_1 + A_2 y_2}{A_1 + A_2}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\bar{y}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "A_1 &= (" + b + ")(" + H + ") = " + fmt(A1) + "\\ \\text{m}^2,\\quad y_1 = \\frac{" + H + "}{2} = " + fmt(y1) + "\\ \\text{m} \\\\\n" +
    "A_2 &= \\frac{(" + b + ")(" + t + ")}{2} = " + fmt(A2) + "\\ \\text{m}^2,\\quad y_2 = " + H + " + \\frac{" + t + "}{3} = " + fmt(y2) + "\\ \\text{m} \\\\\n" +
    "\\bar{y} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\bar{y}) = \\frac{(" + fmt(A1) + ")(" + fmt(y1) + ") + (" + fmt(A2) + ")(" + fmt(y2) + ")}{" + fmt(A1) + " + " + fmt(A2) + "}$$\n\n" +
    "$$(\\bar{y}) = " + fmt(yb) + "\\ \\text{m}$$";
  return {
    variantKey: "cen-b" + b + "-H" + H + "-t" + t,
    question: question,
    diagram: d004,
    options: [
      { label: fmt(yb) + " m", num: yb, correct: true },
      { label: fmt(dHalf) + " m", num: dHalf, correct: false },
      { label: fmt(dMid) + " m", num: dMid, correct: false },
      { label: fmt(dAvg) + " m", num: dAvg, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-005: friction on an inclined plane ---- */
reg(buildGenerator({
  baseId: "statics-005",
  topic: "Statics",
  subtopic: "Friction on an inclined plane",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Friction always opposes impending motion: with impending slip downward, friction acts upward and assists the holding force P. The 358 N trap is the force needed to push the block UP the plane (impending motion upward).",
  videoUrl: "https://www.youtube.com/watch?v=GDzy4D9Llsg",
  videoTitle: "Determine the magnitude and direction of the friction force. Chapter 6: Friction"
}, function () {
  var W = pick([300, 400, 500, 600, 800]);
  var th = pick([25, 30, 35, 40]);
  var mu = pick([0.15, 0.20, 0.25, 0.30]); // every combo has tan(th) > mu, so P > 0
  var rad = th * Math.PI / 180;
  var P = r0(W * (Math.sin(rad) - mu * Math.cos(rad)));
  var dUp = r0(W * (Math.sin(rad) + mu * Math.cos(rad))); // trap: friction reversed (push UP the plane)
  var dNoF = r0(W * Math.sin(rad));                       // trap: ignored friction
  var dF = r0(mu * W * Math.cos(rad));                    // trap: reported the friction force alone
  // Setup diagram (never the answer): block on the incline with W, the
  // applied P marked unknown, N and friction directions. No magnitudes solved.
  var d005 = (function () {
    var radA = th * Math.PI / 180;
    var ca = Math.cos(radA), sa = Math.sin(radA);
    var p0x = 60, p0y = 280, plen = 350;
    var p1x = p0x + plen * ca, p1y = p0y - plen * sa;
    var axu = ca, ayu = -sa;          // unit vector up the plane
    var nxu = -sa, nyu = -ca;         // unit normal away from the plane
    var px = p0x + 0.52 * plen * axu, py = p0y + 0.52 * plen * ayu;
    var cbx = px + 26 * nxu, cby = py + 26 * nyu;
    function pt(x, y) { return r1(x) + ',' + r1(y); }
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="340" viewBox="0 0 480 340" role="img">' + AH;
    s += '<line x1="' + p0x + '" y1="' + p0y + '" x2="' + r1(p1x) + '" y2="' + r1(p1y) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    for (var i = 0; i <= 10; i++) {
      var hx = p0x + (plen * i / 10) * axu, hy = p0y + (plen * i / 10) * ayu;
      s += '<line x1="' + r1(hx) + '" y1="' + r1(hy) + '" x2="' + r1(hx + 8 * sa) + '" y2="' + r1(hy + 8 * ca) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    }
    s += '<polygon points="' + pt(px - 46 * axu, py - 46 * ayu) + ' ' + pt(px + 46 * axu, py + 46 * ayu) + ' ' + pt(px + 46 * axu + 52 * nxu, py + 46 * ayu + 52 * nyu) + ' ' + pt(px - 46 * axu + 52 * nxu, py - 46 * ayu + 52 * nyu) + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(cbx) + '" y1="' + r1(cby) + '" x2="' + r1(cbx) + '" y2="' + r1(cby + 105) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(cbx + 12) + '" y="' + r1(cby + 70) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">W = ' + W + ' N</text>';
    s += '<line x1="' + r1(cbx) + '" y1="' + r1(cby) + '" x2="' + r1(cbx + 85 * axu) + '" y2="' + r1(cby + 85 * ayu) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(cbx + 97 * axu) + '" y="' + r1(cby + 97 * ayu + 5) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">P = ?</text>';
    s += '<line x1="' + r1(cbx) + '" y1="' + r1(cby) + '" x2="' + r1(cbx + 60 * nxu) + '" y2="' + r1(cby + 60 * nyu) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(cbx + 74 * nxu) + '" y="' + r1(cby + 74 * nyu) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-style="italic" fill="#1d4ed8">N</text>';
    var ffx = px - 82 * axu + 6 * sa, ffy = py - 82 * ayu + 6 * ca;
    s += '<line x1="' + r1(ffx) + '" y1="' + r1(ffy) + '" x2="' + r1(ffx + 60 * axu) + '" y2="' + r1(ffy + 60 * ayu) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(ffx - 12 * axu - 16 * nxu) + '" y="' + r1(ffy - 12 * ayu - 16 * nyu + 5) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-style="italic" fill="#1d4ed8">F</text>';
    s += '<line x1="' + p0x + '" y1="' + p0y + '" x2="' + (p0x + 95) + '" y2="' + p0y + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<path d="M ' + (p0x + 48) + ',' + p0y + ' A 48,48 0 0,0 ' + r1(p0x + 48 * ca) + ',' + r1(p0y - 48 * sa) + '" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>';
    s += '<text x="' + r1(p0x + 66 * Math.cos(radA / 2)) + '" y="' + r1(p0y - 66 * Math.sin(radA / 2) + 5) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">' + th + '\u00b0</text>';
    s += '<text x="240" y="325" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">\u03bc\u209b = ' + fmt(mu) + '</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A " + W + " N block rests on a plane inclined at " + th +
    " degrees to the horizontal. The coefficient of static friction between the block and the plane is " + fmt(mu) +
    ". What minimum force P, applied parallel to the plane and directed up the plane, is required to keep the block from sliding down?";
  var solution = "Refer to the Friction section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(P\\). Impending motion is down the plane, so friction acts up the plane and assists \\(P\\):\n\n" +
    "$$\\sum F_{\\parallel} = 0 \\;\\rightarrow\\; P + F - W\\sin\\theta = 0$$\n\n" +
    "At impending slip \\(F = \\mu_s N\\) with \\(N = W\\cos\\theta\\):\n\n" +
    "$$(P) = W(\\sin\\theta - \\mu_s\\cos\\theta) = (" + W + ")(\\sin " + th + "^\\circ - " + fmt(mu) + "\\cos " + th + "^\\circ)$$\n\n" +
    "$$(P) = (" + W + ")(" + fmt(r2(Math.sin(rad))) + " - " + fmt(r2(mu * Math.cos(rad))) + ") = " + P + "\\ \\text{N}$$";
  return {
    variantKey: "fri-W" + W + "-th" + th + "-mu" + pdot(mu),
    question: question,
    diagram: d005,
    options: [
      { label: P + " N", num: P, correct: true },
      { label: dUp + " N", num: dUp, correct: false },
      { label: dNoF + " N", num: dNoF, correct: false },
      { label: dF + " N", num: dF, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-006: triangular distributed load, resultant location ---- */
reg(buildGenerator({
  baseId: "statics-006",
  topic: "Statics",
  subtopic: "Distributed loads (equivalent resultant)",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "The resultant of a triangular load acts 1/3 of the length from the max-intensity side. The common mistake is measuring 1/3 from the wrong end.",
  videoUrl: "https://www.youtube.com/watch?v=J3s6m9rOFPY",
  videoTitle: "Beam Reactions Under a Triangular Distributed Load"
}, function () {
  var L = pick([3, 4, 5, 6, 8, 10]);
  var w = pick([4, 5, 6, 8, 10]);
  var zeroLeft = Math.random() < 0.5;
  var d = r2(zeroLeft ? 2 * L / 3 : L / 3); // measured from the left end
  var dWrong = r2(zeroLeft ? L / 3 : 2 * L / 3); // trap: measured 1/3 from the wrong end
  var dMid = r2(L / 2);                          // trap: used the midpoint
  var dEnd = zeroLeft ? r2(L) : 0;               // trap: placed it at the max-intensity end
  var question = "A triangular distributed load varies from zero intensity at the " +
    (zeroLeft ? "left" : "right") + " end of a " + L + " m beam to a maximum intensity of " + w +
    " kN/m at the " + (zeroLeft ? "right" : "left") + " end. The equivalent concentrated resultant force acts at what distance from the left end of the beam?";
  // Setup diagram (never the answer): beam, the triangular load with its
  // zero and maximum ends, and the span. The resultant location is not drawn.
  var d006 = (function () {
    var x0 = 100, x1 = 540, by = 200, hMax = 100, svg = "", i, n = 8;
    svg += SVG_HDR + AH;
    svg += '<rect x="' + x0 + '" y="' + by + '" width="' + (x1 - x0) + '" height="10" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    for (i = 0; i <= n; i++) {
      var x = x0 + (x1 - x0) * i / n;
      var frac = zeroLeft ? i / n : 1 - i / n;
      var h = hMax * frac;
      if (h > 6) svg += '<line x1="' + x + '" y1="' + (by - h) + '" x2="' + x + '" y2="' + (by - 3) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    }
    svg += '<line x1="' + x0 + '" y1="' + (zeroLeft ? by : by - hMax) + '" x2="' + x1 + '" y2="' + (zeroLeft ? by - hMax : by) + '" stroke="#1d4ed8" stroke-width="2.5"/>';
    svg += '<text x="' + (zeroLeft ? x1 : x0) + '" y="' + (by - hMax - 12) + '" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#1d4ed8">' + w + ' kN/m</text>';
    svg += '<text x="' + (zeroLeft ? x0 : x1) + '" y="' + (by - 12) + '" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#1d4ed8">0</text>';
    svg += '<line x1="' + x0 + '" y1="250" x2="' + x1 + '" y2="250" stroke="#1a1a1a" stroke-width="1.2"/>';
    svg += '<line x1="' + x0 + '" y1="242" x2="' + x0 + '" y2="258" stroke="#1a1a1a" stroke-width="1.5"/>';
    svg += '<line x1="' + x1 + '" y1="242" x2="' + x1 + '" y2="258" stroke="#1a1a1a" stroke-width="1.5"/>';
    svg += '<text x="' + ((x0 + x1) / 2) + '" y="282" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#1a1a1a">L = ' + L + ' m</text>';
    return svgURL(svg + SVG_FTR);
  })();
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must locate the resultant of the triangular load. The resultant acts one-third of the length from the maximum-intensity side:\n\n" +
    "$$d_{\\text{from max}} = \\frac{" + L + "}{3} = " + fmt(r2(L / 3)) + "\\ \\text{m}$$\n\n" +
    "Measured from the left end:\n\n" +
    "$$(d) = " + (zeroLeft ? L + " - " + fmt(r2(L / 3)) + " = " + fmt(d) : fmt(d)) + "\\ \\text{m}$$";
  return {
    variantKey: "tri-L" + L + "-z" + (zeroLeft ? "l" : "r") + "-w" + w,
    question: question,
    options: [
      { label: fmt(d) + " m", num: d, correct: true },
      { label: fmt(dWrong) + " m", num: dWrong, correct: false },
      { label: fmt(dMid) + " m", num: dMid, correct: false },
      { label: fmt(dEnd) + " m", num: dEnd, correct: false }
    ],
    solution: solution,
    diagram: d006
  };
}));

/* ---- statics-007: cantilever beam reactions ---- */
reg(buildGenerator({
  baseId: "statics-007",
  topic: "Statics",
  subtopic: "Cantilever beam reactions",
  difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "Break the loading into the uniform resultant (acts at midspan) and the point load, then sum moments about the fixed end. The 33 kN-m trap comes from placing the uniform resultant at the free end.",
  videoUrl: "https://www.youtube.com/watch?v=4LXDkhqfn1g",
  videoTitle: "How to Find the Reactions at the Supports – Static Equilibrium of Rigid Bodies– Reaction Problem 4"
}, function () {
  var L, w, P, M, t1, t2, t3;
  do {
    L = pick([2, 2.5, 3, 4]);
    w = pick([1, 1.5, 2, 3, 4]);
    P = pick([3, 4, 5, 6, 8, 10]);
    M = r2(w * L * L / 2 + P * L);
    t1 = r2(w * L * L + P * L);  // trap: UDL resultant placed at the free end
    t2 = r2(w * L * L / 2);      // trap: forgot the point load
    t3 = r2(P * L);              // trap: forgot the uniform load
  } while (new Set([M, t1, t2, t3]).size !== 4);
  // Setup diagram (never the answer): cantilever with the UDL and tip load;
  // the fixed-end moment is not drawn.
  var d007 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var sc = Math.min(300 / L, 110), x0 = 90, x1 = x0 + sc * L, by = 200;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300" role="img">' + AHK2;
    s += '<line x1="' + x0 + '" y1="' + (by - 45) + '" x2="' + x0 + '" y2="' + (by + 55) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + x0 + '" y1="' + (by - 38) + '" x2="' + (x0 - 12) + '" y2="' + (by - 26) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    s += '<line x1="' + x0 + '" y1="' + (by - 8) + '" x2="' + (x0 - 12) + '" y2="' + (by + 4) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    s += '<line x1="' + x0 + '" y1="' + (by + 22) + '" x2="' + (x0 - 12) + '" y2="' + (by + 34) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    s += '<rect x="' + x0 + '" y="' + by + '" width="' + r1(x1 - x0) + '" height="10" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + x0 + '" y1="' + (by - 42) + '" x2="' + r1(x1) + '" y2="' + (by - 42) + '" stroke="#1a1a1a" stroke-width="1.6"/>';
    for (var i = 0; i <= 6; i++) {
      var ax = x0 + (x1 - x0) * i / 6;
      s += '<line x1="' + r1(ax) + '" y1="' + (by - 42) + '" x2="' + r1(ax) + '" y2="' + (by - 4) + '" stroke="#1d4ed8" stroke-width="2" marker-end="url(#ah)"/>';
    }
    s += '<text x="' + r1((x0 + x1) / 2) + '" y="' + (by - 54) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">w = ' + fmt(w) + ' kN/m</text>';
    s += '<line x1="' + r1(x1) + '" y1="' + (by - 60) + '" x2="' + r1(x1) + '" y2="' + (by - 4) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(x1) + '" y="' + (by - 68) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">P = ' + P + ' kN</text>';
    s += '<text x="' + x0 + '" y="' + (by + 74) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">fixed</text>';
    s += '<line x1="' + x0 + '" y1="278" x2="' + r1(x1) + '" y2="278" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + (x0 + 2) + '" y1="278" x2="' + (x0 + 26) + '" y2="278" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x1 - 2) + '" y1="278" x2="' + r1(x1 - 26) + '" y2="278" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + x0 + '" y1="272" x2="' + x0 + '" y2="284" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x1) + '" y1="272" x2="' + r1(x1) + '" y2="284" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<text x="' + r1((x0 + x1) / 2) + '" y="270" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">L = ' + fmt(L) + ' m</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A " + fmt(L) + " m cantilever beam is fixed at its left end. It carries a uniformly distributed load of " +
    fmt(w) + " kN/m over its entire length plus a concentrated load of " + P +
    " kN downward at the free (right) end. What is the magnitude of the fixed-end moment?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(M_{\\text{fixed}}\\). Sum moments about the fixed end: the uniform resultant \\(wL\\) acts at midspan and the point load acts at the free end:\n\n" +
    "$$M_{\\text{fixed}} = (wL)\\left(\\frac{L}{2}\\right) + PL$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(M_{\\text{fixed}}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "wL &= (" + fmt(w) + ")(" + fmt(L) + ") = " + fmt(r2(w * L)) + "\\ \\text{kN at " + fmt(r2(L / 2)) + "\\ m from the wall} \\\\\n" +
    "P &= " + P + "\\ \\text{kN at " + fmt(L) + "\\ m from the wall} \\\\\n" +
    "M_{\\text{fixed}} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(M_{\\text{fixed}}) = (" + fmt(r2(w * L)) + ")(" + fmt(r2(L / 2)) + ") + (" + P + ")(" + fmt(L) + ")$$\n\n" +
    "$$(M_{\\text{fixed}}) = " + fmt(M) + "\\ \\text{kN-m}$$";
  return {
    variantKey: "cant-L" + pdot(L) + "-w" + pdot(w) + "-P" + P,
    question: question,
    diagram: d007,
    options: [
      { label: fmt(M) + " kN-m", num: M, correct: true },
      { label: fmt(t1) + " kN-m", num: t1, correct: false },
      { label: fmt(t2) + " kN-m", num: t2, correct: false },
      { label: fmt(t3) + " kN-m", num: t3, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-008: overhanging beam reactions ---- */
reg(buildGenerator({
  baseId: "statics-008",
  topic: "Statics",
  subtopic: "Overhanging beam reactions",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Overhang loads create uplift at the near support - a negative reaction is physically meaningful (it must be held down). Always verify with both equilibrium equations.",
  videoUrl: "https://www.youtube.com/watch?v=4LXDkhqfn1g",
  videoTitle: "How to Find the Reactions at the Supports – Static Equilibrium of Rigid Bodies– Reaction Problem 4"
}, function () {
  var S, a, P, By, t1, t2, t3;
  do {
    S = pick([5, 6, 8]);
    a = pick([1, 1.5, 2, 2.5, 3]);
    P = pick([5, 6, 8, 10, 12]);
    By = r2(P * (S + a) / S);
    t1 = r2(P * (S - a) / S);  // trap: subtracted the overhang in the moment arm
    t2 = r2(P * a / S);        // trap: moment about B as if A carried nothing
    t3 = r2(P);                // trap: ignored the moment arm entirely
  } while (new Set([By, t1, t2, t3]).size !== 4);
  // Setup diagram (never the answer): beam, pin at A, roller at B, overhang
  // with load P at the tip C. The reactions are not drawn.
  var d008 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var sc = Math.min(330 / (S + a), 60);
    var ax = 70, bx = ax + sc * S, cx = bx + sc * a, by = 170;
    function dimline(x1d, x2d, y, label) {
      var d = '';
      d += '<line x1="' + r1(x1d) + '" y1="' + y + '" x2="' + r1(x2d) + '" y2="' + y + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      d += '<line x1="' + r1(x1d + 2) + '" y1="' + y + '" x2="' + r1(x1d + 24) + '" y2="' + y + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
      d += '<line x1="' + r1(x2d - 2) + '" y1="' + y + '" x2="' + r1(x2d - 24) + '" y2="' + y + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
      d += '<line x1="' + r1(x1d) + '" y1="' + (y - 6) + '" x2="' + r1(x1d) + '" y2="' + (y + 6) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      d += '<line x1="' + r1(x2d) + '" y1="' + (y - 6) + '" x2="' + r1(x2d) + '" y2="' + (y + 6) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      d += '<text x="' + r1((x1d + x2d) / 2) + '" y="' + (y - 8) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">' + label + '</text>';
      return d;
    }
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300" role="img">' + AHK2;
    s += '<rect x="' + ax + '" y="' + by + '" width="' + r1(cx - ax) + '" height="10" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<path d="M' + (ax - 17) + ',' + (by + 5) + ' L' + (ax + 17) + ',' + (by + 5) + ' L' + ax + ',' + (by + 31) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + (ax - 31) + '" y1="' + (by + 31) + '" x2="' + (ax + 31) + '" y2="' + (by + 31) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<path d="M' + r1(bx - 17) + ',' + (by + 5) + ' L' + r1(bx + 17) + ',' + (by + 5) + ' L' + r1(bx) + ',' + (by + 27) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<circle cx="' + r1(bx - 9) + '" cy="' + (by + 34) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<circle cx="' + r1(bx + 9) + '" cy="' + (by + 34) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + r1(bx - 31) + '" y1="' + (by + 41) + '" x2="' + r1(bx + 31) + '" y2="' + (by + 41) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(cx) + '" y1="' + (by - 62) + '" x2="' + r1(cx) + '" y2="' + (by - 4) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(cx) + '" y="' + (by - 70) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">' + P + ' kN</text>';
    s += '<text x="' + ax + '" y="' + (by - 14) + '" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#1a1a1a">A</text>';
    s += '<text x="' + r1(bx) + '" y="' + (by - 14) + '" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#1a1a1a">B</text>';
    s += '<text x="' + r1(cx + 16) + '" y="' + (by - 14) + '" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#1a1a1a">C</text>';
    s += dimline(ax, bx, 262, S + ' m');
    s += dimline(bx, cx, 262, fmt(a) + ' m');
    return svgURL(s + SVG_FTR);
  })();
  var question = "A beam has a pin support at A (left) and a roller support at B, " + S +
    " m to the right of A. The beam overhangs " + fmt(a) +
    " m past B, and a concentrated downward load of " + P +
    " kN acts at the free end of the overhang. There are no other loads. What is the vertical reaction at B?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(B_y\\). Sum moments about A to eliminate the pin reaction:\n\n" +
    "$$\\sum M_A = 0 \\;\\rightarrow\\; B_y(" + S + ") - (" + P + ")(" + S + " + " + fmt(a) + ") = 0$$\n\n" +
    "$$(B_y) = \\frac{(" + P + ")(" + fmt(r2(S + a)) + ")}{" + S + "} = " + fmt(By) + "\\ \\text{kN}$$\n\n" +
    "Verify with \\(\\sum F_y = 0\\): \\(A_y = " + P + " - " + fmt(By) + " = " + fmt(r2(P - By)) + "\\ \\text{kN}\\) (the negative sign means A must be held down).";
  return {
    variantKey: "ovh-S" + S + "-a" + pdot(a) + "-P" + P,
    question: question,
    diagram: d008,
    options: [
      { label: fmt(By) + " kN upward", num: By, correct: true },
      { label: fmt(t1) + " kN upward", num: t1, correct: false },
      { label: fmt(t2) + " kN upward", num: t2, correct: false },
      { label: fmt(t3) + " kN upward", num: t3, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-009: truss analysis, method of sections ---- */
reg(buildGenerator({
  baseId: "statics-009",
  topic: "Statics",
  subtopic: "Truss analysis (method of sections)",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "The trap is the sign: a negative tensile force means compression. Students who solve the equilibrium correctly but report 11.1 kN (T) misread the sign convention.",
  videoUrl: "https://www.youtube.com/watch?v=_rK02neOF18",
  videoTitle: "Trusses Method of Joints"
}, function () {
  var s = pick([3, 4, 5, 6]);
  var h = pick([2, 3, 4, 5]);
  var P = pick([10, 15, 20, 25, 30]);
  var sinT = h / Math.sqrt(s * s + h * h);
  var mag = r2((P / 3) / sinT);       // magnitude of FBF
  var dEy = r2((2 * P / 3) / sinT);   // trap: used the far reaction Ey instead of Ay
  var dTan = r2((P / 3) * s / h);     // trap: resolved with tan instead of sin
  // Compression is sign-encoded negative in num.
  // Setup diagram (never the answer): the Pratt truss with joints, supports,
  // the load at F, and member BF identified. Tension/compression not shown.
  var d009 = (function () {
    var sc = Math.min(360 / (3 * s), 140 / h, 60);
    var ax = (480 - 3 * s * sc) / 2, by = 280;
    function J(xm, ym) { return [ax + sc * xm, by - sc * ym]; }
    var A = J(0, 0), B = J(s, 0), C = J(2 * s, 0), E = J(3 * s, 0), D = J(s, h), F = J(2 * s, h);
    function mem(p, q, color, wd) {
      return '<line x1="' + r1(p[0]) + '" y1="' + r1(p[1]) + '" x2="' + r1(q[0]) + '" y2="' + r1(q[1]) + '" stroke="' + color + '" stroke-width="' + wd + '"/>';
    }
    function lab(p, txt, dx, dy, anch, color, size) {
      return '<text x="' + r1(p[0] + dx) + '" y="' + r1(p[1] + dy) + '" text-anchor="' + anch + '" font-family="Georgia,serif" font-size="' + size + '" fill="' + color + '">' + txt + '</text>';
    }
    var s2 = "";
    s2 += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="380" viewBox="0 0 480 380" role="img">' + AH;
    s2 += mem(A, E, '#1a1a1a', 3) + mem(D, F, '#1a1a1a', 3) + mem(A, D, '#1a1a1a', 3) + mem(F, E, '#1a1a1a', 3);
    s2 += mem(B, D, '#1a1a1a', 3) + mem(C, F, '#1a1a1a', 3);
    s2 += mem(B, F, '#1d4ed8', 6);
    var pts = [A, B, C, E, D, F];
    for (var i = 0; i < pts.length; i++) s2 += '<circle cx="' + r1(pts[i][0]) + '" cy="' + r1(pts[i][1]) + '" r="4" fill="#1a1a1a"/>';
    s2 += '<path d="M' + r1(A[0] - 17) + ',' + r1(A[1]) + ' L' + r1(A[0] + 17) + ',' + r1(A[1]) + ' L' + r1(A[0]) + ',' + r1(A[1] + 26) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s2 += '<line x1="' + r1(A[0] - 31) + '" y1="' + r1(A[1] + 26) + '" x2="' + r1(A[0] + 31) + '" y2="' + r1(A[1] + 26) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s2 += '<path d="M' + r1(E[0] - 17) + ',' + r1(E[1]) + ' L' + r1(E[0] + 17) + ',' + r1(E[1]) + ' L' + r1(E[0]) + ',' + r1(E[1] + 22) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s2 += '<circle cx="' + r1(E[0] - 9) + '" cy="' + r1(E[1] + 29) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s2 += '<circle cx="' + r1(E[0] + 9) + '" cy="' + r1(E[1] + 29) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s2 += '<line x1="' + r1(E[0] - 31) + '" y1="' + r1(E[1] + 36) + '" x2="' + r1(E[0] + 31) + '" y2="' + r1(E[1] + 36) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s2 += '<line x1="' + r1(F[0]) + '" y1="' + r1(F[1] - 64) + '" x2="' + r1(F[0]) + '" y2="' + r1(F[1] - 6) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s2 += lab([F[0], F[1] - 72], P + ' kN', 0, 0, 'middle', '#1d4ed8', 16);
    var bfMid = [(B[0] + F[0]) / 2 + 16, (B[1] + F[1]) / 2];
    s2 += lab(bfMid, 'BF', 0, 5, 'start', '#1d4ed8', 17);
    s2 += lab(A, 'A', 0, -14, 'middle', '#1a1a1a', 18);
    s2 += lab(B, 'B', 0, 60, 'middle', '#1a1a1a', 17);
    s2 += lab(C, 'C', 0, 60, 'middle', '#1a1a1a', 17);
    s2 += lab(E, 'E', 0, -14, 'middle', '#1a1a1a', 18);
    s2 += lab(D, 'D', 0, -12, 'middle', '#1a1a1a', 17);
    s2 += lab(F, 'F', 16, -8, 'start', '#1a1a1a', 17);
    return svgURL(s2 + SVG_FTR);
  })();
  var question = "A Pratt truss spans " + (3 * s) + " m with a pin support at A (left end) and a roller support at E (right end). " +
    "Bottom-chord joints are A(0, 0), B(" + s + " m, 0), C(" + (2 * s) + " m, 0), E(" + (3 * s) + " m, 0); " +
    "top-chord joints are D(" + s + " m, " + h + " m) and F(" + (2 * s) + " m, " + h + " m). " +
    "A single vertical load of " + P + " kN acts downward at top joint F. " +
    "Using the method of sections, what is the force in diagonal member BF?";
  var solution = "Refer to the Plane Truss: Method of Sections section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(F_{BF}\\). First find the reactions; then cut through BC, BF, and DF and use the left section:\n\n" +
    "$$\\sum M_A = 0 \\;\\rightarrow\\; E_y(" + (3 * s) + ") - (" + P + ")(" + (2 * s) + ") = 0 \\;\\rightarrow\\; E_y = " + fmt(r2(2 * P / 3)) + "\\ \\text{kN},\\; A_y = " + fmt(r2(P / 3)) + "\\ \\text{kN}$$\n\n" +
    "The diagonal rises at \\(\\sin\\theta = " + h + "/\\sqrt{" + s + "^2 + " + h + "^2} = " + fmt(sinT) + "\\). Vertical equilibrium of the left section:\n\n" +
    "$$\\sum F_y = 0 \\;\\rightarrow\\; A_y + F_{BF}\\,\\sin\\theta = 0$$\n\n" +
    "$$(F_{BF}) = \\frac{-" + fmt(r2(P / 3)) + "}{" + fmt(sinT) + "} = " + texNum(-mag) + "\\ \\text{kN}$$\n\n" +
    "The negative sign means the member pushes on the section: \\(" + fmt(mag) + "\\ \\text{kN (C)}\\).";
  return {
    variantKey: "sec-s" + s + "-h" + h + "-P" + P,
    question: question,
    diagram: d009,
    options: [
      { label: fmt(mag) + " kN (C)", num: -mag, correct: true },
      { label: fmt(mag) + " kN (T)", num: mag, correct: false },
      { label: fmt(dEy) + " kN (C)", num: -dEy, correct: false },
      { label: fmt(dTan) + " kN (C)", num: -dTan, correct: false }
    ],
    solution: solution
  };
}));
/* ---- statics-010: concurrent cables in 2D ---- */
reg(buildGenerator({
  baseId: "statics-010",
  topic: "Statics",
  subtopic: "Concurrent forces in 2D",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Resolve along one cable to eliminate its unknown; angles are measured from the horizontal. The traps: the even-split value, the other cable's tension, and dropping the sin(sum) factor.",
  videoUrl: "https://www.youtube.com/watch?v=okHbyjv9XzQ",
  videoTitle: "Cable Tension Problem with Two Cables"
}, function () {
  var t1deg, t2deg, W, T1, tT2, tH, tHalf;
  do {
    t1deg = pick([30, 45, 60]);
    t2deg = pick([30, 45, 60]);
    W = ri(100, 400);
    var a = t1deg * Math.PI / 180, b = t2deg * Math.PI / 180;
    T1 = r0(W * Math.cos(b) / Math.sin(a + b));
    tT2 = r0(W * Math.cos(a) / Math.sin(a + b)); // trap: reported the other cable
    tH = r0(W * Math.cos(b));                   // trap: dropped the /sin(t1+t2) factor
    tHalf = r0(W / 2);                          // trap: assumed the load splits evenly
  } while (new Set([t1deg, t2deg, T1, tT2, tH, tHalf]).size !== 6);
  // Setup diagram (never the answer): the ceiling, both cables with their
  // angles from the horizontal, and the hanging sign weight. No tensions solved.
  var d010 = (function () {
    var a = t1deg * Math.PI / 180, b = t2deg * Math.PI / 180;
    var drop = Math.min(180 * Math.tan(Math.min(a, b)), 190);
    var ky = 80 + drop, kx = 240;
    var lx = kx - drop / Math.tan(a), rx = kx + drop / Math.tan(b);
    var ceilX0 = Math.min(lx - 45, 60), ceilX1 = Math.max(rx + 45, 420);
    function pt(x, y) { return r1(x) + ',' + r1(y); }
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="330" viewBox="0 0 480 330" role="img">' + AH;
    s += '<line x1="' + r1(ceilX0) + '" y1="80" x2="' + r1(ceilX1) + '" y2="80" stroke="#1a1a1a" stroke-width="3"/>';
    for (var i = 0; i <= 5; i++) {
      var hx = ceilX0 + 20 + (ceilX1 - ceilX0 - 40) * i / 5;
      s += '<line x1="' + r1(hx) + '" y1="80" x2="' + r1(hx) + '" y2="66" stroke="#1a1a1a" stroke-width="1.5"/>';
    }
    s += '<line x1="' + r1(lx) + '" y1="80" x2="' + kx + '" y2="' + r1(ky) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(rx) + '" y1="80" x2="' + kx + '" y2="' + r1(ky) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + kx + '" y1="' + r1(ky) + '" x2="' + r1(kx - 62 * Math.cos(a)) + '" y2="' + r1(ky - 62 * Math.sin(a)) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<line x1="' + kx + '" y1="' + r1(ky) + '" x2="' + r1(kx + 62 * Math.cos(b)) + '" y2="' + r1(ky - 62 * Math.sin(b)) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<line x1="' + kx + '" y1="' + r1(ky) + '" x2="' + kx + '" y2="' + r1(ky + 62) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<circle cx="' + kx + '" cy="' + r1(ky) + '" r="5" fill="#1d4ed8"/>';
    s += '<path d="M ' + r1(lx + 42) + ',80 A 42,42 0 0,0 ' + r1(lx + 42 * Math.cos(a)) + ',' + r1(80 + 42 * Math.sin(a)) + '" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>';
    s += '<text x="' + r1(lx + 58 * Math.cos(a / 2)) + '" y="' + r1(80 + 58 * Math.sin(a / 2) + 5) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">' + t1deg + '\u00b0</text>';
    s += '<path d="M ' + r1(rx - 42) + ',80 A 42,42 0 0,1 ' + r1(rx - 42 * Math.cos(b)) + ',' + r1(80 + 42 * Math.sin(b)) + '" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>';
    s += '<text x="' + r1(rx - 58 * Math.cos(b / 2)) + '" y="' + r1(80 + 58 * Math.sin(b / 2) + 5) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">' + t2deg + '\u00b0</text>';
    s += '<text x="' + r1(kx - 84 * Math.cos(a)) + '" y="' + r1(ky - 84 * Math.sin(a)) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">T1 = ?</text>';
    s += '<text x="' + r1(kx + 88 * Math.cos(b)) + '" y="' + r1(ky - 88 * Math.sin(b)) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">T2</text>';
    s += '<text x="' + (kx + 12) + '" y="' + r1(ky + 50) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">' + W + ' N</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "Two cables hang from a ceiling and meet at a point from which a " + W +
    " N sign hangs. Cable 1 makes " + t1deg + " degrees with the horizontal on the left; cable 2 makes " + t2deg +
    " degrees with the horizontal on the right. What is the tension in cable 1?";
  var solution = "Refer to the Concurrent Forces section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(T_1\\). Apply equilibrium at the junction (\\(\\sum F_x = 0\\), \\(\\sum F_y = 0\\)):\n\n" +
    "$$\\begin{aligned}\n" +
    "T_1\\cos " + t1deg + "^\\circ - T_2\\cos " + t2deg + "^\\circ &= 0 \\\\\n" +
    "T_1\\sin " + t1deg + "^\\circ + T_2\\sin " + t2deg + "^\\circ &= " + W + "\n" +
    "\\end{aligned}$$\n\n" +
    "Eliminate \\(T_2\\): \\(T_1 = W\\cos " + t2deg + "^\\circ / \\sin(" + t1deg + "^\\circ + " + t2deg + "^\\circ)\\):\n\n" +
    "$$(T_1) = \\frac{(" + W + ")(" + fmt(r2(Math.cos(t2deg * Math.PI / 180))) + ")}{" + fmt(r2(Math.sin((t1deg + t2deg) * Math.PI / 180))) + "} = " + T1 + "\\ \\text{N}$$\n\n" +
    "The even-split guess would be \\(" + tHalf + "\\ \\text{N}\\); another trap reports cable 2's tension, \\(" + tT2 + "\\ \\text{N}\\).";
  return {
    variantKey: "cab-t1" + t1deg + "-t2" + t2deg + "-W" + W,
    question: question,
    diagram: d010,
    options: [
      { label: T1 + " N", num: T1, correct: true },
      { label: tT2 + " N", num: tT2, correct: false },
      { label: tH + " N", num: tH, correct: false },
      { label: tHalf + " N", num: tHalf, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-011: couple moment ---- */
reg(buildGenerator({
  baseId: "statics-011",
  topic: "Statics",
  subtopic: "Couple moment",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "A couple's moment is F*d and is free: the same rotation acts about any point. Forgetting the factor of 2 (two forces) is the usual trap.",
  videoUrl: "https://www.youtube.com/watch?v=QNNnPZ68STI",
  videoTitle: "Moment of a Force"
}, function () {
  var F = ri(20, 100);
  var d = pick([0.4, 0.5, 0.6, 0.8, 1.2, 1.5]); // d = 1 excluded: F/d would equal F*d
  var M = r2(F * d);
  var tDbl = r2(2 * F * d);  // trap: counted each force's moment twice
  var tHalf = r2(F * d / 2); // trap: halved the separation
  var tDiv = r2(F / d);      // trap: divided instead of multiplying
  var question = "Two equal and opposite " + F +
    " N forces act parallel to each other " + fmt(d) + " m apart, forming a couple. What is the magnitude of the couple moment?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(M\\), the couple moment. A couple's moment is the force times the perpendicular separation, and it is the same about any point:\n\n" +
    "$$M = F\\,d$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(M\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "F &= " + F + "\\ \\text{N} \\\\\n" +
    "d &= " + fmt(d) + "\\ \\text{m} \\\\\n" +
    "M &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(M) = (" + F + ")(" + fmt(d) + ") = " + fmt(M) + "\\ \\text{N-m}$$";
  return {
    variantKey: "cpl-F" + F + "-d" + pdot(d),
    question: question,
    options: [
      { label: fmt(M) + " N-m", num: M, correct: true },
      { label: fmt(tDbl) + " N-m", num: tDbl, correct: false },
      { label: fmt(tHalf) + " N-m", num: tHalf, correct: false },
      { label: fmt(tDiv) + " N-m", num: tDiv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-012: centroid of plate with circular cutout ---- */
reg(buildGenerator({
  baseId: "statics-012",
  topic: "Statics",
  subtopic: "Centroid of composite areas (cutout)",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "Cutouts enter as NEGATIVE area. The classic blunder is adding the hole's moment or forgetting to reduce the total area.",
  videoUrl: "https://www.youtube.com/watch?v=B6UBikXkAqk",
  videoTitle: "Centroid & Centre of Gravity"
}, function () {
  var W, H, d, xhFrac, xh, Ah, Ap, xbar, tNoRed, tMid, tAdd;
  do {
    W = pick([200, 250, 300, 400]);
    H = pick([150, 200, 250]);
    d = pick([60, 80, 100, 120]);
    xhFrac = pick([0.25, 1 / 3, 0.4]);
    xh = r0(xhFrac * W / 5) * 5; // hole center x, rounded to the nearest 5 mm
    Ah = Math.PI * d * d / 4;
    Ap = W * H;
    xbar = r0((Ap * W / 2 - Ah * xh) / (Ap - Ah));
    tNoRed = r0((Ap * W / 2 - Ah * xh) / Ap);       // trap: forgot to reduce the total area
    tMid = r0(W / 2);                               // trap: ignored the cutout
    tAdd = r0((Ap * W / 2 + Ah * xh) / (Ap + Ah));   // trap: added the hole instead of subtracting
  } while (xh <= d / 2 || xh >= W - d / 2 || xh === W / 2 || new Set([xbar, tNoRed, tMid, tAdd]).size !== 4);
  // Setup diagram (never the answer): the plate, the hole with its given
  // center position and diameter. The centroid is not drawn.
  var d012 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var sc = Math.min(300 / W, 220 / H);
    var pw = sc * W, ph = sc * H, x0 = (480 - pw) / 2, y0 = 40;
    var hx = x0 + sc * xh, hy = y0 + ph - sc * (H / 2), hr = sc * d / 2;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="330" viewBox="0 0 480 330" role="img">' + AHK2;
    s += '<rect x="' + r1(x0) + '" y="' + y0 + '" width="' + r1(pw) + '" height="' + r1(ph) + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<circle cx="' + r1(hx) + '" cy="' + r1(hy) + '" r="' + r1(hr) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(hx - hr - 8) + '" y1="' + r1(hy) + '" x2="' + r1(hx + hr + 8) + '" y2="' + r1(hy) + '" stroke="#9ca3af" stroke-width="1.2" stroke-dasharray="5,4"/>';
    s += '<line x1="' + r1(hx) + '" y1="' + r1(hy - hr - 8) + '" x2="' + r1(hx) + '" y2="' + r1(hy + hr + 8) + '" stroke="#9ca3af" stroke-width="1.2" stroke-dasharray="5,4"/>';
    s += '<text x="' + r1(hx) + '" y="' + r1(hy + hr + 18) + '" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#1a1a1a">d = ' + d + ' mm</text>';
    s += '<line x1="' + r1(x0) + '" y1="24" x2="' + r1(hx) + '" y2="24" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 + 2) + '" y1="24" x2="' + r1(x0 + 22) + '" y2="24" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(hx - 2) + '" y1="24" x2="' + r1(hx - 22) + '" y2="24" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0) + '" y1="18" x2="' + r1(x0) + '" y2="30" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(hx) + '" y1="18" x2="' + r1(hx) + '" y2="30" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<text x="' + r1((x0 + hx) / 2) + '" y="16" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#1a1a1a">x = ' + xh + ' mm</text>';
    s += '<line x1="' + r1(x0 - 26) + '" y1="' + y0 + '" x2="' + r1(x0 - 26) + '" y2="' + r1(y0 + ph) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 - 26) + '" y1="' + (y0 + 2) + '" x2="' + r1(x0 - 26) + '" y2="' + (y0 + 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 - 26) + '" y1="' + r1(y0 + ph - 2) + '" x2="' + r1(x0 - 26) + '" y2="' + r1(y0 + ph - 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 - 44) + '" y="' + r1(y0 + ph / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a" transform="rotate(-90 ' + r1(x0 - 44) + ' ' + r1(y0 + ph / 2) + ')">' + H + ' mm</text>';
    s += '<line x1="' + r1(x0) + '" y1="' + r1(y0 + ph + 26) + '" x2="' + r1(x0 + pw) + '" y2="' + r1(y0 + ph + 26) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 + 2) + '" y1="' + r1(y0 + ph + 26) + '" x2="' + r1(x0 + 22) + '" y2="' + r1(y0 + ph + 26) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 + pw - 2) + '" y1="' + r1(y0 + ph + 26) + '" x2="' + r1(x0 + pw - 22) + '" y2="' + r1(y0 + ph + 26) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 + pw / 2) + '" y="' + r1(y0 + ph + 44) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">' + W + ' mm</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A rectangular steel plate is " + W + " mm wide (x-direction) by " + H +
    " mm tall. A circular hole of diameter " + d + " mm is punched out; the hole's center is at x = " + xh +
    " mm from the left edge and y = " + (H / 2) + " mm from the bottom edge. " +
    "What is the x-coordinate of the centroid of the remaining area, measured from the left edge?";
  var solution = "Refer to the Centroids of Masses, Areas, Lengths, and Volumes section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\bar{x}\\). Treat the hole as negative area:\n\n" +
    "$$\\bar{x} = \\frac{A_{\\text{plate}}\\,x_{\\text{plate}} - A_{\\text{hole}}\\,x_{\\text{hole}}}{A_{\\text{plate}} - A_{\\text{hole}}}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\bar{x}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "A_{\\text{plate}} &= (" + W + ")(" + H + ") = " + fmt(r0(Ap)) + "\\ \\text{mm}^2,\\quad x_{\\text{plate}} = " + (W / 2) + "\\ \\text{mm} \\\\\n" +
    "A_{\\text{hole}} &= \\frac{\\pi(" + d + ")^2}{4} = " + fmt(r0(Ah)) + "\\ \\text{mm}^2,\\quad x_{\\text{hole}} = " + xh + "\\ \\text{mm} \\\\\n" +
    "\\bar{x} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\bar{x}) = \\frac{(" + fmt(r0(Ap)) + ")(" + (W / 2) + ") - (" + fmt(r0(Ah)) + ")(" + xh + ")}{" + fmt(r0(Ap)) + " - " + fmt(r0(Ah)) + "}$$\n\n" +
    "$$(\\bar{x}) = " + xbar + "\\ \\text{mm}$$";
  return {
    variantKey: "plt-W" + W + "-H" + H + "-d" + d + "-xh" + xh,
    question: question,
    diagram: d012,
    options: [
      { label: xbar + " mm", num: xbar, correct: true },
      { label: tNoRed + " mm", num: tNoRed, correct: false },
      { label: tMid + " mm", num: tMid, correct: false },
      { label: tAdd + " mm", num: tAdd, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-013: belt friction ---- */
reg(buildGenerator({
  baseId: "statics-013",
  topic: "Statics",
  subtopic: "Belt friction",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Belt friction grows exponentially with contact angle - and the angle must be in RADIANS. Forgetting the 2*π conversion is the classic error.",
  videoUrl: "https://www.youtube.com/watch?v=e7srQ4a0tI4",
  videoTitle: "Belt Friction – Concepts and Derivations"
}, function () {
  var n = pick([0.5, 0.75, 1, 1.25, 1.5, 2]); // full turns of belt contact
  var mu = pick([0.2, 0.25, 0.3, 0.35, 0.4]);
  var beta = 2 * Math.PI * n;            // contact angle, radians
  var ratio = r2(Math.exp(mu * beta));
  var tNo2pi = r2(Math.exp(mu * n));     // trap: used turns as the angle (no 2*pi)
  var tLin = r2(mu * beta);              // trap: used mu*beta instead of e^(mu*beta)
  var tLin1 = r2(1 + mu * beta);         // trap: linearized as 1 + mu*beta
  // Setup diagram (never the answer): drum, belt wrap for the given turns,
  // both tension sides labeled. The ratio is not given.
  var d013 = (function () {
    var cx = 300, cy = 165, R = 70, Rb = 78;
    var betaDeg = n * 360;
    var th0 = -90, th1 = th0 + betaDeg;
    function P(deg, rad) { return [cx + rad * Math.cos(deg * Math.PI / 180), cy + rad * Math.sin(deg * Math.PI / 180)]; }
    var start = P(th0, Rb), end = P(th1, Rb);
    var segs = Math.ceil(betaDeg / 179);
    var path = 'M ' + r1(start[0]) + ',' + r1(start[1]);
    for (var i = 1; i <= segs; i++) {
      var thi = th0 + betaDeg * i / segs;
      var pi = P(thi, Rb);
      path += ' A ' + Rb + ',' + Rb + ' 0 ' + (betaDeg / segs > 180 ? 1 : 0) + ',1 ' + r1(pi[0]) + ',' + r1(pi[1]);
    }
    var entry = [60, start[1]];
    var tdir = th1 + 90;
    var ux = Math.cos(tdir * Math.PI / 180), uy = Math.sin(tdir * Math.PI / 180);
    var exL = 180;
    if (uy < -0.01) exL = Math.min(exL, (end[1] - 28) / (-uy));
    if (uy > 0.01) exL = Math.min(exL, (325 - end[1]) / uy);
    if (ux < -0.01) exL = Math.min(exL, (end[0] - 25) / (-ux));
    if (ux > 0.01) exL = Math.min(exL, (455 - end[0]) / ux);
    var exit = [end[0] + exL * ux, end[1] + exL * uy];
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="340" viewBox="0 0 480 340" role="img">' + AH;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#1a1a1a"/>';
    s += '<line x1="' + r1(entry[0]) + '" y1="' + r1(entry[1]) + '" x2="' + r1(start[0]) + '" y2="' + r1(start[1]) + '" stroke="#1a1a1a" stroke-width="3"/>';
    s += '<path d="' + path + '" fill="none" stroke="#1a1a1a" stroke-width="3"/>';
    s += '<line x1="' + r1(end[0]) + '" y1="' + r1(end[1]) + '" x2="' + r1(exit[0]) + '" y2="' + r1(exit[1]) + '" stroke="#1a1a1a" stroke-width="3"/>';
    var am = [(entry[0] + start[0]) / 2, entry[1]];
    s += '<line x1="' + r1(am[0] + 55) + '" y1="' + r1(am[1]) + '" x2="' + r1(am[0] - 55) + '" y2="' + r1(am[1]) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(am[0]) + '" y="' + r1(am[1] - 12) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">T<tspan baseline-shift="sub" font-size="11">tight</tspan></text>';
    var em = [(end[0] + exit[0]) / 2, (end[1] + exit[1]) / 2];
    var aL0 = Math.min(45, exL * 0.3), aL1 = Math.min(135, exL * 0.85), tL = Math.min(155, exL + 14);
    s += '<line x1="' + r1(end[0] + aL0 * ux) + '" y1="' + r1(end[1] + aL0 * uy) + '" x2="' + r1(end[0] + aL1 * ux) + '" y2="' + r1(end[1] + aL1 * uy) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(end[0] + tL * ux) + '" y="' + r1(Math.min(Math.max(end[1] + tL * uy, 20), 330) + 5) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">T<tspan baseline-shift="sub" font-size="11">loose</tspan></text>';
    s += '<text x="240" y="325" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">belt wrapped ' + (n === 1 ? '1' : fmt(n)) + ' turn' + (n === 1 ? '' : 's') + ' \u00b7 \u03bc\u209b = ' + fmt(mu) + '</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A flat belt is about to slip relative to a drum. The belt contacts the drum over " +
    (n === 1 ? "1 full turn" : fmt(n) + " full turns") +
    " and the coefficient of static friction between the belt and the drum is " + fmt(mu) +
    ". What is the ratio of the tight-side tension to the loose-side tension (\\(T_{tight} / T_{loose}\\))?";
  var solution = "Refer to the Belt Friction section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(T_{\\text{tight}}/T_{\\text{loose}}\\). Belt friction follows the exponential capstan relation:\n\n" +
    "$$\\frac{T_{\\text{tight}}}{T_{\\text{loose}}} = e^{\\mu\\beta}$$\n\n" +
    "List the known and unknown parameters, converting the contact angle to radians:\n\n" +
    "$$\\begin{aligned}\n" +
    "\\mu &= " + fmt(mu) + " \\\\\n" +
    "\\beta &= (" + fmt(n) + ")(2\\pi) = " + fmt(r2(beta)) + "\\ \\text{rad} \\\\\n" +
    "T_{\\text{tight}}/T_{\\text{loose}} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(T_{\\text{tight}}/T_{\\text{loose}}) = e^{(" + fmt(mu) + ")(" + fmt(r2(beta)) + ")} = " + fmt(ratio) + "$$";
  return {
    variantKey: "belt-n" + pdot(n) + "-mu" + pdot(mu),
    question: question,
    diagram: d013,
    options: [
      { label: fmt(ratio) + " : 1", num: ratio, correct: true },
      { label: fmt(tNo2pi) + " : 1", num: tNo2pi, correct: false },
      { label: fmt(tLin) + " : 1", num: tLin, correct: false },
      { label: fmt(tLin1) + " : 1", num: tLin1, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-015: resultant of 3D concurrent forces ---- */
reg(buildGenerator({
  baseId: "statics-015",
  topic: "Statics",
  subtopic: "Resultant of 3D concurrent forces",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Recognizing Pythagorean quadruples (like 3-4-12-13) in 3D is the fast path. The traps are sign and root errors.",
  videoUrl: "https://www.youtube.com/watch?v=R5NVwAb94Yo",
  videoTitle: "How to Find the Resultant of Three Force Vectors – Statics Components and Resultants Problem 18"
}, function () {
  var combo = pick([[3, 4, 12, 13], [6, 8, 24, 26], [9, 12, 8, 17], [12, 16, 21, 29]]);
  var a = combo[0], b = combo[1], c = combo[2], m = combo[3];
  var pat = pick([0, 1, 2]); // which component is negated
  var comps = [a, b, c];
  comps[pat] = -comps[pat];
  var vec = vec3nz(comps[0], comps[1], comps[2], "F", "\\ \\text{N}");
  var dSum = a + b + c;   // trap: added the components as scalars, ignoring the negative sign
  var tSigned = m + c;    // trap: took sqrt(ax^2+bx^2), then added the signed z-component
  var tXY = a + b;        // trap: omitted the z-component
  var question = "A force vector acting at the origin is given by \\(" + vec + "\\). What is the magnitude of the force?";
  var solution = "Refer to the Concurrent Forces section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(|\\mathbf{F}|\\). The magnitude of a 3D vector is:\n\n" +
    "$$|\\mathbf{F}| = \\sqrt{F_x^2 + F_y^2 + F_z^2}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(|\\mathbf{F}|\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "F_x &= " + comps[0] + "\\ \\text{N} \\\\\n" +
    "F_y &= " + comps[1] + "\\ \\text{N} \\\\\n" +
    "F_z &= " + comps[2] + "\\ \\text{N} \\\\\n" +
    "|\\mathbf{F}| &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(|\\mathbf{F}|) = \\sqrt{(" + comps[0] + ")^2 + (" + comps[1] + ")^2 + (" + comps[2] + ")^2} = \\sqrt{" + (m * m) + "}$$\n\n" +
    "$$(|\\mathbf{F}|) = " + m + "\\ \\text{N}$$";
  return {
    variantKey: "res3d-" + a + "-" + b + "-" + c + "-n" + pat,
    question: question,
    options: [
      { label: m + " N", num: m, correct: true },
      { label: dSum + " N", num: dSum, correct: false },
      { label: tSigned + " N", num: tSigned, correct: false },
      { label: tXY + " N", num: tXY, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-016: moment as a cross product, magnitude ---- */
reg(buildGenerator({
  baseId: "statics-016",
  topic: "Statics",
  subtopic: "Moment as a cross product",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Computing r cross F via the determinant (or the cyclic rule) and checking the sign of each component is the whole battle. The traps are the classic sign slips and magnitude mix-ups.",
  videoUrl: "https://www.youtube.com/watch?v=QNNnPZ68STI",
  videoTitle: "Moment of a Force"
}, function () {
  var rx, ry, rz, Fx, Fy, Fz, Mx, My, Mz, Mmag, t1, t2, t3;
  do {
    rx = pick([-3, -2, -1, 1, 2, 3]); ry = pick([-3, -2, -1, 1, 2, 3]); rz = pick([-3, -2, -1, 1, 2, 3]);
    Fx = pick([-60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60]);
    Fy = pick([-60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60]);
    Fz = pick([-60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60]);
    Mx = ry * Fz - rz * Fy;
    My = rz * Fx - rx * Fz;
    Mz = rx * Fy - ry * Fx;
    Mmag = r1(Math.sqrt(Mx * Mx + My * My + Mz * Mz));
    var rmag = Math.sqrt(rx * rx + ry * ry + rz * rz);
    var Fmag = Math.sqrt(Fx * Fx + Fy * Fy + Fz * Fz);
    t1 = r1(rmag * Fmag); // trap: |r||F|, ignoring the angle between them
    t2 = r1(Math.abs(rx * Fx) + Math.abs(ry * Fy) + Math.abs(rz * Fz)); // trap: summed |ri*Fi|
    var MxW = ry * Fz + rz * Fy, MyW = rz * Fx + rx * Fz, MzW = rx * Fy + ry * Fx;
    t3 = r1(Math.sqrt(MxW * MxW + MyW * MyW + MzW * MzW)); // trap: added instead of subtracting in each component
  } while (Mmag <= 50 || new Set([Mmag, t1, t2, t3]).size !== 4 ||
    Math.abs(t1 - Mmag) < 0.02 * Mmag || Math.abs(t2 - Mmag) < 0.02 * Mmag || Math.abs(t3 - Mmag) < 0.02 * Mmag);
  var rVec = vec3(rx, ry, rz, "r", "\\ \\text{m}");
  var FVec = vec3(Fx, Fy, Fz, "F", "\\ \\text{N}");
  var question = "A position vector \\(\\mathbf{r} = " + rVec + "\\) locates the point of application of a force \\(\\mathbf{F} = " + FVec + "\\) relative to point O. What is the magnitude of the moment of the force about O, to the nearest 0.1 N-m?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(|\\mathbf{M}_O|\\). The moment about O is the cross product:\n\n" +
    "$$\\mathbf{M}_O = \\mathbf{r} \\times \\mathbf{F}$$\n\n" +
    "List the known and unknown parameters, evaluating each component (cyclic rule):\n\n" +
    "$$\\begin{aligned}\n" +
    "M_x &= r_y F_z - r_z F_y = (" + ry + ")(" + Fz + ") - (" + rz + ")(" + Fy + ") = " + Mx + "\\ \\text{N-m} \\\\\n" +
    "M_y &= r_z F_x - r_x F_z = (" + rz + ")(" + Fx + ") - (" + rx + ")(" + Fz + ") = " + My + "\\ \\text{N-m} \\\\\n" +
    "M_z &= r_x F_y - r_y F_x = (" + rx + ")(" + Fy + ") - (" + ry + ")(" + Fx + ") = " + Mz + "\\ \\text{N-m} \\\\\n" +
    "|\\mathbf{M}_O| &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(|\\mathbf{M}_O|) = \\sqrt{(" + Mx + ")^2 + (" + My + ")^2 + (" + Mz + ")^2}$$\n\n" +
    "$$(|\\mathbf{M}_O|) = " + fmt(Mmag) + "\\ \\text{N-m}$$";
  return {
    variantKey: "mx-r" + pdot(rx) + "_" + pdot(ry) + "_" + pdot(rz) + "-F" + pdot(Fx) + "_" + pdot(Fy) + "_" + pdot(Fz),
    question: question,
    options: [
      { label: fmt(Mmag) + " N-m", num: Mmag, correct: true },
      { label: fmt(t1) + " N-m", num: t1, correct: false },
      { label: fmt(t2) + " N-m", num: t2, correct: false },
      { label: fmt(t3) + " N-m", num: t3, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-017: partial UDL on a simply supported beam ---- */
reg(buildGenerator({
  baseId: "statics-017",
  topic: "Statics",
  subtopic: "Partial distributed loads",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "Partial UDLs: the resultant is \\(w L_{loaded}\\) acting at the LOADED segment's midpoint, not the beam's. The traps are the classic centroid slips.",
  videoUrl: "https://www.youtube.com/watch?v=J3s6m9rOFPY",
  videoTitle: "Beam Reactions Under a Triangular Distributed Load"
}, function () {
  var L, w, a, len, m, Ay, t1, t2, t3;
  do {
    L = pick([4, 5, 6, 8, 10]);
    w = ri(2, 5);
    a = pick([0.5, 1, 1.5, 2]);
    len = pick([2, 2.5, 3, 3.5, 4]);
    m = a + len / 2; // midpoint of the loaded segment, measured from A
    Ay = r2(w * len * (L - m) / L);
    t1 = r2(w * L / 2);       // trap: treated it as a full-span UDL
    t2 = r2(w * len * m / L); // trap: moment about A (this is the RIGHT reaction)
    t3 = r2(w * len);         // trap: reported the resultant force, not the reaction
  } while (a + len >= L || Math.abs(m - L / 2) < 0.25 || new Set([Ay, t1, t2, t3]).size !== 4);
  // Setup diagram (never the answer): beam, supports, the loaded segment with
  // its position and intensity. The reactions are not drawn.
  var d017 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var sc = Math.min(360 / L, 70);
    var ax = (480 - sc * L) / 2, bx = ax + sc * L, by = 210;
    var u0 = ax + sc * a, u1 = ax + sc * (a + len);
    function dimline(x1d, x2d, y, label, size) {
      var d = '';
      d += '<line x1="' + r1(x1d) + '" y1="' + y + '" x2="' + r1(x2d) + '" y2="' + y + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      d += '<line x1="' + r1(x1d + 2) + '" y1="' + y + '" x2="' + r1(x1d + 22) + '" y2="' + y + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
      d += '<line x1="' + r1(x2d - 2) + '" y1="' + y + '" x2="' + r1(x2d - 22) + '" y2="' + y + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
      d += '<line x1="' + r1(x1d) + '" y1="' + (y - 6) + '" x2="' + r1(x1d) + '" y2="' + (y + 6) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      d += '<line x1="' + r1(x2d) + '" y1="' + (y - 6) + '" x2="' + r1(x2d) + '" y2="' + (y + 6) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      d += '<text x="' + r1((x1d + x2d) / 2) + '" y="' + (y - 8) + '" text-anchor="middle" font-family="Georgia,serif" font-size="' + size + '" fill="#1a1a1a">' + label + '</text>';
      return d;
    }
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="330" viewBox="0 0 480 330" role="img">' + AHK2;
    s += '<line x1="' + r1(ax) + '" y1="' + by + '" x2="' + r1(bx) + '" y2="' + by + '" stroke="#1a1a1a" stroke-width="4"/>';
    s += '<path d="M' + r1(ax - 17) + ',' + by + ' L' + r1(ax + 17) + ',' + by + ' L' + r1(ax) + ',' + (by + 26) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + r1(ax - 31) + '" y1="' + (by + 26) + '" x2="' + r1(ax + 31) + '" y2="' + (by + 26) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<circle cx="' + r1(bx - 9) + '" cy="' + (by + 29) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<circle cx="' + r1(bx + 9) + '" cy="' + (by + 29) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + r1(bx - 31) + '" y1="' + (by + 36) + '" x2="' + r1(bx + 31) + '" y2="' + (by + 36) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(u0) + '" y1="' + (by - 52) + '" x2="' + r1(u1) + '" y2="' + (by - 52) + '" stroke="#1d4ed8" stroke-width="2"/>';
    for (var i = 0; i <= 6; i++) {
      var ux = u0 + (u1 - u0) * i / 6;
      s += '<line x1="' + r1(ux) + '" y1="' + (by - 52) + '" x2="' + r1(ux) + '" y2="' + (by - 8) + '" stroke="#1d4ed8" stroke-width="2" marker-end="url(#ah)"/>';
    }
    s += '<text x="' + r1((u0 + u1) / 2) + '" y="' + (by - 64) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">w = ' + w + ' kN/m</text>';
    s += '<text x="' + r1(ax) + '" y="' + (by + 62) + '" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#1a1a1a">A</text>';
    s += '<text x="' + r1(bx) + '" y="' + (by + 68) + '" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#1a1a1a">B</text>';
    s += dimline(u0, u1, by - 96, fmt(len) + ' m loaded', 14);
    s += dimline(ax, u0, by - 96, fmt(a) + ' m', 14);
    s += dimline(ax, bx, 312, L + ' m', 16);
    return svgURL(s + SVG_FTR);
  })();
  var question = "A simply supported beam spans " + L + " m. A uniformly distributed load of " + w +
    " kN/m acts over a " + fmt(len) + " m segment starting " + fmt(a) +
    " m from the left support. The rest of the beam is unloaded. What is the vertical reaction at the left support?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(A_y\\). Replace the partial UDL by its resultant acting at the loaded segment's midpoint:\n\n" +
    "$$W_{eq} = w\\,\\ell = (" + w + ")(" + fmt(len) + ") = " + fmt(r2(w * len)) + "\\ \\text{kN at " + fmt(r2(m)) + "\\ m from A}$$\n\n" +
    "Sum moments about B (the right support) to eliminate \\(B_y\\):\n\n" +
    "$$\\sum M_B = 0 \\;\\rightarrow\\; A_y(" + L + ") - W_{eq}(" + L + " - " + fmt(r2(m)) + ") = 0$$\n\n" +
    "$$(A_y) = \\frac{(" + fmt(r2(w * len)) + ")(" + fmt(r2(L - m)) + ")}{" + L + "} = " + fmt(Ay) + "\\ \\text{kN}$$";
  return {
    variantKey: "pudl-L" + L + "-w" + w + "-a" + pdot(a) + "-l" + pdot(len),
    question: question,
    diagram: d017,
    options: [
      { label: fmt(Ay) + " kN upward", num: Ay, correct: true },
      { label: fmt(t1) + " kN upward", num: t1, correct: false },
      { label: fmt(t2) + " kN upward", num: t2, correct: false },
      { label: fmt(t3) + " kN upward", num: t3, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-018: truss joint equilibrium (single joint) ---- */
reg(buildGenerator({
  baseId: "statics-018",
  topic: "Statics",
  subtopic: "Truss joint equilibrium (single joint)",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "At a single loaded joint, one equilibrium equation often gives the answer directly. Watch the sin/cos: the vertical component balances the vertical load.",
  videoUrl: "https://www.youtube.com/watch?v=_rK02neOF18",
  videoTitle: "Trusses Method of Joints"
}, function () {
  var P = pick([10, 12, 15, 18, 20, 24, 30, 36, 40]);
  var th = pick([30, 45, 60]);
  var rad = th * Math.PI / 180;
  var mag = r2(P / Math.sin(rad));   // tension magnitude
  var dComp = r2(P * Math.sin(rad)); // trap: multiplied by sin instead of dividing
  var dCot = r2(P / Math.tan(rad));  // trap: used the horizontal member's relation
  // Tension is sign-encoded positive in num.
  // Setup diagram (never the answer): the joint, the two members at the given
  // angle, and the applied load. Member forces are not drawn.
  var d018 = (function () {
    var radA = th * Math.PI / 180;
    var ex = 240, ey = 220;
    var dx = ex - 170 * Math.cos(radA), dy = ey - 170 * Math.sin(radA);
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="330" viewBox="0 0 480 330" role="img">' + AH;
    s += '<line x1="' + ex + '" y1="' + ey + '" x2="' + (ex + 200) + '" y2="' + ey + '" stroke="#1a1a1a" stroke-width="4"/>';
    s += '<line x1="' + ex + '" y1="' + ey + '" x2="' + r1(dx) + '" y2="' + r1(dy) + '" stroke="#1a1a1a" stroke-width="4"/>';
    s += '<circle cx="' + ex + '" cy="' + ey + '" r="6" fill="#1a1a1a"/>';
    s += '<line x1="' + ex + '" y1="' + (ey + 10) + '" x2="' + ex + '" y2="' + (ey + 100) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (ex + 34) + '" y="' + (ey + 74) + '" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">' + P + ' kN</text>';
    s += '<path d="M ' + (ex - 62) + ',' + ey + ' A 62,62 0 0,1 ' + r1(ex - 62 * Math.cos(radA)) + ',' + r1(ey - 62 * Math.sin(radA)) + '" fill="none" stroke="#1a1a1a" stroke-width="1.6"/>';
    s += '<text x="' + r1(ex - 82 * Math.cos(radA / 2)) + '" y="' + r1(ey - 82 * Math.sin(radA / 2) + 5) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">' + th + '\u00b0</text>';
    s += '<text x="' + (ex + 176) + '" y="' + (ey - 14) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">horizontal member</text>';
    s += '<text x="' + r1(dx + 30) + '" y="' + r1(dy - 6) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">diagonal member</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A truss joint connects a horizontal member and a diagonal member that rises at " + th +
    " degrees above the horizontal. A vertical downward load of " + P +
    " kN acts at the joint. From vertical equilibrium of the joint alone, what is the force in the diagonal member?";
  var solution = "Refer to the Plane Truss: Method of Joints section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(F_d\\), the diagonal member force. Only the diagonal has a vertical component:\n\n" +
    "$$\\sum F_y = 0 \\;\\rightarrow\\; F_d\\sin " + th + "^\\circ - " + P + " = 0$$\n\n" +
    "$$(F_d) = \\frac{" + P + "}{\\sin " + th + "^\\circ} = " + fmt(mag) + "\\ \\text{kN}$$\n\n" +
    "The positive sign means the member pulls on the joint: \\(" + fmt(mag) + "\\ \\text{kN (T)}\\).";
  return {
    variantKey: "jnt-P" + P + "-th" + th,
    question: question,
    diagram: d018,
    options: [
      { label: fmt(mag) + " kN (T)", num: mag, correct: true },
      { label: fmt(mag) + " kN (C)", num: -mag, correct: false },
      { label: fmt(dComp) + " kN (T)", num: dComp, correct: false },
      { label: fmt(dCot) + " kN (T)", num: dCot, correct: false }
    ],
    solution: solution
  };
}));
/* ---- statics-019: moment of inertia of rectangle about its base ---- */
reg(buildGenerator({
  baseId: "statics-019",
  topic: "Statics",
  subtopic: "Moment of inertia of a rectangle",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "About the base it's bh^3/3 - four times the centroidal bh^3/12. The trap answers are the centroidal value and the transposed-axes value.",
  videoUrl: "https://www.youtube.com/watch?v=Bls5KnQdCo0",
  videoTitle: "Statics: Lesson 67 - Introduction to Area Moment of Inertia"
}, function () {
  var b, h, I, tCen, tTrans, tNoDiv;
  do {
    b = ri(100, 300);
    h = ri(200, 400);
    I = b * h * h * h / 3;       // exact
    tCen = b * h * h * h / 12;   // trap: centroidal value
    tTrans = b * b * b * h / 3;  // trap: transposed b and h
    tNoDiv = b * h * h * h;      // trap: forgot the /3
  } while (b === h);
  var e = Math.floor(Math.log10(I));
  var mant = (I / Math.pow(10, e)).toFixed(2);
  // Setup diagram (never the answer): the section with its dimensions and the
  // base axis identified. No value is shown.
  var d019 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var sc = Math.min(220 / b, 230 / h);
    var pw = sc * b, ph = sc * h, x0 = (480 - pw) / 2 + 20, y1 = 60, y0 = y1 + ph;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="340" viewBox="0 0 480 340" role="img">' + AHK2;
    s += '<rect x="' + r1(x0) + '" y="' + y1 + '" width="' + r1(pw) + '" height="' + r1(ph) + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(x0 - 70) + '" y1="' + r1(y0) + '" x2="' + r1(x0 + pw + 70) + '" y2="' + r1(y0) + '" stroke="#1d4ed8" stroke-width="3" marker-start="url(#ah)" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(x0 + pw + 78) + '" y="' + r1(y0 + 5) + '" font-family="Georgia,serif" font-size="16" font-style="italic" fill="#1d4ed8">x</text>';
    s += '<line x1="' + r1(x0) + '" y1="' + (y1 - 22) + '" x2="' + r1(x0 + pw) + '" y2="' + (y1 - 22) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 + 2) + '" y1="' + (y1 - 22) + '" x2="' + r1(x0 + 22) + '" y2="' + (y1 - 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 + pw - 2) + '" y1="' + (y1 - 22) + '" x2="' + r1(x0 + pw - 22) + '" y2="' + (y1 - 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 + pw / 2) + '" y="' + (y1 - 30) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">' + b + ' mm</text>';
    s += '<line x1="' + r1(x0 - 24) + '" y1="' + y1 + '" x2="' + r1(x0 - 24) + '" y2="' + r1(y0) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 - 24) + '" y1="' + (y1 + 2) + '" x2="' + r1(x0 - 24) + '" y2="' + (y1 + 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 - 24) + '" y1="' + r1(y0 - 2) + '" x2="' + r1(x0 - 24) + '" y2="' + r1(y0 - 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 - 42) + '" y="' + r1((y0 + y1) / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a" transform="rotate(-90 ' + r1(x0 - 42) + ' ' + r1((y0 + y1) / 2) + ')">' + h + ' mm</text>';
    s += '<text x="240" y="322" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">I = ? about the base (x) axis</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A rectangular cross-section is " + b + " mm wide by " + h +
    " mm tall. What is the area moment of inertia about the bottom edge (the x-axis along the base)?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6): for a rectangle, the area moment of inertia about its base is:\n\n" +
    "$$I_{\\text{base}} = \\frac{bh^3}{3}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(I_{\\text{base}}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "b &= " + b + "\\ \\text{mm} \\\\\n" +
    "h &= " + h + "\\ \\text{mm} \\\\\n" +
    "I_{\\text{base}} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(I_{\\text{base}}) = \\frac{(" + b + ")(" + h + ")^3}{3} = " + mant + " \\times 10^{" + e + "}\\ \\text{mm}^4$$";
  return {
    variantKey: "Ix-b" + b + "-h" + h,
    question: question,
    diagram: d019,
    options: [
      { label: sci2(I, "mm⁴"), num: I, correct: true },
      { label: sci2(tCen, "mm⁴"), num: tCen, correct: false },
      { label: sci2(tTrans, "mm⁴"), num: tTrans, correct: false },
      { label: sci2(tNoDiv, "mm⁴"), num: tNoDiv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-021: frictionless inclined plane ---- */
reg(buildGenerator({
  baseId: "statics-021",
  topic: "Statics",
  subtopic: "Frictionless inclined plane",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "On a frictionless incline the required holding force is just the downslope weight component W*sin(θ). The W*cos(theta) trap is the NORMAL force, not the parallel force.",
  videoUrl: "https://www.youtube.com/watch?v=GDzy4D9Llsg",
  videoTitle: "Determine the magnitude and direction of the friction force. Chapter 6: Friction"
}, function () {
  var W = ri(200, 600);
  var th = ri(15, 35);
  var rad = th * Math.PI / 180;
  var P = r0(W * Math.sin(rad));
  var tN = r0(W * Math.cos(rad)); // trap: the normal force
  var tT = r0(W * Math.tan(rad)); // trap: tan instead of sin
  var tW = W;                     // trap: the full weight
  // Setup diagram (never the answer): block on the frictionless incline with
  // W, N, and the applied P marked unknown. No magnitudes solved.
  var d021 = (function () {
    var radA = th * Math.PI / 180;
    var ca = Math.cos(radA), sa = Math.sin(radA);
    var p0x = 60, p0y = 280, plen = 350;
    var p1x = p0x + plen * ca, p1y = p0y - plen * sa;
    var axu = ca, ayu = -sa, nxu = -sa, nyu = -ca;
    var px = p0x + 0.52 * plen * axu, py = p0y + 0.52 * plen * ayu;
    var cbx = px + 26 * nxu, cby = py + 26 * nyu;
    function pt(x2, y2) { return r1(x2) + ',' + r1(y2); }
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="340" viewBox="0 0 480 340" role="img">' + AH;
    s += '<line x1="' + p0x + '" y1="' + p0y + '" x2="' + r1(p1x) + '" y2="' + r1(p1y) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    for (var i = 0; i <= 10; i++) {
      var hx = p0x + (plen * i / 10) * axu, hy = p0y + (plen * i / 10) * ayu;
      s += '<line x1="' + r1(hx) + '" y1="' + r1(hy) + '" x2="' + r1(hx + 8 * sa) + '" y2="' + r1(hy + 8 * ca) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    }
    s += '<polygon points="' + pt(px - 46 * axu, py - 46 * ayu) + ' ' + pt(px + 46 * axu, py + 46 * ayu) + ' ' + pt(px + 46 * axu + 52 * nxu, py + 46 * ayu + 52 * nyu) + ' ' + pt(px - 46 * axu + 52 * nxu, py - 46 * ayu + 52 * nyu) + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(cbx) + '" y1="' + r1(cby) + '" x2="' + r1(cbx) + '" y2="' + r1(cby + 105) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(cbx + 12) + '" y="' + r1(cby + 70) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">W = ' + W + ' N</text>';
    s += '<line x1="' + r1(cbx) + '" y1="' + r1(cby) + '" x2="' + r1(cbx + 85 * axu) + '" y2="' + r1(cby + 85 * ayu) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(cbx + 97 * axu) + '" y="' + r1(cby + 97 * ayu + 5) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">P = ?</text>';
    s += '<line x1="' + r1(cbx) + '" y1="' + r1(cby) + '" x2="' + r1(cbx + 60 * nxu) + '" y2="' + r1(cby + 60 * nyu) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(cbx + 74 * nxu) + '" y="' + r1(cby + 74 * nyu) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-style="italic" fill="#1d4ed8">N</text>';
    s += '<line x1="' + p0x + '" y1="' + p0y + '" x2="' + (p0x + 95) + '" y2="' + p0y + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<path d="M ' + (p0x + 48) + ',' + p0y + ' A 48,48 0 0,0 ' + r1(p0x + 48 * ca) + ',' + r1(p0y - 48 * sa) + '" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>';
    s += '<text x="' + r1(p0x + 66 * Math.cos(radA / 2)) + '" y="' + r1(p0y - 66 * Math.sin(radA / 2) + 5) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">' + th + '\u00b0</text>';
    s += '<text x="240" y="325" text-anchor="middle" font-family="Georgia,serif" font-size="15" font-style="italic" fill="#1a1a1a">frictionless surface</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A " + W + " N block rests on a frictionless plane inclined at " + th +
    " degrees to the horizontal. What force P, applied parallel to the plane and directed up the plane, is required to hold the block in equilibrium?";
  var solution = "Refer to the Friction section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(P\\). With no friction, \\(P\\) balances the downslope component of the weight:\n\n" +
    "$$\\sum F_{\\parallel} = 0 \\;\\rightarrow\\; P - W\\sin\\theta = 0$$\n\n" +
    "$$(P) = (" + W + ")\\sin " + th + "^\\circ = " + P + "\\ \\text{N up the plane}$$";
  return {
    variantKey: "fri0-W" + W + "-th" + th,
    question: question,
    diagram: d021,
    options: [
      { label: P + " N up the plane", num: P, correct: true },
      { label: tN + " N up the plane", num: tN, correct: false },
      { label: tT + " N up the plane", num: tT, correct: false },
      { label: tW + " N up the plane", num: tW, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-022: scalar moment about the y-axis ---- */
reg(buildGenerator({
  baseId: "statics-022",
  topic: "Statics",
  subtopic: "Moment about a coordinate axis",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "\\(M_y = zF_x - xF_z\\): only the x- and z-components contribute, and the order matters. The traps are the single-term and sign errors.",
  videoUrl: "https://www.youtube.com/watch?v=QNNnPZ68STI",
  videoTitle: "Moment of a Force"
}, function () {
  var Fx, Fz, x, z, Fy, y, My, t1, t2;
  do {
    Fx = pick([-60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60]);
    Fz = pick([-60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60]);
    x = pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    z = pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    Fy = pick([-40, -20, 10, 30]); // flavor only: does not enter M_y
    y = pick([0.1, 0.4, 0.7]);     // flavor only: does not enter M_y
    My = r1(z * Fx - x * Fz);
    t1 = r1(z * Fx);  // trap: dropped the -x*Fz term
    t2 = r1(-x * Fz); // trap: dropped the z*Fx term
  } while (Math.abs(My) < 1 || new Set([My, t1, t2, -My]).size !== 4);
  var rVec = vec3(x, y, z, "r", "\\ \\text{m}");
  var FVec = vec3(Fx, Fy, Fz, "F", "\\ \\text{N}");
  // Setup diagram (never the answer): bracket plate in the x-z plane, the y
  // hinge axis, point P at its rolled (x, z), an illustrative F arrow; exact
  // vectors ride in the caption. The moment is not computed.
  var d022 = (function () {
    function sgn(v) { return v < 0 ? '\u2212' + Math.abs(v) : '' + v; }
    var ox = 210, oy = 60, bx = 210, by = 290;   // hinge axis top and plate origin corner
    function P2(xm, zm) { return [210 + 160 * xm - 55 * zm, 290 + 34 * zm]; }
    var pp = P2(x, z);
    var c1 = P2(0, 0), c2 = P2(1, 0), c3 = P2(1, 1), c4 = P2(0, 1);
    var AHM = '<defs><marker id="ahm" markerWidth="7" markerHeight="7" refX="5" refY="2" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L6,2 L0,4 Z" fill="#1a1a1a"/></marker></defs>';
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="380" viewBox="0 0 480 380" role="img">' + AH + AHM;
    s += '<polygon points="' + r1(c1[0]) + ',' + r1(c1[1]) + ' ' + r1(c2[0]) + ',' + r1(c2[1]) + ' ' + r1(c3[0]) + ',' + r1(c3[1]) + ' ' + r1(c4[0]) + ',' + r1(c4[1]) + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + bx + '" y1="' + by + '" x2="' + (bx + 230) + '" y2="' + by + '" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ah)"/>';
    s += '<line x1="' + bx + '" y1="' + by + '" x2="' + (bx - 64) + '" y2="' + (by + 40) + '" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ah)"/>';
    s += '<text x="' + (bx + 240) + '" y="' + (by + 6) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-style="italic" fill="#1a1a1a">x</text>';
    s += '<text x="' + (bx - 72) + '" y="' + (by + 54) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-style="italic" fill="#1a1a1a">z</text>';
    s += '<text x="' + (bx - 14) + '" y="' + (by + 20) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" font-style="italic" fill="#1a1a1a">O</text>';
    s += '<line x1="' + bx + '" y1="40" x2="' + bx + '" y2="' + by + '" stroke="#1d4ed8" stroke-width="3"/>';
    s += '<rect x="' + (bx - 8) + '" y="90" width="16" height="22" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>';
    s += '<rect x="' + (bx - 8) + '" y="180" width="16" height="22" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>';
    s += '<text x="' + (bx + 18) + '" y="46" font-family="Georgia,serif" font-size="17" font-style="italic" fill="#1d4ed8">y</text>';
    s += '<text x="' + (bx + 18) + '" y="64" font-family="Georgia,serif" font-size="12" fill="#1d4ed8">(hinge axis)</text>';
    s += '<path d="M ' + (bx + 26) + ',140 A 26,26 0 1,0 ' + (bx - 26) + ',140" fill="none" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ahm)"/>';
    s += '<text x="' + (bx + 36) + '" y="146" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">M_y = ?</text>';
    s += '<circle cx="' + r1(pp[0]) + '" cy="' + r1(pp[1]) + '" r="5" fill="#1d4ed8"/>';
    s += '<text x="' + r1(pp[0] + 12) + '" y="' + r1(pp[1] - 8) + '" font-family="Georgia,serif" font-size="16" font-style="italic" fill="#1d4ed8">P</text>';
    s += '<line x1="' + r1(pp[0]) + '" y1="' + r1(pp[1]) + '" x2="' + r1(pp[0] - 70) + '" y2="' + r1(pp[1] - 70) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(pp[0] - 44) + '" y="' + r1(pp[1] - 48) + '" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="bold" font-style="italic" fill="#1d4ed8">F</text>';
    function trm(v, u) { return v < 0 ? ' \u2212 ' + Math.abs(v) + u : ' + ' + v + u; }
    s += '<text x="240" y="362" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">F = (' + sgn(Fx) + 'i' + trm(Fy, 'j') + trm(Fz, 'k') + ') N applied at P(' + fmt(x) + ', ' + fmt(y) + ', ' + fmt(z) + ') m</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A force \\(\\mathbf{F} = " + FVec + "\\) acts at the point located by \\(\\mathbf{r} = " + rVec + "\\) relative to the origin. What is the scalar moment of the force about the y-axis?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(M_y\\). The y-component of \\(\\mathbf{r} \\times \\mathbf{F}\\) is:\n\n" +
    "$$M_y = z\\,F_x - x\\,F_z$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(M_y\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "z &= " + fmt(z) + "\\ \\text{m},\\quad F_x = " + Fx + "\\ \\text{N} \\\\\n" +
    "x &= " + fmt(x) + "\\ \\text{m},\\quad F_z = " + Fz + "\\ \\text{N} \\\\\n" +
    "M_y &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(M_y) = (" + fmt(z) + ")(" + Fx + ") - (" + fmt(x) + ")(" + Fz + ") = " + texNum(My) + "\\ \\text{N-m}$$";
  return {
    variantKey: "my-Fx" + pdot(Fx) + "-Fz" + pdot(Fz) + "-x" + pdot(x) + "-z" + pdot(z) + "-Fy" + pdot(Fy) + "-y" + pdot(y),
    question: question,
    diagram: d022,
    options: [
      { label: texNum(My) + " N-m", num: My, correct: true },
      { label: texNum(t1) + " N-m", num: t1, correct: false },
      { label: texNum(t2) + " N-m", num: t2, correct: false },
      { label: texNum(-My) + " N-m", num: -My, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-023: tipping vs slipping of a crate ---- */
reg(buildGenerator({
  baseId: "statics-023",
  topic: "Statics",
  subtopic: "Tipping vs slipping",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "Compare \\(P_{slip} = \\mu W\\) against \\(P_{tip}\\) from moment equilibrium about the tipping edge. Whichever needs the smaller P happens first.",
  videoUrl: "https://www.youtube.com/watch?v=GDzy4D9Llsg",
  videoTitle: "Determine the magnitude and direction of the friction force. Chapter 6: Friction"
}, function () {
  var W, b, h, mu, Pslip, Ptip;
  do {
    W = pick([300, 400, 500, 600, 800]);
    b = pick([0.6, 0.8, 1.0, 1.2]);
    h = pick([1.0, 1.25, 1.5, 1.75, 2.0]);
    mu = pick([0.25, 0.3, 0.35, 0.4, 0.5]);
    Pslip = r0(mu * W);
    Ptip = r0(W * b / (2 * h));
  } while (Math.abs(Pslip - Ptip) <= 5);
  var tipsFirst = Ptip < Pslip;
  var Pfirst = tipsFirst ? Ptip : Pslip;
  var Psecond = tipsFirst ? Pslip : Ptip;
  // The event is sign-encoded in num: positive = tips first, negative = slips first.
  // Setup diagram (never the answer): crate with given dims on the ground,
  // P applied at the top edge, W, N, friction shown. Tip/slip is not answered.
  var d023 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var sc = Math.min(160 / b, 210 / h);
    var cw = sc * b, ch = sc * h, x0 = 240 - cw / 2, gy = 290, y0 = gy - ch;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img">' + AHK2;
    s += '<line x1="60" y1="' + gy + '" x2="420" y2="' + gy + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    for (var i = 0; i <= 8; i++) {
      var hx = 70 + 350 * i / 8;
      s += '<line x1="' + r1(hx) + '" y1="' + gy + '" x2="' + r1(hx - 9) + '" y2="' + (gy + 11) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    }
    s += '<rect x="' + r1(x0) + '" y="' + r1(y0) + '" width="' + r1(cw) + '" height="' + r1(ch) + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + r1(x0 - 86) + '" y1="' + r1(y0) + '" x2="' + r1(x0 - 4) + '" y2="' + r1(y0) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(x0 - 46) + '" y="' + r1(y0 - 12) + '" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="bold" font-style="italic" fill="#1d4ed8">P</text>';
    s += '<line x1="240" y1="' + r1(y0 + ch / 2 - 40) + '" x2="240" y2="' + r1(y0 + ch / 2 + 40) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="252" y="' + r1(y0 + ch / 2 + 10) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">W = ' + W + ' N</text>';
    s += '<line x1="240" y1="' + (gy - 4) + '" x2="240" y2="' + (gy - 44) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="254" y="' + (gy - 14) + '" font-family="Georgia,serif" font-size="17" font-style="italic" fill="#1d4ed8">N</text>';
    s += '<line x1="' + r1(x0 + 14) + '" y1="' + (gy - 8) + '" x2="' + r1(x0 - 56) + '" y2="' + (gy - 8) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(x0 - 30) + '" y="' + (gy - 16) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-style="italic" fill="#1d4ed8">F</text>';
    s += '<line x1="' + r1(x0 - 26) + '" y1="' + r1(y0) + '" x2="' + r1(x0 - 26) + '" y2="' + gy + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 - 26) + '" y1="' + r1(y0 + 2) + '" x2="' + r1(x0 - 26) + '" y2="' + r1(y0 + 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 - 26) + '" y1="' + (gy - 2) + '" x2="' + r1(x0 - 26) + '" y2="' + (gy - 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 - 44) + '" y="' + r1((y0 + gy) / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a" transform="rotate(-90 ' + r1(x0 - 44) + ' ' + r1((y0 + gy) / 2) + ')">' + fmt(h) + ' m</text>';
    s += '<line x1="' + r1(x0) + '" y1="330" x2="' + r1(x0 + cw) + '" y2="330" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 + 2) + '" y1="330" x2="' + r1(x0 + 22) + '" y2="330" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 + cw - 2) + '" y1="330" x2="' + r1(x0 + cw - 22) + '" y2="330" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="240" y="322" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">' + fmt(b) + ' m</text>';
    s += '<text x="240" y="352" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">\u03bc\u209b = ' + fmt(mu) + '</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A " + W + " N rectangular crate (" + fmt(b) + " m wide by " + fmt(h) +
    " m tall) rests on a horizontal surface with coefficient of static friction " + fmt(mu) +
    ". A horizontal force P is applied at the top edge of the crate, pushing it sideways. Does the crate tip or slip first, and at what value of P?";
  var solution = "Refer to the Friction section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must compare \\(P_{\\text{slip}}\\) and \\(P_{\\text{tip}}\\). Slipping impends when \\(P\\) overcomes limiting friction:\n\n" +
    "$$(P_{\\text{slip}}) = \\mu_s W = (" + fmt(mu) + ")(" + W + ") = " + Pslip + "\\ \\text{N}$$\n\n" +
    "Tipping impends when the normal force shifts to the downstream edge; take moments about that edge:\n\n" +
    "$$(P_{\\text{tip}}) = \\frac{W(b/2)}{h} = \\frac{(" + W + ")(" + fmt(r2(b / 2)) + ")}{" + fmt(h) + "} = " + Ptip + "\\ \\text{N}$$\n\n" +
    (tipsFirst
      ? "Since \\(" + Ptip + " < " + Pslip + "\\), the crate tips first at \\(P = " + Ptip + "\\ \\text{N}\\)."
      : "Since \\(" + Pslip + " < " + Ptip + "\\), the crate slips first at \\(P = " + Pslip + "\\ \\text{N}\\).");
  return {
    variantKey: "tips-W" + W + "-b" + pdot(b) + "-h" + pdot(h) + "-mu" + pdot(mu),
    question: question,
    diagram: d023,
    options: [
      { label: (tipsFirst ? "Tips" : "Slips") + " first at P = " + Pfirst + " N", num: tipsFirst ? Pfirst : -Pfirst, correct: true },
      { label: (tipsFirst ? "Slips" : "Tips") + " first at P = " + Pfirst + " N", num: tipsFirst ? -Pfirst : Pfirst, correct: false },
      { label: (tipsFirst ? "Tips" : "Slips") + " first at P = " + Psecond + " N", num: tipsFirst ? Psecond : -Psecond, correct: false },
      { label: (tipsFirst ? "Slips" : "Tips") + " first at P = " + Psecond + " N", num: tipsFirst ? -Psecond : Psecond, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-024: compound beam (Gerber beam) ---- */
reg(buildGenerator({
  baseId: "statics-024",
  topic: "Statics",
  subtopic: "Compound beam (Gerber beam)",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Solve from the free end inward: the secondary beam's hinge reaction becomes a load on the primary beam. The traps mix up the hinge force direction.",
  videoUrl: "https://www.youtube.com/watch?v=4LXDkhqfn1g",
  videoTitle: "How to Find the Reactions at the Supports – Static Equilibrium of Rigid Bodies– Reaction Problem 4"
}, function () {
  var w, L1, L2, L3, P, Ay, Fh, By1, Cy;
  do {
    w = pick([1.5, 2, 2.5, 3, 4]);
    L1 = pick([4, 5, 6]);
    L2 = pick([3, 4, 5]);
    L3 = pick([1.5, 2, 2.5, 3]);
    P = pick([8, 10, 12, 15, 20]);
    Ay = r2(w * L1 / 2);
    Fh = r2(P * L3 / L2); // hinge force: secondary pushes UP on the primary at B
    By1 = r2(Ay - Fh);    // primary's own roller reaction at B
    Cy = r2(P * (L2 + L3) / L2);
  } while (Fh >= Ay - 0.5 || new Set([Ay, r2(w * L1), r2(Ay + Fh), By1]).size !== 4);
  // Setup diagram (never the answer): Gerber beam with pin at A, roller at B,
  // internal hinge at B, roller at C, overhang to D with load P, UDL on AB.
  // No reactions drawn.
  var d024 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var tot = L1 + L2 + L3;
    var sc = Math.min(370 / tot, 45);
    var ax = (480 - sc * tot) / 2, by = 190;
    var bx = ax + sc * L1, cx2 = bx + sc * L2, dx = cx2 + sc * L3;
    function dimline(x1d, x2d, y, label) {
      var d = '';
      d += '<line x1="' + r1(x1d) + '" y1="' + y + '" x2="' + r1(x2d) + '" y2="' + y + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      d += '<line x1="' + r1(x1d + 2) + '" y1="' + y + '" x2="' + r1(x1d + 22) + '" y2="' + y + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
      d += '<line x1="' + r1(x2d - 2) + '" y1="' + y + '" x2="' + r1(x2d - 22) + '" y2="' + y + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
      d += '<line x1="' + r1(x1d) + '" y1="' + (y - 6) + '" x2="' + r1(x1d) + '" y2="' + (y + 6) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      d += '<line x1="' + r1(x2d) + '" y1="' + (y - 6) + '" x2="' + r1(x2d) + '" y2="' + (y + 6) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      d += '<text x="' + r1((x1d + x2d) / 2) + '" y="' + (y - 8) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">' + label + '</text>';
      return d;
    }
    function roller(px, py) {
      var d = '';
      d += '<path d="M' + r1(px - 16) + ',' + py + ' L' + r1(px + 16) + ',' + py + ' L' + r1(px) + ',' + (py + 18) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
      d += '<circle cx="' + r1(px - 8) + '" cy="' + (py + 25) + '" r="6" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
      d += '<circle cx="' + r1(px + 8) + '" cy="' + (py + 25) + '" r="6" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
      d += '<line x1="' + r1(px - 28) + '" y1="' + (py + 31) + '" x2="' + r1(px + 28) + '" y2="' + (py + 31) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
      return d;
    }
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="340" viewBox="0 0 480 340" role="img">' + AHK2;
    s += '<line x1="' + r1(ax) + '" y1="' + by + '" x2="' + r1(dx) + '" y2="' + by + '" stroke="#1a1a1a" stroke-width="5"/>';
    s += '<path d="M' + r1(ax - 16) + ',' + by + ' L' + r1(ax + 16) + ',' + by + ' L' + r1(ax) + ',' + (by + 24) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + r1(ax - 30) + '" y1="' + (by + 24) + '" x2="' + r1(ax + 30) + '" y2="' + (by + 24) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += roller(bx, by);
    s += roller(cx2, by);
    s += '<circle cx="' + r1(bx) + '" cy="' + by + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<text x="' + r1(bx + 22) + '" y="' + (by - 12) + '" font-family="Georgia,serif" font-size="13" font-style="italic" fill="#1a1a1a">hinge</text>';
    s += '<line x1="' + r1(ax) + '" y1="' + (by - 46) + '" x2="' + r1(bx) + '" y2="' + (by - 46) + '" stroke="#1d4ed8" stroke-width="2"/>';
    for (var i = 0; i <= 6; i++) {
      var ux = ax + (bx - ax) * i / 6;
      s += '<line x1="' + r1(ux) + '" y1="' + (by - 46) + '" x2="' + r1(ux) + '" y2="' + (by - 8) + '" stroke="#1d4ed8" stroke-width="2" marker-end="url(#ah)"/>';
    }
    s += '<text x="' + r1((ax + bx) / 2) + '" y="' + (by - 58) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">w = ' + fmt(w) + ' kN/m</text>';
    s += '<line x1="' + r1(dx) + '" y1="' + (by - 58) + '" x2="' + r1(dx) + '" y2="' + (by - 6) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + r1(dx) + '" y="' + (by - 66) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">P = ' + P + ' kN</text>';
    s += '<text x="' + r1(ax) + '" y="' + (by + 52) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="#1a1a1a">A</text>';
    s += '<text x="' + r1(bx) + '" y="' + (by + 52) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="#1a1a1a">B</text>';
    s += '<text x="' + r1(cx2) + '" y="' + (by + 52) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="#1a1a1a">C</text>';
    s += '<text x="' + r1(dx) + '" y="' + (by + 24) + '" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="#1a1a1a">D</text>';
    s += dimline(ax, bx, 318, L1 + ' m');
    s += dimline(bx, cx2, 318, L2 + ' m');
    s += dimline(cx2, dx, 318, fmt(L3) + ' m');
    return svgURL(s + SVG_FTR);
  })();
  var question = "A compound (Gerber) beam: the primary segment AB has a pin at A and a roller at B, " + L1 +
    " m apart, carrying a uniformly distributed load of " + fmt(w) + " kN/m over its full length. " +
    "The secondary segment BD is hinged to the primary at B, has a roller at C " + L2 +
    " m from B, and overhangs " + fmt(L3) + " m past C to a free end D carrying a downward load of " + P +
    " kN. What is the vertical reaction at A?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(A_y\\). Work from the free end inward, starting with the secondary segment BD:\n\n" +
    "$$\\sum M_B = 0 \\;\\rightarrow\\; C_y(" + L2 + ") - (" + P + ")(" + fmt(r2(L2 + L3)) + ") = 0 \\;\\rightarrow\\; C_y = " + fmt(Cy) + "\\ \\text{kN}$$\n\n" +
    "$$\\sum F_y = 0 \\;\\rightarrow\\; B_{y2} = " + P + " - " + fmt(Cy) + " = " + texNum(r2(P - Cy)) + "\\ \\text{kN}$$\n\n" +
    "The negative \\(B_{y2}\\) means the primary pulls DOWN on the secondary at B, so by Newton's third law the secondary pushes UP on the primary with \\(F_h = " + fmt(Fh) + "\\ \\text{kN}\\). Now analyze the primary segment AB:\n\n" +
    "$$\\sum M_A = 0 \\;\\rightarrow\\; (B_{y1} + F_h)(" + L1 + ") - (" + fmt(w) + ")(" + L1 + ")\\left(\\frac{" + L1 + "}{2}\\right) = 0$$\n\n" +
    "$$\\sum F_y = 0 \\;\\rightarrow\\; A_y = (" + fmt(w) + ")(" + L1 + ") - (B_{y1} + F_h)$$\n\n" +
    "$$(A_y) = " + fmt(r2(w * L1)) + " - " + fmt(r2(By1 + Fh)) + " = " + fmt(Ay) + "\\ \\text{kN}$$";
  return {
    variantKey: "gerb-w" + pdot(w) + "-L1" + L1 + "-L2" + L2 + "-L3" + pdot(L3) + "-P" + P,
    question: question,
    diagram: d024,
    options: [
      { label: fmt(Ay) + " kN upward", num: Ay, correct: true },
      { label: fmt(r2(w * L1)) + " kN upward", num: r2(w * L1), correct: false },
      { label: fmt(r2(Ay + Fh)) + " kN upward", num: r2(Ay + Fh), correct: false },
      { label: fmt(By1) + " kN upward", num: By1, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-025: resultant of parallel forces ---- */
reg(buildGenerator({
  baseId: "statics-025",
  topic: "Statics",
  subtopic: "Resultant of parallel forces",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The resultant's magnitude is the scalar sum; its location comes from the moment equation. The trap answers locate it from the wrong end or skip the weighting.",
  videoUrl: "https://www.youtube.com/watch?v=R5NVwAb94Yo",
  videoTitle: "How to Find the Resultant of Three Force Vectors – Statics Components and Resultants Problem 18"
}, function () {
  var F1, F2, F3, x1, s1, s2, R, d, dUnwt, dWrong, x2, x3, sumFx;
  do {
    F1 = ri(5, 40); F2 = ri(5, 40); F3 = ri(5, 40);
    x1 = pick([0, 1, 2]);
    s1 = pick([2, 3, 4]); s2 = pick([2, 3, 4]);
    R = F1 + F2 + F3;
    x2 = x1 + s1; x3 = x1 + s1 + s2;
    sumFx = F1 * x1 + F2 * x2 + F3 * x3;
    d = r2(sumFx / R - x1);            // from the F1 force
    dUnwt = r2((x1 + x2 + x3) / 3 - x1); // trap: unweighted centroid of positions
    dWrong = r2(x3 - sumFx / R);         // trap: measured from the F3 end
  } while (new Set([d, dUnwt, dWrong]).size !== 3);
  var xbar = r2(sumFx / R);
  // Setup diagram (never the answer): beam with the three given forces.
  var d025 = (function () {
    var pxm = 52, ox = 40, beamY = 150, s = "";
    s += SVG_HDR + AH;
    s += '<rect x="' + ox + '" y="' + beamY + '" width="' + (11 * pxm) + '" height="10" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    [[F1, x1], [F2, x2], [F3, x3]].forEach(function (p) {
      var Fx = ox + p[1] * pxm, len = 26 + p[0];
      s += '<line x1="' + Fx + '" y1="' + (beamY - len) + '" x2="' + Fx + '" y2="' + (beamY - 4) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
      s += '<text x="' + (Fx - 24) + '" y="' + (beamY - len - 8) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">' + p[0] + ' kN</text>';
      s += '<line x1="' + Fx + '" y1="176" x2="' + Fx + '" y2="188" stroke="#1a1a1a" stroke-width="1.2"/>';
      s += '<text x="' + (Fx - 14) + '" y="206" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">' + p[1] + ' m</text>';
    });
    s += '<line x1="' + ox + '" y1="182" x2="' + (ox + 11 * pxm) + '" y2="182" stroke="#1a1a1a" stroke-width="1"/>';
    s += '<text x="' + (ox - 8) + '" y="206" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">0</text>';
    return svgURL(s + SVG_FTR);
  })();
  // num packs R and d as R + d/1000 (d < 8 m always, so the fields never overlap).
  var question = "Three parallel downward forces act on a beam: " + F1 + " kN at " + x1 +
    " m, " + F2 + " kN at " + x2 + " m, and " + F3 + " kN at " + x3 +
    " m from the left end. What is the magnitude of the resultant, and how far is its line of action from the " + F1 + " kN force?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(R\\) and \\(d\\). The resultant is the scalar sum; its location follows from moment equivalence about the left end:\n\n" +
    "$$(R) = " + F1 + " + " + F2 + " + " + F3 + " = " + R + "\\ \\text{kN}$$\n\n" +
    "$$R\\,\\bar{x} = \\sum F_i x_i = (" + F1 + ")(" + x1 + ") + (" + F2 + ")(" + x2 + ") + (" + F3 + ")(" + x3 + ") = " + sumFx + "\\ \\text{kN-m}$$\n\n" +
    "$$(\\bar{x}) = \\frac{" + sumFx + "}{" + R + "} = " + fmt(xbar) + "\\ \\text{m from the left end}$$\n\n" +
    "$$(d) = " + fmt(xbar) + " - " + x1 + " = " + fmt(d) + "\\ \\text{m from the " + F1 + " kN force}$$";
  return {
    variantKey: "par-F1" + F1 + "-F2" + F2 + "-F3" + F3 + "-x1" + x1 + "-s1" + s1 + "-s2" + s2,
    question: question,
    diagram: d025,
    options: [
      { label: R + " kN at " + fmt(d) + " m", num: R + d / 1000, correct: true },
      { label: R + " kN at " + fmt(dUnwt) + " m", num: R + dUnwt / 1000, correct: false },
      { label: R + " kN at " + fmt(dWrong) + " m", num: R + dWrong / 1000, correct: false },
      { label: (F1 + F2) + " kN at " + fmt(d) + " m", num: F1 + F2 + d / 1000, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-026: screw jack, tightening torque ---- */
reg(buildGenerator({
  baseId: "statics-026",
  topic: "Statics",
  subtopic: "Screw jack (tightening)",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "Tightening uses tan(α + φ): the friction angle ADDS to the lead angle. The tan(α − φ) trap is the LOOSENING formula.",
  videoUrl: "https://www.youtube.com/watch?v=q2a5WUypqZE",
  videoTitle: "Screw Jack - Working Principle"
}, function () {
  var WkN, r, alphaDeg, mu, phiDeg, M, tLoose, tNoF, tLead;
  do {
    WkN = ri(10, 30);                 // kN
    r = ri(30, 50);                   // mm
    alphaDeg = pick([5, 6, 7, 8]);    // lead angle, degrees
    mu = pick([0.06, 0.08, 0.10]);
    phiDeg = Math.atan(mu) * 180 / Math.PI;
    var a = alphaDeg * Math.PI / 180, p = phiDeg * Math.PI / 180;
    M = r0(WkN * r * Math.tan(a + p)); // W(kN)*r(mm)*tan = N-m
    tLoose = r0(WkN * r * Math.tan(a - p)); // trap: loosening formula
    tNoF = r0(WkN * r * Math.tan(a));       // trap: ignored friction
    tLead = r0(WkN * r * Math.tan(p));      // trap: used the friction angle alone
  } while (alphaDeg - phiDeg <= 0.5 || new Set([M, tLoose, tNoF, tLead]).size !== 4);
  var question = "A square-threaded screw jack has a mean thread radius of " + r +
    " mm, a lead angle of " + alphaDeg + " degrees, and a thread coefficient of friction of " + fmt(mu) +
    ". What torque must be applied to the screw to RAISE a " + WkN + " kN load (tighten against the load)?";
  var solution = "Refer to the Screw Thread section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(M\\), the tightening torque. For raising the load the friction angle adds to the lead angle:\n\n" +
    "$$M = W\\,r\\,\\tan(\\alpha + \\phi),\\qquad \\phi = \\tan^{-1}\\mu$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(M\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "W &= " + WkN + "\\ \\text{kN} = " + (WkN * 1000) + "\\ \\text{N} \\\\\n" +
    "r &= " + r + "\\ \\text{mm} = " + fmt(r / 1000) + "\\ \\text{m} \\\\\n" +
    "\\phi &= \\tan^{-1}(" + fmt(mu) + ") = " + fmt(r1(phiDeg)) + "^\\circ \\\\\n" +
    "M &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(M) = (" + (WkN * 1000) + ")(" + fmt(r / 1000) + ")\\tan(" + alphaDeg + "^\\circ + " + fmt(r1(phiDeg)) + "^\\circ) = " + M + "\\ \\text{N-m}$$";
  return {
    variantKey: "scr-W" + WkN + "-r" + r + "-a" + alphaDeg + "-mu" + pdot(mu),
    question: question,
    options: [
      { label: M + " N-m", num: M, correct: true },
      { label: tLoose + " N-m", num: tLoose, correct: false },
      { label: tNoF + " N-m", num: tNoF, correct: false },
      { label: tLead + " N-m", num: tLead, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-027: limiting static friction ---- */
reg(buildGenerator({
  baseId: "statics-027",
  topic: "Statics",
  subtopic: "Limiting static friction",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Limiting friction is \\(\\mu_s \\cdot N\\) - the maximum static friction before motion impends. The W/μ trap inverts the relationship.",
  videoUrl: "https://www.youtube.com/watch?v=GDzy4D9Llsg",
  videoTitle: "Determine the magnitude and direction of the friction force. Chapter 6: Friction"
}, function () {
  var W = pick([100, 150, 200, 250, 300, 400]);
  var mu = pick([0.2, 0.25, 0.3, 0.35, 0.4, 0.45]);
  var Pmax = r0(mu * W);
  var tW = W;                 // trap: reported the normal force
  var tHalf = r0(mu * W / 2); // trap: halved it
  var tInv = r0(W / mu);      // trap: inverted the relationship
  var question = "A " + W + " N block rests on a horizontal surface with a coefficient of static friction of " + fmt(mu) +
    ". What is the maximum horizontal force that can be applied to the block without causing motion?";
  var solution = "Refer to the Friction section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(P_{\\max}\\). Motion impends when the applied force reaches limiting friction:\n\n" +
    "$$F_{\\max} = \\mu_s N = \\mu_s W$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(P_{\\max}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "\\mu_s &= " + fmt(mu) + " \\\\\n" +
    "W &= " + W + "\\ \\text{N} \\\\\n" +
    "P_{\\max} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(P_{\\max}) = (" + fmt(mu) + ")(" + W + ") = " + Pmax + "\\ \\text{N}$$";
  return {
    variantKey: "lim-W" + W + "-mu" + pdot(mu),
    question: question,
    options: [
      { label: Pmax + " N", num: Pmax, correct: true },
      { label: tW + " N", num: tW, correct: false },
      { label: tHalf + " N", num: tHalf, correct: false },
      { label: tInv + " N", num: tInv, correct: false }
    ],
    solution: solution
  };
}));
/* ---- statics-028: radius of gyration of a rectangle ---- */
reg(buildGenerator({
  baseId: "statics-028",
  topic: "Statics",
  subtopic: "Radius of gyration",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "r = sqrt(I/A): for a rectangle about its strong centroidal axis this collapses to h/sqrt(12). The traps are the base-axis value and the weak-axis value.",
  videoUrl: "https://www.youtube.com/watch?v=Bls5KnQdCo0",
  videoTitle: "Statics: Lesson 67 - Introduction to Area Moment of Inertia"
}, function () {
  var b = pick([80, 100, 120]);
  var h = pick([150, 200, 250, 300]); // b < h always, so this is the strong axis
  var r = r1(h / Math.sqrt(12));
  var tBase = r1(h / Math.sqrt(3));  // trap: radius of gyration about the base
  var tWeak = r1(b / Math.sqrt(12)); // trap: weak-axis value
  var tH = h;                        // trap: reported h itself
  // Setup diagram (never the answer): the section, its dims, and the
  // horizontal centroidal axis identified. No value shown.
  var d028 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var sc = Math.min(180 / b, 220 / h);
    var pw = sc * b, ph = sc * h, x0 = 200 - pw / 2, y1 = 40, y0 = y1 + ph, yc = y1 + ph / 2;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="330" viewBox="0 0 480 330" role="img">' + AHK2;
    s += '<rect x="' + r1(x0) + '" y="' + y1 + '" width="' + r1(pw) + '" height="' + r1(ph) + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="3"/>';
    s += '<line x1="' + r1(x0 - 40) + '" y1="' + r1(yc) + '" x2="' + r1(x0 + pw + 40) + '" y2="' + r1(yc) + '" stroke="#1a1a1a" stroke-width="1.8" stroke-dasharray="8,5"/>';
    s += '<text x="' + r1(x0 + pw + 48) + '" y="' + r1(yc + 5) + '" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">centroidal axis</text>';
    s += '<line x1="' + r1(x0) + '" y1="' + (y0 + 24) + '" x2="' + r1(x0 + pw) + '" y2="' + (y0 + 24) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 + 2) + '" y1="' + (y0 + 24) + '" x2="' + r1(x0 + 22) + '" y2="' + (y0 + 24) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 + pw - 2) + '" y1="' + (y0 + 24) + '" x2="' + r1(x0 + pw - 22) + '" y2="' + (y0 + 24) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 + pw / 2) + '" y="' + (y0 + 44) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">' + b + ' mm</text>';
    s += '<line x1="' + r1(x0 + pw + 24) + '" y1="' + y1 + '" x2="' + r1(x0 + pw + 24) + '" y2="' + r1(y0) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(x0 + pw + 24) + '" y1="' + (y1 + 2) + '" x2="' + r1(x0 + pw + 24) + '" y2="' + (y1 + 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(x0 + pw + 24) + '" y1="' + r1(y0 - 2) + '" x2="' + r1(x0 + pw + 24) + '" y2="' + r1(y0 - 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(x0 + pw + 42) + '" y="' + r1((y0 + y1) / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a" transform="rotate(-90 ' + r1(x0 + pw + 42) + ' ' + r1((y0 + y1) / 2) + ')">' + h + ' mm</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A rectangular cross-section is " + b + " mm wide by " + h +
    " mm tall. What is the radius of gyration about the horizontal centroidal axis (the strong axis)?";
  var solution = "Refer to the Radius of Gyration section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(r_x\\). The radius of gyration is defined by \\(r = \\sqrt{I/A}\\):\n\n" +
    "$$r_x = \\sqrt{\\frac{I_x}{A}} = \\sqrt{\\frac{bh^3/12}{bh}} = \\frac{h}{\\sqrt{12}}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(r_x\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "h &= " + h + "\\ \\text{mm} \\\\\n" +
    "r_x &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(r_x) = \\frac{" + h + "}{\\sqrt{12}} = " + fmt(r) + "\\ \\text{mm}$$";
  return {
    variantKey: "rg-b" + b + "-h" + h,
    question: question,
    diagram: d028,
    options: [
      { label: fmt(r) + " mm", num: r, correct: true },
      { label: fmt(tBase) + " mm", num: tBase, correct: false },
      { label: fmt(tWeak) + " mm", num: tWeak, correct: false },
      { label: fmt(tH) + " mm", num: tH, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-029: product of inertia, parallel-axis theorem ---- */
reg(buildGenerator({
  baseId: "statics-029",
  topic: "Statics",
  subtopic: "Product of inertia (parallel axis)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "\\(I_{xy} = I_{x_c y_c} + A d_x d_y\\): for a rectangle with sides parallel to the axes, the centroidal product is zero and only the transfer term survives.",
  videoUrl: "https://www.youtube.com/watch?v=Bls5KnQdCo0",
  videoTitle: "Statics: Lesson 67 - Introduction to Area Moment of Inertia"
}, function () {
  var b, h, dx, dy, Ixy, tHalf, tSum, tPlus;
  do {
    b = ri(3, 6); h = ri(4, 8);
    dx = pick([2, 3, 4]); dy = pick([1.5, 2, 2.5, 3]);
    Ixy = r2(b * h * dx * dy);
    tHalf = r2(b * h * dx * dy / 2); // trap: halved the transfer term
    tSum = r2(b * h * (dx + dy));    // trap: added the offsets instead of multiplying
    tPlus = r2(b * h * h * h / 12 + b * b * b * h / 12); // trap: Ix_c + Iy_c
  } while (new Set([Ixy, tHalf, tSum, tPlus]).size !== 4);
  // Setup diagram (never the answer): axes through O, the rectangle with its
  // centroid at the given offset, centroidal axes dashed, all dims given.
  var d029 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var maxX = dx + b / 2, maxY = dy + h / 2;
    var sc = Math.min(300 / (maxX + 0.6), 200 / (maxY + 0.6));
    var ox = 80, oy = Math.min(280, 325 - sc * Math.max(0, h / 2 - dy));
    function X(v) { return ox + sc * v; }
    function Y(v) { return oy - sc * v; }
    var rx0 = X(dx - b / 2), rx1 = X(dx + b / 2), ry0 = Y(dy + h / 2), ry1 = Y(dy - h / 2);
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="340" viewBox="0 0 480 340" role="img">' + AHK2;
    s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + 360) + '" y2="' + oy + '" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ahk)"/>';
    s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + ox + '" y2="30" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ahk)"/>';
    s += '<text x="' + (ox + 368) + '" y="' + (oy + 5) + '" font-family="Georgia,serif" font-size="16" font-style="italic" fill="#1a1a1a">x</text>';
    s += '<text x="' + (ox - 8) + '" y="24" font-family="Georgia,serif" font-size="16" font-style="italic" fill="#1a1a1a">y</text>';
    s += '<text x="' + (ox - 16) + '" y="' + (oy + 20) + '" font-family="Georgia,serif" font-size="14" font-style="italic" fill="#1a1a1a">O</text>';
    s += '<rect x="' + r1(rx0) + '" y="' + r1(ry0) + '" width="' + r1(rx1 - rx0) + '" height="' + r1(ry1 - ry0) + '" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2.5"/>';
    s += '<line x1="' + r1(rx0 - 14) + '" y1="' + r1(Y(dy)) + '" x2="' + r1(rx1 + 14) + '" y2="' + r1(Y(dy)) + '" stroke="#9aa0b4" stroke-width="1.6" stroke-dasharray="8,5"/>';
    s += '<line x1="' + r1(X(dx)) + '" y1="' + r1(ry0 - 14) + '" x2="' + r1(X(dx)) + '" y2="' + r1(ry1 + 14) + '" stroke="#9aa0b4" stroke-width="1.6" stroke-dasharray="8,5"/>';
    s += '<line x1="' + r1(ox) + '" y1="' + r1(ry0 - 30) + '" x2="' + r1(X(dx)) + '" y2="' + r1(ry0 - 30) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(ox + 2) + '" y1="' + r1(ry0 - 30) + '" x2="' + r1(ox + 22) + '" y2="' + r1(ry0 - 30) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(X(dx) - 2) + '" y1="' + r1(ry0 - 30) + '" x2="' + r1(X(dx) - 22) + '" y2="' + r1(ry0 - 30) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1((ox + X(dx)) / 2) + '" y="' + r1(ry0 - 38) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">' + fmt(dx) + ' in.</text>';
    s += '<line x1="' + r1(rx0 - 30) + '" y1="' + oy + '" x2="' + r1(rx0 - 30) + '" y2="' + r1(Y(dy)) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(rx0 - 30) + '" y1="' + (oy - 2) + '" x2="' + r1(rx0 - 30) + '" y2="' + (oy - 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(rx0 - 30) + '" y1="' + r1(Y(dy) + 2) + '" x2="' + r1(rx0 - 30) + '" y2="' + r1(Y(dy) + 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(rx0 - 46) + '" y="' + r1((oy + Y(dy)) / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a" transform="rotate(-90 ' + r1(rx0 - 46) + ' ' + r1((oy + Y(dy)) / 2) + ')">' + fmt(dy) + ' in.</text>';
    s += '<line x1="' + r1(rx0) + '" y1="' + (oy + 26) + '" x2="' + r1(rx1) + '" y2="' + (oy + 26) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(rx0 + 2) + '" y1="' + (oy + 26) + '" x2="' + r1(rx0 + 22) + '" y2="' + (oy + 26) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(rx1 - 2) + '" y1="' + (oy + 26) + '" x2="' + r1(rx1 - 22) + '" y2="' + (oy + 26) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1((rx0 + rx1) / 2) + '" y="' + (oy + 46) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">' + b + ' in.</text>';
    s += '<line x1="' + r1(rx1 + 26) + '" y1="' + r1(ry0) + '" x2="' + r1(rx1 + 26) + '" y2="' + r1(ry1) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + r1(rx1 + 26) + '" y1="' + r1(ry0 + 2) + '" x2="' + r1(rx1 + 26) + '" y2="' + r1(ry0 + 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + r1(rx1 + 26) + '" y1="' + r1(ry1 - 2) + '" x2="' + r1(rx1 + 26) + '" y2="' + r1(ry1 - 22) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + r1(rx1 + 44) + '" y="' + r1((ry0 + ry1) / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a" transform="rotate(-90 ' + r1(rx1 + 44) + ' ' + r1((ry0 + ry1) / 2) + ')">' + h + ' in.</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A rectangle " + b + " in. wide (x-direction) by " + h +
    " in. tall (y-direction) has its centroid at (" + fmt(dx) + " in., " + fmt(dy) +
    " in.) relative to the origin O. What is the product of inertia \\(I_{xy}\\) of the rectangle about the x- and y-axes through O?";
  var solution = "Refer to the Product of Inertia section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(I_{xy}\\). The parallel-axis relation for the product of inertia is:\n\n" +
    "$$I_{xy} = I_{x_c y_c} + A\\,d_x d_y$$\n\n" +
    "For a rectangle with sides parallel to the axes, \\(I_{x_c y_c} = 0\\):\n\n" +
    "$$(I_{xy}) = (" + b + ")(" + h + ")(" + fmt(dx) + ")(" + fmt(dy) + ") = " + fmt(Ixy) + "\\ \\text{in}^4$$";
  return {
    variantKey: "Ixy-b" + b + "-h" + h + "-dx" + pdot(dx) + "-dy" + pdot(dy),
    question: question,
    diagram: d029,
    options: [
      { label: fmt(Ixy) + " in⁴", num: Ixy, correct: true },
      { label: fmt(tHalf) + " in⁴", num: tHalf, correct: false },
      { label: fmt(tSum) + " in⁴", num: tSum, correct: false },
      { label: fmt(tPlus) + " in⁴", num: tPlus, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-030: center of mass of discrete point masses ---- */
reg(buildGenerator({
  baseId: "statics-030",
  topic: "Statics",
  subtopic: "Centroid of discrete masses",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "The center of mass is the mass-weighted average of positions. The traps are the unweighted average and the swapped coordinates.",
  videoUrl: "https://www.youtube.com/watch?v=B6UBikXkAqk",
  videoTitle: "Centroid & Centre of Gravity"
}, function () {
  var m1, m2, m3, x1, y1, x2, y2, x3, y3, M, xb, yb, xu, yu, xd, yd, cSwap, cUnwt, cDiv;
  do {
    m1 = ri(1, 6); m2 = ri(1, 6); m3 = ri(1, 6);
    x1 = ri(0, 4); y1 = ri(0, 4);
    x2 = ri(0, 4); y2 = ri(0, 4);
    x3 = ri(0, 4); y3 = ri(0, 4);
    M = m1 + m2 + m3;
    xb = r2((m1 * x1 + m2 * x2 + m3 * x3) / M);
    yb = r2((m1 * y1 + m2 * y2 + m3 * y3) / M);
    xu = r2((x1 + x2 + x3) / 3); yu = r2((y1 + y2 + y3) / 3); // trap: unweighted average
    xd = r2((m1 * x1 + m2 * x2 + m3 * x3) / 3); yd = r2((m1 * y1 + m2 * y2 + m3 * y3) / 3); // trap: divided by 3
    cSwap = yb + xb / 1000; // trap: swapped coordinates
    cUnwt = xu + yu / 1000;
    cDiv = xd + yd / 1000;
  } while ((m1 === m2 && m2 === m3) || xb === yb || new Set([xb + yb / 1000, cSwap, cUnwt, cDiv]).size !== 4);
  // num packs the centroid as xbar + ybar/1000 (coordinates are < 5, so the fields never overlap).
  // Setup diagram (never the answer): the three masses plotted on the axes.
  // The center of mass is not drawn.
  var d030 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var sc = 62, ox = 70, oy = 290;
    function X(v) { return ox + sc * v; }
    function Y(v) { return oy - sc * v; }
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img">' + AHK2;
    s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + 340) + '" y2="' + oy + '" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ahk)"/>';
    s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + ox + '" y2="30" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ahk)"/>';
    s += '<text x="' + (ox + 348) + '" y="' + (oy + 5) + '" font-family="Georgia,serif" font-size="15" font-style="italic" fill="#1a1a1a">x (m)</text>';
    s += '<text x="' + (ox - 4) + '" y="22" font-family="Georgia,serif" font-size="15" font-style="italic" fill="#1a1a1a">y (m)</text>';
    for (var i = 1; i <= 4; i++) {
      s += '<line x1="' + X(i) + '" y1="' + (oy - 6) + '" x2="' + X(i) + '" y2="' + (oy + 6) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      s += '<text x="' + X(i) + '" y="' + (oy + 24) + '" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#1a1a1a">' + i + '</text>';
      s += '<line x1="' + (ox - 6) + '" y1="' + Y(i) + '" x2="' + (ox + 6) + '" y2="' + Y(i) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
      s += '<text x="' + (ox - 14) + '" y="' + (Y(i) + 5) + '" text-anchor="end" font-family="Georgia,serif" font-size="13" fill="#1a1a1a">' + i + '</text>';
    }
    var pts = [[m1, x1, y1], [m2, x2, y2], [m3, x3, y3]];
    for (var j = 0; j < 3; j++) {
      var px = X(pts[j][1]), py = Y(pts[j][2]);
      s += '<circle cx="' + px + '" cy="' + py + '" r="7" fill="#1d4ed8"/>';
      s += '<text x="' + px + '" y="' + (py - 14) + '" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#1a1a1a">' + pts[j][0] + ' kg at (' + pts[j][1] + ', ' + pts[j][2] + ')</text>';
    }
    return svgURL(s + SVG_FTR);
  })();
  var question = "Three point masses lie in the xy-plane: " + m1 + " kg at (" + x1 + " m, " + y1 +
    " m), " + m2 + " kg at (" + x2 + " m, " + y2 + " m), and " + m3 + " kg at (" + x3 + " m, " + y3 +
    " m). What are the coordinates (x-bar, y-bar) of the center of mass?";
  var solution = "Refer to the Centroids of Masses, Areas, Lengths, and Volumes section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\bar{x}\\) and \\(\\bar{y}\\). The center of mass is the mass-weighted average:\n\n" +
    "$$\\bar{x} = \\frac{\\sum m_i x_i}{\\sum m_i},\\qquad \\bar{y} = \\frac{\\sum m_i y_i}{\\sum m_i}$$\n\n" +
    "$$(\\bar{x}) = \\frac{(" + m1 + ")(" + x1 + ") + (" + m2 + ")(" + x2 + ") + (" + m3 + ")(" + x3 + ")}{" + m1 + " + " + m2 + " + " + m3 + "} = \\frac{" + (m1 * x1 + m2 * x2 + m3 * x3) + "}{" + M + "} = " + fmt(xb) + "\\ \\text{m}$$\n\n" +
    "$$(\\bar{y}) = \\frac{(" + m1 + ")(" + y1 + ") + (" + m2 + ")(" + y2 + ") + (" + m3 + ")(" + y3 + ")}{" + M + "} = \\frac{" + (m1 * y1 + m2 * y2 + m3 * y3) + "}{" + M + "} = " + fmt(yb) + "\\ \\text{m}$$";
  return {
    variantKey: "cm-m" + m1 + "_" + m2 + "_" + m3 + "-p" + x1 + "_" + y1 + "_" + x2 + "_" + y2 + "_" + x3 + "_" + y3,
    question: question,
    diagram: d030,
    options: [
      { label: "(" + fmt(xb) + ", " + fmt(yb) + ") m", num: xb + yb / 1000, correct: true },
      { label: "(" + fmt(yb) + ", " + fmt(xb) + ") m", num: cSwap, correct: false },
      { label: "(" + fmt(xu) + ", " + fmt(yu) + ") m", num: cUnwt, correct: false },
      { label: "(" + fmt(xd) + ", " + fmt(yd) + ") m", num: cDiv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-031: screw jack, loosening torque ---- */
reg(buildGenerator({
  baseId: "statics-031",
  topic: "Statics",
  subtopic: "Screw jack (loosening)",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "Loosening uses tan(α − φ): friction now OPPOSES the unwinding. The tan(α + φ) trap is the TIGHTENING formula.",
  videoUrl: "https://www.youtube.com/watch?v=q2a5WUypqZE",
  videoTitle: "Screw Jack - Working Principle"
}, function () {
  var WkN, r, alphaDeg, mu, phiDeg, M, tTight, tNoF, tLead;
  do {
    WkN = ri(6, 12);
    r = ri(20, 35);
    alphaDeg = pick([4, 5, 6]);
    mu = pick([0.05, 0.06, 0.07]);
    phiDeg = Math.atan(mu) * 180 / Math.PI;
    var a = alphaDeg * Math.PI / 180, p = phiDeg * Math.PI / 180;
    M = r2(WkN * r * Math.tan(a - p)); // W(kN)*r(mm)*tan = N-m
    tTight = r2(WkN * r * Math.tan(a + p)); // trap: tightening formula
    tNoF = r2(WkN * r * Math.tan(a));       // trap: ignored friction
    tLead = r2(WkN * r * Math.tan(p));      // trap: used the friction angle alone
  } while (alphaDeg - phiDeg <= 0.3 || new Set([M, tTight, tNoF, tLead]).size !== 4);
  var question = "A square-threaded screw jack has a mean thread radius of " + r +
    " mm, a lead angle of " + alphaDeg + " degrees, and a thread coefficient of friction of " + fmt(mu) +
    ". What torque must be applied to the screw to LOWER a " + WkN + " kN load (unwind against the load)?";
  var solution = "Refer to the Screw Thread section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(M\\), the loosening torque. For lowering the load the friction angle subtracts from the lead angle:\n\n" +
    "$$M = W\\,r\\,\\tan(\\alpha - \\phi),\\qquad \\phi = \\tan^{-1}\\mu$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(M\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "W &= " + WkN + "\\ \\text{kN} = " + (WkN * 1000) + "\\ \\text{N} \\\\\n" +
    "r &= " + r + "\\ \\text{mm} = " + fmt(r / 1000) + "\\ \\text{m} \\\\\n" +
    "\\phi &= \\tan^{-1}(" + fmt(mu) + ") = " + fmt(r1(phiDeg)) + "^\\circ \\\\\n" +
    "M &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(M) = (" + (WkN * 1000) + ")(" + fmt(r / 1000) + ")\\tan(" + alphaDeg + "^\\circ - " + fmt(r1(phiDeg)) + "^\\circ) = " + fmt(M) + "\\ \\text{N-m}$$";
  return {
    variantKey: "scrl-W" + WkN + "-r" + r + "-a" + alphaDeg + "-mu" + pdot(mu),
    question: question,
    options: [
      { label: fmt(M) + " N-m", num: M, correct: true },
      { label: fmt(tTight) + " N-m", num: tTight, correct: false },
      { label: fmt(tNoF) + " N-m", num: tNoF, correct: false },
      { label: fmt(tLead) + " N-m", num: tLead, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-032: polar moment of inertia ---- */
reg(buildGenerator({
  baseId: "statics-032",
  topic: "Statics",
  subtopic: "Polar moment of inertia",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "\\(J = I_x + I_y\\), the sum - not the difference. The difference trap is the formula for the in-plane principal values, not J.",
  videoUrl: "https://www.youtube.com/watch?v=Bls5KnQdCo0",
  videoTitle: "Statics: Lesson 67 - Introduction to Area Moment of Inertia"
}, function () {
  var Ix, Iy, J, tDiff, tProd, tHalf;
  do {
    Ix = pick([100, 150, 200, 250, 300, 400]);
    Iy = pick([150, 200, 250, 300, 350, 450, 500]);
    J = Ix + Iy;
    tDiff = Math.abs(Ix - Iy); // trap: difference
    tProd = Ix * Iy;           // trap: product
    tHalf = (Ix + Iy) / 2;     // trap: average
  } while (Ix === Iy);
  var question = "A cross-section has area moments of inertia \\(I_x = " + Ix + "\\text{ cm}^4\\) and \\(I_y = " + Iy +
    "\\text{ cm}^4\\) about perpendicular centroidal axes. What is the polar moment of inertia of the area about the centroid?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6): the polar moment of inertia is the sum of the two perpendicular area moments:\n\n" +
    "$$J = I_x + I_y$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(J\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "I_x &= " + Ix + "\\ \\text{cm}^4 \\\\\n" +
    "I_y &= " + Iy + "\\ \\text{cm}^4 \\\\\n" +
    "J &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(J) = " + Ix + " + " + Iy + " = " + J + "\\ \\text{cm}^4$$";
  return {
    variantKey: "J-Ix" + Ix + "-Iy" + Iy,
    question: question,
    options: [
      { label: J + " cm⁴", num: J, correct: true },
      { label: tDiff + " cm⁴", num: tDiff, correct: false },
      { label: tProd + " cm⁴", num: tProd, correct: false },
      { label: tHalf + " cm⁴", num: tHalf, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-033: single equivalent force of a coplanar system ---- */
reg(buildGenerator({
  baseId: "statics-033",
  topic: "Statics",
  subtopic: "Single equivalent force (coplanar system)",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "The resultant's line of action comes from the moment equation: \\(d = M_O / R\\). The traps use the scalar sum of forces or the wrong moment arm.",
  videoUrl: "https://www.youtube.com/watch?v=R5NVwAb94Yo",
  videoTitle: "How to Find the Resultant of Three Force Vectors – Statics Components and Resultants Problem 18"
}, function () {
  var F1, F2, F3, b, h, FR, d, t1, t2, t3, Rx;
  do {
    F1 = ri(30, 80); F2 = ri(20, 50); F3 = ri(20, 50);
    b = pick([1.5, 2, 2.5, 3]);
    h = pick([2, 2.5, 3, 3.5, 4]); // flavor: vertical position of F3
    Rx = F1 - F2;
    FR = r2(Math.sqrt(Rx * Rx + F3 * F3));
    d = r2(b * F3 / FR);
    t1 = r2(b * F3 / (Math.abs(Rx) + F3));      // trap: scalar sum for the resultant
    t2 = r2(b * F3 / Math.sqrt(F2 * F2 + F3 * F3)); // trap: dropped F1 from Rx
    t3 = r2(h * F3 / FR);                          // trap: wrong moment arm
  } while (F1 === F2 || new Set([d, t1, t2, t3]).size !== 4);
  // Setup diagram (never the answer): bracket, origin, and the three given forces.
  var d033 = (function () {
    var pxm = 45, ox = 120, oy = 220, s = "";
    var Bx = ox + b * pxm, Cy = oy - h * pxm;
    s += SVG_HDR + AH;
    s += '<rect x="105" y="' + (Cy - 25) + '" width="' + (Bx - 105 + 50) + '" height="' + (oy + 20 - (Cy - 25)) + '" fill="#1d4ed8" opacity="0.06" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="60" y1="' + oy + '" x2="360" y2="' + oy + '" stroke="#1a1a1a" stroke-width="1.4" marker-end="url(#ah)"/>';
    s += '<line x1="' + ox + '" y1="285" x2="' + ox + '" y2="30" stroke="#1a1a1a" stroke-width="1.4" marker-end="url(#ah)"/>';
    s += '<text x="348" y="' + (oy - 8) + '" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">x</text>';
    s += '<text x="' + (ox + 8) + '" y="44" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">y</text>';
    s += '<circle cx="' + ox + '" cy="' + oy + '" r="4" fill="#1a1a1a"/>';
    s += '<text x="' + (ox - 22) + '" y="' + (oy + 22) + '" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">O</text>';
    s += '<line x1="' + ox + '" y1="200" x2="' + (ox + 55) + '" y2="200" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (ox + 58) + '" y="194" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">' + F1 + ' N</text>';
    s += '<line x1="' + (Bx + 55) + '" y1="200" x2="' + Bx + '" y2="200" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (Bx + 58) + '" y="194" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">' + F2 + ' N</text>';
    s += '<line x1="' + Bx + '" y1="' + (Cy + 55) + '" x2="' + Bx + '" y2="' + Cy + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (Bx + 8) + '" y="' + (Cy + 30) + '" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">' + F3 + ' N</text>';
    s += '<text x="' + (Bx + 8) + '" y="' + (Cy + 48) + '" font-family="Georgia,serif" font-size="13" fill="#1a1a1a">(' + fmt(b) + ' m, ' + fmt(h) + ' m)</text>';
    s += '<text x="' + (Bx - 12) + '" y="292" font-family="Georgia,serif" font-size="13" fill="#1a1a1a">(' + fmt(b) + ' m, 0)</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "Three coplanar forces act on a bracket: " + F1 + " N in the +x-direction at O(0, 0), " + F2 +
    " N in the −x-direction at (" + fmt(b) + " m, 0), and " + F3 + " N in the +y-direction at (" + fmt(b) +
    " m, " + fmt(h) + " m). What is the perpendicular distance from O to the line of action of the single resultant force?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(d\\), using \\(d = M_O / R\\). Sum the force components:\n\n" +
    "$$R_x = " + F1 + " - " + F2 + " = " + Rx + "\\ \\text{N},\\qquad R_y = " + F3 + "\\ \\text{N}$$\n\n" +
    "$$(R) = \\sqrt{(" + Rx + ")^2 + (" + F3 + ")^2} = " + fmt(FR) + "\\ \\text{N}$$\n\n" +
    "Sum moments about O (only the " + F3 + " N force contributes):\n\n" +
    "$$(M_O) = (" + fmt(b) + ")(" + F3 + ") = " + fmt(r2(b * F3)) + "\\ \\text{N-m}$$\n\n" +
    "$$(d) = \\frac{" + fmt(r2(b * F3)) + "}{" + fmt(FR) + "} = " + fmt(d) + "\\ \\text{m}$$";
  return {
    variantKey: "eqv-F1" + F1 + "-F2" + F2 + "-F3" + F3 + "-b" + pdot(b) + "-h" + pdot(h),
    question: question,
    diagram: d033,
    options: [
      { label: fmt(d) + " m", num: d, correct: true },
      { label: fmt(t1) + " m", num: t1, correct: false },
      { label: fmt(t2) + " m", num: t2, correct: false },
      { label: fmt(t3) + " m", num: t3, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-034: centroid of a bent wire (composite line) ---- */
reg(buildGenerator({
  baseId: "statics-034",
  topic: "Statics",
  subtopic: "Centroid of a wire (composite line)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "A wire's centroid weights each SEGMENT by its length. The trap is the unweighted midpoint average of the segment centroids.",
  videoUrl: "https://www.youtube.com/watch?v=B6UBikXkAqk",
  videoTitle: "Centroid & Centre of Gravity"
}, function () {
  var a, b, xb, yb, xu, yu, yHalf, cUnwt, cSwap, cHalf;
  do {
    a = ri(3, 6); b = ri(2, 5);
    xb = r2(a * (a / 2 + b) / (a + b));
    yb = r2(b * b / (2 * (a + b)));
    xu = r2(3 * a / 4); yu = r2(b / 4); // trap: unweighted average of segment centroids
    yHalf = r2(b * b / (a + b));        // trap: dropped the /2 in y-bar
    cUnwt = xu + yu / 1000;
    cSwap = yb + xb / 1000;             // trap: swapped coordinates
    cHalf = xb + yHalf / 1000;
  } while (a === b || new Set([xb + yb / 1000, cUnwt, cSwap, cHalf]).size !== 4);
  // num packs the centroid as xbar + ybar/1000 (coordinates are < 7, so the fields never overlap).
  // Setup diagram (never the answer): the bent wire with its leg lengths and
  // endpoint coordinates. The centroid is not drawn.
  var d034 = (function () {
    var sc = Math.min(300 / a, 200 / b);
    var ox = 90, oy = 290;
    var cx2 = ox + sc * a, cy = oy, ty = oy - sc * b;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img">';
    s += '<polyline points="' + ox + ',' + oy + ' ' + r1(cx2) + ',' + oy + ' ' + r1(cx2) + ',' + r1(ty) + '" fill="none" stroke="#1a1a1a" stroke-width="5"/>';
    s += '<circle cx="' + ox + '" cy="' + oy + '" r="6" fill="#1a1a1a"/>';
    s += '<circle cx="' + r1(cx2) + '" cy="' + oy + '" r="6" fill="#1a1a1a"/>';
    s += '<circle cx="' + r1(cx2) + '" cy="' + r1(ty) + '" r="6" fill="#1a1a1a"/>';
    s += '<text x="' + ox + '" y="' + (oy + 26) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">(0, 0)</text>';
    s += '<text x="' + r1(cx2) + '" y="' + (oy + 26) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">(' + a + ', 0)</text>';
    s += '<text x="' + r1(cx2 + 44) + '" y="' + r1(ty + 5) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">(' + a + ', ' + b + ')</text>';
    s += '<text x="' + r1((ox + cx2) / 2) + '" y="' + (oy + 52) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">' + a + ' m</text>';
    s += '<text x="' + r1(cx2 + 30) + '" y="' + r1((oy + ty) / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">' + b + ' m</text>';
    s += '<text x="240" y="60" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">centroid (x-bar, y-bar) = ?</text>';
    s += '<text x="240" y="84" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#1a1a1a">uniform thin wire</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A thin uniform wire is bent into an L-shape: one leg runs from (0, 0) to (" + a + " m, 0), the other from (" + a + " m, 0) to (" + a + " m, " + b + " m). What are the coordinates (x-bar, y-bar) of the centroid of the wire?";
  var solution = "Refer to the Centroids of Masses, Areas, Lengths, and Volumes section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\bar{x}\\) and \\(\\bar{y}\\). Weight each straight segment by its length:\n\n" +
    "$$\\bar{x} = \\frac{L_1 x_1 + L_2 x_2}{L_1 + L_2},\\qquad \\bar{y} = \\frac{L_1 y_1 + L_2 y_2}{L_1 + L_2}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\n" +
    "L_1 &= " + a + "\\ \\text{m},\\quad (x_1, y_1) = (" + fmt(r2(a / 2)) + ", 0) \\\\\n" +
    "L_2 &= " + b + "\\ \\text{m},\\quad (x_2, y_2) = (" + a + ", " + fmt(r2(b / 2)) + ") \\\\\n" +
    "(\\bar{x}, \\bar{y}) &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\bar{x}) = \\frac{(" + a + ")(" + fmt(r2(a / 2)) + ") + (" + b + ")(" + a + ")}{" + a + " + " + b + "} = " + fmt(xb) + "\\ \\text{m}$$\n\n" +
    "$$(\\bar{y}) = \\frac{(" + a + ")(0) + (" + b + ")(" + fmt(r2(b / 2)) + ")}{" + (a + b) + "} = " + fmt(yb) + "\\ \\text{m}$$";
  return {
    variantKey: "wire-a" + a + "-b" + b,
    question: question,
    diagram: d034,
    options: [
      { label: "(" + fmt(xb) + ", " + fmt(yb) + ") m", num: xb + yb / 1000, correct: true },
      { label: "(" + fmt(xu) + ", " + fmt(yu) + ") m", num: cUnwt, correct: false },
      { label: "(" + fmt(yb) + ", " + fmt(xb) + ") m", num: cSwap, correct: false },
      { label: "(" + fmt(xb) + ", " + fmt(yHalf) + ") m", num: cHalf, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-035: 3D plate equilibrium, cable tension ---- */
reg(buildGenerator({
  baseId: "statics-035",
  topic: "Statics",
  subtopic: "3D equilibrium (plate with cables)",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "Moment about the hinge axis kills every hinge reaction at once, leaving one equation for the cable tension. The W/3 and W/4 traps split the weight evenly among the wrong count of supports.",
  videoUrl: "https://www.youtube.com/watch?v=4LXDkhqfn1g",
  videoTitle: "How to Find the Reactions at the Supports – Static Equilibrium of Rigid Bodies– Reaction Problem 4"
}, function () {
  var s = pick([1.5, 2, 2.5, 3]);
  var W = pick([80, 100, 120, 140, 160, 180, 200]); // even, so T = W/2 is exact
  var T = W / 2;
  var tW = W;        // trap: the full weight
  var t3 = r2(W / 3); // trap: split three ways
  var t4 = r2(W / 4); // trap: split four ways
  // Setup diagram (never the answer): plate in plan view (3D sketch), support
  // at A, cable at D marked T = ?, link at B, weight at centroid. No result.
  var d035 = (function () {
    var pA = [150, 300], pB = [330, 300], pC = [430, 230], pD = [250, 230];
    var cen = [(pA[0] + pC[0]) / 2, (pA[1] + pC[1]) / 2];
    var svg = "";
    svg += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img">' + AH;
    svg += '<polygon points="' + pA[0] + ',' + pA[1] + ' ' + pB[0] + ',' + pB[1] + ' ' + pC[0] + ',' + pC[1] + ' ' + pD[0] + ',' + pD[1] + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2.5"/>';
    svg += '<circle cx="' + pA[0] + '" cy="' + pA[1] + '" r="8" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    svg += '<polygon points="' + pA[0] + ',' + (pA[1] + 8) + ' ' + (pA[0] - 16) + ',' + (pA[1] + 34) + ' ' + (pA[0] + 16) + ',' + (pA[1] + 34) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    svg += '<text x="' + (pA[0] - 10) + '" y="' + (pA[1] + 54) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">A (0, 0, 0): ball-and-socket</text>';
    svg += '<rect x="' + (pB[0] - 4) + '" y="' + (pB[1] - 66) + '" width="8" height="66" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    svg += '<circle cx="' + pB[0] + '" cy="' + (pB[1] - 66) + '" r="4" fill="#1a1a1a"/>';
    svg += '<circle cx="' + pB[0] + '" cy="' + pB[1] + '" r="4" fill="#1a1a1a"/>';
    svg += '<text x="' + (pB[0] + 66) + '" y="' + (pB[1] + 4) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">B (' + fmt(s) + ', 0, 0): link</text>';
    svg += '<line x1="' + pD[0] + '" y1="' + pD[1] + '" x2="' + pD[0] + '" y2="' + (pD[1] - 100) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    svg += '<circle cx="' + pD[0] + '" cy="' + pD[1] + '" r="5" fill="#1a1a1a"/>';
    svg += '<text x="' + pD[0] + '" y="' + (pD[1] - 110) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#1d4ed8">T = ?</text>';
    svg += '<text x="' + (pD[0] - 30) + '" y="' + (pD[1] - 16) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">D (0, ' + fmt(s) + ', 0): cable</text>';
    svg += '<line x1="' + r1(cen[0]) + '" y1="' + r1(cen[1]) + '" x2="' + r1(cen[0]) + '" y2="' + r1(cen[1] + 52) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    svg += '<circle cx="' + r1(cen[0]) + '" cy="' + r1(cen[1]) + '" r="4" fill="#1d4ed8"/>';
    svg += '<text x="' + r1(cen[0]) + '" y="' + r1(cen[1] + 75) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">W = ' + W + ' N</text>';
    svg += '<text x="' + ((pA[0] + pB[0]) / 2) + '" y="' + (pA[1] + 22) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">' + fmt(s) + ' m</text>';
    svg += '<text x="' + ((pD[0] + pA[0]) / 2 - 24) + '" y="' + ((pD[1] + pA[1]) / 2) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">' + fmt(s) + ' m</text>';
    svg += '<text x="240" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">' + fmt(s) + ' m \u00d7 ' + fmt(s) + ' m plate in the xy-plane, z up</text>';
    return svgURL(svg + SVG_FTR);
  })();
  var question = "A " + fmt(s) + " m × " + fmt(s) + " m square plate of weight " + W +
    " N lies in the xy-plane with corner A at the origin and sides along the positive x- and y-axes. " +
    "It is held in horizontal equilibrium by a ball-and-socket support at A, a vertical cable attached at corner D(0, " + fmt(s) +
    ", 0) m, and a vertical two-force link at corner B(" + fmt(s) + ", 0, 0) m. The plate's weight acts at its centroid. " +
    "What is the tension in the cable?";
  var solution = "Refer to the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(T\\), the cable tension. Sum moments about the x-axis: the ball-and-socket at A and the link at B both lie on the x-axis, so only the cable and the weight contribute:\n\n" +
    "$$\\sum M_x = 0 \\;\\rightarrow\\; T(" + fmt(s) + ") - W\\left(\\frac{" + fmt(s) + "}{2}\\right) = 0$$\n\n" +
    "$$(T) = \\frac{" + W + "}{2} = " + T + "\\ \\text{N}$$";
  return {
    variantKey: "plt3d-s" + pdot(s) + "-W" + W,
    question: question,
    diagram: d035,
    options: [
      { label: T + " N", num: T, correct: true },
      { label: tW + " N", num: tW, correct: false },
      { label: fmt(t3) + " N", num: t3, correct: false },
      { label: fmt(t4) + " N", num: t4, correct: false }
    ],
    solution: solution
  };
}));

/* ---- registry export ---- */

/* ---- statics-036: resultant of concurrent forces ---- */
reg(buildGenerator({
  baseId: "statics-036",
  topic: "Statics",
  subtopic: "Resultant of concurrent forces",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Add components as vectors, never as scalars. The angle is tan⁻¹(Ry/Rx) — the complement is the classic trap.",
  tiTip: "Partially — vector menu: enter the components and use norm for the magnitude; find the angle with the tan⁻¹ key.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var a1, c1, b1, Rx, Ry;
  do {
    a1 = pick([80, 100, 120]);   // east
    c1 = pick([30, 40, 60]);     // west
    b1 = pick([60, 80, 100]);    // north
  } while (c1 >= a1);
  Rx = a1 - c1;
  Ry = b1;
  var R = r1(Math.sqrt(Rx * Rx + Ry * Ry));
  var th = r1(Math.atan(Ry / Rx) * 180 / Math.PI);
  var thC = r1(90 - th);
  var S = a1 + b1 + c1;          // trap: scalar sum of magnitudes
  // Setup diagram (never the answer): bollard and the three given cable
  // forces in plan view. The resultant is not drawn.
  var d036 = (function () {
    var cx = 240, cy = 150;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300" role="img">' + AH;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="12" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="3"/>';
    s += '<line x1="' + (cx + 12) + '" y1="' + cy + '" x2="' + (cx + 130) + '" y2="' + cy + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx + 76) + '" y="' + (cy - 12) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">' + a1 + ' N</text>';
    s += '<line x1="' + cx + '" y1="' + (cy - 12) + '" x2="' + cx + '" y2="' + (cy - 112) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx + 10) + '" y="' + (cy - 66) + '" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">' + b1 + ' N</text>';
    s += '<line x1="' + (cx - 12) + '" y1="' + cy + '" x2="' + (cx - 110) + '" y2="' + cy + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx - 66) + '" y="' + (cy - 12) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">' + c1 + ' N</text>';
    s += '<text x="' + (cx + 140) + '" y="' + (cy + 5) + '" font-family="Georgia,serif" font-size="13" font-style="italic" fill="#1a1a1a">E</text>';
    s += '<text x="' + (cx - 5) + '" y="' + (cy - 120) + '" font-family="Georgia,serif" font-size="13" font-style="italic" fill="#1a1a1a">N</text>';
    s += '<text x="' + (cx - 124) + '" y="' + (cy + 5) + '" font-family="Georgia,serif" font-size="13" font-style="italic" fill="#1a1a1a">W</text>';
    s += '<text x="' + cx + '" y="282" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">plan view: three tugboat cables on one mooring bollard</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "Three tugboat cables pull on a mooring bollard: \\(" + a1 + "\\text{ N}\\) due east, \\(" + b1 + "\\text{ N}\\) due north, and \\(" + c1 + "\\text{ N}\\) due west. What is the magnitude and direction of the single resultant force?";
  var solution = "Refer to the Resultant (Two Dimensions) section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Sum components (east and north positive):\n\n" +
    "$$R_x = \\sum F_x = " + a1 + " - " + c1 + " = " + Rx + "\\text{ N} \\qquad R_y = \\sum F_y = " + Ry + "\\text{ N}$$\n\n" +
    "$$R = \\sqrt{R_x^2 + R_y^2} = \\sqrt{" + Rx + "^2 + " + Ry + "^2} = " + fmt(R) + "\\text{ N}$$\n\n" +
    "$$\\theta = \\tan^{-1}\\!\\left(\\frac{R_y}{R_x}\\right) = \\tan^{-1}\\!\\left(\\frac{" + Ry + "}{" + Rx + "}\\right) = " + fmt(th) + "^\\circ$$\n\n" +
    "north of east.";
  return {
    variantKey: "res-a" + a1 + "-c" + c1 + "-b" + b1,
    question: question,
    diagram: d036,
    options: [
      { label: fmt(R) + " N at " + fmt(th) + "° north of east", num: R, correct: true },
      { label: fmt(R) + " N at " + fmt(thC) + "° north of east", num: null, correct: false },
      { label: fmt(S) + " N at " + fmt(th) + "° north of east", num: S, correct: false },
      { label: fmt(R) + " N at " + fmt(th) + "° south of east", num: null, correct: false }
    ],
    solution: solution
  };
}));

/* ---- statics-037: equivalent single force for a force-couple system ---- */
reg(buildGenerator({
  baseId: "statics-037",
  topic: "Statics",
  subtopic: "Equivalent single force for a force-couple system",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "A couple shifts the line of action without changing the force: d = M/R. The side must reproduce the couple's sense.",
  tiTip: "No — it is one division, d = M/R; the calculator only does the arithmetic.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var F = pick([100, 150, 200, 250]);
  var dT = pick([2, 3, 4]);
  var M = F * dT;
  // Setup diagram (never the answer): crate with the push force and the couple.
  var d037 = (function () {
    var s = SVG_HDR + AH;
    s += '<rect x="220" y="110" width="200" height="110" fill="#1d4ed8" opacity="0.06" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="180" y1="220" x2="460" y2="220" stroke="#1a1a1a" stroke-width="2.5"/>';
    for (var gx = 190; gx < 460; gx += 24) {
      s += '<line x1="' + gx + '" y1="220" x2="' + (gx - 12) + '" y2="232" stroke="#1a1a1a" stroke-width="1.2"/>';
    }
    s += '<line x1="120" y1="165" x2="212" y2="165" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="140" y="150" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">' + F + ' N</text>';
    s += '<path d="M 320 118 A 47 47 0 1 1 285 132" fill="none" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ah)"/>';
    s += '<text x="340" y="105" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">' + M + ' N·m</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A \\(" + F + "\\text{ N}\\) horizontal push acts on a shipping crate. Uneven loading adds a \\(" + M + "\\text{ N}\\cdot\\text{m}\\) clockwise couple. What single force is equivalent to this force-couple system, and where must its line of action lie?";
  var solution = "Refer to the Moments (Couples) section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "A couple does not change the force resultant, so \\(R = " + F + "\\text{ N}\\) (horizontal). Shift its line of action a perpendicular distance \\(d\\) so its moment about the original line equals the couple:\n\n" +
    "$$d = \\frac{M}{R} = \\frac{" + M + "}{" + F + "} = " + fmt(dT) + "\\text{ m}$$\n\n" +
    "The offset must reproduce the clockwise sense: for a rightward force, the line of action lies " + fmt(dT) + " m above the original line (a force below would give a counterclockwise moment).";
  return {
    variantKey: "fc-F" + F + "-d" + dT,
    question: question,
    diagram: d037,
    options: [
      { label: F + " N →, " + fmt(dT) + " m above the original line of action", num: dT, correct: true },
      { label: F + " N →, " + fmt(dT) + " m below the original line of action", num: null, correct: false },
      { label: F + " N →, " + fmt(1 / dT) + " m above the original line of action", num: 1 / dT, correct: false },
      { label: fmt(M) + " N →, " + fmt(dT) + " m above the original line of action", num: null, correct: false }
    ],
    solution: solution
  };
}));


/* ============ 2026-10 expansion entries (statics-038..059) ============
 * Citations reuse each bank question's reviewed line verbatim.
 * Conceptual skips: 044 (triangle centroid coordinate fact), 051 (slip/no-slip
 * judgment), 057 (couple definition), 060-064 (zero-force/rules/conceptual).
 */

/* ---- Parameterized bank-diagram retrofits: same composition as the bank's
 * diagrams/<id>.svg, with labels AND geometry rebuilt from rolled values. ---- */

// statics-039: right triangle, legs scale with b and h (bank: 240px base, 120px height at b=6, h=12)
function dStat039(b, h) {
  var k = Math.min(240 / b, 118 / h);
  var bx = 120 + b * k, ty = 170 - h * k;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="225" viewBox="0 0 480 225" role="img" aria-label="Right triangle with base b equal to ' + b + ' inches along the x axis and height h equal to ' + h + ' inches">';
  s += '<rect width="480" height="225" fill="#ffffff"/>';
  s += '<polygon points="120,170 ' + bx.toFixed(1) + ',170 120,' + ty.toFixed(1) + '" fill="#e8e8e8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="95" y1="170" x2="' + (bx + 40).toFixed(1) + '" y2="170" stroke="#c0392b" stroke-width="2" stroke-dasharray="5 3"/>';
  s += '<text x="' + (bx + 45).toFixed(1) + '" y="175" font-family="Helvetica,Arial,sans-serif" font-size="15" fill="#1a1a1a">x</text>';
  s += '<line x1="120" y1="200" x2="' + bx.toFixed(1) + '" y2="200" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="' + ((120 + bx) / 2).toFixed(1) + '" y="220" font-family="Helvetica,Arial,sans-serif" font-size="15" text-anchor="middle" fill="#1a1a1a">b = ' + b + ' in.</text>';
  s += '<line x1="95" y1="' + ty.toFixed(1) + '" x2="95" y2="170" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="87" y="' + ((ty + 170) / 2).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="15" text-anchor="end" fill="#1a1a1a">h = ' + h + ' in.</text>';
  s += '<text x="250" y="150" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">base axis (x)</text>';
  return svgURL(s + '</svg>');
}

// statics-040: rectangle with centroidal axis and parallel axis d away (bank: 70x140px at 6x12 in, axes 100/217 at d=10)
function dStat040(b, h, d) {
  var kw = 11.67, kh = 11.67;
  var w = b * kw, hp = h * kh, x0 = 205 - w / 2, y0 = 20;
  var cy = y0 + hp / 2, py = Math.min(cy + 11.7 * d, 226);
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="245" viewBox="0 0 480 245" role="img" aria-label="Rectangle ' + b + ' inches wide and ' + h + ' inches tall with its horizontal centroidal axis and a parallel axis ' + d + ' inches away">';
  s += '<rect width="480" height="245" fill="#ffffff"/>';
  s += '<rect x="' + x0.toFixed(1) + '" y="' + y0 + '" width="' + w.toFixed(1) + '" height="' + hp.toFixed(1) + '" fill="#e8e8e8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="' + (x0 - 60).toFixed(1) + '" y1="' + cy.toFixed(1) + '" x2="' + (x0 + w + 60).toFixed(1) + '" y2="' + cy.toFixed(1) + '" stroke="#c0392b" stroke-width="2" stroke-dasharray="5 3"/>';
  s += '<text x="' + (x0 + w + 66).toFixed(1) + '" y="' + (cy + 5).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#c0392b">centroidal axis</text>';
  s += '<line x1="' + (x0 - 60).toFixed(1) + '" y1="' + py.toFixed(1) + '" x2="' + (x0 + w + 60).toFixed(1) + '" y2="' + py.toFixed(1) + '" stroke="#1a1a1a" stroke-width="2" stroke-dasharray="5 3"/>';
  s += '<text x="' + (x0 + w + 66).toFixed(1) + '" y="' + (py + 5).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">parallel axis</text>';
  s += '<line x1="' + (x0 - 40).toFixed(1) + '" y1="' + cy.toFixed(1) + '" x2="' + (x0 - 40).toFixed(1) + '" y2="' + py.toFixed(1) + '" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="' + (x0 - 46).toFixed(1) + '" y="' + ((cy + py) / 2).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="end" fill="#1a1a1a">' + d + ' in.</text>';
  s += '<text x="205" y="' + (y0 - 6) + '" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">' + b + ' in.</text>';
  s += '<text x="' + (x0 + w + 14).toFixed(1) + '" y="' + cy.toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">' + h + ' in.</text>';
  return svgURL(s + '</svg>');
}

// statics-045: post with wrapped rope (bank schematic; wrap/force in labels)
function dStat045(turns, mu, F2) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="215" viewBox="0 0 480 215" role="img" aria-label="Rope wrapped around a fixed post for ' + turns + ' turns (drawn schematically) with a holding force of ' + F2 + ' pounds on one end and an unknown force on the other">';
  s += '<rect width="480" height="215" fill="#ffffff"/>';
  s += '<circle cx="240" cy="110" r="38" fill="#d9d9d9" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<path d="M 220 74 A 38 38 0 1 1 202 128" fill="none" stroke="#8a5a2b" stroke-width="3"/>';
  s += '<line x1="220" y1="72" x2="60" y2="72" stroke="#8a5a2b" stroke-width="3"/>';
  s += '<line x1="215" y1="148" x2="60" y2="148" stroke="#8a5a2b" stroke-width="3"/>';
  s += '<line x1="115" y1="72" x2="70" y2="72" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<line x1="115" y1="148" x2="70" y2="148" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<text x="120" y="64" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">F\u2081 = ?</text>';
  s += '<text x="120" y="166" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">F\u2082 = ' + F2 + ' lb</text>';
  s += '<text x="300" y="105" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">wrap ' + turns + ' turns, \u03BC = ' + mu.toFixed(2) + '</text>';
  s += '<text x="300" y="125" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#6b7280">post</text>';
  return svgURL(s + '</svg>');
}

// statics-050: crate on a level floor (label carries rolled weight; mu in caption)
function dStat050(W, mu) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="225" viewBox="0 0 480 225" role="img" aria-label="Crate weighing ' + W + ' pounds resting on a level floor with coefficient of static friction ' + mu.toFixed(2) + '">';
  s += '<rect width="480" height="225" fill="#ffffff"/>';
  s += '<rect x="170" y="90" width="110" height="60" fill="#c9d6e8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="120" y1="150" x2="360" y2="150" stroke="#1a1a1a" stroke-width="3"/>';
  for (var i = 0; i < 16; i++) s += '<line x1="' + (125 + i * 15) + '" y1="150" x2="' + (117 + i * 15) + '" y2="160" stroke="#8a8a8a" stroke-width="1"/>';
  s += '<text x="225" y="124" font-family="Helvetica,Arial,sans-serif" font-size="15" text-anchor="middle" fill="#1a1a1a">' + W.toLocaleString("en-US") + ' lb</text>';
  s += '<text x="240" y="185" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">level surface, \u03BC_s = ' + mu.toFixed(2) + '</text>';
  return svgURL(s + '</svg>');
}

// statics-059: drum with half-wrap rope (wrap angle/mu/slack force in labels)
function dStat059(deg, mu, F2) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Rope wrapped ' + deg + ' degrees around a fixed drum with a ' + F2 + ' pound holding force on the slack side and an unknown force on the tight side">';
  s += '<rect width="480" height="230" fill="#ffffff"/>';
  s += '<circle cx="240" cy="110" r="42" fill="#d9d9d9" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<line x1="240" y1="68" x2="70" y2="68" stroke="#8a5a2b" stroke-width="3"/>';
  s += '<line x1="240" y1="152" x2="70" y2="152" stroke="#8a5a2b" stroke-width="3"/>';
  s += '<path d="M 240 68 A 42 42 0 0 1 240 152" fill="none" stroke="#8a5a2b" stroke-width="3"/>';
  s += '<line x1="130" y1="68" x2="80" y2="68" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<line x1="130" y1="152" x2="80" y2="152" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<text x="136" y="60" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">tight side (to find)</text>';
  s += '<text x="136" y="170" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">slack side ' + F2 + ' lb</text>';
  s += '<text x="300" y="105" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">' + deg + '\u00B0 wrap, \u03BC = ' + mu.toFixed(1) + '</text>';
  s += '<text x="300" y="125" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#6b7280">drum</text>';
  return svgURL(s + '</svg>');
}

function statFrameSVG(W, L) {
  var ox = 96, by = 60, bw = 380, wallX = ox - 30;
  var s = SVG_HDR + AH;
  s += '<line x1="' + wallX + '" y1="30" x2="' + wallX + '" y2="270" stroke="#1a1a1a" stroke-width="4"/>';
  for (var i = 0; i < 8; i++) s += '<line x1="' + wallX + '" y1="' + (34 + i * 30) + '" x2="' + (wallX - 12) + '" y2="' + (46 + i * 30) + '" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<rect x="' + wallX + '" y="' + (by - 6) + '" width="' + bw + '" height="12" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2"/>';
  var midX = wallX + bw / 2, dY = by + 120;
  s += '<line x1="' + midX + '" y1="' + (by + 6) + '" x2="' + wallX + '" y2="' + dY + '" stroke="#b45309" stroke-width="4"/>';
  s += '<text x="' + (wallX + 40) + '" y="' + (dY + 4) + '" font-family="Georgia,serif" font-size="15" fill="#b45309">strut BD (45\u00B0)</text>';
  var endX = wallX + bw;
  s += '<line x1="' + endX + '" y1="' + (by - 56) + '" x2="' + endX + '" y2="' + (by - 10) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="' + (endX - 52) + '" y="' + (by - 64) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">P = ' + W + ' kN</text>';
  s += '<text x="' + (wallX - 14) + '" y="' + (by - 14) + '" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">A</text>';
  s += '<text x="' + (midX - 4) + '" y="' + (by - 14) + '" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">B</text>';
  s += '<text x="' + (endX + 6) + '" y="' + (by + 4) + '" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">C</text>';
  s += '<text x="' + (wallX - 14) + '" y="' + (dY + 4) + '" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">D</text>';
  s += '<text x="' + (wallX + bw / 2 - 70) + '" y="290" font-family="Georgia,serif" font-size="14" fill="#6b7280">beam AC = ' + L + ' m, D is ' + (L / 2) + ' m below A</text>';
  return svgURL(s + SVG_FTR);
}

// ---------------------------------------------------------------- statics-038
// Two-force-member strut: moments about pin A.
reg(buildGenerator({ baseId: "statics-038", subtopic: "Frame with a two-force member", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "Moments about A: T sin45 x (L/2) = W x L. Traps drop the sin45, drop the lever ratio, or halve the result."
}, function () {
  var W = pick([12, 10, 15, 20]);
  var L = 4;
  var T = W * L / (L / 2 * Math.SQRT1_2);
  var ans = T.toFixed(1);
  var tNoSin = (W * 2).toFixed(1);
  var tWSin = (W * Math.SQRT2).toFixed(1);
  var tLoad = W.toFixed(1);
  var question = "A horizontal beam AC is " + L + " m long. It is pinned to a vertical wall at A and pinned at its midpoint B to a strut BD. The other end D of the strut is pinned to the same wall " + (L / 2) + " m directly below A, so the strut makes a 45\u00B0 angle with the beam. A " + W + " kN downward load acts at end C. What is the force in strut BD?";
  var solution = "Refer to the Equilibrium Requirements section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "BD is a two-force member, so its force T acts along the strut at 45\u00B0. Moments about pin A:\n\n" +
    "$$\\sum M_A = 0:\\quad T\\sin 45^\\circ \\cdot \\frac{L}{2} = W L \\quad\\Rightarrow\\quad T = \\frac{" + W + " \\times " + L + "}{" + (L / 2) + " \\times 0.7071} = " + ans + "\\ \\text{kN}$$";
  return { variantKey: "W" + W,
    question: question, diagram: statFrameSVG(W, L), options: [
      { label: ans + " kN", num: T, correct: true },
      { label: tNoSin + " kN", num: W * 2, correct: false },
      { label: tWSin + " kN", num: W * Math.SQRT2, correct: false },
      { label: tLoad + " kN", num: W, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-039
// Triangle area moment of inertia about its base: I = b h^3 / 12.
reg(buildGenerator({ baseId: "statics-039", subtopic: "Triangle moment of inertia about base", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "About the BASE the triangle's I = b h^3/12. bh^3/36 is about the centroidal axis - the classic swap."
}, function () {
  var b = pick([6, 8, 9]);
  var h = pick([12, 9, 15]);
  var I = b * Math.pow(h, 3) / 12;
  var tCent = b * Math.pow(h, 3) / 36;
  var t6 = b * Math.pow(h, 3) / 6;
  var t3 = b * Math.pow(h, 3) / 3;
  var question = "A right triangle has base b = " + b + " in. and height h = " + h + " in. What is its area moment of inertia about the base axis (x axis along the base)?";
  var solution = "Refer to the table of area properties (triangle) in the Statics section of the FE Reference Handbook (v10.6), printed page 99 (PDF page 105).\n\n" +
    "$$I_x = \\frac{bh^3}{12} = \\frac{" + b + "(" + h + ")^3}{12} = " + I.toLocaleString("en-US") + "\\ \\text{in}^4$$";
  return { variantKey: "b" + b + "_h" + h,
    question: question, diagram: dStat039(b, h), options: [
      { label: I.toLocaleString("en-US") + " in\u2074", num: I, correct: true },
      { label: tCent.toLocaleString("en-US") + " in\u2074", num: tCent, correct: false },
      { label: t6.toLocaleString("en-US") + " in\u2074", num: t6, correct: false },
      { label: t3.toLocaleString("en-US") + " in\u2074", num: t3, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-040
// Parallel axis theorem for a rectangle.
reg(buildGenerator({ baseId: "statics-040", subtopic: "Parallel axis theorem", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "I = Ic + Ad^2. The traps forget to square d, drop one of the two terms, or report Ic alone."
}, function () {
  var b = pick([6, 4, 8]);
  var h = pick([12, 10, 14]);
  var d = pick([10, 8, 12]);
  var Ic = b * Math.pow(h, 3) / 12, A = b * h;
  var I = Math.round(Ic + A * d * d);
  var tNoSq = Math.round(Ic + A * d);
  var tIc = Math.round(Ic);
  var tAd2 = Math.round(A * d * d);
  var question = "A rectangle " + b + " in. wide and " + h + " in. tall has a centroidal moment of inertia about its horizontal centroidal axis. What is its moment of inertia about an axis parallel to it and " + d + " in. away?";
  var solution = "Refer to the parallel axis theorem in the Statics section of the FE Reference Handbook (v10.6), printed page 97 (PDF page 103).\n\n" +
    "$$\\begin{aligned}I_c &= \\frac{bh^3}{12} = " + Math.round(Ic).toLocaleString("en-US") + "\\ \\text{in}^4, \\quad A = " + A + "\\ \\text{in}^2 \\\\ I &= I_c + Ad^2 = " + Math.round(Ic).toLocaleString("en-US") + " + " + A + "(" + d + ")^2 = " + I.toLocaleString("en-US") + "\\ \\text{in}^4\\end{aligned}$$";
  return { variantKey: "b" + b + "_h" + h + "_d" + d,
    question: question, diagram: dStat040(b, h, d), options: [
      { label: I.toLocaleString("en-US") + " in\u2074", num: I, correct: true },
      { label: tNoSq.toLocaleString("en-US") + " in\u2074", num: tNoSq, correct: false },
      { label: tIc.toLocaleString("en-US") + " in\u2074", num: tIc, correct: false },
      { label: tAd2.toLocaleString("en-US") + " in\u2074", num: tAd2, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-041
// Circle centroidal I = pi a^4 / 4.
reg(buildGenerator({ baseId: "statics-041", subtopic: "Circle moment of inertia", difficulty: "easy",
  estimatedTimeSeconds: 75,
  explanation: "I = pi a^4/4. The polar J = pi a^4/2 is the swap trap; the diameter slip quarters a."
}, function () {
  var a = pick([5, 4, 6, 3]);
  var I = Math.PI * Math.pow(a, 4) / 4;
  var ans = Math.round(I).toLocaleString("en-US");
  var tJ = Math.round(Math.PI * Math.pow(a, 4) / 2).toLocaleString("en-US");
  var t4 = Math.round(Math.PI * Math.pow(a, 4)).toLocaleString("en-US");
  var tD = Math.round(Math.PI * Math.pow(a / 2, 4) / 4 * 10) / 10;
  var question = "A solid circular section has radius a = " + a + " in. What is its centroidal area moment of inertia?";
  var solution = "Refer to the table of area properties (circle) in the Statics section of the FE Reference Handbook (v10.6), printed page 100 (PDF page 106).\n\n" +
    "$$I = \\frac{\\pi a^4}{4} = \\frac{\\pi(" + a + ")^4}{4} = " + ans + "\\ \\text{in}^4$$";
  return { variantKey: "a" + a,
    question: question, options: [
      { label: ans + " in\u2074", num: Math.round(I), correct: true },
      { label: tJ + " in\u2074", num: Math.round(Math.PI * Math.pow(a, 4) / 2), correct: false },
      { label: t4 + " in\u2074", num: Math.round(Math.PI * Math.pow(a, 4)), correct: false },
      { label: tD + " in\u2074", num: tD, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-042
// Polar moment J = pi a^4 / 2.
reg(buildGenerator({ baseId: "statics-042", subtopic: "Circle polar moment J", difficulty: "easy",
  estimatedTimeSeconds: 75,
  explanation: "J = pi a^4/2 = 2I. Traps: report I instead, pi a^4, or half of I."
}, function () {
  var a = pick([5, 4, 6, 3]);
  var J = Math.PI * Math.pow(a, 4) / 2;
  var ans = Math.round(J).toLocaleString("en-US");
  var tI = Math.round(J / 2).toLocaleString("en-US");
  var t4 = Math.round(Math.PI * Math.pow(a, 4)).toLocaleString("en-US");
  var tHalf = Math.round(J / 4).toLocaleString("en-US");
  var question = "For a solid circle of radius a = " + a + " in., what is the polar moment of inertia J?";
  var solution = "Refer to the table of area properties (circle) in the Statics section of the FE Reference Handbook (v10.6), printed page 100 (PDF page 106).\n\n" +
    "$$J = \\frac{\\pi a^4}{2} = \\frac{\\pi(" + a + ")^4}{2} = " + ans + "\\ \\text{in}^4$$";
  return { variantKey: "a" + a,
    question: question, options: [
      { label: ans + " in\u2074", num: Math.round(J), correct: true },
      { label: tI + " in\u2074", num: Math.round(J / 2), correct: false },
      { label: t4 + " in\u2074", num: Math.round(Math.PI * Math.pow(a, 4)), correct: false },
      { label: tHalf + " in\u2074", num: Math.round(J / 4), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-043
// Composite area centroid (T-section as two rectangles).
reg(buildGenerator({ baseId: "statics-043", subtopic: "Composite area centroid", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "ybar = sum(Ay)/sum(A). Traps: the numerator alone, the plain average of the two heights, and swapping the areas."
}, function () {
  var A1 = pick([48, 40, 60]);
  var A2 = pick([36, 24, 48]);
  var y1 = pick([3, 4, 2]);
  var y2 = pick([12, 10, 14]);
  var ybar = (A1 * y1 + A2 * y2) / (A1 + A2);
  var ans = ybar.toFixed(2);
  var tNum = (A1 * y1 + A2 * y2).toLocaleString("en-US");
  var tAvg = ((y1 + y2) / 2).toFixed(2);
  var tSwap = ((A2 * y1 + A1 * y2) / (A1 + A2)).toFixed(2);
  var question = "A T-shaped area is split into two rectangles: area " + A1 + " in\u00B2 with centroid " + y1 + " in. above the base, and area " + A2 + " in\u00B2 with centroid " + y2 + " in. above the base. How far above the base is the centroid of the whole area?";
  var solution = "Refer to the centroid of area definitions (discrete sum) in the Statics section of the FE Reference Handbook (v10.6), printed page 96 (PDF page 102).\n\n" +
    "$$\\bar{y} = \\frac{A_1 y_1 + A_2 y_2}{A_1 + A_2} = \\frac{" + A1 + "(" + y1 + ") + " + A2 + "(" + y2 + ")}{" + A1 + " + " + A2 + "} = \\frac{" + (A1 * y1 + A2 * y2) + "}{" + (A1 + A2) + "} = " + ans + "\\ \\text{in.}$$";
  return { variantKey: "A" + A1 + "_" + A2 + "_y" + y1 + "_" + y2,
    question: question, options: [
      { label: ans + " in.", num: ybar, correct: true },
      { label: tNum + " in.", num: A1 * y1 + A2 * y2, correct: false },
      { label: tAvg + " in.", num: (y1 + y2) / 2, correct: false },
      { label: tSwap + " in.", num: (A2 * y1 + A1 * y2) / (A1 + A2), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-045
// Belt friction with turns: F1 = F2 e^(mu*beta), beta in radians.
reg(buildGenerator({ baseId: "statics-045", subtopic: "Belt friction", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "Capstan: F1 = F2 e^(mu*beta) with beta in RADIANS. Traps: invert it, linearize it, or feed turns instead of radians."
}, function () {
  var F2 = pick([80, 100, 60]);
  var mu = pick([0.25, 0.3, 0.2]);
  var turns = pick([1.5, 1, 2]);
  var beta = turns * 2 * Math.PI;
  var F1 = F2 * Math.exp(mu * beta);
  var ans = Math.round(F1).toLocaleString("en-US");
  var tInv = (F2 / Math.exp(mu * beta)).toFixed(1);
  var tLin = Math.round(F2 * (1 + mu * beta)).toLocaleString("en-US");
  var tTurns = Math.round(F2 * Math.exp(mu * turns)).toLocaleString("en-US");
  var betaTxt = turns === 1 ? "2\u03C0" : (turns * 2) + "\u03C0";
  var question = "A rope wraps " + turns + " turns (" + betaTxt + " rad) around a fixed post. The coefficient of static friction is " + mu.toFixed(2) + " and the holding force is " + F2 + " lb. What is the largest force F1 that can be resisted using the handbook belt friction equation?";
  var solution = "Refer to Belt Friction in the Statics section of the FE Reference Handbook (v10.6), printed page 98 (PDF page 104).\n\n" +
    "$$F_1 = F_2 e^{\\mu\\beta} = " + F2 + "\\, e^{(" + mu.toFixed(2) + ")(" + beta.toFixed(3) + ")} = " + F2 + "\\, e^{" + (mu * beta).toFixed(3) + "} = " + ans + "\\ \\text{lb}$$";
  return { variantKey: "F" + F2 + "_m" + mu + "_t" + turns,
    question: question, diagram: dStat045(turns, mu, F2), options: [
      { label: ans + " lb", num: Math.round(F1), correct: true },
      { label: tInv + " lb", num: parseFloat(tInv), correct: false },
      { label: tLin + " lb", num: Math.round(F2 * (1 + mu * beta)), correct: false },
      { label: tTurns + " lb", num: Math.round(F2 * Math.exp(mu * turns)), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-046
// Composite centroid, same drill as 043 (bank carries both wordings).
reg(buildGenerator({ baseId: "statics-046", subtopic: "Centroid of a composite area", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "ybar = sum(Ay)/sum(A). Traps: the numerator alone, the plain average, and the swapped-area weighting."
}, function () {
  var A1 = pick([48, 40, 60]);
  var A2 = pick([36, 24, 48]);
  var y1 = pick([3, 4, 2]);
  var y2 = pick([12, 10, 14]);
  var ybar = (A1 * y1 + A2 * y2) / (A1 + A2);
  var ans = ybar.toFixed(2);
  var tNum = (A1 * y1 + A2 * y2).toLocaleString("en-US");
  var tAvg = ((y1 + y2) / 2).toFixed(2);
  var tSwap = ((A2 * y1 + A1 * y2) / (A1 + A2)).toFixed(2);
  var question = "A composite section is made of a " + A1 + " in.\u00B2 flange whose centroid is " + y1 + " in. above the base and a " + A2 + " in.\u00B2 web whose centroid is " + y2 + " in. above the base. How far above the base is the centroid of the whole section?";
  var solution = "Refer to Centroid of Area in the Statics section of the FE Reference Handbook (v10.6), printed page 96 (PDF page 102).\n\n" +
    "$$\\bar{y} = \\frac{" + A1 + "(" + y1 + ") + " + A2 + "(" + y2 + ")}{" + A1 + " + " + A2 + "} = " + ans + "\\ \\text{in.}$$";
  return { variantKey: "A" + A1 + "_" + A2 + "_y" + y1 + "_" + y2,
    question: question, options: [
      { label: ans + " in.", num: ybar, correct: true },
      { label: tNum + " in.", num: A1 * y1 + A2 * y2, correct: false },
      { label: tAvg + " in.", num: (y1 + y2) / 2, correct: false },
      { label: tSwap + " in.", num: (A2 * y1 + A1 * y2) / (A1 + A2), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-047
// Parallel axis theorem (second wording).
reg(buildGenerator({ baseId: "statics-047", subtopic: "Parallel axis theorem", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "I = Ic + Ad^2. Traps: Ad^2 alone, Ic + Ad (no square), Ic alone."
}, function () {
  var b = pick([4, 6, 8]);
  var h = pick([10, 12, 14]);
  var d = pick([8, 10, 12]);
  var Ic = b * Math.pow(h, 3) / 12, A = b * h;
  var I = Math.round(Ic + A * d * d);
  var tAd2 = Math.round(A * d * d);
  var tNoSq = Math.round(Ic + A * d);
  var tIc = Math.round(Ic);
  var question = "A rectangle " + b + " in. wide and " + h + " in. deep has its centroidal moment of inertia about the horizontal axis. What is its moment of inertia about a parallel axis " + d + " in. from the centroid?";
  var solution = "Refer to Moment of Inertia Parallel Axis Theorem in the Statics section of the FE Reference Handbook (v10.6), printed page 96 (PDF page 102).\n\n" +
    "$$I = I_c + Ad^2 = \\frac{" + b + "(" + h + ")^3}{12} + (" + b + " \\times " + h + ")(" + d + ")^2 = " + I.toLocaleString("en-US") + "\\ \\text{in.}^4$$";
  return { variantKey: "b" + b + "_h" + h + "_d" + d,
    question: question, options: [
      { label: I.toLocaleString("en-US") + " in.\u2074", num: I, correct: true },
      { label: tAd2.toLocaleString("en-US") + " in.\u2074", num: tAd2, correct: false },
      { label: tNoSq.toLocaleString("en-US") + " in.\u2074", num: tNoSq, correct: false },
      { label: tIc.toLocaleString("en-US") + " in.\u2074", num: tIc, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-048
// Radius of gyration r = sqrt(I/A).
reg(buildGenerator({ baseId: "statics-048", subtopic: "Radius of gyration", difficulty: "easy",
  estimatedTimeSeconds: 75,
  explanation: "r = sqrt(I/A). Traps: I/A (no root), I/r, and r^4."
}, function () {
  var A = pick([30, 20, 50]);
  var r2 = pick([80, 60, 40]);            // target I/A so roots stay clean-ish
  var I = A * r2;
  var r = Math.sqrt(r2);
  var ans = r.toFixed(2);
  var tIA = (I / A).toFixed(2);
  var tIr = (I / r).toFixed(1);
  var t4 = Math.round(r2 * r2).toLocaleString("en-US");
  var question = "A section has \\(I_x\\) = " + I.toLocaleString("en-US") + " in.\u2074 and an area of " + A + " in.\u00B2. What is the radius of gyration \\(r_x\\)?";
  var solution = "Refer to Radius of Gyration in the Statics section of the FE Reference Handbook (v10.6), printed page 97 (PDF page 103).\n\n" +
    "$$r_x = \\sqrt{\\frac{I_x}{A}} = \\sqrt{\\frac{" + I.toLocaleString("en-US") + "}{" + A + "}} = \\sqrt{" + r2 + "} = " + ans + "\\ \\text{in.}$$";
  return { variantKey: "A" + A + "_r" + r2,
    question: question, options: [
      { label: ans + " in.", num: r, correct: true },
      { label: tIA + " in.", num: I / A, correct: false },
      { label: tIr + " in.", num: I / r, correct: false },
      { label: t4 + " in.", num: r2 * r2, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-049
// Polar radius of gyration rp = sqrt((Ix + Iy)/A).
reg(buildGenerator({ baseId: "statics-049", subtopic: "Polar moment of inertia of an area", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "rp = sqrt(J/A) with J = Ix + Iy. Traps: use Ix alone, subtract the I's, or skip the root."
}, function () {
  var A = pick([20, 25, 40]);
  var Ix = pick([500, 800, 400]);
  var Iy = pick([300, 200, 600]);
  var rp = Math.sqrt((Ix + Iy) / A);
  var ans = rp.toFixed(2);
  var tX = Math.sqrt(Ix / A).toFixed(2);
  var tDiff = Math.sqrt(Math.abs(Ix - Iy) / A).toFixed(2);
  var tNoRoot = ((Ix + Iy) / A).toFixed(2);
  var question = "An area of " + A + " in.² has \\(I_x\\) = " + Ix + " in.⁴ and \\(I_y\\) = " + Iy + " in.\u2074. What is its polar radius of gyration \\(r_p\\)?";
  var solution = "Refer to Polar moment of inertia and Radius of Gyration in the Statics section of the FE Reference Handbook (v10.6), printed page 97 (PDF page 103).\n\n" +
    "$$r_p = \\sqrt{\\frac{J}{A}} = \\sqrt{\\frac{I_x + I_y}{A}} = \\sqrt{\\frac{" + Ix + " + " + Iy + "}{" + A + "}} = " + ans + "\\ \\text{in.}$$";
  return { variantKey: "A" + A + "_" + Ix + "_" + Iy,
    question: question, options: [
      { label: ans + " in.", num: rp, correct: true },
      { label: tX + " in.", num: Math.sqrt(Ix / A), correct: false },
      { label: tDiff + " in.", num: Math.sqrt(Math.abs(Ix - Iy) / A), correct: false },
      { label: tNoRoot + " in.", num: (Ix + Iy) / A, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-050
// Limiting friction F = mu N.
reg(buildGenerator({ baseId: "statics-050", subtopic: "Limiting friction force", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "\\(F_{max} = \\mu_s N\\). Traps: half it, report \\(N\\), or divide by \\(\\mu\\)."
}, function () {
  var W = pick([400, 500, 250]);
  var mu = pick([0.35, 0.3, 0.4]);
  var F = Math.round(W * mu);
  var tHalf = Math.round(W * mu / 2);
  var tN = W;
  var tDiv = Math.round(W / mu);
  var question = "A " + W + " lb crate rests on a level floor with a coefficient of static friction of " + mu.toFixed(2) + ". What is the largest friction force the floor can supply before the crate slips?";
  var solution = "Refer to Friction in the Statics section of the FE Reference Handbook (v10.6), printed page 97 (PDF page 103).\n\n" +
    "$$F_{\\max} = \\mu_s N = " + mu.toFixed(2) + " \\times " + W + " = " + F + "\\ \\text{lb}$$";
  return { variantKey: "W" + W + "_m" + mu,
    question: question, diagram: dStat050(W, mu), options: [
      { label: F.toLocaleString("en-US") + " lb", num: F, correct: true },
      { label: tHalf.toLocaleString("en-US") + " lb", num: tHalf, correct: false },
      { label: tN.toLocaleString("en-US") + " lb", num: tN, correct: false },
      { label: tDiv.toLocaleString("en-US") + " lb", num: tDiv, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-052
// Resultant of three forces from components.
reg(buildGenerator({ baseId: "statics-052", subtopic: "Resultant magnitude", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "Sum the components first, then R = sqrt(Fx^2 + Fy^2). Traps: halve it, add the sums arithmetically, or hypotenuse each force separately and add."
}, function () {
  var f1x = pick([30, 20, 50]), f1y = pick([20, 10, 40]);
  var f2x = pick([40, 30, -20]), f2y = pick([-50, -30, -20]);
  var f3x = pick([-10, -20, 10]), f3y = pick([60, 30, -40]);
  var Fx = f1x + f2x + f3x, Fy = f1y + f2y + f3y;
  var R = Math.sqrt(Fx * Fx + Fy * Fy);
  var ans = R.toFixed(1);
  var tHalf = (R / 2).toFixed(1);
  var tSum = (Math.abs(Fx) + Math.abs(Fy)).toFixed(1);
  var tSep = (Math.hypot(f1x, f1y) + Math.hypot(f2x, f2y) + Math.hypot(f3x, f3y)).toFixed(1);
  var question = "Three forces act on a particle. Their x-components are " + f1x + ", " + f2x + " and " + f3x + " lb and their y-components are " + f1y + ", " + f2y + " and " + f3y + " lb. What is the magnitude of the resultant?";
  var solution = "Refer to Resultant (Two Dimensions) in the Statics section of the FE Reference Handbook (v10.6), printed page 95 (PDF page 101).\n\n" +
    "$$\\begin{aligned}\\sum F_x &= " + f1x + " + " + f2x + " + " + f3x + " = " + Fx + "\\ \\text{lb} \\\\ \\sum F_y &= " + f1y + " + " + f2y + " + " + f3y + " = " + Fy + "\\ \\text{lb} \\\\ R &= \\sqrt{" + Fx + "^2 + " + Fy + "^2} = " + ans + "\\ \\text{lb}\\end{aligned}$$";
  return { variantKey: Fx + "_" + Fy,
    question: question, options: [
      { label: ans + " lb", num: R, correct: true },
      { label: tHalf + " lb", num: R / 2, correct: false },
      { label: tSum + " lb", num: Math.abs(Fx) + Math.abs(Fy), correct: false },
      { label: tSep + " lb", num: parseFloat(tSep), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-053
// Resultant direction theta = atan(Fy/Fx).
reg(buildGenerator({ baseId: "statics-053", subtopic: "Resultant direction", difficulty: "easy",
  estimatedTimeSeconds: 75,
  explanation: "theta = atan(|Fy|/|Fx|) in the first quadrant. The flip atan(Fx/Fy) is the classic swap; the negative and supplementary angles are the vector-direction traps."
}, function () {
  var Fx = pick([60, 40, 80]);
  var Fy = pick([30, 20, 40]);
  var th = Math.atan2(Fy, Fx) * 180 / Math.PI;
  var ans = th.toFixed(1);
  var tFlip = (90 - th).toFixed(1);
  var tNeg = MINUS + th.toFixed(1);
  var tSup = (180 - th).toFixed(1);
  var question = "Forces on a particle sum to \\(\\sum F_x = " + Fx + "\\) lb and \\(\\sum F_y = " + Fy + "\\) lb. Using the handbook's arctan relation, what is the value of the resultant direction \\(\\theta\\) with respect to the x-axis?";
  var solution = "Refer to Resultant (Two Dimensions) in the Statics section of the FE Reference Handbook (v10.6), printed page 95 (PDF page 101).\n\n" +
    "$$\\theta = \\tan^{-1}\\frac{F_y}{F_x} = \\tan^{-1}\\frac{" + Fy + "}{" + Fx + "} = " + ans + "^\\circ$$";
  return { variantKey: Fx + "_" + Fy,
    question: question, options: [
      { label: ans + "\u00B0", num: th, correct: true },
      { label: tFlip + "\u00B0", num: 90 - th, correct: false },
      { label: tNeg + "\u00B0", num: -th, correct: false },
      { label: tSup + "\u00B0", num: 180 - th, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-054
// Moment z-component Mz = x*Fy - y*Fx (case A).
reg(buildGenerator({ baseId: "statics-054", subtopic: "Moment of a force about the origin", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "Mz = x Fy - y Fx (the z-row of r x F). Traps: flip the sign, swap the products, or add them."
}, function () {
  var x = pick([2, 3, 1]), y = pick([3, 1, 4]);
  var Fx = pick([4, -2, 3]), Fy = pick([-1, 5, 2]);
  var Mz = x * Fy - y * Fx;
  if (Mz === 0) { Fy = Fy + 2; Mz = x * Fy - y * Fx; }
  var lbl = function (v) { return (v < 0 ? MINUS : "") + Math.abs(v) + " ft-lb"; };
  var tFlip = -Mz;
  var tSwap = x * Fx - y * Fy;
  var tPlus = x * Fy + y * Fx;
  var question = "A force F = (" + Fx + ", " + Fy + ", 2) lb acts at the point (x, y, z) = (" + x + ", " + y + ", 1) ft. What is the z-component of the moment about the origin, \\(M_z\\)?";
  var solution = "Refer to Moments (Couples) in the Statics section of the FE Reference Handbook (v10.6), printed page 95 (PDF page 101).\n\n" +
    "The z-component of \\(\\mathbf{r} \\times \\mathbf{F}\\) is \\(xF_y - yF_x\\).\n\n" +
    "$$M_z = (" + x + ")(" + Fy + ") - (" + y + ")(" + Fx + ") = " + Mz + "\\ \\text{ft-lb}$$";
  return { variantKey: x + "_" + y + "_" + Fx + "_" + Fy,
    question: question, options: [
      { label: lbl(Mz), num: Mz, correct: true },
      { label: lbl(tFlip), num: tFlip, correct: false },
      { label: lbl(tSwap), num: tSwap, correct: false },
      { label: lbl(tPlus), num: tPlus, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-055
// Moment z-component (case B wording family, different roll anchors).
reg(buildGenerator({ baseId: "statics-055", subtopic: "Moment of a force about the origin", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "Mz = x Fy - y Fx. Watch the negative coordinate: subtracting a negative y product ADDS."
}, function () {
  var x = pick([1, 2, 4]), y = pick([-2, -1, -3]);
  var Fx = pick([2, 3, -1]), Fy = pick([5, 4, 6]);
  var Mz = x * Fy - y * Fx;
  var lbl = function (v) { return (v < 0 ? MINUS : "") + Math.abs(v) + " ft-lb"; };
  var tFlip = -Mz;
  var tNoNeg = x * Fy + y * Fx;             // sign slip on the negative y
  var tSwap = x * Fx - y * Fy;
  var question = "A force F = (" + Fx + ", " + Fy + ", " + MINUS + "1) lb acts at the point (x, y, z) = (" + x + ", " + MINUS + Math.abs(y) + ", 3) ft. What is the z-component of the moment about the origin, \\(M_z\\)?";
  var solution = "Refer to Moments (Couples) in the Statics section of the FE Reference Handbook (v10.6), printed page 95 (PDF page 101).\n\n" +
    "$$M_z = xF_y - yF_x = (" + x + ")(" + Fy + ") - (" + y + ")(" + Fx + ") = " + Mz + "\\ \\text{ft-lb}$$";
  return { variantKey: x + "_" + y + "_" + Fx + "_" + Fy,
    question: question, options: [
      { label: lbl(Mz), num: Mz, correct: true },
      { label: lbl(tFlip), num: tFlip, correct: false },
      { label: lbl(tNoNeg), num: tNoNeg, correct: false },
      { label: lbl(tSwap), num: tSwap, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-056
// Moment z-component (case C: negative Fx).
reg(buildGenerator({ baseId: "statics-056", subtopic: "Moment of a force about the origin", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "Mz = x Fy - y Fx. With Fx negative the second term adds - sign discipline is the drill."
}, function () {
  var x = pick([3, 2, 4]), y = pick([1, 2, 3]);
  var Fx = pick([-2, -3, -4]), Fy = pick([4, 3, 5]);
  var Mz = x * Fy - y * Fx;
  var lbl = function (v) { return (v < 0 ? MINUS : "") + Math.abs(v) + " ft-lb"; };
  var tFlip = -Mz;
  var tNoNeg = x * Fy + y * Fx;
  var tSwap = x * Fx + y * Fy;
  var question = "A force F = (" + MINUS + Math.abs(Fx) + ", " + Fy + ", 1) lb acts at the point (x, y, z) = (" + x + ", " + y + ", 2) ft. What is the z-component of the moment about the origin, \\(M_z\\)?";
  var solution = "Refer to Moments (Couples) in the Statics section of the FE Reference Handbook (v10.6), printed page 95 (PDF page 101).\n\n" +
    "$$M_z = xF_y - yF_x = (" + x + ")(" + Fy + ") - (" + y + ")(" + MINUS + Math.abs(Fx) + ") = " + Mz + "\\ \\text{ft-lb}$$";
  return { variantKey: x + "_" + y + "_" + Fx + "_" + Fy,
    question: question, options: [
      { label: lbl(Mz), num: Mz, correct: true },
      { label: lbl(tFlip), num: tFlip, correct: false },
      { label: lbl(tNoNeg), num: tNoNeg, correct: false },
      { label: lbl(tSwap), num: tSwap, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-058
// Screw jack torque to raise the load: M = W r tan(phi + alpha), tan phi = mu.
reg(buildGenerator({ baseId: "statics-058", subtopic: "Screw jack torque, tightening", difficulty: "hard",
  estimatedTimeSeconds: 135,
  explanation: "M = W r tan(phi + alpha) with phi = atan(mu). The loosening angle (phi - alpha), friction-only, and lead-angle-only terms are the traps."
}, function () {
  var W = pick([2000, 3000, 1500]);
  var r = pick([0.5, 0.75]);
  var alpha = pick([6, 8]);
  var mu = pick([0.15, 0.12]);
  var phi = Math.atan(mu) * 180 / Math.PI;
  var M = W * r * Math.tan((phi + alpha) * Math.PI / 180);
  var ans = Math.round(M).toLocaleString("en-US");
  var tLoose = Math.round(W * r * Math.tan((phi - alpha) * Math.PI / 180));
  var tFric = Math.round(W * r * mu);
  var tLead = Math.round(W * r * Math.tan(alpha * Math.PI / 180));
  var question = "A square-thread screw jack carries a load of " + W.toLocaleString("en-US") + " lb. The mean thread radius is " + r + " in, the pitch angle is " + alpha + "\u00B0 and the coefficient of friction is " + mu.toFixed(2) + ". What moment tightens the screw (raises the load)?";
  var solution = "Refer to Screw Thread in the Statics section of the FE Reference Handbook (v10.6), printed page 98 (PDF page 104).\n\n" +
    "$$\\begin{aligned}\\phi &= \\tan^{-1}(" + mu.toFixed(2) + ") = " + phi.toFixed(1) + "^\\circ \\\\ M &= Wr\\tan(\\phi + \\alpha) = (" + W.toLocaleString("en-US") + ")(" + r + ")\\tan(" + phi.toFixed(1) + "^\\circ + " + alpha + "^\\circ) = " + ans + "\\ \\text{in-lb}\\end{aligned}$$";
  return { variantKey: "W" + W + "_r" + r + "_a" + alpha + "_m" + mu,
    question: question, options: [
      { label: ans + " in-lb", num: Math.round(M), correct: true },
      { label: tLoose + " in-lb", num: tLoose, correct: false },
      { label: tFric + " in-lb", num: tFric, correct: false },
      { label: tLead + " in-lb", num: tLead, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- statics-059
// Belt friction, wrap given in degrees: F1 = F2 e^(mu*beta).
reg(buildGenerator({ baseId: "statics-059", subtopic: "Belt friction", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "Convert the wrap to radians, then F1 = F2 e^(mu*beta). Traps: linearize, invert, or multiply F2 by mu*beta."
}, function () {
  var deg = pick([180, 90, 270]);
  var mu = pick([0.3, 0.25, 0.4]);
  var F2 = pick([100, 80, 150]);
  var beta = deg * Math.PI / 180;
  var F1 = F2 * Math.exp(mu * beta);
  var ans = Math.round(F1).toLocaleString("en-US");
  var tLin = Math.round(F2 * (1 + mu * beta)).toLocaleString("en-US");
  var tInv = Math.round(F2 / Math.exp(mu * beta)).toLocaleString("en-US");
  var tMuB = Math.round(F2 * mu * beta).toLocaleString("en-US");
  var question = "A rope wraps " + deg + "\u00B0 around a fixed drum with a coefficient of static friction of " + mu.toFixed(1) + ". The holding force on the slack side is " + F2 + " lb. What is the largest force on the tight side at impending slip?";
  var solution = "Refer to Belt Friction in the Statics section of the FE Reference Handbook (v10.6), printed page 98 (PDF page 104).\n\n" +
    "$$F_1 = F_2 e^{\\mu\\beta} = " + F2 + "\\, e^{(" + mu.toFixed(1) + ")(" + beta.toFixed(3) + ")} = " + ans + "\\ \\text{lb}$$";
  return { variantKey: "d" + deg + "_m" + mu + "_F" + F2,
    question: question, diagram: dStat059(deg, mu, F2), options: [
      { label: ans + " lb", num: Math.round(F1), correct: true },
      { label: tLin + " lb", num: Math.round(F2 * (1 + mu * beta)), correct: false },
      { label: tInv + " lb", num: Math.round(F2 / Math.exp(mu * beta)), correct: false },
      { label: tMuB + " lb", num: Math.round(F2 * mu * beta), correct: false }
    ], solution: solution };
}));

window.STATICS_GENERATORS = STAT_ENTRIES;

})();
