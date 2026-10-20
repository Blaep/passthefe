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
            topic: meta.topic || "Fluid Mechanics",
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
  // Setup diagram (never the answer): beaker of liquid with the thin
  // capillary tube dipped in; label d from the roll and mark h = ?.
  var s020 = SVG_HDR + AH +
    '<rect x="230" y="130" width="160" height="120" fill="none" stroke="#334155" stroke-width="3"/>' +
    '<rect x="232" y="200" width="156" height="48" fill="#bfdbfe"/>' +
    '<rect x="302" y="50" width="12" height="180" fill="white" stroke="#334155" stroke-width="2"/>' +
    '<rect x="304" y="110" width="8" height="90" fill="#60a5fa"/>' +
    '<line x1="200" y1="200" x2="420" y2="200" stroke="#334155" stroke-width="1.5" stroke-dasharray="6,4"/>' +
    '<line x1="336" y1="110" x2="336" y2="200" stroke="#1d4ed8" stroke-width="2" marker-start="url(#ah)" marker-end="url(#ah)"/>' +
    '<text x="344" y="160" font-family="sans-serif" font-size="17" fill="#1d4ed8">h = ?</text>' +
    '<line x1="302" y1="66" x2="314" y2="66" stroke="#1d4ed8" stroke-width="2" marker-start="url(#ah)" marker-end="url(#ah)"/>' +
    '<text x="318" y="62" font-family="sans-serif" font-size="15" fill="#1d4ed8">d = ' + fmt(dm) + ' mm</text>' +
    '<text x="248" y="230" font-family="sans-serif" font-size="15" fill="#334155">' + liq.name + '</text>' +
    '<text x="322" y="100" font-family="sans-serif" font-size="14" fill="#334155">capillary tube</text>' +
    '<text x="322" y="195" font-family="sans-serif" font-size="14" fill="#334155">beaker surface</text>';
  var d020 = svgURL(s020 + SVG_FTR);  var solution = "Refer to the Surface Tension and Capillarity section in the Fluid Mechanics chapter of the FE Reference Handbook (v10.6).\n\n" +
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
    solution: solution,
    diagram: d020
  };
}));

/* ---- fluid-024: Buckingham Pi theorem ---- */
reg(buildGenerator({
  baseId: "fluid-024",
  topic: "Fluid Mechanics",
  subtopic: "Buckingham Pi theorem",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The FE rarely makes you build the actual π groups — it just asks you to COUNT them. Count the variables (n), count the basic dimensions (r), subtract: n − r."
}, function () {
  var n = ri(4, 7);              // number of variables in the phenomenon
  var r = pick([2, 3]);          // number of basic dimensions (M, L, T)
  var askTerms = Math.random() < 0.7; // ~70% ask for π terms, ~30% for repeating variables
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
      ? " According to the Buckingham Pi theorem, how many independent dimensionless π terms are required to describe this phenomenon?"
      : " According to the Buckingham Pi theorem, how many repeating variables are required to form the dimensionless π terms?");
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
    "The Buckingham Pi theorem states that the number of independent dimensionless groups (π terms) for a phenomenon involving n variables equals \\(n - r_r\\), where \\(r_r\\) is the number of basic dimensions needed to express the variables dimensionally:\n\n" +
    "$$k = n - r_r$$" +
    "\n\n" +
    (askTerms
      ? "Here n = " + n + " variables and \\(r_r\\) = " + r + " basic dimensions, so the number of π terms is\n\n$$k = " + n + " - " + r + " = " + ans + "$$"
      : "The π terms are formed from \\(r_r\\) repeating variables, so with \\(r_r\\) = " + r + " basic dimensions the number of repeating variables required is\n\n$$r_r = " + r + " = " + ans + "$$") +
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
  explanation: "Reservoir surface ≈ still, atmosphere cancels on both sides, and head loss is neglected — so the energy equation collapses to Torricelli, v = sqrt(2g*Δh). Get diameter to meters before the area."
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
  // Setup diagram (never the answer): open tank, siphon pipe over the
  // wall, exit below the surface; label Δh and the pipe diameter only.
  var s025 = SVG_HDR + AH +
    '<rect x="60" y="130" width="200" height="120" fill="none" stroke="#334155" stroke-width="3"/>' +
    '<rect x="62" y="150" width="196" height="98" fill="#bfdbfe"/>' +
    '<path d="M 215 235 L 215 70 L 400 70 L 400 215" fill="none" stroke="#475569" stroke-width="10"/>' +
    '<path d="M 215 120 L 215 90 M 300 70 L 270 70 M 400 150 L 400 120" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>' +
    '<line x1="60" y1="150" x2="500" y2="150" stroke="#334155" stroke-width="1.5" stroke-dasharray="6,4"/>' +
    '<line x1="370" y1="215" x2="500" y2="215" stroke="#334155" stroke-width="1.5" stroke-dasharray="6,4"/>' +
    '<line x1="470" y1="150" x2="470" y2="215" stroke="#1d4ed8" stroke-width="2" marker-start="url(#ah)" marker-end="url(#ah)"/>' +
    '<text x="478" y="188" font-family="sans-serif" font-size="16" fill="#1d4ed8">Δh = ' + fmt(dh) + ' m</text>' +
    '<line x1="385" y1="150" x2="415" y2="150" stroke="#1d4ed8" stroke-width="2" marker-start="url(#ah)" marker-end="url(#ah)"/>' +
    '<text x="420" y="145" font-family="sans-serif" font-size="15" fill="#1d4ed8">d = ' + dmm + ' mm</text>' +
    '<text x="120" y="225" font-family="sans-serif" font-size="15" fill="#334155">open tank</text>' +
    '<text x="404" y="235" font-family="sans-serif" font-size="15" fill="#334155">exit to atmosphere</text>';
  var d025 = svgURL(s025 + SVG_FTR);

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
      solution: solution,
      diagram: d025
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
    solution: solutionQ,
    diagram: d025
  };
}));


  
/* ---- fluid-034: venturi meter flow rate ---- */
reg(buildGenerator({
  baseId: "fluid-034",
  topic: "Fluid Mechanics",
  subtopic: "Venturi meter flow rate",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Convert the manometer reading to head of the flowing fluid first: Δh = hm(SGm − 1). The traps: skipping the (1 − β⁴) area correction, forgetting the −1, using the mercury head as water head.",
  tiTip: "No — there is no venturi key, and the full equation will not fit the 40-character solver limit; work it in stages and let the calculator grind each step.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var D1, D2;
  do {
    D1 = pick([25, 30, 40]);   // cm, main
    D2 = pick([10, 12, 15]);   // cm, throat
  } while (D2 / D1 > 0.5);
  var hm = pick([15, 20, 25, 30]); // cm of mercury
  var SG = 13.6, Cv = 1.0, g = 9.81;
  var dh = (hm / 100) * (SG - 1);              // m of water
  var A2 = Math.PI * Math.pow(D2 / 100, 2) / 4;
  var b4 = Math.pow(D2 / D1, 4);
  function r1q(x) { return Math.round(x * 10) / 10; }
  var Q = r1q(A2 * Math.sqrt(2 * g * dh / (1 - b4)) * 1000);
  var tNoB4 = r1q(A2 * Math.sqrt(2 * g * dh) * 1000);                    // trap: skipped (1-β⁴)
  var tNoM1 = r1q(A2 * Math.sqrt(2 * g * (hm / 100) * SG / (1 - b4)) * 1000); // trap: forgot −1
  var tRawHm = r1q(A2 * Math.sqrt(2 * g * (hm / 100) / (1 - b4)) * 1000);     // trap: mercury head as water
  var question = "A horizontal venturi meter is installed in a \\(" + D1 + "\\text{ cm}\\) water main. The throat diameter is \\(" + D2 + "\\text{ cm}\\). A mercury manometer (specific gravity 13.6) connected between the inlet and the throat shows a \\(" + hm + "\\text{ cm}\\) difference in the mercury columns. Assuming a discharge coefficient Cv = 1.0, what is most nearly the volumetric flow rate?";
  var solution = "Refer to the Venturi Meters section in the Fluid Mechanics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "First convert the manometer reading to head of the flowing fluid (water):\n\n" +
    "$$\\Delta h = h_m(SG_m - 1) = (" + fmt(hm / 100) + ")(13.6 - 1) = " + fmt(dh) + "\\text{ m of water}$$\n\n" +
    "The venturi equation (horizontal, so \\(z_1 = z_2\\)):\n\n" +
    "$$Q = C_v A_2\\sqrt{\\frac{2g\\,\\Delta h}{1 - (D_2/D_1)^4}}$$\n\n" +
    "$$A_2 = \\frac{\\pi}{4}(" + fmt(D2 / 100) + ")^2 = " + fmt(A2) + "\\text{ m}^2, \\qquad \\left(\\frac{D_2}{D_1}\\right)^4 = " + fmt(b4) + "$$\n\n" +
    "$$Q = (1.0)(" + fmt(A2) + ")\\sqrt{\\frac{2(" + g + ")(" + fmt(dh) + ")}{" + fmt(1 - b4) + "}} = " + fmt(Q / 1000) + "\\text{ m}^3\\!/\\!\\text{s} = " + fmt(Q) + "\\text{ L/s}$$";
  // Setup diagram (never the answer): horizontal venturi with inlet and
  // throat diameters labeled, mercury manometer between the two taps.
  var s034 = SVG_HDR + AH +
    '<path d="M 40 70 L 260 70 L 300 120 L 380 120 L 420 70 L 600 70 L 600 230 L 420 230 L 380 180 L 300 180 L 260 230 L 40 230 Z" fill="#f8fafc" stroke="#334155" stroke-width="3"/>' +
    '<line x1="120" y1="150" x2="200" y2="150" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>' +
    '<line x1="150" y1="230" x2="150" y2="290" stroke="#334155" stroke-width="2.5"/>' +
    '<line x1="340" y1="180" x2="340" y2="290" stroke="#334155" stroke-width="2.5"/>' +
    '<path d="M 150 262 L 150 290 L 340 290 L 340 278 L 330 278 L 330 290 L 160 290 L 160 262 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>' +
    '<line x1="160" y1="262" x2="160" y2="278" stroke="#b91c1c" stroke-width="2" marker-start="url(#ah)" marker-end="url(#ah)"/>' +
    '<text x="168" y="274" font-family="sans-serif" font-size="15" fill="#b91c1c">hm = ' + hm + ' cm</text>' +
    '<text x="120" y="60" font-family="sans-serif" font-size="16" fill="#1d4ed8">D1 = ' + D1 + ' cm</text>' +
    '<text x="306" y="112" font-family="sans-serif" font-size="16" fill="#1d4ed8">D2 = ' + D2 + ' cm</text>' +
    '<text x="150" y="208" font-family="sans-serif" font-size="14" fill="#334155">inlet</text>' +
    '<text x="300" y="200" font-family="sans-serif" font-size="14" fill="#334155">throat</text>' +
    '<text x="170" y="297" font-family="sans-serif" font-size="14" fill="#475569">mercury manometer</text>';
  var d034 = svgURL(s034 + SVG_FTR);
  return {
    variantKey: "venturi-D1" + D1 + "-D2" + D2 + "-hm" + hm,
    question: question,
    options: [
      { label: fmt(Q) + " L/s", num: Q, correct: true },
      { label: fmt(tNoB4) + " L/s", num: tNoB4, correct: false },
      { label: fmt(tNoM1) + " L/s", num: tNoM1, correct: false },
      { label: fmt(tRawHm) + " L/s", num: tRawHm, correct: false }
    ],
    solution: solution,
    diagram: d034
  };
}));

