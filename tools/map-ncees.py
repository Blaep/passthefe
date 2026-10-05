#!/usr/bin/env python3
"""Map each bank question to an official NCEES FE Civil subtopic code (e.g. '5D').
Outputs data/ncees-mastery.json: areas + official subtopics + qid->code map + offspec list.
Rule-based; every mapping is reviewed in the printed audit report.
"""
import json, re, sys
from collections import defaultdict

SRC = "/home/hatch/workspace/passthevfe-src/data/questions.json"
OUT = "/home/hatch/workspace/passthevfe-src/data/ncees-mastery.json"

AREAS = [
 (1, "Mathematics and Statistics", "8\u201312", ["Mathematics", "Statistics and Probability"],
  [("1A", "Analytic geometry"),
   ("1B", "Single-variable calculus"),
   ("1C", "Vector operations"),
   ("1D", "Statistics (e.g., distributions, mean, mode, standard deviation, confidence interval, regression and curve fitting)")]),
 (2, "Ethics and Professional Practice", "4\u20136", ["Ethics and Professional Practice"],
  [("2A", "Codes of ethics (professional and technical societies)"),
   ("2B", "Professional liability"),
   ("2C", "Licensure"),
   ("2D", "Contracts and contract law")]),
 (3, "Engineering Economics", "5\u20138", ["Engineering Economics"],
  [("3A", "Time value of money (e.g., equivalence, present worth, equivalent annual worth, future worth, rate of return)"),
   ("3B", "Cost (e.g., fixed, variable, direct and indirect labor, incremental, average, sunk)"),
   ("3C", "Analyses (e.g., break-even, benefit-cost, life cycle, sustainability, renewable energy)"),
   ("3D", "Uncertainty (e.g., expected value and risk)")]),
 (4, "Statics", "8\u201312", ["Statics"],
  [("4A", "Resultants of force systems"),
   ("4B", "Equivalent force systems"),
   ("4C", "Equilibrium of rigid bodies"),
   ("4D", "Frames and trusses"),
   ("4E", "Centroid of area"),
   ("4F", "Area moments of inertia"),
   ("4G", "Static friction")]),
 (5, "Dynamics", "4\u20136", ["Dynamics"],
  [("5A", "Kinematics (e.g., particles, rigid bodies)"),
   ("5B", "Mass moments of inertia"),
   ("5C", "Force acceleration (e.g., particles, rigid bodies)"),
   ("5D", "Work, energy, and power (e.g., particles, rigid bodies)")]),
 (6, "Mechanics of Materials", "7\u201311", ["Mechanics of Materials"],
  [("6A", "Shear and moment diagrams"),
   ("6B", "Stresses and strains (e.g., diagrams, axial, torsion, bending, shear, thermal)"),
   ("6C", "Deformations (e.g., axial, torsion, bending, thermal)"),
   ("6D", "Combined stresses, principal stresses, and Mohr's circle")]),
 (7, "Materials", "5\u20138", ["Materials"],
  [("7A", "Mix design of concrete and asphalt"),
   ("7B", "Test methods and specifications of metals, concrete, aggregates, asphalt, and wood"),
   ("7C", "Physical and mechanical properties of metals, concrete, aggregates, asphalt, and wood")]),
 (8, "Fluid Mechanics", "6\u20139", ["Fluid Mechanics"],
  [("8A", "Flow measurement"),
   ("8B", "Fluid properties"),
   ("8C", "Fluid statics"),
   ("8D", "Energy, impulse, and momentum of fluids")]),
 (9, "Surveying", "6\u20139", ["Surveying"],
  [("9A", "Angles, distances, and trigonometry"),
   ("9B", "Area computations"),
   ("9C", "Earthwork and volume computations"),
   ("9D", "Coordinate systems (e.g., state plane, latitude/longitude)"),
   ("9E", "Leveling (e.g., differential, elevations, percent grades)")]),
 (10, "Water Resources and Environmental Engineering", "10\u201315", ["Water Resources"],
  [("10A", "Basic hydrology (e.g., infiltration, rainfall, runoff, watersheds)"),
   ("10B", "Basic hydraulics (e.g., Manning equation, Bernoulli theorem, open-channel flow)"),
   ("10C", "Pumps"),
   ("10D", "Water distribution systems"),
   ("10E", "Flood control (e.g., dams, routing, spillways)"),
   ("10F", "Stormwater (e.g., detention, routing, quality)"),
   ("10G", "Collection systems (e.g., wastewater, stormwater)"),
   ("10H", "Groundwater (e.g., flow, wells, drawdown)"),
   ("10I", "Water quality (e.g., ground and surface, basic water chemistry)"),
   ("10J", "Testing and standards (e.g., water, wastewater, air, noise)"),
   ("10K", "Water and wastewater treatment (e.g., biological processes, softening, drinking water treatment)")]),
 (11, "Structural Engineering", "10\u201315", ["Structural Engineering"],
  [("11A", "Analysis of statically determinant beams, columns, trusses, and frames"),
   ("11B", "Deflection of statically determinant beams, trusses, and frames"),
   ("11C", "Column analysis (e.g., buckling, boundary conditions)"),
   ("11D", "Structural determinacy and stability analysis of beams, trusses, and frames"),
   ("11E", "Elementary statically indeterminate structures"),
   ("11F", "Loads, load combinations, and load paths (e.g., dead, live, lateral, influence lines and moving loads, tributary areas)"),
   ("11G", "Design of steel components (e.g., codes and design philosophies, beams, columns, tension members, connections)"),
   ("11H", "Design of reinforced concrete components (e.g., codes and design philosophies, beams, columns)")]),
 (12, "Geotechnical Engineering", "10\u201315", ["Geotechnical Engineering"],
  [("12A", "Index properties and soil classifications"),
   ("12B", "Phase relations"),
   ("12C", "Laboratory and field tests"),
   ("12D", "Effective stress"),
   ("12E", "Stability of retaining structures (e.g., active/passive/at-rest pressure)"),
   ("12F", "Shear strength"),
   ("12G", "Bearing capacity"),
   ("12H", "Foundation types (e.g., spread footings, deep foundations, wall footings, mats)"),
   ("12I", "Consolidation and differential settlement"),
   ("12J", "Slope stability (e.g., fills, embankments, cuts, dams)"),
   ("12K", "Soil stabilization (e.g., chemical additives, geosynthetics)")]),
 (13, "Transportation Engineering", "9\u201314", ["Transportation Engineering"],
  [("13A", "Geometric design (e.g., streets, highways, intersections)"),
   ("13B", "Pavement system design (e.g., thickness, subgrade, drainage, rehabilitation)"),
   ("13C", "Traffic capacity and flow theory"),
   ("13D", "Traffic control devices"),
   ("13E", "Transportation planning (e.g., travel forecast modeling, safety, trip generation)")]),
 (14, "Construction Engineering", "8\u201312", ["Construction Engineering"],
  [("14A", "Project administration (e.g., documents, management, procurement, project delivery methods)"),
   ("14B", "Construction operations and methods (e.g., safety, equipment, productivity analysis, temporary erosion control)"),
   ("14C", "Project controls (e.g., earned value, scheduling, allocation of resources, activity relationships)"),
   ("14D", "Construction estimating"),
   ("14E", "Interpretation of engineering drawings")]),
]

