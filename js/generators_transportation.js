/* PassTheFE randomized practice — Transportation Engineering generators.
 *
 * Plain script (no modules) for the static site. Defines window.TRANSPORTATION_GENERATORS:
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
  
  
var CITE_T = {
"transportation-035": "Source: FHWA MUTCD, 11th Edition with Revision 1 (December 2025), the current edition on the FHWA site. The MUTCD is not part of the FE Reference Handbook, so the needed table values are given in the question. This is supplemental practice on MUTCD content, not a handbook-based item.",
"transportation-036": "Source: FHWA MUTCD, 11th Edition with Revision 1 (December 2025), the current edition on the FHWA site. The MUTCD is not part of the FE Reference Handbook, so the needed table values are given in the question. This is supplemental practice on MUTCD content, not a handbook-based item.",
"transportation-037": "Source: FHWA MUTCD, 11th Edition with Revision 1 (December 2025), the current edition on the FHWA site. The MUTCD is not part of the FE Reference Handbook, so the needed table values are given in the question. This is supplemental practice on MUTCD content, not a handbook-based item.",
"transportation-038": "Source: FHWA MUTCD, 11th Edition with Revision 1 (December 2025), the current edition on the FHWA site. The MUTCD is not part of the FE Reference Handbook, so the needed table values are given in the question. This is supplemental practice on MUTCD content, not a handbook-based item.",
"transportation-042": "Source for the method: TxDOT Traffic Safety/Design manual, Chapter 16, Section 16.4 Analysis Methodology (https://www.txdot.gov/content/txdotoms/us/en/manuals/des/tsp/chapter-16-traffic-impact-analysis-/16-4-analysis-methodology.html): trips are generated from average rates or a fitted-curve equation for an independent variable, and a pass-by percentage is applied to the vehicle trips generated minus any internal capture. The rates and equation values in this question are assumed for practice and are not from the ITE Trip Generation Manual (paywalled). Supplemental practice, not handbook-based.",
"transportation-043": "Source for the method: TxDOT Traffic Safety/Design manual, Chapter 16, Section 16.4 Analysis Methodology (https://www.txdot.gov/content/txdotoms/us/en/manuals/des/tsp/chapter-16-traffic-impact-analysis-/16-4-analysis-methodology.html): trips are generated from average rates or a fitted-curve equation for an independent variable, and a pass-by percentage is applied to the vehicle trips generated minus any internal capture. The rates and equation values in this question are assumed for practice and are not from the ITE Trip Generation Manual (paywalled). Supplemental practice, not handbook-based.",
"transportation-044": "Source for the method: TxDOT Traffic Safety/Design manual, Chapter 16, Section 16.4 Analysis Methodology (https://www.txdot.gov/content/txdotoms/us/en/manuals/des/tsp/chapter-16-traffic-impact-analysis-/16-4-analysis-methodology.html): trips are generated from average rates or a fitted-curve equation for an independent variable, and a pass-by percentage is applied to the vehicle trips generated minus any internal capture. The rates and equation values in this question are assumed for practice and are not from the ITE Trip Generation Manual (paywalled). Supplemental practice, not handbook-based.",
"transportation-045": "Refer to Traffic Signal Timing in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 306 (PDF page 312).",
"transportation-046": "Refer to Traffic Signal Timing in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 306 (PDF page 312).",
"transportation-047": "Refer to Traffic Signal Timing in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 306 (PDF page 312).",
"transportation-048": "Refer to Stopping Sight Distance in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 306 (PDF page 312).",
"transportation-049": "Refer to Stopping Sight Distance in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 306 (PDF page 312).",
"transportation-050": "Refer to Stopping Sight Distance (ISD) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 306 (PDF page 312).",
"transportation-051": "Refer to Peak Hour Factor in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 306 (PDF page 312).",
"transportation-052": "Refer to Vertical Curves: Sight Distance Related to Curve Length in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 308 (PDF page 314).",
"transportation-053": "Refer to Vertical Curves: Sight Distance Related to Curve Length in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 308 (PDF page 314).",
"transportation-054": "Refer to Sag Vertical Curve (based on standard headlight criteria) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 308 (PDF page 314).",
"transportation-055": "Refer to Sag Vertical Curve (based on riding comfort) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 308 (PDF page 314).",
"transportation-056": "Refer to Vertical Curves in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 307 (PDF page 313).",
"transportation-057": "Refer to Vertical Curves in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 307 (PDF page 313).",
"transportation-058": "Refer to Horizontal Curves in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 308 (PDF page 314).",
"transportation-059": "Refer to Horizontal Curves in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 308 (PDF page 314).",
"transportation-060": "Refer to Horizontal Curves in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 309 (PDF page 315).",
"transportation-061": "Refer to Horizontal Curves in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 308 (PDF page 314).",
"transportation-062": "Refer to Horizontal Curves (side friction factor) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 309 (PDF page 315).",
"transportation-063": "Refer to Spiral Transition Length in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 309 (PDF page 315).",
"transportation-064": "Refer to Sight Distance (to see around obstruction) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 309 (PDF page 315).",
"transportation-065": "Refer to Basic Freeway Segment Highway Capacity in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 310 (PDF page 316).",
"transportation-066": "Refer to Basic Freeway Segment Highway Capacity in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 310 (PDF page 316).",
"transportation-067": "Refer to Basic Freeway Segment Highway Capacity in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 310 (PDF page 316).",
"transportation-068": "Refer to Basic Freeway Segment Highway Capacity in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 311 (PDF page 317).",
"transportation-069": "Refer to Basic Freeway Segment Highway Capacity in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 311 (PDF page 317).",
"transportation-070": "Refer to Traffic Flow Relationships (Greenshields Model) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 312 (PDF page 318).",
"transportation-071": "Refer to Traffic Flow Relationships (Greenshields Model) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 312 (PDF page 318).",
"transportation-072": "Refer to Traffic Flow Relationships (Greenshields Model) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 312 (PDF page 318).",
"transportation-073": "Refer to Traffic Safety Equations (Crash Rates at Intersections) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 313 (PDF page 319).",
"transportation-074": "Refer to Traffic Safety Equations (Crash Rates for Roadway Segments) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 313 (PDF page 319).",
"transportation-075": "Refer to Crash Reduction in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 313 (PDF page 319).",
"transportation-076": "Refer to Gravity Model in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 312 (PDF page 318).",
"transportation-077": "Refer to Logit Models in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 313 (PDF page 319).",
"transportation-078": "Refer to Highway Pavement Design (AASHTO Structural Number Equation) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 314 (PDF page 320).",
"transportation-079": "Refer to Highway Pavement Design (Load Equivalency Factors) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 314 (PDF page 320).",
"transportation-080": "Refer to Highway Pavement Design (Load Equivalency Factors) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 314 (PDF page 320).",
"transportation-081": "Refer to Highway Pavement Design (AASHTO Structural Number Equation) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 314 (PDF page 320).",
"transportation-082": "Refer to Highway Pavement Design (AASHTO Structural Number Equation) in the Civil Engineering: Transportation section of the FE Reference Handbook (v10.6), printed page 314 (PDF page 320)."
};


function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
function f1(x) { return (Math.round(x * 10) / 10).toFixed(1); }
function f3(x) { return (Math.round(x * 1000) / 1000).toFixed(3); }
function f0c(x) { return Math.round(x).toLocaleString("en-US"); }
function bankNum(x) {
  var r1 = Math.round(x * 10) / 10;
  if (Math.abs(r1 - Math.round(r1)) < 1e-9) return Math.round(r1).toLocaleString("en-US");
  return r1.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/* ================= transportation batch 1: 035-055 ================= */

