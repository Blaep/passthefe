/* PassTheFE randomized practice — Mechanics of Materials generator templates.
 *
 * Plain script (no modules) for the static site. Defines window.MECHMAT_GENERATORS:
 * one entry per NUMERICAL Mechanics of Materials bank question. Skipped:
 * mechmat-020 (fatigue endurance limit) — purely conceptual, no numbers
 * to roll.
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
      topic: meta.topic || "Mechanics of Materials",
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
            topic: meta.topic || "Mechanics of Materials",
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
  var MM_ENTRIES = [];
  function reg(e) { MM_ENTRIES.push(e); return e; }
/* ---- mechmat-001: axial stress in a tie rod ---- */
reg(buildGenerator({
  baseId: "mechmat-001",
  topic: "Mechanics of Materials",
  subtopic: "Axial stress",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Axial stress is just load over area — but the FE usually hides the answer behind a kN-to-N conversion or a diameter-versus-radius slip.",
  videoUrl: "https://www.youtube.com/watch?v=UyBPXhDtgUs",
  videoTitle: "[PSAD] Strength of Materials: Axial Stress & Strain"
}, function () {
  var PkN = pick([25, 30, 40, 50, 60]);   // kN
  var d = pick([20, 24, 28, 32, 36]);     // mm
  var P = PkN * 1000;                     // N
  var A = Math.PI * d * d / 4;            // mm^2
  var sig = P / A;                        // N/mm^2 = MPa
  var tNoConv = sig / 1000;               // trap: kN never converted to N
  var tDiam = sig / 4;                    // trap: diameter used as the radius
  var tDbl = 2 * sig;                     // trap: doubled the load
  var question = "A diagonal steel tie rod in a timber roof truss resists a wind-uplift tensile load of " +
    PkN + " kN. The rod is a solid circular bar with a diameter of " + d +
    " mm. What is the axial tensile stress in the rod?";
  var solution = "Refer to the Uniaxial Loading and Deformation section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\sigma\\), the axial tensile stress in the rod:\n\n" +
    "$$\\sigma = \\frac{P}{A}$$\n\n" +
    "For a solid circular cross section, \\(A = \\pi d^2/4\\). List the known and unknown parameters in order to solve for \\(\\sigma\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "P &= " + PkN + "\\ \\text{kN} = " + P + "\\ \\text{N} \\\\\n" +
    "d &= " + d + "\\ \\text{mm},\\quad A = \\frac{\\pi(" + d + ")^2}{4} = " + fmt(A) + "\\ \\text{mm}^2 \\\\\n" +
    "\\sigma &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\sigma) = \\frac{" + P + "}{" + fmt(A) + "} = " + fmt(sig) + "\\ \\text{N/mm}^2 = " + fmt(sig) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): tie rod in tension with the given load and diameter.
  var d001 = (function () {
    var s = SVG_HDR + AH;
    s += '<rect x="190" y="128" width="260" height="48" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="190" y1="152" x2="118" y2="152" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<line x1="450" y1="152" x2="522" y2="152" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="64" y="140" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">P = ' + PkN + ' kN</text>';
    s += '<text x="478" y="140" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">P = ' + PkN + ' kN</text>';
    s += '<circle cx="320" cy="152" r="14" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="306" y1="152" x2="334" y2="152" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="342" y="158" font-family="Georgia,serif" font-size="16" fill="#b45309">d = ' + d + ' mm</text>';
    s += '<text x="196" y="230" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">solid circular steel tie rod in tension</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d001,
    variantKey: "axstress-P" + P + "-d" + d,
    question: question,
    options: [
      { label: fmt(sig) + " MPa", num: sig, correct: true },
      { label: fmt(tNoConv) + " MPa", num: tNoConv, correct: false },
      { label: fmt(tDiam) + " MPa", num: tDiam, correct: false },
      { label: fmt(tDbl) + " MPa", num: tDbl, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-002: axial deformation of a hanger rod ---- */
reg(buildGenerator({
  baseId: "mechmat-002",
  topic: "Mechanics of Materials",
  subtopic: "Axial deformation",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Delta = PL/AE is the FE's favorite unit-conversion minefield — get P into N, L into mm, and E into N/mm² (GPa times 1000) before dividing.",
  videoUrl: "https://www.youtube.com/watch?v=UyBPXhDtgUs",
  videoTitle: "[PSAD] Strength of Materials: Axial Stress & Strain"
}, function () {
  var mat, PkN, Lm, d, P, L, A, E, del;
  do {
    mat = pick([{ name: "steel", E: 200 }, { name: "aluminum", E: 70 }]);
    PkN = pick([10, 12, 15, 20, 25]);   // kN
    Lm = pick([1.5, 2, 2.5, 3, 4]);     // m
    d = pick([16, 20, 25, 32]);         // mm
    P = PkN * 1000;                     // N
    L = Lm * 1000;                      // mm
    A = Math.PI * d * d / 4;            // mm^2
    E = mat.E * 1000;                   // N/mm^2
    del = P * L / (A * E);              // mm
  } while (del < 0.5); // keep the conversion traps at readable magnitudes
  var tLen = del / 1000;                // trap: load left in kN
  var tE = del * 1000;                  // trap: E left in GPa
  var tDiam = del / 4;                  // trap: diameter used as the radius
  var question = "A solid round " + mat.name + " hanger rod suspends a rooftop ventilation unit from a roof beam. " +
    "The rod is " + fmt(Lm) + " m long, has a diameter of " + d + " mm, and carries a tensile load of " + PkN +
    " kN. If the elastic modulus of " + mat.name + " is " + mat.E + " GPa, how much does the rod elongate?";
  var solution = "Refer to the Uniaxial Loading and Deformation section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\delta\\), the axial elongation of the hanger rod:\n\n" +
    "$$\\delta = \\frac{PL}{AE}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\delta\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "P &= " + PkN + "\\ \\text{kN} = " + P + "\\ \\text{N} \\\\\n" +
    "L &= " + fmt(Lm) + "\\ \\text{m} = " + L + "\\ \\text{mm} \\\\\n" +
    "A &= \\frac{\\pi(" + d + ")^2}{4} = " + fmt(A) + "\\ \\text{mm}^2 \\\\\n" +
    "E &= " + mat.E + "\\ \\text{GPa} = " + E + "\\ \\text{N/mm}^2 \\quad (" + mat.name + ") \\\\\n" +
    "\\delta &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\delta) = \\frac{(" + P + ")(" + L + ")}{(" + fmt(A) + ")(" + E + ")} = " + fmt(del) + "\\ \\text{mm}$$";
  // Setup diagram (never the answer): hanger rod with the given length, diameter, and load.
  var d002 = (function () {
    var s = SVG_HDR + AH;
    s += '<rect x="250" y="36" width="140" height="14" fill="#9ca3af" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<rect x="308" y="50" width="24" height="150" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="320" y1="200" x2="320" y2="252" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="330" y="248" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">P = ' + PkN + ' kN</text>';
    s += '<line x1="282" y1="50" x2="282" y2="200" stroke="#b45309" stroke-width="1.6"/>';
    s += '<line x1="275" y1="50" x2="289" y2="50" stroke="#b45309" stroke-width="1.6"/>';
    s += '<line x1="275" y1="200" x2="289" y2="200" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="150" y="130" font-family="Georgia,serif" font-size="16" fill="#b45309">L = ' + fmt(Lm) + ' m</text>';
    s += '<text x="342" y="130" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">d = ' + d + ' mm</text>';
    s += '<text x="150" y="288" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">' + mat.name + ' hanger rod, E = ' + mat.E + ' GPa</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d002,
    variantKey: "axdef-" + mat.name + "-P" + P + "-L" + pdot(Lm) + "-d" + d,
    question: question,
    options: [
      { label: fmt(del) + " mm", num: del, correct: true },
      { label: fmt(tLen) + " mm", num: tLen, correct: false },
      { label: fmt(tE) + " mm", num: tE, correct: false },
      { label: fmt(tDiam) + " mm", num: tDiam, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-003: bending stress in a timber joist ---- */
reg(buildGenerator({
  baseId: "mechmat-003",
  topic: "Mechanics of Materials",
  subtopic: "Bending stress",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Bending stress is moment over section modulus — for a rectangle S = bh²/6 — and the kN-m to N-mm conversion is where the points are won or lost.",
  videoUrl: "https://www.youtube.com/watch?v=aZdh7UMStf0",
  videoTitle: "FLEXURAL/BENDING STRESS"
}, function () {
  var b = pick([75, 100, 125]);         // mm
  var h = pick([200, 250, 300, 350]);   // mm
  var MkNm = pick([8, 10, 12, 15, 20]); // kN-m
  var M = MkNm * 1e6;                   // N-mm
  var S = b * h * h / 6;                // mm^3
  var sig = M / S;                      // MPa
  var tNoConv = sig / 1000;             // trap: moment left in N-m
  var tFull = 2 * sig;                  // trap: used c = h instead of h/2 (S = I/h)
  var tSwap = sig * h * h / (b * b);    // trap: swapped b and h (S = hb^2/6)
  var question = "A solid timber floor joist in a residential deck has a rectangular cross section " + b +
    " mm wide by " + h + " mm deep. Under design loading, the maximum bending moment at midspan is " + MkNm +
    " kN-m. What is the maximum bending stress in the joist?";
  var solution = "Refer to the Stresses in Beams section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\sigma_{\\max}\\), the maximum bending stress, which occurs at the outer fiber:\n\n" +
    "$$\\sigma_{\\max} = \\frac{M}{S}, \\qquad S = \\frac{bh^2}{6}\\ \\text{(rectangle)}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\sigma_{\\max}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "b &= " + b + "\\ \\text{mm} \\\\\n" +
    "h &= " + h + "\\ \\text{mm} \\\\\n" +
    "M &= " + MkNm + "\\ \\text{kN-m} = " + MkNm + " \\times 10^6\\ \\text{N-mm} \\\\\n" +
    "\\sigma_{\\max} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "Section modulus: \\((S) = (" + b + ")(" + h + ")^2/6 = " + fmt(S) + "\\ \\text{mm}^3\\).\n\n" +
    "$$(\\sigma_{\\max}) = \\frac{" + MkNm + " \\times 10^6}{" + fmt(S) + "} = " + fmt(sig) + "\\ \\text{N/mm}^2 = " + fmt(sig) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): rectangular joist cross-section with b, h, and the bending moment.
  var d003 = (function () {
    var bx = 280, by = 80, bw = 100, bh = 150, s = SVG_HDR + AH;
    s += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" fill="#fef3c7" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + (bx - 24) + '" y1="' + (by + bh / 2) + '" x2="' + (bx + bw + 24) + '" y2="' + (by + bh / 2) + '" stroke="#6b7280" stroke-width="1.6" stroke-dasharray="7,5"/>';
    s += '<text x="' + (bx + bw + 28) + '" y="' + (by + bh / 2 + 5) + '" font-family="Georgia,serif" font-size="14" fill="#6b7280">N.A.</text>';
    s += '<path d="M ' + (bx + bw + 44) + ' ' + (by + 18) + ' A 60 60 0 0 1 ' + (bx + bw + 44) + ' ' + (by + bh - 18) + '" fill="none" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (bx + bw + 52) + '" y="' + (by + bh / 2 + 6) + '" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">M = ' + MkNm + ' kN-m</text>';
    s += '<line x1="' + bx + '" y1="' + (by - 18) + '" x2="' + (bx + bw) + '" y2="' + (by - 18) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<line x1="' + bx + '" y1="' + (by - 24) + '" x2="' + bx + '" y2="' + (by - 12) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<line x1="' + (bx + bw) + '" y1="' + (by - 24) + '" x2="' + (bx + bw) + '" y2="' + (by - 12) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + (bx + 14) + '" y="' + (by - 26) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">b = ' + b + ' mm</text>';
    s += '<line x1="' + (bx - 18) + '" y1="' + by + '" x2="' + (bx - 18) + '" y2="' + (by + bh) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<line x1="' + (bx - 24) + '" y1="' + by + '" x2="' + (bx - 12) + '" y2="' + by + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<line x1="' + (bx - 24) + '" y1="' + (by + bh) + '" x2="' + (bx - 12) + '" y2="' + (by + bh) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + (bx - 108) + '" y="' + (by + bh / 2 + 6) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">h = ' + h + ' mm</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d003,
    variantKey: "bend-b" + b + "-h" + h + "-M" + MkNm,
    question: question,
    options: [
      { label: fmt(sig) + " MPa", num: sig, correct: true },
      { label: fmt(tNoConv) + " MPa", num: tNoConv, correct: false },
      { label: fmt(tFull) + " MPa", num: tFull, correct: false },
      { label: fmt(tSwap) + " MPa", num: tSwap, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-004: shear stress in a rectangular beam ---- */
reg(buildGenerator({
  baseId: "mechmat-004",
  topic: "Mechanics of Materials",
  subtopic: "Shear stress in beams",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "In a rectangular beam the shear stress is parabolic — zero at the top and bottom fibers, maximum at the neutral axis and equal to 1.5 times V/A. Reporting just V/A is the classic trap.",
  videoUrl: "https://www.youtube.com/watch?v=BTdGnVzuRQ0",
  videoTitle: "Fundamental Problem 7.2 Determine the shear stress if the beam is subjected to a shear force"
}, function () {
  var V = pick([15, 20, 24, 30, 36]); // kN
  var b = pick([80, 100, 120]);       // mm
  var h = pick([150, 200, 240, 300]); // mm
  var Vn = V * 1000;                  // N
  var A = b * h;                      // mm^2
  var tau = 1.5 * Vn / A;             // MPa
  var tAvg = Vn / A;                  // trap: forgot the 1.5 factor
  var tNoConv = tau / 1000;           // trap: shear force left in kN
  var tDbl = 2 * tau;                 // trap: applied the 1.5 factor twice
  var question = "A solid rectangular timber transfer beam in a loading dock has a cross section " + b +
    " mm wide by " + h + " mm deep. At a support, the beam carries a transverse shear force of " + V +
    " kN. What is the maximum shear stress in the beam?";
  var solution = "Refer to the Stresses in Beams section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\tau_{\\max}\\). For a rectangular cross section the maximum shear stress occurs at the neutral axis and equals 1.5 times the average shear stress:\n\n" +
    "$$\\tau_{\\max} = 1.5\\frac{V}{A}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\tau_{\\max}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "V &= " + V + "\\ \\text{kN} = " + Vn + "\\ \\text{N} \\\\\n" +
    "A &= (" + b + ")(" + h + ") = " + A + "\\ \\text{mm}^2 \\\\\n" +
    "\\tau_{\\max} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\tau_{\\max}) = 1.5\\frac{" + Vn + "}{" + A + "} = 1.5(" + fmt(Vn / A) + ") = " + fmt(tau) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): rectangular beam cross-section with b, h, and the shear force.
  var d004 = (function () {
    var bx = 250, by = 80, bw = 140, bh = 130, s = SVG_HDR + AH;
    s += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" fill="#fef3c7" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + (bx - 20) + '" y1="' + (by + bh / 2) + '" x2="' + (bx + bw + 20) + '" y2="' + (by + bh / 2) + '" stroke="#6b7280" stroke-width="1.6" stroke-dasharray="7,5"/>';
    s += '<line x1="' + (bx + bw + 44) + '" y1="' + (by - 10) + '" x2="' + (bx + bw + 44) + '" y2="' + (by + 60) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + (bx + bw + 54) + '" y="' + (by + 20) + '" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">V = ' + V + ' kN</text>';
    s += '<line x1="' + bx + '" y1="' + (by - 18) + '" x2="' + (bx + bw) + '" y2="' + (by - 18) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + (bx + 34) + '" y="' + (by - 26) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">b = ' + b + ' mm</text>';
    s += '<line x1="' + (bx - 18) + '" y1="' + by + '" x2="' + (bx - 18) + '" y2="' + (by + bh) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + (bx - 108) + '" y="' + (by + bh / 2 + 6) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">h = ' + h + ' mm</text>';
    s += '<text x="' + (bx + bw + 28) + '" y="' + (by + bh / 2 + 42) + '" font-family="Georgia,serif" font-size="13" fill="#6b7280">max shear at N.A.</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d004,
    variantKey: "shear-V" + V + "-b" + b + "-h" + h,
    question: question,
    options: [
      { label: fmt(tau) + " MPa", num: tau, correct: true },
      { label: fmt(tAvg) + " MPa", num: tAvg, correct: false },
      { label: fmt(tNoConv) + " MPa", num: tNoConv, correct: false },
      { label: fmt(tDbl) + " MPa", num: tDbl, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-005: torsion of a solid shaft ---- */
reg(buildGenerator({
  baseId: "mechmat-005",
  topic: "Mechanics of Materials",
  subtopic: "Torsion",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Torsional shear stress is zero at the center and maximum at the outer surface, and the classic slip is leaving the torque in N-m while the diameter sits in mm.",
  videoUrl: "https://www.youtube.com/watch?v=zCyJxicDP-A",
  videoTitle: "Torsion of Stepped Shaft: Find Max Moment M & Total Angle of Twist"
}, function () {
  var TNm = pick([300, 400, 500, 600, 800]); // N-m
  var d = pick([30, 35, 40, 45, 50]);       // mm
  var T = TNm * 1000;                       // N-mm
  var tau = 16 * T / (Math.PI * d * d * d); // MPa
  var tNoConv = tau / 1000;                 // trap: torque left in N-m
  var tRad = 8 * tau;                       // trap: radius substituted for d in 16T/(pi d^3)
  var tJ = 2 * tau;                         // trap: used J = pi d^4/64 instead of pi d^4/32
  var question = "A solid steel line shaft in a conveyor drive system transmits a torque of " + TNm +
    " N-m. The shaft diameter is " + d + " mm. What is the maximum torsional shear stress at the outer surface of the shaft?";
  var solution = "Refer to the Torsion section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\tau_{\\max}\\), the maximum torsional shear stress at the shaft surface. For a solid circular shaft:\n\n" +
    "$$\\tau_{\\max} = \\frac{Tc}{J} = \\frac{16T}{\\pi d^3}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\tau_{\\max}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "T &= " + TNm + "\\ \\text{N-m} = " + T + "\\ \\text{N-mm} \\\\\n" +
    "d &= " + d + "\\ \\text{mm} \\\\\n" +
    "\\tau_{\\max} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\tau_{\\max}) = \\frac{16(" + T + ")}{\\pi(" + d + ")^3} = \\frac{" + (16 * T) + "}{" + fmt(Math.PI * d * d * d) + "} = " + fmt(tau) + "\\ \\text{N/mm}^2 = " + fmt(tau) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): solid shaft with the given torque and diameter.
  var d005 = (function () {
    var s = SVG_HDR + AH;
    s += '<rect x="170" y="120" width="300" height="60" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<path d="M 150 108 Q 118 150 150 192" fill="none" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<path d="M 490 192 Q 522 150 490 108" fill="none" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="262" y="100" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">T = ' + TNm + ' N-m</text>';
    s += '<circle cx="320" cy="150" r="17" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="303" y1="150" x2="337" y2="150" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="344" y="156" font-family="Georgia,serif" font-size="16" fill="#b45309">d = ' + d + ' mm</text>';
    s += '<text x="170" y="250" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">solid steel line shaft in torsion</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d005,
    variantKey: "tors-T" + TNm + "-d" + d,
    question: question,
    options: [
      { label: fmt(tau) + " MPa", num: tau, correct: true },
      { label: fmt(tNoConv) + " MPa", num: tNoConv, correct: false },
      { label: fmt(tRad) + " MPa", num: tRad, correct: false },
      { label: fmt(tJ) + " MPa", num: tJ, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-006: Euler column buckling ---- */
reg(buildGenerator({
  baseId: "mechmat-006",
  topic: "Mechanics of Materials",
  subtopic: "Column buckling",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "A column always buckles about its weak axis, so \\(I_{min}\\) controls — and the end condition sets K, which gets squared, so misreading the supports hurts twice.",
  videoUrl: "https://www.youtube.com/watch?v=uxsd_fGWxfw",
  videoTitle: "Euler's Equation for Steel Compression Members"
}, function () {
  var conds = [
    { label: "pinned at both ends", K: 1.0 },
    { label: "fixed at the base and free at the top", K: 2.0 },
    { label: "fixed at the base and pinned at the top", K: 0.7 },
    { label: "fixed at both ends", K: 0.5 }
  ];
  var w, d, L, ec, wec, f1, f2;
  do {
    w = pick([60, 80, 100]);         // mm, weak dimension
    d = pick([120, 150, 180]);       // mm, strong dimension
    L = pick([2.5, 3, 3.5, 4, 4.5]); // m
    ec = pick(conds);
    wec = pick(conds.filter(function (c) { return c.K !== ec.K; }));
    f1 = Math.pow(d / w, 2);         // trap factor: strong-axis I
    f2 = Math.pow(ec.K / wec.K, 2);  // trap factor: wrong end condition
  } while (f1 === f2); // keep the strong-axis and wrong-K traps distinct
  var wm = w / 1000, dm = d / 1000;              // m
  var Imin = dm * Math.pow(wm, 3) / 12;         // m^4
  var eI = Math.floor(Math.log10(Imin));
  var mI = Imin / Math.pow(10, eI);
  var mItex = fmt(r2(mI)) + "\\times 10^{" + eI + "}";
  var PcrN = Math.PI * Math.PI * 200e9 * Imin / Math.pow(ec.K * L, 2); // N
  var Pcr = PcrN / 1000;                             // kN
  var tStrong = Pcr * f1;        // trap: buckled about the strong axis
  var tWrongK = Pcr * f2;        // trap: misidentified the end condition
  var tAllow = Pcr / 2;          // trap: reported the allowable load (FS = 2)
  var question = "A steel column in a warehouse mezzanine frame is " + fmt(L) + " m tall with a rectangular cross section " +
    w + " mm by " + d + " mm. The column is " + ec.label + ". For steel, E = 200 GPa. What is the Euler critical buckling load of the column?";
  var solution = "Refer to the Columns section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(P_{cr}\\), the Euler critical buckling load. The column buckles about its weak axis, so use \\(I_{min}\\):\n\n" +
    "$$P_{cr} = \\frac{\\pi^2 EI}{(KL)^2}$$\n\n" +
    "The end condition (" + ec.label + ") gives \\(K = " + fmt(ec.K) + "\\).\n\n" +
    "List the known and unknown parameters in order to solve for \\(P_{cr}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "E &= 200\\ \\text{GPa} = 200 \\times 10^9\\ \\text{Pa} \\\\\n" +
    "K &= " + fmt(ec.K) + ",\\quad L = " + fmt(L) + "\\ \\text{m} \\\\\n" +
    "I_{min} &= \\frac{(" + fmt(dm) + ")(" + fmt(wm) + ")^3}{12} = " + mItex + "\\ \\text{m}^4 \\\\\n" +
    "P_{cr} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(P_{cr}) = \\frac{\\pi^2(200 \\times 10^9)(" + mItex + ")}{(" + fmt(ec.K) + " \\times " + fmt(L) + ")^2} = " + fmt(r0(PcrN)) + "\\ \\text{N} \\approx " + fmt(r1(Pcr)) + "\\ \\text{kN}$$";
  // Setup diagram (never the answer): column with its end conditions, length, and cross-section.
  // The K value itself is the answer's ingredient, so it is deliberately not labeled.
  var d006 = (function () {
    var s = SVG_HDR + AH, cx = 250, top = 70, bot = 240, wpx = 56, K = ec.K;
    function hatch(x, y, w, h) {
      var g = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#d1d5db" stroke="#1a1a1a" stroke-width="2"/>';
      for (var i = -h; i < w; i += 10) g += '<line x1="' + (x + i) + '" y1="' + (y + h) + '" x2="' + (x + i + h) + '" y2="' + y + '" stroke="#6b7280" stroke-width="1"/>';
      return g;
    }
    function pinTri(x, y, up) {
      var tip = up ? (y - 22) : (y + 22);
      return '<polygon points="' + (x - 26) + ',' + y + ' ' + (x + 26) + ',' + y + ' ' + x + ',' + tip + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    }
    s += '<rect x="' + cx + '" y="' + top + '" width="' + wpx + '" height="' + (bot - top) + '" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    if (K === 2.0 || K === 0.7) s += hatch(cx - 30, bot, wpx + 60, 16);   // fixed base
    else s += pinTri(cx + wpx / 2, bot, false);                          // pinned base
    if (K === 0.5) s += hatch(cx - 30, top - 16, wpx + 60, 16);          // fixed top
    else if (K !== 2.0) s += pinTri(cx + wpx / 2, top, true);            // pinned top
    // free top (K = 2.0): no support drawn
    s += '<line x1="180" y1="' + top + '" x2="180" y2="' + bot + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<line x1="173" y1="' + top + '" x2="187" y2="' + top + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<line x1="173" y1="' + bot + '" x2="187" y2="' + bot + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="96" y="' + ((top + bot) / 2 + 6) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">L = ' + fmt(L) + ' m</text>';
    s += '<rect x="430" y="100" width="60" height="110" fill="#fef3c7" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<text x="404" y="244" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">section ' + w + ' × ' + d + ' mm</text>';
    s += '<text x="60" y="36" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">steel column: ' + ec.label + '</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d006,
    variantKey: "buck-w" + w + "-d" + d + "-L" + pdot(L) + "-K" + pdot(ec.K),
    question: question,
    options: [
      { label: fmt(r1(Pcr)) + " kN", num: Pcr, correct: true },
      { label: fmt(r1(tStrong)) + " kN", num: tStrong, correct: false },
      { label: fmt(r1(tWrongK)) + " kN", num: tWrongK, correct: false },
      { label: fmt(r1(tAllow)) + " kN", num: tAllow, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-007: thin-walled pressure vessel hoop stress ---- */
reg(buildGenerator({
  baseId: "mechmat-007",
  topic: "Mechanics of Materials",
  subtopic: "Pressure vessels",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "In a thin-walled cylinder the hoop stress pr/t is exactly twice the longitudinal stress pr/2t — which is why burst pipes split along their length.",
  videoUrl: "https://www.youtube.com/watch?v=DLpJSolLTOE",
  videoTitle: "Pipe & Pressure-Vessel Stress — PE Mechanical TFS Week 6 (Lesson 05 of 09)"
}, function () {
  var Dm = pick([0.6, 0.8, 1.0, 1.2, 1.5]); // m, internal diameter
  var t = pick([6, 8, 10, 12]);             // mm
  var p = pick([0.8, 1.0, 1.2, 1.5, 2.0]);   // MPa
  var r = Dm * 1000 / 2;                    // mm (r/t >= 25, thin-wall valid)
  var sig = p * r / t;                      // MPa
  var tLong = sig / 2;                      // trap: longitudinal stress
  var tDiam = 2 * sig;                      // trap: diameter used as the radius
  var tKpa = sig / 1000;                    // trap: pressure left in kPa
  var question = "A thin-walled cylindrical compressed-air receiver tank has an internal diameter of " + fmt(Dm) +
    " m and a wall thickness of " + t + " mm. The tank operates at an internal gage pressure of " + fmt(p) +
    " MPa. What is the hoop (circumferential) stress in the wall?";
  var solution = "Refer to the Cylindrical Pressure Vessel section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the hoop stress \\(\\sigma_{hoop}\\). For a thin-walled cylindrical vessel:\n\n" +
    "$$\\sigma_{hoop} = \\frac{pr}{t}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\sigma_{hoop}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "p &= " + fmt(p) + "\\ \\text{MPa} \\\\\n" +
    "d &= " + fmt(Dm) + "\\ \\text{m} \\;\\Rightarrow\\; r = " + fmt(r) + "\\ \\text{mm} \\\\\n" +
    "t &= " + t + "\\ \\text{mm} \\\\\n" +
    "\\sigma_{hoop} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\sigma_{hoop}) = \\frac{(" + fmt(p) + ")(" + fmt(r) + ")}{" + t + "} = " + fmt(sig) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): thin-walled cylinder with internal diameter, wall thickness, and pressure.
  var d007 = (function () {
    var s = SVG_HDR + AH, cy = 150, i;
    s += '<rect x="170" y="105" width="300" height="90" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<ellipse cx="170" cy="' + cy + '" rx="18" ry="45" fill="#dbeafe" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="320" y1="105" x2="320" y2="195" stroke="#b45309" stroke-width="1.6"/>';
    s += '<line x1="313" y1="105" x2="327" y2="105" stroke="#b45309" stroke-width="1.6"/>';
    s += '<line x1="313" y1="195" x2="327" y2="195" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="332" y="155" font-family="Georgia,serif" font-size="16" fill="#b45309">D = ' + fmt(Dm) + ' m (inner)</text>';
    for (i = 0; i < 4; i++) {
      var px = 225 + i * 72;
      s += '<line x1="' + px + '" y1="105" x2="' + px + '" y2="72" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    }
    s += '<text x="60" y="62" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">p = ' + fmt(p) + ' MPa (internal)</text>';
    s += '<text x="452" y="70" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">t = ' + t + ' mm</text>';
    s += '<line x1="458" y1="76" x2="436" y2="102" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<text x="170" y="250" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">thin-walled cylindrical receiver tank</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d007,
    variantKey: "pv-D" + pdot(Dm) + "-t" + t + "-p" + pdot(p),
    question: question,
    options: [
      { label: fmt(sig) + " MPa", num: sig, correct: true },
      { label: fmt(tLong) + " MPa", num: tLong, correct: false },
      { label: fmt(tDiam) + " MPa", num: tDiam, correct: false },
      { label: fmt(tKpa) + " MPa", num: tKpa, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-008: restrained thermal stress ---- */
reg(buildGenerator({
  baseId: "mechmat-008",
  topic: "Mechanics of Materials",
  subtopic: "Thermal stress",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Fully restrained thermal stress depends only on E, α, and ΔT — never on length or area — and restrained heating means compressive while restrained cooling means tensile.",
  videoUrl: "https://www.youtube.com/watch?v=ZPGYdcFqDy0",
  videoTitle: "Thermal Stresses - Problem No 8"
}, function () {
  var mats = [
    { name: "steel", E: 200, alpha: 12 },
    { name: "aluminum", E: 70, alpha: 23 },
    { name: "copper", E: 110, alpha: 17 }
  ];
  var mat = pick(mats);
  var dT = pick([30, 40, 50, 60, 80]); // C, magnitude of temperature change
  var heat = pick([true, false]);
  var T1 = pick([15, 20, 25, 30]);     // C
  var T2 = heat ? T1 + dT : T1 - dT;   // C
  var sig = mat.E * mat.alpha * dT / 1000; // MPa
  var dirWord = heat ? "compressive" : "tensile";
  var oppWord = heat ? "tensile" : "compressive";
  var cNum = heat ? -sig : sig;        // sign-encoded: compressive negative
  var tempPhrase = heat
    ? "on a hot afternoon the rail temperature climbs to " + T2 + " °C"
    : "overnight the rail temperature falls to " + T2 + " °C";
  var question = "A length of continuously welded " + mat.name + " rail is installed stress-free at " + T1 +
    " °C. The rail is fully restrained against axial movement by its fasteners, and " + tempPhrase +
    ". For " + mat.name + ", \\(E = " + mat.E + "\\ \\text{GPa}\\) and \\(\\alpha = " + mat.alpha +
    " \\times 10^{-6}/^\\circ\\text{C}\\). What axial stress develops in the rail?";
  var solution = "Refer to the Thermal Deformations section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\sigma\\), the axial stress from fully restrained thermal deformation:\n\n" +
    "$$\\sigma = E\\alpha\\Delta T$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\sigma\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "E &= " + mat.E + "\\ \\text{GPa} = " + mat.E + " \\times 10^9\\ \\text{Pa} \\quad (" + mat.name + ") \\\\\n" +
    "\\alpha &= " + mat.alpha + " \\times 10^{-6}/^\\circ\\text{C} \\\\\n" +
    "\\Delta T &= " + dT + "^\\circ\\text{C}\\ \\text{(" + (heat ? "temperature rise" : "temperature drop") + ")} \\\\\n" +
    "\\sigma &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\sigma) = (" + mat.E + " \\times 10^9)(" + mat.alpha + " \\times 10^{-6})(" + dT + ")$$\n\n" +
    "$$(\\sigma) = " + fmt(sig) + " \\times 10^6\\ \\text{Pa} = " + fmt(sig) + "\\ \\text{MPa " + dirWord + "}$$\n\n" +
    "Because the " + (heat ? "heated" : "cooled") + " rail is restrained from " + (heat ? "expanding" : "contracting") +
    ", the stress is " + dirWord + ". (The rail length and cross-sectional area are not needed.)";
  // Setup diagram (never the answer): rail locked between rigid restraints with the temperature change.
  var d008 = (function () {
    var s = SVG_HDR + AH, i;
    function wall(x) {
      var g = '<rect x="' + x + '" y="110" width="22" height="80" fill="#d1d5db" stroke="#1a1a1a" stroke-width="2"/>';
      for (var j = -80; j < 22; j += 10) g += '<line x1="' + (x + j) + '" y1="190" x2="' + (x + j + 80) + '" y2="110" stroke="#6b7280" stroke-width="1"/>';
      return g;
    }
    s += wall(90) + wall(528);
    s += '<rect x="112" y="128" width="416" height="44" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<text x="180" y="80" font-family="Georgia,serif" font-size="17" fill="#1a1a1a">' + mat.name + ' rail, fully restrained</text>';
    s += '<text x="200" y="240" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">T1 = ' + T1 + ' °C → T2 = ' + T2 + ' °C</text>';
    s += '<text x="150" y="268" font-family="Georgia,serif" font-size="14" fill="#6b7280">' + (heat ? 'restrained heating' : 'restrained cooling') + ' — length and area play no role</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d008,
    variantKey: "therm-" + mat.name + "-dT" + dT + (heat ? "H" : "C"),
    question: question,
    options: [
      { label: fmt(sig) + " MPa " + dirWord, num: cNum, correct: true },
      { label: fmt(sig) + " MPa " + oppWord, num: -cNum, correct: false },
      { label: fmt(2 * sig) + " MPa " + dirWord, num: 2 * cNum, correct: false },
      { label: fmt(sig / 2) + " MPa " + dirWord, num: cNum / 2, correct: false }
    ],
    solution: solution
  };
}));
/* ---- mechmat-009: combined axial and bending stress ---- */
reg(buildGenerator({
  baseId: "mechmat-009",
  topic: "Mechanics of Materials",
  subtopic: "Combined axial and bending stress",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "An eccentric load is really two loads at once — a uniform axial stress plus a bending stress — so compute each one separately and add them on the side where they act together.",
  videoUrl: "https://www.youtube.com/watch?v=gJCWJ7KgTJM",
  videoTitle: "Strength of Materials - Combined Stresses (Sample Problem)"
}, function () {
  var b, h, PkN, e, P, A, sigAx, M, c, I, sigBend, ans, tBend, tAx, t2c;
  do {
    b = pick([120, 150, 180]);        // mm
    h = pick([200, 240, 300]);        // mm, eccentricity measured along h
    PkN = pick([30, 36, 40, 48, 60]); // kN
    e = pick([30, 40, 50, 60]);       // mm
    P = PkN * 1000;                   // N
    A = b * h;                        // mm^2
    sigAx = P / A;                    // MPa, uniform axial stress
    M = P * e;                        // N-mm
    c = h / 2;                        // mm
    I = b * h * h * h / 12;           // mm^4
    sigBend = M * c / I;              // MPa, bending stress at the outer fiber
    ans = sigAx + sigBend;            // maximum compressive stress
    tBend = sigBend;                  // trap: bending stress only, axial forgotten
    tAx = sigAx;                      // trap: axial stress only, bending forgotten
    t2c = sigAx + 2 * sigBend;        // trap: used the full depth h as c
  } while (new Set([fmt(ans), fmt(tBend), fmt(tAx), fmt(t2c)]).size !== 4);
  var Me = Math.floor(Math.log10(M)), Mm = M / Math.pow(10, Me);
  var Ie = Math.floor(Math.log10(I)), Im = I / Math.pow(10, Ie);
  var question = "A short rectangular concrete pier, " + b + " mm wide by " + h +
    " mm deep, carries a vertical compressive load of " + PkN +
    " kN applied " + e + " mm off the centroidal axis (measured along the " + h +
    " mm depth). What is the maximum compressive stress in the pier?";
  var solution = "Refer to the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\sigma_{max}\\), the maximum compressive stress. An eccentric compressive load superimposes a uniform axial stress and a bending stress:\n\n" +
    "$$\\sigma_{max} = \\frac{P}{A} + \\frac{Mc}{I}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\sigma_{max}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "P &= " + PkN + "\\ \\text{kN} = " + P + "\\ \\text{N} \\\\\n" +
    "A &= (" + b + ")(" + h + ") = " + A + "\\ \\text{mm}^2 \\\\\n" +
    "M &= Pe = (" + P + ")(" + e + ") = " + fmt(Mm) + "\\times 10^{" + Me + "}\\ \\text{N-mm} \\\\\n" +
    "c &= " + h + "/2 = " + fmt(c) + "\\ \\text{mm} \\\\\n" +
    "I &= (" + b + ")(" + h + ")^3/12 = " + fmt(Im) + "\\times 10^{" + Ie + "}\\ \\text{mm}^4 \\\\\n" +
    "\\sigma_{max} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\sigma_{max}) = \\frac{" + P + "}{" + A + "} + \\frac{(" + fmt(M) + ")(" + fmt(c) + ")}{" + I + "}$$\n\n" +
    "$$(\\sigma_{max}) = " + fmt(sigAx) + "\\ \\text{MPa} + " + fmt(sigBend) + "\\ \\text{MPa} = " + fmt(ans) + "\\ \\text{MPa (C)}$$";
  // Setup diagram (never the answer): plan view of the pier cross-section with the eccentric load offset.
  var d009 = (function () {
    var s = SVG_HDR + AH, cx = 320, cy = 150, wp = 100, hp = 160;
    var ePx = (e / h) * hp, ly = cy - ePx;
    s += '<rect x="' + (cx - wp / 2) + '" y="' + (cy - hp / 2) + '" width="' + wp + '" height="' + hp + '" fill="#fef3c7" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + (cx - 12) + '" y1="' + cy + '" x2="' + (cx + 12) + '" y2="' + cy + '" stroke="#6b7280" stroke-width="1.6"/>';
    s += '<line x1="' + cx + '" y1="' + (cy - 12) + '" x2="' + cx + '" y2="' + (cy + 12) + '" stroke="#6b7280" stroke-width="1.6"/>';
    s += '<text x="' + (cx + 18) + '" y="' + (cy + 5) + '" font-family="Georgia,serif" font-size="13" fill="#6b7280">centroid</text>';
    s += '<circle cx="' + cx + '" cy="' + ly.toFixed(1) + '" r="4" fill="#1d4ed8"/>';
    s += '<line x1="' + cx + '" y1="' + (ly - 46).toFixed(1) + '" x2="' + cx + '" y2="' + (ly - 8).toFixed(1) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx + 12) + '" y="' + (ly - 40).toFixed(1) + '" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">P = ' + PkN + ' kN</text>';
    s += '<line x1="' + (cx + 34) + '" y1="' + cy + '" x2="' + (cx + 34) + '" y2="' + ly.toFixed(1) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + (cx + 42) + '" y="' + ((cy + ly) / 2 + 5).toFixed(1) + '" font-family="Georgia,serif" font-size="15" fill="#b45309">e = ' + e + ' mm</text>';
    s += '<line x1="' + (cx - wp / 2 - 20) + '" y1="' + (cy - hp / 2) + '" x2="' + (cx - wp / 2 - 20) + '" y2="' + (cy + hp / 2) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + (cx - wp / 2 - 108) + '" y="' + (cy + 6) + '" font-family="Georgia,serif" font-size="15" fill="#b45309">h = ' + h + ' mm</text>';
    s += '<line x1="' + (cx - wp / 2) + '" y1="' + (cy - hp / 2 - 20) + '" x2="' + (cx + wp / 2) + '" y2="' + (cy - hp / 2 - 20) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + (cx - 44) + '" y="' + (cy - hp / 2 - 28) + '" font-family="Georgia,serif" font-size="15" fill="#b45309">b = ' + b + ' mm</text>';
    s += '<text x="120" y="282" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">plan view — load offset along the depth h</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d009,
    variantKey: "combax-P" + PkN + "-b" + b + "-h" + h + "-e" + e,
    question: question,
    options: [
      { label: fmt(ans) + " MPa (C)", num: ans, correct: true },
      { label: fmt(tBend) + " MPa (C)", num: tBend, correct: false },
      { label: fmt(tAx) + " MPa (C)", num: tAx, correct: false },
      { label: fmt(t2c) + " MPa (C)", num: t2c, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-010: beam deflection, uniform load on a simply supported beam ---- */
reg(buildGenerator({
  baseId: "mechmat-010",
  topic: "Mechanics of Materials",
  subtopic: "Beam deflection",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "A uniform load on a simply supported beam gets its own 5/384 coefficient — swapping in the point-load formula or forgetting to convert kN/m and mm^4 to base units are the classic ways to miss it.",
  videoUrl: "https://www.youtube.com/watch?v=iHaDiQanPlQ",
  videoTitle: "Problem 12.39 Determine the maximum deflection of the beam"
}, function () {
  var wkN = pick([4, 6, 8, 10]);    // kN/m
  var L = pick([4, 5, 6]);          // m
  var Ie6 = pick([30, 40, 60, 80]); // I in 10^6 mm^4
  var w = wkN * 1000;               // N/m
  var E = 200e9;                    // Pa, steel
  var I = Ie6 * 1e-6;               // m^4
  var dm = 5 * w * Math.pow(L, 4) / (384 * E * I); // m
  var d = dm * 1000;                // mm
  var tPoint = 1.6 * d;             // trap: PL^3/48EI with P = wL
  var tNoConv = d / 1000;           // trap: w left in kN/m
  var tCant = 9.6 * d;              // trap: cantilever uniform-load formula wL^4/8EI
  var de = Math.floor(Math.log10(dm)), dman = dm / Math.pow(10, de);
  var question = "A simply supported steel floor joist spans " + L +
    " m and carries a uniformly distributed load of " + wkN +
    " kN/m over its entire length. With E = 200 GPa and I = " + Ie6 +
    " × 10⁶ mm⁴, what is the maximum (midspan) deflection of the joist?";
  var solution = "Refer to the Deflection of Beams section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\delta_{max}\\), the maximum midspan deflection. For a simply supported beam under uniform load:\n\n" +
    "$$\\delta_{max} = \\frac{5wL^4}{384EI}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\delta_{max}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "w &= " + wkN + "\\ \\text{kN/m} = " + w + "\\ \\text{N/m} \\\\\n" +
    "L &= " + L + "\\ \\text{m} \\\\\n" +
    "E &= 200\\ \\text{GPa} = 200\\times 10^9\\ \\text{Pa} \\\\\n" +
    "I &= " + Ie6 + "\\times 10^6\\ \\text{mm}^4 = " + Ie6 + "\\times 10^{-6}\\ \\text{m}^4 \\\\\n" +
    "\\delta_{max} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\delta_{max}) = \\frac{5(" + w + ")(" + L + ")^4}{384(200\\times 10^9)(" + Ie6 + "\\times 10^{-6})}$$\n\n" +
    "$$(\\delta_{max}) = " + fmt(dman) + "\\times 10^{" + de + "}\\ \\text{m} = " + fmt(d) + "\\ \\text{mm downward}$$";
  // Setup diagram (never the answer): simply supported beam with the uniform load and span.
  var d010 = (function () {
    var s = SVG_HDR + AH, y = 150, x0 = 140, x1 = 500, i, ax;
    s += '<rect x="' + (x0 - 20) + '" y="' + y + '" width="' + (x1 - x0 + 40) + '" height="12" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<polygon points="' + (x0 - 16) + ',' + (y + 12) + ' ' + (x0 + 16) + ',' + (y + 12) + ' ' + x0 + ',' + (y + 36) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + (x0 - 24) + '" y1="' + (y + 36) + '" x2="' + (x0 + 24) + '" y2="' + (y + 36) + '" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<polygon points="' + (x1 - 16) + ',' + (y + 12) + ' ' + (x1 + 16) + ',' + (y + 12) + ' ' + x1 + ',' + (y + 30) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<circle cx="' + (x1 - 8) + '" cy="' + (y + 36) + '" r="5" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.6"/>';
    s += '<circle cx="' + (x1 + 8) + '" cy="' + (y + 36) + '" r="5" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.6"/>';
    s += '<line x1="' + (x1 - 24) + '" y1="' + (y + 42) + '" x2="' + (x1 + 24) + '" y2="' + (y + 42) + '" stroke="#1a1a1a" stroke-width="2"/>';
    for (i = 0; i < 7; i++) {
      ax = x0 + 20 + i * 55;
      s += '<line x1="' + ax + '" y1="' + (y - 52) + '" x2="' + ax + '" y2="' + (y - 6) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    }
    s += '<line x1="' + x0 + '" y1="' + (y - 58) + '" x2="' + x1 + '" y2="' + (y - 58) + '" stroke="#1d4ed8" stroke-width="1.4"/>';
    s += '<text x="' + ((x0 + x1) / 2 - 52) + '" y="' + (y - 66) + '" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">w = ' + wkN + ' kN/m</text>';
    s += '<line x1="' + x0 + '" y1="240" x2="' + x1 + '" y2="240" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + ((x0 + x1) / 2 - 34) + '" y="262" font-family="Georgia,serif" font-size="16" fill="#b45309">L = ' + L + ' m</text>';
    s += '<text x="' + x0 + '" y="110" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">simply supported, E = 200 GPa, I = ' + Ie6 + ' × 10⁶ mm⁴</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d010,
    variantKey: "bdef-w" + wkN + "-L" + L + "-I" + Ie6 + "e6",
    question: question,
    options: [
      { label: fmt(d) + " mm downward", num: d, correct: true },
      { label: fmt(tPoint) + " mm downward", num: tPoint, correct: false },
      { label: fmt(tNoConv) + " mm downward", num: tNoConv, correct: false },
      { label: fmt(tCant) + " mm downward", num: tCant, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-011: principal stresses ---- */
reg(buildGenerator({
  baseId: "mechmat-011",
  topic: "Mechanics of Materials",
  subtopic: "Principal stresses (Mohr's circle)",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "The given stresses act on the x- and y-faces, not on the principal planes — the shear stress rotates the principal values away from them, so always run the full formula.",
  videoUrl: "https://www.youtube.com/watch?v=Us98HjLmBG0",
  videoTitle: "For each of the plane stress states listed below, draw a Mohr's circle diagram..."
}, function () {
  var sx, sy, txy, avg, R, S, s1, s2, a1, a2, b1, b2, c1, c2;
  do {
    sx = pick([40, 45, 50, 60]);
    sy = pick([-20, -25, -30, -40]);
    txy = pick([15, 20, 25, 30]);
    avg = (sx + sy) / 2;
    R = Math.sqrt(Math.pow((sx - sy) / 2, 2) + txy * txy);
    s1 = avg + R; s2 = avg - R;
    a1 = sx; a2 = sy;                                   // trap: the given stresses
    b1 = (sx - sy) / 2 + R; b2 = (sx - sy) / 2 - R;     // trap: averaged with (sx-sy)/2
    S = Math.sqrt(Math.pow(sx - sy, 2) + txy * txy);
    c1 = avg + S; c2 = avg - S;                         // trap: forgot the 1/2 inside the radical
  } while (new Set([r2(s1), r2(a1), r2(b1), r2(c1)]).size !== 4);
  var question = "At a point in the web of a steel crane girder, the in-plane stress state is " +
    "\\(\\sigma_x = " + sx + "\\) MPa (tensile), \\(\\sigma_y = " + (-sy) + "\\) MPa (compressive), and " +
    "\\(\\tau_{xy} = " + txy + "\\) MPa. What are the in-plane principal stresses \\(\\sigma_1\\) and \\(\\sigma_2\\)?";
  var solution = "Refer to the Principal Stresses section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\sigma_1\\) and \\(\\sigma_2\\), the in-plane principal stresses:\n\n" +
    "$$\\sigma_{1,2} = \\frac{\\sigma_x + \\sigma_y}{2} \\pm \\sqrt{\\left(\\frac{\\sigma_x - \\sigma_y}{2}\\right)^2 + \\tau_{xy}^2}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\sigma_1\\) and \\(\\sigma_2\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "\\sigma_x &= " + texNum(sx) + "\\ \\text{MPa} \\\\\n" +
    "\\sigma_y &= " + texNum(sy) + "\\ \\text{MPa} \\\\\n" +
    "\\tau_{xy} &= " + texNum(txy) + "\\ \\text{MPa} \\\\\n" +
    "\\sigma_1, \\sigma_2 &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\sigma_{1,2}) = \\frac{" + texNum(sx) + " + (" + texNum(sy) + ")}{2} \\pm \\sqrt{\\left(\\frac{" + texNum(sx) + " - (" + texNum(sy) + ")}{2}\\right)^2 + (" + texNum(txy) + ")^2}$$\n\n" +
    "$$(\\sigma_{1,2}) = " + fmt(avg) + " \\pm " + fmt(R) + "\\ \\text{MPa}$$\n\n" +
    "$$(\\sigma_1, \\sigma_2) = (" + texNum(s1) + "\\ \\text{MPa},\\ " + texNum(s2) + "\\ \\text{MPa})$$";
  // Setup diagram (never the answer): stress element showing the given stress state on the x- and y-faces.
  var d011 = (function () {
    var s = SVG_HDR + AH, cx = 320, cy = 150, h = 120, hh = h / 2;
    var dir = txy >= 0 ? 1 : -1;
    s += '<rect x="' + (cx - hh) + '" y="' + (cy - hh) + '" width="' + h + '" height="' + h + '" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + (cx - hh) + '" y1="' + cy + '" x2="' + (cx - hh - 44) + '" y2="' + cy + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + (cx + hh) + '" y1="' + cy + '" x2="' + (cx + hh + 44) + '" y2="' + cy + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx + hh + 50) + '" y="' + (cy + 6) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">σx = ' + sx + ' MPa</text>';
    s += '<line x1="' + cx + '" y1="' + (cy - hh - 44) + '" x2="' + cx + '" y2="' + (cy - hh) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + cx + '" y1="' + (cy + hh + 44) + '" x2="' + cx + '" y2="' + (cy + hh) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx - 128) + '" y="' + (cy - hh - 52) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">σy = ' + (-sy) + ' MPa (C)</text>';
    s += '<line x1="' + (cx + hh + 26) + '" y1="' + (cy + dir * 34) + '" x2="' + (cx + hh + 26) + '" y2="' + (cy - dir * 34) + '" stroke="#b45309" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + (cx - dir * 34) + '" y1="' + (cy - hh - 26) + '" x2="' + (cx + dir * 34) + '" y2="' + (cy - hh - 26) + '" stroke="#b45309" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx - hh - 116) + '" y="' + (cy + hh + 62) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">τxy = ' + sgn(txy) + ' MPa</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d011,
    variantKey: "princ-sx" + sx + "-sy" + pdot(sy) + "-txy" + txy,
    question: question,
    options: [
      { label: sgn(s1) + " MPa and " + sgn(s2) + " MPa", num: s1, correct: true },
      { label: sgn(a1) + " MPa and " + sgn(a2) + " MPa", num: a1, correct: false },
      { label: sgn(b1) + " MPa and " + sgn(b2) + " MPa", num: b1, correct: false },
      { label: sgn(c1) + " MPa and " + sgn(c2) + " MPa", num: c1, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-012: shear stress, double shear ---- */
reg(buildGenerator({
  baseId: "mechmat-012",
  topic: "Mechanics of Materials",
  subtopic: "Shear stress (double shear)",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Double shear means the load crosses two cross-sections, so the resisting area is 2A — forgetting that doubles the answer, and watch diameter versus radius when you compute the area.",
  videoUrl: "https://www.youtube.com/watch?v=BA9ef7xKqJo",
  videoTitle: "Double Shear Joint – Solved Example Step by Step"
}, function () {
  var d = pick([12, 16, 20, 24]);       // mm
  var VkN = pick([25, 30, 40, 50, 60]); // kN
  var V = VkN * 1000;                   // N
  var A = Math.PI * d * d / 4;          // mm^2
  var tau = V / (2 * A);                // MPa
  var tSingle = V / A;                  // trap: single shear
  var tHalf = V / (4 * A);              // trap: halved the area again
  var tDiam = V / (2 * Math.PI * d * d);// trap: used the diameter as the radius
  var question = "A " + d + " mm diameter steel pin joins a hanger bracket between two gusset plates, " +
    "putting the pin in double shear. If the total shear force transferred through the joint is " + VkN +
    " kN, what is the shear stress in the pin?";
  var solution = "Refer to the Shear Stress-Strain section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\tau\\), the shear stress in the pin. In double shear the load crosses two cross-sections, so it spreads over twice the area:\n\n" +
    "$$\\tau = \\frac{V}{2A}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\tau\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "V &= " + VkN + "\\ \\text{kN} = " + V + "\\ \\text{N} \\\\\n" +
    "d &= " + d + "\\ \\text{mm} \\\\\n" +
    "A &= \\pi(" + fmt(d / 2) + ")^2 = " + fmt(A) + "\\ \\text{mm}^2 \\\\\n" +
    "\\tau &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\tau) = \\frac{" + V + "}{2(" + fmt(A) + ")} = " + fmt(tau) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): pin through three plates with the two shear planes and the load.
  var d012 = (function () {
    var s = SVG_HDR + AH, cy = 150;
    s += '<rect x="230" y="70" width="44" height="160" fill="#fef3c7" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<rect x="298" y="70" width="44" height="160" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<rect x="366" y="70" width="44" height="160" fill="#fef3c7" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<rect x="210" y="' + (cy - 16) + '" width="220" height="32" fill="#dbeafe" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<circle cx="210" cy="' + cy + '" r="16" fill="#dbeafe" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<circle cx="430" cy="' + cy + '" r="16" fill="#dbeafe" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="320" y1="230" x2="320" y2="282" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="330" y="278" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">V = ' + VkN + ' kN</text>';
    s += '<line x1="252" y1="70" x2="252" y2="22" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="388" y1="70" x2="388" y2="22" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="398" y="30" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">V/2 each</text>';
    s += '<line x1="286" y1="118" x2="286" y2="182" stroke="#b45309" stroke-width="1.8" stroke-dasharray="6,4"/>';
    s += '<line x1="354" y1="118" x2="354" y2="182" stroke="#b45309" stroke-width="1.8" stroke-dasharray="6,4"/>';
    s += '<text x="160" y="112" font-family="Georgia,serif" font-size="14" fill="#b45309">double shear planes</text>';
    s += '<text x="216" y="' + (cy + 54) + '" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">pin d = ' + d + ' mm</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d012,
    variantKey: "dblshr-V" + VkN + "-d" + d,
    question: question,
    options: [
      { label: fmt(tau) + " MPa", num: tau, correct: true },
      { label: fmt(tSingle) + " MPa", num: tSingle, correct: false },
      { label: fmt(tHalf) + " MPa", num: tHalf, correct: false },
      { label: fmt(tDiam) + " MPa", num: tDiam, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-013: Poisson's ratio, change in diameter ---- */
reg(buildGenerator({
  baseId: "mechmat-013",
  topic: "Mechanics of Materials",
  subtopic: "Poisson's ratio",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Poisson's ratio turns axial strain into lateral strain with a flipped sign — multiply by nu, apply it to the diameter (not the length), and remember a tensile load shrinks the diameter.",
  videoUrl: "https://www.youtube.com/watch?v=jN9Qb73DxNY",
  videoTitle: "Fundamental Problem 3.13 Relating Stress, elongation, change in dimensions due to applied forces"
}, function () {
  var steel = Math.random() < 0.5;
  var E = steel ? 200 : 70;             // GPa
  var nu = steel ? 0.29 : 0.33;
  var matName = steel ? "steel" : "aluminum";
  var d = pick([20, 25, 30]);           // mm
  var PkN = pick([80, 100, 120, 150]);  // kN
  var P = PkN * 1000;                   // N
  var A = Math.PI * d * d / 4;          // mm^2
  var sig = P / A;                      // MPa
  var eAx = sig / (E * 1000);           // axial strain
  var dd = -nu * eAx * d;               // mm, negative = decrease
  var m = -dd;                          // magnitude
  var tSkip = eAx * d;                  // trap: axial strain applied to the diameter (nu skipped)
  var tHalf = m / 2;                    // trap: change in radius instead of diameter
  // Setup diagram (never the answer): the tie rod under axial tension with
  // its diameter and material constants. The diameter change is not drawn.
  var d013 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img">' + AHK2;
    s += '<line x1="70" y1="60" x2="70" y2="200" stroke="#1a1a1a" stroke-width="3"/>';
    for (var i = 0; i < 4; i++) s += '<line x1="70" y1="' + (72 + 36 * i) + '" x2="56" y2="' + (84 + 36 * i) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
    s += '<rect x="70" y="98" width="300" height="56" fill="#f5f5f5" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<text x="220" y="132" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">' + matName + ' rod</text>';
    s += '<line x1="370" y1="126" x2="450" y2="126" stroke="#1d4ed8" stroke-width="2.6" marker-end="url(#ah)"/>';
    s += '<text x="410" y="110" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">P = ' + PkN + ' kN</text>';
    s += '<line x1="92" y1="98" x2="92" y2="154" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="92" y1="100" x2="92" y2="118" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="92" y1="152" x2="92" y2="134" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="102" y="130" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">d = ' + d + ' mm</text>';
    s += '<text x="240" y="188" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">E = ' + E + ' GPa,  ν = ' + fmt(nu) + '</text>';
    s += '<text x="240" y="232" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="bold" fill="#1a1a1a">Δd = ?</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A solid " + matName + " tie rod with a diameter of " + d +
    " mm (E = " + E + " GPa, \\(\\nu = " + fmt(nu) + "\\)) hangs a work platform and carries a " +
    PkN + " kN axial tensile load. What is the change in the rod's diameter?";
  var solution = "Refer to the Poisson's Ratio section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\Delta d\\), the change in the rod's diameter. Lateral strain is Poisson's ratio times the axial strain, with opposite sign:\n\n" +
    "$$\\epsilon_{lat} = -\\nu\\,\\epsilon_{axial}, \\quad \\Delta d = d\\,\\epsilon_{lat}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\Delta d\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "P &= " + PkN + "\\ \\text{kN} = " + P + "\\ \\text{N} \\\\\n" +
    "d &= " + d + "\\ \\text{mm} \\\\\n" +
    "E &= " + E + "\\ \\text{GPa} \\\\\n" +
    "\\nu &= " + fmt(nu) + " \\\\\n" +
    "\\Delta d &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\sigma) = P/A = " + P + "/[\\pi(" + fmt(d / 2) + ")^2] = " + fmt(sig) + "\\ \\text{MPa}$$\n\n" +
    "$$(\\epsilon_{axial}) = \\sigma/E = (" + fmt(sig) + "\\times 10^6)/(" + E + "\\times 10^9) = " + fmt(eAx * 1e3) + "\\times 10^{-3}$$\n\n" +
    "$$(\\Delta d) = (d)(-\\nu)(\\epsilon_{axial}) = (" + d + ")(" + texNum(-nu) + ")(" + fmt(eAx * 1e3) + "\\times 10^{-3}) = " + fmt(dd) + "\\ \\text{mm}$$\n\n" +
    "The negative sign means the diameter shrinks: it decreases by " + fmt(m) + " mm.";
  return {
    variantKey: "poiss-" + matName + "-d" + d + "-P" + PkN,
    question: question,
    diagram: d013,
    options: [
      { label: "Decreases by " + fmt(m) + " mm", num: dd, correct: true },
      { label: "Increases by " + fmt(m) + " mm", num: -dd, correct: false },
      { label: "Decreases by " + fmt(tSkip) + " mm", num: -tSkip, correct: false },
      { label: "Decreases by " + fmt(tHalf) + " mm", num: -tHalf, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-014: angle of twist ---- */
reg(buildGenerator({
  baseId: "mechmat-014",
  topic: "Mechanics of Materials",
  subtopic: "Angle of twist (torsion)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The torsion formula gives the twist in radians, so the last step is always multiplying by 180/π — and the polar moment J uses the full diameter to the fourth power, not the radius.",
  videoUrl: "https://www.youtube.com/watch?v=zCyJxicDP-A",
  videoTitle: "Torsion of Stepped Shaft: Find Max Moment M & Total Angle of Twist"
}, function () {
  var steel = Math.random() < 0.5;
  var G = steel ? 79 : 26;              // GPa
  var E = steel ? 200 : 70;             // GPa, for the E-instead-of-G trap
  var matName = steel ? "steel" : "aluminum";
  var dmm = pick([40, 50, 60]);         // mm
  var Lm = pick([1, 1.5, 2]);          // m
  var TNm = pick([300, 400, 500, 600]); // N-m
  var d = dmm / 1000;                   // m
  var J = Math.PI * Math.pow(d, 4) / 32;// m^4
  var phi = TNm * Lm / (G * 1e9 * J);   // rad
  var phiDeg = phi * 180 / Math.PI;     // degrees
  var tRad = phi;                       // trap: radians reported as degrees
  var tRadius = 16 * phiDeg;            // trap: J computed with the radius
  var tE = phiDeg * G / E;              // trap: used E instead of G
  var Je = Math.floor(Math.log10(J)), Jm = J / Math.pow(10, Je);
  var question = "A solid " + matName + " drive shaft (G = " + G + " GPa), " + dmm +
    " mm in diameter and " + fmt(Lm) + " m long, transmits a torque of " + TNm +
    " N-m from a motor to a pump. What is the angle of twist between its ends? Give the answer in degrees.";
  var solution = "Refer to the Torsion section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\phi\\), the angle of twist between the shaft ends:\n\n" +
    "$$\\phi = \\frac{TL}{GJ}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\phi\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "T &= " + TNm + "\\ \\text{N-m} \\\\\n" +
    "L &= " + fmt(Lm) + "\\ \\text{m} \\\\\n" +
    "d &= " + dmm + "\\ \\text{mm} \\\\\n" +
    "J &= \\pi d^4/32 = " + fmt(Jm) + "\\times 10^{" + Je + "}\\ \\text{m}^4 \\\\\n" +
    "G &= " + G + "\\ \\text{GPa} \\\\\n" +
    "\\phi &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\phi) = \\frac{(" + TNm + ")(" + fmt(Lm) + ")}{(" + G + "\\times 10^9)(" + fmt(Jm) + "\\times 10^{" + Je + "})} = " + fmt(phi) + "\\ \\text{rad}$$\n\n" +
    "The formula gives radians, so convert to degrees:\n\n" +
    "$$(\\phi) = " + fmt(phi) + "\\left(\\frac{180^\\circ}{\\pi}\\right) = " + fmt(phiDeg) + "^\\circ$$";
  // Setup diagram (never the answer): shaft fixed at one end with torque, length, and diameter.
  var d014 = (function () {
    var s = SVG_HDR + AH, y = 150, i;
    s += '<rect x="90" y="90" width="22" height="120" fill="#d1d5db" stroke="#1a1a1a" stroke-width="2"/>';
    for (i = -120; i < 22; i += 12) s += '<line x1="' + (90 + i) + '" y1="210" x2="' + (90 + i + 120) + '" y2="90" stroke="#6b7280" stroke-width="1"/>';
    s += '<rect x="112" y="120" width="340" height="60" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<path d="M 470 108 Q 505 150 470 192" fill="none" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="428" y="232" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">T = ' + TNm + ' N-m</text>';
    s += '<line x1="112" y1="262" x2="452" y2="262" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="252" y="286" font-family="Georgia,serif" font-size="16" fill="#b45309">L = ' + fmt(Lm) + ' m</text>';
    s += '<text x="112" y="70" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">d = ' + dmm + ' mm, ' + matName + ', G = ' + G + ' GPa</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d014,
    variantKey: "twist-" + matName + "-T" + TNm + "-L" + pdot(Lm) + "-d" + dmm,
    question: question,
    options: [
      { label: fmt(phiDeg) + "°", num: phiDeg, correct: true },
      { label: fmt(tRad) + "°", num: tRad, correct: false },
      { label: fmt(tRadius) + "°", num: tRadius, correct: false },
      { label: fmt(tE) + "°", num: tE, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-015: torsion of thin-walled closed sections (Bredt) ---- */
reg(buildGenerator({
  baseId: "mechmat-015",
  topic: "Mechanics of Materials",
  subtopic: "Torsion of thin-walled closed sections",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Bredt's formula needs the area enclosed by the wall centerline; the traps use the outside dimensions, drop the factor of 2, or double the wall thickness.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var a = pick([120, 150, 160, 180, 200]); // mm, centerline
  var b = pick([100, 120, 150, 180]);     // mm, centerline
  var t = pick([4, 5, 6, 8]);             // mm, wall thickness
  var TkNm = pick([1, 1.5, 2, 2.5, 3]);   // kN-m
  var Am = a * b;                         // mm^2 enclosed by the wall centerline
  var T = TkNm * 1e6;                     // N-mm
  var tau = T / (2 * Am * t);             // MPa
  var tNo2 = T / (Am * t);                // trap: dropped the 2 in Bredt's formula
  var tOuter = T / (2 * (a + t) * (b + t) * t); // trap: outside dimensions for the enclosed area
  var t2t = T / (2 * Am * 2 * t);         // trap: doubled the wall thickness
  var shape = (a === b) ? "square" : "rectangular";
  var question = "A thin-walled closed " + shape + " tube (centerline dimensions " + a +
    " mm × " + b + " mm) with uniform wall thickness " + t +
    " mm is subjected to a torque of " + fmt(TkNm) +
    " kN-m. Using Bredt's formula, what is the shear stress in the tube wall?";
  var solution = "Refer to the For Hollow, Thin-Walled Shafts section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\tau\\), the shear stress in the tube wall. Bredt's formula relates the torque to the shear flow around the section:\n\n" +
    "$$\\tau = \\frac{T}{2A_m t}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\tau\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "T &= " + fmt(TkNm) + "\\ \\text{kN-m} = " + fmt(TkNm) + "\\times 10^6\\ \\text{N-mm} \\\\\n" +
    "A_m &= (" + a + ")(" + b + ") = " + Am + "\\ \\text{mm}^2\\ \\text{(centerline)} \\\\\n" +
    "t &= " + t + "\\ \\text{mm} \\\\\n" +
    "\\tau &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\tau) = \\frac{" + fmt(TkNm) + "\\times 10^6}{2(" + Am + ")(" + t + ")} = " + fmt(tau) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): closed-tube cross-section; dimensions are wall centerline.
  var d015 = (function () {
    var s = SVG_HDR + AH, cx = 300, cy = 150, ow = 220, oh = 160, tpx = 14;
    s += '<rect x="' + (cx - ow / 2) + '" y="' + (cy - oh / 2) + '" width="' + ow + '" height="' + oh + '" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<rect x="' + (cx - ow / 2 + tpx) + '" y="' + (cy - oh / 2 + tpx) + '" width="' + (ow - 2 * tpx) + '" height="' + (oh - 2 * tpx) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.6"/>';
    s += '<rect x="' + (cx - ow / 2 + tpx / 2) + '" y="' + (cy - oh / 2 + tpx / 2) + '" width="' + (ow - tpx) + '" height="' + (oh - tpx) + '" fill="none" stroke="#6b7280" stroke-width="1.2" stroke-dasharray="6,4"/>';
    s += '<line x1="' + (cx - ow / 2 + tpx / 2) + '" y1="' + (cy - oh / 2 - 18) + '" x2="' + (cx + ow / 2 - tpx / 2) + '" y2="' + (cy - oh / 2 - 18) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + (cx - 52) + '" y="' + (cy - oh / 2 - 26) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">a = ' + a + ' mm</text>';
    s += '<line x1="' + (cx - ow / 2 - 18) + '" y1="' + (cy - oh / 2 + tpx / 2) + '" x2="' + (cx - ow / 2 - 18) + '" y2="' + (cy + oh / 2 - tpx / 2) + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + (cx - ow / 2 - 104) + '" y="' + (cy + 6) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">b = ' + b + ' mm</text>';
    s += '<text x="' + (cx + ow / 2 + 16) + '" y="' + (cy - oh / 2 + 40) + '" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">t = ' + t + ' mm</text>';
    s += '<line x1="' + (cx + ow / 2 + 12) + '" y1="' + (cy - oh / 2 + 34) + '" x2="' + (cx + ow / 2 + 2) + '" y2="' + (cy - oh / 2 + 8) + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<text x="105" y="282" font-family="Georgia,serif" font-size="14" fill="#6b7280">closed ' + shape + ' tube section; a, b are wall centerline dimensions</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d015,
    variantKey: "bredt-a" + a + "-b" + b + "-t" + t + "-T" + pdot(TkNm),
    question: question,
    options: [
      { label: fmt(tau) + " MPa", num: tau, correct: true },
      { label: fmt(tNo2) + " MPa", num: tNo2, correct: false },
      { label: fmt(tOuter) + " MPa", num: tOuter, correct: false },
      { label: fmt(t2t) + " MPa", num: t2t, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-016: stress transformation ---- */
reg(buildGenerator({
  baseId: "mechmat-016",
  topic: "Mechanics of Materials",
  subtopic: "Stress transformation",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The transformation equations take twice the physical angle — plug in 2θ, keep the shear term, and watch its sign.",
  videoUrl: "https://www.youtube.com/watch?v=Us98HjLmBG0",
  videoTitle: "For each of the plane stress states listed below, draw a Mohr's circle diagram..."
}, function () {
  var sx, sy, txy, th, avg, dev, r2t, rt, ans, tRaw, tNoTxy, tFlip;
  do {
    sx = pick([40, 50, 60]);
    sy = pick([-20, -30, -40]);
    txy = pick([-25, -20, -15, 15, 20, 25]);
    th = pick([30, 45, 60]);                 // degrees, counterclockwise
    avg = (sx + sy) / 2;
    dev = (sx - sy) / 2;
    r2t = 2 * th * Math.PI / 180;
    rt = th * Math.PI / 180;
    ans = avg + dev * Math.cos(r2t) + txy * Math.sin(r2t);
    tRaw = avg + dev * Math.cos(rt) + txy * Math.sin(rt);    // trap: theta instead of 2theta
    tNoTxy = avg + dev * Math.cos(r2t);                      // trap: dropped the shear term
    tFlip = avg + dev * Math.cos(r2t) - txy * Math.sin(r2t); // trap: sign error on the shear term
  } while (new Set([r2(ans), r2(tRaw), r2(tNoTxy), r2(tFlip)]).size !== 4);
  var question = "At a point in a steel gusset plate, the in-plane stress state is " +
    "\\(\\sigma_x = " + sx + "\\) MPa (tensile), \\(\\sigma_y = " + (-sy) + "\\) MPa (compressive), and " +
    "\\(\\tau_{xy} = " + sgn(txy) + "\\) MPa. What is the normal stress \\(\\sigma_{x'}\\) on a plane inclined at " +
    "\\(\\theta = " + th + "^\\circ\\) counterclockwise from the x-face?";
  var solution = "Refer to the Mohr's Circle—Stress, 2D section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\sigma_{x'}\\), the normal stress on the inclined plane:\n\n" +
    "$$\\sigma_{x'} = \\frac{\\sigma_x + \\sigma_y}{2} + \\frac{\\sigma_x - \\sigma_y}{2}\\cos 2\\theta + \\tau_{xy}\\sin 2\\theta$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\sigma_{x'}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "\\sigma_x &= " + texNum(sx) + "\\ \\text{MPa} \\\\\n" +
    "\\sigma_y &= " + texNum(sy) + "\\ \\text{MPa} \\\\\n" +
    "\\tau_{xy} &= " + texNum(txy) + "\\ \\text{MPa} \\\\\n" +
    "\\theta &= " + th + "^\\circ\\ \\text{(counterclockwise)} \\\\\n" +
    "\\sigma_{x'} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\sigma_{x'}) = \\frac{" + texNum(sx) + " + (" + texNum(sy) + ")}{2} + \\frac{" + texNum(sx) + " - (" + texNum(sy) + ")}{2}\\cos " + (2 * th) + "^\\circ + (" + texNum(txy) + ")\\sin " + (2 * th) + "^\\circ$$\n\n" +
    "$$(\\sigma_{x'}) = " + fmt(avg) + " + " + fmt(dev) + "(" + fmt(Math.cos(r2t)) + ") + (" + texNum(txy) + ")(" + fmt(Math.sin(r2t)) + ") = " + fmt(ans) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): stress element with the given state plus the inclined plane at theta.
  var d016 = (function () {
    var s = SVG_HDR + AH, cx = 300, cy = 150, h = 120, hh = h / 2;
    var dir = txy >= 0 ? 1 : -1;
    s += '<rect x="' + (cx - hh) + '" y="' + (cy - hh) + '" width="' + h + '" height="' + h + '" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + (cx - hh) + '" y1="' + cy + '" x2="' + (cx - hh - 44) + '" y2="' + cy + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + (cx + hh) + '" y1="' + cy + '" x2="' + (cx + hh + 44) + '" y2="' + cy + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx + hh + 50) + '" y="' + (cy + 6) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">σx = ' + sx + ' MPa</text>';
    s += '<line x1="' + cx + '" y1="' + (cy - hh - 44) + '" x2="' + cx + '" y2="' + (cy - hh) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + cx + '" y1="' + (cy + hh + 44) + '" x2="' + cx + '" y2="' + (cy + hh) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx - 128) + '" y="' + (cy - hh - 52) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">σy = ' + (-sy) + ' MPa (C)</text>';
    s += '<line x1="' + (cx + hh + 26) + '" y1="' + (cy + dir * 34) + '" x2="' + (cx + hh + 26) + '" y2="' + (cy - dir * 34) + '" stroke="#b45309" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + (cx - dir * 34) + '" y1="' + (cy - hh - 26) + '" x2="' + (cx + dir * 34) + '" y2="' + (cy - hh - 26) + '" stroke="#b45309" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx - hh - 116) + '" y="' + (cy + hh + 62) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">τxy = ' + sgn(txy) + ' MPa</text>';
    // inclined plane: dashed trace through the element, rotated th CCW from the x-face (vertical)
    var ang = th * Math.PI / 180, px = cx + hh, py = cy;
    var ux = -Math.sin(ang), uy = -Math.cos(ang); // up-left direction of the plane trace
    var nx = Math.cos(ang), ny = -Math.sin(ang);  // x' normal direction
    s += '<line x1="' + (px - 62 * ux).toFixed(1) + '" y1="' + (py - 62 * uy).toFixed(1) + '" x2="' + (px + 62 * ux).toFixed(1) + '" y2="' + (py + 62 * uy).toFixed(1) + '" stroke="#6b7280" stroke-width="1.8" stroke-dasharray="7,5"/>';
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + 52 * nx).toFixed(1) + '" y2="' + (cy + 52 * ny).toFixed(1) + '" stroke="#6b7280" stroke-width="2" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx + 56 * nx + 6).toFixed(1) + '" y="' + (cy + 56 * ny + 4).toFixed(1) + '" font-family="Georgia,serif" font-size="15" fill="#6b7280">x\'</text>';
    s += '<path d="M ' + px + ' ' + (py - 26) + ' Q ' + (px - 13) + ' ' + (py - 27) + ' ' + (px - 26 * Math.sin(ang)).toFixed(1) + ' ' + (py - 26 * Math.cos(ang)).toFixed(1) + '" fill="none" stroke="#6b7280" stroke-width="1.6"/>';
    s += '<text x="' + (px + 8) + '" y="' + (py - 30) + '" font-family="Georgia,serif" font-size="15" fill="#6b7280">θ = ' + th + '°</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d016,
    variantKey: "strans-sx" + sx + "-sy" + pdot(sy) + "-txy" + pdot(txy) + "-th" + th,
    question: question,
    options: [
      { label: sgn(ans) + " MPa", num: ans, correct: true },
      { label: sgn(tRaw) + " MPa", num: tRaw, correct: false },
      { label: sgn(tNoTxy) + " MPa", num: tNoTxy, correct: false },
      { label: sgn(tFlip) + " MPa", num: tFlip, correct: false }
    ],
    solution: solution
  };
}));
/* ---- mechmat-017: Absolute maximum shear stress ---- */
reg(buildGenerator({
  baseId: "mechmat-017",
  topic: "Mechanics of Materials",
  subtopic: "Absolute maximum shear stress",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "In plane stress, zero is always the third principal stress — the absolute maximum shear pairs zero against whichever in-plane principal is farthest from zero.",
  videoUrl: "https://www.youtube.com/watch?v=Us98HjLmBG0",
  videoTitle: "For each of the plane stress states listed below, draw a Mohr's circle diagram..."
}, function () {
  var s1 = pick([60, 70, 80, 90, 100, 110]);
  var s2 = pick([20, 25, 30, 35, 40, 50]);
  var neg = pick([true, false]);
  var a = neg ? -s1 : s1;   // |a| > |b|, same sign by construction
  var b = neg ? -s2 : s2;
  var sigMax = Math.max(a, b, 0);
  var sigMin = Math.min(a, b, 0);
  var ans = (sigMax - sigMin) / 2;          // pairs zero with the principal farthest from zero
  var tInPlane = Math.abs(a - b) / 2;       // trap: in-plane maximum shear only
  var tAvg = (Math.abs(a) + Math.abs(b)) / 2; // trap: Mohr's circle center magnitude
  var tFull = Math.abs(a);                  // trap: forgot to divide by 2
  // Strict ordering tInPlane < ans < tAvg < tFull holds for |a| > |b| > 0.
  var state = neg ? "both compressive" : "both tensile";
  // Setup diagram (never the answer): stress element with both principal
  // stresses; arrow sense follows the rolled sign (tension out, compression in).
  // The absolute maximum shear is not given.
  var d017 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var x0 = 180, y0 = 110, sz = 120;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img">' + AHK2;
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + sz + '" height="' + sz + '" fill="#f5f5f5" stroke="#1a1a1a" stroke-width="2.5"/>';
    var o = neg ? 0 : 1; // 1 = arrows point outward (tension)
    function arr(x1, y1, x2, y2) { return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" stroke="#1d4ed8" stroke-width="2.6" marker-end="url(#ah)"/>'; }
    var cx = x0 + sz / 2, cy = y0 + sz / 2;
    if (o) {
      s += arr(x0, cy, x0 - 64, cy) + arr(x0 + sz, cy, x0 + sz + 64, cy);
      s += arr(cx, y0, cx, y0 - 64) + arr(cx, y0 + sz, cx, y0 + sz + 64);
    } else {
      s += arr(x0 - 64, cy, x0, cy) + arr(x0 + sz + 64, cy, x0 + sz, cy);
      s += arr(cx, y0 - 64, cx, y0) + arr(cx, y0 + sz + 64, cx, y0 + sz);
    }
    s += '<text x="' + cx + '" y="' + (y0 - 76) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">σ1 = ' + sgn(a) + ' MPa</text>';
    s += '<text x="' + (x0 + sz + 70) + '" y="' + (cy + 5) + '" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">σ2 = ' + sgn(b) + ' MPa</text>';
    s += '<text x="240" y="296" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">thin plate, plane stress (' + state + ')</text>';
    s += '<text x="240" y="332" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="bold" fill="#1a1a1a">τ(abs max) = ?</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A steel gusset plate in a pedestrian bridge truss is in a state of plane stress. " +
    "At a critical point near a bolt hole, the in-plane principal stresses are σ1 = " + sgn(a) +
    " MPa and σ2 = " + sgn(b) + " MPa (" + state + "). " +
    "What is the absolute maximum shear stress at the point?";
  var solution = "Refer to the Principal Stresses section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\tau_{abs\\ max}\\), the absolute maximum shear stress. In plane stress the out-of-plane principal stress is zero, so all three pairings must be checked:\n\n" +
    "$$\\tau_{abs\\ max} = \\frac{\\sigma_{max} - \\sigma_{min}}{2}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\tau_{abs\\ max}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "\\sigma_1 &= " + texNum(a) + "\\ \\text{MPa} \\\\\n" +
    "\\sigma_2 &= " + texNum(b) + "\\ \\text{MPa} \\\\\n" +
    "\\sigma_3 &= 0\\ \\text{MPa (out of plane)} \\\\\n" +
    "\\tau_{abs\\ max} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "Because \\(\\sigma_1\\) and \\(\\sigma_2\\) have the same sign, the zero out-of-plane stress pairs with the principal farthest from zero:\n\n" +
    "$$(\\tau_{abs\\ max}) = \\frac{" + texNum(sigMax) + " - (" + texNum(sigMin) + ")}{2} = " + fmt(ans) + "\\ \\text{MPa}$$";
  return {
    variantKey: "absmax-" + (neg ? "neg" : "pos") + "-s1" + s1 + "-s2" + s2,
    question: question,
    diagram: d017,
    options: [
      { label: fmt(ans) + " MPa", num: ans, correct: true },
      { label: fmt(tInPlane) + " MPa", num: tInPlane, correct: false },
      { label: fmt(tAvg) + " MPa", num: tAvg, correct: false },
      { label: fmt(tFull) + " MPa", num: tFull, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-018: Statically indeterminate axial deformation ---- */
reg(buildGenerator({
  baseId: "mechmat-018",
  topic: "Mechanics of Materials",
  subtopic: "Statically indeterminate axial deformation",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Compatibility splits the load by the opposite segment's length: the wall nearer the load carries less, the farther wall carries more.",
  videoUrl: "https://www.youtube.com/watch?v=RNYpQ_aBiBk",
  videoTitle: "Statically indeterminate problem 1 (English)"
}, function () {
  var L, a, b, P;
  do {
    L = pick([2.0, 2.5, 3.0, 4.0]);
    a = pick([0.8, 1.0, 1.2, 1.5, 1.6, 2.0, 2.5]);
    b = r1(L - a);
    P = pick([40, 60, 80, 90, 100, 120]);
  } while (!(a > 0 && a < L && b > 0 && Math.abs(a - b) > 1e-9));
  var RL = r2(P * b / L);   // left wall takes the opposite (right) segment's share
  var RR = r2(P * a / L);   // trap: the far wall's reaction assigned to the near wall
  var tHalf = r2(P / 2);    // trap: assumed the load splits evenly
  var tFull = P;            // trap: the entire load
  // a != b and b < L guarantee RL, RR, P/2, P are pairwise distinct.
  var question = "A steel strut bracing a warehouse frame is fixed between two rigid columns, " +
    "with total length " + fmt(L) + " m between the walls. A forklift-guard bracket applies an axial load of " +
    P + " kN to the strut at a point " + fmt(a) + " m from the left wall (" + fmt(b) + " m from the right wall). " +
    "What is the axial reaction at the left wall?";
  var solution = "Refer to the Uniaxial Loading and Deformation section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(R_L\\), the reaction at the left wall. Equilibrium plus the compatibility condition (the total deformation is zero) give:\n\n" +
    "$$R_L + R_R = P, \\qquad \\frac{R_L a}{AE} = \\frac{R_R b}{AE}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(R_L\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "P &= " + P + "\\ \\text{kN} \\\\\n" +
    "a &= " + fmt(a) + "\\ \\text{m (left segment)} \\\\\n" +
    "b &= " + fmt(b) + "\\ \\text{m (right segment)} \\\\\n" +
    "R_L &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "Eliminating \\(R_R\\) gives \\(R_L = P\\frac{b}{a + b}\\):\n\n" +
    "$$(R_L) = (" + P + ")\\frac{" + fmt(b) + "}{" + fmt(a) + " + " + fmt(b) + "} = (" + P + ")\\frac{" + fmt(b) + "}{" + fmt(L) + "}$$\n\n" +
    "$$(R_L) = " + fmt(RL) + "\\ \\text{kN}$$";
  // Setup diagram (never the answer): strut fixed between walls with the load located by segments a and b.
  var d018 = (function () {
    var s = SVG_HDR + AH, y = 150, x0 = 110, x1 = 530;
    function wall(x) {
      var g = '<rect x="' + x + '" y="110" width="22" height="80" fill="#d1d5db" stroke="#1a1a1a" stroke-width="2"/>';
      for (var j = -80; j < 22; j += 10) g += '<line x1="' + (x + j) + '" y1="190" x2="' + (x + j + 80) + '" y2="110" stroke="#6b7280" stroke-width="1"/>';
      return g;
    }
    s += wall(x0 - 22) + wall(x1);
    s += '<rect x="' + x0 + '" y="' + (y - 22) + '" width="' + (x1 - x0) + '" height="44" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    var xp = x0 + (a / L) * (x1 - x0);
    s += '<line x1="' + xp.toFixed(1) + '" y1="' + (y - 76) + '" x2="' + xp.toFixed(1) + '" y2="' + (y - 26) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + (xp + 10).toFixed(1) + '" y="' + (y - 66) + '" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">P = ' + P + ' kN</text>';
    s += '<line x1="' + x0 + '" y1="236" x2="' + xp.toFixed(1) + '" y2="236" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + ((x0 + xp) / 2 - 40).toFixed(1) + '" y="258" font-family="Georgia,serif" font-size="15" fill="#b45309">a = ' + fmt(a) + ' m</text>';
    s += '<line x1="' + xp.toFixed(1) + '" y1="236" x2="' + x1 + '" y2="236" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + ((xp + x1) / 2 - 40).toFixed(1) + '" y="258" font-family="Georgia,serif" font-size="15" fill="#b45309">b = ' + fmt(b) + ' m</text>';
    s += '<text x="' + x0 + '" y="60" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">steel strut fixed between rigid walls, total length ' + fmt(L) + ' m</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d018,
    variantKey: "indet-P" + P + "-a" + pdot(a) + "-b" + pdot(b),
    question: question,
    options: [
      { label: fmt(RL) + " kN", num: RL, correct: true },
      { label: fmt(RR) + " kN", num: RR, correct: false },
      { label: fmt(tHalf) + " kN", num: tHalf, correct: false },
      { label: fmt(tFull) + " kN", num: tFull, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-019: Shear stress in circular cross-sections ---- */
reg(buildGenerator({
  baseId: "mechmat-019",
  topic: "Mechanics of Materials",
  subtopic: "Shear stress in circular cross-sections",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "For a solid circle the peak shear (at the neutral axis) is 4/3 of the average V/A — the 3/2 rectangle factor is the classic trap.",
  videoUrl: "https://www.youtube.com/watch?v=BTdGnVzuRQ0",
  videoTitle: "Fundamental Problem 7.2 Determine the shear stress if the beam is subjected to a shear force"
}, function () {
  var V = pick([15, 20, 25, 30, 40, 50]);  // kN
  var d = pick([40, 50, 60, 80, 100]);     // mm
  var A = Math.PI * d * d / 4;             // mm^2
  var avg = (V * 1000) / A;                // N/mm^2 = MPa
  var tau = r2(4 / 3 * avg);
  var tAvg = r2(avg);                      // trap: the average shear V/A
  var tRect = r2(1.5 * avg);               // trap: 3/2 factor (rectangle)
  var tHalf = r2(avg / 2);                 // trap: halved instead of 4/3
  // avg/2 < avg < 4avg/3 < 3avg/2 strictly for avg > 0.
  var question = "A solid circular steel pin in a conveyor support bracket carries a transverse shear force of " +
    V + " kN. The pin diameter is " + d + " mm. What is the maximum shear stress in the pin's cross-section?";
  var solution = "Refer to the Stresses in Beams section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\tau_{max}\\), the maximum shear stress. For a solid circular cross-section the maximum shear stress at the neutral axis is 4/3 of the average shear stress:\n\n" +
    "$$\\tau_{max} = \\frac{4}{3}\\frac{V}{A}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\tau_{max}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "V &= " + V + "\\ \\text{kN} = " + (V * 1000) + "\\ \\text{N} \\\\\n" +
    "d &= " + d + "\\ \\text{mm} \\\\\n" +
    "A &= \\frac{\\pi(" + d + ")^2}{4} = " + fmt(r1(A)) + "\\ \\text{mm}^2 \\\\\n" +
    "\\tau_{max} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\tau_{max}) = \\frac{4}{3}\\frac{" + (V * 1000) + "}{" + fmt(r1(A)) + "} = \\frac{4}{3}(" + fmt(tAvg) + ")$$\n\n" +
    "$$(\\tau_{max}) = " + fmt(tau) + "\\ \\text{N/mm}^2 = " + fmt(tau) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): circular pin cross-section with diameter and transverse shear force.
  var d019 = (function () {
    var s = SVG_HDR + AH, cx = 300, cy = 150, r = 70;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + (cx - r - 16) + '" y1="' + cy + '" x2="' + (cx + r + 16) + '" y2="' + cy + '" stroke="#6b7280" stroke-width="1.4" stroke-dasharray="6,4"/>';
    s += '<line x1="' + (cx + r + 44) + '" y1="' + (cy - 60) + '" x2="' + (cx + r + 44) + '" y2="' + (cy + 10) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx + r + 54) + '" y="' + (cy - 30) + '" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">V = ' + V + ' kN</text>';
    s += '<line x1="' + (cx - r) + '" y1="' + cy + '" x2="' + (cx + r) + '" y2="' + cy + '" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + (cx - 44) + '" y="' + (cy + r + 26) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">d = ' + d + ' mm</text>';
    s += '<text x="120" y="282" font-family="Georgia,serif" font-size="14" fill="#6b7280">solid circular pin — max shear at the neutral axis</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d019,
    variantKey: "sheartau-V" + V + "-d" + d,
    question: question,
    options: [
      { label: fmt(tau) + " MPa", num: tau, correct: true },
      { label: fmt(tAvg) + " MPa", num: tAvg, correct: false },
      { label: fmt(tRect) + " MPa", num: tRect, correct: false },
      { label: fmt(tHalf) + " MPa", num: tHalf, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-021: Column effective length ---- */
reg(buildGenerator({
  baseId: "mechmat-021",
  topic: "Mechanics of Materials",
  subtopic: "Column effective length",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Memorize the four K factors — 1.0 pinned-pinned, 2.0 fixed-free, 0.5 fixed-fixed, 0.7 fixed-pinned — and multiply by the real length.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var cond = pick([
    { desc: "pinned at both ends", K: 1.0 },
    { desc: "fixed at its base and free at its top", K: 2.0 },
    { desc: "fixed at both ends", K: 0.5 },
    { desc: "fixed at its base and pinned at its top", K: 0.7 }
  ]);
  var L = pick([2.5, 3.0, 4.0, 5.0, 6.0]);   // m
  var ans = r2(cond.K * L);
  // Traps: the effective lengths for the OTHER three end conditions.
  var traps = [1.0, 2.0, 0.5, 0.7].filter(function (k) { return k !== cond.K; })
    .map(function (k) { return r2(k * L); });
  // Setup diagram (never the answer): the column with its actual rolled end
  // conditions and length. The effective length is not given.
  var d021 = (function () {
    var AHK2 = '<defs><marker id="ahk" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1a1a1a"/></marker><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';
    var cx = 250, top = 70, bot = 280;
    var baseFixed = cond.desc.indexOf('fixed at its base') === 0;
    var topFree = cond.desc.indexOf('free at its top') >= 0;
    var topPinned = cond.desc.indexOf('pinned at its top') >= 0;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" role="img">' + AHK2;
    s += '<rect x="' + (cx - 15) + '" y="' + top + '" width="30" height="' + (bot - top) + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2.5"/>';
    if (baseFixed) {
      s += '<line x1="' + (cx - 90) + '" y1="' + bot + '" x2="' + (cx + 90) + '" y2="' + bot + '" stroke="#1a1a1a" stroke-width="2.5"/>';
      for (var i = 0; i < 5; i++) s += '<line x1="' + (cx - 80 + 36 * i) + '" y1="' + bot + '" x2="' + (cx - 92 + 36 * i) + '" y2="' + (bot + 12) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
      s += '<text x="' + (cx + 100) + '" y="' + (bot + 5) + '" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">fixed base</text>';
    } else {
      s += '<path d="M' + (cx - 18) + ',' + bot + ' L' + (cx + 18) + ',' + bot + ' L' + cx + ',' + (bot + 22) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
      s += '<line x1="' + (cx - 60) + '" y1="' + (bot + 22) + '" x2="' + (cx + 60) + '" y2="' + (bot + 22) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
      s += '<text x="' + (cx + 76) + '" y="' + (bot + 16) + '" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">pinned base</text>';
    }
    if (topFree) {
      s += '<text x="' + cx + '" y="' + (top - 16) + '" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">free top</text>';
    } else if (topPinned) {
      s += '<path d="M' + (cx - 18) + ',' + top + ' L' + (cx + 18) + ',' + top + ' L' + cx + ',' + (top - 22) + ' Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
      s += '<line x1="' + (cx - 60) + '" y1="' + (top - 22) + '" x2="' + (cx + 60) + '" y2="' + (top - 22) + '" stroke="#1a1a1a" stroke-width="2.5"/>';
      s += '<text x="' + (cx + 74) + '" y="' + (top - 14) + '" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">pinned top</text>';
    } else {
      s += '<line x1="' + (cx - 90) + '" y1="' + top + '" x2="' + (cx + 90) + '" y2="' + top + '" stroke="#1a1a1a" stroke-width="2.5"/>';
      for (var j = 0; j < 5; j++) s += '<line x1="' + (cx - 80 + 36 * j) + '" y1="' + top + '" x2="' + (cx - 92 + 36 * j) + '" y2="' + (top - 12) + '" stroke="#1a1a1a" stroke-width="1.4"/>';
      s += '<text x="' + (cx + 100) + '" y="' + (top + 5) + '" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">fixed top</text>';
    }
    s += '<line x1="' + (cx - 55) + '" y1="' + top + '" x2="' + (cx - 55) + '" y2="' + bot + '" stroke="#1a1a1a" stroke-width="1.2"/>';
    s += '<line x1="' + (cx - 55) + '" y1="' + (top + 2) + '" x2="' + (cx - 55) + '" y2="' + (top + 20) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<line x1="' + (cx - 55) + '" y1="' + (bot - 2) + '" x2="' + (cx - 55) + '" y2="' + (bot - 20) + '" stroke="#1a1a1a" stroke-width="1.6" marker-end="url(#ahk)"/>';
    s += '<text x="' + (cx - 70) + '" y="' + ((top + bot) / 2) + '" text-anchor="end" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">L = ' + fmt(L) + ' m</text>';
    s += '<text x="240" y="340" text-anchor="middle" font-family="Georgia,serif" font-size="19" font-weight="bold" fill="#1d4ed8">KL = ?</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A " + fmt(L) + " m steel column in a warehouse mezzanine is " + cond.desc +
    ". What is the effective length \\(KL\\) used in Euler's buckling formula?";
  var solution = "Refer to the Columns section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(KL\\), the effective length. Euler's buckling formula uses the effective length:\n\n" +
    "$$KL = K \\times L$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(KL\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "K &= " + fmt(cond.K) + "\\ \\text{(" + cond.desc + ")} \\\\\n" +
    "L &= " + fmt(L) + "\\ \\text{m} \\\\\n" +
    "KL &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(KL) = (" + fmt(cond.K) + ")(" + fmt(L) + "\\ \\text{m}) = " + fmt(ans) + "\\ \\text{m}$$";
  return {
    variantKey: "KL-K" + pdot(cond.K) + "-L" + pdot(L),
    question: question,
    diagram: d021,
    options: [
      { label: fmt(ans) + " m", num: ans, correct: true },
      { label: fmt(traps[0]) + " m", num: traps[0], correct: false },
      { label: fmt(traps[1]) + " m", num: traps[1], correct: false },
      { label: fmt(traps[2]) + " m", num: traps[2], correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-022: Shaft power and torsional shear stress ---- */
reg(buildGenerator({
  baseId: "mechmat-022",
  topic: "Mechanics of Materials",
  subtopic: "Shaft power and torsional shear stress",
  difficulty: "medium",
  estimatedTimeSeconds: 140,
  explanation: "Power gives torque through T = P/ω (watch the rpm-to-rad/s conversion), then the torsion formula turns torque into surface shear stress.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var PkW = pick([50, 60, 75, 90, 100, 120]); // kW
  var rpm = pick([600, 900, 1200, 1800]);
  var dmm = pick([40, 50, 60, 80]);           // mm
  var om = 2 * Math.PI * rpm / 60;            // rad/s
  var T = PkW * 1000 / om;                    // N-m
  var d = dmm / 1000;                         // m
  var tau = r2(16 * T / (Math.PI * d * d * d) / 1e6); // MPa
  var tNo2pi = r2(tau * 2 * Math.PI);  // trap: omega = rpm/60 (dropped the 2pi)
  var tDbl = r2(2 * tau);              // trap: used the diameter for rho (32T/pi d^3)
  var tHalf = r2(tau / 2);             // trap: halved again (8T/pi d^3)
  // tau/2 < tau < 2tau < 2pi*tau strictly for tau > 0.
  var question = "A solid steel line shaft in a packaging plant transmits " + PkW +
    " kW of power while rotating at " + rpm + " rpm. The shaft diameter is " + dmm +
    " mm. What is the maximum torsional shear stress in the shaft?";
  var solution = "Refer to the Torsion section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\tau_{max}\\), the maximum torsional shear stress. First convert the speed to angular velocity and get the torque from the power:\n\n" +
    "$$\\omega = \\frac{2\\pi N}{60} = \\frac{2\\pi(" + rpm + ")}{60} = " + fmt(r1(om)) + "\\ \\text{rad/s}$$\n\n" +
    "$$(T) = \\frac{P}{\\omega} = \\frac{" + (PkW * 1000) + "\\ \\text{W}}{" + fmt(r1(om)) + "\\ \\text{rad/s}} = " + fmt(r1(T)) + "\\ \\text{N}\\cdot\\text{m}$$\n\n" +
    "The handbook prints \\(\\tau = T\\rho/J\\); at the outer fiber \\(\\rho = d/2\\) with \\(J = \\pi d^4/32\\), this becomes:\n\n" +
    "$$\\tau_{max} = \\frac{16T}{\\pi d^3}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\tau_{max}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "T &= " + fmt(r1(T)) + "\\ \\text{N}\\cdot\\text{m} \\\\\n" +
    "d &= " + dmm + "\\ \\text{mm} = " + fmt(d) + "\\ \\text{m} \\\\\n" +
    "\\tau_{max} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\tau_{max}) = \\frac{16(" + fmt(r1(T)) + ")}{\\pi(" + fmt(d) + ")^3} = " + fmt(tau) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): rotating shaft with the given power, speed, and diameter.
  var d022 = (function () {
    var s = SVG_HDR + AH, y = 150;
    s += '<rect x="150" y="120" width="340" height="60" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<path d="M 200 108 Q 168 150 200 192" fill="none" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<path d="M 440 192 Q 472 150 440 108" fill="none" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="150" y="80" font-family="Georgia,serif" font-size="17" fill="#1a1a1a">P = ' + PkW + ' kW at N = ' + rpm + ' rpm</text>';
    s += '<text x="150" y="240" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">solid steel line shaft, d = ' + dmm + ' mm</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d022,
    variantKey: "shaftpow-P" + PkW + "-rpm" + rpm + "-d" + dmm,
    question: question,
    options: [
      { label: fmt(tau) + " MPa", num: tau, correct: true },
      { label: fmt(tNo2pi) + " MPa", num: tNo2pi, correct: false },
      { label: fmt(tDbl) + " MPa", num: tDbl, correct: false },
      { label: fmt(tHalf) + " MPa", num: tHalf, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-023: Combined bending and torsion (maximum shear stress) ---- */
reg(buildGenerator({
  baseId: "mechmat-023",
  topic: "Mechanics of Materials",
  subtopic: "Combined bending and torsion (maximum shear stress)",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Bending makes the normal stress, torsion makes the shear stress; combine them with the principal-stress equations before taking half the difference (Tresca).",
  videoUrl: null,
  videoTitle: null
}, function () {
  var dmm = pick([40, 50, 60]);            // mm
  var M = pick([500, 600, 800, 1000]);    // N-m
  var Tq = pick([800, 1000, 1200, 1500]); // N-m
  var d = dmm / 1000;                     // m
  var sxRaw = 32 * M / (Math.PI * d * d * d) / 1e6;   // MPa
  var txyRaw = 16 * Tq / (Math.PI * d * d * d) / 1e6; // MPa
  var tauRaw = Math.sqrt((sxRaw / 2) * (sxRaw / 2) + txyRaw * txyRaw);
  var taumax = r2(tauRaw);
  var tBend = r2(sxRaw);                                     // trap: bending stress only
  var tPrin1 = r2(sxRaw / 2 + tauRaw);                       // trap: principal stress sigma1
  var tVM = r2(Math.sqrt(sxRaw * sxRaw + 3 * txyRaw * txyRaw)); // trap: von Mises equivalent
  // Strict: taumax < tBend < tPrin1 < tVM for sx > 0, txy > 0 (verified algebraically).
  var sx = r2(sxRaw), txy = r2(txyRaw);
  var sig1 = r2(sx / 2 + tauRaw), sig2 = r2(sx / 2 - tauRaw);
  var question = "A solid circular shaft in a conveyor drive has a diameter of " + dmm +
    " mm. Belt tension subjects the shaft to a bending moment of " + M +
    " N·m while the shaft simultaneously transmits a torque of " + Tq +
    " N·m. Determine the maximum shear stress in the shaft on the Tresca (maximum-shear-stress) basis.";
  var solution = "Refer to the Stresses in Beams section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\tau_{max}\\), the maximum shear stress. Bending produces a normal stress on the outer fiber:\n\n" +
    "$$\\sigma_x = \\frac{32M}{\\pi d^3} = \\frac{32(" + M + ")}{\\pi(" + fmt(d) + ")^3} = " + fmt(sx) + "\\ \\text{MPa}$$\n\n" +
    "Refer to the Torsion section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Torsion produces a shear stress on the outer fiber:\n\n" +
    "$$\\tau_{xy} = \\frac{16T}{\\pi d^3} = \\frac{16(" + Tq + ")}{\\pi(" + fmt(d) + ")^3} = " + fmt(txy) + "\\ \\text{MPa}$$\n\n" +
    "Refer to the Principal Stresses section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "$$\\sigma_{1,2} = \\frac{\\sigma_x}{2} \\pm \\sqrt{\\left(\\frac{\\sigma_x}{2}\\right)^2 + \\tau_{xy}^2} = " + fmt(r2(sx / 2)) + " \\pm \\sqrt{(" + fmt(r2(sx / 2)) + ")^2 + (" + fmt(txy) + ")^2} = " + fmt(r2(sx / 2)) + " \\pm " + fmt(taumax) + "$$\n\n" +
    "$$(\\sigma_1) = " + fmt(sig1) + "\\ \\text{MPa}, \\quad (\\sigma_2) = " + texNum(sig2) + "\\ \\text{MPa}$$\n\n" +
    "Refer to the Mohr's Circle—Stress, 2D section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "The circle's radius is the maximum shear stress (Tresca basis):\n\n" +
    "$$\\tau_{max} = \\frac{\\sigma_1 - \\sigma_2}{2} = \\frac{" + fmt(sig1) + " - (" + texNum(sig2) + ")}{2} = " + fmt(taumax) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): shaft carrying both a bending moment and a torque.
  var d023 = (function () {
    var s = SVG_HDR + AH, y = 150;
    s += '<rect x="150" y="120" width="340" height="60" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<path d="M 130 96 Q 100 150 130 204" fill="none" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<path d="M 510 106 A 14 44 0 1 1 510 194" fill="none" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="60" y="252" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">M = ' + M + ' N·m (bending)</text>';
    s += '<text x="380" y="252" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">T = ' + Tq + ' N·m (torsion)</text>';
    s += '<text x="272" y="100" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">d = ' + dmm + ' mm</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d023,
    variantKey: "bendtor-d" + dmm + "-M" + M + "-T" + Tq,
    question: question,
    options: [
      { label: fmt(taumax) + " MPa", num: taumax, correct: true },
      { label: fmt(tBend) + " MPa", num: tBend, correct: false },
      { label: fmt(tPrin1) + " MPa", num: tPrin1, correct: false },
      { label: fmt(tVM) + " MPa", num: tVM, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-024: Cylindrical pressure vessel (axial stress) ---- */
reg(buildGenerator({
  baseId: "mechmat-024",
  topic: "Mechanics of Materials",
  subtopic: "Cylindrical pressure vessel (axial stress)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Axial stress in a cylindrical vessel is Pr/(2t) — exactly half the hoop stress, because the end-cap load spreads over twice the wall area.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var p = pick([1.0, 1.2, 1.5, 2.0]);   // MPa
  var rm = pick([0.30, 0.40, 0.50]);    // m, inner radius
  var tmm = pick([8, 10, 12, 16]);      // mm
  var rmm = rm * 1000;                  // mm (r/t >= 18, thin-wall OK)
  var siga = r2(p * rmm / (2 * tmm));              // MPa
  var tHoop = r2(p * rmm / tmm);                    // trap: hoop stress
  var tHalf = r2(p * rmm / (4 * tmm));              // trap: halved twice
  var tOut = r2(p * (rmm + tmm) / (2 * tmm));       // trap: used outer radius
  // siga/2 < siga < siga*(1+t/r) < 2*siga strictly for t > 0.
  var question = "A thin-walled cylindrical air-receiver tank in an auto repair shop has an inner radius of " +
    fmt(rm) + " m and a wall thickness of " + tmm + " mm. It holds compressed air at an internal pressure of " +
    fmt(p) + " MPa. What is the axial stress in the cylindrical wall?";
  var solution = "Refer to the Cylindrical Pressure Vessel section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\sigma_a\\), the axial stress in the wall. The handbook prints:\n\n" +
    "$$\\sigma_a = \\frac{Pr}{2t}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\sigma_a\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "P &= " + fmt(p) + "\\ \\text{MPa} \\\\\n" +
    "r &= " + fmt(rm) + "\\ \\text{m} = " + rmm + "\\ \\text{mm} \\\\\n" +
    "t &= " + tmm + "\\ \\text{mm} \\\\\n" +
    "\\sigma_a &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\sigma_a) = \\frac{(" + fmt(p) + ")(" + rmm + ")}{2(" + tmm + ")} = " + fmt(siga) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): cylindrical tank with inner radius, wall thickness, and pressure.
  var d024 = (function () {
    var s = SVG_HDR + AH, cy = 150, i, px;
    s += '<rect x="170" y="105" width="300" height="90" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<ellipse cx="170" cy="' + cy + '" rx="18" ry="45" fill="#dbeafe" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<ellipse cx="470" cy="' + cy + '" rx="18" ry="45" fill="#dbeafe" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="320" y1="' + cy + '" x2="320" y2="105" stroke="#b45309" stroke-width="1.8"/>';
    s += '<text x="330" y="132" font-family="Georgia,serif" font-size="16" fill="#b45309">r = ' + fmt(rm) + ' m</text>';
    for (i = 0; i < 4; i++) {
      px = 230 + i * 70;
      s += '<line x1="' + px + '" y1="105" x2="' + px + '" y2="72" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    }
    s += '<text x="60" y="60" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">p = ' + fmt(p) + ' MPa</text>';
    s += '<text x="392" y="240" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">t = ' + tmm + ' mm</text>';
    s += '<line x1="398" y1="232" x2="430" y2="200" stroke="#1a1a1a" stroke-width="1.2"/>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d024,
    variantKey: "pvax-p" + pdot(p) + "-r" + pdot(rm) + "-t" + tmm,
    question: question,
    options: [
      { label: fmt(siga) + " MPa", num: siga, correct: true },
      { label: fmt(tHoop) + " MPa", num: tHoop, correct: false },
      { label: fmt(tHalf) + " MPa", num: tHalf, correct: false },
      { label: fmt(tOut) + " MPa", num: tOut, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-025: Angle of twist (stepped shaft) ---- */
reg(buildGenerator({
  baseId: "mechmat-025",
  topic: "Mechanics of Materials",
  subtopic: "Angle of twist (stepped shaft)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Twist adds segment by segment — compute TL/(GJ) for each with its own diameter and sum, since J scales with d⁴ the skinny segment dominates.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var mat, d1, d2, L1, L2, TkNm, deg, phi1, phi2, phiTot, vals;
  do {
    mat = pick([{ n: "steel", G: 79 }, { n: "aluminum", G: 26 }]);
    d1 = pick([30, 40, 50, 60]);
    d2 = pick([30, 40, 50, 60]);
    L1 = pick([0.8, 1.0, 1.2, 1.5]);
    L2 = pick([0.8, 1.0, 1.2, 1.5]);
    TkNm = pick([1.0, 1.5, 2.0, 2.5]);
    deg = pick([true, false]);
    var G = mat.G * 1e9, T = TkNm * 1000;
    var J1 = Math.PI * Math.pow(d1 / 1000, 4) / 32;
    var J2 = Math.PI * Math.pow(d2 / 1000, 4) / 32;
    phi1 = T * L1 / (G * J1);
    phi2 = T * L2 / (G * J2);
    phiTot = phi1 + phi2;
    if (deg) vals = [phiTot * 180 / Math.PI, phi1 * 180 / Math.PI, phi2 * 180 / Math.PI, phiTot];
    else vals = [phiTot, phi1, phi2, Math.abs(phi1 - phi2)];
  } while (!(vals.every(function (v, i) {
    return vals.slice(i + 1).every(function (w) { return Math.abs(v - w) > 1e-6; });
  })));
  var unit = deg ? "°" : " rad";
  var unitWord = deg ? "degrees" : "radians";
  var e1 = Math.floor(Math.log10(Math.PI * Math.pow(d1 / 1000, 4) / 32));
  var m1 = (Math.PI * Math.pow(d1 / 1000, 4) / 32) / Math.pow(10, e1);
  var e2 = Math.floor(Math.log10(Math.PI * Math.pow(d2 / 1000, 4) / 32));
  var m2 = (Math.PI * Math.pow(d2 / 1000, 4) / 32) / Math.pow(10, e2);
  var article = /^[aeiou]/i.test(mat.n) ? "An" : "A";
  var question = article + " " + mat.n + " shaft in a bottling-plant conveyor is fixed at the motor coupling and " +
    "consists of two solid segments in series: segment 1 has diameter " + d1 + " mm and length " + fmt(L1) +
    " m, and segment 2 has diameter " + d2 + " mm and length " + fmt(L2) + " m. A torque of " + fmt(TkNm) +
    " kN·m is applied at the free end. The shear modulus of " + mat.n + " is " + mat.G +
    " GPa. What is the total angle of twist at the free end, in " + unitWord + "?";
  var solution = "Refer to the Torsion section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\phi\\), the total angle of twist at the free end. Each segment twists by:\n\n" +
    "$$\\phi = \\frac{TL}{GJ}$$\n\n" +
    "with the polar moment of inertia of a solid circular shaft:\n\n" +
    "$$J = \\frac{\\pi d^4}{32}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\phi\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "T &= " + fmt(TkNm) + "\\ \\text{kN-m} = " + (TkNm * 1000) + "\\ \\text{N-m} \\\\\n" +
    "G &= " + mat.G + "\\ \\text{GPa} = " + mat.G + " \\times 10^9\\ \\text{Pa} \\\\\n" +
    "\\phi &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(J_1) = \\frac{\\pi(" + fmt(d1 / 1000) + ")^4}{32} = " + m1.toFixed(2) + " \\times 10^{" + e1 + "}\\ \\text{m}^4$$\n\n" +
    "$$(J_2) = \\frac{\\pi(" + fmt(d2 / 1000) + ")^4}{32} = " + m2.toFixed(2) + " \\times 10^{" + e2 + "}\\ \\text{m}^4$$\n\n" +
    "$$(\\phi_1) = \\frac{(" + (TkNm * 1000) + ")(" + fmt(L1) + ")}{(" + mat.G + " \\times 10^9)(" + m1.toFixed(2) + " \\times 10^{" + e1 + "})} = " + fmt(phi1) + "\\ \\text{rad}$$\n\n" +
    "$$(\\phi_2) = \\frac{(" + (TkNm * 1000) + ")(" + fmt(L2) + ")}{(" + mat.G + " \\times 10^9)(" + m2.toFixed(2) + " \\times 10^{" + e2 + "})} = " + fmt(phi2) + "\\ \\text{rad}$$\n\n" +
    "$$(\\phi) = \\phi_1 + \\phi_2 = " + fmt(phi1) + " + " + fmt(phi2) + " = " + fmt(phiTot) + "\\ \\text{rad}$$" +
    (deg ? "\n\n$$(\\phi) = (" + fmt(phiTot) + ")\\frac{180^\\circ}{\\pi} = " + fmt(vals[0]) + "^\\circ$$" : "");
  // Setup diagram (never the answer): stepped shaft with each segment's diameter and length.
  var d025 = (function () {
    var s = SVG_HDR + AH, y = 150, x0 = 110, i;
    var w1 = 170, w2 = 170, h1 = 26 + d1, h2 = 26 + d2;
    s += '<rect x="88" y="80" width="22" height="140" fill="#d1d5db" stroke="#1a1a1a" stroke-width="2"/>';
    for (i = -140; i < 22; i += 12) s += '<line x1="' + (88 + i) + '" y1="220" x2="' + (88 + i + 140) + '" y2="80" stroke="#6b7280" stroke-width="1"/>';
    s += '<rect x="' + x0 + '" y="' + (y - h1 / 2) + '" width="' + w1 + '" height="' + h1 + '" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<rect x="' + (x0 + w1) + '" y="' + (y - h2 / 2) + '" width="' + w2 + '" height="' + h2 + '" fill="#fef3c7" stroke="#1a1a1a" stroke-width="2.5"/>';
    var xe = x0 + w1 + w2;
    s += '<path d="M ' + (xe + 18) + ' ' + (y - 42) + ' Q ' + (xe + 52) + ' ' + y + ' ' + (xe + 18) + ' ' + (y + 42) + '" fill="none" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (xe - 190) + '" y="264" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">T = ' + fmt(TkNm) + ' kN·m at free end</text>';
    s += '<text x="' + (x0 + 14) + '" y="' + (y - h1 / 2 - 12) + '" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">seg 1: d = ' + d1 + ' mm, L = ' + fmt(L1) + ' m</text>';
    s += '<text x="' + (x0 + w1 + 14) + '" y="' + (y - h2 / 2 - 12) + '" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">seg 2: d = ' + d2 + ' mm, L = ' + fmt(L2) + ' m</text>';
    s += '<text x="' + x0 + '" y="60" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">' + mat.n + ' stepped shaft, fixed at motor coupling, G = ' + mat.G + ' GPa</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d025,
    variantKey: "twist-" + mat.n + "-d1" + d1 + "-d2" + d2 + "-L1" + pdot(L1) + "-L2" + pdot(L2) + "-T" + pdot(TkNm) + (deg ? "-deg" : "-rad"),
    question: question,
    options: [
      { label: fmt(vals[0]) + unit, num: vals[0], correct: true },
      { label: fmt(vals[1]) + unit, num: vals[1], correct: false },
      { label: fmt(vals[2]) + unit, num: vals[2], correct: false },
      { label: fmt(vals[3]) + unit, num: vals[3], correct: false }
    ],
    solution: solution
  };
}));
/* ---- mechmat-026: elastic strain energy (axial bar) ---- */
reg(buildGenerator({
  baseId: "mechmat-026",
  topic: "Mechanics of Materials",
  subtopic: "Elastic strain energy (axial bar)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The measured stretch reveals the hidden load — back it out with P = δAE/L, then the stored energy is half of load times stretch.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var E = pick([70, 100, 200]);                    // GPa
  var A = pick([200, 250, 300, 400, 500]);         // mm^2
  var L = pick([1.0, 1.25, 1.5, 2.0, 2.5]);        // m
  var dmm = pick([0.4, 0.5, 0.6, 0.8, 1.0, 1.2]);  // mm of elongation
  var d = dmm / 1000;                              // m
  var P = d * (A * 1e-6) * (E * 1e9) / L;          // N
  var U = P * d / 2;                               // J
  var tNoHalf = 2 * U;      // trap: used Pδ instead of Pδ/2
  var tDblHalf = U / 2;     // trap: halved twice (Pδ/4)
  var tMm = 1000 * U;       // trap: left δ in mm when finding P
  var question = "A tie rod in a pedestrian footbridge is made of a metal with E = " + E +
    " GPa. The rod has a cross-sectional area of " + A + " mm² and a length of " + fmt(L) +
    " m. After the deck load is applied, surveyors measure the rod to have elongated " + fmt(dmm) +
    " mm. How much elastic strain energy is stored in the rod?";
  var solution = "Refer to the Elastic Strain Energy section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(U\\), the elastic strain energy stored in the rod. The handbook prints:\n\n" +
    "$$U = W = \\frac{P\\delta}{2}$$\n\n" +
    "The load \\(P\\) is not given, but it follows from the measured elongation via \\(\\delta = PL/(AE)\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "E &= " + E + "\\ \\text{GPa} = " + E + " \\times 10^9\\ \\text{Pa} \\\\\n" +
    "A &= " + A + "\\ \\text{mm}^2 = " + A + " \\times 10^{-6}\\ \\text{m}^2 \\\\\n" +
    "L &= " + fmt(L) + "\\ \\text{m} \\\\\n" +
    "\\delta &= " + fmt(dmm) + "\\ \\text{mm} = " + fmt(dmm) + " \\times 10^{-3}\\ \\text{m} \\\\\n" +
    "P &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(P) = \\frac{(" + fmt(dmm) + " \\times 10^{-3})(" + A + " \\times 10^{-6})(" + E + " \\times 10^9)}{" + fmt(L) + "} = " + fmt(P) + "\\ \\text{N}$$\n\n" +
    "$$(U) = \\frac{(" + fmt(P) + ")(" + fmt(dmm) + " \\times 10^{-3})}{2} = " + fmt(U) + "\\ \\text{J}$$";
  return {
    variantKey: "stren-E" + E + "-A" + A + "-L" + pdot(L) + "-d" + pdot(dmm),
    question: question,
    options: [
      { label: fmt(U) + " J", num: U, correct: true },
      { label: fmt(tNoHalf) + " J", num: tNoHalf, correct: false },
      { label: fmt(tDblHalf) + " J", num: tDblHalf, correct: false },
      { label: fmt(tMm) + " J", num: tMm, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-027: thick-walled cylinder (Lame equations) ---- */
reg(buildGenerator({
  baseId: "mechmat-027",
  topic: "Mechanics of Materials",
  subtopic: "Thick-walled cylinder (Lame equations)",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Memorize Lamé's inner-wall formula — the thin-wall shortcut always underestimates a thick vessel's peak stress.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var rin, rout, pInt, sig, tThin, tOuter, tInv;
  do {
    rin = pick([40, 50, 60, 75]);
    rout = rin + pick([30, 40, 50, 60]);
    pInt = pick([15, 20, 25, 30, 40, 50]);
    sig = pInt * (rout * rout + rin * rin) / (rout * rout - rin * rin);
    tThin = pInt * rin / (rout - rin);                                  // trap: thin-wall pr/t
    tOuter = 2 * pInt * rin * rin / (rout * rout - rin * rin);           // trap: stress at the OUTER wall
    tInv = pInt * (rout * rout - rin * rin) / (rout * rout + rin * rin); // trap: inverted the ratio
  } while (new Set([sig, tThin, tOuter, tInv]).size !== 4);
  var ri2 = rin * rin, ro2 = rout * rout;
  var question = "A hydraulic press barrel is a thick-walled cylinder with an inner radius of " + rin +
    " mm and an outer radius of " + rout + " mm. It carries an internal hydraulic pressure of " + pInt +
    " MPa; the outside is at atmospheric pressure (taken as 0 MPa gage). What is the tangential (hoop) stress at the inner wall?";
  var solution = "Refer to the Cylindrical Pressure Vessel section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\sigma_t\\) at the inner wall. The handbook prints, for internal pressure only:\n\n" +
    "$$\\sigma_t = P_i\\frac{r_o^2 + r_i^2}{r_o^2 - r_i^2}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\sigma_t\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "r_i^2 &= (" + rin + ")^2 = " + ri2 + "\\ \\text{mm}^2 \\\\\n" +
    "r_o^2 &= (" + rout + ")^2 = " + ro2 + "\\ \\text{mm}^2 \\\\\n" +
    "P_i &= " + pInt + "\\ \\text{MPa} \\\\\n" +
    "\\sigma_t &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\sigma_t) = " + pInt + "\\frac{" + ro2 + " + " + ri2 + "}{" + ro2 + " - " + ri2 + "} = " + pInt + "\\frac{" + (ro2 + ri2) + "}{" + (ro2 - ri2) + "}$$\n\n" +
    "$$(\\sigma_t) = " + fmt(sig) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): thick-walled barrel cross-section with inner/outer radii and pressure.
  var d027 = (function () {
    var s = SVG_HDR + AH, cx = 300, cy = 150, ro = 95, ri = 55, k, a2;
    var x1p, y1p, x2p, y2p;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + ro + '" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + ri + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + ri) + '" y2="' + cy + '" stroke="#b45309" stroke-width="1.8"/>';
    s += '<text x="' + (cx + 8) + '" y="' + (cy - 10) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">ri = ' + rin + ' mm</text>';
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx - ro * 0.7).toFixed(1) + '" y2="' + (cy - ro * 0.7).toFixed(1) + '" stroke="#b45309" stroke-width="1.8"/>';
    s += '<text x="' + (cx - ro - 82) + '" y="' + (cy - ro - 8) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">ro = ' + rout + ' mm</text>';
    for (k = 0; k < 6; k++) {
      a2 = k * Math.PI / 3;
      x1p = cx + (ri - 4) * Math.cos(a2); y1p = cy + (ri - 4) * Math.sin(a2);
      x2p = cx + (ri + 26) * Math.cos(a2); y2p = cy + (ri + 26) * Math.sin(a2);
      s += '<line x1="' + x1p.toFixed(1) + '" y1="' + y1p.toFixed(1) + '" x2="' + x2p.toFixed(1) + '" y2="' + y2p.toFixed(1) + '" stroke="#1d4ed8" stroke-width="2.2" marker-end="url(#ah)"/>';
    }
    s += '<text x="436" y="60" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">p = ' + pInt + ' MPa (inside)</text>';
    s += '<text x="420" y="272" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">thick-walled barrel section</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d027,
    variantKey: "lame-ri" + rin + "-ro" + rout + "-p" + pInt,
    question: question,
    options: [
      { label: fmt(sig) + " MPa", num: sig, correct: true },
      { label: fmt(tThin) + " MPa", num: tThin, correct: false },
      { label: fmt(tOuter) + " MPa", num: tOuter, correct: false },
      { label: fmt(tInv) + " MPa", num: tInv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-028: bulk (volume) modulus of elasticity ---- */
reg(buildGenerator({
  baseId: "mechmat-028",
  topic: "Mechanics of Materials",
  subtopic: "Bulk (volume) modulus of elasticity",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "K links volumetric stiffness to E and ν — check the denominator 3(1−2ν) rather than the shear-modulus lookalike 2(1+ν).",
  videoUrl: null,
  videoTitle: null
}, function () {
  var E, nu, K, tShear, tSign, tNo3;
  do {
    E = pick([70, 100, 140, 165, 200]);   // GPa
    nu = pick([0.25, 0.27, 0.30, 0.32, 0.33]);
    K = E / (3 * (1 - 2 * nu));
    tShear = E / (2 * (1 + nu));     // trap: shear modulus formula
    tSign = E / (3 * (1 + 2 * nu));  // trap: plus instead of minus
    tNo3 = E / (1 - 2 * nu);         // trap: dropped the factor of 3
  } while (new Set([K, tShear, tSign, tNo3]).size !== 4);
  var question = "A materials lab certifies a batch of structural metal with a modulus of elasticity E = " + E +
    " GPa and Poisson's ratio \\(\\nu = " + fmt(nu) + "\\). What is the bulk (volume) modulus of the metal?";
  var solution = "Refer to the Bulk (Volume) Modulus of Elasticity section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(K\\). The handbook prints:\n\n" +
    "$$K = \\frac{E}{3(1 - 2\\nu)}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(K\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "E &= " + E + "\\ \\text{GPa} \\\\\n" +
    "\\nu &= " + fmt(nu) + " \\\\\n" +
    "K &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(K) = \\frac{" + E + "}{3[1 - 2(" + fmt(nu) + ")]} = \\frac{" + E + "}{" + fmt(3 * (1 - 2 * nu)) + "}$$\n\n" +
    "$$(K) = " + fmt(K) + "\\ \\text{GPa}$$";
  return {
    variantKey: "bulk-E" + E + "-nu" + pdot(nu),
    question: question,
    options: [
      { label: fmt(K) + " GPa", num: K, correct: true },
      { label: fmt(tShear) + " GPa", num: tShear, correct: false },
      { label: fmt(tSign) + " GPa", num: tSign, correct: false },
      { label: fmt(tNo3) + " GPa", num: tNo3, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-029: composite beam (transformed section) ---- */
reg(buildGenerator({
  baseId: "mechmat-029",
  topic: "Mechanics of Materials",
  subtopic: "Composite beam (transformed section)",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Scale the stiff material's stress by the modular ratio n = E₁/E₂ — then the transformed section behaves like a homogeneous beam.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var E1, E2, M, y, IT, n, ans, tNoN, tInvN, tNSq, mat2;
  do {
    E1 = pick([200, 210]);                // GPa, steel plate
    E2 = pick([10, 12, 14, 25, 70]);      // GPa, beam material
    M = pick([6, 8, 10, 12, 15, 20]);     // kN-m
    y = pick([60, 80, 100, 120, 150]);    // mm
    IT = pick([30, 40, 60, 80, 100]) * 1e6; // mm^4
    n = E1 / E2;
    ans = n * (M * 1e6) * y / IT;         // MPa (N-mm / mm^4 = N/mm^2)
    tNoN = (M * 1e6) * y / IT;            // trap: skipped the modular ratio
    tInvN = (M * 1e6) * y / (n * IT);     // trap: used E2/E1 instead of E1/E2
    tNSq = n * n * (M * 1e6) * y / IT;    // trap: applied n twice
  } while (ans < 40 || ans > 600 || new Set([ans, tNoN, tInvN, tNSq]).size !== 4);
  mat2 = E2 <= 25 ? "glulam timber" : "aluminum";
  // Setup diagram (never the answer): the two-material section with constants
  // and the fiber distance from the NA. The stress is not given.
  var d029 = (function () {
    var x0 = 150, y0 = 90, w2 = 190, h1 = 62, h2 = 92;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="340" viewBox="0 0 480 340" role="img">';
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w2 + '" height="' + h1 + '" fill="#eef2f7" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<rect x="' + x0 + '" y="' + (y0 + h1) + '" width="' + w2 + '" height="' + h2 + '" fill="#f5f5f5" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<text x="' + (x0 + w2 / 2) + '" y="' + (y0 + h1 / 2 + 6) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">steel plate</text>';
    s += '<text x="' + (x0 + w2 / 2) + '" y="' + (y0 + h1 + h2 / 2 + 6) + '" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">' + mat2 + ' beam</text>';
    s += '<line x1="' + (x0 + w2 + 14) + '" y1="' + (y0 + h1 + h2 * 0.45) + '" x2="' + (x0 + w2 + 60) + '" y2="' + (y0 + h1 + h2 * 0.45) + '" stroke="#1a1a1a" stroke-width="1.6" stroke-dasharray="7,5"/>';
    s += '<text x="' + (x0 + w2 + 66) + '" y="' + (y0 + h1 + h2 * 0.45 + 5) + '" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">NA</text>';
    s += '<text x="' + (x0 - 12) + '" y="' + (y0 - 14) + '" text-anchor="start" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">E1 = ' + E1 + ' GPa (steel)</text>';
    s += '<text x="' + (x0 - 12) + '" y="' + (y0 + h1 + h2 + 24) + '" text-anchor="start" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">E2 = ' + E2 + ' GPa (' + mat2 + ')</text>';
    s += '<text x="240" y="300" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">I_T = ' + (IT / 1e6) + '\u00d710\u2076 mm\u2074,  M = ' + M + ' kN\u00b7m,  fiber ' + y + ' mm from NA</text>';
    s += '<text x="240" y="328" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#1a1a1a">\u03c3 (steel, at that fiber) = ?</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A steel cover plate (\\(E_1 = " + E1 + "\\ \\text{GPa}\\)) is bonded to the top of a " + mat2 +
    " beam (\\(E_2 = " + E2 + "\\ \\text{GPa}\\)). The transformed section (all " + mat2 + ") has " +
    "\\(I_T = " + (IT / 1e6) + " \\times 10^6\\ \\text{mm}^4\\). Under a service bending moment of " + M +
    " kN·m, what is the magnitude of the bending stress in the steel plate at a fiber " + y + " mm from the neutral axis?";
  var solution = "Refer to the Composite Sections section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\sigma_1\\), the bending stress in the steel plate. The handbook prints:\n\n" +
    "$$\\sigma_1 = -\\frac{nMy}{I_T}, \\quad n = \\frac{E_1}{E_2}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\sigma_1\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "E_1 &= " + E1 + "\\ \\text{GPa} \\\\\n" +
    "E_2 &= " + E2 + "\\ \\text{GPa} \\\\\n" +
    "M &= " + M + "\\ \\text{kN-m} = " + M + " \\times 10^6\\ \\text{N-mm} \\\\\n" +
    "y &= " + y + "\\ \\text{mm} \\\\\n" +
    "I_T &= " + (IT / 1e6) + " \\times 10^6\\ \\text{mm}^4 \\\\\n" +
    "n &= ? \\\\\n" +
    "\\sigma_1 &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(n) = \\frac{" + E1 + "}{" + E2 + "} = " + fmt(n) + "$$\n\n" +
    "$$(\\sigma_1) = \\frac{(" + fmt(n) + ")(" + M + " \\times 10^6)(" + y + ")}{(" + (IT / 1e6) + " \\times 10^6)} = " + fmt(ans) + "\\ \\text{N/mm}^2 = " + fmt(ans) + "\\ \\text{MPa}$$\n\n" +
    "The negative sign in the handbook formula marks the compression side; the question asks for the magnitude.";
  return {
    variantKey: "compbm-E1" + E1 + "-E2" + E2 + "-M" + M + "-y" + y + "-IT" + pdot(IT / 1e6),
    question: question,
    diagram: d029,
    options: [
      { label: fmt(ans) + " MPa", num: ans, correct: true },
      { label: fmt(tNoN) + " MPa", num: tNoN, correct: false },
      { label: fmt(tInvN) + " MPa", num: tInvN, correct: false },
      { label: fmt(tNSq) + " MPa", num: tNSq, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-030: statically indeterminate torsion ---- */
reg(buildGenerator({
  baseId: "mechmat-030",
  topic: "Mechanics of Materials",
  subtopic: "Statically indeterminate torsion",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "The fixed ends must twist by the same angle at the load point, so the reactions split in inverse proportion to their segment lengths.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var L, a, T, b, TL, TR, askLeft, ans, tOther, tHalf, tFull;
  do {
    L = pick([1.5, 2.0, 2.5, 3.0]);           // m, total length
    a = pick([0.4, 0.5, 0.6, 0.8, 1.0, 1.2]); // m from the left chuck
    T = pick([2.0, 2.5, 3.0, 4.0, 5.0]);      // kN-m
    b = r2(L - a);                             // m, right segment
    TL = T * b / L;
    TR = T * a / L;
    askLeft = pick([true, false]);
    ans = askLeft ? TL : TR;
    tOther = askLeft ? TR : TL;   // trap: reported the OTHER reaction
    tHalf = T / 2;                // trap: split the torque evenly
    tFull = T;                    // trap: assigned the full torque to the asked end
  } while (b <= 0.1 || Math.abs(a - L / 2) < 1e-9 || new Set([ans, tOther, tHalf, tFull]).size !== 4);
  var side = askLeft ? "left" : "right";
  var sub = askLeft ? "L" : "R";
  var question = "A torsion test specimen is gripped in fixed chucks at both ends (total length " + fmt(L) +
    " m). A technician applies a calibrating torque of " + fmt(T) + " kN·m at a collar located " + fmt(a) +
    " m from the left chuck. What is the reactive torque at the " + side + " chuck?";
  var solution = "Refer to the Torsion section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(T_" + sub + "\\), the reactive torque at the " + side + " chuck. The handbook prints the angle of twist of a shaft segment:\n\n" +
    "$$\\phi = \\frac{TL}{GJ}$$\n\n" +
    "Compatibility: the collar twists by the same angle whether measured from the left chuck or the right chuck:\n\n" +
    "$$\\frac{(T_L)(" + fmt(a) + ")}{GJ} = \\frac{(T_R)(" + fmt(b) + ")}{GJ} \\;\\rightarrow\\; (T_L)(" + fmt(a) + ") = (T_R)(" + fmt(b) + ")$$\n\n" +
    "Equilibrium of the whole specimen:\n\n" +
    "$$(T_L) + (T_R) = " + fmt(T) + "$$\n\n" +
    (askLeft
      ? "Eliminating \\(T_R\\) gives \\(T_L = T\\,b/L\\):\n\n" +
        "$$(T_L) = (" + fmt(T) + ")\\frac{" + fmt(b) + "}{" + fmt(L) + "} = " + fmt(TL) + "\\ \\text{kN-m}$$"
      : "Eliminating \\(T_L\\) gives \\(T_R = T\\,a/L\\):\n\n" +
        "$$(T_R) = (" + fmt(T) + ")\\frac{" + fmt(a) + "}{" + fmt(L) + "} = " + fmt(TR) + "\\ \\text{kN-m}$$");
  // Setup diagram (never the answer): specimen fixed at both chucks with the torque collar located by a and b.
  var d030 = (function () {
    var s = SVG_HDR + AH, y = 150, x0 = 120, x1 = 520;
    function wall(x) {
      var g = '<rect x="' + x + '" y="100" width="22" height="100" fill="#d1d5db" stroke="#1a1a1a" stroke-width="2"/>';
      for (var j = -100; j < 22; j += 12) g += '<line x1="' + (x + j) + '" y1="200" x2="' + (x + j + 100) + '" y2="100" stroke="#6b7280" stroke-width="1"/>';
      return g;
    }
    s += wall(x0 - 22) + wall(x1);
    s += '<rect x="' + x0 + '" y="' + (y - 28) + '" width="' + (x1 - x0) + '" height="56" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    var xp = x0 + (a / L) * (x1 - x0);
    s += '<rect x="' + (xp - 12).toFixed(1) + '" y="' + (y - 44) + '" width="24" height="88" fill="#dbeafe" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<path d="M ' + (xp + 30).toFixed(1) + ' ' + (y - 52) + ' Q ' + (xp + 62).toFixed(1) + ' ' + y + ' ' + (xp + 30).toFixed(1) + ' ' + (y + 52) + '" fill="none" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (xp - 70).toFixed(1) + '" y="60" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">T = ' + fmt(T) + ' kN·m at collar</text>';
    s += '<line x1="' + x0 + '" y1="240" x2="' + xp.toFixed(1) + '" y2="240" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + ((x0 + xp) / 2 - 40).toFixed(1) + '" y="262" font-family="Georgia,serif" font-size="15" fill="#b45309">a = ' + fmt(a) + ' m</text>';
    s += '<line x1="' + xp.toFixed(1) + '" y1="240" x2="' + x1 + '" y2="240" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + ((xp + x1) / 2 - 44).toFixed(1) + '" y="262" font-family="Georgia,serif" font-size="15" fill="#b45309">L − a</text>';
    s += '<text x="' + x0 + '" y="288" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">fixed chucks both ends, total length L = ' + fmt(L) + ' m</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d030,
    variantKey: "indtor-L" + pdot(L) + "-a" + pdot(a) + "-T" + pdot(T) + "-" + sub,
    question: question,
    options: [
      { label: fmt(ans) + " kN·m", num: ans, correct: true },
      { label: fmt(tOther) + " kN·m", num: tOther, correct: false },
      { label: fmt(tHalf) + " kN·m", num: tHalf, correct: false },
      { label: fmt(tFull) + " kN·m", num: tFull, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-031: modified Goodman fatigue criterion ---- */
reg(buildGenerator({
  baseId: "mechmat-031",
  topic: "Mechanics of Materials",
  subtopic: "Modified Goodman fatigue criterion",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Goodman adds the alternating-stress ratio and the mean-stress ratio, then inverts — dropping either term inflates the safety factor.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var sa, sm, Se, Sut, n, tNoMean, tNoAlt, tNoInv;
  do {
    sa = pick([60, 80, 100, 120, 150]);     // MPa, alternating stress
    sm = pick([30, 40, 60, 80, 100, 120]);  // MPa, mean stress
    Se = pick([220, 250, 280, 300, 350]);   // MPa, endurance limit
    Sut = pick([450, 500, 550, 600, 700]);  // MPa, ultimate strength
    n = 1 / (sa / Se + sm / Sut);
    tNoMean = Se / sa;            // trap: dropped the mean-stress term
    tNoAlt = Sut / sm;            // trap: dropped the alternating-stress term
    tNoInv = sa / Se + sm / Sut;  // trap: forgot to invert (this is 1/n)
  } while (n < 1.05 || n > 3 || new Set([n, tNoMean, tNoAlt, tNoInv]).size !== 4);
  var sum = sa / Se + sm / Sut;
  var question = "A steering tie-rod in a delivery van carries a fluctuating axial stress with a stress amplitude of " + sa +
    " MPa about a mean stress of " + sm + " MPa. The rod steel has an endurance limit \\(S_e = " + Se +
    "\\) MPa and an ultimate tensile strength \\(S_{ut} = " + Sut + "\\) MPa. Using the Modified Goodman criterion, what is the factor of safety \\(n\\) against fatigue failure?";
  var solution = "Refer to the Variable Loading Failure Theories section in the Mechanical Engineering chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(n\\). The handbook prints the Modified Goodman criterion with a factor of safety:\n\n" +
    "$$\\frac{\\sigma_a}{S_e} + \\frac{\\sigma_m}{S_{ut}} = \\frac{1}{n}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(n\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "\\sigma_a &= " + sa + "\\ \\text{MPa} \\\\\n" +
    "\\sigma_m &= " + sm + "\\ \\text{MPa} \\\\\n" +
    "S_e &= " + Se + "\\ \\text{MPa} \\\\\n" +
    "S_{ut} &= " + Sut + "\\ \\text{MPa} \\\\\n" +
    "n &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$\\frac{1}{n} = \\frac{" + sa + "}{" + Se + "} + \\frac{" + sm + "}{" + Sut + "} = " + fmt(sa / Se) + " + " + fmt(sm / Sut) + " = " + fmt(sum) + "$$\n\n" +
    "$$(n) = \\frac{1}{" + fmt(sum) + "} = " + fmt(n) + "$$";
  return {
    variantKey: "goodman-sa" + sa + "-sm" + sm + "-Se" + Se + "-Sut" + Sut,
    question: question,
    options: [
      { label: fmt(n), num: n, correct: true },
      { label: fmt(tNoMean), num: tNoMean, correct: false },
      { label: fmt(tNoAlt), num: tNoAlt, correct: false },
      { label: fmt(tNoInv), num: tNoInv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-032: torsional shear strain ---- */
reg(buildGenerator({
  baseId: "mechmat-032",
  topic: "Mechanics of Materials",
  subtopic: "Torsional shear strain",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Torsional shear strain is just radius times twist rate, largest at the outer fiber — and diameter-for-radius doubles the answer.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var rate = pick([0.008, 0.010, 0.012, 0.015, 0.020]); // rad/m
  var rmm = pick([25, 30, 40, 50, 60]);                 // mm
  var g = (rmm / 1000) * rate;                          // rad
  var X = g * 1e6;
  var tDiam = 2 * g;   // trap: used the diameter instead of the radius
  var tHalf = g / 2;   // trap: halved the radius
  var tDec = g / 10;   // trap: slipped a decimal converting mm to m
  // Setup diagram (never the answer): the shaft cross-section with its radius
  // and the measured twist rate. The strain is not given.
  var d032 = (function () {
    var cx = 240, cy = 150, R = 95;
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300" role="img">' + AH;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="#f5f5f5" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#1a1a1a"/>';
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + R) + '" y2="' + cy + '" stroke="#1a1a1a" stroke-width="1.6"/>';
    s += '<text x="' + (cx + R / 2) + '" y="' + (cy - 10) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">r = ' + rmm + ' mm</text>';
    s += '<path d="M' + (cx - 66) + ',' + (cy - 66) + ' A 93,93 0 0,1 ' + (cx + 66) + ',' + (cy - 66) + '" fill="none" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + cx + '" y="' + (cy - 106) + '" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">twist rate ' + fmt(rate) + ' rad/m</text>';
    s += '<text x="240" y="284" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">solid circular shaft;  \u03b3max = ?</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "During a maintenance inspection, engineers measure the twist rate along a wind-turbine main shaft as " + fmt(rate) +
    " rad/m. The solid shaft has a radius of " + rmm + " mm. What is the maximum shear strain in the shaft?";
  var solution = "Refer to the Torsional Strain section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\gamma_{max}\\). The handbook prints:\n\n" +
    "$$\\tau_{rz} = G\\gamma_{rz} = Gr\\frac{d\\phi}{dz}$$\n\n" +
    "so the shear strain at radius \\(r\\) is \\(\\gamma = r\\,d\\phi/dz\\), largest at the outer fiber:\n\n" +
    "$$\\begin{aligned}\n" +
    "\\frac{d\\phi}{dz} &= " + fmt(rate) + "\\ \\text{rad/m} \\\\\n" +
    "r &= " + rmm + "\\ \\text{mm} = " + fmt(rmm / 1000) + "\\ \\text{m} \\\\\n" +
    "\\gamma_{max} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\gamma_{max}) = (" + fmt(rmm / 1000) + ")(" + fmt(rate) + ")\\ \\text{rad} = " + fmt(X) + " \\times 10^{-6}\\ \\text{rad}$$";
  return {
    variantKey: "torsstr-rate" + pdot(rate) + "-r" + rmm,
    question: question,
    diagram: d032,
    options: [
      { label: fmt(X) + " × 10⁻⁶ rad", num: g, correct: true },
      { label: fmt(2 * X) + " × 10⁻⁶ rad", num: tDiam, correct: false },
      { label: fmt(X / 2) + " × 10⁻⁶ rad", num: tHalf, correct: false },
      { label: fmt(X / 10) + " × 10⁻⁶ rad", num: tDec, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-033: von Mises effective stress ---- */
reg(buildGenerator({
  baseId: "mechmat-033",
  topic: "Mechanics of Materials",
  subtopic: "Von Mises effective stress",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Convert the stress state to principal stresses first — plugging σx and σy straight into the von Mises formula skips that step and misses.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var sx, sy, txy, avg, R, sA, sB, vm, tDirect, tTresca, tPrinc;
  do {
    sx = pick([40, 50, 60, 80, 100]);
    sy = pick([-60, -50, -40, -30, -20, -10]);
    txy = pick([-40, -30, -20, 20, 30, 40]);
    avg = (sx + sy) / 2;
    R = Math.sqrt(Math.pow((sx - sy) / 2, 2) + txy * txy);
    sA = avg + R;
    sB = avg - R;
    vm = Math.sqrt(((sA - sB) * (sA - sB) + sB * sB + sA * sA) / 2); // out-of-plane principal is 0
    tDirect = Math.sqrt(sx * sx - sx * sy + sy * sy); // trap: skipped the principal-stress step
    tTresca = (sA - Math.min(sA, sB, 0)) / 2;          // trap: used Tresca (max shear) instead
    tPrinc = sA;                                      // trap: reported the largest principal stress
  } while (new Set([vm, tDirect, tTresca, tPrinc]).size !== 4);
  var question = "A gusset plate at a truss joint is in plane stress with \\(\\sigma_x = " + sx + "\\) MPa (tensile), " +
    "\\(\\sigma_y = " + texNum(sy) + "\\) MPa (" + fmt(-sy) + " MPa compressive), and \\(\\tau_{xy} = " + texNum(txy) +
    "\\) MPa. What is the von Mises effective stress at the point?";
  var solution = "Refer to the Distortion-Energy Theory section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\sigma'\\), the von Mises effective stress. The handbook prints, for a biaxial stress state:\n\n" +
    "$$\\sigma' = \\sqrt{\\sigma_A^2 - \\sigma_A\\sigma_B + \\sigma_B^2}$$\n\n" +
    "where \\(\\sigma_A\\) and \\(\\sigma_B\\) are the nonzero in-plane principal stresses. Find them first:\n\n" +
    "$$\\sigma_{A,B} = \\frac{\\sigma_x + \\sigma_y}{2} \\pm \\sqrt{\\left(\\frac{\\sigma_x - \\sigma_y}{2}\\right)^2 + \\tau_{xy}^2}$$\n\n" +
    "$$\\sigma_{A,B} = \\frac{" + sx + " + (" + texNum(sy) + ")}{2} \\pm \\sqrt{\\left(\\frac{" + sx + " - (" + texNum(sy) + ")}{2}\\right)^2 + (" + texNum(txy) + ")^2}$$\n\n" +
    "$$\\sigma_{A,B} = " + fmt(avg) + " \\pm " + fmt(R) + " \\;\\rightarrow\\; \\sigma_A = " + fmt(sA) + "\\ \\text{MPa},\\ \\sigma_B = " + fmt(sB) + "\\ \\text{MPa}$$\n\n" +
    "In plane stress the third principal stress is \\(\\sigma_C = 0\\). The general three-dimensional form of the distortion-energy criterion is:\n\n" +
    "$$\\sigma' = \\sqrt{\\frac{(\\sigma_A - \\sigma_B)^2 + (\\sigma_B - \\sigma_C)^2 + (\\sigma_C - \\sigma_A)^2}{2}}$$\n\n" +
    "$$(\\sigma') = \\sqrt{\\frac{(" + fmt(sA) + " - " + fmt(sB) + ")^2 + (" + fmt(sB) + " - 0)^2 + (0 - " + fmt(sA) + ")^2}{2}}$$\n\n" +
    "$$(\\sigma') = " + fmt(vm) + "\\ \\text{MPa}$$";
  // Setup diagram (never the answer): stress element showing the given biaxial stress state.
  var d033 = (function () {
    var s = SVG_HDR + AH, cx = 320, cy = 150, h = 120, hh = h / 2;
    var dir = txy >= 0 ? 1 : -1;
    s += '<rect x="' + (cx - hh) + '" y="' + (cy - hh) + '" width="' + h + '" height="' + h + '" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + (cx - hh) + '" y1="' + cy + '" x2="' + (cx - hh - 44) + '" y2="' + cy + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + (cx + hh) + '" y1="' + cy + '" x2="' + (cx + hh + 44) + '" y2="' + cy + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx + hh + 50) + '" y="' + (cy + 6) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">σx = ' + sx + ' MPa</text>';
    s += '<line x1="' + cx + '" y1="' + (cy - hh - 44) + '" x2="' + cx + '" y2="' + (cy - hh) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + cx + '" y1="' + (cy + hh + 44) + '" x2="' + cx + '" y2="' + (cy + hh) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx - 128) + '" y="' + (cy - hh - 52) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">σy = ' + (-sy) + ' MPa (C)</text>';
    s += '<line x1="' + (cx + hh + 26) + '" y1="' + (cy + dir * 34) + '" x2="' + (cx + hh + 26) + '" y2="' + (cy - dir * 34) + '" stroke="#b45309" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + (cx - dir * 34) + '" y1="' + (cy - hh - 26) + '" x2="' + (cx + dir * 34) + '" y2="' + (cy - hh - 26) + '" stroke="#b45309" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="' + (cx - hh - 116) + '" y="' + (cy + hh + 62) + '" font-family="Georgia,serif" font-size="16" fill="#b45309">τxy = ' + sgn(txy) + ' MPa</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d033,
    variantKey: "vonmises-sx" + sx + "-sy" + pdot(sy) + "-txy" + pdot(txy),
    question: question,
    options: [
      { label: fmt(vm) + " MPa", num: vm, correct: true },
      { label: fmt(tDirect) + " MPa", num: tDirect, correct: false },
      { label: fmt(tTresca) + " MPa", num: tTresca, correct: false },
      { label: fmt(tPrinc) + " MPa", num: tPrinc, correct: false }
    ],
    solution: solution
  };
}));

/* ---- registry export ---- */

/* ---- mechmat-034: max bending moment, uniform + point load ---- */
reg(buildGenerator({
  baseId: "mechmat-034",
  topic: "Mechanics of Materials",
  subtopic: "Maximum bending moment, combined loading",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "By symmetry the peak is at midspan: add the uniform-load term wL²/8 and the point-load term PL/4. The traps: dropping the point load, wL²/4, PL/2.",
  tiTip: "No — set up wL²/8 + PL/4 by hand; the calculator only crunches the arithmetic.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var L = pick([6, 8, 10]);
  var w = pick([4, 5, 6, 8]);
  var P = pick([10, 15, 20, 25]);
  var M = w * L * L / 8 + P * L / 4;
  var tDrop = w * L * L / 8;          // trap: forgot the point load
  var tW4 = w * L * L / 4 + P * L / 4; // trap: wL²/4 for the uniform part
  var tP2 = w * L * L / 8 + P * L / 2;  // trap: PL/2 for the point load
  var R = w * L / 2 + P / 2;
  var question = "A simply supported floor beam spans \\(" + L + "\\text{ m}\\). It carries a uniformly distributed load of \\(" + w + "\\text{ kN/m}\\) over its full length, plus a concentrated load of \\(" + P + "\\text{ kN}\\) at midspan from a partition wall. What is the maximum bending moment in the beam?";
  var solution = "Refer to the Simply Supported Beam tables in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "By symmetry each reaction is \\(R = wL/2 + P/2 = " + fmt(w * L / 2) + " + " + fmt(P / 2) + " = " + fmt(R) + "\\text{ kN}\\). The moment peaks at midspan:\n\n" +
    "$$M_{max} = R\\left(\\frac{L}{2}\\right) - w\\frac{(L/2)^2}{2} = (" + fmt(R) + ")(" + fmt(L / 2) + ") - \\frac{(" + w + ")(" + fmt(L / 2) + ")^2}{2} = " + fmt(M) + "\\text{ kN}\\cdot\\text{m}$$\n\n" +
    "Equivalently \\(M_{max} = wL^2/8 + PL/4 = " + fmt(w * L * L / 8) + " + " + fmt(P * L / 4) + " = " + fmt(M) + "\\text{ kN}\\cdot\\text{m}\\).";
  // Setup diagram (never the answer): simply supported beam with uniform load plus the midspan point load.
  var d034 = (function () {
    var s = SVG_HDR + AH, y = 150, x0 = 140, x1 = 500, i, ax;
    var xm = (x0 + x1) / 2;
    s += '<rect x="' + (x0 - 20) + '" y="' + y + '" width="' + (x1 - x0 + 40) + '" height="12" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<polygon points="' + (x0 - 16) + ',' + (y + 12) + ' ' + (x0 + 16) + ',' + (y + 12) + ' ' + x0 + ',' + (y + 36) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + (x0 - 24) + '" y1="' + (y + 36) + '" x2="' + (x0 + 24) + '" y2="' + (y + 36) + '" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<polygon points="' + (x1 - 16) + ',' + (y + 12) + ' ' + (x1 + 16) + ',' + (y + 12) + ' ' + x1 + ',' + (y + 30) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<circle cx="' + (x1 - 8) + '" cy="' + (y + 36) + '" r="5" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.6"/>';
    s += '<circle cx="' + (x1 + 8) + '" cy="' + (y + 36) + '" r="5" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.6"/>';
    s += '<line x1="' + (x1 - 24) + '" y1="' + (y + 42) + '" x2="' + (x1 + 24) + '" y2="' + (y + 42) + '" stroke="#1a1a1a" stroke-width="2"/>';
    for (i = 0; i < 6; i++) {
      ax = x0 + 18 + i * 62;
      if (Math.abs(ax - xm) < 40) continue; // keep the midspan point load clear
      s += '<line x1="' + ax + '" y1="' + (y - 44) + '" x2="' + ax + '" y2="' + (y - 6) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    }
    s += '<line x1="' + xm + '" y1="' + (y - 108) + '" x2="' + xm + '" y2="' + (y - 52) + '" stroke="#b45309" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + (xm + 10) + '" y="' + (y - 96) + '" font-family="Georgia,serif" font-size="17" fill="#b45309">P = ' + P + ' kN</text>';
    s += '<text x="' + x0 + '" y="' + (y - 58) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">w = ' + w + ' kN/m</text>';
    s += '<line x1="' + x0 + '" y1="240" x2="' + x1 + '" y2="240" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + ((x0 + x1) / 2 - 30) + '" y="262" font-family="Georgia,serif" font-size="16" fill="#b45309">L = ' + L + ' m</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d034,
    variantKey: "mmax-w" + w + "-L" + L + "-P" + P,
    question: question,
    options: [
      { label: fmt(M) + " kN·m", num: M, correct: true },
      { label: fmt(tDrop) + " kN·m", num: tDrop, correct: false },
      { label: fmt(tW4) + " kN·m", num: tW4, correct: false },
      { label: fmt(tP2) + " kN·m", num: tP2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-035: cantilever maximum shear ---- */
reg(buildGenerator({
  baseId: "mechmat-035",
  topic: "Mechanics of Materials",
  subtopic: "Cantilever maximum shear",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Shear is constant at P along the whole cantilever. The PL trap is the maximum moment, not shear — watch the units.",
  tiTip: "No — the shear is just P here; use the calculator only to double-check PL for the moment.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var L = pick([2.5, 3, 3.5, 4]);
  var P = pick([8, 10, 12, 15, 20]);
  var question = "A cantilever balcony beam extends \\(" + fmt(L) + "\\text{ m}\\) from its fixed support and carries a \\(" + P + "\\text{ kN}\\) planter load at its free tip. What is the maximum shear force in the beam?";
  var solution = "Refer to the Cantilever Beam tables in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "With only a tip load \\(P\\), the shear is constant along the entire cantilever:\n\n" +
    "$$V(x) = P = " + P + "\\text{ kN} \\quad \\text{everywhere}$$\n\n" +
    "so \\(V_{max} = " + P + "\\text{ kN}\\). (The maximum bending moment is \\(PL = (" + P + ")(" + fmt(L) + ") = " + fmt(P * L) + "\\text{ kN}\\cdot\\text{m}\\) at the fixed support — that is the " + fmt(P * L) + " kN trap.)";
  // Setup diagram (never the answer): cantilever with fixed support and the tip load.
  // The load is labeled symbolically only: its numeric value IS the answer.
  var d035 = (function () {
    var s = SVG_HDR + AH, y = 150, x0 = 120, x1 = 500, i;
    s += '<rect x="' + (x0 - 22) + '" y="100" width="22" height="100" fill="#d1d5db" stroke="#1a1a1a" stroke-width="2"/>';
    for (i = -100; i < 22; i += 12) s += '<line x1="' + (x0 - 22 + i) + '" y1="200" x2="' + (x0 - 22 + i + 100) + '" y2="100" stroke="#6b7280" stroke-width="1"/>';
    s += '<rect x="' + x0 + '" y="' + (y - 8) + '" width="' + (x1 - x0) + '" height="16" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<line x1="' + x1 + '" y1="' + (y - 70) + '" x2="' + x1 + '" y2="' + (y - 12) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    s += '<text x="' + (x1 + 12) + '" y="' + (y - 40) + '" font-family="Georgia,serif" font-size="20" fill="#1d4ed8">P</text>';
    s += '<line x1="' + x0 + '" y1="230" x2="' + x1 + '" y2="230" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + ((x0 + x1) / 2 - 36) + '" y="252" font-family="Georgia,serif" font-size="16" fill="#b45309">L = ' + fmt(L) + ' m</text>';
    s += '<text x="' + x0 + '" y="90" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">cantilever — fixed at left, free at right</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d035,
    variantKey: "cantshear-P" + P + "-L" + pdot(L),
    question: question,
    options: [
      { label: fmt(P) + " kN", num: P, correct: true },
      { label: fmt(P * L) + " kN", num: P * L, correct: false },
      { label: fmt(P / 2) + " kN", num: P / 2, correct: false },
      { label: fmt(2 * P) + " kN", num: 2 * P, correct: false }
    ],
    solution: solution
  };
}));

/* ---- mechmat-036: uniform load max moment and location ---- */
reg(buildGenerator({
  baseId: "mechmat-036",
  topic: "Mechanics of Materials",
  subtopic: "Uniform load maximum moment and location",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "For uniform load the moment diagram is a parabola peaking at midspan: wL²/8. Supports carry maximum shear but zero moment.",
  tiTip: "No — memorize wL²/8 at midspan; the calculator only does the arithmetic.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var L = pick([6, 8, 10, 12]);
  var w = pick([3, 4, 5, 6]);
  var M = w * L * L / 8;
  var question = "A simply supported warehouse beam spans \\(" + L + "\\text{ m}\\) and carries a uniformly distributed storage load of \\(" + w + "\\text{ kN/m}\\) over its full length. What is the maximum bending moment, and where does it occur?";
  var solution = "Refer to the Simply Supported Beam tables in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "For a uniform load the shear diagram is linear, crossing zero at midspan — that is where the parabolic moment diagram peaks:\n\n" +
    "$$M_{max} = \\frac{wL^2}{8} = \\frac{(" + w + ")(" + L + ")^2}{8} = " + fmt(M) + "\\text{ kN}\\cdot\\text{m}$$\n\n" +
    "at \\(x = L/2 = " + fmt(L / 2) + "\\text{ m}\\), i.e., at midspan. (At the simple supports the moment is zero and the shear is maximum.)";
  // Setup diagram (never the answer): simply supported beam with the uniform storage load and span.
  var d036 = (function () {
    var s = SVG_HDR + AH, y = 150, x0 = 140, x1 = 500, i, ax;
    s += '<rect x="' + (x0 - 20) + '" y="' + y + '" width="' + (x1 - x0 + 40) + '" height="12" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>';
    s += '<polygon points="' + (x0 - 16) + ',' + (y + 12) + ' ' + (x0 + 16) + ',' + (y + 12) + ' ' + x0 + ',' + (y + 36) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<line x1="' + (x0 - 24) + '" y1="' + (y + 36) + '" x2="' + (x0 + 24) + '" y2="' + (y + 36) + '" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<polygon points="' + (x1 - 16) + ',' + (y + 12) + ' ' + (x1 + 16) + ',' + (y + 12) + ' ' + x1 + ',' + (y + 30) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<circle cx="' + (x1 - 8) + '" cy="' + (y + 36) + '" r="5" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.6"/>';
    s += '<circle cx="' + (x1 + 8) + '" cy="' + (y + 36) + '" r="5" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.6"/>';
    s += '<line x1="' + (x1 - 24) + '" y1="' + (y + 42) + '" x2="' + (x1 + 24) + '" y2="' + (y + 42) + '" stroke="#1a1a1a" stroke-width="2"/>';
    for (i = 0; i < 7; i++) {
      ax = x0 + 20 + i * 55;
      s += '<line x1="' + ax + '" y1="' + (y - 52) + '" x2="' + ax + '" y2="' + (y - 6) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    }
    s += '<line x1="' + x0 + '" y1="' + (y - 58) + '" x2="' + x1 + '" y2="' + (y - 58) + '" stroke="#1d4ed8" stroke-width="1.4"/>';
    s += '<text x="' + ((x0 + x1) / 2 - 52) + '" y="' + (y - 66) + '" font-family="Georgia,serif" font-size="17" fill="#1d4ed8">w = ' + w + ' kN/m</text>';
    s += '<line x1="' + x0 + '" y1="240" x2="' + x1 + '" y2="240" stroke="#b45309" stroke-width="1.6"/>';
    s += '<text x="' + ((x0 + x1) / 2 - 34) + '" y="262" font-family="Georgia,serif" font-size="16" fill="#b45309">L = ' + L + ' m</text>';
    return svgURL(s + SVG_FTR);
  })();
  return {
    diagram: d036,
    variantKey: "mmaxu-w" + w + "-L" + L,
    question: question,
    options: [
      { label: fmt(M) + " kN·m at midspan", num: M, correct: true },
      { label: fmt(2 * M) + " kN·m at midspan", num: 2 * M, correct: false },
      { label: fmt(M) + " kN·m at the support", num: null, correct: false },
      { label: fmt(M / 2) + " kN·m at midspan", num: M / 2, correct: false }
    ],
    solution: solution
  };
}));


/* ============ 2026-10 expansion entries (mechmat-037..058) ============
 * Citations reuse each bank question's reviewed "Refer to ..." line verbatim.
 * mechmat-051 is conceptual (skipped). 043/057 share the modular-ratio
 * formula; both are kept, parameterized over the same material-pair space.
 */
var MM_SUP6 = "\u00D710\u207B\u2076";   // ×10⁻⁶ for strain labels

// ---------------------------------------------------------------- mechmat-037
// Axial elongation delta = PL/(AE), length given in feet.
reg(buildGenerator({ baseId: "mechmat-037", subtopic: "Axial deformation", difficulty: "easy",
  estimatedTimeSeconds: 105,
  explanation: "delta = PL/(AE) with L converted feet to inches. The traps skip the conversion, apply it twice, or double the area."
}, function () {
  var mat = pick([{ name: "steel", E: 29000000, Etex: "29\\times 10^{6}" }, { name: "aluminum", E: 10000000, Etex: "10\\times 10^{6}" }]);
  var A = pick([0.5, 0.75, 1.0]);
  var Lft = pick([10, 12, 20]);
  var P = pick([20000, 30000, 50000]);
  var d = P * Lft * 12 / (A * mat.E);
  var ans = d.toFixed(4);
  var tNo12 = (d / 12).toFixed(5);
  var tHalf = (d / 2).toFixed(4);
  var tDbl12 = (d * 12).toFixed(3);
  var question = "A " + mat.name + " rod (E = " + mat.E.toLocaleString("en-US") + " psi) with area " + A + " in² and length " + Lft + " ft carries a " + P.toLocaleString("en-US") + " lb tensile load. What is the elongation?";
  var solution = "Refer to Uniaxial Loading and Deformation in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 131 (PDF page 137).\n\n" +
    "$$\\delta = \\frac{PL}{AE} = \\frac{(" + P.toLocaleString("en-US") + ")(" + Lft + " \\times 12)}{(" + A + ")(" + mat.Etex + ")} = " + ans + "\\ \\text{in.}$$\n\n" +
    "The length must be in inches: " + Lft + " ft = " + (Lft * 12) + " in.";
  return { variantKey: mat.name + "_A" + A + "_L" + Lft + "_P" + P,
    question: question, diagram: dMM037(mat.name, P, Lft, A), options: [
      { label: ans + " in.", num: parseFloat(ans), correct: true },
      { label: tNo12 + " in.", num: parseFloat(tNo12), correct: false },
      { label: tHalf + " in.", num: parseFloat(tHalf), correct: false },
      { label: tDbl12 + " in.", num: parseFloat(tDbl12), correct: false }
    ], solution: solution };
}));


// ---------------------------------------------------------------- mechmat-038
// Thermal elongation, length in feet.
reg(buildGenerator({ baseId: "mechmat-038", subtopic: "Thermal elongation", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "delta = alpha L dT with L converted feet to inches. Traps: no conversion, double conversion, alpha slip."
}, function () {
  var Lft = pick([100, 150, 240]);
  var dT = pick([40, 60, 80, 100]);
  var alpha = 6.5e-6;
  var d = alpha * Lft * 12 * dT;
  var ans = d.toFixed(3);
  var tDbl = (d * 12).toFixed(2);
  var tNo = (d / 12).toFixed(4);
  var tAlpha = (d / 1000).toFixed(6);
  var question = "A " + Lft + " ft steel member (\u03B1 = 6.5\u00D710\u207B\u2076 /\u00B0F) heats up by " + dT + "\u00B0F and is free to expand. What is the change in length?";
  var solution = "Refer to Thermal Deformations in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 131 (PDF page 137).\n\n" +
    "$$\\delta = \\alpha L \\Delta T = (6.5\\times 10^{-6})(" + Lft + " \\times 12)(" + dT + ") = " + ans + "\\ \\text{in.}$$";
  return { variantKey: "L" + Lft + "_T" + dT,
    question: question, options: [
      { label: ans + " in.", num: parseFloat(ans), correct: true },
      { label: tDbl + " in.", num: parseFloat(tDbl), correct: false },
      { label: tNo + " in.", num: parseFloat(tNo), correct: false },
      { label: tAlpha + " in.", num: parseFloat(tAlpha), correct: false }
    ], solution: solution };
}));


// ---------------------------------------------------------------- mechmat-039
// Bulk modulus K = E / (3(1 - 2 nu)).
reg(buildGenerator({ baseId: "mechmat-039", subtopic: "Bulk modulus", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "K = E/(3(1-2nu)). The traps confuse it with the shear modulus G = E/(2(1+nu)) or drop the factor 2."
}, function () {
  var mat = pick([{ E: 29000, nu: 0.30 }, { E: 29000, nu: 0.25 }, { E: 10000, nu: 0.33 }, { E: 10000, nu: 0.30 }]);
  var K = mat.E / (3 * (1 - 2 * mat.nu));
  var ans = Math.round(K).toLocaleString("en-US");
  var tG = Math.round(mat.E / (2 * (1 + mat.nu))).toLocaleString("en-US");
  var tNo2 = Math.round(mat.E / (3 * (1 - mat.nu))).toLocaleString("en-US");
  var tQ = Math.round(K / 4).toLocaleString("en-US");
  var question = "A material has E = " + mat.E.toLocaleString("en-US") + " ksi and Poisson's ratio " + mat.nu.toFixed(2) + ". What is its bulk modulus using the handbook relation?";
  var solution = "Refer to Bulk (Volume) Modulus of Elasticity in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 131 (PDF page 137).\n\n" +
    "$$K = \\frac{E}{3(1 - 2\\nu)} = \\frac{" + mat.E.toLocaleString("en-US") + "}{3(1 - 2(" + mat.nu.toFixed(2) + "))} = " + ans + "\\ \\text{ksi}$$";
  return { variantKey: "E" + mat.E + "_n" + mat.nu,
    question: question, options: [
      { label: ans + " ksi", num: K, correct: true },
      { label: tG + " ksi", num: mat.E / (2 * (1 + mat.nu)), correct: false },
      { label: tNo2 + " ksi", num: mat.E / (3 * (1 - mat.nu)), correct: false },
      { label: tQ + " ksi", num: K / 4, correct: false }
    ], solution: solution };
}));


// ---------------------------------------------------------------- mechmat-040
// Plane-stress strain ex = (sx - n sy)/E.
reg(buildGenerator({ baseId: "mechmat-040", subtopic: "Plane stress strain", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "ex = (sx - nu*sy)/E in plane stress. Traps: add instead of subtract, ignore the lateral term, slip a power of ten."
}, function () {
  var sx = pick([20, 30, 40]);
  var sy = pick([8, 10, 15]);
  var E = 29000, nu = 0.30;
  var ex = (sx - nu * sy) / E * 1e6;
  var ans = Math.round(ex);
  var tPlus = Math.round((sx + nu * sy) / E * 1e6);
  var tNoLat = Math.round(sx / E * 1e6);
  var tTen = Math.round(ex / 10);
  var question = "In plane stress (\u03C3z = 0), \u03C3x = " + sx + " ksi and \u03C3y = " + sy + " ksi, with E = 29,000 ksi and \u03BD = 0.30. What is the strain \u03B5x?";
  var solution = "Refer to Hooke's Law, plane stress case in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 134 (PDF page 140).\n\n" +
    "$$\\varepsilon_x = \\frac{\\sigma_x - \\nu\\sigma_y}{E} = \\frac{" + sx + " - 0.30(" + sy + ")}{29000} = " + ans + " \\times 10^{-6}$$";
  return { variantKey: "sx" + sx + "_sy" + sy,
    question: question, options: [
      { label: ans + " " + MM_SUP6, num: ans, correct: true },
      { label: tPlus + " " + MM_SUP6, num: tPlus, correct: false },
      { label: tNoLat + " " + MM_SUP6, num: tNoLat, correct: false },
      { label: tTen + " " + MM_SUP6, num: tTen, correct: false }
    ], solution: solution };
}));


// ---------------------------------------------------------------- mechmat-041
// Bending stress with moment in kip-ft.
reg(buildGenerator({ baseId: "mechmat-041", subtopic: "Bending stress", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "sigma = Mc/I with M converted kip-ft to kip-in. The traps skip the 12x conversion or botch it."
}, function () {
  var I = pick([300, 500]);
  var c = pick([5, 6]);
  var M = pick([120, 150, 200]);
  var sig = M * 12 * c / I;
  var ans = sig.toFixed(1);
  var tNo = (sig / 12).toFixed(1);
  var tDiv = (sig / 144).toFixed(2);
  var tLb = (sig * 1000).toFixed(0);
  var question = "A beam section has I = " + I + " in\u2074 and c = " + c + " in. to the extreme fiber. What is the maximum bending stress at a section with M = " + M + " kip-ft?";
  var solution = "Refer to Maximum normal stresses in a beam due to bending in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 136 (PDF page 142).\n\n" +
    "Convert the moment: " + M + " kip-ft = " + (M * 12) + " kip-in.\n\n" +
    "$$\\sigma = \\frac{Mc}{I} = \\frac{(" + M * 12 + ")(" + c + ")}{" + I + "} = " + ans + "\\ \\text{ksi}$$";
  return { variantKey: "I" + I + "_c" + c + "_M" + M,
    question: question, options: [
      { label: ans + " ksi", num: parseFloat(ans), correct: true },
      { label: tNo + " ksi", num: parseFloat(tNo), correct: false },
      { label: tDiv + " ksi", num: parseFloat(tDiv), correct: false },
      { label: tLb + " ksi", num: parseFloat(tLb), correct: false }
    ], solution: solution };
}));



/* ---- Parameterized bank-diagram retrofits (mechmat) ---- */

// mechmat-037: wall-fixed rod in tension; labels carry rolled P, L, A, material
function dMM037(matName, P, Lft, A) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="' + matName + ' rod ' + Lft + ' feet long with area ' + A + ' square inches carrying a ' + P.toLocaleString("en-US") + ' pound tensile load">';
  s += '<rect width="480" height="230" fill="#ffffff"/>';
  s += '<line x1="60" y1="60" x2="60" y2="160" stroke="#1a1a1a" stroke-width="4"/>';
  for (var i = 0; i < 11; i++) s += '<line x1="60" y1="' + (66 + i * 9) + '" x2="50" y2="' + (74 + i * 9) + '" stroke="#8a8a8a" stroke-width="1"/>';
  s += '<rect x="60" y="95" width="340" height="30" fill="#cfcfcf" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="400" y1="110" x2="456" y2="110" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="404" y="96" font-family="Helvetica,Arial,sans-serif" font-size="15" fill="#1d4ed8">P = ' + P.toLocaleString("en-US") + ' lb</text>';
  s += '<text x="230" y="88" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">L = ' + Lft + ' ft</text>';
  s += '<text x="230" y="145" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">A = ' + A + ' in\u00B2</text>';
  return svgURL(s + '</svg>');
}

// mechmat-052: same rod drawing, kips/inches units
function dMM052(P, Lin, A) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Steel rod ' + Lin + ' inches long with area ' + A + ' square inches carrying a ' + P + ' kip axial load">';
  s += '<rect width="480" height="230" fill="#ffffff"/>';
  s += '<line x1="60" y1="60" x2="60" y2="160" stroke="#1a1a1a" stroke-width="4"/>';
  for (var i = 0; i < 11; i++) s += '<line x1="60" y1="' + (66 + i * 9) + '" x2="50" y2="' + (74 + i * 9) + '" stroke="#8a8a8a" stroke-width="1"/>';
  s += '<rect x="60" y="95" width="340" height="30" fill="#cfcfcf" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="400" y1="110" x2="456" y2="110" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="404" y="96" font-family="Helvetica,Arial,sans-serif" font-size="15" fill="#1d4ed8">' + P + ' kip</text>';
  s += '<text x="230" y="88" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">L = ' + Lin + ' in.</text>';
  s += '<text x="230" y="145" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">A = ' + A + ' in.\u00B2</text>';
  return svgURL(s + '</svg>');
}

// mechmat-044/045: plane-stress element with rolled sigma_x, sigma_y, tau_xy
function dMMStressEl(sx, sy, tau) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="245" viewBox="0 0 480 245" role="img" aria-label="Plane stress element with normal stress sigma x of ' + sx + ' ksi, sigma y of ' + sy + ' ksi and shear stress tau xy of ' + tau + ' ksi">';
  s += '<defs><marker id="ah2" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#c0392b"/></marker><marker id="ah3" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#2e86c1"/></marker></defs>';
  s += '<rect width="480" height="245" fill="#ffffff"/>';
  s += '<rect x="190" y="60" width="100" height="100" fill="#e8e8e8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="290" y1="110" x2="345" y2="110" stroke="#c0392b" stroke-width="3" marker-end="url(#ah2)"/>';
  s += '<line x1="190" y1="110" x2="135" y2="110" stroke="#c0392b" stroke-width="3" marker-end="url(#ah2)"/>';
  s += '<line x1="240" y1="60" x2="240" y2="12" stroke="#c0392b" stroke-width="3" marker-end="url(#ah2)"/>';
  s += '<line x1="240" y1="160" x2="240" y2="208" stroke="#c0392b" stroke-width="3" marker-end="url(#ah2)"/>';
  s += '<line x1="305" y1="165" x2="305" y2="135" stroke="#2e86c1" stroke-width="2.5" marker-end="url(#ah3)"/>';
  s += '<line x1="176" y1="55" x2="176" y2="85" stroke="#2e86c1" stroke-width="2.5" marker-end="url(#ah3)"/>';
  s += '<line x1="255" y1="47" x2="285" y2="47" stroke="#2e86c1" stroke-width="2.5" marker-end="url(#ah3)"/>';
  s += '<line x1="225" y1="173" x2="195" y2="173" stroke="#2e86c1" stroke-width="2.5" marker-end="url(#ah3)"/>';
  s += '<text x="352" y="115" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">\u03C3x = ' + sx + ' ksi</text>';
  s += '<text x="250" y="22" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">\u03C3y = ' + sy + ' ksi</text>';
  s += '<text x="316" y="175" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#2e86c1">\u03C4xy = ' + tau + ' ksi</text>';
  return svgURL(s + '</svg>');
}

// mechmat-058: thick-wall cylinder cross-section; inner radius scales with a/b
function dMM058(a, b, p) {
  var rO = 90, rI = 90 * a / b;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="235" viewBox="0 0 480 235" role="img" aria-label="Thick-walled cylinder cross section with inside radius ' + a.toFixed(1) + ' inches, outside radius ' + b.toFixed(1) + ' inches and internal pressure ' + p.toLocaleString("en-US") + ' psi">';
  s += '<rect width="480" height="235" fill="#ffffff"/>';
  s += '<circle cx="240" cy="110" r="' + rO + '" fill="#cfcfcf" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<circle cx="240" cy="110" r="' + rI.toFixed(1) + '" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="240" y1="110" x2="' + (240 + rI).toFixed(1) + '" y2="110" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="' + (240 + rI / 2).toFixed(1) + '" y="127" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">' + a.toFixed(1) + ' in.</text>';
  s += '<line x1="240" y1="110" x2="195" y2="188" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="176" y="198" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="end" fill="#1a1a1a">' + b.toFixed(1) + ' in.</text>';
  s += '<text x="225" y="88" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">p = ' + p.toLocaleString("en-US") + ' psi</text>';
  s += '<text x="240" y="225" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">internal pressure only</text>';
  return svgURL(s + '</svg>');
}

// Beam cases where the reactions are exact integers (P, a, L); base (30, 8, 20) included.
var MM_BEAM_CASES = [[20, 6, 15], [20, 8, 16], [20, 5, 20], [20, 6, 20], [20, 8, 20], [30, 5, 15], [30, 6, 15], [30, 8, 15], [30, 8, 16], [30, 6, 20], [30, 8, 20], [40, 6, 15], [40, 6, 16], [40, 8, 16], [40, 5, 20], [40, 6, 20], [40, 8, 20]];
function mmBeamPick() { var c = pick(MM_BEAM_CASES); return { P: c[0], a: c[1], L: c[2] }; }

// Shared parameterized beam diagrams (Jose's 10/18 steering: diagrams follow the rolled numbers).
function mmBeamPointSVG(P, a, L) {
  var ox = 64, bw = 512, by = 150;
  var px = ox + bw * a / L;
  var s = SVG_HDR + AH;
  s += '<rect x="' + ox + '" y="' + (by - 8) + '" width="' + bw + '" height="16" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="' + px + '" y1="' + (by - 70) + '" x2="' + px + '" y2="' + (by - 12) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="' + (px - 34) + '" y="' + (by - 80) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">P = ' + P + ' kip</text>';
  s += '<polygon points="' + ox + ',' + (by + 8) + ' ' + (ox - 14) + ',' + (by + 34) + ' ' + (ox + 14) + ',' + (by + 34) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<circle cx="' + (ox + bw - 7) + '" cy="' + (by + 22) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<circle cx="' + (ox + bw + 9) + '" cy="' + (by + 22) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="' + (ox - 4) + '" y="' + (by + 56) + '" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">A</text>';
  s += '<text x="' + (ox + bw - 4) + '" y="' + (by + 56) + '" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">B</text>';
  s += '<line x1="' + ox + '" y1="' + (by + 76) + '" x2="' + px + '" y2="' + (by + 76) + '" stroke="#6b7280" stroke-width="1.5"/>';
  s += '<text x="' + ((ox + px) / 2 - 30) + '" y="' + (by + 98) + '" font-family="Georgia,serif" font-size="15" fill="#6b7280">a = ' + a + ' ft</text>';
  s += '<line x1="' + px + '" y1="' + (by + 76) + '" x2="' + (ox + bw) + '" y2="' + (by + 76) + '" stroke="#6b7280" stroke-width="1.5"/>';
  s += '<text x="' + ((px + ox + bw) / 2 - 44) + '" y="' + (by + 98) + '" font-family="Georgia,serif" font-size="15" fill="#6b7280">' + (L - a) + ' ft</text>';
  s += '<text x="' + (ox + 4) + '" y="30" font-family="Georgia,serif" font-size="14" fill="#4b5563">Simply supported beam, span L = ' + L + ' ft</text>';
  return svgURL(s + SVG_FTR);
}
function mmBeamUDLSVG(w, L) {
  var ox = 64, bw = 512, by = 150;
  var s = SVG_HDR + AH;
  s += '<rect x="' + ox + '" y="' + (by - 8) + '" width="' + bw + '" height="16" fill="#eef2ff" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="' + ox + '" y1="' + (by - 46) + '" x2="' + (ox + bw) + '" y2="' + (by - 46) + '" stroke="#1d4ed8" stroke-width="2"/>';
  for (var i = 0; i <= 8; i++) {
    var x = ox + bw * i / 8;
    s += '<line x1="' + x + '" y1="' + (by - 46) + '" x2="' + x + '" y2="' + (by - 12) + '" stroke="#1d4ed8" stroke-width="2" marker-end="url(#ah)"/>';
  }
  s += '<text x="' + (ox + bw / 2 - 58) + '" y="' + (by - 58) + '" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">w = ' + w + ' kip/ft</text>';
  s += '<polygon points="' + ox + ',' + (by + 8) + ' ' + (ox - 14) + ',' + (by + 34) + ' ' + (ox + 14) + ',' + (by + 34) + '" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<circle cx="' + (ox + bw - 7) + '" cy="' + (by + 22) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<circle cx="' + (ox + bw + 9) + '" cy="' + (by + 22) + '" r="7" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="' + (ox - 4) + '" y="' + (by + 56) + '" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">A</text>';
  s += '<text x="' + (ox + bw - 4) + '" y="' + (by + 56) + '" font-family="Georgia,serif" font-size="16" fill="#1a1a1a">B</text>';
  s += '<text x="' + (ox + bw / 2 - 34) + '" y="' + (by + 56) + '" font-family="Georgia,serif" font-size="15" fill="#6b7280">L = ' + L + ' ft</text>';
  return svgURL(s + SVG_FTR);
}

// ---------------------------------------------------------------- mechmat-042
// Transverse shear stress tau = VQ/(Ib), V given in kips.
reg(buildGenerator({ baseId: "mechmat-042", subtopic: "Transverse shear stress", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "tau = VQ/(Ib) with V converted kips to lb. The traps drop b, multiply by b, or slip the kip-lb factor."
}, function () {
  var V = pick([18, 30, 24]);
  var Q = pick([40, 48, 60]);
  var I = pick([300, 500]);
  var b = pick([4, 6]);
  var tau = V * 1000 * Q / (I * b) / 1000;   // ksi
  var ans = tau.toFixed(2);
  var tNoB = (V * Q / I).toFixed(2);
  var tXB = (V * Q * b / I).toFixed(2);
  var tSlip = (tau / 10).toFixed(2);
  var question = "At a point in a beam, V = " + V + " kip, Q = " + Q + " in³, I = " + I + " in⁴ and the width is b = " + b + " in. What is the shear stress?";
  var solution = "Refer to Transverse shear stress in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 136 (PDF page 142).\n\n" +
    "$$\\tau = \\frac{VQ}{Ib} = \\frac{(" + V + "\\times 1000)(" + Q + ")}{(" + I + ")(" + b + ")} = " + ans + "\\ \\text{ksi}$$";
  return { variantKey: "V" + V + "_Q" + Q + "_I" + I + "_b" + b,
    question: question, options: [
      { label: ans + " ksi", num: parseFloat(ans), correct: true },
      { label: tNoB + " ksi", num: parseFloat(tNoB), correct: false },
      { label: tXB + " ksi", num: parseFloat(tXB), correct: false },
      { label: tSlip + " ksi", num: parseFloat(tSlip), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-043
// Modular ratio n = E1/E2.
reg(buildGenerator({ baseId: "mechmat-043", subtopic: "Composite beam modular ratio", difficulty: "easy",
  estimatedTimeSeconds: 75,
  explanation: "n = E1/E2 with material 1 stiffer. Traps: invert the ratio, halve it, or add the moduli."
}, function () {
  var pair = pick([{ m1: "steel", E1: 29000, m2: "wood", E2: 1800 }, { m1: "steel", E1: 29000, m2: "concrete", E2: 3000 }, { m1: "steel", E1: 29000, m2: "aluminum", E2: 10000 }]);
  var n = pair.E1 / pair.E2;
  var ans = n.toFixed(1);
  var tInv = (pair.E2 / pair.E1).toFixed(3);
  var tHalf = (n / 2).toFixed(1);
  var tSum = (pair.E1 + pair.E2).toLocaleString("en-US");
  var question = "A composite beam uses " + pair.m1 + " (E = " + pair.E1.toLocaleString("en-US") + " ksi) and " + pair.m2 + " (E = " + pair.E2.toLocaleString("en-US") + " ksi). Using the handbook transformed-section method with " + pair.m1 + " as material 1, what is the modular ratio n?";
  var solution = "Refer to Composite Sections in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 137 (PDF page 143).\n\n" +
    "$$n = \\frac{E_1}{E_2} = \\frac{" + pair.E1.toLocaleString("en-US") + "}{" + pair.E2.toLocaleString("en-US") + "} = " + ans + "$$";
  return { variantKey: pair.m2,
    question: question, options: [
      { label: ans, num: n, correct: true },
      { label: tInv, num: pair.E2 / pair.E1, correct: false },
      { label: tHalf, num: n / 2, correct: false },
      { label: tSum, num: pair.E1 + pair.E2, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-044
// Larger principal stress.
reg(buildGenerator({ baseId: "mechmat-044", subtopic: "Principal stresses", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "sigma1 = avg + R with R = sqrt(((sx-sy)/2)^2 + txy^2). Traps: the average alone, sx alone, or sx+sy."
}, function () {
  var sx = pick([60, 50, 40]);
  var sy = pick([20, 10, 30]);
  var tau = pick([15, 12, 20]);
  var avg = (sx + sy) / 2, R = Math.sqrt(Math.pow((sx - sy) / 2, 2) + tau * tau);
  var s1 = avg + R;
  var ans = s1.toFixed(1);
  var tAvg = avg.toFixed(1);
  var tSx = sx.toFixed(1);
  var tSum = (sx + sy).toFixed(1);
  var question = "At a point in plane stress, \u03C3x = " + sx + " ksi, \u03C3y = " + sy + " ksi and \u03C4xy = " + tau + " ksi. What is the larger principal stress?";
  var solution = "Refer to Mohr's circle (center and radius) in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 133 (PDF page 139).\n\n" +
    "$$\\begin{aligned}\\sigma_{\\text{avg}} &= \\frac{" + sx + " + " + sy + "}{2} = " + avg.toFixed(1) + "\\ \\text{ksi} \\\\ R &= \\sqrt{\\left(\\frac{" + sx + " - " + sy + "}{2}\\right)^2 + " + tau + "^2} = " + R.toFixed(1) + "\\ \\text{ksi} \\\\ \\sigma_1 &= " + avg.toFixed(1) + " + " + R.toFixed(1) + " = " + ans + "\\ \\text{ksi}\\end{aligned}$$";
  return { variantKey: "sx" + sx + "_sy" + sy + "_t" + tau,
    question: question, diagram: dMMStressEl(sx, sy, tau), options: [
      { label: ans + " ksi", num: s1, correct: true },
      { label: tAvg + " ksi", num: avg, correct: false },
      { label: tSx + " ksi", num: sx, correct: false },
      { label: tSum + " ksi", num: sx + sy, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-045
// Maximum in-plane shear stress = R (same stress state family).
reg(buildGenerator({ baseId: "mechmat-045", subtopic: "Maximum in-plane shear stress", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "\\(\\tau_{max} = R\\), the radius of Mohr's circle. Traps: \\(2R\\) (diameter), the \\((\\sigma_x - \\sigma_y)/2\\) term alone, or \\(\\tau_{xy}\\) itself."
}, function () {
  var sx = pick([60, 50, 40]);
  var sy = pick([20, 10, 30]);
  var tau = pick([15, 12, 20]);
  var R = Math.sqrt(Math.pow((sx - sy) / 2, 2) + tau * tau);
  var ans = R.toFixed(2);
  var tDbl = (2 * R).toFixed(2);
  var tHalf = ((sx - sy) / 2).toFixed(1);
  var tTxy = tau.toFixed(1);
  var question = "For the stress state (\u03C3x = " + sx + " ksi, \u03C3y = " + sy + " ksi, \u03C4xy = " + tau + " ksi), what is the maximum in-plane shear stress?";
  var solution = "Refer to Mohr's circle (maximum in-plane shear stress) in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 134 (PDF page 140).\n\n" +
    "$$\\tau_{\\max} = R = \\sqrt{\\left(\\frac{" + sx + " - " + sy + "}{2}\\right)^2 + " + tau + "^2} = " + ans + "\\ \\text{ksi}$$";
  return { variantKey: "sx" + sx + "_sy" + sy + "_t" + tau,
    question: question, diagram: dMMStressEl(sx, sy, tau), options: [
      { label: ans + " ksi", num: R, correct: true },
      { label: tDbl + " ksi", num: 2 * R, correct: false },
      { label: tHalf + " ksi", num: (sx - sy) / 2, correct: false },
      { label: tTxy + " ksi", num: tau, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-046
// Reaction at A, point load on simple span. DIAGRAM: rolled P, a, L.
reg(buildGenerator({ baseId: "mechmat-046", subtopic: "Reaction at A, point load", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Take moments about B: \\(R_A = P(L-a)/L\\), derived from statics (\\(R_A + R_B = P\\)). Traps: the other reaction, the full load, or the midspan split."
}, function () {
  var bc = mmBeamPick();
  var P = bc.P, a = bc.a, L = bc.L;
  var RA = P * (L - a) / L;
  var RB = P - RA;
  var question = "The simply supported beam shown carries a " + P + " kip point load " + a + " ft from support A on a " + L + " ft span. What is the reaction at A?";
  var solution = "Refer to Beams (shear force and bending moment relations) in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 135 (PDF page 141).\n\n" +
    "Sum moments about B: \\(R_A L = P(L - a)\\).\n\n" +
    "$$R_A = \\frac{" + P + "(" + L + " - " + a + ")}{" + L + "} = " + RA.toFixed(0) + "\\ \\text{kip}$$";
  return { variantKey: "P" + P + "_a" + a + "_L" + L,
    question: question, diagram: mmBeamPointSVG(P, a, L), options: [
      { label: RA.toFixed(0) + " kip", num: RA, correct: true },
      { label: RB.toFixed(0) + " kip", num: RB, correct: false },
      { label: P + " kip", num: P, correct: false },
      { label: (P / 2).toFixed(0) + " kip", num: P / 2, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-047
// Maximum moment under the point load. DIAGRAM: rolled beam.
reg(buildGenerator({ baseId: "mechmat-047", subtopic: "Maximum moment, point load", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "\\(M_{\\max} = R_A a = Pa(L-a)/L\\) at the load. The traps use the midspan formula \\(PL/4\\), \\(P \\cdot a\\), and \\(PL/8\\)."
}, function () {
  var bc = mmBeamPick();
  var P = bc.P, a = bc.a, L = bc.L;
  var M = P * a * (L - a) / L;
  var tMid = P * L / 4;
  var tPa = P * a;
  var tRb = P * (L - a) / L * (L - a);     // RB x (L-a): same value as M! use PL/8 instead
  tRb = P * L / 8;
  var question = "For the beam shown (P = " + P + " kip at " + a + " ft from A, span " + L + " ft), what is the maximum bending moment?";
  var solution = "Refer to Beams (V and M relationship, dM/dx = V) in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 135 (PDF page 141).\n\n" +
    "The maximum moment occurs under the load, where the shear crosses zero.\n\n" +
    "$$M_{\\max} = R_A\\,a = \\frac{Pa(L-a)}{L} = \\frac{" + P + "(" + a + ")(" + (L - a) + ")}{" + L + "} = " + M.toFixed(0) + "\\ \\text{kip-ft}$$";
  return { variantKey: "P" + P + "_a" + a + "_L" + L,
    question: question, diagram: mmBeamPointSVG(P, a, L), options: [
      { label: M.toFixed(0) + " kip-ft", num: M, correct: true },
      { label: tMid.toFixed(0) + " kip-ft", num: tMid, correct: false },
      { label: tPa.toFixed(0) + " kip-ft", num: tPa, correct: false },
      { label: tRb.toFixed(0) + " kip-ft", num: tRb, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-048
// Shear just right of the point load = RA - P (U+2212 negatives). DIAGRAM.
reg(buildGenerator({ baseId: "mechmat-048", subtopic: "Shear just right of the load", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "Just right of the load, \\(V = R_A - P = -R_B\\). Traps: \\(-P\\), \\(+R_A\\), and \\(+R_B\\) (sign flip of the correct answer)."
}, function () {
  var bc = mmBeamPick();
  var P = bc.P, a = bc.a, L = bc.L;
  var RA = P * (L - a) / L, RB = P - RA;
  var V = RA - P;                          // negative
  var question = "For the simply supported beam shown (P = " + P + " kip at " + a + " ft from A, span " + L + " ft), what is the shear just to the right of the point load? Use the handbook sign convention (positive when the right portion tends to shear downward).";
  var solution = "Refer to Shearing Force and Bending Moment Sign Conventions in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 135 (PDF page 141).\n\n" +
    "$$V = R_A - P = " + RA.toFixed(0) + " - " + P + " = " + V.toFixed(0) + "\\ \\text{kip}$$\n\n" +
    "The negative sign means the right portion tends to shear upward - equivalently, the shear carries the B reaction's magnitude with the opposite sign.";
  var lbl = function (v) { return (v < 0 ? MINUS : "") + Math.abs(v).toFixed(0) + " kip"; };
  return { variantKey: "P" + P + "_a" + a + "_L" + L,
    question: question, diagram: mmBeamPointSVG(P, a, L), options: [
      { label: lbl(V), num: V, correct: true },
      { label: lbl(-P), num: -P, correct: false },
      { label: lbl(RA), num: RA, correct: false },
      { label: lbl(RB), num: RB, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-049
// Max moment, uniform load. DIAGRAM: rolled UDL.
reg(buildGenerator({ baseId: "mechmat-049", subtopic: "Maximum moment, uniform load", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Mmax = wL^2/8 at midspan. Traps: the cantilever wL^2/2, wL^2/4, and the reaction wL/2."
}, function () {
  var w = pick([2.5, 2, 3]);
  var L = pick([16, 12, 20]);
  var M = w * L * L / 8;
  var tCant = w * L * L / 2;
  var tQ = w * L * L / 4;
  var tR = w * L / 2;
  var question = "The simply supported beam shown carries " + w + " kip/ft over a " + L + " ft span. What is the maximum bending moment?";
  var solution = "Refer to Beams (V and M relationship, dM/dx = V) in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 135 (PDF page 141).\n\n" +
    "$$M_{\\max} = \\frac{wL^2}{8} = \\frac{" + w + "(" + L + ")^2}{8} = " + M.toFixed(0) + "\\ \\text{kip-ft}$$";
  return { variantKey: "w" + w + "_L" + L,
    question: question, diagram: mmBeamUDLSVG(w, L), options: [
      { label: M.toFixed(0) + " kip-ft", num: M, correct: true },
      { label: tCant.toFixed(0) + " kip-ft", num: tCant, correct: false },
      { label: tQ.toFixed(0) + " kip-ft", num: tQ, correct: false },
      { label: tR.toFixed(0) + " kip-ft", num: tR, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-050
// Position of zero shear under UDL (midspan). DIAGRAM: rolled UDL.
reg(buildGenerator({ baseId: "mechmat-050", subtopic: "Position of zero shear", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "V(x) = w(L/2 - x) = 0 at midspan. Traps: the span itself, L/4, and the reaction value."
}, function () {
  var w = pick([2.5, 2, 3]);
  var L = pick([16, 12, 20]);
  var x = L / 2;
  var R = w * L / 2;
  var question = "For the uniformly loaded beam shown (w = " + w + " kip/ft, L = " + L + " ft, reactions " + R.toFixed(0) + " kip), how far from A is the shear zero?";
  var solution = "Refer to Beams (V and M relationship, w = -dV/dx) in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 135 (PDF page 141).\n\n" +
    "$$V(x) = R_A - wx = w\\left(\\frac{L}{2} - x\\right) = 0 \\quad\\Rightarrow\\quad x = \\frac{L}{2} = " + x.toFixed(0) + "\\ \\text{ft}$$";
  return { variantKey: "w" + w + "_L" + L,
    question: question, diagram: mmBeamUDLSVG(w, L), options: [
      { label: x.toFixed(0) + " ft", num: x, correct: true },
      { label: L + " ft", num: L, correct: false },
      { label: (L / 4).toFixed(0) + " ft", num: L / 4, correct: false },
      { label: R.toFixed(0) + " ft", num: R, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-052
// Axial deformation, all units in inches/kips.
reg(buildGenerator({ baseId: "mechmat-052", subtopic: "Axial deformation", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "delta = PL/(AE) with E in ksi needing x1000 and P in kips. Traps: x12 phantom conversion, half-length, and the ksi slip that zeroes the answer."
}, function () {
  var P = pick([30, 50, 20]);              // kips
  var A = pick([0.5, 0.75]);
  var L = pick([120, 96, 240]);            // in.
  var d = P * 1000 * L / (A * 29000000);
  var ans = d.toFixed(3);
  var t12 = (d * 12).toFixed(3);
  var tHalf = (d / 2).toFixed(3);
  var tSlip = (d / 1000).toFixed(5);
  var question = "A steel rod (E = 29,000 ksi) with an area of " + A + " in.² and a length of " + L + " in. carries an axial load of " + P + " kips. What is the elongation?";
  var solution = "Refer to Uniaxial Loading and Deformation in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 131 (PDF page 137).\n\n" +
    "$$\\delta = \\frac{PL}{AE} = \\frac{(" + P + "\\times 1000)(" + L + ")}{(" + A + ")(29\\times 10^{6})} = " + ans + "\\ \\text{in.}$$";
  return { variantKey: "P" + P + "_A" + A + "_L" + L,
    question: question, diagram: dMM052(P, L, A), options: [
      { label: ans + " in.", num: parseFloat(ans), correct: true },
      { label: t12 + " in.", num: parseFloat(t12), correct: false },
      { label: tHalf + " in.", num: parseFloat(tHalf), correct: false },
      { label: tSlip + " in.", num: parseFloat(tSlip), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-053
// Thermal elongation in inches.
reg(buildGenerator({ baseId: "mechmat-053", subtopic: "Thermal elongation", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "delta = alpha L dT with L already in inches. Traps: alpha slip (/100), phantom x12, and inverting the formula."
}, function () {
  var L = pick([240, 120, 180]);
  var dT = pick([80, 60, 100]);
  var alpha = 6.5e-6;
  var d = alpha * L * dT;
  var ans = d.toFixed(4);
  var tAlpha = (d / 100).toFixed(6);
  var t12 = (d * 12).toFixed(4);
  var tInv = (L / (alpha * dT * 1e6)).toFixed(2);   // nonsense inverse, scaled
  var question = "A steel member " + L + " in. long (\u03B1 = 6.5 \u00D7 10\u207B\u2076 per \u00B0F) is heated by " + dT + " degrees F and is free to expand. What is the change in length?";
  var solution = "Refer to Thermal Deformations in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 131 (PDF page 137).\n\n" +
    "$$\\delta = \\alpha L \\Delta T = (6.5 \\times 10^{-6})(" + L + ")(" + dT + ") = " + ans + "\\ \\text{in.}$$";
  return { variantKey: "L" + L + "_T" + dT,
    question: question, options: [
      { label: ans + " in.", num: parseFloat(ans), correct: true },
      { label: tAlpha + " in.", num: parseFloat(tAlpha), correct: false },
      { label: t12 + " in.", num: parseFloat(t12), correct: false },
      { label: tInv + " in.", num: parseFloat(tInv), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-054
// Bending stress with moment in kip-in. (no unit conversion).
reg(buildGenerator({ baseId: "mechmat-054", subtopic: "Maximum bending stress", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "sigma = Mc/I directly since M is already in kip-in. Traps: phantom conversions and the I*c denominator swap."
}, function () {
  var I = pick([300, 500]);
  var c = pick([5, 6]);
  var M = pick([120, 150, 200]);           // kip-in
  var sig = M * c / I;
  var ans = sig.toFixed(2);
  var tDbl = (M * 1000 * 12 * c / I / 1000).toFixed(0);   // phantom x12
  var tSwap = (M / (I * c)).toFixed(4);
  var tHalf = (sig / 2).toFixed(2);
  var question = "A beam section has I = " + I + " in.\u2074 and c = " + c + " in. to the extreme fiber. What is the maximum bending stress for a moment of " + M + " kip-in.?";
  var solution = "Refer to Stresses in Beams in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 136 (PDF page 142).\n\n" +
    "$$\\sigma = \\frac{Mc}{I} = \\frac{(" + M + ")(" + c + ")}{" + I + "} = " + ans + "\\ \\text{ksi}$$";
  return { variantKey: "I" + I + "_c" + c + "_M" + M,
    question: question, options: [
      { label: ans + " ksi", num: parseFloat(ans), correct: true },
      { label: tDbl + " ksi", num: parseFloat(tDbl), correct: false },
      { label: tSwap + " ksi", num: parseFloat(tSwap), correct: false },
      { label: tHalf + " ksi", num: parseFloat(tHalf), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-055
// Transverse shear stress (kips version).
reg(buildGenerator({ baseId: "mechmat-055", subtopic: "Transverse shear stress", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "tau = VQ/(Ib), V converted kips to lb. Traps: drop b, multiply by b, kip-lb slip."
}, function () {
  var V = pick([18, 24, 30]);
  var Q = pick([40, 48]);
  var I = pick([300, 500]);
  var b = pick([4, 6]);
  var tau = V * Q / (I * b);               // kip/in^2 = ksi
  var ans = tau.toFixed(3);
  var tNoB = (V * Q / I).toFixed(3);
  var tXB = (V * Q * b / I).toFixed(3);
  var tSlip = (tau / 10).toFixed(3);
  var question = "At a point in a beam, V = " + V + " kips, Q = " + Q + " in.\u00B3, I = " + I + " in.\u2074 and the width is " + b + " in. What is the transverse shear stress?";
  var solution = "Refer to Stresses in Beams (transverse shear stress) in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 136 (PDF page 142).\n\n" +
    "$$\\tau = \\frac{VQ}{Ib} = \\frac{(" + V + ")(" + Q + ")}{(" + I + ")(" + b + ")} = " + ans + "\\ \\text{ksi}$$";
  return { variantKey: "V" + V + "_Q" + Q + "_I" + I + "_b" + b,
    question: question, options: [
      { label: ans + " ksi", num: parseFloat(ans), correct: true },
      { label: tNoB + " ksi", num: parseFloat(tNoB), correct: false },
      { label: tXB + " ksi", num: parseFloat(tXB), correct: false },
      { label: tSlip + " ksi", num: parseFloat(tSlip), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-056
// Shear flow q = VQ/I for connector design.
reg(buildGenerator({ baseId: "mechmat-056", subtopic: "Shear flow in a built-up section", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "q = VQ/I (force per unit length). Traps: invert it, divide by b (that is shear STRESS), or slip the kip factor."
}, function () {
  var V = pick([18, 24, 30]);
  var Q = pick([40, 48]);
  var I = pick([300, 500]);
  var q = V * Q / I;                       // kip/in
  var ans = q.toFixed(2);
  var tInv = (I / (V * 1000 * Q)).toFixed(4);
  var tTau = (q / 4).toFixed(3);           // q/b with b=4 = shear stress
  var tSlip = (q / 10).toFixed(3);
  var question = "A built-up beam carries V = " + V + " kips with Q = " + Q + " in.\u00B3 for the connected part and I = " + I + " in.\u2074. What shear flow must the connectors carry per inch of length?";
  var solution = "Refer to Stresses in Beams (transverse shear flow) in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 136 (PDF page 142).\n\n" +
    "$$q = \\frac{VQ}{I} = \\frac{(" + V + ")(" + Q + ")}{" + I + "} = " + ans + "\\ \\text{kip/in.}$$";
  return { variantKey: "V" + V + "_Q" + Q + "_I" + I,
    question: question, options: [
      { label: ans + " kip/in.", num: q, correct: true },
      { label: tInv + " kip/in.", num: parseFloat(tInv), correct: false },
      { label: tTau + " kip/in.", num: q / 4, correct: false },
      { label: tSlip + " kip/in.", num: parseFloat(tSlip), correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-057
// Modular ratio (concrete-transform version).
reg(buildGenerator({ baseId: "mechmat-057", subtopic: "Modular ratio in a composite beam", difficulty: "easy",
  estimatedTimeSeconds: 75,
  explanation: "n = E1/E2 with E1 > E2. Traps: invert it, take its square root, or subtract the moduli."
}, function () {
  var pair = pick([{ m1: "steel", E1: 29000, m2: "concrete", E2: 3000 }, { m1: "steel", E1: 29000, m2: "wood", E2: 1800 }, { m1: "steel", E1: 29000, m2: "masonry", E2: 4500 }]);
  var n = pair.E1 / pair.E2;
  var ans = n.toFixed(2);
  var tInv = (pair.E2 / pair.E1).toFixed(3);
  var tSqrt = Math.sqrt(n).toFixed(2);
  var tDiff = (pair.E1 - pair.E2).toLocaleString("en-US");
  var question = "A composite beam has " + pair.m1 + " (E = " + pair.E1.toLocaleString("en-US") + " ksi) and " + pair.m2 + " (E = " + pair.E2.toLocaleString("en-US") + " ksi). What modular ratio n transforms the " + pair.m2 + " into an equivalent " + pair.m1 + " section when the handbook defines n = E1/E2 with E1 > E2?";
  var solution = "Refer to Composite Sections in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 137 (PDF page 143).\n\n" +
    "$$n = \\frac{E_1}{E_2} = \\frac{" + pair.E1.toLocaleString("en-US") + "}{" + pair.E2.toLocaleString("en-US") + "} = " + ans + "$$";
  return { variantKey: pair.m2,
    question: question, options: [
      { label: ans, num: n, correct: true },
      { label: tInv, num: pair.E2 / pair.E1, correct: false },
      { label: tSqrt, num: Math.sqrt(n), correct: false },
      { label: tDiff, num: pair.E1 - pair.E2, correct: false }
    ], solution: solution };
}));

// ---------------------------------------------------------------- mechmat-058
// Thick-wall cylinder hoop stress at the inside wall, internal pressure only.
reg(buildGenerator({ baseId: "mechmat-058", subtopic: "Thick-wall cylinder hoop stress", difficulty: "hard",
  estimatedTimeSeconds: 120,
  explanation: "\\(\\sigma_\\theta(a) = p_i (a^2 + b^2)/(b^2 - a^2)\\) for internal pressure only. Traps: invert the radius ratio, answer \\(-p_i\\), or \\(2 p_i\\)."
}, function () {
  var a = pick([4, 3]);
  var b = a + pick([2, 3]);
  var pi_ = pick([500, 800, 1000]);
  var s = pi_ * (a * a + b * b) / (b * b - a * a);
  var ans = Math.round(s).toLocaleString("en-US");
  var tInv = Math.round(pi_ * (b * b - a * a) / (a * a + b * b)).toLocaleString("en-US");
  var tNeg = MINUS + pi_.toLocaleString("en-US");
  var tDbl = (2 * pi_).toLocaleString("en-US");
  var question = "A cylinder has an inside radius of " + a.toFixed(1) + " in., outside radius of " + b.toFixed(1) + " in. and internal pressure " + pi_.toLocaleString("en-US") + " psi only. What is the hoop stress at the inside wall?";
  var solution = "Refer to Cylindrical Pressure Vessel in the Mechanics of Materials section of the FE Reference Handbook (v10.6), printed page 131 (PDF page 137).\n\n" +
    "With internal pressure only, the hoop stress is largest at the inner radius r = a.\n\n" +
    "$$\\sigma_\\theta(a) = p_i\\,\\frac{a^2 + b^2}{b^2 - a^2} = " + pi_ + "\\,\\frac{" + (a*a) + " + " + (b*b) + "}{" + (b*b) + " - " + (a*a) + "} = " + ans + "\\ \\text{psi}$$";
  return { variantKey: "a" + a + "_b" + b + "_p" + pi_,
    question: question, diagram: dMM058(a, b, pi_), options: [
      { label: ans + " psi", num: s, correct: true },
      { label: tInv + " psi", num: pi_ * (b * b - a * a) / (a * a + b * b), correct: false },
      { label: tNeg + " psi", num: -pi_, correct: false },
      { label: tDbl + " psi", num: 2 * pi_, correct: false }
    ], solution: solution };
}));

// mechmat-051 SKIPPED: conceptual question (no drillable numeric parameter),
// same rationale as the bank's own math-020 skip.

window.MECHMAT_GENERATORS = MM_ENTRIES;

})();