OFFSPEC = "OFFSPEC"  # in bank but not in the FE Civil specs

def has(s, *words):
    s = s.lower()
    return any(w in s for w in words)

def map_question(q):
    t = q["topic"]
    s = (q.get("subtopic") or "").lower()
    # ---- explicit per-question overrides handled after rules; rules below ----
    if t == "Mathematics":
        if has(s, "centroid"): return "4E"
        if has(s, "complex multiplication"): return OFFSPEC
        if has(s, "cross product", "dot product"): return "1C"
        if has(s, "curl", "divergence", "gradient", "partial derivatives"): return OFFSPEC
        if has(s, "determinant", "eigenvalue", "matrix inverse", "linear independence", "systems of linear equations"): return OFFSPEC
        if has(s, "differential equation", "laplace"): return OFFSPEC
        if has(s, "newton's method", "simpson", "trapezoidal", "numerical integration", "euler forward"): return OFFSPEC
        if has(s, "law of cosines"): return "1A"
        if has(s, "integral", "derivative", "differentiation", "l'hôpital", "l'hopital", "taylor", "maclaurin", "u-substitution", "integration by parts", "area between curves", "tangent line"): return "1B"
        return OFFSPEC
    if t == "Statistics and Probability":
        return "1D"
    if t == "Ethics and Professional Practice":
        if has(s, "licensure", "responsible charge", "plan stamping", "continuing professional development", "multi-jurisdiction"): return "2C"
        if has(s, "competitive bidding", "contingent compensation", "contracts and bidding"): return "2D"
        if has(s, "liability", "standard of care", "project coordination responsibility"): return "2B"
        return "2A"
    if t == "Engineering Economics":
        if has(s, "depreciation", "book value", "macrs", "bond valuation", "taxable income"): return OFFSPEC
        if has(s, "break-even", "benefit-cost", "payback"): return "3C"
        if has(s, "decision tree", "expected value"): return "3D"
        if has(s, "cost index"): return "3B"
        return "3A"
    if t == "Statics":
        if has(s, "resultant"): return "4A"
        if has(s, "couple moment", "distributed load", "partial distributed"): return "4B"
        if has(s, "truss", "zero-force", "two-force", "method of joints", "method of sections"): return "4D"
        if has(s, "centroid"): return "4E"
        if has(s, "moment of inertia", "radius of gyration", "product of inertia", "polar moment"): return "4F"
        if has(s, "friction", "belt", "capstan", "screw jack", "tipping"): return "4G"
        if has(s, "equilibrium", "reactions", "cantilever beam", "overhanging beam", "compound beam", "gerber", "moment about"): return "4C"
        return "4C"
    if t == "Dynamics":
        if has(s, "vibration", "logarithmic decrement", "natural frequency"): return OFFSPEC
        if has(s, "mass moment of inertia", "radius of gyration"): return "5B"
        if has(s, "work", "energy", "power", "impulse", "momentum", "impact", "spring"): return "5D"
        if has(s, "newton", "kinetics", "friction", "pendulum"): return "5C"
        return "5A"  # kinematics default
    if t == "Mechanics of Materials":
        if has(s, "column buckling", "effective length"): return "11C"
        if has(s, "fatigue", "goodman"): return OFFSPEC
        if has(s, "shear and moment", "shear force diagram"): return "6A"
        if has(s, "mohr", "principal stress", "combined", "stress transformation", "von mises"): return "6D"
        if has(s, "deformation", "angle of twist", "deflection", "elongation", "indeterminate"): return "6C"
        return "6B"
    if t == "Materials":
        if has(s, "axial deformation", "hooke"): return "6C"
        if has(s, "thermal stress"): return "6B"
        if has(s, "fick", "fourier", "lever rule", "grain size", "electrical resistivity", "rule of mixtures"): return OFFSPEC
        if has(s, "thermal expansion"): return "7C"
        if has(s, "mix design", "absolute volume"): return "7A"
        if has(s, "fineness modulus"): return "7B"
        if has(s, "charpy", "non-destructive", "testing"): return "7B"
        return "7C"
    if t == "Fluid Mechanics":
        if has(s, "manning"): return "10B"
        if has(s, "pump"): return "10C"
        if has(s, "buckingham", "similitude", "froude scaling", "mach number", "stagnation temperature", "drag force", "lift force"): return OFFSPEC
        if has(s, "pitot", "orifice", "flow measurement", "weir"): return "8A"
        if has(s, "viscosity", "surface tension", "capillarity", "fluid properties", "reynolds"): return "8B"
        if has(s, "manometer", "hydrostatic", "buoyancy", "floating", "center of pressure"): return "8C"
        return "8D"
    if t == "Surveying":
        if has(s, "curve", "superelevation", "sight distance", "stopping sight"): return "13A"
        if has(s, "area by", "coordinate method"): return "9B"
        if has(s, "earthwork", "volume", "borrow", "shrinkage", "mass haul", "stockpile"): return "9C"
        if has(s, "leveling", "benchmark", "datum", "curvature and refraction", "height of instrument", "arithmetic check"): return "9E"
        if has(s, "traverse", "latitude and departure", "bearing", "azimuth", "stadia", "slope distance"): return "9A"
        return "9A"
    if t == "Water Resources":
        if has(s, "bernoulli"): return "8D"
        if has(s, "continuity equation"): return "8D"
        if has(s, "hydrostatic"): return "8C"
        if has(s, "rational method", "scs", "curve number", "unit hydrograph", "runoff", "evaporation", "watershed"): return "10A"
        if has(s, "manning", "critical depth", "critical slope", "specific energy", "hydraulic jump", "sequent depth", "open channel", "froude number", "normal depth", "trapezoidal channel"): return "10B"
        if has(s, "weir"): return "10B"
        if has(s, "pump"): return "10C"
        if has(s, "hazen-williams", "head loss", "distribution", "population projection"): return "10D"
        if has(s, "detention"): return "10F"
        if has(s, "thiem", "dupuit", "darcy", "aquifer", "seepage velocity", "well", "groundwater", "confined"): return "10H"
        if has(s, "bod"): return "10I"
        if has(s, "disinfection", "ct ", "treatment"): return "10K"
        return "10B"
    if t == "Structural Engineering":
        if has(s, "shear and moment"): return "6A"
        if has(s, "deflection"): return "11B"
        if has(s, "buckling", "column", "effective length"): return "11C"
        if has(s, "determinacy", "stability", "indeterminacy"): return "11D"
        if has(s, "force method", "moment distribution", "slope deflection", "fixed-end", "carryover", "indeterminate"): return "11E"
        if has(s, "load combination", "asce 7", "lrfd", "influence line", "moving load", "tributary", "snow load", "wind"): return "11F"
        if has(s, "steel", "block shear", "net area", "tension member"): return "11G"
        if has(s, "reinforced concrete", "rc ", "shear strength", "flexural strength", "detailing", "reduction factor"): return "11H"
        if has(s, "beam"): return "11A"
        if has(s, "truss"): return "11A"
        if has(s, "frame"): return "11A"
        return "11A"
    if t == "Geotechnical Engineering":
        if has(s, "atterberg", "plasticity", "uscs", "aashto", "group index", "gradation", "uniformity", "curvature", "classification"): return "12A"
        if has(s, "phase", "void ratio", "saturation", "unit weight"): return "12B"
        if has(s, "proctor", "compaction", "relative compaction", "relative density", "optimum water"): return "12C"
        if has(s, "permeability", "flow net", "seepage", "quicksand", "liquefaction"): return "12D"
        if has(s, "effective stress"): return "12D"
        if has(s, "rankine", "at-rest", "overconsolidated", "retaining wall", "overturning", "earth pressure"): return "12E"
        if has(s, "shear strength", "mohr-coulomb"): return "12F"
        if has(s, "bearing capacity", "terzaghi"): return "12G"
        if has(s, "consolidation", "settlement", "time factor"): return "12I"
        if has(s, "slope stability", "infinite slope"): return "12J"
        return "12D"
    if t == "Transportation Engineering":
        if has(s, "curve", "superelevation", "sight distance", "geometric", "intersection sight"): return "13A"
        if has(s, "pavement", "structural number", "load equivalency", "subgrade"): return "13B"
        if has(s, "signal", "all-red", "yellow interval", "pedestrian", "clearance"): return "13D"
        if has(s, "gravity model", "logit", "trip", "crash", "safety", "planning"): return "13E"
        return "13C"
    if t == "Construction Engineering":
        if has(s, "depreciation", "book value"): return OFFSPEC
        if has(s, "noise"): return "10J"
        if has(s, "cpm", "float", "critical path", "precedence", "crashing"): return "14C"
        if has(s, "earned value", "cost performance", "schedule performance", "estimate at completion", "estimate to complete", "variance"): return "14C"
        if has(s, "safety", "osha", "fall protection", "confined space", "incidence rate"): return "14B"
        if has(s, "equipment", "productivity", "learning curve", "fleet", "ownership cost"): return "14B"
        if has(s, "estimating", "quantity takeoff", "cost estimation"): return "14D"
        if has(s, "contract", "bidding", "retainage", "progress payment", "procurement", "administration"): return "14A"
        if has(s, "earthwork"): return "14D"
        return "14B"
    return OFFSPEC

