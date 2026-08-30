# -*- coding: utf-8 -*-
"""Generate the demand-backed page manifest from the Google Ads search terms report.
Every emitted page cites the real queries that justify it."""
import csv, collections, re, json, os

rows = [r for r in csv.DictReader(open("clean.tsv", encoding="utf-8"), delimiter="\t")
        if not r["term"].startswith("total:")]
F = lambda r, k: float(r[k])
agg = collections.defaultdict(lambda: [0.0] * 4)
for r in rows:
    a = agg[r["term"]]
    a[0] += F(r, "impr"); a[1] += F(r, "clicks"); a[2] += F(r, "cost"); a[3] += F(r, "conv")
T = dict(agg)


def slug(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return re.sub(r"-+", "-", s)


OFFTARGET = re.compile(
    r"\b(darjeeling|kerala|goa|andaman|sundarban|pachmarhi|kasol|nainital|mussoorie|ooty|kodaikanal"
    r"|munnar|coorg|pondicherry|puducherry|mcleodganj|kalimpong|pelling|gangtok|sikkim|tirupati|shirdi"
    r"|mahabaleshwar|lonavala|jaisalmer|rann|dubai|thailand|bali|maldives|nepal|bhutan|vietnam|europe"
    r"|murdeshwar|lambasingi|tapola|gt holidays|gtholidays|kesari|veena|thomas cook|makemytrip"
    r"|make my trip|adigas|club mahindra|sotc|irctc)\b")


def clean(t):
    return not OFFTARGET.search(t)


def block(qs):
    return dict(
        n=len(qs), impr=round(sum(v[0] for _, v in qs)), clicks=round(sum(v[1] for _, v in qs)),
        conv=round(sum(v[3] for _, v in qs), 1),
        top=[{"q": t, "impr": round(v[0]), "clicks": round(v[1]), "conv": round(v[3], 1)}
             for t, v in qs[:8]])


PAGES = []
def add(**kw):
    PAGES.append(kw)


JK = re.compile(r"(kashmir|srinagar|gulmarg|pahalgam|sonmarg|leh|ladakh|katra|vaishno devi|patnitop|jammu)")

# ---------------- TIER 1: packages from origin city ----------------
CITIES = [
    ("delhi", ["delhi", "new delhi"]), ("mumbai", ["mumbai"]),
    ("bangalore", ["bangalore", "bengaluru"]), ("hyderabad", ["hyderabad"]),
    ("chennai", ["chennai"]), ("kolkata", ["kolkata", "howrah"]), ("pune", ["pune"]),
    ("ahmedabad", ["ahmedabad"]), ("chandigarh", ["chandigarh"]), ("lucknow", ["lucknow"]),
    ("jaipur", ["jaipur"]), ("amritsar", ["amritsar"]), ("nagpur", ["nagpur"]),
    ("indore", ["indore"]), ("kochi", ["kochi", "cochin", "ernakulam"]), ("guwahati", ["guwahati"]),
    ("patna", ["patna"]), ("dehradun", ["dehradun"]), ("varanasi", ["varanasi"]),
    ("bhopal", ["bhopal"]), ("surat", ["surat"]), ("vadodara", ["vadodara"]),
    ("ludhiana", ["ludhiana"]), ("jalandhar", ["jalandhar"]), ("kanpur", ["kanpur"]),
    ("agra", ["agra"]), ("jodhpur", ["jodhpur"]), ("udaipur", ["udaipur"]),
    ("raipur", ["raipur"]), ("ranchi", ["ranchi"]), ("bhubaneswar", ["bhubaneswar"]),
    ("coimbatore", ["coimbatore"]), ("trivandrum", ["trivandrum", "thiruvananthapuram"]),
    ("calicut", ["calicut", "kozhikode"]), ("mangalore", ["mangalore"]),
    ("mysore", ["mysore", "mysuru"]), ("nashik", ["nashik"]), ("aurangabad", ["aurangabad"]),
    ("rajkot", ["rajkot"]), ("jamshedpur", ["jamshedpur"]), ("siliguri", ["siliguri"]),
    ("gwalior", ["gwalior"]), ("jabalpur", ["jabalpur"]),
    ("allahabad", ["allahabad", "prayagraj"]), ("meerut", ["meerut"]), ("noida", ["noida"]),
    ("gurgaon", ["gurgaon", "gurugram"]), ("thane", ["thane"]), ("madurai", ["madurai"]),
    ("salem", ["salem"]), ("vijayawada", ["vijayawada"]),
    ("visakhapatnam", ["visakhapatnam", "vizag"]),
]
for city, alts in CITIES:
    rx = re.compile(r"\b(" + "|".join(re.escape(a) for a in alts) + r")\b")
    qs = [(t, v) for t, v in T.items() if clean(t) and rx.search(t) and JK.search(t)]
    if len(qs) < 4:
        continue
    qs = sorted(qs, key=lambda x: -x[1][0])
    name = city.title()
    add(tier=1, family="packages-from-city", url="/packages/from/" + city,
        h1="Kashmir Tour Packages from " + name,
        title="Kashmir Tour Packages from %s - Flights, Fares & Itineraries | Glitz Holidays" % name,
        primary="kashmir packages from " + city, **block(qs),
        content=[
            "Live round-trip airfare band %s to SXR, and the carriers that actually fly it" % name,
            "Real flight duration, direct vs via DEL - this changes Day 1 completely",
            "Train option from %s: actual train names/numbers to Jammu Tawi plus the road leg" % name,
            "Three packages priced ex-%s, land-only AND with-flight, per person twin-sharing" % name,
            "Day 1 itinerary written for the actual %s arrival time, not a generic Day 1" % name,
            "Best months to fly from %s and when fares spike (school holidays, Eid, Christmas)" % name,
            "FAQ: cheapest month from %s, baggage for snow gear, connecting-flight risk" % name,
            "Internal links to the three packages and /routes/%s-to-srinagar-flight" % city,
        ], words="1200-1600")

# ---------------- TIER 2: honeymoon / couple / family ----------------
HM = re.compile(r"\b(honeymoon|couple|couples|romantic|newly)\b")
FAM = re.compile(r"\b(family|families|kids|children|parents|senior)\b")

hm_all = sorted([(t, v) for t, v in T.items() if clean(t) and HM.search(t)], key=lambda x: -x[1][0])
add(tier=2, family="honeymoon-hub", url="/travel-styles/honeymoon",
    h1="Kashmir Honeymoon Packages",
    title="Kashmir Honeymoon Packages 2026 - Prices, Itineraries & Real Couples | Glitz Holidays",
    primary="kashmir honeymoon packages", **block(hm_all),
    content=[
        "Rewrite the existing style page as the honeymoon pillar - it must own the head term",
        "Price table: 4N/5N/6N honeymoon variants, per couple AND per person",
        "What is actually different vs a normal package: private shikara, candlelit dinner, room category, decor",
        "Month-by-month honeymoon table - Dec snow vs Apr tulips vs Jul escape",
        "Real couple photos plus the GBP reviews filtered to honeymoon",
        "Links down to every /packages/honeymoon/* and /packages/from/* page",
    ], words="1800-2200")

for city, alts in CITIES[:22]:
    rx = re.compile(r"\b(" + "|".join(re.escape(a) for a in alts) + r")\b")
    qs = [(t, v) for t, v in T.items() if clean(t) and rx.search(t) and HM.search(t)]
    if len(qs) < 2:
        continue
    qs = sorted(qs, key=lambda x: -x[1][0])
    name = city.title()
    add(tier=2, family="honeymoon-from-city", url="/packages/honeymoon/from-" + city,
        h1="Kashmir Honeymoon Packages from " + name,
        title="Kashmir Honeymoon Packages from %s - All-Inclusive Couple Trips | Glitz Holidays" % name,
        primary="honeymoon packages from " + city, **block(qs),
        content=[
            "All-inclusive couple price ex-%s including flights - the intent is one number" % name,
            "Flight timing from %s and how it shapes Day 1 (houseboat vs hotel first night)" % name,
            "5N/6N couple itinerary with private transfers throughout",
            "Honeymoon inclusions stated plainly - decor, cake, candlelit dinner, shikara",
            "FAQ: best month from %s, ID for couples, privacy on houseboats" % name,
        ], words="1000-1400")

for place in ["gulmarg", "pahalgam", "srinagar", "sonmarg"]:
    rx = re.compile(r"\b" + place + r"\b")
    qs = [(t, v) for t, v in T.items() if clean(t) and rx.search(t) and HM.search(t)]
    if len(qs) < 2:
        continue
    qs = sorted(qs, key=lambda x: -x[1][0])
    add(tier=2, family="honeymoon-by-place", url="/packages/honeymoon/" + place,
        h1=place.title() + " Honeymoon Packages",
        title="%s Honeymoon Package - Prices & Romantic Itinerary | Glitz Holidays" % place.title(),
        primary=place + " honeymoon package", **block(qs),
        content=[
            "Why couples pick %s specifically, and who it does not suit" % place.title(),
            "Best %s honeymoon stays by room category with real price bands" % place.title(),
            "2N/3N add-on itinerary and how it slots into a wider Kashmir trip",
            "Seasonality for %s - the month table drives the booking decision" % place.title(),
        ], words="900-1200")

for n in [4, 5, 6, 7]:
    qs = [(t, v) for t, v in T.items()
          if clean(t) and HM.search(t) and re.search(r"\b%d\s*(night|nights|day|days)\b" % n, t)]
    if not qs:
        continue
    qs = sorted(qs, key=lambda x: -x[1][0])
    add(tier=2, family="honeymoon-by-duration", url="/packages/honeymoon/%d-nights" % n,
        h1="%d Nights Kashmir Honeymoon Package" % n,
        title="%d Nights %d Days Kashmir Honeymoon Package - Price & Itinerary | Glitz Holidays" % (n, n + 1),
        primary="kashmir honeymoon package %d nights" % n, **block(qs),
        content=[
            "Full %dN/%dD day-by-day couple itinerary" % (n, n + 1),
            "Exact price per couple, land-only and with-flight",
            "What fits in %d nights and what genuinely does not - set expectations honestly" % n,
            "Comparison strip against the adjacent durations",
        ], words="900-1200")

fam = sorted([(t, v) for t, v in T.items() if clean(t) and FAM.search(t) and JK.search(t)],
             key=lambda x: -x[1][0])
add(tier=2, family="family-hub", url="/travel-styles/family",
    h1="Kashmir Family Tour Packages",
    title="Kashmir Family Tour Packages - Kid-Friendly Itineraries & Prices | Glitz Holidays",
    primary="kashmir tour packages for family", **block(fam),
    content=[
        "Family pricing incl. child-with-bed / child-without-bed / extra adult - the actual decision",
        "Which sightseeing works with under-10s and which drives (Sonmarg, Zojila) do not",
        "Connecting rooms and family-room inventory by hotel tier",
        "Altitude and car-sickness notes for kids and grandparents",
        "Links to /packages/from/* for family flight fares, and the 2N/3N Katra pages",
    ], words="1400-1800")

# ---------------- TIER 3: transport routes ----------------
ORIG = ["delhi", "new delhi", "mumbai", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata",
        "howrah", "pune", "ahmedabad", "chandigarh", "lucknow", "jaipur", "amritsar", "nagpur",
        "indore", "kochi", "guwahati", "patna", "dehradun", "varanasi", "bhopal", "surat",
        "vadodara", "ludhiana", "jalandhar", "kanpur", "agra", "jammu", "katra", "udhampur",
        "pathankot", "srinagar", "leh", "jammu tawi", "banihal", "coimbatore", "trivandrum",
        "calicut", "mangalore", "raipur", "ranchi"]
DEST = ["kashmir", "srinagar", "gulmarg", "pahalgam", "sonmarg", "katra", "vaishno devi",
        "leh", "ladakh", "jammu", "patnitop"]
MODES = [
    ("flight", r"\b(flight|flights|air|airfare|airport|indigo|spicejet|vistara)\b", "by Flight"),
    ("train", r"\b(train|trains|railway|rail)\b", "by Train"),
    ("road", r"\b(by road|road|bus|drive|driving|taxi|cab|distance|km|how far)\b", "by Road"),
]
route = collections.defaultdict(list)
for t, v in T.items():
    if not clean(t) or " to " not in t:
        continue
    o = next((c for c in sorted(ORIG, key=len, reverse=True)
              if re.search(r"\b" + re.escape(c) + r"\b.*\bto\b", t)), None)
    d = next((c for c in sorted(DEST, key=len, reverse=True)
              if re.search(r"\bto\b.*\b" + re.escape(c) + r"\b", t)), None)
    if not o or not d or o == d:
        continue
    for mk, mrx, mlabel in MODES:
        if re.search(mrx, t):
            route[(o, d, mk, mlabel)].append((t, v))

FLIGHT_C = ["Live fare band %s to %s, cheapest vs fastest carrier, and the booking-window rule",
            "Exact flight duration, direct vs one-stop, and which airport you actually land at",
            "Baggage for snow gear and what SXR security restricts - a real recurring question"]
TRAIN_C = ["Actual train names and numbers on the %s to %s corridor with journey time",
           "Where the railhead ends and the road leg begins (Katra/Jammu Tawi/Banihal) - most searchers do not know this",
           "Tatkal timing, class-wise fare band, and the USBRL status note"]
ROAD_C = ["Road distance in km, realistic driving hours, and the Jawahar/Banihal tunnel reality",
          "Highway condition, winter closure risk, and the checkpoints that add time",
          "Private cab vs shared sumo vs bus - real fare bands for each"]

# CONSOLIDATED: one page per origin-destination pair, with a section per mode.
# Splitting by mode produced 157 pages across 88 pairs, where 53 pairs ran two
# or three near-identical pages competing for the same "delhi to srinagar"
# query family. Passage ranking lets one deep page win each mode query while
# accumulating all the links; dedup and site diversity punish the split.
pair = collections.defaultdict(dict)
for (o, d, mk, mlabel), qs in route.items():
    if len(qs) < 3:
        continue
    pair[(o, d)][mk] = qs

MODE_BLOCKS = {"flight": FLIGHT_C, "train": TRAIN_C, "road": ROAD_C}
MODE_H = {"flight": "By air", "train": "By rail", "road": "By road"}
for (o, d), modes in sorted(pair.items(), key=lambda x: -sum(v[0] for m in x[1].values() for _, v in m)):
    allq = [q for m in modes.values() for q in m]
    allq = sorted(allq, key=lambda x: -x[1][0])
    O, D = o.title(), d.title()
    present = [m for m in ("flight", "train", "road") if m in modes]
    blocks = ["Answer the fastest/cheapest question in the first 100 words, before any mode detail"]
    for mk in present:
        blocks += ["%s: %s" % (MODE_H[mk], b % (O, D) if "%s" in b else b)
                   for b in MODE_BLOCKS[mk][:2]]
    blocks += [
        "A single comparison table across %s for time, cost and comfort" % " / ".join(MODE_H[m].lower() for m in present),
        "Each mode section self-contained so passage ranking can lift it independently",
        "CTA block linking to /packages/from/%s" % slug(o),
        "FAQ drawn verbatim from the queries this page targets, one per mode",
    ]
    add(tier=3, family="route-pair",
        url="/routes/%s-to-%s" % (slug(o), slug(d)),
        h1="%s to %s" % (O, D),
        title="%s to %s - Train, Flight & Road Compared | Glitz Holidays" % (O, D),
        primary="%s to %s" % (o, d), **block(allq),
        content=blocks, words="1400-1900",
        modes=present)

# ---------------- TIER 4: place x intent ----------------
PLACES = ["srinagar", "gulmarg", "pahalgam", "sonmarg", "dal lake", "doodhpathri", "yusmarg",
          "aru valley", "betaab valley", "tulip garden", "nishat bagh", "shalimar bagh",
          "pari mahal", "shankaracharya", "hazratbal", "kokernag", "verinag", "sinthan top",
          "gurez", "zero point", "thajiwas", "baisaran", "chandanwari", "apharwat", "khilanmarg",
          "tangmarg", "drung", "leh", "ladakh", "pangong", "nubra", "turtuk", "khardung la",
          "magnetic hill", "shanti stupa", "hemis", "lamayuru", "kargil", "drass", "zanskar",
          "katra", "vaishno devi", "shivkhori", "patnitop", "sanasar", "nathatop", "mansar",
          "bhaderwah", "udhampur", "jammu", "amarnath", "kashmir", "gulmarg gondola",
          "wular lake", "manasbal"]
INTENTS = [
    ("places-to-visit", r"(places to visit|tourist places|things to do|sightseeing|attractions|spots|ghumne)",
     "Places to Visit in {P}", "{p} places to visit"),
    ("best-time", r"(best time|weather|temperature|climate|season|snowfall|snow in)",
     "Best Time to Visit {P}", "best time to visit {p}"),
    ("how-to-reach", r"(how to reach|how to go|distance|nearest airport|nearest railway|by road|route|kaise)",
     "How to Reach {P}", "how to reach {p}"),
    ("hotels", r"(hotel|hotels|houseboat|resort|stay|homestay|accommodation|camp)",
     "Where to Stay in {P}", "{p} hotels"),
    ("packages", r"(package|packages|tour cost|trip cost|price|budget|charges|itinerary)",
     "{P} Tour Packages & Prices", "{p} tour package"),
]
C_PTV = ["Ranked list of what to actually see in %s, each with time needed and entry cost",
         "A half-day vs full-day plan - most searchers are slotting this into a fixed trip",
         "What is overrated and what people miss - this is the section that earns links"]
C_BT = ["Month-by-month table for %s: temperature, snow, crowd, price index",
        "The single best window and the one month to avoid, stated plainly",
        "What changes access - Zojila and road closures, gondola phase status"]
C_HTR = ["All three modes into %s with real times, distances and fare bands",
         "Nearest airport and railhead named, with the final road leg spelled out",
         "Permit and ID requirements where they apply"]
C_HOT = ["Stay options in %s by tier with honest price bands and what each tier really gets you",
         "Location trade-offs - which area suits which traveller",
         "Booking-window guidance and peak-season reality"]
C_PKG = ["%s package prices with what is and is not included",
         "How %s slots into a wider Kashmir itinerary",
         "Duration options with day-by-day detail"]

combo = collections.defaultdict(list)
for t, v in T.items():
    if not clean(t):
        continue
    p = next((p for p in sorted(PLACES, key=len, reverse=True)
              if re.search(r"\b" + re.escape(p) + r"\b", t)), None)
    if not p:
        continue
    for ik, irx, h1t, pq in INTENTS:
        if re.search(irx, t):
            combo[(p, ik, h1t, pq)].append((t, v))

for (p, ik, h1t, pq), qs in sorted(combo.items(), key=lambda x: -sum(v[0] for _, v in x[1])):
    if len(qs) < 3:
        continue
    if p == "kashmir" and ik == "packages":
        continue
    qs = sorted(qs, key=lambda x: -x[1][0])
    P = p.title()
    base = {"places-to-visit": C_PTV, "best-time": C_BT, "how-to-reach": C_HTR,
            "hotels": C_HOT, "packages": C_PKG}[ik]
    blocks = [b % P if "%s" in b else b for b in base]
    blocks.append("Internal links to the %s packages and the other %s guides" % (P, P))
    add(tier=4, family="guide-" + ik,
        url="/guides/" + slug(h1t.replace("{P}", p)),
        h1=h1t.replace("{P}", P),
        title="%s (2026 Guide) | Glitz Holidays" % h1t.replace("{P}", P),
        primary=pq.replace("{p}", p), **block(qs),
        content=blocks, words="1000-1400")

# ---------------- TIER 5: month pages ----------------
MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august",
          "september", "october", "november", "december"]
