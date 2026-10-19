/* PassTheFE randomized practice — Materials generator templates.
 *
 * Plain script (no modules) for the static site. Defines window.WATER_GENERATORS:
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
  var MAT_ENTRIES = [];
  function reg(e) { MAT_ENTRIES.push(e); return e; }
var CITE_W = {
  "water-054": "Refer to the Air pollution section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-055": "Refer to the Atmospheric Dispersion Modeling (Gaussian) section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-056": "Refer to the Atmospheric Dispersion Modeling (Gaussian) section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-057": "Refer to the Activated Sludge section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-058": "Refer to the Activated Sludge section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-059": "Refer to the Activated Sludge section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-060": "Refer to the BOD Test Solution and Seeding Procedures section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-061": "Refer to the Activated Sludge section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-062": "Refer to the Lime-Soda Softening Equations section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-063": "Refer to the Lime-Soda Softening Equations section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-064": "Refer to the Filtration Equations section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-065": "Refer to the Filtration Equations section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-066": "Refer to the Settling Equations section in the Environmental Engineering chapter of the FE Reference Handbook (v10.6).",
  "water-067": "Source: EPA SWMM Reference Manual Volume I, Hydrology (EPA/600/R-15/162A), Chapter 4, Horton's method, Equations 4-1 to 4-3 (https://downloads.tuflow.com/SWMM/SWMM5_Reference_Manual_Volume1_Hydrology_P100NYRA.pdf). Horton's equation is not in the FE Reference Handbook, so it is given in the question. This is supplemental practice.",
  "water-068": "Source: EPA SWMM Reference Manual Volume I, Hydrology (EPA/600/R-15/162A), Chapter 4, Horton's method, Equations 4-1 to 4-3 (https://downloads.tuflow.com/SWMM/SWMM5_Reference_Manual_Volume1_Hydrology_P100NYRA.pdf). Horton's equation is not in the FE Reference Handbook, so it is given in the question. This is supplemental practice.",
  "water-069": "Source: EPA SWMM Reference Manual Volume I, Hydrology (EPA/600/R-15/162A), Chapter 4, Horton's method, Equations 4-1 to 4-3 (https://downloads.tuflow.com/SWMM/SWMM5_Reference_Manual_Volume1_Hydrology_P100NYRA.pdf). Horton's equation is not in the FE Reference Handbook, so it is given in the question. This is supplemental practice.",
  "water-070": "Refer to NRCS/SCS Rainfall-Runoff in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 296 (PDF page 302).",
  "water-071": "Refer to NRCS/SCS Rainfall-Runoff in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 296 (PDF page 302).",
  "water-072": "Refer to NRCS/SCS Rainfall-Runoff in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 296 (PDF page 302).",
  "water-073": "Refer to Rational Formula in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 296 (PDF page 302).",
  "water-074": "Refer to Hydrologic Mass Balance (Budget) in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 296 (PDF page 302).",
  "water-075": "Refer to Pan Evaporation in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 296 (PDF page 302).",
  "water-076": "Refer to Darcy's Law in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 298 (PDF page 304).",
  "water-077": "Refer to Darcy's Law (specific discharge and seepage velocity) in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 298 (PDF page 304).",
  "water-078": "Refer to Transmissivity, T in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 298 (PDF page 304).",
  "water-079": "Refer to Dupuit's Formula in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 299 (PDF page 305).",
  "water-080": "Refer to Thiem Equation in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 299 (PDF page 305).",
  "water-081": "Refer to Dupuit's Formula (specific capacity Q/Dw) in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 299 (PDF page 305).",
  "water-084": "Refer to Critical depth for rectangular channels in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 302 (PDF page 308).",
  "water-087": "Refer to Specific Energy Diagram in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 302 (PDF page 308).",
  "water-089": "Refer to Manning's Equation in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 303 (PDF page 309).",
  "water-090": "Refer to Weir Formulas in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 303 (PDF page 309).",
  "water-091": "Refer to Weir Formulas in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 303 (PDF page 309).",
  "water-092": "Refer to Weir Formulas (V-notch) in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 303 (PDF page 309).",
  "water-093": "Refer to Circular Pipe Head Loss Equation (Head Loss Expressed in Feet) in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 304 (PDF page 310).",
  "water-094": "Refer to Circular Pipe Head Loss Equation (Head Loss Expressed as Pressure) in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 304 (PDF page 310).",
  "water-096": "Refer to Formula for Calculating Rated Capacity at 20 psi from Fire Hydrant in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 305 (PDF page 311).",
  "water-097": "Refer to Fire Hydrant Discharging to Atmosphere in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 305 (PDF page 311).",
  "water-098": "Refer to Pan Evaporation in the Civil Engineering: Hydrology/Water Resources section of the FE Reference Handbook (v10.6), printed page 296 (PDF page 302).",
  "water-099": "Refer to Pump Power Equation in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 197 (PDF page 203).",
  "water-100": "Refer to Pump (brake) power in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 196 (PDF page 202).",
  "water-101": "Refer to Purchased power in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 196 (PDF page 202).",
  "water-102": "Refer to Pump Power Equation in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 197 (PDF page 203).",
  "water-103": "Refer to Net Positive Suction Head Available in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 196 (PDF page 202).",
  "water-104": "Refer to Net Positive Suction Head Available in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 196 (PDF page 202).",
  "water-105": "Refer to Net Positive Suction Head Available in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 196 (PDF page 202).",
};
function CT(id) { return CITE_W[id]; }

function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
function f1(x) { return (Math.round(x * 10) / 10).toFixed(1); }
function f3(x) { return (Math.round(x * 1000) / 1000).toFixed(3); }
function f0c(x) { return Math.round(x).toLocaleString("en-US"); }
function bankNum(x) {
  var r1 = Math.round(x * 10) / 10;
  if (Math.abs(r1 - Math.round(r1)) < 1e-9) return Math.round(r1).toLocaleString("en-US");
  return r1.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
var WATER_ENTRIES = [];
function wreg(meta, roll) { WATER_ENTRIES.push(buildGenerator(meta, roll)); }

/* ---- water diagrams ---- */
function dPlume(Q, H, u, sy, sz) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="Stack with effective height H = ' + H + ' m emitting Q, plume spreading downwind with wind speed u = ' + u + ' m/s"><rect width="480" height="240" fill="#ffffff"/>' + AH;
  s += '<line x1="30" y1="200" x2="450" y2="200" stroke="#1a1a1a" stroke-width="2.5"/>';
  s += '<rect x="70" y="90" width="14" height="110" fill="#9ca3af" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="77" y1="60" x2="77" y2="90" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4,3"/>';
  s += '<line x1="45" y1="60" x2="45" y2="200" stroke="#c0392b" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="30" y="135" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">H = ' + H + ' m</text>';
  s += '<path d="M 84 70 L 420 40 L 420 190 L 84 120 Z" fill="#dbeafe" opacity="0.65" stroke="#1d4ed8" stroke-width="1.5"/>';
  s += '<line x1="84" y1="95" x2="420" y2="115" stroke="#1d4ed8" stroke-width="1.5" stroke-dasharray="6,4"/>';
  s += '<text x="250" y="62" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">plume, u = ' + u + ' m/s</text>';
  s += '<circle cx="380" cy="200" r="4" fill="#c0392b"/>';
  s += '<text x="330" y="222" font-family="Helvetica,Arial,sans-serif" font-size="11">ground-level centerline point</text>';
  s += '<text x="90" y="30" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#6b7280">Q, \u03C3_y = ' + sy + ' m, \u03C3_z = ' + sz + ' m</text>';
  return svgURL(s + '</svg>');
}

/* ================= water batch 1: 054-069 ================= */

/* ---- 054: ppb to ug/m3 ---- */
wreg({
  baseId: "water-054", topic: "Water Resources & Environmental", subtopic: "Air pollutant ppb to ug/m3 conversion",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "ug/m3 = ppb x MW x P/(RT) with absolute temperature (298.15 K at 25 deg C). Using 25 instead of 298.15 K or the 0 deg C molar volume gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var gas = pick([["nitrogen dioxide (NO2, molecular weight 46 g/mol)", 46], ["sulfur dioxide (SO2, molecular weight 64 g/mol)", 64], ["ozone (O3, molecular weight 48 g/mol)", 48]]);
  var ppb = pick([40, 53, 65]);
  var correct = ppb * gas[1] * 1 / (0.08206 * 298.15) * 1000 / 1000; // ppb*MW/24.465
  correct = ppb * gas[1] / (0.08206 * 298.15);
  var question = "An air monitor reports " + ppb + " ppb of " + gas[0] + " at 25 deg C and 1 atm. What is the concentration in micrograms per cubic meter?";
  var solution = CT("water-054") + "\n\n$$\\frac{\\mu g}{m^3} = \\text{ppb} \\times \\frac{P(\\text{MW})}{RT} = " + ppb + " \\times \\frac{(1)(" + gas[1] + ")}{(0.08206)(298.15)} = " + f0c(correct) + "\\ \\mu\\text{g/m}^3$$";
  return { variantKey: "g" + gas[1] + "_p" + ppb, question: question,
    options: [
      { label: f0c(correct) + " ug/m3", num: correct, correct: true },
      { label: f0c(ppb * gas[1] / (0.08206 * 25)) + " ug/m3", num: ppb * gas[1] / (0.08206 * 25), correct: false },
      { label: f0c(ppb * gas[1] / 22.4) + " ug/m3", num: ppb * gas[1] / 22.4, correct: false },
      { label: f0c(ppb * gas[1]) + " ug/m3", num: ppb * gas[1], correct: false }
    ], solution: solution };
});