function dTaper(taperType, W, S) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Work zone taper, ' + taperType + ', lane offset W = ' + W + ' feet, posted speed S = ' + S + ' mph"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<rect x="40" y="60" width="400" height="120" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="40" y1="120" x2="440" y2="120" stroke="#1a1a1a" stroke-width="1.5" stroke-dasharray="10,8"/>';
  s += '<polygon points="120,120 200,60 260,60 180,120" fill="#fbbf24" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="150" y="95" font-family="Helvetica,Arial,sans-serif" font-size="11">closed lane</text>';
  s += '<path d="M 60 150 L 340 150 L 430 90" fill="none" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="70" y="170" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#1d4ed8">traffic</text>';
  s += '<line x1="200" y1="45" x2="260" y2="45" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="212" y="38" font-family="Helvetica,Arial,sans-serif" font-size="11">W = offset</text>';
  s += '<line x1="340" y1="195" x2="430" y2="195" stroke="#c0392b" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="330" y="215" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">taper length L = ?</text>';
  s += '<text x="45" y="215" font-family="Helvetica,Arial,sans-serif" font-size="12">S = ' + S + ' mph</text>';
  s += '<text x="45" y="30" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">' + taperType + ' taper</text>';
  return svgURL(s + '</svg>');
}
function dYellow(v, t, a) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180" viewBox="0 0 480 180" role="img" aria-label="Signalized approach, speed ' + v + ' mph, reaction time ' + t + ' seconds, deceleration ' + a + ' feet per second squared, level grade"><rect width="480" height="180" fill="#ffffff"/>' + AH;
  s += '<rect x="40" y="110" width="400" height="30" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="300" y1="60" x2="300" y2="140" stroke="#1a1a1a" stroke-width="4"/>';
  s += '<circle cx="300" cy="45" r="14" fill="#fbbf24" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="322" y="50" font-family="Helvetica,Arial,sans-serif" font-size="12">stop line</text>';
  s += '<line x1="80" y1="125" x2="240" y2="125" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="85" y="105" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">v = ' + v + ' mph (' + (1.47 * v).toFixed(2) + ' ft/s)</text>';
  s += '<text x="60" y="165" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">reaction time ' + t + ' s, deceleration ' + a + ' ft/s\u00B2, level grade</text>';
  return svgURL(s + '</svg>');
}
function dRedClear(W, l, v) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220" role="img" aria-label="Intersection ' + W + ' feet wide curb to curb, design vehicle ' + l + ' feet long, approach speed ' + v + ' feet per second"><rect width="480" height="220" fill="#ffffff"/>' + AH;
  s += '<rect x="140" y="40" width="200" height="140" fill="#e5e7eb" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<rect x="180" y="90" width="120" height="40" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="60" y1="150" x2="180" y2="115" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<rect x="150" y="100" width="34" height="18" fill="#9ca3af" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="146" y="90" font-family="Helvetica,Arial,sans-serif" font-size="11">vehicle ' + l + ' ft</text>';
  s += '<line x1="140" y1="200" x2="340" y2="200" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="190" y="215" font-family="Helvetica,Arial,sans-serif" font-size="12">' + W + ' ft crossing</text>';
  s += '<text x="40" y="180" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">approach speed ' + v + ' ft/s</text>';
  return svgURL(s + '</svg>');
}
function dISD(V, gap) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220" role="img" aria-label="Minor road driver needs a time gap of ' + gap + ' seconds to enter; major road design speed ' + V + ' mph"><rect width="480" height="220" fill="#ffffff"/>' + AH;
  s += '<rect x="40" y="90" width="400" height="50" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<rect x="215" y="140" width="50" height="70" fill="#e5e7eb" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<line x1="70" y1="115" x2="200" y2="115" stroke="#1d4ed8" stroke-width="3" marker-end="url(#ah)"/>';
  s += '<text x="60" y="105" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">' + V + ' mph</text>';
  s += '<circle cx="240" cy="195" r="10" fill="#9ca3af" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="258" y="200" font-family="Helvetica,Arial,sans-serif" font-size="11">minor-road driver</text>';
  s += '<line x1="240" y1="185" x2="240" y2="145" stroke="#c0392b" stroke-width="2" stroke-dasharray="5,4" marker-end="url(#ah)"/>';
  s += '<line x1="200" y1="70" x2="380" y2="70" stroke="#c0392b" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="235" y="62" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">sight distance = ?</text>';
  s += '<text x="60" y="45" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">required time gap ' + gap + ' s</text>';
  return svgURL(s + '</svg>');
}
function dCrest(g1, g2, S, cond) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Crest vertical curve, grades ' + g1 + ' percent and ' + g2 + ' percent, sight distance ' + S + ' feet, ' + cond + '"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<path d="M 50 170 L 240 70 L 430 170" fill="none" stroke="#6b7280" stroke-width="2" stroke-dasharray="6,4"/>';
  s += '<path d="M 50 170 Q 240 40 430 170" fill="none" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<circle cx="240" cy="70" r="4" fill="#c0392b"/><text x="250" y="66" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">PVI</text>';
  s += '<text x="60" y="155" font-family="Helvetica,Arial,sans-serif" font-size="12">' + (g1 > 0 ? "+" : "") + g1 + '%</text>';
  s += '<text x="395" y="155" font-family="Helvetica,Arial,sans-serif" font-size="12">' + (g2 > 0 ? "+" : "\u2212") + Math.abs(g2) + '%</text>';
  s += '<line x1="120" y1="200" x2="360" y2="200" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="225" y="218" font-family="Helvetica,Arial,sans-serif" font-size="12">L = ?</text>';
  s += '<text x="50" y="30" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">S = ' + S + ' ft (' + cond + '), eye 3.50 ft, object 2.0 ft</text>';
  return svgURL(s + '</svg>');
}
function dVertGeom(g1, g2, L, elev) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Crest vertical curve, g1 = plus ' + g1 + ' percent, g2 = minus ' + Math.abs(g2) + ' percent, length ' + L + ' feet, PVC elevation ' + elev + ' feet"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<path d="M 60 170 L 240 75 L 420 170" fill="none" stroke="#6b7280" stroke-width="2" stroke-dasharray="6,4"/>';
  s += '<path d="M 60 170 Q 240 45 420 170" fill="none" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<circle cx="60" cy="170" r="4" fill="#1d4ed8"/><text x="45" y="190" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">PVC</text>';
  s += '<circle cx="240" cy="75" r="4" fill="#c0392b"/><text x="250" y="71" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">PVI</text>';
  s += '<circle cx="420" cy="170" r="4" fill="#1d4ed8"/><text x="395" y="190" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">PVT</text>';
  s += '<text x="90" y="120" font-family="Helvetica,Arial,sans-serif" font-size="12">g\u2081 = +' + g1 + '%</text>';
  s += '<text x="330" y="120" font-family="Helvetica,Arial,sans-serif" font-size="12">g\u2082 = \u2212' + Math.abs(g2) + '%</text>';
  s += '<text x="200" y="218" font-family="Helvetica,Arial,sans-serif" font-size="12">L = ' + L + ' ft</text>';
  s += '<text x="50" y="30" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">PVC elevation = ' + elev + ' ft</text>';
  return svgURL(s + '</svg>');
}

var TRANSPORT_ENTRIES = [];
function treg(meta, roll) { TRANSPORT_ENTRIES.push(buildGenerator(meta, roll)); }
function CT(id) { return CITE_T[id]; }

/* ---- 035-038: MUTCD work zone tapers ---- */
[["transportation-035", "merging", 1.0, [25, 30, 35, 40], "low"],
 ["transportation-036", "merging", 1.0, [45, 50, 55, 60], "high"],
 ["transportation-037", "shifting", 0.5, [45, 50, 55], "high"],
 ["transportation-038", "shoulder", 0.33, [30, 35, 40], "low"]].forEach(function (cfg) {
  var id = cfg[0], ttype = cfg[1], fac = cfg[2], speeds = cfg[3];
  treg({
    baseId: id, topic: "Transportation Engineering", subtopic: "Work zone " + ttype + " taper length",
    difficulty: "easy", estimatedTimeSeconds: 90,
    explanation: "MUTCD Table 6B-4: L = WS^2/60 for S of 40 mph or less, L = WS for 45 mph or more. Table 6B-3: a " + ttype + " taper is at least " + (fac === 1 ? "L" : fac + " L") + ".",
    videoUrl: null, videoTitle: null
  }, function () {
    var S = pick(speeds), W = pick([10, 11, 12]);
    var L = S <= 40 ? W * S * S / 60 : W * S;
    var correct = fac * L;
    var otherL = S <= 40 ? W * S : W * S * S / 60;
    var question = (ttype === "merging" ? "A lane closure on a road with a posted speed of " + S + " mph requires a merging taper across a lane offset of " + W + " ft. What merging taper length equals L? (Table 6B-3 gives a merging taper as at least L.)" : ttype === "shifting" ? "A temporary lane shift on a road with a posted speed of " + S + " mph moves traffic laterally " + W + " ft. Table 6B-3 gives a shifting taper as at least 0.5 L. What is the minimum shifting taper length?" : "A closed shoulder " + W + " ft wide is tapered on a road with a posted speed of " + S + " mph. Table 6B-3 gives a shoulder taper as at least 0.33 L. What is the minimum shoulder taper length?") + " MUTCD Table 6B-4 gives the taper length L in feet as L = WS\\(^2\\)/60 for S of 40 mph or less and L = WS for S of 45 mph or more, where W is the offset width in feet and S is the posted speed in mph.";
    var solution = CT(id) + "\n\n$$L = " + (S <= 40 ? "\\frac{WS^2}{60} = \\frac{(" + W + ")(" + S + ")^2}{60} = " + f1(L) : "WS = (" + W + ")(" + S + ") = " + f1(L)) + "\\ \\text{ft}, \\quad \\text{taper} = " + (fac === 1 ? "L" : fac + "L") + " = " + bankNum(correct) + "\\ \\text{ft}$$";
    return { variantKey: "S" + S + "_W" + W, question: question, diagram: dTaper(ttype, W, S),
      options: [
        { label: bankNum(correct) + " ft", num: correct, correct: true },
        { label: bankNum(fac === 1 ? otherL : L) + " ft", num: fac === 1 ? otherL : L, correct: false },
        { label: bankNum(fac === 1 ? 0.5 * L : otherL) + " ft", num: fac === 1 ? 0.5 * L : otherL, correct: false },
        { label: bankNum((fac === 0.33 ? 0.5 : 0.33) * L) + " ft", num: (fac === 0.33 ? 0.5 : 0.33) * L, correct: false }
      ], solution: solution };
  });
});

