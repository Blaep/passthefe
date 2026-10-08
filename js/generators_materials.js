/* PassTheFE randomized practice — Materials generator templates.
 *
 * Plain script (no modules) for the static site. Defines window.MATERIALS_GENERATORS:
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
  var MAT_ENTRIES = [];
  function reg(e) { MAT_ENTRIES.push(e); return e; }
/* PassTheFE randomized practice — Materials generators, workstream 1 of 3.
 * Fragment: concatenated after mat_scaffold_core.js, before mat_footer.js.
 * Covers materials-005, 009, 010, 011, 012, 015, 017. */

/* ---- materials-005: aggregate absorption capacity ---- */
reg(buildGenerator({
  baseId: "materials-005",
  topic: "Materials",
  subtopic: "Aggregate properties",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Absorption is referenced to the oven-dry mass, not the SSD mass - dividing by 5000 g gives 1.00%, the classic error. Absorption matters because aggregates soak up mix water, changing the effective water-cement ratio if not corrected.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var od = 50 * ri(80, 120);          // oven-dry mass, 4000-6000 g, clean round
  var diff = ri(20, 150);             // absorbed water mass, g
  var ssd = od + diff;                // SSD mass, g
  var correct = diff / od * 100;      // absorption %, referenced to OD mass
  var dSSD = diff / ssd * 100;        // trap: referenced to SSD mass
  var dInv = od / ssd;                // trap: inverted ratio written as %
  var dDouble = 2 * correct;          // trap: doubled the difference
  var question = "A coarse aggregate sample has an oven-dry mass of " + od +
    " g and a saturated-surface-dry (SSD) mass of " + ssd +
    " g. What is the absorption capacity of the aggregate?";
  var solution = "Refer to the Materials Science/Structure of Matter chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the absorption capacity, referenced to the oven-dry mass:\n\n" +
    "$$\\text{Absorption} = \\frac{M_{SSD} - M_{OD}}{M_{OD}} \\times 100\\%$$\n\n" +
    "List the known and unknown parameters in order to solve for the absorption:\n\n" +
    "$$\\begin{aligned}\n" +
    "M_{OD} &= " + od + "\\ \\text{g} \\\\\n" +
    "M_{SSD} &= " + ssd + "\\ \\text{g} \\\\\n" +
    "\\text{Absorption} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\text{Absorption}) = \\frac{" + ssd + " - " + od + "}{" + od + "} \\times 100\\% = \\frac{" + diff + "}{" + od + "} \\times 100\\%$$\n\n" +
    "$$(\\text{Absorption}) = " + fmt(correct) + "\\%$$";
  return {
    variantKey: "abs-od" + od + "-ssd" + ssd,
    question: question,
    options: [
      { label: fmt(correct) + "%", num: correct, correct: true },
      { label: fmt(dSSD) + "%", num: dSSD, correct: false },
      { label: fmt(dInv) + "%", num: dInv, correct: false },
      { label: fmt(dDouble) + "%", num: dDouble, correct: false }
    ],
    solution: solution
  };
}));

/* ---- materials-009: fineness modulus ---- */
reg(buildGenerator({
  baseId: "materials-009",
  topic: "Materials",
  subtopic: "Fineness modulus",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The trap is 3.11 — summing the percent passing instead of the percent retained; fineness modulus is defined on cumulative retained.",
  videoUrl: "https://www.youtube.com/watch?v=rq5XTRRBU8g",
  videoTitle: "How To Calculate Fineness Modulus Of Aggregate"
}, function () {
  var p, sum, fm, v;
  do {
    p = [];
    v = ri(0, 5);  p.push(v);          // No. 4
    v += ri(5, 20);  p.push(v);        // No. 8
    v += ri(10, 30); p.push(v);        // No. 16
    v += ri(15, 35); p.push(v);        // No. 30
    v += ri(10, 30); p.push(v);        // No. 50
    v += ri(5, 20);  p.push(v);        // No. 100
    sum = p[0] + p[1] + p[2] + p[3] + p[4] + p[5];
    fm = sum / 100;
    // p[5] > 100 is nonphysical; sum == 300 makes the passing-trap label
    // identical to the answer, so it is regenerated.
  } while (p[5] > 100 || sum === 300 || fm < 2.0 || fm > 3.4);
  var dPass = (600 - sum) / 100;      // trap: summed % passing instead of retained
  var dNo100 = (sum - p[5]) / 100;    // trap: omitted the No. 100 sieve
  var dPan = (sum + 100) / 100;       // trap: included the pan as a 7th sieve
  var question = "A sieve analysis of a fine aggregate gives these cumulative percentages retained: " +
    p[0] + "% on the No. 4 sieve, " + p[1] + "% on No. 8, " + p[2] + "% on No. 16, " +
    p[3] + "% on No. 30, " + p[4] + "% on No. 50, and " + p[5] +
    "% on the No. 100 sieve. What is the fineness modulus of this aggregate?";
  var solution = "Refer to the Materials Science/Structure of Matter chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(FM\\). The fineness modulus is the sum of the cumulative percentages retained on the standard sieves, divided by 100:\n\n" +
    "$$FM = \\frac{\\sum (\\text{cumulative \\% retained})}{100}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(FM\\):\n\n" +
    "$$\\begin{aligned} \\text{No. 4, 8, 16, 30, 50, 100 retained} &= " + p.join(",\\ ") + "\\ \\% \\\\ FM &= ? \\end{aligned}$$\n\n" +
    "$$(FM) = \\frac{" + p.join(" + ") + "}{100} \\rightarrow \\frac{" + sum + "}{100}$$\n\n" +
    "$$(FM) = " + fmt(fm) + "$$";
  return {
    variantKey: "fm-" + p.join("-"),
    question: question,
    options: [
      { label: fmt(fm), num: fm, correct: true },
      { label: fmt(dPass), num: dPass, correct: false },
      { label: fmt(dNo100), num: dNo100, correct: false },
      { label: fmt(dPan), num: dPan, correct: false }
    ],
    solution: solution
  };
}));

