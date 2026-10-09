/* PassTheFE randomized practice — Fluid Mechanics generator templates.
 *
 * Plain script (no modules) for the static site. Defines window.FLUID_GENERATORS:
 * one entry per NUMERICAL Fluid Mechanics bank question with a drillable skill.
 *
 * LaTeX convention: NATURAL single-backslash LaTeX. In the JS string literals
 * below that means "\\(" for \(, "\\frac" for \frac, and "\\\\" for the "\\"
 * row break inside aligned environments. NEVER write a doubled backslash
 * before (, ), or an ASCII letter.
 */
(function () {
  "use strict";

  var MINUS = "−"; // U+2212, matches bank choice-string style

  // FE-style number formatting: integers render as integers, others up to
  // 3 decimals with trailing zeros trimmed.
  function fmt(x) {
    if (!isFinite(x)) return "NaN";
    var r = Math.round(x);
    if (Math.abs(x - r) < 1e-9) return String(r);
    return x.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
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
  // variantKey-safe encoding of a number: "." -> "p", "-" -> "m".
  function pdot(x) { return String(x).replace(/\./g, "p").replace(/-/g, "m"); }

  // Wraps a roll() function with the app-integration contract. roll() returns
  // { variantKey, question, options: [{label, num|null, correct}], solution }.
  // The wrapper shuffles the options, enforces pairwise-distinct labels (and
  // pairwise-distinct numeric values where present) with a retry loop, and
  // returns the contracted generate() payload.
  function buildGenerator(meta, roll) {
    return {
      baseId: meta.baseId,
      topic: meta.topic || "Fluid Mechanics",
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
            topic: meta.topic || "Fluid Mechanics",
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
  var FLUID_ENTRIES = [];
  function reg(e) { FLUID_ENTRIES.push(e); return e; }

/* ---- fluid-020: capillary rise (surface tension) ---- */
reg(buildGenerator({
  baseId: "fluid-020",
  topic: "Fluid Mechanics",
  subtopic: "Surface tension (capillarity)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The FE hides this one behind a kN-to-N conversion and the mm-to-m conversion — plus the classic slip of using the tube radius where the formula wants the diameter."
}, function () {
  // Liquid data: surface tension sigma (N/m), specific weight gamma (kN/m^3).
  var liq = pick([
    { key: "water", name: "water", sigma: 0.073, gamma: 9.79 },
    { key: "ethanol", name: "ethanol", sigma: 0.022, gamma: 7.73 },
    { key: "glycerin", name: "glycerin", sigma: 0.063, gamma: 12.4 }
  ]);
  var dm = pick([0.5, 0.8, 1.2, 1.5, 2.0]); // tube diameter, mm
  var gammaNm3 = liq.gamma * 1000;          // N/m^3
  var hm = 4 * liq.sigma / (gammaNm3 * (dm / 1000)); // cos(beta) = 1
  var hmm = hm * 1000;                     // correct capillary rise, mm
  // Traps, each numerically distinct from hmm and from each other:
  var tRadius = 2 * hmm;      // tube radius used in place of diameter in the formula
  var tMmAsM = hmm / 1000;    // diameter in mm used directly as meters
  var tKNasN = hmm * 1000;    // gamma in kN/m^3 used directly as N/m^3
  var question = "A clean vertical glass capillary tube of diameter " + fmt(dm) +
    " mm is dipped into a beaker of " + liq.name + " (surface tension " +
    fmt(liq.sigma) + " N/m, specific weight " + fmt(liq.gamma) +
    " kN/m\u00B3). The contact angle \u03B2 is 0\u00B0. What is the capillary rise of the " +
    liq.name + " in the tube?";
  var solution = "Refer to the Surface Tension and Capillarity section in the Fluid Mechanics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "The handbook gives the general form for capillary rise:\n\n" +
    "$$h = \\frac{4\\sigma\\cos\\beta}{\\gamma d}$$\n\n" +
    "For a clean glass tube \\(\\beta = 0^{\\circ}\\), so \\(\\cos\\beta = 1\\). Convert the givens to consistent units, then list the parameters:\n\n" +
    "$$\\begin{aligned}\n" +
    "\\sigma &= " + fmt(liq.sigma) + "\\ \\text{N/m},\\quad \\cos\\beta = 1 \\\\\n" +
    "\\gamma &= " + fmt(liq.gamma) + "\\ \\text{kN/m}^3 = " + fmt(gammaNm3) + "\\ \\text{N/m}^3 \\\\\n" +
    "d &= " + fmt(dm) + "\\ \\text{mm} = " + (dm / 1000) + "\\ \\text{m},\\quad h = ?\n" +
    "\\end{aligned}$$\n\n" +
    "Substituting into the handbook formula:\n\n" +
    "$$h = \\frac{4(" + fmt(liq.sigma) + ")(1)}{(" + fmt(gammaNm3) + ")(" + (dm / 1000) + ")} = " + hm.toPrecision(4) + "\\ \\text{m} = " + fmt(hmm) + "\\ \\text{mm}$$\n\n" +
    "The capillary rise is\n\n" +
    "$$\\boxed{" + fmt(hmm) + "\\ \\text{mm}}$$";
  return {
    variantKey: liq.key + "-d" + pdot(dm),
    question: question,
    options: [
      { label: fmt(hmm) + " mm", num: hmm, correct: true },
      { label: fmt(tRadius) + " mm", num: tRadius, correct: false },
      { label: fmt(tMmAsM) + " mm", num: tMmAsM, correct: false },
      { label: fmt(tKNasN) + " mm", num: tKNasN, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-024: Buckingham Pi theorem ---- */
reg(buildGenerator({
  baseId: "fluid-024",
  topic: "Fluid Mechanics",
  subtopic: "Buckingham Pi theorem",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The FE rarely makes you build the actual pi groups — it just asks you to COUNT them. Count the variables (n), count the basic dimensions (r), subtract: n − r."
}, function () {
  var n = ri(4, 7);              // number of variables in the phenomenon
  var r = pick([2, 3]);          // number of basic dimensions (M, L, T)
  var askTerms = Math.random() < 0.7; // ~70% ask for pi terms, ~30% for repeating variables
  var scenarios = [
    { ctx: "pressure drop along a length of pipe", vars: ["Δp", "ρ", "V", "D", "μ", "L", "ε"] },
    { ctx: "drag on a sphere moving through a fluid", vars: ["F", "ρ", "V", "D", "μ", "ε", "k"] },
    { ctx: "discharge through an open channel", vars: ["Q", "ρ", "g", "h", "B", "V", "μ"] },
    { ctx: "power delivered to a pump", vars: ["P", "ρ", "N", "D", "Q", "μ", "g"] },
    { ctx: "flow over a sharp-crested weir", vars: ["Q", "g", "H", "L", "ρ", "μ", "σ"] }
  ];
  var sc = pick(scenarios);
  var vars = shuffle(sc.vars).slice(0, n);
  var question = "An experiment is being planned to study " + sc.ctx +
    ". Dimensional analysis identifies n = " + n + " relevant variables: " +
    vars.join(", ") + ". Expressed dimensionally, these variables involve r = " + r +
    " basic dimensions (M, L, T)." +
    (askTerms
      ? " According to the Buckingham Pi theorem, how many independent dimensionless pi terms are required to describe this phenomenon?"
      : " According to the Buckingham Pi theorem, how many repeating variables are required to form the dimensionless pi terms?");
  var ans, t1, t2, t3, kind;
  if (askTerms) {
    ans = n - r;
    t1 = n - r + 1;                    // trap: counted one extra pi term (n − r + 1)
    t2 = n;                            // trap: forgot to subtract the basic dimensions
    t3 = (n - r - 1 >= 1) ? n - r - 1  // trap: over-subtracted the basic dimensions
                          : n - r + 2;
    kind = "terms";
  } else {
    ans = r;
    t1 = r + 1;                        // trap: counted one extra repeating variable
    t2 = r - 1;                        // trap: counted one too few repeating variables
    t3 = (n === r + 1) ? n + 1 : n;     // trap: confused repeating variables with n; nudged to avoid a duplicate label
    kind = "rep";
  }
  var solution = "Refer to the Dimensional Analysis section in the Fluid Mechanics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "The Buckingham Pi theorem states that the number of independent dimensionless groups (pi terms) for a phenomenon involving n variables equals \\(n - r_r\\), where \\(r_r\\) is the number of basic dimensions needed to express the variables dimensionally:\n\n" +
    "$$k = n - r_r$$" +
    "\n\n" +
    (askTerms
      ? "Here n = " + n + " variables and \\(r_r\\) = " + r + " basic dimensions, so the number of pi terms is\n\n$$k = " + n + " - " + r + " = " + ans + "$$"
      : "The pi terms are formed from \\(r_r\\) repeating variables, so with \\(r_r\\) = " + r + " basic dimensions the number of repeating variables required is\n\n$$r_r = " + r + " = " + ans + "$$") +
    "\n\n$$\\boxed{" + ans + "}$$";
  return {
    variantKey: "pi-n" + n + "-r" + r + "-" + kind,
    question: question,
    options: [
      { label: fmt(ans), num: ans, correct: true },
      { label: fmt(t1), num: t1, correct: false },
      { label: fmt(t2), num: t2, correct: false },
      { label: fmt(t3), num: t3, correct: false }
    ],
    solution: solution
  };
}));

reg(buildGenerator({
  baseId: "fluid-025",
  topic: "Fluid Mechanics",
  subtopic: "Siphon (energy equation)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Reservoir surface ≈ still, atmosphere cancels on both sides, and head loss is neglected — so the energy equation collapses to Torricelli, v = sqrt(2g*delta-h). Get diameter to meters before the area."
}, function () {
  var g = 9.81;                                  // m/s^2
  var dh = pick([1.5, 2.0, 2.5, 3.0, 5.0, 6.0]); // m, surface-to-exit elevation difference (Δh=1 makes the outside-root trap equal the answer; Δh=4 makes it equal the doubled trap — both excluded)
  var dmm = pick([25, 32, 40, 50, 65, 80, 100]); // mm, siphon pipe diameter
  var askVel = Math.random() < 0.5;
  var v = Math.sqrt(2 * g * dh);                 // m/s, Torricelli
  var Amm2 = Math.PI * dmm * dmm / 4;            // mm^2
  var Qls = Amm2 * v / 1000;                     // L/s (mm^2->m^2 x1e-6 and m^3/s->L/s x1000 combine to /1000)

  var variantKey = "siphon-dh" + pdot(dh) + "-d" + dmm + (askVel ? "-vel" : "-Q");
  var setup = "A large open tank drains to the atmosphere through a siphon pipe of diameter " +
    dmm + " mm. The reservoir surface is " + fmt(dh) + " m above the pipe exit. Neglecting head loss, ";

  if (askVel) {
    var tForget2 = Math.sqrt(g * dh);      // trap: forgot the 2 in 2g
    var tOutside = Math.sqrt(2 * g) * dh;  // trap: algebra slip, Δh left outside the root
    var tDouble = 2 * v;                   // trap: doubled the correct velocity
    var question = setup + "what is the exit velocity?";
    var solution = "Refer to the Energy Equation section in the Fluid Mechanics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Apply the energy equation between the reservoir surface (1) and the siphon exit (2):\n\n" +
      "$$\\frac{p_1}{\\gamma} + \\frac{v_1^2}{2g} + z_1 = \\frac{p_2}{\\gamma} + \\frac{v_2^2}{2g} + z_2$$\n\n" +
      "Both points are open to the atmosphere (\\(p_1 = p_2 = p_{atm}\\) cancels), the surface is large so \\(v_1 \\approx 0\\), and head loss is neglected:\n\n" +
      "$$\\begin{aligned}\n" +
      "z_1 - z_2 &= \\Delta h = " + fmt(dh) + "\\ \\text{m} \\\\\n" +
      "0 + z_1 &= \\frac{v_2^2}{2g} + z_2 \\\\\n" +
      "v_2 &= \\sqrt{2g\\,\\Delta h} = \\sqrt{2(" + fmt(g) + ")(" + fmt(dh) + ")} = " + fmt(v) + "\\ \\text{m/s}\n" +
      "\\end{aligned}$$\n\n" +
      "$$\\boxed{" + fmt(v) + " \\text{m/s}}$$";
    return {
      variantKey: variantKey,
      question: question,
      options: [
        { label: fmt(v) + " m/s", num: v, correct: true },
        { label: fmt(tForget2) + " m/s", num: tForget2, correct: false },
        { label: fmt(tOutside) + " m/s", num: tOutside, correct: false },
        { label: fmt(tDouble) + " m/s", num: tDouble, correct: false }
      ],
      solution: solution
    };
  }

  var tRadius = 4 * Qls;        // trap: diameter used as the radius (pi*d^2 instead of pi*d^2/4)
  var tMm = Qls * 1e6;          // trap: d in mm used directly as meters in the area (1e6x)
  var tNoConv = Qls / 1000;     // trap: forgot the m^3/s -> L/s conversion
  var questionQ = setup + "what is the discharge through the siphon?";
  var solutionQ = "Refer to the Energy Equation section in the Fluid Mechanics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Apply the energy equation between the reservoir surface (1) and the siphon exit (2):\n\n" +
    "$$\\frac{p_1}{\\gamma} + \\frac{v_1^2}{2g} + z_1 = \\frac{p_2}{\\gamma} + \\frac{v_2^2}{2g} + z_2$$\n\n" +
    "Both points are open to the atmosphere (\\(p_1 = p_2 = p_{atm}\\) cancels), the surface is large so \\(v_1 \\approx 0\\), and head loss is neglected, so the exit velocity is Torricelli's: \\(v = \\sqrt{2g\\,\\Delta h}\\). Then \\(Q = Av\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "d &= " + dmm + "\\ \\text{mm} = " + fmt(dmm / 1000) + "\\ \\text{m},\\quad A = \\frac{\\pi d^2}{4} = \\frac{\\pi(" + dmm + ")^2}{4} = " + fmt(Amm2) + "\\ \\text{mm}^2 \\\\\n" +
    "v &= \\sqrt{2g\\,\\Delta h} = \\sqrt{2(" + fmt(g) + ")(" + fmt(dh) + ")} = " + fmt(v) + "\\ \\text{m/s} \\\\\n" +
    "Q &= A v = \\frac{(" + fmt(Amm2) + ")(" + fmt(v) + ")}{1000} = " + fmt(Qls) + "\\ \\text{L/s}\n" +
    "\\end{aligned}$$\n\n" +
    "The \\(\\div 1000\\) combines the two conversions: mm\\(^2\\) to m\\(^2\\) (\\(\\times 10^{-6}\\)) and m\\(^3\\)/s to L/s (\\(\\times 1000\\)):\n\n" +
    "$$\\boxed{" + fmt(Qls) + " \\text{L/s}}$$";
  return {
    variantKey: variantKey,
    question: questionQ,
    options: [
      { label: fmt(Qls) + " L/s", num: Qls, correct: true },
      { label: fmt(tRadius) + " L/s", num: tRadius, correct: false },
      { label: fmt(Qls) + " × 10⁶ L/s", num: tMm, correct: false },
      { label: fmt(tNoConv) + " L/s", num: tNoConv, correct: false }
    ],
    solution: solutionQ
  };
}));


  window.FLUID_GENERATORS = FLUID_ENTRIES;
})();