/* ---- 042-044: trip generation ---- */
treg({
  baseId: "transportation-042", topic: "Transportation Engineering", subtopic: "Trip generation (average rate)",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Trips = rate x independent variable, with the floor area in thousands of square feet. Using the area in square feet, dividing, or doubling gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var rate = pick([3.0, 3.5, 4.0]), areaK = pick([100, 120, 150]);
  var correct = rate * areaK;
  var question = "A proposed retail building has " + (areaK * 1000).toLocaleString("en-US") + " square feet of floor area. For this problem, assume the average weekday PM peak hour rate is " + rate + " vehicle trips per 1,000 square feet. How many PM peak hour vehicle trips does the building generate?";
  var solution = CT("transportation-042") + "\n\n$$T = (" + rate + "\\ \\text{trips per 1,000 sf})\\left(\\frac{" + (areaK * 1000).toLocaleString("en-US") + "\\ \\text{sf}}{1{,}000}\\right) = " + f0c(correct) + "\\ \\text{trips}$$";
  return { variantKey: "r" + rate + "_a" + areaK, question: question,
    options: [
      { label: f0c(correct) + " trips", num: correct, correct: true },
      { label: f0c(correct * 1000) + " trips", num: correct * 1000, correct: false },
      { label: f0c(areaK / rate) + " trips", num: areaK / rate, correct: false },
      { label: f0c(correct * 2) + " trips", num: correct * 2, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-043", topic: "Transportation Engineering", subtopic: "Trip generation (fitted curve)",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Evaluate ln(T) = 0.8 ln(X) + 1.2, then take the exponential. Reporting ln(T) itself or treating the equation as linear gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var X = pick([200, 250, 300]);
  var lnT = 0.8 * Math.log(X) + 1.2;
  var correct = Math.exp(lnT);
  var question = "A residential development has " + X + " dwelling units. For this problem, assume the fitted-curve equation for daily vehicle trips is \\(\\ln(T) = 0.8\\ln(X) + 1.2\\), where \\(T\\) is the number of trips and \\(X\\) is the number of dwelling units. How many daily vehicle trips does the development generate?";
  var solution = CT("transportation-043") + "\n\n$$\\ln(T) = 0.8\\ln(" + X + ") + 1.2 = " + lnT.toFixed(3) + " \\Rightarrow T = e^{" + lnT.toFixed(3) + "} = " + f0c(correct) + "\\ \\text{trips}$$";
  return { variantKey: "X" + X, question: question,
    options: [
      { label: f0c(correct) + " trips", num: correct, correct: true },
      { label: lnT.toFixed(1) + " trips", num: lnT, correct: false },
      { label: f0c(0.8 * X + 1.2) + " trips", num: 0.8 * X + 1.2, correct: false },
      { label: f0c(Math.exp(0.8 * Math.log(X) * 1.2)) + " trips", num: Math.exp(0.8 * Math.log(X) * 1.2), correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-044", topic: "Transportation Engineering", subtopic: "Trip generation (internal capture and pass-by)",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Internal capture removes its trips first; the pass-by percentage applies to the remainder. Subtracting both percentages from the original total or ignoring internal capture gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var T = pick([800, 1000, 1200]), ic = pick([10, 15]), pb = pick([20, 25]);
  var ext = T * (1 - ic / 100);
  var correct = ext * (1 - pb / 100);
  var question = "A development generates " + T.toLocaleString("en-US") + " vehicle trips in the peak hour. For this problem, assume " + ic + "% of the trips are internal capture, and the pass-by percentage is " + pb + "% of the vehicle trips generated minus the internal capture. How many new (primary) trips does the development add to the adjacent streets?";
  var solution = CT("transportation-044") + "\n\n$$\\text{External} = " + f0c(T) + "(1 - " + (ic / 100) + ") = " + f0c(ext) + ", \\quad \\text{pass-by} = " + (pb / 100) + "(" + f0c(ext) + ") = " + f0c(ext * pb / 100) + "$$\n$$\\text{New trips} = " + f0c(ext) + " - " + f0c(ext * pb / 100) + " = " + f0c(correct) + "$$";
  return { variantKey: "T" + T + "_ic" + ic + "_pb" + pb, question: question,
    options: [
      { label: f0c(correct) + " trips", num: correct, correct: true },
      { label: f0c(T * (1 - ic / 100 - pb / 100)) + " trips", num: T * (1 - ic / 100 - pb / 100), correct: false },
      { label: f0c(T * (1 - pb / 100)) + " trips", num: T * (1 - pb / 100), correct: false },
      { label: f0c(ext * pb / 100) + " trips", num: ext * pb / 100, correct: false }
    ], solution: solution };
});

/* ---- 045-047: signal timing ---- */
treg({
  baseId: "transportation-045", topic: "Transportation Engineering", subtopic: "Yellow change interval",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "y = t + v/(2a) on level grade. Dropping the factor 2 on the deceleration or leaving out the reaction time gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var mph = pick([35, 45, 55]), t = 1.0, a = 10;
  var v = 1.47 * mph;
  var correct = t + v / (2 * a);
  var question = "A signalized intersection has an approach speed of " + mph + " mph (" + v.toFixed(2) + " ft/s) on a level grade. Use a driver reaction time of 1.0 s and a deceleration of 10 ft/s\\(^2\\). Using the handbook equation, what is the yellow interval to the nearest 0.1 s?";
  var solution = CT("transportation-045") + "\n\n$$y = t + \\frac{v}{2a} = 1.0 + \\frac{" + v.toFixed(2) + "}{2(10)} = " + f1(correct) + "\\ \\text{s}$$";
  return { variantKey: "v" + mph, question: question, diagram: dYellow(mph, t, a),
    options: [
      { label: f1(correct) + " s", num: correct, correct: true },
      { label: f1(t + v / a) + " s", num: t + v / a, correct: false },
      { label: f1(v / (2 * a)) + " s", num: v / (2 * a), correct: false },
      { label: f1(correct + 1.2) + " s", num: correct + 1.2, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-046", topic: "Transportation Engineering", subtopic: "Red clearance interval",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The vehicle has to clear the full intersection width plus its own length. Using the width alone leaves the vehicle length out.",
  videoUrl: null, videoTitle: null
}, function () {
  var W = pick([48, 64, 80]), l = 20, v = 66.15;
  var correct = (W + l) / v;
  var question = "An intersection is " + W + " ft wide curb to curb and the design vehicle is " + l + " ft long. The approach speed is 66.15 ft/s. Using the handbook, what red clearance interval to the nearest 0.1 s is needed?";
  var solution = CT("transportation-046") + "\n\n$$r = \\frac{W + l}{v} = \\frac{" + W + " + " + l + "}{66.15} = " + f1(correct) + "\\ \\text{s}$$";
  return { variantKey: "W" + W, question: question, diagram: dRedClear(W, l, v),
    options: [
      { label: f1(correct) + " s", num: correct, correct: true },
      { label: f1(W / v) + " s", num: W / v, correct: false },
      { label: f1((W + l) / v / 2) + " s", num: (W + l) / v / 2, correct: false },
      { label: f1((W + 2 * l) / v) + " s", num: (W + 2 * l) / v, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-047", topic: "Transportation Engineering", subtopic: "Minimum pedestrian green time",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Gp = 3.2 + L/Sp + 0.27 Nped with the default pedestrian speed Sp = 3.5 ft/s. The walking time alone leaves out the start-up allowance and the group term.",
  videoUrl: null, videoTitle: null
}, function () {
  var L = pick([36, 48, 60]), N = pick([8, 12, 16]);
  var correct = 3.2 + L / 3.5 + 0.27 * N;
  var question = "A crosswalk is " + L + " ft long. The handbook default pedestrian speed is used and " + N + " pedestrians are in the crossing interval. What is the minimum pedestrian green time?";
  var solution = CT("transportation-047") + "\n\n$$G_p = 3.2 + \\frac{L}{S_p} + 0.27 N_{ped} = 3.2 + \\frac{" + L + "}{3.5} + 0.27(" + N + ") = " + f1(correct) + "\\ \\text{s}$$";
  return { variantKey: "L" + L + "_N" + N, question: question,
    options: [
      { label: f1(correct) + " s", num: correct, correct: true },
      { label: f1(L / 3.5) + " s", num: L / 3.5, correct: false },
      { label: f1(3.2 + L / 3.5) + " s", num: 3.2 + L / 3.5, correct: false },
      { label: f1(L / 3.5 + 0.27 * N) + " s", num: L / 3.5 + 0.27 * N, correct: false }
    ], solution: solution };
});

/* ---- 048-051: sight distance + PHF ---- */
treg({
  baseId: "transportation-048", topic: "Transportation Engineering", subtopic: "Stopping sight distance on level grade",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "SSD = 1.47 V t + V^2/(30(a/32.2 + G)) with G = 0 on level grade. The reaction distance alone, the braking distance alone, or using a directly gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([50, 60, 70]), t = 2.5, a = 11.2;
  var react = 1.47 * V * t;
  var brake = V * V / (30 * (a / 32.2));
  var correct = react + brake;
  var question = "A highway has a design speed of " + V + " mph. Use a driver reaction time of 2.5 s and a deceleration of 11.2 ft/s\\(^2\\) on a level road. What is the stopping sight distance?";
  var solution = CT("transportation-048") + "\n\n$$SSD = 1.47Vt + \\frac{V^2}{30(a/32.2 + G)} = 1.47(" + V + ")(2.5) + \\frac{" + V + "^2}{30(11.2/32.2 + 0)} = " + f0c(react) + " + " + f0c(brake) + " = " + f0c(correct) + "\\ \\text{ft}$$";
  return { variantKey: "V" + V, question: question,
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(react) + " ft", num: react, correct: false },
      { label: f0c(brake) + " ft", num: brake, correct: false },
      { label: f0c(react + V * V / (30 * a)) + " ft", num: react + V * V / (30 * a), correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-049", topic: "Transportation Engineering", subtopic: "Stopping sight distance on a downgrade",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "The grade enters as (a/32.2 + G) with G negative on a downgrade. Using the level-grade value or the uphill sign gives the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([50, 60, 70]), G = pick([-0.03, -0.04, -0.05]);
  var react = 1.47 * V * 2.5;
  var brake = V * V / (30 * (11.2 / 32.2 + G));
  var brakeLevel = V * V / (30 * (11.2 / 32.2));
  var brakeUp = V * V / (30 * (11.2 / 32.2 - G));
  var correct = react + brake;
  var question = "For a design speed of " + V + " mph, reaction time 2.5 s and deceleration 11.2 ft/s\\(^2\\), what is the stopping sight distance on a " + Math.round(-G * 100) + "% downgrade?";
  var solution = CT("transportation-049") + "\n\n$$SSD = 1.47(" + V + ")(2.5) + \\frac{" + V + "^2}{30(11.2/32.2 - " + (-G).toFixed(2) + ")} = " + f0c(react) + " + " + f0c(brake) + " = " + f0c(correct) + "\\ \\text{ft}$$";
  return { variantKey: "V" + V + "_G" + G, question: question,
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(react + brakeLevel) + " ft", num: react + brakeLevel, correct: false },
      { label: f0c(react + brakeUp) + " ft", num: react + brakeUp, correct: false },
      { label: f0c(brake * 30) + " ft", num: brake * 30, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-050", topic: "Transportation Engineering", subtopic: "Intersection sight distance",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "ISD = 1.47 V t_gap; the 1.47 factor converts mph to ft/s. Without it the result is not in feet.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([35, 45, 55]), gap = pick([6.5, 7.5, 8.5]);
  var correct = 1.47 * V * gap;
  var question = "The major road has a design speed of " + V + " mph. A driver on the minor road needs a time gap of " + gap + " s to enter. What intersection sight distance is required?";
  var solution = CT("transportation-050") + "\n\n$$ISD = 1.47\\, V\\, t_{gap} = 1.47(" + V + ")(" + gap + ") = " + f0c(correct) + "\\ \\text{ft}$$";
  return { variantKey: "V" + V + "_g" + gap, question: question, diagram: dISD(V, gap),
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(V * gap) + " ft", num: V * gap, correct: false },
      { label: f0c(1.47 * V) + " ft", num: 1.47 * V, correct: false },
      { label: f0c(1.47 * V * gap * 1.47) + " ft", num: 1.47 * V * gap * 1.47, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-051", topic: "Transportation Engineering", subtopic: "Peak hour factor",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "PHF = V/(4 x V15). A PHF above 1.0 is not physically possible; the factor 4 converts the peak 15-minute volume to an hourly flow rate.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([2400, 3000, 3600]), V15 = pick([650, 680, 720]);
  var correct = V / (4 * V15);
  var question = "A roadway carries " + V.toLocaleString("en-US") + " veh in the peak hour. The highest 15-minute volume within that hour is " + V15 + " veh. What is the peak hour factor?";
  var solution = CT("transportation-051") + "\n\n$$PHF = \\frac{V}{4 V_{15}} = \\frac{" + V.toLocaleString("en-US") + "}{4(" + V15 + ")} = " + correct.toFixed(3) + "$$";
  return { variantKey: "V" + V + "_V15" + V15, question: question,
    options: [
      { label: correct.toFixed(3), num: correct, correct: true },
      { label: (4 * V15 / V).toFixed(3), num: 4 * V15 / V, correct: false },
      { label: (V / V15).toFixed(3), num: V / V15, correct: false },
      { label: (V15 / V).toFixed(3), num: V15 / V, correct: false }
    ], solution: solution };
});

/* ---- 052-055: vertical curves ---- */
treg({
  baseId: "transportation-052", topic: "Transportation Engineering", subtopic: "Crest vertical curve length, S less than L",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "For S < L on a crest: L = A S^2/2158. The S > L equation and the sag-curve denominator are the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var A = pick([6, 9, 12]), S = pick([200, 300, 400]);
  var correct = A * S * S / 2158;
  var question = "A crest vertical curve joins grades differing by " + A + "% (algebraic difference A = " + A + "%). Use the standard criteria (eye height 3.50 ft, object height 2.0 ft). What curve length gives a sight distance of " + S + " ft, assuming S is less than L?";
  var solution = CT("transportation-052") + "\n\n$$L = \\frac{A S^2}{100(\\sqrt{2h_1} + \\sqrt{2h_2})^2} = \\frac{A S^2}{2158} = \\frac{(" + A + ")(" + S + ")^2}{2158} = " + f0c(correct) + "\\ \\text{ft}$$";
  return { variantKey: "A" + A + "_S" + S, question: question, diagram: dCrest(A / 2, -A / 2, S, "S < L"),
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(2 * S - 2158 / A) + " ft", num: 2 * S - 2158 / A, correct: false },
      { label: f0c(A * S * S / (400 + 3.5 * S)) + " ft", num: A * S * S / (400 + 3.5 * S), correct: false },
      { label: f0c(S / A) + " ft", num: S / A, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-053", topic: "Transportation Engineering", subtopic: "Crest vertical curve length, S greater than L",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "For S > L on a crest: L = 2S - 2158/A. The S < L equation and adding the term instead of subtracting are the traps.",
  videoUrl: null, videoTitle: null
}, function () {
  var A = pick([3, 4, 5]), S = pick([500, 600, 700]);
  var correct = 2 * S - 2158 / A;
  var question = "A crest vertical curve has an algebraic grade difference of " + A + "%. Using the standard criteria, what is the minimum curve length for a sight distance of " + S + " ft, given that S is greater than L?";
  var solution = CT("transportation-053") + "\n\n$$L = 2S - \\frac{2158}{A} = 2(" + S + ") - \\frac{2158}{" + A + "} = " + f0c(correct) + "\\ \\text{ft}$$";
  return { variantKey: "A" + A + "_S" + S, question: question, diagram: dCrest(A / 2, -A / 2, S, "S > L"),
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(A * S * S / 2158) + " ft", num: A * S * S / 2158, correct: false },
      { label: f0c(2 * S + 2158 / A) + " ft", num: 2 * S + 2158 / A, correct: false },
      { label: f0c(2 * S) + " ft", num: 2 * S, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-054", topic: "Transportation Engineering", subtopic: "Sag vertical curve, headlight criteria",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Sag, S < L: L = A S^2/(400 + 3.5S). The 2,158 denominator belongs to crest curves.",
  videoUrl: null, videoTitle: null
}, function () {
  var A = pick([5, 8, 10]), S = pick([250, 350, 450]);
  var correct = A * S * S / (400 + 3.5 * S);
  var question = "A sag vertical curve has an algebraic grade difference of " + A + "%. Based on the standard headlight criteria, what length is needed for a sight distance of " + S + " ft (S less than L)?";
  var solution = CT("transportation-054") + "\n\n$$L = \\frac{A S^2}{400 + 3.5S} = \\frac{(" + A + ")(" + S + ")^2}{400 + 3.5(" + S + ")} = " + f0c(correct) + "\\ \\text{ft}$$";
  return { variantKey: "A" + A + "_S" + S, question: question,
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(A * S * S / 2158) + " ft", num: A * S * S / 2158, correct: false },
      { label: f0c(A * S * S / 400 + 3.5 * S) + " ft", num: A * S * S / 400 + 3.5 * S, correct: false },
      { label: f0c(A * S * S / (400 - 3.5 * S)) + " ft", num: A * S * S / (400 - 3.5 * S), correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-055", topic: "Transportation Engineering", subtopic: "Sag curve length for riding comfort",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Comfort criterion: L = A V^2/46.5. Speed is squared because the centripetal acceleration scales with V^2.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([50, 60, 70]), A = pick([4, 6, 8]);
  var correct = A * V * V / 46.5;
  var question = "A sag vertical curve on a " + V + " mph road has an algebraic grade difference of " + A + "%. Using the riding comfort criterion, what is the minimum length?";
  var solution = CT("transportation-055") + "\n\n$$L = \\frac{A V^2}{46.5} = \\frac{(" + A + ")(" + V + ")^2}{46.5} = " + f0c(correct) + "\\ \\text{ft}$$";
  return { variantKey: "V" + V + "_A" + A, question: question,
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(A * V / 46.5) + " ft", num: A * V / 46.5, correct: false },
      { label: f0c(A * V * V / 46.5 / 10) + " ft", num: A * V * V / 46.5 / 10, correct: false },
      { label: f0c(A * V * V / 30) + " ft", num: A * V * V / 30, correct: false }
    ], solution: solution };
});


/* ================= transportation batch 2: 056-082 ================= */

function dHorizCurve(R, I) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="250" viewBox="0 0 480 250" role="img" aria-label="Simple horizontal curve, radius ' + R.toLocaleString("en-US") + ' feet, intersection angle I = ' + I + ' degrees"><rect width="480" height="250" fill="#ffffff"/>' + AH;
  s += '<line x1="60" y1="200" x2="300" y2="200" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<line x1="300" y1="200" x2="430" y2="80" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<path d="M 200 200 A 100 100 0 0 1 372 132" fill="none" stroke="#1d4ed8" stroke-width="3"/>';
  s += '<circle cx="300" cy="200" r="4" fill="#c0392b"/><text x="308" y="218" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">PI</text>';
  s += '<circle cx="200" cy="200" r="4" fill="#1d4ed8"/><text x="185" y="218" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">PC</text>';
  s += '<circle cx="372" cy="132" r="4" fill="#1d4ed8"/><text x="380" y="128" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">PT</text>';
  s += '<path d="M 330 200 A 30 30 0 0 0 315 190" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>';
  s += '<text x="338" y="192" font-family="Helvetica,Arial,sans-serif" font-size="13">I = ' + I + '\u00B0</text>';
  s += '<line x1="286" y1="170" x2="252" y2="158" stroke="#6b7280" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="216" y="150" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">R = ' + R.toLocaleString("en-US") + ' ft</text>';
  s += '<text x="60" y="35" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#6b7280">Dashed lines are the tangents; the solid arc runs from PC to PT</text>';
  return svgURL(s + '</svg>');
}
function dTangentOffset(L, A) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Vertical curve tangent offset E at the PVI, length ' + L + ' feet, algebraic grade difference A = ' + A + ' percent"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<path d="M 60 80 L 240 140 L 420 80" fill="none" stroke="#6b7280" stroke-width="2" stroke-dasharray="6,4"/>';
  s += '<path d="M 60 80 Q 240 190 420 80" fill="none" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<circle cx="240" cy="140" r="4" fill="#c0392b"/><text x="250" y="136" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">PVI</text>';
  s += '<line x1="240" y1="140" x2="240" y2="167" stroke="#c0392b" stroke-width="2" marker-end="url(#ah)"/>';
  s += '<text x="250" y="162" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">E = ?</text>';
  s += '<line x1="60" y1="205" x2="420" y2="205" stroke="#1a1a1a" stroke-width="1" marker-start="url(#ah)" marker-end="url(#ah)"/>';
  s += '<text x="205" y="222" font-family="Helvetica,Arial,sans-serif" font-size="12">L = ' + L + ' ft</text>';
  s += '<text x="60" y="30" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">A = ' + A + '%</text>';
  return svgURL(s + '</svg>');
}
function dHSO(R, S) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Horizontal curve radius ' + R.toLocaleString("en-US") + ' feet, required sight distance ' + S + ' feet, horizontal sight line offset unknown"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<path d="M 60 190 A 200 200 0 0 1 420 190" fill="none" stroke="#1a1a1a" stroke-width="3"/>';
  s += '<path d="M 70 168 A 180 180 0 0 1 410 168" fill="none" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="6,4"/>';
  s += '<line x1="240" y1="60" x2="240" y2="118" stroke="#c0392b" stroke-width="2" marker-end="url(#ah)"/>';
  s += '<text x="250" y="95" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c0392b">HSO = ?</text>';
  s += '<line x1="112" y1="130" x2="368" y2="130" stroke="#1d4ed8" stroke-width="2"/>';
  s += '<text x="160" y="122" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#1d4ed8">sight distance S = ' + S + ' ft</text>';
  s += '<text x="60" y="215" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">R = ' + R.toLocaleString("en-US") + ' ft (centerline of inside lane)</text>';
  return svgURL(s + '</svg>');
}
function dGravity(Pi, A1, A2, A3, F1, F2, F3) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="230" viewBox="0 0 480 230" role="img" aria-label="Gravity model: zone i produces ' + Pi.toLocaleString("en-US") + ' trips; three destination zones with attractions and friction factors"><rect width="480" height="230" fill="#ffffff"/>' + AH;
  s += '<circle cx="90" cy="115" r="30" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>';
  s += '<text x="72" y="112" font-family="Helvetica,Arial,sans-serif" font-size="12">zone i</text><text x="68" y="126" font-family="Helvetica,Arial,sans-serif" font-size="11">P = ' + Pi.toLocaleString("en-US") + '</text>';
  var zs = [[300, 50, 'zone 1', A1, F1], [300, 115, 'zone 2', A2, F2], [300, 180, 'zone 3', A3, F3]];
  for (var i = 0; i < 3; i++) {
    s += '<line x1="120" y1="115" x2="' + zs[i][0] + '" y2="' + zs[i][1] + '" stroke="' + (i === 1 ? '#c0392b' : '#6b7280') + '" stroke-width="' + (i === 1 ? 3 : 1.5) + '" marker-end="url(#ah)"/>';
    s += '<rect x="' + zs[i][0] + '" y="' + (zs[i][1] - 18) + '" width="130" height="36" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="1.5"/>';
    s += '<text x="' + (zs[i][0] + 8) + '" y="' + (zs[i][1] - 4) + '" font-family="Helvetica,Arial,sans-serif" font-size="11">' + zs[i][2] + '</text>';
    s += '<text x="' + (zs[i][0] + 8) + '" y="' + (zs[i][1] + 11) + '" font-family="Helvetica,Arial,sans-serif" font-size="11">A = ' + zs[i][3] + ', F = ' + zs[i][4] + '</text>';
  }
  return svgURL(s + '</svg>');
}
function dPavement(D1, a1, D3, a3, m3, a2, m2, SN) {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="Pavement layers: asphalt concrete ' + D1 + ' inches, base course thickness unknown, subbase ' + D3 + ' inches; required SN = ' + SN + '"><rect width="480" height="240" fill="#ffffff"/>' + AH;
  s += '<rect x="120" y="30" width="240" height="40" fill="#374151" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="368" y="54" font-family="Helvetica,Arial,sans-serif" font-size="11">asphalt concrete, ' + D1 + ' in., a = ' + a1 + '</text>';
  s += '<rect x="120" y="70" width="240" height="55" fill="#d1d5db" stroke="#c0392b" stroke-width="2.5"/>';
  s += '<text x="368" y="102" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#c0392b">base, D = ?  a = ' + a2 + ', m = ' + m2 + '</text>';
  s += '<rect x="120" y="125" width="240" height="55" fill="#e5e7eb" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="368" y="157" font-family="Helvetica,Arial,sans-serif" font-size="11">subbase, ' + D3 + ' in., a = ' + a3 + ', m = ' + m3 + '</text>';
  s += '<rect x="120" y="180" width="240" height="35" fill="#f3f4f6" stroke="#1a1a1a" stroke-width="2"/>';
  s += '<text x="368" y="202" font-family="Helvetica,Arial,sans-serif" font-size="11">subgrade</text>';
  s += '<text x="130" y="230" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#6b7280">required SN = ' + SN + '</text>';
  return svgURL(s + '</svg>');
}

/* ---- 056 / 057 ---- */
treg({
  baseId: "transportation-056", topic: "Transportation Engineering", subtopic: "High point of a crest curve",
  difficulty: "medium", estimatedTimeSeconds: 150,
  explanation: "x_hp = L g1/A from the PVC, then y = y_PVC + g1 x/100 - A x^2/(200 L). The back-tangent elevation at that station skips the parabolic drop; adding the term overstates it.",
  videoUrl: null, videoTitle: null
}, function () {
  var g1 = pick([2, 3, 4]), g2 = -pick([2, 3, 4]), L = pick([400, 600, 800]), elev0 = pick([400, 500, 600]);
  var A = g1 - g2;
  var x = L * g1 / A;
  var correct = elev0 + g1 * x / 100 - A * x * x / (200 * L);
  var tangent = elev0 + g1 * x / 100;
  var question = "A crest vertical curve has \\(g_1 = +" + g1 + "\\%\\), \\(g_2 = " + g2 + "\\%\\) and \\(L = " + L + "\\) ft, as shown. The PVC is at elevation " + elev0 + " ft. What is the elevation of the high point on the curve?";
  var solution = CT("transportation-056") + "\n\n$$x_{hp} = \\frac{L g_1}{A} = \\frac{(" + L + ")(" + g1 + ")}{" + A + "} = " + f0c(x) + "\\ \\text{ft from PVC}$$\n$$y_{hp} = " + elev0 + " + \\frac{(" + g1 + ")(" + f0c(x) + ")}{100} - \\frac{(" + A + ")(" + f0c(x) + ")^2}{200(" + L + ")} = " + f1(correct) + "\\ \\text{ft}$$";
  return { variantKey: "g1" + g1 + "_g2" + g2 + "_L" + L + "_e" + elev0, question: question, diagram: dVertGeom(g1, g2, L, elev0),
    options: [
      { label: f1(correct) + " ft", num: correct, correct: true },
      { label: f1(tangent) + " ft", num: tangent, correct: false },
      { label: f1(tangent + A * x * x / (200 * L)) + " ft", num: tangent + A * x * x / (200 * L), correct: false },
      { label: f1(elev0 + g1 * L / 200) + " ft", num: elev0 + g1 * L / 200, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-057", topic: "Transportation Engineering", subtopic: "Tangent offset at the PVI",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "The offset at the PVI is E = AL/800, one quarter of AL/200 because the parabola changes grade over half the curve on each side.",
  videoUrl: null, videoTitle: null
}, function () {
  var A = pick([4, 5, 6]), L = pick([400, 600, 800]);
  var correct = A * L / 800;
  var question = "A vertical curve has an algebraic grade difference of " + A + "% and a length of " + L + " ft. What is the tangent offset E at the PVI?";
  var solution = CT("transportation-057") + "\n\n$$E = \\frac{AL}{800} = \\frac{(" + A + ")(" + L + ")}{800} = " + f2(correct) + "\\ \\text{ft}$$";
  return { variantKey: "A" + A + "_L" + L, question: question, diagram: dTangentOffset(L, A),
    options: [
      { label: f2(correct) + " ft", num: correct, correct: true },
      { label: f2(correct / 2) + " ft", num: correct / 2, correct: false },
      { label: f2(A * L / 200) + " ft", num: A * L / 200, correct: false },
      { label: f2(A * L / 100) + " ft", num: A * L / 100, correct: false }
    ], solution: solution };
});

/* ---- 058-064: horizontal curves ---- */
treg({
  baseId: "transportation-058", topic: "Transportation Engineering", subtopic: "Radius from degree of curve",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "R = 5729.58/D (arc definition). A sharper curve (larger D) has a smaller radius, so multiplying by D reverses the relationship.",
  videoUrl: null, videoTitle: null
}, function () {
  var D = pick([2, 4, 6]);
  var correct = 5729.58 / D;
  var question = "A horizontal curve has a degree of curve (arc definition) of " + D + "\\u00B0. What is its radius?";
  var solution = CT("transportation-058") + "\n\n$$R = \\frac{5729.58}{D} = \\frac{5729.58}{" + D + "} = " + f0c(correct) + "\\ \\text{ft}$$";
  return { variantKey: "D" + D, question: question,
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(correct / 2) + " ft", num: correct / 2, correct: false },
      { label: f0c(5729.58 / (2 * Math.PI) * D / D) + " ft", num: 5729.58 / (2 * Math.PI), correct: false },
      { label: f0c(5729.58 * D / 100) + " ft", num: 5729.58 * D / 100, correct: false }
    ], solution: solution };
});
[["transportation-059", "tangent distance T", "T", function (R, I) { return R * Math.tan(I * Math.PI / 360); },
  "T = R tan(I/2). Using the full angle I instead of I/2 overstates T.", "324.9"],
 ["transportation-060", "middle ordinate M", "M", function (R, I) { return R * (1 - Math.cos(I * Math.PI / 360)); },
  "M = R(1 - cos(I/2)), from the midpoint of the long chord to the curve. The external distance E is measured from the PI instead.", "48.9"],
 ["transportation-061", "long chord", "LC", function (R, I) { return 2 * R * Math.sin(I * Math.PI / 360); },
  "LC = 2R sin(I/2). The chord is shorter than the arc length; R sin(I/2) is half the chord.", "618.0"]].forEach(function (cfg) {
  var id = cfg[0], name = cfg[1], sym = cfg[2], fn = cfg[3], expl = cfg[4];
  treg({
    baseId: id, topic: "Transportation Engineering", subtopic: name.charAt(0).toUpperCase() + name.slice(1) + " of a horizontal curve",
    difficulty: "medium", estimatedTimeSeconds: 90, explanation: expl, videoUrl: null, videoTitle: null
  }, function () {
    var R = pick([800, 1000, 1200]), I = pick([30, 36, 42]);
    var correct = fn(R, I);
    var question = "A simple horizontal curve has a radius of " + R.toLocaleString("en-US") + " ft and an intersection angle I of " + I + "\\u00B0" + (id === "transportation-059" ? ", as shown" : "") + ". What is the " + name + "?";
    var formula = id === "transportation-059" ? "T = R\\tan\\frac{I}{2}" : id === "transportation-060" ? "M = R\\left(1 - \\cos\\frac{I}{2}\\right)" : "LC = 2R\\sin\\frac{I}{2}";
    var solution = CT(id) + "\n\n$$" + formula + " = " + f1(correct) + "\\ \\text{ft}$$";
    var alt = id === "transportation-059" ? R * Math.tan(I * Math.PI / 180) : id === "transportation-060" ? R * (1 / Math.cos(I * Math.PI / 360) - 1) : R * Math.sin(I * Math.PI / 360);
    var arc = R * I * Math.PI / 180;
    var fourth = id === "transportation-061" ? 2 * R * Math.sin(I * Math.PI / 180) : correct / 2;
    return { variantKey: "R" + R + "_I" + I, question: question, diagram: dHorizCurve(R, I),
      options: [
        { label: f1(correct) + " ft", num: correct, correct: true },
        { label: f1(alt) + " ft", num: alt, correct: false },
        { label: f1(arc) + " ft", num: arc, correct: false },
        { label: f1(fourth) + " ft", num: fourth, correct: false }
      ], solution: solution };
  });
});
treg({
  baseId: "transportation-062", topic: "Transportation Engineering", subtopic: "Minimum radius from superelevation and friction",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "R = V^2/(15(e + f)). Using e = 6 instead of 0.06 mixes percent with decimal; friction alone ignores the superelevation.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([35, 45, 55]), e = pick([0.04, 0.06, 0.08]), f = pick([0.10, 0.12, 0.14]);
  var correct = V * V / (15 * (e + f));
  var question = "A curve is designed for " + V + " mph with a superelevation of " + Math.round(e * 100) + "% and a side friction factor of " + f.toFixed(2) + ". What is the minimum radius?";
  var solution = CT("transportation-062") + "\n\n$$R = \\frac{V^2}{15(e + f)} = \\frac{(" + V + ")^2}{15(" + e.toFixed(2) + " + " + f.toFixed(2) + ")} = " + f0c(correct) + "\\ \\text{ft}$$";
  return { variantKey: "V" + V + "_e" + e + "_f" + f, question: question,
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(V * V / (15 * f)) + " ft", num: V * V / (15 * f), correct: false },
      { label: f0c(V * V / (15 * (e * 100 + f))) + " ft", num: V * V / (15 * (e * 100 + f)), correct: false },
      { label: f0c(15 * (e + f) / V / V * 10000) + " ft", num: 15 * (e + f) / V / V * 10000, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-063", topic: "Transportation Engineering", subtopic: "Spiral transition length",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Ls = 3.15 V^3/(RC) with C = 1 unless stated. Speed is cubed in this equation.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([40, 50, 60]), R = pick([800, 1000, 1200]);
  var correct = 3.15 * Math.pow(V, 3) / R;
  var question = "A spiral transition is to be provided for a " + V + " mph design speed and a " + R.toLocaleString("en-US") + " ft radius curve. Use the handbook rate of increase of lateral acceleration. What is the spiral length?";
  var solution = CT("transportation-063") + "\n\n$$L_s = \\frac{3.15 V^3}{RC} = \\frac{3.15(" + V + ")^3}{(" + R.toLocaleString("en-US") + ")(1)} = " + f0c(correct) + "\\ \\text{ft}$$";
  return { variantKey: "V" + V + "_R" + R, question: question,
    options: [
      { label: f0c(correct) + " ft", num: correct, correct: true },
      { label: f0c(3.15 * V * V / R) + " ft", num: 3.15 * V * V / R, correct: false },
      { label: f0c(Math.pow(V, 3) / R) + " ft", num: Math.pow(V, 3) / R, correct: false },
      { label: f0c(correct / 2) + " ft", num: correct / 2, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-064", topic: "Transportation Engineering", subtopic: "Horizontal sight line offset",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "HSO = R(1 - cos(28.65 S/R)) with the angle in degrees. The small-angle approximation S^2/(8R) gives a nearby but different value.",
  videoUrl: null, videoTitle: null
}, function () {
  var R = pick([1000, 1200, 1500]), S = pick([400, 480, 550]);
  var correct = R * (1 - Math.cos(28.65 * S / R * Math.PI / 180));
  var approx = S * S / (8 * R);
  var question = "A horizontal curve has a radius of " + R.toLocaleString("en-US") + " ft. A driver needs " + S + " ft of sight distance. How far must the line of sight clear the inside edge of the lane (the horizontal sight line offset)?";
  var solution = CT("transportation-064") + "\n\n$$HSO = R\\left[1 - \\cos\\left(\\frac{28.65 S}{R}\\right)\\right] = " + R.toLocaleString("en-US") + "\\left[1 - \\cos\\left(\\frac{28.65(" + S + ")}{" + R.toLocaleString("en-US") + "}\\right)\\right] = " + f1(correct) + "\\ \\text{ft}$$";
  return { variantKey: "R" + R + "_S" + S, question: question, diagram: dHSO(R, S),
    options: [
      { label: f1(correct) + " ft", num: correct, correct: true },
      { label: f1(2 * correct) + " ft", num: 2 * correct, correct: false },
      { label: f1(correct / 2) + " ft", num: correct / 2, correct: false },
      { label: f1(R * Math.sin(28.65 * S / R * Math.PI / 180)) + " ft", num: R * Math.sin(28.65 * S / R * Math.PI / 180), correct: false }
    ], solution: solution };
});

/* ---- 065-069: freeway capacity / LOS (HCM) ---- */
treg({
  baseId: "transportation-065", topic: "Transportation Engineering", subtopic: "Base freeway segment capacity",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Capacity = 2200 + 10(FFS - 50) pc/h/ln, capped at 2400. The breakpoint 1000 + 40(75 - FFS) is where speed begins to drop, not the capacity.",
  videoUrl: null, videoTitle: null
}, function () {
  var FFS = pick([55, 60, 65, 70]);
  var correct = Math.min(2200 + 10 * (FFS - 50), 2400);
  var question = "A basic freeway segment has a free-flow speed of " + FFS + " mph under base conditions. Using the handbook relation, what is the base capacity in pc/h/ln?";
  var solution = CT("transportation-065") + "\n\n$$c = 2200 + 10(FFS - 50) = 2200 + 10(" + FFS + " - 50) = " + f0c(2200 + 10 * (FFS - 50)) + "\\ \\text{pc/h/ln}$$" + (2200 + 10 * (FFS - 50) > 2400 ? "\n\nCapped at 2,400 pc/h/ln." : "");
  return { variantKey: "FFS" + FFS, question: question,
    options: [
      { label: f0c(correct), num: correct, correct: true },
      { label: f0c(1000 + 40 * (75 - FFS)), num: 1000 + 40 * (75 - FFS), correct: false },
      { label: f0c(2200 + 10 * FFS), num: 2200 + 10 * FFS, correct: false },
      { label: f0c(correct === 2400 ? 2200 : 2400), num: correct === 2400 ? 2200 : 2400, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-066", topic: "Transportation Engineering", subtopic: "Freeway breakpoint",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "BP = [1000 + 40(75 - FFS_adj)] x CAF. A lower free-flow speed raises the breakpoint, so the 40(75 - FFS) term adds.",
  videoUrl: null, videoTitle: null
}, function () {
  var FFS = pick([55, 60, 65, 70]), CAF = pick([0.90, 0.95, 1.00]);
  var correct = (1000 + 40 * (75 - FFS)) * CAF;
  var question = "A basic freeway segment has an adjusted free-flow speed of " + FFS + " mph and a capacity adjustment factor of " + CAF.toFixed(2) + ". What is the breakpoint in pc/h/ln?";
  var solution = CT("transportation-066") + "\n\n$$BP = [1000 + 40(75 - FFS_{adj})] \\times CAF = [1000 + 40(75 - " + FFS + ")] \\times " + CAF.toFixed(2) + " = " + f0c(correct) + "\\ \\text{pc/h/ln}$$";
  return { variantKey: "FFS" + FFS + "_CAF" + CAF, question: question,
    options: [
      { label: f0c(correct), num: correct, correct: true },
      { label: f0c((1000 - 40 * (75 - FFS)) * CAF), num: (1000 - 40 * (75 - FFS)) * CAF, correct: false },
      { label: f0c(Math.min(2200 + 10 * (FFS - 50), 2400)), num: Math.min(2200 + 10 * (FFS - 50), 2400), correct: false },
      { label: f0c((1000 + 40 * (75 - FFS)) * CAF * 0.75), num: (1000 + 40 * (75 - FFS)) * CAF * 0.75, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-067", topic: "Transportation Engineering", subtopic: "Free-flow speed of a basic freeway segment",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "FFS = 75.4 - f_LW - f_LC - 3.22 TRD^0.84. Dropping the ramp-density term overstates FFS; using TRD without the 0.84 exponent applies too large a ramp penalty.",
  videoUrl: null, videoTitle: null
}, function () {
  var fLW = pick([0, 1.9, 3.1]), fLC = pick([0, 0.8, 1.6]), TRD = pick([0.5, 1.0, 1.5]);
  var lanes = pick([2, 3, 4]);
  var correct = 75.4 - fLW - fLC - 3.22 * Math.pow(TRD, 0.84);
  var question = "A freeway has an average lane-width adjustment of " + fLW.toFixed(1) + " mph from the handbook table, " + lanes + " lanes in one direction with a right-side lateral clearance adjustment of " + fLC.toFixed(1) + " mph, and a total ramp density of " + TRD.toFixed(1) + " ramps/mi. Use the default base free-flow speed. What is the FFS?";
  var solution = CT("transportation-067") + "\n\n$$FFS = 75.4 - f_{LW} - f_{LC} - 3.22 \\, TRD^{0.84} = 75.4 - " + fLW.toFixed(1) + " - " + fLC.toFixed(1) + " - 3.22(" + TRD.toFixed(1) + ")^{0.84} = " + f1(correct) + "\\ \\text{mph}$$";
  return { variantKey: "w" + fLW + "_c" + fLC + "_t" + TRD + "_n" + lanes, question: question,
    options: [
      { label: f1(correct) + " mph", num: correct, correct: true },
      { label: f1(75.4 - fLW - fLC) + " mph", num: 75.4 - fLW - fLC, correct: false },
      { label: f1(75.4 - fLW - fLC - 3.22 * TRD) + " mph", num: 75.4 - fLW - fLC - 3.22 * TRD, correct: false },
      { label: f1(correct - 0.4) + " mph", num: correct - 0.4, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-068", topic: "Transportation Engineering", subtopic: "Demand flow rate with heavy vehicles",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "v_p = V/(PHF x N x f_HV) with f_HV = 1/(1 + P_T(E_T - 1)). Ignoring trucks understates v_p; using E_T instead of E_T - 1 overcounts trucks.",
  videoUrl: null, videoTitle: null
}, function () {
  var V = pick([3000, 3600, 4200]), PHF = pick([0.88, 0.92, 0.95]), N = pick([3, 4]), PT = pick([0.05, 0.10, 0.15]);
  var ET = 2.0;
  var fHV = 1 / (1 + PT * (ET - 1));
  var correct = V / (PHF * N * fHV);
  var noTruck = V / (PHF * N);
  var etWrong = V / (PHF * N * (1 / (1 + PT * ET)));
  var question = "A freeway direction with " + N + " lanes (level terrain) carries " + V.toLocaleString("en-US") + " veh/h with PHF = " + PHF.toFixed(2) + ". Trucks are " + Math.round(PT * 100) + "% of traffic. Use the handbook passenger car equivalent for level terrain (E_T = 2.0). What is the demand flow rate v_p in pc/h/ln?";
  var solution = CT("transportation-068") + "\n\n$$f_{HV} = \\frac{1}{1 + P_T(E_T - 1)} = \\frac{1}{1 + " + PT.toFixed(2) + "(2.0 - 1)} = " + f3(fHV) + "$$\n$$v_p = \\frac{V}{PHF \\times N \\times f_{HV}} = \\frac{" + V.toLocaleString("en-US") + "(" + PHF.toFixed(2) + ")(" + N + ")(" + f3(fHV) + ")} = " + f0c(correct) + "\\ \\text{pc/h/ln}$$".replace("(", "\\frac{").replace(")(", "}{") ;
  solution = CT("transportation-068") + "\n\n$$f_{HV} = \\frac{1}{1 + P_T(E_T - 1)} = \\frac{1}{1 + " + PT.toFixed(2) + "(2.0 - 1)} = " + f3(fHV) + "$$\n$$v_p = \\frac{V}{PHF \\times N \\times f_{HV}} = \\frac{" + V.toLocaleString("en-US") + "}{" + PHF.toFixed(2) + " \\times " + N + " \\times " + f3(fHV) + "} = " + f0c(correct) + "\\ \\text{pc/h/ln}$$";
  return { variantKey: "V" + V + "_P" + PHF + "_N" + N + "_T" + PT, question: question,
    options: [
      { label: f0c(correct), num: correct, correct: true },
      { label: f0c(noTruck), num: noTruck, correct: false },
      { label: f0c(V * fHV / (PHF * N)), num: V * fHV / (PHF * N), correct: false },
      { label: f0c(etWrong), num: etWrong, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-069", topic: "Transportation Engineering", subtopic: "Freeway density and level of service",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Below the breakpoint, density D = v_p/FFS. LOS thresholds: A to 11, B to 18, C to 26, D to 35 pc/mi/ln.",
  videoUrl: null, videoTitle: null
}, function () {
  var vp = pick([900, 1050, 1200]), S = pick([65, 70, 75]);
  var D = vp / S;
  function los(d) { return d <= 11 ? "A" : d <= 18 ? "B" : d <= 26 ? "C" : "D"; }
  var correct = D;
  var question = "A basic freeway segment with a free-flow speed of " + S + " mph carries a demand flow rate of " + vp.toLocaleString("en-US") + " pc/h/ln, which is below the breakpoint. What are the density and level of service?";
  var solution = CT("transportation-069") + "\n\n$$D = \\frac{v_p}{S} = \\frac{" + vp.toLocaleString("en-US") + "}{" + S + "} = " + f1(D) + "\\ \\text{pc/mi/ln}$$\n\n" + f1(D) + " pc/mi/ln falls in the LOS " + los(D) + " band, so the answer is " + f1(D) + " pc/mi/ln, LOS " + los(D) + ".";
  return { variantKey: "vp" + vp + "_S" + S, question: question,
    options: [
      { label: f1(D) + " pc/mi/ln, LOS " + los(D), num: D, correct: true },
      { label: f1(D / 2) + " pc/mi/ln, LOS A", num: D / 2, correct: false },
      { label: f1(D + 3) + " pc/mi/ln, LOS C", num: D + 3, correct: false },
      { label: f1(2 * D) + " pc/mi/ln, LOS D", num: 2 * D, correct: false }
    ], solution: solution };
});

/* ---- 070-072: Greenshields ---- */
treg({
  baseId: "transportation-070", topic: "Transportation Engineering", subtopic: "Greenshields speed at a given density",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "Under Greenshields, speed falls linearly: v = v_f(1 - k/k_j). The speed at optimum density (k_j/2) is half the free-flow speed.",
  videoUrl: null, videoTitle: null
}, function () {
  var vf = pick([50, 60, 70]), kj = pick([120, 150, 180]), frac = pick([1 / 6, 1 / 3, 1 / 2]);
  var k = Math.round(kj * frac);
  var correct = vf * (1 - k / kj);
  var question = "Under the Greenshields model, free-flow speed is " + vf + " mph and jam density is " + kj + " veh/mi/ln. What is the speed when the density is " + k + " veh/mi/ln?";
  var solution = CT("transportation-070") + "\n\n$$v = v_f\\left(1 - \\frac{k}{k_j}\\right) = " + vf + "\\left(1 - \\frac{" + k + "}{" + kj + "}\\right) = " + f1(correct) + "\\ \\text{mph}$$";
  return { variantKey: "vf" + vf + "_kj" + kj + "_k" + k, question: question,
    options: [
      { label: f1(correct) + " mph", num: correct, correct: true },
      { label: f1(vf * k / kj) + " mph", num: vf * k / kj, correct: false },
      { label: f1(vf / 2) + " mph", num: vf / 2, correct: false },
      { label: f1(Math.abs(vf - k)) + " mph", num: Math.abs(vf - k), correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-071", topic: "Transportation Engineering", subtopic: "Greenshields maximum flow",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Maximum flow occurs at k_j/2 and v_f/2, so q_max = v_f k_j/4.",
  videoUrl: null, videoTitle: null
}, function () {
  var vf = pick([50, 60, 70]), kj = pick([120, 150, 180]);
  var correct = vf * kj / 4;
  var question = "Using the Greenshields model with free-flow speed " + vf + " mph and jam density " + kj + " veh/mi/ln, what is the maximum flow?";
  var solution = CT("transportation-071") + "\n\n$$q_{max} = \\frac{v_f k_j}{4} = \\frac{(" + vf + ")(" + kj + ")}{4} = " + f0c(correct) + "\\ \\text{veh/h/ln}$$";
  return { variantKey: "vf" + vf + "_kj" + kj, question: question,
    options: [
      { label: f0c(correct) + " veh/h/ln", num: correct, correct: true },
      { label: f0c(vf * kj / 2) + " veh/h/ln", num: vf * kj / 2, correct: false },
      { label: f0c(vf * kj) + " veh/h/ln", num: vf * kj, correct: false },
      { label: f0c(vf * kj / 8) + " veh/h/ln", num: vf * kj / 8, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-072", topic: "Transportation Engineering", subtopic: "Greenshields flow at a density",
  difficulty: "easy", estimatedTimeSeconds: 90,
  explanation: "q = v_f k (1 - k/k_j). The speed at that density, v_f(1 - k/k_j), is not the flow; multiplying k by v_f alone ignores the speed drop.",
  videoUrl: null, videoTitle: null
}, function () {
  var vf = pick([50, 60, 70]), kj = pick([120, 150, 180]), frac = pick([1 / 6, 1 / 3, 1 / 2]);
  var k = Math.round(kj * frac);
  var correct = vf * k * (1 - k / kj);
  var question = "With free-flow speed " + vf + " mph and jam density " + kj + " veh/mi/ln, what is the flow when the density is " + k + " veh/mi/ln?";
  var solution = CT("transportation-072") + "\n\n$$q = v_f k\\left(1 - \\frac{k}{k_j}\\right) = (" + vf + ")(" + k + ")\\left(1 - \\frac{" + k + "}{" + kj + "}\\right) = " + f0c(correct) + "\\ \\text{veh/h/ln}$$";
  return { variantKey: "vf" + vf + "_kj" + kj + "_k" + k, question: question,
    options: [
      { label: f0c(correct) + " veh/h/ln", num: correct, correct: true },
      { label: f0c(vf * (1 - k / kj)) + " veh/h/ln", num: vf * (1 - k / kj), correct: false },
      { label: f0c(vf * k) + " veh/h/ln", num: vf * k, correct: false },
      { label: f0c(vf * kj / 4) + " veh/h/ln", num: vf * kj / 4, correct: false }
    ], solution: solution };
});

/* ---- 073-074: crash rates ---- */
treg({
  baseId: "transportation-073", topic: "Transportation Engineering", subtopic: "Intersection crash rate",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "RMEV = crashes x 10^6/(ADT x 365 x years). Using ADT directly without the days gives a rate per million vehicle-days.",
  videoUrl: null, videoTitle: null
}, function () {
  var crashes = pick([18, 24, 30]), ADT = pick([20000, 24000, 30000]), years = pick([1, 2]);
  var correct = crashes * 1e6 / (ADT * 365 * years);
  var question = "An intersection had " + crashes + " crashes in a " + years + "-year period. The average daily traffic entering the intersection is " + ADT.toLocaleString("en-US") + " veh/day. What is the crash rate per million entering vehicles?";
  var solution = CT("transportation-073") + "\n\n$$R = \\frac{C \\times 10^6}{ADT \\times 365 \\times N} = \\frac{" + crashes + " \\times 10^6}{" + ADT.toLocaleString("en-US") + " \\times 365 \\times " + years + "} = " + f2(correct) + "$$";
  return { variantKey: "C" + crashes + "_A" + ADT + "_y" + years, question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(crashes * 1e6 / ADT), num: crashes * 1e6 / ADT, correct: false },
      { label: f2(correct * years * 365 / 100), num: correct * years * 365 / 100, correct: false },
      { label: f2(correct / 10), num: correct / 10, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-074", topic: "Transportation Engineering", subtopic: "Roadway segment crash rate",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "RMVM = crashes x 10^6/(ADT x days x L). Using one year of days with several years of crashes inflates the rate; leaving out the segment length gives a rate per million vehicles.",
  videoUrl: null, videoTitle: null
}, function () {
  var crashes = pick([36, 42, 48]), L = pick([3.5, 4.5, 5.5]), ADT = pick([10000, 12000, 15000]), years = pick([2, 3]);
  var days = years * 365;
  var correct = crashes * 1e6 / (ADT * days * L);
  var question = "A " + L + " mi roadway segment had " + crashes + " crashes during a " + years + "-year study period (" + days.toLocaleString("en-US") + " days). ADT is " + ADT.toLocaleString("en-US") + " veh/day. What is the crash rate per million vehicle miles?";
  var solution = CT("transportation-074") + "\n\n$$R = \\frac{C \\times 10^6}{ADT \\times D \\times L} = \\frac{" + crashes + " \\times 10^6}{" + ADT.toLocaleString("en-US") + " \\times " + days.toLocaleString("en-US") + " \\times " + L + "} = " + f2(correct) + "$$";
  return { variantKey: "C" + crashes + "_L" + L + "_A" + ADT + "_y" + years, question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(crashes * 1e6 / (ADT * 365 * L)), num: crashes * 1e6 / (ADT * 365 * L), correct: false },
      { label: f2(crashes * 1e6 / (ADT * days)), num: crashes * 1e6 / (ADT * days), correct: false },
      { label: f2(correct / 10), num: correct / 10, correct: false }
    ], solution: solution };
});

/* ---- 075: countermeasures ---- */
treg({
  baseId: "transportation-075", topic: "Transportation Engineering", subtopic: "Crashes prevented by two countermeasures",
  difficulty: "medium", estimatedTimeSeconds: 90,
  explanation: "Combined reduction = 1 - (1 - CRF1)(1 - CRF2): adding the factors double-counts crashes already removed by the first measure. Apply the traffic growth ratio to the expected crashes.",
  videoUrl: null, videoTitle: null
}, function () {
  var N0 = pick([20, 25, 30]), TR = pick([1.05, 1.10, 1.15]), pair = pick([[0.3, 0.2], [0.4, 0.2], [0.3, 0.15]]);
  var crf = 1 - (1 - pair[0]) * (1 - pair[1]);
  var correct = N0 * TR * crf;
  var question = "A site is expected to have " + N0 + " crashes per year without improvement. Two mutually exclusive countermeasures have crash reduction factors of " + pair[0] + " and " + pair[1] + ". Traffic after the improvements is expected to be " + TR.toFixed(2) + " times the traffic before. How many crashes per year are expected to be prevented if both are implemented?";
  var solution = CT("transportation-075") + "\n\n$$CRF_{comb} = 1 - (1 - " + pair[0] + ")(1 - " + pair[1] + ") = " + f2(crf) + "$$\n$$\\text{prevented} = " + N0 + " \\times " + TR.toFixed(2) + " \\times " + f2(crf) + " = " + f2(correct) + "$$";
  return { variantKey: "N" + N0 + "_TR" + TR + "_c" + pair[0] + pair[1], question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(N0 * TR * (pair[0] + pair[1])), num: N0 * TR * (pair[0] + pair[1]), correct: false },
      { label: f2(N0 * crf), num: N0 * crf, correct: false },
      { label: f2(N0 * crf / TR), num: N0 * crf / TR, correct: false }
    ], solution: solution };
});

/* ---- 076: gravity model ---- */
treg({
  baseId: "transportation-076", topic: "Transportation Engineering", subtopic: "Gravity model trip distribution",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "T_ij = P_i (A_j F_j)/sum(A F). Using attractions alone ignores travel time; using friction factors alone ignores zone size.",
  videoUrl: null, videoTitle: null
}, function () {
  var Pi = pick([1000, 1200, 1500]);
  var As = pick([[400, 300, 600], [500, 300, 600], [400, 350, 550]]);
  var Fs = pick([[1.0, 0.8, 0.5], [1.0, 0.7, 0.4], [0.9, 0.8, 0.5]]);
  var denom = As[0] * Fs[0] + As[1] * Fs[1] + As[2] * Fs[2];
  var correct = Pi * As[1] * Fs[1] / denom;
  var attOnly = Pi * As[1] / (As[0] + As[1] + As[2]);
  var fricOnly = Pi * Fs[1] / (Fs[0] + Fs[1] + Fs[2]);
  var question = "Zone i produces " + Pi.toLocaleString("en-US") + " trips. Zones 1, 2 and 3 attract " + As[0] + ", " + As[1] + " and " + As[2] + " trips with friction factors " + Fs[0].toFixed(1) + ", " + Fs[1].toFixed(1) + " and " + Fs[2].toFixed(1) + " for travel from zone i. Take all K factors as 1. How many trips go from zone i to zone 2?";
  var solution = CT("transportation-076") + "\n\n$$T_{i2} = P_i \\frac{A_2 F_2}{\\sum A_j F_j} = " + Pi.toLocaleString("en-US") + " \\times \\frac{(" + As[1] + ")(" + Fs[1].toFixed(1) + ")}{(" + As[0] + ")(" + Fs[0].toFixed(1) + ") + (" + As[1] + ")(" + Fs[1].toFixed(1) + ") + (" + As[2] + ")(" + Fs[2].toFixed(1) + ")} = " + f1(correct) + "$$";
  return { variantKey: "P" + Pi + "_A" + As.join("-") + "_F" + Fs.join("-"), question: question,
    diagram: dGravity(Pi, As[0], As[1], As[2], Fs[0], Fs[1], Fs[2]),
    options: [
      { label: f1(correct), num: correct, correct: true },
      { label: f1(attOnly), num: attOnly, correct: false },
      { label: f1(fricOnly), num: fricOnly, correct: false },
      { label: f1(Pi * As[2] * Fs[2] / denom), num: Pi * As[2] * Fs[2] / denom, correct: false }
    ], solution: solution };
});

/* ---- 077: logit ---- */
treg({
  baseId: "transportation-077", topic: "Transportation Engineering", subtopic: "Logit model mode choice",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "P(auto) = e^{U_auto}/(e^{U_auto} + e^{U_transit}). The transit probability is the complement; a ratio of utilities is not a probability.",
  videoUrl: null, videoTitle: null
}, function () {
  var a1 = -0.05, a2 = -0.30;
  var ta = pick([20, 25]), tt = pick([30, 35]), ca = pick([5, 6]), ct = pick([2.5, 3.0]);
  var Ua = a1 * ta + a2 * ca, Ut = a1 * tt + a2 * ct;
  var Pa = Math.exp(Ua) / (Math.exp(Ua) + Math.exp(Ut));
  var question = "A logit mode choice model uses utility \\(U = a_1(\\text{time, min}) + a_2(\\text{cost, \\$})\\) with \\(a_1 = " + a1.toFixed(2) + "\\) and \\(a_2 = " + a2.toFixed(2) + "\\). Auto takes " + ta + " min and costs \\$" + ca.toFixed(2) + ". Transit takes " + tt + " min and costs \\$" + ct.toFixed(2) + ". What is the probability of choosing auto?";
  var solution = CT("transportation-077") + "\n\n$$U_{auto} = (" + a1.toFixed(2) + ")(" + ta + ") + (" + a2.toFixed(2) + ")(" + ca.toFixed(2) + ") = " + f2(Ua) + "$$\n$$U_{transit} = (" + a1.toFixed(2) + ")(" + tt + ") + (" + a2.toFixed(2) + ")(" + ct.toFixed(2) + ") = " + f2(Ut) + "$$\n$$P_{auto} = \\frac{e^{U_{auto}}}{e^{U_{auto}} + e^{U_{transit}}} = " + f3(Pa) + "$$";
  return { variantKey: "ta" + ta + "_tt" + tt + "_ca" + ca + "_ct" + ct, question: question,
    options: [
      { label: f3(Pa), num: Pa, correct: true },
      { label: f3(1 - Pa), num: 1 - Pa, correct: false },
      { label: f3(Ua / (Ua + Ut)), num: Ua / (Ua + Ut), correct: false },
      { label: f3(Pa > 0.5 ? Pa - 0.1 : Pa + 0.2), num: Pa > 0.5 ? Pa - 0.1 : Pa + 0.2, correct: false }
    ], solution: solution };
});

/* ---- 078: pavement base thickness ---- */
treg({
  baseId: "transportation-078", topic: "Transportation Engineering", subtopic: "Required base thickness for a target SN",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "SN = a1 D1 + a2 m2 D2 + a3 m3 D3. Leaving out the drainage coefficient on the subbase overstates its contribution and gives a thinner base than needed.",
  videoUrl: null, videoTitle: null
}, function () {
  var SN = pick([4.0, 4.5, 5.0]), D1 = pick([3, 4, 5]), D3 = pick([8, 10, 12]);
  var a1 = 0.44, a3 = 0.11, m3 = 0.9, a2 = 0.14, m2 = 1.0;
  var correct = (SN - a1 * D1 - a3 * m3 * D3) / (a2 * m2);
  var noM = (SN - a1 * D1 - a3 * D3) / (a2 * m2);
  var question = "A pavement needs SN = " + SN + ". It has " + D1 + " in. of asphalt concrete (a = " + a1 + ") and " + D3 + " in. of subbase (a = " + a3 + ", m = " + m3 + "). The base course has a = " + a2 + " and m = " + m2.toFixed(1) + ". What base thickness is required?";
  var solution = CT("transportation-078") + "\n\n$$D_2 = \\frac{SN - a_1 D_1 - a_3 m_3 D_3}{a_2 m_2} = \\frac{" + SN + " - (" + a1 + ")(" + D1 + ") - (" + a3 + ")(" + m3 + ")(" + D3 + ")}{(" + a2 + ")(" + m2.toFixed(1) + ")} = " + f1(correct) + "\\ \\text{in.}$$";
  return { variantKey: "SN" + SN + "_D1" + D1 + "_D3" + D3, question: question,
    diagram: dPavement(D1, a1, D3, a3, m3, a2, m2, SN),
    options: [
      { label: f1(correct) + " in.", num: correct, correct: true },
      { label: f1(noM) + " in.", num: noM, correct: false },
      { label: f1((SN - a1 * D1) / (a2 * m2)) + " in.", num: (SN - a1 * D1) / (a2 * m2), correct: false },
      { label: f1(SN / (a2 * m2)) + " in.", num: SN / (a2 * m2), correct: false }
    ], solution: solution };
});

/* ---- 079-080: ESALs ---- */
var LEF = { s12: 0.189, s18: 1.000, s30: 6.97, s34: 11.18, t12: 0.0144, t30: 0.658, t34: 1.095 };
treg({
  baseId: "transportation-079", topic: "Transportation Engineering", subtopic: "ESALs from axle load equivalency factors",
  difficulty: "medium", estimatedTimeSeconds: 120,
  explanation: "Each axle uses the column matching its type: 12-kip single is 0.189 and 34-kip tandem is 1.095. Swapping columns (11.18 with 0.0144) inflates the total by an order of magnitude.",
  videoUrl: null, videoTitle: null
}, function () {
  var passes = pick([4000, 5000, 6000]);
  var combo = pick([["s12", "t34", "12,000-lb single", "34,000-lb tandem"], ["s12", "t30", "12,000-lb single", "30,000-lb tandem"], ["s18", "t34", "18,000-lb single", "34,000-lb tandem"]]);
  var per = LEF[combo[0]] + LEF[combo[1]];
  var correct = passes * per;
  var swapped = passes * (combo[0] === "s18" ? LEF.t12 : LEF.s34) + passes * LEF.t12;
  var question = "Each truck in a traffic stream has one " + combo[2] + " axle and one " + combo[3] + " axle. Using the handbook load equivalency factors, how many ESALs result from " + passes.toLocaleString("en-US") + " truck passes?";
  var solution = CT("transportation-079") + "\n\n$$\\text{ESALs} = " + passes.toLocaleString("en-US") + " \\times (" + LEF[combo[0]] + " + " + LEF[combo[1]] + ") = " + f0c(correct) + "$$";
  return { variantKey: "P" + passes + "_" + combo[0] + combo[1], question: question,
    options: [
      { label: f0c(correct), num: correct, correct: true },
      { label: f0c(swapped), num: swapped, correct: false },
      { label: f0c(passes * LEF[combo[0]]), num: passes * LEF[combo[0]], correct: false },
      { label: f0c(correct / 10), num: correct / 10, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-080", topic: "Transportation Engineering", subtopic: "Relative damage from heavier single axles",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Equivalent 18-kip passes = LEF of the heavier axle, since LEF(18 kip single) = 1.000. The ratio of loads understates the damage; 0.658 is the tandem factor for 30 kip.",
  videoUrl: null, videoTitle: null
}, function () {
  var heavy = pick([[30000, LEF.s30, "0.658"], [34000, LEF.s34, "1.095"]]);
  var correct = heavy[1];
  var question = "Using the handbook load equivalency factors, how many 18,000-lb single-axle passes does one pass of a " + heavy[0].toLocaleString("en-US") + "-lb single axle damage the pavement as much as?";
  var solution = CT("transportation-080") + "\n\n$$\\text{equivalent passes} = \\frac{LEF_{" + (heavy[0] / 1000) + "\\text{k single}}}{LEF_{18\\text{k single}}} = \\frac{" + heavy[1] + "}{1.000} = " + f2(correct) + "$$";
  return { variantKey: "h" + heavy[0], question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(heavy[0] / 18000), num: heavy[0] / 18000, correct: false },
      { label: f2(parseFloat(heavy[2])), num: parseFloat(heavy[2]), correct: false },
      { label: f2(correct * 100), num: correct * 100, correct: false }
    ], solution: solution };
});

/* ---- 081-082: drainage coefficient ---- */
treg({
  baseId: "transportation-081", topic: "Transportation Engineering", subtopic: "Effect of drainage coefficient",
  difficulty: "easy", estimatedTimeSeconds: 60,
  explanation: "Layer contribution = a D m. A drainage coefficient below 1.0 reduces the contribution; dividing by it would increase it instead.",
  videoUrl: null, videoTitle: null
}, function () {
  var a = pick([0.12, 0.14, 0.16]), D = pick([8, 10, 12]), m = pick([0.7, 0.8, 0.9]);
  var correct = a * D * m;
  var question = "A granular base has a = " + a.toFixed(2) + " and D = " + D + " in. What is the base's structural number contribution when the drainage coefficient is " + m.toFixed(1) + "?";
  var solution = CT("transportation-081") + "\n\n$$SN_{base} = a \\, D \\, m = (" + a.toFixed(2) + ")(" + D + ")(" + m.toFixed(1) + ") = " + f2(correct) + "$$";
  return { variantKey: "a" + a + "_D" + D + "_m" + m, question: question,
    options: [
      { label: f2(correct), num: correct, correct: true },
      { label: f2(a * D / m), num: a * D / m, correct: false },
      { label: f2(a * D), num: a * D, correct: false },
      { label: f2(correct / 10), num: correct / 10, correct: false }
    ], solution: solution };
});
treg({
  baseId: "transportation-082", topic: "Transportation Engineering", subtopic: "Pavement drainage coefficient default",
  difficulty: "easy", estimatedTimeSeconds: 30,
  explanation: "When drainage coefficients are not given, use m = 1.0. Values below 1.0 represent poor drainage and are used only when given; a value of 0 would remove the layer.",
  videoUrl: null, videoTitle: null
}, function () {
  var a = pick([0.12, 0.14]), D = pick([8, 10]);
  var question = "A pavement design problem gives layer coefficients and thicknesses (for example a = " + a.toFixed(2) + ", D = " + D + " in. for the base) but does not give drainage coefficients. What value should be used for m in the structural number equation?";
  var solution = CT("transportation-082") + "\n\nUse the default \\(m = 1.0\\) for each layer. Drainage coefficients different from 1.0 are used only when the problem states them.";
  return { variantKey: "a" + a + "_D" + D, question: question,
    options: [
      { label: "1.0", num: 1.0, correct: true },
      { label: "0.8", num: 0.8, correct: false },
      { label: "1.2", num: 1.2, correct: false },
      { label: "0.0", num: 0.0, correct: false }
    ], solution: solution };
});


  window.TRANSPORTATION_GENERATORS = TRANSPORT_ENTRIES;
})();
