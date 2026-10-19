/* PassTheFE "infinite questions" pilot — Mathematics generator templates (Workstream 1).
 *
 * Plain script (no modules) for the static site. Defines window.MATH_GENERATORS:
 * one entry per NUMERICAL Mathematics bank question (math-020 is purely
 * conceptual — a definition with no numbers to randomize — and is skipped).
 *
 * LaTeX convention: NATURAL single-backslash LaTeX. In the JS string literals
 * below that means "\\(" for \(, "\\frac" for \frac, and "\\\\" for the "\\"
 * row break inside aligned/vmatrix/bmatrix environments. NEVER write a doubled
 * backslash before (, ), or an ASCII letter.
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
      topic: "Mathematics",
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
            topic: "Mathematics",
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
  function svgHdr(w, h) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img">';
  }
  var SVG_FTR = '</svg>';
  var AH = '<defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6 Z" fill="#1d4ed8"/></marker></defs>';

  // ---------------------------------------------------------------- math-001
  // Definite integral of kx from 0 to b. Answer k*b^2/2.
  var G001 = buildGenerator({
    baseId: "math-001", subtopic: "Definite integrals", difficulty: "easy",
    tiTip: "Yes — punch it straight into the numeric integral template.",
    estimatedTimeSeconds: 60,
    explanation: "Power rule: integral of x^n dx = x^(n+1)/(n+1). Always evaluate upper minus lower bound.",
    videoUrl: "https://www.youtube.com/watch?v=YfROMP7UYjg",
    videoTitle: "FE Civil Exam Mathematics: Integrals Problem 3 a,3 b &3 c (Easy, Medium & Hard)"
  }, function () {
    var k = ri(1, 6), b = ri(2, 6);
    var ans = k * b * b / 2;
    var Ftex = (k % 2 === 0) ? (k / 2) + "x^2" : "\\frac{" + k + "}{2}x^2";
    var kh = (k % 2 === 0) ? String(k / 2) : "\\frac{" + k + "}{2}";
    var solution =
      "Refer to the Integral Calculus section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(\\int_0^{" + b + "} " + k + "x\\,dx\\). The power rule gives the antiderivative:\n\n" +
      "$$\\int " + k + "x\\,dx = " + Ftex + " + C$$\n\n" +
      "List the known and unknown parameters in order to evaluate the definite integral:\n\n" +
      "$$\\begin{aligned}\nF(x) &= " + Ftex + " \\\\\na &= 0 \\\\\nb &= " + b + "\n\\end{aligned}$$\n\n" +
      "$$\\left(\\int_0^{" + b + "} " + k + "x\\,dx\\right) = F(" + b + ") - F(0) \\rightarrow (" + kh + ")(" + b + ")^2 - 0 = " + fmt(ans) + "$$\n\n" +
      "$$\\int_0^{" + b + "} " + k + "x\\,dx = " + fmt(ans) + "$$";
    return {
      variantKey: "k" + k + "_b" + b,
      question: "Evaluate the definite integral from 0 to " + b + " of " + k + "x dx.",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(k * b * b), num: k * b * b },                        // forgot the 1/2
        { label: fmt(k * (b + 1) * (b + 1) / 2), num: k * (b + 1) * (b + 1) / 2 }, // upper-bound slip
        { label: fmt(k * b * (b - 1) / 2), num: k * b * (b - 1) / 2 }      // lower-bound slip
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-002
  // Derivative of a*x^n. Answer (a*n) x^(n-1).
  var G002 = buildGenerator({
    baseId: "math-002", subtopic: "Derivatives", difficulty: "easy",
    tiTip: "Not symbolically — but check your answer with the numeric derivative: d/dx of the function at x = 1 should match your result.",
    estimatedTimeSeconds: 60,
    explanation: "Power rule: bring the exponent down, subtract one. It's the inverse of the power rule for integration — know both directions.",
    videoUrl: "https://www.youtube.com/watch?v=9I6a6qYFS8U",
    videoTitle: "Civil FEexam review: Mathematics - derivatives and double derivatives"
  }, function () {
    var a = ri(2, 8), n = ri(2, 4);
    var an = a * n;
    var e1 = (n - 1) === 1 ? "" : sup(n - 1);
    var fx = a + "x" + sup(n);
    var solution =
      "Refer to the Differential Calculus section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(f'(x)\\). The governing rule is the power rule:\n\n" +
      "$$\\frac{d}{dx}(x^n) = nx^{n-1}$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\nf(x) &= " + a + "x^" + n + " \\\\\nn &= " + n + " \\\\\nf'(x) &= ?\n\\end{aligned}$$\n\n" +
      "$$(f'(x)) = (" + a + ")(" + n + ")x^{" + n + "-1} = " + an + "x^{" + (n - 1) + "}$$\n\n" +
      "$$(f'(x)) = " + an + "x" + e1 + "$$";
    return {
      variantKey: "a" + a + "_n" + n,
      question: "What is the derivative of f(x) = " + fx + " with respect to x?",
      options: [
        { label: an + "x" + e1, correct: true },   // num is symbolic here
        { label: an + "x" + sup(n) },              // forgot to reduce the exponent
        { label: a + "x" + e1 },                   // forgot to multiply by n
        { label: "x" + sup(n + 1) }                 // integrated instead of differentiating
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-003
  // System a*x + y = c, b*x - y = d with integer solution (x, y).
  var G003 = buildGenerator({
    baseId: "math-003", subtopic: "Systems of linear equations", difficulty: "easy",
    tiTip: "Yes — system solver: 2nd → sys-solv (above tan), then enter the coefficients.",
    estimatedTimeSeconds: 60,
    explanation: "Systems of two equations appear across statics, fluids, and circuits. The common pitfall is solving for only one variable and forgetting to back-substitute for the other.",
    videoUrl: "https://www.youtube.com/watch?v=8CuOxEAn9hY",
    videoTitle: "Cramer's Rule"
  }, function () {
    var x, y, a, b, c, d;
    for (var tries = 0; tries < 50; tries++) {
      x = ri(1, 9); y = ri(1, 9); a = ri(1, 4); b = ri(1, 4);
      if (x === y || a === b) continue;
      c = a * x + y; d = b * x - y;
      if (d !== 0) break;
    }
    var xw = (c - d) / (a - b);          // subtracted instead of adding
    var yw = c - a * xw;
    var pair = function (px, py) { return "x = " + fmt(px) + ", y = " + fmt(py); };
    var solution =
      "Refer to the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(x\\) and \\(y\\):\n\n" +
      "$$\\begin{aligned}\n" + a + "x + y &= " + c + " \\\\\n" + b + "x - y &= " + d + "\n\\end{aligned}$$\n\n" +
      "Adding the equations eliminates \\(y\\):\n\n" +
      "$$(" + a + "x + y) + (" + b + "x - y) = " + c + " + (" + d + ") \\rightarrow " + (a + b) + "x = " + (c + d) + " \\rightarrow x = " + x + "$$\n\n" +
      "Back-substitute \\(x = " + x + "\\) into \\(" + a + "x + y = " + c + "\\):\n\n" +
      "$$(y) = " + c + " - " + a + "(" + x + ") = " + y + "$$\n\n" +
      "Check in the second equation: \\(" + b + "x - y = " + b + "(" + x + ") - " + y + " = " + d + "\\). Correct.\n\n" +
      "$$x = " + x + ", \\quad y = " + y + "$$";
    return {
      variantKey: "x" + x + "_y" + y + "_a" + a + "_b" + b,
      question: "Solve the system of equations: " + a + "x + y = " + c + " and " + b + "x - y = " + d + ". What is the solution?",
      options: [
        { label: pair(x, y), correct: true },
        { label: pair(x, -y) },   // sign error on y
        { label: pair(y, x) },    // swapped the variables
        { label: pair(xw, yw) }   // subtracted the equations instead of adding
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-004
  // Determinant of an upper-triangular 3x3 = product of the diagonal.
  var G004 = buildGenerator({
    baseId: "math-004", subtopic: "Determinants", difficulty: "medium",
    tiTip: "Yes — matrix menu: enter the matrix, then take its determinant.",
    estimatedTimeSeconds: 120,
    explanation: "Recognizing special matrix forms saves time on the FE. The determinant of any triangular matrix is just the product of its diagonal - a full cofactor expansion is wasted work here.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var d1 = ri(1, 9), d2 = ri(1, 9), d3 = ri(1, 9);
    var u12 = ri(0, 9), u13 = ri(0, 9), u23 = ri(0, 9);
    var ans = d1 * d2 * d3;
    var solution =
      "Refer to the Determinants section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(\\det(A)\\). The matrix is upper triangular — every entry below the main diagonal is zero — so its determinant is the product of the diagonal entries:\n\n" +
      "$$\\det(A) = a_{11}a_{22}a_{33}$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\na_{11} &= " + d1 + " \\\\\na_{22} &= " + d2 + " \\\\\na_{33} &= " + d3 + " \\\\\n\\det(A) &= ?\n\\end{aligned}$$\n\n" +
      "$$(\\det A) = (" + d1 + ")(" + d2 + ")(" + d3 + ")$$\n\n" +
      "$$(\\det A) = " + ans + "$$";
    return {
      variantKey: "d" + d1 + "_" + d2 + "_" + d3,
      question: "What is the determinant of the matrix [[" + d1 + ", " + u12 + ", " + u13 + "], [0, " + d2 + ", " + u23 + "], [0, 0, " + d3 + "]]?",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(d1 + d2 + d3), num: d1 + d2 + d3 }, // added the diagonal instead
        { label: fmt(2 * ans), num: 2 * ans },           // doubled the product
        { label: fmt(ans / 2), num: ans / 2 }            // halved the product
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-005
  // Partial derivative of a*x^2*y + b*x*y^2 wrt x at (x0, y0).
  var G005 = buildGenerator({
    baseId: "math-005", subtopic: "Partial derivatives", difficulty: "medium",
    tiTip: "No symbolic partials — do it by hand. Optional check: hold y fixed at a number and use the numeric d/dx on the resulting single-variable function.",
    estimatedTimeSeconds: 120,
    explanation: "Partial derivatives underpin multivariable optimization and sensitivity analysis. The typical slip is accidentally differentiating with respect to the wrong variable or forgetting to treat the other variable as a constant.",
    videoUrl: "https://www.youtube.com/watch?v=9I6a6qYFS8U",
    videoTitle: "Civil FEexam review: Mathematics - derivatives and double derivatives"
  }, function () {
    var a = ri(1, 4), b = ri(1, 4), x0 = ri(1, 4), y0 = ri(1, 4);
    var ans = 2 * a * x0 * y0 + b * y0 * y0;
    var wrongVar = a * x0 * x0 + 2 * b * x0 * y0; // differentiated wrt y instead
    var dropB = 2 * a * x0 * y0;                  // dropped the b term
    var swapPt = 2 * a * y0 * x0 + b * x0 * x0;   // evaluated at the swapped point
    var solution =
      "Refer to the The Partial Derivative section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(\\frac{\\partial f}{\\partial x}\\) at the point \\((" + x0 + ", " + y0 + ")\\). Differentiate term by term, treating \\(y\\) as a constant:\n\n" +
      "$$\\frac{\\partial f}{\\partial x} = " + (2 * a) + "xy + " + b + "y^2$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\nx &= " + x0 + " \\\\\ny &= " + y0 + " \\\\\n\\frac{\\partial f}{\\partial x} &= ?\n\\end{aligned}$$\n\n" +
      "$$\\left(\\frac{\\partial f}{\\partial x}\\right) = " + (2 * a) + "(" + x0 + ")(" + y0 + ") + " + b + "(" + y0 + ")^2 \\rightarrow \\left(\\frac{\\partial f}{\\partial x}\\right) = " + (2 * a * x0 * y0) + " + " + (b * y0 * y0) + "$$\n\n" +
      "$$\\frac{\\partial f}{\\partial x} = " + ans + "$$";
    return {
      variantKey: "a" + a + "_b" + b + "_x" + x0 + "_y" + y0,
      question: "For the function \\(f(x, y) = " + a + "x^2y + " + b + "xy^2\\), what is the partial derivative of \\(f\\) with respect to \\(x\\), evaluated at the point \\((" + x0 + ", " + y0 + "\\)?",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(wrongVar), num: wrongVar }, // partial wrt y by mistake
        { label: fmt(dropB), num: dropB },       // dropped the second term
        { label: fmt(swapPt), num: swapPt }      // evaluated at (y0, x0)
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-006
  // dy/dx = k*x, y(0) = y0  =>  y(x1) = k*x1^2/2 + y0.
  var G006 = buildGenerator({
    baseId: "math-006", subtopic: "First-order differential equations", difficulty: "medium",
    tiTip: "The solve is by hand (integrate), but verify with the numeric integral: the integral of the right-hand side from 0 to x should equal y(x) − y(0).",
    estimatedTimeSeconds: 90,
    explanation: "Separable ODEs model simple rate processes (e.g., a velocity that grows linearly with time). The common mistake is dropping the constant of integration or failing to use the initial condition to find it.",
    videoUrl: "https://www.youtube.com/watch?v=9dy9flZC8q4",
    videoTitle: "Separable Differential Equations - Fundamentals of Engineering FE EIT Exam Review"
  }, function () {
    var k = ri(1, 5), y0 = ri(0, 9), x1 = ri(1, 4);
    var ans = k * x1 * x1 / 2 + y0;
    var solution =
      "Refer to the Differential Equations section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(y(" + x1 + ")\\). This is a separable first-order equation:\n\n" +
      "$$\\frac{dy}{dx} = " + k + "x \\quad\\Rightarrow\\quad dy = " + k + "x\\,dx$$\n\n" +
      "Integrating both sides:\n\n" +
      "$$y = \\int " + k + "x\\,dx = " + texFrac(k, 2) + "x^2 + C$$\n\n" +
      "List the known and unknown parameters in order to solve for \\(y(" + x1 + ")\\):\n\n" +
      "$$\\begin{aligned}\ny(0) &= " + y0 + " \\\\\nC &= ? \\\\\ny(" + x1 + ") &= ?\n\\end{aligned}$$\n\n" +
      "Apply the initial condition: \\(y(0) = " + texFrac(k, 2) + "(0)^2 + C = " + y0 + "\\), so \\(C = " + y0 + "\\) and \\(y = " + texFrac(k, 2) + "x^2 + " + y0 + "\\).\n\n" +
      "$$(y(" + x1 + ")) = " + texFrac(k, 2) + "(" + x1 + ")^2 + " + y0 + " = " + fmt(ans) + "$$";
    return {
      variantKey: "k" + k + "_y0" + y0 + "_x1" + x1,
      question: "Solve the differential equation \\(\\frac{dy}{dx} = " + k + "x\\) with the initial condition \\(y(0) = " + y0 + "\\). What is \\(y(" + x1 + "\\)?",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(k * x1 * x1 / 2), num: k * x1 * x1 / 2 }, // dropped the constant of integration
        { label: fmt(k * x1 * x1 + y0), num: k * x1 * x1 + y0 }, // forgot the 1/2
        { label: fmt(k * x1 + y0), num: k * x1 + y0 }            // power-rule slip
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-007
  // Dot product of two integer 3-vectors.
  var G007 = buildGenerator({
    baseId: "math-007", subtopic: "Vectors and dot product", difficulty: "easy",
    tiTip: "Yes — vector menu: enter both vectors, dot product.",
    estimatedTimeSeconds: 60,
    explanation: "Dot products test orthogonality and compute work (force dot displacement) in statics and dynamics. Watch the signs - a single missed negative flips the answer, which is why -2 and 10 are tempting traps.",
    videoUrl: "https://www.youtube.com/watch?v=VzX8KJKFhlM",
    videoTitle: "Dot Product of Two Vectors"
  }, function () {
    var a = [nzComp(), nzComp(), nzComp()], b = [nzComp(), nzComp(), nzComp()];
    var p0 = a[0] * b[0], p1 = a[1] * b[1], p2 = a[2] * b[2];
    var ans = p0 + p1 + p2;
    var solution =
      "Refer to the Vectors section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(\\mathbf{a} \\cdot \\mathbf{b}\\). The dot product sums the products of corresponding components:\n\n" +
      "$$\\mathbf{a} \\cdot \\mathbf{b} = a_x b_x + a_y b_y + a_z b_z$$\n\n" +
      "List the known components:\n\n" +
      "$$\\begin{aligned}\n\\mathbf{a} &= " + vecStr(a) + " \\\\\n\\mathbf{b} &= " + vecStr(b) + "\n\\end{aligned}$$\n\n" +
      "$$(\\mathbf{a} \\cdot \\mathbf{b}) = (" + texNum(a[0]) + ")(" + texNum(b[0]) + ") + (" + texNum(a[1]) + ")(" + texNum(b[1]) + ") + (" + texNum(a[2]) + ")(" + texNum(b[2]) + ") \\rightarrow " + texNum(p0) + " + " + texNum(p1) + " + " + texNum(p2) + "$$\n\n" +
      "$$(\\mathbf{a} \\cdot \\mathbf{b}) = " + texNum(ans) + "$$";
    return {
      variantKey: "a" + a.join("_") + "_b" + b.join("_"),
      question: "What is the dot product of vectors a = " + vecStr(a) + " and b = " + vecStr(b) + "?",
      options: [
        { label: sgn(ans), num: ans, correct: true },
        { label: sgn(p0 - p1 + p2), num: p0 - p1 + p2 },       // sign slip on the middle term
        { label: sgn(Math.abs(p0) + Math.abs(p1) + Math.abs(p2)), num: Math.abs(p0) + Math.abs(p1) + Math.abs(p2) }, // dropped all signs
        { label: sgn(p0 + p1), num: p0 + p1 }                  // dropped the z term
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-008
  // Largest eigenvalue of a symmetric 2x2 with integer eigenvalues, built from
  // a Pythagorean triple so the characteristic polynomial factors cleanly.
  var G008 = buildGenerator({
    baseId: "math-008", subtopic: "Eigenvalues", difficulty: "hard",
    tiTip: "No eigenvalue key — write det(A − λI) = 0 by hand, then run the quadratic through poly-solv (2nd → cos); the roots are the eigenvalues.",
    estimatedTimeSeconds: 180,
    explanation: "Eigenvalues show up in vibration analysis, stability, and principal stresses. A frequent error is forgetting to subtract the off-diagonal product (ad - bc term), which changes the characteristic equation entirely.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var trips = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 15, 17]];
    var tr = pick(trips), m = tr[0], q = tr[1], r = tr[2];
    var t = m + ri(1, 6);
    var A = t + m, D = t - m, B = q;
    var lmax = t + r, lmin = t - r;
    var fac = function (root) { return root >= 0 ? "(\\lambda - " + root + ")" : "(\\lambda + " + (-root) + ")"; };
    var solution =
      "Refer to the Matrices section in the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for the eigenvalues \\(\\lambda\\) of \\(A = \\begin{bmatrix} " + A + " & " + B + " \\\\ " + B + " & " + D + " \\end{bmatrix}\\). They are the roots of the characteristic equation:\n\n" +
      "$$\\det(A - \\lambda I) = 0$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\n\\lambda &= ?\n\\end{aligned}$$\n\n" +
      "$$(((" + A + "-\\lambda)(" + D + "-\\lambda) - (" + B + ")(" + B + ")) = 0 \\rightarrow (\\lambda^2 - " + (A + D) + "\\lambda + " + (A * D - B * B) + ") = 0$$\n\n" +
      "Factoring gives \\(" + fac(lmax) + fac(lmin) + " = 0\\), so \\(\\lambda = " + lmax + "\\) or \\(\\lambda = " + texNum(lmin) + "\\):\n\n" +
      "$$(\\lambda_{\\max}) = " + lmax + "$$";
    return {
      variantKey: "A" + A + "_B" + B + "_D" + D,
      question: "What is the largest eigenvalue of the matrix [[" + A + ", " + B + "], [" + B + ", " + D + "]]?",
      options: [
        { label: fmt(lmax), num: lmax, correct: true },
        { label: sgn(lmin), num: lmin },   // took the smaller root
        { label: fmt(A + D), num: A + D },  // reported the trace instead
        { label: fmt(A), num: A }           // reported the (1,1) entry
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-009
  // Slope of the tangent to y = x^3 - k*x at x0: 3*x0^2 - k.
  var G009 = buildGenerator({
    baseId: "math-009", subtopic: "Tangent line slope", difficulty: "easy",
    tiTip: "Yes — numeric derivative d/dx of the function at the given x.",
    estimatedTimeSeconds: 60,
    explanation: "The slope is the derivative evaluated at the point — 12 comes from differentiating only the x³ term and forgetting the −4x term.",
    videoUrl: "https://www.youtube.com/watch?v=9I6a6qYFS8U",
    videoTitle: "Civil FEexam review: Mathematics - derivatives and double derivatives"
  }, function () {
    var x0 = ri(2, 4), k = ri(1, 6);
    var ans = 3 * x0 * x0 - k;
    var solution =
      "Refer to the Differential Calculus section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(m\\), the slope of the tangent line, which equals the derivative evaluated at \\(x = " + x0 + "\\):\n\n" +
      "$$\\frac{dy}{dx} = 3x^2 - " + k + "$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\ny &= x^3 - " + k + "x \\\\\nx &= " + x0 + " \\\\\nm &= ?\n\\end{aligned}$$\n\n" +
      "$$(m) = 3(" + x0 + ")^2 - " + k + " \\rightarrow (m) = " + (3 * x0 * x0) + " - " + k + "$$\n\n" +
      "$$(m) = " + ans + "$$";
    return {
      variantKey: "x0" + x0 + "_k" + k,
      question: "What is the slope of the tangent line to the curve y = x³ − " + k + "x at x = " + x0 + "?",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(3 * x0 * x0), num: 3 * x0 * x0 },       // forgot the −kx term
        { label: fmt(x0 * x0 * x0 - k * x0), num: x0 * x0 * x0 - k * x0 }, // evaluated f, not f'
        { label: fmt(3 * x0 * x0 + k), num: 3 * x0 * x0 + k }  // sign error
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-010
  // U-substitution: integral_0^1 k*x^(n-1) e^(x^n) dx = (k/n)(e - 1), k = n*j.
  var G010 = buildGenerator({
    baseId: "math-010", subtopic: "U-substitution integration", difficulty: "medium",
    tiTip: "Yes — numeric integral template, straight in.",
    estimatedTimeSeconds: 120,
    explanation: "With u-substitution the bounds map 0→0 and 1→1 — e comes from forgetting to evaluate the lower bound, and 1 − e from swapping the bounds.",
    videoUrl: "https://www.youtube.com/watch?v=YfROMP7UYjg",
    videoTitle: "FE Civil Exam Mathematics: Integrals Problem 3 a,3 b &3 c (Easy, Medium & Hard)"
  }, function () {
    var n = pick([2, 3]), j = ri(1, 3), k = n * j;
    var xe = (n - 1) === 1 ? "x" : "x^" + (n - 1);
    var E = Math.E;
    var coef = j === 1 ? "" : j + "";
    var lab = function (s) { return coef === "" ? s : (s === "e" ? coef + s : coef + "(" + s + ")"); };
    var solution =
      "Refer to the Integral Calculus section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(I\\). Substitute \\(u = x^" + n + "\\) so that \\(du = " + k + "x^" + (n - 1) + " \\, dx\\):\n\n" +
      "$$I = \\int_{0}^{1} e^{u} \\, du = e^{u}\\Big|_{0}^{1}$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\nu &= x^" + n + " \\\\\nu(0) &= 0 \\\\\nu(1) &= 1 \\\\\nI &= ?\n\\end{aligned}$$\n\n" +
      "$$(I) = e^{1} - e^{0} \\rightarrow (I) = e - 1$$\n\n" +
      "$$(I) = " + (j === 1 ? "e - 1" : j + "(e - 1)") + "$$";
    return {
      variantKey: "n" + n + "_j" + j,
      question: "Evaluate the definite integral \\(\\displaystyle\\int_0^1 " + k + xe + " e^{x^" + n + "}\\,dx\\).",
      options: [
        { label: j === 1 ? "e − 1" : j + "(e − 1)", num: j * (E - 1), correct: true },
        { label: lab("e"), num: j * E },            // forgot the lower bound
        { label: lab("1 − e"), num: j * (1 - E) },  // swapped the bounds
        { label: (3 * j) + "e", num: 3 * j * E }     // stray factor
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-011
  // Cross product of two integer 3-vectors with nonzero components.
  var G011 = buildGenerator({
    baseId: "math-011", subtopic: "Cross product", difficulty: "medium",
    tiTip: "Yes — vector menu: cross product.",
    estimatedTimeSeconds: 120,
    explanation: "Cross products are anti-commutative — (−5, 7, −3) is b × a, the most common trap, and the j-component carries a minus sign that is easy to drop.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var a, b, cx, cy, cz;
    for (var tries = 0; tries < 60; tries++) {
      a = [nzComp(), nzComp(), nzComp()];
      b = [nzComp(), nzComp(), nzComp()];
      cx = a[1] * b[2] - a[2] * b[1];
      cy = a[2] * b[0] - a[0] * b[2];
      cz = a[0] * b[1] - a[1] * b[0];
      if (cx !== 0 && cy !== 0 && cz !== 0) break;
    }
    var trip = function (x, y, z) { return "(" + sgn(x) + ", " + sgn(y) + ", " + sgn(z) + ")"; };
    var solution =
      "Refer to the Vectors section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(\\mathbf{a} \\times \\mathbf{b}\\):\n\n" +
      "$$\\mathbf{a} \\times \\mathbf{b} = \\begin{vmatrix} \\mathbf{i} & \\mathbf{j} & \\mathbf{k} \\\\ a_x & a_y & a_z \\\\ b_x & b_y & b_z \\end{vmatrix}$$\n\n" +
      "List the known components:\n\n" +
      "$$\\begin{aligned}\n\\mathbf{a} &= " + vecStr(a) + " \\\\\n\\mathbf{b} &= " + vecStr(b) + "\n\\end{aligned}$$\n\n" +
      "$$\\begin{aligned}\n(\\mathbf{a} \\times \\mathbf{b})_x &= (" + texNum(a[1]) + ")(" + texNum(b[2]) + ") - (" + texNum(a[2]) + ")(" + texNum(b[1]) + ") = " + texNum(cx) + " \\\\\n" +
      "(\\mathbf{a} \\times \\mathbf{b})_y &= -[(" + texNum(a[0]) + ")(" + texNum(b[2]) + ") - (" + texNum(a[2]) + ")(" + texNum(b[0]) + ")] = " + texNum(cy) + " \\\\\n" +
      "(\\mathbf{a} \\times \\mathbf{b})_z &= (" + texNum(a[0]) + ")(" + texNum(b[1]) + ") - (" + texNum(a[1]) + ")(" + texNum(b[0]) + ") = " + texNum(cz) + "\n\\end{aligned}$$\n\n" +
      "$$(\\mathbf{a} \\times \\mathbf{b}) = (" + texNum(cx) + ", " + texNum(cy) + ", " + texNum(cz) + ")$$";
    return {
      variantKey: "a" + a.join("_") + "_b" + b.join("_"),
      question: "What is the cross product a × b for vectors a = " + vecStr(a) + " and b = " + vecStr(b) + "?",
      options: [
        { label: trip(cx, cy, cz), correct: true },
        { label: trip(-cx, -cy, -cz) }, // b × a (anti-commutativity trap)
        { label: trip(cx, -cy, cz) },   // dropped the j-component minus sign
        { label: trip(-cx, cy, cz) }    // cofactor sign error on x
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-012
  // y'' + k^2 y = 0, y(0) = 0, y'(0) = k*j  =>  y(pi/2k) = j.
  var G012 = buildGenerator({
    baseId: "math-012", subtopic: "Second-order ODE", difficulty: "hard",
    tiTip: "The ODE setup is by hand, but get the characteristic roots fast: poly-solv (2nd → cos) on the characteristic equation.",
    estimatedTimeSeconds: 150,
    explanation: "The argument is 3x, not x — evaluating sin(π/6) = 1/2 instead of sin(3·π/6) is the designed trap.",
    videoUrl: "https://www.youtube.com/watch?v=9dy9flZC8q4",
    videoTitle: "Separable Differential Equations - Fundamentals of Engineering FE EIT Exam Review"
  }, function () {
    var k = pick([2, 3, 4]), j = ri(1, 3), v0 = k * j;
    var solution =
      "Refer to the Differential Equations section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(y\\left(\\frac{\\pi}{" + (2 * k) + "}\\right)\\). The characteristic equation \\(r^2 + " + (k * k) + " = 0\\) gives \\(r = \\pm " + k + "i\\), so:\n\n" +
      "$$y = C_1 \\cos(" + k + "x) + C_2 \\sin(" + k + "x)$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\ny(0) &= 0 \\\\\ny'(0) &= " + v0 + " \\\\\nx &= \\frac{\\pi}{" + (2 * k) + "} \\\\\ny &= ?\n\\end{aligned}$$\n\n" +
      "Apply the initial conditions: \\(y(0) = C_1 = 0\\) and \\(y'(0) = " + k + "C_2 = " + v0 + " \\rightarrow C_2 = " + j + "\\), so \\(y = " + j + "\\sin(" + k + "x)\\):\n\n" +
      "$$(y) = " + j + "\\sin\\left(" + k + " \\cdot \\frac{\\pi}{" + (2 * k) + "}\\right) \\rightarrow (y) = " + j + "\\sin\\left(\\frac{\\pi}{2}\\right)$$\n\n" +
      "$$(y) = " + j + "$$";
    return {
      variantKey: "k" + k + "_j" + j,
      question: "Solve the differential equation \\(y'' + " + (k * k) + "y = 0\\) with initial conditions \\(y(0) = 0\\) and \\(y'(0) = " + v0 + "\\). What is \\(y\\left(\\frac{\\pi}{" + (2 * k) + "}\\right)\\)?",
      options: [
        { label: fmt(j), num: j, correct: true },
        { label: fracStr(j, 2), num: j / 2 }, // evaluated sin(pi/2k) instead of sin(k·pi/2k)
        { label: "0", num: 0 },               // evaluated sin(pi) by mis-multiplying
        { label: fmt(v0), num: v0 }           // forgot to divide by k
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-013
  // Area between y = x^2 and y = k*x: intersections 0 and k, area k^3/6.
  var G013 = buildGenerator({
    baseId: "math-013", subtopic: "Area between curves", difficulty: "medium",
    tiTip: "Half yes — find the intersection points with num-solv (2nd → sin), then take the numeric integral of (top − bottom) between them.",
    estimatedTimeSeconds: 120,
    explanation: "Always integrate upper curve minus lower curve — integrating x² − 4x and dropping the sign, or doubling the region, produces the 64/3 and 32 traps.",
    videoUrl: "https://www.youtube.com/watch?v=YfROMP7UYjg",
    videoTitle: "FE Civil Exam Mathematics: Integrals Problem 3 a,3 b &3 c (Easy, Medium & Hard)"
  }, function () {
    var k = pick([2, 3, 4, 5, 7, 8, 9]); // k=6 makes two distractors collide (2k^2 = 2*ans)
    var ans = k * k * k / 6;
    var k2 = k * k, k3 = k2 * k;
    var solution =
      "Refer to the Integral Calculus section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for the enclosed area \\(A\\). The limits of integration are the \\(x\\)-values where the two curves cross, so start there.\n\n" +
      "Step 1 - find the limits. Set the two functions equal, move everything to one side, and factor:\n\n" +
      "$$x^2 = " + k + "x \\;\\Rightarrow\\; x^2 - " + k + "x = 0 \\;\\Rightarrow\\; x(x - " + k + ") = 0$$\n\n" +
      "So the curves cross at \\(x = 0\\) and \\(x = " + k + "\\). These are the lower and upper limits. (Plugging back in gives the points \\((0, 0)\\) and \\((" + k + ", " + k2 + ")\\), the two corners of the shaded region in the figure.)\n\n" +
      "Step 2 - find which curve is on top. Test any \\(x\\) between the limits, such as \\(x = 1\\): the line gives \\(y = " + k + "\\) and the parabola gives \\(y = 1\\). The line is higher, so \\(" + k + "x \\geq x^2\\) on the whole interval and the integrand is (top - bottom) = \\(" + k + "x - x^2\\):\n\n" +
      "$$A = \\int_{0}^{" + k + "} (" + k + "x - x^2) \\, dx = \\left[" + texFrac(k, 2) + "x^2 - \\frac{x^3}{3}\\right]_{0}^{" + k + "}$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\n\\text{lower bound} &= 0 \\\\\n\\text{upper bound} &= " + k + " \\\\\nA &= ?\n\\end{aligned}$$\n\n" +
      "$$(A) = \\left(" + texFrac(k, 2) + "(" + k + ")^2 - \\frac{(" + k + ")^3}{3}\\right) - 0 \\rightarrow (A) = " + (k2 * k / 2) + " - " + texFrac(k3, 3) + "$$\n\n" +
      "$$(A) = " + fracStr(k3, 6) + "$$";
    // --- diagram: region enclosed by y = x^2 and y = kx (setup only) ---
    var dW13 = 640, dH13 = 300, ox13 = 70, oy13 = 255;
    var sx13 = (dW13 - ox13 - 40) / k, sy13 = (oy13 - 35) / (k * k);
    var X13 = function (x) { return ox13 + x * sx13; };
    var Y13 = function (y) { return oy13 - y * sy13; };
    var dg13 = svgHdr(dW13, dH13) + AH;
    dg13 += '<line x1="' + ox13 + '" y1="12" x2="' + ox13 + '" y2="' + oy13 + '" stroke="#111" stroke-width="2"/>';
    dg13 += '<line x1="' + ox13 + '" y1="' + oy13 + '" x2="' + (dW13 - 20) + '" y2="' + oy13 + '" stroke="#111" stroke-width="2"/>';
    var dgN13 = 40, dgi13, dgx13;
    var dgSh13 = "M" + X13(0).toFixed(1) + "," + Y13(0).toFixed(1);
    for (dgi13 = 1; dgi13 <= dgN13; dgi13++) { dgx13 = k * dgi13 / dgN13; dgSh13 += " L" + X13(dgx13).toFixed(1) + "," + Y13(k * dgx13).toFixed(1); }
    for (dgi13 = dgN13; dgi13 >= 0; dgi13--) { dgx13 = k * dgi13 / dgN13; dgSh13 += " L" + X13(dgx13).toFixed(1) + "," + Y13(dgx13 * dgx13).toFixed(1); }
    dgSh13 += " Z";
    dg13 += '<path d="' + dgSh13 + '" fill="#bfdbfe" stroke="none"/>';
    var dgP13 = "M" + X13(0).toFixed(1) + "," + Y13(0).toFixed(1);
    for (dgi13 = 1; dgi13 <= dgN13; dgi13++) { dgx13 = k * dgi13 / dgN13; dgP13 += " L" + X13(dgx13).toFixed(1) + "," + Y13(dgx13 * dgx13).toFixed(1); }
    dg13 += '<path d="' + dgP13 + '" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>';
    dg13 += '<line x1="' + X13(0) + '" y1="' + Y13(0) + '" x2="' + X13(k) + '" y2="' + Y13(k * k) + '" stroke="#dc2626" stroke-width="2.5"/>';
    dg13 += '<circle cx="' + X13(k).toFixed(1) + '" cy="' + Y13(k * k).toFixed(1) + '" r="5" fill="#111"/>';
    dg13 += '<text x="' + (X13(k) - 56).toFixed(1) + '" y="' + (Y13(k * k) + 20).toFixed(1) + '" font-size="15" fill="#1d4ed8">y = x&#178;</text>';
    dg13 += '<text x="' + X13(k * 0.45).toFixed(1) + '" y="' + (Y13(k * k * 0.45) - 10).toFixed(1) + '" font-size="15" fill="#dc2626">y = ' + k + 'x</text>';
    dg13 += '<line x1="' + X13(k).toFixed(1) + '" y1="' + (oy13 - 5) + '" x2="' + X13(k).toFixed(1) + '" y2="' + (oy13 + 5) + '" stroke="#111" stroke-width="2"/>';
    dg13 += '<text x="' + (X13(0) - 5).toFixed(1) + '" y="' + (oy13 + 24) + '" font-size="14">0</text>';
    dg13 += '<text x="' + (X13(k) - 6).toFixed(1) + '" y="' + (oy13 + 24) + '" font-size="14">' + k + '</text>';
    dg13 += '<text x="' + (dW13 - 34) + '" y="' + (oy13 + 24) + '" font-size="14">x</text>';
    dg13 += '<text x="8" y="24" font-size="14">y</text>';
    var d013 = svgURL(dg13 + SVG_FTR);
    return {
      variantKey: "k" + k,
      question: "What is the area of the region enclosed by the curves y = x² and y = " + k + "x?",
      options: [
        { label: fracStr(k3, 6), num: ans, correct: true },
        { label: fracStr(2 * k3, 6), num: 2 * ans }, // doubled the region
        { label: fracStr(2 * k2, 1), num: 2 * k2 },  // integrated only one power
        { label: fracStr((k + 1) * (k + 1) * (k + 1), 6), num: (k + 1) * (k + 1) * (k + 1) / 6 } // upper-bound slip
      ],
      solution: solution,
      diagram: d013
    };
  });

  // ---------------------------------------------------------------- math-014
  // Complex multiplication (a + b*i)(c - d*i).
  var G014 = buildGenerator({
    baseId: "math-014", subtopic: "Complex multiplication", difficulty: "medium",
    tiTip: "Yes — complex mode, punch it straight in.",
    estimatedTimeSeconds: 90,
    explanation: "The entire problem turns on i² = −1 — forgetting it gives −5 − 2i, the most common wrong answer on complex-number questions.",
    videoUrl: "https://www.youtube.com/watch?v=NigazjhxQvI",
    videoTitle: "FE Problem of the Day #16"
  }, function () {
    var a, b, c, d, re, im;
    for (var tries = 0; tries < 60; tries++) {
      a = ri(1, 9); b = ri(1, 9); c = ri(1, 9); d = ri(1, 9);
      im = b * c - a * d;
      if (im !== 0) break;
    }
    re = a * c + b * d;
    var zstr = function (zr, zi) {
      return sgn(zr) + " " + (zi < 0 ? "−" : "+") + " " + fmt(Math.abs(zi)) + "i";
    };
    var solution =
      "Refer to the Algebra of Complex Numbers section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for the product \\(z\\). Expand and use \\(i^2 = -1\\):\n\n" +
      "$$z = (" + a + " + " + b + "i)(" + c + " - " + d + "i) = " + (a * c) + " - " + (a * d) + "i + " + (b * c) + "i - " + (b * d) + "i^2$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\ni^2 &= -1 \\\\\nz &= ?\n\\end{aligned}$$\n\n" +
      "$$(z) = " + (a * c) + " + " + texNum(im) + "i - " + (b * d) + "(-1) \\rightarrow (z) = " + (a * c) + " + " + texNum(im) + "i + " + (b * d) + "$$\n\n" +
      "$$(z) = " + texNum(re) + " + " + texNum(im) + "i$$";
    return {
      variantKey: "a" + a + "_b" + b + "_c" + c + "_d" + d,
      question: "What is the product (" + a + " + " + b + "i)(" + c + " − " + d + "i)?",
      options: [
        { label: zstr(re, im), correct: true },
        { label: zstr(a * c - b * d, im) }, // forgot i^2 = -1
        { label: zstr(re, -im) },           // sign error on the imaginary part
        { label: zstr(a * c, im) }          // dropped the b*d term
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-015
  // Maclaurin sin: sin(x) ~= x - x^3/6 at x = k/10.
  var G015 = buildGenerator({
    baseId: "math-015", subtopic: "Taylor and Maclaurin series", difficulty: "medium",
    tiTip: "The series is by hand — but check your approximation by evaluating the function directly and comparing.",
    estimatedTimeSeconds: 150,
    explanation: "The Maclaurin series for sine alternates signs — adding the x³/6 term instead of subtracting it gives the 0.20133 trap.",
    videoUrl: "https://www.youtube.com/watch?v=cjPoEZ0I5wQ",
    videoTitle: "Taylor and Maclaurin Series - Example 1"
  }, function () {
    var kk = ri(1, 9), x = kk / 10;
    var t3 = x * x * x / 6;
    var f5 = function (v) { return v.toFixed(5); };
    var xs = x.toFixed(1);
    var solution =
      "Refer to the Taylor's Series section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(\\sin(" + xs + ")\\). We can approximate it with the first two nonzero terms of its Maclaurin series:\n\n" +
      "$$\\sin x \\approx x - \\frac{x^3}{3!}$$\n\n" +
      "List the known and unknown parameters in order to solve for \\(\\sin(" + xs + ")\\):\n\n" +
      "$$\\begin{aligned}\nx &= " + xs + " \\\\\n\\sin(" + xs + ") &= ?\n\\end{aligned}$$\n\n" +
      "$$ (\\sin(" + xs + ")) \\approx x - \\frac{x^3}{6} \\rightarrow (\\sin(" + xs + ")) \\approx " + xs + " - \\frac{(" + xs + ")^3}{6}$$\n\n" +
      "$$(\\sin(" + xs + ")) \\approx " + xs + " - " + t3.toFixed(5) + " = " + f5(x - t3) + "$$";
    return {
      variantKey: "x" + xs,
      question: "Use the first two nonzero terms of the Maclaurin series for \\(\\sin x\\) to approximate \\(\\sin(" + xs + ")\\). What is the approximate value?",
      options: [
        { label: f5(x - t3), num: x - t3, correct: true },
        { label: f5(x), num: x },               // used only the first term
        { label: f5(x + t3), num: x + t3 },     // added the cubic term instead
        { label: f5(x - 2 * t3), num: x - 2 * t3 } // used x^3/3 instead of x^3/6
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-016
  // Implicit differentiation of x^2 + y^2 = r^2 at a Pythagorean point: -a/b.
  var G016 = buildGenerator({
    baseId: "math-016", subtopic: "Implicit differentiation", difficulty: "easy",
    tiTip: "By hand — implicit differentiation first, then it is plain arithmetic at the point.",
    estimatedTimeSeconds: 60,
    explanation: "Implicit differentiation gives dy/dx = −x/y; the 3/4 trap drops the negative sign from moving the 2x term across the equals sign.",
    videoUrl: "https://www.youtube.com/watch?v=9I6a6qYFS8U",
    videoTitle: "Civil FEexam review: Mathematics - derivatives and double derivatives"
  }, function () {
    var triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25], [9, 12, 15], [12, 16, 20]];
    var tr = pick(triples), A = tr[0], B = tr[1], R = tr[2];
    var solution =
      "Refer to the Derivatives section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(\\frac{dy}{dx}\\). Differentiate implicitly with respect to \\(x\\):\n\n" +
      "$$2x + 2y\\frac{dy}{dx} = 0 \\quad\\Rightarrow\\quad \\frac{dy}{dx} = -\\frac{x}{y}$$\n\n" +
      "List the known and unknown parameters in order to solve for \\(\\frac{dy}{dx}\\):\n\n" +
      "$$\\begin{aligned}\nx &= " + A + " \\\\\ny &= " + B + " \\\\\n\\frac{dy}{dx} &= ?\n\\end{aligned}$$\n\n" +
      "$$\\left(\\frac{dy}{dx}\\right) = -\\frac{x}{y} \\rightarrow \\left(\\frac{dy}{dx}\\right) = -\\frac{" + A + "}{" + B + "}$$\n\n" +
      "$$\\left(\\frac{dy}{dx}\\right) = " + texFrac(-A, B) + "$$";
    // --- diagram: point (A, B) on the circle x^2 + y^2 = R^2 (setup only) ---
    var dg16 = svgHdr(640, 300) + AH;
    var dcx16 = 310, dcy16 = 160, dpr16 = 105;
    dg16 += '<line x1="20" y1="' + dcy16 + '" x2="620" y2="' + dcy16 + '" stroke="#9ca3af" stroke-width="1.5"/>';
    dg16 += '<line x1="' + dcx16 + '" y1="20" x2="' + dcx16 + '" y2="280" stroke="#9ca3af" stroke-width="1.5"/>';
    dg16 += '<circle cx="' + dcx16 + '" cy="' + dcy16 + '" r="' + dpr16 + '" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>';
    var dpx16 = dcx16 + A / R * dpr16, dpy16 = dcy16 - B / R * dpr16;
    dg16 += '<circle cx="' + dpx16.toFixed(1) + '" cy="' + dpy16.toFixed(1) + '" r="6" fill="#dc2626"/>';
    dg16 += '<text x="' + (dpx16 + 12).toFixed(1) + '" y="' + (dpy16 - 10).toFixed(1) + '" font-size="16" fill="#dc2626">(' + A + ', ' + B + ')</text>';
    dg16 += '<text x="' + (dcx16 + dpr16 + 10) + '" y="' + (dcy16 + 24) + '" font-size="15" fill="#1d4ed8">x&#178; + y&#178; = ' + (R * R) + '</text>';
    dg16 += '<text x="604" y="' + (dcy16 - 8) + '" font-size="14" fill="#6b7280">x</text>';
    dg16 += '<text x="' + (dcx16 + 8) + '" y="34" font-size="14" fill="#6b7280">y</text>';
    var d016 = svgURL(dg16 + SVG_FTR);
    return {
      variantKey: "pt" + A + "_" + B,
      question: "If \\(x^2 + y^2 = " + (R * R) + "\\), what is \\(\\frac{dy}{dx}\\) at the point \\((" + A + ", " + B + ")\\)?",
      options: [
        { label: fracStr(-A, B), num: -A / B, correct: true },
        { label: fracStr(A, B), num: A / B },   // dropped the negative sign
        { label: fracStr(-B, A), num: -B / A }, // inverted the fraction
        { label: fracStr(B, A), num: B / A }    // inverted and dropped the sign
      ],
      solution: solution,
      diagram: d016
    };
  });

  // ---------------------------------------------------------------- math-017
  // Gradient of f = a*x^2*y + b*x*y^2 at (x0, y0).
  var G017 = buildGenerator({
    baseId: "math-017", subtopic: "Gradient of a scalar field", difficulty: "medium",
    tiTip: "Partials by hand; optionally verify one component numerically (hold the other variable fixed, numeric d/dx).",
    estimatedTimeSeconds: 120,
    explanation: "Each component needs both product-rule terms — the (4, 4) trap differentiates only one term of each product.",
    videoUrl: "https://www.youtube.com/watch?v=9I6a6qYFS8U",
    videoTitle: "Civil FEexam review: Mathematics - derivatives and double derivatives"
  }, function () {
    var a = ri(1, 4), b = ri(1, 4), x0 = ri(1, 3), y0 = ri(1, 3);
    var fx = 2 * a * x0 * y0 + b * y0 * y0;
    var fy = a * x0 * x0 + 2 * b * x0 * y0;
    var pair = function (px, py) { return "(" + px + ", " + py + ")"; };
    var solution =
      "Refer to the Gradient, Divergence, and Curl section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(\\nabla f(" + x0 + ", " + y0 + ")\\). The gradient is the vector of partial derivatives:\n\n" +
      "$$\\nabla f = \\frac{\\partial f}{\\partial x}\\mathbf{i} + \\frac{\\partial f}{\\partial y}\\mathbf{j}$$\n\n" +
      "List the known and unknown parameters in order to solve for \\(\\nabla f\\):\n\n" +
      "$$\\begin{aligned}\n\\frac{\\partial f}{\\partial x} &= " + (2 * a) + "xy + " + b + "y^2 = " + (2 * a) + "(" + x0 + ")(" + y0 + ") + " + b + "(" + y0 + ")^2 = " + fx + " \\\\\n" +
      "\\frac{\\partial f}{\\partial y} &= " + a + "x^2 + " + (2 * b) + "xy = " + a + "(" + x0 + ")^2 + " + (2 * b) + "(" + x0 + ")(" + y0 + ") = " + fy + " \\\\\n" +
      "\\nabla f(" + x0 + ", " + y0 + ") &= ?\n\\end{aligned}$$\n\n" +
      "$$(\\nabla f(" + x0 + ", " + y0 + ")) = " + fx + "\\mathbf{i} + " + fy + "\\mathbf{j} \\rightarrow (" + fx + ", " + fy + ")$$\n\n" +
      "$$(\\nabla f(" + x0 + ", " + y0 + ")) = (" + fx + ", " + fy + ")$$";
    return {
      variantKey: "a" + a + "_b" + b + "_x" + x0 + "_y" + y0,
      question: "For the scalar field \\(f(x, y) = " + a + "x^2y + " + b + "xy^2\\), what is the gradient \\(\\nabla f\\) evaluated at the point \\((" + x0 + ", " + y0 + ")\\)?",
      options: [
        { label: pair(fx, fy), correct: true },
        { label: pair(fy, fx) }, // swapped the components
        { label: pair(2 * a * x0 * y0, 2 * b * x0 * y0) }, // differentiated only one term of each product
        { label: pair(2 * a * y0 * x0 + b * x0 * x0, a * y0 * y0 + 2 * b * y0 * x0) } // evaluated at the swapped point
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-018
  // Integral_0^{pi/2} sin(k*x) dx = (1 - cos(k*pi/2))/k.
  var G018 = buildGenerator({
    baseId: "math-018", subtopic: "Definite integrals (trigonometric)", difficulty: "easy",
    tiTip: "Yes — numeric integral template. Check you are in radian mode first.",
    estimatedTimeSeconds: 75,
    explanation: "The u-substitution brings a 1/k factor from du = k\u00b7dx — dropping it is the unscaled trap; also watch the substituted bounds and the +cos(0) term.",
    videoUrl: "https://www.youtube.com/watch?v=YfROMP7UYjg",
    videoTitle: "FE Civil Exam Mathematics: Integrals Problem 3 a,3 b &3 c (Easy, Medium & Hard)"
  }, function () {
    var k = pick([2, 3, 5, 6, 7, 9, 10]); // k=1/k=4 make a distractor equal the answer
    var c = Math.round(Math.cos(k * Math.PI / 2)); // -1, 0, or 1
    var uUpper = (k % 2 === 0) ? (k === 2 ? "\\pi" : (k / 2) + "\\pi") : k + "\\pi/2";
    var solution =
      "Refer to the Integral Calculus section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for the definite integral. Substitute \\(u = " + k + "x\\) so that \\(du = " + k + "\\,dx\\):\n\n" +
      "$$\\int_{0}^{\\pi/2}\\sin(" + k + "x)\\,dx = \\frac{1}{" + k + "}\\int_{0}^{" + uUpper + "}\\sin u\\,du = \\frac{1}{" + k + "}\\left[-\\cos u\\right]_{0}^{" + uUpper + "}$$\n\n" +
      "List the known and unknown parameters in order to solve:\n\n" +
      "$$\\begin{aligned}\nu &= " + k + "x \\\\\nI &= ?\n\\end{aligned}$$\n\n" +
      "$$(I) = \\frac{1}{" + k + "}\\left[-\\cos(" + uUpper + ") + \\cos(0)\\right] \\rightarrow (I) = \\frac{1}{" + k + "}(" + texNum(-c) + " + 1)$$\n\n" +
      "$$(I) = " + fracStr(1 - c, k) + "$$";
    return {
      variantKey: "k" + k,
      question: "Evaluate the definite integral \\(\\int_{0}^{\\pi/2} \\sin(" + k + "x)\\,dx\\).",
      options: [
        { label: fracStr(1 - c, k), num: (1 - c) / k, correct: true },
        { label: fmt(1 - c), num: 1 - c },             // dropped the 1/k factor
        { label: fracStr(-1 - c, k), num: (-1 - c) / k }, // swapped the bounds
        { label: fracStr(-c, k), num: -c / k }          // dropped the 1
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-019
  // (1,2) entry of the inverse of [[a,b],[c,d]]: -b/(ad-bc).
  var G019 = buildGenerator({
    baseId: "math-019", subtopic: "Matrix inverse", difficulty: "medium",
    tiTip: "Yes — matrix menu: invert the matrix, read the entry.",
    estimatedTimeSeconds: 120,
    explanation: "The adjugate swaps a and d and negates b and c, then everything is divided by the determinant — the −3 trap skips that final division.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var a, b, c, d, det;
    for (var tries = 0; tries < 60; tries++) {
      a = ri(1, 6); b = ri(1, 6); c = ri(1, 6); d = ri(1, 6);
      det = a * d - b * c;
      if (det !== 0) break;
    }
    var solution =
      "Refer to the Matrices section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for the \\((1, 2)\\) entry of \\(A^{-1}\\). For a \\(2 \\times 2\\) matrix:\n\n" +
      "$$A^{-1} = \\frac{1}{\\det A}\\begin{bmatrix} d & -b \\\\ -c & a \\end{bmatrix}$$\n\n" +
      "List the known and unknown parameters in order to solve:\n\n" +
      "$$\\begin{aligned}\n\\det A &= (" + a + ")(" + d + ") - (" + b + ")(" + c + ") = " + det + " \\\\\n(A^{-1})_{12} &= ?\n\\end{aligned}$$\n\n" +
      "$$((A^{-1})_{12}) = \\frac{-b}{\\det A} \\rightarrow ((A^{-1})_{12}) = \\frac{" + texNum(-b) + "}{" + det + "}$$\n\n" +
      "$$((A^{-1})_{12}) = " + texFrac(-b, det) + "$$";
    return {
      variantKey: "a" + a + "_b" + b + "_c" + c + "_d" + d,
      question: "For the matrix \\(A = \\begin{bmatrix} " + a + " & " + b + " \\\\ " + c + " & " + d + " \\end{bmatrix}\\), what is the \\((1, 2)\\) entry of \\(A^{-1}\\)?",
      options: [
        { label: fracStr(-b, det), num: -b / det, correct: true },
        { label: sgn(-b), num: -b },          // skipped the division by the determinant
        { label: fracStr(b, det), num: b / det },   // sign error
        { label: fracStr(-c, det), num: -c / det }   // used −c instead of −b
      ],
      solution: solution
    };
  });

  // math-020 is SKIPPED: it is purely conceptual (the definition of a linearly
  // independent set of vectors) with no numbers to randomize.

  // ---------------------------------------------------------------- math-021
  // One Newton iteration for f(x) = x^3 - 2x - c from x0 = 2.
  var G021 = buildGenerator({
    baseId: "math-021", subtopic: "Newton's method for root extraction", difficulty: "medium",
    tiTip: "The iteration is arithmetic by hand — use the numeric d/dx to get f′(x₀) if you do not want to differentiate.",
    estimatedTimeSeconds: 120,
    explanation: "Newton's method improves each guess by subtracting f/f'. Watch the sign: a negative f value moves the guess upward.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var c = pick([2, 3, 5, 6, 7, 8, 9]); // c = 4 would give f(2) = 0 and no step at all
    var f2 = 4 - c, fp2 = 10, corr = f2 / fp2, x1 = 2 - corr;
    var solution =
      "Refer to the Newton's Method for Root Extraction section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(x_1\\). The handbook gives the iteration formula:\n\n" +
      "$$x_{j+1} = x_j - \\frac{f(x_j)}{f'(x_j)}$$\n\n" +
      "List the known and unknown parameters in order to compute \\(x_1\\):\n\n" +
      "$$\\begin{aligned}\nf(x) &= x^3 - 2x - " + c + " \\\\\nf'(x) &= 3x^2 - 2 \\\\\nx_0 &= 2 \\\\\nx_1 &= ?\n\\end{aligned}$$\n\n" +
      "Evaluate \\(f\\) and \\(f'\\) at the initial estimate:\n\n" +
      "$$(f(2)) = (2)^3 - 2(2) - " + c + " \\rightarrow 8 - 4 - " + c + " = " + f2 + "$$\n\n" +
      "$$(f'(2)) = 3(2)^2 - 2 \\rightarrow 12 - 2 = 10$$\n\n" +
      "Substitute into the iteration formula:\n\n" +
      "$$(x_1) = (2) - \\frac{(" + f2 + ")}{(10)} \\rightarrow 2 - (" + corr.toFixed(2) + ") = " + x1.toFixed(2) + "$$\n\n" +
      "$$x_1 = " + x1.toFixed(2) + "$$";
    return {
      variantKey: "c" + c,
      question: "Use one iteration of Newton's method for root extraction to estimate the root of \\(f(x) = x^3 - 2x - " + c + "\\), starting from the initial estimate \\(x_0 = 2\\). What is \\(x_1\\)?",
      options: [
        { label: x1.toFixed(2), num: x1, correct: true },
        { label: (2 + corr).toFixed(2), num: 2 + corr },       // added f/f' instead of subtracting
        { label: (2 - corr / 2).toFixed(2), num: 2 - corr / 2 }, // halved the correction step
        { label: (2 - 2 * corr).toFixed(2), num: 2 - 2 * corr }  // doubled the correction step
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-022
  // Integration by parts: integral_0^b x*e^x dx = (b-1)*e^b + 1.
  var G022 = buildGenerator({
    baseId: "math-022", subtopic: "Integration by parts", difficulty: "easy",
    tiTip: "Yes — numeric integral template, straight in.",
    estimatedTimeSeconds: 90,
    explanation: "Integration by parts splits the integrand into u (the part that simplifies when differentiated) and dv (the part that is easy to integrate).",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var b = ri(1, 6), E = Math.E;
    var eb = Math.pow(E, b);
    var ans = (b - 1) * eb + 1;
    var solution =
      "Refer to the Indefinite Integrals section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(\\int_0^" + b + " x e^x\\,dx\\). The handbook's integral equation #6 (integration by parts) gives:\n\n" +
      "$$\\int u(x)\\,dv(x) = u(x)v(x) - \\int v(x)\\,du(x)$$\n\n" +
      "List the known and unknown parameters in order to apply the formula:\n\n" +
      "$$\\begin{aligned}\nu &= x \\\\\ndv &= e^x\\,dx \\\\\ndu &= dx \\\\\nv &= e^x\n\\end{aligned}$$\n\n" +
      "Substitute into the integration-by-parts formula and evaluate from 0 to " + b + ":\n\n" +
      "$$\\left(\\int_0^" + b + " x e^x\\,dx\\right) = \\left[x e^x\\right]_0^" + b + " - \\int_0^" + b + " e^x\\,dx$$\n\n" +
      "Evaluate the boundary term on its own line:\n\n" +
      "$$\\left[x e^x\\right]_0^" + b + " = (" + b + ")(e^" + b + ") - (0)(1) = " + fmt(b * eb) + "$$\n\n" +
      "Evaluate the remaining integral on its own line:\n\n" +
      "$$\\left(\\int_0^" + b + " e^x\\,dx\\right) = \\left[e^x\\right]_0^" + b + " = e^" + b + " - 1 = " + fmt(eb - 1) + "$$\n\n" +
      "Combine the two results:\n\n" +
      "$$\\left(\\int_0^" + b + " x e^x\\,dx\\right) = (" + fmt(b * eb) + ") - (" + fmt(eb - 1) + ") = " + fmt(ans) + "$$\n\n" +
      "$$\\int_0^" + b + " x e^x\\,dx = " + fmt(ans) + "$$";
    return {
      variantKey: "b" + b,
      question: "Evaluate the definite integral \\(\\displaystyle\\int_0^" + b + " x e^x\\,dx\\).",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(b * eb), num: b * eb },           // kept only the u*v boundary term
        { label: fmt(eb - 1), num: eb - 1 },           // kept only the remaining integral
        { label: fmt((b - 1) * eb), num: (b - 1) * eb } // dropped the +1 from the lower bound
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-023
  // x-centroid of the area under y = x^2 on [0, b]: 3b/4.
  var G023 = buildGenerator({
    baseId: "math-023", subtopic: "Centroid of area", difficulty: "hard",
    tiTip: "Setup by hand; use the numeric integral for the area and first-moment pieces.",
    estimatedTimeSeconds: 150,
    explanation: "The x-centroid weights each vertical strip by its distance x from the y-axis; the taller strips on the right pull the centroid right of the midpoint.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var b = ri(1, 4);
    var ans = 3 * b / 4;
    var solution =
      "Refer to the Centroids of Masses, Areas, Lengths, and Volumes section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(x_c\\). The handbook gives, for an area bounded by the axes and the function \\(y = f(x)\\):\n\n" +
      "$$x_c = \\frac{\\int x\\,dA}{A}, \\qquad A = \\int f(x)\\,dx, \\qquad dA = f(x)\\,dx$$\n\n" +
      "List the known and unknown parameters in order to compute \\(x_c\\):\n\n" +
      "$$\\begin{aligned}\nf(x) &= x^2 \\\\\ndA &= x^2\\,dx \\\\\nA &= \\int_0^" + b + " x^2\\,dx \\\\\n\\int x\\,dA &= \\int_0^" + b + " x \\cdot x^2\\,dx = \\int_0^" + b + " x^3\\,dx \\\\\nx_c &= ?\n\\end{aligned}$$\n\n" +
      "Compute the area on its own line:\n\n" +
      "$$(A) = \\left[\\frac{x^3}{3}\\right]_0^" + b + " = " + texFrac(b * b * b, 3) + " - 0 = " + texFrac(b * b * b, 3) + "$$\n\n" +
      "Compute the first moment with respect to the y-axis on its own line:\n\n" +
      "$$\\left(\\int x\\,dA\\right) = \\left[\\frac{x^4}{4}\\right]_0^" + b + " = " + texFrac(b * b * b * b, 4) + " - 0 = " + (b * b * b * b / 4) + "$$\n\n" +
      "Divide the moment by the area:\n\n" +
      "$$(x_c) = \\frac{(" + (b * b * b * b / 4) + ")}{(" + texFrac(b * b * b, 3) + ")} = " + fmt(ans) + "$$\n\n" +
      "$$x_c = " + fmt(ans) + "$$";
    // --- diagram: region under y = x^2 on [0, b] (setup only) ---
    var dg23 = svgHdr(640, 300) + AH;
    var ox23 = 70, oy23 = 255;
    var sx23 = (640 - ox23 - 40) / b, sy23 = (oy23 - 35) / (b * b);
    var X23 = function (x) { return ox23 + x * sx23; };
    var Y23 = function (y) { return oy23 - y * sy23; };
    dg23 += '<line x1="' + ox23 + '" y1="12" x2="' + ox23 + '" y2="' + oy23 + '" stroke="#111" stroke-width="2"/>';
    dg23 += '<line x1="' + ox23 + '" y1="' + oy23 + '" x2="620" y2="' + oy23 + '" stroke="#111" stroke-width="2"/>';
    var N23 = 40, i23, x23;
    var sh23 = "M" + X23(0).toFixed(1) + "," + Y23(0).toFixed(1);
    for (i23 = 1; i23 <= N23; i23++) { x23 = b * i23 / N23; sh23 += " L" + X23(x23).toFixed(1) + "," + Y23(x23 * x23).toFixed(1); }
    sh23 += " L" + X23(b).toFixed(1) + "," + Y23(0).toFixed(1) + " Z";
    dg23 += '<path d="' + sh23 + '" fill="#bfdbfe" stroke="none"/>';
    var pc23 = "M" + X23(0).toFixed(1) + "," + Y23(0).toFixed(1);
    for (i23 = 1; i23 <= N23; i23++) { x23 = b * i23 / N23; pc23 += " L" + X23(x23).toFixed(1) + "," + Y23(x23 * x23).toFixed(1); }
    dg23 += '<path d="' + pc23 + '" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>';
    dg23 += '<line x1="' + X23(b).toFixed(1) + '" y1="' + Y23(b * b).toFixed(1) + '" x2="' + X23(b).toFixed(1) + '" y2="' + oy23 + '" stroke="#111" stroke-width="2" stroke-dasharray="6,4"/>';
    dg23 += '<text x="' + X23(b * 0.5).toFixed(1) + '" y="' + (Y23(b * b * 0.25) - 12).toFixed(1) + '" font-size="15" fill="#1d4ed8">y = x&#178;</text>';
    dg23 += '<text x="' + (X23(0) - 5).toFixed(1) + '" y="' + (oy23 + 24) + '" font-size="14">0</text>';
    dg23 += '<text x="' + (X23(b) - 6).toFixed(1) + '" y="' + (oy23 + 24) + '" font-size="14">x = ' + b + '</text>';
    dg23 += '<text x="606" y="' + (oy23 + 24) + '" font-size="14">x</text>';
    dg23 += '<text x="8" y="24" font-size="14">y</text>';
    var d023 = svgURL(dg23 + SVG_FTR);
    return {
      variantKey: "b" + b,
      question: "Consider the region bounded by the curve \\(y = x^2\\), the x-axis, and the vertical lines \\(x = 0\\) and \\(x = " + b + "\\). What is the x-coordinate of the centroid of this region?",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(b / 2), num: b / 2 },     // used the midpoint of the interval
        { label: fmt(b), num: b },             // used the right edge
        { label: fmt(3 * b / 8), num: 3 * b / 8 } // divided the moment by 2A
      ],
      solution: solution,
      diagram: d023
    };
  });

  // ---------------------------------------------------------------- math-024
  // Divergence of F = (a*x^2*y, b*y*z^2, c*x*z) at (x0, y0, z0).
  var G024 = buildGenerator({
    baseId: "math-024", subtopic: "Divergence of a vector field", difficulty: "medium",
    tiTip: "Partials by hand, then arithmetic at the point — or numerically check each partial there.",
    estimatedTimeSeconds: 120,
    explanation: "Divergence measures the net outflow of a vector field at a point. It is the sum of three partial derivatives, each taken with respect to its own coordinate -- a common slip is differentiating a component with respect to the wrong variable.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var a = ri(1, 3), b = ri(1, 3), c = ri(1, 3);
    var x0 = ri(1, 3), y0 = ri(1, 3), z0 = ri(1, 3);
    var t1 = 2 * a * x0 * y0, t2 = b * z0 * z0, t3 = c * x0;
    var ans = t1 + t2 + t3;
    var solution =
      "Refer to the Gradient, Divergence, and Curl section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(\\nabla \\cdot \\mathbf{F}\\). The handbook prints:\n\n" +
      "$$\\nabla \\cdot \\mathbf{F} = \\frac{\\partial P}{\\partial x} + \\frac{\\partial Q}{\\partial y} + \\frac{\\partial R}{\\partial z}$$\n\n" +
      "Identify the components:\n\n" +
      "$$\\begin{aligned}\nP &= " + a + "x^2 y \\\\\nQ &= " + b + "y z^2 \\\\\nR &= " + c + "x z\n\\end{aligned}$$\n\n" +
      "Differentiate each component with respect to its own variable:\n\n" +
      "$$\\begin{aligned}\n\\frac{\\partial P}{\\partial x} &= " + (2 * a) + "xy \\\\\n\\frac{\\partial Q}{\\partial y} &= " + b + "z^2 \\\\\n\\frac{\\partial R}{\\partial z} &= " + c + "x\n\\end{aligned}$$\n\n" +
      "Evaluate at \\((" + x0 + ", " + y0 + ", " + z0 + ")\\):\n\n" +
      "$$\\begin{aligned}\n" + (2 * a) + "xy &= " + (2 * a) + "(" + x0 + ")(" + y0 + ") = " + t1 + " \\\\\n" + b + "z^2 &= " + b + "(" + z0 + ")^2 = " + t2 + " \\\\\n" + c + "x &= " + c + "(" + x0 + ") = " + t3 + "\n\\end{aligned}$$\n\n" +
      "$$(\\nabla \\cdot \\mathbf{F}) = " + t1 + " + " + t2 + " + " + t3 + " = " + ans + "$$";
    return {
      variantKey: "a" + a + "_b" + b + "_c" + c + "_p" + x0 + y0 + z0,
      question: "The vector field is given by F = (" + a + "x^2 * y, " + b + "y * z^2, " + c + "x * z). What is the divergence of F at the point (" + x0 + ", " + y0 + ", " + z0 + ")?",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(a * x0 * x0 + 2 * b * y0 * z0 + c * z0), num: a * x0 * x0 + 2 * b * y0 * z0 + c * z0 }, // each derivative wrt the wrong variable
        { label: fmt(t1 + t3), num: t1 + t3 },       // dropped the middle term
        { label: fmt(t1 - t2 + t3), num: t1 - t2 + t3 } // sign slip on the middle term
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-025
  // Simpson's rule, n = 2, for integral_a^b (k/x) dx.
  var G025 = buildGenerator({
    baseId: "math-025", subtopic: "Simpson's rule", difficulty: "medium",
    tiTip: "Simpson itself is by hand (that is what is tested) — then verify with the numeric integral.",
    estimatedTimeSeconds: 120,
    explanation: "Simpson's rule fits a parabola through each pair of subintervals, so it is exact for polynomials up to degree 3. With n = 2 there is a single parabola through the three points.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var ab = pick([[1, 3], [1, 5], [2, 4], [2, 6]]);
    var A = ab[0], B = ab[1], kk = ri(1, 3);
    var h = (B - A) / 2, mid = (A + B) / 2;
    var f0 = kk / A, f1 = kk / mid, f2 = kk / B;
    var ans = h / 3 * (f0 + 4 * f1 + f2);
    var solution =
      "Refer to the Simpson's Rule section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(I\\). For \\(n = 2\\), the handbook prints:\n\n" +
      "$$\\int_{a}^{b} f(x) \\, dx \\approx \\frac{h}{3}\\,[f(x_0) + 4f(x_1) + f(x_2)]$$\n\n" +
      "Compute the step size:\n\n" +
      "$$h = \\frac{b - a}{n} = \\frac{" + B + " - " + A + "}{2} = " + h + "$$\n\n" +
      "Evaluate the function at the three nodes:\n\n" +
      "$$\\begin{aligned}\nf(x_0) &= f(" + A + ") = \\frac{" + kk + "}{" + A + "} = " + fmt(f0) + " \\\\\nf(x_1) &= f(" + mid + ") = \\frac{" + kk + "}{" + mid + "} = " + fmt(f1) + " \\\\\nf(x_2) &= f(" + B + ") = \\frac{" + kk + "}{" + B + "} = " + fmt(f2) + "\n\\end{aligned}$$\n\n" +
      "Apply Simpson's rule:\n\n" +
      "$$(I) \\approx \\frac{" + h + "}{3}\\,[" + fmt(f0) + " + 4(" + fmt(f1) + ") + " + fmt(f2) + "]$$\n\n" +
      "$$(I) \\approx \\frac{" + h + "}{3}(" + fmt(f0 + 4 * f1 + f2) + ") \\approx " + fmt(ans) + "$$";
    return {
      variantKey: "a" + A + "_b" + B + "_k" + kk,
      question: "Use Simpson's rule with n = 2 to approximate the integral of (" + kk + "/x) dx from x = " + A + " to x = " + B + ". What is the approximate value?",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(kk * Math.log(B / A)), num: kk * Math.log(B / A) }, // reported the exact integral instead
        { label: fmt(h / 2 * (f0 + 2 * f1 + f2)), num: h / 2 * (f0 + 2 * f1 + f2) }, // used the trapezoidal rule
        { label: fmt(h / 3 * (4 * f0 + f1 + f2)), num: h / 3 * (4 * f0 + f1 + f2) }  // misplaced the 4 weight
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-026
  // Curl of F = (a*x*z, b*y^2, c*x*y) at (x0, y0, z0).
  var G026 = buildGenerator({
    baseId: "math-026", subtopic: "Curl of a vector field", difficulty: "hard",
    tiTip: "By hand — build the curl determinant, differentiate, then plug in the point.",
    estimatedTimeSeconds: 180,
    explanation: "The curl measures the rotation of a vector field at a point. Each component is a difference of two cross-partial derivatives -- the most common slip is swapping the subtraction order, which flips the sign.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var a, b, c, x0, y0, z0, vx, vy;
    for (var tries = 0; tries < 60; tries++) {
      a = ri(1, 2); c = ri(1, 2);
      b = (c === 1 ? 2 : 1); // keep Q's coefficient different from R's so the D3 trap never coincides with the answer
      x0 = ri(1, 3); y0 = ri(1, 3); z0 = ri(1, 3);
      vx = c * x0; vy = a * x0 - c * y0;
      if (vy !== 0) break;
    }
    var trip = function (x, y, z) { return "(" + sgn(x) + ", " + sgn(y) + ", " + sgn(z) + ")"; };
    var solution =
      "Refer to the Gradient, Divergence, and Curl section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(\\nabla \\times \\mathbf{F}\\). The handbook prints:\n\n" +
      "$$\\nabla \\times \\mathbf{F} = \\left(\\frac{\\partial R}{\\partial y} - \\frac{\\partial Q}{\\partial z}\\right)\\mathbf{i} + \\left(\\frac{\\partial P}{\\partial z} - \\frac{\\partial R}{\\partial x}\\right)\\mathbf{j} + \\left(\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right)\\mathbf{k}$$\n\n" +
      "Identify the components:\n\n" +
      "$$\\begin{aligned}\nP &= " + a + "xz \\\\\nQ &= " + b + "y^2 \\\\\nR &= " + c + "xy\n\\end{aligned}$$\n\n" +
      "Compute the six partial derivatives:\n\n" +
      "$$\\begin{aligned}\n\\frac{\\partial R}{\\partial y} &= " + c + "x, & \\frac{\\partial Q}{\\partial z} &= 0 \\\\\n\\frac{\\partial P}{\\partial z} &= " + a + "x, & \\frac{\\partial R}{\\partial x} &= " + c + "y \\\\\n\\frac{\\partial Q}{\\partial x} &= 0, & \\frac{\\partial P}{\\partial y} &= 0\n\\end{aligned}$$\n\n" +
      "Evaluate at \\((" + x0 + ", " + y0 + ", " + z0 + ")\\):\n\n" +
      "$$\\begin{aligned}\n(\\nabla \\times \\mathbf{F})_x &= " + vx + " - 0 = " + texNum(vx) + " \\\\\n(\\nabla \\times \\mathbf{F})_y &= " + (a * x0) + " - " + (c * y0) + " = " + texNum(vy) + " \\\\\n(\\nabla \\times \\mathbf{F})_z &= 0 - 0 = 0\n\\end{aligned}$$\n\n" +
      "$$(\\nabla \\times \\mathbf{F}) = (" + texNum(vx) + ", " + texNum(vy) + ", 0)$$";
    return {
      variantKey: "a" + a + "_b" + b + "_c" + c + "_p" + x0 + y0 + z0,
      question: "The vector field is given by F = (" + a + "x*z, " + b + "y^2, " + c + "x*y). What is the curl of F at the point (" + x0 + ", " + y0 + ", " + z0 + ")?",
      options: [
        { label: trip(vx, vy, 0), correct: true },
        { label: trip(-vx, -vy, 0) },              // swapped the subtraction order
        { label: trip(vx, a * x0 + c * y0, 0) },   // dropped the minus in the y-component
        { label: trip(vx, a * x0 - b * y0, 0) }    // used Q's coefficient in the y-component
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-027
  // One Newton iteration for f(x) = x^2 - c from x0 = 2: x1 = (4 + c)/4.
  var G027 = buildGenerator({
    baseId: "math-027", subtopic: "Newton's method (one iteration)", difficulty: "medium",
    tiTip: "One step by hand — then check yourself: the root is the square root of the constant, just compute it directly.",
    estimatedTimeSeconds: 120,
    explanation: "Newton's method replaces the function with its tangent line at the current estimate and takes the tangent's root as the next estimate. The most common slips are subtracting the correction term instead of adding it (which gives 1.75) and miscomputing the derivative.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var c = pick([3, 5, 6, 7, 8]); // c = 4 would give x1 = x0 = 2 (no step)
    var x1 = (4 + c) / 4, corr = (4 - c) / 4;
    var solution =
      "Refer to the Newton's Method for Root Extraction section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(x_1\\). The handbook prints the update:\n\n" +
      "$$x_{j+1} = x_j - \\frac{f(x_j)}{f'(x_j)}$$\n\n" +
      "For \\(f(x) = x^2 - " + c + "\\):\n\n" +
      "$$(f'(x)) = 2x$$\n\n" +
      "Evaluate at \\(x_0 = 2\\):\n\n" +
      "$$\\begin{aligned}\nf(2) &= 4 - " + c + " = " + (4 - c) + " \\\\\nf'(2) &= 4\n\\end{aligned}$$\n\n" +
      "$$(x_1) = 2 - \\frac{" + (4 - c) + "}{4} = 2 " + (corr >= 0 ? "- " : "+ ") + Math.abs(corr).toFixed(2) + " = " + x1.toFixed(2) + "$$";
    return {
      variantKey: "c" + c,
      question: "Use one iteration of Newton's method to approximate the positive root of \\(f(x) = x^2 - " + c + "\\), starting from the initial estimate \\(x_0 = 2\\). What is \\(x_1\\)?",
      options: [
        { label: x1.toFixed(2), num: x1, correct: true },
        { label: (2 + corr).toFixed(2), num: 2 + corr },         // added the correction instead of subtracting
        { label: "2.00", num: 2 },                              // reported the initial guess
        { label: (2 - 2 * corr).toFixed(2), num: 2 - 2 * corr }  // doubled the correction step
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-028
  // Trapezoidal rule, n = 2, for integral_0^b x^2 dx: 3b^3/8.
  var G028 = buildGenerator({
    baseId: "math-028", subtopic: "Trapezoidal rule", difficulty: "medium",
    tiTip: "By hand (method tested) — verify with the numeric integral.",
    estimatedTimeSeconds: 120,
    explanation: "The trapezoidal rule averages the endpoint heights of each subinterval. For a convex-up function it overestimates -- the exact value 2.67 is the trap answer here, not the trapezoidal estimate.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var b = ri(1, 4);
    var h = b / 2;
    var ans = 3 * b * b * b / 8;
    var solution =
      "Refer to the Trapezoidal Rule section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for the trapezoidal estimate. The handbook prints, with \\(h = (b-a)/n\\):\n\n" +
      "$$\\int_a^b f(x)\\,dx \\approx \\frac{h}{2}[f(x_0) + 2f(x_1) + f(x_2)]$$\n\n" +
      "$$(h) = \\frac{" + b + " - 0}{2} = " + fmt(h) + "$$\n\n" +
      "$$\\approx \\frac{" + fmt(h) + "}{2}[(0)^2 + 2(" + fmt(h) + ")^2 + (" + b + ")^2] = \\frac{" + fmt(h) + "}{2}(" + fmt(6 * h * h) + ") = " + fmt(ans) + "$$";
    return {
      variantKey: "b" + b,
      question: "Use the trapezoidal rule with n = 2 subintervals to approximate the integral from 0 to " + b + " of x^2 dx.",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(b * b * b / 3), num: b * b * b / 3 },   // reported the exact integral
        { label: fmt(b * b * b / 8), num: b * b * b / 8 },   // used the forward rectangular rule
        { label: fmt(5 * b * b * b / 16), num: 5 * b * b * b / 16 } // used the midpoint rule
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-029
  // Laplace transform of e^(-a*t): 1/(s + a).
  var G029 = buildGenerator({
    baseId: "math-029", subtopic: "Laplace transform of an exponential", difficulty: "medium",
    tiTip: "No — Laplace pairs are handbook-table memory: L{e^( −at)} = 1/(s+a).",
    estimatedTimeSeconds: 120,
    explanation: "The handbook's Laplace transform table lists transforms by form. The decaying exponential \\(e^{-at}\\) maps to \\(1/(s + a)\\) -- the sign in the exponent flips in the denominator, which is where most sign errors come from.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var a = ri(1, 9);
    var solution =
      "Refer to the Laplace Transforms section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must identify \\(\\mathcal{L}\\{e^{-" + a + "t}\\}\\). The handbook prints:\n\n" +
      "$$\\mathcal{L}\\{e^{-at}\\} = \\frac{1}{s + a}$$\n\n" +
      "With \\(a = " + a + "\\):\n\n" +
      "$$\\mathcal{L}\\{e^{-" + a + "t}\\} = \\frac{1}{s + " + a + "}$$";
    return {
      variantKey: "a" + a,
      question: "What is the Laplace transform of \\(f(t) = e^{-" + a + "t}\\), for \\(t \\ge 0\\)?",
      options: [
        { label: "\\(1/(s + " + a + ")\\)", correct: true },
        { label: "\\(1/(s - " + a + ")\\)" }, // sign error in the denominator
        { label: "\\(s/(s + " + a + ")\\)" }, // used the cosine transform form
        { label: "\\(" + a + "/(s + " + a + ")\\)" } // multiplied by a
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-030
  // Law of cosines: c = sqrt(a^2 + b^2 - 2ab*cos(C)).
  var G030 = buildGenerator({
    baseId: "math-030", subtopic: "Law of cosines", difficulty: "medium",
    tiTip: "Yes — punch in the law of cosines directly. Check degree mode.",
    estimatedTimeSeconds: 120,
    explanation: "The included angle goes with the two known sides in the law of cosines. The minus sign in front of the 2bc cos A term matters -- flipping it to a plus is the classic error.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var a = ri(3, 9), b = ri(3, 9), C = pick([30, 45, 60, 120]);
    var cosC = C === 30 ? Math.sqrt(3) / 2 : C === 45 ? Math.SQRT1_2 : C === 60 ? 0.5 : -0.5;
    var c2 = a * a + b * b - 2 * a * b * cosC;
    var c = Math.sqrt(c2);
    var solution =
      "Refer to the Trigonometry (Law of Cosines) section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must solve for \\(c\\). The handbook prints:\n\n" +
      "$$c^2 = a^2 + b^2 - 2ab\\cos C$$\n\n" +
      "Substituting:\n\n" +
      "$$(c^2) = " + a + "^2 + " + b + "^2 - 2(" + a + ")(" + b + ")\\cos " + C + "^\\circ$$\n\n" +
      "$$(c^2) = " + (a * a) + " + " + (b * b) + " - " + fmt(2 * a * b * cosC) + " = " + fmt(c2) + "$$\n\n" +
      "$$(c) = \\sqrt{" + fmt(c2) + "} = " + fmt(c) + "$$";
    // --- diagram: triangle with sides a, b and included angle C (setup only) ---
    var Crad30 = C * Math.PI / 180;
    var tqx30 = a, trx30 = b * Math.cos(Crad30), try30 = b * Math.sin(Crad30);
    var txmin30 = Math.min(0, trx30), txmax30 = Math.max(a, trx30);
    var tsf30 = Math.min((640 - 180) / (txmax30 - txmin30), (300 - 120) / try30);
    var tX30 = function (x) { return 90 + (x - txmin30) * tsf30; };
    var tY30 = function (y) { return 250 - y * tsf30; };
    var tPx30 = tX30(0), tPy30 = tY30(0), tQx30 = tX30(a), tQy30 = tY30(0);
    var tRx30 = tX30(trx30), tRy30 = tY30(try30);
    var dg30 = svgHdr(640, 300) + AH;
    dg30 += '<polygon points="' + tPx30.toFixed(1) + ',' + tPy30.toFixed(1) + ' ' + tQx30.toFixed(1) + ',' + tQy30.toFixed(1) + ' ' + tRx30.toFixed(1) + ',' + tRy30.toFixed(1) + '" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2.5"/>';
    var tar30 = 34;
    var ta1x30 = tPx30 + tar30, ta1y30 = tPy30;
    var ta2x30 = tPx30 + tar30 * Math.cos(Crad30), ta2y30 = tPy30 - tar30 * Math.sin(Crad30);
    dg30 += '<path d="M' + ta1x30.toFixed(1) + ',' + ta1y30.toFixed(1) + ' A' + tar30 + ',' + tar30 + ' 0 0 0 ' + ta2x30.toFixed(1) + ',' + ta2y30.toFixed(1) + '" fill="none" stroke="#dc2626" stroke-width="2"/>';
    var tlm30 = tar30 + 18;
    dg30 += '<text x="' + (tPx30 + tlm30 * Math.cos(Crad30 / 2)).toFixed(1) + '" y="' + (tPy30 - tlm30 * Math.sin(Crad30 / 2) + 5).toFixed(1) + '" font-size="15" fill="#dc2626" text-anchor="middle">' + C + '&#176;</text>';
    dg30 += '<text x="' + ((tPx30 + tQx30) / 2).toFixed(1) + '" y="' + (tPy30 + 24) + '" font-size="15" text-anchor="middle">' + a + '</text>';
    dg30 += '<text x="' + ((tPx30 + tRx30) / 2 - 14).toFixed(1) + '" y="' + ((tPy30 + tRy30) / 2).toFixed(1) + '" font-size="15" text-anchor="middle">' + b + '</text>';
    dg30 += '<text x="' + ((tQx30 + tRx30) / 2 + 14).toFixed(1) + '" y="' + ((tQy30 + tRy30) / 2 - 6).toFixed(1) + '" font-size="16" fill="#6b7280" text-anchor="middle">?</text>';
    var d030 = svgURL(dg30 + SVG_FTR);
    return {
      variantKey: "a" + a + "_b" + b + "_C" + C,
      question: "A triangle has sides of length " + a + " and " + b + " with an included angle of " + C + "°. What is the length of the third side?",
      options: [
        { label: fmt(c), num: c, correct: true },
        { label: fmt(Math.sqrt(a * a + b * b + 2 * a * b * cosC)), num: Math.sqrt(a * a + b * b + 2 * a * b * cosC) }, // flipped the sign
        { label: fmt(Math.sqrt(a * a + b * b)), num: Math.sqrt(a * a + b * b) }, // dropped the cosine term
        { label: fmt(Math.sqrt(a * a + b * b - a * b * cosC)), num: Math.sqrt(a * a + b * b - a * b * cosC) } // dropped the factor of 2
      ],
      solution: solution,
      diagram: d030
    };
  });

  // ---------------------------------------------------------------- math-031
  // Euler's forward rectangular rule, n = 4, for integral_0^b x^2 dx: 7b^3/32.
  var G031 = buildGenerator({
    baseId: "math-031", subtopic: "Numerical integration (Euler forward rectangular rule)", difficulty: "medium",
    tiTip: "By hand (method tested) — verify with the numeric integral.",
    estimatedTimeSeconds: 150,
    explanation: "The forward rule evaluates the function at the LEFT endpoint of each subinterval -- including x = 0 and excluding x = 2. Shifting the evaluation points right gives the backward-rectangular (or trapezoidal) value instead.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var b = ri(1, 4);
    var dx = b / 4;
    var pts = [0, dx, 2 * dx, 3 * dx];
    var fvals = pts.map(function (p) { return p * p; });
    var sum = fvals[0] + fvals[1] + fvals[2] + fvals[3];
    var ans = dx * sum;
    var solution =
      "Refer to the Numerical Integration section in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must estimate the integral. The handbook prints Euler's (forward rectangular) rule:\n\n" +
      "$$\\int_a^b f(x)\\,dx \\approx \\Delta x \\sum_{k=0}^{n-1} f(a + k\\Delta x)$$\n\n" +
      "The subinterval width:\n\n" +
      "$$(\\Delta x) = \\frac{" + b + " - 0}{4} = " + fmt(dx) + "$$\n\n" +
      "The function values at the left endpoints \\(" + pts.map(fmt).join(",\\ ") + "\\):\n\n" +
      "$$(f) = " + fvals.map(function (v, i) { return "(" + fmt(pts[i]) + ")^2"; }).join(",\\ ") + " = " + fvals.map(fmt).join(",\\ ") + "$$\n\n" +
      "Summing and multiplying:\n\n" +
      "$$(I) \\approx " + fmt(dx) + " \\times (" + fvals.map(fmt).join(" + ") + ")$$\n\n" +
      "$$(I) \\approx " + fmt(dx) + " \\times " + fmt(sum) + " = " + fmt(ans) + "$$";
    return {
      variantKey: "b" + b,
      question: "Use Euler's forward rectangular rule with \\(n = 4\\) subintervals to estimate \\(\\int_0^" + b + " x^2 \\, dx\\).",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(b * b * b / 3), num: b * b * b / 3 },       // reported the exact integral
        { label: fmt(11 * b * b * b / 32), num: 11 * b * b * b / 32 }, // used the trapezoidal rule
        { label: fmt(15 * b * b * b / 32), num: 15 * b * b * b / 32 }  // used the backward rectangular rule
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-032
  // L'Hopital: lim_{x->0} sin(kx)/x = k.
  var G032 = buildGenerator({
    baseId: "math-032", subtopic: "L'Hôpital's rule", difficulty: "easy",
    tiTip: "L’Hôpital by hand — or sniff it: evaluate the expression at x = 0.001.",
    estimatedTimeSeconds: 60,
    explanation: "Direct substitution gives the indeterminate form 0/0, so L'Hôpital's rule applies: the limit equals \\(\\lim_{x\\to 0} 3\\cos(3x) = 3\\).",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var k = ri(2, 9);
    var solution =
      "Refer to L'Hôpital's Rule in the Calculus section of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must evaluate the limit. Direct substitution gives \\(0/0\\), an indeterminate form, so the handbook's rule applies:\n\n" +
      "$$\\lim_{x \\to a}\\frac{f(x)}{g(x)} = \\lim_{x \\to a}\\frac{f'(x)}{g'(x)}$$\n\n" +
      "Differentiating numerator and denominator:\n\n" +
      "$$\\lim_{x \\to 0}\\frac{\\sin(" + k + "x)}{x} = \\lim_{x \\to 0}\\frac{" + k + "\\cos(" + k + "x)}{1}$$\n\n" +
      "Evaluating at \\(x = 0\\):\n\n" +
      "$$" + k + "\\cos(0) = " + k + "(1) = " + k + "$$";
    return {
      variantKey: "k" + k,
      question: "Evaluate \\(\\lim_{x \\to 0} \\frac{\\sin(" + k + "x)}{x}\\).",
      options: [
        { label: fmt(k), num: k, correct: true },
        { label: "0", num: 0 },              // direct substitution without recognizing 0/0
        { label: "1", num: 1 },              // misapplied the sin(x)/x = 1 rule
        { label: fracStr(1, k), num: 1 / k } // inverted the chain-rule factor
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-033
  // Laplace transform of e^(-a*t): 1/(s + a) (plain-text choice style).
  var G033 = buildGenerator({
    baseId: "math-033", subtopic: "Laplace transform of exponential function", difficulty: "easy",
    tiTip: "No — handbook-table memory: L{e^( −at)} = 1/(s+a).",
    estimatedTimeSeconds: 60,
    explanation: "The handbook's Laplace Transform Pairs table gives \\(L\\{e^{-at}\\} = 1/(s + a)\\). The minus sign in the exponent becomes a plus sign in the denominator.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var a = ri(1, 9);
    var solution =
      "Refer to the Laplace Transform Pairs table in the Mathematics chapter of the FE Reference Handbook (v10.6).\n\n" +
      "Ultimately, we must find \\(F(s)\\). The handbook's table prints:\n\n" +
      "$$e^{-at} \\quad\\Longleftrightarrow\\quad \\frac{1}{s+a}$$\n\n" +
      "Here \\(a = " + a + "\\), so:\n\n" +
      "$$L\\{e^{-" + a + "t}\\} = \\frac{1}{s+" + a + "}$$";
    return {
      variantKey: "a" + a,
      question: "What is the Laplace transform of \\(f(t) = e^{-" + a + "t}\\) for \\(t \\geq 0\\)?",
      options: [
        { label: "1/(s + " + a + ")", correct: true },
        { label: "1/(s − " + a + ")" },  // sign error in the denominator
        { label: a + "/s" },             // confused with the 1/t form
        { label: "e^(−" + a + "s)/s" }   // used the time-shift form
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-037
  // Magnitude of a 3D vector, drawn from Pythagorean triples (integer answer).
  var G037 = buildGenerator({
    baseId: "math-037", subtopic: "Vector magnitude", difficulty: "easy",
    estimatedTimeSeconds: 60,
    explanation: "Magnitude is the 3D Pythagorean theorem: square each component, add, then square-root. Never add the components themselves.",
    tiTip: "Yes — vector menu: magnitude. Or punch in √(x² + y² + z²) directly."
  }, function () {
    var trips = [[2, 3, 6, 7], [1, 2, 2, 3], [2, 4, 4, 6], [4, 4, 7, 9], [1, 4, 8, 9], [3, 4, 12, 13]];
    var t = pick(trips);
    var x = pick([-1, 1]) * t[0], y = pick([-1, 1]) * t[1], z = pick([-1, 1]) * t[2];
    var mag = t[3], sumAbs = t[0] + t[1] + t[2], mag2 = mag * mag;
    var twoD = Math.sqrt(t[0] * t[0] + t[1] * t[1]);
    var solution =
      "Refer to the Vectors section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(|\\mathbf{a}|\\). The handbook gives the length of a vector:\n\n" +
      "$$|\\mathbf{a}| = \\sqrt{a_x^2 + a_y^2 + a_z^2}$$\n\n" +
      "List the known components:\n\n" +
      "$$\\begin{aligned}\na_x &= " + x + " \\\\\na_y &= " + y + " \\\\\na_z &= " + z + "\n\\end{aligned}$$\n\n" +
      "$$|\\mathbf{a}| = \\sqrt{(" + x + ")^2 + (" + y + ")^2 + (" + z + ")^2} = \\sqrt{" + mag2 + "} = " + mag + "$$";
    return {
      variantKey: "m" + x + "_" + y + "_" + z,
      question: "What is the magnitude of vector \\(\\mathbf{a} = " + vecStr([x, y, z]) + "\\)?",
      options: [
        { label: fmt(mag), num: mag, correct: true },
        { label: fmt(sumAbs), num: sumAbs },   // added the components instead
        { label: fmt(mag2), num: mag2 },       // forgot the square root
        { label: fmt(twoD), num: twoD }        // dropped the z-component
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-038
  // Unit vector in the direction of a: divide each component by the magnitude.
  var G038 = buildGenerator({
    baseId: "math-038", subtopic: "Unit vectors", difficulty: "easy",
    estimatedTimeSeconds: 90,
    explanation: "A unit vector keeps the direction and scales the length to 1: divide every component by the magnitude.",
    tiTip: "Yes — vector menu: get the magnitude, then divide each component by it."
  }, function () {
    var trips = [[2, 3, 6, 7], [1, 2, 2, 3], [2, 4, 4, 6], [4, 4, 7, 9], [1, 4, 8, 9], [3, 4, 12, 13]];
    var t = pick(trips);
    var x = pick([-1, 1]) * t[0], y = pick([-1, 1]) * t[1], z = pick([-1, 1]) * t[2];
    var mag = t[3], sumAbs = t[0] + t[1] + t[2];
    function fc(c) { return (c < 0 ? "−" : "") + Math.abs(c) + "/" + mag; }
    var ans = "(" + fc(x) + ", " + fc(y) + ", " + fc(z) + ")";
    var solution =
      "Refer to the Vectors section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for the unit vector \\(\\hat{\\mathbf{a}}\\). Divide each component by the vector's length:\n\n" +
      "$$\\hat{\\mathbf{a}} = \\frac{\\mathbf{a}}{|\\mathbf{a}|}, \\qquad |\\mathbf{a}| = \\sqrt{" + t[0] * t[0] + "+" + t[1] * t[1] + "+" + t[2] * t[2] + "} = " + mag + "$$\n\n" +
      "$$\\hat{\\mathbf{a}} = \\left(\\frac{" + x + "}{" + mag + "}, \\frac{" + y + "}{" + mag + "}, \\frac{" + z + "}{" + mag + "}\\right) = " + ans.replace(/−/g, "-") + "$$";
    return {
      variantKey: "u" + x + "_" + y + "_" + z,
      question: "What is the unit vector in the direction of \\(\\mathbf{a} = " + vecStr([x, y, z]) + "\\)?",
      options: [
        { label: ans, correct: true },
        { label: vecStr([x, y, z]) },                                            // forgot to divide
        { label: "(1/" + t[0] + ", 1/" + t[1] + ", 1/" + t[2] + ")" },            // took reciprocals
        { label: "(" + fc(x).replace("/" + mag, "/" + sumAbs) + ", " + fc(y).replace("/" + mag, "/" + sumAbs) + ", " + fc(z).replace("/" + mag, "/" + sumAbs) + ")" } // divided by the component sum
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-039
  // Angle between two vectors via the dot product: cos θ = a·b / (|a||b|).
  var G039 = buildGenerator({
    baseId: "math-039", subtopic: "Angle between vectors", difficulty: "medium",
    estimatedTimeSeconds: 120,
    explanation: "The dot product ties directly to the angle: a·b = |a||b|cos θ. Solve for θ with arccos.",
    tiTip: "Yes — vector menu for the dot product and both magnitudes, then θ = cos⁻¹(a·b / (|a||b|)). Check degree mode."
  }, function () {
    var pool = [
      { a: [1, 1, 0], b: [1, 0, 0], deg: 45, traps: [30, 60, 90] },
      { a: [3, 3, 0], b: [2, 0, 0], deg: 45, traps: [30, 60, 135] },
      { a: [1, 0, 0], b: [2, 2, 0], deg: 45, traps: [30, 90, 135] },
      { a: [1, 0, 0], b: [0, 3, 0], deg: 90, traps: [45, 60, 0] },
      { a: [2, 3, 0], b: [-3, 2, 0], deg: 90, traps: [45, 0, 180] },
      { a: [1, 1, 1], b: [1, 1, -2], deg: 90, traps: [45, 60, 120] },
      { a: [1, 0, 0], b: [-1, 1, 0], deg: 135, traps: [45, 90, 180] },
      { a: [2, 0, 0], b: [-3, 3, 0], deg: 135, traps: [45, 90, 180] },
      { a: [1, 2, 3], b: [-2, -4, -6], deg: 180, traps: [90, 0, 135] },
      { a: [1, 2, 3], b: [2, 4, 6], deg: 0, traps: [90, 180, 45] }
    ];
    var p = pick(pool);
    var dot = p.a[0] * p.b[0] + p.a[1] * p.b[1] + p.a[2] * p.b[2];
    var ma = Math.sqrt(p.a[0] * p.a[0] + p.a[1] * p.a[1] + p.a[2] * p.a[2]);
    var mb = Math.sqrt(p.b[0] * p.b[0] + p.b[1] * p.b[1] + p.b[2] * p.b[2]);
    var solution =
      "Refer to the Vectors section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(\\theta\\). The handbook gives the dot product as \\(\\mathbf{a} \\cdot \\mathbf{b} = |\\mathbf{a}||\\mathbf{b}|\\cos\\theta\\), so:\n\n" +
      "$$\\cos\\theta = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{|\\mathbf{a}||\\mathbf{b}|} = \\frac{" + sgn(dot) + "}{" + fmt(ma) + " \\times " + fmt(mb) + "}$$\n\n" +
      "$$\\theta = \\cos^{-1}\\left(" + fmt(dot / (ma * mb)) + "\\right) = " + p.deg + "^\\circ$$";
    // --- diagram: two vectors from the origin with the angle between them (setup only) ---
    var vax39 = p.a[0], vay39 = p.a[1], vbx39 = p.b[0], vby39 = p.b[1];
    var vma39 = Math.sqrt(vax39 * vax39 + vay39 * vay39), vmb39 = Math.sqrt(vbx39 * vbx39 + vby39 * vby39);
    var vsf39 = 115 / Math.max(vma39, vmb39);
    var vcx39 = 300, vcy39 = 165;
    var vAx39 = vcx39 + vax39 * vsf39, vAy39 = vcy39 - vay39 * vsf39;
    var vBx39 = vcx39 + vbx39 * vsf39, vBy39 = vcy39 - vby39 * vsf39;
    var dg39 = svgHdr(640, 300) + AH;
    dg39 += '<line x1="40" y1="' + vcy39 + '" x2="600" y2="' + vcy39 + '" stroke="#9ca3af" stroke-width="1.5"/>';
    dg39 += '<line x1="' + vcx39 + '" y1="25" x2="' + vcx39 + '" y2="275" stroke="#9ca3af" stroke-width="1.5"/>';
    var tha39 = Math.atan2(vay39, vax39), thb39 = Math.atan2(vby39, vbx39);
    if (p.deg > 0) {
      var varc39 = 42;
      var sAx39 = vcx39 + varc39 * Math.cos(tha39), sAy39 = vcy39 - varc39 * Math.sin(tha39);
      var sBx39 = vcx39 + varc39 * Math.cos(thb39), sBy39 = vcy39 - varc39 * Math.sin(thb39);
      var dth39 = thb39 - tha39;
      while (dth39 > Math.PI) dth39 -= 2 * Math.PI;
      while (dth39 < -Math.PI) dth39 += 2 * Math.PI;
      var sweep39 = dth39 > 0 ? 0 : 1;
      var large39 = Math.abs(dth39) > Math.PI ? 1 : 0;
      dg39 += '<path d="M' + sAx39.toFixed(1) + ',' + sAy39.toFixed(1) + ' A' + varc39 + ',' + varc39 + ' 0 ' + large39 + ' ' + sweep39 + ' ' + sBx39.toFixed(1) + ',' + sBy39.toFixed(1) + '" fill="none" stroke="#dc2626" stroke-width="2"/>';
      var thm39 = tha39 + dth39 / 2;
      dg39 += '<text x="' + (vcx39 + (varc39 + 20) * Math.cos(thm39)).toFixed(1) + '" y="' + (vcy39 - (varc39 + 20) * Math.sin(thm39) + 5).toFixed(1) + '" font-size="16" fill="#dc2626" text-anchor="middle">&#952;</text>';
    } else {
      dg39 += '<text x="' + (vcx39 + 60).toFixed(1) + '" y="' + (vcy39 - 40) + '" font-size="16" fill="#dc2626">&#952;</text>';
    }
    dg39 += '<line x1="' + vcx39 + '" y1="' + vcy39 + '" x2="' + vAx39.toFixed(1) + '" y2="' + vAy39.toFixed(1) + '" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    dg39 += '<line x1="' + vcx39 + '" y1="' + vcy39 + '" x2="' + vBx39.toFixed(1) + '" y2="' + vBy39.toFixed(1) + '" stroke="#059669" stroke-width="2.5" marker-end="url(#ah)"/>';
    dg39 += '<circle cx="' + vcx39 + '" cy="' + vcy39 + '" r="4" fill="#111"/>';
    dg39 += '<text x="' + (vAx39 + 10).toFixed(1) + '" y="' + (vAy39 - 6).toFixed(1) + '" font-size="15" fill="#1d4ed8">a = ' + vecStr(p.a) + '</text>';
    var vByLbl39 = Math.min(vBy39 + 18, 288);
    dg39 += '<text x="' + (vBx39 + 10).toFixed(1) + '" y="' + vByLbl39.toFixed(1) + '" font-size="15" fill="#059669">b = ' + vecStr(p.b) + '</text>';
    var d039 = svgURL(dg39 + SVG_FTR);
    return {
      variantKey: "ang" + p.deg + "_" + p.a.join("") + "_" + p.b.join(""),
      question: "What is the angle between vectors \\(\\mathbf{a} = " + vecStr(p.a) + "\\) and \\(\\mathbf{b} = " + vecStr(p.b) + "\\)?",
      options: [
        { label: p.deg + "°", num: p.deg, correct: true },
        { label: p.traps[0] + "°", num: p.traps[0] },
        { label: p.traps[1] + "°", num: p.traps[1] },
        { label: p.traps[2] + "°", num: p.traps[2] }
      ],
      solution: solution,
      diagram: d039
    };
  });

  // ---------------------------------------------------------------- math-040
  // Vector projection of a onto b: ((a·b)/|b|²) b.
  var G040 = buildGenerator({
    baseId: "math-040", subtopic: "Vector projection", difficulty: "medium",
    estimatedTimeSeconds: 120,
    explanation: "Projection = (scalar projection) × (unit vector along b), i.e. ((a·b)/|b|²)b. The |b|² division is the step everyone forgets.",
    tiTip: "Mostly by hand — get the dot product and |b|² from the vector menu, then multiply. Formula: ((a·b)/|b|²)b."
  }, function () {
    var kind = ri(0, 3), a, b, ans;
    if (kind === 0) { var j = ri(2, 5); a = [2 * j, 0, 0]; b = [1, 1, 0]; ans = [j, j, 0]; }
    else if (kind === 1) { var j1 = ri(2, 4), k = ri(1, 4), l = ri(1, 4); a = [j1, k, l]; b = [2, 0, 0]; ans = [j1, 0, 0]; }
    else if (kind === 2) { var k2 = ri(2, 4), j2 = ri(1, 4); a = [j2, k2, 0]; b = [0, 1, 0]; ans = [0, k2, 0]; }
    else { var j3 = ri(2, 4); a = [3 * j3, 0, 0]; b = [1, 1, 1]; ans = [j3, j3, j3]; }
    var dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    var b2 = b[0] * b[0] + b[1] * b[1] + b[2] * b[2];
    var noscale = [dot * b[0], dot * b[1], dot * b[2]];   // forgot the |b|² division
    var diff = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];   // answered a − b instead
    var solution =
      "Refer to the Vectors section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for the projection of \\(\\mathbf{a}\\) onto \\(\\mathbf{b}\\). The handbook notes the dot product represents the projection of one vector onto another; scaling the vector \\(\\mathbf{b}\\):\n\n" +
      "$$\\mathrm{proj}_{\\mathbf{b}}\\mathbf{a} = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{|\\mathbf{b}|^2}\\,\\mathbf{b}$$\n\n" +
      "$$\\mathbf{a} \\cdot \\mathbf{b} = " + sgn(dot) + ", \\qquad |\\mathbf{b}|^2 = " + b2 + "$$\n\n" +
      "$$\\mathrm{proj}_{\\mathbf{b}}\\mathbf{a} = \\frac{" + sgn(dot) + "}{" + b2 + "}" + vecStr(b) + " = " + vecStr(ans) + "$$";
    return {
      variantKey: "p" + a.join("") + "_" + b.join(""),
      question: "What is the vector projection of \\(\\mathbf{a} = " + vecStr(a) + "\\) onto \\(\\mathbf{b} = " + vecStr(b) + "\\)?",
      options: [
        { label: vecStr(ans), correct: true },
        { label: vecStr(noscale) },   // forgot the |b|² division
        { label: vecStr(diff) },      // answered a − b instead
        { label: vecStr(a) }          // answered a itself
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-041
  // Parallelogram area = |a × b|.
  var G041 = buildGenerator({
    baseId: "math-041", subtopic: "Parallelogram area", difficulty: "medium",
    estimatedTimeSeconds: 120,
    explanation: "Area = |a × b| = |a||b|sin θ. Half of it is the triangle area — the classic trap.",
    tiTip: "Yes — vector menu: cross product, then magnitude. (Area = |a × b|.)"
  }, function () {
    var k = ri(2, 6), m = ri(1, 5), n = ri(1, 6);
    var area = k * n, tri = area / 2, ab = k * Math.sqrt(m * m + n * n);
    var solution =
      "Refer to the Vectors section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for the parallelogram area. The handbook gives the cross product a magnitude of \\(|\\mathbf{a}||\\mathbf{b}|\\sin\\theta\\), which is exactly the parallelogram area:\n\n" +
      "$$\\text{Area} = |\\mathbf{a} \\times \\mathbf{b}|$$\n\n" +
      "$$\\mathbf{a} \\times \\mathbf{b} = \\begin{vmatrix} \\mathbf{i} & \\mathbf{j} & \\mathbf{k} \\\\ " + k + " & 0 & 0 \\\\ " + m + " & " + n + " & 0 \\end{vmatrix} = (0, 0, " + (k * n) + ")$$\n\n" +
      "$$\\text{Area} = \\sqrt{0^2 + 0^2 + " + (k * n) + "^2} = " + area + "$$";
    // --- diagram: parallelogram with adjacent sides a and b (setup only) ---
    var psf41 = Math.min((640 - 200) / (k + m), (300 - 130) / n);
    var pX41 = function (x) { return 100 + x * psf41; };
    var pY41 = function (y) { return 240 - y * psf41; };
    var pOx41 = pX41(0), pOy41 = pY41(0), pAx41 = pX41(k), pAy41 = pY41(0);
    var pBx41 = pX41(m), pBy41 = pY41(n), pCx41 = pX41(k + m), pCy41 = pY41(n);
    var dg41 = svgHdr(640, 300) + AH;
    dg41 += '<polygon points="' + pOx41.toFixed(1) + ',' + pOy41.toFixed(1) + ' ' + pAx41.toFixed(1) + ',' + pAy41.toFixed(1) + ' ' + pCx41.toFixed(1) + ',' + pCy41.toFixed(1) + ' ' + pBx41.toFixed(1) + ',' + pBy41.toFixed(1) + '" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2.5"/>';
    dg41 += '<line x1="' + pOx41 + '" y1="' + pOy41 + '" x2="' + pAx41.toFixed(1) + '" y2="' + pAy41.toFixed(1) + '" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
    dg41 += '<line x1="' + pOx41 + '" y1="' + pOy41 + '" x2="' + pBx41.toFixed(1) + '" y2="' + pBy41.toFixed(1) + '" stroke="#059669" stroke-width="3" marker-end="url(#ah)"/>';
    dg41 += '<text x="' + ((pOx41 + pAx41) / 2).toFixed(1) + '" y="' + (pOy41 + 24) + '" font-size="15" fill="#1d4ed8" text-anchor="middle">a = ' + vecStr([k, 0, 0]) + '</text>';
    dg41 += '<text x="' + ((pOx41 + pBx41) / 2 - 10).toFixed(1) + '" y="' + ((pOy41 + pBy41) / 2).toFixed(1) + '" font-size="15" fill="#059669" text-anchor="end">b = ' + vecStr([m, n, 0]) + '</text>';
    var d041 = svgURL(dg41 + SVG_FTR);
    return {
      variantKey: "A" + k + "_" + m + "_" + n,
      question: "Vectors \\(\\mathbf{a} = (" + k + ", 0, 0)\\) and \\(\\mathbf{b} = (" + m + ", " + n + ", 0)\\) form adjacent sides of a parallelogram. What is its area?",
      options: [
        { label: fmt(area), num: area, correct: true },
        { label: fmt(tri), num: tri },   // triangle area trap
        { label: fmt(ab), num: ab },      // |a||b|, forgot sin θ
        { label: fmt(k + m + n), num: k + m + n }
      ],
      solution: solution,
      diagram: d041
    };
  });

  // ---------------------------------------------------------------- math-042
  // Linear combination of two vectors: 2a − b, a + 2b, or 3a − b.
  var G042 = buildGenerator({
    baseId: "math-042", subtopic: "Vector addition", difficulty: "easy",
    estimatedTimeSeconds: 60,
    explanation: "Scale first, then add or subtract component by component. Sign slips are the whole game.",
    tiTip: "Yes — the vector menu handles scalar multiples and addition/subtraction directly."
  }, function () {
    var a = [ri(-4, 4), ri(-4, 4), ri(-4, 4)], b = [ri(-4, 4), ri(-4, 4), ri(-4, 4)];
    var op = pick([0, 1, 2]);
    function lin(p, q) { return [p * a[0] + q * b[0], p * a[1] + q * b[1], p * a[2] + q * b[2]]; }
    var ans, opTex, traps;
    if (op === 0) { ans = lin(2, -1); opTex = "2\\mathbf{a} - \\mathbf{b}"; traps = [lin(2, 1), lin(1, -1), lin(1, 1)]; }
    else if (op === 1) { ans = lin(1, 2); opTex = "\\mathbf{a} + 2\\mathbf{b}"; traps = [lin(1, -2), lin(2, 1), lin(-1, 2)]; }
    else { ans = lin(3, -1); opTex = "3\\mathbf{a} - \\mathbf{b}"; traps = [lin(3, 1), lin(1, -1), lin(1, -3)]; }
    var pa = op === 0 ? 2 : op === 1 ? 1 : 3, qa = op === 0 ? -1 : op === 1 ? 2 : -1;
    var solution =
      "Refer to the Vectors section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for \\(" + opTex + "\\). The handbook gives scalar multiplication and addition component-wise:\n\n" +
      "$$" + opTex + " = " + vecStr([pa * a[0], pa * a[1], pa * a[2]]).replace(/\(|\)/g, "") + " + " + vecStr([qa * b[0], qa * b[1], qa * b[2]]).replace(/\(|\)/g, "") + " = " + vecStr(ans) + "$$";
    return {
      variantKey: "c" + op + "_" + a.join("") + "_" + b.join(""),
      question: "For vectors \\(\\mathbf{a} = " + vecStr(a) + "\\) and \\(\\mathbf{b} = " + vecStr(b) + "\\), what is \\(" + opTex + "\\)?",
      options: [
        { label: vecStr(ans), correct: true },
        { label: vecStr(traps[0]) },
        { label: vecStr(traps[1]) },
        { label: vecStr(traps[2]) }
      ],
      solution: solution
    };
  });


  // ==================================================================
  // Oct 18 expansion: generators for the new bank questions math-043..091
  // (added 2026-10-18, 49 questions). math-082 (rhombus condition) is
  // purely conceptual and is skipped, same rationale as math-020.
  // math-059 and math-066 randomize over small discrete variant sets.
  // ==================================================================

  // ---------------------------------------------------------------- math-043
  // Slope through two points (both quadrant-I style, positive slope family).
  var G043 = buildGenerator({
    baseId: "math-043", subtopic: "Slope of a line through two points", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "The slope is rise over run. The inverse is the run over rise, and the negative inverse is the perpendicular slope.",
    videoUrl: null, videoTitle: null
  }, function () {
    var x1 = ri(-12, 12), y1 = ri(-12, 12), x2 = ri(-12, 12), y2 = ri(-12, 12);
    if (x2 === x1 || y2 === y1) { x2 = x1 + 2; y2 = y1 + 3; }
    var m = (y2 - y1) / (x2 - x1);
    var inv = (x2 - x1) / (y2 - y1);
    var solution =
      "Refer to Straight Line in the Mathematics section of the FE Reference Handbook (v10.6), printed page 37 (PDF page 43).\n\n" +
      "$$\\begin{aligned}m &= \\frac{y_2 - y_1}{x_2 - x_1} \\\\ &= \\frac{" + texNum(y2) + "-(" + texNum(y1) + ")}{" + texNum(x2) + "-(" + texNum(x1) + ")} \\\\ &= " + fmt(m) + "\\end{aligned}$$";
    return {
      variantKey: "x1" + x1 + "_y1" + y1 + "_x2" + x2 + "_y2" + y2,
      question: "What is the slope of the line through (" + x1 + ", " + y1 + ") and (" + x2 + ", " + y2 + ")?",
      options: [
        { label: sgn(m), num: m, correct: true },
        { label: sgn(inv), num: inv },            // run over rise
        { label: sgn(-inv), num: -inv },          // perpendicular slope
        { label: sgn(-m), num: -m }               // sign slip
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-044
  // Slope through two points, negative-slope family (matches bank flavor).
  var G044 = buildGenerator({
    baseId: "math-044", subtopic: "Slope of a line through two points", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "The slope is rise over run. The inverse is the run over rise, and the negative inverse is the perpendicular slope.",
    videoUrl: null, videoTitle: null
  }, function () {
    var x1 = ri(-12, 12), y1 = ri(-12, 12), x2 = ri(-12, 12), y2 = ri(-12, 12);
    if (x2 === x1 || y2 === y1 || (y2 - y1) * (x2 - x1) >= 0) { x1 = -1; y1 = 4; x2 = 5; y2 = -8; }
    var m = (y2 - y1) / (x2 - x1);
    var inv = (x2 - x1) / (y2 - y1);
    var solution =
      "Refer to Straight Line in the Mathematics section of the FE Reference Handbook (v10.6), printed page 37 (PDF page 43).\n\n" +
      "$$\\begin{aligned}m &= \\frac{y_2 - y_1}{x_2 - x_1} \\\\ &= \\frac{" + texNum(y2) + "-(" + texNum(y1) + ")}{" + texNum(x2) + "-(" + texNum(x1) + ")} \\\\ &= " + fmt(m) + "\\end{aligned}$$";
    return {
      variantKey: "x1" + x1 + "_y1" + y1 + "_x2" + x2 + "_y2" + y2,
      question: "What is the slope of the line through (" + x1 + ", " + y1 + ") and (" + x2 + ", " + y2 + ")?",
      options: [
        { label: sgn(m), num: m, correct: true },
        { label: sgn(inv), num: inv },            // run over rise
        { label: sgn(-m), num: -m },              // dropped the negative
        { label: sgn(-inv), num: -inv }           // perpendicular slope
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-045
  // Perpendicular slope: m2 = -1/m1.
  var G045 = buildGenerator({
    baseId: "math-045", subtopic: "Perpendicular lines", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "The perpendicular slope is the negative reciprocal.",
    videoUrl: null, videoTitle: null
  }, function () {
    var m1 = pick([0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, -0.5, -1.5, -2, -3, -4]);
    var m2 = -1 / m1;
    var solution =
      "Refer to Straight Line (perpendicular lines) in the Mathematics section of the FE Reference Handbook (v10.6), printed page 37 (PDF page 43).\n\n" +
      "Two lines are perpendicular if \\(m_1 = -1/m_2\\). With \\(m_1 = " + fmt(m1) + "\\), \\(m_2 = -1/" + fmt(m1) + " = " + fmt(m2) + "\\).";
    return {
      variantKey: "m" + m1,
      question: "A line has slope " + fmt(m1) + ". What is the slope of a line perpendicular to it?",
      options: [
        { label: sgn(m2), num: m2, correct: true },
        { label: sgn(-m1), num: -m1 },            // negated, not reciprocated
        { label: sgn(m1), num: m1 },              // same slope
        { label: sgn(1 / m1), num: 1 / m1 }       // reciprocal, not negated
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-046
  // Angle between two lines: alpha = atan((m2-m1)/(1+m2*m1)).
  var G046 = buildGenerator({
    baseId: "math-046", subtopic: "Angle between two lines", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "The denominator is 1 + m2m1. Using only the slope difference or adding the slopes in the numerator gives other angles.",
    videoUrl: null, videoTitle: null
  }, function () {
    var m1 = ri(1, 4), m2 = ri(1, 5);
    if (m2 <= m1) m2 = m1 + 1;
    var deg = function (r) { return r * 180 / Math.PI; };
    var a  = deg(Math.atan((m2 - m1) / (1 + m2 * m1)));
    var t1 = deg(Math.atan(m2 - m1));                       // forgot denominator
    var t2 = deg(Math.atan((m1 + m2) / (1 + m2 * m1)));     // added slopes
    var t3 = deg(Math.atan(m2));                            // inclination of steeper line
    var f = function (v) { return v.toFixed(1) + "°"; };
    var solution =
      "Refer to Straight Line (angle between lines) in the Mathematics section of the FE Reference Handbook (v10.6), printed page 37 (PDF page 43).\n\n" +
      "$$\\begin{aligned}\\alpha &= \\arctan\\frac{m_2 - m_1}{1 + m_2m_1} \\\\ &= \\arctan\\frac{" + m2 + "-" + m1 + "}{1+" + m2 + "(" + m1 + ")} \\\\ &= \\arctan(" + fmt((m2 - m1) / (1 + m2 * m1)) + ") \\\\ &= " + f(a) + "\\end{aligned}$$";
    return {
      variantKey: "m1_" + m1 + "_m2_" + m2,
      question: "Two lines have slopes " + m1 + " and " + m2 + ". Using the handbook formula, what is the angle between them?",
      options: [
        { label: f(a), num: a, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-047
  // Quadratic roots: x^2 - (p+q)x + pq.
  var G047 = buildGenerator({
    baseId: "math-047", subtopic: "Quadratic roots", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "The roots sum to the negated linear coefficient and multiply to the constant term.",
    videoUrl: null, videoTitle: null
  }, function () {
    var p = ri(-6, 9), q = ri(-6, 9);
    if (p === q) q = p + 1;
    var lo = Math.min(p, q), hi = Math.max(p, q);
    var b = -(p + q), c = p * q;
    var term = function (coef, sym) {
      if (coef === 0) return "";
      var s = coef > 0 ? " + " : " − ";
      var v = Math.abs(coef);
      return s + (sym && v === 1 ? "" : v) + (sym || "");
    };
    var eq = "x²" + term(b, "x") + term(c, "") + " = 0";
    var pair = function (r1, r2) { return "x = " + sgn(r1) + " and x = " + sgn(r2); };
    var solution =
      "Refer to Quadratic Equation in the Mathematics section of the FE Reference Handbook (v10.6), printed page 37 (PDF page 43).\n\n" +
      "$$\\begin{aligned}x &= \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\\\ &= \\frac{" + texNum(p + q) + " \\pm \\sqrt{" + texNum((p + q) * (p + q)) + " - " + texNum(4 * c) + "}}{2} \\\\ &= \\frac{" + texNum(p + q) + " \\pm " + fmt(Math.abs(p - q)) + "}{2}\\end{aligned}$$\n\n" +
      "So x = " + sgn(hi) + " and x = " + sgn(lo) + ".";
    return {
      variantKey: "p" + p + "_q" + q,
      question: "What are the roots of " + eq + "?",
      options: [
        { label: pair(lo, hi), correct: true },
        { label: pair(-hi, -lo) },                 // both signs flipped
        { label: pair(-lo, hi) },                  // one sign flipped
        { label: pair(lo + 1, hi - 1) }            // near-miss pair
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-048
  // Sphere center and radius from standard form.
  var G048 = buildGenerator({
    baseId: "math-048", subtopic: "Sphere center and radius", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "The signs of the center coordinates are opposite the signs in the equation. The right side is r squared.",
    videoUrl: null, videoTitle: null
  }, function () {
    var h = ri(-6, 6), k = ri(-6, 6), m = ri(-6, 6), r = ri(2, 9);
    if (h === 0) h = 2; if (k === 0) k = -1; if (m === 0) m = 4;
    var par = function (v, letter) { return "(" + letter + (v >= 0 ? " − " + v : " + " + (-v)) + ")²"; };
    var ctr = function (a, b, c) { return "Center (" + sgn(a) + ", " + sgn(b) + ", " + sgn(c) + "), radius "; };
    var solution =
      "Refer to Quadric Surface (Sphere) in the Mathematics section of the FE Reference Handbook (v10.6), printed page 37 (PDF page 43).\n\n" +
      "The standard form is \\((x-h)^2 + (y-k)^2 + (z-m)^2 = r^2\\), so \\(h = " + texNum(h) + "\\), \\(k = " + texNum(k) + "\\), \\(m = " + texNum(m) + "\\) and \\(r^2 = " + (r * r) + "\\), giving \\(r = " + r + "\\).";
    return {
      variantKey: "h" + h + "_k" + k + "_m" + m + "_r" + r,
      question: "Which is the center and radius of the surface " + par(h, "x") + " + " + par(k, "y") + " + " + par(m, "z") + " = " + (r * r) + "?",
      options: [
        { label: ctr(h, k, m) + r, correct: true },
        { label: ctr(-h, -k, -m) + r },            // all signs flipped
        { label: ctr(h, -k, m) + r },              // y sign flipped
        { label: ctr(h, k, m) + (r * r) }          // r^2 as radius
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-049
  // Complex to polar: c = sqrt(a^2+b^2), theta = atan(b/a).
  var G049 = buildGenerator({
    baseId: "math-049", subtopic: "Complex number polar form", difficulty: "medium",
    tiTip: "Yes — complex menu: convert rectangular to polar directly.",
    estimatedTimeSeconds: 120,
    explanation: "The magnitude is the root of the sum of squares. The angle is tan⁻¹(b/a), not its complement.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(1, 12), b = ri(1, 12);
    var c = Math.sqrt(a * a + b * b);
    var th = Math.atan(b / a) * 180 / Math.PI;
    var f = function (v) { return v.toFixed(1); };
    var pol = function (cc, tt) { return fmt(cc) + "∠" + f(tt) + "°"; };
    var solution =
      "Refer to Algebra of Complex Numbers in the Mathematics section of the FE Reference Handbook (v10.6), printed page 38 (PDF page 44).\n\n" +
      "$$\\begin{aligned}c &= \\sqrt{a^2+b^2} \\\\ &= \\sqrt{" + a + "^2+" + b + "^2} \\\\ &= " + fmt(c) + ",\\qquad \\theta \\\\ &= \\tan^{-1}(b/a) \\\\ &= \\tan^{-1}(" + b + "/" + a + ") \\\\ &= " + f(th) + "^\\circ\\end{aligned}$$";
    return {
      variantKey: "a" + a + "_b" + b,
      question: "Express z = " + a + " + j" + b + " in polar form.",
      options: [
        { label: pol(c, th), correct: true },
        { label: pol(c * c, th) },                 // c^2 instead of c
        { label: pol(c, 90 - th) },                // complement angle
        { label: pol(a + b, th) }                  // a+b as magnitude
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-050
  // Complex multiplication (a+jb)(c+jd).
  var G050 = buildGenerator({
    baseId: "math-050", subtopic: "Complex addition and multiplication", difficulty: "medium",
    tiTip: "Yes — enter both complex numbers and multiply in the complex menu.",
    estimatedTimeSeconds: 120,
    explanation: "Since j² = −1, the −j²·bd term becomes +bd. Adding instead of multiplying gives the sum form.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(1, 9), b = ri(1, 9), c = ri(1, 9), d = ri(-9, 9);
    if (d === 0) d = -1;
    var re = a * c - b * d, im = a * d + b * c;
    var zstr = function (r, i) { return sgn(r) + (i < 0 ? " − j" : " + j") + Math.abs(i); };
    var zin = function (r, i) { return r + (i < 0 ? " − j" : " + j") + Math.abs(i); };
    var solution =
      "Refer to Algebra of Complex Numbers in the Mathematics section of the FE Reference Handbook (v10.6), printed page 38 (PDF page 44).\n\n" +
      "$$\\begin{aligned}z_1z_2 &= (" + a + "+j" + b + ")(" + c + (d < 0 ? "-j" + (-d) : "+j" + d) + ") \\\\ &= " + (a * c) + (a * d < 0 ? " - j" + (-(a * d)) : " + j" + (a * d)) + (b * c < 0 ? " - j" + (-(b * c)) : " + j" + (b * c)) + (b * d < 0 ? " + " : " - ") + "j^2" + Math.abs(b * d) + " \\\\ &= " + re + (im < 0 ? " - j" + (-im) : " + j" + im) + "\\end{aligned}$$";
    return {
      variantKey: "a" + a + "_b" + b + "_c" + c + "_d" + d,
      question: "If z₁ = " + zin(a, b) + " and z₂ = " + zin(c, d) + ", what is z₁z₂ in rectangular form?",
      options: [
        { label: zstr(re, im), correct: true },
        { label: zstr(a * c + b * d, a * d + b * c) },   // sign error on j^2
        { label: zstr(a + c, b + d) },                   // added instead
        { label: zstr(re, a * d - b * c) }               // cross-term sign slip
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-051
  // Dot product of two 3D vectors.
  var G051 = buildGenerator({
    baseId: "math-051", subtopic: "Dot product", difficulty: "easy",
    tiTip: "Yes — vector menu: enter both vectors and take the dot product.",
    estimatedTimeSeconds: 75,
    explanation: "The dot product is a scalar sum of component products.",
    videoUrl: null, videoTitle: null
  }, function () {
    var ax = ri(-5, 5), ay = ri(-5, 5), az = ri(-5, 5), bx = ri(-5, 5), by = ri(-5, 5), bz = ri(-5, 5);
    if (ax === 0) ax = 2; if (bx === 0) bx = 4;
    var ans = ax * bx + ay * by + az * bz;
    var v = function (x, y, z) {
      var s = x + "i ";
      s += (y < 0 ? "− " + (-y) : "+ " + y) + "j ";
      s += (z < 0 ? "− " + (-z) : "+ " + z) + "k";
      return s;
    };
    var solution =
      "Refer to Dot product in the Mathematics section of the FE Reference Handbook (v10.6), printed page 61 (PDF page 67).\n\n" +
      "$$\\begin{aligned}A\\cdot B &= a_xb_x + a_yb_y + a_zb_z \\\\ &= " + texNum(ax) + "(" + texNum(bx) + ") + (" + texNum(ay) + ")(" + texNum(by) + ") + (" + texNum(az) + ")(" + texNum(bz) + ") \\\\ &= " + sgn(ans) + "\\end{aligned}$$";
    return {
      variantKey: "a" + ax + "_" + ay + "_" + az + "_b" + bx + "_" + by + "_" + bz,
      question: "A = " + v(ax, ay, az) + " and B = " + v(bx, by, bz) + ". What is A·B?",
      options: [
        { label: sgn(ans), num: ans, correct: true },
        { label: sgn(ax * bx + ay * by - az * bz), num: ax * bx + ay * by - az * bz },   // z sign slip
        { label: sgn(ax * bx - ay * by + az * bz), num: ax * bx - ay * by + az * bz },   // y sign slip
        { label: sgn(-ax * bx + ay * by + az * bz), num: -ax * bx + ay * by + az * bz }  // x sign slip
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-052
  // i-component of the cross product: ay*bz - az*by.
  var G052 = buildGenerator({
    baseId: "math-052", subtopic: "Cross product", difficulty: "hard",
    tiTip: "Yes — vector menu: cross product, then read the i component.",
    estimatedTimeSeconds: 180,
    explanation: "The i component is the determinant of the y and z entries: a_y b_z − a_z b_y. The opposite sign is the B × A value.",
    videoUrl: null, videoTitle: null
  }, function () {
    var ax = ri(-5, 5), ay = ri(-5, 5), az = ri(-5, 5), bx = ri(-5, 5), by = ri(-5, 5), bz = ri(-5, 5);
    if (ay === 0) ay = -1; if (bz === 0) bz = -1;
    var i = ay * bz - az * by, j = az * bx - ax * bz, k = ax * by - ay * bx;
    var v = function (x, y, z) {
      var s = x + "i ";
      s += (y < 0 ? "− " + (-y) : "+ " + y) + "j ";
      s += (z < 0 ? "− " + (-z) : "+ " + z) + "k";
      return s;
    };
    var solution =
      "Refer to Cross product (determinant form) in the Mathematics section of the FE Reference Handbook (v10.6), printed page 61 (PDF page 67).\n\n" +
      "$$\\begin{aligned}(A\\times B)_x &= a_yb_z - a_zb_y \\\\ &= (" + texNum(ay) + ")(" + texNum(bz) + ") - (" + texNum(az) + ")(" + texNum(by) + ") \\\\ &= " + sgn(i) + "\\end{aligned}$$";
    return {
      variantKey: "a" + ax + "_" + ay + "_" + az + "_b" + bx + "_" + by + "_" + bz,
      question: "A = " + v(ax, ay, az) + " and B = " + v(bx, by, bz) + ". What is the i-component of A × B?",
      options: [
        { label: sgn(i), num: i, correct: true },
        { label: sgn(-i), num: -i },               // B x A instead
        { label: sgn(j), num: j },                 // j component
        { label: sgn(k), num: k }                  // k component
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-053
  // Perpendicular 2D vectors: solve a1*b1 + a2*k = 0 for k.
  var G053 = buildGenerator({
    baseId: "math-053", subtopic: "Perpendicular vectors", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "Setting the dot product to zero gives k. Sign or ratio slips give the distractor values.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a1 = ri(1, 6), a2 = ri(1, 6), b1 = ri(1, 6);
    var k = -(a1 * b1) / a2;
    var k2 = (a2 * b1) / a1;   // ratio slip
    var solution =
      "Refer to Dot product (A·B = 0 for perpendicular vectors) in the Mathematics section of the FE Reference Handbook (v10.6), printed page 61 (PDF page 67).\n\n" +
      "Perpendicular vectors have zero dot product: \\(" + a1 + "(" + b1 + ") + " + a2 + "k = 0\\), so \\(k = " + fmt(k) + "\\).";
    return {
      variantKey: "a1_" + a1 + "_a2_" + a2 + "_b1_" + b1,
      question: "For what value of k are A = " + a1 + "i + " + a2 + "j and B = " + b1 + "i + kj perpendicular?",
      options: [
        { label: sgn(k), num: k, correct: true },
        { label: sgn(-k), num: -k },               // sign slip
        { label: sgn(k2), num: k2 },               // ratio slip
        { label: sgn(-k2), num: -k2 }              // both slips
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-054
  // Angle between two 2D vectors via dot product.
  var G054 = buildGenerator({
    baseId: "math-054", subtopic: "Angle between vectors", difficulty: "medium",
    tiTip: "Yes — vector angle: dot product divided by both magnitudes, then cos⁻¹.",
    estimatedTimeSeconds: 120,
    explanation: "Divide the dot product by both magnitudes. The wrong choices are the individual angles of B and A from the x axis, and the complement.",
    videoUrl: null, videoTitle: null
  }, function () {
    var ax = ri(1, 12), ay = ri(1, 12), bx = ri(1, 12), by = ri(1, 12);
    var dot = ax * bx + ay * by;
    var mA = Math.sqrt(ax * ax + ay * ay), mB = Math.sqrt(bx * bx + by * by);
    var th = Math.acos(dot / (mA * mB)) * 180 / Math.PI;
    if (th < 3 || th > 85) { ax = 3; ay = 4; bx = 5; by = 12; dot = ax * bx + ay * by; mA = 5; mB = 13; th = Math.acos(dot / 65) * 180 / Math.PI; }
    var thA = Math.atan(ay / ax) * 180 / Math.PI;
    var thB = Math.atan(by / bx) * 180 / Math.PI;
    var f = function (v) { return v.toFixed(1) + "°"; };
    var solution =
      "Refer to Dot product (A·B = |A||B| cos θ) in the Mathematics section of the FE Reference Handbook (v10.6), printed page 61 (PDF page 67).\n\n" +
      "$$\\begin{aligned}\\cos\\theta &= \\frac{A\\cdot B}{|A||B|} \\\\ &= \\frac{" + ax + "(" + bx + ")+" + ay + "(" + by + ")}{" + fmt(mA) + "(" + fmt(mB) + ")} \\\\ &= " + (dot / (mA * mB)).toFixed(4) + "\\ \\Rightarrow\\ \\theta \\\\ &= " + f(th) + "\\end{aligned}$$";
    return {
      variantKey: "a" + ax + "_" + ay + "_b" + bx + "_" + by,
      question: "A = " + ax + "i + " + ay + "j and B = " + bx + "i + " + by + "j. What is the angle between them?",
      options: [
        { label: f(th), num: th, correct: true },
        { label: f(thA), num: thA },               // angle of A from x-axis
        { label: f(thB), num: thB },               // angle of B from x-axis
        { label: f(90 - th), num: 90 - th }        // complement
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-055
  // Newton's method one step for f(x) = x^2 - c.
  var G055 = buildGenerator({
    baseId: "math-055", subtopic: "Newton's method step", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "The correction is f divided by f′, subtracted. Adding it, using f/x or inverting the ratio gives other values.",
    videoUrl: null, videoTitle: null
  }, function () {
    var c = pick([5, 7, 10, 13, 15, 17, 19, 21, 23, 26, 29, 30, 31, 34, 37, 38]);
    var a0 = Math.round(Math.sqrt(c));
    if (a0 * a0 === c) a0 += 1;
    if (Math.random() < 0.5) a0 += 1;
    var f0 = a0 * a0 - c, fp0 = 2 * a0;
    var next = a0 - f0 / fp0;
    var t1 = a0 + f0 / fp0;          // added the correction
    var t2 = a0 - f0 / a0;           // used f/x
    var t3 = a0 - fp0 / f0;          // inverted the ratio
    var f4 = function (v) { return v.toFixed(4); };
    var solution =
      "Refer to Newton's Method for Root Extraction in the Mathematics section of the FE Reference Handbook (v10.6), printed page 62 (PDF page 68).\n\n" +
      "$$\\begin{aligned}a_{j+1} &= a_j - \\frac{f(a_j)}{f'(a_j)} \\\\ &= " + a0 + " - \\frac{" + a0 + "^2 - " + c + "}{2(" + a0 + ")} \\\\ &= " + a0 + " - \\frac{" + texNum(f0) + "}{" + fp0 + "} \\\\ &= " + f4(next) + "\\end{aligned}$$";
    return {
      variantKey: "c" + c + "_a0_" + a0,
      question: "Using Newton's method for f(x) = x² − " + c + " with initial estimate " + a0 + ", what is the next estimate?",
      options: [
        { label: f4(next), num: next, correct: true },
        { label: f4(t1), num: t1 },
        { label: f4(t2), num: t2 },
        { label: f4(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-056
  // Law of sines: b = a sin B / sin A.
  var G056 = buildGenerator({
    baseId: "math-056", subtopic: "Law of sines, unknown side", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "The sine of the angle opposite the unknown side goes in the numerator; swapping the sines gives the wrong side.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(5, 20), A = ri(25, 70), B = ri(25, 70);
    if (A + B > 150 || A === B) { A = 40; B = 65; a = 12; }
    var r = Math.PI / 180;
    var b = a * Math.sin(B * r) / Math.sin(A * r);
    var t1 = a * Math.sin(A * r) / Math.sin(B * r);   // sines swapped
    var t2 = a * Math.sin(B * r);                     // never divided
    var t3 = a * Math.sin((A + B) * r) / Math.sin(A * r); // wrong angle
    var f = function (v) { return v.toFixed(2) + " ft"; };
    var solution =
      "Refer to Law of Sines in the Mathematics section of the FE Reference Handbook (v10.6), printed page 39 (PDF page 45).\n\n" +
      "The handbook gives \\(a/\\sin A = b/\\sin B\\):\n\n" +
      "$$\\begin{aligned}b &= a\\frac{\\sin B}{\\sin A} \\\\ &= " + a + "\\frac{\\sin " + B + "^\\circ}{\\sin " + A + "^\\circ} \\\\ &= " + b.toFixed(2) + "\\ \\text{ft}\\end{aligned}$$";
    return {
      variantKey: "a" + a + "_A" + A + "_B" + B,
      question: "In a triangle, side a = " + a.toFixed(1) + " ft is opposite angle A = " + A + "°, and angle B = " + B + "°. What is the length of side b opposite angle B?",
      options: [
        { label: f(b), num: b, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-057
  // Law of cosines, unknown side: c = sqrt(a^2+b^2-2ab cos C).
  var G057 = buildGenerator({
    baseId: "math-057", subtopic: "Law of cosines, unknown side", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "The minus sign belongs with the cosine term. The Pythagorean value applies only to a 90° angle.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(5, 18), b = ri(5, 18), C = ri(30, 120);
    var r = Math.PI / 180;
    var c2 = a * a + b * b - 2 * a * b * Math.cos(C * r);
    var c = Math.sqrt(c2);
    var t1 = Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(C * r));  // plus sign
    var t2 = Math.sqrt(a * a + b * b);                                // Pythagorean
    var t3 = c2;                                                      // forgot the root
    var f = function (v) { return v.toFixed(2) + " m"; };
    var solution =
      "Refer to Law of Cosines in the Mathematics section of the FE Reference Handbook (v10.6), printed page 39 (PDF page 45).\n\n" +
      "The handbook gives \\(c^2 = a^2 + b^2 - 2ab\\cos C\\):\n\n" +
      "$$\\begin{aligned}c^2 &= " + a + "^2 + " + b + "^2 \\\\ &\\quad - 2(" + a + ")(" + b + ")\\cos " + C + "^\\circ \\\\ &= " + c2.toFixed(1) + " \\\\ c &= " + c.toFixed(2) + "\\ \\text{m}\\end{aligned}$$";
    return {
      variantKey: "a" + a + "_b" + b + "_C" + C,
      question: "Two sides of a triangle are " + a.toFixed(1) + " m and " + b.toFixed(1) + " m with an included angle of " + C.toFixed(1) + "°. What is the third side?",
      options: [
        { label: f(c), num: c, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-058
  // Law of cosines, unknown angle A opposite side a.
  var G058 = buildGenerator({
    baseId: "math-058", subtopic: "Law of cosines, unknown angle", difficulty: "hard",
    tiTip: null, estimatedTimeSeconds: 180,
    explanation: "The angle belongs to the side that appears alone on the left of the law of cosines. Using the other sides' form gives a different angle.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(5, 15), b = ri(5, 15), c = ri(5, 15);
    if (a + b <= c || a + c <= b || b + c <= a || Math.abs(b - c) >= a) { a = 8; b = 10; c = 13; }
    var r = 180 / Math.PI;
    var A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * r;
    var B = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * r;
    var C = Math.acos((a * a + b * b - c * c) / (2 * a * b)) * r;
    var f = function (v) { return v.toFixed(1) + "°"; };
    var solution =
      "Refer to Law of Cosines in the Mathematics section of the FE Reference Handbook (v10.6), printed page 39 (PDF page 45).\n\n" +
      "Solve \\(a^2 = b^2 + c^2 - 2bc\\cos A\\) for the angle:\n\n" +
      "$$\\begin{aligned}\\cos A &= \\frac{" + b + "^2 + " + c + "^2 - " + a + "^2}{2(" + b + ")(" + c + ")} \\\\ &= " + ((b * b + c * c - a * a) / (2 * b * c)).toFixed(4) + "\\ \\Rightarrow\\ A \\\\ &= " + f(A) + "\\end{aligned}$$";
    return {
      variantKey: "a" + a + "_b" + b + "_c" + c,
      question: "A triangle has sides a = " + a.toFixed(1) + ", b = " + b.toFixed(1) + " and c = " + c.toFixed(1) + " (same units). What is angle A opposite side a?",
      options: [
        { label: f(A), num: A, correct: true },
        { label: f(B), num: B },                   // angle B instead
        { label: f(C), num: C },                   // angle C instead
        { label: f(180 - A), num: 180 - A }        // supplement
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-059
  // Euler's identity at special angles (discrete variant set).
  var G059 = buildGenerator({
    baseId: "math-059", subtopic: "Euler's identity", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "e^{jπ/2} would be j; e^{jπ} lies on the negative real axis.",
    videoUrl: null, videoTitle: null
  }, function () {
    var variants = [
      { tex: "\\pi", val: "-1" },
      { tex: "\\pi/2", val: "j" },
      { tex: "3\\pi/2", val: "-j" },
      { tex: "2\\pi", val: "1" }
    ];
    var vi = ri(0, 3);
    var chosen = variants[vi];
    var traps = variants.filter(function (x, i) { return i !== vi; }).map(function (x) { return x.val; });
    var cosv = { "0": "0", "1": "0", "2": "0", "3": "1" };
    var sinv = { "0": "0", "1": "1", "2": "-1", "3": "0" };
    var solution =
      "Refer to Euler's Identity in the Mathematics section of the FE Reference Handbook (v10.6), printed page 39 (PDF page 45).\n\n" +
      "With \\(\\theta = " + chosen.tex + "\\): \\(\\cos(" + chosen.tex + ") + j\\sin(" + chosen.tex + ") = " + cosv[String(vi)] + " + j(" + sinv[String(vi)] + ") = " + chosen.val + "\\).";
    return {
      variantKey: "theta" + vi,
      question: "Using Euler's identity \\(e^{j\\theta} = \\cos\\theta + j\\sin\\theta\\), what is \\(e^{j" + chosen.tex + "}\\)?",
      options: [
        { label: chosen.val, correct: true },
        { label: traps[0] },
        { label: traps[1] },
        { label: traps[2] }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-060
  // Roots of a complex number: angle = theta/k + n*360/k.
  var G060 = buildGenerator({
    baseId: "math-060", subtopic: "Roots of a complex number", difficulty: "hard",
    tiTip: null, estimatedTimeSeconds: 180,
    explanation: "Each successive root adds 360°/k to the angle; n = 0 is the principal root.",
    videoUrl: null, videoTitle: null
  }, function () {
    var k = pick([2, 3, 4, 5, 6]);
    var base = ri(2, 5);
    var r = Math.round(Math.pow(base, k));
    var n = ri(0, k - 1);
    var ang = n * 360 / k;
    var others = [];
    for (var i = 0; i < k && others.length < 3; i++) {
      if (i !== n) others.push(i * 360 / k);
    }
    // Small k leaves fewer than 3 wrong-n angles; pad with plausible slips
    // (halved step, doubled step, 180) that differ from the correct angle.
    var pads = [ang + 360 / (2 * k), ang + 360 / k, 180, ang + 360 / (3 * k)];
    for (var pi = 0; pi < pads.length && others.length < 3; pi++) {
      var pv = pads[pi];
      if (Math.abs(pv - ang) > 1e-9 && others.every(function (o) { return Math.abs(o - pv) > 1e-9; })) others.push(pv);
    }
    var f = function (v) { return fmt(v) + "°"; };
    var ord = { 2: "square", 3: "cube", 4: "fourth", 5: "fifth", 6: "sixth" };
    var solution =
      "Refer to Roots in the Mathematics section of the FE Reference Handbook (v10.6), printed page 39 (PDF page 45).\n\n" +
      "Here k = " + k + ", so the angle is \\(0/" + k + " + n(360°/" + k + ") = " + fmt(360 / k) + "°\\, n\\). For n = " + n + " the angle is " + f(ang) + " (and \\(\\sqrt[" + k + "]{" + r + "} = " + base + "\\) is the magnitude).";
    return {
      variantKey: "k" + k + "_n" + n + "_base" + base,
      question: "The handbook gives the k roots of \\(r(\\cos\\theta + j\\sin\\theta)\\) as \\(w = \\sqrt[k]{r}\\,[\\cos(\\theta/k + n\\,360°/k) + j\\sin(\\theta/k + n\\,360°/k)]\\). For the " + ord[k] + " roots of " + r + " (r = " + r + ", \\(\\theta\\) = 0°), what is the angle of the root for n = " + n + "?",
      options: [
        { label: f(ang), num: ang, correct: true },
        { label: f(others[0]), num: others[0] },
        { label: f(others[1]), num: others[1] },
        { label: f(others[2]), num: others[2] }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-061
  // sin theta for a point (Pythagorean triples keep r clean).
  var G061 = buildGenerator({
    baseId: "math-061", subtopic: "Trigonometric functions of a right triangle", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "tan θ is y/x; cos θ is x/r.",
    videoUrl: null, videoTitle: null
  }, function () {
    var trips = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [20, 21, 29]];
    var t = pick(trips);
    var swap = Math.random() < 0.5;
    var x = swap ? t[1] : t[0], y = swap ? t[0] : t[1], r = t[2];
    var solution =
      "Refer to Trigonometry in the Mathematics section of the FE Reference Handbook (v10.6), printed page 39 (PDF page 45).\n\n" +
      "The handbook gives \\(\\sin\\theta = y/r\\) with \\(r = \\sqrt{x^2+y^2} = \\sqrt{" + x + "^2+" + y + "^2} = " + r + "\\), so \\(\\sin\\theta = " + y + "/" + r + "\\).";
    return {
      variantKey: "x" + x + "_y" + y,
      question: "A point is at x = " + x + " and y = " + y + ". What is sin θ for the angle θ from the x-axis to the line to the point?",
      options: [
        { label: fracStr(y, r), correct: true },
        { label: fracStr(y, x) },                  // tan theta
        { label: fracStr(x, r) },                  // cos theta
        { label: fracStr(x, y) }                   // cot theta
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-062
  // sin 2a = 2 sin a cos a with clean sin/cos pairs.
  var G062 = buildGenerator({
    baseId: "math-062", subtopic: "Double-angle identity", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "cos 2α is the other double-angle value, and dropping the factor of 2 halves the result.",
    videoUrl: null, videoTitle: null
  }, function () {
    var pairs = [[3, 5], [4, 5], [5, 13], [12, 13], [8, 17], [15, 17], [7, 25], [24, 25]];
    var pr = pick(pairs);   // [sin numerator, common denominator] from Pythagorean triples
    var triples = { "3/5": [3, 4, 5], "4/5": [4, 3, 5], "5/13": [5, 12, 13], "12/13": [12, 5, 13], "8/17": [8, 15, 17], "15/17": [15, 8, 17], "7/25": [7, 24, 25], "24/25": [24, 7, 25] };
    var tr = triples[pr[0] + "/" + pr[1]];
    var sinv = tr[0] / tr[2], cosv = tr[1] / tr[2];
    var ans = 2 * sinv * cosv;
    var cos2 = cosv * cosv - sinv * sinv;
    var f2 = function (v) { return v.toFixed(2); };
    var solution =
      "Refer to Identities in the Mathematics section of the FE Reference Handbook (v10.6), printed page 40 (PDF page 46).\n\n" +
      "The handbook gives \\(\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha = 2(" + fmt(sinv) + ")(" + fmt(cosv) + ") = " + f2(ans) + "\\).";
    return {
      variantKey: "s" + tr[0] + "_c" + tr[1] + "_r" + tr[2],
      question: "If sin α = " + fmt(sinv) + " and cos α = " + fmt(cosv) + ", what is sin 2α?",
      options: [
        { label: f2(ans), num: ans, correct: true },
        { label: f2(sinv * cosv), num: sinv * cosv },   // dropped the 2
        { label: f2(Math.abs(cos2)), num: Math.abs(cos2) }, // cos 2a instead
        { label: f2(2 * sinv), num: 2 * sinv }            // multiplied by 2 only
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-063
  // cos 2a = 1 - 2 sin^2 a.
  var G063 = buildGenerator({
    baseId: "math-063", subtopic: "Cosine double-angle in sine form", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "1 − sin²α forgets the factor of 2, and 2 sin²α is the subtracted term itself.",
    videoUrl: null, videoTitle: null
  }, function () {
    var s = ri(2, 8) / 10;
    var ans = 1 - 2 * s * s;
    var f2 = function (v) { return (v < 0 ? MINUS : "") + Math.abs(v).toFixed(2); };
    var solution =
      "Refer to Identities in the Mathematics section of the FE Reference Handbook (v10.6), printed page 40 (PDF page 46).\n\n" +
      "The handbook gives \\(\\cos 2\\alpha = 1 - 2\\sin^2\\alpha = 1 - 2(" + s.toFixed(2) + ") = " + f2(ans) + "\\).";
    return {
      variantKey: "s" + s.toFixed(1),
      question: "If sin α = " + s.toFixed(1) + ", what is cos 2α?",
      options: [
        { label: f2(ans), num: ans, correct: true },
        { label: f2(1 - s * s), num: 1 - s * s },   // forgot the 2
        { label: f2(2 * s * s), num: 2 * s * s },   // subtracted term alone
        { label: f2(s * s), num: s * s }            // sin^2 alone
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-064
  // tan(a+b) = (t1+t2)/(1-t1*t2).
  var G064 = buildGenerator({
    baseId: "math-064", subtopic: "Tangent of a sum", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "The denominator carries the product term, with a minus sign for a sum.",
    videoUrl: null, videoTitle: null
  }, function () {
    var vals = [0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.25, 1.5];
    var t1 = pick(vals), t2 = pick(vals);
    if (t1 * t2 >= 0.9) t2 = 0.25;
    var ans = (t1 + t2) / (1 - t1 * t2);
    var f3 = function (v) { return v.toFixed(3); };
    var solution =
      "Refer to Identities in the Mathematics section of the FE Reference Handbook (v10.6), printed page 40 (PDF page 46).\n\n" +
      "The handbook gives \\(\\tan(\\alpha+\\beta) = (\\tan\\alpha+\\tan\\beta)/(1-\\tan\\alpha\\tan\\beta)\\):\n\n" +
      "$$\\frac{" + fmt(t1) + "+" + fmt(t2) + "}{1-(" + fmt(t1) + ")(" + fmt(t2) + ")} = " + f3(ans) + "$$";
    return {
      variantKey: "t1_" + t1 + "_t2_" + t2,
      question: "If tan α = " + fmt(t1) + " and tan β = " + fmt(t2) + ", what is tan(α + β)?",
      options: [
        { label: f3(ans), num: ans, correct: true },
        { label: f3((t1 + t2) / (1 + t1 * t2)), num: (t1 + t2) / (1 + t1 * t2) },   // plus in denominator
        { label: f3(t1 + t2), num: t1 + t2 },                                       // no denominator
        { label: f3(t1 * t2), num: t1 * t2 }                                        // multiplied instead
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-065
  // Half-angle: sin(a/2) = sqrt((1-cos a)/2), first quadrant.
  var G065 = buildGenerator({
    baseId: "math-065", subtopic: "Half-angle identity", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "cos(α/2) uses the plus sign under the root, and dropping the 1/2 inside the root overstates the result.",
    videoUrl: null, videoTitle: null
  }, function () {
    var c = pick([0.25, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9]);
    var ans = Math.sqrt((1 - c) / 2);
    var t1 = Math.sqrt((1 + c) / 2);   // cos(a/2)
    var t2 = Math.sqrt(1 - c);         // dropped the /2
    var t3 = (1 - c) / 2;              // radicand alone
    var f2 = function (v) { return v.toFixed(2); };
    var solution =
      "Refer to Identities in the Mathematics section of the FE Reference Handbook (v10.6), printed page 40 (PDF page 46).\n\n" +
      "The handbook gives \\(\\sin(\\alpha/2) = \\pm\\sqrt{(1-\\cos\\alpha)/2} = \\sqrt{(1-" + fmt(c) + ")/2} = \\sqrt{" + ((1 - c) / 2).toFixed(3) + "} = " + f2(ans) + "\\) (positive in the first quadrant).";
    return {
      variantKey: "c" + c,
      question: "If cos α = " + fmt(c) + " and α is in the first quadrant, what is sin(α/2)?",
      options: [
        { label: f2(ans), num: ans, correct: true },
        { label: f2(t1), num: t1 },
        { label: f2(t2), num: t2 },
        { label: f2(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-066
  // Pythagorean identities (discrete variant set: sec^2 or csc^2).
  var G066 = buildGenerator({
    baseId: "math-066", subtopic: "Pythagorean identity for tangent", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "cot²θ + 1 equals csc²θ, not sec²θ; tan²θ + 1 equals sec²θ.",
    videoUrl: null, videoTitle: null
  }, function () {
    var askSec = Math.random() < 0.5;
    var target = askSec ? "sec² θ" : "csc² θ";
    var correct = askSec ? "tan² θ + 1" : "cot² θ + 1";
    var other = askSec ? "cot² θ + 1" : "tan² θ + 1";
    var traps = [other, "sin² θ + 1", "1 − " + (askSec ? "tan² θ" : "cot² θ")];
    var solution =
      "Refer to Identities in the Mathematics section of the FE Reference Handbook (v10.6), printed page 40 (PDF page 46).\n\n" +
      "The handbook lists \\(" + (askSec ? "\\tan^2\\theta + 1 = \\sec^2\\theta" : "\\cot^2\\theta + 1 = \\csc^2\\theta") + "\\). The companion identity is for " + (askSec ? "csc" : "sec") + ".";
    return {
      variantKey: askSec ? "sec" : "csc",
      question: "Which expression equals " + target + " according to the handbook's identities?",
      options: [
        { label: correct, correct: true },
        { label: traps[0] },
        { label: traps[1] },
        { label: traps[2] }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-067
  // Product-to-sum: sin a cos b = (1/2)[sin(a+b) + sin(a-b)].
  var G067 = buildGenerator({
    baseId: "math-067", subtopic: "Product-to-sum identity", difficulty: "hard",
    tiTip: null, estimatedTimeSeconds: 180,
    explanation: "The sum form uses a plus sign between the two sines for sin α cos β.",
    videoUrl: null, videoTitle: null
  }, function () {
    var pairs = [[75, 15], [45, 15], [75, 45], [105, 15], [105, 45], [60, 15], [75, 30], [105, 75]];
    var pr = pick(pairs);
    var A = pr[0], B = pr[1];
    var r = Math.PI / 180;
    var ans = Math.sin(A * r) * Math.cos(B * r);
    var t1 = Math.cos(A * r) * Math.sin(B * r);   // minus-sign form (cos a sin b)
    var t2 = Math.sin((A + B) * r);               // sin(A+B) alone
    var t3 = Math.sin((A - B) * r);               // sin(A-B) alone
    var f3 = function (v) { return v.toFixed(3); };
    var solution =
      "Refer to Identities in the Mathematics section of the FE Reference Handbook (v10.6), printed page 40 (PDF page 46).\n\n" +
      "$$\\begin{aligned}\\sin " + A + "^\\circ\\cos " + B + "^\\circ &= \\tfrac{1}{2}[\\sin " + (A + B) + "^\\circ + \\sin " + (A - B) + "^\\circ] \\\\ &= \\tfrac{1}{2}(" + Math.sin((A + B) * r).toFixed(3) + " + " + Math.sin((A - B) * r).toFixed(3) + ") \\\\ &= " + f3(ans) + "\\end{aligned}$$";
    return {
      variantKey: "A" + A + "_B" + B,
      question: "Using sin α cos β = (1/2)[sin(α + β) + sin(α − β)], what is sin " + A + "° cos " + B + "°?",
      options: [
        { label: f3(ans), num: ans, correct: true },
        { label: f3(t1), num: t1 },
        { label: f3(t2), num: t2 },
        { label: f3(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-068
  // Parabolic region area A = 2bh/3.
  var G068 = buildGenerator({
    baseId: "math-068", subtopic: "Area of a parabolic region (2bh/3)", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "bh/3 is the area of the other parabola figure, where the curve is tangent along an edge and the region is thinner.",
    videoUrl: null, videoTitle: null
  }, function () {
    var b = ri(3, 12), h = ri(3, 12);
    var u = pick(["ft", "m"]);
    var ans = 2 * b * h / 3;
    var f = function (v) { return v.toFixed(1) + " " + u + "²"; };
    var solution =
      "Refer to Parabola in the Mathematics section of the FE Reference Handbook (v10.6), printed page 41 (PDF page 47).\n\n" +
      "The handbook gives \\(A = 2bh/3 = 2(" + b + ")(" + h + ")/3 = " + ans.toFixed(1) + "\\ \\text{" + u + "}^2\\).";
    return {
      variantKey: "b" + b + "_h" + h + "_" + u,
      question: "The handbook's first parabola figure (A = 2bh/3) has b = " + b + " " + u + " and h = " + h + " " + u + ". What is its area?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(b * h / 3), num: b * h / 3 },     // second figure's formula
        { label: f(b * h / 2), num: b * h / 2 },     // triangle
        { label: f(b * h), num: b * h }              // full rectangle
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-069
  // Parabolic spandrel area A = bh/3.
  var G069 = buildGenerator({
    baseId: "math-069", subtopic: "Area of a parabolic spandrel (bh/3)", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "2bh/3 belongs to the first figure.",
    videoUrl: null, videoTitle: null
  }, function () {
    var b = ri(3, 12), h = ri(3, 12);
    var u = pick(["ft", "m"]);
    var ans = b * h / 3;
    var f = function (v) { return v.toFixed(1) + " " + u + "²"; };
    var solution =
      "Refer to Parabola in the Mathematics section of the FE Reference Handbook (v10.6), printed page 41 (PDF page 47).\n\n" +
      "The handbook gives \\(A = bh/3 = (" + b + ")(" + h + ")/3 = " + ans.toFixed(1) + "\\ \\text{" + u + "}^2\\).";
    return {
      variantKey: "b" + b + "_h" + h + "_" + u,
      question: "The handbook's second parabola figure (A = bh/3) has b = " + b + " " + u + " and h = " + h + " " + u + ". What is its area?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(2 * b * h / 3), num: 2 * b * h / 3 },   // first figure's formula
        { label: f(b * h / 2), num: b * h / 2 },           // triangle
        { label: f(b * h), num: b * h }                    // full rectangle
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-070
  // Ellipse area A = pi*a*b.
  var G070 = buildGenerator({
    baseId: "math-070", subtopic: "Area of an ellipse", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "The area uses the product of the semi-axes.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(2, 9), b = ri(2, 9);
    if (a === b) b = a - 1 > 1 ? a - 1 : a + 1;
    var u = pick(["in", "ft", "m"]);
    var ans = Math.PI * a * b;
    var f = function (v) { return v.toFixed(1) + " " + u + "²"; };
    var solution =
      "Refer to Ellipse in the Mathematics section of the FE Reference Handbook (v10.6), printed page 41 (PDF page 47).\n\n" +
      "The handbook gives \\(A = \\pi ab = \\pi(" + a + ")(" + b + ") = " + ans.toFixed(1) + "\\ \\text{" + u + "}^2\\).";
    return {
      variantKey: "a" + a + "_b" + b + "_" + u,
      question: "An ellipse has semi-axes a = " + a + " " + u + " and b = " + b + " " + u + ". What is its area?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(Math.PI * a * a), num: Math.PI * a * a },         // circle on a
        { label: f(Math.PI * (a + b)), num: Math.PI * (a + b) },     // sum instead of product
        { label: f(2 * Math.PI * a * b), num: 2 * Math.PI * a * b }  // doubled
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-071
  // Approximate ellipse perimeter P = 2 pi sqrt((a^2+b^2)/2).
  var G071 = buildGenerator({
    baseId: "math-071", subtopic: "Approximate perimeter of an ellipse", difficulty: "hard",
    tiTip: null, estimatedTimeSeconds: 180,
    explanation: "The root contains the mean of the squared semi-axes, not their sum.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(2, 9), b = ri(2, 9);
    if (a === b) b = a - 1 > 1 ? a - 1 : a + 1;
    var u = pick(["in", "ft", "m"]);
    var ans = 2 * Math.PI * Math.sqrt((a * a + b * b) / 2);
    var t1 = 2 * Math.PI * Math.sqrt(a * a + b * b);   // no /2
    var t2 = Math.PI * (a + b);                        // circle-style
    var t3 = 2 * Math.PI * Math.sqrt((a + b) / 2);     // mean of axes, not squares
    var f = function (v) { return v.toFixed(1) + " " + u; };
    var solution =
      "Refer to Ellipse in the Mathematics section of the FE Reference Handbook (v10.6), printed page 41 (PDF page 47).\n\n" +
      "The handbook gives \\(P_{approx} = 2\\pi\\sqrt{(a^2+b^2)/2}\\):\n\n" +
      "$$P \\approx 2\\pi\\sqrt{\\frac{" + a + "^2+" + b + "^2}{2}} = " + ans.toFixed(1) + "\\ \\text{" + u + "}$$";
    return {
      variantKey: "a" + a + "_b" + b + "_" + u,
      question: "Using the handbook's approximate ellipse perimeter, what is the perimeter of an ellipse with semi-axes a = " + a + " " + u + " and b = " + b + " " + u + "?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-072
  // Ellipse lambda = (a-b)/(a+b).
  var G072 = buildGenerator({
    baseId: "math-072", subtopic: "Ellipse eccentricity parameter lambda", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "λ is 0 for a circle and approaches 1 as the ellipse flattens.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(3, 12), b = ri(1, 11);
    if (b >= a) b = a - 1;
    var ans = (a - b) / (a + b);
    var f2 = function (v) { return v.toFixed(2); };
    var solution =
      "Refer to Ellipse in the Mathematics section of the FE Reference Handbook (v10.6), printed page 41 (PDF page 47).\n\n" +
      "$$\\begin{aligned}\\lambda &= \\frac{a-b}{a+b} \\\\ &= \\frac{" + a + "-" + b + "}{" + a + "+" + b + "} \\\\ &= " + f2(ans) + "\\end{aligned}$$";
    return {
      variantKey: "a" + a + "_b" + b,
      question: "In the handbook's series for the perimeter of an ellipse, λ = (a − b)/(a + b). What is λ for a = " + a + " and b = " + b + "?",
      options: [
        { label: f2(ans), num: ans, correct: true },
        { label: f2((a + b) / (a - b)), num: (a + b) / (a - b) },   // inverted
        { label: f2(b / a), num: b / a },                           // b/a
        { label: f2((a - b) / a), num: (a - b) / a }                // wrong denominator
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-073
  // Circular segment area A = r^2 (phi - sin phi) / 2.
  var G073 = buildGenerator({
    baseId: "math-073", subtopic: "Circular segment area", difficulty: "hard",
    tiTip: null, estimatedTimeSeconds: 180,
    explanation: "The full sector is phi r^2/2. The segment is the sector minus the triangle, so the sine term subtracts.",
    videoUrl: null, videoTitle: null
  }, function () {
    var r = ri(5, 15), phi = ri(5, 25) / 10;
    var ans = r * r * (phi - Math.sin(phi)) / 2;
    var t1 = phi * r * r / 2;                 // full sector
    var t2 = r * r * (phi - Math.sin(phi));   // forgot /2
    var t3 = r * r * Math.sin(phi) / 2;       // triangle only
    var f = function (v) { return v.toFixed(2) + " ft²"; };
    var solution =
      "Refer to Circular Segment in the Mathematics section of the FE Reference Handbook (v10.6), printed page 42 (PDF page 48).\n\n" +
      "The handbook gives \\(A = [r^2(\\phi - \\sin\\phi)]/2\\) with \\(\\phi\\) in radians:\n\n" +
      "$$\\begin{aligned}A &= \\frac{" + r + "^2(" + phi.toFixed(1) + " - \\sin " + phi.toFixed(1) + ")}{2} \\\\ &= \\frac{" + (r * r) + "(" + phi.toFixed(1) + "-" + Math.sin(phi).toFixed(4) + ")}{2} \\\\ &= " + ans.toFixed(2) + "\\ \\text{ft}^2\\end{aligned}$$";
    return {
      variantKey: "r" + r + "_phi" + phi.toFixed(1),
      question: "A circular segment of a circle with radius " + r + " ft subtends a central angle of " + phi.toFixed(1) + " rad. What is the area of the segment (between the chord and the arc)?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-074
  // Central angle from segment depth: phi = 2 acos((r-d)/r).
  var G074 = buildGenerator({
    baseId: "math-074", subtopic: "Central angle from chord depth", difficulty: "hard",
    tiTip: null, estimatedTimeSeconds: 180,
    explanation: "The factor of 2 doubles the half-angle. Using arcsin instead of arccos gives the angle from the chord side.",
    videoUrl: null, videoTitle: null
  }, function () {
    var r = ri(6, 15), d = ri(1, 5);
    if (d >= r / 2) d = 2;
    var ans = 2 * Math.acos((r - d) / r);
    var t1 = Math.acos((r - d) / r);          // half-angle only
    var t2 = 2 * Math.asin((r - d) / r);      // arcsin instead
    var t3 = d / r;                           // shallow ratio
    var f = function (v) { return v.toFixed(3) + " rad"; };
    var solution =
      "Refer to Circular Segment in the Mathematics section of the FE Reference Handbook (v10.6), printed page 42 (PDF page 48).\n\n" +
      "The handbook gives \\(\\phi = 2\\arccos[(r-d)/r]\\):\n\n" +
      "$$\\begin{aligned}\\phi &= 2\\arccos\\left(\\frac{" + r + "-" + d + "}{" + r + "}\\right) \\\\ &= 2\\arccos(" + ((r - d) / r).toFixed(3) + ") \\\\ &= " + ans.toFixed(3) + "\\ \\text{rad}\\end{aligned}$$";
    return {
      variantKey: "r" + r + "_d" + d,
      question: "A circular segment in a circle of radius " + r + " m has a depth d = " + d + " m (from the chord to the arc). What is the central angle φ?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-075
  // Sector area from arc length: A = s r / 2.
  var G075 = buildGenerator({
    baseId: "math-075", subtopic: "Circular sector area from arc length", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "Both s and r appear once. A full-circle area formula does not apply to a sector.",
    videoUrl: null, videoTitle: null
  }, function () {
    var r = ri(5, 15), s = ri(5, 20);
    var ans = s * r / 2;
    var f = function (v) { return v.toFixed(1) + " ft²"; };
    var solution =
      "Refer to Circular Sector in the Mathematics section of the FE Reference Handbook (v10.6), printed page 42 (PDF page 48).\n\n" +
      "The handbook gives \\(A = sr/2\\) (equivalently \\(\\phi r^2/2\\) with \\(\\phi = s/r\\)):\n\n" +
      "$$A = \\frac{(" + s + ")(" + r + ")}{2} = " + ans.toFixed(1) + "\\ \\text{ft}^2$$";
    return {
      variantKey: "r" + r + "_s" + s,
      question: "A circular sector has radius " + r + " ft and arc length s = " + s + " ft. What is its area?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(s * r), num: s * r },           // forgot /2
        { label: f(s * s / 2), num: s * s / 2 },   // used s twice
        { label: f(r * r / 2), num: r * r / 2 }    // used r twice
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-076
  // Sector area from angle: A = phi r^2 / 2.
  var G076 = buildGenerator({
    baseId: "math-076", subtopic: "Circular sector area from angle", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "The angle must be in radians and the radius is squared. Without the 1/2 the area doubles.",
    videoUrl: null, videoTitle: null
  }, function () {
    var r = ri(4, 12), phi = ri(5, 30) / 10;
    var ans = phi * r * r / 2;
    var f = function (v) { return v.toFixed(1) + " m²"; };
    var solution =
      "Refer to Circular Sector in the Mathematics section of the FE Reference Handbook (v10.6), printed page 42 (PDF page 48).\n\n" +
      "The handbook gives \\(A = \\phi r^2/2\\):\n\n" +
      "$$A = \\frac{(" + phi.toFixed(1) + ")(" + r + ")^2}{2} = " + ans.toFixed(1) + "\\ \\text{m}^2$$";
    return {
      variantKey: "r" + r + "_phi" + phi.toFixed(1),
      question: "A circular sector has radius " + r + " m and a central angle of " + phi.toFixed(1) + " rad. What is its area?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(phi * r * r), num: phi * r * r },     // no 1/2
        { label: f(phi * r), num: phi * r },             // r not squared
        { label: f(r * r / 2), num: r * r / 2 }          // dropped phi
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-077
  // Sphere volume from diameter: V = pi d^3 / 6.
  var G077 = buildGenerator({
    baseId: "math-077", subtopic: "Sphere volume from diameter", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "The diameter form has a 6 in the denominator. Using d where r belongs in 4πr³/3 overstates the volume eight times.",
    videoUrl: null, videoTitle: null
  }, function () {
    var d = ri(2, 12);
    var u = pick(["ft", "m"]);
    var ans = Math.PI * Math.pow(d, 3) / 6;
    var f = function (v) { return v.toFixed(1) + " " + u + "³"; };
    var solution =
      "Refer to Sphere in the Mathematics section of the FE Reference Handbook (v10.6), printed page 42 (PDF page 48).\n\n" +
      "The handbook gives \\(V = 4\\pi r^3/3 = \\pi d^3/6\\):\n\n" +
      "$$V = \\frac{\\pi(" + d + ")^3}{6} = " + ans.toFixed(1) + "\\ \\text{" + u + "}^3$$";
    return {
      variantKey: "d" + d + "_" + u,
      question: "What is the volume of a sphere with diameter " + d + " " + u + "?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(4 * Math.PI * Math.pow(d, 3) / 3), num: 4 * Math.PI * Math.pow(d, 3) / 3 },  // d used as r
        { label: f(Math.PI * Math.pow(d, 3) / 3), num: Math.PI * Math.pow(d, 3) / 3 },          // half the d-as-r error
        { label: f(Math.PI * d * d), num: Math.PI * d * d }                                     // area-scale error
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-078
  // Sphere surface area A = 4 pi r^2.
  var G078 = buildGenerator({
    baseId: "math-078", subtopic: "Sphere surface area", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "4πr³/3 is the volume, and πr² is a great-circle area.",
    videoUrl: null, videoTitle: null
  }, function () {
    var rr = ri(2, 12) / 2;   // 1.0 to 6.0 in 0.5 steps
    if (rr < 1.5) rr = 2.5;
    var u = pick(["m", "ft"]);
    var ans = 4 * Math.PI * rr * rr;
    var f = function (v) { return v.toFixed(1) + " " + u + "²"; };
    var solution =
      "Refer to Sphere in the Mathematics section of the FE Reference Handbook (v10.6), printed page 42 (PDF page 48).\n\n" +
      "The handbook gives \\(A = 4\\pi r^2 = 4\\pi(" + fmt(rr) + ")^2 = " + ans.toFixed(1) + "\\ \\text{" + u + "}^2\\).";
    return {
      variantKey: "r" + rr + "_" + u,
      question: "A spherical tank has a radius of " + fmt(rr) + " " + u + ". What is its surface area?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(4 * Math.PI * Math.pow(rr, 3) / 3), num: 4 * Math.PI * Math.pow(rr, 3) / 3 },  // volume
        { label: f(Math.PI * rr * rr), num: Math.PI * rr * rr },                                  // great circle
        { label: f(2 * Math.PI * rr * rr), num: 2 * Math.PI * rr * rr }                           // hemisphere
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-079
  // Parallelogram short diagonal d1 = sqrt(a^2+b^2-2ab cos phi).
  var G079 = buildGenerator({
    baseId: "math-079", subtopic: "Parallelogram, short diagonal", difficulty: "hard",
    tiTip: null, estimatedTimeSeconds: 180,
    explanation: "d_2 carries the plus sign and gives the longer diagonal.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(4, 12), b = ri(3, 10);
    var phiDeg = pick([30, 45, 60, 120, 135, 150]);
    var r = Math.PI / 180;
    var rad1 = a * a + b * b - 2 * a * b * Math.cos(phiDeg * r);
    var rad2 = a * a + b * b + 2 * a * b * Math.cos(phiDeg * r);
    var d1 = Math.sqrt(rad1), d2 = Math.sqrt(rad2);
    var f = function (v) { return v.toFixed(2) + " ft"; };
    var solution =
      "Refer to Parallelogram in the Mathematics section of the FE Reference Handbook (v10.6), printed page 43 (PDF page 49).\n\n" +
      "$$\\begin{aligned}d_1 &= \\sqrt{" + a + "^2 + " + b + "^2 - 2(" + a + ")(" + b + ")\\cos " + phiDeg + "^\\circ} \\\\ &= \\sqrt{" + rad1.toFixed(1) + "} \\\\ &= " + d1.toFixed(2) + "\\ \\text{ft}\\end{aligned}$$";
    return {
      variantKey: "a" + a + "_b" + b + "_phi" + phiDeg,
      question: "A parallelogram has sides a = " + a + " ft and b = " + b + " ft with an interior angle φ = " + phiDeg + "° between them. What is the length of the diagonal d_1 given by the handbook's formula \\(d_1 = \\sqrt{a^2+b^2-2ab\\cos\\phi}\\)?",
      options: [
        { label: f(d1), num: d1, correct: true },
        { label: f(d2), num: d2 },                 // plus-sign diagonal
        { label: f(rad1), num: rad1 },             // radicand, no root
        { label: f(a + b), num: a + b }            // just added sides
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-080
  // Parallelogram diagonal relation d1^2 + d2^2 = 2(a^2+b^2).
  var G080 = buildGenerator({
    baseId: "math-080", subtopic: "Parallelogram, diagonal relation", difficulty: "hard",
    tiTip: null, estimatedTimeSeconds: 180,
    explanation: "The relation does not depend on the interior angle.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(3, 12), b = ri(3, 12);
    if (a === b) b = a - 1;
    var ans = 2 * (a * a + b * b);
    var solution =
      "Refer to Parallelogram in the Mathematics section of the FE Reference Handbook (v10.6), printed page 43 (PDF page 49).\n\n" +
      "$$d_1^2+d_2^2 = 2(" + a + "^2+" + b + "^2) = " + ans + "$$";
    return {
      variantKey: "a" + a + "_b" + b,
      question: "The sides of a parallelogram are " + a + " and " + b + ". The handbook states d_1² + d_2² = 2(a² + b²). What is d_1² + d_2²?",
      options: [
        { label: String(ans), num: ans, correct: true },
        { label: String(a * a + b * b), num: a * a + b * b },       // no factor 2
        { label: String(4 * (a * a + b * b)), num: 4 * (a * a + b * b) }, // doubled
        { label: String((a + b) * (a + b)), num: (a + b) * (a + b) }      // (a+b)^2
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-081
  // Parallelogram area A = a b sin phi.
  var G081 = buildGenerator({
    baseId: "math-081", subtopic: "Parallelogram area from sides and angle", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "The height is b sin φ, so the sine, not the cosine, applies.",
    videoUrl: null, videoTitle: null
  }, function () {
    var a = ri(4, 12), b = ri(3, 10);
    var phiDeg = pick([30, 45, 60, 90, 120, 135, 150]);
    var r = Math.PI / 180;
    var ans = a * b * Math.sin(phiDeg * r);
    var t1 = a * b * Math.cos(phiDeg * r);
    var t2 = a * b;
    var t3 = a * b * Math.sin(phiDeg * r) / 2;
    var f = function (v) { return v.toFixed(2) + " m²"; };
    var solution =
      "Refer to Parallelogram in the Mathematics section of the FE Reference Handbook (v10.6), printed page 43 (PDF page 49).\n\n" +
      "The handbook gives \\(A = ab\\sin\\phi\\):\n\n" +
      "$$A = (" + a + ")(" + b + ")\\sin " + phiDeg + "^\\circ = " + ans.toFixed(2) + "\\ \\text{m}^2$$";
    return {
      variantKey: "a" + a + "_b" + b + "_phi" + phiDeg,
      question: "A parallelogram has sides " + a + " m and " + b + " m with an interior angle of " + phiDeg + "° between them. What is its area?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(Math.abs(t1)), num: Math.abs(t1) },  // cosine
        { label: f(t2), num: t2 },                      // rectangle
        { label: f(t3), num: t3 }                       // triangle
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-083
  // Regular polygon interior angle theta = pi (1 - 2/n) -> 180(1-2/n) deg.
  var G083 = buildGenerator({
    baseId: "math-083", subtopic: "Regular polygon interior angle", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "360°/n is the central angle φ = 2π/n, not the interior angle.",
    videoUrl: null, videoTitle: null
  }, function () {
    var names = { 5: "pentagon", 6: "hexagon", 8: "octagon", 9: "nonagon", 10: "decagon", 12: "dodecagon", 15: "15-gon", 18: "18-gon", 20: "20-gon" };
    var n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20]);
    var ans = 180 * (1 - 2 / n);
    var t1 = 360 / n;                    // central angle
    var t2 = 180 * (1 - 1 / n);          // wrong numerator
    var t3 = 180 / n;
    var f = function (v) { return fmt(v) + "°"; };
    var solution =
      "Refer to Regular Polygon in the Mathematics section of the FE Reference Handbook (v10.6), printed page 43 (PDF page 49).\n\n" +
      "The handbook gives \\(\\theta = \\pi(1 - 2/n)\\):\n\n" +
      "$$\\begin{aligned}\\theta &= \\pi\\left(1-\\frac{2}{" + n + "}\\right) \\\\ &= " + (Math.PI * (1 - 2 / n)).toFixed(4) + "\\ \\text{rad} \\\\ &= " + fmt(ans) + "^\\circ\\end{aligned}$$";
    return {
      variantKey: "n" + n,
      question: "What is the interior angle θ of a regular polygon with " + n + " equal sides (a regular " + names[n] + ")?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-084
  // Regular polygon area from apothem: A = n r^2 tan(pi/n).
  var G084 = buildGenerator({
    baseId: "math-084", subtopic: "Regular polygon side and area", difficulty: "hard",
    tiTip: null, estimatedTimeSeconds: 180,
    explanation: "πr² is the inscribed circle, smaller than the polygon.",
    videoUrl: null, videoTitle: null
  }, function () {
    var n = pick([5, 6, 8, 9, 10, 12]);
    var rr = ri(3, 9);
    var s = 2 * rr * Math.tan(Math.PI / n);
    var ans = n * s * rr / 2;
    var t1 = Math.PI * rr * rr;        // inscribed circle
    var t2 = n * s * rr;               // forgot /2
    var t3 = n * rr * rr / 2;          // used s = r
    var f = function (v) { return v.toFixed(1) + " in²"; };
    var solution =
      "Refer to Regular Polygon in the Mathematics section of the FE Reference Handbook (v10.6), printed page 43 (PDF page 49).\n\n" +
      "$$\\begin{aligned}s &= 2(" + rr + ")\\tan(\\pi/" + n + ") \\\\ &= " + s.toFixed(3) + "\\ \\text{in},\\qquad A \\\\ &= \\frac{nsr}{2} \\\\ &= \\frac{" + n + "(" + s.toFixed(3) + ")(" + rr + ")}{2} \\\\ &= " + ans.toFixed(1) + "\\ \\text{in}^2\\end{aligned}$$";
    return {
      variantKey: "n" + n + "_r" + rr,
      question: "A regular " + n + "-sided polygon has a distance r = " + rr + " in from its center to the middle of each side. What is its area using the handbook relations φ = 2π/n, s = 2r tan(φ/2) and A = nsr/2?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-085
  // Prismoid volume V = (h/6)(A1 + A2 + 4 Am).
  var G085 = buildGenerator({
    baseId: "math-085", subtopic: "Prismoid volume", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "The average-end-area volume ignores the mid-section and its factor of 4.",
    videoUrl: null, videoTitle: null
  }, function () {
    var h = 6 * ri(1, 4);
    var A1 = ri(5, 30), A2 = ri(5, 30), Am = ri(5, 30);
    var ans = (h / 6) * (A1 + A2 + 4 * Am);
    var t1 = h * (A1 + A2) / 2;              // average end areas
    var t2 = h * (A1 + A2 + Am) / 3;         // simple average
    var t3 = (h / 6) * (A1 + A2 + Am);       // missing factor 4
    var solution =
      "Refer to Prismoid in the Mathematics section of the FE Reference Handbook (v10.6), printed page 43 (PDF page 49).\n\n" +
      "The handbook gives \\(V = (h/6)(A_1 + A_2 + 4A)\\):\n\n" +
      "$$V = \\frac{" + h + "}{6}(" + A1 + "+" + A2 + "+4(" + Am + ")) = " + fmt(ans) + "\\ \\text{ft}^3$$";
    return {
      variantKey: "h" + h + "_A1_" + A1 + "_A2_" + A2 + "_Am_" + Am,
      question: "A prismoid of height " + h + " ft has end areas " + A1 + " ft² and " + A2 + " ft² and a mid-height area of " + Am + " ft². What is its volume using the handbook formula?",
      options: [
        { label: fmt(ans) + " ft³", num: ans, correct: true },
        { label: fmt(t1) + " ft³", num: t1 },
        { label: fmt(t2) + " ft³", num: t2 },
        { label: fmt(t3) + " ft³", num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-086
  // Cone volume V = pi r^2 h / 3.
  var G086 = buildGenerator({
    baseId: "math-086", subtopic: "Right circular cone volume", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "A cone holds one third of the cylinder of the same base and height.",
    videoUrl: null, videoTitle: null
  }, function () {
    var r = ri(2, 9), h = ri(3, 12);
    var u = pick(["ft", "m"]);
    var ans = Math.PI * r * r * h / 3;
    var f = function (v) { return v.toFixed(1) + " " + u + "³"; };
    var solution =
      "Refer to Right Circular Cone in the Mathematics section of the FE Reference Handbook (v10.6), printed page 44 (PDF page 50).\n\n" +
      "The handbook gives \\(V = \\pi r^2h/3 = \\pi(" + r + ")^2(" + h + ")/3 = " + ans.toFixed(1) + "\\ \\text{" + u + "}^3\\).";
    return {
      variantKey: "r" + r + "_h" + h + "_" + u,
      question: "What is the volume of a right circular cone with base radius " + r + " " + u + " and height " + h + " " + u + "?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(Math.PI * r * r * h), num: Math.PI * r * r * h },       // cylinder
        { label: f(Math.PI * r * h * h / 3), num: Math.PI * r * h * h / 3 }, // r and h swapped roles
        { label: f(Math.PI * r * r * h / 2), num: Math.PI * r * r * h / 2 }  // half cylinder
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-087
  // Cone total surface A = pi r (r + sqrt(r^2+h^2)).
  var G087 = buildGenerator({
    baseId: "math-087", subtopic: "Right circular cone total surface area", difficulty: "hard",
    tiTip: null, estimatedTimeSeconds: 180,
    explanation: "The side area is πr times the slant height. The base adds πr².",
    videoUrl: null, videoTitle: null
  }, function () {
    var r = ri(2, 9), h = ri(3, 12);
    var u = pick(["m", "ft"]);
    var slant = Math.sqrt(r * r + h * h);
    var ans = Math.PI * r * (r + slant);
    var t1 = Math.PI * r * slant;          // side only
    var t2 = Math.PI * r * r;              // base only
    var t3 = Math.PI * r * (r + h);        // h instead of slant
    var f = function (v) { return v.toFixed(1) + " " + u + "²"; };
    var solution =
      "Refer to Right Circular Cone in the Mathematics section of the FE Reference Handbook (v10.6), printed page 44 (PDF page 50).\n\n" +
      "The handbook gives \\(A = \\pi r(r + \\sqrt{r^2+h^2})\\):\n\n" +
      "$$A = \\pi(" + r + ")(" + r + "+\\sqrt{" + r * r + "+" + h * h + "}) = " + ans.toFixed(1) + "\\ \\text{" + u + "}^2$$";
    return {
      variantKey: "r" + r + "_h" + h + "_" + u,
      question: "What is the total surface area (side plus base) of a right circular cone with r = " + r + " " + u + " and h = " + h + " " + u + "?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-088
  // Cone cross-section ratio Ax = Ab x^2 / h^2.
  var G088 = buildGenerator({
    baseId: "math-088", subtopic: "Cone cross-section ratio", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "Areas scale with the square of the distance from the apex, not linearly.",
    videoUrl: null, videoTitle: null
  }, function () {
    var h = pick([6, 8, 9, 10, 12]);
    var x = ri(1, h - 2);
    var Ab = 6 * ri(4, 15);
    var ans = Ab * x * x / (h * h);
    var t1 = Ab * x / h;                   // linear scaling
    var t2 = Ab * h * h / (x * x);         // inverted ratio
    var t3 = Ab * (h - x) * (h - x) / (h * h); // measured from base
    var f = function (v) { return v.toFixed(1) + " ft²"; };
    var solution =
      "Refer to Right Circular Cone in the Mathematics section of the FE Reference Handbook (v10.6), printed page 44 (PDF page 50).\n\n" +
      "$$\\begin{aligned}A_x &= A_b\\frac{x^2}{h^2} \\\\ &= " + Ab + "\\frac{" + x + "^2}{" + h + "^2} \\\\ &= " + ans.toFixed(1) + "\\ \\text{ft}^2\\end{aligned}$$";
    return {
      variantKey: "h" + h + "_x" + x + "_Ab" + Ab,
      question: "For a right circular cone of height " + h + " ft with a base area of " + Ab + " ft², what is the area of a cross-section parallel to the base at a distance x = " + x + " ft from the apex? (Use A_x : A_b = x² : h².)",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-089
  // Cylinder volume from diameter V = pi d^2 h / 4.
  var G089 = buildGenerator({
    baseId: "math-089", subtopic: "Right circular cylinder volume from diameter", difficulty: "easy",
    tiTip: null, estimatedTimeSeconds: 75,
    explanation: "Using d where r belongs overstates the volume by four.",
    videoUrl: null, videoTitle: null
  }, function () {
    var d = ri(2, 10), h = ri(4, 15);
    var u = pick(["ft", "m"]);
    var ans = Math.PI * d * d * h / 4;
    var f = function (v) { return v.toFixed(1) + " " + u + "³"; };
    var solution =
      "Refer to Right Circular Cylinder in the Mathematics section of the FE Reference Handbook (v10.6), printed page 44 (PDF page 50).\n\n" +
      "The handbook gives \\(V = \\pi d^2h/4 = \\pi(" + d + ")^2(" + h + ")/4 = " + ans.toFixed(1) + "\\ \\text{" + u + "}^3\\).";
    return {
      variantKey: "d" + d + "_h" + h + "_" + u,
      question: "A cylindrical tank has a diameter of " + d + " " + u + " and a height of " + h + " " + u + ". What is its volume?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(Math.PI * d * d * h), num: Math.PI * d * d * h },       // d used as r
        { label: f(Math.PI * d * d * h / 2), num: Math.PI * d * d * h / 2 }, // doubled
        { label: f(Math.PI * d * d / 4), num: Math.PI * d * d / 4 }          // base area only
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-090
  // Closed cylinder total area A = 2 pi r (h + r).
  var G090 = buildGenerator({
    baseId: "math-090", subtopic: "Right circular cylinder total area", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "2πrh is the side only; one end adds πr².",
    videoUrl: null, videoTitle: null
  }, function () {
    var r = ri(2, 8), h = ri(4, 15);
    var u = pick(["m", "ft"]);
    var ans = 2 * Math.PI * r * (h + r);
    var t1 = 2 * Math.PI * r * h;                  // side only
    var t2 = 2 * Math.PI * r * h + Math.PI * r * r; // one end
    var t3 = Math.PI * r * (h + r);                 // half the total
    var f = function (v) { return v.toFixed(1) + " " + u + "²"; };
    var solution =
      "Refer to Right Circular Cylinder in the Mathematics section of the FE Reference Handbook (v10.6), printed page 44 (PDF page 50).\n\n" +
      "The handbook gives \\(A = 2\\pi r(h + r)\\):\n\n" +
      "$$A = 2\\pi(" + r + ")(" + h + "+" + r + ") = " + ans.toFixed(1) + "\\ \\text{" + u + "}^2$$";
    return {
      variantKey: "r" + r + "_h" + h + "_" + u,
      question: "A closed cylinder has radius " + r + " " + u + " and height " + h + " " + u + ". What is its total surface area (side plus both ends)?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(t1), num: t1 },
        { label: f(t2), num: t2 },
        { label: f(t3), num: t3 }
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-091
  // Paraboloid volume V = pi d^2 h / 8.
  var G091 = buildGenerator({
    baseId: "math-091", subtopic: "Paraboloid of revolution volume", difficulty: "medium",
    tiTip: null, estimatedTimeSeconds: 120,
    explanation: "A paraboloid holds half of the circumscribed cylinder, so the 1/4 cylinder factor becomes 1/8.",
    videoUrl: null, videoTitle: null
  }, function () {
    var d = ri(2, 10), h = ri(3, 10);
    var u = pick(["ft", "m"]);
    var ans = Math.PI * d * d * h / 8;
    var f = function (v) { return v.toFixed(1) + " " + u + "³"; };
    var solution =
      "Refer to Paraboloid of Revolution in the Mathematics section of the FE Reference Handbook (v10.6), printed page 44 (PDF page 50).\n\n" +
      "The handbook gives \\(V = \\pi d^2h/8\\):\n\n" +
      "$$V = \\frac{\\pi(" + d + ")^2(" + h + ")}{8} = " + ans.toFixed(1) + "\\ \\text{" + u + "}^3$$";
    return {
      variantKey: "d" + d + "_h" + h + "_" + u,
      question: "A parabolic bowl (paraboloid of revolution) has a top diameter of " + d + " " + u + " and a depth of " + h + " " + u + ". What is its volume?",
      options: [
        { label: f(ans), num: ans, correct: true },
        { label: f(Math.PI * d * d * h / 4), num: Math.PI * d * d * h / 4 },   // cylinder
        { label: f(Math.PI * d * d * h / 6), num: Math.PI * d * d * h / 6 },   // sphere/cone factor
        { label: f(Math.PI * d * d * h / 12), num: Math.PI * d * d * h / 12 }  // cone-of-diameter error
      ],
      solution: solution
    };
  });

  window.MATH_GENERATORS = [
    G001, G002, G003, G004, G005, G006, G007, G008, G009, G010,
    G011, G012, G013, G014, G015, G016, G017, G018, G019,
    /* math-020 skipped: purely conceptual, nothing to randomize */
    G021, G022, G023, G024, G025, G026, G027, G028, G029, G030,
    G031, G032, G033,
    G037, G038, G039, G040, G041, G042,
    // Oct 18 expansion (math-043..091; math-082 conceptual, skipped)
    G043, G044, G045, G046, G047, G048, G049, G050, G051, G052,
    G053, G054, G055, G056, G057, G058, G059, G060, G061, G062,
    G063, G064, G065, G066, G067, G068, G069, G070, G071, G072,
    G073, G074, G075, G076, G077, G078, G079, G080, G081, G083,
    G084, G085, G086, G087, G088, G089, G090, G091
  ];
})();
