/* PassTheFE randomized practice — Geotechnical Engineering generators.
 *
 * Plain script (no modules) for the static site. Defines window.GEOTECH_GENERATORS:
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
  var GEO_ENTRIES = [];
  function reg(e) { GEO_ENTRIES.push(e); return e; }
/* ---- geotech diagram helpers (bank composition idiom: soil blocks, hatched fills, rolled labels/geometry) ---- */
function dShaft(B, D, su) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img" aria-label="Drilled shaft ' + B + ' feet in diameter and ' + D + ' feet deep in cohesive soil with undrained shear strength ' + su.toLocaleString("en-US") + ' psf below the base"><rect width="480" height="260" fill="#ffffff"/>' + AH;
  s += '<rect x="60" y="40" width="360" height="190" fill="#efe3c7" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="40" y1="40" x2="440" y2="40" stroke="#1a1a1a" stroke-width="3"/>';
  var w = 30 + B * 8;
  s += '<rect x="' + (240 - w / 2) + '" y="42" width="' + w + '" height="160" fill="#cfcfcf" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="' + (240 - w / 2 - 30) + '" y1="42" x2="' + (240 - w / 2 - 30) + '" y2="202" stroke="#1a1a1a" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="' + (240 - w / 2 - 36) + '" y="125" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="end" fill="#1a1a1a">D = ' + D + ' ft</text>';
  s += '<text x="240" y="225" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">B = ' + B + ' ft</text>';
  s += '<text x="240" y="248" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">su = ' + su.toLocaleString("en-US") + ' psf over 2B below base</text>';
  return svgURL(s + '</svg>');
}
function dProfileWT(h1, g1, h2, g2) {
  var k = Math.min(12, 180 / (h1 + h2));
  var y1 = 40 + h1 * k, y2 = y1 + h2 * k;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300" role="img" aria-label="Soil profile with ' + h1 + ' feet of moist soil above the water table and ' + h2 + ' feet of saturated soil below"><rect width="480" height="300" fill="#ffffff"/>';
  s += '<rect x="60" y="40" width="200" height="' + (h1 * k) + '" fill="#f3e9d2" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<rect x="60" y="' + y1 + '" width="200" height="' + (h2 * k) + '" fill="#d9c7a0" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="50" y1="' + y1 + '" x2="270" y2="' + y1 + '" stroke="#1d4ed8" stroke-width="2.5" stroke-dasharray="8 4"/>';
  s += '<text x="276" y="' + (y1 + 4) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1d4ed8">water table</text>';
  s += '<text x="160" y="' + (40 + h1 * k / 2) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">' + h1 + ' ft, \u03B3 = ' + g1 + ' lb/ft\u00B3</text>';
  s += '<text x="160" y="' + (y1 + h2 * k / 2) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">' + h2 + ' ft, \u03B3sat = ' + g2 + ' lb/ft\u00B3</text>';
  s += '<line x1="300" y1="40" x2="300" y2="' + y2 + '" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="310" y="' + (y2 - 6) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">\u2032 = ? at base</text>';
  return svgURL(s + '</svg>');
}
function dSurcharge(h, gsat, q) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img" aria-label="Sand layer ' + h + ' feet thick below a water table at the ground surface with a uniform surcharge of ' + q + ' psf"><rect width="480" height="260" fill="#ffffff"/>' + AH;
  s += '<rect x="80" y="80" width="320" height="150" fill="#d9c7a0" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="70" y1="80" x2="410" y2="80" stroke="#1d4ed8" stroke-width="2.5" stroke-dasharray="8 4"/>';
  s += '<text x="240" y="72" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1d4ed8">water table at surface</text>';
  for (var i = 0; i < 5; i++) s += '<line x1="' + (120 + i * 60) + '" y1="45" x2="' + (120 + i * 60) + '" y2="72" stroke="#c0392b" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="240" y="38" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#c0392b">q = ' + q + ' psf</text>';
  s += '<text x="240" y="160" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">' + h + ' ft sand, \u03B3sat = ' + gsat + ' lb/ft\u00B3</text>';
  return svgURL(s + '</svg>');
}
function dPiezo(sig, hw) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img" aria-label="Point in a clay layer with total vertical stress ' + sig.toLocaleString("en-US") + ' psf and a piezometer showing water ' + hw + ' feet above the point"><rect width="480" height="260" fill="#ffffff"/>' + AH;
  s += '<rect x="80" y="120" width="320" height="110" fill="#d9c7a0" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<circle cx="240" cy="180" r="6" fill="#c0392b"/>';
  s += '<line x1="240" y1="180" x2="240" y2="' + Math.max(30, 180 - hw * 6) + '" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<line x1="232" y1="' + Math.max(30, 180 - hw * 6) + '" x2="248" y2="' + Math.max(30, 180 - hw * 6) + '" stroke="#1d4ed8" stroke-width="4"/>';
  s += '<text x="258" y="' + Math.max(36, 180 - hw * 6 + 4) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1d4ed8">water stands ' + hw + ' ft above point</text>';
  s += '<text x="240" y="248" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">\u03C3 = ' + sig.toLocaleString("en-US") + ' psf at the point</text>';
  return svgURL(s + '</svg>');
}
function dWall(H, g, phi) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="280" viewBox="0 0 480 280" role="img" aria-label="Smooth wall ' + H + ' feet high retaining level backfill with unit weight ' + g + ' and friction angle ' + phi + ' degrees"><rect width="480" height="280" fill="#ffffff"/>' + AH;
  s += '<polygon points="120,40 160,40 160,230 100,230 120,40" fill="#cfcfcf" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<rect x="60" y="230" width="160" height="30" fill="#b0b0b0" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<polygon points="160,40 360,40 360,230 160,230" fill="#efe3c7" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<polygon points="160,40 160,230 260,230" fill="#f4b8b0" stroke="#c0392b" stroke-width="1.5"/>';
  s += '<text x="250" y="140" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">\u03B3 = ' + g + ' lb/ft\u00B3, \u03C6 = ' + phi + '\u00B0</text>';
  s += '<text x="205" y="200" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">Pa</text>';
  s += '<line x1="80" y1="40" x2="80" y2="230" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="72" y="140" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="end" fill="#1a1a1a">H = ' + H + ' ft</text>';
  return svgURL(s + '</svg>');
}
function dWallSlide(V, delta, Pa, Pp) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="Retaining wall with vertical force ' + V.toLocaleString("en-US") + ' pounds per foot, base friction angle ' + delta + ' degrees, active force ' + Pa.toLocaleString("en-US") + ' and passive resistance ' + Pp.toLocaleString("en-US") + '"><rect width="480" height="240" fill="#ffffff"/>' + AH;
  s += '<rect x="180" y="60" width="90" height="120" fill="#cfcfcf" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="60" y1="180" x2="420" y2="180" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<line x1="225" y1="30" x2="225" y2="55" stroke="#1a1a1a" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="240" y="26" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">\u03A3V = ' + V.toLocaleString("en-US") + ' lb/ft</text>';
  s += '<line x1="110" y1="120" x2="172" y2="120" stroke="#c0392b" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="105" y="108" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#c0392b">P_A = ' + Pa.toLocaleString("en-US") + '</text>';
  s += '<line x1="330" y1="160" x2="278" y2="160" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="336" y="152" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1d4ed8">P_P = ' + Pp.toLocaleString("en-US") + '</text>';
  s += '<text x="240" y="212" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">base \u03B4 = ' + delta + '\u00B0, adhesion neglected</text>';
  return svgURL(s + '</svg>');
}
function dShearBox(N, size) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220" role="img" aria-label="Direct shear box with a normal force of ' + N + ' newtons on a ' + size + ' millimeter square specimen"><rect width="480" height="220" fill="#ffffff"/>' + AH;
  s += '<rect x="150" y="70" width="180" height="40" fill="#d9c7a0" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<rect x="150" y="110" width="180" height="40" fill="#c9b88a" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="240" y1="30" x2="240" y2="62" stroke="#1a1a1a" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="252" y="40" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#1a1a1a">N = ' + N + ' N</text>';
  s += '<line x1="90" y1="90" x2="142" y2="90" stroke="#c0392b" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="88" y="80" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="end" fill="#c0392b">shear</text>';
  s += '<text x="240" y="182" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">specimen ' + size + ' mm \u00D7 ' + size + ' mm</text>';
  return svgURL(s + '</svg>');
}
function dFooting(B, Df) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img" aria-label="Strip footing ' + B + ' feet wide with its base ' + Df + ' feet below the ground surface"><rect width="480" height="260" fill="#ffffff"/>' + AH;
  s += '<rect x="40" y="60" width="400" height="170" fill="#efe3c7" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="40" y1="60" x2="440" y2="60" stroke="#1a1a1a" stroke-width="3"/>';
  var w = 40 + B * 14;
  s += '<rect x="' + (240 - w / 2) + '" y="' + (60 + Df * 20) + '" width="' + w + '" height="24" fill="#cfcfcf" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="' + (250 + w / 2) + '" y1="60" x2="' + (250 + w / 2) + '" y2="' + (60 + Df * 20) + '" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="' + (258 + w / 2) + '" y="' + (64 + Df * 10) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">D_f = ' + Df + ' ft</text>';
  s += '<text x="240" y="' + (108 + Df * 20) + '" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#1a1a1a">B = ' + B + ' ft</text>';
  return svgURL(s + '</svg>');
}
function dClayLayer(H, s0, sf, unit) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="Clay layer ' + H + ' ' + unit + ' thick consolidating under a stress increase from ' + s0.toLocaleString("en-US") + ' to ' + sf.toLocaleString("en-US") + '"><rect width="480" height="240" fill="#ffffff"/>' + AH;
  s += '<rect x="100" y="70" width="280" height="120" fill="#d9c7a0" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="100" y1="70" x2="380" y2="70" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<line x1="100" y1="190" x2="380" y2="190" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<text x="240" y="135" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">H = ' + H + ' ' + unit + '</text>';
  s += '<text x="240" y="52" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#c0392b">stress: ' + s0.toLocaleString("en-US") + ' \u2192 ' + sf.toLocaleString("en-US") + '</text>';
  return svgURL(s + '</svg>');
}
function dDoubleDrain(H, cv) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="Clay layer ' + H + ' meters thick draining at both top and bottom"><rect width="480" height="240" fill="#ffffff"/>' + AH;
  s += '<rect x="120" y="60" width="240" height="120" fill="#d9c7a0" stroke="#1a1a1a" stroke-width="2"/>';
  for (var i = 0; i < 3; i++) {
    s += '<line x1="' + (180 + i * 60) + '" y1="75" x2="' + (180 + i * 60) + '" y2="50" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
    s += '<line x1="' + (180 + i * 60) + '" y1="165" x2="' + (180 + i * 60) + '" y2="190" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#ah)"/>';
  }
  s += '<text x="240" y="125" font-family="Helvetica,Arial,sans-serif" font-size="14" text-anchor="middle" fill="#1a1a1a">H = ' + H + ' m (drains both faces)</text>';
  s += '<text x="240" y="220" font-family="Helvetica,Arial,sans-serif" font-size="13" text-anchor="middle" fill="#6b7280">c_v = ' + cv.toFixed(1) + ' m\u00B2/yr, drainage path = H/2</text>';
  return svgURL(s + '</svg>');
}
function dSlope(alpha, W, L, unit) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260" role="img" aria-label="Soil wedge above a planar slip surface inclined at ' + alpha + ' degrees to the horizontal"><rect width="480" height="260" fill="#ffffff"/>' + AH;
  s += '<polygon points="60,220 440,220 440,80 220,80" fill="#efe3c7" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<polygon points="120,220 340,80 220,80 220,220" fill="#d9c7a0" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="120" y1="220" x2="340" y2="80" stroke="#c0392b" stroke-width="3"/>';
  s += '<path d="M 190 220 A 70 70 0 0 0 176 196" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="198" y="212" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">\u03B1 = ' + alpha + '\u00B0</text>';
  if (W != null) { s += '<text x="215" y="165" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#1a1a1a">W = ' + W.toLocaleString("en-US") + ' ' + unit + '</text>'; }
  if (L != null) { s += '<text x="255" y="140" font-family="Helvetica,Arial,sans-serif" font-size="13" fill="#c0392b">slip surface L = ' + L + '</text>'; }
  return svgURL(s + '</svg>');
}

