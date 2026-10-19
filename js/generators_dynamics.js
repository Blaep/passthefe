/* PassTheFE randomized practice — Dynamics generators.
 *
 * Plain script (no modules) for the static site. Defines window.DYNAMICS_GENERATORS:
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
  var DYN_ENTRIES = [];
  function reg(e) { DYN_ENTRIES.push(e); return e; }

/* ---- dynamics diagrams ---- */
function dDynProjectile(v, deg) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220" role="img" aria-label="Projectile launched at ' + v + ' feet per second at ' + deg + ' degrees above horizontal from level ground"><rect width="480" height="220" fill="#ffffff"/>' + AH;
  s += '<line x1="30" y1="185" x2="450" y2="185" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<path d="M 60 185 Q 240 -30 420 185" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-dasharray="6 4"/>';
  s += '<line x1="60" y1="185" x2="150" y2="135" stroke="#c0392b" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<path d="M 110 185 A 50 50 0 0 0 98 162" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="118" y="180" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">' + deg + '\u00B0</text>';
  s += '<text x="100" y="130" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#c0392b">v\u2080 = ' + v + ' ft/s</text>';
  s += '<text x="240" y="212" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">level ground, R = ?</text>';
  return svgURL(s + '</svg>');
}
function dDynSpring(m, k, x) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180" viewBox="0 0 480 180" role="img" aria-label="Block of ' + m + ' kilograms pressed against a spring of stiffness ' + k + ' newtons per meter compressed ' + x + ' meters on a frictionless surface"><rect width="480" height="180" fill="#ffffff"/>' + AH;
  s += '<line x1="30" y1="130" x2="450" y2="130" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<line x1="60" y1="50" x2="60" y2="130" stroke="#1a1a1a" stroke-width="4"/>';
  var coils = '';
  for (var i = 0; i < 6; i++) coils += 'L ' + (70 + i * 12) + ' ' + (i % 2 ? 75 : 95) + ' ';
  s += '<path d="M 60 85 ' + coils + 'L 145 85" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>';
  s += '<rect x="145" y="65" width="80" height="65" fill="#c9d6e8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="185" y="102" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">' + m + ' kg</text>';
  s += '<text x="105" y="45" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">k = ' + k + ' N/m</text>';
  s += '<line x1="250" y1="65" x2="250" y2="130" stroke="#c0392b" stroke-width="1.5" stroke-dasharray="4 3"/>';
  s += '<text x="238" y="152" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="end" fill="#c0392b">x = ' + x.toFixed(2) + ' m compression</text>';
  s += '<line x1="300" y1="97" x2="370" y2="97" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="305" y="88" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1d4ed8">v = ?</text>';
  return svgURL(s + '</svg>');
}
function dDynImpact(m1, v1, m2, v2, e) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="170" viewBox="0 0 480 170" role="img" aria-label="A ' + m1 + ' kilogram body moving at ' + v1 + ' meters per second hits a ' + m2 + ' kilogram body moving at ' + v2 + ' meters per second in the same line, coefficient of restitution ' + e + '"><rect width="480" height="170" fill="#ffffff"/>' + AH;
  s += '<line x1="30" y1="120" x2="450" y2="120" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<rect x="70" y="60" width="70" height="60" fill="#c9d6e8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="105" y="96" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">' + m1 + ' kg</text>';
  s += '<rect x="300" y="60" width="70" height="60" fill="#d8c9e8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="335" y="96" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">' + m2 + ' kg</text>';
  s += '<line x1="150" y1="90" x2="215" y2="90" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="155" y="78" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1d4ed8">' + v1 + ' m/s</text>';
  s += '<line x1="290" y1="90" x2="' + (v2 < 0 ? 225 : 355) + '" y2="90" stroke="#c0392b" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="240" y="78" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#c0392b">' + v2 + ' m/s</text>';
  s += '<text x="240" y="152" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">e = ' + e + ', positive = right</text>';
  return svgURL(s + '</svg>');
}
function dDynRotors(I1, w1, I2) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180" viewBox="0 0 480 180" role="img" aria-label="A rotor with moment of inertia ' + I1 + ' spinning at ' + w1 + ' radians per second is coupled to a stationary rotor with moment of inertia ' + I2 + ' on the same axis"><rect width="480" height="180" fill="#ffffff"/>' + AH;
  s += '<line x1="40" y1="90" x2="440" y2="90" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<circle cx="150" cy="90" r="48" fill="#c9d6e8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<circle cx="330" cy="90" r="48" fill="#d8c9e8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<path d="M 150 42 A 48 48 0 0 1 192 68" fill="none" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="150" y="95" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">I = ' + I1 + '</text>';
  s += '<text x="330" y="95" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">I = ' + I2 + '</text>';
  s += '<text x="150" y="160" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1d4ed8">\u03C9 = ' + w1 + ' rad/s</text>';
  s += '<text x="330" y="160" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">stationary</text>';
  return svgURL(s + '</svg>');
}