/* ---- materials-010: modulus of resilience ---- */
reg(buildGenerator({
  baseId: "materials-010",
  topic: "Materials",
  subtopic: "Modulus of resilience",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "The modulus of resilience needs the 2 in the denominator — dropping it doubles the answer to 313 kJ/m^3. Convert GPa to MPa before dividing, and remember 1 MPa equals 1,000 kJ/m^3.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var mat = pick([
    { name: "steel", E: 200 },
    { name: "aluminum", E: 70 }
  ]);
  var sy = mat.name === "steel"
    ? pick([200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500])
    : pick([100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350]);
  var eMPa = mat.E * 1000;
  var eStr = String(eMPa).replace(/\B(?=(\d{3})+(?!\d))/g, "{,}");
  var urMPa = sy * sy / (2 * eMPa);   // MPa
  var urKJ = urMPa * 1000;            // kJ/m^3
  var dNoHalf = sy * sy / eMPa * 1000;      // trap: dropped the 2 in the denominator
  var dUnit = urMPa;                        // trap: MPa number reported as kJ/m^3
  var dHalf2 = sy * sy / (4 * eMPa) * 1000; // trap: halved twice
  var question = "A " + mat.name + " test specimen has a yield strength of " + sy +
    " MPa and a modulus of elasticity of " + mat.E +
    " GPa. What is the modulus of resilience of the " + mat.name + "?";
  var solution = "Refer to the Elastic Strain Energy section in the Mechanics of Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(U_r\\). We can determine \\(U_r\\) from the following equation:\n\n" +
    "$$U_r = \\frac{\\sigma_y^2}{2E}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(U_r\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "\\sigma_y &= " + sy + "\\ \\text{MPa} \\\\\n" +
    "E &= " + mat.E + "\\ \\text{GPa} = " + eStr + "\\ \\text{MPa} \\\\\n" +
    "U_r &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(U_r) = \\frac{(\\sigma_y)^2}{2E} \\rightarrow (U_r) = \\frac{(" + sy + ")^2}{2(" + eStr + ")}$$\n\n" +
    "$$(U_r) = " + fmt(urMPa) + "\\ \\text{MPa} = " + fmt(urKJ) + "\\ \\text{kJ/m}^3$$";
  return {
    variantKey: "ur-sy" + sy + "-E" + mat.E,
    question: question,
    options: [
      { label: fmt(urKJ) + " kJ/m^3", num: urKJ, correct: true },
      { label: fmt(dNoHalf) + " kJ/m^3", num: dNoHalf, correct: false },
      { label: fmt(dUnit) + " kJ/m^3", num: dUnit, correct: false },
      { label: fmt(dHalf2) + " kJ/m^3", num: dHalf2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- materials-011: rule of mixtures (parallel loading) ---- */
reg(buildGenerator({
  baseId: "materials-011",
  topic: "Materials",
  subtopic: "Composite materials (rule of mixtures)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Loading parallel to the fibers means the isostrain (Voigt) rule of mixtures applies. The inverse harmonic form (7.05 GPa) is for loading transverse to the fibers — the classic mix-up.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var fiber = pick([
    { name: "glass", E: 70 },
    { name: "carbon", E: 230 }
  ]);
  var matrix = pick([
    { name: "epoxy", E: 3 },
    { name: "polyester", E: 4 }
  ]);
  // vf = 0.5 excluded: swapping volume fractions would then match the answer.
  var vf = pick([0.30, 0.35, 0.40, 0.45, 0.55, 0.60, 0.65, 0.70]);
  var vm = 1 - vf;
  var correct = fiber.E * vf + matrix.E * vm;
  var dTrans = 1 / (vf / fiber.E + vm / matrix.E); // trap: transverse (Reuss) form
  var dSwap = fiber.E * vm + matrix.E * vf;       // trap: swapped volume fractions
  var dAdd = fiber.E + matrix.E;                  // trap: added the moduli
  var vfPct = Math.round(vf * 100);
  var vmPct = Math.round(vm * 100);
  var question = "A unidirectional fiber-reinforced composite is loaded parallel to the fibers. The composite contains " +
    vfPct + "% by volume " + fiber.name + " fibers (E = " + fiber.E + " GPa) and " +
    vmPct + "% by volume " + matrix.name + " matrix (E = " + matrix.E +
    " GPa). Estimate the elastic modulus of the composite.";
  var solution = "Refer to the Composite Materials section in the Materials Science/Structure of Matter chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(E_c\\). We can determine \\(E_c\\) from the following equation:\n\n" +
    "$$E_c = E_f V_f + E_m V_m$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(E_c\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "E_f &= " + fiber.E + "\\ \\text{GPa} \\\\\n" +
    "V_f &= " + fmt(vf) + " \\\\\n" +
    "E_m &= " + matrix.E + "\\ \\text{GPa} \\\\\n" +
    "V_m &= " + fmt(vm) + " \\\\\n" +
    "E_c &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(E_c) = E_f V_f + E_m V_m \\rightarrow (E_c) = (" + fiber.E + ")(" + fmt(vf) + ") + (" + matrix.E + ")(" + fmt(vm) + ")$$\n\n" +
    "$$(E_c) = " + fmt(fiber.E * vf) + " + " + fmt(matrix.E * vm) + " = " + fmt(correct) + "\\ \\text{GPa}$$";
  return {
    variantKey: "rom-" + fiber.name + "-" + matrix.name + "-" + vfPct,
    question: question,
    options: [
      { label: fmt(correct) + " GPa", num: correct, correct: true },
      { label: fmt(dTrans) + " GPa", num: dTrans, correct: false },
      { label: fmt(dSwap) + " GPa", num: dSwap, correct: false },
      { label: fmt(dAdd) + " GPa", num: dAdd, correct: false }
    ],
    solution: solution
  };
}));

/* ---- materials-012: ACI 318 concrete modulus of elasticity ---- */
reg(buildGenerator({
  baseId: "materials-012",
  topic: "Materials",
  subtopic: "Concrete modulus of elasticity",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The 4,700 multiplier already expects f'_c in MPa under the square root — skipping the root gives 117.5 GPa, and plugging in a doubled strength gives 33.2 GPa.",
  videoUrl: null,
  videoTitle: null
}, function () {
  function thou(x) {
    return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, "{,}");
  }
  var usePsi = Math.random() < 0.35;
  var fc, mult, eVal, unitIn, unitOut;
  if (usePsi) {
    fc = pick([3000, 3500, 4000, 4500, 5000, 6000]);
    mult = 57000;
    eVal = mult * Math.sqrt(fc);          // psi
    unitIn = "psi";
    unitOut = "ksi";
  } else {
    fc = pick([15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);
    mult = 4700;
    eVal = mult * Math.sqrt(fc);          // MPa
    unitIn = "MPa";
    unitOut = "GPa";
  }
  var correct = eVal / 1000;              // ksi or GPa
  var dNoRoot = mult * fc / 1000;         // trap: skipped the square root
  var dUnit = eVal / 1e6;                 // trap: divided by 1000 twice
  var dDouble = mult * Math.sqrt(2 * fc) / 1000; // trap: doubled f'_c
  var eqLine = usePsi ? "$$E_c = 57{,}000\\sqrt{f'_c}\\ \\text{(psi)}$$"
                      : "$$E_c = 4700\\sqrt{f'_c}\\ \\text{(MPa)}$$";
  var subLine = usePsi ? "$$(E_c) = 57{,}000\\sqrt{f'_c} \\rightarrow (E_c) = 57{,}000\\sqrt{" + fc + "}$$"
                       : "$$(E_c) = 4700\\sqrt{f'_c} \\rightarrow (E_c) = 4700\\sqrt{" + fc + "}$$";
  var question = "The specified 28-day compressive strength of a normal-weight concrete is " +
    (usePsi ? "\\(f'_c = " + fc + "\\ \\text{psi}\\)" : "\\(f'_c = " + fc + "\\ \\text{MPa}\\)") +
    ". Using the ACI 318 relationship, estimate the modulus of elasticity of the concrete" +
    (usePsi ? ", in ksi." : ".");
  var solution = "Refer to the Civil Engineering chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(E_c\\). We can determine \\(E_c\\) from the following equation:\n\n" +
    eqLine + "\n\n" +
    "List the known and unknown parameters in order to solve for \\(E_c\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "f'_c &= " + fc + "\\ \\text{" + unitIn + "} \\\\\n" +
    "E_c &= ?\n" +
    "\\end{aligned}$$\n\n" +
    subLine + "\n\n" +
    "$$(E_c) = " + thou(eVal) + "\\ \\text{" + unitIn + "} = " + fmt(correct) + "\\ \\text{" + unitOut + "}$$";
  return {
    variantKey: "aci-fc" + fc + unitIn,
    question: question,
    options: [
      { label: fmt(correct) + " " + unitOut, num: correct, correct: true },
      { label: fmt(dNoRoot) + " " + unitOut, num: dNoRoot, correct: false },
      { label: fmt(dUnit) + " " + unitOut, num: dUnit, correct: false },
      { label: fmt(dDouble) + " " + unitOut, num: dDouble, correct: false }
    ],
    solution: solution
  };
}));

/* ---- materials-015: Poisson's ratio / diameter change ---- */
reg(buildGenerator({
  baseId: "materials-015",
  topic: "Materials",
  subtopic: "Poisson's ratio",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Tension stretches a bar axially but squeezes it laterally — the minus sign in Poisson's ratio is the whole point. Forgetting ν gives 0.0240 mm; dropping the sign claims the diameter grows.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var d = 0.5 * ri(16, 40);                       // original diameter, 8-20 mm
  var eps = pick([0.0010, 0.0015, 0.0020, 0.0025, 0.0030]); // axial strain, mm/mm
  var nu = pick([0.25, 0.28, 0.30, 0.32, 0.33]);  // Poisson's ratio
  var epsLat = -nu * eps;                         // lateral strain, mm/mm
  var delta = epsLat * d;                         // diameter change, mm (negative)
  var mag = -delta;
  var dNoNu = -eps * d;                           // trap: forgot Poisson's ratio
  var dNoD = epsLat;                              // trap: reported strain, not the mm change
  var question = "A cylindrical steel specimen with an original diameter of " + fmt(d) +
    " mm is loaded in axial tension, producing an axial strain of " + fmt(eps) +
    " mm/mm. If Poisson's ratio for the steel is " + fmt(nu) +
    ", what is the change in the specimen's diameter?";
  var solution = "Refer to the Shear Stress-Strain section in the Mechanics of Materials chapter of the FE Reference Handbook.\n\n" +
    "Ultimately, we must solve for \\(\\Delta d\\), the change in diameter. Lateral strain is related to axial strain by Poisson's ratio:\n\n" +
    "$$\\nu = -\\frac{\\epsilon_{\\text{lateral}}}{\\epsilon_{\\text{axial}}}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(\\Delta d\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "\\epsilon_{\\text{axial}} &= " + fmt(eps) + "\\ \\text{mm/mm} \\\\\n" +
    "\\nu &= " + fmt(nu) + " \\\\\n" +
    "d &= " + fmt(d) + "\\ \\text{mm} \\\\\n" +
    "\\epsilon_{\\text{lateral}} &= -\\nu\\,\\epsilon_{\\text{axial}} = -(" + fmt(nu) + ")(" + fmt(eps) + ") = " + texNum(epsLat) + "\\ \\text{mm/mm} \\\\\n" +
    "\\Delta d &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(\\Delta d) = (\\epsilon_{\\text{lateral}})(d) \\rightarrow (\\Delta d) = (" + texNum(epsLat) + ")(" + fmt(d) + ")$$\n\n" +
    "$$(\\Delta d) = " + texNum(delta) + "\\ \\text{mm}$$\n\n" +
    "The negative sign means the diameter decreases by " + fmt(mag) + " mm.";
  return {
    variantKey: "pois-d" + fmt(d) + "-e" + fmt(eps) + "-nu" + fmt(nu),
    question: question,
    options: [
      { label: "It decreases by " + fmt(mag) + " mm", num: delta, correct: true },
      { label: "It increases by " + fmt(mag) + " mm", num: -delta, correct: false },
      { label: "It decreases by " + fmt(-dNoNu) + " mm", num: dNoNu, correct: false },
      { label: "It decreases by " + fmt(-dNoD) + " mm", num: dNoD, correct: false }
    ],
    solution: solution
  };
}));

/* ---- materials-017: endurance limit (rotating-beam) ---- */
reg(buildGenerator({
  baseId: "materials-017",
  topic: "Materials",
  subtopic: "Fatigue (endurance limit)",
  difficulty: "medium",
  estimatedTimeSeconds: 100,
  explanation: "For most steels the endurance limit is roughly half the ultimate strength — the basis of infinite-life design under fully reversed loading. 900 MPa ignores the 0.5 factor entirely.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var sut = 50 * ri(7, 26);       // 350-1300 MPa, inside the S_ut <= 1400 MPa range
  var correct = 0.5 * sut;
  var dNone = sut;                // trap: ignored the 0.5 factor
  var dQuarter = 0.25 * sut;      // trap: halved twice
  var dSeven = 0.7 * sut;         // trap: used a 0.7 factor
  var question = "A steel has an ultimate tensile strength of \\(S_{ut} = " + sut +
    "\\ \\text{MPa}\\). Using the handbook approximation for the rotating-beam endurance limit of steels, estimate the endurance limit \\(S_e'\\).";
  var solution = "Refer to the Endurance Limit for Steels section in the Mechanical Engineering chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(S_e'\\), the rotating-beam endurance limit. For steels with \\(S_{ut} \\le 1400\\ \\text{MPa}\\), the handbook approximation is:\n\n" +
    "$$S_e' \\approx 0.5\\,S_{ut}$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(S_e'\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "S_{ut} &= " + sut + "\\ \\text{MPa} \\le 1400\\ \\text{MPa} \\\\\n" +
    "S_e' &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(S_e') = (0.5)(S_{ut}) \\rightarrow (S_e') = (0.5)(" + sut + ")$$\n\n" +
    "$$(S_e') = " + fmt(correct) + "\\ \\text{MPa}$$";
  return {
    variantKey: "se-sut" + sut,
    question: question,
    options: [
      { label: fmt(correct) + " MPa", num: correct, correct: true },
      { label: fmt(dNone) + " MPa", num: dNone, correct: false },
      { label: fmt(dQuarter) + " MPa", num: dQuarter, correct: false },
      { label: fmt(dSeven) + " MPa", num: dSeven, correct: false }
    ],
    solution: solution
  };
}));
/* Workstream 2: materials-020 .. materials-026 generator entries.
 * Fragment — assembled between mat_scaffold_core.js and mat_footer.js. */

reg(buildGenerator({
  baseId: "materials-020",
  topic: "Materials",
  subtopic: "Concrete mix design (absolute volume)",
  difficulty: "hard",
  estimatedTimeSeconds: 210,
  explanation: "Absolute volume: everything must total exactly 1 m^3. The two classic slips are forgetting the entrapped air (783 kg) and inverting the w/c ratio when finding cement content (949 kg).",
  videoUrl: "https://www.youtube.com/watch?v=GTULnsreop8",
  videoTitle: "Concrete Mix Design M40 Grade"
}, function () {
  var SGc = 3.15, gw = 1000;
  var W, wc, CA, sgCA, sgFA, air, mc, Vw, Vc, Vca, Vair, Vfa, mc2, Vc2, Vfa2;
  do {
    W = pick([150, 155, 160, 165, 170, 175, 180, 185, 190]);
    wc = pick([0.40, 0.45, 0.50, 0.55, 0.60]);
    CA = pick([1000, 1050, 1100, 1150, 1200]);
    sgCA = pick([2.60, 2.65, 2.70]);
    sgFA = pick([2.55, 2.60, 2.62, 2.65, 2.70]);
    air = pick([1.0, 1.5, 2.0, 2.5, 3.0]);
    mc = W / wc;
    Vw = W / gw; Vc = mc / (SGc * gw);
    Vca = CA / (sgCA * gw); Vair = air / 100;
    Vfa = 1 - (Vw + Vc + Vca + Vair);
    mc2 = W * wc;                       // inverted w/c slip
    Vc2 = mc2 / (SGc * gw);
    Vfa2 = 1 - (Vw + Vc2 + Vca + Vair);
  } while (sgCA === sgFA || Vfa < 0.10 || Vfa > 0.45 || Vfa2 < 0.10 || Vfa2 > 0.45);
  var mFA = Math.round(Vfa * sgFA * gw);
  var dNoAir = Math.round((Vfa + Vair) * sgFA * gw);      // forgot entrapped air
  var dInvWc = Math.round(Vfa2 * sgFA * gw);              // inverted w/c ratio
  var dSgMix = Math.round(Vfa * sgCA * gw);               // used coarse SG for fine agg
  var q = "A concrete mix design by the absolute volume method calls for " + W +
    " kg of water per cubic meter of concrete with a water\u2013cement ratio of " + fmt(wc) +
    ". The mix also contains " + CA + " kg of coarse aggregate (specific gravity " + fmt(sgCA) +
    ") and " + fmt(air) + "% entrapped air. What is the required mass of fine aggregate (specific gravity " +
    fmt(sgFA) + ") per cubic meter of concrete? (Specific gravity of cement = 3.15; unit weight of water = 1000 kg/m^3)";
  var sol = "Refer to the definition of specific gravity in the Fluid Mechanics chapter of the FE Reference Handbook (v10.6, p. 181): $SG = \\rho/\\rho_w$.\n\n" +
    "Ultimately, we must solve for the mass of fine aggregate. By the absolute volume method, the volumes of all ingredients plus air sum to 1 m\u00b3, so the fine aggregate occupies whatever volume remains:\n\n" +
    "$$V_{\\text{FA}} = 1 - (V_w + V_c + V_{CA} + V_{\\text{air}})$$\n\n" +
    "List the known and unknown parameters in order to solve for \\(m_{FA}\\):\n\n" +
    "$$\\begin{aligned}\n" +
    "m_w &= " + W + "\\ \\text{kg/m}^3 \\\\\n" +
    "\\text{w/c} &= " + fmt(wc) + " \\rightarrow m_c = \\frac{" + W + "}{" + fmt(wc) + "} = " + fmt(mc) + "\\ \\text{kg/m}^3 \\\\\n" +
    "V_w &= \\frac{" + W + "}{1000} = " + fmt(Vw) + "\\ \\text{m}^3 \\\\\n" +
    "V_c &= \\frac{" + fmt(mc) + "}{(3.15)(1000)} = " + fmt(Vc) + "\\ \\text{m}^3 \\\\\n" +
    "V_{CA} &= \\frac{" + CA + "}{(" + fmt(sgCA) + ")(1000)} = " + fmt(Vca) + "\\ \\text{m}^3 \\\\\n" +
    "V_{\\text{air}} &= " + fmt(Vair) + "\\ \\text{m}^3 \\\\\n" +
    "V_{FA} &= 1 - (" + fmt(Vw) + " + " + fmt(Vc) + " + " + fmt(Vca) + " + " + fmt(Vair) + ") = " + fmt(Vfa) + "\\ \\text{m}^3 \\\\\n" +
    "m_{FA} &= ?\n" +
    "\\end{aligned}$$\n\n" +
    "$$(m_{FA}) = (V_{FA})(SG_{FA})(\\gamma_w) \\rightarrow (m_{FA}) = (" + fmt(Vfa) + ")(" + fmt(sgFA) + ")(1000)$$\n\n" +
    "$$(m_{FA}) = " + mFA + "\\ \\text{kg/m}^3$$";
  return {
    variantKey: "W" + W + "-wc" + Math.round(wc * 100) + "-CA" + CA + "-ca" + Math.round(sgCA * 100) +
      "-fa" + Math.round(sgFA * 100) + "-air" + Math.round(air * 10),
    question: q,
    options: [
      { label: mFA + " kg", num: mFA, correct: true },
      { label: dNoAir + " kg", num: dNoAir, correct: false },
      { label: dInvWc + " kg", num: dInvWc, correct: false },
      { label: dSgMix + " kg", num: dSgMix, correct: false }
    ],
    solution: sol
  };
}));

reg(buildGenerator({
  baseId: "materials-021",
  topic: "Materials",
  subtopic: "Percent elongation (ductility)",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Percent elongation measures ductility \u2014 how much the material permanently stretched before breaking, relative to its original gage length: (61.5 \u2212 50)/50 \u00d7 100 = 23.0%.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var L0 = pick([50.0, 80.0, 120.0, 200.0]);
  var p = ri(10, 35);
  var dL = L0 * p / 100;
  var Lf = L0 + dL;
  var dFinal = dL / Lf * 100;        // used final length in denominator
  var dRatio = Lf / L0 * 100;        // reported Lf/L0 ratio as a percent
  var q = "A tensile test specimen has an original gage length of " + fmt(L0) +
    " mm. After fracture, the two pieces are fitted together and the final gage length is measured as " +
    fmt(Lf) + " mm. What is the percent elongation of the material?";
  var sol = "Refer to the Percent Elongation section in the Mechanics of Materials chapter of the FE Reference Handbook. " +
    "(Note: although percent elongation is a materials property, the handbook prints this section in the Mechanics of Materials chapter, not in Materials Science/Structure of Matter.)\n" +
    "The printed relation is \\(\\%\\text{ Elongation} = \\dfrac{\\Delta L}{L_0} \\times 100\\).\n" +
    "\\(\\Delta L = " + fmt(Lf) + "\\ \\mathrm{mm} - " + fmt(L0) + "\\ \\mathrm{mm} = " + fmt(dL) + "\\ \\mathrm{mm}\\).\n" +
    "\\(\\%\\text{ Elongation} = \\dfrac{" + fmt(dL) + "}{" + fmt(L0) + "} \\times 100\\).\n" +
    "\\(\\%\\text{ Elongation} = " + fmt(p) + "\\%\\).";
  return {
    variantKey: "L" + Math.round(L0 * 10) + "-p" + p,
    question: q,
    options: [
      { label: fmt(p) + "%", num: p, correct: true },
      { label: fmt(dL) + "%", num: dL, correct: false },
      { label: fmt(dFinal) + "%", num: dFinal, correct: false },
      { label: fmt(dRatio) + "%", num: dRatio, correct: false }
    ],
    solution: sol
  };
}));

reg(buildGenerator({
  baseId: "materials-022",
  topic: "Materials",
  subtopic: "Lever rule (phase fractions)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The lever rule splits the alloy between the two phases in proportion to the opposite segment lengths on the composition axis: (55\u221218)/(82\u221218) = 37/64 \u2248 57.8% \u03b2 phase (the rest is \u03b1).",
  videoUrl: null,
  videoTitle: null
}, function () {
  var xa, xb, x, corr, dAlpha;
  do {
    xa = ri(5, 30);
    xb = xa + ri(30, 60);
    x = xa + ri(5, xb - xa - 5);
    corr = (x - xa) / (xb - xa) * 100;
    dAlpha = (xb - x) / (xb - xa) * 100;
  } while (xb > 95 || Math.abs(corr - dAlpha) < 0.05);
  var dDenom = (x - xa) / xb * 100;      // forgot to subtract x_alpha in denominator
  var dNoSub = x / xb * 100;            // never subtracted the alpha composition at all
  var q = "At a certain temperature, a binary alloy of overall composition " + x +
    " wt% B lies in a two-phase (\u03b1 + \u03b2) region of its phase diagram. At this temperature the \u03b1 phase contains " +
    xa + " wt% B and the \u03b2 phase contains " + xb +
    " wt% B. Using the lever rule, determine the weight percent of the \u03b2 phase present.";
  var sol = "Refer to the Lever Rule section in the Materials Science/Structure of Matter chapter of the FE Reference Handbook.\n" +
    "For average composition \\(x\\) between phase compositions \\(x_\\alpha\\) and \\(x_\\beta\\):\n" +
    "$$\\text{wt}\\%\\ \\beta = \\frac{x - x_\\alpha}{x_\\beta - x_\\alpha} \\times 100$$\n" +
    "\\(\\text{wt}\\%\\ \\beta = \\dfrac{" + x + " - " + xa + "}{" + xb + " - " + xa + "} \\times 100\\).\n" +
    "\\(\\text{wt}\\%\\ \\beta = \\dfrac{" + (x - xa) + "}{" + (xb - xa) + "} \\times 100\\).\n" +
    "\\(\\text{wt}\\%\\ \\beta = " + fmt(corr) + "\\%\\).";
  return {
    variantKey: "x" + x + "-a" + xa + "-b" + xb,
    question: q,
    options: [
      { label: fmt(corr) + " wt%", num: corr, correct: true },
      { label: fmt(dAlpha) + " wt%", num: dAlpha, correct: false },
      { label: fmt(dDenom) + " wt%", num: dDenom, correct: false },
      { label: fmt(dNoSub) + " wt%", num: dNoSub, correct: false }
    ],
    solution: sol
  };
}));

reg(buildGenerator({
  baseId: "materials-023",
  topic: "Materials",
  subtopic: "True stress",
  difficulty: "hard",
  estimatedTimeSeconds: 150,
  explanation: "True stress uses the actual shrunken cross-section at that instant, not the original one \u2014 that's why it's larger than the engineering stress (398 MPa, computed with the original 12.0 mm diameter).",
  videoUrl: null,
  videoTitle: null
}, function () {
  var d0 = pick([10.0, 12.0, 14.0, 16.0]);
  var d = d0 - pick([0.5, 0.8, 1.0, 1.2, 1.5]);
  var F = pick([30.0, 35.0, 40.0, 45.0, 50.0, 55.0, 60.0]);
  var A = Math.PI * d * d / 4;
  var sT = F * 1000 / A;
  var dEng = F * 1000 / (Math.PI * d0 * d0 / 4);   // engineering stress with original diameter
  var dNo4 = F * 1000 / (Math.PI * d * d);         // dropped the /4 in the circle area
  var dRad = F * 1000 / (Math.PI * (d / 2) * (d / 2) / 4);  // plugged radius in where diameter belongs
  var iT = Math.round(sT), iEng = Math.round(dEng),
      iNo4 = Math.round(dNo4), iRad = Math.round(dRad);
  var q = "A round tensile specimen has an original diameter of " + fmt(d0) +
    " mm. At a certain point during the test, the applied load is " + fmt(F) +
    " kN and the instantaneous (actual) diameter of the specimen is " + fmt(d) +
    " mm. What is the true stress in the specimen at that instant?";
  var sol = "Refer to the True stress section in the Materials Science/Structure of Matter chapter of the FE Reference Handbook.\n" +
    "The printed relation is \\(\\sigma_T = \\dfrac{F}{A}\\), where \\(A\\) is the actual (instantaneous) cross-sectional area.\n" +
    "\\(A = \\dfrac{\\pi d^2}{4} = \\dfrac{\\pi (" + fmt(d) + "\\ \\mathrm{mm})^2}{4}\\).\n" +
    "\\(A = " + fmt(A) + "\\ \\mathrm{mm^2}\\).\n" +
    "\\(\\sigma_T = \\dfrac{" + fmt(F) + " \\times 10^3\\ \\mathrm{N}}{" + fmt(A) + "\\ \\mathrm{mm^2}}\\).\n" +
    "\\(\\sigma_T = " + iT + "\\ \\mathrm{N/mm^2} = " + iT + "\\ \\mathrm{MPa}\\).";
  return {
    variantKey: "D" + Math.round(d0 * 10) + "-d" + Math.round(d * 10) + "-F" + Math.round(F * 10),
    question: q,
    options: [
      { label: iT + " MPa", num: iT, correct: true },
      { label: iEng + " MPa", num: iEng, correct: false },
      { label: iNo4 + " MPa", num: iNo4, correct: false },
      { label: iRad + " MPa", num: iRad, correct: false }
    ],
    solution: sol
  };
}));

reg(buildGenerator({
  baseId: "materials-024",
  topic: "Materials",
  subtopic: "True strain",
  difficulty: "easy",
  estimatedTimeSeconds: 60,
  explanation: "Engineering strain divides elongation by the original length, but true strain accumulates each incremental stretch against the current length. The two agree at small strains and diverge as deformation grows.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var p = ri(5, 60);
  var e = p / 100;
  var eT = Math.log(1 + e);
  var dEng = e;                          // reported engineering strain as true strain
  var dComp = Math.abs(Math.log(1 - e)); // used the compressive form ln(1 - e)
  var dLog = Math.log10(1 + e);          // common log instead of natural log
  var q = "A tensile specimen elongates " + p + "% before necking begins. What is the true strain at the onset of necking?";
  var sol = "Refer to the True strain section in the Materials Science/Structure of Matter chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(\\varepsilon_T\\). The handbook prints:\n\n" +
    "$$\\varepsilon_T = \\ln(1 + \\varepsilon)$$\n\n" +
    "The engineering strain is:\n\n" +
    "$$(\\varepsilon) = " + fmt(e) + "$$\n\n" +
    "$$(\\varepsilon_T) = \\ln(1 + " + fmt(e) + ") = \\ln(" + fmt(1 + e) + ") = " + fmt(eT) + "$$";
  return {
    variantKey: "p" + p,
    question: q,
    options: [
      { label: fmt(eT), num: eT, correct: true },
      { label: fmt(dEng), num: dEng, correct: false },
      { label: fmt(dComp), num: dComp, correct: false },
      { label: fmt(dLog), num: dLog, correct: false }
    ],
    solution: sol
  };
}));

reg(buildGenerator({
  baseId: "materials-025",
  topic: "Materials",
  subtopic: "Thermal expansion (free elongation)",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "With free ends there is no stress -- the bar simply grows. Thermal strain is alpha times the temperature change, and elongation is strain times original length.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var mats = [
    ["aluminum", 23e-6], ["steel", 12e-6], ["copper", 17e-6], ["brass", 19e-6]
  ];
  var m = pick(mats);
  var L = pick([1.5, 2.0, 2.5, 3.0]);
  var T1 = pick([10, 20, 25]);
  var dT = pick([40, 50, 60, 70, 80]);
  var T2 = T1 + dT;
  var a6 = m[1] * 1e6;                       // alpha in units of 10^-6
  var eps = m[1] * dT;                       // thermal strain
  var dl = eps * L * 1000;                   // elongation in mm
  var dNoL = m[1] * dT * 1000;               // forgot to multiply by length (strain as mm)
  var dAbs = m[1] * T2 * L * 1000;           // used the final temperature instead of Delta T
  var dDbl = m[1] * dT * (2 * L) * 1000;     // doubled the bar length
  var r = function (v) { return Math.round(v * 100) / 100; };
  var q = "A " + fmt(L) + "-m " + m[0] + " bar with free ends is heated from " + T1 +
    " C to " + T2 + " C. The coefficient of thermal expansion is " + fmt(a6) +
    " x 10^-6 per C. How much does the bar elongate?";
  var sol = "Refer to the Thermal Expansion section in the Materials Science/Structure of Matter chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for the elongation \\(\\delta\\). The handbook prints:\n\n" +
    "$$\\varepsilon = \\alpha\\,\\Delta T$$\n\n" +
    "Compute the thermal strain:\n\n" +
    "$$(\\varepsilon) = (" + fmt(a6) + " \\times 10^{-6})(" + T2 + " - " + T1 + ") = (" + fmt(a6) +
    " \\times 10^{-6})(" + dT + ") = " + fmt(eps * 1e3) + " \\times 10^{-3}$$\n\n" +
    "$$(\\delta) = \\varepsilon L = (" + fmt(eps * 1e3) + " \\times 10^{-3})(" + fmt(L) + ") = " + fmt(dl) +
    " \\times 10^{-3} \\text{ m} = " + fmt(dl) + " \\text{ mm}$$";
  return {
    variantKey: m[0].slice(0, 2) + "-L" + Math.round(L * 10) + "-dT" + dT,
    question: q,
    options: [
      { label: fmt(r(dl)) + " mm", num: r(dl), correct: true },
      { label: fmt(r(dNoL)) + " mm", num: r(dNoL), correct: false },
      { label: fmt(r(dAbs)) + " mm", num: r(dAbs), correct: false },
      { label: fmt(r(dDbl)) + " mm", num: r(dDbl), correct: false }
    ],
    solution: sol
  };
}));

reg(buildGenerator({
  baseId: "materials-026",
  topic: "Materials",
  subtopic: "Fracture toughness (edge crack)",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "The stress intensity combines applied stress, crack size, and geometry. Crack length must be in meters under the square root -- millimeters give a result off by a factor of about 31.6.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var a = pick([2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0]);
  var Y = pick([1.05, 1.1, 1.15, 1.2]);
  var s = pick([200, 225, 250, 275, 300]);
  var am = a / 1000;
  var K = Y * s * Math.sqrt(Math.PI * am);
  var dNoY = s * Math.sqrt(Math.PI * am);        // forgot the geometry factor
  var dHalf = Y * s * Math.sqrt(Math.PI * am / 2); // used half the crack length (center-crack slip)
  var dNoSqrt = Y * s * Math.PI * am;            // forgot the square root
  var r1 = function (v) { return Math.round(v * 10) / 10; };
  var q = "A steel plate contains an edge crack " + fmt(a) +
    " mm long (geometry factor Y = " + fmt(Y) +
    "). The plate is subjected to a tensile stress of " + s +
    " MPa. What is the mode-I stress intensity factor?";
  var sol = "Refer to the Fracture Toughness section in the Materials Science/Structure of Matter chapter of the FE Reference Handbook (v10.6).\n\n" +
    "Ultimately, we must solve for \\(K\\). The handbook relates the stress intensity to applied stress, crack length, and geometry factor:\n\n" +
    "$$K = Y\\sigma\\sqrt{\\pi a}$$\n\n" +
    "Convert the crack length to meters:\n\n" +
    "$$(a) = " + fmt(a) + " \\text{ mm} = " + fmt(am) + " \\text{ m}$$\n\n" +
    "$$(K) = (" + fmt(Y) + ")(" + s + ")\\sqrt{\\pi(" + fmt(am) + ")} = (" + fmt(Y * s) + ")(" + fmt(Math.sqrt(Math.PI * am)) + ")$$\n\n" +
    "$$(K) = " + r1(K).toFixed(1) + " \\text{ MPa-m}^{1/2}$$";
  return {
    variantKey: "a" + Math.round(a * 10) + "-Y" + Math.round(Y * 100) + "-s" + s,
    question: q,
    options: [
      { label: r1(K).toFixed(1) + " MPa-m^1/2", num: r1(K), correct: true },
      { label: r1(dNoY).toFixed(1) + " MPa-m^1/2", num: r1(dNoY), correct: false },
      { label: r1(dHalf).toFixed(1) + " MPa-m^1/2", num: r1(dHalf), correct: false },
      { label: r1(dNoSqrt).toFixed(1) + " MPa-m^1/2", num: r1(dNoSqrt), correct: false }
    ],
    solution: sol
  };
}));
/* Workstream 3: parameterized generators for materials-027, 028, 029, 030, 032, 033.
 * Fragment — concatenated between mat_scaffold_core.js and mat_footer.js. */

var SUPD = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
function supInt(e) {
  var s = e < 0 ? "⁻" : "";
  var d = String(Math.abs(e)).split("");
  for (var i = 0; i < d.length; i++) s += SUPD[d[i]];
  return s;
}
function sci(m, e) { return fmt(m) + " × 10" + supInt(e); } // "2.5 × 10⁻¹¹"
function pdot(x) { return String(x).replace(/\./g, "p"); }

/* ---------------- materials-027: Fick's first law ---------------- */
var FICK_COMBOS = [];
(function () {
  var ds = [1, 1.5, 2, 2.5, 3, 4, 5];
  var dcs = [0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.5, 1.6, 2.0];
  var ls = [1, 1.5, 2, 2.5, 3, 4];
  var c2s = [0.2, 0.3, 0.4, 0.5, 0.6, 0.8];
  for (var a = 0; a < ds.length; a++)
    for (var b = 0; b < dcs.length; b++)
      for (var c = 0; c < ls.length; c++) {
        var m = ds[a] * dcs[b] / ls[c];
        if (Math.abs(m * 10 - Math.round(m * 10)) > 1e-9) continue; // clean 1-decimal mantissa
        if (m >= 10 || m <= 0) continue;
        for (var d = 0; d < c2s.length; d++) {
          var c1 = Math.round((c2s[d] + dcs[b]) * 10) / 10;
          if (c1 > 2.6) continue;
          FICK_COMBOS.push({ d: ds[a], dc: dcs[b], L: ls[c], c1: c1, c2: c2s[d], m: Math.round(m * 10) / 10 });
        }
      }
})();

reg(buildGenerator({
  baseId: "materials-027",
  subtopic: "Fick's first law (diffusion flux)",
  difficulty: "hard",
  estimatedTimeSeconds: 180,
  explanation: "Fick's first law drives flux down the concentration gradient -- the negative sign cancels the negative gradient, so flux is positive in the direction of decreasing concentration. Thickness must be in meters.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var c = pick(FICK_COMBOS);
  var m = c.m, L = c.L;
  var grad = (c.c2 - c.c1) / (L / 1000); // kg/m^4, negative
  var mD = m * 1000; // "dropped the 10^-11" trap: used D's mantissa as-is
  return {
    variantKey: "d" + pdot(c.d) + "-dc" + pdot(c.dc) + "-l" + pdot(L) + "-c2" + pdot(c.c2),
    question: "Carbon diffuses through a steel plate. The diffusion coefficient is " + sci(c.d, -11) +
      " m²/s. The carbon concentration drops from " + fmt(c.c1) + " kg/m³ to " + fmt(c.c2) +
      " kg/m³ across the " + fmt(L) + "-mm plate thickness. What is the steady-state diffusion flux?",
    options: [
      { label: sci(m, -8) + " kg/(m²·s)", num: m * 1e-8, correct: true },
      { label: sci(m, -11) + " kg/(m²·s)", num: m * 1e-11, correct: false },
      { label: sci(m, -7) + " kg/(m²·s)", num: m * 1e-7, correct: false },
      { label: fmt(mD) + " kg/(m²·s)", num: mD, correct: false }
    ],
    solution: "Refer to the Diffusion (Fick's First Law) section in the Materials Science/Structure of Matter chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(J\\). The handbook prints:\n\n" +
      "$$J = -D\\frac{dC}{dx}$$\n\n" +
      "The concentration gradient across the plate is:\n\n" +
      "$$\\left(\\frac{dC}{dx}\\right) = \\frac{" + texNum(c.c2 - c.c1) + "}{" + texNum(L / 1000) + "} = " + texNum(grad) + " \\text{ kg/m}^4$$\n\n" +
      "$$(J) = -(" + fmt(c.d) + " \\times 10^{-11})(" + texNum(grad) + ") = " + fmt(m) + " \\times 10^{-8} \\text{ kg/(m}^2\\text{-s)}$$"
  };
}));

/* ---------------- materials-028: ASTM grain size number ---------------- */
reg(buildGenerator({
  baseId: "materials-028",
  subtopic: "ASTM grain size number",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "The ASTM relation is a power of two: each increment of the grain size number doubles the grain count. Count 64 = 2^6, then add one for the offset in the definition.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var n = ri(4, 10);
  var N = Math.pow(2, n - 1);
  var mode = pick(["std", "q", "m200"]);
  var R = N / 4;
  var q, corr;
  if (mode === "std") {
    q = "A metallographic sample shows " + N + " grains within the standard 0.0645 mm² area at 100× magnification. What is the ASTM grain size number?";
    corr = "";
  } else if (mode === "q") {
    q = "A metallographic sample shows " + R + " grains counted in a 0.0161 mm² field (one-quarter of the standard area) at 100× magnification. What is the ASTM grain size number?";
    corr = "Scale the count to the standard 0.0645 mm² area:\n\n$$(N) = 4(" + R + ") = " + N + "$$\n\n";
  } else {
    q = "A metallographic sample shows " + R + " grains within the standard 0.0645 mm² area at 200× magnification. What is the ASTM grain size number?";
    corr = "Correct the 200× count back to the 100× basis (area ratio \\((200/100)^2 = 4\\)):\n\n$$(N) = 4(" + R + ") = " + N + "$$\n\n";
  }
  // Distractor pool: classic traps are forgetting the -1 offset (n-1) and
  // skipping the area/magnification correction (raw count -> n-2 here).
  var pool = mode === "std" ? [n - 1, n + 1, n - 2, n + 2] : [n - 2, n - 1, n + 1, n + 2];
  var seen = {};
  seen[n] = true;
  var distract = [];
  for (var i = 0; i < pool.length && distract.length < 3; i++) {
    if (pool[i] >= 1 && !seen[pool[i]]) { seen[pool[i]] = true; distract.push(pool[i]); }
  }
  var options = [{ label: String(n), num: n, correct: true }];
  for (var k = 0; k < distract.length; k++) options.push({ label: String(distract[k]), num: distract[k], correct: false });
  return {
    variantKey: "n" + n + "-" + mode,
    question: q,
    options: options,
    solution: "Refer to the ASTM Grain Size section in the Materials Science/Structure of Matter chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(n\\). The handbook prints:\n\n" +
      "$$N = 2^{n-1}$$\n\n" +
      "where \\(N\\) is the number of grains in 0.0645 mm² at 100×.\n\n" +
      corr +
      "$$(" + N + ") = 2^{n-1}$$\n\n" +
      "$$(n - 1) = " + (n - 1) + "$$\n\n" +
      "$$(n) = " + n + "$$"
  };
}));

/* ---------------- materials-029: hardness-tensile strength ---------------- */
reg(buildGenerator({
  baseId: "materials-029",
  subtopic: "Hardness-tensile strength relation",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "The handbook's empirical relation multiplies the Brinell number by 3.5 for the tensile strength in MPa. The 200-MPa answer confuses the hardness number itself for a stress.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var bhn = ri(30, 60) * 5; // 150-300 BHN
  var ts = 3.5 * bhn;
  return {
    variantKey: "bhn" + bhn,
    question: "A plain carbon steel has a Brinell hardness number of " + bhn + ". What is the approximate tensile strength in MPa?",
    options: [
      { label: fmt(ts) + " MPa", num: ts, correct: true },
      { label: fmt(bhn) + " MPa", num: bhn, correct: false },
      { label: fmt(0.5 * bhn) + " MPa", num: 0.5 * bhn, correct: false },
      { label: fmt(7 * bhn) + " MPa", num: 7 * bhn, correct: false }
    ],
    solution: "Refer to the Relationship Between Hardness and Tensile Strength section in the Materials Science chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must estimate TS. The handbook prints:\n\n" +
      "$$TS(\\text{MPa}) = 3.5 \\times BHN$$\n\n" +
      "$$(TS) = 3.5(" + bhn + ") = " + fmt(ts) + " \\text{ MPa}$$"
  };
}));

/* ---------------- materials-030: percent reduction in area ---------------- */
var RA_COMBOS = [];
(function () {
  var ais = [80, 100, 120, 150, 200];
  var ras = [20, 25, 30, 35, 40, 45, 55, 60]; // 50 excluded: trap (100-RA) would equal RA
  for (var i = 0; i < ais.length; i++)
    for (var j = 0; j < ras.length; j++) {
      var af = ais[i] * (100 - ras[j]) / 100;
      if (Math.abs(af - Math.round(af)) > 1e-9) continue;
      RA_COMBOS.push({ ai: ais[i], af: Math.round(af), ra: ras[j] });
    }
})();

reg(buildGenerator({
  baseId: "materials-030",
  subtopic: "Percent reduction in area",
  difficulty: "easy",
  estimatedTimeSeconds: 90,
  explanation: "Percent reduction in area measures how much the cross-section shrank: initial minus final over initial. Using final over initial gives the fraction remaining, not the reduction.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var c = pick(RA_COMBOS);
  var t1 = (100 - c.ra);                       // Af/Ai: fraction remaining trap
  var t2 = Math.round((c.ai - c.af) / c.af * 1000) / 10; // wrong denominator trap
  var t3 = Math.round(c.ai / c.af * 1000) / 10;          // inverted trap
  return {
    variantKey: "ai" + c.ai + "-af" + c.af,
    question: "A tensile test specimen has an initial cross-sectional area of " + c.ai + " mm² and a final cross-sectional area at fracture of " + c.af + " mm². What is the percent reduction in area?",
    options: [
      { label: fmt(c.ra) + "%", num: c.ra, correct: true },
      { label: fmt(t1) + "%", num: t1, correct: false },
      { label: fmt(t2) + "%", num: t2, correct: false },
      { label: fmt(t3) + "%", num: t3, correct: false }
    ],
    solution: "Refer to the Percent Reduction in Area (RA) section in the Materials Science/Structure of Matter chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(%RA\\). The handbook prints:\n\n" +
      "$$\\%RA = \\frac{A_i - A_f}{A_i} \\times 100$$\n\n" +
      "Substituting:\n\n" +
      "$$(\\%RA) = \\frac{" + c.ai + " - " + c.af + "}{" + c.ai + "} \\times 100$$\n\n" +
      "$$(\\%RA) = " + fmt(c.ra) + "\\%$$"
  };
}));

/* ---------------- materials-032: Fourier's law ---------------- */
var FOURIER_COMBOS = [];
(function () {
  var ks = [15, 25, 50, 80, 120, 200];
  var as = [0.25, 0.5, 1.0, 2.0];
  var dts = [50, 80, 100, 120, 150, 200];
  var ls = [5, 10, 15, 20, 25, 40];
  for (var a = 0; a < ks.length; a++)
    for (var b = 0; b < as.length; b++)
      for (var c = 0; c < dts.length; c++)
        for (var d = 0; d < ls.length; d++) {
          var q = ks[a] * as[b] * dts[c] / ls[d]; // kW
          if (Math.abs(q - Math.round(q)) > 1e-9 || q < 1) continue;
          FOURIER_COMBOS.push({ k: ks[a], A: as[b], dT: dts[c], L: ls[d], q: Math.round(q) });
        }
})();

reg(buildGenerator({
  baseId: "materials-032",
  subtopic: "Fourier's law of heat conduction",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "Fourier's law \\(Q = kA\\Delta T/L\\) with \\(L\\) in meters (0.020 m). Forgetting the mm-to-m conversion throws the answer off by a factor of 1,000.",
  videoUrl: null,
  videoTitle: null
}, function () {
  var c = pick(FOURIER_COMBOS);
  return {
    variantKey: "k" + c.k + "-a" + pdot(c.A) + "-dt" + c.dT + "-l" + c.L,
    question: "Heat flows steadily through a steel plate " + c.L + " mm thick with thermal conductivity " + c.k +
      " W/(m·K). The plate area perpendicular to the heat flow is " + fmt(c.A) + " m² and the temperature drop across the plate is " +
      c.dT + " K. What is the rate of heat transfer?",
    options: [
      { label: fmt(c.q) + " kW", num: c.q, correct: true },
      { label: fmt(c.q / 1000) + " kW", num: c.q / 1000, correct: false },
      { label: fmt(c.q / 10) + " kW", num: c.q / 10, correct: false },
      { label: fmt(c.q * 1000) + " kW", num: c.q * 1000, correct: false }
    ],
    solution: "Refer to Fourier's Law of Conduction in the Heat Transfer section of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(\\dot{Q}\\). The handbook prints:\n\n" +
      "$$\\dot{Q} = -kA\\frac{dT}{dx}$$\n\n" +
      "For a plane wall with a linear temperature drop this becomes:\n\n" +
      "$$\\dot{Q} = \\frac{kA\\Delta T}{L}$$\n\n" +
      "Converting the thickness to meters: \\(L = " + c.L + "\\text{ mm} = " + texNum(c.L / 1000) + "\\text{ m}\\).\n\n" +
      "Substituting:\n\n" +
      "$$\\dot{Q} = \\frac{" + c.k + "(" + fmt(c.A) + ")(" + c.dT + ")}{" + texNum(c.L / 1000) + "} = " + fmt(c.q * 1000) + "\\text{ W} = " + fmt(c.q) + "\\text{ kW}$$"
  };
}));

/* ---------------- materials-033: electrical resistivity ---------------- */
var RHO_COMBOS = [];
(function () {
  var rs = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0];
  var as = [1.0, 1.5, 2.0, 2.5, 4.0];
  var ls = [5, 8, 10, 12.5, 20];
  for (var a = 0; a < rs.length; a++)
    for (var b = 0; b < as.length; b++)
      for (var d = 0; d < ls.length; d++) {
        var m = rs[a] * as[b] / ls[d];
        if (m < 0.05 || m >= 10) continue;
        var e = Math.floor(Math.log(m) / Math.LN10 + 1e-9);
        var mant = m / Math.pow(10, e);
        if (mant < 1 || mant >= 10) continue;
        if (Math.abs(mant * 10 - Math.round(mant * 10)) > 1e-6) continue; // clean 1-decimal mantissa
        RHO_COMBOS.push({ R: rs[a], A: as[b], L: ls[d], mant: Math.round(mant * 10) / 10, e: e });
      }
})();