MPLACES = ["kashmir", "srinagar", "gulmarg", "pahalgam", "sonmarg", "patnitop", "leh",
           "ladakh", "katra", "vaishno devi", "jammu"]
mcombo = collections.defaultdict(list)
for t, v in T.items():
    if not clean(t):
        continue
    m = next((m for m in MONTHS if re.search(r"\b" + m + r"\b", t)), None)
    if not m:
        continue
    p = next((p for p in sorted(MPLACES, key=len, reverse=True)
              if re.search(r"\b" + re.escape(p) + r"\b", t)), None)
    if not p:
        continue
    mcombo[(p, m)].append((t, v))

# CONSOLIDATED: one page per place carrying all twelve months as sections.
# Split by month this produced 108 pages across just 10 places — twelve
# near-identical documents each, differing by a month name and a temperature.
# That is the textbook dedup case. One page per place accumulates twelve times
# the links, and passage ranking still lets the January section win
# "kashmir in january".
byplace = collections.defaultdict(list)
for (p, m), qs in mcombo.items():
    if len(qs) < 2:
        continue
    byplace[p].append((m, qs))

for p, entries in sorted(byplace.items(), key=lambda x: -sum(v[0] for _, qs in x[1] for _, v in qs)):
    allq = sorted([q for _, qs in entries for q in qs], key=lambda x: -x[1][0])
    P = p.title()
    have = [m for m in MONTHS if any(mm == m for mm, _ in entries)]
    add(tier=5, family="guide-month-hub", url="/guides/%s-by-month" % slug(p),
        h1="%s month by month" % P,
        title="%s by Month - Weather, Snow, Crowds & Costs | Glitz Holidays" % P,
        primary="best time to visit %s" % p, **block(allq),
        content=[
            "A verdict table for all twelve months before any prose - best / good / mixed / avoid",
            "One self-contained section per month (%d have real demand: %s)"
            % (len(have), ", ".join(m[:3].title() for m in have)),
            "Each month section states temperature range, snow probability, what is open, what to pack",
            "Name the month to avoid explicitly - competitors will not",
            "Price index per month so the cheap-vs-peak question is answered in one place",
            "Each section must stand alone so passage ranking can lift it for '%s in january' etc" % p,
            "CTA per season to the %s package that fits those conditions" % P,
        ], words="2200-3000",
        months=have)