var C_DYN_RECT = "Refer to Particle Rectilinear Motion (constant acceleration) in the Dynamics section of the FE Reference Handbook (v10.6), printed page 103 (PDF page 109).";
var C_DYN_CURV = "Refer to Particle Curvilinear Motion (x, y coordinates) and constant acceleration in the Dynamics section of the FE Reference Handbook (v10.6), printed page 103 (PDF page 109).";
var C_DYN_FORCE = "Refer to constant force equations (ax = Fx/m) in the Dynamics section of the FE Reference Handbook (v10.6), printed page 107 (PDF page 113).";
var C_DYN_WE = "Refer to Principle of Work and Energy in the Dynamics section of the FE Reference Handbook (v10.6), printed page 107 (PDF page 113).";
var C_DYN_WEN = "Refer to Principle of Work and Energy (nonconservative forces) in the Dynamics section of the FE Reference Handbook (v10.6), printed page 107 (PDF page 113).";
var C_DYN_SPR = "Refer to Elastic Potential Energy in the Dynamics section of the FE Reference Handbook (v10.6), printed page 108 (PDF page 114).";
var C_DYN_SPR2 = "Refer to Elastic Potential Energy and conservation of energy (page 107) in the Dynamics section of the FE Reference Handbook (v10.6), printed page 108 (PDF page 114).";
var C_DYN_PWR = "Refer to Power and Efficiency in the Dynamics section of the FE Reference Handbook (v10.6), printed page 108 (PDF page 114).";
var C_DYN_IMP = "Refer to Impact in the Dynamics section of the FE Reference Handbook (v10.6), printed page 109 (PDF page 115).";
var C_DYN_ROT = "Refer to Rigid Body Rotation About a Fixed Axis in the Dynamics section of the FE Reference Handbook (v10.6), printed page 110 (PDF page 116).";
var C_DYN_ROTC = "Refer to Rigid Body Rotation About a Fixed Axis (constant \u03B1) in the Dynamics section of the FE Reference Handbook (v10.6), printed page 110 (PDF page 116).";
var C_DYN_IC = "Refer to Instantaneous Center of Rotation in the Dynamics section of the FE Reference Handbook (v10.6), printed page 111 (PDF page 117).";
var C_DYN_PA = "Refer to Parallel-Axis Theorem in the Dynamics section of the FE Reference Handbook (v10.6), printed page 112 (PDF page 118).";
var C_DYN_RG = "Refer to Mass Radius of Gyration in the Dynamics section of the FE Reference Handbook (v10.6), printed page 112 (PDF page 118).";
var C_DYN_KE = "Refer to Kinetic Energy in the Dynamics section of the FE Reference Handbook (v10.6), printed page 112 (PDF page 118).";
var C_DYN_AM = "Refer to Conservation of Angular Momentum in the Dynamics section of the FE Reference Handbook (v10.6), printed page 112 (PDF page 118).";

function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
function f1(x) { return (Math.round(x * 10) / 10).toFixed(1); }
function f0c(x) { return Math.round(x).toLocaleString("en-US"); }