var C_GEC10 = "Source: FHWA GEC 10, Drilled Shafts: Construction Procedures and Design Methods (FHWA-NHI-18-024), Section 10 (Axial Loading), base resistance in cohesive soil, Equations 10-19 and 10-20 and Table 10-2 (https://www.fhwa.dot.gov/engineering/geotech/nhi18024.pdf). These equations are given in the question. This is supplemental practice, not a handbook-based item.";
function cGeotech(name, printed, pdf) { return "Refer to the " + name + " in the FE Reference Handbook (v10.6), Civil Engineering: Geotechnical, printed page " + printed + " (PDF page " + pdf + ")."; }
function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
function f1(x) { return (Math.round(x * 10) / 10).toFixed(1); }
function f3(x) { return (Math.round(x * 1000) / 1000).toFixed(3); }
function f0c(x) { return Math.round(x).toLocaleString("en-US"); }
function deg(x) { return x * Math.PI / 180; }

/* ---- geotech-050 ---- */
reg(buildGenerator({
  baseId: "geotech-050", topic: "Geotechnical Engineering", subtopic: "Drilled shaft base resistance in clay",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "\\(R_{BN} = N_c^* \\times s_u \\times\\) base area; using \\(\\pi B^2\\) or \\(B^2\\) for the area gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var B = pick([3, 4, 5]), D = pick([30, 40, 50]), su = pick([2500, 3000, 3500, 4000]);
  var q = 9.0 * su, A = Math.PI * B * B / 4;
  var correct = q * A / 1000;
  var question = "FHWA GEC 10 gives the nominal unit base resistance of a drilled shaft in cohesive soil as \\(q_{BN} = N_c^* s_u\\), where \\(s_u\\) is the mean undrained shear strength over 2B below the base. For a shaft depth of at least 3 diameters and \\(s_u\\) of at least 2,000 psf, \\(N_c^* = 9.0\\). A drilled shaft is " + B + " ft in diameter and " + D + " ft deep, with \\(s_u = " + su.toLocaleString("en-US") + "\\ \\text{psf}\\) below the base. What is the nominal base resistance?";
  var solution = C_GEC10 + "\n\n$$R_{BN} = q_{BN} \\times \\frac{\\pi B^2}{4} = (9.0)(" + su.toLocaleString("en-US") + ")\\frac{\\pi(" + B + ")^2}{4} = " + f0c(correct) + "\\ \\text{kips}$$";
  return {
    variantKey: "B" + B + "_D" + D + "_su" + su,
    question: question, diagram: dShaft(B, D, su),
    options: [
      { label: f0c(correct) + " kips", num: correct, correct: true },
      { label: f0c(q * Math.PI * B * B / 1000) + " kips", num: q * Math.PI * B * B / 1000, correct: false },
      { label: f0c(q * B * B / 1000) + " kips", num: q * B * B / 1000, correct: false },
      { label: f0c(correct / 2) + " kips", num: correct / 2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-051 ---- */
reg(buildGenerator({
  baseId: "geotech-051", topic: "Geotechnical Engineering", subtopic: "Drilled shaft base resistance (shallow, D < 3B)",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Shallow shafts get the 2/3[1 + D/6B] reduction; dropping the whole factor or the D/6B term gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var B = pick([4, 5, 6]), D = pick([8, 10, 12]), su = pick([2000, 2500, 3000]);
  var fac = (2 / 3) * (1 + D / (6 * B));
  var q = fac * 9.0 * su, A = Math.PI * B * B / 4;
  var correct = q * A / 1000;
  var dFull = 9.0 * su * A / 1000;
  var dNoTerm = (2 / 3) * 9.0 * su * A / 1000;
  var dSwap = (2 / 3) * (1 + B / (6 * D)) * 9.0 * su * A / 1000;
  var question = "For a drilled shaft in cohesive soil with depth D less than 3 diameters B, FHWA GEC 10 gives \\(q_{BN} = \\frac{2}{3}\\left[1 + \\frac{1}{6}\\frac{D}{B}\\right]N_c^* s_u\\). For \\(s_u\\) of at least 2,000 psf, \\(N_c^* = 9.0\\). A drilled shaft is " + B + " ft in diameter and " + D + " ft deep, with \\(s_u = " + su.toLocaleString("en-US") + "\\ \\text{psf}\\) below the base. What is the nominal base resistance?";
  var solution = C_GEC10 + "\n\n$$q_{BN} = \\tfrac{2}{3}\\left[1 + \\tfrac{1}{6}\\tfrac{" + D + "}{" + B + "}\\right](9.0)(" + su.toLocaleString("en-US") + "), \\quad R_{BN} = q_{BN}\\frac{\\pi B^2}{4} = " + f0c(correct) + "\\ \\text{kips}$$";
  return {
    variantKey: "B" + B + "_D" + D + "_su" + su,
    question: question, diagram: dShaft(B, D, su),
    options: [
      { label: f0c(correct) + " kips", num: correct, correct: true },
      { label: f0c(dFull) + " kips", num: dFull, correct: false },
      { label: f0c(dNoTerm) + " kips", num: dNoTerm, correct: false },
      { label: f0c(dSwap) + " kips", num: dSwap, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-053 ---- */
reg(buildGenerator({
  baseId: "geotech-053", topic: "Geotechnical Engineering", subtopic: "Coefficient of concavity (curvature)",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Cc = D30^2/(D10 D60); the traps are Cu, D30^2/D60, and the inverted form.",
  videoUrl: null, videoTitle: null
}, function () {
  var D10 = pick([0.10, 0.15, 0.20]), D30 = pick([0.45, 0.60, 0.75]), D60 = pick([1.20, 1.50, 1.80]);
  var correct = D30 * D30 / (D10 * D60);
  var question = "A soil has \\(D_{10} = " + D10.toFixed(2) + "\\) mm, \\(D_{30} = " + D30.toFixed(2) + "\\) mm and \\(D_{60} = " + D60.toFixed(2) + "\\) mm. What is the coefficient of concavity (curvature) \\(C_c\\)?";
  var solution = cGeotech("Coefficient of concavity (or curvature)", 266, 272) + "\n\n$$\\begin{aligned} C_c &= \\frac{D_{30}^2}{D_{10}D_{60}} \\\\ &= \\frac{" + D30.toFixed(2) + "^2}{(" + D10.toFixed(2) + ")(" + D60.toFixed(2) + ")} \\\\ &= " + f2(correct) + " \\end{aligned}$$";
  return {
    variantKey: "d" + D10 + "_" + D30 + "_" + D60,
    question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(D60 / D10), num: D60 / D10, correct: false },
      { label: f2(D30 * D30 / D60), num: D30 * D30 / D60, correct: false },
      { label: f2(D10 * D60 / (D30 * D30)), num: D10 * D60 / (D30 * D30), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-056 ---- */
reg(buildGenerator({
  baseId: "geotech-056", topic: "Geotechnical Engineering", subtopic: "Porosity from void ratio",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "n = e/(1+e); the traps are e, 1-e, and 1/(1+e).",
  videoUrl: null, videoTitle: null
}, function () {
  var e = pick([0.45, 0.55, 0.65, 0.75, 0.85]);
  var correct = e / (1 + e);
  var question = "A soil has a void ratio of " + e.toFixed(2) + ". What is its porosity?";
  var solution = cGeotech("Phase Relationships", 265, 271) + "\n\n$$n = \\frac{e}{1+e} = \\frac{" + e.toFixed(2) + "}{" + (1 + e).toFixed(2) + "} = " + f3(correct) + "$$";
  return {
    variantKey: "e" + e,
    question: question,
    options: [
      { label: f3(correct), num: correct, correct: true },
      { label: f3(e), num: e, correct: false },
      { label: f3(1 - e), num: 1 - e, correct: false },
      { label: f3(1 / (1 + e)), num: 1 / (1 + e), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-057 ---- */
reg(buildGenerator({
  baseId: "geotech-057", topic: "Geotechnical Engineering", subtopic: "Void ratio from porosity",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "e = n/(1-n); the traps are n, 1-n, and n(1-n).",
  videoUrl: null, videoTitle: null
}, function () {
  var n = pick([0.30, 0.36, 0.42, 0.48]);
  var correct = n / (1 - n);
  var question = "A soil has a porosity of " + n.toFixed(2) + ". What is its void ratio?";
  var solution = cGeotech("Phase Relationships", 265, 271) + "\n\n$$e = \\frac{n}{1-n} = \\frac{" + n.toFixed(2) + "}{" + (1 - n).toFixed(2) + "} = " + f3(correct) + "$$";
  return {
    variantKey: "n" + n,
    question: question,
    options: [
      { label: f3(correct), num: correct, correct: true },
      { label: f3(n), num: n, correct: false },
      { label: f3(1 - n), num: 1 - n, correct: false },
      { label: f3(n * (1 - n)), num: n * (1 - n), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-058 ---- */
reg(buildGenerator({
  baseId: "geotech-058", topic: "Geotechnical Engineering", subtopic: "Saturated unit weight",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "\\(\\gamma_{sat} = (G_s + e)/(1 + e)\\,\\gamma_w\\); dropping terms of the ratio gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var Gs = pick([2.60, 2.65, 2.68, 2.70, 2.75]), e = pick([0.60, 0.72, 0.85, 0.95]);
  var gw = 62.4;
  var correct = (Gs + e) / (1 + e) * gw;
  var question = "A saturated soil has \\(G_s = " + Gs.toFixed(2) + "\\) and a void ratio of " + e.toFixed(2) + ". Using \\(\\gamma_w = 62.4\\) lb/ft\u00B3, what is the saturated unit weight?";
  var solution = cGeotech("Saturated unit weight", 265, 271) + "\n\n$$\\gamma_{sat} = \\frac{G_s + e}{1 + e}\\gamma_w = \\frac{" + Gs.toFixed(2) + " + " + e.toFixed(2) + "}{" + (1 + e).toFixed(2) + "}(62.4) = " + f1(correct) + "\\ \\text{lb/ft}^3$$";
  return {
    variantKey: "Gs" + Gs + "_e" + e,
    question: question,
    options: [
      { label: f1(correct) + " lb/ft\u00B3", num: correct, correct: true },
      { label: f1((Gs + e) * gw) + " lb/ft\u00B3", num: (Gs + e) * gw, correct: false },
      { label: f1((Gs - 1) / (1 + e) * gw) + " lb/ft\u00B3", num: (Gs - 1) / (1 + e) * gw, correct: false },
      { label: f1(Gs / (1 + e) * gw) + " lb/ft\u00B3", num: Gs / (1 + e) * gw, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-059 ---- */
reg(buildGenerator({
  baseId: "geotech-059", topic: "Geotechnical Engineering", subtopic: "Effective (submerged) unit weight",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "\\(\\gamma' = \\gamma_{sat} - \\gamma_w\\); reporting \\(\\gamma_{sat}\\) or dropping the \\(1+e\\) divisor gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var Gs = pick([2.60, 2.65, 2.70, 2.75]), e = pick([0.70, 0.80, 0.90, 1.00]);
  var gw = 9.81;
  var gsat = (Gs + e) / (1 + e) * gw;
  var correct = gsat - gw;
  var question = "A saturated soil has \\(G_s = " + Gs.toFixed(2) + "\\) and a void ratio of " + e.toFixed(2) + ". Using \\(\\gamma_w = 9.81\\) kN/m\u00B3, what is the effective (submerged) unit weight?";
  var solution = cGeotech("Saturated unit weight and Effective (submerged) unit weight", 265, 271) + "\n\n$$\\gamma' = \\gamma_{sat} - \\gamma_w = \\frac{G_s - 1}{1 + e}\\gamma_w = " + f2(correct) + "\\ \\text{kN/m}^3$$";
  return {
    variantKey: "Gs" + Gs + "_e" + e,
    question: question,
    options: [
      { label: f2(correct) + " kN/m\u00B3", num: correct, correct: true },
      { label: f2(gsat) + " kN/m\u00B3", num: gsat, correct: false },
      { label: f2((Gs - 1) * gw) + " kN/m\u00B3", num: (Gs - 1) * gw, correct: false },
      { label: f2(Gs / (1 + e) * gw) + " kN/m\u00B3", num: Gs / (1 + e) * gw, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-060 ---- */
reg(buildGenerator({
  baseId: "geotech-060", topic: "Geotechnical Engineering", subtopic: "Degree of saturation",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "S = w Gs/e; the traps invert the ratio or multiply by e instead of dividing.",
  videoUrl: null, videoTitle: null
}, function () {
  var w = pick([0.15, 0.18, 0.22, 0.26]), Gs = pick([2.65, 2.70, 2.75]), e = pick([0.60, 0.70, 0.80]);
  var correct = w * Gs / e * 100;
  var question = "A soil sample has a water content of " + Math.round(w * 100) + "%, \\(G_s = " + Gs.toFixed(2) + "\\) and a void ratio of " + e.toFixed(2) + ". What is the degree of saturation?";
  var solution = cGeotech("Degree of saturation", 266, 272) + "\n\n$$S = \\frac{wG_s}{e} = \\frac{(" + w.toFixed(2) + ")(" + Gs.toFixed(2) + ")}{" + e.toFixed(2) + "} = " + f1(correct) + "\\%$$";
  return {
    variantKey: "w" + w + "_Gs" + Gs + "_e" + e,
    question: question,
    options: [
      { label: f1(correct) + "%", num: correct, correct: true },
      { label: f1(e / (w * Gs) * 100) + "%", num: e / (w * Gs) * 100, correct: false },
      { label: f1(w * Gs * 100) + "%", num: w * Gs * 100, correct: false },
      { label: f1(w * e / Gs * 100) + "%", num: w * e / Gs * 100, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-061 ---- */
reg(buildGenerator({
  baseId: "geotech-061", topic: "Geotechnical Engineering", subtopic: "Water content from weights",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "Water content is referenced to the oven-dry weight; the wet weight basis is the classic trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var dry = pick([2.50, 2.85, 3.20, 3.60]), water = pick([0.35, 0.45, 0.55, 0.65]);
  var wet = dry + water;
  var correct = water / dry * 100;
  var question = "A soil sample weighs " + wet.toFixed(2) + " lb at its natural moisture content and " + dry.toFixed(2) + " lb after oven drying. What is its water content?";
  var solution = cGeotech("Water content (%)", 265, 271) + "\n\n$$w = \\frac{W_{wet} - W_{dry}}{W_{dry}} = \\frac{" + wet.toFixed(2) + " - " + dry.toFixed(2) + "}{" + dry.toFixed(2) + "} = " + f1(correct) + "\\%$$";
  return {
    variantKey: "wet" + wet + "_dry" + dry,
    question: question,
    options: [
      { label: f1(correct) + "%", num: correct, correct: true },
      { label: f1(water / wet * 100) + "%", num: water / wet * 100, correct: false },
      { label: f1(wet / dry * 100) + "%", num: wet / dry * 100, correct: false },
      { label: f1(dry / wet * 100) + "%", num: dry / wet * 100, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-062 ---- */
reg(buildGenerator({
  baseId: "geotech-062", topic: "Geotechnical Engineering", subtopic: "Dry unit weight from total unit weight and water content",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "\\(\\gamma_d = \\gamma/(1+w)\\); multiplying by \\(1-w\\) or \\(1+w\\) or subtracting \\(w\\) gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var g = pick([118, 122, 127, 132]), w = pick([0.10, 0.14, 0.18, 0.22]);
  var correct = g / (1 + w);
  var question = "A soil has a total unit weight of " + g + " lb/ft\u00B3 and a water content of " + Math.round(w * 100) + "%. What is its dry unit weight?";
  var solution = cGeotech("Total unit weight, Dry unit weight and Water content", 265, 271) + "\n\n$$\\gamma_d = \\frac{\\gamma}{1+w} = \\frac{" + g + "}{" + (1 + w).toFixed(2) + "} = " + f1(correct) + "\\ \\text{lb/ft}^3$$";
  return {
    variantKey: "g" + g + "_w" + w,
    question: question,
    options: [
      { label: f1(correct) + " lb/ft\u00B3", num: correct, correct: true },
      { label: f1(g * (1 - w)) + " lb/ft\u00B3", num: g * (1 - w), correct: false },
      { label: f1(g * (1 + w)) + " lb/ft\u00B3", num: g * (1 + w), correct: false },
      { label: f1(g - w * 100) + " lb/ft\u00B3", num: g - w * 100, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-063 ---- */
reg(buildGenerator({
  baseId: "geotech-063", topic: "Geotechnical Engineering", subtopic: "Void ratio from weight of solids",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Compute the solids volume from \\(W_s/(G_s \\gamma_w)\\), then \\(e = V_v/V_s\\); the traps use \\(V_t\\) in the ratio or invert it.",
  videoUrl: null, videoTitle: null
}, function () {
  var Vt = pick([1.0, 1.2, 1.5]), Ws = pick([85, 100, 115]), Gs = pick([2.60, 2.65, 2.70]);
  var Vs = Ws / (Gs * 62.4), Vv = Vt - Vs;
  var correct = Vv / Vs;
  var question = "A soil specimen of total volume " + Vt.toFixed(1) + " ft\u00B3 contains " + Ws + " lb of solids. The specific gravity of solids is " + Gs.toFixed(2) + ". Using \\(\\gamma_w = 62.4\\) lb/ft\u00B3, what is the void ratio?";
  var solution = cGeotech("Specific gravity of soil solids and Void ratio", 265, 271) + "\n\n$$V_s = \\frac{W_s}{G_s\\gamma_w} = \\frac{" + Ws + "}{(" + Gs.toFixed(2) + ")(62.4)} = " + f3(Vs) + "\\ \\text{ft}^3, \\quad e = \\frac{V_t - V_s}{V_s} = " + f3(correct) + "$$";
  return {
    variantKey: "Vt" + Vt + "_Ws" + Ws + "_Gs" + Gs,
    question: question,
    options: [
      { label: f3(correct), num: correct, correct: true },
      { label: f3(Vs / Vv), num: Vs / Vv, correct: false },
      { label: f3(Vv / Vt), num: Vv / Vt, correct: false },
      { label: f3(Vv), num: Vv, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-064 ---- */
reg(buildGenerator({
  baseId: "geotech-064", topic: "Geotechnical Engineering", subtopic: "Required field dry unit weight",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "Required field value = RC x max; dividing by RC or subtracting percentage points gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var rc = pick([0.90, 0.92, 0.95, 0.98]), gmax = pick([112, 118, 121, 125]);
  var correct = rc * gmax;
  // Round at display precision on the exact decimal value: 0.95 x 121 = 114.95 -> 115.0
  // (raw IEEE arithmetic gives 114.94999... which would truncate to 114.9).
  var disp = Math.round((correct + 1e-9) * 10) / 10;
  var question = "The specification requires " + Math.round(rc * 100) + "% relative compaction. The laboratory maximum dry unit weight is " + gmax + " lb/ft\u00B3. What minimum field dry unit weight must the contractor achieve?";
  var solution = cGeotech("Relative compaction (%)", 266, 272) + "\n\n$$\\gamma_{field} = RC \\times \\gamma_{max} = " + rc.toFixed(2) + " \\times " + gmax + " = " + disp.toFixed(1) + "\\ \\text{lb/ft}^3$$";
  return {
    variantKey: "rc" + rc + "_g" + gmax,
    question: question,
    options: [
      { label: disp.toFixed(1) + " lb/ft\u00B3", num: disp, correct: true },
      { label: f1(gmax / rc) + " lb/ft\u00B3", num: gmax / rc, correct: false },
      { label: f1(gmax * (rc - 0.05)) + " lb/ft\u00B3", num: gmax * (rc - 0.05), correct: false },
      { label: f1(gmax - (1 - rc) * 100) + " lb/ft\u00B3", num: gmax - (1 - rc) * 100, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-065 ---- */
reg(buildGenerator({
  baseId: "geotech-065", topic: "Geotechnical Engineering", subtopic: "Relative density from void ratios",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Dr = (emax - e)/(emax - emin); flipping the numerator or the denominator range gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var emax = pick([0.85, 0.92, 1.00]), emin = pick([0.40, 0.45, 0.50]), e = pick([0.55, 0.62, 0.70, 0.78]);
  if (e >= emax) e = emax - 0.15;
  var correct = (emax - e) / (emax - emin) * 100;
  var question = "A sand has \\(e_{max} = " + emax.toFixed(2) + "\\) and \\(e_{min} = " + emin.toFixed(2) + "\\). In the field its void ratio is " + e.toFixed(2) + ". What is the relative density?";
  var solution = cGeotech("Relative density", 266, 272) + "\n\n$$D_r = \\frac{e_{max} - e}{e_{max} - e_{min}} = \\frac{" + emax.toFixed(2) + " - " + e.toFixed(2) + "}{" + emax.toFixed(2) + " - " + emin.toFixed(2) + "} = " + f1(correct) + "\\%$$";
  return {
    variantKey: "emax" + emax + "_emin" + emin + "_e" + e,
    question: question,
    options: [
      { label: f1(correct) + "%", num: correct, correct: true },
      { label: f1((e - emin) / (emax - emin) * 100) + "%", num: (e - emin) / (emax - emin) * 100, correct: false },
      { label: f1((emax - e) / emax * 100) + "%", num: (emax - e) / emax * 100, correct: false },
      { label: f1((e - emin) / (emax - e) * 100) + "%", num: (e - emin) / (emax - e) * 100, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-066 ---- */
reg(buildGenerator({
  baseId: "geotech-066", topic: "Geotechnical Engineering", subtopic: "Relative density from dry unit weights",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Dr = [(gf - gmin)/(gmax - gmin)] x (gmax/gf); dropping the gmax/gf factor gives the trap.",
  videoUrl: null, videoTitle: null
}, function () {
  var gmin = pick([90, 94, 98]), gmax = pick([108, 112, 116]), gf = pick([100, 105, 110]);
  if (gf >= gmax) gf = gmax - 4;
  var correct = (gf - gmin) / (gmax - gmin) * (gmax / gf) * 100;
  var question = "A sand has \\(\\gamma_{D\\ min} = " + gmin + "\\), \\(\\gamma_{D\\ max} = " + gmax + "\\) and a field \\(\\gamma_{D\\ field} = " + gf + "\\), all in lb/ft\u00B3. What is the relative density?";
  var solution = cGeotech("Relative density", 266, 272) + "\n\n$$D_r = \\frac{\\gamma_{f} - \\gamma_{min}}{\\gamma_{max} - \\gamma_{min}} \\times \\frac{\\gamma_{max}}{\\gamma_{f}} = \\frac{" + gf + " - " + gmin + "}{" + gmax + " - " + gmin + "} \\times \\frac{" + gmax + "}{" + gf + "} = " + f1(correct) + "\\%$$";
  return {
    variantKey: "gmin" + gmin + "_gmax" + gmax + "_gf" + gf,
    question: question,
    options: [
      { label: f1(correct) + "%", num: correct, correct: true },
      { label: f1((gf - gmin) / (gmax - gmin) * 100) + "%", num: (gf - gmin) / (gmax - gmin) * 100, correct: false },
      { label: f1(gf / gmax * 100) + "%", num: gf / gmax * 100, correct: false },
      { label: f1((gmax - gf) / (gmax - gmin) * 100) + "%", num: (gmax - gf) / (gmax - gmin) * 100, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-067 ---- */
reg(buildGenerator({
  baseId: "geotech-067", topic: "Geotechnical Engineering", subtopic: "Effective vertical stress with a water table",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Below the water table use \\(\\gamma_{sat} - \\gamma_w\\); the traps give total stress, the pore pressure, or a half-depth error.",
  videoUrl: null, videoTitle: null
}, function () {
  var h1 = pick([4, 5, 6]), g1 = pick([110, 115, 120]), h2 = pick([8, 10, 12]), g2 = pick([120, 125, 130]);
  var correct = g1 * h1 + (g2 - 62.4) * h2;
  var question = "A soil profile has " + h1 + " ft of moist soil (\\(\\gamma = " + g1 + "\\) lb/ft\u00B3) above the water table and " + h2 + " ft of saturated soil (\\(\\gamma_{sat} = " + g2 + "\\) lb/ft\u00B3) below it, as shown. Using \\(\\gamma_w = 62.4\\) lb/ft\u00B3, what is the effective vertical stress at the base of the profile?";
  var solution = cGeotech("Vertical Stress Profiles", 270, 276) + "\n\n$$\\sigma' = \\gamma h_1 + (\\gamma_{sat} - \\gamma_w)h_2 = (" + g1 + ")(" + h1 + ") + (" + g2 + " - 62.4)(" + h2 + ") = " + f0c(correct) + "\\ \\text{psf}$$";
  return {
    variantKey: "h" + h1 + "_" + g1 + "_" + h2 + "_" + g2,
    question: question, diagram: dProfileWT(h1, g1, h2, g2),
    options: [
      { label: f0c(correct) + " psf", num: correct, correct: true },
      { label: f0c(g1 * h1 + g2 * h2) + " psf", num: g1 * h1 + g2 * h2, correct: false },
      { label: f0c(62.4 * h2) + " psf", num: 62.4 * h2, correct: false },
      { label: f0c(g1 * h1 + (g2 - 62.4) * h2 / 2) + " psf", num: g1 * h1 + (g2 - 62.4) * h2 / 2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-068 ---- */
reg(buildGenerator({
  baseId: "geotech-068", topic: "Geotechnical Engineering", subtopic: "Effective stress with surcharge",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "The surcharge adds to effective stress directly; the traps omit it, use total unit weight, or halve \\(\\gamma_w\\).",
  videoUrl: null, videoTitle: null
}, function () {
  var h = pick([10, 12, 14]), gsat = pick([118, 120, 125]), q = pick([300, 400, 500]);
  var correct = q + (gsat - 62.4) * h;
  var question = "A " + h + "-ft sand layer (\\(\\gamma_{sat} = " + gsat + "\\) lb/ft\u00B3) lies below a water table at the ground surface. A uniform surcharge of " + q + " psf is applied at the surface, as shown. Using \\(\\gamma_w = 62.4\\) lb/ft\u00B3, what is the effective vertical stress at the base of the layer?";
  var solution = cGeotech("Vertical Stress Profiles with Surcharge", 270, 276) + "\n\n$$\\sigma' = q + (\\gamma_{sat} - \\gamma_w)h = " + q + " + (" + gsat + " - 62.4)(" + h + ") = " + f1(correct) + "\\ \\text{psf}$$";
  return {
    variantKey: "h" + h + "_g" + gsat + "_q" + q,
    question: question, diagram: dSurcharge(h, gsat, q),
    options: [
      { label: f1(correct) + " psf", num: correct, correct: true },
      { label: f1((gsat - 62.4) * h) + " psf", num: (gsat - 62.4) * h, correct: false },
      { label: f1(q + gsat * h) + " psf", num: q + gsat * h, correct: false },
      { label: f1(q + (gsat - 62.4 / 2) * h) + " psf", num: q + (gsat - 62.4 / 2) * h, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-069 ---- */
reg(buildGenerator({
  baseId: "geotech-069", topic: "Geotechnical Engineering", subtopic: "Effective stress with pressure head",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "\\(u = \\gamma_w \\times\\) head; the traps add \\(u\\), report \\(u\\), or use 9.81 with psf.",
  videoUrl: null, videoTitle: null
}, function () {
  var sig = pick([2000, 2400, 2800]), hw = pick([20, 25, 30]);
  var correct = sig - 62.4 * hw;
  var question = "At a point in a clay layer the total vertical stress is " + sig.toLocaleString("en-US") + " psf. A piezometer at that point shows water standing " + hw + " ft above it. Using \\(\\gamma_w = 62.4\\) lb/ft\u00B3, what is the effective vertical stress at that point?";
  var solution = cGeotech("Effective stress", 269, 275) + "\n\n$$\\sigma' = \\sigma - u = " + sig.toLocaleString("en-US") + " - (62.4)(" + hw + ") = " + f0c(correct) + "\\ \\text{psf}$$";
  return {
    variantKey: "sig" + sig + "_hw" + hw,
    question: question, diagram: dPiezo(sig, hw),
    options: [
      { label: f0c(correct) + " psf", num: correct, correct: true },
      { label: f0c(sig + 62.4 * hw) + " psf", num: sig + 62.4 * hw, correct: false },
      { label: f0c(62.4 * hw) + " psf", num: 62.4 * hw, correct: false },
      { label: f0c(sig - 9.81 * hw) + " psf", num: sig - 9.81 * hw, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-070 ---- */
reg(buildGenerator({
  baseId: "geotech-070", topic: "Geotechnical Engineering", subtopic: "Rankine active coefficient",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Ka = (1 - sin phi)/(1 + sin phi) = tan^2(45 - phi/2); the traps are the inverse, 1 - sin phi, and the unsquared tangent.",
  videoUrl: null, videoTitle: null
}, function () {
  var phi = pick([28, 30, 32, 34, 36]);
  var s = Math.sin(deg(phi));
  var correct = (1 - s) / (1 + s);
  var question = "A smooth wall retains level, cohesionless backfill with an angle of internal friction of " + phi + "\u00B0. What is the Rankine active earth pressure coefficient?";
  var solution = cGeotech("Active forces on retaining wall", 269, 275) + "\n\n$$K_A = \\frac{1 - \\sin\\phi}{1 + \\sin\\phi} = \\frac{1 - \\sin " + phi + "^\\circ}{1 + \\sin " + phi + "^\\circ} = " + f3(correct) + "$$";
  return {
    variantKey: "phi" + phi,
    question: question,
    options: [
      { label: f3(correct), num: correct, correct: true },
      { label: f3(1 / correct), num: 1 / correct, correct: false },
      { label: f3(1 - s), num: 1 - s, correct: false },
      { label: f3(Math.tan(deg(45 - phi / 2))), num: Math.tan(deg(45 - phi / 2)), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-071 ---- */
reg(buildGenerator({
  baseId: "geotech-071", topic: "Geotechnical Engineering", subtopic: "Rankine passive coefficient",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Kp = (1 + sin phi)/(1 - sin phi); the traps are the inverse, 1 + sin phi, and the unsquared tangent.",
  videoUrl: null, videoTitle: null
}, function () {
  var phi = pick([26, 28, 30, 32, 34]);
  var s = Math.sin(deg(phi));
  var correct = (1 + s) / (1 - s);
  var question = "What is the Rankine passive earth pressure coefficient for a smooth wall and level, cohesionless backfill with \\(\\phi = " + phi + "^\\circ\\)?";
  var solution = cGeotech("Passive forces on retaining wall", 269, 275) + "\n\n$$K_P = \\frac{1 + \\sin\\phi}{1 - \\sin\\phi} = " + f2(correct) + "$$";
  return {
    variantKey: "phi" + phi,
    question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(1 / correct), num: 1 / correct, correct: false },
      { label: f2(1 + s), num: 1 + s, correct: false },
      { label: f2(Math.tan(deg(45 + phi / 2))), num: Math.tan(deg(45 + phi / 2)), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-072 ---- */
reg(buildGenerator({
  baseId: "geotech-072", topic: "Geotechnical Engineering", subtopic: "Active force on a retaining wall",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Pa = (1/2) Ka gamma H^2; dropping the 1/2, the square on H, or using Kp gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var H = pick([12, 14, 16]), g = pick([115, 118, 120]), phi = pick([28, 30, 32]);
  var s = Math.sin(deg(phi)), Ka = (1 - s) / (1 + s);
  var correct = 0.5 * Ka * g * H * H;
  var question = "A smooth " + H + "-ft-high wall retains level backfill with \\(\\gamma = " + g + "\\) lb/ft\u00B3 and \\(\\phi = " + phi + "^\\circ\\), as shown. Ignoring groundwater, what is the Rankine active force per foot of wall length?";
  var solution = cGeotech("Horizontal Stress Profiles and Forces", 269, 275) + "\n\n$$K_A = " + f3(Ka) + ", \\quad P_A = \\tfrac{1}{2}K_A\\gamma H^2 = \\tfrac{1}{2}(" + f3(Ka) + ")(" + g + ")(" + H + ")^2 = " + f0c(correct) + "\\ \\text{lb/ft}$$";
  return {
    variantKey: "H" + H + "_g" + g + "_p" + phi,
    question: question, diagram: dWall(H, g, phi),
    options: [
      { label: f0c(correct) + " lb/ft", num: correct, correct: true },
      { label: f0c(0.5 * Ka * g * H) + " lb/ft", num: 0.5 * Ka * g * H, correct: false },
      { label: f0c(2 * correct) + " lb/ft", num: 2 * correct, correct: false },
      { label: f0c(0.5 * g * H * H / Ka) + " lb/ft", num: 0.5 * g * H * H / Ka, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-073 ---- */
reg(buildGenerator({
  baseId: "geotech-073", topic: "Geotechnical Engineering", subtopic: "At-rest coefficient, overconsolidated soil",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "K0(OC) = (1 - sin phi) OCR^(sin phi); the normally consolidated value and OCR^sin phi alone are the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var phi = pick([26, 28, 30, 32, 34]), ocr = pick([2, 3, 4, 5]);
  var s = Math.sin(deg(phi));
  var correct = (1 - s) * Math.pow(ocr, s);
  var question = "A clay has \\(\\phi = " + phi + "^\\circ\\) and an overconsolidation ratio of " + ocr + ". Using the handbook relation, what is the at-rest earth pressure coefficient \\(K_0\\)?";
  var solution = cGeotech("At-rest forces on wall per unit length of wall", 269, 275) + "\n\n$$K_0 = (1 - \\sin\\phi)\\,OCR^{\\sin\\phi} = (1 - \\sin " + phi + "^\\circ)(" + ocr + ")^{\\sin " + phi + "^\\circ} = " + f2(correct) + "$$";
  return {
    variantKey: "phi" + phi + "_ocr" + ocr,
    question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(1 - s), num: 1 - s, correct: false },
      { label: f2(Math.pow(ocr, s)), num: Math.pow(ocr, s), correct: false },
      { label: f2((1 - s) / (1 + s)), num: (1 - s) / (1 + s), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-074 ---- */
reg(buildGenerator({
  baseId: "geotech-074", topic: "Geotechnical Engineering", subtopic: "Factor of safety against overturning",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "FS = resisting/overturning moment; the traps invert it or subtract 1.",
  videoUrl: null, videoTitle: null
}, function () {
  var R = pick([15000, 18400, 22000, 26000]), O = pick([5000, 6100, 7500, 9000]);
  var correct = R / O;
  var question = "A retaining wall has a resisting moment of " + R.toLocaleString("en-US") + " ft-lb per foot of wall about the toe and an overturning moment of " + O.toLocaleString("en-US") + " ft-lb per foot about the toe. What is the factor of safety against overturning?";
  var solution = cGeotech("Retaining Walls", 270, 276) + "\n\n$$FS = \\frac{M_R}{M_O} = \\frac{" + R.toLocaleString("en-US") + "}{" + O.toLocaleString("en-US") + "} = " + f2(correct) + "$$";
  return {
    variantKey: "R" + R + "_O" + O,
    question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(O / R), num: O / R, correct: false },
      { label: f2(correct - 1), num: correct - 1, correct: false },
      { label: f2(1 + O / R), num: 1 + O / R, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-075 ---- */
reg(buildGenerator({
  baseId: "geotech-075", topic: "Geotechnical Engineering", subtopic: "Factor of safety against sliding",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "FS = (V tan delta + Pp)/Pa; dropping Pp, adding it to V, or dividing by Pp gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([12000, 15000, 18000]), delta = pick([16, 20, 24]), Pa = pick([3000, 3900, 4500]), Pp = pick([800, 1200, 1600]);
  var correct = (V * Math.tan(deg(delta)) + Pp) / Pa;
  var question = "A retaining wall carries a total vertical force \\(\\Sigma V = " + V.toLocaleString("en-US") + "\\) lb/ft. The base friction angle is \\(\\delta = " + delta + "^\\circ\\), adhesion is neglected (\\(C_a = 0\\)), the horizontal active force is \\(P_A = " + Pa.toLocaleString("en-US") + "\\) lb/ft acting horizontally (\\(\\alpha = 0\\)), and the passive resistance is \\(P_P = " + Pp.toLocaleString("en-US") + "\\) lb/ft, as shown. What is the factor of safety against sliding?";
  var solution = cGeotech("Retaining Walls", 270, 276) + "\n\n$$FS = \\frac{(\\Sigma V)\\tan\\delta + P_P}{P_A} = \\frac{(" + V.toLocaleString("en-US") + ")\\tan " + delta + "^\\circ + " + Pp.toLocaleString("en-US") + "}{" + Pa.toLocaleString("en-US") + "} = " + f2(correct) + "$$";
  return {
    variantKey: "V" + V + "_d" + delta + "_Pa" + Pa + "_Pp" + Pp,
    question: question, diagram: dWallSlide(V, delta, Pa, Pp),
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(V * Math.tan(deg(delta)) / Pa), num: V * Math.tan(deg(delta)) / Pa, correct: false },
      { label: f2((V + Pp) / Pa), num: (V + Pp) / Pa, correct: false },
      { label: f2((V * Math.tan(deg(delta)) + Pp) / Pp), num: (V * Math.tan(deg(delta)) + Pp) / Pp, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-076 ---- */
reg(buildGenerator({
  baseId: "geotech-076", topic: "Geotechnical Engineering", subtopic: "Shear strength at failure",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "\\(\\tau_f = c + \\sigma \\tan\\phi\\); the traps drop \\(\\tan\\phi\\), drop \\(c\\), or use \\(\\sin\\phi\\).",
  videoUrl: null, videoTitle: null
}, function () {
  var c = pick([200, 300, 400]), phi = pick([24, 28, 32]), sig = pick([1500, 2000, 2500]);
  var correct = c + sig * Math.tan(deg(phi));
  var question = "A soil has cohesion \\(c = " + c + "\\) psf and an angle of internal friction \\(\\phi = " + phi + "^\\circ\\). What shear stress at failure develops on a plane with a normal stress of " + sig.toLocaleString("en-US") + " psf?";
  var solution = cGeotech("Shear stress at failure", 269, 275) + "\n\n$$\\tau_f = c + \\sigma_N\\tan\\phi = " + c + " + (" + sig.toLocaleString("en-US") + ")\\tan " + phi + "^\\circ = " + f0c(correct) + "\\ \\text{psf}$$";
  return {
    variantKey: "c" + c + "_p" + phi + "_s" + sig,
    question: question,
    options: [
      { label: f0c(correct) + " psf", num: correct, correct: true },
      { label: f0c(c + sig) + " psf", num: c + sig, correct: false },
      { label: f0c(sig * Math.tan(deg(phi))) + " psf", num: sig * Math.tan(deg(phi)), correct: false },
      { label: f0c(c + sig * Math.sin(deg(phi))) + " psf", num: c + sig * Math.sin(deg(phi)), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-077 ---- */
reg(buildGenerator({
  baseId: "geotech-077", topic: "Geotechnical Engineering", subtopic: "Direct shear test",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Convert the normal force to stress first; the traps use the force directly or report the normal stress.",
  videoUrl: null, videoTitle: null
}, function () {
  var N = pick([300, 450, 600]), size = pick([50, 60, 75]), c = pick([5, 10, 15]), phi = pick([25, 30, 35]);
  var sig = N / ((size / 1000) * (size / 1000)) / 1000; // kPa
  var correct = c + sig * Math.tan(deg(phi));
  var question = "In a direct shear test, a normal force of " + N + " N acts on a square specimen " + size + " mm by " + size + " mm. The soil has \\(c = " + c + "\\) kPa and \\(\\phi = " + phi + "^\\circ\\). What shear stress is needed to fail the specimen?";
  var solution = cGeotech("Total normal stress and Shear stress at failure", 269, 275) + "\n\n$$\\sigma_N = \\frac{" + N + "}{(" + size + " \\times 10^{-3})^2} = " + f1(sig) + "\\ \\text{kPa}, \\quad \\tau_f = c + \\sigma_N\\tan\\phi = " + f1(correct) + "\\ \\text{kPa}$$";
  return {
    variantKey: "N" + N + "_s" + size + "_c" + c + "_p" + phi,
    question: question, diagram: dShearBox(N, size),
    options: [
      { label: f1(correct) + " kPa", num: correct, correct: true },
      { label: f1(sig) + " kPa", num: sig, correct: false },
      { label: f1(sig * Math.tan(deg(phi))) + " kPa", num: sig * Math.tan(deg(phi)), correct: false },
      { label: f1(c + N * Math.tan(deg(phi)) / 1000) + " kPa", num: c + N * Math.tan(deg(phi)) / 1000, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-078 ---- */
reg(buildGenerator({
  baseId: "geotech-078", topic: "Geotechnical Engineering", subtopic: "Cohesion from two direct shear tests",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Fit the straight Mohr-Coulomb line through both points; the traps report a data point or the stress difference.",
  videoUrl: null, videoTitle: null
}, function () {
  var s1 = pick([40, 50, 60]), ds = pick([60, 70, 80]), s2 = s1 + ds;
  var t1 = pick([42, 48, 55]), dt = pick([28, 34, 40]), t2 = t1 + dt;
  var tanphi = (t2 - t1) / (s2 - s1);
  var correct = t1 - s1 * tanphi;
  var question = "Two direct shear tests on the same soil give these failure points: \\(\\sigma_N = " + s1 + "\\) kPa with \\(\\tau_F = " + t1 + "\\) kPa, and \\(\\sigma_N = " + s2 + "\\) kPa with \\(\\tau_F = " + t2 + "\\) kPa. Assuming a straight Mohr-Coulomb envelope, what is the cohesion?";
  var solution = cGeotech("Shear stress at failure", 269, 275) + "\n\n$$\\tan\\phi = \\frac{" + t2 + " - " + t1 + "}{" + s2 + " - " + s1 + "} = " + f3(tanphi) + ", \\quad c = \\tau_1 - \\sigma_1\\tan\\phi = " + t1 + " - (" + s1 + ")(" + f3(tanphi) + ") = " + f1(correct) + "\\ \\text{kPa}$$";
  return {
    variantKey: "s" + s1 + "_" + s2 + "_t" + t1 + "_" + t2,
    question: question,
    options: [
      { label: f1(correct) + " kPa", num: correct, correct: true },
      { label: f1(t1) + " kPa", num: t1, correct: false },
      { label: f1(t2 - t1) + " kPa", num: t2 - t1, correct: false },
      { label: f1((t1 + t2) / 2 - (s1 + s2) / 2 * tanphi + t1 / 10) + " kPa", num: (t1 + t2) / 2 - (s1 + s2) / 2 * tanphi + t1 / 10, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-079 ---- */
reg(buildGenerator({
  baseId: "geotech-079", topic: "Geotechnical Engineering", subtopic: "Ultimate bearing capacity, strip footing, dry cohesionless soil",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "\\(q_u = \\gamma D_f N_q + (1/2)\\gamma B N_\\gamma\\); the traps drop the \\(\\gamma\\) term, drop the 1/2, or drop the \\(D_f\\) term.",
  videoUrl: null, videoTitle: null
}, function () {
  var B = pick([4, 5, 6]), Df = pick([3, 4]), g = pick([115, 120, 125]);
  var pair = pick([[18.4, 22.4], [14.7, 15.0], [23.2, 30.2], [10.7, 10.9]]);
  var Nq = pair[0], Ng = pair[1];
  var t1 = g * Df * Nq, t2 = 0.5 * g * B * Ng;
  var correct = t1 + t2;
  var question = "A strip footing has a base width of \\(B = " + B + "\\) ft, and the base bearing surface is \\(D_f = " + Df + "\\) ft below the ground surface in cohesionless soil (\\(c = 0\\)) with \\(\\gamma = " + g + "\\) lb/ft\u00B3. The groundwater table is far below the footing. For this soil \\(N_q = " + Nq + "\\) and \\(N_\\gamma = " + Ng + "\\). Using the handbook equation, what is the ultimate bearing capacity?";
  var solution = cGeotech("Ultimate Bearing Capacity", 270, 276) + "\n\n$$q_u = \\gamma D_f N_q + \\tfrac{1}{2}\\gamma B N_\\gamma = " + f0c(t1) + " + " + f0c(t2) + " = " + f0c(correct) + "\\ \\text{psf}$$";
  return {
    variantKey: "B" + B + "_D" + Df + "_g" + g + "_N" + Nq,
    question: question, diagram: dFooting(B, Df),
    options: [
      { label: f0c(correct) + " psf", num: correct, correct: true },
      { label: f0c(t1) + " psf", num: t1, correct: false },
      { label: f0c(t2) + " psf", num: t2, correct: false },
      { label: f0c(t1 + 2 * t2) + " psf", num: t1 + 2 * t2, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-080 ---- */
reg(buildGenerator({
  baseId: "geotech-080", topic: "Geotechnical Engineering", subtopic: "Factor of safety against bearing capacity failure",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "FS = qu / (Q/B); the traps invert it, forget the footing width, or subtract 1.",
  videoUrl: null, videoTitle: null
}, function () {
  var B = pick([4, 5, 6]), qu = pick([9600, 10800, 12000]), Q = pick([14, 16, 18]);
  var applied = Q * 1000 / B;
  var correct = qu / applied;
  var question = "A strip footing " + B + " ft wide has an ultimate bearing capacity of " + qu.toLocaleString("en-US") + " psf. It carries a line load of " + Q + " kips per foot of footing length, as shown. Treating the pressure as uniform, what is the factor of safety against bearing capacity failure?";
  var solution = cGeotech("Retaining Walls, factor of safety against bearing capacity", 270, 276) + "\n\n$$q_{applied} = \\frac{Q}{B} = \\frac{" + (Q * 1000).toLocaleString("en-US") + "}{" + B + "} = " + f0c(applied) + "\\ \\text{psf}, \\quad FS = \\frac{q_u}{q_{applied}} = " + f2(correct) + "$$";
  return {
    variantKey: "B" + B + "_qu" + qu + "_Q" + Q,
    question: question, diagram: dFooting(B, 2),
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(1 / correct), num: 1 / correct, correct: false },
      { label: f2(qu / (Q * 1000)), num: qu / (Q * 1000), correct: false },
      { label: f2(correct - 1), num: correct - 1, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-081 ---- */
reg(buildGenerator({
  baseId: "geotech-081", topic: "Geotechnical Engineering", subtopic: "Ultimate bearing capacity with water table at the surface",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "With the water table at the ground surface, use buoyant unit weight in BOTH terms; the traps use \\(\\gamma_{sat}\\) throughout, in one term only, or swapped.",
  videoUrl: null, videoTitle: null
}, function () {
  var B = pick([4, 5, 6]), Df = pick([3, 4]), gsat = pick([120, 125, 130]);
  var pair = pick([[14.7, 15.0], [18.4, 22.4], [10.7, 10.9]]);
  var Nq = pair[0], Ng = pair[1];
  var gb = gsat - 62.4;
  var correct = gb * Df * Nq + 0.5 * gb * B * Ng;
  var tGsBoth = gsat * Df * Nq + 0.5 * gsat * B * Ng;
  var tGsDf = gsat * Df * Nq + 0.5 * gb * B * Ng;
  var tSwap = gb * Df * Nq + 0.5 * gsat * B * Ng;
  var question = "A strip footing has a base width of \\(B = " + B + "\\) ft, and the base bearing surface is \\(D_f = " + Df + "\\) ft below the ground surface in cohesionless soil (\\(c = 0\\)). The water table is at the ground surface and \\(\\gamma_{sat} = " + gsat + "\\) lb/ft\u00B3. For this soil \\(N_q = " + Nq + "\\) and \\(N_\\gamma = " + Ng + "\\). Using \\(\\gamma_w = 62.4\\) lb/ft\u00B3, what is the ultimate bearing capacity?";
  var solution = cGeotech("Ultimate Bearing Capacity", 270, 276) + "\n\n$$\\gamma' = \\gamma_{sat} - \\gamma_w = " + f1(gb) + "\\ \\text{lb/ft}^3, \\quad q_u = \\gamma' D_f N_q + \\tfrac{1}{2}\\gamma' B N_\\gamma = " + f0c(correct) + "\\ \\text{psf}$$";
  return {
    variantKey: "B" + B + "_D" + Df + "_g" + gsat + "_N" + Nq,
    question: question, diagram: dFooting(B, Df),
    options: [
      { label: f0c(correct) + " psf", num: correct, correct: true },
      { label: f0c(tGsBoth) + " psf", num: tGsBoth, correct: false },
      { label: f0c(tGsDf) + " psf", num: tGsDf, correct: false },
      { label: f0c(tSwap) + " psf", num: tSwap, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-082 ---- */
reg(buildGenerator({
  baseId: "geotech-082", topic: "Geotechnical Engineering", subtopic: "Ultimate bearing capacity, saturated clay (phi = 0)",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "For phi = 0, qu = c Nc + gamma Df; the traps drop the gamma Df term, multiply it by Nc, or use Nq = 2.",
  videoUrl: null, videoTitle: null
}, function () {
  var c = pick([1200, 1400, 1600]), g = pick([110, 115, 120]), Df = pick([4, 5, 6]);
  var correct = c * 5.7 + g * Df;
  var question = "A strip footing in saturated clay (\\(\\phi = 0\\)) has \\(c = " + c.toLocaleString("en-US") + "\\) psf and \\(\\gamma = " + g + "\\) lb/ft\u00B3. The base is " + Df + " ft below the ground surface and groundwater is deep. For \\(\\phi = 0\\), \\(N_c = 5.7\\), \\(N_q = 1.0\\) and \\(N_\\gamma = 0\\). What is the ultimate bearing capacity?";
  var solution = cGeotech("Ultimate Bearing Capacity", 270, 276) + "\n\n$$q_u = cN_c + \\gamma D_f N_q = (" + c.toLocaleString("en-US") + ")(5.7) + (" + g + ")(" + Df + ")(1.0) = " + f0c(correct) + "\\ \\text{psf}$$";
  return {
    variantKey: "c" + c + "_g" + g + "_D" + Df,
    question: question, diagram: dFooting(4, Df),
    options: [
      { label: f0c(correct) + " psf", num: correct, correct: true },
      { label: f0c(c * 5.7) + " psf", num: c * 5.7, correct: false },
      { label: f0c(c * 5.7 + g * Df * 5.7) + " psf", num: c * 5.7 + g * Df * 5.7, correct: false },
      { label: f0c(c * 5.7 + 2 * g * Df) + " psf", num: c * 5.7 + 2 * g * Df, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-083 ---- */
reg(buildGenerator({
  baseId: "geotech-083", topic: "Geotechnical Engineering", subtopic: "Compression index from liquid limit",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "Cc = 0.009(LL - 10); the traps forget the -10 or use the remolded/soil-specific coefficients.",
  videoUrl: null, videoTitle: null
}, function () {
  var LL = pick([45, 52, 60]);
  var correct = 0.009 * (LL - 10);
  var question = "A clay has a liquid limit of " + LL + ". Using the handbook correlation, what is the approximate compression index \\(C_C\\)?";
  var solution = cGeotech("Compression index", 267, 273) + "\n\n$$C_C = 0.009(LL - 10) = 0.009(" + LL + " - 10) = " + f3(correct) + "$$";
  return {
    variantKey: "LL" + LL,
    question: question,
    options: [
      { label: f3(correct), num: correct, correct: true },
      { label: f3(0.009 * LL), num: 0.009 * LL, correct: false },
      { label: f3(0.0015 * (LL - 10)), num: 0.0015 * (LL - 10), correct: false },
      { label: f3(0.007 * (LL - 10)), num: 0.007 * (LL - 10), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-084 ---- */
reg(buildGenerator({
  baseId: "geotech-084", topic: "Geotechnical Engineering", subtopic: "Recompression index from compression index",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "CR is about Cc/6; the traps multiply by 6 or divide by 3 or 10.",
  videoUrl: null, videoTitle: null
}, function () {
  var Cc = pick([0.30, 0.36, 0.42, 0.48]);
  var correct = Cc / 6;
  var question = "A clay has a compression index \\(C_C = " + Cc.toFixed(2) + "\\). Using the handbook correlation, what is the approximate recompression index \\(C_R\\)?";
  var solution = cGeotech("Recompression index", 267, 273) + "\n\n$$C_R \\approx \\frac{C_C}{6} = \\frac{" + Cc.toFixed(2) + "}{6} = " + f3(correct) + "$$";
  return {
    variantKey: "Cc" + Cc,
    question: question,
    options: [
      { label: f3(correct), num: correct, correct: true },
      { label: f2(6 * Cc), num: 6 * Cc, correct: false },
      { label: f3(Cc / 3), num: Cc / 3, correct: false },
      { label: f3(Cc / 10), num: Cc / 10, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-085 ---- */
reg(buildGenerator({
  baseId: "geotech-085", topic: "Geotechnical Engineering", subtopic: "Primary consolidation settlement, normally consolidated clay",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Sc = Cc H/(1+e0) log10(sf/s0); the traps use natural log, report feet, or multiply by (1+e0).",
  videoUrl: null, videoTitle: null
}, function () {
  var H = pick([8, 10, 12]), e0 = pick([0.85, 0.95, 1.05]), Cc = pick([0.25, 0.3, 0.35]), s0 = pick([1500, 1800]), sf = pick([2600, 3000]);
  var Hin = H * 12;
  var correct = Cc * Hin / (1 + e0) * (Math.log(sf / s0) / Math.LN10);
  var question = "A " + H + "-ft layer of normally consolidated clay has \\(e_0 = " + e0.toFixed(2) + "\\) and \\(C_C = " + Cc.toFixed(2) + "\\). At mid-depth the initial effective stress is " + s0.toLocaleString("en-US") + " psf and the load raises it to " + sf.toLocaleString("en-US") + " psf, as shown. Using the mid-depth stress for the whole layer, what is the primary consolidation settlement?";
  var solution = cGeotech("Settlement equations", 267, 273) + "\n\n$$S_C = \\frac{C_C H}{1 + e_0}\\log_{10}\\!\\frac{\\sigma'_f}{\\sigma'_0} = \\frac{(" + Cc.toFixed(2) + ")(" + Hin + "\\ \\text{in})}{1 + " + e0.toFixed(2) + "}\\log_{10}\\!\\frac{" + sf.toLocaleString("en-US") + "}{" + s0.toLocaleString("en-US") + "} = " + f1(correct) + "\\ \\text{in}$$";
  return {
    variantKey: "H" + H + "_e" + e0 + "_C" + Cc + "_" + s0 + "_" + sf,
    question: question, diagram: dClayLayer(H, s0, sf, "ft"),
    options: [
      { label: f1(correct) + " in", num: correct, correct: true },
      { label: f1(Cc * Hin / (1 + e0) * Math.log(sf / s0)) + " in", num: Cc * Hin / (1 + e0) * Math.log(sf / s0), correct: false },
      { label: f2(correct / 12) + " in", num: correct / 12, correct: false },
      { label: f1(Cc * Hin * (Math.log(sf / s0) / Math.LN10)) + " in", num: Cc * Hin * (Math.log(sf / s0) / Math.LN10), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-086 ---- */
reg(buildGenerator({
  baseId: "geotech-086", topic: "Geotechnical Engineering", subtopic: "Primary consolidation settlement, overconsolidated clay (final stress below preconsolidation)",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "With sf < preconsolidation stress the whole range uses CR = Cc/6; the traps use Cc, log to the preconsolidation stress, or report feet.",
  videoUrl: null, videoTitle: null
}, function () {
  var H = pick([8, 10]), e0 = pick([0.80, 0.90]), Cc = pick([0.30, 0.36]), s0 = pick([1800, 2000]), sc = pick([3500, 3800]), sf = pick([2800, 3000]);
  var CR = Cc / 6, Hin = H * 12;
  var lg = Math.log(sf / s0) / Math.LN10;
  var correct = CR * Hin / (1 + e0) * lg;
  var question = "An overconsolidated clay layer " + H + " ft thick has \\(e_0 = " + e0.toFixed(2) + "\\), \\(C_C = " + Cc.toFixed(2) + "\\), \\(\\sigma'_0 = " + s0.toLocaleString("en-US") + "\\) psf and a preconsolidation stress \\(\\sigma'_c = " + sc.toLocaleString("en-US") + "\\) psf. A new load raises the stress to \\(\\sigma'_f = " + sf.toLocaleString("en-US") + "\\) psf, as shown. Using \\(C_R = C_C/6\\), what is the primary consolidation settlement?";
  var solution = cGeotech("Settlement equations and Recompression index", 267, 273) + "\n\n$$\\sigma'_f < \\sigma'_c \\Rightarrow S_C = \\frac{C_R H}{1 + e_0}\\log_{10}\\!\\frac{\\sigma'_f}{\\sigma'_0} = \\frac{(" + f3(CR) + ")(" + Hin + "\\ \\text{in})}{" + (1 + e0).toFixed(2) + "}\\log_{10}\\!\\frac{" + sf.toLocaleString("en-US") + "}{" + s0.toLocaleString("en-US") + "} = " + f2(correct) + "\\ \\text{in}$$";
  return {
    variantKey: "H" + H + "_e" + e0 + "_C" + Cc + "_" + s0 + "_" + sc + "_" + sf,
    question: question, diagram: dClayLayer(H, s0, sf, "ft"),
    options: [
      { label: f2(correct) + " in", num: correct, correct: true },
      { label: f2(Cc * Hin / (1 + e0) * lg) + " in", num: Cc * Hin / (1 + e0) * lg, correct: false },
      { label: f2(CR * Hin / (1 + e0) * (Math.log(sc / s0) / Math.LN10)) + " in", num: CR * Hin / (1 + e0) * (Math.log(sc / s0) / Math.LN10), correct: false },
      { label: f3(correct / 12) + " in", num: correct / 12, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-087 ---- */
reg(buildGenerator({
  baseId: "geotech-087", topic: "Geotechnical Engineering", subtopic: "Primary consolidation settlement crossing the preconsolidation stress",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "Split the log range at the preconsolidation stress: CR below it, CC above it. Using one index for the whole range, or only one segment, gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var H = pick([5, 6]), e0 = pick([0.90, 1.00]), Cc = pick([0.40, 0.45]), s0 = pick([80, 90]), sc = pick([120, 140]), sf = pick([200, 240]);
  var CR = Cc / 6, Hmm = H * 1000;
  var l1 = Math.log(sc / s0) / Math.LN10, l2 = Math.log(sf / sc) / Math.LN10;
  var correct = Hmm / (1 + e0) * (CR * l1 + Cc * l2);
  var question = "A clay layer " + H + " m thick has \\(e_0 = " + e0.toFixed(2) + "\\), \\(C_C = " + Cc.toFixed(2) + "\\) and \\(C_R = " + f3(CR) + "\\). The initial effective stress is " + s0 + " kPa and the preconsolidation stress is " + sc + " kPa. A new load raises the effective stress to " + sf + " kPa. What is the primary consolidation settlement?";
  var solution = cGeotech("Settlement equations", 267, 273) + "\n\n$$S_C = \\frac{H}{1 + e_0}\\left[C_R\\log_{10}\\!\\frac{\\sigma'_c}{\\sigma'_0} + C_C\\log_{10}\\!\\frac{\\sigma'_f}{\\sigma'_c}\\right] = " + f0c(correct) + "\\ \\text{mm}$$";
  return {
    variantKey: "H" + H + "_e" + e0 + "_C" + Cc + "_" + s0 + "_" + sc + "_" + sf,
    question: question,
    options: [
      { label: f0c(correct) + " mm", num: correct, correct: true },
      { label: f0c(Hmm / (1 + e0) * Cc * (Math.log(sf / s0) / Math.LN10)) + " mm", num: Hmm / (1 + e0) * Cc * (Math.log(sf / s0) / Math.LN10), correct: false },
      { label: f0c(Hmm / (1 + e0) * Cc * l2) + " mm", num: Hmm / (1 + e0) * Cc * l2, correct: false },
      { label: f0c(Hmm / (1 + e0) * CR * (Math.log(sf / s0) / Math.LN10)) + " mm", num: Hmm / (1 + e0) * CR * (Math.log(sf / s0) / Math.LN10), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-088 ---- */
reg(buildGenerator({
  baseId: "geotech-088", topic: "Geotechnical Engineering", subtopic: "Time for a given degree of consolidation, double drainage",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "t = Tv (H/2)^2 / cv with Tv from the handbook table; the traps use the full layer thickness, the 90% time factor, or skip dividing by cv.",
  videoUrl: null, videoTitle: null
}, function () {
  var H = pick([6, 8, 10]), cv = pick([2.5, 3.0, 3.5]);
  var upair = pick([[50, 0.197], [62, 0.307], [70, 0.403]]);
  var U = upair[0], Tv = upair[1];
  var correct = Tv * Math.pow(H / 2, 2) / cv;
  var question = "A " + H + "-m clay layer drains at both its top and bottom, as shown. Its coefficient of consolidation is \\(c_v = " + cv.toFixed(1) + "\\) m\u00B2/year. How long does it take to reach " + U + "% average consolidation? Use the handbook time-factor table.";
  var solution = cGeotech("Variation of time factor with degree of consolidation", 268, 274) + "\n\n$$T_v = " + Tv.toFixed(3) + " \\text{ at } U = " + U + "\\%, \\quad t = \\frac{T_v (H/2)^2}{c_v} = \\frac{(" + Tv.toFixed(3) + ")(" + f1(H / 2) + ")^2}{" + cv.toFixed(1) + "} = " + f2(correct) + "\\ \\text{years}$$";
  return {
    variantKey: "H" + H + "_cv" + cv + "_U" + U,
    question: question, diagram: dDoubleDrain(H, cv),
    options: [
      { label: f2(correct) + " years", num: correct, correct: true },
      { label: f2(Tv * H * H / cv) + " years", num: Tv * H * H / cv, correct: false },
      { label: f2(0.848 * Math.pow(H / 2, 2) / cv) + " years", num: 0.848 * Math.pow(H / 2, 2) / cv, correct: false },
      { label: f2(Tv * Math.pow(H / 2, 2)) + " years", num: Tv * Math.pow(H / 2, 2), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-089 ---- */
reg(buildGenerator({
  baseId: "geotech-089", topic: "Geotechnical Engineering", subtopic: "Settlement at a given degree of consolidation",
  difficulty: "easy", estimatedTimeSeconds: 45,
  explanation: "\\(S(t) = U \\times S_{ultimate}\\); the traps divide by \\(U\\), use the remaining percentage, or shift a decimal.",
  videoUrl: null, videoTitle: null
}, function () {
  var U = pick([50, 62, 70]), Sult = pick([200, 240, 300]);
  var correct = U / 100 * Sult;
  var question = "The ultimate consolidation settlement of a clay layer is " + Sult + " mm. What is the approximate settlement when the average degree of consolidation is " + U + "%?";
  var solution = cGeotech("Approximate settlement (at time t = tC)", 267, 273) + "\n\n$$S = U \\times S_{ult} = 0." + U + " \\times " + Sult + " = " + f1(correct) + "\\ \\text{mm}$$";
  return {
    variantKey: "U" + U + "_S" + Sult,
    question: question,
    options: [
      { label: f1(correct) + " mm", num: correct, correct: true },
      { label: f1(Sult / (U / 100)) + " mm", num: Sult / (U / 100), correct: false },
      { label: f1((1 - U / 100) * Sult) + " mm", num: (1 - U / 100) * Sult, correct: false },
      { label: f0c(correct * 10) + " mm", num: correct * 10, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-090 ---- */
reg(buildGenerator({
  baseId: "geotech-090", topic: "Geotechnical Engineering", subtopic: "Ultimate consolidation settlement from void ratio change",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "S = H de/(1+e0); the traps skip the (1+e0) divisor, divide by e0 only, or drop H.",
  videoUrl: null, videoTitle: null
}, function () {
  var H = pick([4.0, 5.0, 6.0]), e0 = pick([0.85, 0.95]), de = pick([0.12, 0.15]);
  var correct = 1000 * H * de / (1 + e0);
  var question = "A " + H.toFixed(1) + "-m clay layer has an initial void ratio of " + e0.toFixed(2) + ". Loading changes the void ratio by a total of " + de.toFixed(2) + " (recompression plus virgin compression). What is the ultimate consolidation settlement?";
  var solution = cGeotech("Ultimate consolidation settlement in soil layer", 267, 273) + "\n\n$$S = \\frac{H\\, \\Delta e}{1 + e_0} = \\frac{(" + f0c(1000 * H) + "\\ \\text{mm})(" + de.toFixed(2) + ")}{1 + " + e0.toFixed(2) + "} = " + f0c(correct) + "\\ \\text{mm}$$";
  return {
    variantKey: "H" + H + "_e" + e0 + "_d" + de,
    question: question,
    options: [
      { label: f0c(correct) + " mm", num: correct, correct: true },
      { label: f0c(1000 * H * de) + " mm", num: 1000 * H * de, correct: false },
      { label: f0c(1000 * de / (1 + e0)) + " mm", num: 1000 * de / (1 + e0), correct: false },
      { label: f0c(1000 * H * de / e0) + " mm", num: 1000 * H * de / e0, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-091 ---- */
reg(buildGenerator({
  baseId: "geotech-091", topic: "Geotechnical Engineering", subtopic: "Planar slope failure factor of safety (US units)",
  difficulty: "hard", estimatedTimeSeconds: 150,
  explanation: "FS = (c L + W cos a tan phi)/(W sin a); the traps invert the ratio, use cohesion alone, or use tan phi/tan alpha.",
  videoUrl: null, videoTitle: null
}, function () {
  var W = pick([10000, 12000, 14000]), alpha = pick([22, 25, 28]), L = pick([25, 30, 35]), c = pick([200, 250, 300]), phi = pick([20, 24, 28]);
  var correct = (c * L + W * Math.cos(deg(alpha)) * Math.tan(deg(phi))) / (W * Math.sin(deg(alpha)));
  var question = "A soil wedge above an assumed planar slip surface weighs \\(W_M = " + W.toLocaleString("en-US") + "\\) lb per foot measured perpendicular to the page (out-of-plane width), not along the slope. The slip surface is inclined at \\(\\alpha_S = " + alpha + "^\\circ\\) to the horizontal and is \\(L_S = " + L + "\\) ft long, as shown. The soil has \\(c = " + c + "\\) psf and \\(\\phi = " + phi + "^\\circ\\). What is the factor of safety against slope instability?";
  var solution = cGeotech("slope failure along a planar surface", 271, 277) + "\n\n$$FS = \\frac{c L_S + W_M\\cos\\alpha_S\\tan\\phi}{W_M\\sin\\alpha_S} = \\frac{(" + c + ")(" + L + ") + (" + W.toLocaleString("en-US") + ")\\cos " + alpha + "^\\circ \\tan " + phi + "^\\circ}{(" + W.toLocaleString("en-US") + ")\\sin " + alpha + "^\\circ} = " + f2(correct) + "$$";
  return {
    variantKey: "W" + W + "_a" + alpha + "_L" + L + "_c" + c + "_p" + phi,
    question: question, diagram: dSlope(alpha, W, L, "lb/ft"),
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(1 / correct), num: 1 / correct, correct: false },
      { label: f2(c * L / (W * Math.sin(deg(alpha)))), num: c * L / (W * Math.sin(deg(alpha))), correct: false },
      { label: f2(Math.tan(deg(phi)) / Math.tan(deg(alpha))), num: Math.tan(deg(phi)) / Math.tan(deg(alpha)), correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-092 ---- */
reg(buildGenerator({
  baseId: "geotech-092", topic: "Geotechnical Engineering", subtopic: "Planar slope failure factor of safety (SI units)",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Same planar-slip equation in SI; the traps invert it or use only one resisting term.",
  videoUrl: null, videoTitle: null
}, function () {
  var W = pick([900, 1000, 1100]), alpha = pick([28, 30, 32]), L = pick([15, 18, 21]), c = pick([10, 12, 14]), phi = pick([18, 20, 22]);
  var coh = c * L, fric = W * Math.cos(deg(alpha)) * Math.tan(deg(phi)), drive = W * Math.sin(deg(alpha));
  var correct = (coh + fric) / drive;
  var question = "For a planar slip surface, \\(W_M = " + W.toLocaleString("en-US") + "\\) kN/m, \\(\\alpha_S = " + alpha + "^\\circ\\), \\(L_S = " + L + "\\) m, \\(c = " + c + "\\) kPa and \\(\\phi = " + phi + "^\\circ\\), as shown. What is the factor of safety?";
  var solution = cGeotech("slope failure along a planar surface", 271, 277) + "\n\n$$FS = \\frac{c L_S + W_M\\cos\\alpha_S\\tan\\phi}{W_M\\sin\\alpha_S} = \\frac{" + f1(coh) + " + " + f1(fric) + "}{" + f1(drive) + "} = " + f2(correct) + "$$";
  return {
    variantKey: "W" + W + "_a" + alpha + "_L" + L + "_c" + c + "_p" + phi,
    question: question, diagram: dSlope(alpha, W, L, "kN/m"),
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(drive / (coh + fric)), num: drive / (coh + fric), correct: false },
      { label: f2(coh / drive), num: coh / drive, correct: false },
      { label: f2(fric / drive), num: fric / drive, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-093 ---- */
reg(buildGenerator({
  baseId: "geotech-093", topic: "Geotechnical Engineering", subtopic: "Dry cohesionless slope factor of safety",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "For c = 0, FS = tan phi / tan alpha; the traps invert it or use sin or the angle ratio.",
  videoUrl: null, videoTitle: null
}, function () {
  var pair = pick([[24, 32], [26, 34], [28, 36], [22, 30]]);
  var alpha = pair[0], phi = pair[1];
  var correct = Math.tan(deg(phi)) / Math.tan(deg(alpha));
  var question = "A dry, cohesionless sand slope (\\(c = 0\\)) is analyzed for sliding along a planar surface at \\(\\alpha_S = " + alpha + "^\\circ\\), as shown. The friction angle is \\(\\phi = " + phi + "^\\circ\\). What is the factor of safety?";
  var solution = cGeotech("slope failure along a planar surface", 271, 277) + "\n\n$$c = 0 \\Rightarrow FS = \\frac{\\tan\\phi}{\\tan\\alpha_S} = \\frac{\\tan " + phi + "^\\circ}{\\tan " + alpha + "^\\circ} = " + f2(correct) + "$$";
  return {
    variantKey: "a" + alpha + "_p" + phi,
    question: question, diagram: dSlope(alpha, null, null, ""),
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(Math.tan(deg(alpha)) / Math.tan(deg(phi))), num: Math.tan(deg(alpha)) / Math.tan(deg(phi)), correct: false },
      { label: f2(Math.sin(deg(phi)) / Math.sin(deg(alpha))), num: Math.sin(deg(phi)) / Math.sin(deg(alpha)), correct: false },
      { label: f2(phi / alpha), num: phi / alpha, correct: false }
    ],
    solution: solution
  };
}));

/* ---- geotech-094 ---- */
reg(buildGenerator({
  baseId: "geotech-094", topic: "Geotechnical Engineering", subtopic: "Mobilized shear force along a planar slip surface",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "T = W sin alpha; the traps report W, the normal force W cos alpha, or W tan alpha.",
  videoUrl: null, videoTitle: null
}, function () {
  var W = pick([12000, 15000, 18000]), alpha = pick([18, 20, 22]);
  var correct = W * Math.sin(deg(alpha));
  var question = "A soil mass weighing " + W.toLocaleString("en-US") + " lb per foot of slope sits on a planar slip surface inclined at " + alpha + "\u00B0 to the horizontal, as shown. What is the mobilized shear force along the slip surface?";
  var solution = cGeotech("slope failure along a planar surface", 271, 277) + "\n\n$$T = W\\sin\\alpha_S = (" + W.toLocaleString("en-US") + ")\\sin " + alpha + "^\\circ = " + f0c(correct) + "\\ \\text{lb/ft}$$";
  return {
    variantKey: "W" + W + "_a" + alpha,
    question: question, diagram: dSlope(alpha, W, null, "lb/ft"),
    options: [
      { label: f0c(correct) + " lb/ft", num: correct, correct: true },
      { label: f0c(W) + " lb/ft", num: W, correct: false },
      { label: f0c(W * Math.cos(deg(alpha))) + " lb/ft", num: W * Math.cos(deg(alpha)), correct: false },
      { label: f0c(W * Math.tan(deg(alpha))) + " lb/ft", num: W * Math.tan(deg(alpha)), correct: false }
    ],
    solution: solution
  };
}));

  window.GEOTECH_GENERATORS = GEO_ENTRIES;
})();