reg(buildGenerator({
  baseId: "materials-033",
  subtopic: "Electrical resistivity",
  difficulty: "medium",
  estimatedTimeSeconds: 120,
  explanation: "\\(\\rho = RA/L\\). The area must be converted from mm² to m² (\\(2.0 \\times 10^{-6}\\text{ m}^2\\)); skipping the conversion gives \\(10^{-5}\\).",
  videoUrl: null,
  videoTitle: null
}, function () {
  var c = pick(RHO_COMBOS);
  return {
    variantKey: "r" + pdot(c.R) + "-a" + pdot(c.A) + "-l" + pdot(c.L),
    question: "A copper wire " + fmt(c.L) + " m long with a cross-sectional area of " + fmt(c.A) +
      " mm² has a measured resistance of " + fmt(c.R) + " Ω. What is the resistivity of the copper?",
    options: [
      { label: sci(c.mant, c.e - 6) + " Ω·m", num: c.mant * Math.pow(10, c.e - 6), correct: true },
      { label: sci(c.mant, c.e) + " Ω·m", num: c.mant * Math.pow(10, c.e), correct: false },
      { label: sci(c.mant, c.e - 3) + " Ω·m", num: c.mant * Math.pow(10, c.e - 3), correct: false },
      { label: sci(c.mant, c.e - 4) + " Ω·m", num: c.mant * Math.pow(10, c.e - 4), correct: false }
    ],
    solution: "Refer to the Resistivity section in the Materials chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(\\rho\\). The handbook prints:\n\n" +
      "$$\\rho = \\frac{RA}{L}$$\n\n" +
      "Converting the area: \\(A = " + fmt(c.A) + "\\text{ mm}^2 = " + fmt(c.A) + " \\times 10^{-6}\\text{ m}^2\\).\n\n" +
      "Substituting:\n\n" +
      "$$\\rho = \\frac{" + fmt(c.R) + "(" + fmt(c.A) + " \\times 10^{-6})}{" + fmt(c.L) + "} = " + fmt(c.mant) + " \\times 10^{" + (c.e - 6) + "}\\text{ }\\Omega\\cdot\\text{m}$$"
  };
}));

  window.MATERIALS_GENERATORS = MAT_ENTRIES;
})();
