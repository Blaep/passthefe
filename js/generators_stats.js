/* PassTheFE "infinite questions" pilot — Statistics and Probability generator templates.
 *
 * Plain script (no modules) for the static site. Defines window.STATS_GENERATORS:
 * one entry per NUMERICAL Statistics and Probability bank question (stats-014
 * carries a normal-curve diagram that cannot be cleanly parameterized, and
 * stats-033 is purely conceptual — both are skipped, the same rationale as
 * math-020 in the Mathematics pilot and econ-015/016 in the Economics pilot).
 *
 * LaTeX convention: NATURAL single-backslash LaTeX. In the JS string literals
 * below that means "\\(" for \(, "\\frac" for \frac, "\\$" for \$, and
 * "\\\\" for the "\\" row break inside aligned environments. NEVER write a
 * doubled backslash before (, ), or an ASCII letter.
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

  // Wraps a roll() function with the app-integration contract. roll() returns
  // { variantKey, question, options: [{label, num|null, correct}], solution }.
  // The wrapper shuffles the options, enforces pairwise-distinct labels (and
  // pairwise-distinct numeric values where present) with a retry loop, and
  // returns the contracted generate() payload.
  function buildGenerator(meta, roll) {
    return {
      baseId: meta.baseId,
      topic: "Statistics and Probability",
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
            topic: "Statistics and Probability",
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

  // Bell-curve setup diagram for the normal tail-area questions (stats-004,
  // stats-011): draws the curve from the rolled (mu, sigma) and shades the
  // tail the question asks about. Setup only — the threshold and mean are
  // given in the question text; the shaded area's numeric value is never
  // drawn.
  function normalTailDiagram(mu, sig, x, above, unit) {
    var xMin = mu - 3.25 * sig, xMax = mu + 3.25 * sig;
    var px = function (v) { return 60 + (v - xMin) / (xMax - xMin) * 520; };
    var g = function (v) { var t = (v - mu) / sig; return Math.exp(-t * t / 2); };
    var py = function (v) { return 250 - 190 * g(v); };
    var s = SVG_HDR;
    // Shaded tail: the region the question asks about.
    var edge = above ? xMax : xMin, pts = "", i, v;
    for (i = 0; i <= 120; i++) {
      v = above ? x + (edge - x) * i / 120 : edge + (x - edge) * i / 120;
      pts += " " + px(v).toFixed(1) + "," + py(v).toFixed(1);
    }
    s += '<polygon points="' + px(x).toFixed(1) + ",250" + pts + " " + px(edge).toFixed(1) + ',250" fill="#bfdbfe" fill-opacity="0.65"/>';
    // Bell curve.
    var d = "M " + px(xMin).toFixed(1) + " " + py(xMin).toFixed(1);
    for (i = 0; i <= 160; i++) {
      v = xMin + (xMax - xMin) * i / 160;
      d += " L " + px(v).toFixed(1) + " " + py(v).toFixed(1);
    }
    s += '<path d="' + d + '" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>';
    // Axis.
    s += '<line x1="40" y1="250" x2="620" y2="250" stroke="#1a1a1a" stroke-width="1.5"/>';
    // Mean tick + label.
    s += '<line x1="' + px(mu).toFixed(1) + '" y1="244" x2="' + px(mu).toFixed(1) + '" y2="256" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<text x="' + (px(mu) - 7).toFixed(0) + '" y="276" font-family="Georgia,serif" font-size="18" fill="#1a1a1a">μ</text>';
    // Threshold tick + label (both come from the rolled question values).
    s += '<line x1="' + px(x).toFixed(1) + '" y1="244" x2="' + px(x).toFixed(1) + '" y2="256" stroke="#1d4ed8" stroke-width="2"/>';
    s += '<text x="' + (px(x) - 30).toFixed(0) + '" y="276" font-family="Georgia,serif" font-size="16" fill="#1d4ed8">' + fmt(x) + " " + unit + "</text>";
    return svgURL(s + SVG_FTR);
  }

  // ---- statistics helpers ----

  function fact(n) {
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  }
  function nCr(n, r) {
    if (r < 0 || r > n) return 0;
    r = Math.min(r, n - r);
    var num = 1, den = 1;
    for (var i = 1; i <= r; i++) { num *= (n - r + i); den *= i; }
    return Math.round(num / den);
  }
  function nPr(n, r) {
    if (r < 0 || r > n) return 0;
    var p = 1;
    for (var i = 0; i < r; i++) p *= (n - i);
    return p;
  }
  // Binomial PMF: P(X = k).
  function binomPMF(n, k, p) {
    return nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }
  // Binomial CDF: P(X <= k).
  function binomCDF(n, k, p) {
    var s = 0;
    for (var i = 0; i <= k; i++) s += binomPMF(n, i, p);
    return s;
  }
  // Poisson PMF: P(X = k) with mean lam.
  function poisPMF(lam, k) {
    return Math.exp(-lam) * Math.pow(lam, k) / fact(k);
  }
  // Error function (Abramowitz & Stegun 7.1.26), |eps| <= 1.5e-7.
  function erf(x) {
    var s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  // Standard normal CDF Phi(z).
  function phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  // Sample mean of an array.
  function mean(a) {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i];
    return s / a.length;
  }
  // Population variance (divide by n) or sample variance (divide by n-1).
  function variance(a, sample) {
    var m = mean(a), s = 0;
    for (var i = 0; i < a.length; i++) s += Math.pow(a[i] - m, 2);
    return s / (a.length - (sample ? 1 : 0));
  }
  // Median of a numeric array (does not mutate).
  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    var n = s.length, h = Math.floor(n / 2);
    return n % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
  }

  // ---- generator entries (PART_A / PART_B / PART_C fragments concatenate here) ----

  var PART = [];
/* PassTheFE "infinite questions" pilot — Statistics and Probability generators, Workstream A (stats-001..stats-011).
 *
 * FRAGMENT, not standalone. The assembler prepends stats_scaffold_head.js (IIFE,
 * helpers, buildGenerator, PART) and appends the tail that sets window.STATS_GENERATORS.
 * All helper names below are scoped inside each roll() closure to avoid collisions
 * with the other workstream fragments.
 *
 * LaTeX convention (file bytes): "\\(" for \(, "\\frac" for \frac, "\\%" for \%,
 * "\\$" for \$, "\\\\\\n" for the "\\" row break + newline inside aligned.
 */

