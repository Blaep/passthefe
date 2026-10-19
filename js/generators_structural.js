/* PassTheFE randomized practice — Structural Engineering generators.
 *
 * Plain script (no modules) for the static site. Defines window.STRUCTURAL_GENERATORS:
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
      topic: meta.topic || "Materials",
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
            topic: meta.topic || "Materials",
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
  
  
/* PassTheFE randomized practice - Structural Engineering generators (Phase 3).
 * One entry per NUMERICAL Structural bank question (structural-036..074 per
 * p3_numeric_ids.json). Conceptual skips: 047, 048, 054-057, 059, 067, 071, 073.
 * LaTeX convention: single-backslash in JS strings ("\\(").
 */

var C_STEEL = "Refer to the Design of Steel Components section in the Civil Engineering chapter of the FE Reference Handbook (v10.6).";
var C_RC = "Refer to the Design of Reinforced Concrete Components section in the Civil Engineering chapter of the FE Reference Handbook (v10.6).";
var C_LOADS = "Refer to the Loads (ASCE 7-16) section in the Civil Engineering chapter of the FE Reference Handbook (v10.6).";

function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
function f1(x) { return (Math.round(x * 10) / 10).toFixed(1); }
function f0c(x) { return Math.round(x).toLocaleString("en-US"); }
// Bank choice style: integer-valued results print with thousands separators and
// no decimals; non-integers print one decimal (with separators when large).
function bankNum(x) {
  var r1 = Math.round(x * 10) / 10;
  if (Math.abs(r1 - Math.round(r1)) < 1e-9) return Math.round(r1).toLocaleString("en-US");
  return r1.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

var STRUCTURAL_ENTRIES = [];

/* ---- structural-036 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-036", topic: "Structural Engineering", subtopic: "Steel beam design flexural strength (yielding)",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "With continuous bracing only yielding governs, so M_n = F_y Z_x, and LRFD applies phi_b = 0.90. Skipping phi_b or leaving the answer in kip-in gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var Fy = pick([36, 50, 65]), Zx = pick([90, 100, 130, 150, 200]);
  var MpIn = Fy * Zx; // kip-in
  var Mp = MpIn / 12; // kip-ft
  var correct = 0.9 * Mp;
  var question = "A compact doubly symmetric W-shape (\\(F_y\\) = " + Fy + " ksi, \\(Z_x\\) = " + Zx + " \\(\\text{in}^3\\)) is braced continuously against lateral-torsional buckling and bent about its major axis. Using LRFD, what is the design flexural strength \\(\\phi_b M_n\\)?";
  var solution = C_STEEL + "\n\nWith continuous lateral bracing, only yielding governs: \\(M_n = M_p = F_y Z_x\\) with \\(\\phi_b = 0.90\\).\n\n$$\\phi_b M_n = 0.90(" + Fy + ")(" + Zx + ") = " + f0c(MpIn) + "\\ \\text{kip-in} = " + bankNum(correct) + "\\ \\text{kip-ft}$$";
  return {
    variantKey: "Fy" + Fy + "_Zx" + Zx,
    question: question,
    options: [
      { label: bankNum(correct) + " kip-ft", num: correct, correct: true },
      { label: bankNum(Mp) + " kip-ft", num: Mp, correct: false },
      { label: bankNum(MpIn) + " kip-ft", num: MpIn, correct: false },
      { label: bankNum(0.9 * Mp / 2) + " kip-ft", num: 0.9 * Mp / 2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- structural-037 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-037", topic: "Structural Engineering", subtopic: "Steel beam lateral-torsional buckling (Lp < Lb <= Lr)",
  difficulty: "medium", estimatedTimeSeconds: 150,
  explanation: "Because Lp < Lb <= Lr, the strength is reduced below Mp by the linear LTB equation. Using phi_b Mp alone ignores the unbraced length; stopping before phi_b is another trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var Fy = 50, Zx = pick([100, 120, 150]), Sx = pick([90, 110, 135]), Lp = pick([5, 6, 8]), Lr = pick([15, 17, 20]);
  var Lb = pick([9, 10, 12]);
  if (Lb <= Lp) Lb = Lp + 2;
  if (Lb > Lr) Lb = Lr - 2;
  var Mp = Fy * Zx / 12; // kip-ft
  var M07 = 0.7 * Fy * Sx / 12; // kip-ft
  var frac = (Lb - Lp) / (Lr - Lp);
  var Mn = Math.min(Mp, 1.0 * (Mp - (Mp - M07) * frac));
  var correct = 0.9 * Mn;
  var question = "A compact doubly symmetric W-shape (\\(F_y\\) = " + Fy + " ksi, \\(Z_x\\) = " + Zx + " \\(\\text{in}^3\\), \\(S_x\\) = " + Sx + " \\(\\text{in}^3\\)) has \\(L_p\\) = " + Lp + " ft and \\(L_r\\) = " + Lr + " ft. It is bent about its major axis with an unbraced length \\(L_b\\) = " + Lb + " ft and \\(C_b\\) = 1.0. Using LRFD, what is the design flexural strength \\(\\phi_b M_n\\)?";
  var solution = C_STEEL + "\n\nSince \\(L_p < L_b \\le L_r\\), inelastic lateral-torsional buckling governs: \\(M_n = C_b\\left[M_p - (M_p - 0.7F_yS_x)\\frac{L_b - L_p}{L_r - L_p}\\right] \\le M_p\\).\n\n$$M_p = \\frac{(" + Fy + ")(" + Zx + ")}{12} = " + f1(Mp) + "\\ \\text{kip-ft}, \\quad 0.7F_yS_x = \\frac{0.7(" + Fy + ")(" + Sx + ")}{12} = " + f1(M07) + "\\ \\text{kip-ft}$$\n$$M_n = (1.0)\\left[" + f1(Mp) + " - (" + f1(Mp) + " - " + f1(M07) + ")\\frac{" + Lb + " - " + Lp + "}{" + Lr + " - " + Lp + "}\\right] = " + f1(Mn) + "\\ \\text{kip-ft}$$\n$$\\phi_b M_n = 0.90(" + f1(Mn) + ") = " + f1(correct) + "\\ \\text{kip-ft}$$";
  return {
    variantKey: "Zx" + Zx + "_Sx" + Sx + "_Lp" + Lp + "_Lr" + Lr + "_Lb" + Lb,
    question: question,
    options: [
      { label: bankNum(correct) + " kip-ft", num: correct, correct: true },
      { label: bankNum(0.9 * Mp) + " kip-ft", num: 0.9 * Mp, correct: false },
      { label: bankNum(Mn) + " kip-ft", num: Mn, correct: false },
      { label: bankNum(0.9 * M07) + " kip-ft", num: 0.9 * M07, correct: false }
    ],
    solution: solution
  };
}));

/* ---- structural-038 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-038", topic: "Structural Engineering", subtopic: "Steel beam Cb moment-gradient factor",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Substituting the four moments into the handbook Cb equation gives the factor. Cb = 1.00 is the uniform-moment case and 1.32 is a common table value.",
  videoUrl: null, videoTitle: null
}, function () {
  var Mmax = pick([100, 120, 150]), r = pick([0.5, 0.6, 0.75, 0.9]);
  var MA = Math.round(Mmax * r), MB = Mmax, MC = MA;
  var correct = 12.5 * Mmax / (2.5 * Mmax + 3 * MA + 4 * MB + 3 * MC);
  var misorder = 12.5 * Mmax / (2.5 * Mmax + 4 * MA + 3 * MB + 3 * MC);
  var question = "In an unbraced segment of a simply supported steel beam, the absolute moments are \\(M_{max}\\) = " + Mmax + " kip-ft, \\(M_A\\) = " + MA + " kip-ft at the quarter point, \\(M_B\\) = " + MB + " kip-ft at the centerline, and \\(M_C\\) = " + MC + " kip-ft at the three-quarter point. What is the lateral-torsional buckling modification factor \\(C_b\\)?";
  var solution = C_STEEL + "\n\n$$C_b = \\frac{12.5 M_{max}}{2.5 M_{max} + 3M_A + 4M_B + 3M_C} = \\frac{12.5(" + Mmax + ")}{2.5(" + Mmax + ") + 3(" + MA + ") + 4(" + MB + ") + 3(" + MC + ")} = " + f2(correct) + "$$";
  return {
    variantKey: "M" + Mmax + "_r" + MA,
    question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: "1.00", num: 1.00, correct: false },
      { label: "1.32", num: 1.32, correct: false },
      { label: f2(misorder), num: misorder, correct: false }
    ],
    solution: solution
  };
}));

/* ---- structural-039 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-039", topic: "Structural Engineering", subtopic: "Steel I-shape design shear strength",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "The handbook web area is the full overall depth times the web thickness, with phi_v = 1.00 for rolled I-shapes. Using phi = 0.90 or dropping the 0.6 factor gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var d = pick([18, 21, 24]), tw = pick([0.35, 0.40, 0.45, 0.50]), Fy = pick([36, 50]);
  var Aw = d * tw;
  var correct = 1.0 * 0.6 * Fy * Aw; // Cv1 = 1.0
  var question = "A rolled W-shape has an overall depth d = " + d.toFixed(1) + " in. and a web thickness \\(t_w\\) = " + tw.toFixed(2) + " in. The steel has \\(F_y\\) = " + Fy + " ksi. Using LRFD, what is the design shear strength \\(\\phi_v V_n\\)?";
  var solution = C_STEEL + "\n\nFor webs of rolled I-shaped members: \\(V_n = 0.6 F_y A_w C_{v1}\\) with \\(A_w = d t_w\\), \\(C_{v1} = 1.0\\), \\(\\phi_v = 1.00\\).\n\n$$\\phi_v V_n = (1.00)(0.6)(" + Fy + ")(" + d.toFixed(1) + ")(" + tw.toFixed(2) + ") = " + f0c(correct) + "\\ \\text{kip}$$";
  return {
    variantKey: "d" + d + "_tw" + tw + "_Fy" + Fy,
    question: question,
    options: [
      { label: f0c(correct) + " kip", num: correct, correct: true },
      { label: f0c(0.9 * correct) + " kip", num: 0.9 * correct, correct: false },
      { label: f0c(correct / 0.6) + " kip", num: correct / 0.6, correct: false },
      { label: f0c(correct / 2) + " kip", num: correct / 2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- structural-040 / structural-041 ---- */
[["structural-040", [70, 80, 90], [10.6, 14.4, 17.9], "inelastic range", "KL/r is below 4.71 sqrt(E/Fy), so the inelastic equation F_cr = 0.658^(Fy/Fe) Fy applies. Using the squash load, the elastic equation, or omitting phi gives the traps."],
 ["structural-041", [130, 140, 150, 160], [9.13, 11.5, 13.0], "elastic range", "KL/r exceeds 4.71 sqrt(E/Fy), so elastic buckling governs with F_cr = 0.877 F_e. Using the inelastic equation or omitting phi gives the traps."]]
.forEach(function (cfg) {
  var baseId = cfg[0], klrList = cfg[1], agList = cfg[2], rangeName = cfg[3], expl = cfg[4];
  STRUCTURAL_ENTRIES.push(buildGenerator({
    baseId: baseId, topic: "Structural Engineering", subtopic: "Steel column flexural buckling (" + rangeName + ")",
    difficulty: "medium", estimatedTimeSeconds: 150, explanation: expl,
    videoUrl: null, videoTitle: null
  }, function () {
    var Fy = 50, E = 29000, Ag = pick(agList), klr = pick(klrList);
    var lim = 4.71 * Math.sqrt(E / Fy);
    var Fe = Math.PI * Math.PI * E / (klr * klr);
    var inelastic = klr <= lim;
    var FcrIn = Math.pow(0.658, Fy / Fe) * Fy;
    var FcrEl = 0.877 * Fe;
    var Fcr = inelastic ? FcrIn : FcrEl;
    var correct = 0.9 * Fcr * Ag;
    var question = "A steel column (\\(F_y\\) = " + Fy + " ksi, \\(A_g\\) = " + Ag + " \\(\\text{in}^2\\)) has KL/r = " + klr + ". Using LRFD, what is the design compressive strength \\(\\phi_c P_n\\) for flexural buckling? (E = 29,000 ksi; no slender elements.)";
    var solution = C_STEEL + "\n\nThe handbook slenderness limit is \\(4.71\\sqrt{E/F_y} = 4.71\\sqrt{29{,}000/" + Fy + "} = " + f1(lim) + "\\). Since KL/r = " + klr + (inelastic ? " \\le " : " > ") + f1(lim) + ", use " + (inelastic ? "\\(F_{cr} = 0.658^{F_y/F_e} F_y\\)" : "\\(F_{cr} = 0.877 F_e\\)") + ".\n\n$$F_e = \\frac{\\pi^2 E}{(KL/r)^2} = \\frac{\\pi^2(29{,}000)}{(" + klr + ")^2} = " + f2(Fe) + "\\ \\text{ksi}$$\n$$F_{cr} = " + f2(Fcr) + "\\ \\text{ksi}, \\quad \\phi_c P_n = 0.90(" + f2(Fcr) + ")(" + Ag + ") = " + f0c(correct) + "\\ \\text{kip}$$";
    return {
      variantKey: "Ag" + Ag + "_klr" + klr,
      question: question,
      options: [
        { label: f0c(correct) + " kip", num: correct, correct: true },
        { label: f0c(0.9 * Fy * Ag) + " kip", num: 0.9 * Fy * Ag, correct: false },
        { label: f0c(0.9 * (inelastic ? FcrEl : FcrIn) * Ag) + " kip", num: 0.9 * (inelastic ? FcrEl : FcrIn) * Ag, correct: false },
        { label: f0c(Fcr * Ag) + " kip", num: Fcr * Ag, correct: false }
      ],
      solution: solution
    };
  }));
});

/* ---- structural-042 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-042", topic: "Structural Engineering", subtopic: "Reinforced concrete tied column axial capacity",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "The tied-column maximum includes the 0.80 factor and phi = 0.65. Dropping the 0.80, stopping before phi, or using phi = 0.90 gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var b = pick([14, 16, 18]), Ast = pick([4.0, 6.32, 8.0]), fc = pick([4, 5, 6]), fy = 60;
  var Ag = b * b;
  var Pn = 0.80 * (0.85 * fc * (Ag - Ast) + Ast * fy);
  var correct = 0.65 * Pn;
  var question = "A " + b + " in. x " + b + " in. tied short column is reinforced with \\(A_{st}\\) = " + Ast + " \\(\\text{in}^2\\). The concrete has \\(f'_c\\) = " + fc + " ksi and the bars have \\(f_y\\) = " + fy + " ksi. Under pure axial load, what is the design axial strength \\(\\phi P_n\\) (maximum permitted by the handbook for a tied column)? Use ACI 318-14.";
  var solution = C_RC + "\n\nFor tied columns: \\(P_n = 0.80\\left[0.85 f'_c (A_g - A_{st}) + A_{st} f_y\\right]\\) with \\(\\phi = 0.65\\).\n\n$$P_n = 0.80\\left[0.85(" + fc + ")(" + Ag + " - " + Ast + ") + (" + Ast + ")(" + fy + ")\\right] = " + f0c(Pn) + "\\ \\text{kip}$$\n$$\\phi P_n = 0.65(" + f0c(Pn) + ") = " + f0c(correct) + "\\ \\text{kip}$$";
  return {
    variantKey: "b" + b + "_Ast" + Ast + "_fc" + fc,
    question: question,
    options: [
      { label: f0c(correct) + " kip", num: correct, correct: true },
      { label: f0c(0.65 * Pn / 0.8) + " kip", num: 0.65 * Pn / 0.8, correct: false },
      { label: f0c(Pn) + " kip", num: Pn, correct: false },
      { label: f0c(0.9 * Pn) + " kip", num: 0.9 * Pn, correct: false }
    ],
    solution: solution
  };
}));

/* ---- structural-043 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-043", topic: "Structural Engineering", subtopic: "RC beam design flexural strength with strain check",
  difficulty: "hard", estimatedTimeSeconds: 180,
  explanation: "Check the net tensile strain to pick phi: with eps_t >= 0.005 the section is tension-controlled and phi = 0.90. Using phi = 0.65, stopping at M_n, or using the full a in the lever arm gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var b = pick([12, 14, 16]), d = pick([18, 21.5, 24]), As = pick([2.0, 3.0, 4.0]), fc = 4000, fy = 60000;
  var a = As * fy / (0.85 * fc * b);
  var Mn = As * fy * (d - a / 2) / 12000; // kip-ft
  var beta1 = 0.85;
  var c = a / beta1;
  var eps = 0.003 * (d - c) / c;
  var phi = eps >= 0.005 ? 0.9 : 0.65;
  var correct = phi * Mn;
  var question = "A singly reinforced rectangular beam has b = " + b + " in., d = \\(d_t\\) = " + d + " in., \\(A_s\\) = " + As.toFixed(2) + " \\(\\text{in}^2\\), \\(f'_c\\) = 4,000 psi, and \\(f_y\\) = 60,000 psi. What is the design flexural strength \\(\\phi M_n\\)? Use ACI 318-14.";
  var solution = C_RC + "\n\n$$a = \\frac{A_s f_y}{0.85 f'_c b} = \\frac{(" + As.toFixed(2) + ")(60{,}000)}{0.85(4{,}000)(" + b + ")} = " + a.toFixed(3) + "\\ \\text{in}$$\n$$c = a/\\beta_1 = " + (c).toFixed(2) + "\\ \\text{in}, \\quad \\varepsilon_t = \\frac{0.003(d_t - c)}{c} = " + eps.toFixed(4) + (eps >= 0.005 ? " \\ge 0.005 \\Rightarrow \\phi = 0.90" : " < 0.005 \\Rightarrow \\phi = 0.65") + "$$\n$$M_n = A_s f_y\\left(d - \\frac{a}{2}\\right) = " + f1(Mn) + "\\ \\text{kip-ft}, \\quad \\phi M_n = " + phi.toFixed(2) + "(" + f1(Mn) + ") = " + f1(correct) + "\\ \\text{kip-ft}$$";
  return {
    variantKey: "b" + b + "_d" + d + "_As" + As,
    question: question,
    options: [
      { label: f1(correct) + " kip-ft", num: correct, correct: true },
      { label: f1(Mn) + " kip-ft", num: Mn, correct: false },
      { label: f1((phi === 0.9 ? 0.65 : 0.9) * Mn) + " kip-ft", num: (phi === 0.9 ? 0.65 : 0.9) * Mn, correct: false },
      { label: f1(As * fy * (d - a) / 12000) + " kip-ft", num: As * fy * (d - a) / 12000, correct: false }
    ],
    solution: solution
  };
}));

/* ---- structural-044 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-044", topic: "Structural Engineering", subtopic: "RC beam stirrup spacing (required vs maximum)",
  difficulty: "hard", estimatedTimeSeconds: 180,
  explanation: "Required spacing from Vs comes out larger than the ACI maximum (d/2 when Vs <= 4 sqrt(f'c) bw d), so the maximum governs. Reporting the required spacing or d/4 gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var bw = pick([10, 12]), d = pick([18, 22, 26]), fc = 4000, fy = 60000, Av = 0.22, Vu = pick([30, 40, 50]);
  var rtfc = Math.sqrt(fc);
  var Vc = 2 * rtfc * bw * d / 1000; // kip
  var Vs = Vu / 0.75 - Vc;
  var sReq = Av * fy * d / (Vs * 1000); // in.
  var lim4 = 4 * rtfc * bw * d / 1000;
  var smax = Vs <= lim4 ? Math.min(d / 2, 24) : Math.min(d / 4, 12);
  var correct = Math.min(sReq, smax);
  var question = "A normal-weight concrete beam has \\(b_w\\) = " + bw + " in., d = " + d + " in., \\(f'_c\\) = 4,000 psi, and #3 U-stirrups (\\(A_v\\) = 0.22 \\(\\text{in}^2\\), two legs) with \\(f_y\\) = 60,000 psi. The factored shear at the critical section is \\(V_u\\) = " + Vu.toFixed(1) + " kip. What stirrup spacing should be used? Use ACI 318-14.";
  var solution = C_RC + "\n\n$$V_c = 2\\sqrt{f'_c}\\, b_w d = 2\\sqrt{4{,}000}(" + bw + ")(" + d + ")/1000 = " + f1(Vc) + "\\ \\text{kip}$$\n$$V_s = \\frac{V_u}{\\phi} - V_c = \\frac{" + Vu.toFixed(1) + "}{0.75} - " + f1(Vc) + " = " + f1(Vs) + "\\ \\text{kip}$$\nRequired: \\(s = \\frac{A_v f_y d}{V_s} = " + f1(sReq) + "\\) in. Since \\(V_s " + (Vs <= lim4 ? "\\le" : ">") + " 4\\sqrt{f'_c} b_w d = " + f1(lim4) + "\\) kip, \\(s_{max} = " + (Vs <= lim4 ? "d/2 \\le 24" : "d/4 \\le 12") + " = " + f1(smax) + "\\) in. Governs: \\(" + f1(correct) + "\\) in.";
  return {
    variantKey: "bw" + bw + "_d" + d + "_Vu" + Vu,
    question: question,
    options: [
      { label: f1(correct) + " in.", num: correct, correct: true },
      { label: f1(Math.abs(sReq - correct) >= 0.2 ? sReq : correct + 1.5) + " in.", num: Math.abs(sReq - correct) >= 0.2 ? sReq : correct + 1.5, correct: false },
      { label: bankNum(d / 4) + " in.", num: d / 4, correct: false },
      { label: bankNum(Av * fy / (50 * bw)) + " in.", num: Av * fy / (50 * bw), correct: false }
    ],
    solution: solution
  };
}));

/* ---- structural-045 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-045", topic: "Structural Engineering", subtopic: "Tributary width and LRFD factored moment",
  difficulty: "easy", estimatedTimeSeconds: 120,
  explanation: "The tributary width is the beam spacing, the factored load is (1.2D + 1.6L) times that width, and Mu = wu L^2 / 8 for a simple span. Skipping the load factors or the tributary width gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var L = pick([24, 30, 36]), s = pick([6, 8, 10]), D = pick([80, 90, 100]), Ll = pick([50, 60, 80]);
  var wu = (1.2 * D + 1.6 * Ll) * s; // plf
  var correct = wu * L * L / 8 / 1000; // kip-ft
  var wSer = (D + Ll) * s;
  var question = "An interior simply supported floor beam spans " + L + " ft and is spaced " + s + " ft on center from parallel beams. The floor carries a dead load of " + D + " psf and a live load of " + Ll + " psf (no live load reduction). Using the LRFD combination 1.2D + 1.6L, what is the maximum factored moment?";
  var solution = C_LOADS + "\n\n$$w_u = (1.2D + 1.6L)(\\text{tributary width}) = [1.2(" + D + ") + 1.6(" + Ll + ")](" + s + ") = " + f0c(wu) + "\\ \\text{lb/ft}$$\n$$M_u = \\frac{w_u L^2}{8} = \\frac{" + f0c(wu) + "(" + L + ")^2}{8} = " + f1(correct) + "\\ \\text{kip-ft}$$";
  return {
    variantKey: "L" + L + "_s" + s + "_D" + D + "_L" + Ll,
    question: question, diagram: dPlanView(s, L),
    options: [
      { label: f1(correct) + " kip-ft", num: correct, correct: true },
      { label: f1(wSer * L * L / 8 / 1000) + " kip-ft", num: wSer * L * L / 8 / 1000, correct: false },
      { label: f1(correct / 2) + " kip-ft", num: correct / 2, correct: false },
      { label: f1(correct * 2) + " kip-ft", num: correct * 2, correct: false }
    ],
    solution: solution
  };
}));

/* ================= structural batch 2: 046-074 ================= */

function dPlanView(s, L) {
  var g = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Plan view of an interior floor beam spanning ' + L + ' feet between girders, beams spaced ' + s + ' feet on center"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  g += '<line x1="60" y1="50" x2="420" y2="50" stroke="#1a1a1a" stroke-width="4"/><line x1="60" y1="190" x2="420" y2="190" stroke="#1a1a1a" stroke-width="4"/>';
  g += '<text x="425" y="54" font-family="Helvetica,Arial,sans-serif" font-size="12">girder</text><text x="425" y="194" font-family="Helvetica,Arial,sans-serif" font-size="12">girder</text>';
  var xs = [100, 180, 260, 340];
  for (var i = 0; i < xs.length; i++) { g += '<line x1="' + xs[i] + '" y1="50" x2="' + xs[i] + '" y2="190" stroke="' + (i === 1 ? "#c0392b" : "#6b7280") + '" stroke-width="' + (i === 1 ? 3 : 1.5) + '"/>'; }
  g += '<text x="150" y="125" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#c0392b">interior floor beam</text>';
  g += '<line x1="180" y1="205" x2="260" y2="205" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="205" y="222" font-family="Helvetica,Arial,sans-serif" font-size="12">' + s + ' ft</text>';
  g += '<line x1="35" y1="50" x2="35" y2="190" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="5" y="125" font-family="Helvetica,Arial,sans-serif" font-size="12">span = ' + L + ' ft</text>';
  g += '<text x="380" y="222" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#6b7280">plan view</text>';
  return svgURL(g + '</svg>');
}
function dFixedFixed(L, w) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Beam fixed at both ends, span ' + L + ' feet, uniform load ' + w + ' kips per foot"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<rect x="60" y="100" width="20" height="60" fill="#9ca3af" stroke="#1a1a1a" stroke-width="2"/><rect x="400" y="100" width="20" height="60" fill="#9ca3af" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="80" y1="130" x2="400" y2="130" stroke="#1a1a1a" stroke-width="4"/>';
  for (var x = 95; x <= 390; x += 33) { s += '<line x1="' + x + '" y1="85" x2="' + x + '" y2="120" stroke="#1d4ed8" stroke-width="2" marker-end="url(#ah)"/>'; }
  s += '<line x1="90" y1="85" x2="395" y2="85" stroke="#1d4ed8" stroke-width="2"/>';
  s += '<text x="200" y="75" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1d4ed8">' + w + ' kip/ft</text>';
  s += '<line x1="80" y1="185" x2="400" y2="185" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="225" y="205" font-family="Helvetica,Arial,sans-serif" font-size="13">' + L + ' ft</text>';
  return svgURL(s + '</svg>');
}
function dIShape(d, tw) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img" aria-label="Rolled I-shape cross section with overall depth d equal to ' + d + ' inches and web thickness tw equal to ' + tw + ' inches"><rect width="480" height="260" fill="#ffffff"/>' + AH;
  s += '<rect x="190" y="40" width="100" height="18" fill="#d1d5db" stroke="#1a1a1a" stroke-width="2"/><rect x="232" y="58" width="16" height="144" fill="#e5e7eb" stroke="#1a1a1a" stroke-width="2"/><rect x="190" y="202" width="100" height="18" fill="#d1d5db" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="150" y1="40" x2="150" y2="220" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="85" y="135" font-family="Helvetica,Arial,sans-serif" font-size="13">d = ' + d.toFixed(1) + ' in.</text>';
  s += '<line x1="232" y1="238" x2="248" y2="238" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="258" y="242" font-family="Helvetica,Arial,sans-serif" font-size="13">tw = ' + tw + ' in.</text>';
  return svgURL(s + '</svg>');
}
function dCbSegment() {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Unbraced beam segment with braces at both ends, points A at the quarter point, B at the center and C at the three-quarter point"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<polygon points="70,80 55,110 85,110" fill="#9ca3af" stroke="#1a1a1a" stroke-width="2"/><polygon points="410,80 395,110 425,110" fill="#9ca3af" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="60" y="70" font-family="Helvetica,Arial,sans-serif" font-size="12">brace</text><text x="390" y="70" font-family="Helvetica,Arial,sans-serif" font-size="12">brace</text>';
  s += '<line x1="70" y1="110" x2="410" y2="110" stroke="#1a1a1a" stroke-width="4"/>';
  var pts = [[155, 'A'], [240, 'B'], [325, 'C']];
  for (var i = 0; i < pts.length; i++) { s += '<line x1="' + pts[i][0] + '" y1="102" x2="' + pts[i][0] + '" y2="118" stroke="#c0392b" stroke-width="3"/><text x="' + (pts[i][0] - 5) + '" y="140" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#c0392b">' + pts[i][1] + '</text>'; }
  s += '<path d="M 70 155 Q 240 210 410 155" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-dasharray="6,4"/>';
  s += '<text x="130" y="200" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">|M| diagram: Mmax, MA, MB, MC = absolute moments</text>';
  return svgURL(s + '</svg>');
}
function dBeamSection(b, d, As) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img" aria-label="Rectangular concrete beam section ' + b + ' inches wide with effective depth ' + d + ' inches to the centroid of the tension steel As"><rect width="480" height="260" fill="#ffffff"/>' + AH;
  s += '<rect x="180" y="40" width="120" height="180" fill="#e5e7eb" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<circle cx="215" cy="195" r="7" fill="#374151"/><circle cx="265" cy="195" r="7" fill="#374151"/>';
  s += '<text x="310" y="200" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#374151">tension steel As = ' + As.toFixed(1) + ' in\u00B2</text>';
  s += '<line x1="180" y1="238" x2="300" y2="238" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="220" y="255" font-family="Helvetica,Arial,sans-serif" font-size="13">b = ' + b + ' in.</text>';
  s += '<line x1="150" y1="40" x2="150" y2="198" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="70" y="125" font-family="Helvetica,Arial,sans-serif" font-size="13">d = ' + d + ' in.</text>';
  return svgURL(s + '</svg>');
}
function dColumn(L) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img" aria-label="Steel column of length ' + L + ' feet with pinned ends at top and bottom carrying an axial load"><rect width="480" height="260" fill="#ffffff"/>' + AH;
  s += '<polygon points="240,60 225,35 255,35" fill="#9ca3af" stroke="#1a1a1a" stroke-width="2"/><line x1="240" y1="60" x2="240" y2="200" stroke="#1a1a1a" stroke-width="6"/><polygon points="240,200 225,225 255,225" fill="#9ca3af" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="240" y1="10" x2="240" y2="30" stroke="#c0392b" stroke-width="3" marker-end="url(#ah)"/><text x="252" y="22" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#c0392b">P</text>';
  s += '<line x1="300" y1="60" x2="300" y2="200" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="310" y="135" font-family="Helvetica,Arial,sans-serif" font-size="13">L = ' + L + ' ft</text>';
  s += '<text x="180" y="248" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">pinned - both ends</text>';
  return svgURL(s + '</svg>');
}

