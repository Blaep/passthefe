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
  return {
    variantKey: "a" + A + "_g" + G + "_i" + pct + "_n" + n,
    question: "Annual maintenance costs are " + money(A) + " in year 1, increasing by " + money(G) + " each year through year " + n + ". At " + pct + "% annual interest, what is the present worth of these costs?",
    options: [
      { label: money(P), num: P, correct: true },
      { label: money(baseOnly), num: baseOnly },
      { label: money(noTVM), num: noTVM },
      { label: money(gradAsAnnuity), num: gradAsAnnuity }
    ],
    solution: solution
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
  return {
    variantKey: "c" + init + "_r" + R + "_k" + k + "_i" + pct,
    question: "A bridge requires a " + money(init) + " initial investment plus " + money(R) + " of major rehabilitation every " + k + " years, forever. At " + pct + "% annual interest, what is the capitalized cost?",
    options: [
      { label: money(CC), num: CC, correct: true },
      { label: money(asAnnual), num: asAnnual },
      { label: money(noTVM), num: noTVM },
      { label: money(noCap), num: noCap }
    ],
    solution: solution
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
  var P = 12000, iPct = 10, A = 4000, nfrac = 0, ok = false;
  for (var t = 0; t < 300 && !ok; t++) {
    P = ri(8, 30) * 1000;
    iPct = ri(5, 12);
    A = ri(3, 12) * 1000;
    var ii = iPct / 100;
    if (A <= P * ii * 1.15) continue; // must actually recover the investment
    nfrac = -Math.log(1 - P * ii / A) / Math.log(1 + ii);
    var nums017 = [nfrac, P / A, Math.ceil(nfrac), Math.floor(nfrac) + 0.5];
    ok = nfrac > 2.2 && nfrac < 6.5 && P / A >= 2.0;
    for (var q1 = 0; q1 < 4 && ok; q1++)
      for (var q2 = q1 + 1; q2 < 4 && ok; q2++)
        if (Math.abs(nums017[q1] - nums017[q2]) < 0.06) ok = false;
  }
  var i = iPct / 100;
  var oneP = (1 + i).toFixed(2);
  var k = Math.ceil(nfrac), cum = 0, cumPrev = 0, discK = 0;
  var rows = [];
  for (var yr = 1; yr <= k; yr++) {
    var d = A / Math.pow(1 + i, yr);
    cumPrev = cum; cum += d;
    if (yr === k) discK = d;
    var div = yr === 1 ? oneP : "(" + oneP + ")^" + yr;
    rows.push("\\text{Year " + yr + ":} &\\quad " + fmt(A) + "/" + div +
      " = " + mtex(d) + " \\quad (\\text{cum } " + mtex(cum) + ")");
  }
  var frac = nfrac - (k - 1);
  var solution =
    "Refer to the Engineering Economics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the discounted payback period: the time until the cumulative discounted cash inflows recover the initial investment:\n\n" +
    "$$\\sum_{t=1}^{n}\\frac{A}{(1+i)^t} \\geq P$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(n\\):\n\n" +
    "$$\\begin{aligned}\nP &= " + mtex(P) + " \\\\\nA &= " + mtex(A) + "/\\text{yr} \\\\\ni &= " + iPct + "\\% = " + texNum(i) + " \\\\\nn &= ?\n\\end{aligned}$$\n\n" +
    "Accumulate the discounted inflows:\n\n" +
    "$$\\begin{aligned}\n" + rows.join(" \\\\\n") + "\n\\end{aligned}$$\n\n" +
    "The investment is recovered during year " + k + ":\n\n" +
    "$$n = " + (k - 1) + " + \\frac{" + fmt(P - cumPrev) + "}{" + fmt(discK) + "} = " + (k - 1) + " + " + frac.toFixed(2) + "$$\n\n" +
    "$$n = " + nfrac.toFixed(2) + "\\ \\text{years}$$";
  var simple = P / A;
  return {
    variantKey: "P" + P + "_A" + A + "_i" + iPct,
    question: "A project requires an initial investment of " + money(P) + " and generates " + money(A) + " per year. At " + iPct + "% annual interest, what is the discounted payback period?",
    options: [
      { label: nfrac.toFixed(2) + " years", num: +nfrac.toFixed(2), correct: true },
      { label: simple.toFixed(2) + " years", num: +simple.toFixed(2) },  // simple (undiscounted) payback
      { label: k + " years", num: k },                                    // rounds up to the full year
      { label: (Math.floor(nfrac) + 0.5).toFixed(2) + " years", num: Math.floor(nfrac) + 0.5 } // mid-year guess
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
  return {
    variantKey: "face" + face + "_c" + cP + "_i" + iP + "_n" + n,
    question: "A " + n + "-year bond with a " + money(face) + " face value pays " + cP + "% annual coupons at each year end. If the market interest rate is " + iP + "% per year, what is the bond's value?",
    options: [
      { label: money(vAns), num: vAns, correct: true },
      { label: money(cOnly), num: cOnly },       // coupon stream only, forgets face
      { label: money(face), num: face },         // face value at par
      { label: money(faceUnd), num: faceUnd }    // face added undiscounted
    ],
    solution: solution
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
  return {
    variantKey: "A" + A + "_n" + n + "_k" + k + "_i" + iP,
    question: "A machine upgrade will save " + money(A) + " per year for " + n + " years, with the first savings occurring at the end of year " + (k + 1) + " (the series is deferred " + k + " years). At " + iP + "% annual interest, what is the present worth of the savings?",
    options: [
      { label: money(ans), num: ans, correct: true },
      { label: money(Math.round(A * pa)), num: Math.round(A * pa) },                       // forgets the deferral
      { label: money(Math.round(A * pa * p_f(i, k - 1))), num: Math.round(A * pa * p_f(i, k - 1)) }, // one year too few
      { label: money(Math.round(A * pa * p_f(i, k + 1))), num: Math.round(A * pa * p_f(i, k + 1)) }  // one year too many
    ],
    solution: solution
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

  window.ECON_GENERATORS = ECON_GENERATORS;
})();