# ---------------- TIER 6: Hindi ----------------
HI = re.compile(r"\b(kaise|kitna|kitne|kahan|jagah|ghumne|jaye|jaen|jana|karne|mein|yatra|kharcha|kab)\b")
hi_all = sorted([(t, v) for t, v in T.items() if clean(t) and HI.search(t) and JK.search(t)],
                key=lambda x: -x[1][0])
HI_SEEDS = [
    ("kashmir-ghumne-ki-jagah", "Kashmir Mein Ghumne Ki Jagah", r"ghumne"),
    ("kashmir-kaise-jaye", "Kashmir Kaise Jaye", r"kaise ja|kaise jaye|kaise jaen|kaise pahunche"),
    ("kashmir-trip-kharcha", "Kashmir Trip Ka Kharcha", r"kharch|kitna|kitne"),
    ("kashmir-jane-ka-best-time", "Kashmir Jane Ka Sahi Samay", r"kab ja|kab jaye|kab jana"),
    ("vaishno-devi-yatra-guide", "Vaishno Devi Yatra Guide", r"yatra"),
]
for s, h1, pat in HI_SEEDS:
    rx = re.compile(pat)
    qs = [(t, v) for t, v in hi_all if rx.search(t)]
    if not qs:
        continue
    add(tier=6, family="hindi", url="/hi/" + s, h1=h1,
        title="%s | Glitz Holidays" % h1, primary=qs[0][0], **block(qs),
        content=[
            "Written natively in Hindi by a speaker - machine translation will not rank and will not convert",
            "Same factual depth as the English page: real prices in rupees, real distances, real timings",
            "hreflang pair with the English equivalent",
            "Hindi-language CTA and a WhatsApp number, which is how this audience converts",
        ], words="1000-1400")

