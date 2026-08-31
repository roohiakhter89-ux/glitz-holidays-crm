# -*- coding: utf-8 -*-
"""Crawl the local site and measure the internal link graph.

PageRank is still a live ranking system, and on a site this size the dominant
factor in whether a NEW page can rank is how much internal link equity reaches
it and how many clicks it sits from the home page. Measure before theorising.
"""
import re, collections, urllib.request, urllib.parse

ROOT = "http://localhost:3002"
NAV_HINT = re.compile(r"<(nav|header|footer)[^>]*>.*?</\1>", re.S | re.I)

seen, queue = {}, [("/", 0)]
edges = collections.defaultdict(set)      # from -> set(to)   (main content only)
all_edges = collections.defaultdict(set)  # from -> set(to)   (incl. nav/footer)


def fetch(path):
    try:
        with urllib.request.urlopen(ROOT + path, timeout=30) as r:
            return r.read().decode("utf-8", "ignore")
    except Exception as e:
        return None


while queue:
    path, depth = queue.pop(0)
    if path in seen:
        continue
    html = fetch(path)
    if html is None:
        seen[path] = (depth, None)
        continue
    seen[path] = (depth, len(html))

    # strip nav/header/footer to isolate main-content links, which carry more
    # weight than sitewide boilerplate under the reasonable-surfer model
    body = NAV_HINT.sub(" ", html)

    def links(src):
        out = set()
        for m in re.finditer(r'href="(/[^"#?]*)"', src):
            u = m.group(1).rstrip("/") or "/"
            if re.search(r"\.(xml|txt|jpg|png|svg|ico|webp|json|css|js|mjs|woff2?|ttf|map)$", u, re.I):
                continue
            if u.startswith("/_next/") or u.startswith("/api/"):
                continue
            out.add(u)
        return out

    main_links = links(body)
    every_link = links(html)
    edges[path] |= main_links
    all_edges[path] |= every_link

    for u in every_link:
        if u not in seen:
            queue.append((u, depth + 1))

pages = sorted(seen)
print(f"crawled {len(pages)} pages\n")

# ── crawl depth ────────────────────────────────────────────────────────────
bydepth = collections.Counter(d for d, _ in seen.values())
print("CRAWL DEPTH FROM HOME (clicks)")
for d in sorted(bydepth):
    print(f"  depth {d}: {bydepth[d]:>3} pages")

# ── inlinks ────────────────────────────────────────────────────────────────
inmain = collections.Counter()
inall = collections.Counter()
for src, dsts in edges.items():
    for d in dsts:
        if d != src:
            inmain[d] += 1
for src, dsts in all_edges.items():
    for d in dsts:
        if d != src:
            inall[d] += 1

orphan_main = [p for p in pages if inmain[p] == 0 and p != "/"]
print(f"\nPages with ZERO main-content inlinks: {len(orphan_main)}")
for p in sorted(orphan_main)[:30]:
    print(f"   {p:52s} (nav/footer inlinks: {inall[p]})")

# ── simplified PageRank over the main-content graph ────────────────────────
N = len(pages)
idx = {p: i for i, p in enumerate(pages)}
out = {p: [d for d in edges[p] if d in idx and d != p] for p in pages}
pr = {p: 1.0 / N for p in pages}
DAMP = 0.85
for _ in range(60):
    nxt = {p: (1 - DAMP) / N for p in pages}
    sink = 0.0
    for p in pages:
        if not out[p]:
            sink += pr[p]
            continue
        share = DAMP * pr[p] / len(out[p])
        for d in out[p]:
            nxt[d] += share
    for p in pages:
        nxt[p] += DAMP * sink / N
    pr = nxt

ranked = sorted(pr.items(), key=lambda x: -x[1])
print("\nINTERNAL PAGERANK — TOP 15 (where equity currently pools)")
for p, v in ranked[:15]:
    print(f"  {v*1000:7.2f}  {p:52s} inlinks={inmain[p]}")
print("\nINTERNAL PAGERANK — BOTTOM 15 (lowest inlink equity)")
for p, v in ranked[-15:]:
    print(f"  {v*1000:7.2f}  {p:52s} inlinks={inmain[p]}")

# ── programmatic SEO clusters ──────────────────────────────────────────────
PROGRAMMATIC = [p for p in pages if p.startswith("/packages/") or p.startswith("/routes/") or p.startswith("/guides/") or p.startswith("/hi/")]
print(f"\nPROGRAMMATIC PAGES OVERVIEW ({len(PROGRAMMATIC)} pages)")
avg_prog = sum(pr[p] for p in PROGRAMMATIC) / max(len(PROGRAMMATIC), 1) * 1000
avg_all = sum(pr.values()) / max(len(pages), 1) * 1000
print(f"  avg PageRank across programmatic cluster: {avg_prog:.2f}")
print(f"  avg PageRank across entire site          : {avg_all:.2f}")
print(f"  equity ratio                             : {avg_prog/avg_all:.2f}x")
