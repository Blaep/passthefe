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

  // ---------------------------------------------------------------- math-001
  // Definite integral of kx from 0 to b. Answer k*b^2/2.
  var G001 = buildGenerator({
    baseId: "math-001", subtopic: "Definite integrals", difficulty: "easy",
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
    estimatedTimeSeconds: 120,
    explanation: "Always integrate upper curve minus lower curve — integrating x² − 4x and dropping the sign, or doubling the region, produces the 64/3 and 32 traps.",
    videoUrl: "https://www.youtube.com/watch?v=YfROMP7UYjg",
    videoTitle: "FE Civil Exam Mathematics: Integrals Problem 3 a,3 b &3 c (Easy, Medium & Hard)"
  }, function () {
    var k = ri(2, 5);
    var ans = k * k * k / 6;
    var k2 = k * k, k3 = k2 * k;
    var solution =
      "Refer to the Integral Calculus section in the Mathematics chapter of the FE Reference Handbook.\n\n" +
      "Ultimately, we must solve for the enclosed area \\(A\\). The curves intersect where \\(x^2 = " + k + "x\\), i.e. at \\(x = 0\\) and \\(x = " + k + "\\), and \\(" + k + "x \\geq x^2\\) between them:\n\n" +
      "$$A = \\int_{0}^{" + k + "} (" + k + "x - x^2) \\, dx = \\left[" + texFrac(k, 2) + "x^2 - \\frac{x^3}{3}\\right]_{0}^{" + k + "}$$\n\n" +
      "List the known and unknown parameters:\n\n" +
      "$$\\begin{aligned}\n\\text{lower bound} &= 0 \\\\\n\\text{upper bound} &= " + k + " \\\\\nA &= ?\n\\end{aligned}$$\n\n" +
      "$$(A) = \\left(" + texFrac(k, 2) + "(" + k + ")^2 - \\frac{(" + k + ")^3}{3}\\right) - 0 \\rightarrow (A) = " + (k2 * k / 2) + " - " + texFrac(k3, 3) + "$$\n\n" +
      "$$(A) = " + fracStr(k3, 6) + "$$";
    return {
      variantKey: "k" + k,
      question: "What is the area of the region enclosed by the curves y = x² and y = " + k + "x?",
      options: [
        { label: fracStr(k3, 6), num: ans, correct: true },
        { label: fracStr(2 * k3, 6), num: 2 * ans }, // doubled the region
        { label: fracStr(2 * k2, 1), num: 2 * k2 },  // integrated only one power
        { label: fracStr((k + 1) * (k + 1) * (k + 1), 6), num: (k + 1) * (k + 1) * (k + 1) / 6 } // upper-bound slip
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-014
  // Complex multiplication (a + b*i)(c - d*i).
  var G014 = buildGenerator({
    baseId: "math-014", subtopic: "Complex multiplication", difficulty: "medium",
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
    estimatedTimeSeconds: 150,
    explanation: "The Maclaurin series for sine alternates signs — adding the x³/6 term instead of subtracting it gives the 0.20133 trap.",
    videoUrl: "https://www.youtube.com/watch?v=cjPoEZ0I5wQ",
    videoTitle: "Taylor and Maclaurin Series - Example 1"
  }, function () {
    var kk = ri(1, 4), x = kk / 10;
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
    return {
      variantKey: "pt" + A + "_" + B,
      question: "If \\(x^2 + y^2 = " + (R * R) + "\\), what is \\(\\frac{dy}{dx}\\) at the point \\((" + A + ", " + B + ")\\)?",
      options: [
        { label: fracStr(-A, B), num: -A / B, correct: true },
        { label: fracStr(A, B), num: A / B },   // dropped the negative sign
        { label: fracStr(-B, A), num: -B / A }, // inverted the fraction
        { label: fracStr(B, A), num: B / A }    // inverted and dropped the sign
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-017
  // Gradient of f = a*x^2*y + b*x*y^2 at (x0, y0).
  var G017 = buildGenerator({
    baseId: "math-017", subtopic: "Gradient of a scalar field", difficulty: "medium",
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
    estimatedTimeSeconds: 75,
    explanation: "The u-substitution brings a 1/2 factor from du = 2dx — skipping it doubles the answer to the 2 trap.",
    videoUrl: "https://www.youtube.com/watch?v=YfROMP7UYjg",
    videoTitle: "FE Civil Exam Mathematics: Integrals Problem 3 a,3 b &3 c (Easy, Medium & Hard)"
  }, function () {
    var k = pick([2, 3, 5, 6]);
    var c = Math.round(Math.cos(k * Math.PI / 2)); // -1, 0, or 1
    var uUpper = k === 2 ? "\\pi" : (k === 6 ? "3\\pi" : k + "\\pi/2");
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
    estimatedTimeSeconds: 120,
    explanation: "Newton's method improves each guess by subtracting f/f'. Watch the sign: a negative f value moves the guess upward.",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var c = pick([3, 5, 6, 7]); // c = 4 would give f(2) = 0 and no step at all
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
    estimatedTimeSeconds: 90,
    explanation: "Integration by parts splits the integrand into u (the part that simplifies when differentiated) and dv (the part that is easy to integrate).",
    videoUrl: null,
    videoTitle: null
  }, function () {
    var b = ri(1, 3), E = Math.E;
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
    return {
      variantKey: "b" + b,
      question: "Consider the region bounded by the curve \\(y = x^2\\), the x-axis, and the vertical lines \\(x = 0\\) and \\(x = " + b + "\\). What is the x-coordinate of the centroid of this region?",
      options: [
        { label: fmt(ans), num: ans, correct: true },
        { label: fmt(b / 2), num: b / 2 },     // used the midpoint of the interval
        { label: fmt(b), num: b },             // used the right edge
        { label: fmt(3 * b / 8), num: 3 * b / 8 } // divided the moment by 2A
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-024
  // Divergence of F = (a*x^2*y, b*y*z^2, c*x*z) at (x0, y0, z0).
  var G024 = buildGenerator({
    baseId: "math-024", subtopic: "Divergence of a vector field", difficulty: "medium",
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
    return {
      variantKey: "a" + a + "_b" + b + "_C" + C,
      question: "A triangle has sides of length " + a + " and " + b + " with an included angle of " + C + "°. What is the length of the third side?",
      options: [
        { label: fmt(c), num: c, correct: true },
        { label: fmt(Math.sqrt(a * a + b * b + 2 * a * b * cosC)), num: Math.sqrt(a * a + b * b + 2 * a * b * cosC) }, // flipped the sign
        { label: fmt(Math.sqrt(a * a + b * b)), num: Math.sqrt(a * a + b * b) }, // dropped the cosine term
        { label: fmt(Math.sqrt(a * a + b * b - a * b * cosC)), num: Math.sqrt(a * a + b * b - a * b * cosC) } // dropped the factor of 2
      ],
      solution: solution
    };
  });

  // ---------------------------------------------------------------- math-031
  // Euler's forward rectangular rule, n = 4, for integral_0^b x^2 dx: 7b^3/32.
  var G031 = buildGenerator({
    baseId: "math-031", subtopic: "Numerical integration (Euler forward rectangular rule)", difficulty: "medium",
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

  window.MATH_GENERATORS = [
    G001, G002, G003, G004, G005, G006, G007, G008, G009, G010,
    G011, G012, G013, G014, G015, G016, G017, G018, G019,
    /* math-020 skipped: purely conceptual, nothing to randomize */
    G021, G022, G023, G024, G025, G026, G027, G028, G029, G030,
    G031, G032, G033
  ];
})();