# Hindi mirrors: the 5 highest-demand English pages, re-authored in Hindi.
# Was 40. A mirror reuses its source page's impressions, so 40 mirrors counted
# the same demand twice and inflated the tier. The 5 seed pages above are
# backed by genuine Hindi-language queries; these 5 mirrors are the only ones
# whose source demand justifies a second language version. Expand only if the
# first five earn impressions.
mirror_src = sorted([p for p in PAGES if p["tier"] in (1, 3, 4, 5)],
                    key=lambda p: -p["impr"])[:5]
for src in mirror_src:
    add(tier=6, family="hindi-mirror", url="/hi" + src["url"],
        h1=src["h1"] + " (Hindi)",
        title="%s | Glitz Holidays" % src["h1"],
        primary=src["primary"], n=src["n"], impr=src["impr"], clicks=src["clicks"],
        conv=src["conv"], top=src["top"],
        content=[
            "Hindi re-authoring of %s - same facts, written natively, not translated" % src["url"],
            "Prices in rupees written the way Hindi searchers phrase them",
            "hreflang alternate pair with %s" % src["url"],
            "WhatsApp CTA in Hindi - this audience converts on WhatsApp, not forms",
        ], words="900-1300")

# ---------------- reconcile with what was actually built ----------------
# The template generator proposes URLs; the build sometimes chose a flatter,
# more keyword-exact slug. The manifest must reflect the built reality or the
# next person builds a duplicate.
URL_OVERRIDE = {
    "/packages/honeymoon/from-delhi": "/packages/kashmir-honeymoon-packages-from-delhi",
    "/packages/honeymoon/from-hyderabad": "/packages/kashmir-honeymoon-packages-from-hyderabad",
    "/packages/honeymoon/gulmarg": "/packages/gulmarg-honeymoon-packages",
}
for p in PAGES:
    if p["url"] in URL_OVERRIDE:
        p["url"] = URL_OVERRIDE[p["url"]]

