/* PassTheFE "infinite questions" pilot — Engineering Economics generator templates.
 *
 * Plain script (no modules) for the static site. Defines window.ECON_GENERATORS:
 * one entry per NUMERICAL Engineering Economics bank question (econ-015 and
 * econ-016 carry cash-flow-timeline diagrams that cannot be cleanly
 * parameterized, and are skipped — the same rationale as math-020 in the
 * Mathematics pilot).
 *
 * LaTeX convention: NATURAL single-backslash LaTeX. In the JS string literals
 * below that means "\\(" for \\(, "\\frac" for \\frac, "\\$" for \\$, and
 * "\\\\" for the "\\" row break inside aligned environments. NEVER write
 * a doubled backslash before (, ), or an ASCII letter.
 */
(function () {
  "use strict";

  var MINUS = "−"; // U+2212, matches bank choice strings such as "−4/3"

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
      topic: "Engineering Economics",
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
            topic: "Engineering Economics",
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
  var AHG = '<defs><marker id="ahg" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#15803d"/></marker></defs>';

  // Cash-flow diagram: horizontal time axis with year ticks, upward green
  // arrows for receipts, downward blue arrows for disbursements. Setup only:
  // flows are the GIVEN cash amounts, never the answer.
  // maxYear: last tick on the axis. ticks: years to label.
  // flows: [{t, amt, dir ("up"|"down"), label, dx (x-offset px), lab (extra label y px)}].
  // note: one caption line; bracket: {from, to, label} span under the axis.
  function cfdSVG(maxYear, ticks, flows, note, bracket) {
    var ox = 64, axisW = 512, axisY = 168;
    var pxm = axisW / maxYear;
    var maxAmt = 0, i;
    for (i = 0; i < flows.length; i++) if (flows[i].amt > maxAmt) maxAmt = flows[i].amt;
    var s = SVG_HDR + AH + AHG;
    s += '<line x1="' + ox + '" y1="' + axisY + '" x2="' + (ox + axisW + 10) + '" y2="' + axisY + '" stroke="#1a1a1a" stroke-width="2" marker-end="url(#ah)"/>';
    for (i = 0; i < ticks.length; i++) {
      var x = (ox + ticks[i] * pxm).toFixed(1);
      s += '<line x1="' + x + '" y1="' + (axisY - 6) + '" x2="' + x + '" y2="' + (axisY + 6) + '" stroke="#1a1a1a" stroke-width="1.5"/>';
      s += '<text x="' + (x - 5) + '" y="' + (axisY + 24) + '" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">' + ticks[i] + '</text>';
    }
    s += '<text x="' + (ox + axisW + 14) + '" y="' + (axisY + 24) + '" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">yr</text>';
    for (i = 0; i < flows.length; i++) {
      var f = flows[i];
      var fx = (ox + f.t * pxm + (f.dx || 0)).toFixed(1);
      var len = 26 + (maxAmt > 0 ? (f.amt / maxAmt) * 78 : 0);
      var up = f.dir === "up";
      var col = up ? "#15803d" : "#1d4ed8";
      var mk = up ? "url(#ahg)" : "url(#ah)";
      var tip = up ? axisY - len : axisY + len;
      s += '<line x1="' + fx + '" y1="' + axisY + '" x2="' + fx + '" y2="' + tip.toFixed(1) + '" stroke="' + col + '" stroke-width="2.5" marker-end="' + mk + '"/>';
      if (f.label) {
        var lx = (parseFloat(fx) - f.label.length * 3.3).toFixed(1);
        var ly = up ? tip - 10 : tip + 20 + (f.lab || 0);
        s += '<text x="' + lx + '" y="' + ly.toFixed(1) + '" font-family="Georgia,serif" font-size="13" fill="' + col + '">' + f.label + '</text>';
      }
    }
    if (bracket) {
      var bx0 = ox + bracket.from * pxm, bx1 = ox + bracket.to * pxm, by = axisY + 44;
      s += '<line x1="' + bx0.toFixed(1) + '" y1="' + by + '" x2="' + bx1.toFixed(1) + '" y2="' + by + '" stroke="#6b7280" stroke-width="1.5"/>';
      s += '<line x1="' + bx0.toFixed(1) + '" y1="' + (by - 5) + '" x2="' + bx0.toFixed(1) + '" y2="' + (by + 5) + '" stroke="#6b7280" stroke-width="1.5"/>';
      s += '<line x1="' + bx1.toFixed(1) + '" y1="' + (by - 5) + '" x2="' + bx1.toFixed(1) + '" y2="' + (by + 5) + '" stroke="#6b7280" stroke-width="1.5"/>';
      s += '<text x="' + ((bx0 + bx1) / 2 - bracket.label.length * 3.3).toFixed(1) + '" y="' + (by + 20) + '" font-family="Georgia,serif" font-size="13" fill="#6b7280">' + bracket.label + '</text>';
    }
    if (note) s += '<text x="' + ox + '" y="28" font-family="Georgia,serif" font-size="13" fill="#4b5563">' + note + '</text>';
    return svgURL(s + SVG_FTR);
  }

  // Dollars with thousands separators and exactly two decimals: "$1,102.50".
  function money(x) {
    var neg = x < -1e-9;
    var v = Math.abs(x);
    var s = v.toFixed(2);
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-$" : "$") + parts.join(".");
  }

  // Compound-interest factors (i as a decimal).
  function f_p(i, n) { return Math.pow(1 + i, n); }
  function p_f(i, n) { return 1 / Math.pow(1 + i, n); }
  function p_a(i, n) { var f = Math.pow(1 + i, n); return (f - 1) / (i * f); }
  function a_p(i, n) { var f = Math.pow(1 + i, n); return (i * f) / (f - 1); }
  function f_a(i, n) { return (Math.pow(1 + i, n) - 1) / i; }
  function a_f(i, n) { return i / (Math.pow(1 + i, n) - 1); }

  var ECON_GENERATORS = [];
  function def(meta, roll) { ECON_GENERATORS.push(buildGenerator(meta, roll)); }

/* PassTheFE "infinite questions" pilot — Engineering Economics generator templates, part 1 (econ-001..econ-014).
 *
 * FRAGMENT, not standalone. The assembler prepends a header defining def(),
 * buildGenerator(), and the shared helpers (fmt, sgn, texNum, ri, pick,
 * shuffle, MINUS) plus the ECON-SPECIFIC helpers: money(x), f_p(i,n),
 * p_f(i,n), p_a(i,n), a_p(i,n), f_a(i,n), a_f(i,n). Each def(meta, rollFn)
 * registers one generator; the assembler then sets window.ECON_GENERATORS.
 *
 * LaTeX convention: NATURAL single-backslash LaTeX in the OUTPUT strings.
 * In the JS source below that means "\\(" for \(, "\\frac" for \frac,
 * "\\$" for \$, and "\\\\" for the "\\" row break inside aligned
 * environments. NEVER a doubled backslash before (, ), or an ASCII letter.
 */

// ---------------------------------------------------------------- econ-001
// Compound interest: F = P(1+i)^n.
def({ baseId: "econ-001", subtopic: "Compound interest", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Single-payment compound amount factor: (F/P, i%, n) = (1+i)^n. Don't confuse with simple interest ($1,100).",
  videoUrl: "https://www.youtube.com/watch?v=bd86wfNRPvo",
  videoTitle: "Simple and Compound Interest Explained"
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var P = pick([500, 1000, 1500, 2000, 2500, 3000]);
  var pct = ri(3, 12), i = pct / 100, n = ri(2, 8);
  var F = P * f_p(i, n);
  var simple = P * (1 + i * n);          // simple-interest trap
  var offByOne = P * f_p(i, n - 1);      // compounds one year short
  var tooMany = P * f_p(i, n + 1);       // compounds one year too many
  var onePlusI = String(1 + i);
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(F\\). We can determine \\(F\\) from the single-payment compound amount factor:\n\n" +
    "$$F = P(1+i)^n$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(F\\):\n\n" +
    "$$\\begin{aligned}\nP &= " + M(P) + " \\\\\ni &= " + pct + "\\% = " + i + " \\\\\nn &= " + n + "\\ \\text{years} \\\\\nF &= ?\n\\end{aligned}$$\n\n" +
    "$$(F) = (P)(1+i)^n \\rightarrow (F) = (" + M(P) + ")(" + onePlusI + ")^" + n + "$$\n\n" +
    "$$(F) = (" + fmt(P) + ")(" + f_p(i, n).toFixed(4) + ") = " + M(F) + "$$";
  return {
    variantKey: "p" + P + "_i" + pct + "_n" + n,
    question: money(P) + " is invested at " + pct + "% annual interest, compounded annually. What is the future worth after " + n + " years?",
    options: [
      { label: money(F), num: F, correct: true },
      { label: money(simple), num: simple },
      { label: money(offByOne), num: offByOne },
      { label: money(tooMany), num: tooMany }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-002
// Present worth: P = F/(1+i)^n (rolled so the answer is a clean principal).
def({ baseId: "econ-002", subtopic: "Present worth", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Present worth discounts the future back to today — the mirror image of the compound amount factor (F/P, i%, n).",
  videoUrl: "https://www.youtube.com/watch?v=bd86wfNRPvo",
  videoTitle: "Simple and Compound Interest Explained"
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var P0 = pick([500, 1000, 1500, 2000, 3000, 4000]);
  var pct = ri(3, 12), i = pct / 100, n = ri(2, 8);
  var F = Math.round(P0 * f_p(i, n) * 100) / 100;
  var P = F * p_f(i, n);
  var noDiscount = F;                 // no discounting at all
  var simpleDisc = F / (1 + i * n);   // simple-interest discount trap
  var wrongDir = F * f_p(i, n);       // compounds instead of discounting
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(P\\), the present worth of " + money(F) + " received " + n + " years from now at " + pct + "% annual interest:\n\n" +
    "$$P = \\frac{F}{(1+i)^n}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(P\\):\n\n" +
    "$$\\begin{aligned}\nF &= " + M(F) + "\\ \\text{(future amount)} \\\\\ni &= " + i + "\\ \\text{/yr} \\\\\nn &= " + n + "\\ \\text{yr} \\\\\nP &= ?\n\\end{aligned}$$\n\n" +
    "$$(P) = \\frac{" + fmt(F) + "}{(1+" + i + ")^" + n + "} \\rightarrow (P) = \\frac{" + fmt(F) + "}{" + f_p(i, n).toFixed(4) + "}$$\n\n" +
    "$$(P) = " + M(P) + "$$";
  return {
    variantKey: "p" + P0 + "_i" + pct + "_n" + n,
    question: "What is the present worth of " + money(F) + " to be received " + n + " years from now, at " + pct + "% annual interest compounded annually?",
    options: [
      { label: money(P), num: P, correct: true },
      { label: money(noDiscount), num: noDiscount },
      { label: money(simpleDisc), num: simpleDisc },
      { label: money(wrongDir), num: wrongDir }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-003
// Effective annual rate from a nominal rate: i_eff = (1 + r/m)^m - 1.
def({ baseId: "econ-003", subtopic: "Effective annual interest rate", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Nominal rates understate the true cost whenever compounding is more frequent than annual. On the FE, always convert a nominal rate to the effective rate for the payment period before using any interest factor - forgetting this step is a guaranteed point lost.",
  videoUrl: "https://www.youtube.com/watch?v=9Vg-aAt5NtM",
  videoTitle: "Interest Rate Explained — Nominal, Period, Effective"
}, function () {
  var r = ri(3, 12), m = pick([4, 12]); // quarterly or monthly compounding
  var rd = r / 100;
  var per = rd / m;
  var eff = Math.pow(1 + per, m) - 1;
  var periodic = per;                             // mistake: answers with the per-period rate
  var offByOneM = Math.pow(1 + per, m + 1) - 1;   // mistake: compounds one period too many
  var word = m === 12 ? "monthly" : "quarterly";
  var acct = m === 12 ? "A credit card charges" : "A loan is quoted at";
  var solPct = (eff * 100).toFixed(2);
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the effective annual rate \\(i_{\\text{eff}}\\). A nominal rate compounded \\(m\\) times per year converts by:\n\n" +
    "$$i_{\\text{eff}} = \\left(1 + \\frac{r}{m}\\right)^m - 1$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\nr &= " + r + "\\% = " + rd + " \\\\\nm &= " + m + "\\ \\text{(" + word + ")} \\\\\ni_{\\text{eff}} &= ?\n\\end{aligned}$$\n\n" +
    "$$(i_{\\text{eff}}) = \\left(1 + \\frac{" + rd + "}{" + m + "}\\right)^{" + m + "} - 1 \\rightarrow (i_{\\text{eff}}) = (" + String(1 + per) + ")^{" + m + "} - 1$$\n\n" +
    "$$(i_{\\text{eff}}) = " + (eff + 1).toFixed(6) + " - 1 = " + eff.toFixed(6) + " = " + solPct + "\\%$$";
  return {
    variantKey: "r" + r + "_m" + m,
    question: acct + " a nominal annual interest rate of " + r + "%, compounded " + word + ". What is the effective annual interest rate?",
    options: [
      { label: (eff * 100).toFixed(2) + "%", num: eff, correct: true },
      { label: r + "%", num: rd },                                        // nominal rate itself
      { label: (periodic * 100).toFixed(2) + "%", num: periodic },        // per-period rate
      { label: (offByOneM * 100).toFixed(2) + "%", num: offByOneM }       // compounds one period too many
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-004
// Uniform series present worth: P = A(P/A, i, n).
def({ baseId: "econ-004", subtopic: "Uniform series present worth", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The P/A factor converts recurring annual costs (maintenance, operations) to a single present value for comparison. Common errors: using the future worth factor instead, or confusing this with a gradient series.",
  videoUrl: undefined,
  videoTitle: undefined
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var A = pick([100, 200, 250, 500, 1000]);
  var pct = ri(5, 12), i = pct / 100, n = ri(5, 20);
  var pa = p_a(i, n);
  var P = A * pa;
  var noTVM = A * n;                 // ignores time value of money
  var wrongDir = A * f_a(i, n);      // future worth instead of present worth
  var offByOne = A * p_a(i, n - 1);  // one year short
  var solution =
    "Refer to the Uniform Series section in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(P\\), the present worth, using the uniform series present worth factor:\n\n" +
    "$$P = A(P/A, i, n) = A\\frac{(1+i)^n - 1}{i(1+i)^n}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\nA &= " + M(A) + "\\ \\text{/yr} \\\\\ni &= " + i + "\\ \\text{/yr} \\\\\nn &= " + n + "\\ \\text{yr} \\\\\nP &= ?\n\\end{aligned}$$\n\n" +
    "$$(P/A, " + pct + "\\%, " + n + ") = \\frac{(1+" + i + ")^{" + n + "} - 1}{" + i + "(1+" + i + ")^{" + n + "}} = " + pa.toFixed(4) + "$$\n\n" +
    "$$(P) = (" + fmt(A) + ")(" + pa.toFixed(4) + ") = " + M(P) + "$$";
  return {
    variantKey: "a" + A + "_i" + pct + "_n" + n,
    question: "What is the present worth of a uniform series of " + money(A) + " per year for " + n + " years at an interest rate of " + pct + "% per year?",
    options: [
      { label: money(P), num: P, correct: true },
      { label: money(noTVM), num: noTVM },
      { label: money(wrongDir), num: wrongDir },
      { label: money(offByOne), num: offByOne }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-005
// Straight-line depreciation book value: BV_k = C - k*(C-S)/L.
def({ baseId: "econ-005", subtopic: "Straight-line depreciation", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Depreciation affects after-tax cash flows and equipment replacement decisions. The trap answer $27,778 comes from depreciating the full $50,000 without subtracting salvage value - salvage is never depreciated.",
  videoUrl: "https://www.youtube.com/watch?v=-MUwUVW9qi4",
  videoTitle: "Depreciation"
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var D = pick([2000, 2500, 3000, 4000, 5000]);
  var L = ri(6, 12);
  var S = D * ri(1, 4);
  var C = D * L + S;
  // Reroll the asked year until all four option values are pairwise distinct
  // (e.g. BV == accumulated depreciation exactly at mid-life).
  var k = 0, BV = 0, accDep = 0, noSalvage = 0, longLife = 0, distinct = false, guard = 0;
  while (!distinct && guard++ < 50) {
    k = ri(2, L - 1);
    BV = C - k * D;
    accDep = k * D;                        // depreciation taken so far, not what remains
    noSalvage = C - k * C / L;             // depreciates full cost, forgetting salvage
    longLife = C - k * (C - S) / (L + 2);  // straight-line over a life 2 years too long
    var vs = [BV, accDep, noSalvage, longLife];
    distinct = true;
    for (var a = 0; a < 4 && distinct; a++)
      for (var b = a + 1; b < 4 && distinct; b++)
        if (Math.abs(vs[a] - vs[b]) < 1e-9) distinct = false;
  }
  var solution =
    "Refer to the Depreciation section in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the book value at the end of year " + k + ". Straight-line depreciation charges the same amount each year:\n\n" +
    "$$D = \\frac{\\text{Cost} - \\text{Salvage}}{\\text{Life}}$$\n\n" +
    "List the known and unknown parameters in order to solve for the book value:\n\n" +
    "$$\\begin{aligned}\n\\text{Cost} &= " + M(C) + " \\\\\n\\text{Salvage} &= " + M(S) + " \\\\\n\\text{Life} &= " + L + "\\ \\text{years} \\\\\nBV_" + k + " &= ?\n\\end{aligned}$$\n\n" +
    "Annual depreciation: \\((D) = (" + fmt(C) + " - " + fmt(S) + ")/" + L + " = " + M(D) + "\\text{/year}\\).\n\n" +
    "Accumulated depreciation after " + k + " years: \\(" + k + " \\times " + fmt(D) + " = " + M(accDep) + "\\).\n\n" +
    "$$(BV_" + k + ") = " + fmt(C) + " - " + fmt(accDep) + " = " + M(BV) + "$$";
  return {
    variantKey: "c" + C + "_l" + L + "_k" + k,
    question: "A piece of construction equipment costs " + money(C) + ", has a salvage value of " + money(S) + ", and a useful life of " + L + " years. Using straight-line depreciation, what is the book value of the equipment at the end of year " + k + "?",
    options: [
      { label: money(BV), num: BV, correct: true },
      { label: money(accDep), num: accDep },
      { label: money(noSalvage), num: noSalvage },
      { label: money(longLife), num: longLife }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-006
// Benefit-cost ratio: B/C = PW(benefits) / PW(costs), justified iff >= 1.
def({ baseId: "econ-006", subtopic: "Benefit-cost ratio", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "Public works projects are ranked by benefit-cost ratio, and the hurdle is exactly 1.0. Flipping the ratio (costs over benefits, giving 0.67) is the standard mistake - always put benefits in the numerator.",
  videoUrl: "https://www.youtube.com/watch?v=oY94doVEols",
  videoTitle: "Engineering Economics VI: Benefit–Cost Analysis"
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var C = pick([150000, 200000, 250000, 300000, 400000]);
  var r = pick([1.2, 1.25, 1.33, 1.4, 1.5, 1.6, 1.75, 2.0]);
  var B = Math.round(C * r);
  var ratio = B / C;
  var proj = pick(["flood-control", "highway-safety", "dam", "water-treatment"]);
  var solution =
    "Refer to the Benefit-Cost Analysis section in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the benefit-cost ratio of the " + proj + " project:\n\n" +
    "$$B/C = \\frac{\\text{PW of benefits}}{\\text{PW of costs}}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(B/C\\):\n\n" +
    "$$\\begin{aligned}\n\\text{PW of benefits} &= " + M(B) + " \\\\\n\\text{PW of costs} &= " + M(C) + " \\\\\nB/C &= ?\n\\end{aligned}$$\n\n" +
    "$$(B/C) = \\frac{" + fmt(B) + "}{" + fmt(C) + "} = " + fmt(ratio) + "$$\n\n" +
    "Since \\(B/C = " + fmt(ratio) + "\\) exceeds 1.0, benefits outweigh costs and the project is economically justified.";
  return {
    variantKey: "b" + B + "_c" + C,
    question: "A proposed " + proj + " project has a present worth of benefits of " + money(B) + " and a present worth of costs of " + money(C) + ". What is the benefit-cost ratio, and is the project economically justified?",
    options: [
      { label: fmt(ratio) + " - justified", num: ratio, correct: true },
      { label: fmt(C / B) + " - not justified", num: C / B },   // flipped ratio
      { label: "1.00 - borderline", num: 1 },                  // hurdle value itself
      { label: fmt(ratio + 0.25) + " - justified", num: ratio + 0.25 }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-007
// Break-even quantity: Q = FC / (P - VC).
def({ baseId: "econ-007", subtopic: "Break-even analysis", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Break-even analysis sets minimum production for profitability. The distractor 1,111 comes from dividing fixed cost by price alone, ignoring variable costs - the contribution margin (price minus variable cost) is what actually pays down fixed costs.",
  videoUrl: undefined,
  videoTitle: undefined
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var margin = pick([4, 5, 6, 8, 10]); // contribution margin per unit
  var Q = 100 * ri(12, 40);
  var FC = Q * margin;
  var VC = ri(2, 8);
  var P = VC + margin;
  var byPrice = FC / P;          // ignores variable costs
  var bySum = FC / (P + VC);     // adds instead of subtracting
  var nonsense = VC / margin;    // variable cost over margin
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the break-even quantity \\(Q\\), where total revenue equals total cost:\n\n" +
    "$$PQ = FC + (VC)Q \\quad\\Rightarrow\\quad Q = \\frac{FC}{P - VC}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\nFC &= " + M(FC) + "\\ \\text{per month} \\\\\nVC &= " + M(VC) + "\\ \\text{per unit} \\\\\nP &= " + M(P) + "\\ \\text{per unit} \\\\\nQ &= ?\n\\end{aligned}$$\n\n" +
    "$$(Q) = \\frac{" + fmt(FC) + "}{" + fmt(P) + " - " + fmt(VC) + "} \\rightarrow (Q) = \\frac{" + fmt(FC) + "}{" + fmt(margin) + "}$$\n\n" +
    "$$(Q) = " + fmt(Q) + "\\ \\text{units per month}$$";
  return {
    variantKey: "fc" + FC + "_p" + P + "_vc" + VC,
    question: "A precast concrete plant has fixed costs of " + money(FC) + " per month, variable costs of " + money(VC) + " per unit, and sells each unit for " + money(P) + ". What is the monthly break-even production quantity?",
    options: [
      { label: fmt(Q) + " units", num: Q, correct: true },
      { label: fmt(byPrice) + " units", num: byPrice },
      { label: fmt(bySum) + " units", num: bySum },
      { label: fmt(nonsense) + " units", num: nonsense }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-008
// IRR: solve (P/A, i, 3) = invest/A by bisection, then bracket + interpolate.
def({ baseId: "econ-008", subtopic: "Rate of return (IRR)", difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "IRR is the discount rate that zeroes the net present worth - the project's own earned rate. On the FE, bracket the unknown factor between two tabulated interest rates and interpolate; guessing from the cash flows alone without setting PW = 0 leads to the wrong neighborhood entirely.",
  videoUrl: undefined,
  videoTitle: undefined
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var A = pick([1000, 2000, 5000]);
  var R = pick([2.2, 2.3, 2.4, 2.5, 2.6, 2.7]); // invest/A ratio
  var invest = Math.round(A * R);
  var n = 3;
  var lo = 0, hi = 1, irr = 0, t;
  for (t = 0; t < 60; t++) {
    irr = (lo + hi) / 2;
    if (p_a(irr, n) > R) lo = irr; else hi = irr;
  }
  var loPct = Math.floor(irr * 100), hiPct = loPct + 1;
  var paLo = p_a(loPct / 100, n), paHi = p_a(hiPct / 100, n);
  var interp = loPct + (paLo - R) / (paLo - paHi);
  var simpleGuess = (n * A - invest) / (invest * n); // straight-line guess trap
  var hi2 = irr + 0.02, lo2 = irr - 0.02;
  var solution =
    "Refer to the Rate-of-Return section in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the IRR, the rate \\(i\\) at which the present worth equals zero:\n\n" +
    "$$0 = -" + fmt(invest) + " + " + fmt(A) + "(P/A, i, " + n + ") \\quad\\Rightarrow\\quad (P/A, i, " + n + ") = " + R.toFixed(1) + "$$\n\n" +
    "Bracket the unknown factor between tabulated values:\n\n" +
    "$$\\begin{aligned}\n(P/A, " + loPct + "\\%, " + n + ") &= " + paLo.toFixed(4) + " \\\\\n(P/A, " + hiPct + "\\%, " + n + ") &= " + paHi.toFixed(4) + "\n\\end{aligned}$$\n\n" +
    "Since " + R.toFixed(1) + " falls between them, interpolate:\n\n" +
    "$$(i) = " + loPct + "\\% + \\frac{" + paLo.toFixed(4) + " - " + R.toFixed(1) + "}{" + paLo.toFixed(4) + " - " + paHi.toFixed(4) + "}(1\\%) = " + loPct + "\\% + " + (interp - loPct).toFixed(3) + "\\%$$\n\n" +
    "$$(i) \\approx " + interp.toFixed(1) + "\\%$$";
  return {
    variantKey: "inv" + invest + "_a" + A + "_n" + n,
    question: "A project requires an initial investment of " + money(invest) + " and returns " + money(A) + " per year for " + n + " years. Approximately what is the internal rate of return (IRR) of this project?",
    options: [
      { label: interp.toFixed(1) + "%", num: irr, correct: true },
      { label: (simpleGuess * 100).toFixed(1) + "%", num: simpleGuess },
      { label: (hi2 * 100).toFixed(1) + "%", num: hi2 },
      { label: (lo2 * 100).toFixed(1) + "%", num: lo2 }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-009
// Present worth of a single future amount: P = F/(1+i)^n.
def({ baseId: "econ-009", subtopic: "Present worth", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Discounting uses compound interest — $3,846 comes from simple interest and $6,691 compounds in the wrong direction.",
  videoUrl: "https://www.youtube.com/watch?v=bd86wfNRPvo",
  videoTitle: "Simple and Compound Interest Explained"
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var F = pick([3000, 4000, 5000, 6000, 8000, 10000]);
  var pct = ri(4, 10), i = pct / 100, n = ri(3, 8);
  var P = F * p_f(i, n);
  var simpleDisc = F / (1 + i * n); // simple-interest discount trap
  var wrongDir = F * f_p(i, n);     // compounds in the wrong direction
  var oneYear = F / (1 + i);        // discounts only one year
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the present worth \\(P\\):\n\n" +
    "$$P = F(P/F, i, n) = \\frac{F}{(1 + i)^n}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\nF &= " + M(F) + " \\\\\ni &= " + pct + "\\% = " + i + " \\\\\nn &= " + n + "\\ \\text{years} \\\\\nP &= ?\n\\end{aligned}$$\n\n" +
    "$$(P) = \\frac{" + fmt(F) + "}{(1+" + i + ")^{" + n + "}} \\rightarrow (P) = \\frac{" + fmt(F) + "}{" + f_p(i, n).toFixed(4) + "}$$\n\n" +
    "$$(P) = " + M(P) + "$$";
  return {
    variantKey: "f" + F + "_i" + pct + "_n" + n,
    question: "How much must be deposited today to accumulate " + money(F) + " in " + n + " years at " + pct + "% annual interest, compounded annually?",
    options: [
      { label: money(P), num: P, correct: true },
      { label: money(simpleDisc), num: simpleDisc },
      { label: money(wrongDir), num: wrongDir },
      { label: money(oneYear), num: oneYear }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-010
// Straight-line depreciation book value (easy variant).
def({ baseId: "econ-010", subtopic: "Straight-line depreciation", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Book value is cost minus accumulated depreciation — $8,000 is the depreciation taken so far, not what remains.",
  videoUrl: "https://www.youtube.com/watch?v=-MUwUVW9qi4",
  videoTitle: "Depreciation"
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var D = pick([1500, 2000, 2500, 3000]);
  var L = ri(7, 12);
  var S = D * ri(1, 3);
  var C = D * L + S;
  // Reroll the asked year until all four option values are pairwise distinct
  // (e.g. BV == accumulated depreciation exactly at mid-life).
  var k = 0, BV = 0, accDep = 0, wrongYear = 0, longLife = 0, distinct = false, guard = 0;
  while (!distinct && guard++ < 50) {
    k = ri(2, L - 2);
    BV = C - k * D;
    accDep = k * D;                        // depreciation taken so far, not what remains
    wrongYear = C - (k - 1) * D;           // one year short
    longLife = C - k * (C - S) / (L + 2);  // straight-line over a life 2 years too long
    var vs = [BV, accDep, wrongYear, longLife];
    distinct = true;
    for (var a = 0; a < 4 && distinct; a++)
      for (var b = a + 1; b < 4 && distinct; b++)
        if (Math.abs(vs[a] - vs[b]) < 1e-9) distinct = false;
  }
  var solution =
    "Refer to the Depreciation section in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the book value \\(BV_" + k + "\\). Straight-line annual depreciation is:\n\n" +
    "$$D = \\frac{\\text{cost} - \\text{salvage}}{n}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\n\\text{cost} &= " + M(C) + " \\\\\n\\text{salvage} &= " + M(S) + " \\\\\nn &= " + L + "\\ \\text{years} \\\\\nD &= ?\n\\end{aligned}$$\n\n" +
    "$$(D) = \\frac{" + fmt(C) + " - " + fmt(S) + "}{" + L + "} \\rightarrow (D) = " + M(D) + "\\text{/yr}$$\n\n" +
    "$$(BV_" + k + ") = " + fmt(C) + " - " + k + "(" + fmt(D) + ") = " + M(BV) + "$$";
  return {
    variantKey: "c" + C + "_l" + L + "_k" + k,
    question: "A machine costs " + money(C) + ", has a salvage value of " + money(S) + ", and a useful life of " + L + " years. Using straight-line depreciation, what is the book value after " + k + " years?",
    options: [
      { label: money(BV), num: BV, correct: true },
      { label: money(accDep), num: accDep },
      { label: money(wrongYear), num: wrongYear },
      { label: money(longLife), num: longLife }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-011
// Arithmetic gradient present worth: P = A(P/A,i,n) + G(P/G,i,n).
def({ baseId: "econ-011", subtopic: "Arithmetic gradient", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "A gradient series is base amount plus gradient — $3,993 prices only the $1,000 base and $5,000 ignores the time value of money entirely.",
  videoUrl: "https://www.youtube.com/watch?v=3YeDeCawZog",
  videoTitle: "Engineering Economic Analysis - Gradient Series"
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var A = pick([500, 1000, 1500, 2000]);
  var G = pick([100, 200, 250, 300, 400]);
  var pct = ri(5, 12), i = pct / 100, n = ri(4, 8);
  var pa = p_a(i, n);
  var f1 = Math.pow(1 + i, n);
  var pg = (f1 - i * n - 1) / (i * i * f1); // (P/G, i, n)
  var P = A * pa + G * pg;
  var baseOnly = A * pa;                 // prices only the base series
  var noTVM = A * n + G * n * (n - 1) / 2; // ignores time value of money
  var gradAsAnnuity = A * pa + G * pa;   // treats gradient as a level annuity
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the present worth \\(P\\) of a base series plus an arithmetic gradient:\n\n" +
    "$$P = A(P/A, i, n) + G(P/G, i, n)$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\nA &= " + M(A) + " \\\\\nG &= " + M(G) + " \\\\\ni &= " + pct + "\\% \\\\\nn &= " + n + "\\ \\text{years} \\\\\nP &= ?\n\\end{aligned}$$\n\n" +
    "$$(P) = " + fmt(A) + "(" + pa.toFixed(4) + ") + " + fmt(G) + "(" + pg.toFixed(4) + ") \\rightarrow (P) = " + (A * pa).toFixed(2) + " + " + (G * pg).toFixed(2) + "$$\n\n" +
    "$$(P) = " + M(P) + "$$";
  // Setup diagram (never the answer): the increasing yearly maintenance costs.
  var flows011 = [], ticks011 = [];
  for (var t011 = 1; t011 <= n; t011++)
    flows011.push({ t: t011, amt: A + (t011 - 1) * G, dir: "down", label: money(A + (t011 - 1) * G) });
  for (var y011 = 0; y011 <= n; y011++) ticks011.push(y011);
  var d011 = cfdSVG(n, ticks011, flows011, "Costs rise by " + money(G) + " each year.", null);
  return {
    variantKey: "a" + A + "_g" + G + "_i" + pct + "_n" + n,
    question: "Annual maintenance costs are " + money(A) + " in year 1, increasing by " + money(G) + " each year through year " + n + ". At " + pct + "% annual interest, what is the present worth of these costs?",
    options: [
      { label: money(P), num: P, correct: true },
      { label: money(baseOnly), num: baseOnly },
      { label: money(noTVM), num: noTVM },
      { label: money(gradAsAnnuity), num: gradAsAnnuity }
    ],
    solution: solution,
    diagram: d011
  };
});

// ---------------------------------------------------------------- econ-012
// Capitalized cost: CC = initial + A/i where A = rehab(A/F, i, k).
def({ baseId: "econ-012", subtopic: "Capitalized cost", difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "A cost every 5 years is not an annual cost — $266,667 capitalizes $10,000 as if it were spent every year.",
  videoUrl: "https://www.youtube.com/watch?v=wsj7wC6QFbc",
  videoTitle: "Capitalized Value - Engineering Economics Lightboard"
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var init = pick([50000, 75000, 100000, 150000, 200000]);
  var R = pick([5000, 8000, 10000, 15000, 20000]);
  var k = ri(3, 10);
  var pct = ri(4, 10), i = pct / 100;
  var af = a_f(i, k);
  var A = R * af;
  var CC = init + A / i;
  var asAnnual = init + R / i; // capitalizes the rehab as if it were annual
  var noTVM = init + R;        // ignores the time value of money
  var noCap = init + A;        // forgets to capitalize the annual amount
  var solution =
    "Refer to the Capitalized Costs section in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the capitalized cost \\(CC\\). Convert the recurring cost to an equivalent annual amount, then capitalize it:\n\n" +
    "$$CC = \\text{initial cost} + \\frac{A}{i}, \\quad A = " + fmt(R) + "(A/F, i, " + k + ")$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\n\\text{initial cost} &= " + M(init) + " \\\\\n\\text{rehab} &= " + M(R) + "\\ \\text{every " + k + " years} \\\\\ni &= " + pct + "\\% \\\\\n(A/F, " + pct + "\\%, " + k + ") &= " + af.toFixed(4) + " \\\\\nCC &= ?\n\\end{aligned}$$\n\n" +
    "$$(A) = " + fmt(R) + "(" + af.toFixed(4) + ") \\rightarrow (A) = " + M(A) + "\\text{/yr}$$\n\n" +
    "$$(CC) = " + fmt(init) + " + \\frac{" + A.toFixed(2) + "}{" + i + "} = " + M(CC) + "$$";
  // Setup diagram (never the answer): initial cost at year 0 plus the rehab
  // repeating every k years, forever (three cycles shown with an ellipsis).
  var flows012 = [{ t: 0, amt: init, dir: "down", label: money(init) }];
  [1, 2, 3].forEach(function (j012) {
    flows012.push({ t: j012 * k, amt: R, dir: "down", label: money(R), lab: (j012 % 2) * 24 });
  });
  var d012 = cfdSVG(3 * k, [0, k, 2 * k, 3 * k], flows012,
    "\u22EF " + money(R) + " repeats every " + k + " years, forever.", null);
  return {
    variantKey: "c" + init + "_r" + R + "_k" + k + "_i" + pct,
    question: "A bridge requires a " + money(init) + " initial investment plus " + money(R) + " of major rehabilitation every " + k + " years, forever. At " + pct + "% annual interest, what is the capitalized cost?",
    options: [
      { label: money(CC), num: CC, correct: true },
      { label: money(asAnnual), num: asAnnual },
      { label: money(noTVM), num: noTVM },
      { label: money(noCap), num: noCap }
    ],
    solution: solution,
    diagram: d012
  };
});

// ---------------------------------------------------------------- econ-013
// Capital recovery: A = P(A/P, i, n).
def({ baseId: "econ-013", subtopic: "Capital recovery", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Capital recovery includes interest on the unrecovered balance — $2,500 simply divides by 20 and ignores the time value of money.",
  videoUrl: undefined,
  videoTitle: undefined
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var P = pick([20000, 30000, 40000, 50000, 75000, 100000]);
  var pct = ri(5, 10), i = pct / 100;
  // n = 1/i would make P/n coincide with P*i (e.g. 10% over 10 years); reroll it.
  var n = pick([10, 15, 20, 25, 30]);
  while (Math.abs(n - 1 / i) < 1e-9) n = pick([10, 15, 20, 25, 30]);
  var ap = a_p(i, n);
  var A = P * ap;
  var noTVM = P / n;            // ignores time value of money
  var interestOnly = P * i;     // interest on the full balance every year
  var wrongFactor = P * a_f(i, n); // sinking fund factor instead
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the equivalent uniform annual cost \\(A\\):\n\n" +
    "$$A = P(A/P, i, n) = P\\left[\\frac{i(1+i)^n}{(1+i)^n - 1}\\right]$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\nP &= " + M(P) + " \\\\\ni &= " + pct + "\\% = " + i + " \\\\\nn &= " + n + "\\ \\text{years} \\\\\n(A/P, " + pct + "\\%, " + n + ") &= " + ap.toFixed(5) + " \\\\\nA &= ?\n\\end{aligned}$$\n\n" +
    "$$(A) = " + fmt(P) + "(" + ap.toFixed(5) + ")$$\n\n" +
    "$$(A) = " + M(A) + "$$";
  return {
    variantKey: "p" + P + "_i" + pct + "_n" + n,
    question: "What is the equivalent uniform annual cost of a " + money(P) + " present investment over " + n + " years at " + pct + "% annual interest?",
    options: [
      { label: money(A), num: A, correct: true },
      { label: money(noTVM), num: noTVM },
      { label: money(interestOnly), num: interestOnly },
      { label: money(wrongFactor), num: wrongFactor }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-014
// Sinking fund: A = F(A/F, i, n).
def({ baseId: "econ-014", subtopic: "Sinking fund", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Sinking fund: A = F(A/F, i, n). The $10,000 trap ignores interest entirely; the $34,029 trap discounts instead of accumulating.",
  videoUrl: undefined,
  videoTitle: undefined
}, function () {
  var M = function (x) { return "\\$" + money(x).slice(1); };
  var F = pick([20000, 30000, 40000, 50000, 75000, 100000]);
  var pct = ri(5, 12), i = pct / 100, n = ri(4, 10);
  var af = a_f(i, n);
  var A = F * af;
  var noTVM = F / n;              // ignores interest entirely
  var wrongDir = F * p_f(i, n);   // discounts instead of accumulating
  var wrongFactor = F * a_p(i, n); // capital recovery factor instead
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the uniform annual deposit \\(A\\). We can determine \\(A\\) from the sinking fund factor:\n\n" +
    "$$A = F(A/F, i, n) = F\\frac{i}{(1+i)^n - 1}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(A\\):\n\n" +
    "$$\\begin{aligned}\nF &= " + M(F) + " \\\\\ni &= " + pct + "\\% = " + i + " \\\\\nn &= " + n + "\\ \\text{years} \\\\\nA &= ?\n\\end{aligned}$$\n\n" +
    "Substituting:\n\n" +
    "$$A = " + fmt(F) + "\\frac{" + i + "}{(1+" + i + ")^" + n + " - 1} = " + fmt(F) + "(" + af.toFixed(5) + ")$$\n\n" +
    "$$A = " + M(A) + "$$";
  return {
    variantKey: "f" + F + "_i" + pct + "_n" + n,
    question: "What uniform end-of-year deposit is required for " + n + " years at " + pct + "% annual interest to accumulate " + money(F) + "?",
    options: [
      { label: money(A), num: A, correct: true },
      { label: money(noTVM), num: noTVM },
      { label: money(wrongDir), num: wrongDir },
      { label: money(wrongFactor), num: wrongFactor }
    ],
    solution: solution
  };
});

/* PassTheFE "infinite questions" pilot — Engineering Economics generator templates, part 2 (econ-017..econ-033).
 *
 * FRAGMENT FILE (not standalone). The assembler prepends def(), buildGenerator(),
 * and the shared helpers (fmt, sgn, texNum, ri, pick, shuffle, MINUS, money,
 * f_p, p_f, p_a, a_p, f_a, a_f) and then sets window.ECON_GENERATORS.
 *
 * NOTE — skipped questions: econ-015 (geometric gradient) and econ-016
 * (present worth of uneven cash flows) both carry cash-flow-timeline diagrams
 * that cannot be cleanly parameterized, so they have no generator here —
 * the same reason math-020 was skipped in the Mathematics pilot.
 *
 * LaTeX convention: NATURAL single-backslash LaTeX in the OUTPUT strings.
 * In the JS source below that means "\\(" for \(, "\\frac" for \frac, and
 * "\\\\" for the "\\" row break inside aligned environments. NEVER a doubled
 * backslash before (, ), or an ASCII letter in the output.
 */

// Dollar value formatted for inside LaTeX: "\$1,102.50".
function mtex(x) { return "\\$" + money(x).slice(1); }

// MACRS recovery percentages (half-year convention), by property class.
var MACRS_RATES = {
  3: [33.33, 44.45, 14.81, 7.41],
  5: [20.00, 32.00, 19.20, 11.52, 11.52, 5.76],
  7: [14.29, 24.49, 17.49, 12.49, 8.93, 8.92, 8.93, 4.46]
};

// ---------------------------------------------------------------- econ-017
// Discounted payback period: accumulate discounted inflows until P is recovered.
def({
  baseId: "econ-017", subtopic: "Payback period", difficulty: "medium",
  estimatedTimeSeconds: 135,
  explanation: "Discounted payback discounts first, then accumulates; the 3.00-year trap is the simple (undiscounted) payback."
}, function () {
  var P = 12000, iPct = 10, A = 4000, nint = 0, ok = false;
  var k = 0, cum = 0, cumPrev = 0, discK = 0;
  for (var t = 0; t < 300 && !ok; t++) {
    P = ri(8, 30) * 1000;
    iPct = ri(5, 12);
    A = ri(3, 12) * 1000;
    var ii = iPct / 100;
    if (A <= P * ii * 1.15) continue; // must actually recover the investment
    // Bank method: discount year by year, then interpolate inside the final year.
    cum = 0; k = 0;
    while (cum < P && k < 200) { k++; discK = A / Math.pow(1 + ii, k); cumPrev = cum; cum += discK; }
    nint = (k - 1) + (P - cumPrev) / discK;
    var fr017 = nint - (k - 1); // skip degenerate variants where recovery lands ~exactly on a year boundary
    var nums017 = [nint, P / A, k, Math.floor(nint) + 0.5];
    ok = nint > 2.2 && nint < 6.5 && P / A >= 2.0 && fr017 > 0.02 && fr017 < 0.98;
    for (var q1 = 0; q1 < 4 && ok; q1++)
      for (var q2 = q1 + 1; q2 < 4 && ok; q2++)
        if (Math.abs(nums017[q1] - nums017[q2]) < 0.06) ok = false;
  }
  var i = iPct / 100;
  var oneP = (1 + i).toFixed(2);
  cum = 0; cumPrev = 0; discK = 0;
  var rows = [];
  for (var yr = 1; yr <= k; yr++) {
    var d = A / Math.pow(1 + i, yr);
    cumPrev = cum; cum += d;
    if (yr === k) discK = d;
    var div = yr === 1 ? oneP : "(" + oneP + ")^" + yr;
    rows.push("\\text{Year " + yr + ":} &\\quad " + mtex(d));
  }
  var frac = (P - cumPrev) / discK;
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the discounted payback period: the time until the cumulative discounted cash inflows recover the initial investment:\n\n" +
    "$$\\sum_{t=1}^{n}\\frac{A}{(1+i)^t} \\geq P$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(n\\):\n\n" +
    "$$\\begin{aligned}\nP &= " + mtex(P) + " \\\\\nA &= " + mtex(A) + "/\\text{yr} \\\\\ni &= " + iPct + "\\% = " + texNum(i) + " \\\\\nn &= ?\n\\end{aligned}$$\n\n" +
    "Discount each year's inflow by \\((1+i)^t\\) and accumulate:\n\n" +
    "$$\\begin{aligned}\n" + rows.join(" \\\\\n") + "\n\\end{aligned}$$\n\n" +
    "Through year " + (k - 1) + " the cumulative discounted inflow is " + money(cumPrev) + ", so the investment is recovered during year " + k + ":\n\n" +
    "$$n = " + (k - 1) + " + \\frac{" + (P - cumPrev).toFixed(2) + "}{" + discK.toFixed(2) + "} = " + (k - 1) + " + " + frac.toFixed(2) + "$$\n\n" +
    "$$n = " + nint.toFixed(2) + "\\ \\text{years}$$";
  var simple = P / A;
  return {
    variantKey: "P" + P + "_A" + A + "_i" + iPct,
    question: "A project requires an initial investment of " + money(P) + " and generates " + money(A) + " per year. At " + iPct + "% annual interest, what is the discounted payback period?",
    options: [
      { label: nint.toFixed(2) + " years", num: +nint.toFixed(2), correct: true },
      { label: simple.toFixed(2) + " years", num: +simple.toFixed(2) },  // simple (undiscounted) payback
      { label: k + " years", num: k },                                    // rounds up to the full year
      { label: (Math.floor(nint) + 0.5).toFixed(2) + " years", num: Math.floor(nint) + 0.5 } // mid-year guess
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-018
// MACRS depreciation deduction for a given year of a given property class.
def({
  baseId: "econ-018", subtopic: "MACRS depreciation", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "MACRS 5-year property: year-2 rate is 32.00% of the full cost. The 40% trap applies double-declining without the half-year convention.",
  videoUrl: "https://www.youtube.com/watch?v=-MUwUVW9qi4",
  videoTitle: "Depreciation"
}, function () {
  var cls = pick([3, 5, 7]);
  var year = ri(2, 3);
  var cost = ri(2, 20) * 10000;
  var rates = MACRS_RATES[cls];
  var rate = rates[year - 1];
  var ans = cost * rate / 100;
  var rateList = rates.map(function (r) { return r.toFixed(2) + "\\%"; }).join(", ");
  var solution =
    "Refer to the Depreciation section in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the year-" + year + " MACRS depreciation. For " + cls + "-year property, the MACRS recovery percentages are \\(" + rateList + "\\):\n\n" +
    "$$D_" + year + " = (\\text{cost}) \\times (\\text{year-" + year + " rate})$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(D_" + year + "\\):\n\n" +
    "$$\\begin{aligned}\n\\text{Cost} &= " + mtex(cost) + " \\\\\n\\text{Year-" + year + " rate} &= " + rate.toFixed(2) + "\\% = " + (rate / 100) + " \\\\\nD_" + year + " &= ?\n\\end{aligned}$$\n\n" +
    "Substituting:\n\n" +
    "$$D_" + year + " = " + fmt(cost) + "(" + (rate / 100) + ")$$\n\n" +
    "$$D_" + year + " = " + mtex(ans) + "$$";
  return {
    variantKey: "cost" + cost + "_cls" + cls + "_yr" + year,
    question: "A " + money(cost) + " piece of equipment is classified as " + cls + "-year property under MACRS. What is the depreciation deduction in year " + year + "?",
    options: [
      { label: money(ans), num: ans, correct: true },
      { label: money(cost * rates[year - 2] / 100), num: cost * rates[year - 2] / 100 }, // previous year's rate
      { label: money(cost * 2 / cls), num: cost * 2 / cls },                             // double-declining, no half-year
      { label: money(cost * rates[year] / 100), num: cost * rates[year] / 100 }          // next year's rate
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-019
// Conventional benefit-cost ratio with disbenefits subtracted from benefits.
def({
  baseId: "econ-019", subtopic: "Benefit-cost ratio", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "Conventional B/C subtracts disbenefits from benefits: (800 \u2212 100)/500 = 1.40. Adding them instead gives the 1.80 trap.",
  videoUrl: "https://www.youtube.com/watch?v=oY94doVEols",
  videoTitle: "Engineering Economics VI: Benefit\u2013Cost Analysis"
}, function () {
  var B = 0, Db = 0, C = 0, ok = false;
  for (var t = 0; t < 200 && !ok; t++) {
    B = ri(6, 14) * 100000;
    Db = ri(1, 3) * 100000;
    C = ri(3, 7) * 100000;
    ok = Db < B && C < B - Db && (B - Db) / C >= 1.1;
  }
  var ans = (B - Db) / C;
  var solution =
    "Refer to the Benefit-Cost Analysis section in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the conventional benefit-cost ratio, in which disbenefits are subtracted from benefits:\n\n" +
    "$$B/C = \\frac{\\text{benefits} - \\text{disbenefits}}{\\text{costs}}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(B/C\\):\n\n" +
    "$$\\begin{aligned}\n\\text{Benefits} &= \\text{" + mtex(B) + "} \\\\\n\\text{Disbenefits} &= \\text{" + mtex(Db) + "} \\\\\n\\text{Costs} &= \\text{" + mtex(C) + "} \\\\\nB/C &= ?\n\\end{aligned}$$\n\n" +
    "Substituting:\n\n" +
    "$$(B/C) = \\frac{" + fmt(B) + " - " + fmt(Db) + "}{" + fmt(C) + "} = \\frac{" + fmt(B - Db) + "}{" + fmt(C) + "}$$\n\n" +
    "$$(B/C) = " + fmt(ans) + "$$";
  return {
    variantKey: "B" + B + "_D" + Db + "_C" + C,
    question: "A proposed project has benefits of " + money(B) + ", disbenefits of " + money(Db) + ", and costs of " + money(C) + " (all present worths). What is the conventional benefit-cost ratio?",
    options: [
      { label: fmt(ans), num: ans, correct: true },
      { label: fmt(B / C), num: B / C },               // forgets disbenefits
      { label: fmt((B + Db) / C), num: (B + Db) / C }, // adds disbenefits instead
      { label: fmt(C / (B - Db)), num: C / (B - Db) }  // inverted ratio
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-020
// Unknown interest rate: solve F = P(1+i)^n for i.
def({
  baseId: "econ-020", subtopic: "Unknown interest rate", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "Solve F = P(1+i)\u207f for i: (F/P)^(1/n) \u2212 1. Dividing the total 60% gain by 4 years gives the 15.0% trap."
}, function () {
  var n = ri(3, 6), iT = ri(5, 15), P = ri(2, 12) * 1000;
  var F = Math.round(P * Math.pow(1 + iT / 100, n) / 10) * 10;
  var iA = Math.pow(F / P, 1 / n) - 1;
  var ansPct = iA * 100;
  var totPct = (F - P) / P * 100;
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the annual effective interest rate \\(i\\). We can determine \\(i\\) from the single-payment compound amount relationship:\n\n" +
    "$$F = P(1+i)^n \\quad\\Rightarrow\\quad i = \\left(\\frac{F}{P}\\right)^{1/n} - 1$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(i\\):\n\n" +
    "$$\\begin{aligned}\nP &= " + mtex(P) + " \\\\\nF &= " + mtex(F) + " \\\\\nn &= " + n + "\\ \\text{years} \\\\\ni &= ?\n\\end{aligned}$$\n\n" +
    "Substituting:\n\n" +
    "$$i = \\left(\\frac{" + fmt(F) + "}{" + fmt(P) + "}\\right)^{1/" + n + "} - 1 = (" + (F / P).toFixed(4) + ")^" + (1 / n).toFixed(2) + " - 1 = " + iA.toFixed(4) + "$$\n\n" +
    "$$i = " + ansPct.toFixed(1) + "\\%$$";
  return {
    variantKey: "P" + P + "_F" + F + "_n" + n,
    question: "An investment of " + money(P) + " grows to " + money(F) + " in " + n + " years with annual compounding. What is the annual effective interest rate?",
    options: [
      { label: ansPct.toFixed(1) + "%", num: +ansPct.toFixed(1), correct: true },
      { label: (totPct / n).toFixed(1) + "%", num: +(totPct / n).toFixed(1) }, // total gain divided by years
      { label: totPct.toFixed(1) + "%", num: +totPct.toFixed(1) },             // total percent gain
      { label: (iT - 2).toFixed(1) + "%", num: iT - 2 }                       // two points low
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-021
// Inflation-adjusted interest rate: d = i + f + i*f.
def({
  baseId: "econ-021", subtopic: "Inflation-adjusted interest rate", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "The cross term i\u00d7f is small but not zero \u2014 dropping it is the classic 11.00% trap."
}, function () {
  var iP = ri(4, 10), fP = ri(2, 5);
  var i = iP / 100, f = fP / 100;
  var d = i + f + i * f;
  var solution =
    "Refer to the Inflation section in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(d\\), the inflation-adjusted interest rate per interest period. The handbook gives:\n\n" +
    "$$d = i + f + (i \\times f)$$\n\n" +
    "List the known and unknown parameters in order to compute \\(d\\):\n\n" +
    "$$\\begin{aligned}\ni &= " + iP + "\\% = " + texNum(i) + " \\\\\nf &= " + fP + "\\% = " + texNum(f) + " \\\\\nd &= ?\n\\end{aligned}$$\n\n" +
    "Substitute into the inflation formula:\n\n" +
    "$$(d) = (" + texNum(i) + ") + (" + texNum(f) + ") + (" + texNum(i) + ")(" + texNum(f) + ")$$\n\n" +
    "Evaluate the cross term on its own line:\n\n" +
    "$$(" + texNum(i) + ")(" + texNum(f) + ") = " + (i * f).toFixed(4) + "$$\n\n" +
    "Add the terms:\n\n" +
    "$$(d) = " + texNum(i) + " + " + texNum(f) + " + " + (i * f).toFixed(4) + " = " + d.toFixed(4) + " = " + (d * 100).toFixed(2) + "\\%$$\n\n" +
    "$$d = " + (d * 100).toFixed(2) + "\\%$$";
  return {
    variantKey: "i" + iP + "_f" + fP,
    question: "A project cost is estimated in constant (year-0) dollars. If the market interest rate is " + iP + "% per year and general inflation is " + fP + "% per year, what inflation-adjusted interest rate should be used to compute the present worth of future costs stated in constant dollars?",
    options: [
      { label: (d * 100).toFixed(2) + "%", num: +(d * 100).toFixed(2), correct: true },
      { label: (iP + fP).toFixed(2) + "%", num: iP + fP },                  // drops the cross term
      { label: (iP * (1 + f)).toFixed(2) + "%", num: iP * (1 + f) },        // i + i*f only
      { label: Math.abs(iP - fP).toFixed(2) + "%", num: Math.abs(iP - fP) } // subtracts inflation
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-022
// Bond valuation: V = C(P/A,i,n) + F(P/F,i,n).
def({
  baseId: "econ-022", subtopic: "Bond valuation", difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "A bond is worth the present worth of its coupon stream plus the discounted face value. When the market rate exceeds the coupon rate, the bond sells at a discount (below face value)."
}, function () {
  var face = ri(1, 5) * 1000;
  var cP = ri(3, 7);
  var iP = Math.min(12, cP + ri(1, 5)); // market rate above coupon: discount bond
  var n = ri(5, 20);
  var i = iP / 100;
  var C = face * cP / 100;
  var pa = p_a(i, n), pf = p_f(i, n);
  var V = C * pa + face * pf;
  var oneP = (1 + i).toFixed(2);
  var vAns = Math.round(V * 100) / 100;
  var solution =
    "Refer to the Uniform Series and Single Payment sections in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "The Bonds section defines the bond value as the present worth of the payments the holder receives at interest rate \\(i\\). Ultimately, we must solve for the bond value \\(V\\):\n\n" +
    "$$V = C(P/A, i\\%, n) + F(P/F, i\\%, n)$$\n\n" +
    "The printed factor formulas are:\n\n" +
    "$$(P/A, i\\%, n) = \\frac{(1+i)^n - 1}{i(1+i)^n}, \\qquad (P/F, i\\%, n) = (1+i)^{-n}$$\n\n" +
    "List the known and unknown parameters in order to compute \\(V\\):\n\n" +
    "$$\\begin{aligned}\nC &= (" + texNum(cP / 100) + ")(" + fmt(face) + ") = " + mtex(C) + " \\\\\nF &= " + mtex(face) + " \\\\\ni &= " + iP + "\\% = " + texNum(i) + " \\\\\nn &= " + n + " \\\\\nV &= ?\n\\end{aligned}$$\n\n" +
    "Compute the uniform-series present worth factor on its own line:\n\n" +
    "$$((P/A, " + iP + "\\%, " + n + ")) = \\frac{(" + oneP + ")^{" + n + "} - 1}{(" + texNum(i) + ")(" + oneP + ")^{" + n + "}} = \\frac{" + (Math.pow(1 + i, n) - 1).toFixed(6) + "}{" + (i * Math.pow(1 + i, n)).toFixed(6) + "} = " + pa.toFixed(4) + "$$\n\n" +
    "Compute the single-payment present worth factor on its own line:\n\n" +
    "$$((P/F, " + iP + "\\%, " + n + ")) = (" + oneP + ")^{-" + n + "} = " + pf.toFixed(4) + "$$\n\n" +
    "Substitute both factors into the bond-value equation:\n\n" +
    "$$(V) = (" + fmt(C) + ")(" + pa.toFixed(4) + ") + (" + fmt(face) + ")(" + pf.toFixed(4) + ") \\rightarrow " + (C * pa).toFixed(2) + " + " + (face * pf).toFixed(2) + " = " + V.toFixed(2) + "$$\n\n" +
    "$$V = " + mtex(vAns) + "$$";
  var cOnly = Math.round(C * pa * 100) / 100;
  var faceUnd = Math.round((C * pa + face) * 100) / 100;
  // Setup diagram (never the answer): annual coupon arrows plus the face
  // value repaid at maturity (the coupon payment is the coupon rate times
  // the face value).
  var ticks022 = [];
  for (var y022 = 0; y022 <= n; y022++) ticks022.push(y022);
  var flows022 = [];
  for (var t022 = 1; t022 <= n; t022++)
    flows022.push({ t: t022, amt: C, dir: "up", label: t022 === 1 ? money(C) : null });
  flows022.push({ t: n, amt: face, dir: "up", label: money(face), dx: 9 });
  var d022 = cfdSVG(n, ticks022, flows022,
    money(C) + " coupons each year; " + money(face) + " face repaid at year " + n + ".", null);
  return {
    variantKey: "face" + face + "_c" + cP + "_i" + iP + "_n" + n,
    question: "A " + n + "-year bond with a " + money(face) + " face value pays " + cP + "% annual coupons at each year end. If the market interest rate is " + iP + "% per year, what is the bond's value?",
    options: [
      { label: money(vAns), num: vAns, correct: true },
      { label: money(cOnly), num: cOnly },       // coupon stream only, forgets face
      { label: money(face), num: face },         // face value at par
      { label: money(faceUnd), num: faceUnd }    // face added undiscounted
    ],
    solution: solution,
    diagram: d022
  };
});

// ---------------------------------------------------------------- econ-023
// Deferred uniform series: P = A(P/A,i,n)(P/F,i,k).
def({
  baseId: "econ-023", subtopic: "Deferred uniform series", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "Deferral is handled by discounting the whole annuity back through the gap years with a P/F factor \u2014 forgetting that step prices the annuity as if it started today."
}, function () {
  var A = ri(4, 10) * 1000;
  var n = ri(4, 8), k = ri(2, 3), iP = ri(5, 12);
  var i = iP / 100;
  var pa = p_a(i, n);
  var pfk = p_f(i, k);
  var ans = Math.round(A * pa * pfk);
  var oneP = (1 + i).toFixed(2);
  var solution =
    "Refer to the Uniform Series and Single Payment sections in the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the present worth \\(P\\). A deferred annuity is priced as an ordinary annuity at the start of its first payment year, then discounted back through the deferral period:\n\n" +
    "$$P = A(P/A, i\\%, n)(P/F, i\\%, k)$$\n\n" +
    "The printed factor formulas are:\n\n" +
    "$$(P/A, i\\%, n) = \\frac{(1+i)^n - 1}{i(1+i)^n}, \\qquad (P/F, i\\%, k) = (1+i)^{-k}$$\n\n" +
    "List the known and unknown parameters in order to compute \\(P\\):\n\n" +
    "$$\\begin{aligned}\nA &= " + mtex(A) + " \\\\\ni &= " + iP + "\\% = " + texNum(i) + " \\\\\nn &= " + n + " \\\\\nk &= " + k + " \\\\\nP &= ?\n\\end{aligned}$$\n\n" +
    "Compute the uniform-series present worth factor on its own line:\n\n" +
    "$$((P/A, " + iP + "\\%, " + n + ")) = \\frac{(" + oneP + ")^{" + n + "} - 1}{(" + texNum(i) + ")(" + oneP + ")^{" + n + "}} = \\frac{" + (Math.pow(1 + i, n) - 1).toFixed(6) + "}{" + (i * Math.pow(1 + i, n)).toFixed(6) + "} = " + pa.toFixed(4) + "$$\n\n" +
    "Compute the deferral (single-payment) factor on its own line:\n\n" +
    "$$((P/F, " + iP + "\\%, " + k + ")) = (" + oneP + ")^{-" + k + "} = " + pfk.toFixed(4) + "$$\n\n" +
    "Substitute both factors:\n\n" +
    "$$(P) = (" + fmt(A) + ")(" + pa.toFixed(4) + ")(" + pfk.toFixed(4) + ") \\rightarrow (" + fmt(A) + ")(" + (pa * pfk).toFixed(4) + ") = " + (A * pa * pfk).toFixed(2) + "$$\n\n" +
    "$$P = " + mtex(ans) + "$$";
  // Setup diagram (never the answer): the deferral gap of k years, then the
  // uniform savings series starting at the end of year k+1.
  var max023 = k + n;
  var ticks023 = [];
  for (var y023 = 0; y023 <= max023; y023++) ticks023.push(y023);
  var flows023 = [];
  for (var t023 = k + 1; t023 <= max023; t023++)
    flows023.push({ t: t023, amt: A, dir: "up", label: (t023 === k + 1 || t023 === max023) ? money(A) : null });
  var d023 = cfdSVG(max023, ticks023, flows023,
    money(A) + "/yr for " + n + " yrs \u2014 first at end of year " + (k + 1) + ".",
    { from: 0, to: k, label: "deferred " + k + " years" });
  return {
    variantKey: "A" + A + "_n" + n + "_k" + k + "_i" + iP,
    question: "A machine upgrade will save " + money(A) + " per year for " + n + " years, with the first savings occurring at the end of year " + (k + 1) + " (the series is deferred " + k + " years). At " + iP + "% annual interest, what is the present worth of the savings?",
    options: [
      { label: money(ans), num: ans, correct: true },
      { label: money(Math.round(A * pa)), num: Math.round(A * pa) },                       // forgets the deferral
      { label: money(Math.round(A * pa * p_f(i, k - 1))), num: Math.round(A * pa * p_f(i, k - 1)) }, // one year too few
      { label: money(Math.round(A * pa * p_f(i, k + 1))), num: Math.round(A * pa * p_f(i, k + 1)) }  // one year too many
    ],
    solution: solution,
    diagram: d023
  };
});

// ---------------------------------------------------------------- econ-024
// Loan balance after m payments: B_m = A(P/A,i,n-m).
def({
  baseId: "econ-024", subtopic: "Loan balance (remaining principal)", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The balance after any payment is the present worth of the payments still owed -- never the original principal minus payments made, because each payment is part interest. Work forward to the payment, then discount the remaining ones."
}, function () {
  var L = 50000, iP = 6, n = 10, m = 4, A = 0, ok = false;
  for (var t = 0; t < 200 && !ok; t++) {
    L = ri(4, 16) * 5000;
    iP = ri(4, 8);
    n = ri(8, 15);
    m = ri(2, n - 2);
    A = L * a_p(iP / 100, n);
    var rem024 = n - m;
    var cand024 = [
      Math.round(A * p_a(iP / 100, rem024) / 100),
      Math.round((L - m * A) / 100),
      Math.round(A * p_a(iP / 100, rem024 + 1) / 100),
      Math.round(A * p_a(iP / 100, rem024 - 1) / 100)
    ];
    ok = m * A < L * 0.9; // payments made stay well under principal
    for (var a = 0; a < 4 && ok; a++)
      for (var b = a + 1; b < 4 && ok; b++)
        if (cand024[a] === cand024[b]) ok = false;
  }
  var i = iP / 100;
  var oneP = (1 + i).toFixed(2);
  var ap = a_p(i, n);
  A = L * ap;
  var rem = n - m;
  var paR = p_a(i, rem);
  var B = A * paR;
  var ans = Math.round(B / 100) * 100;
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the balance \\(B_" + m + "\\). First find the annual payment with the capital recovery factor:\n\n" +
    "$$A = P(A/P, i, n) = " + fmt(L) + " \\left[\\frac{" + texNum(i) + "(" + oneP + ")^{" + n + "}}{(" + oneP + ")^{" + n + "} - 1}\\right]$$\n\n" +
    "$$(A) = " + fmt(L) + "(" + ap.toFixed(5) + ") = " + mtex(Math.round(A * 100) / 100) + "$$\n\n" +
    "The balance after " + m + " payments is the present worth of the " + rem + " remaining payments:\n\n" +
    "$$B_" + m + " = A(P/A, i, " + rem + ") = " + (Math.round(A * 100) / 100) + " \\left[\\frac{(" + oneP + ")^" + rem + " - 1}{" + texNum(i) + "(" + oneP + ")^" + rem + "}\\right]$$\n\n" +
    "$$(B_" + m + ") = " + (Math.round(A * 100) / 100) + "(" + paR.toFixed(5) + ") = " + fmt(Math.round(B)) + " \\approx " + mtex(ans) + "$$";
  return {
    variantKey: "L" + L + "_i" + iP + "_n" + n + "_m" + m,
    question: "A " + money(L) + " loan at " + iP + "% annual interest is repaid with " + n + " equal end-of-year payments. What is the remaining balance immediately after the " + m + "th payment?",
    options: [
      { label: money(ans), num: ans, correct: true },
      { label: money(Math.round((L - m * A) / 100) * 100), num: Math.round((L - m * A) / 100) * 100 }, // principal minus payments
      { label: money(Math.round(A * p_a(i, rem + 1) / 100) * 100), num: Math.round(A * p_a(i, rem + 1) / 100) * 100 }, // one extra payment
      { label: money(Math.round(A * p_a(i, rem - 1) / 100) * 100), num: Math.round(A * p_a(i, rem - 1) / 100) * 100 }  // one fewer payment
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-025
// MACRS book value at end of year y: BV = cost - accumulated depreciation.
def({
  baseId: "econ-025", subtopic: "MACRS depreciation (book value)", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "MACRS depreciation uses statutory recovery percentages, not the straight-line formula. Book value is always cost minus accumulated depreciation, whatever method produced the depreciation."
}, function () {
  var cls, cost, y, rates, sumR, dAcc, ans, vOnlyYr, vSL, ok = false;
  for (var t = 0; t < 200 && !ok; t++) {
    cls = pick([3, 5, 7]);
    cost = ri(2, 10) * 10000;
    y = ri(1, 3);
    rates = MACRS_RATES[cls];
    sumR = 0;
    for (var j = 0; j < y; j++) sumR += rates[j];
    dAcc = cost * sumR / 100;
    ans = cost - dAcc;
    vOnlyYr = cost - cost * rates[y - 1] / 100;
    vSL = cost - y * cost / cls;
    // pairwise-distinct with margin (y=1 makes "only this year" == correct,
    // and MACRS year-1 rates sit near 1/cls, so near-misses must be rejected)
    ok = true;
    var vals025 = [ans, dAcc, vOnlyYr, vSL];
    for (var a = 0; a < 4 && ok; a++)
      for (var b = a + 1; b < 4 && ok; b++)
        if (Math.abs(vals025[a] - vals025[b]) < 10) ok = false;
  }
  if (!ok) { // fallback: the original bank numbers, known distinct
    cls = 5; cost = 20000; y = 2; rates = MACRS_RATES[5];
    sumR = 52; dAcc = 10400; ans = 9600; vOnlyYr = 13600; vSL = 12000;
  }
  var rateLines = [];
  for (var jj = 0; jj < y; jj++)
    rateLines.push("\\text{Year " + (jj + 1) + " rate} &= " + rates[jj].toFixed(2) + "\\%");
  var rateSum = rates.slice(0, y).map(function (r) { return (r / 100).toFixed(4); }).join(" + ");
  var solution =
    "Refer to the Depreciation section in the Engineering Economics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(BV_" + y + "\\). The handbook's MACRS table gives, for " + cls + "-year property:\n\n" +
    "$$\\begin{aligned}\n" + rateLines.join(" \\\\\n") + "\n\\end{aligned}$$\n\n" +
    "Accumulated depreciation through year " + y + ":\n\n" +
    "$$(D_{acc}) = " + fmt(cost) + "(" + rateSum + ") = " + fmt(cost) + "(" + (sumR / 100).toFixed(4) + ") = " + fmt(dAcc) + "$$\n\n" +
    "Book value is cost minus accumulated depreciation:\n\n" +
    "$$(BV_" + y + ") = " + fmt(cost) + " - " + fmt(dAcc) + " = " + mtex(ans) + "$$";
  return {
    variantKey: "cost" + cost + "_cls" + cls + "_y" + y,
    question: "A " + money(cost) + " asset is classified as " + cls + "-year MACRS property. What is its book value at the end of year " + y + "?",
    options: [
      { label: money(ans), num: ans, correct: true },
      { label: money(dAcc), num: dAcc },                                                   // accumulated depreciation
      { label: money(vOnlyYr), num: vOnlyYr }, // only this year's depreciation
      { label: money(vSL), num: vSL }                   // straight-line book value
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-026
// Effective quarterly rate from a nominal rate compounded monthly.
def({
  baseId: "econ-026", subtopic: "Non-annual compounding (effective quarterly rate)", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "When compounding is more frequent than the period of interest, first find the rate per compounding period, then compound it over the periods in one quarter. The nominal rate divided by 4 is only an approximation."
}, function () {
  var rP = ri(6, 18);
  var r = rP / 100;
  var im = r / 12;
  var iq = Math.pow(1 + im, 3) - 1;
  var iAnn = Math.pow(1 + im, 12) - 1;
  var solution =
    "Refer to the Non-Annual Compounding section in the Engineering Economics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the effective quarterly rate. The handbook prints:\n\n" +
    "$$i_e = \\left(1 + \\frac{r}{m}\\right)^m - 1$$\n\n" +
    "The monthly rate is:\n\n" +
    "$$(i_{month}) = \\frac{" + texNum(r) + "}{12} = " + fmt(im) + "$$\n\n" +
    "One quarter contains 3 months:\n\n" +
    "$$(i_{quarter}) = (" + (1 + im).toFixed(4) + ")^3 - 1 = " + Math.pow(1 + im, 3).toFixed(6) + " - 1 = " + iq.toFixed(4) + " = " + (iq * 100).toFixed(2) + "\\%$$";
  return {
    variantKey: "r" + rP,
    question: "A savings account pays " + rP + "% nominal interest compounded monthly. What is the effective interest rate per quarter?",
    options: [
      { label: (iq * 100).toFixed(2) + "%", num: +(iq * 100).toFixed(2), correct: true },
      { label: (rP / 4).toFixed(2) + "%", num: rP / 4 },             // nominal rate divided by 4
      { label: (rP / 12).toFixed(2) + "%", num: rP / 12 },           // monthly rate, not compounded
      { label: (iAnn * 100).toFixed(2) + "%", num: +(iAnn * 100).toFixed(2) } // effective annual rate
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-027
// Uniform series future worth: F = A(F/A,i,n).
def({
  baseId: "econ-027", subtopic: "Uniform series future worth (F/A)", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "End-of-period deposits form a uniform series. The (F/A) factor compounds each deposit for its remaining life -- the first deposit earns interest for 9 years, the last earns none."
}, function () {
  var A = ri(2, 10) * 1000, iP = ri(4, 10), n = ri(8, 15);
  var i = iP / 100;
  var fa = f_a(i, n);
  var ans = Math.round(A * fa);
  var oneP = (1 + i).toFixed(2);
  var solution =
    "Refer to the Nomenclature and Definitions section in the Engineering Economics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(F\\). The handbook prints the uniform-series compound-amount factor:\n\n" +
    "$$(F) = A(F/A, i\\%, n)$$\n\n" +
    "$$\\left(\\frac{F}{A}, " + iP + "\\%, " + n + "\\right) = \\frac{(" + oneP + ")^{" + n + "} - 1}{" + texNum(i) + "} = " + fa.toFixed(4) + "$$\n\n" +
    "$$(F) = (" + fmt(A) + ")(" + fa.toFixed(4) + ") = " + (A * fa).toFixed(2) + " \\approx " + mtex(ans) + "$$";
  return {
    variantKey: "A" + A + "_i" + iP + "_n" + n,
    question: money(A) + " is deposited at the end of each year for " + n + " years into an account earning " + iP + "% annual interest. What is the future worth of the deposits?",
    options: [
      { label: money(ans), num: ans, correct: true },
      { label: money(A * n), num: A * n },                                     // ignores interest
      { label: money(Math.round(A * f_a(i, n + 1))), num: Math.round(A * f_a(i, n + 1)) }, // one extra deposit
      { label: money(Math.round(A * p_a(i, n))), num: Math.round(A * p_a(i, n)) }          // discounts instead
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-028
// Taxable income = revenue - depreciation - ordinary expenses.
def({
  baseId: "econ-028", subtopic: "Taxable income", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Taxable income subtracts both ordinary expenses and depreciation from revenue. Depreciation is a non-cash charge, but it still shelters income from tax."
}, function () {
  var R = 800000, E = 520000, D = 90000, ok = false;
  for (var t = 0; t < 200 && !ok; t++) {
    R = ri(8, 20) * 50000;
    E = ri(20, 60) * 10000;
    D = ri(5, 15) * 10000;
    var vals028 = [R - E - D, R - E, R - D, R - E + D];
    ok = R - E - D >= 50000;
    for (var a = 0; a < 4 && ok; a++)
      for (var b = a + 1; b < 4 && ok; b++)
        if (Math.abs(vals028[a] - vals028[b]) < 10000) ok = false;
  }
  var ans = R - E - D;
  var solution =
    "Refer to the Taxation section in the Engineering Economics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for taxable income. The handbook prints:\n\n" +
    "$$\\text{Taxable income} = \\text{total income} - \\text{depreciation} - \\text{ordinary expenses}$$\n\n" +
    "$$(\\text{Taxable income}) = " + fmt(R) + " - " + fmt(D) + " - " + fmt(E) + " = " + mtex(ans) + "$$";
  return {
    variantKey: "R" + R + "_E" + E + "_D" + D,
    question: "A company has annual revenue of " + money(R) + ", ordinary operating expenses of " + money(E) + ", and depreciation of " + money(D) + ". What is its taxable income?",
    options: [
      { label: money(ans), num: ans, correct: true },
      { label: money(R - E), num: R - E },       // forgets depreciation
      { label: money(R - D), num: R - D },       // forgets expenses
      { label: money(R - E + D), num: R - E + D } // adds depreciation back
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-029
// Cost index updating: current $ = cost_M * (index_now / index_M).
def({
  baseId: "econ-029", subtopic: "Cost index updating", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The cost scales with the ratio of the current index to the original index. Flipping the ratio ($38,462) estimates the cost as if prices had fallen -- check the direction of the change."
}, function () {
  var C0 = ri(5, 20) * 5000;
  var idx0 = ri(80, 120) * 5;
  var mult = pick([1.15, 1.2, 1.25, 1.3, 1.4]);
  var idx1 = Math.round(idx0 * mult / 5) * 5;
  var yr = ri(2012, 2018);
  var ans = Math.round(C0 * idx1 / idx0);
  var solution =
    "Refer to the Cost Indexes section of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the current cost. The handbook prints:\n\n" +
    "$$\\text{Current \\$} = (\\text{Cost in year M}) \\times \\frac{\\text{Current Index}}{\\text{Index in year M}}$$\n\n" +
    "Substituting:\n\n" +
    "$$(\\text{Current \\$}) = " + fmt(C0) + " \\times \\frac{" + idx1 + "}{" + idx0 + "} = " + fmt(C0) + "(" + (idx1 / idx0).toFixed(4) + ")$$\n\n" +
    "$$(\\text{Current \\$}) = " + mtex(ans) + "$$";
  return {
    variantKey: "C" + C0 + "_i0" + idx0 + "_i1" + idx1,
    question: "A pump cost " + money(C0) + " in " + yr + ", when the cost index was " + idx0 + ". If the current index is " + idx1 + ", what is the estimated current cost?",
    options: [
      { label: money(ans), num: ans, correct: true },
      { label: money(Math.round(C0 * idx0 / idx1)), num: Math.round(C0 * idx0 / idx1) },       // flipped ratio
      { label: money(Math.round(C0 * (idx1 - idx0) / idx0)), num: Math.round(C0 * (idx1 - idx0) / idx0) }, // increase only
      { label: money(C0), num: C0 }                                                            // no change
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-030
// Unknown number of periods: solve (P/A,i%,n) = P/A by testing integer n.
def({
  baseId: "econ-030", subtopic: "Unknown number of periods (P/A)", difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "The present-worth factor (P/A, 10%, n) must equal the investment divided by the annual return. Solve by testing integer values of n -- n = 5 makes the factor exactly 3.7908."
}, function () {
  var A = ri(5, 20) * 1000, iP = ri(5, 12), n = ri(4, 8);
  var i = iP / 100;
  var oneP = (1 + i).toFixed(2);
  var P = Math.round(A * p_a(i, n));
  var paN = p_a(i, n);
  var solution =
    "Refer to the Nomenclature and Definitions section in the Engineering Economics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must find \\(n\\). The handbook prints the uniform-series present-worth factor:\n\n" +
    "$$(P) = A(P/A, i\\%, n)$$\n\n" +
    "$$(P/A, " + iP + "\\%, n) = \\frac{" + fmt(P) + "}{" + fmt(A) + "} = " + (P / A).toFixed(4) + "$$\n\n" +
    "Testing \\(n = " + n + "\\):\n\n" +
    "$$(P/A, " + iP + "\\%, " + n + ") = \\frac{(" + oneP + ")^{" + n + "} - 1}{(" + texNum(i) + ")(" + oneP + ")^{" + n + "}} = \\frac{" + (Math.pow(1 + i, n) - 1).toFixed(5) + "}{" + (i * Math.pow(1 + i, n)).toFixed(5) + "} = " + paN.toFixed(4) + "$$\n\n" +
    "So \\(n = " + n + "\\) years.";
  return {
    variantKey: "P" + P + "_A" + A + "_i" + iP,
    question: "An investment of " + money(P) + " returns " + money(A) + " at the end of each year. If the interest rate is " + iP + "% per year, how many years of returns are needed to recover the investment?",
    options: [
      { label: n + " years", num: n, correct: true },
      { label: (n - 1) + " years", num: n - 1 },
      { label: (n + 1) + " years", num: n + 1 },
      { label: (n + 2) + " years", num: n + 2 }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-031
// Decision tree: choose the alternative with the highest expected value.
def({
  baseId: "econ-031", subtopic: "Decision tree expected value", difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Expected value weights each outcome by its probability -- losses enter with a negative sign. The decision rule is to choose the branch with the highest expected value, not the highest best-case payoff."
}, function () {
  var pA = 0.6, wA = 80000, lA = 20000, pB = 0.5, wB = 100000, lB = 10000;
  var evA = 0, evB = 0, ok = false;
  for (var t = 0; t < 300 && !ok; t++) {
    pA = pick([0.5, 0.6, 0.7]); wA = ri(6, 12) * 10000; lA = ri(1, 4) * 10000;
    pB = pick([0.4, 0.5, 0.6]); wB = ri(6, 12) * 10000; lB = ri(1, 4) * 10000;
    evA = wA * pA - lA * (1 - pA);
    evB = wB * pB - lB * (1 - pB);
    var winnerBest = evA > evB ? wA : wB;
    var loserBest = evA > evB ? wB : wA;
    ok = Math.abs(evA - evB) >= 2000 && evA > 5000 && evB > 5000 && loserBest > winnerBest;
  }
  var winIsA = evA > evB;
  var evW = winIsA ? evA : evB, evL = winIsA ? evB : evA;
  var wName = winIsA ? "A" : "B", lName = winIsA ? "B" : "A";
  var lWin = winIsA ? wB : wA, lP = winIsA ? pB : pA;
  function pct(p) { return Math.round(p * 100) + "%"; }
  var solution =
    "Refer to the Economic Decision Trees section in the Engineering Economics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must compare expected values. The handbook prints:\n\n" +
    "$$EV = (C_1)(p_1) + (C_2)(p_2) + \\cdots$$\n\n" +
    "For Alternative A:\n\n" +
    "$$(EV_A) = (" + fmt(wA) + ")(" + pA + ") + (-" + fmt(lA) + ")(" + (1 - pA).toFixed(1) + ")$$\n\n" +
    "$$(EV_A) = " + fmt(wA * pA) + " - " + fmt(lA * (1 - pA)) + " = " + mtex(evA) + "$$\n\n" +
    "For Alternative B:\n\n" +
    "$$(EV_B) = (" + fmt(wB) + ")(" + pB + ") + (-" + fmt(lB) + ")(" + (1 - pB).toFixed(1) + ")$$\n\n" +
    "$$(EV_B) = " + fmt(wB * pB) + " - " + fmt(lB * (1 - pB)) + " = " + mtex(evB) + "$$\n\n" +
    "Since \\(EV_" + wName + " > EV_" + lName + "\\), the decision maker should choose Alternative " + wName + ".";
  return {
    variantKey: "A" + wA + "x" + Math.round(pA * 100) + "_B" + wB + "x" + Math.round(pB * 100),
    question: "A decision node offers two alternatives. Alternative A: a " + pct(pA) + " chance of a " + money(wA) + " profit and a " + pct(1 - pA) + " chance of a " + money(lA) + " loss. Alternative B: a " + pct(pB) + " chance of a " + money(wB) + " profit and a " + pct(1 - pB) + " chance of a " + money(lB) + " loss. On an expected-value basis, which alternative should the decision maker choose?",
    options: [
      { label: "Alternative " + wName + " (EV = " + money(evW) + ")", num: null, correct: true },
      { label: "Alternative " + lName + " (EV = " + money(evL) + ")", num: null },
      { label: "Alternative " + lName + " (EV = " + money(lWin * lP) + ")", num: null }, // ignores the loss
      { label: "Neither \u2014 both alternatives have negative expected value", num: null }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-032
// MARR decision rule: accept only if rate of return >= MARR.
def({
  baseId: "econ-032", subtopic: "MARR decision rule", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "The MARR is the hurdle rate: accept only if the computed rate of return meets or exceeds it. A positive return is not enough if it falls short of what the company demands."
}, function () {
  var rc = ri(6, 14);
  var marr = rc + pick([-4, -3, -2, 2, 3, 4]);
  if (marr < 4) marr = 4;
  if (marr > 16) marr = 16;
  var accept = rc >= marr;
  var correctLabel = accept
    ? "Yes \u2014 the " + rc + "% return meets the " + marr + "% MARR"
    : "No \u2014 the " + rc + "% return is below the " + marr + "% MARR";
  var wrongFlip = accept
    ? "No \u2014 the " + rc + "% return is below the " + marr + "% MARR"
    : "Yes \u2014 the " + rc + "% return exceeds the " + marr + "% MARR";
  var solution =
    "Refer to the Rate-of-Return section in the Engineering Economics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must apply the decision rule. The handbook states:\n\n" +
    "The minimum acceptable rate-of-return (MARR) is that interest rate that one is willing to accept. The rate-of-return on an investment is the interest rate that makes the benefits and costs equal.\n\n" +
    "An investment is acceptable when its rate of return meets or exceeds the MARR.\n\n" +
    "Here \\(" + rc + "\\% " + (accept ? "\\geq" : "<") + " " + marr + "\\%\\); the computed return " + (accept ? "meets" : "falls short of") + " the hurdle rate.\n\n" +
    "Therefore the investment should " + (accept ? "" : "NOT ") + "be accepted.";
  return {
    variantKey: "rc" + rc + "_marr" + marr,
    question: "A proposed investment has a computed rate of return of " + rc + "%. The company's minimum acceptable rate of return (MARR) is " + marr + "%. Based on the rate-of-return criterion, should the investment be accepted?",
    options: [
      { label: correctLabel, num: null, correct: true },
      { label: wrongFlip, num: null },
      { label: "Yes \u2014 any positive rate of return is acceptable", num: null },
      { label: "No \u2014 the rate of return exceeds the MARR", num: null }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-033
// Equivalent uniform annual cost: EUAC = P(A/P,i,n) - S(A/F,i,n).
def({
  baseId: "econ-033", subtopic: "Equivalent uniform annual cost", difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "EUAC = \\(P(A/P,i,n) - S(A/F,i,n)\\). The salvage value is a future receipt, so it is subtracted as an \\(A/F\\) amount. Ignoring salvage gives $7,451."
}, function () {
  var P = ri(3, 8) * 10000;
  var S = Math.round(P * pick([0.05, 0.1, 0.15, 0.2]) / 100) * 100;
  var n = ri(8, 15), iP = ri(5, 10);
  var i = iP / 100;
  var oneP = (1 + i).toFixed(2);
  var ap = a_p(i, n), af = ap - i;
  var ans = Math.round(P * ap - S * af);
  var solution =
    "Refer to the Capital Recovery and Sinking Fund sections in the Engineering Economics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the \\(EUAC\\). The handbook prints:\n\n" +
    "$$(A/P,i,n) = \\frac{i(1+i)^n}{(1+i)^n-1} \\qquad (A/F,i,n) = (A/P,i,n) - i$$\n\n" +
    "The equivalent uniform annual cost spreads the first cost and recovers the salvage value:\n\n" +
    "$$EUAC = P(A/P," + iP + "\\%," + n + ") - S(A/F," + iP + "\\%," + n + ")$$\n\n" +
    "Computing the factors:\n\n" +
    "$$(A/P," + iP + "\\%," + n + ") = \\frac{" + texNum(i) + "(" + oneP + ")^{" + n + "}}{(" + oneP + ")^{" + n + "}-1} = \\frac{" + (i * Math.pow(1 + i, n)).toFixed(6) + "}{" + (Math.pow(1 + i, n) - 1).toFixed(6) + "} = " + ap.toFixed(5) + "$$\n\n" +
    "$$(A/F," + iP + "\\%," + n + ") = " + ap.toFixed(5) + " - " + texNum(i) + " = " + af.toFixed(5) + "$$\n\n" +
    "Substituting:\n\n" +
    "$$EUAC = " + fmt(P) + "(" + ap.toFixed(5) + ") - " + fmt(S) + "(" + af.toFixed(5) + ")$$\n\n" +
    "$$EUAC = " + (P * ap).toFixed(1) + " - " + (S * af).toFixed(1) + " = " + (P * ap - S * af).toFixed(1) + " \\approx " + mtex(ans) + "$$";
  return {
    variantKey: "P" + P + "_S" + S + "_n" + n + "_i" + iP,
    question: "A machine costs " + money(P) + " new, has an estimated salvage value of " + money(S) + " after " + n + " years, and the interest rate is " + iP + "% per year. What is the equivalent uniform annual cost (EUAC) of owning the machine?",
    options: [
      { label: money(ans), num: ans, correct: true },
      { label: money(Math.round(P * ap)), num: Math.round(P * ap) },                   // ignores salvage
      { label: money(Math.round(P * ap + S * af)), num: Math.round(P * ap + S * af) }, // adds salvage
      { label: money(Math.round((P - S) * ap)), num: Math.round((P - S) * ap) }        // salvage reduces first cost
    ],
    solution: solution
  };
});


/* ============ 2026-10 expansion entries (econ-040..066) ============
 * Factors are rounded to 4 decimals like the handbook tables, then the
 * product is rounded to dollars - exactly the bank's reviewed method.
 * Citations reuse the bank's reviewed wording; table pages by rate are
 * verified against the v10.6 PDF (0.5/1% -> 238/244, 1.5/2% -> 239/245,
 * 4/6% -> 240/246, 8/10% -> 241/247, 12/18% -> 242/248).
 */
var r4e = function (x) { return Math.round(x * 10000) / 10000; };
var TBLPG = { "0.5": [238, 244], "1": [238, 244], "1.5": [239, 245], "2": [239, 245], "4": [240, 246], "6": [240, 246], "8": [241, 247], "10": [241, 247], "12": [242, 248], "18": [242, 248] };
var tblCite = function (pct) {
  var pg = TBLPG[String(pct)];
  return "Refer to the Engineering Economics interest-rate table for i = " + pct + "% in the FE Reference Handbook (v10.6), printed page " + pg[0] + " (PDF page " + pg[1] + "), and the factor formulas, printed page 235 (PDF page 241).";
};
var p_g = function (i, n) { var f = Math.pow(1 + i, n); return (f - 1) / (i * i * f) - n / (i * f); };
var a_g = function (i, n) { return 1 / i - n / (Math.pow(1 + i, n) - 1); };

// ---------------------------------------------------------------- econ-040
// Single payment compound amount F = P(F/P).
def({ baseId: "econ-040", subtopic: "Single payment compound amount from the table", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "(F/P) converts present to future. The traps are simple interest, the P/F inverse, and squaring the horizon."
}, function () {
  var P = pick([5000, 6000, 8000, 10000]);
  var pct = pick([4, 6, 8]); var i = pct / 100;
  var n = pick([5, 10, 15]);
  var f = r4e(f_p(i, n));
  var F = Math.round(P * f);
  var tSimple = Math.round(P * (1 + i * n));
  var tInv = Math.round(P * r4e(p_f(i, n)));
  var tDbl = Math.round(P * r4e(f_p(i, 2 * n)));
  var question = "A deposit of " + money(P) + " earns " + pct + "% interest per year, compounded annually. Using the handbook interest-rate table, what is the balance after " + n + " years?";
  var solution = tblCite(pct) + "\n\n" +
    "The factor \\((F/P, " + pct + "\\%, " + n + ")\\) converts a present amount to a future amount.\n\n" +
    "$$\\begin{aligned}F &= P(F/P, " + pct + "\\%, " + n + ") \\\\ &= (" + money(P).slice(1) + ")(" + f.toFixed(4) + ") \\\\ &= " + mtex(F) + "\\end{aligned}$$";
  return {
    variantKey: "P" + P + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: money(F), num: F, correct: true },
      { label: money(tInv), num: tInv, correct: false },
      { label: money(tDbl), num: tDbl, correct: false },
      { label: money(tSimple), num: tSimple, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-041
// Present worth P = F(P/F).
def({ baseId: "econ-041", subtopic: "Present worth of a future sum", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "(P/F) discounts future to present. F/n is the no-interest slip; (F/P) inflates instead of discounting."
}, function () {
  var F = pick([25000, 50000, 75000]);
  var pct = pick([8, 10, 12]); var i = pct / 100;
  var n = pick([10, 15, 20]);
  var f = r4e(p_f(i, n));
  var P = Math.round(F * f);
  var tInv = Math.round(F * r4e(f_p(i, n)));
  var tN = Math.round(F / n);
  var tHalf = Math.round(F / 2);
  var question = "A city needs " + money(F) + " in " + n + " years for a bridge replacement fund. At " + pct + "% interest compounded annually, how much must be set aside today?";
  var solution = tblCite(pct) + "\n\n" +
    "$$\\begin{aligned}P &= F(P/F, " + pct + "\\%, " + n + ") \\\\ &= (" + money(F).slice(1) + ")(" + f.toFixed(4) + ") \\\\ &= " + mtex(P) + "\\end{aligned}$$";
  return {
    variantKey: "F" + F + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: money(P), num: P, correct: true },
      { label: money(tN), num: tN, correct: false },
      { label: money(tInv), num: tInv, correct: false },
      { label: money(tHalf), num: tHalf, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-042
// Capital recovery A = P(A/P).
def({ baseId: "econ-042", subtopic: "Loan payment using the capital recovery factor", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "(A/P) annualizes a present loan. P/n forgets interest entirely; (A/F) is the sinking-fund factor; (P/A) multiplies the wrong way."
}, function () {
  var P = pick([80000, 120000, 150000]);
  var pct = pick([6, 8, 10]); var i = pct / 100;
  var n = pick([15, 20, 25]);
  var f = r4e(a_p(i, n));
  var A = Math.round(P * f);
  var tN = Math.round(P / n);
  var tAF = Math.round(P * r4e(a_f(i, n)));
  var tPA = Math.round(P * r4e(p_a(i, n)));
  var question = "A contractor finances " + money(P) + " of equipment with a " + n + "-year loan at " + pct + "% per year, paid in equal annual payments at the end of each year. What is the annual payment?";
  var solution = tblCite(pct) + "\n\n" +
    "The capital recovery factor converts a present amount P to a uniform series A.\n\n" +
    "$$\\begin{aligned}A &= P(A/P, " + pct + "\\%, " + n + ") \\\\ &= (" + money(P).slice(1) + ")(" + f.toFixed(4) + ") \\\\ &= " + mtex(A) + "\\end{aligned}$$";
  return {
    variantKey: "P" + P + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: money(A), num: A, correct: true },
      { label: money(tN), num: tN, correct: false },
      { label: money(tAF), num: tAF, correct: false },
      { label: money(tPA), num: tPA, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-043
// Sinking fund A = F(A/F).
def({ baseId: "econ-043", subtopic: "Sinking fund deposit", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "(A/F) is smaller than (A/P) because the deposits earn interest. F/n forgets the interest; (F/A) inverts the factor."
}, function () {
  var F = pick([50000, 90000, 120000]);
  var pct = pick([4, 6, 8]); var i = pct / 100;
  var n = pick([10, 12, 15]);
  var f = r4e(a_f(i, n));
  var A = Math.round(F * f);
  var tAP = Math.round(F * r4e(a_p(i, n)));
  var tN = Math.round(F / n);
  var tFA = Math.round(F * r4e(f_a(i, n)));
  var question = "A utility will deposit equal amounts at the end of each year for " + n + " years at " + pct + "% annual interest so that the account holds " + money(F) + " immediately after the last deposit. What is each deposit?";
  var solution = tblCite(pct) + "\n\n" +
    "$$\\begin{aligned}A &= F(A/F, " + pct + "\\%, " + n + ") \\\\ &= (" + money(F).slice(1) + ")(" + f.toFixed(4) + ") \\\\ &= " + mtex(A) + "\\end{aligned}$$";
  return {
    variantKey: "F" + F + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: money(A), num: A, correct: true },
      { label: money(tAP), num: tAP, correct: false },
      { label: money(tN), num: tN, correct: false },
      { label: money(tFA), num: tFA, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-044
// Compound amount of a uniform series F = A(F/A).
def({ baseId: "econ-044", subtopic: "Future value of an annuity", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "(F/A) accumulates a uniform series with interest. A*n is the no-interest slip; (P/A) and (F/P) are single-sum factors misapplied."
}, function () {
  var A = pick([1500, 2500, 4000]);
  var pct = pick([8, 10, 12]); var i = pct / 100;
  var n = pick([8, 10, 12]);
  var f = r4e(f_a(i, n));
  var F = Math.round(A * f);
  var tPA = Math.round(A * r4e(p_a(i, n)));
  var tN = A * n;
  var tFP = Math.round(A * r4e(f_p(i, n)));
  var question = "An investor deposits " + money(A) + " at the end of every year into an account earning " + pct + "% annual interest. How much is in the account immediately after the deposit at the end of year " + n + "?";
  var solution = tblCite(pct) + "\n\n" +
    "$$\\begin{aligned}F &= A(F/A, " + pct + "\\%, " + n + ") \\\\ &= (" + money(A).slice(1) + ")(" + f.toFixed(4) + ") \\\\ &= " + mtex(F) + "\\end{aligned}$$";
  return {
    variantKey: "A" + A + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: money(F), num: F, correct: true },
      { label: money(tPA), num: tPA, correct: false },
      { label: money(tN), num: tN, correct: false },
      { label: money(tFP), num: tFP, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-045
// Present worth of monthly payments P = A(P/A) with monthly rate.
def({ baseId: "econ-045", subtopic: "Present worth of monthly payments", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "n counts MONTHS because i is a monthly rate. A*n ignores interest; (F/A) goes the wrong way; (A/P) inverts it."
}, function () {
  var A = pick([200, 300, 500]);
  var pct = pick([0.5, 1.5]); var i = pct / 100;
  var n = pick([24, 36]);
  var f = r4e(p_a(i, n));
  var P = Math.round(A * f);
  var tN = A * n;
  var tFA = Math.round(A * r4e(f_a(i, n)));
  var tAP = Math.max(2, Math.round(A * r4e(a_p(i, n))));
  var question = "A machine saves " + money(A) + " per month. What is the present worth of " + n + " monthly savings at " + pct + "% per month?";
  var solution = tblCite(pct) + " The rate is per month, so n counts months.\n\n" +
    "$$\\begin{aligned}P &= A(P/A, " + pct + "\\%, " + n + ") \\\\ &= (" + money(A).slice(1) + ")(" + f.toFixed(4) + ") \\\\ &= " + mtex(P) + "\\end{aligned}$$";
  return {
    variantKey: "A" + A + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: money(P), num: P, correct: true },
      { label: money(tN), num: tN, correct: false },
      { label: money(tFA), num: tFA, correct: false },
      { label: money(tAP), num: tAP, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-046
// Present worth of a linear gradient P = G(P/G).
def({ baseId: "econ-046", subtopic: "Present worth of an arithmetic gradient series", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "The gradient starts at zero at the end of year 1 and steps by G. (P/G) is its own factor - the (P/A), (A/G), and (F/A) factors do not substitute."
}, function () {
  var G = pick([500, 1000, 2000]);
  var pct = pick([8, 10]); var i = pct / 100;
  var n = pick([8, 10]);
  var f = r4e(p_g(i, n));
  var P = Math.round(G * f);
  var tPA = Math.round(G * r4e(p_a(i, n)));
  var tAG = Math.round(G * r4e(a_g(i, n)));
  var tFA = Math.round(G * r4e(f_a(i, n)));
  var question = "Maintenance on a pump is $0 at the end of year 1 and then increases by " + money(G) + " each year, through year " + n + ". At " + pct + "% interest, what is the present worth of this gradient series?";
  var solution = tblCite(pct) + " The gradient factor assumes the first gradient amount arrives at the end of year 2.\n\n" +
    "$$\\begin{aligned}P &= G(P/G, " + pct + "\\%, " + n + ") \\\\ &= (" + money(G).slice(1) + ")(" + f.toFixed(4) + ") \\\\ &= " + mtex(P) + "\\end{aligned}$$";
  return {
    variantKey: "G" + G + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: money(P), num: P, correct: true },
      { label: money(tPA), num: tPA, correct: false },
      { label: money(tAG), num: tAG, correct: false },
      { label: money(tFA), num: tFA, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-047
// Gradient to uniform series A = G(A/G).
def({ baseId: "econ-047", subtopic: "Uniform-series equivalent of a gradient", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "(A/G) is the gradient-to-uniform factor. G(n-1)/2 is the simple average; (P/G) leaves it in present-worth units."
}, function () {
  var G = pick([250, 500, 750]);
  var pct = pick([4, 6, 8]); var i = pct / 100;
  var n = pick([8, 10]);
  var f = r4e(a_g(i, n));
  var A = Math.round(G * f);
  var tPG = Math.round(G * r4e(p_g(i, n)));
  var tAvg = Math.round(G * (n - 1) / 2);
  var tAFG = Math.round(G * r4e(a_f(i, n)));
  var question = "Maintenance is $0 at the end of year 1 and increases by " + money(G) + " each year, through year " + n + ". At " + pct + "% interest, what equal annual amount over " + n + " years is equivalent to this gradient series?";
  var solution = tblCite(pct) + "\n\n" +
    "$$\\begin{aligned}A &= G(A/G, " + pct + "\\%, " + n + ") \\\\ &= (" + money(G).slice(1) + ")(" + f.toFixed(4) + ") \\\\ &= " + mtex(A) + "\\end{aligned}$$";
  return {
    variantKey: "G" + G + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: money(A), num: A, correct: true },
      { label: money(tPG), num: tPG, correct: false },
      { label: money(tAvg), num: tAvg, correct: false },
      { label: money(tAFG), num: tAFG, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-048
// Effective annual rate from nominal.
def({ baseId: "econ-048", subtopic: "Effective annual interest rate", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "i_eff = (1 + r/m)^m - 1. The traps are the nominal rate itself, r/m, and the wrong compounding count."
}, function () {
  var case_ = pick([{ r: 8, m: 4 }, { r: 8, m: 12 }, { r: 10, m: 2 }, { r: 10, m: 4 }, { r: 12, m: 2 }, { r: 12, m: 12 }]);
  var r = case_.r, m = case_.m;
  var ieff = (Math.pow(1 + r / 100 / m, m) - 1) * 100;
  var ans = Math.round(ieff * 100) / 100;
  var wrongM = m === 12 ? 4 : 12;
  var tWrongM = Math.round((Math.pow(1 + r / 100 / wrongM, wrongM) - 1) * 10000) / 100;
  var labels = {
    correct: ans.toFixed(2) + "%",
    trap1: (r / m).toFixed(2) + "%",
    trap2: r.toFixed(2) + "%",
    trap3: tWrongM.toFixed(2) + "%"
  };
  var mName = { 2: "semiannually", 4: "quarterly", 12: "monthly" }[m];
  var question = "A loan has a nominal annual interest rate of " + r + "% per year, compounded " + mName + ". What is the effective annual interest rate?";
  var solution = "Refer to Non-Annual Compounding in the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 236 (PDF page 242).\n\n" +
    "There are m = " + m + " compounding periods per year.\n\n" +
    "$$\\begin{aligned}i_{\\text{eff}} &= \\left(1 + \\frac{" + (r / 100).toFixed(2) + "}{" + m + "}\\right)^{" + m + "} - 1 \\\\ &= (" + (1 + r / 100 / m).toFixed(6) + ")^{" + m + "} - 1 = " + (ans / 100).toFixed(4) + " = " + labels.correct + "\\end{aligned}$$";
  return {
    variantKey: "r" + r + "_m" + m,
    question: question,
    options: [
      { label: labels.correct, num: ans, correct: true },
      { label: labels.trap1, num: r / m, correct: false },
      { label: labels.trap2, num: r, correct: false },
      { label: labels.trap3, num: tWrongM, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-049
// Inflation-adjusted (combined) interest rate d = i + f + if.
def({ baseId: "econ-049", subtopic: "Inflation-adjusted interest rate", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "d = i + f + if - the interaction term if is the trap everyone drops. d = i + f is close but wrong."
}, function () {
  var case_ = pick([{ i: 6, f: 3 }, { i: 6, f: 5 }, { i: 9, f: 4 }, { i: 12, f: 3 }, { i: 12, f: 5 }]);
  var ip = case_.i, fp = case_.f;
  var i = ip / 100, f = fp / 100;
  var d = (i + f + i * f) * 100;
  var ans = Math.round(d * 100) / 100;
  var tSum = ip + fp;
  var tDiff = Math.abs(ip - fp);
  var tReal = Math.round(((1 + i) / (1 + f) - 1) * 10000) / 100;
  var labels = { c: ans.toFixed(2) + "%", t1: tSum.toFixed(2) + "%", t2: tDiff.toFixed(2) + "%", t3: tReal.toFixed(2) + "%" };
  var question = "An investment earns a real annual rate of return of " + ip + "%. Inflation is " + fp + "% per year. What inflation-adjusted interest rate d should be used to discount future dollar cash flows?";
  var solution = "Refer to the Inflation subsection of the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 236 (PDF page 242).\n\n" +
    "The combined rate satisfies \\((1 + d) = (1 + i)(1 + f)\\), so \\(d = i + f + if\\).\n\n" +
    "$$\\begin{aligned}d &= " + i.toFixed(2) + " + " + f.toFixed(2) + " + (" + i.toFixed(2) + ")(" + f.toFixed(2) + ") \\\\ &= " + (i + f).toFixed(2) + " + " + (i * f).toFixed(4) + " = " + (d / 100).toFixed(4) + " = " + labels.c + "\\end{aligned}$$";
  return {
    variantKey: "i" + ip + "_f" + fp,
    question: question,
    options: [
      { label: labels.c, num: ans, correct: true },
      { label: labels.t1, num: tSum, correct: false },
      { label: labels.t2, num: tDiff, correct: false },
      { label: labels.t3, num: tReal, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-050
// Bond value.
def({ baseId: "econ-050", subtopic: "Bond value", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "Value = coupons at the MARKET yield plus the discounted face. Par ($1,000) is the trap when coupon < yield; the un-discounted total ignores time value."
}, function () {
  var F = 1000;
  var pair = pick([{ rc: 5, yd: 6 }, { rc: 5, yd: 8 }, { rc: 5, yd: 10 }, { rc: 6, yd: 8 }, { rc: 6, yd: 10 }, { rc: 7, yd: 10 }]);
  var rc = pair.rc, yd = pair.yd;
  var n = pick([8, 10, 12]);
  var y = yd / 100;
  var C = F * rc / 100;
  var fPA = r4e(p_a(y, n));
  var fPF = r4e(p_f(y, n));
  var V = Math.round(C * fPA + F * fPF);
  var tFace = F;
  var tCouponsOnly = Math.round(C * fPA);
  var tSum = Math.round(C * n + F);
  var question = "A bond has a face value of $1,000, a coupon rate of " + rc + "% per year paid annually, " + n + " years remaining to maturity, and a current market yield of " + yd + "%. What is the value of the bond?";
  var solution = tblCite(yd) + "\n\n" +
    "Value the bond at the market yield, not the coupon rate: \\(V = C(P/A, " + yd + "\\%, " + n + ") + F(P/F, " + yd + "\\%, " + n + ")\\) (Bond Value formula, Engineering Economics, printed page 236 (PDF page 242)).\n\n" +
    "$$\\begin{aligned}C &= 0.0" + rc + "(1000) = " + C.toFixed(0) + " \\\\ V &= (" + C.toFixed(0) + ")(" + fPA.toFixed(4) + ") + (1000)(" + fPF.toFixed(4) + ") \\\\ &= " + mtex(V) + "\\end{aligned}$$";
  return {
    variantKey: "rc" + rc + "_y" + yd + "_n" + n,
    question: question,
    options: [
      { label: money(V), num: V, correct: true },
      { label: money(tFace), num: tFace, correct: false },
      { label: money(tCouponsOnly), num: tCouponsOnly, correct: false },
      { label: money(tSum), num: tSum, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-051
// EUAC of a purchase with salvage.
def({ baseId: "econ-051", subtopic: "Equivalent uniform annual cost", difficulty: "medium",
  estimatedTimeSeconds: 135,
  explanation: "EUAC = P(A/P) - S(A/F). Crediting the salvage by the same factor as the first cost, and dropping the salvage entirely, are the two classic traps."
}, function () {
  var P = pick([40000, 50000, 60000]);
  var S = pick([5000, 8000, 12000]);
  var pct = pick([6, 8]); var i = pct / 100;
  var n = pick([8, 10]);
  var fAP = r4e(a_p(i, n));
  var fAF = r4e(a_f(i, n));
  var E = Math.round(P * fAP - S * fAF);
  var tNoSalv = Math.round(P * fAP);
  var tSame = Math.round((P - S) * fAP);
  var tSL = Math.round((P - S) / n);
  var question = "A machine costs " + money(P) + ", has a salvage value of " + money(S) + " after " + n + " years, and interest is " + pct + "%. What is the equivalent uniform annual cost (EUAC) of owning the machine?";
  var solution = tblCite(pct) + "\n\n" +
    "$$\\begin{aligned}\\text{EUAC} &= P(A/P, " + pct + "\\%, " + n + ") - S(A/F, " + pct + "\\%, " + n + ") \\\\ &= (" + money(P).slice(1) + ")(" + fAP.toFixed(4) + ") - (" + money(S).slice(1) + ")(" + fAF.toFixed(4) + ") \\\\ &= " + mtex(E) + "\\end{aligned}$$";
  return {
    variantKey: "P" + P + "_S" + S + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: money(E), num: E, correct: true },
      { label: money(tNoSalv), num: tNoSalv, correct: false },
      { label: money(tSame), num: tSame, correct: false },
      { label: money(tSL), num: tSL, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-052
// Monthly loan payment A = P(A/P) at monthly rate.
def({ baseId: "econ-052", subtopic: "Monthly loan payment", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Both i and n are monthly. P/n is interest-free; P*i is interest-only; (P/A) multiplies the wrong way."
}, function () {
  var P = pick([12000, 24000, 36000]);
  var pct = pick([0.5, 1.5]); var i = pct / 100;
  var n = pick([36, 40, 48]);
  var f = r4e(a_p(i, n));
  var A = Math.round(P * f);
  var tN = Math.round(P / n);
  var tInt = Math.round(P * i);
  var tPA = Math.round(P * r4e(p_a(i, n)));
  var question = "A shop borrows " + money(P) + " at " + pct + "% per month and repays it in " + n + " equal end-of-month payments. What is each monthly payment?";
  var solution = tblCite(pct) + " The rate and the period are both monthly.\n\n" +
    "$$\\begin{aligned}A &= P(A/P, " + pct + "\\%, " + n + ") \\\\ &= (" + money(P).slice(1) + ")(" + f.toFixed(4) + ") \\\\ &= " + mtex(A) + "\\end{aligned}$$";
  return {
    variantKey: "P" + P + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: money(A), num: A, correct: true },
      { label: money(tN), num: tN, correct: false },
      { label: money(tInt), num: tInt, correct: false },
      { label: money(tPA), num: tPA, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-053
// Rate of return from factor ratio (discrete rate cases).
def({ baseId: "econ-053", subtopic: "Rate of return by factor lookup", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "The ratio A/P equals (A/P, i, n) for exactly one tabulated rate. The two-flip traps use (P/A) inverted and the wrong decade of n."
}, function () {
  var n = 5;
  var case_ = pick([
    { rate: 4, perTen: 2246 },
    { rate: 8, perTen: 2505 },
    { rate: 12, perTen: 2774 }
  ]);
  var mult = pick([1, 2, 4]);
  var P = 10000 * mult, A = case_.perTen * mult;
  var rate = case_.rate;
  var pg = TBLPG[String(rate)];
  var question = "An investment of " + money(P) + " returns " + money(A) + " at the end of each year for " + n + " years. Which of the following is closest to the investment's rate of return?";
  var solution = "Refer to the Engineering Economics interest-rate table for i = " + rate + "% in the FE Reference Handbook (v10.6), printed page " + pg[0] + " (PDF page " + pg[1] + ").\n\n" +
    "The uniform series satisfies \\(A = P(A/P, i, " + n + ")\\), so the factor ratio is\n\n" +
    "$$\\frac{A}{P} = \\frac{" + A + "}{" + P + "} = " + (A / P).toFixed(4) + "$$\n\n" +
    "Scanning the i = " + rate + "% table at n = " + n + ": \\((A/P, " + rate + "\\%, " + n + ") = " + r4e(a_p(rate / 100, n)).toFixed(4) + "\\), which matches the ratio. The other listed rates give factors that do not match, so the rate of return is " + rate + "%.";
  return {
    variantKey: "r" + rate + "_m" + mult,
    question: question,
    options: [
      { label: rate + "%", num: rate, correct: true },
      { label: (rate === 4 ? 8 : 4) + "%", num: rate === 4 ? 8 : 4, correct: false },
      { label: (rate === 12 ? 8 : 12) + "%", num: rate === 12 ? 8 : 12, correct: false },
      { label: "1.5%", num: 1.5, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-054
// Break-even volume.
def({ baseId: "econ-054", subtopic: "Break-even volume", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Break-even divides fixed cost by the MARGIN (p - v), not by price or unit cost. The margin is the trap surface."
}, function () {
  var F = pick([60000, 120000, 180000]);
  var v = pick([12, 18, 24]);
  var margin = pick([6, 10, 12]);
  var p = v + margin;
  var x = Math.round(F / margin);
  var tP = Math.round(F / p);
  var tV = Math.round(F / v);
  var tHalf = Math.round(F / (margin / 2));
  var question = "A product sells for $" + p + " per unit with a variable cost of $" + v + " per unit. Annual fixed costs are " + money(F) + ". What is the annual break-even volume, in units?";
  var solution = "Refer to Breakeven Analysis in the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 236 (PDF page 242): the breakeven point is where income just covers expenses. Setting revenue equal to total cost: \\(p\\,x = F + v\\,x\\) (algebra, not printed in the handbook).\n\n" +
    "$$x = \\frac{F}{p - v} = \\frac{" + F + "}{" + p + " - " + v + "} = \\frac{" + F + "}{" + margin + "} = " + x.toLocaleString("en-US") + "\\ \\text{units}$$";
  return {
    variantKey: "F" + F + "_v" + v + "_m" + margin,
    question: question,
    options: [
      { label: x.toLocaleString("en-US") + " units", num: x, correct: true },
      { label: tP.toLocaleString("en-US") + " units", num: tP, correct: false },
      { label: tV.toLocaleString("en-US") + " units", num: tV, correct: false },
      { label: tHalf.toLocaleString("en-US") + " units", num: tHalf, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-055
// Break-even point as percent of capacity.
def({ baseId: "econ-055", subtopic: "Break-even point as percent of capacity", difficulty: "medium",
  estimatedTimeSeconds: 135,
  explanation: "BE% = F / (R - V). The denominator is the total margin at capacity, not revenue or variable cost alone."
}, function () {
  var tri = pick([[1000000, 400000, 200000], [1000000, 400000, 300000], [1000000, 400000, 450000], [1000000, 700000, 200000], [1000000, 700000, 450000], [1500000, 400000, 200000], [1500000, 400000, 300000], [1500000, 400000, 450000], [1500000, 500000, 200000], [1500000, 500000, 300000], [1500000, 500000, 450000], [1500000, 700000, 200000], [1500000, 700000, 300000], [1500000, 700000, 450000], [2000000, 400000, 200000], [2000000, 400000, 300000], [2000000, 400000, 450000], [2000000, 500000, 200000], [2000000, 500000, 300000], [2000000, 500000, 450000], [2000000, 700000, 200000], [2000000, 700000, 300000], [2000000, 700000, 450000]]);
  var R = tri[0], V = tri[1], F = tri[2];
  var BE = Math.round(1000 * F / (R - V)) / 10;
  var tFR = Math.round(1000 * F / R) / 10;
  var tMR = Math.round(1000 * (R - V) / R) / 10;
  var tFV = Math.round(1000 * F / V) / 10;
  var labels = [BE, tFR, tMR, tFV].map(function (x) { return x.toFixed(1) + "%"; });
  var fmoney = function (x) { return "$" + (x / 1000000).toFixed(x % 1000000 === 0 ? 1 : 2).replace(/\.?0+$/, "") + " million"; };
  var question = "A plant's annual revenue at full capacity is " + fmoney(R) + ". Annual variable costs at capacity are " + fmoney(V) + " and annual fixed costs are " + fmoney(F) + ". What is the break-even point as a percentage of full capacity?";
  var solution = "Refer to Breakeven Analysis in the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 236 (PDF page 242).\n\n" +
    "Break-even fraction = fixed costs / (revenue - variable costs) at capacity.\n\n" +
    "$$\\text{BE\\%} = \\frac{F}{R - V} = \\frac{" + F + "}{" + R + " - " + V + "} = " + (F / (R - V)).toFixed(4) + " = " + labels[0] + "$$";
  return {
    variantKey: "R" + R + "_V" + V + "_F" + F,
    question: question,
    options: [
      { label: labels[0], num: BE, correct: true },
      { label: labels[1], num: tFR, correct: false },
      { label: labels[2], num: tMR, correct: false },
      { label: labels[3], num: tFV, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-056
// Make-vs-buy break-even quantity.
def({ baseId: "econ-056", subtopic: "Make-or-buy break-even quantity", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Make wins when x > F/(v_buy - v_make). Dividing the fixed cost by either unit cost alone is the classic slip."
}, function () {
  var F = pick([30000, 50000, 80000]);
  var vm = pick([6, 8, 10]);
  var d = pick([4, 6, 8]);
  var vb = vm + d;
  var x = Math.round(F / d);
  var tVb = Math.round(F / vb);
  var tVm = Math.round(F / vm);
  var tSum = Math.round(F / (vb + vm));
  var question = "A part can be purchased for $" + vb + " per unit. Making it in-house costs $" + vm + " per unit plus an annual fixed cost of " + money(F) + ". Above what annual quantity is making cheaper than buying?";
  var solution = "Refer to Breakeven Analysis in the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 236 (PDF page 242).\n\n" +
    "Set the two total costs equal: \\(F + " + vm + "x = " + vb + "x\\).\n\n" +
    "$$x = \\frac{F}{v_{\\text{buy}} - v_{\\text{make}}} = \\frac{" + F + "}{" + vb + " - " + vm + "} = \\frac{" + F + "}{" + d + "} = " + x.toLocaleString("en-US") + "\\ \\text{units}$$\n\n" +
    "Making is cheaper for quantities above " + x.toLocaleString("en-US") + " parts per year.";
  return {
    variantKey: "F" + F + "_vm" + vm + "_d" + d,
    question: question,
    options: [
      { label: x.toLocaleString("en-US") + " parts", num: x, correct: true },
      { label: tVb.toLocaleString("en-US") + " parts", num: tVb, correct: false },
      { label: tVm.toLocaleString("en-US") + " parts", num: tVm, correct: false },
      { label: tSum.toLocaleString("en-US") + " parts", num: tSum, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-060
// Simple payback period.
def({ baseId: "econ-060", subtopic: "Simple payback period", difficulty: "easy",
  estimatedTimeSeconds: 75,
  explanation: "Payback = cost / annual savings. The traps add or subtract a year or invert the ratio."
}, function () {
  var C = pick([40000, 60000, 90000]);
  var S = pick([10000, 12000, 15000]);
  var yrs = Math.round(10 * C / S) / 10;
  var tP1 = Math.round(10 * (C / S + 1)) / 10;
  var tM1 = Math.max(0.5, Math.round(10 * (C / S - 1)) / 10);
  var tInv = Math.round(100 * S / C) / 10;
  var labels = [yrs, tP1, tM1, tInv].map(function (x) { return x.toFixed(1) + " years"; });
  var question = "An efficiency upgrade costs " + money(C) + " and saves " + money(S) + " per year in energy costs. What is the simple payback period?";
  var solution = "Refer to Rate-of-Return Analysis in the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 236 (PDF page 242).\n\n" +
    "Simple payback ignores the time value of money:\n\n" +
    "$$\\text{Payback} = \\frac{" + C + "}{" + S + "} = " + yrs.toFixed(1) + "\\ \\text{years}$$";
  return {
    variantKey: "C" + C + "_S" + S,
    question: question,
    options: [
      { label: labels[0], num: yrs, correct: true },
      { label: labels[1], num: tP1, correct: false },
      { label: labels[2], num: tM1, correct: false },
      { label: labels[3], num: tInv, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-061
// Benefit-cost ratio of a public project.
def({ baseId: "econ-061", subtopic: "Benefit-cost ratio", difficulty: "medium",
  estimatedTimeSeconds: 135,
  explanation: "Annualize the capital cost first: B/C = B / (C(A/P) + O&M). Straight-lining the capital or dropping O&M both corrupt the denominator."
}, function () {
  var C = pick([1600000, 2400000, 3200000]);
  var OM = pick([40000, 60000, 90000]);
  var B = pick([300000, 400000, 520000]);
  var pct = pick([6, 8]); var i = pct / 100;
  var n = pick([20, 25]);
  var fAP = r4e(a_p(i, n));
  var capAnnual = Math.round(C * fAP);
  var denom = capAnnual + OM;
  var BC = Math.round(100 * B / denom) / 100;
  var tSL = Math.round(100 * B / (C / n + OM)) / 100;
  var tRecip = Math.round(100 * denom / B) / 100;
  var tNoOM = Math.round(100 * B / capAnnual) / 100;
  var question = "A public project has a capital cost of " + money(C) + ", annual operations and maintenance of " + money(OM) + ", and annual benefits of " + money(B) + ". With interest at " + pct + "% and a project life of " + n + " years, what is the benefit-cost ratio?";
  var solution = "Refer to Benefit-Cost Analysis in the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 237 (PDF page 243), and " + tblCite(pct).replace(/^Refer to /, "").replace(/\.$/, "") + ".\n\n" +
    "Annualize the capital cost with the capital recovery factor, then divide annual benefits by total annual costs.\n\n" +
    "$$\\begin{aligned}\\text{Annual cost} &= (" + money(C).slice(1) + ")(" + fAP.toFixed(4) + ") + " + money(OM).slice(1) + " \\\\ &= " + money(denom).slice(1) + " \\\\ B/C &= \\frac{" + B + "}{" + denom + "} = " + BC.toFixed(2) + "\\end{aligned}$$";
  return {
    variantKey: "C" + C + "_OM" + OM + "_B" + B + "_i" + pct + "_n" + n,
    question: question,
    options: [
      { label: BC.toFixed(2), num: BC, correct: true },
      { label: tSL.toFixed(2), num: tSL, correct: false },
      { label: tRecip.toFixed(2), num: tRecip, correct: false },
      { label: tNoOM.toFixed(2), num: tNoOM, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-062
// MACRS depreciation for a given recovery year.
def({ baseId: "econ-062", subtopic: "MACRS depreciation", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "MACRS reads the table percentage for the class and year. Straight-line, the year-1 rate, and the adjacent-year rate are the standard traps."
}, function () {
  var cls = pick([3, 5, 7]);
  var year = ri(2, cls + 1);                       // year 1 reserved as a trap
  var C = pick([60000, 80000, 100000]);
  var ratePct = MACRS_RATES[cls][year - 1];
  var D = Math.round(C * ratePct / 100);
  var tSL = Math.round(C / cls);
  var otherCls = cls === 7 ? 5 : 7;               // wrong-row trap: other class, same year
  var tY1 = Math.round(C * MACRS_RATES[otherCls][Math.min(year - 1, MACRS_RATES[otherCls].length - 1)] / 100);
  var adjIdx = year - 1;                            // adjacent-year trap with a REAL rate gap
  for (var probe = year; probe < MACRS_RATES[cls].length; probe++) {
    if (Math.abs(MACRS_RATES[cls][probe] - ratePct) >= 1.0) { adjIdx = probe; break; }
  }
  if (adjIdx === year - 1) {
    for (var probe2 = year - 2; probe2 >= 0; probe2--) {
      if (Math.abs(MACRS_RATES[cls][probe2] - ratePct) >= 1.0) { adjIdx = probe2; break; }
    }
  }
  var tAdj = Math.round(C * MACRS_RATES[cls][adjIdx] / 100);
  var labels = [D, tSL, tY1, tAdj].map(money);
  var question = "Equipment costing " + money(C) + " is placed in service as " + cls + "-year MACRS property. Using the MACRS percentages in the handbook (half-year convention), what is the depreciation deduction in year " + year + "?";
  var solution = "Refer to the MACRS table in the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 237 (PDF page 243).\n\n" +
    "The MACRS rate for " + cls + "-year property, year " + year + ", is " + ratePct.toFixed(2) + "%.\n\n" +
    "$$D_{" + year + "} = " + (ratePct / 100).toFixed(4) + " \\times " + money(C).slice(1) + " = " + mtex(D) + "$$";
  return {
    variantKey: "c" + cls + "_y" + year + "_C" + C,
    question: question,
    options: [
      { label: labels[0], num: D, correct: true },
      { label: labels[1], num: tSL, correct: false },
      { label: labels[2], num: tY1, correct: false },
      { label: labels[3], num: tAdj, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-063
// Corporate income tax with depreciation deduction.
def({ baseId: "econ-063", subtopic: "After-tax cash flow: income tax with depreciation", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Depreciation shields income before the rate is applied: T = t(GI - E - D). Taxing GI - E, taxing GI, or ADDING depreciation are the traps."
}, function () {
  var GI = pick([400000, 500000, 650000]);
  var E = pick([200000, 260000]);
  var D = pick([60000, 90000]);
  var t = pick([25, 30, 35]);
  var T = Math.round((GI - E - D) * t / 100);
  var tNoD = Math.round((GI - E) * t / 100);
  var tGross = Math.round(GI * t / 100);
  var tAdd = Math.round((GI - E + D) * t / 100);
  var question = "A firm has gross income of " + money(GI) + ", operating expenses of " + money(E) + ", and a depreciation deduction of " + money(D) + ". With an effective tax rate of " + t + "%, what is the firm's income tax?";
  var solution = "Refer to the Taxation subsection of the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 236 (PDF page 242).\n\n" +
    "Taxable income = gross income - operating expenses - depreciation.\n\n" +
    "$$\\begin{aligned}\\text{TI} &= " + GI + " - " + E + " - " + D + " = " + (GI - E - D) + " \\\\ T &= 0." + t + " \\times " + (GI - E - D) + " = " + mtex(T) + "\\end{aligned}$$";
  return {
    variantKey: "GI" + GI + "_E" + E + "_D" + D + "_t" + t,
    question: question,
    options: [
      { label: money(T), num: T, correct: true },
      { label: money(tNoD), num: tNoD, correct: false },
      { label: money(tGross), num: tGross, correct: false },
      { label: money(tAdd), num: tAdd, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-064
// Capitalized cost of perpetual service.
def({ baseId: "econ-064", subtopic: "Capitalized cost", difficulty: "hard",
  estimatedTimeSeconds: 120,
  explanation: "Capitalized cost = first cost + A/i (perpetuity). Stopping at A/i forgets the first cost; A*i inverts the division."
}, function () {
  var P = pick([80000, 100000, 150000]);
  var A = pick([10000, 12000, 15000]);
  var pct = pick([4, 5]);
  var CC = Math.round(P + A / (pct / 100));
  var tPerp = Math.round(A / (pct / 100));
  var tSmall = Math.round(P + A * pct / 100);
  var tMult = Math.round(P + A * 20);
  var question = "A structure has a first cost of " + money(P) + " and requires " + money(A) + " per year of maintenance forever. With interest at " + pct + "%, what is the capitalized cost of perpetual service?";
  var solution = "Refer to Capitalized Cost in the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 236 (PDF page 242).\n\n" +
    "The maintenance is a perpetuity, worth \\(A/i\\) today.\n\n" +
    "$$\\text{CC} = P + \\frac{A}{i} = " + money(P).slice(1) + " + \\frac{" + money(A).slice(1) + "}{0.0" + pct + "} = " + mtex(CC) + "$$";
  return {
    variantKey: "P" + P + "_A" + A + "_i" + pct,
    question: question,
    options: [
      { label: money(CC), num: CC, correct: true },
      { label: money(tPerp), num: tPerp, correct: false },
      { label: money(tSmall), num: tSmall, correct: false },
      { label: money(tMult), num: tMult, correct: false }
    ],
    solution: solution
  };
});

// ---------------------------------------------------------------- econ-066
// Expected monetary value of a decision.
def({ baseId: "econ-066", subtopic: "Expected monetary value", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "EMV weights EVERY outcome by its probability - including the loss. The unweighted average and the upside-only sum are the traps."
}, function () {
  var case_ = pick([
    { p1: 0.5, v1: 200, p2: 0.3, v2: 50, p3: 0.2, v3: -80 },   // bank base -> 99
    { p1: 0.4, v1: 300, p2: 0.4, v2: 100, p3: 0.2, v3: -50 },
    { p1: 0.6, v1: 150, p2: 0.3, v2: 60, p3: 0.1, v3: -120 }
  ]);
  var emv = Math.round(case_.p1 * case_.v1 + case_.p2 * case_.v2 + case_.p3 * case_.v3) * 1000;
  var tAvg = Math.round((case_.v1 + case_.v2 + case_.v3) / 3) * 1000;
  var tUpside = Math.round(case_.p1 * case_.v1 + case_.p2 * case_.v2) * 1000;
  var tBest = case_.v1 * 1000;
  var labels = [emv, tAvg, tUpside, tBest].map(money);
  var fmtp = function (p) { return (p * 100).toFixed(0) + "%"; };
  var question = "A project has three possible outcomes: a profit of " + money(case_.v1 * 1000) + " with probability " + fmtp(case_.p1) + ", a profit of " + money(case_.v2 * 1000) + " with probability " + fmtp(case_.p2) + ", or a loss of " + money(-case_.v3 * 1000).slice(1) + " with probability " + fmtp(case_.p3) + ". What is the expected monetary value of the project?";
  var solution = "Refer to Economic Decision Trees / Expected Value in the Engineering Economics section of the FE Reference Handbook (v10.6), printed page 237 (PDF page 243).\n\n" +
    "$$\\begin{aligned}\\text{EMV} &= (" + case_.p1 + ")(" + case_.v1 + "\\text{k}) + (" + case_.p2 + ")(" + case_.v2 + "\\text{k}) + (" + case_.p3 + ")(" + case_.v3 + "\\text{k}) \\\\ &= " + (case_.p1 * case_.v1).toFixed(0) + "\\text{k} + " + (case_.p2 * case_.v2).toFixed(0) + "\\text{k} - " + Math.abs(case_.p3 * case_.v3).toFixed(0) + "\\text{k} = " + mtex(emv) + "\\end{aligned}$$";
  return {
    variantKey: "c" + case_.v1 + "_" + Math.round(case_.p1 * 100),
    question: question,
    options: [
      { label: labels[0], num: emv, correct: true },
      { label: labels[1], num: tAvg, correct: false },
      { label: labels[2], num: tUpside, correct: false },
      { label: labels[3], num: tBest, correct: false }
    ],
    solution: solution
  };
});

  window.ECON_GENERATORS = ECON_GENERATORS;
})();
