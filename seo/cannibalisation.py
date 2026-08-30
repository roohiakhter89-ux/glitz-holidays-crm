# -*- coding: utf-8 -*-
"""Cannibalisation / dedup risk across the manifest.

Three Google systems interact badly with a wide, thin page set:
  - the site diversity system caps a domain at ~2 results per query
  - deduplication filters near-identical documents
  - passage ranking can surface one section of a deep page independently
Together they argue that some tiers should be consolidated, not expanded.
"""
import json, collections, re

P = json.load(open(r"C:\Users\user\Desktop\glitz\seo\page-manifest.json", encoding="utf-8"))


def group(pred, key):
    g = collections.defaultdict(list)
    for p in P:
        if pred(p):
            g[key(p)].append(p)
    return g


print("=" * 68)
print("TIER 5 — MONTH PAGES")
months = group(lambda p: p["family"] == "guide-month",
               lambda p: p["url"].split("/guides/")[1].rsplit("-in-", 1)[0])
print(f"  {sum(len(v) for v in months.values())} pages across {len(months)} places")
for place, ps in sorted(months.items(), key=lambda x: -len(x[1])):
    impr = sum(p["impr"] for p in ps)
    print(f"    {place:16s} {len(ps):>3} month pages  {impr:>7,} impr  "
          f"(consolidated: 1 page, {len(ps)} passages)")
saved5 = sum(len(v) for v in months.values()) - len(months)
print(f"  --> consolidating to one page per place: {len(months)} pages, saves {saved5}")

print()
print("=" * 68)
print("TIER 3 — ROUTE PAGES")
routes = group(lambda p: p["family"].startswith("route-"),
               lambda p: p["url"].split("/routes/")[1].rsplit("-", 1)[0])
multi = {k: v for k, v in routes.items() if len(v) > 1}
print(f"  {sum(len(v) for v in routes.values())} pages across {len(routes)} origin-destination pairs")
print(f"  {len(multi)} pairs have 2-3 mode pages that compete with each other:")
for pair, ps in sorted(multi.items(), key=lambda x: -sum(p['impr'] for p in x[1]))[:12]:
    modes = ",".join(sorted(p["family"].replace("route-", "") for p in ps))
    impr = sum(p["impr"] for p in ps)
    print(f"    {pair:34s} [{modes:18s}] {impr:>6,} impr")
saved3 = sum(len(v) for v in routes.values()) - len(routes)
print(f"  --> one page per pair with a mode section each: {len(routes)} pages, saves {saved3}")

print()
print("=" * 68)
print("TIER 4 — PLACE x INTENT")
pxi = group(lambda p: p["family"].startswith("guide-") and p["family"] != "guide-month",
            lambda p: re.sub(r"^(places-to-visit-in|best-time-to-visit|how-to-reach|where-to-stay-in)-", "",
                             p["url"].split("/guides/")[1]).replace("-tour-packages-prices", ""))
multi4 = {k: v for k, v in pxi.items() if len(v) > 1}
print(f"  {sum(len(v) for v in pxi.values())} pages across {len(pxi)} places")
print(f"  {len(multi4)} places have 2+ intent pages:")
for place, ps in sorted(multi4.items(), key=lambda x: -sum(p['impr'] for p in x[1]))[:10]:
    ins = ",".join(sorted(p["family"].replace("guide-", "") for p in ps))
    print(f"    {place:16s} {len(ps)} pages [{ins}]  {sum(p['impr'] for p in ps):>7,} impr")

print()
print("=" * 68)
print("TIER 6 — HINDI MIRRORS")
hi = [p for p in P if p["family"] == "hindi-mirror"]
print(f"  {len(hi)} mirrors of English pages.")
print("  These reuse the SOURCE page impressions — they are not additional demand.")
print("  Hindi queries in the report:", sum(p['impr'] for p in P if p['family'] == 'hindi'), "impr across 5 seed pages.")
print("  --> the 40 mirrors are speculative; the 5 seeds are demand-backed.")

print()
print("=" * 68)
total = len(P)
consolidated = total - saved5 - saved3 - 35   # 35 = trimming speculative hindi mirrors
print(f"  manifest as generated      : {total} pages")
print(f"  month consolidation        : -{saved5}")
print(f"  route consolidation        : -{saved3}")
print(f"  drop speculative mirrors   : -35")
print(f"  consolidated target        : ~{consolidated} pages")
print(f"  reduction                  : {(1-consolidated/total)*100:.0f}%")
