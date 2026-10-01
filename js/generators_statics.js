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
    solution: solution
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
    solution: solution
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
  explanation: "Resolve along one cable to eliminate its unknown. The trap: the 100 N answers come from assuming symmetry or splitting the load evenly.",
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
  var question = "Two cables hang from a ceiling and meet at a point from which a " + W +
    " N sign hangs. Cable 1 makes " + t1deg + " degrees with the vertical on the left; cable 2 makes " + t2deg +
    " degrees with the vertical on the right. What is the tension in cable 1?";
  var solution = "Refer to the Concurrent Forces section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(T_1\\). Apply equilibrium at the junction:\n\n" +
    "$$\\begin{aligned}\n" +
    "\\sum F_x = 0 &\\;\\rightarrow\\; T_1\\sin " + t1deg + "^\\circ - T_2\\sin " + t2deg + "^\\circ = 0 \\\\\n" +
    "\\sum F_y = 0 &\\;\\rightarrow\\; T_1\\cos " + t1deg + "^\\circ + T_2\\cos " + t2deg + "^\\circ - " + W + " = 0\n" +
    "\\end{aligned}$$\n\n" +
    "Eliminate \\(T_2\\): \\(T_1 = W\\cos " + t2deg + "^\\circ / \\sin(" + t1deg + "^\\circ + " + t2deg + "^\\circ)\\):\n\n" +
    "$$(T_1) = \\frac{(" + W + ")(" + fmt(r2(Math.cos(t2deg * Math.PI / 180))) + ")}{" + fmt(r2(Math.sin((t1deg + t2deg) * Math.PI / 180))) + "} = " + T1 + "\\ \\text{N}$$";
  return {
    variantKey: "cab-t1" + t1deg + "-t2" + t2deg + "-W" + W,
    question: question,
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
  explanation: "Belt friction grows exponentially with contact angle - and the angle must be in RADIANS. Forgetting the 2*pi conversion is the classic error.",
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
  var question = "A flat belt is about to slip relative to a drum. The belt contacts the drum over " +
    (n === 1 ? "1 full turn" : fmt(n) + " full turns") +
    " and the coefficient of static friction between the belt and the drum is " + fmt(mu) +
    ". What is the ratio of the tight-side tension to the loose-side tension (T_tight / T_loose)?";
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
  } while (Mmag <= 50 || new Set([Mmag, t1, t2, t3]).size !== 4);
  var rVec = vec3(rx, ry, rz, "r", "\\ \\text{m}");
  var FVec = vec3(Fx, Fy, Fz, "F", "\\ \\text{N}");
  var question = "A position vector \\(\\mathbf{r} = " + rVec + "\\) locates the point of application of a force \\(\\mathbf{F} = " + FVec + "\\) relative to point O. What is the magnitude of the moment of the force about O?";
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
  explanation: "Partial UDLs: the resultant is w*L_loaded acting at the LOADED segment's midpoint, not the beam's. The traps are the classic centroid slips.",
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
  explanation: "On a frictionless incline the required holding force is just the downslope weight component W*sin(theta). The W*cos(theta) trap is the NORMAL force, not the parallel force.",
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
  var question = "A " + W + " N block rests on a frictionless plane inclined at " + th +
    " degrees to the horizontal. What force P, applied parallel to the plane and directed up the plane, is required to hold the block in equilibrium?";
  var solution = "Refer to the Friction section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(P\\). With no friction, \\(P\\) balances the downslope component of the weight:\n\n" +
    "$$\\sum F_{\\parallel} = 0 \\;\\rightarrow\\; P - W\\sin\\theta = 0$$\n\n" +
    "$$(P) = (" + W + ")\\sin " + th + "^\\circ = " + P + "\\ \\text{N up the plane}$$";
  return {
    variantKey: "fri0-W" + W + "-th" + th,
    question: question,
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
  explanation: "M_y = z*F_x - x*F_z: only the x- and z-components contribute, and the order matters. The traps are the single-term and sign errors.",
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
  explanation: "Compare P_slip = mu*W against P_tip from moment equilibrium about the tipping edge. Whichever needs the smaller P happens first.",
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
  explanation: "Tightening uses tan(alpha + phi): the friction angle ADDS to the lead angle. The tan(alpha - phi) trap is the LOOSENING formula.",
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
  explanation: "Limiting friction is mu_s * N - the maximum static friction before motion impends. The W/mu trap inverts the relationship.",
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
  explanation: "I_xy = I_xc_yc + A*d_x*d_y: for a rectangle with sides parallel to the axes, the centroidal product is zero and only the transfer term survives.",
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
  var question = "A rectangle " + b + " m wide (x-direction) by " + h +
    " m tall (y-direction) has its centroid at (" + fmt(dx) + " m, " + fmt(dy) +
    " m) relative to the origin O. What is the product of inertia I_xy of the rectangle about the x- and y-axes through O?";
  var solution = "Refer to the Product of Inertia section in the Statics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(I_{xy}\\). The parallel-axis relation for the product of inertia is:\n\n" +
    "$$I_{xy} = I_{x_c y_c} + A\\,d_x d_y$$\n\n" +
    "For a rectangle with sides parallel to the axes, \\(I_{x_c y_c} = 0\\):\n\n" +
    "$$(I_{xy}) = (" + b + ")(" + h + ")(" + fmt(dx) + ")(" + fmt(dy) + ") = " + fmt(Ixy) + "\\ \\text{m}^4$$";
  return {
    variantKey: "Ixy-b" + b + "-h" + h + "-dx" + pdot(dx) + "-dy" + pdot(dy),
    question: question,
    options: [
      { label: fmt(Ixy) + " m⁴", num: Ixy, correct: true },
      { label: fmt(tHalf) + " m⁴", num: tHalf, correct: false },
      { label: fmt(tSum) + " m⁴", num: tSum, correct: false },
      { label: fmt(tPlus) + " m⁴", num: tPlus, correct: false }
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
  explanation: "Loosening uses tan(alpha - phi): friction now OPPOSES the unwinding. The tan(alpha + phi) trap is the TIGHTENING formula.",
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
  explanation: "J = I_x + I_y, the sum - not the difference. The difference trap is the formula for the in-plane principal values, not J.",
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
  explanation: "The resultant's line of action comes from the moment equation: d = M_O / R. The traps use the scalar sum of forces or the wrong moment arm.",
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
window.STATICS_GENERATORS = STAT_ENTRIES;

})();