def main():
    qs = json.load(open(SRC))["questions"]
    qmap, offspec = {}, []
    audit = []
    for q in qs:
        code = map_question(q)
        qmap[q["id"]] = code
        if code == OFFSPEC:
            offspec.append(q["id"])
        audit.append((q["id"], q["topic"], q.get("subtopic"), code))
    # coverage per code
    cov = defaultdict(int)
    for _id, code in qmap.items():
        cov[code] += 1
    areas_json = []
    for n, name, rng, bankTopics, subs in AREAS:
        areas_json.append({
            "n": n, "name": name, "questions": rng, "bankTopics": bankTopics,
            "subtopics": [{"code": c, "label": l, "count": cov.get(c, 0)} for c, l in subs],
        })
    json.dump({"areas": areas_json, "map": qmap, "offspec": offspec,
               "spec": "NCEES FE Civil CBT Exam Specifications, effective July 2020"},
              open(OUT, "w"), indent=1)
    print(f"mapped {len(qmap)} questions, offspec={len(offspec)}")
    print("\n== coverage by NCEES subtopic ==")
    for n, name, rng, bankTopics, subs in AREAS:
        print(f"\n{n}. {name} ({rng})")
        for c, l in subs:
            print(f"   {cov.get(c,0):3d}  {c} {l[:72]}")
    print("\n== OFFSPEC questions ==")
    for _id, topic, sub, code in audit:
        if code == OFFSPEC:
            print(f"   {_id:22s} [{topic}] {sub}")

if __name__ == "__main__":
    main()