/* ---- 055 / 056: Gaussian plume ---- */
wreg({
  baseId: "water-055", topic: "Water Resources & Environmental", subtopic: "Gaussian plume ground-level centerline concentration",
  difficulty: "hard", estimatedTimeSeconds: 180,
  explanation: "At ground level on the centerline, C = Q/(pi sy sz u) exp(-H^2/(2 sz^2)). Omitting the exponential reflection term gives the unattenuated value.",
  videoUrl: null, videoTitle: null
}, function () {
  var Q = pick([4.0e7, 5.0e7, 6.0e7]), H = pick([30, 40, 50]), u = pick([4, 5, 6]), sy = pick([35, 40, 45]), sz = pick([15, 20, 25]);
  var Qd = Q / 1e7;
  var correct = Q / (Math.PI * sy * sz * u) * Math.exp(-H * H / (2 * sz * sz));
  var question = "A stack emits a pollutant at Q = " + Qd.toFixed(1) + " x \\(10^7\\) ug/s with an effective stack height H = " + H + " m. At a point on the ground directly downwind on the plume centerline, the wind speed is u = " + u.toFixed(1) + " m/s and the dispersion parameters are \\(\\sigma_y\\) = " + sy + " m and \\(\\sigma_z\\) = " + sz + " m. What is the ground-level concentration?";
  var solution = CT("water-055") + "\n\n$$C = \\frac{Q}{\\pi \\sigma_y \\sigma_z u}\\exp\\!\\left(-\\frac{H^2}{2\\sigma_z^2}\\right) = \\frac{" + Qd.toFixed(1) + " \\times 10^7}{\\pi(" + sy + ")(" + sz + ")(" + u.toFixed(1) + ")}\\exp\\!\\left(-\\frac{" + H + "^2}{2(" + sz + ")^2}\\right) = " + f0c(correct) + "\\ \\mu\\text{g/m}^3$$";
  var noexp = Q / (Math.PI * sy * sz * u);
  return { variantKey: "Q" + Qd + "_H" + H + "_u" + u + "_s" + sy + "_" + sz, question: question, diagram: dPlume(Qd, H, u, sy, sz),
    options: [
      { label: f0c(correct) + " ug/m3", num: correct, correct: true },
      { label: f0c(noexp) + " ug/m3", num: noexp, correct: false },
      { label: f0c(correct / 2) + " ug/m3", num: correct / 2, correct: false },
      { label: f0c(2 * correct) + " ug/m3", num: 2 * correct, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-056", topic: "Water Resources & Environmental", subtopic: "Maximum ground-level concentration (neutral conditions)",
  difficulty: "hard", estimatedTimeSeconds: 180,
  explanation: "Under neutral conditions sz = H/sqrt(2) at the maximum, so the exponential equals e^-1 and Cmax = Q/(pi u sy sz) e^-1. Omitting the e^-1 factor gives the trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var Q = pick([3.0e7, 4.0e7, 5.0e7]), H = pick([40, 50, 60]), u = pick([3, 4, 5]), sy = pick([40, 45, 50]);
  var Qd = Q / 1e7;
  var sz = H / Math.SQRT2;
  var correct = Q / (Math.PI * u * sy * sz) * Math.exp(-1);
  var question = "An elevated source (effective stack height H = " + H + " m) emits Q = " + Qd.toFixed(1) + " x \\(10^7\\) ug/s under neutral atmospheric conditions. The wind speed at stack height is u = " + u.toFixed(1) + " m/s and \\(\\sigma_y\\) = " + sy + " m at the point of maximum ground-level concentration. What is the maximum ground-level concentration?";
  var solution = CT("water-056") + "\n\nNeutral conditions: \\(\\sigma_z = H/\\sqrt{2} = " + H + "/\\sqrt{2} = " + f1(sz) + "\\) m, so the exponential is \\(e^{-1}\\).\n$$C_{max} = \\frac{Q}{\\pi u \\sigma_y \\sigma_z} e^{-1} = \\frac{" + Qd.toFixed(1) + " \\times 10^7}{\\pi(" + u.toFixed(1) + ")(" + sy + ")(" + f1(sz) + ")} e^{-1} = " + f0c(correct) + "\\ \\mu\\text{g/m}^3$$";
  var noexp = Q / (Math.PI * u * sy * sz);
  return { variantKey: "Q" + Qd + "_H" + H + "_u" + u + "_s" + sy, question: question, diagram: dPlume(Qd, H, u, sy, Math.round(sz)),
    options: [
      { label: f0c(correct) + " ug/m3", num: correct, correct: true },
      { label: f0c(noexp) + " ug/m3", num: noexp, correct: false },
      { label: f0c(correct / 2) + " ug/m3", num: correct / 2, correct: false },
      { label: f0c(correct * 1.166) + " ug/m3", num: correct * 1.166, correct: false }
    ], solution: solution };
});

/* ---- 057-061: activated sludge / BOD ---- */
wreg({
  baseId: "water-057", topic: "Water Resources & Environmental", subtopic: "Activated sludge solids residence time (SRT)",
  difficulty: "medium", estimatedTimeSeconds: 150,
  explanation: "SRT = V XA/(Qw Xw + Qe Xe): solids leave in both the waste sludge and the effluent. Ignoring the effluent solids gives the larger trap value.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([1500, 2000, 2500]), XA = pick([2500, 3000, 3500]), Qw = pick([80, 100, 120]), Xw = pick([7000, 8000, 9000]), Qe = pick([8000, 9000, 10000]), Xe = pick([15, 20, 25]);
  var correct = V * XA / (Qw * Xw + Qe * Xe);
  var noEff = V * XA / (Qw * Xw);
  var question = "An activated sludge aeration basin has V = " + V.toLocaleString("en-US") + " \\(\\text{m}^3\\) and a mixed liquor concentration \\(X_A\\) = " + XA.toLocaleString("en-US") + " mg/L. Waste sludge is withdrawn at \\(Q_w\\) = " + Qw + " \\(\\text{m}^3\\)/d with \\(X_w\\) = " + Xw.toLocaleString("en-US") + " mg/L. The effluent flow is \\(Q_e\\) = " + Qe.toLocaleString("en-US") + " \\(\\text{m}^3\\)/d with suspended solids \\(X_e\\) = " + Xe + " mg/L. What is the solids residence time (mean cell residence time)?";
  var solution = CT("water-057") + "\n\n$$\\theta_c = \\frac{V X_A}{Q_w X_w + Q_e X_e} = \\frac{(" + V.toLocaleString("en-US") + ")(" + XA.toLocaleString("en-US") + ")}{(" + Qw + ")(" + Xw.toLocaleString("en-US") + ") + (" + Qe.toLocaleString("en-US") + ")(" + Xe + ")} = " + f1(correct) + "\\ \\text{days}$$";
  return { variantKey: [V, XA, Qw, Xw, Qe, Xe].join("_"), question: question,
    options: [
      { label: f1(correct) + " days", num: correct, correct: true },
      { label: f1(noEff) + " days", num: noEff, correct: false },
      { label: f1(V * XA / (Qe * Xe)) + " days", num: V * XA / (Qe * Xe), correct: false },
      { label: f1(V / Qw) + " days", num: V / Qw, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-058", topic: "Water Resources & Environmental", subtopic: "Activated sludge food-to-mass (F:M) ratio",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "F:M = Q0 S0/(V XA) with consistent units (mg/L = g/m3, so the thousands cancel).",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([1500, 2000, 2500]), Q0 = pick([5000, 6000, 7000]), S0 = pick([150, 200, 250]), XA = pick([2500, 3000, 3500]);
  var correct = Q0 * S0 / (V * XA);
  var question = "An aeration basin of volume " + V.toLocaleString("en-US") + " \\(\\text{m}^3\\) receives \\(Q_0\\) = " + Q0.toLocaleString("en-US") + " \\(\\text{m}^3\\)/d of wastewater with a BOD of \\(S_0\\) = " + S0 + " mg/L. The mixed liquor concentration is \\(X_A\\) = " + XA.toLocaleString("en-US") + " mg/L. What is the food-to-mass (F:M) ratio?";
  var solution = CT("water-058") + "\n\n$$F{:}M = \\frac{Q_0 S_0}{V X_A} = \\frac{(" + Q0.toLocaleString("en-US") + ")(" + S0 + ")}{(" + V.toLocaleString("en-US") + ")(" + XA.toLocaleString("en-US") + ")} = " + f2(correct) + "\\ \\text{per day}$$";
  return { variantKey: [V, Q0, S0, XA].join("_"), question: question,
    options: [
      { label: f2(correct) + " per day", num: correct, correct: true },
      { label: f2(1 / correct) + " per day", num: 1 / correct, correct: false },
      { label: f2(Q0 * S0 / (V * XA) * 1000) + " per day", num: Q0 * S0 / (V * XA) * 1000, correct: false },
      { label: f2(correct * 2) + " per day", num: correct * 2, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-059", topic: "Water Resources & Environmental", subtopic: "Sludge volume index (SVI)",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "SVI = settled volume (mL/L) divided by MLSS in g/L. Using MLSS in mg/L directly gives a value 1000 times smaller.",
  videoUrl: null, videoTitle: null
}, function () {
  var mlss = pick([2500, 3000, 3500]), vol = pick([250, 300, 350]);
  var correct = vol / (mlss / 1000);
  var question = "A 1-L sample of mixed liquor with MLSS = " + mlss.toLocaleString("en-US") + " mg/L is allowed to settle. After 30 minutes the settled sludge occupies " + vol + " mL. What is the sludge volume index (SVI)?";
  var solution = CT("water-059") + "\n\n$$SVI = \\frac{" + vol + "\\ \\text{mL/L}}{" + (mlss / 1000).toFixed(1) + "\\ \\text{g/L}} = " + f0c(correct) + "\\ \\text{mL/g}$$";
  return { variantKey: "m" + mlss + "_v" + vol, question: question,
    options: [
      { label: f0c(correct) + " mL/g", num: correct, correct: true },
      { label: f1(vol / mlss) + " mL/g", num: vol / mlss, correct: false },
      { label: f0c(correct / 2) + " mL/g", num: correct / 2, correct: false },
      { label: f0c(correct / 10) + " mL/g", num: correct / 10, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-060", topic: "Water Resources & Environmental", subtopic: "BOD test (unseeded dilution)",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "BOD5 = (D0 - D5)/P with P the decimal dilution fraction. Multiplying by P instead of dividing, or forgetting the dilution, gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var vw = pick([6, 9, 12]), D0 = pick([8.6, 9.0, 9.2]), D5 = pick([3.4, 4.0, 4.6]), Vt = 300;
  var P = vw / Vt;
  var correct = (D0 - D5) / P;
  var question = "A BOD test uses " + vw + " mL of wastewater diluted to a total volume of " + Vt + " mL with unseeded dilution water. The initial dissolved oxygen is " + D0.toFixed(1) + " mg/L and after 5 days at 20 deg C it is " + D5.toFixed(1) + " mg/L. What is the BOD5 of the wastewater?";
  var solution = CT("water-060") + "\n\n$$BOD_5 = \\frac{D_0 - D_5}{P} = \\frac{" + D0.toFixed(1) + " - " + D5.toFixed(1) + "}{" + vw + "/" + Vt + "} = " + f0c(correct) + "\\ \\text{mg/L}$$";
  return { variantKey: "v" + vw + "_D" + D0 + "_" + D5, question: question,
    options: [
      { label: f0c(correct) + " mg/L", num: correct, correct: true },
      { label: f1(D0 - D5) + " mg/L", num: D0 - D5, correct: false },
      { label: f0c((D0 - D5) * P * 100) + " mg/L", num: (D0 - D5) * P * 100, correct: false },
      { label: f2((D0 - D5) * P) + " mg/L", num: (D0 - D5) * P, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-061", topic: "Water Resources & Environmental", subtopic: "Activated sludge biomass concentration (kinetic design)",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "XA = SRT x Y(S0 - S)/(HRT x (1 + kd SRT)). Mixing up SRT and HRT in numerator and denominator flips the result by their ratio.",
  videoUrl: null, videoTitle: null
}, function () {
  var srt = pick([6, 8, 10]), hrt = pick([0.2, 0.25, 0.3]), Y = pick([0.4, 0.5, 0.6]), kd = pick([0.04, 0.05, 0.06]), S0 = pick([0.2, 0.25, 0.3]), S = pick([0.01, 0.02, 0.03]);
  var correct = srt * Y * (S0 - S) / (hrt * (1 + kd * srt));
  var flipped = hrt * Y * (S0 - S) / (srt * (1 + kd * srt));
  var question = "A completely mixed activated sludge system is designed with solids residence time " + srt + " d, hydraulic residence time " + hrt.toFixed(2) + " d, yield Y = " + Y.toFixed(1) + " kg biomass/kg BOD, and death coefficient \\(k_d\\) = " + kd.toFixed(2) + " per day. The influent BOD is " + S0.toFixed(2) + " kg/\\(\\text{m}^3\\) and the effluent BOD is " + S.toFixed(2) + " kg/\\(\\text{m}^3\\). What is the biomass concentration \\(X_A\\) in the aeration tank?";
  var solution = CT("water-061") + "\n\n$$X_A = \\frac{\\theta_c\\, Y (S_0 - S)}{\\theta\\, (1 + k_d \\theta_c)} = \\frac{(" + srt + ")(" + Y.toFixed(1) + ")(" + S0.toFixed(2) + " - " + S.toFixed(2) + ")}{(" + hrt.toFixed(2) + ")(1 + " + kd.toFixed(2) + " \\times " + srt + ")} = " + f2(correct) + "\\ \\text{kg/m}^3$$";
  return { variantKey: [srt, hrt, Y, kd, S0, S].join("_"), question: question,
    options: [
      { label: f2(correct) + " kg/m3", num: correct, correct: true },
      { label: f2(flipped) + " kg/m3", num: flipped, correct: false },
      { label: f2(srt * Y * (S0 - S) / hrt) + " kg/m3", num: srt * Y * (S0 - S) / hrt, correct: false },
      { label: f2(correct / (1 + kd * srt)) + " kg/m3", num: correct / (1 + kd * srt), correct: false }
    ], solution: solution };
});

/* ---- 062 / 063: lime-soda softening ---- */
wreg({
  baseId: "water-062", topic: "Water Resources & Environmental", subtopic: "Lime-soda softening (CO2 and calcium carbonate hardness)",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "Lime as Ca(OH)2: CO2 x 74/44 plus Ca carbonate hardness (as CaCO3) x 74/100. Forgetting the CO2 term or using the CaCO3 equivalent weight on CO2 gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var co2 = pick([15, 20, 25]), caH = pick([100, 120, 140]);
  var limeCO2 = co2 * 74 / 44, limeCa = caH * 74 / 100;
  var correct = limeCO2 + limeCa;
  var question = "A groundwater contains " + co2 + " mg/L of dissolved \\(\\text{CO}_2\\) and " + caH + " mg/L (as \\(\\text{CaCO}_3\\)) of calcium carbonate hardness. Using lime-soda softening, what lime dose, as \\(\\text{Ca(OH)}_2\\), is needed to remove both the \\(\\text{CO}_2\\) and the calcium carbonate hardness?";
  var solution = CT("water-062") + "\n\n$$\\text{lime} = " + co2 + " \\times \\frac{74}{44} + " + caH + " \\times \\frac{74}{100} = " + f1(limeCO2) + " + " + f1(limeCa) + " = " + f0c(correct) + "\\ \\text{mg/L}$$";
  return { variantKey: "c" + co2 + "_h" + caH, question: question,
    options: [
      { label: f0c(correct) + " mg/L", num: correct, correct: true },
      { label: f0c(limeCa) + " mg/L", num: limeCa, correct: false },
      { label: f0c(limeCO2) + " mg/L", num: limeCO2, correct: false },
      { label: f0c(co2 * 100 / 44 + caH) + " mg/L", num: co2 * 100 / 44 + caH, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-063", topic: "Water Resources & Environmental", subtopic: "Lime-soda softening (magnesium carbonate hardness)",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "Magnesium carbonate hardness needs TWO moles of lime per mole (Mg plus two bicarbonates); calcium carbonate hardness needs one. Treating Mg like Ca underdoses.",
  videoUrl: null, videoTitle: null
}, function () {
  var caH = pick([80, 100, 120]), mgH = pick([30, 40, 50]);
  var limeCa = caH * 74 / 100, limeMg = 2 * mgH * 74 / 100;
  var correct = limeCa + limeMg;
  var question = "A water has no free \\(\\text{CO}_2\\), " + caH + " mg/L (as \\(\\text{CaCO}_3\\)) of calcium carbonate hardness, and " + mgH + " mg/L (as \\(\\text{CaCO}_3\\)) of magnesium carbonate hardness. What lime dose, as \\(\\text{Ca(OH)}_2\\), is needed to remove all of this carbonate hardness by lime-soda softening?";
  var solution = CT("water-063") + "\n\nCalcium hardness: \\(" + caH + " \\times 74/100 = " + f1(limeCa) + "\\) mg/L. Magnesium carbonate hardness takes two moles of lime per mole: \\(" + mgH + " \\times 2 \\times 74/100 = " + f1(limeMg) + "\\) mg/L.\n\n$$\\text{total lime} = " + f1(limeCa) + " + " + f1(limeMg) + " = " + f0c(correct) + "\\ \\text{mg/L}$$";
  return { variantKey: "c" + caH + "_m" + mgH, question: question,
    options: [
      { label: f0c(correct) + " mg/L", num: correct, correct: true },
      { label: f0c((caH + mgH) * 74 / 100) + " mg/L", num: (caH + mgH) * 74 / 100, correct: false },
      { label: f0c(correct + mgH * 74 / 100) + " mg/L", num: correct + mgH * 74 / 100, correct: false },
      { label: f0c(limeMg) + " mg/L", num: limeMg, correct: false }
    ], solution: solution };
});

/* ---- 064 / 065: filtration ---- */
wreg({
  baseId: "water-064", topic: "Water Resources & Environmental", subtopic: "Rapid filtration rate (one filter in backwash)",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "With one of four filters out, the full flow passes through three filters: rate = Q/(3A), converted from m/s to m/h. Dividing by all four areas gives the trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var Q = pick([0.30, 0.35, 0.40]), A = pick([50, 60, 70]), N = 4;
  var correct = Q / ((N - 1) * A) * 3600;
  var question = "A treatment plant passes " + Q.toFixed(2) + " m\\(^3\\)/s through four identical rapid sand filters, each with a plan area of " + A + " m\\(^2\\). With one filter out of service for backwashing, what is the filtration rate through each of the other three?";
  var solution = CT("water-064") + "\n\n$$v = \\frac{Q}{3A} = \\frac{" + Q.toFixed(2) + "}{3(" + A + ")} = " + (Q / (3 * A)).toExponential(3) + "\\ \\text{m/s} \\times 3600 = " + f1(correct) + "\\ \\text{m/h}$$";
  return { variantKey: "Q" + Q + "_A" + A, question: question,
    options: [
      { label: f1(correct) + " m/h", num: correct, correct: true },
      { label: f1(Q / (N * A) * 3600) + " m/h", num: Q / (N * A) * 3600, correct: false },
      { label: (Q / ((N - 1) * A)).toFixed(4) + " m/s", num: Q / ((N - 1) * A), correct: false },
      { label: f1(2 * correct) + " m/h", num: 2 * correct, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-065", topic: "Water Resources & Environmental", subtopic: "Filter backwash velocity",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Backwash velocity = backwash flow / plan area, then m/s to mm/s (x1000).",
  videoUrl: null, videoTitle: null
}, function () {
  var A = pick([50, 60, 70]), Q = pick([0.75, 0.90, 1.05]);
  var correct = Q / A * 1000;
  var question = "A rapid sand filter with a plan area of " + A + " m\\(^2\\) is backwashed at " + Q.toFixed(2) + " m\\(^3\\)/s. What is the backwash velocity?";
  var solution = CT("water-065") + "\n\n$$v = \\frac{Q}{A} = \\frac{" + Q.toFixed(2) + "}{" + A + "} = " + f3(Q / A) + "\\ \\text{m/s} = " + f0c(correct) + "\\ \\text{mm/s}$$";
  return { variantKey: "A" + A + "_Q" + Q, question: question,
    options: [
      { label: f0c(correct) + " mm/s", num: correct, correct: true },
      { label: f1(Q / A * 100) + " mm/s", num: Q / A * 100, correct: false },
      { label: f0c(A / Q / 10) + " mm/s", num: A / Q / 10, correct: false },
      { label: f0c(correct + 52) + " mm/s", num: correct + 52, correct: false }
    ], solution: solution };
});

/* ---- 066: Stokes ---- */
wreg({
  baseId: "water-066", topic: "Water Resources & Environmental", subtopic: "Stokes' law settling velocity",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "v = g(rho_p - rho) d^2/(18 mu). The diameter is squared; using the diameter to the first power or forgetting to convert mm to m gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var d = pick([0.040, 0.050, 0.060]), rhoP = pick([2400, 2650, 2900]);
  var rho = 998, mu = 1.002e-3, g = 9.81;
  var correct = g * (rhoP - rho) * Math.pow(d / 1000, 2) / (18 * mu) * 1000; // mm/s
  var question = "A spherical silt particle with a diameter of " + d.toFixed(3) + " mm and a density of " + rhoP.toLocaleString("en-US") + " kg/m\\(^3\\) settles in still water at 20 deg C (density 998 kg/m\\(^3\\), dynamic viscosity 1.002 x 10\\(^{-3}\\) Pa-s). Assuming laminar settling, what is the terminal settling velocity?";
  var solution = CT("water-066") + "\n\n$$v = \\frac{g(\\rho_p - \\rho)d^2}{18\\mu} = \\frac{(9.81)(" + rhoP.toLocaleString("en-US") + " - 998)(" + (d / 1000).toExponential(1) + ")^2}{18(1.002 \\times 10^{-3})} = " + f2(correct) + "\\ \\text{mm/s}$$";
  return { variantKey: "d" + d + "_r" + rhoP, question: question,
    options: [
      { label: f2(correct) + " mm/s", num: correct, correct: true },
      { label: f2(correct / 4) + " mm/s", num: correct / 4, correct: false },
      { label: f2(g * (rhoP - rho) * (d / 1000) / (18 * mu) * 1000 / 1000) + " mm/s", num: g * (rhoP - rho) * (d / 1000) / (18 * mu) * 1000 / 1000, correct: false },
      { label: f2(2 * correct) + " mm/s", num: 2 * correct, correct: false }
    ], solution: solution };
});

/* ---- 067-069: Horton infiltration ---- */
wreg({
  baseId: "water-067", topic: "Water Resources & Environmental", subtopic: "Horton infiltration capacity",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "fp = finf + (f0 - finf) e^(-kd t). Using f0 instead of (f0 - finf) in the decaying term, or omitting finf, gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var f0 = pick([3.5, 4.0, 4.5]), finf = pick([0.4, 0.5, 0.6]), kd = pick([2.5, 3, 3.5]), t = pick([0.4, 0.5, 0.6]);
  var correct = finf + (f0 - finf) * Math.exp(-kd * t);
  var question = "Horton's equation gives the infiltration capacity as \\(f_p = f_\\infty + (f_0 - f_\\infty)e^{-k_d t}\\), where \\(f_0\\) is the initial capacity, \\(f_\\infty\\) is the final capacity and \\(k_d\\) is the decay coefficient. A soil has \\(f_0 = " + f0.toFixed(1) + "\\ \\text{in/hr}\\), \\(f_\\infty = " + finf.toFixed(1) + "\\ \\text{in/hr}\\) and \\(k_d = " + kd + "\\ \\text{hr}^{-1}\\). What is the infiltration capacity " + t.toFixed(1) + " hr after the start of the storm?";
  var solution = CT("water-067") + "\n\n$$f_p = " + finf.toFixed(1) + " + (" + f0.toFixed(1) + " - " + finf.toFixed(1) + ")e^{-(" + kd + ")(" + t.toFixed(1) + ")} = " + f2(correct) + "\\ \\text{in/hr}$$";
  return { variantKey: [f0, finf, kd, t].join("_"), question: question,
    options: [
      { label: f2(correct) + " in/hr", num: correct, correct: true },
      { label: f2((f0 - finf) * Math.exp(-kd * t)) + " in/hr", num: (f0 - finf) * Math.exp(-kd * t), correct: false },
      { label: f2(finf + f0 * Math.exp(-kd * t)) + " in/hr", num: finf + f0 * Math.exp(-kd * t), correct: false },
      { label: f2(f0 * Math.exp(-kd * t)) + " in/hr", num: f0 * Math.exp(-kd * t), correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-068", topic: "Water Resources & Environmental", subtopic: "Horton actual infiltration vs rainfall intensity",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Actual infiltration = min(rainfall intensity, capacity). When rainfall is less than capacity, the answer is the rainfall intensity, not the capacity.",
  videoUrl: null, videoTitle: null
}, function () {
  var f0 = pick([3.5, 4.0, 4.5]), finf = pick([0.4, 0.5, 0.6]), kd = pick([2.5, 3, 3.5]), t = pick([0.4, 0.5, 0.6]);
  var fp = finf + (f0 - finf) * Math.exp(-kd * t);
  var i = pick([0.8, 1.0, 1.2]);
  var correct = Math.min(i, fp);
  var question = "Horton's equation gives the infiltration capacity as \\(f_p = f_\\infty + (f_0 - f_\\infty)e^{-k_d t}\\). The actual infiltration rate is the lesser of the infiltration capacity and the rainfall intensity. A soil has \\(f_0 = " + f0.toFixed(1) + "\\ \\text{in/hr}\\), \\(f_\\infty = " + finf.toFixed(1) + "\\ \\text{in/hr}\\) and \\(k_d = " + kd + "\\ \\text{hr}^{-1}\\). At " + t.toFixed(1) + " hr into a storm the rainfall intensity is " + i.toFixed(1) + " in/hr. What is the actual infiltration rate?";
  var solution = CT("water-068") + "\n\n$$f_p = " + finf.toFixed(1) + " + (" + f0.toFixed(1) + " - " + finf.toFixed(1) + ")e^{-(" + kd + ")(" + t.toFixed(1) + ")} = " + f2(fp) + "\\ \\text{in/hr}$$\n\nActual rate \\(= \\min(" + i.toFixed(1) + ",\\ " + f2(fp) + ") = " + f2(correct) + "\\ \\text{in/hr}$$";
  return { variantKey: [f0, finf, kd, t, i].join("_"), question: question,
    options: [
      { label: f2(correct) + " in/hr", num: correct, correct: true },
      { label: f2(fp) + " in/hr", num: fp, correct: false },
      { label: f2(Math.abs(fp - i)) + " in/hr", num: Math.abs(fp - i), correct: false },
      { label: f2(finf + f0 * Math.exp(-kd * t)) + " in/hr", num: finf + f0 * Math.exp(-kd * t), correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-069", topic: "Water Resources & Environmental", subtopic: "Horton cumulative infiltration",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "F = finf t + (f0 - finf)/kd (1 - e^(-kd t)). Using the capacity at t times t, or dropping the finf t term, gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var f0 = pick([3.5, 4.0, 4.5]), finf = pick([0.4, 0.5, 0.6]), kd = pick([2.5, 3, 3.5]), t = pick([0.75, 1.0, 1.25]);
  var correct = finf * t + (f0 - finf) / kd * (1 - Math.exp(-kd * t));
  var fpT = finf + (f0 - finf) * Math.exp(-kd * t);
  var question = "Horton's equation integrates to the cumulative infiltration capacity \\(F = f_\\infty t + \\dfrac{f_0 - f_\\infty}{k_d}\\left(1 - e^{-k_d t}\\right)\\). A soil has \\(f_0 = " + f0.toFixed(1) + "\\ \\text{in/hr}\\), \\(f_\\infty = " + finf.toFixed(1) + "\\ \\text{in/hr}\\) and \\(k_d = " + kd + "\\ \\text{hr}^{-1}\\). What is the cumulative infiltration capacity over the first " + f2(t) + " hr, assuming infiltration equals capacity throughout?";
  var solution = CT("water-069") + "\n\n$$F = (" + finf.toFixed(1) + ")(" + f2(t) + ") + \\frac{" + f0.toFixed(1) + " - " + finf.toFixed(1) + "}{" + kd + "}\\left(1 - e^{-(" + kd + ")(" + f2(t) + ")}\\right) = " + f2(correct) + "\\ \\text{in}$$";
  return { variantKey: [f0, finf, kd, t].join("_"), question: question,
    options: [
      { label: f2(correct) + " in", num: correct, correct: true },
      { label: f2(fpT * t) + " in", num: fpT * t, correct: false },
      { label: f2((f0 - finf) / kd * (1 - Math.exp(-kd * t))) + " in", num: (f0 - finf) / kd * (1 - Math.exp(-kd * t)), correct: false },
      { label: f2(f0 * t) + " in", num: f0 * t, correct: false }
    ], solution: solution };
});


/* ================= water batch 2: 070-084 ================= */

function dDarcy(K, A, dh, L) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Aquifer block, cross-sectional area ' + A + ' sq ft, head drops ' + dh + ' ft over ' + L + ' ft flow path"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<rect x="60" y="70" width="360" height="100" fill="#e0f2fe" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="60" y1="70" x2="420" y2="70" stroke="#1d4ed8" stroke-width="2"/>';
  s += '<line x1="60" y1="95" x2="420" y2="70" stroke="#1d4ed8" stroke-width="1.5" stroke-dasharray="6,4"/>';
  s += '<line x1="140" y1="120" x2="300" y2="120" stroke="#c0392b" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="200" y="112" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">Q = ?</text>';
  s += '<text x="70" y="55" font-family="Helvetica,Arial,sans-serif" font-size="12">head drop = ' + dh + ' ft over L = ' + L + ' ft</text>';
  s += '<text x="70" y="205" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">K = ' + K + ' ft/s, A = ' + A + ' ft\u00B2</text>';
  return svgURL(s + '</svg>');
}
function dWell(kind, K, h1, r1, h2, r2) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="250" viewBox="0 0 480 250" role="img" aria-label="' + (kind === 'unconfined' ? 'Unconfined aquifer with pumping well; water surface ' + h1 + ' ft at r1 = ' + r1 + ' ft and ' + h2 + ' ft at r2 = ' + r2 + ' ft' : 'Confined aquifer; piezometric heights ' + h1 + ' ft at r1 = ' + r1 + ' ft and ' + h2 + ' ft at r2 = ' + r2 + ' ft') + '"><rect width="480" height="250" fill="#ffffff"/>' + AH;
  s += '<rect x="40" y="190" width="400" height="40" fill="#d1d5db" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="50" y="215" font-family="Helvetica,Arial,sans-serif" font-size="11">aquifer bottom</text>';
  if (kind === 'confined') {
    s += '<rect x="40" y="120" width="400" height="14" fill="#9ca3af" stroke="#1a1a1a" stroke-width="1.5"/>';
    s += '<text x="50" y="112" font-family="Helvetica,Arial,sans-serif" font-size="11">confining layer</text>';
  }
  var y1 = 190 - h1 * 2.6, y2 = 190 - h2 * 2.6;
  s += '<path d="M 60 ' + y2 + ' Q 200 ' + (y2 + 10) + ' 232 ' + y1 + '" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>';
  s += '<path d="M 248 ' + y1 + ' Q 320 ' + (y2 + 12) + ' 440 ' + y2 + '" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>';
  s += '<rect x="232" y="' + (y1 - 6) + '" width="16" height="' + (190 - y1 + 6) + '" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="240" y1="' + (y1 - 20) + '" x2="240" y2="' + (y1 - 4) + '" stroke="#c0392b" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="252" y="' + (y1 - 12) + '" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">pumping well, Q = ?</text>';
  s += '<text x="60" y="' + (y2 - 8) + '" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#1d4ed8">h2 = ' + h2 + ' ft at r2 = ' + r2 + ' ft</text>';
  s += '<text x="252" y="' + (y1 + 18) + '" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#1d4ed8">h1 = ' + h1 + ' ft at r1 = ' + r1 + ' ft</text>';
  s += '<text x="60" y="245" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#6b7280">' + (kind === 'unconfined' ? 'K = ' + K + ' ft/s' : 'confined aquifer') + '</text>';
  return svgURL(s + '</svg>');
}
function dCritDepth(B, Q) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="210" viewBox="0 0 480 210" role="img" aria-label="Rectangular channel ' + B + ' ft wide carrying ' + Q + ' cfs; critical depth unknown"><rect width="480" height="210" fill="#ffffff"/>' + AH;
  s += '<path d="M 80 60 L 80 170 L 400 170 L 400 60" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>';
  s += '<rect x="82" y="110" width="316" height="58" fill="#bfdbfe"/>';
  s += '<line x1="82" y1="110" x2="398" y2="110" stroke="#1d4ed8" stroke-width="2"/>';
  s += '<line x1="120" y1="110" x2="120" y2="168" stroke="#c0392b" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="130" y="142" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">yc = ?</text>';
  s += '<line x1="150" y1="120" x2="330" y2="120" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
  s += '<text x="240" y="102" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">flow</text>';
  s += '<text x="80" y="45" font-family="Helvetica,Arial,sans-serif" font-size="12">B = ' + B + ' ft, Q = ' + Q.toLocaleString("en-US") + ' cfs</text>';
  return svgURL(s + '</svg>');
}

/* ---- 070-072: SCS curve number ---- */
wreg({
  baseId: "water-070", topic: "Water Resources & Environmental", subtopic: "SCS curve number runoff",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "S = 1000/CN - 10; Q = (P - 0.2S)^2/(P + 0.8S). Using 0.2S as the initial abstraction is essential; (P - 0.2S)^2/(P + 0.8S) with S confused for retention vs storage gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var CN = pick([70, 75, 80, 85]), P = pick([3.0, 4.0, 5.0]);
  var S = 1000 / CN - 10;
  var correct = Math.pow(P - 0.2 * S, 2) / (P + 0.8 * S);
  var question = "A watershed has a curve number of " + CN + ". Using the handbook NRCS/SCS method, what is the runoff depth for a " + P.toFixed(1) + " in. storm?";
  var solution = CT("water-070") + "\n\n$$S = \\frac{1000}{CN} - 10 = \\frac{1000}{" + CN + "} - 10 = " + f2(S) + "\\ \\text{in.}$$\n$$Q = \\frac{(P - 0.2S)^2}{P + 0.8S} = \\frac{(" + P.toFixed(1) + " - 0.2(" + f2(S) + "))^2}{" + P.toFixed(1) + " + 0.8(" + f2(S) + ")} = " + f2(correct) + "\\ \\text{in.}$$";
  return { variantKey: "CN" + CN + "_P" + P, question: question,
    options: [
      { label: f2(correct) + " in.", num: correct, correct: true },
      { label: f2(correct + S) + " in.", num: correct + S, correct: false },
      { label: f2(P - 0.2 * S) + " in.", num: P - 0.2 * S, correct: false },
      { label: f2(2.5 * correct) + " in.", num: 2.5 * correct, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-071", topic: "Water Resources & Environmental", subtopic: "Maximum retention from CN",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "S = 1000/CN - 10 (inches). The 1000/(CN - 10) inversion gives the trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var CN = pick([60, 65, 70, 75]);
  var correct = 1000 / CN - 10;
  var question = "A basin has a curve number of " + CN + ". Using the handbook relationship, what is the maximum basin retention S?";
  var solution = CT("water-071") + "\n\n$$S = \\frac{1000}{CN} - 10 = \\frac{1000}{" + CN + "} - 10 = " + f2(correct) + "\\ \\text{in.}$$";
  return { variantKey: "CN" + CN, question: question,
    options: [
      { label: f2(correct) + " in.", num: correct, correct: true },
      { label: f2(1000 / (CN - 10)) + " in.", num: 1000 / (CN - 10), correct: false },
      { label: f2(correct + 10) + " in.", num: correct + 10, correct: false },
      { label: f2(correct + 20) + " in.", num: correct + 20, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-072", topic: "Water Resources & Environmental", subtopic: "Curve number from retention",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "CN = 1000/(S + 10). Inverting the formula incorrectly (1000/(S - 10), or 100 x S) gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var S = pick([2.5, 5.38, 3.33]);
  var correct = 1000 / (S + 10);
  var question = "A watershed has a maximum retention S of " + S + " in. Using the handbook, what is the curve number?";
  var solution = CT("water-072") + "\n\n$$CN = \\frac{1000}{S + 10} = \\frac{1000}{" + S + " + 10} = " + f0c(correct) + "$$";
  return { variantKey: "S" + S, question: question,
    options: [
      { label: f0c(correct), num: correct, correct: true },
      { label: f0c(correct + 10), num: correct + 10, correct: false },
      { label: f0c(100 * S / 10 * 4), num: 100 * S / 10 * 4, correct: false },
      { label: f0c(correct - 5), num: correct - 5, correct: false }
    ], solution: solution };
});

/* ---- 073: rational method ---- */
wreg({
  baseId: "water-073", topic: "Water Resources & Environmental", subtopic: "Rational method peak flow",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Q = C i A (cfs with i in in./hr and A in acres; the unit conversion factor is ~1.008, taken as 1). Dividing by the coefficient or converting acres to sq ft inflates the answer.",
  videoUrl: null, videoTitle: null
}, function () {
  var C = pick([0.30, 0.35, 0.40]), i = pick([2.4, 2.8, 3.2]), A = pick([35, 45, 55]);
  var correct = C * i * A;
  var question = "A " + A + " acre watershed has a runoff coefficient of " + C.toFixed(2) + " and a design rainfall intensity of " + i.toFixed(1) + " in./hr. Using the handbook rational formula, what is the peak discharge?";
  var solution = CT("water-073") + "\n\n$$Q = C i A = (" + C.toFixed(2) + ")(" + i.toFixed(1) + ")(" + A + ") = " + f1(correct) + "\\ \\text{cfs}$$";
  return { variantKey: "C" + C + "_i" + i + "_A" + A, question: question,
    options: [
      { label: f1(correct) + " cfs", num: correct, correct: true },
      { label: f1(i * A / 2) + " cfs", num: i * A / 2, correct: false },
      { label: f1(i * A) + " cfs", num: i * A, correct: false },
      { label: f2(correct / 45) + " cfs", num: correct / 45, correct: false }
    ], solution: solution };
});

/* ---- 074: water budget ---- */
wreg({
  baseId: "water-074", topic: "Water Resources & Environmental", subtopic: "Surface water budget",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Storage change = P + Qin + Qg - Qout - Es - Ts - I: groundwater contribution and inflows add; outflow, evapotranspiration and infiltration subtract. A single sign flip gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var P = pick([8.0, 9.0, 10.0]), Qin = pick([1.0, 1.5, 2.0]), Qout = pick([1.5, 2.0, 2.5]), Qg = pick([0.3, 0.4, 0.5]), Es = pick([0.9, 1.1, 1.3]), Ts = pick([0.5, 0.6, 0.7]), I = pick([2.5, 3.0, 3.5]);
  var correct = P + Qin + Qg - Qout - Es - Ts - I;
  var question = "For a surface water system in one month (all values in inches over the basin): P = " + P.toFixed(1) + ", Qin = " + Qin.toFixed(1) + ", Qout = " + Qout.toFixed(1) + ", Qg = " + Qg.toFixed(1) + ", evaporation Es = " + Es.toFixed(1) + ", transpiration Ts = " + Ts.toFixed(1) + ", infiltration I = " + I.toFixed(1) + ". Using the handbook budget, what is the change in surface water storage?";
  var solution = CT("water-074") + "\n\n$$\\Delta S = P + Q_{in} + Q_g - Q_{out} - E_s - T_s - I = " + P.toFixed(1) + " + " + Qin.toFixed(1) + " + " + Qg.toFixed(1) + " - " + Qout.toFixed(1) + " - " + Es.toFixed(1) + " - " + Ts.toFixed(1) + " - " + I.toFixed(1) + " = " + (correct >= 0 ? "+" : "") + f1(correct) + "\\ \\text{in.}$$";
  return { variantKey: [P, Qin, Qout, Qg, Es, Ts, I].join("_"), question: question,
    options: [
      { label: (correct >= 0 ? "+" : "") + f1(correct) + " in.", num: correct, correct: true },
      { label: f1(-correct) + " in.", num: -correct, correct: false },
      { label: "+" + f1(P + Qin + Qout + Qg + Es + Ts + I) + " in.", num: P + Qin + Qout + Qg + Es + Ts + I, correct: false },
      { label: "+" + f1(correct - 2) + " in.", num: correct - 2, correct: false }
    ], solution: solution };
});

/* ---- 075: pan evaporation ---- */
wreg({
  baseId: "water-075", topic: "Water Resources & Environmental", subtopic: "Lake evaporation from pan",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Lake evaporation = pan coefficient (commonly 0.7) x pan evaporation. Dividing by the coefficient instead of multiplying gives the trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var pan = pick([0.24, 0.28, 0.32]), coeff = 0.7;
  var correct = coeff * pan;
  var question = "The measured pan evaporation is " + pan.toFixed(2) + " in./day. Using the handbook's common pan coefficient, what is the lake evaporation?";
  var solution = CT("water-075") + "\n\n$$E_{lake} = C_p E_{pan} = (0.7)(" + pan.toFixed(2) + ") = " + f3(correct) + "\\ \\text{in./day}$$";
  return { variantKey: "p" + pan, question: question,
    options: [
      { label: f3(correct) + " in./day", num: correct, correct: true },
      { label: f3(pan / coeff) + " in./day", num: pan / coeff, correct: false },
      { label: f3((1 - coeff) * pan) + " in./day", num: (1 - coeff) * pan, correct: false },
      { label: f3(0.5 * pan) + " in./day", num: 0.5 * pan, correct: false }
    ], solution: solution };
});

/* ---- 076-078: Darcy / seepage / transmissivity ---- */
wreg({
  baseId: "water-076", topic: "Water Resources & Environmental", subtopic: "Darcy discharge",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Q = K A (dh/L). Dropping the gradient or the area changes the result by orders of magnitude.",
  videoUrl: null, videoTitle: null
}, function () {
  var K = pick([0.0002, 0.0004, 0.0006]), A = pick([20.0, 25.0, 30.0]), dh = pick([1.5, 2.0, 2.5]), L = pick([80, 100, 120]);
  var correct = K * A * dh / L;
  var question = "An aquifer has hydraulic conductivity K = " + K + " ft/s and a cross-sectional flow area of " + A.toFixed(1) + " ft\\(^2\\). The head drops " + dh.toFixed(1) + " ft over a flow path of " + L + " ft. Using the handbook form of Darcy's law, what is the magnitude of the discharge?";
  var solution = CT("water-076") + "\n\n$$Q = K A \\frac{\\Delta h}{L} = (" + K + ")(" + A.toFixed(1) + ")\\frac{" + dh.toFixed(1) + "}{" + L + "} = " + correct.toExponential(1).replace("e", " \\times 10^{") + "}\\ \\text{ft}^3\\text{/s}$$";
  var sci = function (x) { var e = x.toExponential(1).split("e"); return e[0] + " x 10^" + parseInt(e[1]) + " ft3/s"; };
  return { variantKey: [K, A, dh, L].join("_"), question: question, diagram: dDarcy(K, A, dh, L),
    options: [
      { label: sci(correct), num: correct, correct: true },
      { label: sci(K * A), num: K * A, correct: false },
      { label: sci(correct * 12.5), num: correct * 12.5, correct: false },
      { label: sci(correct / 25), num: correct / 25, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-077", topic: "Water Resources & Environmental", subtopic: "Seepage velocity",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Average seepage velocity = K i / n: divide the Darcy flux by effective porosity. Multiplying by n instead gives the trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var K = pick([0.0002, 0.0004, 0.0006]), i = pick([0.015, 0.02, 0.025]), n = pick([0.20, 0.25, 0.30]);
  var correct = K * i / n;
  var question = "Groundwater flows through sand with K = " + K + " ft/s, a hydraulic gradient of " + i + " and effective porosity n = " + n.toFixed(2) + ". Using the handbook, what is the average seepage velocity?";
  var solution = CT("water-077") + "\n\n$$v_s = \\frac{K i}{n} = \\frac{(" + K + ")(" + i + ")}{" + n.toFixed(2) + "} = " + correct.toExponential(1).replace("e", " \\times 10^{") + "}\\ \\text{ft/s}$$";
  var sci = function (x) { var e = x.toExponential(1).split("e"); return e[0] + " x 10^" + parseInt(e[1]) + " ft/s"; };
  return { variantKey: [K, i, n].join("_"), question: question,
    options: [
      { label: sci(correct), num: correct, correct: true },
      { label: sci(K * i * n), num: K * i * n, correct: false },
      { label: sci(K * i), num: K * i, correct: false },
      { label: sci(correct / 8), num: correct / 8, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-078", topic: "Water Resources & Environmental", subtopic: "Transmissivity",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Transmissivity T = K b for a confined aquifer. Dividing by thickness instead of multiplying gives the trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var K = pick([0.001, 0.002, 0.003]), b = pick([30, 40, 50]);
  var correct = K * b;
  var question = "A confined aquifer has hydraulic conductivity K = " + K + " ft/s and thickness b = " + b + " ft. What is its transmissivity, using the handbook definition?";
  var solution = CT("water-078") + "\n\n$$T = K b = (" + K + ")(" + b + ") = " + f2(correct) + "\\ \\text{ft}^2\\text{/s}$$";
  return { variantKey: "K" + K + "_b" + b, question: question,
    options: [
      { label: f2(correct) + " ft2/s", num: correct, correct: true },
      { label: f0c(K * b * 1000) + " ft2/s", num: K * b * 1000, correct: false },
      { label: (K / b).toFixed(5) + " ft2/s", num: K / b, correct: false },
      { label: f3(correct / 2 + 0.001) + " ft2/s", num: correct / 2 + 0.001, correct: false }
    ], solution: solution };
});

/* ---- 079-081: wells ---- */
wreg({
  baseId: "water-079", topic: "Water Resources & Environmental", subtopic: "Dupuit well in unconfined aquifer",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "Dupuit: Q = pi K (h2^2 - h1^2)/ln(r2/r1) for unconfined. Using (h2 - h1) instead of the difference of squares, or log10 instead of ln, gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var K = pick([0.0008, 0.001, 0.0012]), h1 = pick([35, 40, 45]), h2 = pick([44, 48, 52]), r1 = 0.5, r2 = pick([250, 300, 350]);
  var correct = Math.PI * K * (h2 * h2 - h1 * h1) / Math.log(r2 / r1);
  var question = "A well in an unconfined aquifer (K = " + K + " ft/s) has a water surface " + h1 + " ft above the aquifer bottom at the well wall (r1 = " + r1 + " ft) and " + h2 + " ft at r2 = " + r2 + " ft. Using Dupuit's formula, what is the well discharge?";
  var solution = CT("water-079") + "\n\n$$Q = \\frac{\\pi K (h_2^2 - h_1^2)}{\\ln(r_2/r_1)} = \\frac{\\pi(" + K + ")(" + h2 + "^2 - " + h1 + "^2)}{\\ln(" + r2 + "/" + r1 + ")} = " + f3(correct) + "\\ \\text{cfs}$$";
  return { variantKey: [K, h1, h2, r2].join("_"), question: question, diagram: dWell("unconfined", K, h1, r1, h2, r2),
    options: [
      { label: f3(correct) + " cfs", num: correct, correct: true },
      { label: f3(2 * correct) + " cfs", num: 2 * correct, correct: false },
      { label: f3(Math.PI * K * (h2 - h1) / Math.log(r2 / r1)) + " cfs", num: Math.PI * K * (h2 - h1) / Math.log(r2 / r1), correct: false },
      { label: f3(correct * Math.log(10)) + " cfs", num: correct * Math.log(10), correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-080", topic: "Water Resources & Environmental", subtopic: "Thiem equation, confined aquifer",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "Thiem: Q = 2 pi T (h2 - h1)/ln(r2/r1). Dropping the 2 pi factor or using log10 gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var T = pick([0.04, 0.05, 0.06]), h1 = pick([18, 20, 22]), h2 = pick([24, 26, 28]), r1 = 0.5, r2 = pick([180, 200, 220]);
  var correct = 2 * Math.PI * T * (h2 - h1) / Math.log(r2 / r1);
  var question = "A confined aquifer has transmissivity T = " + T.toFixed(2) + " ft\\(^2\\)/s. Piezometric heights above the aquifer bottom are " + h1 + " ft at r1 = " + r1 + " ft and " + h2 + " ft at r2 = " + r2 + " ft. Using the Thiem equation, what is the pumping rate?";
  var solution = CT("water-080") + "\n\n$$Q = \\frac{2\\pi T (h_2 - h_1)}{\\ln(r_2/r_1)} = \\frac{2\\pi(" + T.toFixed(2) + ")(" + h2 + " - " + h1 + ")}{\\ln(" + r2 + "/" + r1 + ")} = " + f3(correct) + "\\ \\text{cfs}$$";
  return { variantKey: [T, h1, h2, r2].join("_"), question: question, diagram: dWell("confined", null, h1, r1, h2, r2),
    options: [
      { label: f3(correct) + " cfs", num: correct, correct: true },
      { label: f3(correct / 2) + " cfs", num: correct / 2, correct: false },
      { label: f3(correct * Math.log(r2 / r1)) + " cfs", num: correct * Math.log(r2 / r1), correct: false },
      { label: f3(correct * Math.log(10)) + " cfs", num: correct * Math.log(10), correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-081", topic: "Water Resources & Environmental", subtopic: "Specific capacity",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Specific capacity = Q/drawdown. The reciprocal (drawdown/Q) gives the trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var Q = pick([0.25, 0.30, 0.35]), s = pick([10, 12, 14]);
  var correct = Q / s;
  var question = "A well is pumped at " + Q.toFixed(2) + " cfs and the drawdown in the well is " + s + " ft. Using the handbook definition, what is the specific capacity?";
  var solution = CT("water-081") + "\n\n$$\\text{specific capacity} = \\frac{Q}{s} = \\frac{" + Q.toFixed(2) + "}{" + s + "} = " + f3(correct) + "\\ \\text{cfs/ft}$$";
  return { variantKey: "Q" + Q + "_s" + s, question: question,
    options: [
      { label: f3(correct) + " cfs/ft", num: correct, correct: true },
      { label: f1(s / Q) + " cfs/ft", num: s / Q, correct: false },
      { label: f1(Q * s) + " cfs/ft", num: Q * s, correct: false },
      { label: f2(Q) + " cfs/ft", num: Q, correct: false }
    ], solution: solution };
});

/* ---- 084: critical depth ---- */
wreg({
  baseId: "water-084", topic: "Water Resources & Environmental", subtopic: "Critical depth, rectangular channel",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "yc = (q^2/g)^(1/3) with q = Q/B. Using Q instead of unit discharge, or the normal-depth form, gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var B = pick([15, 20, 25]), Q = pick([250, 300, 350]);
  var qq = Q / B;
  var correct = Math.pow(qq * qq / 32.2, 1 / 3);
  var question = "A rectangular channel is " + B + " ft wide and carries " + Q + " cfs. Using the handbook equation, what is the critical depth?";
  var solution = CT("water-084") + "\n\n$$q = \\frac{Q}{B} = \\frac{" + Q + "}{" + B + "} = " + f1(qq) + "\\ \\text{ft}^2\\text{/s}$$\n$$y_c = \\left(\\frac{q^2}{g}\\right)^{1/3} = \\left(\\frac{" + f1(qq) + "^2}{32.2}\\right)^{1/3} = " + f2(correct) + "\\ \\text{ft}$$";
  return { variantKey: "B" + B + "_Q" + Q, question: question, diagram: dCritDepth(B, Q),
    options: [
      { label: f2(correct) + " ft", num: correct, correct: true },
      { label: f2(Math.pow(Q * Q / 32.2, 1 / 3) / 10) + " ft", num: Math.pow(Q * Q / 32.2, 1 / 3) / 10, correct: false },
      { label: f2(qq / 32.2 * 12) + " ft", num: qq / 32.2 * 12, correct: false },
      { label: f2(correct * 1.38) + " ft", num: correct * 1.38, correct: false }
    ], solution: solution };
});


/* ================= water batch 3: 087, 089-105 ================= */

function dManning(B, y, S, n) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="210" viewBox="0 0 480 210" role="img" aria-label="Rectangular channel ' + B + ' ft wide flowing ' + y + ' ft deep on slope ' + S + '"><rect width="480" height="210" fill="#ffffff"/>' + AH;
  s += '<path d="M 80 50 L 95 170 L 415 170 L 400 50" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>';
  s += '<rect x="90" y="110" width="315" height="58" fill="#bfdbfe"/>';
  s += '<line x1="90" y1="110" x2="405" y2="110" stroke="#1d4ed8" stroke-width="2"/>';
  s += '<line x1="130" y1="110" x2="130" y2="168" stroke="#c0392b" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="140" y="142" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">y = ' + y + ' ft</text>';
  s += '<line x1="90" y1="186" x2="400" y2="186" stroke="#1a1a1a" stroke-width="1.2" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="230" y="202" font-family="Helvetica,Arial,sans-serif" font-size="12">B = ' + B + ' ft</text>';
  s += '<line x1="160" y1="118" x2="340" y2="118" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
  s += '<text x="70" y="40" font-family="Helvetica,Arial,sans-serif" font-size="12">n = ' + n + ', slope S = ' + S + ', Q = ?</text>';
  return svgURL(s + '</svg>');
}
function dWeirRect(kind, L, H) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220" role="img" aria-label="' + (kind === 'suppressed' ? 'Suppressed' : 'Contracted') + ' rectangular weir, length ' + L + ' ft, head ' + H + ' ft"><rect width="480" height="220" fill="#ffffff"/>' + AH;
  s += '<rect x="40" y="90" width="200" height="80" fill="#bfdbfe"/>';
  s += '<rect x="240" y="120" width="30" height="70" fill="#9ca3af" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<path d="M 270 120 q 20 4 30 26" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>';
  s += '<line x1="120" y1="90" x2="120" y2="118" stroke="#c0392b" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="130" y="108" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">H = ' + H + ' ft</text>';
  s += '<line x1="60" y1="90" x2="220" y2="90" stroke="#1d4ed8" stroke-width="2"/>';
  s += '<text x="270" y="205" font-family="Helvetica,Arial,sans-serif" font-size="12">crest, L = ' + L + ' ft</text>';
  s += '<text x="40" y="40" font-family="Helvetica,Arial,sans-serif" font-size="12">' + (kind === 'suppressed' ? 'Suppressed' : 'Contracted') + ' rectangular weir, Q = ?</text>';
  return svgURL(s + '</svg>');
}
function dVnotch(H) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220" role="img" aria-label="90 degree V-notch weir with head ' + H + ' ft"><rect width="480" height="220" fill="#ffffff"/>' + AH;
  s += '<path d="M 150 100 L 240 178 L 330 100 Z" fill="#bfdbfe" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<rect x="100" y="180" width="280" height="14" fill="#9ca3af" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<line x1="150" y1="100" x2="150" y2="178" stroke="#c0392b" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="160" y="145" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">H = ' + H + ' ft</text>';
  s += '<text x="120" y="45" font-family="Helvetica,Arial,sans-serif" font-size="12">90 deg V-notch weir, Q = ?</text>';
  return svgURL(s + '</svg>');
}
function dNPSH(hatm, hs, hf, hvp, lift) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="Pump ' + (lift ? 'sits ' + hs + ' ft above the water surface' : 'draws from a sump with surface ' + hs + ' ft above the impeller') + '; friction loss ' + hf + ' ft, vapor pressure head ' + hvp + ' ft"><rect width="480" height="240" fill="#ffffff"/>' + AH;
  var pumpY = lift ? 70 : 170, surfY = lift ? 180 : 100;
  s += '<rect x="60" y="' + surfY + '" width="180" height="' + (210 - surfY) + '" fill="#bfdbfe" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<circle cx="300" cy="' + pumpY + '" r="24" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="332" y="' + (pumpY + 4) + '" font-family="Helvetica,Arial,sans-serif" font-size="12">pump</text>';
  s += '<line x1="240" y1="' + (surfY + 20) + '" x2="276" y2="' + pumpY + '" stroke="#1a1a1a" stroke-width="2.5"/>';
  s += '<line x1="340" y1="' + surfY + '" x2="340" y2="' + pumpY + '" stroke="#c0392b" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="350" y="' + ((surfY + pumpY) / 2 + 4) + '" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">' + (lift ? 'lift = ' : 'hs = ') + hs + ' ft' + (lift ? ' (suction lift)' : '') + '</text>';
  s += '<text x="50" y="35" font-family="Helvetica,Arial,sans-serif" font-size="12">atmospheric head ' + hatm + ' ft; friction loss hf = ' + hf + ' ft; vapor pressure head ' + hvp + ' ft</text>';
  s += '<text x="60" y="228" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">NPSH available = ?</text>';
  return svgURL(s + '</svg>');
}

/* ---- 087: specific energy ---- */
wreg({
  baseId: "water-087", topic: "Water Resources & Environmental", subtopic: "Specific energy",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "E = y + a V^2/(2g). Dropping the velocity head (or doubling it) gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var y = pick([3.5, 4.0, 4.5]), V = pick([5.0, 6.0, 7.0]);
  var hv = V * V / (2 * 32.2);
  var correct = y + hv;
  var question = "Water flows at a depth of " + y.toFixed(1) + " ft with velocity " + V.toFixed(1) + " ft/s. Taking \\(\\alpha = 1\\), what is the specific energy using the handbook expression?";
  var solution = CT("water-087") + "\n\n$$E = y + \\frac{\\alpha V^2}{2g} = " + y.toFixed(1) + " + \\frac{" + V.toFixed(1) + "^2}{2(32.2)} = " + f2(correct) + "\\ \\text{ft}$$";
  return { variantKey: "y" + y + "_V" + V, question: question,
    options: [
      { label: f2(correct) + " ft", num: correct, correct: true },
      { label: f2(y + 2 * hv) + " ft", num: y + 2 * hv, correct: false },
      { label: f2(hv) + " ft", num: hv, correct: false },
      { label: f2(y + hv / 2) + " ft", num: y + hv / 2, correct: false }
    ], solution: solution };
});

/* ---- 089: Manning ---- */
wreg({
  baseId: "water-089", topic: "Water Resources & Environmental", subtopic: "Manning discharge, rectangular channel",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Q = (K/n) A R^(2/3) S^(1/2) with R = A/P (wetted perimeter excludes the free surface). Dropping the slope or miscomputing R gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var n = 0.013, B = pick([5, 6, 7]), y = pick([2.5, 3, 3.5]), S = pick([0.0006, 0.0009, 0.0012]);
  var A = B * y, P = B + 2 * y, R = A / P;
  var correct = (1.486 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(S);
  var question = "A rectangular concrete channel (n = " + n + ") is " + B + " ft wide and flows " + y + " ft deep on a slope of " + S + ". Using Manning's equation with K = 1.486, what is the discharge?";
  var solution = CT("water-089") + "\n\n$$A = " + B + " \\times " + y + " = " + f1(A) + "\\ \\text{ft}^2, \\quad R = \\frac{A}{P} = \\frac{" + f1(A) + "}{" + B + " + 2(" + y + ")} = " + f3(R) + "\\ \\text{ft}$$\n$$Q = \\frac{1.486}{n} A R^{2/3} S^{1/2} = \\frac{1.486}{" + n + "} (" + f1(A) + ")(" + f3(R) + ")^{2/3} (" + S + ")^{1/2} = " + f0c(correct) + "\\ \\text{cfs}$$";
  return { variantKey: [B, y, S].join("_"), question: question, diagram: dManning(B, y, S, n),
    options: [
      { label: f0c(correct) + " cfs", num: correct, correct: true },
      { label: f0c(correct * 0.67) + " cfs", num: correct * 0.67, correct: false },
      { label: f0c(correct * 1.6) + " cfs", num: correct * 1.6, correct: false },
      { label: f0c(correct / 40) + " cfs", num: correct / 40, correct: false }
    ], solution: solution };
});

/* ---- 090-092: weirs ---- */
wreg({
  baseId: "water-090", topic: "Water Resources & Environmental", subtopic: "Suppressed rectangular weir",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Suppressed rectangular weir: Q = C L H^1.5. Using H instead of H^1.5, or applying the contracted-weir correction, gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var C = 3.33, L = pick([6, 8, 10]), H = pick([1.0, 1.2, 1.4]);
  var H15 = Math.pow(H, 1.5);
  var correct = C * L * H15;
  var question = "A suppressed rectangular weir is " + L + " ft long with a head of " + H.toFixed(1) + " ft over the crest. Using the handbook with C = " + C + ", what is the discharge?";
  var solution = CT("water-090") + "\n\n$$Q = C L H^{3/2} = (" + C + ")(" + L + ")(" + H.toFixed(1) + ")^{3/2} = " + f1(correct) + "\\ \\text{cfs}$$";
  return { variantKey: "L" + L + "_H" + H, question: question, diagram: dWeirRect("suppressed", L, H),
    options: [
      { label: f1(correct) + " cfs", num: correct, correct: true },
      { label: f1(C * L * H) + " cfs", num: C * L * H, correct: false },
      { label: f1(1.2 * correct) + " cfs", num: 1.2 * correct, correct: false },
      { label: f1(C * (L - 0.2 * H) * H15) + " cfs", num: C * (L - 0.2 * H) * H15, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-091", topic: "Water Resources & Environmental", subtopic: "Contracted rectangular weir",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Contracted rectangular weir with free discharge: Q = C (L - 0.2H) H^1.5 - the end contractions shorten the effective crest. Omitting the 0.2H correction gives the suppressed value.",
  videoUrl: null, videoTitle: null
}, function () {
  var C = 3.33, L = pick([6, 8, 10]), H = pick([1.0, 1.2, 1.4]);
  var H15 = Math.pow(H, 1.5);
  var correct = C * (L - 0.2 * H) * H15;
  var question = "A contracted rectangular weir with free discharge is " + L + " ft long with a head of " + H.toFixed(1) + " ft. Using the handbook with C = " + C + ", what is the discharge?";
  var solution = CT("water-091") + "\n\n$$Q = C (L - 0.2H) H^{3/2} = (" + C + ")(" + L + " - 0.2 \\times " + H.toFixed(1) + ")(" + H.toFixed(1) + ")^{3/2} = " + f1(correct) + "\\ \\text{cfs}$$";
  return { variantKey: "L" + L + "_H" + H, question: question, diagram: dWeirRect("contracted", L, H),
    options: [
      { label: f1(correct) + " cfs", num: correct, correct: true },
      { label: f1(C * L * H15) + " cfs", num: C * L * H15, correct: false },
      { label: f1(C * (L - 0.4 * H) * H15) + " cfs", num: C * (L - 0.4 * H) * H15, correct: false },
      { label: f1(C * L * H) + " cfs", num: C * L * H, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-092", topic: "Water Resources & Environmental", subtopic: "90 degree V-notch weir",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "90 deg V-notch: Q = C H^2.5. Using H^1.5 (the rectangular-weir exponent) gives the trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var C = 2.54, H = pick([0.8, 0.9, 1.0]);
  var correct = C * Math.pow(H, 2.5);
  var question = "A 90\\(^\\circ\\) V-notch weir has a head of " + H.toFixed(1) + " ft. Using the handbook with C = " + C + ", what is the discharge?";
  var solution = CT("water-092") + "\n\n$$Q = C H^{5/2} = (" + C + ")(" + H.toFixed(1) + ")^{5/2} = " + f2(correct) + "\\ \\text{cfs}$$";
  return { variantKey: "H" + H, question: question, diagram: dVnotch(H),
    options: [
      { label: f2(correct) + " cfs", num: correct, correct: true },
      { label: f2(C * Math.pow(H, 1.5)) + " cfs", num: C * Math.pow(H, 1.5), correct: false },
      { label: f2(C * Math.pow(H, 3.5)) + " cfs", num: C * Math.pow(H, 3.5), correct: false },
      { label: f2(correct * 0.55) + " cfs", num: correct * 0.55, correct: false }
    ], solution: solution };
});

/* ---- 093-094: Hazen-Williams ---- */
wreg({
  baseId: "water-093", topic: "Water Resources & Environmental", subtopic: "Hazen-Williams head loss",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Hazen-Williams head loss: hf = 10.44 L Q^1.85 / (C^1.85 d^4.87) with Q in gpm and d in inches. Mixing unit systems changes the answer by orders of magnitude.",
  videoUrl: null, videoTitle: null
}, function () {
  var din = pick([10, 12, 14]), L = pick([1500, 2000, 2500]), Q = pick([2.5, 3.0, 3.5]), C = 120;
  var Qgpm = Q * 448.831;
  var correct = 10.44 * L * Math.pow(Qgpm, 1.85) / (Math.pow(C, 1.85) * Math.pow(din, 4.87));
  var question = "A " + din + " in. pipe (" + f2(din / 12) + " ft) is " + f0c(L) + " ft long with C = " + C + " and carries " + Q.toFixed(1) + " cfs. Using the handbook head loss equation, what is hf?";
  var solution = CT("water-093") + "\n\n$$Q = " + Q.toFixed(1) + "\\ \\text{cfs} = " + f0c(Qgpm) + "\\ \\text{gpm}$$\n$$h_f = \\frac{10.44 L Q^{1.85}}{C^{1.85} d^{4.87}} = \\frac{10.44 (" + f0c(L) + ")(" + f0c(Qgpm) + ")^{1.85}}{(" + C + ")^{1.85} (" + din + ")^{4.87}} = " + f1(correct) + "\\ \\text{ft}$$";
  return { variantKey: [din, L, Q].join("_"), question: question,
    options: [
      { label: f1(correct) + " ft", num: correct, correct: true },
      { label: f1(2 * correct) + " ft", num: 2 * correct, correct: false },
      { label: f1(1.2 * correct) + " ft", num: 1.2 * correct, correct: false },
      { label: (correct / 1000).toFixed(4) + " ft", num: correct / 1000, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-094", topic: "Water Resources & Environmental", subtopic: "Hazen-Williams pressure loss, gpm",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Pressure drop per foot: 4.52 Q^1.85/(C^1.85 d^4.87) psi/ft with Q in gpm, d in inches. Forgetting the per-foot basis or misplacing C gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var din = pick([4, 6, 8]), Q = pick([250, 300, 350]), C = 120;
  var correct = 4.52 * Math.pow(Q, 1.85) / (Math.pow(C, 1.85) * Math.pow(din, 4.87));
  var question = "A " + din + " in. pipe with C = " + C + " carries " + Q + " gpm. Using the handbook pressure-loss equation for U.S. customary units, what is the pressure loss per foot of pipe?";
  var solution = CT("water-094") + "\n\n$$\\frac{\\Delta P}{L} = \\frac{4.52 Q^{1.85}}{C^{1.85} d^{4.87}} = \\frac{4.52 (" + Q + ")^{1.85}}{(" + C + ")^{1.85} (" + din + ")^{4.87}} = " + correct.toFixed(4) + "\\ \\text{psi/ft}$$";
  return { variantKey: [din, Q].join("_"), question: question,
    options: [
      { label: correct.toFixed(4) + " psi/ft", num: correct, correct: true },
      { label: (correct / 2.35).toFixed(4) + " psi/ft", num: correct / 2.35, correct: false },
      { label: (correct * 100).toFixed(2) + " psi/ft", num: correct * 100, correct: false },
      { label: f0c(correct * 180000) + " psi/ft", num: correct * 180000, correct: false }
    ], solution: solution };
});

/* ---- 096-097: hydrants ---- */
wreg({
  baseId: "water-096", topic: "Water Resources & Environmental", subtopic: "Hydrant rated capacity at 20 psi",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Rated capacity at 20 psi: QR = QF ((Ps - 20)/(Ps - Pr))^0.54. Inverting the pressure ratio or dropping the 0.54 exponent gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var QF = pick([900, 1000, 1100]), Ps = pick([55, 60, 65]), Pr = pick([35, 40, 45]);
  var correct = QF * Math.pow((Ps - 20) / (Ps - Pr), 0.54);
  var question = "A hydrant flow test gives a total test flow of " + f0c(QF) + " gpm with static pressure " + Ps + " psi and residual pressure " + Pr + " psi. Using the handbook formula, what is the rated capacity at 20 psi?";
  var solution = CT("water-096") + "\n\n$$Q_R = Q_F \\left(\\frac{P_s - 20}{P_s - P_r}\\right)^{0.54} = " + f0c(QF) + " \\left(\\frac{" + Ps + " - 20}{" + Ps + " - " + Pr + "}\\right)^{0.54} = " + f0c(correct) + "\\ \\text{gpm}$$";
  return { variantKey: [QF, Ps, Pr].join("_"), question: question,
    options: [
      { label: f0c(correct) + " gpm", num: correct, correct: true },
      { label: f0c(QF * Math.pow((Ps - Pr) / (Ps - 20), 0.54)) + " gpm", num: QF * Math.pow((Ps - Pr) / (Ps - 20), 0.54), correct: false },
      { label: f0c(2 * QF) + " gpm", num: 2 * QF, correct: false },
      { label: f0c(QF * 1.5) + " gpm", num: QF * 1.5, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-097", topic: "Water Resources & Environmental", subtopic: "Hydrant discharge to atmosphere",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Hydrant discharge: Q = 29.8 c d^2 sqrt(p), with c = 0.9 for a smooth, well-rounded outlet. Omitting the coefficient or squaring the pressure gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var d = pick([2.0, 2.5, 3.0]), p = pick([8, 10, 12]), c = 0.9;
  var correct = 29.8 * c * d * d * Math.sqrt(p);
  var question = "A hydrant outlet is " + d.toFixed(1) + " in. in diameter, smooth and well-rounded, with a pitot pressure of " + p + " psi. Using the handbook, what is the discharge?";
  var solution = CT("water-097") + "\n\n$$Q = 29.8\\, c\\, d^2 \\sqrt{p} = 29.8 (0.9) (" + d.toFixed(1) + ")^2 \\sqrt{" + p + "} = " + f0c(correct) + "\\ \\text{gpm}$$";
  return { variantKey: "d" + d + "_p" + p, question: question,
    options: [
      { label: f0c(correct) + " gpm", num: correct, correct: true },
      { label: f0c(29.8 * d * d * Math.sqrt(p)) + " gpm", num: 29.8 * d * d * Math.sqrt(p), correct: false },
      { label: f0c(29.8 * c * d * d * p) + " gpm", num: 29.8 * c * d * d * p, correct: false },
      { label: f0c(29.8 * c * d * Math.sqrt(p)) + " gpm", num: 29.8 * c * d * Math.sqrt(p), correct: false }
    ], solution: solution };
});

/* ---- 098: pan coefficient range (fixed fact) ---- */
wreg({
  baseId: "water-098", topic: "Water Resources & Environmental", subtopic: "Lake pan coefficient range",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "The handbook gives a pan coefficient range of roughly 0.3 to 0.85 for converting pan evaporation to lake evaporation.",
  videoUrl: null, videoTitle: null
}, function () {
  var question = "What range does the handbook give for the pan coefficient Pc used to convert pan evaporation to lake evaporation?";
  var solution = CT("water-098") + "\n\nThe handbook gives a pan coefficient \\(P_c\\) range of about 0.3 to 0.85, with 0.7 commonly used.";
  return { variantKey: "fixed", question: question,
    options: [
      { label: "0.3 to 0.85", num: 0.85, correct: true },
      { label: "0.7 to 1.2", num: null, correct: false },
      { label: "0.85 to 1.0", num: null, correct: false },
      { label: "0.1 to 0.5", num: null, correct: false }
    ], solution: solution };
});

/* ---- 099-102: pump power ---- */
wreg({
  baseId: "water-099", topic: "Water Resources & Environmental", subtopic: "Pump power with total efficiency",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "P(hp) = Q gamma h / (550 eta_total). Multiplying by the efficiency instead of dividing gives the low trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var Q = pick([1.5, 2.0, 2.5]), h = pick([70, 80, 90]), eff = pick([0.6, 0.7, 0.8]);
  var correct = Q * 62.4 * h / (550 * eff);
  var question = "A pump lifts " + Q.toFixed(1) + " cfs of water through a total head of " + h + " ft. The total (pump times motor) efficiency is " + eff.toFixed(1) + ". What input power is required?";
  var solution = CT("water-099") + "\n\n$$P = \\frac{Q \\gamma h}{550\\, \\eta} = \\frac{(" + Q.toFixed(1) + ")(62.4)(" + h + ")}{550 (" + eff.toFixed(1) + ")} = " + f1(correct) + "\\ \\text{hp}$$";
  return { variantKey: [Q, h, eff].join("_"), question: question,
    options: [
      { label: f1(correct) + " hp", num: correct, correct: true },
      { label: f1(correct * 1.1) + " hp", num: correct * 1.1, correct: false },
      { label: f1(correct / 2) + " hp", num: correct / 2, correct: false },
      { label: f1(correct * eff) + " hp", num: correct * eff, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-100", topic: "Water Resources & Environmental", subtopic: "Pump brake power",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Brake power = rho g Q H / eta_pump (SI). Omitting the efficiency division gives the fluid-power trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var Q = pick([0.04, 0.05, 0.06]), H = pick([35, 40, 45]), eta = pick([0.74, 0.78, 0.82]);
  var fluid = 9.81 * Q * H;
  var correct = fluid / eta;
  var question = "A pump delivers " + Q.toFixed(2) + " m\\(^3\\)/s of water with a head increase of " + H + " m at a pump efficiency of " + eta.toFixed(2) + ". What is the pump (brake) power?";
  var solution = CT("water-100") + "\n\n$$P = \\frac{\\rho g Q H}{\\eta_{pump}} = \\frac{(1000)(9.81)(" + Q.toFixed(2) + ")(" + H + ")}{" + eta.toFixed(2) + "} = " + f1(correct) + "\\ \\text{kW}$$";
  return { variantKey: [Q, H, eta].join("_"), question: question,
    options: [
      { label: f1(correct) + " kW", num: correct, correct: true },
      { label: f1(fluid) + " kW", num: fluid, correct: false },
      { label: f1(correct * 0.92) + " kW", num: correct * 0.92, correct: false },
      { label: f1(correct * 1.28) + " kW", num: correct * 1.28, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-101", topic: "Water Resources & Environmental", subtopic: "Purchased electrical power",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Purchased electrical power = brake power / motor efficiency. Multiplying by the motor efficiency instead of dividing gives the trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var brake = pick([20, 25.2, 30]), eta = pick([0.88, 0.90, 0.92]);
  var correct = brake / eta;
  var question = "A pump has a brake (shaft) power of " + brake + " kW and is driven by a motor with efficiency " + eta.toFixed(2) + ". What is the purchased electrical power?";
  var solution = CT("water-101") + "\n\n$$P_{elec} = \\frac{P_{brake}}{\\eta_{motor}} = \\frac{" + brake + "}{" + eta.toFixed(2) + "} = " + f1(correct) + "\\ \\text{kW}$$";
  return { variantKey: "b" + brake + "_e" + eta, question: question,
    options: [
      { label: f1(correct) + " kW", num: correct, correct: true },
      { label: f1(brake * eta) + " kW", num: brake * eta, correct: false },
      { label: f1(brake) + " kW", num: brake, correct: false },
      { label: f1(brake * 1.39) + " kW", num: brake * 1.39, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-102", topic: "Water Resources & Environmental", subtopic: "Total efficiency of a pump and motor",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "Total efficiency = pump efficiency x motor efficiency. Averaging or differencing the two gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var ep = pick([0.75, 0.80, 0.85]), em = pick([0.85, 0.90, 0.95]);
  var correct = ep * em;
  var question = "A pump has an efficiency of " + ep.toFixed(2) + " and its motor has an efficiency of " + em.toFixed(2) + ". What total efficiency applies in the pump power equation?";
  var solution = CT("water-102") + "\n\n$$\\eta_{total} = \\eta_{pump} \\times \\eta_{motor} = (" + ep.toFixed(2) + ")(" + em.toFixed(2) + ") = " + f2(correct) + "$$";
  return { variantKey: "p" + ep + "_m" + em, question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(Math.abs(ep - em)), num: Math.abs(ep - em), correct: false },
      { label: f2((ep + em) / 2), num: (ep + em) / 2, correct: false },
      { label: f2((ep + em) / 2 - 0.05), num: (ep + em) / 2 - 0.05, correct: false }
    ], solution: solution };
});

/* ---- 103-105: NPSH ---- */
wreg({
  baseId: "water-103", topic: "Water Resources & Environmental", subtopic: "NPSH available",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "NPSHA = h_atm + h_s - h_f - h_vp with positive static head when the surface is above the impeller. Subtracting the static head instead of adding gives the low trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var hatm = 33.9, hs = pick([6.0, 8.0, 10.0]), hf = pick([2.0, 2.5, 3.0]), hvp = pick([0.6, 0.8, 1.0]);
  var correct = hatm + hs - hf - hvp;
  var question = "A pump draws water from an open sump at sea level (atmospheric head " + hatm + " ft). The liquid surface is " + hs.toFixed(1) + " ft above the impeller centerline, the suction line friction loss is " + hf.toFixed(1) + " ft and the vapor pressure head is " + hvp.toFixed(1) + " ft. What is NPSH available?";
  var solution = CT("water-103") + "\n\n$$NPSH_A = h_{atm} + h_s - h_f - h_{vp} = " + hatm + " + " + hs.toFixed(1) + " - " + hf.toFixed(1) + " - " + hvp.toFixed(1) + " = " + f1(correct) + "\\ \\text{ft}$$";
  return { variantKey: [hs, hf, hvp].join("_"), question: question, diagram: dNPSH(hatm, hs, hf, hvp, false),
    options: [
      { label: f1(correct) + " ft", num: correct, correct: true },
      { label: f1(hatm + hs + hf + hvp) + " ft", num: hatm + hs + hf + hvp, correct: false },
      { label: f1(hatm - hs + hf + hvp) + " ft", num: hatm - hs + hf + hvp, correct: false },
      { label: f1(hatm + hs - 2 * hf - hvp) + " ft", num: hatm + hs - 2 * hf - hvp, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-104", topic: "Water Resources & Environmental", subtopic: "NPSH available with a suction lift",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "With a suction lift the static suction head is negative: NPSHA = h_atm - lift - h_f - h_vp. Adding the lift instead of subtracting gives the high trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var hatm = 33.9, lift = pick([10, 12, 14]), hf = pick([2.0, 2.5, 3.0]), hvp = pick([0.6, 0.8, 1.0]);
  var correct = hatm - lift - hf - hvp;
  var question = "A pump sits " + lift + " ft above the water surface in a sump (a suction lift, so the handbook static suction head is negative). With atmospheric head " + hatm + " ft, friction loss " + hf.toFixed(1) + " ft and vapor pressure head " + hvp.toFixed(1) + " ft, what is NPSH available?";
  var solution = CT("water-104") + "\n\n$$NPSH_A = h_{atm} - h_{lift} - h_f - h_{vp} = " + hatm + " - " + lift + " - " + hf.toFixed(1) + " - " + hvp.toFixed(1) + " = " + f1(correct) + "\\ \\text{ft}$$";
  return { variantKey: [lift, hf, hvp].join("_"), question: question, diagram: dNPSH(hatm, lift, hf, hvp, true),
    options: [
      { label: f1(correct) + " ft", num: correct, correct: true },
      { label: f1(hatm - lift + hf + hvp) + " ft", num: hatm - lift + hf + hvp, correct: false },
      { label: f1(hatm + lift - hf - hvp) + " ft", num: hatm + lift - hf - hvp, correct: false },
      { label: f1(hatm + lift + hf + hvp) + " ft", num: hatm + lift + hf + hvp, correct: false }
    ], solution: solution };
});
wreg({
  baseId: "water-105", topic: "Water Resources & Environmental", subtopic: "NPSH available from inlet conditions",
  difficulty: "hard", estimatedTimeSeconds: 120,
  explanation: "NPSHA = (p_inlet - p_vapor)/gamma + V^2/(2g). Omitting the velocity head, or dividing pressure by 144 the wrong way, gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var p = pick([20, 22, 24]), V = pick([5.0, 6.0, 7.0]), pv = pick([0.26, 0.36, 0.46]);
  var gam = 62.4;
  var ph = (p - pv) * 144 / gam;
  var vh = V * V / (2 * 32.2);
  var correct = ph + vh;
  var question = "At a pump inlet the absolute pressure is " + p + " psi, the velocity is " + V.toFixed(1) + " ft/s and the vapor pressure is " + pv.toFixed(2) + " psi (water, \\(\\gamma\\) = 62.4 lb/ft\\(^3\\)). What is NPSH available?";
  var solution = CT("water-105") + "\n\n$$NPSH_A = \\frac{(p - p_v) \\times 144}{\\gamma} + \\frac{V^2}{2g} = \\frac{(" + p + " - " + pv.toFixed(2) + ")(144)}{62.4} + \\frac{" + V.toFixed(1) + "^2}{2(32.2)} = " + f1(correct) + "\\ \\text{ft}$$";
  return { variantKey: [p, V, pv].join("_"), question: question,
    options: [
      { label: f1(correct) + " ft", num: correct, correct: true },
      { label: f1(vh) + " ft", num: vh, correct: false },
      { label: f1(ph) + " ft", num: ph, correct: false },
      { label: f1(ph + 2 * vh) + " ft", num: ph + 2 * vh, correct: false }
    ], solution: solution };
});

window.WATER_GENERATORS = WATER_ENTRIES;
})();