/* ---- fluid-035: pitot tube velocity ---- */
reg(buildGenerator({
  baseId: "fluid-035",
  topic: "Fluid Mechanics",
  subtopic: "Pitot tube velocity",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Stagnation pressure converts the velocity head back: v = √(2ΔP/ρ). The big trap multiplies by g as if kPa were meters of head.",
  tiTip: "Partially — no pitot key, but punch √(2ΔP/ρ) straight into the calculator.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var dP = pick([8, 10, 12, 15, 20]); // kPa above static
  function r2q(x) { return Math.round(x * 100) / 100; }
  var v = r2q(Math.sqrt(2 * dP));            // ΔP in kPa → ×1000 Pa, ρ = 1000
  var tG = r2q(Math.sqrt(2 * 9.81 * dP));    // trap: treated kPa as head
  var tNo2 = r2q(Math.sqrt(dP));             // trap: dropped the 2
  var tDec = r2q(v / 10);                    // trap: decimal slip
  // Setup diagram (never the answer): pipe with the pitot tube and static
  // tap; only the measured pressure difference is given. V is the unknown.
  var d035 = (function () {
    var s = "";
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="290" viewBox="0 0 480 290" role="img">' + AH;
    s += '<rect x="40" y="90" width="400" height="120" fill="#dbeafe" stroke="none"/>';
    s += '<line x1="40" y1="90" x2="440" y2="90" stroke="#1a1a1a" stroke-width="4"/>';
    s += '<line x1="40" y1="210" x2="440" y2="210" stroke="#1a1a1a" stroke-width="4"/>';
    s += '<text x="60" y="80" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#1a1a1a">pipe wall</text>';
    s += '<line x1="70" y1="150" x2="190" y2="150" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<text x="130" y="138" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#1d4ed8">V = ?</text>';
    s += '<rect x="234" y="52" width="10" height="100" fill="#bfdbfe" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<rect x="212" y="138" width="44" height="20" fill="#bfdbfe" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<rect x="208" y="140" width="6" height="16" fill="#dbeafe" stroke="none"/>';
    s += '<text x="252" y="66" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">P0</text>';
    s += '<text x="252" y="82" font-family="Georgia,serif" font-size="11" fill="#1a1a1a">stagnation</text>';
    s += '<text x="212" y="180" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#1a1a1a">pitot tube</text>';
    s += '<rect x="340" y="210" width="10" height="28" fill="#bfdbfe" stroke="#1a1a1a" stroke-width="2"/>';
    s += '<text x="358" y="230" font-family="Georgia,serif" font-size="15" fill="#1a1a1a">Ps</text>';
    s += '<text x="358" y="246" font-family="Georgia,serif" font-size="11" fill="#1a1a1a">static tap</text>';
    s += '<text x="240" y="272" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="#1a1a1a">Given: P0 \u2212 Ps = ' + dP + ' kPa, water</text>';
    return svgURL(s + SVG_FTR);
  })();
  var question = "A pitot tube in a water pipeline measures a stagnation pressure \\(" + dP + "\\text{ kPa}\\) above the local static pressure. What is most nearly the flow velocity?";
  var solution = "Refer to the Pitot Tubes section in the Fluid Mechanics chapter of the FE Reference Handbook (v10.6).\n\n" +
    "From the stagnation pressure equation for an incompressible fluid:\n\n" +
    "$$v = \\sqrt{\\frac{2(P_0 - P_s)}{\\rho}} = \\sqrt{\\frac{2(" + (dP * 1000) + ")}{1000}} = \\sqrt{" + (2 * dP) + "} = " + fmt(v) + "\\text{ m/s}$$";
  return {
    variantKey: "pitot-dP" + dP,
    question: question,
    diagram: d035,
    options: [
      { label: fmt(v) + " m/s", num: v, correct: true },
      { label: fmt(tG) + " m/s", num: tG, correct: false },
      { label: fmt(tNo2) + " m/s", num: tNo2, correct: false },
      { label: fmt(tDec) + " m/s", num: tDec, correct: false }
    ],
    solution: solution
  };
}));


/* ============ 2026-10 expansion entries (fluid-036..074) ============
 * One entry per numerical new bank question. fluid-068 (pitot compressibility
 * limit) is a fixed handbook fact (Ma <= 0.3) with no drillable parameter and
 * is skipped, same rationale as the math-pilot conceptual skips. Citations
 * reuse the bank question's own reviewed citation verbatim.
 */
var r1d = function (x) { return Math.round(x * 10) / 10; };
var r2d = function (x) { return Math.round(x * 100) / 100; };
var r3d = function (x) { return Math.round(x * 1000) / 1000; };
var fmtC = function (x) { return fmt(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); };

/* ---- fluid-036: gauge pressure at depth ---- */


/* ---- Parameterized bank-diagram retrofits (fluid) ---- */
var FLUID_AH2 = '<defs><marker id="ahf" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#c0392b"/></marker></defs>';

// fluid-037: contracting pipe; narrow section scales with A2/A1
function dFluid037(v1, A1, A2) {
  var hW = 90, hN = Math.max(14, hW * A2 / A1);
  var yc = 115;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="215" viewBox="0 0 480 215" role="img" aria-label="Pipe contracting from a larger area of ' + A1 + ' square meters with water velocity ' + v1 + ' meters per second to a smaller area of ' + A2 + ' square meters">';
  s += '<rect width="480" height="215" fill="#ffffff"/>' + FLUID_AH2;
  s += '<polygon points="60,' + (yc - hW / 2) + ' 220,' + (yc - hW / 2) + ' 300,' + (yc - hN / 2) + ' 420,' + (yc - hN / 2) + ' 420,' + (yc + hN / 2) + ' 300,' + (yc + hN / 2) + ' 220,' + (yc + hW / 2) + ' 60,' + (yc + hW / 2) + '" fill="#cfe4f5" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="80" y1="115" x2="170" y2="115" stroke="#c0392b" stroke-width="3" marker-end="url(#ahf)"/>';
  s += '<line x1="330" y1="115" x2="400" y2="115" stroke="#c0392b" stroke-width="3" marker-end="url(#ahf)"/>';
  s += '<text x="90" y="104" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">' + v1 + ' m/s</text>';
  s += '<text x="70" y="' + (yc + hW / 2 + 22) + '" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">A\u2081 = ' + A1 + ' m\u00B2</text>';
  s += '<text x="330" y="' + (yc + hN / 2 + 22) + '" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">A\u2082 = ' + A2 + ' m\u00B2</text>';
  s += '<text x="335" y="104" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">v\u2082 = ?</text>';
  return svgURL(s + '</svg>');
}

// fluid-041: two parallel pipes between common junctions; labels carry rolled flows
function dFluid041(QA, QT) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="215" viewBox="0 0 480 215" role="img" aria-label="Two parallel pipes A and B between a common junction on the left and a common junction on the right carrying a total flow of ' + QT + ' cubic feet per second, with pipe A carrying ' + QA + '">';
  s += '<rect width="480" height="215" fill="#ffffff"/>';
  s += '<line x1="40" y1="115" x2="120" y2="115" stroke="#1a1a1a" stroke-width="6"/>';
  s += '<line x1="120" y1="115" x2="120" y2="60" stroke="#1a1a1a" stroke-width="6"/>';
  s += '<line x1="120" y1="60" x2="360" y2="60" stroke="#1a1a1a" stroke-width="6"/>';
  s += '<line x1="360" y1="60" x2="360" y2="115" stroke="#1a1a1a" stroke-width="6"/>';
  s += '<line x1="120" y1="115" x2="120" y2="170" stroke="#1a1a1a" stroke-width="6"/>';
  s += '<line x1="120" y1="170" x2="360" y2="170" stroke="#1a1a1a" stroke-width="6"/>';
  s += '<line x1="360" y1="170" x2="360" y2="115" stroke="#1a1a1a" stroke-width="6"/>';
  s += '<line x1="360" y1="115" x2="440" y2="115" stroke="#1a1a1a" stroke-width="6"/>';
  s += '<text x="200" y="50" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">pipe A: ' + QA + ' cfs</text>';
  s += '<text x="200" y="195" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">pipe B: ?</text>';
  s += '<text x="46" y="105" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">' + QT + ' cfs total</text>';
  return svgURL(s + '</svg>');
}

// fluid-042/046: tank with sharp-edged orifice; water depth scales with h
function dFluidOrifice(h, A0, C, units, hmax) {
  var yBot = 200, px = 130 / hmax;
  var yTop = yBot - h * px;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="215" viewBox="0 0 480 215" role="img" aria-label="Tank with a sharp-edged orifice discharging freely to the atmosphere under a head of ' + h + ' ' + units + '">';
  s += '<rect width="480" height="215" fill="#ffffff"/>' + FLUID_AH2;
  s += '<line x1="100" y1="30" x2="100" y2="200" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<line x1="100" y1="200" x2="300" y2="200" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<line x1="300" y1="30" x2="300" y2="150" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<line x1="300" y1="170" x2="300" y2="200" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<polygon points="102,' + yTop.toFixed(1) + ' 298,' + yTop.toFixed(1) + ' 298,198 102,198" fill="#cfe4f5" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="330" y1="160" x2="380" y2="160" stroke="#c0392b" stroke-width="3" marker-end="url(#ahf)"/>';
  s += '<text x="70" y="' + ((yTop + 160) / 2).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="end" fill="#1a1a1a">h = ' + h + ' ' + units + '</text>';
  s += '<text x="330" y="190" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">A\u2080 = ' + A0 + ' ' + (units === 'm' ? 'm\u00B2' : 'ft\u00B2') + ', C = ' + C + '</text>';
  return svgURL(s + '</svg>');
}

// fluid-047: two tanks, levels scale with h1/h2 above the orifice (11 px/ft as bank)
function dFluid047(h1, h2, A, C) {
  var yO = 161, k = 8;
  var yU = yO - h1 * k, yD = yO - h2 * k;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="236" viewBox="0 0 480 236" role="img" aria-label="Two tanks connected by a submerged orifice, upstream water surface ' + h1.toFixed(1) + ' feet above the orifice center and downstream surface ' + h2.toFixed(1) + ' feet above it">';
  s += '<rect width="480" height="236" fill="#ffffff"/>';
  s += '<rect x="40" y="40" width="150" height="160" fill="none" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<rect x="290" y="40" width="150" height="160" fill="none" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<polygon points="41,' + yU.toFixed(1) + ' 189,' + yU.toFixed(1) + ' 189,199 41,199" fill="#cfe4f5" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<polygon points="291,' + yD.toFixed(1) + ' 439,' + yD.toFixed(1) + ' 439,199 291,199" fill="#cfe4f5" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<rect x="190" y="150" width="100" height="22" fill="#cfe4f5" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="115" y="' + (yU - 8).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">' + h1.toFixed(1) + ' ft</text>';
  s += '<text x="365" y="' + (yD - 8).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">' + h2.toFixed(1) + ' ft</text>';
  s += '<text x="115" y="230" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">upstream</text>';
  s += '<text x="365" y="230" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">downstream</text>';
  s += '<text x="240" y="145" font-family="Helvetica,Arial,sans-serif" font-size="12" text-anchor="middle" fill="#1a1a1a">submerged orifice, A = ' + A + ' ft\u00B2, C = ' + C + '</text>';
  return svgURL(s + '</svg>');
}

