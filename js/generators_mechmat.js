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
  return {
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
  return {
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
  return {
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
  return {
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
  return {
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
  explanation: "A column always buckles about its weak axis, so I_min controls — and the end condition sets K, which gets squared, so misreading the supports hurts twice.",
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
  return {
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
  return {
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
  return {
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
  return {
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
  return {
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
  return {
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
  return {
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
  explanation: "The torsion formula gives the twist in radians, so the last step is always multiplying by 180/pi — and the polar moment J uses the full diameter to the fourth power, not the radius.",
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
  return {
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
  explanation: "Bredt's formula needs the area enclosed by the wall centerline, not the outside dimensions — and don't lose the factor of 2 in the denominator.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var a = pick([120, 150, 160, 180, 200]); // mm, outer
  var b = pick([100, 120, 150, 180]);     // mm, outer
  var t = pick([4, 5, 6, 8]);             // mm, wall thickness
  var TkNm = pick([1, 1.5, 2, 2.5, 3]);   // kN-m
  var ac = a - t, bc = b - t;             // mm, centerline dimensions
  var Am = ac * bc;                       // mm^2 enclosed by the centerline
  var T = TkNm * 1e6;                     // N-mm
  var tau = T / (2 * Am * t);             // MPa
  var tNo2 = T / (Am * t);                // trap: dropped the 2 in Bredt's formula
  var tOuter = T / (2 * a * b * t);       // trap: outside dimensions for the enclosed area
  var t2t = T / (2 * Am * 2 * t);         // trap: doubled the wall thickness
  var shape = (a === b) ? "square" : "rectangular";
  var question = "A thin-walled closed " + shape + " tube with outside dimensions " + a +
    " mm × " + b + " mm and a uniform wall thickness of " + t +
    " mm is used as a sign post. It is subjected to a torque of " + fmt(TkNm) +
    " kN-m. Using Bredt's formula, what is the shear stress in the tube wall?";
  var solution = "Refer to the For Hollow, Thin-Walled Shafts section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\tau\\), the shear stress in the tube wall. Bredt's formula relates the torque to the shear flow around the section:\n\n" +
    "$$\\tau = \\frac{T}{2A_m t}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\tau\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "T &= " + fmt(TkNm) + "\\ \\text{kN-m} = " + fmt(TkNm) + "\\times 10^6\\ \\text{N-mm} \\\\\n" +
    "A_m &= (" + a + " - " + t + ")(" + b + " - " + t + ") = " + Am + "\\ \\text{mm}^2\\ \\text{(centerline)} \\\\\n" +
    "t &= " + t + "\\ \\text{mm} \\\\\n" +
    "\\tau &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\tau) = \\frac{" + fmt(TkNm) + "\\times 10^6}{2(" + Am + ")(" + t + ")} = " + fmt(tau) + "\\ \\text{MPa}$$";
  return {
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
  explanation: "The transformation equations take twice the physical angle — plug in 2theta, keep the shear term, and watch its sign.",
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
  return {
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
  return {
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
  return {
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
  return {
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
  return {
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
  return {
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
  return {
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
  return {
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
  return {
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
  return {
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
window.MECHMAT_GENERATORS = MM_ENTRIES;

})();