# Tier 0 — pages that came straight from the converting-terms analysis rather
# than from a template. These target queries with proven conversions and had
# no equivalent in the generated set.
PROVEN = [
    ("/packages/kashmir-tour-package-with-flight", "Kashmir tour packages with flights included",
     "kashmir tour package with flight", 87, 1010, 9.0,
     ["Land price and airfare quoted as two separate lines, never blended",
      "Why a single all-inclusive number is worse for the buyer",
      "Family maths: the flight is the dominant variable, not the land cost",
      "What 'with flights' includes, and what remains an airline charge"]),
    ("/packages/cheap-kashmir-tour-packages", "Cheap Kashmir tour packages",
     "cheapest tour packages for kashmir", 42, 480, 7.0,
     ["The real floor price and what it buys",
      "The four ways a cheaper quote is usually constructed",
      "Fair savings vs unfair omissions, stated as a table",
      "Season before duration as the lever that actually works"]),
    ("/packages/jammu-tour-packages", "Jammu tour packages",
     "jammu tour package", 3903, 44970, 46.7,
     ["Jammu as a destination, not a corridor to somewhere else",
      "Vaishno Devi yatra logistics: distance, ponies, helicopter, registration",
      "Why combining with Kashmir beats two separate trips",
      "Seasonality that runs opposite to the valley"]),
    ("/packages/srinagar-packages", "Srinagar packages by length",
     "srinagar package for 6 nights", 106, 521, 7.0,
     ["What genuinely fits in 4, 5 and 6 nights",
      "The weather-buffer argument for the sixth night",
      "Why the couple itinerary is built at five",
      "Side-by-side comparison of the three lengths"]),
    ("/packages/kashmir-packages-for-couples", "Kashmir packages for couples",
     "kashmir packages for couple", 71, 690, 5.0,
     ["What is structurally different, not decoratively different",
      "Private vehicle as base spec, not an upgrade",
      "Naming the houseboat rather than selling a category",
      "Month-by-month guidance for couples"]),
    ("/guides/kashmir-taxi-and-cab-fares-guide", "Kashmir taxi and cab hire",
     "tempo traveller in srinagar", 271, 1826, 18.0,
     ["The union system and why packages exclude those charges",
      "Vehicle classes mapped to group size and luggage",
      "The four exclusions travellers discover on the day",
      "Five rules for hiring transport well"]),
    ("/guides/choosing-a-travel-agency-in-srinagar", "Choosing a travel agency in Srinagar",
     "best travel agency in srinagar", 635, 3856, 20.3,
     ["DMC versus reseller, and why it matters at 9pm",
      "Six questions that expose the difference",
      "Warning signs worth walking away from",
      "How to normalise competing quotes before comparing"]),
]
for url, h1, primary, n, impr, conv, blocks in PROVEN:
    PAGES.append(dict(
        tier=0, family="proven-converter", url=url, h1=h1,
        title=f"{h1} | Glitz Holidays", primary=primary,
        n=n, impr=impr, clicks=0, conv=conv, top=[{"q": primary, "impr": impr, "clicks": 0, "conv": conv}],
        content=blocks, words="1200-1800"))

