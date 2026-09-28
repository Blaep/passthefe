#!/usr/bin/env python3
"""Build data/citation-links.json: handbook section name -> [equation ids].

Matches the "Refer to the <Section> section in the <Chapter> chapter" citation
lines in data/questions.json against the section names in data/equations.json.
Only exact section-name matches are linked — never guess.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIT_PAT = re.compile(r"Refer to the (.+?) section in the (.+?) chapter")


def main():
    eqs = json.load(open(os.path.join(ROOT, "data", "equations.json")))
    bank = json.load(open(os.path.join(ROOT, "data", "questions.json")))["questions"]

    section_to_ids = {}
    for e in eqs:
        section_to_ids.setdefault(e["section"], []).append(e["id"])

    cited_sections = set()
    for q in bank:
        m = CIT_PAT.search(q.get("solution", ""))
        if m:
            cited_sections.add(m.group(1))

    links = {}
    for section in sorted(cited_sections):
        if section in section_to_ids:
            links[section] = section_to_ids[section]

    out = os.path.join(ROOT, "data", "citation-links.json")
    json.dump(links, open(out, "w"), indent=1, ensure_ascii=False)
    matched = sum(1 for q in bank
                  if (lambda m: m and m.group(1) in links)(CIT_PAT.search(q.get("solution", ""))))
    print(f"sections cited: {len(cited_sections)}, linked: {len(links)}, "
          f"questions with a linked citation: {matched}/{len(bank)}")


if __name__ == "__main__":
    sys.exit(main())