// fluid-048: draining tank; initial and final levels scale with h1/h2
function dFluid048(At, A0, h1, h2, hmax) {
  var yBot = 200, k = 130 / hmax;
  var y1 = yBot - h1 * k, y2 = yBot - h2 * k;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="Tank of cross-sectional area ' + At + ' square feet draining through a bottom orifice of ' + A0 + ' square feet, water level falling from ' + h1.toFixed(1) + ' feet to ' + h2.toFixed(1) + ' feet above the orifice">';
  s += '<rect width="480" height="240" fill="#ffffff"/>';
  s += '<line x1="140" y1="30" x2="140" y2="200" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<line x1="340" y1="30" x2="340" y2="200" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<line x1="140" y1="200" x2="200" y2="200" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<line x1="280" y1="200" x2="340" y2="200" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<polygon points="142,' + y1.toFixed(1) + ' 338,' + y1.toFixed(1) + ' 338,198 142,198" fill="#cfe4f5" stroke="#1a1a1a" stroke-width="2" opacity="0.45"/>';
  s += '<polygon points="142,' + y2.toFixed(1) + ' 338,' + y2.toFixed(1) + ' 338,198 142,198" fill="#cfe4f5" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="355" y="' + (y1 + 4).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">' + h1.toFixed(1) + ' ft</text>';
  s += '<text x="355" y="' + (y2 + 4).toFixed(1) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">' + h2.toFixed(1) + ' ft (final)</text>';
  s += '<text x="240" y="228" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">orifice ' + A0 + ' ft\u00B2</text>';
  return svgURL(s + '</svg>');
}

// fluid-051: plate over oil film; labels carry rolled V, d, mu
function dFluid051(v, d, mu) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="185" viewBox="0 0 480 185" role="img" aria-label="Plate moving at ' + v + ' feet per second over a stationary surface separated by an oil film ' + d + ' feet thick">';
  s += '<rect width="480" height="185" fill="#ffffff"/>' + FLUID_AH2;
  s += '<rect x="90" y="56" width="300" height="24" fill="#bdbdbd" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="390" y1="68" x2="450" y2="68" stroke="#c0392b" stroke-width="3" marker-end="url(#ahf)"/>';
  s += '<text x="392" y="52" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">V = ' + v.toFixed(1) + ' ft/s</text>';
  s += '<rect x="90" y="80" width="300" height="56" fill="#f3e3a8" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<rect x="90" y="136" width="300" height="24" fill="#8f8f8f" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="70" y1="80" x2="70" y2="136" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="62" y="112" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="end" fill="#1a1a1a">' + d + ' ft</text>';
  s += '<text x="240" y="112" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">oil, \u03BC = ' + mu + ' lb-s/ft\u00B2</text>';
  s += '<text x="240" y="176" font-family="Helvetica,Arial,sans-serif" font-size="12" text-anchor="middle" fill="#6b7280">moving plate (top), stationary surface (bottom)</text>';
  return svgURL(s + '</svg>');
}

// fluid-066: pitot tube; caption carries rolled dP
function dFluid066(dPpsi) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="215" viewBox="0 0 480 215" role="img" aria-label="Pitot tube in a water pipe facing the flow, with one tube measuring stagnation pressure and a wall tap measuring static pressure"><rect width="480" height="215" fill="#ffffff"/>' + FLUID_AH2;
  s += '<rect x="60" y="70" width="360" height="90" fill="#cfe4f5" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="90" y1="115" x2="230" y2="115" stroke="#c0392b" stroke-width="2" marker-end="url(#ahf)"/>';
  s += '<text x="100" y="104" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">flow, v = ?</text>';
  s += '<path d="M 270 115 L 330 115 L 330 30" fill="none" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<text x="322" y="38" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="end" fill="#1a1a1a">stagnation, P0</text>';
  s += '<line x1="390" y1="70" x2="390" y2="40" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<text x="398" y="50" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">static, Ps</text>';
  s += '<text x="240" y="192" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">P0 \u2212 Ps = ' + dPpsi + ' psi, \u03B3 = 62.4 lb/ft\u00B3</text>';
  return svgURL(s + '</svg>');
}

// fluid-069: venturi; throat scales with D2/D1, head difference labeled
function dFluid069(D1, D2, dh) {
  var hI = 100, hT = Math.max(20, hI * D2 / D1);
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="Horizontal venturi meter with a ' + D1 + ' inch inlet diameter and a ' + D2 + ' inch throat diameter, standpipes showing a piezometric head difference of ' + dh + ' feet of water">';
  s += '<rect width="480" height="240" fill="#ffffff"/>';
  s += '<polygon points="40,' + (150 - hI / 2) + ' 160,' + (150 - hI / 2) + ' 250,' + (150 - hT / 2) + ' 320,' + (150 - hT / 2) + ' 420,' + (150 - hI / 2) + ' 420,' + (150 + hI / 2) + ' 320,' + (150 + hT / 2) + ' 250,' + (150 + hT / 2) + ' 160,' + (150 + hI / 2) + ' 40,' + (150 + hI / 2) + '" fill="#cfe4f5" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="100" y1="' + (150 - hI / 2) + '" x2="100" y2="40" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<line x1="285" y1="' + (150 - hT / 2) + '" x2="285" y2="' + (40 + dh * 6) + '" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<line x1="70" y1="40" x2="130" y2="40" stroke="#2e86c1" stroke-width="1.5"/>';
  s += '<line x1="255" y1="' + (40 + dh * 6) + '" x2="315" y2="' + (40 + dh * 6) + '" stroke="#2e86c1" stroke-width="1.5"/>';
  s += '<text x="330" y="' + (44 + dh * 3) + '" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">\u0394h = ' + dh.toFixed(1) + ' ft</text>';
  s += '<text x="60" y="' + (150 + hI / 2 + 20) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">' + D1 + ' in. (inlet)</text>';
  s += '<text x="250" y="' + (150 + hT / 2 + 20) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">' + D2 + ' in. (throat)</text>';
  return svgURL(s + '</svg>');
}