# ---------------- output ----------------
out = r"C:\Users\user\Desktop\glitz\seo"
os.makedirs(out, exist_ok=True)
for i, p in enumerate(PAGES, 1):
    p["id"] = i
json.dump(PAGES, open(os.path.join(out, "page-manifest.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
with open(os.path.join(out, "page-manifest.csv"), "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["id", "tier", "family", "url", "h1", "title_tag", "primary_query", "queries",
                "impressions", "clicks", "conversions", "words", "content_blocks", "top_queries"])
    for p in PAGES:
        w.writerow([p["id"], p["tier"], p["family"], p["url"], p["h1"], p["title"], p["primary"],
                    p["n"], p["impr"], p["clicks"], p["conv"], p["words"],
                    " | ".join(p["content"]),
                    " ; ".join("%s (%d)" % (x["q"], x["impr"]) for x in p["top"])])

print("TOTAL PAGES: %d" % len(PAGES))
byt = collections.Counter(p["tier"] for p in PAGES)
for t in sorted(byt):
    imp = sum(p["impr"] for p in PAGES if p["tier"] == t)
    cv = sum(p["conv"] for p in PAGES if p["tier"] == t)
    print("  tier %d: %4d pages  %8s impr  %6.1f conv" % (t, byt[t], "{:,}".format(imp), cv))
print()
for fam_name, c in collections.Counter(p["family"] for p in PAGES).most_common():
    print("  %-24s %4d" % (fam_name, c))
print("\nwrote seo/page-manifest.json + seo/page-manifest.csv")