/* ---- structural-046 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-046", topic: "Structural Engineering", subtopic: "Steel tension member strength (yielding vs rupture with shear lag)",
  difficulty: "medium", estimatedTimeSeconds: 150,
  explanation: "Check both limit states: yielding on the gross area and rupture on the effective net area with U = 1 - x/L. Forgetting the shear lag factor or omitting phi gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var pair = pick([[3.5, 3.0], [3.0, 2.5], [4.0, 3.5]]), Ag = pair[0], An = pair[1];
  var x = pick([0.8, 0.9, 1.0]), L = pick([4.0, 4.5, 5.0]), Fy = 36, Fu = 58;
  var U = 1 - x / L;
  var yieldP = 0.9 * Fy * Ag, ruptP = 0.75 * Fu * U * An;
  var correct = Math.min(yieldP, ruptP);
  var question = "A bolted angle tension member has \\(A_g\\) = " + Ag.toFixed(2) + " \\(\\text{in}^2\\) and net area \\(A_n\\) = " + An.toFixed(2) + " \\(\\text{in}^2\\). The connection eccentricity is x = " + x.toFixed(2) + " in. and the connection length is L = " + L.toFixed(2) + " in. The steel has \\(F_y\\) = 36 ksi and \\(F_u\\) = 58 ksi. Using LRFD and ignoring block shear, what is the design tensile strength?";
  var solution = C_STEEL + "\n\nShear lag: \\(U = 1 - x/L = 1 - " + x.toFixed(2) + "/" + L.toFixed(2) + " = " + f2(U) + "\\).\n\nYielding: \\(\\phi_t P_n = 0.90 F_y A_g = 0.90(36)(" + Ag.toFixed(2) + ") = " + f1(yieldP) + "\\) kip. Rupture: \\(\\phi_t P_n = 0.75 F_u U A_n = 0.75(58)(" + f2(U) + ")(" + An.toFixed(2) + ") = " + f1(ruptP) + "\\) kip.\n\nGoverns: \\(" + f1(correct) + "\\) kip (" + (ruptP < yieldP ? "rupture" : "yielding") + ").";
  return { variantKey: "Ag" + Ag + "_x" + x + "_L" + L, question: question,
    options: [
      { label: f1(correct) + " kip", num: correct, correct: true },
      { label: f1(Math.max(yieldP, ruptP)) + " kip", num: Math.max(yieldP, ruptP), correct: false },
      { label: f1(0.75 * Fu * An) + " kip", num: 0.75 * Fu * An, correct: false },
      { label: f1(Fy * Ag) + " kip", num: Fy * Ag, correct: false }
    ], solution: solution };
}));

/* ---- structural-049 / 050 / 051 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-049", topic: "Structural Engineering", subtopic: "LRFD combination governing",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Evaluate the handbook LRFD basic combinations that involve only D, L and Lr and take the largest. The unfactored sum is not a strength combination.",
  videoUrl: null, videoTitle: null
}, function () {
  var D = pick([30, 40, 50]), L = pick([50, 60, 70]), Lr = pick([15, 20, 25]);
  var c1 = 1.4 * D, c2 = 1.2 * D + 1.6 * L + 0.5 * Lr, c3 = 1.2 * D + 1.6 * Lr + 1.0 * L;
  var correct = Math.max(c1, c2, c3);
  var question = "A floor beam carries nominal loads of D = " + D + " kip, L = " + L + " kip and Lr = " + Lr + " kip. Using the handbook LRFD basic combinations that involve only D, L and Lr, what is the governing factored load?";
  var solution = C_LOADS + "\n\n$$1.4D = " + f0c(c1) + ", \\quad 1.2D + 1.6L + 0.5L_r = " + f0c(c2) + ", \\quad 1.2D + 1.6L_r + 1.0L = " + f0c(c3) + "\\ \\text{kip}$$\nGoverns: \\(" + f0c(correct) + "\\) kip.";
  return { variantKey: "D" + D + "_L" + L + "_Lr" + Lr, question: question,
    options: [
      { label: f0c(correct) + " kip", num: correct, correct: true },
      { label: f0c(D + L) + " kip", num: D + L, correct: false },
      { label: f0c(c3) + " kip", num: c3, correct: false },
      { label: f0c(c1) + " kip", num: c1, correct: false }
    ], solution: solution };
}));
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-050", topic: "Structural Engineering", subtopic: "Uplift combination with wind",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Wind uplift opposes dead load, so the 0.9D + 1.0W combination with the smaller dead-load factor checks uplift. Using 1.2D, ignoring the load factor, or adding W downward gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var D = pick([40, 50, 60]), W = pick([30, 40, 50]);
  var correct = 0.9 * D - W;
  var question = "A roof connection has a nominal dead load of " + D + " kip downward and a nominal wind uplift of " + W + " kip. Using the handbook LRFD combination 0.9D + 1.0W, taking uplift as negative, what is the factored net force (positive downward)?";
  var solution = C_LOADS + "\n\n$$0.9D + 1.0W = 0.9(" + D + ") - (" + W + ") = " + f0c(correct) + "\\ \\text{kip}$$";
  return { variantKey: "D" + D + "_W" + W, question: question,
    options: [
      { label: f0c(correct) + " kip", num: correct, correct: true },
      { label: f0c(1.2 * D - W) + " kip", num: 1.2 * D - W, correct: false },
      { label: f0c(D - W) + " kip", num: D - W, correct: false },
      { label: f0c(0.9 * D + W) + " kip", num: 0.9 * D + W, correct: false }
    ], solution: solution };
}));
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-051", topic: "Structural Engineering", subtopic: "ASD combination",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Evaluate D + L, D + Lr and D + 0.75L + 0.75Lr and take the largest. Adding all three loads at full value is not one of the handbook combinations.",
  videoUrl: null, videoTitle: null
}, function () {
  var D = pick([15, 20, 25]), L = pick([40, 50, 60]), Lr = pick([10, 12, 15]);
  var c1 = D + L, c2 = D + Lr, c3 = D + 0.75 * L + 0.75 * Lr;
  var correct = Math.max(c1, c2, c3);
  var question = "Nominal loads on a column are D = " + D + " kip, L = " + L + " kip and Lr = " + Lr + " kip. Using the handbook ASD combinations D + L, D + (Lr or S or R) and D + 0.75L + 0.75(Lr or S or R), what is the governing allowable-stress-design load?";
  var solution = C_LOADS + "\n\n$$D + L = " + bankNum(c1) + ", \\quad D + L_r = " + bankNum(c2) + ", \\quad D + 0.75L + 0.75L_r = " + bankNum(c3) + "\\ \\text{kip}$$\nGoverns: \\(" + bankNum(correct) + "\\) kip.";
  return { variantKey: "D" + D + "_L" + L + "_Lr" + Lr, question: question,
    options: [
      { label: bankNum(correct) + " kip", num: correct, correct: true },
      { label: bankNum(c3) + " kip", num: c3, correct: false },
      { label: bankNum(c2) + " kip", num: c2, correct: false },
      { label: bankNum(D + L + Lr) + " kip", num: D + L + Lr, correct: false }
    ], solution: solution };
}));

/* ---- structural-052 / 053 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-052", topic: "Structural Engineering", subtopic: "Live load reduction, beam",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "For a beam K_LL = 2; using the column value K_LL = 4, leaving K_LL out, or dropping the 0.25 term gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var AT = pick([400, 600, 800]), Lo = pick([40, 50, 60]);
  var red = function (k) { return Lo * (0.25 + 15 / Math.sqrt(k * AT)); };
  var correct = Math.max(red(2), 0.5 * Lo);
  var question = "A typical floor beam supports a tributary area of " + AT + " ft\u00B2 and the unreduced floor live load is " + Lo + " psf. Using the handbook live load reduction model for a member supporting one floor, what is the reduced live load?";
  var solution = C_LOADS + "\n\nFor a beam, \\(K_{LL} = 2\\).\n\n$$L = L_o\\left(0.25 + \\frac{15}{\\sqrt{K_{LL} A_T}}\\right) = " + Lo + "\\left(0.25 + \\frac{15}{\\sqrt{2 \\times " + AT + "}}\\right) = " + f1(correct) + "\\ \\text{psf}$$\n(and \\(L \\ge 0.5 L_o\\) for a member supporting one floor).";
  return { variantKey: "AT" + AT + "_Lo" + Lo, question: question,
    options: [
      { label: f1(correct) + " psf", num: correct, correct: true },
      { label: f1(red(4)) + " psf", num: red(4), correct: false },
      { label: f1(red(1)) + " psf", num: red(1), correct: false },
      { label: f1(Lo * 15 / Math.sqrt(2 * AT)) + " psf", num: Lo * 15 / Math.sqrt(2 * AT), correct: false }
    ], solution: solution };
}));
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-053", topic: "Structural Engineering", subtopic: "Flat roof snow load",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "For a fully exposed, unheated structure in open terrain: Ce = 0.9, Ct = 1.2. Using Ce = Ct = 1.0 or swapping one factor gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var pg = pick([20, 30, 40]);
  var pf = function (ce, ct) { return 0.7 * ce * ct * 1.0 * pg; };
  var correct = pf(0.9, 1.2);
  var question = "A fully exposed, unheated open-air shelter in open terrain (Terrain C) has a ground snow load of " + pg + " psf and importance factor Is = 1.0. Using the handbook, what is the flat roof snow load?";
  var solution = C_LOADS + "\n\nFully exposed in Terrain C: \\(C_e = 0.9\\); unheated, open-air: \\(C_t = 1.2\\).\n\n$$p_f = 0.7 C_e C_t I_s p_g = 0.7(0.9)(1.2)(1.0)(" + pg + ") = " + f1(correct) + "\\ \\text{psf}$$";
  return { variantKey: "pg" + pg, question: question,
    options: [
      { label: f1(correct) + " psf", num: correct, correct: true },
      { label: f1(pf(1.0, 1.0)) + " psf", num: pf(1.0, 1.0), correct: false },
      { label: f1(pf(0.9, 1.0)) + " psf", num: pf(0.9, 1.0), correct: false },
      { label: f1(pf(1.0, 1.2)) + " psf", num: pf(1.0, 1.2), correct: false }
    ], solution: solution };
}));

/* ---- structural-058 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-058", topic: "Structural Engineering", subtopic: "Fixed-end moment, uniform load",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "wL^2/12 is the fixed-end value; wL^2/8 is the simply supported midspan moment.",
  videoUrl: null, videoTitle: null
}, function () {
  var L = pick([16, 20, 24, 30]), w = pick([2, 3, 4]);
  var correct = w * L * L / 12;
  var question = "A fixed-fixed beam spans " + L + " ft and carries a uniform load of " + w + " kip/ft. Using the handbook fixed-end moment formula, what is the magnitude of the end moment?";
  var solution = C_LOADS + "\n\n$$FEM = \\frac{wL^2}{12} = \\frac{(" + w + ")(" + L + ")^2}{12} = " + bankNum(correct) + "\\ \\text{kip-ft}$$";
  return { variantKey: "L" + L + "_w" + w, question: question, diagram: dFixedFixed(L, w),
    options: [
      { label: bankNum(correct) + " kip-ft", num: correct, correct: true },
      { label: bankNum(w * L * L / 8) + " kip-ft", num: w * L * L / 8, correct: false },
      { label: bankNum(w * L * L / 24) + " kip-ft", num: w * L * L / 24, correct: false },
      { label: bankNum(w * L * L / 2) + " kip-ft", num: w * L * L / 2, correct: false }
    ], solution: solution };
}));

/* ---- structural-060 / 061 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-060", topic: "Structural Engineering", subtopic: "Plastic moment capacity",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Fully braced compact shape: phi_b Mn = phi_b Fy Zx with phi_b = 0.90. The nominal Mp without phi, the ASD allowable, and applying phi twice are the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var Fy = 50, Zx = pick([150, 200, 250]);
  var Mp = Fy * Zx / 12;
  var correct = 0.9 * Mp;
  var question = "A compact W-shape has Fy = " + Fy + " ksi and Zx = " + Zx + " in\u00B3 and is fully braced (\\(L_b \\le L_p\\)). Using the handbook with \\(\\phi_b = 0.90\\), what is the design flexural strength \\(\\phi_b M_n\\)?";
  var solution = C_STEEL + "\n\n$$\\phi_b M_n = \\phi_b F_y Z_x = 0.90(" + Fy + ")(" + Zx + ") = " + f0c(0.9 * Fy * Zx) + "\\ \\text{kip-in} = " + bankNum(correct) + "\\ \\text{kip-ft}$$";
  return { variantKey: "Zx" + Zx, question: question,
    options: [
      { label: bankNum(correct) + " kip-ft", num: correct, correct: true },
      { label: bankNum(Mp) + " kip-ft", num: Mp, correct: false },
      { label: bankNum(Mp / 1.67) + " kip-ft", num: Mp / 1.67, correct: false },
      { label: bankNum(0.81 * Mp) + " kip-ft", num: 0.81 * Mp, correct: false }
    ], solution: solution };
}));
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-061", topic: "Structural Engineering", subtopic: "ASD allowable moment",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Omega = 1.67 for flexure. The 1.50 factor is the shear Omega, and phi_b = 0.90 belongs to LRFD.",
  videoUrl: null, videoTitle: null
}, function () {
  var Fy = 50, Zx = pick([150, 200, 250]);
  var Mp = Fy * Zx / 12;
  var correct = Mp / 1.67;
  var question = "For a W-shape (\\(F_y\\) = " + Fy + " ksi, \\(Z_x\\) = " + Zx + " \\(\\text{in}^3\\), fully braced), what is the ASD allowable flexural strength \\(M_n/\\Omega_b\\) using the handbook value of \\(\\Omega\\)?";
  var solution = C_STEEL + "\n\n$$\\frac{M_n}{\\Omega_b} = \\frac{F_y Z_x}{1.67} = \\frac{(" + Fy + ")(" + Zx + ")}{1.67 \\times 12} = " + bankNum(correct) + "\\ \\text{kip-ft}$$";
  return { variantKey: "Zx" + Zx, question: question,
    options: [
      { label: bankNum(correct) + " kip-ft", num: correct, correct: true },
      { label: bankNum(Mp) + " kip-ft", num: Mp, correct: false },
      { label: bankNum(0.9 * Mp) + " kip-ft", num: 0.9 * Mp, correct: false },
      { label: bankNum(Mp / 1.5) + " kip-ft", num: Mp / 1.5, correct: false }
    ], solution: solution };
}));

/* ---- structural-062 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-062", topic: "Structural Engineering", subtopic: "Web shear strength",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "phi_v = 1.00 for rolled I-shaped webs, so no 0.90 reduction applies. The ASD value with Omega = 1.50 and dropping the 0.6 factor are the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var d = pick([18, 21, 24]), tw = pick([0.4, 0.5, 0.6]), Fy = pick([36, 50]);
  var correct = 0.6 * Fy * d * tw;
  var question = "A rolled I-shape has overall depth " + d.toFixed(1) + " in., web thickness " + tw + " in. and \\(F_y\\) = " + Fy + " ksi. Using the handbook shear provisions for rolled I-shaped webs, what is the LRFD design shear strength?";
  var solution = C_STEEL + "\n\n$$\\phi_v V_n = (1.00)(0.6 F_y)(d t_w) = 0.6(" + Fy + ")(" + d.toFixed(1) + ")(" + tw + ") = " + f0c(correct) + "\\ \\text{kip}$$";
  return { variantKey: "d" + d + "_tw" + tw + "_Fy" + Fy, question: question, diagram: dIShape(d, tw),
    options: [
      { label: f0c(correct) + " kip", num: correct, correct: true },
      { label: f0c(0.9 * correct) + " kip", num: 0.9 * correct, correct: false },
      { label: f0c(correct / 0.6) + " kip", num: correct / 0.6, correct: false },
      { label: f0c(correct / 1.5) + " kip", num: correct / 1.5, correct: false }
    ], solution: solution };
}));

/* ---- structural-063 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-063", topic: "Structural Engineering", subtopic: "Cb for a moment diagram",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Every term in the denominator is needed. Dropping MC gives a larger Cb, the reciprocal gives a value below 1, and using MA for all three points ignores the centerline moment.",
  videoUrl: null, videoTitle: null
}, function () {
  var Mmax = pick([100, 120, 150]), r = pick([0.5, 0.6, 0.75, 0.9]);
  var MA = Math.round(Mmax * r), MB = Mmax, MC = MA;
  var correct = 12.5 * Mmax / (2.5 * Mmax + 3 * MA + 4 * MB + 3 * MC);
  var dropC = 12.5 * Mmax / (2.5 * Mmax + 3 * MA + 4 * MB);
  var allA = 12.5 * Mmax / (2.5 * Mmax + 3 * MA + 4 * MA + 3 * MA);
  var question = "In an unbraced segment, the absolute moments are Mmax = " + Mmax + " kip-ft, \\(M_A\\) = " + MA + " kip-ft at the quarter point, \\(M_B\\) = " + MB + " kip-ft at the center and \\(M_C\\) = " + MC + " kip-ft at the three-quarter point. Using the handbook equation, what is \\(C_b\\)?";
  var solution = C_STEEL + "\n\n$$C_b = \\frac{12.5 M_{max}}{2.5 M_{max} + 3M_A + 4M_B + 3M_C} = \\frac{12.5(" + Mmax + ")}{2.5(" + Mmax + ") + 3(" + MA + ") + 4(" + MB + ") + 3(" + MC + ")} = " + f2(correct) + "$$";
  return { variantKey: "M" + Mmax + "_r" + MA, question: question, diagram: dCbSegment(),
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(1 / correct), num: 1 / correct, correct: false },
      { label: f2(dropC), num: dropC, correct: false },
      { label: f2(allA), num: allA, correct: false }
    ], solution: solution };
}));

/* ---- structural-064 / 065 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-064", topic: "Structural Engineering", subtopic: "Column critical stress",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "0.877Fe applies only above the slenderness limit 4.71 sqrt(E/Fy). Fe itself is the elastic Euler stress, and Fy is the upper bound Fcr does not reach.",
  videoUrl: null, videoTitle: null
}, function () {
  var klr = pick([60, 80, 100]), Fy = pick([36, 50]);
  var Fe = Math.PI * Math.PI * 29000 / (klr * klr);
  var lim = 4.71 * Math.sqrt(29000 / Fy);
  var Fcr = klr <= lim ? Math.pow(0.658, Fy / Fe) * Fy : 0.877 * Fe;
  var question = "A steel column without slender elements has KL/r = " + klr + " and \\(F_y\\) = " + Fy + " ksi (E = 29,000 ksi). Using the handbook, what is the critical stress \\(F_{cr}\\)?";
  var solution = C_STEEL + "\n\n\\(4.71\\sqrt{E/F_y} = " + f1(lim) + "\\); KL/r = " + klr + (klr <= lim ? " \\le " : " > ") + f1(lim) + ".\n\n$$F_e = \\frac{\\pi^2 E}{(KL/r)^2} = " + f1(Fe) + "\\ \\text{ksi}, \\quad F_{cr} = " + (klr <= lim ? "0.658^{F_y/F_e} F_y" : "0.877 F_e") + " = " + f1(Fcr) + "\\ \\text{ksi}$$";
  return { variantKey: "klr" + klr + "_Fy" + Fy, question: question,
    options: [
      { label: f1(Fcr) + " ksi", num: Fcr, correct: true },
      { label: f1(0.877 * Fe) + " ksi", num: 0.877 * Fe, correct: false },
      { label: f1(Fe) + " ksi", num: Fe, correct: false },
      { label: f1(Fy) + " ksi", num: Fy, correct: false }
    ], solution: solution };
}));
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-065", topic: "Structural Engineering", subtopic: "Compression slenderness limit",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "4.71 is the coefficient in the handbook limit. 0.877 multiplies Fe in the elastic equation; pi sqrt(E/Fy) and 1.5 sqrt(E/Fy) are distractors.",
  videoUrl: null, videoTitle: null
}, function () {
  var Fy = pick([36, 50]);
  var question = "For flexural buckling of members without slender elements, which expression gives the KL/r value that separates the inelastic equation from the elastic one, per the handbook? (\\(F_y\\) = " + Fy + " ksi, E = 29,000 ksi.)";
  var solution = C_STEEL + "\n\nThe handbook separates the inelastic and elastic buckling equations at \\(KL/r = 4.71\\sqrt{E/F_y}\\) (for \\(F_y\\) = " + Fy + " ksi, this is " + f1(4.71 * Math.sqrt(29000 / Fy)) + ").";
  return { variantKey: "Fy" + Fy, question: question,
    options: [
      { label: "\\(4.71\\sqrt{E/F_y}\\)", num: 4.71, correct: true },
      { label: "\\(1.5\\sqrt{E/F_y}\\)", num: 1.5, correct: false },
      { label: "\\(0.877\\sqrt{E/F_y}\\)", num: 0.877, correct: false },
      { label: "\\(\\pi\\sqrt{E/F_y}\\)", num: Math.PI, correct: false }
    ], solution: solution };
}));

/* ---- structural-066 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-066", topic: "Structural Engineering", subtopic: "Rectangular beam nominal moment",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Mn uses the lever arm d - a/2. The design strength phi Mn, using d instead of d - a/2, and using d - a are the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var b = pick([10, 12, 14]), d = pick([16, 20, 24]), As = pick([2.0, 3.0, 4.0]);
  var a = As * 60000 / (0.85 * 4000 * b);
  var Mn = As * 60000 * (d - a / 2) / 12000;
  var question = "A singly reinforced rectangular beam has b = " + b + " in., d = " + d + " in., \\(A_s\\) = " + As.toFixed(1) + " \\(\\text{in}^2\\), \\(f'_c\\) = 4,000 psi and \\(f_y\\) = 60,000 psi. Using the handbook equations, what is the nominal flexural strength \\(M_n\\)?";
  var solution = C_RC + "\n\n$$a = \\frac{A_s f_y}{0.85 f'_c b} = " + f2(a) + "\\ \\text{in}, \\quad M_n = A_s f_y\\left(d - \\frac{a}{2}\\right) = " + f0c(Mn) + "\\ \\text{kip-ft}$$";
  return { variantKey: "b" + b + "_d" + d + "_As" + As, question: question, diagram: dBeamSection(b, d, As),
    options: [
      { label: f0c(Mn) + " kip-ft", num: Mn, correct: true },
      { label: f0c(0.9 * Mn) + " kip-ft", num: 0.9 * Mn, correct: false },
      { label: f0c(As * 60000 * d / 12000) + " kip-ft", num: As * 60000 * d / 12000, correct: false },
      { label: f0c(As * 60000 * (d - a) / 12000) + " kip-ft", num: As * 60000 * (d - a) / 12000, correct: false }
    ], solution: solution };
}));

/* ---- structural-068 / 069 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-068", topic: "Structural Engineering", subtopic: "Concrete shear strength",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "phi Vc = 0.75 x 2 sqrt(f'c) bw d. The nominal Vc without phi, half of phi Vc, and double phi Vc are the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var bw = pick([10, 12, 14]), d = pick([18, 20, 24]), fc = pick([3500, 4000, 5000]);
  var Vc = 2 * Math.sqrt(fc) * bw * d / 1000;
  var correct = 0.75 * Vc;
  var question = "A beam web has \\(b_w\\) = " + bw + " in., d = " + d + " in. and \\(f'_c\\) = " + fc.toLocaleString("en-US") + " psi (normal weight concrete). Using the handbook, what is the design shear strength provided by the concrete, \\(\\phi V_c\\), with \\(\\phi = 0.75\\)?";
  var solution = C_RC + "\n\n$$V_c = 2\\sqrt{f'_c}\\, b_w d = 2\\sqrt{" + fc.toLocaleString("en-US") + "}(" + bw + ")(" + d + ")/1000 = " + f1(Vc) + "\\ \\text{kip}, \\quad \\phi V_c = 0.75(" + f1(Vc) + ") = " + f1(correct) + "\\ \\text{kip}$$";
  return { variantKey: "bw" + bw + "_d" + d + "_fc" + fc, question: question,
    options: [
      { label: f1(correct) + " kip", num: correct, correct: true },
      { label: f1(Vc) + " kip", num: Vc, correct: false },
      { label: f1(correct / 2) + " kip", num: correct / 2, correct: false },
      { label: f1(correct * 2) + " kip", num: correct * 2, correct: false }
    ], solution: solution };
}));
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-069", topic: "Structural Engineering", subtopic: "Minimum stirrup area spacing",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "s = Av fy / (50 bw) is one of the two minimum-area expressions; the other uses 0.75 bw sqrt(f'c). The 24 in. cap and d/2 are separate maximum-spacing limits.",
  videoUrl: null, videoTitle: null
}, function () {
  var bw = pick([10, 12, 14]), Av = pick([0.22, 0.40]), fy = 60000;
  var correct = Av * fy / (50 * bw);
  var other = Av * fy / (0.75 * Math.sqrt(4000) * bw);
  var question = "Two-leg #" + (Av === 0.22 ? "3" : "4") + " stirrups give \\(A_v\\) = " + Av.toFixed(2) + " \\(\\text{in}^2\\) with \\(f_y\\) = 60,000 psi on a web with \\(b_w\\) = " + bw + " in. Using the handbook minimum-area expression \\(A_v f_y/(50 b_w)\\), what is the spacing s from this expression alone?";
  var solution = C_RC + "\n\n$$s = \\frac{A_v f_y}{50 b_w} = \\frac{(" + Av.toFixed(2) + ")(60{,}000)}{50(" + bw + ")} = " + f1(correct) + "\\ \\text{in}$$";
  return { variantKey: "bw" + bw + "_Av" + Av, question: question,
    options: [
      { label: f1(correct) + " in.", num: correct, correct: true },
      { label: f1(other) + " in.", num: other, correct: false },
      { label: f1(24) + " in.", num: 24, correct: false },
      { label: f1(correct / 2) + " in.", num: correct / 2, correct: false }
    ], solution: solution };
}));

/* ---- structural-070 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-070", topic: "Structural Engineering", subtopic: "Tied column design strength",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "phi Pn = 0.65 x 0.80[0.85 f'c (Ag - Ast) + Ast fy]. Pn without phi and omitting the 0.80 factor are the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var Ag = pick([256, 324, 400]), Ast = pick([4.0, 6.0, 8.0]), fc = pick([4, 5]);
  var Pn = 0.80 * (0.85 * fc * (Ag - Ast) + Ast * 60);
  var correct = 0.65 * Pn;
  var question = "A short tied column has \\(A_g\\) = " + Ag + " \\(\\text{in}^2\\), \\(A_{st}\\) = " + Ast.toFixed(1) + " \\(\\text{in}^2\\), \\(f'_c\\) = " + fc + ",000 psi and \\(f_y\\) = 60,000 psi. Using the handbook, what is the design axial strength \\(\\phi P_n\\) with \\(\\phi = 0.65\\)?";
  var solution = C_RC + "\n\n$$P_n = 0.80\\left[0.85(" + fc + ")(" + Ag + " - " + Ast.toFixed(1) + ") + (" + Ast.toFixed(1) + ")(60)\\right] = " + f0c(Pn) + "\\ \\text{kip}, \\quad \\phi P_n = 0.65(" + f0c(Pn) + ") = " + f0c(correct) + "\\ \\text{kip}$$";
  return { variantKey: "Ag" + Ag + "_Ast" + Ast + "_fc" + fc, question: question,
    options: [
      { label: f0c(correct) + " kip", num: correct, correct: true },
      { label: f0c(Pn) + " kip", num: Pn, correct: false },
      { label: f0c(Pn / 0.8) + " kip", num: Pn / 0.8, correct: false },
      { label: f0c(0.65 * Pn / 0.8) + " kip", num: 0.65 * Pn / 0.8, correct: false }
    ], solution: solution };
}));

/* ---- structural-072 / 074 ---- */
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-072", topic: "Structural Engineering", subtopic: "Euler load, pinned-pinned",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "The load scales with 1/K^2. The wrong choices use the K values of other end conditions.",
  videoUrl: null, videoTitle: null
}, function () {
  var I = pick([80, 100, 120]), L = pick([12, 15, 18]);
  var Lin = L * 12;
  var Pe = Math.PI * Math.PI * 29000 * I / (Lin * Lin);
  var question = "A steel column (E = 29,000 ksi) has I = " + I + " \\(\\text{in}^4\\) about the buckling axis and an actual length of " + L + " ft. With the effective length factor K for pinned-pinned ends, what is the Euler buckling load?";
  var solution = C_STEEL + "\n\nPinned-pinned: \\(K = 1.0\\).\n\n$$P_e = \\frac{\\pi^2 E I}{(KL)^2} = \\frac{\\pi^2(29{,}000)(" + I + ")}{(" + Lin + ")^2} = " + f0c(Pe) + "\\ \\text{kip}$$";
  return { variantKey: "I" + I + "_L" + L, question: question, diagram: dColumn(L),
    options: [
      { label: f0c(Pe) + " kip", num: Pe, correct: true },
      { label: f0c(Pe / 4) + " kip", num: Pe / 4, correct: false },
      { label: f0c(Pe / 2.04) + " kip", num: Pe / 2.04, correct: false },
      { label: f0c(Pe / 0.49) + " kip", num: Pe / 0.49, correct: false }
    ], solution: solution };
}));
STRUCTURAL_ENTRIES.push(buildGenerator({
  baseId: "structural-074", topic: "Structural Engineering", subtopic: "Required moment of inertia for a given Euler load",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Length must be in inches to match E in ksi, and the length term is squared.",
  videoUrl: null, videoTitle: null
}, function () {
  var L = pick([12, 15, 18]), P = pick([400, 500, 600]);
  var Lin = L * 12;
  var Ireq = P * Lin * Lin / (Math.PI * Math.PI * 29000);
  var question = "A pinned-pinned steel column (E = 29,000 ksi) is " + L + " ft long. What moment of inertia about the buckling axis is needed for an Euler buckling load of " + P + " kip?";
  var solution = C_STEEL + "\n\n$$I = \\frac{P_e (KL)^2}{\\pi^2 E} = \\frac{(" + P + ")(" + Lin + ")^2}{\\pi^2(29{,}000)} = " + f1(Ireq) + "\\ \\text{in}^4$$";
  return { variantKey: "L" + L + "_P" + P, question: question, diagram: dColumn(L),
    options: [
      { label: f1(Ireq) + " in\u2074", num: Ireq, correct: true },
      { label: f1(P * L * L / (Math.PI * Math.PI * 29000)) + " in\u2074", num: P * L * L / (Math.PI * Math.PI * 29000), correct: false },
      { label: f1(Ireq / 4) + " in\u2074", num: Ireq / 4, correct: false },
      { label: f1(Math.sqrt(Ireq)) + " in\u2074", num: Math.sqrt(Ireq), correct: false }
    ], solution: solution };
}));


  window.STRUCTURAL_GENERATORS = STRUCTURAL_ENTRIES;
})();