reg(buildGenerator({
  baseId: "fluid-036", topic: "Fluid Mechanics", subtopic: "Gauge pressure at depth",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Straight P = γh, then Pa to kPa. The traps are the Pa value wearing a kPa label, half the answer, and the depth itself."
}, function () {
  var liq = pick([{ key: "fresh", name: "fresh water", gamma: 9810 }, { key: "sea", name: "seawater", gamma: 10050 }]);
  var h = pick([8, 10, 12, 15, 18, 20]);
  var PkPa = r1d(liq.gamma * h / 1000), tHalf = r1d(PkPa / 2), tPa = liq.gamma * h, tH = h;
  var question = "What is the gauge pressure at a depth of " + h + " m in " + liq.name + " (\u03B3 = " + fmtC(liq.gamma) + " N/m\u00B3)?";
  var solution = "Refer to hydrostatic pressure (P = \u03B3h) in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 182 (PDF page 188).\n\n" +
    "$$\\begin{aligned}P &= \\gamma h \\\\ &= " + fmtC(liq.gamma) + "(" + h + ") \\\\ &= " + fmtC(tPa) + "\\ \\text{Pa} \\\\ &= " + fmt(PkPa) + "\\ \\text{kPa}\\end{aligned}$$";
  return {
    variantKey: liq.key + "-h" + h,
    question: question,
    options: [
      { label: fmt(PkPa) + " kPa", num: PkPa, correct: true },
      { label: fmt(tHalf) + " kPa", num: tHalf, correct: false },
      { label: fmtC(tPa) + " kPa", num: tPa, correct: false },
      { label: h.toFixed(1) + " kPa", num: tH, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-037: continuity ---- */
reg(buildGenerator({
  baseId: "fluid-037", topic: "Fluid Mechanics", subtopic: "Continuity",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "A1v1 = A2v2. The traps invert the area ratio, hand back the inlet velocity, and confuse the flow rate with a velocity."
}, function () {
  var v1 = pick([2, 3, 4]), A1 = pick([0.04, 0.05, 0.06]), A2 = pick([0.01, 0.02, 0.025]);
  var v2 = r2d(v1 * A1 / A2), tInv = r2d(v1 * A2 / A1), tQ = r2d(v1 * A1 * 10);
  var question = "Water flows at " + v1 + " m/s through a pipe with area " + A1 + " m\u00B2. The pipe contracts to " + A2 + " m\u00B2. What is the velocity in the smaller pipe?";
  var solution = "Refer to the continuity equation (A1v1 = A2v2) in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 185 (PDF page 191).\n\n" +
    "For incompressible flow the discharge is the same: \\(A_1v_1 = A_2v_2\\).\n\n" +
    "$$\\begin{aligned}v_2 &= \\frac{A_1v_1}{A_2} \\\\ &= \\frac{" + A1 + "(" + v1 + ")}{" + A2 + "} \\\\ &= " + fmt(v2) + "\\ \\text{m/s}\\end{aligned}$$";
  return {
    variantKey: "v1" + v1 + "_A1_" + pdot(A1) + "_A2_" + pdot(A2),
    question: question, diagram: dFluid037(v1, A1, A2),
    options: [
      { label: fmt(v2) + " m/s", num: v2, correct: true },
      { label: fmt(tInv) + " m/s", num: tInv, correct: false },
      { label: v1.toFixed(1) + " m/s", num: v1, correct: false },
      { label: fmt(tQ) + " m/s", num: tQ, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-038: Darcy-Weisbach head loss (SI) ---- */
reg(buildGenerator({
  baseId: "fluid-038", topic: "Fluid Mechanics", subtopic: "Darcy-Weisbach head loss",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "hf = f(L/D)(v\u00B2/2g). Every trap is a garbled velocity head: doubled, quadrupled, or scaled down."
}, function () {
  var v = pick([2, 2.5, 3]), D = pick([0.15, 0.2, 0.25]), L = pick([50, 100, 150]), f = pick([0.02, 0.025]);
  var hf = r2d(f * (L / D) * v * v / (2 * 9.81)), t2 = r2d(2 * hf), t4 = r2d(4 * hf), tH = r2d(0.4 * hf);
  var question = "Water flows at " + v + " m/s in a " + D + " m diameter pipe, " + L + " m long, with friction factor f = " + f + ". Using the Darcy-Weisbach equation, what is the head loss?";
  var solution = "Refer to Head Loss Due to Flow (Darcy-Weisbach) in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 187 (PDF page 193).\n\n" +
    "$$\\begin{aligned}h_f &= f\\frac{L}{D}\\frac{v^2}{2g} \\\\ &= " + f + "\\left(\\frac{" + L + "}{" + D + "}\\right)\\frac{(" + v + ")^2}{2(9.81)} \\\\ &= " + fmt(hf) + "\\ \\text{m}\\end{aligned}$$";
  return {
    variantKey: "v" + pdot(v) + "_D" + pdot(D) + "_L" + L + "_f" + pdot(f),
    question: question,
    options: [
      { label: fmt(hf) + " m", num: hf, correct: true },
      { label: fmt(t2) + " m", num: t2, correct: false },
      { label: fmt(t4) + " m", num: t4, correct: false },
      { label: fmt(tH) + " m", num: tH, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-039: maximum velocity in laminar pipe flow ---- */
reg(buildGenerator({
  baseId: "fluid-039", topic: "Fluid Mechanics", subtopic: "Maximum velocity in laminar pipe flow",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Laminar pipe flow: vmax = 2\u00D7average. The 1.5\u00D7 and 1.224\u00D7 traps belong to turbulent profiles - exactly the confusion the FE tests."
}, function () {
  var vb = pick([0.6, 0.8, 1.0, 1.2, 1.5]);
  var v2 = r2d(2 * vb), t15 = r2d(1.5 * vb), t124 = r2d(1.224 * vb), t09 = r2d(0.9 * vb);
  var question = "The average velocity in a circular pipe with fully developed laminar flow is " + vb + " m/s. What is the centerline velocity?";
  var solution = "Refer to velocity distribution for laminar flow in circular tubes in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 187 (PDF page 193).\n\n" +
    "For laminar flow in a circular tube the handbook gives \\(v_{max} = 2\\bar v\\).\n\n" +
    "$$v_{max} = 2(" + vb + ") = " + fmt(v2) + "\\ \\text{m/s}$$";
  return {
    variantKey: "vb" + pdot(vb),
    question: question,
    options: [
      { label: v2.toFixed(1) + " m/s", num: v2, correct: true },
      { label: fmt(t15) + " m/s", num: t15, correct: false },
      { label: fmt(t124) + " m/s", num: t124, correct: false },
      { label: fmt(t09) + " m/s", num: t09, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-040: shear stress distribution in pipe ---- */
reg(buildGenerator({
  baseId: "fluid-040", topic: "Fluid Mechanics", subtopic: "Shear stress distribution in pipe",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "\u03C4 varies linearly: \u03C4/\u03C4w = r/R. The traps invert the ratio, square it, or hand back the wall value."
}, function () {
  var R = pick([0.05, 0.1, 0.15]), tw = pick([40, 60, 80, 100]), frac = pick([0.2, 0.4, 0.6]);
  var r = r2d(R * frac), t = r2d(tw * frac), tInv = r2d(tw / frac), tSq = r2d(tw * frac * frac);
  var question = "In a circular pipe of radius " + fmt(R) + " m the shear stress at the wall is " + tw + " Pa. What is the shear stress at r = " + fmt(r) + " m?";
  var solution = "Refer to the shear stress distribution (\u03C4/\u03C4w = r/R) in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 187 (PDF page 193).\n\n" +
    "The shear stress varies linearly with radius: \\(\\tau/\\tau_w = r/R\\).\n\n" +
    "$$\\begin{aligned}\\tau &= " + tw + "\\left(\\frac{" + fmt(r) + "}{" + fmt(R) + "}\\right) \\\\ &= " + fmt(t) + "\\ \\text{Pa}\\end{aligned}$$";
  return {
    variantKey: "R" + pdot(R) + "_tw" + tw + "_r" + pdot(r),
    question: question,
    options: [
      { label: fmt(t) + " Pa", num: t, correct: true },
      { label: fmt(tInv) + " Pa", num: tInv, correct: false },
      { label: fmt(tSq) + " Pa", num: tSq, correct: false },
      { label: tw + " Pa", num: tw, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-041: parallel pipes flow split ---- */
reg(buildGenerator({
  baseId: "fluid-041", topic: "Fluid Mechanics", subtopic: "Parallel pipes flow split",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "Two facts in one question: flows add (QB = Q \u2212 QA) and parallel branches share the same head loss between the same two junctions."
}, function () {
  var pairs = [[8, 3], [10, 4], [12, 5], [16, 6], [20, 8]];
  var pr = pick(pairs), QT = pr[0], QA = pr[1], QB = QT - QA;
  var question = "Two parallel pipes carry a total flow of " + QT + " cfs. Pipe A carries " + QA + " cfs. What is the flow in pipe B, and what does the handbook say about head loss?";
  var solution = "Refer to Multipath Pipeline Problems (pipes in parallel) in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 191 (PDF page 197).\n\n" +
    "The flows add:\n\n" +
    "$$Q_B = Q - Q_A = " + QT + " - " + QA + " = " + QB + "\\ \\text{cfs}$$\n\n" +
    "For pipes in parallel the handbook states the head loss is the same in each branch between the common junctions.";
  return {
    variantKey: "QT" + QT + "_QA" + QA,
    question: question, diagram: dFluid041(QA, QT),
    options: [
      { label: QB + " cfs, and the head loss is the same in both pipes", num: null, correct: true },
      { label: QB + " cfs, and the head loss adds across the two pipes", num: null, correct: false },
      { label: QA + " cfs, because each pipe carries half", num: null, correct: false },
      { label: QB + " cfs, and the head loss in B is 1.5 times that in A", num: null, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-042: orifice discharge (SI) ---- */
reg(buildGenerator({
  baseId: "fluid-042", topic: "Fluid Mechanics", subtopic: "Orifice discharge",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Q = Cd A0 \u221A(2gh). Traps drop the 2 under the radical, drop the radical entirely, or halve the area."
}, function () {
  var Cd = pick([0.61, 0.62]), A0 = pick([0.005, 0.01, 0.02]), h = pick([2, 4, 6]);
  var Q = Cd * A0 * Math.sqrt(2 * 9.81 * h) * 1000;
  var tNo2 = Cd * A0 * Math.sqrt(9.81 * h) * 1000, tNoSqrt = Cd * A0 * 2 * 9.81 * h * 1000, tHalfA = Q / 2;
  var question = "A sharp-edged orifice has area A0 = " + A0 + " m\u00B2, a head of " + h + " m to its centroid and a discharge coefficient of " + Cd + ". Using Q = Cd A0 \u221A(2gh) (the handbook free-discharge form), what is Q?";
  var solution = "Refer to Orifice Discharging Freely into Atmosphere in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 190 (PDF page 196).\n\n" +
    "$$\\begin{aligned}Q &= C_dA_0\\sqrt{2gh} \\\\ &= " + Cd + "(" + A0 + ")\\sqrt{2(9.81)(" + h + ")} \\\\ &= " + fmt(r3d(Q / 1000)) + "\\ \\text{m}^3/\\text{s} \\\\ &= " + r1d(Q).toFixed(1) + "\\ \\text{L/s}\\end{aligned}$$";
  return {
    variantKey: "Cd" + pdot(Cd) + "_A" + pdot(A0) + "_h" + h,
    question: question, diagram: dFluidOrifice(h, A0, Cd, "m", 6),
    options: [
      { label: r1d(Q).toFixed(1) + " L/s", num: r1d(Q), correct: true },
      { label: r1d(tNo2).toFixed(1) + " L/s", num: r1d(tNo2), correct: false },
      { label: fmt(Math.round(tNoSqrt)) + " L/s", num: Math.round(tNoSqrt), correct: false },
      { label: r1d(tHalfA).toFixed(1) + " L/s", num: r1d(tHalfA), correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-043: pump affinity law, flow ---- */
reg(buildGenerator({
  baseId: "fluid-043", topic: "Fluid Mechanics", subtopic: "Pump affinity law, flow",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Q scales with N to the FIRST power. The squared and cubed ratios are the head and power laws wearing the wrong hat."
}, function () {
  var Q1 = pick([400, 500, 600]), N1 = 1750, N2 = pick([1150, 1450]);
  var r = N2 / N1, Q2 = Math.round(Q1 * r), tInv = Math.round(Q1 / r), tSq = Math.round(Q1 * r * r), tCu = Math.round(Q1 * r * r * r);
  var question = "A pump delivers " + Q1 + " gpm at " + fmtC(N1) + " rpm. Using the affinity laws with the same impeller, what is the flow at " + fmtC(N2) + " rpm?";
  var solution = "Refer to Fans, Pumps, and Compressors: Scaling Laws; Affinity Laws in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 199 (PDF page 205).\n\n" +
    "Flow is proportional to speed at constant diameter (derived from the handbook's \\(Q/(ND^3)\\) group).\n\n" +
    "$$\\begin{aligned}Q_2 &= Q_1\\frac{N_2}{N_1} \\\\ &= " + Q1 + "\\left(\\frac{" + N2 + "}{" + N1 + "}\\right) \\\\ &= " + Q2 + "\\ \\text{gpm}\\end{aligned}$$";
  return {
    variantKey: "Q" + Q1 + "_N" + N2,
    question: question,
    options: [
      { label: Q2 + " gpm", num: Q2, correct: true },
      { label: tInv + " gpm", num: tInv, correct: false },
      { label: tSq + " gpm", num: tSq, correct: false },
      { label: tCu + " gpm", num: tCu, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-044: pump affinity law, head ---- */
reg(buildGenerator({
  baseId: "fluid-044", topic: "Fluid Mechanics", subtopic: "Pump affinity law, head",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Head scales with N SQUARED. The linear and cubic ratios are the flow and power laws, and the inverted ratio reads the speed change backwards."
}, function () {
  var H1 = pick([80, 100, 120]), N1 = 1750, N2 = pick([1150, 1450]);
  var r = N2 / N1, H2 = r1d(H1 * r * r), tLin = r1d(H1 * r), tCu = r1d(H1 * r * r * r), tInv = r1d(H1 / (r * r));
  var question = "A pump develops " + H1 + " ft of head at " + fmtC(N1) + " rpm. What head does it develop at " + fmtC(N2) + " rpm with the same impeller (affinity laws)?";
  var solution = "Refer to Fans, Pumps, and Compressors: Scaling Laws; Affinity Laws in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 199 (PDF page 205).\n\n" +
    "Head is proportional to speed squared at constant diameter (from the handbook's \\(H/(N^2D^2)\\) group).\n\n" +
    "$$\\begin{aligned}H_2 &= H_1\\left(\\frac{N_2}{N_1}\\right)^2 \\\\ &= " + H1 + "\\left(\\frac{" + N2 + "}{" + N1 + "}\\right)^2 \\\\ &= " + fmt(H2) + "\\ \\text{ft}\\end{aligned}$$";
  return {
    variantKey: "H" + H1 + "_N" + N2,
    question: question,
    options: [
      { label: fmt(H2) + " ft", num: H2, correct: true },
      { label: fmt(tLin) + " ft", num: tLin, correct: false },
      { label: fmt(tCu) + " ft", num: tCu, correct: false },
      { label: fmt(tInv) + " ft", num: tInv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-045: pump affinity law, power ---- */
reg(buildGenerator({
  baseId: "fluid-045", topic: "Fluid Mechanics", subtopic: "Pump affinity law, power",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Power scales with N CUBED. The linear and squared ratios are the flow and head laws; the fourth power is a decoy."
}, function () {
  var P1 = pick([20, 30, 40]), N1 = 1750, N2 = pick([1150, 1450]);
  var r = N2 / N1, P2 = r1d(P1 * Math.pow(r, 3)), tLin = r1d(P1 * r), tSq = r1d(P1 * r * r), t4 = r1d(P1 * Math.pow(r, 4));
  var question = "A pump uses " + P1 + " hp at " + fmtC(N1) + " rpm. Using the affinity laws with the same impeller and fluid, what power at " + fmtC(N2) + " rpm?";
  var solution = "Refer to Fans, Pumps, and Compressors: Scaling Laws; Affinity Laws in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 199 (PDF page 205).\n\n" +
    "Power is proportional to speed cubed at constant diameter (from the handbook's \\(P/(\\rho N^3D^5)\\) group).\n\n" +
    "$$\\begin{aligned}P_2 &= P_1\\left(\\frac{N_2}{N_1}\\right)^3 \\\\ &= " + P1 + "\\left(\\frac{" + N2 + "}{" + N1 + "}\\right)^3 \\\\ &= " + fmt(P2) + "\\ \\text{hp}\\end{aligned}$$";
  return {
    variantKey: "P" + P1 + "_N" + N2,
    question: question,
    options: [
      { label: fmt(P2) + " hp", num: P2, correct: true },
      { label: fmt(tSq) + " hp", num: tSq, correct: false },
      { label: fmt(tLin) + " hp", num: tLin, correct: false },
      { label: fmt(t4) + " hp", num: t4, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-046: free orifice discharge (US) ---- */
reg(buildGenerator({
  baseId: "fluid-046", topic: "Fluid Mechanics", subtopic: "Free orifice discharge",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Q = CA0\u221A(2gh) with g = 32.2 ft/s\u00B2. Traps use g = 9.81 in US units, drop the 2, or square the head outside the radical."
}, function () {
  var C = pick([0.6, 0.61, 0.62]), A0 = pick([0.03, 0.05, 0.08]), h = pick([4, 6, 9]);
  var Q = r2d(C * A0 * Math.sqrt(2 * 32.2 * h));
  var tSI = r2d(C * A0 * Math.sqrt(2 * 9.81 * h)), tNo2 = r2d(C * A0 * Math.sqrt(32.2 * h)), tNoSqrt = r2d(C * A0 * 2 * 32.2 * h);
  var question = "A sharp-edged orifice with C = " + C + " and an area of " + A0 + " ft\u00B2 discharges freely into the atmosphere under a head of " + h.toFixed(1) + " ft measured to the orifice centroid. What is the flow?";
  var solution = "Refer to Orifice Discharging Freely into Atmosphere in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 190 (PDF page 196).\n\n" +
    "The handbook gives \\(Q = CA_0\\sqrt{2gh}\\):\n\n" +
    "$$\\begin{aligned}Q &= " + C + "(" + A0 + ")\\sqrt{2(32.2)(" + h.toFixed(1) + ")} \\\\ &= " + fmt(Q) + "\\ \\text{cfs}\\end{aligned}$$";
  return {
    variantKey: "C" + pdot(C) + "_A" + pdot(A0) + "_h" + h,
    question: question, diagram: dFluidOrifice(h, A0, C, "ft", 9),
    options: [
      { label: Q.toFixed(2) + " cfs", num: Q, correct: true },
      { label: tSI.toFixed(2) + " cfs", num: tSI, correct: false },
      { label: tNo2.toFixed(2) + " cfs", num: tNo2, correct: false },
      { label: tNoSqrt.toFixed(2) + " cfs", num: tNoSqrt, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-047: submerged orifice discharge ---- */
reg(buildGenerator({
  baseId: "fluid-047", topic: "Fluid Mechanics", subtopic: "Submerged orifice discharge",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "Submerged: only the DIFFERENCE of the two surface heads drives the flow. Using either head alone is the classic miss."
}, function () {
  var C = pick([0.6, 0.61]), A = pick([0.02, 0.03, 0.04]);
  var h1 = pick([9, 12, 15]), dh = pick([3, 5, 7]);
  var h2 = h1 - dh;
  var Q = r3d(C * A * Math.sqrt(2 * 32.2 * dh));
  var tH1 = r3d(C * A * Math.sqrt(2 * 32.2 * h1)), tSum = r3d(C * A * Math.sqrt(2 * 32.2 * (h1 + h2))), tH2 = r3d(C * A * Math.sqrt(2 * 32.2 * h2));
  var question = "A submerged orifice (C = " + C + ", A = " + A + " ft\u00B2) connects two tanks. The upstream water surface is " + h1.toFixed(1) + " ft above the orifice centerline and the downstream surface is " + h2.toFixed(1) + " ft above it. What is the flow?";
  var solution = "Refer to Submerged Orifice Operating under Steady-Flow Conditions in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 190 (PDF page 196).\n\n" +
    "The handbook gives \\(Q = CA\\sqrt{2g(h_1-h_2)}\\), with the head difference between the two surfaces:\n\n" +
    "$$\\begin{aligned}Q &= " + C + "(" + A + ")\\sqrt{2(32.2)(" + h1.toFixed(1) + "-" + h2.toFixed(1) + ")} \\\\ &= " + fmt(Q) + "\\ \\text{cfs}\\end{aligned}$$";
  return {
    variantKey: "C" + pdot(C) + "_A" + pdot(A) + "_h1_" + h1 + "_h2_" + h2,
    question: question, diagram: dFluid047(h1, h2, A, C),
    options: [
      { label: fmt(Q) + " cfs", num: Q, correct: true },
      { label: fmt(tH1) + " cfs", num: tH1, correct: false },
      { label: fmt(tSum) + " cfs", num: tSum, correct: false },
      { label: fmt(tH2) + " cfs", num: tH2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-048: tank drain time through an orifice ---- */
reg(buildGenerator({
  baseId: "fluid-048", topic: "Fluid Mechanics", subtopic: "Tank drain time through an orifice",
  difficulty: "hard", estimatedTimeSeconds: 180,
  explanation: "\u0394t = 2(At/A0)(\u221Ah1 \u2212 \u221Ah2)/\u221A(2g). Traps: forget the factor 2, drop the \u221A(2g) division, or use At alone instead of the area ratio."
}, function () {
  var ratio = pick([100, 200, 400]);         // At/A0
  var At = pick([2, 4]);                     // ft^2
  var A0 = r2d(At * ratio / 1000 * 10 / 10); // display: At/ratio keeps 0.01/0.02 style
  A0 = At / ratio;
  var h1 = pick([5, 8, 10]), h2 = pick([1, 2]);
  var dt = Math.round(2 * ratio * (Math.sqrt(h1) - Math.sqrt(h2)) / Math.sqrt(2 * 32.2));
  var tNo2 = Math.round(ratio * (Math.sqrt(h1) - Math.sqrt(h2)) / Math.sqrt(2 * 32.2));
  var tNoG = Math.round(2 * ratio * (Math.sqrt(h1) - Math.sqrt(h2)));
  var tHdiff = Math.round(2 * ratio * Math.sqrt(h1 - h2) / Math.sqrt(2 * 32.2));
  var question = "A tank with a cross-sectional area of " + At.toFixed(1) + " ft\u00B2 drains through a bottom orifice of area " + A0.toFixed(2) + " ft\u00B2 (take C = 1.0). How long does the water level take to fall from " + h1.toFixed(1) + " ft to " + h2.toFixed(1) + " ft above the orifice?";
  var solution = "Refer to Time required to drain a tank in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 190 (PDF page 196).\n\n" +
    "The handbook gives \\(\\Delta t = \\dfrac{2(A_t/A_0)}{\\sqrt{2g}}\\left(h_1^{1/2} - h_2^{1/2}\\right)\\):\n\n" +
    "$$\\begin{aligned}\\Delta t &= \\frac{2(" + ratio + ")}{\\sqrt{2(32.2)}}(\\sqrt{" + h1.toFixed(1) + "}-\\sqrt{" + h2.toFixed(1) + "}) \\\\ &= " + dt + "\\ \\text{s}\\end{aligned}$$";
  return {
    variantKey: "At" + pdot(At) + "_A0_" + pdot(A0) + "_h1_" + h1 + "_h2_" + h2,
    question: question, diagram: dFluid048(At, A0, h1, h2, 10),
    options: [
      { label: dt + " s", num: dt, correct: true },
      { label: tNoG + " s", num: tNoG, correct: false },
      { label: tHdiff + " s", num: tHdiff, correct: false },
      { label: tNo2 + " s", num: tNo2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-049: capillary rise in a tube (US) ---- */
reg(buildGenerator({
  baseId: "fluid-049", topic: "Fluid Mechanics", subtopic: "Capillary rise in a tube",
  difficulty: "medium", estimatedTimeSeconds: 150,
  explanation: "h = 4\u03C3cos\u03B2/(\u03B3d). The whole game is units: inches to feet for the diameter, then feet back to inches for the rise."
}, function () {
  var din = pick([0.0625, 0.125, 0.25]);  // tube diameter, in
  var sigma = 0.005, gamma = 62.4;
  var dft = din / 12;
  var hft = 4 * sigma / (gamma * dft);
  var hin = r2d(hft * 12);
  var tDbl = r2d(hin * 2), tHalf = r2d(hin / 2), tFt = r2d(hft);
  var question = "Water (surface tension 0.005 lb/ft, specific weight 62.4 lb/ft\u00B3, contact angle 0 degrees) rises in a clean glass tube of " + din + " in. diameter. What is the capillary rise?";
  var solution = "Refer to Surface Tension and Capillarity in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 182 (PDF page 188).\n\n" +
    "The handbook gives \\(h = \\dfrac{4\\sigma\\cos\\beta}{\\gamma d}\\):\n\n" +
    "$$\\begin{aligned}h &= \\frac{4(0.005)(1)}{62.4(" + r3d(dft) + ")} \\\\ &= " + r3d(hft) + "\\ \\text{ft} \\\\ &= " + fmt(hin) + "\\ \\text{in.}\\end{aligned}$$";
  return {
    variantKey: "d" + pdot(din),
    question: question,
    options: [
      { label: fmt(hin) + " in.", num: hin, correct: true },
      { label: fmt(tDbl) + " in.", num: tDbl, correct: false },
      { label: fmt(tHalf) + " in.", num: tHalf, correct: false },
      { label: fmt(tFt) + " in.", num: tFt, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-051: shear stress in a thin fluid film ---- */
reg(buildGenerator({
  baseId: "fluid-051", topic: "Fluid Mechanics", subtopic: "Shear stress in a thin fluid film",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "\u03C4 = \u03BC(v/\u03B4) for a linear film. Traps multiply by \u03B4 instead of dividing, or drop powers of ten in the division."
}, function () {
  var v = pick([2, 3, 4, 5]);               // ft/s
  var d = pick([0.005, 0.01, 0.02]);        // film thickness, ft
  var mu = pick([0.02, 0.03, 0.04]);        // lb-s/ft^2
  var t = r2d(mu * v / d);
  var tMul = r2d(mu * v * d), t10 = r2d(t / 10), t100 = r2d(t * 100);
  var question = "A plate moves at " + v.toFixed(1) + " ft/s over a stationary surface separated by a " + d + " ft oil film with a viscosity of " + mu + " lb-s/ft\u00B2. Assuming a linear velocity profile, what is the shear stress?";
  var solution = "Refer to For a thin Newtonian fluid film and a linear velocity profile in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 182 (PDF page 188).\n\n" +
    "For a linear profile \\(dv/dy = v/\\delta\\) and \\(\\tau = \\mu\\,dv/dy\\):\n\n" +
    "$$\\begin{aligned}\\tau &= " + mu + "\\left(\\frac{" + v.toFixed(1) + "}{" + d + "}\\right) \\\\ &= " + fmt(t) + "\\ \\text{psf}\\end{aligned}$$";
  return {
    variantKey: "v" + v + "_d" + pdot(d) + "_mu" + pdot(mu),
    question: question, diagram: dFluid051(v, d, mu),
    options: [
      { label: fmt(t) + " psf", num: t, correct: true },
      { label: fmt(tMul) + " psf", num: tMul, correct: false },
      { label: fmt(t10) + " psf", num: t10, correct: false },
      { label: fmt(t100) + " psf", num: t100, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-052: pressure difference in a static liquid ---- */
reg(buildGenerator({
  baseId: "fluid-052", topic: "Fluid Mechanics", subtopic: "Pressure difference in a static liquid",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "\u0394P = \u03B3\u0394z. The psi trap forgets that \u03B3\u0394z comes out in psf; the others garble the arithmetic."
}, function () {
  var dz = pick([15, 20, 25, 30]);
  var P = Math.round(62.4 * dz);            // psf
  var tPsi = r2d(P / 144), tH = dz, tHalf = Math.round(P / 2);
  var question = "Two points in static water are " + dz.toFixed(1) + " ft apart vertically. What is the pressure difference between them?";
  var solution = "Refer to The Pressure Field in a Static Liquid in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 182 (PDF page 188).\n\n" +
    "The handbook gives \\(P_2 - P_1 = -\\gamma(z_2 - z_1) = -\\gamma h\\), so the magnitude is \\(\\gamma h = 62.4(" + dz + ") = " + fmtC(P) + "\\) psf.";
  return {
    variantKey: "dz" + dz,
    question: question,
    options: [
      { label: fmtC(P) + " psf", num: P, correct: true },
      { label: fmt(tPsi) + " psf", num: tPsi, correct: false },
      { label: dz + " psf", num: tH, correct: false },
      { label: fmtC(tHalf) + " psf", num: tHalf, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-053: absolute pressure from a vacuum gauge ---- */
reg(buildGenerator({
  baseId: "fluid-053", topic: "Fluid Mechanics", subtopic: "Absolute pressure from a vacuum gauge",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Vacuum reading is BELOW atmospheric: Pabs = Patm \u2212 Pvac. Adding instead of subtracting is the whole trap."
}, function () {
  var patm = pick([14.7, 14.5, 14.2]), pv = pick([2, 4, 5, 6]);
  var pabs = r1d(patm - pv), tAdd = r1d(patm + pv);
  var question = "A vacuum gauge reads " + pv + " psi (below atmospheric) where atmospheric pressure is " + patm + " psi. What is the absolute pressure?";
  var solution = "Refer to The Pressure Field in a Static Liquid in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 182 (PDF page 188).\n\n" +
    "The handbook states absolute pressure = atmospheric pressure \u2212 vacuum gauge reading: " + patm + " \u2212 " + pv + " = " + fmt(pabs) + " psi.";
  return {
    variantKey: "pa" + pdot(patm) + "_pv" + pv,
    question: question,
    options: [
      { label: fmt(pabs) + " psi", num: pabs, correct: true },
      { label: fmt(tAdd) + " psi", num: tAdd, correct: false },
      { label: pv.toFixed(1) + " psi", num: pv, correct: false },
      { label: MINUS + pv.toFixed(1) + " psi", num: -pv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-054: laminar pipe flow centerline velocity (US) ---- */
reg(buildGenerator({
  baseId: "fluid-054", topic: "Fluid Mechanics", subtopic: "Laminar pipe flow centerline velocity",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Same laminar rule as the SI version: vmax = 2\u00D7average. The 1.18\u00D7 trap is the 1/7-power turbulent profile."
}, function () {
  var vb = pick([6, 8, 10, 12]);            // ft/s
  var v2 = r2d(2 * vb), t118 = r2d(1.18 * vb), tHalf = r2d(vb / 2), t15 = r2d(1.5 * vb);
  var question = "Water flows in a circular pipe in the laminar regime with an average velocity of " + vb.toFixed(1) + " ft/s. What is the centerline velocity?";
  var solution = "Refer to Velocity distribution for laminar flow in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 187 (PDF page 193).\n\n" +
    "For laminar flow in a circular tube the handbook gives \\(v_{max} = 2\\bar v\\):\n\n" +
    "$$v_{max} = 2(" + vb.toFixed(1) + ") = " + fmt(v2) + "\\ \\text{ft/s}$$";
  return {
    variantKey: "vb" + vb,
    question: question,
    options: [
      { label: fmt(v2) + " ft/s", num: v2, correct: true },
      { label: fmt(t118) + " ft/s", num: t118, correct: false },
      { label: fmt(tHalf) + " ft/s", num: tHalf, correct: false },
      { label: fmt(t15) + " ft/s", num: t15, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-055: Darcy-Weisbach head loss (US) ---- */
reg(buildGenerator({
  baseId: "fluid-055", topic: "Fluid Mechanics", subtopic: "Darcy-Weisbach head loss",
  difficulty: "medium", estimatedTimeSeconds: 150,
  explanation: "Darcy in US units, with the inches-to-feet conversion on the diameter doing the damage. Traps skip the conversion or garble the velocity head."
}, function () {
  var Din = pick([4, 6, 8, 12]);            // in
  var L = pick([300, 500, 800]);            // ft
  var v = pick([4, 6, 8]);                  // ft/s
  var f = pick([0.02, 0.025, 0.03]);
  var D = Din / 12;
  var hf = r1d(f * (L / D) * v * v / (2 * 32.2));
  var tNoConv = r1d(f * (L / Din) * v * v / (2 * 32.2)), tHalf = r1d(hf / 6), t4 = r1d(4 * hf);
  var question = "A " + L + " ft pipe of " + Din + " in. diameter carries water at " + v.toFixed(1) + " ft/s with a Darcy friction factor of " + f + ". What is the friction head loss?";
  var solution = "Refer to Head Loss Due to Flow in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 187 (PDF page 193).\n\n" +
    "$$\\begin{aligned}h_f &= f\\frac{L}{D}\\frac{v^2}{2g} \\\\ &= " + f + "\\left(\\frac{" + L + "}{" + fmt(r3d(D)) + "}\\right)\\frac{(" + v.toFixed(1) + ")^2}{2(32.2)} \\\\ &= " + fmt(hf) + "\\ \\text{ft}\\end{aligned}$$";
  return {
    variantKey: "D" + Din + "_L" + L + "_v" + v + "_f" + pdot(f),
    question: question,
    options: [
      { label: fmt(hf) + " ft", num: hf, correct: true },
      { label: fmt(tNoConv) + " ft", num: tNoConv, correct: false },
      { label: fmt(tHalf) + " ft", num: tHalf, correct: false },
      { label: fmt(t4) + " ft", num: t4, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-056: minor loss in a fitting ---- */
reg(buildGenerator({
  baseId: "fluid-056", topic: "Fluid Mechanics", subtopic: "Minor loss in a fitting",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "hL = C(v\u00B2/2g). The traps forget C, forget the 2 in 2g, or use g in SI units."
}, function () {
  var C = pick([1.5, 2.5, 4, 5]), v = pick([6, 8, 10]);
  var h = r2d(C * v * v / (2 * 32.2));
  var tNoC = r2d(v * v / (2 * 32.2)), tG = r2d(C * v * v / 32.2), tSI = r2d(C * v * v / (2 * 9.81));
  var question = "A valve has a loss coefficient C = " + C + " and the water velocity through it is " + v.toFixed(1) + " ft/s. What is the head loss?";
  var solution = "Refer to Minor Losses in Pipe Fittings in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 187 (PDF page 193).\n\n" +
    "$$\\begin{aligned}h_L &= C\\frac{v^2}{2g} \\\\ &= " + C + "\\frac{(" + v.toFixed(1) + ")^2}{2(32.2)} \\\\ &= " + fmt(h) + "\\ \\text{ft}\\end{aligned}$$";
  return {
    variantKey: "C" + pdot(C) + "_v" + v,
    question: question,
    options: [
      { label: fmt(h) + " ft", num: h, correct: true },
      { label: fmt(tNoC) + " ft", num: tNoC, correct: false },
      { label: fmt(tG) + " ft", num: tG, correct: false },
      { label: fmt(tSI) + " ft", num: tSI, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-057: fan power ---- */
reg(buildGenerator({
  baseId: "fluid-057", topic: "Fluid Mechanics", subtopic: "Fan power",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "W = \u0394P\u00B7Q/\u03B7. The traps skip the efficiency division or multiply by it - dividing by a number under 1 makes power BIGGER, which is the sense check."
}, function () {
  var dP = pick([20, 31.2, 40, 50]);        // psf
  var Q = pick([2, 3, 4]);                  // cfs
  var eta = pick([0.55, 0.65, 0.75]);
  var W = Math.round(dP * Q / eta);
  var tNoEta = Math.round(dP * Q), tMulEta = Math.round(dP * Q * eta), tSum = Math.round((dP + Q) / eta);
  var question = "A backward curved fan raises the pressure by " + dP + " psf while moving " + Q.toFixed(1) + " cfs at a fan efficiency of " + eta + ". What is the fan power?";
  var solution = "Refer to Fan Characteristics in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 197 (PDF page 203).\n\n" +
    "The handbook gives \\(\\dot W = \\Delta PQ/\\eta_f\\):\n\n" +
    "$$\\begin{aligned}\\dot W &= \\frac{" + dP + "(" + Q.toFixed(1) + ")}{" + eta + "} \\\\ &= " + fmt(W) + "\\ \\text{ft-lbf/s}\\end{aligned}$$";
  return {
    variantKey: "dP" + pdot(dP) + "_Q" + Q + "_e" + pdot(eta),
    question: question,
    options: [
      { label: fmt(W) + " ft-lbf/s", num: W, correct: true },
      { label: fmt(tNoEta) + " ft-lbf/s", num: tNoEta, correct: false },
      { label: fmt(tMulEta) + " ft-lbf/s", num: tMulEta, correct: false },
      { label: fmt(tSum) + " ft-lbf/s", num: tSum, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-058: compressor power, ideal gas ---- */
reg(buildGenerator({
  baseId: "fluid-058", topic: "Fluid Mechanics", subtopic: "Compressor power, ideal gas",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "|W| = m\u00B7cp\u00B7(Te \u2212 Ti). Traps add the temperatures, use exit alone, or multiply the temperatures."
}, function () {
  var mdot = pick([1.5, 2, 2.5]), cp = pick([0.24, 0.25]);
  var Ti = pick([520, 540, 560]), dT = pick([300, 320, 340]);
  var Te = Ti + dT;
  var W = r1d(mdot * cp * dT);
  var tAdd = r1d(mdot * cp * (Ti + Te)), tTe = r1d(mdot * cp * Te), t2x = r1d(2 * W);
  var question = "An adiabatic air compressor (\\(c_p\\) = " + cp + " Btu/lbm-R, constant) takes in " + mdot.toFixed(1) + " lbm/s at " + Ti + " R and delivers it at " + Te + " R. What is the magnitude of the compressor power?";
  var solution = "Refer to Compressors in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 197 (PDF page 203).\n\n" +
    "The handbook gives \\(\\dot W_{comp} = -\\dot mc_p(T_e - T_i)\\); the magnitude is:\n\n" +
    "$$\\begin{aligned}|\\dot W| &= " + mdot.toFixed(1) + "(" + cp + ")(" + Te + "-" + Ti + ") \\\\ &= " + fmt(W) + "\\ \\text{Btu/s}\\end{aligned}$$";
  return {
    variantKey: "m" + pdot(mdot) + "_cp" + pdot(cp) + "_Ti" + Ti + "_Te" + Te,
    question: question,
    options: [
      { label: fmt(W) + " Btu/s", num: W, correct: true },
      { label: fmt(tAdd) + " Btu/s", num: tAdd, correct: false },
      { label: fmt(tTe) + " Btu/s", num: tTe, correct: false },
      { label: fmt(t2x) + " Btu/s", num: t2x, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-059: compressor isentropic efficiency ---- */
reg(buildGenerator({
  baseId: "fluid-059", topic: "Fluid Mechanics", subtopic: "Compressor isentropic efficiency",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "\u03B7C = (Tes \u2212 Ti)/(Te \u2212 Ti): ideal over actual for a compressor (the turbine inverts it). Ratios of raw temperatures are decoys."
}, function () {
  var Ti = pick([520, 540, 560]);
  var Tes = pick([780, 800, 820]);          // isentropic exit
  var Te = pick([840, 860, 880]);           // actual exit (> Tes)
  if (Te <= Tes) { Te = Tes + 40; }
  var eta = r2d((Tes - Ti) / (Te - Ti));
  var tInv = r2d((Te - Ti) / (Tes - Ti)), tRaw = r2d(Tes / Te), tDiff = r2d((Te - Tes) / (Te - Ti));
  var question = "A compressor takes in air at " + Ti + " R. The isentropic exit temperature would be " + Tes + " R, but the actual exit temperature is " + Te + " R. What is the compressor isentropic efficiency?";
  var solution = "Refer to Compressor Isentropic Efficiency in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 197 (PDF page 203).\n\n" +
    "The handbook gives \\(\\eta_C = \\dfrac{T_{es} - T_i}{T_e - T_i}\\):\n\n" +
    "$$\\eta_C = \\frac{" + Tes + "-" + Ti + "}{" + Te + "-" + Ti + "} = " + fmt(eta) + "$$";
  return {
    variantKey: "Ti" + Ti + "_Tes" + Tes + "_Te" + Te,
    question: question,
    options: [
      { label: fmt(eta), num: eta, correct: true },
      { label: fmt(tDiff), num: tDiff, correct: false },
      { label: fmt(tRaw), num: tRaw, correct: false },
      { label: fmt(tInv), num: tInv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-060: turbine power, ideal gas ---- */
reg(buildGenerator({
  baseId: "fluid-060", topic: "Fluid Mechanics", subtopic: "Turbine power, ideal gas",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "W = m\u00B7cp\u00B7(Ti \u2212 Te) for a turbine. Same structure as the compressor, sign flipped - the traps add or misuse the temperatures."
}, function () {
  var mdot = pick([2, 3, 4]), cp = pick([0.26, 0.28]);
  var Ti = pick([1500, 1600, 1700]), dT = pick([400, 500, 600]);
  var Te = Ti - dT;
  var W = Math.round(mdot * cp * dT);
  var tAdd = Math.round(mdot * cp * (Ti + Te)), tTe = Math.round(mdot * cp * Te), tTi = Math.round(mdot * cp * Ti);
  var question = "An adiabatic gas turbine (\\(c_p\\) = " + cp + " Btu/lbm-R) passes " + mdot.toFixed(1) + " lbm/s, entering at " + Ti + " R and leaving at " + Te + " R. What is the turbine power output?";
  var solution = "Refer to Turbines in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 199 (PDF page 205).\n\n" +
    "The handbook gives \\(\\dot W_{turb} = \\dot mc_p(T_i - T_e)\\):\n\n" +
    "$$\\begin{aligned}\\dot W &= " + mdot.toFixed(1) + "(" + cp + ")(" + Ti + "-" + Te + ") \\\\ &= " + fmt(W) + "\\ \\text{Btu/s}\\end{aligned}$$";
  return {
    variantKey: "m" + mdot + "_cp" + pdot(cp) + "_Ti" + Ti + "_Te" + Te,
    question: question,
    options: [
      { label: fmt(W) + " Btu/s", num: W, correct: true },
      { label: fmt(tAdd) + " Btu/s", num: tAdd, correct: false },
      { label: fmtC(tTi) + " Btu/s", num: tTi, correct: false },
      { label: fmtC(tTe) + " Btu/s", num: tTe, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-061: turbine isentropic efficiency ---- */
reg(buildGenerator({
  baseId: "fluid-061", topic: "Fluid Mechanics", subtopic: "Turbine isentropic efficiency",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "\u03B7T = (Ti \u2212 Te)/(Ti \u2212 Tes): actual over ideal for a turbine (the compressor inverts it). Efficiency above 1 is impossible - that decoy catches formula flips."
}, function () {
  var Ti = pick([1500, 1600, 1700]);
  var Te = pick([1100, 1200]);              // actual exit
  var Tes = pick([950, 1000, 1050]);        // isentropic exit (< Te)
  var eta = r2d((Ti - Te) / (Ti - Tes));
  var tInv = r2d((Ti - Tes) / (Ti - Te)), tRaw = r2d(Te / Tes), tDiff = r2d((Te - Tes) / (Ti - Tes));
  var question = "A turbine enters gas at " + Ti + " R and exits at " + Te + " R. The isentropic exit temperature would be " + Tes + " R. What is the isentropic efficiency?";
  var solution = "Refer to Turbine Isentropic Efficiency in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 199 (PDF page 205).\n\n" +
    "The handbook gives \\(\\eta_T = \\dfrac{T_i - T_e}{T_i - T_{es}}\\):\n\n" +
    "$$\\eta_T = \\frac{" + Ti + "-" + Te + "}{" + Ti + "-" + Tes + "} = " + fmt(eta) + "$$";
  return {
    variantKey: "Ti" + Ti + "_Te" + Te + "_Tes" + Tes,
    question: question,
    options: [
      { label: fmt(eta), num: eta, correct: true },
      { label: fmt(tInv), num: tInv, correct: false },
      { label: fmt(tRaw), num: tRaw, correct: false },
      { label: fmt(tDiff), num: tDiff, correct: false }
    ],
    solution: solution
  };
}));

/* ---- shared normal-shock helpers (fluid-062..064, 072, 073) ---- */
var shockMa2 = function (M1, k) { return Math.sqrt(((k - 1) * M1 * M1 + 2) / (2 * k * M1 * M1 - (k - 1))); };
var shockP21 = function (M1, k) { return (2 * k * M1 * M1 - (k - 1)) / (k + 1); };
var shockR21 = function (M1, k) { return (k + 1) * M1 * M1 / ((k - 1) * M1 * M1 + 2); };
var shockT21 = function (M1, k) { return (2 + (k - 1) * M1 * M1) * (2 * k * M1 * M1 - (k - 1)) / ((k + 1) * (k + 1) * M1 * M1); };

/* ---- fluid-062: Mach number downstream of a normal shock ---- */
reg(buildGenerator({
  baseId: "fluid-062", topic: "Fluid Mechanics", subtopic: "Mach number downstream of a normal shock",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "Normal-shock Ma2 formula. Decoys: the pressure ratio, the density ratio, and 1/Ma1."
}, function () {
  var M1 = pick([1.5, 2, 2.5, 3]), k = 1.4;
  var M2 = r3d(shockMa2(M1, k));
  var tP = r3d(shockP21(M1, k)), tR = r3d(shockR21(M1, k)), tInv = r3d(1 / M1);
  var question = "A normal shock forms in air (k = 1.4) at an upstream Mach number of " + M1.toFixed(1) + ". What is the downstream Mach number?";
  var solution = "Refer to Normal Shock Relationships in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 195 (PDF page 201).\n\n" +
    "The handbook gives \\(Ma_2 = \\sqrt{\\dfrac{(k-1)Ma_1^2 + 2}{2kMa_1^2 - (k-1)}}\\):\n\n" +
    "$$\\begin{aligned}Ma_2 &= \\sqrt{\\frac{(1.4-1)(" + M1.toFixed(1) + ")^2+2}{2(1.4)(" + M1.toFixed(1) + ")^2-(1.4-1)}} \\\\ &= " + fmt(M2) + "\\end{aligned}$$";
  return {
    variantKey: "M" + pdot(M1),
    question: question,
    options: [
      { label: fmt(M2), num: M2, correct: true },
      { label: fmt(tP), num: tP, correct: false },
      { label: fmt(tR), num: tR, correct: false },
      { label: fmt(tInv), num: tInv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-063: pressure ratio across a normal shock ---- */
reg(buildGenerator({
  baseId: "fluid-063", topic: "Fluid Mechanics", subtopic: "Pressure ratio across a normal shock",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "P2/P1 = (2kMa1\u00B2 \u2212 (k\u22121))/(k+1). Decoys: Ma1\u00B2, the density ratio, and the inverted ratio."
}, function () {
  var M1 = pick([1.5, 2, 2.5, 3]), k = 1.4;
  var P = r2d(shockP21(M1, k));
  var tM2 = r2d(M1 * M1), tR = r2d(shockR21(M1, k)), tInv = r3d(1 / shockP21(M1, k));
  var question = "For a normal shock in air (k = 1.4) with \\(Ma_1\\) = " + M1.toFixed(1) + ", what is the static pressure ratio \\(P_2/P_1\\)?";
  var solution = "Refer to Normal Shock Relationships in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 195 (PDF page 201).\n\n" +
    "The handbook gives \\(P_2/P_1 = \\dfrac{1}{k+1}\\left[2kMa_1^2 - (k-1)\\right]\\):\n\n" +
    "$$\\begin{aligned}\\frac{P_2}{P_1} &= \\frac{2(1.4)(" + M1.toFixed(1) + ")^2-(1.4-1)}{1.4+1} \\\\ &= " + fmt(P) + "\\end{aligned}$$";
  return {
    variantKey: "M" + pdot(M1),
    question: question,
    options: [
      { label: fmt(P), num: P, correct: true },
      { label: fmt(tInv), num: tInv, correct: false },
      { label: fmt(tM2), num: tM2, correct: false },
      { label: fmt(tR), num: tR, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-064: density ratio across a normal shock ---- */
reg(buildGenerator({
  baseId: "fluid-064", topic: "Fluid Mechanics", subtopic: "Density ratio across a normal shock",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "\u03C12/\u03C11 = (k+1)Ma1\u00B2/((k\u22121)Ma1\u00B2+2). Decoys: the pressure ratio, its reciprocal, and Ma1 itself."
}, function () {
  var M1 = pick([1.5, 2, 2.5, 3]), k = 1.4;
  var R = r3d(shockR21(M1, k));
  var tP = r2d(shockP21(M1, k)), tInv = r3d(1 / shockR21(M1, k)), tM = M1;
  var question = "For a normal shock in air (k = 1.4) with \\(Ma_1\\) = " + M1.toFixed(1) + ", what is the density ratio \\(\\rho_2/\\rho_1\\)?";
  var solution = "Refer to Normal Shock Relationships in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 195 (PDF page 201).\n\n" +
    "The handbook gives \\(\\rho_2/\\rho_1 = V_1/V_2 = \\dfrac{(k+1)Ma_1^2}{(k-1)Ma_1^2+2}\\):\n\n" +
    "$$\\begin{aligned}\\frac{\\rho_2}{\\rho_1} &= \\frac{(1.4+1)(" + M1.toFixed(1) + ")^2}{(1.4-1)(" + M1.toFixed(1) + ")^2+2} \\\\ &= " + fmt(R) + "\\end{aligned}$$";
  return {
    variantKey: "M" + pdot(M1),
    question: question,
    options: [
      { label: fmt(R), num: R, correct: true },
      { label: fmt(tP), num: tP, correct: false },
      { label: fmt(tInv), num: tInv, correct: false },
      { label: fmt(tM), num: tM, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-066: pitot tube velocity (US) ---- */
reg(buildGenerator({
  baseId: "fluid-066", topic: "Fluid Mechanics", subtopic: "Pitot tube velocity",
  difficulty: "medium", estimatedTimeSeconds: 150,
  explanation: "v = \u221A(2g\u0394P/\u03B3), and \u0394P in psi must be \u00D7144 to psf first. The traps skip the 144 or skip the g."
}, function () {
  var dPpsi = pick([0.25, 0.5, 0.75, 1]);   // psi
  var gamma = 62.4;
  var v = r1d(Math.sqrt(2 * 32.2 * dPpsi * 144 / gamma));
  var tNo144 = r1d(Math.sqrt(2 * 32.2 * dPpsi / gamma)), tNoG = r1d(Math.sqrt(2 * dPpsi * 144 / gamma)), tNo2 = r1d(Math.sqrt(32.2 * dPpsi * 144 / gamma));
  var question = "A pitot tube in a water pipe (\u03B3 = 62.4 lb/ft\u00B3) reads a stagnation pressure " + dPpsi + " psi above the static pressure. What is the fluid velocity?";
  var solution = "Refer to Pitot Tubes in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 200 (PDF page 206).\n\n" +
    "The handbook gives \\(v = \\sqrt{2g(P_0-P_s)/\\gamma}\\). Convert psi to psf (\\(\\times 144\\)):\n\n" +
    "$$\\begin{aligned}v &= \\sqrt{\\frac{2(32.2)(" + Math.round(dPpsi * 144) + ")}{62.4}} \\\\ &= " + fmt(v) + "\\ \\text{ft/s}\\end{aligned}$$";
  return {
    variantKey: "dP" + pdot(dPpsi),
    question: question, diagram: dFluid066(dPpsi),
    options: [
      { label: fmt(v) + " ft/s", num: v, correct: true },
      { label: fmt(tNo144) + " ft/s", num: tNo144, correct: false },
      { label: fmt(tNoG) + " ft/s", num: tNoG, correct: false },
      { label: fmt(tNo2) + " ft/s", num: tNo2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-067: pitot tube velocity (SI) ---- */
reg(buildGenerator({
  baseId: "fluid-067", topic: "Fluid Mechanics", subtopic: "Pitot tube velocity, SI",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "v = \u221A(2\u0394P/\u03C1) with \u0394P in Pa (kPa \u00D71000). The traps forget the \u00D71000 or divide by \u03C1 twice."
}, function () {
  var dPkPa = pick([0.4, 0.8, 1.2, 2]);     // kPa
  var rho = pick([1.2, 1.0, 0.9]);          // kg/m^3
  var v = r1d(Math.sqrt(2 * dPkPa * 1000 / rho));
  var tNo1000 = r2d(Math.sqrt(2 * dPkPa / rho)), tRho2 = r1d(Math.sqrt(2 * dPkPa * 1000 / (rho * rho * 1000))), tNo2 = r1d(Math.sqrt(dPkPa * 1000 / rho));
  var question = "A pitot tube measures a pressure difference P0 - Ps of " + dPkPa + " kPa in a stream of air with density " + rho + " kg/m\u00B3 (Mach number below 0.3). What is the velocity?";
  var solution = "Refer to Pitot Tubes in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 200 (PDF page 206).\n\n" +
    "The handbook gives \\(v = \\sqrt{(2/\\rho)(P_0-P_s)}\\), valid for a compressible fluid when Ma \\(\\le\\) 0.3:\n\n" +
    "$$v = \\sqrt{\\frac{2(" + Math.round(dPkPa * 1000) + ")}{" + rho + "}} = " + fmt(v) + "\\ \\text{m/s}$$";
  return {
    variantKey: "dP" + pdot(dPkPa) + "_rho" + pdot(rho),
    question: question,
    options: [
      { label: fmt(v) + " m/s", num: v, correct: true },
      { label: fmt(tNo1000) + " m/s", num: tNo1000, correct: false },
      { label: fmt(tRho2) + " m/s", num: tRho2, correct: false },
      { label: fmt(tNo2) + " m/s", num: tNo2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-069: venturi meter flow rate ---- */
reg(buildGenerator({
  baseId: "fluid-069", topic: "Fluid Mechanics", subtopic: "Venturi meter flow rate",
  difficulty: "hard", estimatedTimeSeconds: 180,
  explanation: "Q = Cv A2 \u221A(2g\u0394h)/\u221A(1 \u2212 (A2/A1)\u00B2). The traps drop the area-ratio correction or use diameters in inches directly."
}, function () {
  var D1 = pick([8, 10, 12]);               // in
  var beta = pick([0.5, 0.6]);              // D2/D1
  var D2 = D1 * beta;
  var dh = pick([3, 5, 7]);                 // ft
  var Cv = pick([0.95, 0.98]);
  var A1 = Math.PI * Math.pow(D1 / 12, 2) / 4, A2 = Math.PI * Math.pow(D2 / 12, 2) / 4;
  var Q = r2d(Cv * A2 / Math.sqrt(1 - Math.pow(A2 / A1, 2)) * Math.sqrt(2 * 32.2 * dh));
  var tNoCorr = r2d(Cv * A2 * Math.sqrt(2 * 32.2 * dh));
  var A2in = Math.PI * D2 * D2 / 4;         // trap: areas left in in^2, head in ft
  var tIn = r2d(Cv * A2in / Math.sqrt(1 - Math.pow(A2in / (Math.PI * D1 * D1 / 4), 2)) * Math.sqrt(2 * 32.2 * dh));
  var tNoCv = r2d(A2 / Math.sqrt(1 - Math.pow(A2 / A1, 2)) * Math.sqrt(2 * 32.2 * dh));
  var question = "A horizontal venturi meter has an inlet diameter of " + D1 + " in and a throat diameter of " + fmt(D2) + " in. The piezometric head difference between inlet and throat is " + dh.toFixed(1) + " ft of water and \\(C_v\\) = " + Cv + ". What is the flow rate?";
  var solution = "Refer to Venturi Meters in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 200 (PDF page 206).\n\n" +
    "The handbook gives \\(Q = \\dfrac{C_vA_2}{\\sqrt{1-(A_2/A_1)^2}}\\sqrt{2g\\,\\Delta h}\\). With \\(A_1\\) = " + fmt(r3d(A1)) + " ft\u00B2 and \\(A_2\\) = " + fmt(r3d(A2)) + " ft\u00B2:\n\n" +
    "$$\\begin{aligned}Q &= \\frac{" + Cv + "(" + fmt(r3d(A2)) + ")}{\\sqrt{1-(" + fmt(r3d(A2 / A1)) + ")^2}}\\sqrt{2(32.2)(" + dh.toFixed(1) + ")} \\\\ &= " + fmt(Q) + "\\ \\text{cfs}\\end{aligned}$$";
  return {
    variantKey: "D1_" + D1 + "_b" + pdot(beta) + "_dh" + dh + "_Cv" + pdot(Cv),
    question: question, diagram: dFluid069(D1, D2, dh),
    options: [
      { label: Q.toFixed(2) + " cfs", num: Q, correct: true },
      { label: tNoCorr.toFixed(2) + " cfs", num: tNoCorr, correct: false },
      { label: tIn.toFixed(2) + " cfs", num: tIn, correct: false },
      { label: tNoCv.toFixed(2) + " cfs", num: tNoCv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-072: temperature ratio across a normal shock ---- */
reg(buildGenerator({
  baseId: "fluid-072", topic: "Fluid Mechanics", subtopic: "Temperature ratio across a normal shock",
  difficulty: "hard", estimatedTimeSeconds: 180,
  explanation: "T2/T1 = [2+(k\u22121)Ma1\u00B2]\u00B7[2kMa1\u00B2\u2212(k\u22121)]/((k+1)\u00B2Ma1\u00B2). Decoys: the pressure ratio, density ratio, and the reciprocal."
}, function () {
  var M1 = pick([1.5, 2, 2.5]), k = 1.4;
  var T = r3d(shockT21(M1, k));
  var tP = r2d(shockP21(M1, k)), tR = r3d(shockR21(M1, k)), tInv = r3d(1 / shockT21(M1, k));
  var question = "For a normal shock in air (k = 1.4) with upstream Mach number " + M1.toFixed(1) + ", what is the static temperature ratio T2/T1?";
  var solution = "Refer to Normal Shock Relationships in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 195 (PDF page 201).\n\n" +
    "The handbook gives \\(\\dfrac{T_2}{T_1} = \\left[2+(k-1)Ma_1^2\\right]\\dfrac{2kMa_1^2-(k-1)}{(k+1)^2Ma_1^2}\\):\n\n" +
    "$$\\begin{aligned}\\frac{T_2}{T_1} &= [2+0.4(" + M1.toFixed(1) + ")^2]\\frac{2(1.4)(" + M1.toFixed(1) + ")^2-0.4}{(2.4)^2(" + M1.toFixed(1) + ")^2} \\\\ &= " + fmt(T) + "\\end{aligned}$$";
  return {
    variantKey: "M" + pdot(M1),
    question: question,
    options: [
      { label: fmt(T), num: T, correct: true },
      { label: fmt(tP), num: tP, correct: false },
      { label: fmt(tInv), num: tInv, correct: false },
      { label: fmt(tR), num: tR, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-073: downstream Mach after a normal shock (subsonic check) ---- */
reg(buildGenerator({
  baseId: "fluid-073", topic: "Fluid Mechanics", subtopic: "Downstream Mach number after a normal shock, check of subsonic result",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "Same Ma2 formula as fluid-062 with a built-in sense check: the answer must come out subsonic. Anything above 1 fails the physics."
}, function () {
  var M1 = pick([1.5, 2, 2.5, 3]), k = 1.4;
  var M2 = r3d(shockMa2(M1, k));
  var tInv = r3d(1 / M2), t2d3 = r3d(2 / (M1 + 1)), tSqrt = r3d(Math.sqrt(1 / M1));
  var question = "Air (k = 1.4) crosses a normal shock with \\(Ma_1\\) = " + M1.toFixed(1) + ". What is \\(Ma_2\\)?";
  var solution = "Refer to Normal Shock Relationships in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 195 (PDF page 201).\n\n" +
    "The handbook gives \\(Ma_2 = \\sqrt{\\dfrac{(k-1)Ma_1^2+2}{2kMa_1^2-(k-1)}} = " + fmt(M2) + "\\), which is subsonic as the handbook states.";
  return {
    variantKey: "M" + pdot(M1),
    question: question,
    options: [
      { label: fmt(M2), num: M2, correct: true },
      { label: fmt(tInv), num: tInv, correct: false },
      { label: fmt(t2d3), num: t2d3, correct: false },
      { label: fmt(tSqrt), num: tSqrt, correct: false }
    ],
    solution: solution
  };
}));

/* ---- fluid-074: pitot tube from head reading ---- */
reg(buildGenerator({
  baseId: "fluid-074", topic: "Fluid Mechanics", subtopic: "Pitot tube from head reading",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "The reading IS the velocity head: v = \u221A(2g\u00B7h). Traps multiply 2gh without the radical or drop the 2."
}, function () {
  var h = pick([2, 3, 4, 5]);                // ft of velocity head
  var v = r1d(Math.sqrt(2 * 32.2 * h));
  var tNoSqrt = r1d(2 * 32.2 * h), tNo2 = r1d(Math.sqrt(32.2 * h)), tHalf = r1d(h / 2);
  var question = "A pitot tube shows a velocity head v\u00B2/2g of " + h.toFixed(1) + " ft. What is the velocity? (g = 32.2 ft/s\u00B2)";
  var solution = "Refer to Pitot Tubes in the Fluid Mechanics section of the FE Reference Handbook (v10.6), printed page 200 (PDF page 206).\n\n" +
    "The handbook figure shows P0 raised above the static level by v\u00B2/2g, so \\(v = \\sqrt{2g(P_0-P_s)/\\gamma}\\) gives \\(v = \\sqrt{2(32.2)(" + h.toFixed(1) + ")} = " + fmt(v) + "\\) ft/s.";
  return {
    variantKey: "h" + h,
    question: question,
    options: [
      { label: fmt(v) + " ft/s", num: v, correct: true },
      { label: fmt(tHalf) + " ft/s", num: tHalf, correct: false },
      { label: fmt(tNoSqrt) + " ft/s", num: tNoSqrt, correct: false },
      { label: fmt(tNo2) + " ft/s", num: tNo2, correct: false }
    ],
    solution: solution
  };
}));

window.FLUID_GENERATORS = FLUID_ENTRIES;
})();