/* ---- dynamics-035 ---- */
reg(buildGenerator({
  baseId: "dynamics-035", topic: "Dynamics", subtopic: "Constant acceleration distance",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps drop the initial-velocity term, drop the 1/2, or add v0*t + a*t^2.",
  videoUrl: null, videoTitle: null
}, function () {
  var v0 = pick([8, 10, 12, 15]), a = pick([3, 4, 5]), t = pick([6, 8, 10]);
  var correct = v0 * t + 0.5 * a * t * t;
  var question = "A particle with initial velocity " + v0 + " ft/s accelerates uniformly at " + a + " ft/s\u00B2 for " + t + " s. How far does it travel?";
  var solution = C_DYN_RECT + "\n\n$$s = v_0 t + \\tfrac{1}{2} a t^2 = (" + v0 + ")(" + t + ") + \\tfrac{1}{2}(" + a + ")(" + t + ")^2 = " + f0c(correct) + "\\ \\text{ft}$$";
  return {
    variantKey: "v" + v0 + "_a" + a + "_t" + t,
    question: question,
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(0.5 * a * t * t) + " ft", num: 0.5 * a * t * t, correct: false },
      { label: f0c(v0 * t) + " ft", num: v0 * t, correct: false },
      { label: f0c(v0 * t + a * t * t) + " ft", num: v0 * t + a * t * t, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-036 ---- */
reg(buildGenerator({
  baseId: "dynamics-036", topic: "Dynamics", subtopic: "Acceleration from velocities and distance",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps use (v-u)/s, double the answer, or halve it.",
  videoUrl: null, videoTitle: null
}, function () {
  var u = pick([5, 10, 15]), v = pick([20, 25, 30, 35]), s = pick([150, 200, 250]);
  var correct = (v * v - u * u) / (2 * s);
  var question = "A car speeds up from " + u + " ft/s to " + v + " ft/s over " + s + " ft with constant acceleration. What is the acceleration?";
  var solution = C_DYN_RECT + "\n\n$$a = \\frac{v^2 - u^2}{2s} = \\frac{" + v + "^2 - " + u + "^2}{2(" + s + ")} = " + f2(correct) + "\\ \\text{ft/s}^2$$";
  return {
    variantKey: "u" + u + "_v" + v + "_s" + s,
    question: question,
    options: [
      { label: f2(correct) + " ft/s\u00B2", num: correct, correct: true },
      { label: f2((v - u) / s) + " ft/s\u00B2", num: (v - u) / s, correct: false },
      { label: f2(2 * correct) + " ft/s\u00B2", num: 2 * correct, correct: false },
      { label: f2(correct / 2) + " ft/s\u00B2", num: correct / 2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-037: projectile range ---- */
reg(buildGenerator({
  baseId: "dynamics-037", topic: "Dynamics", subtopic: "Projectile range",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "The traps use sin(theta) instead of sin(2theta), halve the range, or scale it down.",
  videoUrl: null, videoTitle: null
}, function () {
  var v = pick([60, 70, 80, 90, 100]), deg = pick([25, 30, 35, 40, 45]);
  var g = 32.2, rad = deg * Math.PI / 180;
  var correct = v * v * Math.sin(2 * rad) / g;
  var dSin = v * v * Math.sin(rad) / g;
  var dHalf = correct / 2;
  var dScale = correct * 0.71;
  var question = "A projectile launches at " + v + " ft/s at " + deg + "\u00B0 above horizontal from level ground (g = 32.2 ft/s\u00B2). Using constant-acceleration kinematics in x and y, what is the horizontal range?";
  var solution = C_DYN_CURV + "\n\n$$R = \\frac{v_0^2 \\sin 2\\theta}{g} = \\frac{" + v + "^2 \\sin " + (2 * deg) + "^\\circ}{32.2} = " + f0c(correct) + "\\ \\text{ft}$$";
  return {
    variantKey: "v" + v + "_d" + deg,
    question: question, diagram: dDynProjectile(v, deg),
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(dSin) + " ft", num: dSin, correct: false },
      { label: f0c(dHalf) + " ft", num: dHalf, correct: false },
      { label: f0c(dScale) + " ft", num: dScale, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-038 ---- */
reg(buildGenerator({
  baseId: "dynamics-038", topic: "Dynamics", subtopic: "Constant force kinematics",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps are F*t without dividing by m, F/m without the time, and half the answer.",
  videoUrl: null, videoTitle: null
}, function () {
  var m = pick([40, 50, 60]), F = pick([100, 120, 150]), t = pick([4, 5, 6, 8]);
  var correct = F * t / m;
  var question = "A " + m + " slug block starts at rest and is pushed by a constant " + F + " lb force for " + t + " s on a frictionless surface. What is its speed?";
  var solution = C_DYN_FORCE + "\n\n$$a = \\frac{F}{m} = \\frac{" + F + "}{" + m + "}, \\quad v = at = \\frac{" + F + " \\times " + t + "}{" + m + "} = " + f1(correct) + "\\ \\text{ft/s}$$";
  return {
    variantKey: "m" + m + "_F" + F + "_t" + t,
    question: question,
    options: [
      { label: f1(correct) + " ft/s", num: correct, correct: true },
      { label: f0c(F * t) + " ft/s", num: F * t, correct: false },
      { label: f1(F / m) + " ft/s", num: F / m, correct: false },
      { label: f1(correct / 2) + " ft/s", num: correct / 2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-039 ---- */
reg(buildGenerator({
  baseId: "dynamics-039", topic: "Dynamics", subtopic: "Conservation of energy, drop",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps report 2gh, sqrt(gh), or half the speed.",
  videoUrl: null, videoTitle: null
}, function () {
  var m = pick([2.0, 3.0, 4.0, 5.0]), h = pick([10, 15, 20, 25]);
  var g = 32.2;
  var correct = Math.sqrt(2 * g * h);
  var question = "A " + m.toFixed(1) + " slug object falls from rest through " + h.toFixed(1) + " ft with no energy loss (g = 32.2 ft/s\u00B2). Using the handbook energy equation, what is its speed at the bottom?";
  var solution = C_DYN_WE + "\n\n$$v = \\sqrt{2gh} = \\sqrt{2(32.2)(" + h.toFixed(1) + ")} = " + f1(correct) + "\\ \\text{ft/s}$$";
  return {
    variantKey: "m" + m + "_h" + h,
    question: question,
    options: [
      { label: f1(correct) + " ft/s", num: correct, correct: true },
      { label: f0c(2 * g * h) + " ft/s", num: 2 * g * h, correct: false },
      { label: f1(Math.sqrt(g * h)) + " ft/s", num: Math.sqrt(g * h), correct: false },
      { label: f1(correct / 2) + " ft/s", num: correct / 2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-040 ---- */
reg(buildGenerator({
  baseId: "dynamics-040", topic: "Dynamics", subtopic: "Work done by friction",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The friction work is negative; the traps flip the sign, drop the distance, or quadruple it.",
  videoUrl: null, videoTitle: null
}, function () {
  var W = pick([60, 80, 100]), s = pick([40, 50, 60]), mu = pick([0.20, 0.25, 0.30, 0.35]);
  var correct = -mu * W * s;
  var question = "A " + W + " lb crate slides " + s + " ft on a level floor with a kinetic friction coefficient of " + mu.toFixed(2) + ". Using the handbook work-energy equation with nonconservative forces, what is the work U\u2081\u2192\u2082 done by friction?";
  var solution = C_DYN_WEN + "\n\n$$U_{1\\to2} = -\\mu_k N s = -(" + mu.toFixed(2) + ")(" + W + ")(" + s + ") = " + f0c(correct) + "\\ \\text{ft-lb}$$";
  return {
    variantKey: "W" + W + "_s" + s + "_m" + mu,
    question: question,
    options: [
      { label: f0c(correct) + " ft-lb", num: correct, correct: true },
      { label: f0c(-correct) + " ft-lb", num: -correct, correct: false },
      { label: f1(-mu * W) + " ft-lb", num: -mu * W, correct: false },
      { label: f0c(4 * correct) + " ft-lb", num: 4 * correct, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-041 ---- */
reg(buildGenerator({
  baseId: "dynamics-041", topic: "Dynamics", subtopic: "Spring potential energy change",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The change uses s2^2 - s1^2; the traps use (s2 - s1)^2, drop the 1/2, or use k(s2 - s1).",
  videoUrl: null, videoTitle: null
}, function () {
  var k = pick([30, 40, 50, 60]), s1 = pick([0.3, 0.4, 0.5]), s2 = pick([1.2, 1.5, 1.8, 2.0]);
  var correct = 0.5 * k * (s2 * s2 - s1 * s1);
  var question = "A spring with k = " + k + " lb/in. is stretched from s\u2081 = " + s1.toFixed(1) + " in. to s\u2082 = " + s2.toFixed(1) + " in. What is the change in stored potential energy?";
  var solution = C_DYN_SPR + "\n\n$$\\Delta V = \\tfrac{1}{2} k (s_2^2 - s_1^2) = \\tfrac{1}{2}(" + k + ")(" + s2.toFixed(1) + "^2 - " + s1.toFixed(1) + "^2) = " + f0c(correct) + "\\ \\text{in.-lb}$$";
  return {
    variantKey: "k" + k + "_s1_" + s1 + "_s2_" + s2,
    question: question,
    options: [
      { label: f0c(correct) + " in.-lb", num: correct, correct: true },
      { label: f0c(2 * correct) + " in.-lb", num: 2 * correct, correct: false },
      { label: f0c(0.5 * k * (s2 - s1) * (s2 - s1)) + " in.-lb", num: 0.5 * k * (s2 - s1) * (s2 - s1), correct: false },
      { label: f0c(k * (s2 - s1)) + " in.-lb", num: k * (s2 - s1), correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-042: spring launch ---- */
reg(buildGenerator({
  baseId: "dynamics-042", topic: "Dynamics", subtopic: "Spring launch speed",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "v = sqrt(k/m) x; the traps skip the square root, skip the 1/2 cancellation, or multiply by sqrt(2).",
  videoUrl: null, videoTitle: null
}, function () {
  var m = pick([0.4, 0.5, 0.8, 1.0]), k = pick([500, 800, 1000, 1200]), x = pick([0.08, 0.10, 0.12, 0.15]);
  var correct = Math.sqrt(k / m) * x;
  var question = "A " + m + " kg block is pressed against a spring (k = " + k + " N/m) compressed " + x.toFixed(2) + " m and released on a frictionless surface. What is its speed leaving the spring?";
  var solution = C_DYN_SPR2 + "\n\n$$\\tfrac{1}{2}kx^2 = \\tfrac{1}{2}mv^2 \\Rightarrow v = \\sqrt{\\frac{k}{m}}\\,x = \\sqrt{\\frac{" + k + "}{" + m + "}}(" + x.toFixed(2) + ") = " + f2(correct) + "\\ \\text{m/s}$$";
  return {
    variantKey: "m" + m + "_k" + k + "_x" + x,
    question: question, diagram: dDynSpring(m, k, x),
    options: [
      { label: f2(correct) + " m/s", num: correct, correct: true },
      { label: f1(k * x / m) + " m/s", num: k * x / m, correct: false },
      { label: f2(Math.SQRT2 * correct) + " m/s", num: Math.SQRT2 * correct, correct: false },
      { label: f2(Math.sqrt(k * x / m)) + " m/s", num: Math.sqrt(k * x / m), correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-043 ---- */
reg(buildGenerator({
  baseId: "dynamics-043", topic: "Dynamics", subtopic: "Power and efficiency",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Input power divides the useful output by the efficiency; multiplying by it or reporting the output gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var W = pick([400, 500, 600]), h = pick([15, 20, 25]), t = pick([8, 10, 12]), eta = pick([0.75, 0.80, 0.85, 0.90]);
  var correct = W * h / (t * eta);
  var question = "A motor lifts a " + W + " lb load " + h + " ft in " + t + " s. The motor is " + Math.round(eta * 100) + "% efficient. What power must the motor draw (input)?";
  var solution = C_DYN_PWR + "\n\n$$P_{in} = \\frac{Wh}{t\\eta} = \\frac{(" + W + ")(" + h + ")}{(" + t + ")(" + eta.toFixed(2) + ")} = " + f0c(correct) + "\\ \\text{ft-lb/s}$$";
  return {
    variantKey: "W" + W + "_h" + h + "_t" + t + "_e" + eta,
    question: question,
    options: [
      { label: f0c(correct) + " ft-lb/s", num: correct, correct: true },
      { label: f0c(W * h / t) + " ft-lb/s", num: W * h / t, correct: false },
      { label: f0c(W * h / t * eta) + " ft-lb/s", num: W * h / t * eta, correct: false },
      { label: f2(W * h / t / 550) + " ft-lb/s", num: W * h / t / 550, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-044: impact ---- */
reg(buildGenerator({
  baseId: "dynamics-044", topic: "Dynamics", subtopic: "Impact, velocity after collision",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "The traps give the other body's velocity, the perfectly-plastic common velocity, or swap the masses in the restitution term.",
  videoUrl: null, videoTitle: null
}, function () {
  var m1 = pick([3, 4, 5]), m2 = pick([5, 6, 8]), v1 = pick([4, 5, 6]), v2 = pick([-3, -2, -1]), e = pick([0.4, 0.5, 0.6, 0.7, 0.8]);
  var M = m1 + m2;
  var correct = (m1 * v1 + m2 * v2 + m1 * e * (v1 - v2)) / M;
  var dV1 = (m1 * v1 + m2 * v2 - m2 * e * (v1 - v2)) / M;
  var dPlastic = (m1 * v1 + m2 * v2) / M;
  var dSwap = (m1 * v1 + m2 * v2 + m2 * e * (v1 - v2)) / M;
  var question = "A " + m1 + " kg body moving at " + v1 + " m/s hits a " + m2 + " kg body moving at " + v2 + " m/s in the same line (positive = right). The coefficient of restitution is " + e + ". What is the velocity of the " + m2 + " kg body after impact?";
  var solution = C_DYN_IMP + "\n\n$$v_2' = \\frac{m_1 v_1 + m_2 v_2 + m_1 e (v_1 - v_2)}{m_1 + m_2} = \\frac{(" + m1 + ")(" + v1 + ") + (" + m2 + ")(" + v2 + ") + (" + m1 + ")(" + e + ")(" + (v1 - v2) + ")}{" + M + "} = " + f2(correct) + "\\ \\text{m/s}$$";
  return {
    variantKey: "m" + m1 + "_" + m2 + "_v" + v1 + "_" + v2 + "_e" + e,
    question: question, diagram: dDynImpact(m1, v1, m2, v2, e),
    options: [
      { label: f2(correct) + " m/s", num: correct, correct: true },
      { label: f2(dV1) + " m/s", num: dV1, correct: false },
      { label: f2(dPlastic) + " m/s", num: dPlastic, correct: false },
      { label: f2(dSwap) + " m/s", num: dSwap, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-045 ---- */
reg(buildGenerator({
  baseId: "dynamics-045", topic: "Dynamics", subtopic: "Angular acceleration from torque",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps invert the ratio, multiply, or divide T by I squared.",
  videoUrl: null, videoTitle: null
}, function () {
  var I = pick([6, 8, 10, 12]), T = pick([90, 120, 150, 180]);
  var correct = T / I;
  var question = "A shaft with a mass moment of inertia of " + I.toFixed(1) + " kg\u00B7m\u00B2 about its axis is acted on by a constant net torque of " + T + " N\u00B7m. What is its angular acceleration?";
  var solution = C_DYN_ROT + "\n\n$$\\alpha = \\frac{T}{I} = \\frac{" + T + "}{" + I.toFixed(1) + "} = " + f2(correct) + "\\ \\text{rad/s}^2$$";
  return {
    variantKey: "I" + I + "_T" + T,
    question: question,
    options: [
      { label: f2(correct) + " rad/s\u00B2", num: correct, correct: true },
      { label: (Math.round(I / T * 1000) / 1000).toFixed(3) + " rad/s\u00B2", num: I / T, correct: false },
      { label: f1(T * I) + " rad/s\u00B2", num: T * I, correct: false },
      { label: f2(T / (I * I)) + " rad/s\u00B2", num: T / (I * I), correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-046 ---- */
reg(buildGenerator({
  baseId: "dynamics-046", topic: "Dynamics", subtopic: "Angular velocity after a time",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps use the average of initial and final, t squared, or just the time.",
  videoUrl: null, videoTitle: null
}, function () {
  var w0 = pick([0, 2, 4]), al = pick([10, 15, 20]), t = pick([4, 5, 6]);
  var correct = w0 + al * t;
  var question = "The shaft has an angular acceleration of " + f2(al) + " rad/s\u00B2 and starts at " + w0.toFixed(1) + " rad/s. What is its angular velocity after " + t + " s?";
  var solution = C_DYN_ROTC + "\n\n$$\\omega = \\omega_0 + \\alpha t = " + w0.toFixed(1) + " + (" + al + ")(" + t + ") = " + f1(correct) + "\\ \\text{rad/s}$$";
  return {
    variantKey: "w" + w0 + "_a" + al + "_t" + t,
    question: question,
    options: [
      { label: f1(correct) + " rad/s", num: correct, correct: true },
      { label: f1((w0 + correct) / 2) + " rad/s", num: (w0 + correct) / 2, correct: false },
      { label: f0c(w0 + al * t * t) + " rad/s", num: w0 + al * t * t, correct: false },
      { label: f2(t) + " rad/s", num: t, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-047 ---- */
reg(buildGenerator({
  baseId: "dynamics-047", topic: "Dynamics", subtopic: "Angular displacement",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps drop the 1/2, add omega_0 without multiplying by t, or use omega_0*t + alpha*t.",
  videoUrl: null, videoTitle: null
}, function () {
  var w0 = pick([0, 2, 4]), al = pick([10, 15, 20]), t = pick([4, 5, 6]);
  var correct = w0 * t + 0.5 * al * t * t;
  var question = "A wheel starts at " + w0.toFixed(1) + " rad/s with a constant angular acceleration of " + f2(al) + " rad/s\u00B2. Through what angle does it turn in " + t + " s?";
  var solution = C_DYN_ROTC + "\n\n$$\\theta = \\omega_0 t + \\tfrac{1}{2}\\alpha t^2 = (" + w0.toFixed(1) + ")(" + t + ") + \\tfrac{1}{2}(" + al + ")(" + t + ")^2 = " + f1(correct) + "\\ \\text{rad}$$";
  return {
    variantKey: "w" + w0 + "_a" + al + "_t" + t,
    question: question,
    options: [
      { label: f1(correct) + " rad", num: correct, correct: true },
      { label: f1(w0 * t + al * t * t) + " rad", num: w0 * t + al * t * t, correct: false },
      { label: f1(w0 + 0.5 * al * t * t) + " rad", num: w0 + 0.5 * al * t * t, correct: false },
      { label: f1(w0 * t + al * t) + " rad", num: w0 * t + al * t, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-048 ---- */
reg(buildGenerator({
  baseId: "dynamics-048", topic: "Dynamics", subtopic: "Angular acceleration from speeds and angle",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps divide by theta instead of 2theta, use (w-w0)/theta, or halve the speed difference.",
  videoUrl: null, videoTitle: null
}, function () {
  var w0 = pick([5, 10, 15]), w = pick([20, 25, 30, 35]), th = pick([40, 50, 60, 80]);
  var correct = (w * w - w0 * w0) / (2 * th);
  var question = "A flywheel speeds up from " + w0 + " rad/s to " + w + " rad/s while turning through " + th + " rad at constant angular acceleration. What is the angular acceleration?";
  var solution = C_DYN_ROTC + "\n\n$$\\alpha = \\frac{\\omega^2 - \\omega_0^2}{2\\theta} = \\frac{" + w + "^2 - " + w0 + "^2}{2(" + th + ")} = " + f2(correct) + "\\ \\text{rad/s}^2$$";
  return {
    variantKey: "w0_" + w0 + "_w" + w + "_th" + th,
    question: question,
    options: [
      { label: f2(correct) + " rad/s\u00B2", num: correct, correct: true },
      { label: f2((w * w - w0 * w0) / th) + " rad/s\u00B2", num: (w * w - w0 * w0) / th, correct: false },
      { label: f2((w - w0) / th) + " rad/s\u00B2", num: (w - w0) / th, correct: false },
      { label: f2((w - w0) / 2) + " rad/s\u00B2", num: (w - w0) / 2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-049 ---- */
reg(buildGenerator({
  baseId: "dynamics-049", topic: "Dynamics", subtopic: "Number of instant centers",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "N = n(n-1)/2; the traps report n, n(n-1), or n + N.",
  videoUrl: null, videoTitle: null
}, function () {
  var n = pick([3, 4, 5, 6, 8]);
  var correct = n * (n - 1) / 2;
  var question = "A mechanism has " + n + " links, counting the ground. How many instantaneous centers does it have?";
  var solution = C_DYN_IC + "\n\n$$N = \\frac{n(n-1)}{2} = \\frac{" + n + " \\times " + (n - 1) + "}{2} = " + correct + "$$";
  return {
    variantKey: "n" + n,
    question: question,
    options: [
      { label: String(correct), num: correct, correct: true },
      { label: String(n), num: n, correct: false },
      { label: String(n * (n - 1)), num: n * (n - 1), correct: false },
      { label: String(n + correct), num: n + correct, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-051 ---- */
reg(buildGenerator({
  baseId: "dynamics-051", topic: "Dynamics", subtopic: "Mass moment of inertia, parallel axis",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps subtract md^2, forget to square d, or halve the md^2 term.",
  videoUrl: null, videoTitle: null
}, function () {
  var m = pick([8, 10, 12]), Ic = pick([3.0, 4.0, 5.0, 6.0]), d = pick([0.4, 0.5, 0.6]);
  var correct = Ic + m * d * d;
  var question = "A body of mass " + m + " kg has a mass moment of inertia of " + Ic.toFixed(1) + " kg\u00B7m\u00B2 about an axis through its mass center. What is its mass moment of inertia about a parallel axis " + d.toFixed(1) + " m from the mass center?";
  var solution = C_DYN_PA + "\n\n$$I = I_c + md^2 = " + Ic.toFixed(1) + " + (" + m + ")(" + d.toFixed(1) + ")^2 = " + f2(correct) + "\\ \\text{kg\\cdot m}^2$$";
  return {
    variantKey: "m" + m + "_I" + Ic + "_d" + d,
    question: question,
    options: [
      { label: f2(correct) + " kg\u00B7m\u00B2", num: correct, correct: true },
      { label: f2(Ic - m * d * d) + " kg\u00B7m\u00B2", num: Ic - m * d * d, correct: false },
      { label: f2(Ic + m * d) + " kg\u00B7m\u00B2", num: Ic + m * d, correct: false },
      { label: f2(Ic + m * d * d / 2) + " kg\u00B7m\u00B2", num: Ic + m * d * d / 2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-052 ---- */
reg(buildGenerator({
  baseId: "dynamics-052", topic: "Dynamics", subtopic: "Mass radius of gyration",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps are I*m, sqrt(I*m), or I/m without the square root.",
  videoUrl: null, videoTitle: null
}, function () {
  var m = pick([6, 8, 10]), I = pick([12, 18, 24, 32]);
  var correct = Math.sqrt(I / m);
  var question = "A body of mass " + m + " kg has a mass moment of inertia of " + I.toFixed(1) + " kg\u00B7m\u00B2 about an axis. What is its radius of gyration about that axis?";
  var solution = C_DYN_RG + "\n\n$$k = \\sqrt{\\frac{I}{m}} = \\sqrt{\\frac{" + I.toFixed(1) + "}{" + m + "}} = " + (Math.round(correct * 1000) / 1000).toFixed(3) + "\\ \\text{m}$$";
  return {
    variantKey: "m" + m + "_I" + I,
    question: question,
    options: [
      { label: (Math.round(correct * 1000) / 1000).toFixed(3) + " m", num: correct, correct: true },
      { label: f1(I * m) + " m", num: I * m, correct: false },
      { label: f2(Math.sqrt(I * m)) + " m", num: Math.sqrt(I * m), correct: false },
      { label: f2(I / m) + " m", num: I / m, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-053 ---- */
reg(buildGenerator({
  baseId: "dynamics-053", topic: "Dynamics", subtopic: "Kinetic energy of a rigid body",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "The traps report translation only, rotation only, or double the total.",
  videoUrl: null, videoTitle: null
}, function () {
  var m = pick([40, 50, 60]), v = pick([3, 4, 5]), I = pick([2.0, 2.5, 3.0]), w = pick([6, 8, 10]);
  var tr = 0.5 * m * v * v, rot = 0.5 * I * w * w;
  var correct = tr + rot;
  var question = "A rolling body of mass " + m + " kg has a mass-center speed of " + v.toFixed(1) + " m/s, a centroidal mass moment of inertia of " + I.toFixed(1) + " kg\u00B7m\u00B2 and an angular speed of " + w.toFixed(1) + " rad/s. What is its kinetic energy?";
  var solution = C_DYN_KE + "\n\n$$T = \\tfrac{1}{2}mv^2 + \\tfrac{1}{2}I\\omega^2 = " + f1(tr) + " + " + f1(rot) + " = " + f1(correct) + "\\ \\text{J}$$";
  return {
    variantKey: "m" + m + "_v" + v + "_I" + I + "_w" + w,
    question: question,
    options: [
      { label: f1(correct) + " J", num: correct, correct: true },
      { label: f1(tr) + " J", num: tr, correct: false },
      { label: f1(rot) + " J", num: rot, correct: false },
      { label: f1(2 * correct) + " J", num: 2 * correct, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-054 ---- */
reg(buildGenerator({
  baseId: "dynamics-054", topic: "Dynamics", subtopic: "Kinetic energy about the instant center",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The traps drop the 1/2 or use I*w instead of I*w^2.",
  videoUrl: null, videoTitle: null
}, function () {
  var I = pick([4, 6, 8]), w = pick([4, 5, 6]);
  var correct = 0.5 * I * w * w;
  var question = "A body has a mass moment of inertia of " + I.toFixed(1) + " kg\u00B7m\u00B2 about its instant center and an angular speed of " + w.toFixed(1) + " rad/s. What is its kinetic energy?";
  var solution = C_DYN_KE + "\n\n$$T = \\tfrac{1}{2}I\\omega^2 = \\tfrac{1}{2}(" + I.toFixed(1) + ")(" + w.toFixed(1) + ")^2 = " + f1(correct) + "\\ \\text{J}$$";
  return {
    variantKey: "I" + I + "_w" + w,
    question: question,
    options: [
      { label: f1(correct) + " J", num: correct, correct: true },
      { label: f1(I * w * w) + " J", num: I * w * w, correct: false },
      { label: f1(0.5 * I * w) + " J", num: 0.5 * I * w, correct: false },
      { label: f1(I * w) + " J", num: I * w, correct: false }
    ],
    solution: solution
  };
}));

/* ---- dynamics-055: angular momentum ---- */
reg(buildGenerator({
  baseId: "dynamics-055", topic: "Dynamics", subtopic: "Conservation of angular momentum",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "The traps divide by I2 alone, leave the speed unchanged, or double it.",
  videoUrl: null, videoTitle: null
}, function () {
  var I1 = pick([8, 10, 12]), I2 = pick([12, 15, 20]), w1 = pick([4, 6, 8]);
  var correct = I1 * w1 / (I1 + I2);
  var question = "A rotor with I = " + I1.toFixed(1) + " kg\u00B7m\u00B2 spins at " + w1.toFixed(1) + " rad/s with no external torque. A second, initially stationary rotor on the same axis (I = " + I2.toFixed(1) + " kg\u00B7m\u00B2) is coupled to it. What is the common angular speed?";
  var solution = C_DYN_AM + "\n\n$$\\omega = \\frac{I_1\\omega_1}{I_1 + I_2} = \\frac{(" + I1.toFixed(1) + ")(" + w1.toFixed(1) + ")}{" + I1.toFixed(1) + " + " + I2.toFixed(1) + "} = " + f2(correct) + "\\ \\text{rad/s}$$";
  return {
    variantKey: "I1_" + I1 + "_I2_" + I2 + "_w" + w1,
    question: question, diagram: dDynRotors(I1, w1, I2),
    options: [
      { label: f2(correct) + " rad/s", num: correct, correct: true },
      { label: f2(I1 * w1 / I2) + " rad/s", num: I1 * w1 / I2, correct: false },
      { label: f2(w1) + " rad/s", num: w1, correct: false },
      { label: f2(2 * w1) + " rad/s", num: 2 * w1, correct: false }
    ],
    solution: solution
  };
}));

  window.DYNAMICS_GENERATORS = DYN_ENTRIES;
})();