// ---------------------------------------------------------------- stats-001
// Independent events: P(A and B) = P(A)*P(B). p,q tenths with p!=q; the
// p==3q / q==3p pairs are excluded (there |p-q| would equal (p+q)/2).
PART.push(buildGenerator({ baseId: "stats-001", subtopic: "Independent events", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "'And' means multiply (for independent events); 'or' means add (minus the overlap). Confirming independence is the step most people skip.",
  videoUrl: "https://www.youtube.com/watch?v=SkidyDQuupA",
  videoTitle: "Introduction to Probability, Basic Overview - Sample Space, & Tree Diagrams"
}, function () {
  var pi, qi;
  do { pi = ri(1, 9); qi = ri(1, 9); } while (pi === qi || pi === 3 * qi || qi === 3 * pi);
  var p = pi / 10, q = qi / 10;
  var ans = p * q;
  var dAdd = p + q;              // "or" instead of "and"
  var dDiff = Math.abs(p - q);   // subtraction slip
  var dAvg = (p + q) / 2;        // averaging slip
  var solution =
    "Refer to the Laws of Probability section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (pp. 65-66).\n\n" +
    "Ultimately, we must solve for \\(P(A \\text{ and } B)\\). For independent events:\n\n" +
    "$$P(A \\cap B) = P(A) \\cdot P(B)$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(P(A \\cap B)\\):\n\n" +
    "$$\\begin{aligned}\nP(A) &= " + fmt(p) + " \\\\\nP(B) &= " + fmt(q) + " \\\\\nP(A \\cap B) &= ?\n\\end{aligned}$$\n\n" +
    "$$(P) = (" + fmt(p) + ")(" + fmt(q) + ")$$\n\n" +
    "$$(P) = " + fmt(ans) + "$$";
  return {
    variantKey: "p" + pi + "_q" + qi,
    question: "Events A and B are independent. If P(A) = " + fmt(p) + " and P(B) = " + fmt(q) + ", what is P(A and B)?",
    options: [
      { label: fmt(ans), num: ans, correct: true },
      { label: fmt(dAdd), num: dAdd },
      { label: fmt(dDiff), num: dDiff },
      { label: fmt(dAvg), num: dAvg }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-002
// Median of a 6-value integer dataset. Middle pair (a,b), a<b; outer values
// placed strictly outside so the sorted middle pair is always (a,b).
PART.push(buildGenerator({ baseId: "stats-002", subtopic: "Mean, median, and mode", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Concrete strength acceptance is judged on statistics, not single tests. Students often grab the mean (8.8) or the mode (7) instead of the median - for even-n datasets, the median is the average of the two middle values.",
  videoUrl: "https://www.youtube.com/watch?v=Yw2ky0IocfA",
  videoTitle: "Statistics Basics: Mean, Median, Mode, Range & Standard Deviation Explained!"
}, function () {
  var a = ri(6, 12), gap = ri(1, 3), b = a + gap;
  var l1 = a - ri(2, 4), l2 = a - ri(1, 2);
  var u1 = b + ri(1, 2), u2 = b + ri(2, 4);
  var data = [l1, l2, a, b, u1, u2]; // already sorted: l1<l2<a<b<u1<u2
  var med = (a + b) / 2;
  var mn = mean(data);              // mean trap
  var solution =
    "Refer to the Dispersion, Mean, Median, and Mode Values section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the median. With an even number of observations, the median is the average of the two middle values:\n\n" +
    "$$\\text{median} = \\frac{x_{(n/2)} + x_{(n/2+1)}}{2}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\nn &= 6 \\\\\nx_{(3)} &= " + a + "\\ \\text{MPa} \\\\\nx_{(4)} &= " + b + "\\ \\text{MPa} \\\\\n\\text{median} &= ?\n\\end{aligned}$$\n\n" +
    "$$(\\text{median}) = \\frac{" + a + " + " + b + "}{2}$$\n\n" +
    "$$(\\text{median}) = " + fmt(med) + "\\ \\text{MPa}$$";
  return {
    variantKey: "d" + data.join("_"),
    question: "The measured strengths (in MPa) of six concrete test cylinders are: " + data.join(", ") + ". What is the median of this dataset?",
    options: [
      { label: fmt(med), num: med, correct: true },
      { label: fmt(mn), num: mn },
      { label: fmt(a), num: a },   // lower middle only
      { label: fmt(b), num: b }    // upper middle only
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-003
// Binomial P(X = k). k capped at 3 so every distractor stays a clean decimal.
PART.push(buildGenerator({ baseId: "stats-003", subtopic: "Binomial probability", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Binomial models count successes in fixed trials - bids won, welds passing inspection, etc. The most common error is forgetting the combinatorial coefficient C(n,k); without it you get 0.002, which badly underestimates the probability.",
  videoUrl: "https://www.youtube.com/watch?v=3PWKQiLK41M",
  videoTitle: "Finding The Probability of a Binomial Distribution Plus Mean & Standard Deviation"
}, function () {
  function f6(x) { return x.toFixed(6).replace(/0+$/, "").replace(/\.$/, ""); }
  function f4(x) { return x.toFixed(4).replace(/0+$/, "").replace(/\.$/, ""); }
  var n = ri(5, 10);
  var p = pick([0.2, 0.25, 0.3, 0.4, 0.5]);
  var k = ri(1, 3);
  var q = 1 - p;
  var coeff = nCr(n, k);
  var pmf = binomPMF(n, k, p);
  var dNoC = Math.pow(p, k);                        // forgot C(n,k)
  var dNoC2 = Math.pow(p, k) * Math.pow(q, n - k);  // forgot it entirely
  var dComp = 1 - pmf;                              // complement
  var pct = Math.round(p * 100);
  var solution =
    "Refer to the Binomial Distribution section in the Engineering Probability and Statistics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(P(X = " + k + ")\\). Each bid is an independent trial with the same success probability, so the count of acceptances is binomial:\n\n" +
    "$$P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(P(X = " + k + ")\\):\n\n" +
    "$$\\begin{aligned}\nn &= " + n + " \\\\\np &= " + fmt(p) + " \\\\\nk &= " + k + " \\\\\nP(X = " + k + ") &= ?\n\\end{aligned}$$\n\n" +
    "$$(P) = \\binom{" + n + "}{" + k + "}(" + fmt(p) + ")^" + k + "(" + fmt(q) + ")^" + (n - k) + " \\rightarrow (P) = (" + coeff + ")(" + f4(dNoC) + ")(" + f6(Math.pow(q, n - k)) + ")$$\n\n" +
    "$$(P) = " + f4(pmf) + " \\approx " + fmt(pmf) + "$$";
  return {
    variantKey: "n" + n + "_p" + pct + "_k" + k,
    question: "A construction firm estimates each bid it submits has a " + pct + "% chance of being accepted, independently of other bids. If it submits " + n + " bids, what is the probability that exactly " + k + " are accepted?",
    options: [
      { label: fmt(pmf), num: pmf, correct: true },
      { label: fmt(dNoC), num: dNoC },
      { label: fmt(dNoC2), num: dNoC2 },
      { label: fmt(dComp), num: dComp }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-004
// Normal tail area: percent of samples beyond z sd from the mean (z = 1, 2),
// above or below.
PART.push(buildGenerator({ baseId: "stats-004", subtopic: "Normal distribution and z-scores", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "The normal distribution is the workhorse for quality control and reliability. Mixing up the tail area (15.9%) with the area between the mean and z = 1 (34.1%) is the classic mistake.",
  videoUrl: "https://www.youtube.com/watch?v=3be6mzCYMRs",
  videoTitle: "Statistics 6.3 – Finding Probability Using a Normal Distribution"
}, function () {
  function pct1(v) { return Math.round(v * 1000) / 10; } // percent, 1 decimal
  var mu = pick([50, 100, 200]);
  var sig = pick([5, 10, 15, 20]);
  var z = pick([1, 2]);
  var above = pick([true, false]);
  var x = above ? mu + z * sig : mu - z * sig;
  var tail = 1 - phi(z);
  var ans = pct1(tail);
  var dBetween = pct1(phi(z) - 0.5);       // area between mean and z
  var dWithin = pct1(2 * (phi(z) - 0.5));  // area within +/-z
  var dCum = pct1(phi(z));                 // cumulative area below z
  var zSigned = above ? z : -z;
  var zWord = z === 1 ? "one standard deviation" : "two standard deviations";
  var tailLine = above
    ? "The area beyond \\(z = " + z + "\\) (" + zWord + " above the mean) is \\(1 - \\Phi(" + z + ") = 1 - " + fmt(phi(z)) + " = " + fmt(tail) + "\\):"
    : "The area below \\(z = " + zSigned + "\\) (" + zWord + " below the mean) is \\(\\Phi(" + zSigned + ") = 1 - \\Phi(" + z + ") = 1 - " + fmt(phi(z)) + " = " + fmt(tail) + "\\):";
  var solution =
    "Refer to the Normal Distribution (Gaussian Distribution) section in the Engineering Probability and Statistics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must find the percentage of samples " + (above ? "exceeding " : "falling below ") + fmt(x) + " MPa. Standardize with the z-score:\n\n" +
    "$$z = \\frac{x - \\mu}{\\sigma}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(z\\):\n\n" +
    "$$\\begin{aligned}\n\\mu &= " + mu + "\\ \\text{MPa} \\\\\n\\sigma &= " + sig + "\\ \\text{MPa} \\\\\nx &= " + fmt(x) + "\\ \\text{MPa} \\\\\nz &= ?\n\\end{aligned}$$\n\n" +
    "$$(z) = \\frac{" + fmt(x) + " - " + mu + "}{" + sig + "} = " + zSigned + "$$\n\n" +
    tailLine + "\n\n" +
    "$$P(x " + (above ? ">" : "<") + " " + fmt(x) + ") \\approx " + fmt(ans) + "\\%$$";
  // Setup diagram (never the answer): bell curve with the asked-about tail shaded.
  var d004 = normalTailDiagram(mu, sig, x, above, "MPa");
  return {
    variantKey: "mu" + mu + "_sig" + sig + "_z" + z + "_" + (above ? "above" : "below"),
    diagram: d004,
    question: "Compressive test results for a concrete mix are normally distributed with a mean of " + mu + " MPa and a standard deviation of " + sig + " MPa. Approximately what percentage of samples " + (above ? "exceed " : "fall below ") + fmt(x) + " MPa?",
    options: [
      { label: fmt(ans) + "%", num: ans, correct: true },
      { label: fmt(dBetween) + "%", num: dBetween },
      { label: fmt(dWithin) + "%", num: dWithin },
      { label: fmt(dCum) + "%", num: dCum }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-005
// Bayes' theorem: P(crack | positive) from sensitivity, specificity, prevalence.
// The (se=0.95, sp=0.95, pr=0.05) combo is excluded: posterior is exactly 50%,
// which would collide with the prevalence distractor every roll.
PART.push(buildGenerator({ baseId: "stats-005", subtopic: "Bayes' theorem", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "This is the base-rate fallacy in action: even an excellent test yields mostly false positives when the condition is rare. Engineers making inspection decisions must account for the prior - a positive result here still means only about 1 in 6 members is truly cracked.",
  videoUrl: "https://www.youtube.com/watch?v=MF-7vWNNmAA",
  videoTitle: "3 Word Problems to Master the Bayes' Theorem"
}, function () {
  function f4(x) { return x.toFixed(4).replace(/0+$/, "").replace(/\.$/, ""); }
  function pct1(v) { return Math.round(v * 1000) / 10; } // percent, 1 decimal
  var se, sp, pr;
  do {
    se = pick([0.95, 0.98, 0.99]);
    sp = pick([0.90, 0.95]);
    pr = pick([0.01, 0.02, 0.05]);
  } while (sp === 0.95 && pr === 0.05);
  var fpr = 1 - sp; // P(positive | no crack)
  var num1 = se * pr, num2 = fpr * (1 - pr);
  var den = num1 + num2;
  var post = num1 / den;
  var ans = pct1(post);
  var dSens = pct1(se);   // sensitivity itself
  var dFpr = pct1(fpr);   // false-positive rate
  var dPrev = pct1(pr);   // base rate
  var solution =
    "Refer to Bayes' Theorem in the Engineering Probability and Statistics chapter of the FE Reference Handbook (p. 66).\n\n" +
    "Ultimately, we must solve for \\(P(\\text{crack} \\mid \\text{positive})\\):\n\n" +
    "$$P(A \\mid B) = \\frac{P(B \\mid A)P(A)}{P(B)}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\nP(\\text{positive} \\mid \\text{crack}) &= " + fmt(se) + " \\\\\nP(\\text{positive} \\mid \\text{no crack}) &= 1 - " + fmt(sp) + " = " + fmt(fpr) + " \\\\\nP(\\text{crack}) &= " + fmt(pr) + " \\\\\nP(\\text{crack} \\mid \\text{positive}) &= ?\n\\end{aligned}$$\n\n" +
    "Expand the denominator by the law of total probability:\n\n" +
    "$$(P(\\text{positive})) = (" + fmt(se) + ")(" + fmt(pr) + ") + (" + fmt(fpr) + ")(" + fmt(1 - pr) + ") \\rightarrow (P(\\text{positive})) = " + f4(num1) + " + " + f4(num2) + " = " + f4(den) + "$$\n\n" +
    "$$(P(\\text{crack} \\mid \\text{positive})) = \\frac{" + f4(num1) + "}{" + f4(den) + "} = " + f4(post) + " \\approx " + fmt(ans) + "\\%$$";
  return {
    variantKey: "se" + Math.round(se * 100) + "_sp" + Math.round(sp * 100) + "_pr" + Math.round(pr * 100),
    question: "A bridge inspection test detects cracks with " + Math.round(se * 100) + "% sensitivity (P(positive | crack) = " + fmt(se) + ") and " + Math.round(sp * 100) + "% specificity (P(negative | no crack) = " + fmt(sp) + "). If " + Math.round(pr * 100) + "% of inspected members actually have cracks, what is the probability a member has a crack given a positive test result?",
    options: [
      { label: fmt(ans) + "%", num: ans, correct: true },
      { label: fmt(dSens) + "%", num: dSens },
      { label: fmt(dFpr) + "%", num: dFpr },
      { label: fmt(dPrev) + "%", num: dPrev }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-006
// Population SD of a symmetric 6-value dataset: three (m-d), three (m+d).
// SS = 6d^2, variance = d^2, so sigma = d exactly.
PART.push(buildGenerator({ baseId: "stats-006", subtopic: "Standard deviation", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Know whether a problem wants population (divide by n) or sample (divide by n - 1) statistics - here 2.14 is the sample standard deviation, a designed distractor. Also, 4 is the variance, not the standard deviation.",
  videoUrl: "https://www.youtube.com/watch?v=Yw2ky0IocfA",
  videoTitle: "Statistics Basics: Mean, Median, Mode, Range & Standard Deviation Explained!"
}, function () {
  var m = ri(10, 30), d = pick([2, 3, 4]);
  var data = shuffle([m - d, m - d, m - d, m + d, m + d, m + d]);
  var ans = d;
  var dVar = d * d;                 // variance, not SD
  var dSamp = d * Math.sqrt(6 / 5); // sample SD (divide by n-1)
  var dSampVar = 1.2 * d * d;       // sample variance
  var ss = 6 * d * d;
  var solution =
    "Refer to the Dispersion, Mean, Median, and Mode Values section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the population standard deviation (divide by \\(n\\), not \\(n - 1\\)):\n\n" +
    "$$\\sigma = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\mu)^2}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\nn &= 6 \\\\\n\\mu &= \\frac{" + (6 * m) + "}{6} = " + m + "\\ \\text{cm} \\\\\n\\sigma &= ?\n\\end{aligned}$$\n\n" +
    "$$(\\sigma) = \\sqrt{\\frac{3(" + d + ")^2 + 3(" + d + ")^2}{6}} = \\sqrt{\\frac{" + ss + "}{6}} = \\sqrt{" + dVar + "}$$\n\n" +
    "$$(\\sigma) = " + d + "\\ \\text{cm}$$";
  return {
    variantKey: "m" + m + "_d" + d,
    question: "The daily rainfall totals (in cm) recorded over 6 days are: " + data.join(", ") + ". What is the population standard deviation of this dataset?",
    options: [
      { label: fmt(ans), num: ans, correct: true },
      { label: fmt(dVar), num: dVar },
      { label: fmt(dSamp), num: dSamp },
      { label: fmt(dSampVar), num: dSampVar }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-007
// Lower bound of the 95% CI for the mean: xbar - z*s/sqrt(n).
// n is a perfect square and sigma a multiple of sqrt(n), so SE is integral.
PART.push(buildGenerator({ baseId: "stats-007", subtopic: "Confidence intervals", difficulty: "hard",
  estimatedTimeSeconds: 120,
  explanation: "Confidence intervals quantify uncertainty in field measurements like compaction. The two classic slips are using n instead of sqrt(n) in the standard error, or rounding z to 2 and then mismatching the stated precision.",
  videoUrl: "https://www.youtube.com/watch?v=9GtaIHFuEZU",
  videoTitle: "Statistics 101: Confidence Interval Estimation, Sigma Known"
}, function () {
  function trim2(x) { return x.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""); }
  var n = pick([16, 25, 36, 49, 64, 100]);
  var sq = Math.sqrt(n);
  var se = ri(1, 5);
  var sig = se * sq;
  var xbar = pick([40, 50, 60, 80, 100]);
  var z = pick([1.96, 2]);
  var zStr = z === 1.96 ? "1.96" : "2";
  var margin = z * se;
  var lower = xbar - margin;
  var upper = xbar + margin;   // upper bound trap
  var dNoSqrt = xbar - z * sig; // forgot sqrt(n)
  var dSigOnly = xbar - sig;    // forgot z and sqrt(n)
  var solution =
    "Refer to the Confidence Intervals section in the Engineering Probability and Statistics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the lower bound of the 95% confidence interval for the true mean:\n\n" +
    "$$\\bar{x} \\pm z\\frac{s}{\\sqrt{n}}$$\n\n" +
    "List the known and unknown parameters in order to solve for the lower bound:\n\n" +
    "$$\\begin{aligned}\n\\bar{x} &= " + xbar + "\\ \\text{pcf} \\\\\ns &= " + sig + "\\ \\text{pcf} \\\\\nn &= " + n + " \\\\\nz &= " + zStr + "\\ \\text{(95\\% confidence)} \\\\\n\\text{lower bound} &= ?\n\\end{aligned}$$\n\n" +
    "Standard error: \\(s/\\sqrt{n} = " + sig + "/" + sq + " = " + se + "\\). Margin: \\(" + zStr + " \\times " + se + " = " + trim2(margin) + "\\).\n\n" +
    "$$(\\text{lower bound}) = " + xbar + " - " + trim2(margin) + " = " + trim2(lower) + " \\approx " + lower.toFixed(1) + "\\ \\text{pcf}$$";
  return {
    variantKey: "n" + n + "_x" + xbar + "_s" + sig + "_z" + (z === 1.96 ? "196" : "2"),
    question: "A sample of " + n + " soil compaction tests has a mean dry density of " + xbar + " pcf and a standard deviation of " + sig + " pcf. What is the lower bound of the 95% confidence interval for the true mean dry density? (Use z = " + zStr + ".)",
    options: [
      { label: lower.toFixed(1), num: lower, correct: true },
      { label: upper.toFixed(1), num: upper },
      { label: dSigOnly.toFixed(1), num: dSigOnly },
      { label: dNoSqrt.toFixed(1), num: dNoSqrt }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-008
// P(both red) without replacement: C(R,2)/C(R+B,2).
// Guarded: R==B+1 makes P(exactly one red) equal R/N; R==2B+1 makes it equal
// the answer - both would exhaust the wrapper's retry loop.
PART.push(buildGenerator({ baseId: "stats-008", subtopic: "Conditional probability without replacement", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "Sampling without replacement (grab samples, inspection lots) changes the denominator on each draw. The distractor 0.391 comes from treating the draws as independent, i.e., (5/8)^2 - with replacement, which is the wrong model here.",
  videoUrl: "https://www.youtube.com/watch?v=SkidyDQuupA",
  videoTitle: "Introduction to Probability, Basic Overview - Sample Space, & Tree Diagrams"
}, function () {
  var R, B;
  do { R = ri(3, 8); B = ri(2, 6); } while (R === B + 1 || R === 2 * B + 1);
  var N = R + B;
  var ans = (R * (R - 1)) / (N * (N - 1));
  var dWith = Math.pow(R / N, 2);                 // with replacement
  var dOne = R / N;                               // first draw only
  var dExactlyOne = (2 * R * B) / (N * (N - 1));  // exactly one red
  var solution =
    "Refer to the Laws of Probability section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (pp. 65-66).\n\n" +
    "Ultimately, we must solve for \\(P(\\text{both red})\\). Sampling is without replacement, so the denominator changes on the second draw:\n\n" +
    "$$P = P(\\text{1st red}) \\cdot P(\\text{2nd red} \\mid \\text{1st red})$$\n\n" +
    "List the known parameters:\n\n" +
    "$$\\begin{aligned}\n\\text{Red tags} &= " + R + " \\\\\n\\text{Blue tags} &= " + B + " \\\\\n\\text{Total tags} &= " + N + "\n\\end{aligned}$$\n\n" +
    "After drawing one red tag, " + (R - 1) + " red and " + B + " blue remain out of " + (N - 1) + " total:\n\n" +
    "$$(P) = \\left(\\frac{" + R + "}{" + N + "}\\right)\\left(\\frac{" + (R - 1) + "}{" + (N - 1) + "}\\right) = \\frac{" + (R * (R - 1)) + "}{" + (N * (N - 1)) + "}$$\n\n" +
    "$$(P) = " + fmt(ans) + "$$";
  return {
    variantKey: "r" + R + "_b" + B,
    question: "A grab bag contains " + R + " red and " + B + " blue soil sample tags. Two tags are drawn at random without replacement. What is the probability that both are red?",
    options: [
      { label: fmt(ans), num: ans, correct: true },
      { label: fmt(dWith), num: dWith },
      { label: fmt(dOne), num: dOne },
      { label: fmt(dExactlyOne), num: dExactlyOne }
    ],
    solution: solution,
    tiTip: "Yes — direct solve: tap the probability key 2× to reach nCr (! → nCr), then enter " + R + " nCr 2 ÷ " + N + " nCr 2."
  };
}));

// ---------------------------------------------------------------- stats-009
// Expected net gain: E = w*p - c. Can be negative (U+2212 MINUS in labels,
// ASCII hyphen inside LaTeX). A pairwise-collision guard re-rolls the params.
PART.push(buildGenerator({ baseId: "stats-009", subtopic: "Expected value", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Expected value of a gamble must subtract what you paid to play — $3.00 is the expected payout, not the net gain.",
  videoUrl: "https://www.youtube.com/watch?v=rCcY3fdTwgo",
  videoTitle: "Expected Value & Variance (Discrete Random Variables)"
}, function () {
  function money2(x) {
    var neg = x < -1e-9;
    return (neg ? MINUS + "$" : "$") + Math.abs(x).toFixed(2);
  }
  function mtex(x) {
    return (x < -1e-9 ? "-\\$" : "\\$") + Math.abs(x).toFixed(2);
  }
  var c, w, p, E, dPay, dDiff, dFlip, bad;
  do {
    c = pick([1, 2, 3, 5]);
    w = pick([5, 10, 20, 25, 50]);
    p = pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5]);
    E = w * p - c;      // expected net gain
    dPay = w * p;       // expected payout, forgot the cost
    dDiff = w - c;      // payout minus cost, ignored the probability
    dFlip = c - w * p;  // cost minus expected payout (sign flip)
    var vs = [E, dPay, dDiff, dFlip];
    bad = false;
    for (var i = 0; i < 4 && !bad; i++)
      for (var j = i + 1; j < 4 && !bad; j++)
        if (Math.abs(vs[i] - vs[j]) < 1e-9) bad = true;
  } while (bad);
  var solution =
    "Refer to the Expected Values section in the Engineering Probability and Statistics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the expected net gain \\(E\\). Subtract the ticket cost from the expected payout:\n\n" +
    "$$E = \\sum p_i x_i - \\text{cost}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\np &= " + fmt(p) + " \\\\\n\\text{payout} &= \\$" + w + " \\\\\n\\text{cost} &= \\$" + c + " \\\\\nE &= ?\n\\end{aligned}$$\n\n" +
    "$$(E) = (" + fmt(p) + ")(" + w + ") - " + c + " \\rightarrow (E) = " + fmt(w * p) + " - " + c + "$$\n\n" +
    "$$(E) = " + mtex(E) + "$$";
  return {
    variantKey: "c" + c + "_w" + w + "_p" + Math.round(p * 100),
    question: "A raffle ticket costs $" + c + ". The ticket pays $" + w + " with probability " + fmt(p) + " and nothing otherwise. What is the expected net gain per ticket?",
    options: [
      { label: money2(E), num: E, correct: true },
      { label: money2(dPay), num: dPay },
      { label: money2(dDiff), num: dDiff },
      { label: money2(dFlip), num: dFlip }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-010
// Binomial: "exactly k" mode (k = 1, 2) or "at least one" mode.
// Pairwise-collision guards re-roll (n, k): n==2k duplicates two distractors,
// and (n=3,p=0.25,k=1) / (n=4,p=0.2,k=1) make P(X=k) equal (1-p)^n exactly.
PART.push(buildGenerator({ baseId: "stats-010", subtopic: "Binomial probability", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Binomial problems require the C(n,k) coefficient — 0.0073 is p²(1−p)³ without it, and 0.5905 is the probability that none fail.",
  videoUrl: "https://www.youtube.com/watch?v=3PWKQiLK41M",
  videoTitle: "Finding The Probability of a Binomial Distribution Plus Mean & Standard Deviation"
}, function () {
  function f6(x) { return x.toFixed(6).replace(/0+$/, "").replace(/\.$/, ""); }
  function f4(x) { return x.toFixed(4).replace(/0+$/, "").replace(/\.$/, ""); }
  function collides(vals) {
    for (var i = 0; i < vals.length; i++)
      for (var j = i + 1; j < vals.length; j++)
        if (Math.abs(vals[i] - vals[j]) < 1e-9) return true;
    return false;
  }
  var p = pick([0.1, 0.2, 0.25, 0.3]);
  var q = 1 - p;
  var pct = Math.round(p * 100);
  var mode = pick(["exact", "ge1"]);
  if (mode === "exact") {
    var n, k, pmf, dNoC, dNone, dWrongExp;
    do {
      n = ri(3, 8); k = ri(1, 2);
      pmf = binomPMF(n, k, p);
      dNoC = Math.pow(p, k) * Math.pow(q, n - k); // forgot C(n,k)
      dNone = Math.pow(q, n);                     // none fail
      dWrongExp = Math.pow(p, k) * Math.pow(q, k); // (1-p)^k not (1-p)^(n-k)
    } while (collides([pmf, dNoC, dNone, dWrongExp]));
    var coeff = nCr(n, k);
    var solution =
      "Refer to the Binomial Distribution section in the Engineering Probability and Statistics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(P(X = " + k + ")\\):\n\n" +
      "$$P(X = k) = \\binom{n}{k} p^{k}(1 - p)^{n-k}$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\nn &= " + n + " \\\\\nk &= " + k + " \\\\\np &= " + fmt(p) + " \\\\\nP(X = " + k + ") &= ?\n\\end{aligned}$$\n\n" +
      "$$(P) = \\binom{" + n + "}{" + k + "}(" + fmt(p) + ")^{" + k + "}(" + fmt(q) + ")^{" + (n - k) + "} \\rightarrow (P) = (" + coeff + ")(" + f4(Math.pow(p, k)) + ")(" + f6(Math.pow(q, n - k)) + ")$$\n\n" +
      "$$(P) = " + f4(pmf) + " \\approx " + fmt(pmf) + "$$";
    return {
      variantKey: "n" + n + "_p" + pct + "_k" + k + "_exact",
      question: "Each concrete cylinder in a batch has a " + pct + "% chance of testing below the specified strength, independently. If " + n + " cylinders are tested, what is the probability that exactly " + k + " test" + (k === 1 ? "" : "s") + " below specification?",
      options: [
        { label: fmt(pmf), num: pmf, correct: true },
        { label: fmt(dNoC), num: dNoC },
        { label: fmt(dNone), num: dNone },
        { label: fmt(dWrongExp), num: dWrongExp }
      ],
      solution: solution
    };
  }
  var n2, ans2, dNone2, dSingle, dOne2;
  do {
    n2 = ri(3, 8);
    ans2 = 1 - Math.pow(q, n2);            // at least one
    dNone2 = Math.pow(q, n2);              // none fail
    dSingle = p;                           // single-trial chance
    dOne2 = n2 * p * Math.pow(q, n2 - 1);  // exactly one
  } while (collides([ans2, dNone2, dSingle, dOne2]));
  var solution2 =
    "Refer to the Binomial Distribution section in the Engineering Probability and Statistics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(P(X \\ge 1)\\): the complement of no cylinders testing below specification:\n\n" +
    "$$P(X \\ge 1) = 1 - P(X = 0) = 1 - (1-p)^n$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\nn &= " + n2 + " \\\\\np &= " + fmt(p) + " \\\\\nP(X \\ge 1) &= ?\n\\end{aligned}$$\n\n" +
    "$$(P) = 1 - (" + fmt(q) + ")^" + n2 + " \\rightarrow (P) = 1 - " + f6(dNone2) + " = " + f4(ans2) + "$$\n\n" +
    "$$(P) \\approx " + fmt(ans2) + "$$";
  return {
    variantKey: "n" + n2 + "_p" + pct + "_ge1",
    question: "Each concrete cylinder in a batch has a " + pct + "% chance of testing below the specified strength, independently. If " + n2 + " cylinders are tested, what is the probability that at least one tests below specification?",
    options: [
      { label: fmt(ans2), num: ans2, correct: true },
      { label: fmt(dNone2), num: dNone2 },
      { label: fmt(dSingle), num: dSingle },
      { label: fmt(dOne2), num: dOne2 }
    ],
    solution: solution2
  };
}));

// ---------------------------------------------------------------- stats-011
// Normal P(X > mu + z*sigma) / P(X < mu - z*sigma), z in {1, 1.5, 2}.
PART.push(buildGenerator({ baseId: "stats-011", subtopic: "Normal probability", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "A one-sided 'greater than' question wants a single tail — 4.56% doubles it and 97.72% is the complement below 51 mm.",
  videoUrl: "https://www.youtube.com/watch?v=3be6mzCYMRs",
  videoTitle: "Statistics 6.3 – Finding Probability Using a Normal Distribution"
}, function () {
  function f4(x) { return x.toFixed(4).replace(/0+$/, "").replace(/\.$/, ""); }
  function pct2(v) { return Math.round(v * 10000) / 100; } // percent, 2 decimals
  var mu = pick([40, 50, 100, 200]);
  var sig = pick([0.5, 1, 2, 5, 10]);
  var z = pick([1, 1.5, 2]);
  var above = pick([true, false]);
  var x = above ? mu + z * sig : mu - z * sig;
  var tail = 1 - phi(z);
  var ans = pct2(tail);
  var dTwo = pct2(2 * tail);              // two-sided trap
  var dComp = pct2(1 - tail);             // complement trap
  var dWrongZ = pct2(1 - phi(z === 1 ? 2 : 1)); // tail at the other z
  var zSigned = above ? z : -z;
  var tailLine = above
    ? "From the standard normal table, the upper tail beyond \\(z = " + fmt(z) + "\\) is:"
    : "From the standard normal table, the lower tail below \\(z = " + fmt(zSigned) + "\\) is:";
  var solution =
    "Refer to the Normal Distribution (Gaussian Distribution) section in the Engineering Probability and Statistics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(P(X " + (above ? ">" : "<") + " " + fmt(x) + ")\\). Standardize to \\(z\\):\n\n" +
    "$$z = \\frac{x - \\mu}{\\sigma}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\n\\mu &= " + mu + "\\ \\text{mm} \\\\\n\\sigma &= " + fmt(sig) + "\\ \\text{mm} \\\\\nx &= " + fmt(x) + "\\ \\text{mm} \\\\\nz &= ?\n\\end{aligned}$$\n\n" +
    "$$(z) = \\frac{" + fmt(x) + " - " + mu + "}{" + fmt(sig) + "} \\rightarrow (z) = " + fmt(zSigned) + "$$\n\n" +
    tailLine + "\n\n" +
    "$$(P) = " + f4(tail) + " = " + ans.toFixed(2) + "\\%$$";
  // Setup diagram (never the answer): bell curve with the asked-about tail shaded.
  var d011 = normalTailDiagram(mu, sig, x, above, "mm");
  return {
    variantKey: "mu" + mu + "_sig" + fmt(sig).replace(".", "p") + "_z" + String(z).replace(".", "p") + "_" + (above ? "above" : "below"),
    diagram: d011,
    question: "Steel rod diameters are normally distributed with mean " + mu + " mm and standard deviation " + fmt(sig) + " mm. What is the probability a randomly selected rod has a diameter " + (above ? "greater than " : "less than ") + fmt(x) + " mm?",
    options: [
      { label: ans.toFixed(2) + "%", num: ans, correct: true },
      { label: dTwo.toFixed(2) + "%", num: dTwo },
      { label: dComp.toFixed(2) + "%", num: dComp },
      { label: dWrongZ.toFixed(2) + "%", num: dWrongZ }
    ],
    solution: solution
  };
}));
/* PassTheFE Statistics generators — workstream B
 * (stats-012, 013, 015, 016, 018, 019, 020, 021, 022, 023).
 *
 * FRAGMENT: concatenated between the scaffold head and tail; appends entries
 * to PART via buildGenerator. No IIFE wrapper, no window assignment here.
 *
 * SKIPPED (same rationale as math-020 in the Mathematics pilot):
 *   stats-014 — carries diagrams/stats-014.svg, a normal-curve diagram that
 *               cannot be cleanly parameterized.
 *   stats-017 — purely conceptual (Type I error definition), no numbers to
 *               randomize.
 *
 * LaTeX convention: NATURAL single backslash in the generated strings, so the
 * JS source below writes "\\(" for \(, "\\frac" for \frac, and "\\\\" for the
 * "\\" row break inside aligned environments. Never a doubled backslash
 * before (, ), or an ASCII letter.
 */

// ---------------------------------------------------------------- stats-012
// Least-squares slope. Four points with canceling noise: the noise terms sum
// to zero in Sxy, so the slope is exactly b.
PART.push(buildGenerator({ baseId: "stats-012", subtopic: "Least-squares slope", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "Eyeballing the trend suggests a slope near 1, but least squares weights every deviation — always compute the ratio rather than guessing from the scatterplot.",
  videoUrl: "https://www.youtube.com/watch?v=MAsDDFMhkG0",
  videoTitle: "Statistics 12.2 – Linear Regression"
}, function () {
  var b = pick([0.5, 0.6, 0.75, 0.8, 1.25, 1.5]);
  var e = pick([1, 2, 3]);
  // Keep the intercept clear of the 1/b distractor (b = 0.5 gives 1/b = 2).
  var aPool = [1, 3, 4, 5, 6, 7, 8].filter(function (a) { return !(b === 0.5 && a === 2); });
  var a = pick(aPool);
  var xs = [1, 2, 3, 4];
  var ys = [a + b - e, a + 2 * b + e, a + 3 * b + e, a + 4 * b - e];
  var xm = 2.5;
  var ym = (ys[0] + ys[1] + ys[2] + ys[3]) / 4;
  var terms = [], sxy = 0, sxx = 0;
  for (var i = 0; i < 4; i++) {
    var dx = xs[i] - xm, dy = ys[i] - ym;
    terms.push("(" + texNum(dx) + ")(" + texNum(dy) + ")");
    sxy += dx * dy;
    sxx += dx * dx;
  }
  var slope = sxy / sxx; // exactly b: the (+e, -e) noise cancels in Sxy
  var dIntercept = a;      // answered with the intercept instead of the slope
  var dNoise = b + e / 5;  // noise not canceled
  var dRecip = 1 / b;      // inverted the ratio
  var pts = xs.map(function (x, i) { return "(" + x + ", " + fmt(ys[i]) + ")"; }).join(", ");
  var solution =
    "Refer to the Linear Regression and Goodness of Fit section in the Engineering Probability and Statistics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for the least-squares slope \\(b\\):\n\n" +
    "$$b = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sum (x_i - \\bar{x})^2}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\n\\bar{x} &= 2.5 \\\\\n\\bar{y} &= " + fmt(ym) + " \\\\\n\\sum (x_i - \\bar{x})(y_i - \\bar{y}) &= " + terms.join(" + ") + " = " + fmt(sxy) + " \\\\\n\\sum (x_i - \\bar{x})^2 &= 2.25 + 0.25 + 0.25 + 2.25 = 5 \\\\\nb &= ?\n\\end{aligned}$$\n\n" +
    "$$(b) = \\frac{" + fmt(sxy) + "}{5}$$\n\n" +
    "$$(b) = " + fmt(slope) + "$$";
  return {
    variantKey: "a" + a + "_b" + b + "_e" + e,
    question: "For the data points " + pts + ", what is the slope of the least-squares regression line?",
    options: [
      { label: fmt(slope), num: slope, correct: true },
      { label: fmt(dIntercept), num: dIntercept },
      { label: fmt(dNoise), num: dNoise },
      { label: fmt(dRecip), num: dRecip }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-013
// Poisson exact probability P(X = k) = e^-λ λ^k / k!.
PART.push(buildGenerator({ baseId: "stats-013", subtopic: "Poisson probability", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Match k to the question exactly — 0.224 is P(X = 3) at the mean, and 0.815 is P(X ≤ 4), the cumulative trap.",
  videoUrl: "https://www.youtube.com/watch?v=_6ZKOviYap8",
  videoTitle: "Poisson Distribution"
}, function () {
  var p3 = function (x) { return x.toFixed(3); };
  var lam = pick([1, 2, 3, 4, 5, 6]);
  var kPool = [];
  for (var k = 0; k <= 6; k++) if (poisPMF(lam, k) > 0.005) kPool.push(k);
  var kk, ans, d1, d2, d3, labels, tries = 0;
  do {
    kk = pick(kPool);
    ans = poisPMF(lam, kk);
    var noFact = Math.exp(-lam) * Math.pow(lam, kk);
    // Forgot the /k! (only a sensible trap when k >= 2 and the value stays a
    // probability); otherwise the off-by-two-k trap.
    d1 = (kk >= 2 && noFact < 1) ? noFact : poisPMF(lam, kk + 2);
    d2 = kk === 6 ? poisPMF(lam, 5) : poisPMF(lam, kk + 1); // off-by-one k
    if (kk === 0) d3 = 1 - poisPMF(lam, 0); // cumulative coincides with the answer at k = 0: use the complement trap
    else { d3 = 0; for (var i = 0; i <= kk; i++) d3 += poisPMF(lam, i); } // cumulative P(X <= k)
    labels = [ans, d1, d2, d3].map(p3);
    tries++;
  } while (new Set(labels).size !== 4 && tries < 50);
  var sol =
    "Refer to the Probability and Density Functions: Means and Variances section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(P(X = " + kk + ")\\):\n\n" +
    "$$P(X = k) = \\frac{e^{-\\lambda}\\lambda^{k}}{k!}$$\n\n" +
    "List the known and unknown parameters:\n\n" +
    "$$\\begin{aligned}\n\\lambda &= " + lam + " \\\\\nk &= " + kk + " \\\\\nP(X = " + kk + ") &= ?\n\\end{aligned}$$\n\n" +
    "$$(P) = \\frac{e^{-" + lam + "}(" + lam + ")^{" + kk + "}}{" + kk + "!} \\rightarrow (P) = \\frac{(" + Math.exp(-lam).toFixed(4) + ")(" + fmt(Math.pow(lam, kk)) + ")}{" + fact(kk) + "}$$\n\n" +
    "$$(P) = " + p3(ans) + "$$";
  return {
    variantKey: "lam" + lam + "_k" + kk,
    question: "Vehicles arrive at a toll booth at an average rate of " + lam + " per minute. What is the probability that exactly " + kk + (kk === 1 ? " vehicle arrives" : " vehicles arrive") + " in a given minute?",
    options: [
      { label: p3(ans), num: ans, correct: true },
      { label: p3(d1), num: d1 },
      { label: p3(d2), num: d2 },
      { label: p3(d3), num: d3 }
    ],
    solution: sol
  };
}));

// ---------------------------------------------------------------- stats-015
// Complement rule: P(at least one defective) = 1 - (1 - p)^n.
PART.push(buildGenerator({ baseId: "stats-015", subtopic: "Complement rule", difficulty: "medium",
  estimatedTimeSeconds: 105,
  explanation: "“At least one” means use the complement: 1 − (1−p)ⁿ. The 0.815 trap is P(none defective).",
  videoUrl: "https://www.youtube.com/watch?v=SkidyDQuupA",
  videoTitle: "Introduction to Probability, Basic Overview - Sample Space, & Tree Diagrams"
}, function () {
  var p3 = function (x) { return x.toFixed(3); };
  var n = ri(3, 8);
  var pct = pick([2, 5, 10]);
  var p = pct / 100;
  var q = 1 - p;
  var pNone = Math.pow(q, n);
  var ans = 1 - pNone;
  var dP = p;        // just the defect rate
  var dNP = n * p;   // added the rates instead of complementing
  var dNone = pNone; // P(none defective): the complement trap
  var solution =
    "Refer to the Laws of Probability section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (pp. 65-66).\n\n" +
    "Ultimately, we must solve for \\(P(\\text{at least one defective})\\). Use the complement rule:\n\n" +
    "$$P(\\text{at least one}) = 1 - P(\\text{none defective}) = 1 - (1 - p)^n$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(P\\):\n\n" +
    "$$\\begin{aligned}\np &= " + pct + "\\% = " + p + " \\\\\nn &= " + n + " \\\\\nP &= ?\n\\end{aligned}$$\n\n" +
    "Substituting:\n\n" +
    "$$P = 1 - (" + fmt(q) + ")^" + n + " = 1 - " + pNone.toFixed(5) + "$$\n\n" +
    "$$P = " + p3(ans) + "$$";
  return {
    variantKey: "n" + n + "_p" + pct,
    question: "A manufactured part has a " + pct + "% defect rate, independently from part to part. If " + n + " parts are sampled, what is the probability that at least one is defective?",
    options: [
      { label: p3(ans), num: ans, correct: true },
      { label: p3(dP), num: dP },
      { label: p3(dNP), num: dNP },
      { label: p3(dNone), num: dNone }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-016
// Coefficient of variation CV = sigma / mu, reported as a percent.
PART.push(buildGenerator({ baseId: "stats-016", subtopic: "Coefficient of variation", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "CV = σ/μ is unitless relative spread — the 20 trap inverts the ratio.",
  videoUrl: "https://www.youtube.com/watch?v=Yw2ky0IocfA",
  videoTitle: "Statistics Basics: Mean, Median, Mode, Range & Standard Deviation Explained!"
}, function () {
  // [mu, cvPercent] pairs chosen so sigma = mu*cv/100 is a clean number.
  var pairs = [];
  [[40, [5, 10, 15]], [50, [2, 4, 6, 8, 10, 12]], [60, [5, 10, 15]],
   [80, [5, 10, 15]], [100, [2, 4, 5, 6, 8, 10, 12, 15]]].forEach(function (e) {
    e[1].forEach(function (cv) { pairs.push([e[0], cv]); });
  });
  var pr = pick(pairs);
  var mu = pr[0], cv = pr[1];
  var sigma = mu * cv / 100;
  var dInvert = mu / sigma; // inverted the ratio
  var dSigma = sigma;       // reported sigma alone, with units
  var dDiff = mu - sigma;   // subtracted instead of dividing
  var solution =
    "Refer to the Dispersion, Mean, Median, and Mode Values section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the coefficient of variation \\(CV\\), the relative (dimensionless) measure of spread:\n\n" +
    "$$CV = \\frac{\\sigma}{\\mu}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(CV\\):\n\n" +
    "$$\\begin{aligned}\n\\mu &= " + fmt(mu) + "\\ \\text{ksi} \\\\\n\\sigma &= " + fmt(sigma) + "\\ \\text{ksi} \\\\\nCV &= ?\n\\end{aligned}$$\n\n" +
    "Substituting:\n\n" +
    "$$CV = \\frac{" + fmt(sigma) + "}{" + fmt(mu) + "} = " + (sigma / mu) + "$$\n\n" +
    "$$CV = " + cv + "\\%$$";
  return {
    variantKey: "mu" + mu + "_cv" + cv,
    question: "Steel yield strengths have a mean of " + fmt(mu) + " ksi and a standard deviation of " + fmt(sigma) + " ksi. What is the coefficient of variation?",
    options: [
      { label: cv + "%", num: cv / 100, correct: true },
      { label: fmt(dInvert), num: dInvert },
      { label: fmt(dSigma) + " ksi", num: dSigma },
      { label: fmt(dDiff) + " ksi", num: dDiff }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-018
// Margin of error for a proportion: E = z*sqrt(p̂(1-p̂)/n).
PART.push(buildGenerator({ baseId: "stats-018", subtopic: "Confidence intervals for proportions", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Margin of error = z√(p̂(1−p̂)/n). Forgetting the square root of n gives the 0.960 trap.",
  videoUrl: "https://www.youtube.com/watch?v=9GtaIHFuEZU",
  videoTitle: "Statistics 101: Confidence Interval Estimation, Sigma Known"
}, function () {
  var p3 = function (x) { return x.toFixed(3); };
  var s6 = function (x) { return x.toFixed(6).replace(/0+$/, "").replace(/\.$/, ""); };
  var n = pick([100, 225, 400, 625, 900]); // perfect squares: clean standard errors
  var pct = pick([40, 50, 60]);
  var phat = pct / 100;
  var z = pick([1.96, 2]);
  var zStr = z === 2 ? "2" : "1.96";
  var se = Math.sqrt(phat * (1 - phat) / n);
  var ans = z * se;
  var dNoSqrtN = z * Math.sqrt(phat * (1 - phat)); // forgot the /sqrt(n)
  var dNoSqrt = z * phat * (1 - phat) / n;         // forgot every square root
  var dHalf = ans / 2;                             // halved the margin
  var solution =
    "Refer to the Confidence Intervals section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (pp. 75-76). Note: the handbook prints intervals for the mean, the difference of two means, and the variance -- it does not print a proportion interval, so memorize this one. It follows the same pattern as the handbook's mean interval: margin of error = z x (standard error), with the standard error of a sample proportion equal to \\(\\sqrt{\\hat{p}(1-\\hat{p})/n}\\):\n\n" +
    "Ultimately, we must solve for the margin of error \\(E\\) of a 95% confidence interval for a proportion:\n\n" +
    "$$E = z\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(E\\):\n\n" +
    "$$\\begin{aligned}\n\\hat{p} &= " + pct + "\\% = " + phat.toFixed(2) + " \\\\\nn &= " + n + " \\\\\nz &= " + zStr + " \\\\\nE &= ?\n\\end{aligned}$$\n\n" +
    "Substituting:\n\n" +
    "$$E = " + zStr + "\\sqrt{\\frac{" + phat.toFixed(2) + "(" + (1 - phat).toFixed(2) + ")}{" + n + "}} = " + zStr + "(" + s6(se) + ")$$\n\n" +
    "$$E = " + p3(ans) + "$$";
  return {
    variantKey: "n" + n + "_p" + pct + "_z" + zStr,
    question: "In a survey of " + n + " residents, " + pct + "% support a proposed transit project. What is the margin of error for a 95% confidence interval for the true proportion? (Use z = " + zStr + ".)",
    options: [
      { label: p3(ans), num: ans, correct: true },
      { label: p3(dNoSqrtN), num: dNoSqrtN },
      { label: p3(dNoSqrt), num: dNoSqrt },
      { label: p3(dHalf), num: dHalf }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-019
// Var(aX - bY) = a^2*Var(X) + b^2*Var(Y) for independent X, Y.
PART.push(buildGenerator({ baseId: "stats-019", subtopic: "Variance of linear combinations", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "Variance squares the coefficients and the minus sign vanishes: 9(4) + 4(9) = 72. The −18 trap keeps the sign.",
  videoUrl: "https://www.youtube.com/watch?v=rCcY3fdTwgo",
  videoTitle: "Expected Value & Variance (Discrete Random Variables)"
}, function () {
  var a = ri(1, 4), b = ri(1, 4);
  if (a === 1 && b === 1) b = 2; // a = b = 1 makes "forgot the squares" coincide with "dropped the coefficients"
  var vx = pick([2, 3, 4, 5, 8, 9]);
  var vy = pick([2, 3, 4, 5, 8, 9]);
  var ans = a * a * vx + b * b * vy;
  var dNoSquare = a * vx + b * vy;       // forgot to square the coefficients
  var dNoCoef = vx + vy;                 // dropped the coefficients entirely
  var dKeepSign = a * a * vx - b * b * vy; // kept the minus sign
  // Re-pick vy if the kept-sign trap lands on another option (rare).
  var guard = 0;
  while (guard++ < 20 && (dKeepSign === ans || dKeepSign === dNoSquare || dKeepSign === dNoCoef)) {
    vy = pick([2, 3, 4, 5, 8, 9]);
    ans = a * a * vx + b * b * vy;
    dNoSquare = a * vx + b * vy;
    dNoCoef = vx + vy;
    dKeepSign = a * a * vx - b * b * vy;
  }
  var solution =
    "Refer to the Laws of Probability section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (pp. 65-66).\n\n" +
    "Ultimately, we must solve for \\(Var(" + a + "X - " + b + "Y)\\). For independent random variables, variances add with squared coefficients — the minus sign does not survive squaring:\n\n" +
    "$$Var(aX + bY) = a^2Var(X) + b^2Var(Y)$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(Var(" + a + "X - " + b + "Y)\\):\n\n" +
    "$$\\begin{aligned}\nVar(X) &= " + vx + " \\\\\nVar(Y) &= " + vy + " \\\\\na &= " + a + ",\\ b = -" + b + " \\\\\nVar(" + a + "X - " + b + "Y) &= ?\n\\end{aligned}$$\n\n" +
    "Substituting:\n\n" +
    "$$Var(" + a + "X - " + b + "Y) = (" + a + ")^2(" + vx + ") + (-" + b + ")^2(" + vy + ") = " + (a * a * vx) + " + " + (b * b * vy) + "$$\n\n" +
    "$$Var(" + a + "X - " + b + "Y) = " + ans + "$$";
  return {
    variantKey: "a" + a + "_b" + b + "_vx" + vx + "_vy" + vy,
    question: "X and Y are independent random variables with Var(X) = " + vx + " and Var(Y) = " + vy + ". What is Var(" + a + "X − " + b + "Y)?",
    options: [
      { label: sgn(ans), num: ans, correct: true },
      { label: sgn(dNoSquare), num: dNoSquare },
      { label: sgn(dNoCoef), num: dNoCoef },
      { label: sgn(dKeepSign), num: dKeepSign }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-020
// Poisson P(X <= 1) = P(X = 0) + P(X = 1). The lam range is widened to 1..6
// (the brief's 1..4 yields only 4 variants) and the arrival scenario varies,
// so the variant space clears the 10-variant minimum.
PART.push(buildGenerator({ baseId: "stats-020", subtopic: "Poisson distribution", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "P(X ≤ 1) = e^( −λ)(1 + λ). The 0.801 trap answers the complement instead.",
  videoUrl: "https://www.youtube.com/watch?v=_6ZKOviYap8",
  videoTitle: "Poisson Distribution"
}, function () {
  var p3 = function (x) { return x.toFixed(3); };
  var lam = pick([1, 2, 3, 4, 5, 6]);
  var scen = pick([
    { key: "toll", arrival: "Vehicles arrive at a toll booth", unit: "minute", subject: "vehicle", verb: "arrives" },
    { key: "desk", arrival: "Calls arrive at a customer help desk", unit: "minute", subject: "call", verb: "arrives" },
    { key: "shop", arrival: "Shoppers enter a store", unit: "hour", subject: "shopper", verb: "enters" }
  ]);
  var p0 = poisPMF(lam, 0), p1 = poisPMF(lam, 1);
  var ans = p0 + p1;
  var dP0 = p0; // left out the k = 1 term
  // Left out the k = 0 term; at lam = 1 that coincides with P(X = 0), so use P(X = 2).
  var dP1 = lam === 1 ? poisPMF(lam, 2) : p1;
  var dCompl = 1 - ans; // answered the complement instead
  var solution =
    "Refer to the Probability and Density Functions: Means and Variances section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(P(X \\le 1)\\). Sum the probabilities for \\(k = 0\\) and \\(k = 1\\):\n\n" +
    "$$P(X = k) = \\frac{e^{-\\lambda}\\lambda^{k}}{k!}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(P(X \\le 1)\\):\n\n" +
    "$$\\begin{aligned}\n\\lambda &= " + lam + " \\\\\nk &= 0, 1 \\\\\nP(X \\le 1) &= ?\n\\end{aligned}$$\n\n" +
    "Substituting:\n\n" +
    "$$P(X \\le 1) = \\frac{e^{-" + lam + "}" + lam + "^0}{0!} + \\frac{e^{-" + lam + "}" + lam + "^1}{1!} = e^{-" + lam + "}(1 + " + lam + ") = " + (1 + lam) + "(" + Math.exp(-lam).toFixed(6) + ")$$\n\n" +
    "$$P(X \\le 1) = " + p3(ans) + "$$";
  return {
    variantKey: "lam" + lam + "_" + scen.key,
    question: scen.arrival + " at an average rate of " + lam + " per " + scen.unit + ". What is the probability that at most 1 " + scen.subject + " " + scen.verb + " in a given " + scen.unit + "?",
    options: [
      { label: p3(ans), num: ans, correct: true },
      { label: p3(dP0), num: dP0 },
      { label: p3(dP1), num: dP1 },
      { label: p3(dCompl), num: dCompl }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-021
// Combinations C(n, r): the order of the r selections does not matter.
PART.push(buildGenerator({ baseId: "stats-021", subtopic: "Combinations", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Order doesn't matter for a panel, so use combinations. If the seats were distinct roles, you would use permutations instead.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var n = ri(6, 12);
  var r = pick([2, 3, 4]); // r <= n - 2 always in this range
  var ans = nCr(n, r);
  var dPerm = nPr(n, r);      // used permutations (order matters) by mistake
  var dPow = Math.pow(n, r);  // n^r: selections with repetition and order
  var dProd = n * r;          // multiplied instead of choosing
  var top = [], bot = [], tp = 1, bp = 1, i, j;
  for (i = 0; i < r; i++) { top.push(n - i); tp *= (n - i); }
  for (j = r; j >= 1; j--) { bot.push(j); bp *= j; }
  var solution =
    "Refer to the Permutations and Combinations section in the Engineering Probability and Statistics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(C(" + n + ", " + r + ")\\). Because the order of the " + r + " engineers on the panel does not matter, the handbook's combination formula applies:\n\n" +
    "$$C(n, r) = \\frac{n!}{r!(n - r)!}$$\n\n" +
    "List the known and unknown parameters in order to compute \\(C(" + n + ", " + r + ")\\):\n\n" +
    "$$\\begin{aligned}\nn &= " + n + " \\\\\nr &= " + r + " \\\\\nC(" + n + ", " + r + ") &= ?\n\\end{aligned}$$\n\n" +
    "Substitute into the combination formula:\n\n" +
    "$$(C(" + n + ", " + r + ")) = \\frac{" + n + "!}{" + r + "!(" + n + " - " + r + ")!} = \\frac{" + n + "!}{" + r + "!\\," + (n - r) + "!}$$\n\n" +
    "Cancel the common factors on their own line:\n\n" +
    "$$\\left(\\frac{" + n + "!}{" + r + "!\\," + (n - r) + "!}\\right) = \\frac{" + top.join(" \\cdot ") + "}{" + bot.join(" \\cdot ") + "} = \\frac{" + tp + "}{" + bp + "}$$\n\n" +
    "Evaluate the result:\n\n" +
    "$$C(" + n + ", " + r + ") = " + ans + "$$";
  return {
    variantKey: "n" + n + "_r" + r,
    question: "An engineering firm must select " + r + " engineers from a team of " + n + " to form a design review panel. How many distinct panels are possible?",
    options: [
      { label: fmt(ans), num: ans, correct: true },
      { label: fmt(dPerm), num: dPerm },
      { label: fmt(dPow), num: dPow },
      { label: fmt(dProd), num: dProd }
    ],
    solution: solution,
    tiTip: "Yes — direct solve: tap the probability key 2× to reach nCr (! → nCr), then enter " + n + " nCr " + r + "."
  };
}));

// ---------------------------------------------------------------- stats-022
// Conditional probability P(D|F) = P(D,F)/P(F); the joint is rolled as
// P(F) * ratio so the answer is a clean decimal.
PART.push(buildGenerator({ baseId: "stats-022", subtopic: "Conditional probability from joint probabilities", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "Given the condition, divide the 'both' probability by the probability of the condition. The answer must be at least as large as the joint probability.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var pF = pick([0.2, 0.25, 0.3, 0.4]);
  // Keep the answer distinct from P(F) itself.
  var ratio = pick([0.3, 0.4, 0.5, 0.6].filter(function (r) { return Math.abs(r - pF) > 1e-9; }));
  var pFpct = Math.round(pF * 100);
  var jointDec = Math.round(pFpct * ratio * 100) / 10000; // exact decimal of the joint probability
  var jointPct = fmt(jointDec * 100);
  var ans = ratio;
  var dJoint = jointDec;     // forgot to divide by P(F)
  var dPF = pF;              // answered with the given condition alone
  var dProd = pF * jointDec; // multiplied instead of dividing
  var pfStr = pF.toFixed(2);
  var jStr = String(jointDec);
  var solution =
    "Refer to the Laws of Probability section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (pp. 65-66).\n\n" +
    "Ultimately, we must solve for \\(P(D \\mid F)\\). Property 3 (Law of Compound or Joint Probability) gives:\n\n" +
    "$$P(A, B) = P(A) \\cdot P(B \\mid A)$$\n\n" +
    "Rearranging for the conditional probability:\n\n" +
    "$$P(D \\mid F) = \\frac{P(D, F)}{P(F)}$$\n\n" +
    "List the known and unknown parameters in order to compute \\(P(D \\mid F)\\):\n\n" +
    "$$\\begin{aligned}\nP(F) &= " + pfStr + " \\\\\nP(D, F) &= " + jStr + " \\\\\nP(D \\mid F) &= ?\n\\end{aligned}$$\n\n" +
    "Substitute into the rearranged formula:\n\n" +
    "$$(P(D \\mid F)) = \\frac{(" + jStr + ")}{(" + pfStr + ")}$$\n\n" +
    "Evaluate the result:\n\n" +
    "$$P(D \\mid F) = " + ratio.toFixed(2) + "$$";
  return {
    variantKey: "pF" + pFpct + "_r" + ratio,
    question: "In a batch of castings, " + pFpct + "% have a surface flaw (event \\(F\\)) and " + jointPct + "% have both a surface flaw and a dimensional deviation (event \\(D\\)). Given that a randomly selected casting has a surface flaw, what is the probability it also has a dimensional deviation?",
    options: [
      { label: ratio.toFixed(2), num: ans, correct: true },
      { label: jStr, num: dJoint },
      { label: pfStr, num: dPF },
      { label: fmt(dProd), num: dProd }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-023
// E[g(X)] for X uniform on [0, L]: integrate g against f(x) = 1/L.
PART.push(buildGenerator({ baseId: "stats-023", subtopic: "Expected value of a function", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "E[X²] is not the square of E[X]. Integrate x² against the density directly — the variance is the difference between the two.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var t2 = function (x) { return x.toFixed(2); };
  var L = pick([4, 6, 8, 10]);
  var forms = [
    { tex: "X^2", g: "x^2", anti: "\\frac{x^3}{3}",
      antiEval: "\\frac{" + (L * L * L) + "}{3} - 0 = \\frac{" + (L * L * L) + "}{3}",
      intVal: "\\frac{" + (L * L * L) + "}{3}", egTex: "\\frac{" + (L * L) + "}{3}",
      eg: L * L / 3, gL: L * L, gMean: (L / 2) * (L / 2) },
    { tex: "2X^2+1", g: "2x^2+1", anti: "\\frac{2x^3}{3} + x",
      antiEval: "\\frac{" + (2 * L * L * L) + "}{3} + " + L + " - 0",
      intVal: "\\frac{" + (2 * L * L * L) + "}{3} + " + L, egTex: "\\frac{" + (2 * L * L) + "}{3} + 1",
      eg: 2 * L * L / 3 + 1, gL: 2 * L * L + 1, gMean: 2 * (L / 2) * (L / 2) + 1 },
    { tex: "X^2+X", g: "x^2+x", anti: "\\frac{x^3}{3} + \\frac{x^2}{2}",
      antiEval: "\\frac{" + (L * L * L) + "}{3} + \\frac{" + (L * L) + "}{2} - 0",
      intVal: "\\frac{" + (L * L * L) + "}{3} + \\frac{" + (L * L) + "}{2}",
      egTex: "\\frac{" + (L * L) + "}{3} + \\frac{" + L + "}{2}",
      eg: L * L / 3 + L / 2, gL: L * L + L, gMean: (L / 2) * (L / 2) + L / 2 }
  ];
  var fi = ri(0, 2);
  var F = forms[fi];
  var ans = F.eg;
  var dEnd = F.gL / 2;  // evaluated g at the endpoint and halved
  var dMean = F.gMean;  // g(E[X]): E[g(X)] is not g(E[X])
  var dNoDiv = L * F.eg; // integrated without dividing by (b - a)
  var solution =
    "Refer to the Expected Values section in the Engineering Probability and Statistics chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(E[" + F.tex + "]\\). The handbook gives the expected value of a function \\(Y = g(X)\\) of a continuous random variable:\n\n" +
    "$$E[Y] = E[g(X)] = \\int_{-\\infty}^{\\infty} g(x)\\,f(x)\\,dx$$\n\n" +
    "List the known and unknown parameters in order to compute \\(E[" + F.tex + "]\\):\n\n" +
    "$$\\begin{aligned}\ng(x) &= " + F.g + " \\\\\nf(x) &= \\frac{1}{" + L + "}, \\quad 0 \\le x \\le " + L + " \\\\\nE[" + F.tex + "] &= ?\n\\end{aligned}$$\n\n" +
    "Substitute into the expected-value formula, noting the density is zero outside \\([0, " + L + "]\\):\n\n" +
    "$$(E[" + F.tex + "]) = \\int_0^{" + L + "} \\left(" + F.g + "\\right) \\left(\\frac{1}{" + L + "}\\right)\\,dx = \\frac{1}{" + L + "}\\int_0^{" + L + "} \\left(" + F.g + "\\right)\\,dx$$\n\n" +
    "Evaluate the integral on its own line:\n\n" +
    "$$\\left(\\int_0^{" + L + "} \\left(" + F.g + "\\right)\\,dx\\right) = \\left[" + F.anti + "\\right]_0^{" + L + "} = " + F.antiEval + "$$\n\n" +
    "Multiply by the constant factor:\n\n" +
    "$$(E[" + F.tex + "]) = \\left(\\frac{1}{" + L + "}\\right)\\left(" + F.intVal + "\\right) = " + F.egTex + " \\approx " + t2(ans) + "$$\n\n" +
    "$$E[" + F.tex + "] = " + t2(ans) + "$$";
  return {
    variantKey: "L" + L + "_g" + fi,
    question: "A continuous random variable \\(X\\) has probability density function \\(f(x) = 1/" + L + "\\) for \\(0 \\le x \\le " + L + "\\) (and zero otherwise). What is the expected value of \\(" + F.tex + "\\)?",
    options: [
      { label: t2(ans), num: ans, correct: true },
      { label: t2(dEnd), num: dEnd },
      { label: t2(dMean), num: dMean },
      { label: t2(dNoDiv), num: dNoDiv }
    ],
    solution: solution
  };
}));
/* Workstream C — Statistics and Probability generators: stats-024 through
 * stats-032 plus stats-034 (10 generators).
 *
 * stats-033 is SKIPPED: it is a purely conceptual Type I/Type II error
 * definition question with no numbers to parameterize (same rationale as
 * math-020 in the Mathematics pilot).
 */

// Workstream-C local helpers (wC_ prefix avoids collisions with other parts).
// Sum of signed terms for inside LaTeX, ASCII hyphens: "1 + 2 - 11".
function wC_sumTex(vals) {
  var s = texNum(vals[0]);
  for (var i = 1; i < vals.length; i++)
    s += vals[i] < -1e-12 ? " - " + fmt(-vals[i]) : " + " + fmt(vals[i]);
  return s;
}
// Thousands grouping for inside LaTeX: 5040 -> "5{,}040".
function wC_grp(x) {
  return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, "{,}");
}

// ---------- stats-024: sample correlation coefficient (dataset is rolled, R computed) ----------
PART.push(buildGenerator({
  baseId: "stats-024",
  subtopic: "Sample correlation coefficient",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The correlation coefficient standardizes the covariance by the two standard deviations, so it always lies between -1 and 1. A value near 1 means the points lie close to a rising line.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var n, pts, Sxx, Syy, Sxy, R, bHat, r2, omr2;
  var ok = false, tries = 0, i, u, v;
  while (!ok && tries < 5000) {
    tries++;
    n = pick([4, 5]);
    var a = ri(0, 5);
    var b = pick([1, 2, 3]) * pick([1, -1]);
    pts = [];
    for (i = 1; i <= n; i++) pts.push([i, a + b * i + ri(-2, 2)]);
    var xb = mean(pts.map(function (p) { return p[0]; }));
    var yb = mean(pts.map(function (p) { return p[1]; }));
    Sxx = 0; Syy = 0; Sxy = 0;
    for (i = 0; i < n; i++) {
      var dx = pts[i][0] - xb, dy = pts[i][1] - yb;
      Sxx += dx * dx; Syy += dy * dy; Sxy += dx * dy;
    }
    if (!(Sxx > 0 && Syy > 0)) continue;
    R = Sxy / Math.sqrt(Sxx * Syy);
    if (!isFinite(R) || Math.abs(R) < 0.5 || Math.abs(R) > 0.99) continue;
    bHat = Sxy / Sxx;   // OLS slope: classic "used the slope formula" mistake
    r2 = R * R;         // forgot the square root
    omr2 = 1 - r2;      // "one minus" confusion
    var vals = [R, r2, bHat, omr2];
    ok = true;
    for (u = 0; u < vals.length && ok; u++)
      for (v = u + 1; v < vals.length && ok; v++)
        if (Math.abs(vals[u] - vals[v]) < 0.003) ok = false;
  }
  var ptStr = pts.map(function (p) { return "(" + p[0] + ", " + sgn(p[1]) + ")"; });
  var listed = n === 4
    ? ptStr[0] + ", " + ptStr[1] + ", " + ptStr[2] + ", and " + ptStr[3]
    : ptStr[0] + ", " + ptStr[1] + ", " + ptStr[2] + ", " + ptStr[3] + ", and " + ptStr[4];
  var question = (n === 4 ? "Four" : "Five") + " paired observations are " + listed +
    ". What is the sample correlation coefficient \\(R\\)?";
  var tXY = [], tXX = [], tYY = [];
  for (i = 0; i < n; i++) {
    var ddx = pts[i][0] - xb, ddy = pts[i][1] - yb;
    tXY.push("(" + texNum(ddx) + ")(" + texNum(ddy) + ")");
    tXX.push("(" + texNum(ddx) + ")^2");
    tYY.push("(" + texNum(ddy) + ")^2");
  }
  var solution =
    "Refer to the Sample Correlation Coefficient section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(R\\). The handbook prints:\n\n" +
    "$$R = \\frac{S_{xy}}{\\sqrt{S_{xx} \\, S_{yy}}}$$\n\n" +
    "Compute the means:\n\n" +
    "$$\\begin{aligned}\n" +
    "\\bar{x} &= \\frac{" + pts.map(function (p) { return p[0]; }).join(" + ") + "}{" + n + "} = " + fmt(xb) + " \\\\\n" +
    "\\bar{y} &= \\frac{" + wC_sumTex(pts.map(function (p) { return p[1]; })) + "}{" + n + "} = " + fmt(yb) + "\n" +
    "\\end{aligned}$$\n\n" +
    "Compute the sums of squares and cross-products:\n\n" +
    "$$\\begin{aligned}\n" +
    "S_{xy} &= " + tXY.join(" + ") + " = " + fmt(Sxy) + " \\\\\n" +
    "S_{xx} &= " + tXX.join(" + ") + " = " + fmt(Sxx) + " \\\\\n" +
    "S_{yy} &= " + tYY.join(" + ") + " = " + fmt(Syy) + "\n" +
    "\\end{aligned}$$\n\n" +
    "$$(R) = \\frac{" + fmt(Sxy) + "}{\\sqrt{(" + fmt(Sxx) + ")(" + fmt(Syy) + ")}} = " + sgn(R) + "$$";
  return {
    variantKey: "pts:" + pts.map(function (p) { return p[0] + "_" + p[1]; }).join("-"),
    question: question,
    options: [
      { label: sgn(R), num: R, correct: true },
      { label: sgn(r2), num: r2, correct: false },
      { label: sgn(bHat), num: bHat, correct: false },
      { label: sgn(omr2), num: omr2, correct: false }
    ],
    solution: solution
  };
}));

// ---------- stats-025: least-squares intercept ----------
PART.push(buildGenerator({
  baseId: "stats-025",
  subtopic: "Least-squares intercept",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The least-squares line always passes through the point of the two means. Once the slope is known, the intercept is forced by that single fact.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var s, a, b, ok = false, tries = 0, u, v, i;
  while (!ok && tries < 500) {
    tries++;
    s = ri(0, 2);
    a = ri(-3, 5);
    b = pick([0.5, 1, 1.5, 2, -1]);
    var vals = [a, b, a + b, a + b * (s + 2)]; // a, slope, a+b, y-bar
    ok = true;
    for (u = 0; u < vals.length && ok; u++)
      for (v = u + 1; v < vals.length && ok; v++)
        if (Math.abs(vals[u] - vals[v]) < 0.003) ok = false;
  }
  var xs = [s + 1, s + 2, s + 3];
  var ys = [a + b * xs[0], a + b * xs[1], a + b * xs[2]];
  var xbar = s + 2, ybar = a + b * (s + 2);
  var ptStr = [];
  for (i = 0; i < 3; i++) ptStr.push("(" + xs[i] + ", " + sgn(ys[i]) + ")");
  var question = "Three data points " + ptStr[0] + ", " + ptStr[1] + ", and " + ptStr[2] +
    " are fit with the least-squares line \\(y = a + bx\\). What is the intercept \\(a\\)?";
  var numTerms = [];
  for (i = 0; i < 3; i++)
    numTerms.push("(" + texNum(xs[i] - xbar) + ")(" + texNum(ys[i] - ybar) + ")");
  var solution =
    "Refer to the Linear Regression and Goodness of Fit section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(a\\). The handbook prints the intercept as:\n\n" +
    "$$a = \\bar{y} - b\\bar{x}$$\n\n" +
    "Compute the means:\n\n" +
    "$$\\begin{aligned}\n" +
    "\\bar{x} &= \\frac{" + xs.join(" + ") + "}{3} = " + xbar + " \\\\\n" +
    "\\bar{y} &= \\frac{" + wC_sumTex(ys) + "}{3} = " + texNum(ybar) + "\n" +
    "\\end{aligned}$$\n\n" +
    "Compute the slope:\n\n" +
    "$$b = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sum (x_i - \\bar{x})^2} = " +
    "\\frac{" + numTerms.join(" + ") + "}{1 + 0 + 1} = \\frac{" + texNum(2 * b) + "}{2} = " + texNum(b) + "$$\n\n" +
    "$$(a) = " + texNum(ybar) + " - (" + texNum(b) + ")(" + xbar + ") = " + texNum(a) + "$$";
  return {
    variantKey: "s" + s + "a" + a + "b" + b,
    question: question,
    options: [
      { label: sgn(a), num: a, correct: true },
      { label: sgn(b), num: b, correct: false },
      { label: sgn(a + b), num: a + b, correct: false },
      { label: sgn(ybar), num: ybar, correct: false }
    ],
    solution: solution
  };
}));

// ---------- stats-026: standard normal critical value ----------
// 12 variants: (one/two-sided) x (80/90/95/96/98/99%). The 80/96/98% levels
// widen the original 90/95/99 set (the original's own table already lists
// 80% and 96%); all values are standard normal quantiles.
var wC_ZCRIT = [
  { side: "two-sided", level: 80, val: 1.2816 },
  { side: "two-sided", level: 90, val: 1.6449 },
  { side: "two-sided", level: 95, val: 1.96 },
  { side: "two-sided", level: 96, val: 2.0537 },
  { side: "two-sided", level: 98, val: 2.3263 },
  { side: "two-sided", level: 99, val: 2.5758 },
  { side: "one-sided", level: 80, val: 0.8416 },
  { side: "one-sided", level: 90, val: 1.2816 },
  { side: "one-sided", level: 95, val: 1.6449 },
  { side: "one-sided", level: 96, val: 1.7507 },
  { side: "one-sided", level: 98, val: 2.0537 },
  { side: "one-sided", level: 99, val: 2.3263 }
];
PART.push(buildGenerator({
  baseId: "stats-026",
  subtopic: "Standard normal critical value",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "For a two-sided interval, α/2 goes in each tail: a 95% interval leaves 2.5% above the upper critical value. The handbook tabulates Z_{alpha/2} directly, so no table lookup is needed.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var v = pick(wC_ZCRIT);
  var lab = v.val.toFixed(4);
  var pool = [], seen = {}, i;
  for (i = 0; i < wC_ZCRIT.length; i++) {
    var x = wC_ZCRIT[i].val;
    if (x !== v.val && !seen[x]) { seen[x] = 1; pool.push(x); }
  }
  var wrong = shuffle(pool).slice(0, 3);
  var two = v.side === "two-sided";
  var question = two
    ? "A two-sided " + v.level + "% confidence interval for a population mean is constructed using the standard normal distribution. What is the value of \\(Z_{\\alpha/2}\\)?"
    : "A one-sided " + v.level + "% upper confidence bound for a population mean is constructed using the standard normal distribution. What is the value of \\(Z_{\\alpha}\\)?";
  var rows = two
    ? ["80\\% &\\to 1.2816", "90\\% &\\to 1.6449", "95\\% &\\to 1.9600", "96\\% &\\to 2.0537", "98\\% &\\to 2.3263", "99\\% &\\to 2.5758"]
    : ["80\\% &\\to 0.8416", "90\\% &\\to 1.2816", "95\\% &\\to 1.6449", "96\\% &\\to 1.7507", "98\\% &\\to 2.0537", "99\\% &\\to 2.3263"];
  var solution =
    "Refer to the Test Statistics section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    (two
      ? "Ultimately, we must solve for \\(Z_{\\alpha/2}\\). The handbook prints the Values of \\(Z_{\\alpha/2}\\) table:\n\n"
      : "Ultimately, we must solve for \\(Z_{\\alpha}\\). Reading the handbook's Values of \\(Z_{\\alpha/2}\\) table one-sided (all of \\(\\alpha\\) in a single tail):\n\n") +
    "$$\\begin{aligned}\n" + rows.join(" \\\\\n") + "\n\\end{aligned}$$\n\n" +
    (two
      ? "For a " + v.level + "% two-sided interval:\n\n$$(Z_{\\alpha/2}) = " + lab + "$$"
      : "For a " + v.level + "% one-sided bound:\n\n$$(Z_{\\alpha}) = " + lab + "$$");
  var opts = [{ label: lab, num: v.val, correct: true }];
  for (i = 0; i < 3; i++) opts.push({ label: wrong[i].toFixed(4), num: wrong[i], correct: false });
  return {
    variantKey: v.side + "-" + v.level,
    question: question,
    options: opts,
    solution: solution
  };
}));

// ---------- stats-027: Poisson exact-count probability in time t ----------
PART.push(buildGenerator({
  baseId: "stats-027",
  subtopic: "Poisson exact-count probability",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The Poisson distribution models counts of rare events in a fixed interval. The factorial in the denominator grows fast, so probabilities for counts far from the mean drop quickly.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var lam = pick([1, 2, 3, 4]);
  var t = pick([1, 2]);
  var k = ri(0, 5);
  var lamt = lam * t;
  var correct = poisPMF(lamt, k);
  var cands = [];
  if (t === 2) cands.push(poisPMF(lam, k));                    // forgot to scale the rate by t
  if (k >= 2) cands.push(Math.pow(lamt, k) * Math.exp(-lamt)); // dropped the k! denominator
  cands.push(poisPMF(lamt, k < 5 ? k + 1 : k - 1));             // off-by-one count
  if (k >= 1) {                                               // cumulative instead of exact
    var cdf = 0;
    for (var i = 0; i <= k; i++) cdf += poisPMF(lamt, i);
    cands.push(cdf);
  }
  cands.push(1 - correct);                                     // complement
  cands.push(poisPMF(lamt, k <= 3 ? k + 2 : k - 2));           // off-by-two count
  cands.push(poisPMF(lamt + 1, k));                            // rate miscounted by one
  if (k >= 1) cands.push(Math.pow(lamt, k) / fact(k));         // dropped the exponential
  var chosen = [], c, q;
  for (c = 0; c < cands.length && chosen.length < 3; c++) {
    var w = cands[c];
    if (Math.abs(w - correct) < 0.004) continue;
    var sep = true;
    for (q = 0; q < chosen.length; q++)
      if (Math.abs(w - chosen[q].num) < 0.004) { sep = false; break; }
    if (sep) chosen.push({ label: fmt(w), num: w, correct: false });
  }
  while (chosen.length < 3) { // safety net; validation confirms it never fires
    var w2 = correct + 0.11 * (chosen.length + 1);
    chosen.push({ label: fmt(w2), num: w2, correct: false });
  }
  var question = "Emergency calls arrive at a fire station at an average rate of " + lam +
    " per hour. Assuming a Poisson process, what is the probability of exactly " + k +
    " call" + (k === 1 ? "" : "s") + " in the next " + (t === 1 ? "hour" : t + " hours") + "?";
  var pow = Math.pow(lamt, k), kf = fact(k);
  var exp5 = Math.exp(-lamt).toFixed(5);
  var prod4 = (pow * Math.exp(-lamt)).toFixed(4);
  var solution =
    "Refer to the Poisson distribution in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(P(X = " + k + ")\\). The handbook prints:\n\n" +
    "$$f(x; \\lambda) = \\frac{\\lambda^x e^{-\\lambda}}{x!}$$\n\n" +
    (t === 1
      ? "Here \\(\\lambda = " + lam + "\\) and \\(x = " + k + "\\):\n\n"
      : "Scale the rate to the " + t + "-hour interval: \\(\\lambda = " + lam + " \\times " + t + " = " + lamt + "\\).\n\n" +
        "Here \\(\\lambda = " + lamt + "\\) and \\(x = " + k + "\\):\n\n") +
    "$$(P) = \\frac{" + lamt + "^{" + k + "} e^{-" + lamt + "}}{" + k + "!} = " +
    "\\frac{" + pow + "(" + exp5 + ")}{" + kf + "}$$\n\n" +
    "$$(P) = \\frac{" + prod4 + "}{" + kf + "} = " + fmt(correct) + "$$";
  return {
    variantKey: "lam" + lam + "t" + t + "k" + k,
    question: question,
    options: [{ label: fmt(correct), num: correct, correct: true }].concat(chosen),
    solution: solution
  };
}));

// ---------- stats-028: CLT sampling distribution of the mean ----------
PART.push(buildGenerator({
  baseId: "stats-028",
  subtopic: "Central limit theorem (sampling distribution)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The Central Limit Theorem centers the sampling distribution on the population mean and shrinks its spread by the square root of the sample size -- the population shape does not matter for large n.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var n = pick([16, 25, 36, 49, 64, 100]);
  var root = Math.sqrt(n);
  var se = ri(1, 6);          // sampling SD, exact by construction
  var sig = se * root;        // population SD
  var mu = ri(4, 20) * 5;     // population mean
  var question = "A population has a mean of " + mu + " and a standard deviation of " + sig +
    ". For random samples of n = " + n +
    ", what are the mean and standard deviation of the sampling distribution of the sample mean?";
  var solution =
    "Refer to The Central Limit Theorem in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the sampling distribution parameters. The handbook prints that for large \\(n\\), the sample mean is approximately normal with:\n\n" +
    "$$\\begin{aligned}\n" +
    "\\mu_{\\bar{x}} &= \\mu \\\\\n" +
    "\\sigma_{\\bar{x}} &= \\frac{\\sigma}{\\sqrt{n}}\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\mu_{\\bar{x}}) = " + mu + "$$\n\n" +
    "$$(\\sigma_{\\bar{x}}) = \\frac{" + sig + "}{\\sqrt{" + n + "}} = \\frac{" + sig + "}{" + root + "} = " + se + "$$";
  return {
    variantKey: "mu" + mu + "sig" + sig + "n" + n,
    question: question,
    options: [
      { label: "Mean " + mu + ", SD " + se, correct: true, num: null },
      { label: "Mean " + mu + ", SD " + sig, correct: false, num: null },       // forgot to scale sigma
      { label: "Mean " + mu + ", SD " + fmt(sig / n), correct: false, num: null }, // divided by n, not sqrt(n)
      { label: "Mean " + fmt(mu / root) + ", SD " + se, correct: false, num: null } // scaled the mean too
    ],
    solution: solution
  };
}));

// ---------- stats-029: t-statistic for a mean ----------
PART.push(buildGenerator({
  baseId: "stats-029",
  subtopic: "t-statistic for a mean",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The standard error is s divided by the square root of n, not s -- forgetting the square root of the sample size is the most common mistake. The negative sign reflects that the sample mean fell below the hypothesized value.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var d = pick([4, 5, 6, 7]);       // sqrt(n)
  var n = d * d;
  var se = pick([1, 2]);            // s / sqrt(n), the standard error
  var s = se * d;
  var tmag = pick([0.9, 1.8, 2.7]);
  var sign = pick([1, -1]);
  var diff = sign * se * tmag;      // xbar - mu0
  var mu0 = pick([40, 45, 50, 55, 60]);
  var xbar = mu0 + diff;
  var t = diff / se;                // clean 1-decimal t
  var question = "A random sample of " + n + " measurements has a sample mean of " + xbar.toFixed(1) +
    " and a sample standard deviation of " + s.toFixed(1) +
    ". What is the value of the t-statistic for testing the hypothesis that the population mean is " + mu0 + "?";
  var solution =
    "Refer to the t-Distribution section in the Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(t\\). The handbook prints:\n\n" +
    "$$t = \\frac{\\bar{x} - \\mu}{s/\\sqrt{n}}$$\n\n" +
    "Substituting:\n\n" +
    "$$(t) = \\frac{" + xbar.toFixed(1) + " - " + mu0 + "}{" + s.toFixed(1) + "/\\sqrt{" + n + "}}$$\n\n" +
    "$$(t) = \\frac{" + texNum(diff) + "}{" + se.toFixed(1) + "} = " + texNum(t) + "$$";
  return {
    variantKey: "n" + n + "mu0" + mu0 + "xb" + xbar.toFixed(1) + "s" + s,
    question: question,
    options: [
      { label: sgn(t), num: t, correct: true },
      { label: sgn(-t), num: -t, correct: false },       // sign flip
      { label: sgn(t / d), num: t / d, correct: false }, // forgot sqrt(n): (xbar-mu0)/s
      { label: sgn(2 * t), num: 2 * t, correct: false }  // doubled
    ],
    solution: solution
  };
}));

// ---------- stats-030: permutations (officer election) ----------
PART.push(buildGenerator({
  baseId: "stats-030",
  subtopic: "Permutations (officer election)",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "The offices are distinct, so order matters -- this is a permutation, not a combination. Dividing by the factorial of the offices (the 210 answer) treats the distinct offices as interchangeable.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var n = ri(6, 10), r = ri(2, 4);
  var correct = nPr(n, r);
  var offices = ["a president", "a vice president", "a secretary", "a treasurer"].slice(0, r);
  var phrase = r === 2
    ? offices[0] + " and " + offices[1]
    : offices.slice(0, r - 1).join(", ") + ", and " + offices[r - 1];
  var question = "A club must elect " + phrase + " from " + n +
    " members. No member may hold more than one office. How many different slates of officers are possible?";
  var chain = [];
  for (var i = 0; i < r; i++) chain.push(n - i);
  var solution =
    "Refer to the Permutations and Combinations section in the Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must compute \\(P(" + n + ", " + r + ")\\). The handbook prints:\n\n" +
    "$$P(n, r) = \\frac{n!}{(n - r)!}$$\n\n" +
    "Substituting:\n\n" +
    "$$(P(" + n + "," + r + ")) = \\frac{" + n + "!}{" + (n - r) + "!} = " +
    chain.join(" \\times ") + " = " + wC_grp(correct) + "$$";
  return {
    variantKey: "n" + n + "r" + r,
    question: question,
    options: [
      { label: fmt(correct), num: correct, correct: true },
      { label: fmt(nCr(n, r)), num: nCr(n, r), correct: false },       // combination, offices treated as identical
      { label: fmt(Math.pow(n, r)), num: Math.pow(n, r), correct: false }, // allowed repeat office-holding
      { label: fmt(fact(n)), num: fact(n), correct: false }            // permuted all members
    ],
    solution: solution,
    tiTip: "Yes — direct solve: tap the probability key 3× to reach nPr (! → nCr → nPr), then enter " + n + " nPr " + r + "."
  };
}));

// ---------- stats-031: standard error of the estimate ----------
PART.push(buildGenerator({
  baseId: "stats-031",
  subtopic: "Standard error of estimate",
  difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "The formula gives the variance S_e squared -- the standard error is its square root. Stopping at 1.62 answers a different question.",
  videoUrl: null,
  videoTitle: null
}, function () {
  // Constructed so the answer is exact: Sxx = d^2, Sxy = d*m,
  // Syy = m^2 + (n-2)*k^2  =>  Se = k exactly.
  var d, m, k, n, Sxx, Sxy, Syy;
  var ok = false, tries = 0, u, v;
  while (!ok && tries < 500) {
    tries++;
    d = ri(2, 5); m = ri(3, 6); k = ri(1, 3); n = ri(10, 13);
    Sxx = d * d; Sxy = d * m; Syy = m * m + (n - 2) * k * k;
    var vals = [k, k * Math.SQRT2, k / 2, Math.sqrt(Syy / (n - 2))];
    ok = true;
    for (u = 0; u < vals.length && ok; u++)
      for (v = u + 1; v < vals.length && ok; v++)
        if (Math.abs(vals[u] - vals[v]) < 0.01) ok = false;
  }
  var num = Sxx * Syy - Sxy * Sxy, den = Sxx * (n - 2);
  var question = "A linear regression on \\(n = " + n + "\\) observations yields " +
    "\\(S_{xx} = " + Sxx + "\\), \\(S_{yy} = " + Syy + "\\), and \\(S_{xy} = " + Sxy +
    "\\). What is the standard error of the estimate \\(S_e\\)?";
  var solution =
    "Refer to the Linear Regression section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(S_e\\). The handbook prints:\n\n" +
    "$$S_e^2 = \\frac{S_{xx} S_{yy} - S_{xy}^2}{S_{xx}(n - 2)} = MSE$$\n\n" +
    "Substituting:\n\n" +
    "$$(S_e^2) = \\frac{(" + Sxx + ")(" + Syy + ") - " + Sxy + "^2}{" + Sxx + "(" + n + " - 2)}$$\n\n" +
    "$$(S_e^2) = \\frac{" + num + "}{" + den + "} = " + (k * k) + "$$\n\n" +
    "Taking the square root:\n\n" +
    "$$(S_e) = \\sqrt{" + (k * k) + "} = " + k + "$$";
  return {
    variantKey: "d" + d + "m" + m + "k" + k + "n" + n,
    question: question,
    options: [
      { label: fmt(k), num: k, correct: true },
      { label: fmt(k * Math.SQRT2), num: k * Math.SQRT2, correct: false },
      { label: fmt(k / 2), num: k / 2, correct: false },
      { label: fmt(Math.sqrt(Syy / (n - 2))), num: Math.sqrt(Syy / (n - 2)), correct: false } // forgot to subtract the regression SS
    ],
    solution: solution
  };
}));

// ---------- stats-032: one-way ANOVA F-statistic ----------
PART.push(buildGenerator({
  baseId: "stats-032",
  subtopic: "One-way ANOVA (F-statistic)",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "\\(F = MST/MSE\\) with \\(MST = SS_{treatments}/(k-1)\\) and \\(MSE = SS_{error}/(N-k)\\). Dividing the raw sums of squares (150/400 = 0.375) skips the degrees of freedom.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var t, dfW, MSW, F;
  var ok = false, tries = 0, u, v;
  while (!ok && tries < 500) {
    tries++;
    t = ri(3, 5);
    dfW = pick([12, 15, 16, 18, 20, 24]);
    MSW = pick([4, 5, 8, 10, 12, 20]);
    F = pick([1.5, 2, 2.5, 3, 4]);
    var dfB = t - 1;
    var vals = [F, 1 / F, F * dfB / dfW, dfB / dfW];
    ok = true;
    for (u = 0; u < vals.length && ok; u++)
      for (v = u + 1; v < vals.length && ok; v++)
        if (Math.abs(vals[u] - vals[v]) < 0.002) ok = false;
  }
  var dfB2 = t - 1, N = t + dfW;
  var MSB = F * MSW;
  var SSB = MSB * dfB2, SSW = MSW * dfW;
  var question = "A one-way ANOVA compares " + t + " treatments using " + N + " total observations. " +
    "The sum of squares between treatments is " + fmt(SSB) + " and the sum of squares for error is " +
    fmt(SSW) + ". What is the F-statistic for testing whether the treatment means differ?";
  var solution =
    "Refer to the One-Way Analysis of Variance (ANOVA) section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(F\\). The handbook's ANOVA table prints:\n\n" +
    "$$F = \\frac{MST}{MSE} \\qquad MST = \\frac{SS_{treatments}}{k-1} \\qquad MSE = \\frac{SS_{error}}{N-k}$$\n\n" +
    "Computing the mean squares:\n\n" +
    "$$MST = \\frac{" + fmt(SSB) + "}{" + t + "-1} = \\frac{" + fmt(SSB) + "}{" + dfB2 + "} = " + fmt(MSB) + "$$\n\n" +
    "$$MSE = \\frac{" + fmt(SSW) + "}{" + N + "-" + t + "} = \\frac{" + fmt(SSW) + "}{" + dfW + "} = " + fmt(MSW) + "$$\n\n" +
    "Forming the ratio:\n\n" +
    "$$F = \\frac{" + fmt(MSB) + "}{" + fmt(MSW) + "} = " + fmt(F) + "$$";
  return {
    variantKey: "t" + t + "dfW" + dfW + "MSW" + MSW + "F" + F,
    question: question,
    options: [
      { label: fmt(F), num: F, correct: true },
      { label: fmt(1 / F), num: 1 / F, correct: false },                 // inverted ratio
      { label: fmt(SSB / SSW), num: SSB / SSW, correct: false },         // raw sums of squares, no d.f.
      { label: fmt(dfB2 / dfW), num: dfB2 / dfW, correct: false }        // ratio of degrees of freedom
    ],
    solution: solution
  };
}));

// ---------- stats-034: chi-square distribution (degrees of freedom) ----------
PART.push(buildGenerator({
  baseId: "stats-034",
  subtopic: "Chi-square distribution",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "The handbook defines the chi-square distribution with \\(n\\) degrees of freedom as the sum of squares of \\(n\\) independent unit normal variables.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var k = ri(3, 8); // only 6 variants; acceptable for this near-conceptual question
  var zlist = [], zsq = [];
  for (var i = 1; i <= k; i++) { zlist.push("Z_" + i); zsq.push("Z_" + i + "^2"); }
  var question = "Let \\(" + zlist.join(", ") + "\\) be independent standard normal random variables. " +
    "What is the distribution of \\(W = " + zsq.join(" + ") + "\\)?";
  var solution =
    "Refer to the Chi-Square Distribution section in the Engineering Probability and Statistics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must identify the distribution of \\(W\\). The handbook prints:\n\n" +
    "\"If \\(Z_1, Z_2, \\ldots, Z_n\\) are independent unit normal random variables, then " +
    "\\(\\chi^2 = Z_1^2 + Z_2^2 + \\cdots + Z_n^2\\) is said to have a chi-square distribution with " +
    "\\(n\\) degrees of freedom.\"\n\n" +
    "Here \\(n = " + k + "\\).\n\n" +
    "Therefore \\(W\\) has a chi-square distribution with " + k + " degrees of freedom.";
  return {
    variantKey: "k" + k,
    question: question,
    options: [
      { label: "Chi-square with " + k + " degrees of freedom", correct: true, num: null },
      { label: "Normal with mean " + k, correct: false, num: null },
      { label: "t with " + k + " degrees of freedom", correct: false, num: null },
      { label: "F with (" + k + ", " + k + ") degrees of freedom", correct: false, num: null }
    ],
    solution: solution
  };
}));


/* ============ 2026-10 expansion entries (stats-035..068) ============
 * One entry per numerical new bank question. Citations reuse the bank
 * question's own reviewed citation verbatim. Dataset-based entries roll
 * from preset families that include the bank's reviewed dataset.
 */
var r3s = function (x) { return Math.round(x * 1000) / 1000; };
var r1d = function (x) { return Math.round(x * 10) / 10; };
var pdot = function (x) { return String(x).replace(/\./g, "p").replace(/-/g, "m"); };
var sMean = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
var sVar = function (a) { var m = sMean(a); return a.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / (a.length - 1); };
var r2s = function (x) { return Math.round(x * 100) / 100; };
var r4s = function (x) { return Math.round(x * 10000) / 10000; };
var f2 = function (x) { return (Math.round(x * 100) / 100).toFixed(2); };
var f4 = function (x) { return (Math.round(x * 10000) / 10000).toFixed(4); };
// Abramowitz-Stegun 26.2.17-style normal CDF (|err| < 2e-4 at 4 dp via 7.1.26)
var phiCdf = function (x) {
  var t = 1 / (1 + 0.2316419 * Math.abs(x));
  var d = 0.3989423 * Math.exp(-x * x / 2);
  var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
};
var CIT_P1 = " in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page ";

// ---------------------------------------------------------------- stats-035
// Sample standard deviation (dataset family).
PART.push(buildGenerator({ baseId: "stats-035", subtopic: "Sample standard deviation", difficulty: "medium",
  estimatedTimeSeconds: 180,
  explanation: "Divide by n\u22121 for a SAMPLE - dividing by n is the population formula and the main trap. The mean and the variance itself are the other two decoys."
}, function () {
  var sets = [
    [12, 15, 11, 18, 14, 20, 16],
    [10, 14, 12, 16, 18, 11, 17],
    [21, 25, 19, 28, 23, 30, 26],
    [8, 12, 9, 15, 11, 14, 10]
  ];
  var di = ri(0, sets.length - 1), data = sets[di], n = data.length;
  var mean = sMean(data), vr = sVar(data), sd = Math.sqrt(vr);
  var sdN = Math.sqrt(vr * (n - 1) / n);   // divided by n (population)
  var question = "A sample has the values " + data.join(", ") + ". What is the sample standard deviation?";
  var solution = "Refer to sample statistics (mean, variance, standard deviation) in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 64 (PDF page 70).\n\n" +
    "Mean \\(\\bar x = " + f2(mean) + "\\). \\(\\sum(x-\\bar x)^2 = " + f2(vr * (n - 1)) + "\\).\n\n" +
    "$$\\begin{aligned}s &= \\sqrt{\\frac{\\sum(x_i - \\bar x)^2}{n-1}} \\\\ &= \\sqrt{\\frac{" + f2(vr * (n - 1)) + "}{" + (n - 1) + "}} \\\\ &= " + f2(sd) + "\\end{aligned}$$";
  return {
    variantKey: "set" + di,
    question: question,
    options: [
      { label: f2(sd), num: r2s(sd), correct: true },
      { label: f2(vr), num: r2s(vr), correct: false },
      { label: f2(sdN), num: r2s(sdN), correct: false },
      { label: f2(mean), num: r2s(mean), correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-036
// Binomial probability b(x; n, p).
PART.push(buildGenerator({ baseId: "stats-036", subtopic: "Binomial probability", difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "b(x;n,p) = C(n,x)p^x(1\u2212p)^(n\u2212x). The decoys are the expected value np, p^x alone, and the cumulative-style slip."
}, function () {
  var cases = [
    { n: 10, x: 3, p: 0.3 }, { n: 8, x: 2, p: 0.25 }, { n: 12, x: 4, p: 0.3 },
    { n: 10, x: 2, p: 0.2 }, { n: 6, x: 2, p: 0.4 }, { n: 9, x: 3, p: 0.5 }
  ];
  var c = cases[ri(0, cases.length - 1)];
  var C = function (n, k2) { var r = 1; for (var i = 0; i < k2; i++) r = r * (n - i) / (i + 1); return r; };
  var ans = C(c.n, c.x) * Math.pow(c.p, c.x) * Math.pow(1 - c.p, c.n - c.x);
  var tNP = c.n * c.p, tPx = Math.pow(c.p, c.x), tNoC = Math.pow(c.p, c.x) * Math.pow(1 - c.p, c.n - c.x);
  var question = "A process fails with probability " + c.p + " on each independent trial. What is the probability of exactly " + c.x + " failures in " + c.n + " trials?";
  var solution = "Refer to Binomial distribution b(x; n, p) in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 85 (PDF page 91).\n\n" +
    "$$\\begin{aligned}b(" + c.x + ";" + c.n + "," + c.p + ") &= \\binom{" + c.n + "}{" + c.x + "}(" + c.p + ")^" + c.x + "(" + f2(1 - c.p) + ")^" + (c.n - c.x) + " \\\\ &= " + f4(ans) + "\\end{aligned}$$";
  return {
    variantKey: "n" + c.n + "_x" + c.x + "_p" + pdot(c.p),
    question: question,
    options: [
      { label: f4(ans), num: r4s(ans), correct: true },
      { label: f4(tNP), num: r4s(tNP), correct: false },
      { label: f4(tPx), num: r4s(tPx), correct: false },
      { label: f4(tNoC), num: r4s(tNoC), correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-038
// Poisson probability.
PART.push(buildGenerator({ baseId: "stats-038", subtopic: "Poisson probability", difficulty: "medium",
  estimatedTimeSeconds: 150,
  explanation: "f(x;\u03BB) = \u03BB^x e^(\u2212\u03BB)/x!. The decoys drop the x! or use \u03BB in place of x."
}, function () {
  var cases = [ { l: 4, x: 2 }, { l: 3, x: 2 }, { l: 5, x: 3 }, { l: 2, x: 3 }, { l: 4, x: 3 }, { l: 6, x: 2 } ];
  var c = cases[ri(0, cases.length - 1)];
  var fact = function (n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; };
  var ans = Math.pow(c.l, c.x) * Math.exp(-c.l) / fact(c.x);
  var tNoFact = Math.pow(c.l, c.x) * Math.exp(-c.l);
  var tSwap = Math.pow(c.x, c.l) * Math.exp(-c.x) / fact(c.l);
  var tMean = 1 / c.l;
  var question = "Defects occur at an average rate of " + c.l + " per day (Poisson). What is the probability of exactly " + c.x + " defects in a day?";
  var solution = "Refer to Poisson distribution in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 85 (PDF page 91).\n\n" +
    "$$\\begin{aligned}f(" + c.x + ";" + c.l + ") &= \\frac{\\lambda^xe^{-\\lambda}}{x!} \\\\ &= \\frac{" + c.l + "^" + c.x + "e^{-" + c.l + "}}{" + c.x + "!} \\\\ &= " + f4(ans) + "\\end{aligned}$$";
  return {
    variantKey: "l" + c.l + "_x" + c.x,
    question: question,
    options: [
      { label: f4(ans), num: r4s(ans), correct: true },
      { label: f4(tNoFact), num: r4s(tNoFact), correct: false },
      { label: f4(tSwap), num: r4s(tSwap), correct: false },
      { label: f4(tMean), num: r4s(tMean), correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-040
// Sample variance from data (dataset family).
PART.push(buildGenerator({ baseId: "stats-040", subtopic: "Sample variance from data", difficulty: "medium",
  estimatedTimeSeconds: 180,
  explanation: "Sample variance divides by n\u22121. The sum of squares itself, the sd, and the mean are the decoys."
}, function () {
  var sets = [
    [12, 15, 11, 18, 14, 20],
    [10, 14, 12, 16, 18, 11],
    [22, 26, 20, 29, 24, 31],
    [7, 11, 8, 14, 10, 13]
  ];
  var di = ri(0, sets.length - 1), data = sets[di], n = data.length;
  var mean = sMean(data), vr = sVar(data), ss = vr * (n - 1), sd = Math.sqrt(vr);
  var question = "A sample of " + n + " concrete cylinder strengths (ksi x 0.1) reads " + data.join(", ") + ". What is the sample variance?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 64 (PDF page 70).\n\n" +
    "The mean is " + f2(mean) + ". The handbook sample variance divides by n \u2212 1:\n\n" +
    "$$\\begin{aligned}s^2 &= \\frac{1}{n-1}\\sum (X_i-\\bar X)^2 \\\\ &= \\frac{" + f2(ss) + "}{" + (n - 1) + "} \\\\ &= " + f2(vr) + "\\end{aligned}$$";
  return {
    variantKey: "set" + di,
    question: question,
    options: [
      { label: f2(vr), num: r2s(vr), correct: true },
      { label: f2(ss), num: r2s(ss), correct: false },
      { label: f2(sd), num: r2s(sd), correct: false },
      { label: f2(mean), num: r2s(mean), correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-041
// Weighted arithmetic mean.
PART.push(buildGenerator({ baseId: "stats-041", subtopic: "Weighted arithmetic mean", difficulty: "easy",
  estimatedTimeSeconds: 120,
  explanation: "\u03A3wx/\u03A3w. The plain average of the three scores ignores the weights; the un-divided sum is the decimal-slip decoy."
}, function () {
  var sets = [
    { w: [2, 3, 5], x: [85, 90, 78], names: ["homework", "a midterm", "a final"] },
    { w: [1, 2, 3], x: [88, 82, 91], names: ["quiz work", "a midterm", "a final"] },
    { w: [3, 3, 4], x: [76, 84, 90], names: ["labs", "a project", "a final"] },
    { w: [2, 2, 6], x: [92, 84, 86], names: ["homework", "a midterm", "a final"] }
  ];
  var di = ri(0, sets.length - 1), s = sets[di];
  var sw = s.w[0] + s.w[1] + s.w[2];
  var swx = s.w[0] * s.x[0] + s.w[1] * s.x[1] + s.w[2] * s.x[2];
  var wm = r1d(swx / sw);
  var plain = r1d((s.x[0] + s.x[1] + s.x[2]) / 3);
  var tSum = r1d(swx), tMax = Math.max(s.x[0], s.x[1], s.x[2]);
  var question = "A course grade uses " + s.names[0] + " (weight " + s.w[0] + ") with a score of " + s.x[0] + ", " + s.names[1] + " (weight " + s.w[1] + ") with " + s.x[1] + " and " + s.names[2] + " (weight " + s.w[2] + ") with " + s.x[2] + ". What is the weighted mean?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 64 (PDF page 70).\n\n" +
    "$$\\begin{aligned}\\bar X_w &= \\frac{\\sum w_iX_i}{\\sum w_i} \\\\ &= \\frac{" + s.w[0] + "(" + s.x[0] + ")+" + s.w[1] + "(" + s.x[1] + ")+" + s.w[2] + "(" + s.x[2] + ")}{" + sw + "} \\\\ &= " + f2(wm) + "\\end{aligned}$$";
  return {
    variantKey: "set" + di,
    question: question,
    options: [
      { label: f2(wm), num: wm, correct: true },
      { label: f2(plain), num: plain, correct: false },
      { label: tMax.toFixed(1), num: tMax, correct: false },
      { label: tSum.toFixed(1), num: tSum, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-042
// Median, even count (dataset family).
PART.push(buildGenerator({ baseId: "stats-042", subtopic: "Median, even count", difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Even n: sort, then average the two middle values. The decoys are a single middle value, the mean, and an unsorted middle."
}, function () {
  var sets = [
    [7, 3, 9, 4, 8, 12],
    [5, 2, 11, 6, 9, 14],
    [15, 8, 21, 10, 18, 25],
    [4, 1, 9, 3, 7, 12]
  ];
  var di = ri(0, sets.length - 1), data = sets[di];
  var srt = data.slice().sort(function (a, b) { return a - b; });
  var h = srt.length / 2;
  var med = (srt[h - 1] + srt[h]) / 2;
  var mean = sMean(data);
  var question = "What is the median of the data set " + data.join(", ") + "?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 64 (PDF page 70).\n\n" +
    "Sorted: " + srt.join(", ") + ". With n = " + srt.length + " (even) the median is the average of the (n/2)th and (n/2 + 1)th items: (" + srt[h - 1] + " + " + srt[h] + ")/2 = " + f2(med) + ".";
  return {
    variantKey: "set" + di,
    question: question,
    options: [
      { label: f2(med), num: med, correct: true },
      { label: f2(srt[h]), num: srt[h], correct: false },
      { label: f2(mean), num: r2s(mean), correct: false },
      { label: f2(srt[h - 1]), num: srt[h - 1], correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-043
// Standard deviation of the mean.
PART.push(buildGenerator({ baseId: "stats-043", subtopic: "Standard deviation of the mean", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "\u03C3_mean = \u03C3/\u221An, not \u03C3/n and not \u03C3\u00D7\u221An."
}, function () {
  var sig = pick([4, 6, 8, 10]), n = pick([16, 25, 36, 49]);
  var ans = r2s(sig / Math.sqrt(n));
  var tN = r2s(sig / n), tMul = r2s(sig * Math.sqrt(n)), tSame = sig;
  var question = "Individual measurements have a standard deviation of " + f2(sig) + " psi. What is the standard deviation of the mean of " + n + " independent measurements?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 64 (PDF page 70).\n\n" +
    "The handbook gives \\(\\sigma_{mean} = \\sigma/\\sqrt{n}\\):\n\n" +
    "$$\\begin{aligned}\\sigma_{mean} &= \\frac{" + f2(sig) + "}{\\sqrt{" + n + "}} \\\\ &= " + f2(ans) + "\\ \\text{psi}\\end{aligned}$$";
  return {
    variantKey: "s" + sig + "_n" + n,
    question: question,
    options: [
      { label: f2(ans) + " psi", num: ans, correct: true },
      { label: f2(tN) + " psi", num: tN, correct: false },
      { label: f2(tSame) + " psi", num: tSame, correct: false },
      { label: f2(tMul) + " psi", num: tMul, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-044
// Standard deviation of a sum (quadrature).
PART.push(buildGenerator({ baseId: "stats-044", subtopic: "Standard deviation of a sum", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Independent sigmas add in QUADRATURE: \u221A(\u03C31\u00B2+\u03C32\u00B2+\u03C33\u00B2). Plain addition is the trap; the sum of squares is the other."
}, function () {
  var sets = [ [3, 4, 12], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15] ];
  var di = ri(0, sets.length - 1), s = sets[di];
  var ss = s[0] * s[0] + s[1] * s[1] + s[2] * s[2];
  var ans = r2s(Math.sqrt(ss));
  var tAdd = s[0] + s[1] + s[2], tSS = ss, tMax = Math.max(s[0], s[1], s[2]);
  var question = "Three independent loads have standard deviations of " + s[0] + ", " + s[1] + " and " + s[2] + " kips. What is the standard deviation of their sum?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 64 (PDF page 70).\n\n" +
    "Independent standard deviations add in quadrature (\\(\\sigma_{sum} = \\sqrt{\\sigma_1^2+\\sigma_2^2+\\dots}\\)):\n\n" +
    "$$\\begin{aligned}\\sigma_{sum} &= \\sqrt{" + s[0] + "^2+" + s[1] + "^2+" + s[2] + "^2} \\\\ &= \\sqrt{" + ss + "} \\\\ &= " + f2(ans) + "\\ \\text{kips}\\end{aligned}$$";
  return {
    variantKey: "set" + di,
    question: question,
    options: [
      { label: f2(ans) + " kips", num: ans, correct: true },
      { label: f2(tSS) + " kips", num: tSS, correct: false },
      { label: f2(tAdd) + " kips", num: tAdd, correct: false },
      { label: f2(tMax) + " kips", num: tMax, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-045
// Sample geometric mean (dataset family).
PART.push(buildGenerator({ baseId: "stats-045", subtopic: "Sample geometric mean", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Geometric mean = nth root of the product. The arithmetic mean and RMS are the natural decoys."
}, function () {
  var sets = [ [2, 8, 4, 16], [3, 9, 27, 1], [2, 4, 8, 32], [5, 10, 20, 40], [1, 4, 16, 64] ];
  var di = ri(0, sets.length - 1), d = sets[di], n = d.length;
  var prod = d.reduce(function (a, b) { return a * b; }, 1);
  var gm = Math.pow(prod, 1 / n);
  var am = sMean(d);
  var rms = Math.sqrt(d.reduce(function (a, b) { return a + b * b; }, 0) / n);
  var harm = n / d.reduce(function (a, b) { return a + 1 / b; }, 0);
  var question = "What is the geometric mean of " + d.join(", ") + "?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 64 (PDF page 70).\n\n" +
    "$$\\begin{aligned}\\sqrt[n]{X_1X_2\\cdots X_n} &= \\sqrt[" + n + "]{" + prod + "} \\\\ &= " + f2(gm) + "\\end{aligned}$$";
  return {
    variantKey: "set" + di,
    question: question,
    options: [
      { label: f2(gm), num: r2s(gm), correct: true },
      { label: f2(harm), num: r2s(harm), correct: false },
      { label: f2(rms), num: r2s(rms), correct: false },
      { label: f2(am), num: r2s(am), correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-046
// Root-mean-square value (dataset family).
PART.push(buildGenerator({ baseId: "stats-046", subtopic: "Root-mean-square value", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "RMS = \u221A(\u03A3x\u00B2/n). The mean of squares (no root), the arithmetic mean, and the geometric mean are the decoys."
}, function () {
  var sets = [ [2, 8, 4, 16], [3, 9, 27, 1], [2, 4, 8, 32], [5, 10, 20, 40], [1, 4, 16, 64] ];
  var di = ri(0, sets.length - 1), d = sets[di], n = d.length;
  var ms = d.reduce(function (a, b) { return a + b * b; }, 0) / n;
  var rms = Math.sqrt(ms);
  var am = sMean(d);
  var gm = Math.pow(d.reduce(function (a, b) { return a * b; }, 1), 1 / n);
  var question = "What is the sample root-mean-square value of " + d.join(", ") + "?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 64 (PDF page 70).\n\n" +
    "$$\\begin{aligned}\\sqrt{\\frac{1}{n}\\sum X_i^2} &= \\sqrt{\\frac{" + fmt(ms * n) + "}{" + n + "}} \\\\ &= " + f2(rms) + "\\end{aligned}$$";
  return {
    variantKey: "set" + di,
    question: question,
    options: [
      { label: f2(rms), num: r2s(rms), correct: true },
      { label: f2(am), num: r2s(am), correct: false },
      { label: f2(ms), num: r2s(ms), correct: false },
      { label: f2(gm), num: r2s(gm), correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-047
// Binomial variance np(1-p).
PART.push(buildGenerator({ baseId: "stats-047", subtopic: "Binomial mean and variance", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "Variance is np(1\u2212p); np alone is the MEAN. The sd \u221A(np(1\u2212p)) and np\u00B2 are the other decoys."
}, function () {
  var cases = [ { n: 12, p: 0.15 }, { n: 20, p: 0.1 }, { n: 10, p: 0.3 }, { n: 15, p: 0.2 }, { n: 8, p: 0.25 }, { n: 25, p: 0.12 } ];
  var c = cases[ri(0, cases.length - 1)];
  var vr = r2s(c.n * c.p * (1 - c.p)), mean = r2s(c.n * c.p), sd = r2s(Math.sqrt(c.n * c.p * (1 - c.p))), tP2 = r2s(c.n * c.p * c.p);
  var question = "A binomial experiment has n = " + c.n + " trials and p = " + c.p + ". What is its variance?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 85 (PDF page 91).\n\n" +
    "From the table, the binomial variance is \\(np(1-p)\\) = " + c.n + "(" + c.p + ")(" + f2(1 - c.p) + ") = " + f2(vr) + ".";
  return {
    variantKey: "n" + c.n + "_p" + pdot(c.p),
    question: question,
    options: [
      { label: f2(vr), num: vr, correct: true },
      { label: f2(mean), num: mean, correct: false },
      { label: f2(tP2), num: tP2, correct: false },
      { label: f2(sd), num: sd, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-048
// Poisson variance = lambda.
PART.push(buildGenerator({ baseId: "stats-048", subtopic: "Poisson mean and variance", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Poisson: mean = \u03BB AND variance = \u03BB. The squared value, \u221A\u03BB, and 1/\u03BB are the decoys."
}, function () {
  var l = pick([2.5, 3.2, 4.5, 1.8, 5.6]);
  var vr = l, tSq = r2s(l * l), tRt = r2s(Math.sqrt(l)), tInv = r2s(1 / l);
  var question = "A Poisson count has a mean of " + l + " events per interval. What is its variance?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 85 (PDF page 91).\n\n" +
    "For the Poisson distribution the table gives mean = \\(\\lambda\\) and variance = \\(\\lambda\\), so the variance is " + l + ".";
  return {
    variantKey: "l" + pdot(l),
    question: question,
    options: [
      { label: fmt(vr), num: vr, correct: true },
      { label: f2(tSq), num: tSq, correct: false },
      { label: f2(tInv), num: tInv, correct: false },
      { label: f2(tRt), num: tRt, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-049
// Exponential distribution variance = beta^2.
PART.push(buildGenerator({ baseId: "stats-049", subtopic: "Exponential distribution mean and variance", difficulty: "medium",
  estimatedTimeSeconds: 60,
  explanation: "Exponential: mean = \u03B2, variance = \u03B2\u00B2. \u03B2 itself, 2\u03B2, and 1/\u03B2\u00B2 are the decoys."
}, function () {
  var b = pick([2, 3, 4, 5, 6]);
  var vr = b * b, t2b = 2 * b, tInv = r4s(1 / (b * b)), tHalf = r2s(b * b / 4);
  var question = "An exponential distribution has a mean of " + f2(b) + " hours (the handbook parameter beta). What is its variance?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 85 (PDF page 91).\n\n" +
    "In the handbook table the exponential mean is \\(\\beta\\) and the variance is \\(\\beta^2\\) = " + vr + ".";
  return {
    variantKey: "b" + b,
    question: question,
    options: [
      { label: fmt(vr), num: vr, correct: true },
      { label: f2(b), num: b, correct: false },
      { label: f2(t2b), num: t2b, correct: false },
      { label: f4(tInv), num: tInv, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-050
// Uniform distribution variance.
PART.push(buildGenerator({ baseId: "stats-050", subtopic: "Uniform distribution variance", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "Uniform(a,b): variance (b\u2212a)\u00B2/12. The width (b\u2212a), the mean (a+b)/2, and (b\u2212a)\u00B2/4 (the triangular-looking slip) are the decoys."
}, function () {
  var cases = [ [10, 22], [5, 17], [2, 14], [4, 20], [8, 26] ];
  var c = cases[ri(0, cases.length - 1)], a = c[0], b2 = c[1], w = b2 - a;
  var vr = r2s(w * w / 12), mean = r2s((a + b2) / 2), tW = r2s(w / 2), tQ = r2s(w * w / 4);
  var question = "A random variable is uniformly distributed between " + a + " and " + b2 + ". What is its variance?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 85 (PDF page 91).\n\n" +
    "The table gives \\((b-a)^2/12\\) = " + (w * w) + "/12 = " + f2(vr) + ". The mean is (a + b)/2 = " + f2(mean) + ".";
  return {
    variantKey: "a" + a + "_b" + b2,
    question: question,
    options: [
      { label: f2(vr), num: vr, correct: true },
      { label: f2(tW), num: tW, correct: false },
      { label: f2(mean), num: mean, correct: false },
      { label: f2(tQ), num: tQ, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-051
// Geometric distribution mean = 1/p.
PART.push(buildGenerator({ baseId: "stats-051", subtopic: "Geometric distribution mean", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Geometric mean is 1/p trials. 1/p\u00B2, p itself, and 1/(1\u2212p) are the decoys."
}, function () {
  var p = pick([0.1, 0.2, 0.25, 0.4, 0.5]);
  var ans = r2s(1 / p), tSq = r2s(1 / (p * p)), tP = p, tQ = r2s(1 / (1 - p));
  var question = "A test passes with probability " + p + " on each independent trial. Using the geometric distribution, what is the expected number of trials until the first pass?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 85 (PDF page 91).\n\n" +
    "The handbook geometric mean is 1/p = 1/" + p + " = " + f2(ans) + " trials.";
  return {
    variantKey: "p" + pdot(p),
    question: question,
    options: [
      { label: f2(ans), num: ans, correct: true },
      { label: f2(tSq), num: tSq, correct: false },
      { label: f2(tP), num: tP, correct: false },
      { label: f2(tQ), num: tQ, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-052
// Hypergeometric mean nr/N.
PART.push(buildGenerator({ baseId: "stats-052", subtopic: "Hypergeometric mean", difficulty: "hard",
  estimatedTimeSeconds: 120,
  explanation: "Expected defectives without replacement: nr/N - the same as the binomial np with p = r/N. The decoys use n(1\u2212r/N), r itself, or binomial variance."
}, function () {
  var cases = [ { N: 20, r: 6, n: 5 }, { N: 25, r: 8, n: 4 }, { N: 30, r: 9, n: 5 }, { N: 16, r: 4, n: 6 }, { N: 24, r: 10, n: 6 } ];
  var c = cases[ri(0, cases.length - 1)];
  var ans = r2s(c.n * c.r / c.N);
  var tNq = r2s(c.n * (1 - c.r / c.N)), tR = c.r, tVar = r2s(c.n * (c.r / c.N) * (1 - c.r / c.N));
  var question = "A lot of " + c.N + " bolts contains " + c.r + " defective bolts. " + c.n + " are drawn without replacement. What is the expected number of defectives in the sample?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 85 (PDF page 91).\n\n" +
    "The hypergeometric mean is \\(nr/N\\) = " + c.n + "(" + c.r + ")/" + c.N + " = " + f2(ans) + ".";
  return {
    variantKey: "N" + c.N + "_r" + c.r + "_n" + c.n,
    question: question,
    options: [
      { label: f2(ans), num: ans, correct: true },
      { label: f2(tNq), num: tNq, correct: false },
      { label: f2(tR), num: tR, correct: false },
      { label: f2(tVar), num: tVar, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-053
// Triangular distribution mean.
PART.push(buildGenerator({ baseId: "stats-053", subtopic: "Triangular distribution mean", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "Triangular: mean = (a + b + m)/3 - the mode counts too. Averaging only the endpoints is the trap."
}, function () {
  var cases = [ { a: 2, m: 5, b: 14 }, { a: 1, m: 4, b: 12 }, { a: 3, m: 6, b: 18 }, { a: 2, m: 8, b: 20 }, { a: 5, m: 9, b: 25 } ];
  var c = cases[ri(0, cases.length - 1)];
  var ans = r2s((c.a + c.b + c.m) / 3);
  var tEnds = r2s((c.a + c.b) / 2), tMode = c.m, tMin = c.a;
  var question = "A task duration follows a triangular distribution with minimum " + c.a + ", mode " + c.m + " and maximum " + c.b + " days. What is the mean?";
  var solution = "Refer to Engineering Probability and Statistics in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 85 (PDF page 91).\n\n" +
    "The table gives mean = (a + b + m)/3 = (" + c.a + " + " + c.b + " + " + c.m + ")/3 = " + f2(ans) + " days.";
  return {
    variantKey: "a" + c.a + "_m" + c.m + "_b" + c.b,
    question: question,
    options: [
      { label: f2(ans), num: ans, correct: true },
      { label: f2(tEnds), num: tEnds, correct: false },
      { label: f2(tMode), num: tMode, correct: false },
      { label: f2(tMin), num: tMin, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-054
// Standard normal symmetry F(-x) = 1 - F(x).
PART.push(buildGenerator({ baseId: "stats-054", subtopic: "Standard normal symmetry, F(-x)", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "F(\u2212x) = 1 \u2212 F(x). The stated table value itself, 2F(\u2212x), and F(x)\u22120.5-type slips are the decoys."
}, function () {
  var x = pick([0.5, 0.8, 1.0, 1.2, 1.5, 1.8, 2.0]);
  var Fx = r4s(phiCdf(x));
  var Fnx = r4s(1 - Fx);
  var t2 = r4s(2 * Fnx), tHalf = r4s(Fx - 0.5);
  var question = "From a unit normal table, F(" + f2(x) + ") = " + f4(Fx) + ", where F(x) is the area under the curve from \u2212\u221E to x. Using the handbook's relation for negative arguments, what is F(\u2212" + f2(x) + ")?";
  var solution = "Refer to Normal Distribution in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 68 (PDF page 74).\n\n" +
    "The handbook gives \\(F(-x) = 1 - F(x)\\):\n\n" +
    "$$F(-" + f2(x) + ") = 1 - " + f4(Fx) + " = " + f4(Fnx) + "$$";
  return {
    variantKey: "x" + pdot(x),
    question: question,
    options: [
      { label: f4(Fnx), num: Fnx, correct: true },
      { label: f4(Fx), num: Fx, correct: false },
      { label: f4(t2), num: t2, correct: false },
      { label: f4(tHalf), num: tHalf, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-056
// t statistic for a sample mean.
PART.push(buildGenerator({ baseId: "stats-056", subtopic: "t statistic for a sample mean", difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "t = (x\u0304 \u2212 \u03BC)/(s/\u221An). Dividing by s instead of s/\u221An (or by \u221An alone) flips the magnitude."
}, function () {
  var n = pick([9, 16, 25]), s = pick([3, 6, 8]), mu = pick([50, 100]);
  var dm = pick([2, 4, 6]);                 // xbar - mu
  var xbar = mu + dm;
  var t = r2s(dm / (s / Math.sqrt(n)));
  var tNoSqrt = r2s(dm / s), tDivN = r3s(dm / (s / n)), tHalf = r2s(t / 2);
  var question = "A sample of n = " + n + " has a mean of " + xbar + " and a standard deviation of " + s + ". What is the t statistic for testing \u03BC = " + mu + "?";
  var solution = "Refer to t-Distribution in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 69 (PDF page 75).\n\n" +
    "The handbook gives \\(t = \\dfrac{\\bar x - \\mu}{s/\\sqrt n}\\):\n\n" +
    "$$t = \\frac{" + xbar + "-" + mu + "}{" + s + "/\\sqrt{" + n + "}} = " + f2(t) + "$$";
  return {
    variantKey: "n" + n + "_s" + s + "_mu" + mu + "_dm" + dm,
    question: question,
    options: [
      { label: f2(t), num: t, correct: true },
      { label: fmt(tNoSqrt), num: tNoSqrt, correct: false },
      { label: fmt(tDivN), num: tDivN, correct: false },
      { label: f2(tHalf), num: tHalf, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-057
// t-distribution symmetry t(1-a,v) = -t(a,v).
PART.push(buildGenerator({ baseId: "stats-057", subtopic: "t-distribution symmetry", difficulty: "medium",
  estimatedTimeSeconds: 60,
  explanation: "t(1\u2212\u03B1, \u03BD) = \u2212t(\u03B1, \u03BD). The positive table value is the trap; magnitude slips are the others."
}, function () {
  var cases = [ { a: "0.05", v: 10, t: 1.812 }, { a: "0.05", v: 15, t: 1.753 }, { a: "0.025", v: 10, t: 2.228 }, { a: "0.05", v: 20, t: 1.725 }, { a: "0.10", v: 10, t: 1.372 } ];
  var c = cases[ri(0, cases.length - 1)];
  var a2 = (1 - parseFloat(c.a)).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  var question = "A t table gives t(" + c.a + ", " + c.v + ") = " + c.t + ". Using the handbook's symmetry relation t(1\u2212\u03B1, \u03BD) = \u2212t(\u03B1, \u03BD), what is t(" + a2 + ", " + c.v + ")?";
  var solution = "Refer to t-Distribution in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 69 (PDF page 75).\n\n" +
    "The handbook notes that, in view of the symmetry of the t-distribution, \\(t_{1-\\alpha,\\nu} = -t_{\\alpha,\\nu}\\). So \\(t_{" + a2 + "," + c.v + "}\\) = " + MINUS + c.t + ".";
  return {
    variantKey: "a" + c.a + "_v" + c.v,
    question: question,
    options: [
      { label: MINUS + c.t, num: -c.t, correct: true },
      { label: MINUS + r2s(c.t - 1).toFixed(3), num: -(c.t - 1), correct: false },
      { label: fmt(r2s(1 - c.t)), num: r2s(1 - c.t), correct: false },
      { label: "" + c.t, num: c.t, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-058
// Degrees of freedom for the t-distribution.
PART.push(buildGenerator({ baseId: "stats-058", subtopic: "Degrees of freedom for the t-distribution", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "\u03BD = n \u2212 1. n itself, n + 1, and n \u2212 2 are the decoys."
}, function () {
  var n = pick([8, 10, 12, 15, 20, 25]);
  var question = "A sample of " + n + " observations is used with the t-distribution. According to the handbook, how many degrees of freedom does it have?";
  var solution = "Refer to t-Distribution in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 69 (PDF page 75).\n\n" +
    "The handbook gives \\(\\nu = n - 1 = " + n + " - 1 = " + (n - 1) + "\\).";
  return {
    variantKey: "n" + n,
    question: question,
    options: [
      { label: "" + (n - 1), num: n - 1, correct: true },
      { label: "" + n, num: n, correct: false },
      { label: "" + (n + 1), num: n + 1, correct: false },
      { label: "" + (n - 2), num: n - 2, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-059
// Chi-square degrees of freedom.
PART.push(buildGenerator({ baseId: "stats-059", subtopic: "Chi-square degrees of freedom", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "\u03C7\u00B2 of a sum of n squared unit normals has n degrees of freedom - it equals the COUNT, not n\u22121."
}, function () {
  var n = pick([3, 4, 5, 6, 8]);
  var zs = [];
  for (var i = 1; i <= n; i++) zs.push("Z" + i);
  var squares = zs.map(function (z) { return z + "\u00B2"; }).join(" + ");
  var question = "If " + zs.join(", ") + " are independent unit normal random variables, how many degrees of freedom does \u03C7\u00B2 = " + squares + " have?";
  var solution = "Refer to \u03C7\u00B2 - Distribution in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 69 (PDF page 75).\n\n" +
    "The handbook defines the sum of squares of n independent unit normal variables as chi-square with n degrees of freedom. Here n = " + n + ".";
  return {
    variantKey: "n" + n,
    question: question,
    options: [
      { label: "" + n, num: n, correct: true },
      { label: "" + (n * n), num: n * n, correct: false },
      { label: "1", num: 1, correct: false },
      { label: "" + (n - 1), num: n - 1, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-060
// Measurement error model: d_random = x - x_ref - d_systematic.
PART.push(buildGenerator({ baseId: "stats-060", subtopic: "Measurement error model", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "d_random = x \u2212 x_ref \u2212 d_systematic. Forgetting to subtract the systematic part (or adding it) is the trap."
}, function () {
  var xref = pick([10, 20, 5]), dsys = pick([0.12, 0.18, 0.25]), dr = pick([0.04, 0.07, 0.09]);
  var x = r2s(xref + dsys + dr);
  var tNoSub = r2s(x - xref), tAdd = r2s(x - xref + dsys), tSum = r2s(x + xref + dsys);
  var question = "A measurement x = " + f2(x) + " has reference value x_ref = " + f2(xref) + " and a systematic disturbance of " + dsys + ". Using the handbook's model x = x_ref + d_systematic + d_random, what is the random component?";
  var solution = "Refer to Measurement Error in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 69 (PDF page 75).\n\n" +
    "$$\\begin{aligned}d_{random} &= x - x_{ref} - d_{systematic} \\\\ &= " + f2(x) + " - " + f2(xref) + " - " + dsys + " \\\\ &= " + f2(dr) + "\\end{aligned}$$";
  return {
    variantKey: "x" + pdot(x) + "_r" + xref + "_s" + pdot(dsys),
    question: question,
    options: [
      { label: f2(dr), num: dr, correct: true },
      { label: f2(tNoSub), num: tNoSub, correct: false },
      { label: f2(tSum), num: tSum, correct: false },
      { label: f2(tAdd), num: tAdd, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-061
// Kline-McClintock uncertainty of a product.
PART.push(buildGenerator({ baseId: "stats-061", subtopic: "Uncertainty of a product", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "For y = x1x2 the sensitivities are x2 and x1: \u03C3y = \u221A((x2\u03C31)\u00B2 + (x1\u03C32)\u00B2). Using \u03C31,\u03C32 directly is the trap."
}, function () {
  var x1 = pick([8, 10, 12]), x2 = pick([4, 5, 6]), s1 = pick([0.1, 0.2]), s2 = pick([0.05, 0.1]);
  var ans = r2s(Math.sqrt(Math.pow(x2 * s1, 2) + Math.pow(x1 * s2, 2)));
  var tQuad = r2s(Math.sqrt(s1 * s1 + s2 * s2));
  var tSum = r2s(x2 * s1 + x1 * s2);
  var tProd = r2s(x1 * x2 * Math.sqrt(s1 * s1 + s2 * s2));
  var question = "Two uncorrelated measurements are x1 = " + x1 + " with standard deviation " + s1 + " and x2 = " + x2 + " with standard deviation " + s2 + ". Using the Kline-McClintock equation, what is the standard uncertainty of y = x1\u00B7x2?";
  var solution = "Refer to Measurement Uncertainty in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 70 (PDF page 76).\n\n" +
    "The handbook gives \\(\\sigma_y = \\sqrt{(\\partial f/\\partial x_1)^2\\sigma_1^2 + (\\partial f/\\partial x_2)^2\\sigma_2^2}\\). For y = x1x2, \\(\\partial y/\\partial x_1 = x_2 = " + x2 + "\\) and \\(\\partial y/\\partial x_2 = x_1 = " + x1 + "\\):\n\n" +
    "$$\\sigma_y = \\sqrt{(" + x2 + ")^2(" + s1 + ")^2 + (" + x1 + ")^2(" + s2 + ")^2} = " + f2(ans) + "$$";
  return {
    variantKey: "x" + x1 + "_" + x2 + "_s" + pdot(s1) + "_" + pdot(s2),
    question: question,
    options: [
      { label: f2(ans), num: ans, correct: true },
      { label: f2(tQuad), num: tQuad, correct: false },
      { label: f2(tSum), num: tSum, correct: false },
      { label: f2(tProd), num: tProd, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-062
// Kline-McClintock uncertainty of a sum.
PART.push(buildGenerator({ baseId: "stats-062", subtopic: "Uncertainty of a sum", difficulty: "medium",
  estimatedTimeSeconds: 90,
  explanation: "For y = x1 + x2 both sensitivities are 1, so \u03C3y = \u221A(\u03C31\u00B2 + \u03C32\u00B2). Adding the sigmas linearly is the trap."
}, function () {
  var s1 = pick([0.2, 0.3, 0.4]), s2 = pick([0.3, 0.4, 0.5]);
  var ans = r2s(Math.sqrt(s1 * s1 + s2 * s2));
  var tAdd = r2s(s1 + s2), tDiff = r2s(Math.abs(s1 - s2)), tAvg = r2s((s1 + s2) / 2);
  var question = "Two uncorrelated measured lengths have standard deviations of " + s1 + " mm and " + s2 + " mm. What is the standard uncertainty of their sum, using the Kline-McClintock equation?";
  var solution = "Refer to Measurement Uncertainty in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 70 (PDF page 76).\n\n" +
    "For y = x1 + x2 both partial derivatives equal 1:\n\n" +
    "$$\\sigma_y = \\sqrt{" + s1 + "^2 + " + s2 + "^2} = " + f2(ans) + "\\ \\text{mm}$$";
  return {
    variantKey: "s" + pdot(s1) + "_" + pdot(s2),
    question: question,
    options: [
      { label: f2(ans) + " mm", num: ans, correct: true },
      { label: f2(tDiff) + " mm", num: tDiff, correct: false },
      { label: f2(tAvg) + " mm", num: tAvg, correct: false },
      { label: f2(tAdd) + " mm", num: tAdd, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-063
// Kline-McClintock uncertainty of a squared quantity.
PART.push(buildGenerator({ baseId: "stats-063", subtopic: "Uncertainty of a squared quantity", difficulty: "hard",
  estimatedTimeSeconds: 120,
  explanation: "For y = x\u00B2 the sensitivity is 2x, so \u03C3y = 2x\u03C3. Using \u03C3\u00B2 or x\u03C3 forgets the derivative."
}, function () {
  var x = pick([2, 3, 4, 5]), sx = pick([0.05, 0.1, 0.15]);
  var ans = r2s(2 * x * sx);
  var tSx = sx, tSq = r2s(sx * sx), tX = r2s(x * sx);
  var question = "A side x = " + f2(x) + " m is measured with standard deviation " + sx + " m. What is the standard uncertainty of the area y = x\u00B2, using the Kline-McClintock equation?";
  var solution = "Refer to Measurement Uncertainty in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 70 (PDF page 76).\n\n" +
    "Here \\(\\partial y/\\partial x = 2x = " + f2(2 * x) + "\\), so \\(\\sigma_y = " + f2(2 * x) + "(" + sx + ") = " + f2(ans) + "\\ \\text{m}^2\\).";
  return {
    variantKey: "x" + x + "_s" + pdot(sx),
    question: question,
    options: [
      { label: f2(ans) + " m\u00B2", num: ans, correct: true },
      { label: f2(tSq) + " m\u00B2", num: tSq, correct: false },
      { label: f2(tX) + " m\u00B2", num: tX, correct: false },
      { label: f2(tSx) + " m\u00B2", num: tSx, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-064
// Expanded uncertainty with coverage factor k = 2.
PART.push(buildGenerator({ baseId: "stats-064", subtopic: "Expanded uncertainty", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Expanded uncertainty U = k\u03C3 with k = 2, reported at about 95% confidence. The k = 1 and k = 3 confidence pairings are the decoys."
}, function () {
  var u = pick([0.3, 0.4, 0.5, 0.6]);
  var U = r2s(2 * u);
  var question = "A standard uncertainty is " + u + " units. At the handbook's coverage factor of k = 2, what expanded uncertainty is reported, and at about what confidence level?";
  var solution = "Refer to Measurement Uncertainty in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 70 (PDF page 76).\n\n" +
    "The handbook says expanded uncertainties are typically given at about 95% confidence with a coverage factor k = 2 (2 sigma): 2(" + u + ") = " + f2(U) + ".";
  return {
    variantKey: "u" + pdot(u),
    question: question,
    options: [
      { label: (Math.round(U * 10) / 10).toFixed(1) + " units, about 95%", num: null, correct: true },
      { label: (Math.round(U * 10) / 10).toFixed(1) + " units, about 99.7%", num: null, correct: false },
      { label: (Math.round(u * 10) / 10).toFixed(1) + " units, about 68%", num: null, correct: false },
      { label: f2(u / 2) + " units, about 95%", num: null, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-065
// Least-squares prediction from Sxy, Sxx, means.
PART.push(buildGenerator({ baseId: "stats-065", subtopic: "Least-squares prediction", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "b = Sxy/Sxx, a = \u0233 \u2212 bx\u0304, then \u0177 = a + bx. Using \u0233 as the intercept skips the centering step."
}, function () {
  var cases = [
    { Sxy: 120, Sxx: 40, mx: 5, my: 30, x: 7 },
    { Sxy: 90, Sxx: 30, mx: 4, my: 22, x: 6 },
    { Sxy: 60, Sxx: 20, mx: 6, my: 40, x: 8 },
    { Sxy: 150, Sxx: 50, mx: 3, my: 18, x: 5 },
    { Sxy: 80, Sxx: 25, mx: 5, my: 26, x: 9 }
  ];
  var c = cases[ri(0, cases.length - 1)];
  var b = c.Sxy / c.Sxx, a = c.my - b * c.mx;
  var ans = r2s(a + b * c.x);
  var tNoCenter = r2s(c.my + b * c.x), tInv = r2s((c.Sxx / c.Sxy) * c.x + c.my), tMean = c.my;
  var question = "A regression has Sxy = " + c.Sxy + ", Sxx = " + c.Sxx + ", mean x = " + c.mx + " and mean y = " + c.my + ". What does the fitted line predict at x = " + c.x + "?";
  var solution = "Refer to Least Squares in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 70 (PDF page 76).\n\n" +
    "The handbook gives \\(\\hat b = S_{xy}/S_{xx} = " + c.Sxy + "/" + c.Sxx + " = " + fmt(b) + "\\) and \\(\\hat a = \\bar y - \\hat b\\bar x = " + c.my + " - " + fmt(b) + "(" + c.mx + ") = " + fmt(a) + "\\):\n\n" +
    "$$\\hat y = " + fmt(a) + " + " + fmt(b) + "(" + c.x + ") = " + fmt(ans) + "$$";
  return {
    variantKey: "Sxy" + c.Sxy + "_Sxx" + c.Sxx + "_x" + c.x,
    question: question,
    options: [
      { label: f2(ans), num: ans, correct: true },
      { label: f2(tInv), num: tInv, correct: false },
      { label: f2(tNoCenter), num: tNoCenter, correct: false },
      { label: f2(tMean), num: tMean, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-066
// Least-squares slope from data (dataset family).
PART.push(buildGenerator({ baseId: "stats-066", subtopic: "Least-squares slope from data", difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "b = Sxy/Sxx from the raw points. The endpoint-secant slope and the inverted ratio Sxx/Sxy are the decoys."
}, function () {
  var sets = [
    [[1, 2.1], [2, 3.9], [3, 6.2], [4, 7.8], [5, 10.1]],
    [[1, 3.2], [2, 5.1], [3, 6.8], [4, 9.2], [5, 11.0]],
    [[1, 1.8], [2, 4.3], [3, 6.0], [4, 8.5], [5, 10.4]],
    [[1, 4.0], [2, 6.4], [3, 7.5], [4, 10.8], [5, 12.2]]
  ];
  var di = ri(0, sets.length - 1), d = sets[di], n = d.length;
  var mx = sMean(d.map(function (p) { return p[0]; }));
  var my = sMean(d.map(function (p) { return p[1]; }));
  var Sxx = 0, Sxy = 0;
  for (var i = 0; i < n; i++) { Sxx += (d[i][0] - mx) * (d[i][0] - mx); Sxy += (d[i][0] - mx) * (d[i][1] - my); }
  var b = Sxy / Sxx;
  var sec = (d[n - 1][1] - d[0][1]) / (d[n - 1][0] - d[0][0]);
  var inv = Sxx / Sxy, off = r2s(Math.abs(b - sec));
  var pt = function (p) { return "(" + p[0] + ", " + p[1] + ")"; };
  var question = "For the data (x, y) = " + d.map(pt).join(", ") + ", what is the least-squares slope?";
  var solution = "Refer to Least Squares in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 70 (PDF page 76).\n\n" +
    "With mean x = " + f2(mx) + " and mean y = " + f2(my) + ": \\(S_{xx} = " + f2(Sxx) + "\\) and \\(S_{xy} = " + f2(Sxy) + "\\).\n\n" +
    "$$\\begin{aligned}\\hat b &= \\frac{S_{xy}}{S_{xx}} \\\\ &= \\frac{" + f2(Sxy) + "}{" + f2(Sxx) + "} \\\\ &= " + f2(b) + "\\end{aligned}$$";
  return {
    variantKey: "set" + di,
    question: question,
    options: [
      { label: f2(b), num: r2s(b), correct: true },
      { label: f2(off), num: off, correct: false },
      { label: f2(sec), num: r2s(sec), correct: false },
      { label: f2(inv), num: r2s(inv), correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-067
// Standard error of estimate squared (MSE).
PART.push(buildGenerator({ baseId: "stats-067", subtopic: "Standard error of estimate", difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "Se\u00B2 = (Sxx\u00B7Syy \u2212 Sxy\u00B2)/(Sxx(n\u22122)). Using n instead of n\u22122 inflates it; Sxy\u00B2/Sxx is the explained-variation slip."
}, function () {
  var cases = [
    { n: 5, Sxx: 10, Syy: 40, Sxy: 19.9 },
    { n: 6, Sxx: 12, Syy: 60, Sxy: 26.4 },
    { n: 8, Sxx: 20, Syy: 90, Sxy: 42.0 },
    { n: 7, Sxx: 15, Syy: 55, Sxy: 28.2 },
    { n: 5, Sxx: 8, Syy: 34, Sxy: 16.2 }
  ];
  var c = cases[ri(0, cases.length - 1)];
  var mse = (c.Sxx * c.Syy - c.Sxy * c.Sxy) / (c.Sxx * (c.n - 2));
  var tN = (c.Sxx * c.Syy - c.Sxy * c.Sxy) / (c.Sxx * c.n);
  var tExpl = c.Sxy * c.Sxy / c.Sxx;
  var tRoot = Math.sqrt(mse);
  var question = "A regression with n = " + c.n + " has Sxx = " + c.Sxx + ", Syy = " + c.Syy + " and Sxy = " + c.Sxy + ". What is the standard error of estimate squared, \\(S_e^2\\) (the MSE)?";
  var solution = "Refer to Standard Error of Estimate in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 70 (PDF page 76).\n\n" +
    "The handbook gives \\(S_e^2 = \\dfrac{S_{xx}S_{yy} - S_{xy}^2}{S_{xx}(n-2)}\\):\n\n" +
    "$$S_e^2 = \\frac{" + c.Sxx + "(" + c.Syy + ") - (" + c.Sxy + ")^2}{" + c.Sxx + "(" + c.n + "-2)} = " + fmt(Math.round(mse * 1000) / 1000) + "$$";
  return {
    variantKey: "n" + c.n + "_Sxx" + c.Sxx + "_Syy" + c.Syy + "_Sxy" + pdot(c.Sxy),
    question: question,
    options: [
      { label: (Math.round(mse * 1000) / 1000).toFixed(3), num: Math.round(mse * 1000) / 1000, correct: true },
      { label: (Math.round(tRoot * 1000) / 1000).toFixed(3), num: Math.round(tRoot * 1000) / 1000, correct: false },
      { label: (Math.round(tExpl * 100) / 100).toFixed(3), num: Math.round(tExpl * 100) / 100, correct: false },
      { label: (Math.round(tN * 1000) / 1000).toFixed(3), num: Math.round(tN * 1000) / 1000, correct: false }
    ],
    solution: solution
  };
}));

// ---------------------------------------------------------------- stats-068
// Regression residual e = y - yhat.
PART.push(buildGenerator({ baseId: "stats-068", subtopic: "Regression residual", difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "e = y \u2212 \u0177. The fitted value itself and the flipped sign are the decoys."
}, function () {
  var a = pick([1.0, 1.5, 2.0]), b = pick([1.5, 2.0, 2.5]), x = pick([2, 3, 4]), e = pick([0.5, 1.0, -0.5, -1.0]);
  var yhat = r2s(a + b * x), y = r2s(yhat + e);
  var question = "A fitted line is \u0177 = " + f2(a) + " + " + f2(b) + "x. At x = " + x + " the observed value is y = " + f2(y) + ". What is the residual e?";
  var solution = "Refer to Residual in the Engineering Probability and Statistics section of the FE Reference Handbook (v10.6), printed page 70 (PDF page 76).\n\n" +
    "The handbook gives \\(e_i = y_i - \\hat y_i\\). Here \\(\\hat y = " + f2(a) + " + " + f2(b) + "(" + x + ") = " + f2(yhat) + "\\), so \\(e = " + f2(y) + " - " + f2(yhat) + " = " + sgn(e) + "\\).";
  return {
    variantKey: "a" + pdot(a) + "_b" + pdot(b) + "_x" + x + "_e" + pdot(e),
    question: question,
    options: [
      { label: sgn(e), num: e, correct: true },
      { label: f2(yhat), num: yhat, correct: false },
      { label: f2(y), num: y, correct: false },
      { label: sgn(-e), num: -e, correct: false }
    ],
    solution: solution
  };
}));

  window.STATS_GENERATORS = PART;
})();
