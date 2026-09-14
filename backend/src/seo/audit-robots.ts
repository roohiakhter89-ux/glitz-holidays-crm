/**
 * robots.txt matching, following Google's documented rules:
 * https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
 *
 * - The group with the most specific user agent matching the crawler applies.
 *   Several groups naming that agent are combined into one.
 * - Within it, the rule with the longest path wins. When an allow and a
 *   disallow rule are equally long, the least restrictive (allow) wins.
 * - `*` matches any run of characters and a trailing `$` anchors the end.
 *   Paths are case-sensitive.
 */

export interface RobotsRule {
  allow: boolean;
  path: string;
}

export interface RobotsGroup {
  agents: string[];
  rules: RobotsRule[];
}

export interface RobotsFile {
  groups: RobotsGroup[];
  sitemaps: string[];
}

export interface RobotsVerdict {
  allowed: boolean;
  /** The rule that decided it, or null when nothing matched (allowed). */
  rule: RobotsRule | null;
}

export function parseRobots(text: string): RobotsFile {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  // Consecutive user-agent lines share one group; the first rule line closes
  // the agent list.
  let collectingAgents = false;

  for (const raw of text.split(/\r\n|\r|\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (field === 'user-agent') {
      if (!collectingAgents || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
        collectingAgents = true;
      }
      current.agents.push(value.toLowerCase());
    } else if (field === 'allow' || field === 'disallow') {
      collectingAgents = false;
      // Rules before any user-agent line belong to no group. An empty value
      // ("Disallow:") restricts nothing.
      if (!current || !value) continue;
      current.rules.push({ allow: field === 'allow', path: value });
    } else if (field === 'sitemap') {
      // Not tied to any user agent.
      sitemaps.push(value);
    }
  }

  return { groups, sitemaps };
}

function rulesFor(file: RobotsFile, agent: string): RobotsRule[] {
  const token = agent.toLowerCase();
  const specific = file.groups.filter((g) => g.agents.includes(token));
  const chosen = specific.length > 0 ? specific : file.groups.filter((g) => g.agents.includes('*'));
  return chosen.flatMap((g) => g.rules);
}

const patternCache = new Map<string, RegExp>();

function ruleMatches(rulePath: string, target: string): boolean {
  let re = patternCache.get(rulePath);
  if (!re) {
    const anchored = rulePath.endsWith('$');
    const body = anchored ? rulePath.slice(0, -1) : rulePath;
    const source = body
      .split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    re = new RegExp(`^${source}${anchored ? '$' : ''}`);
    patternCache.set(rulePath, re);
  }
  return re.test(target);
}

/**
 * Whether `agent` may crawl `pathAndQuery` (for example "/packages?x=1").
 * Matching is against path and query, as Google does.
 */
export function checkRobots(file: RobotsFile, agent: string, pathAndQuery: string): RobotsVerdict {
  let best: RobotsRule | null = null;
  for (const rule of rulesFor(file, agent)) {
    if (!ruleMatches(rule.path, pathAndQuery)) continue;
    if (
      !best ||
      rule.path.length > best.path.length ||
      (rule.path.length === best.path.length && rule.allow && !best.allow)
    ) {
      best = rule;
    }
  }
  return { allowed: !best || best.allow, rule: best };
}
