#!/usr/bin/env bash
# ==============================================================================
# Glitz Holidays — FIX: remove duplicated blocks from prisma/schema.prisma
# ------------------------------------------------------------------------------
# A partially-failed phase script appended the same models/enums more than once.
# Prisma then refuses to generate ("cannot be defined because a model with that
# name already exists").
#
# This scans every top-level block (model / enum / generator / datasource) and
# keeps ONLY THE FIRST occurrence of each name, dropping later duplicates along
# with the doc-comments attached to them. Field-level content is untouched.
#
# RUN FROM INSIDE YOUR BACKEND FOLDER:
#   cd glitz/backend
#   bash fix-schema.sh
#
# It backs up your schema first and prints exactly what it removed.
# ==============================================================================
set -euo pipefail

say()  { printf "\n\033[1;36m==>\033[0m %s\n" "$1"; }
ok()   { printf "\033[1;32m  ok\033[0m %s\n" "$1"; }
warn() { printf "\033[1;33m  ! \033[0m %s\n" "$1"; }
die()  { printf "\033[1;31m  x \033[0m %s\n" "$1"; exit 1; }

say "Checking this is the backend folder"
[ -f prisma/schema.prisma ] || die "No prisma/schema.prisma here. cd into glitz/backend and re-run."
ok "found prisma/schema.prisma"

BACKUP="prisma/schema.prisma.bak.dedupe.$(date +%s)"
cp prisma/schema.prisma "$BACKUP"
ok "backed up to $BACKUP"

say "Scanning for duplicate blocks"

cat > .glitz-dedupe.cjs << 'NODEEOF'
const fs = require('fs');
const path = 'prisma/schema.prisma';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

const BLOCK_START = /^\s*(model|enum|generator|datasource|type|view)\s+([A-Za-z0-9_]+)\s*\{/;

const seen = new Set();
const removed = [];
const out = [];
let pendingComments = [];   // comments directly above a block
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  const m = line.match(BLOCK_START);

  if (!m) {
    // buffer comment/blank lines so they can follow their block if dropped
    if (/^\s*(\/\/|\/\/\/)/.test(line) || /^\s*$/.test(line)) {
      pendingComments.push(line);
    } else {
      out.push(...pendingComments);
      pendingComments = [];
      out.push(line);
    }
    i++;
    continue;
  }

  // collect the whole block by brace depth
  const kind = m[1];
  const name = m[2];
  const key = `${kind}:${name}`;
  const block = [];
  let depth = 0;
  let started = false;

  while (i < lines.length) {
    const l = lines[i];
    block.push(l);
    for (const ch of l) {
      if (ch === '{') { depth++; started = true; }
      else if (ch === '}') depth--;
    }
    i++;
    if (started && depth <= 0) break;
  }

  if (seen.has(key)) {
    removed.push(key);
    // drop the block AND the doc-comments that belonged to it
    pendingComments = pendingComments.filter((c) => !/^\s*\/\/\//.test(c));
  } else {
    seen.add(key);
    out.push(...pendingComments);
    pendingComments = [];
    out.push(...block);
  }
}
out.push(...pendingComments);

// tidy: collapse 3+ blank lines into one
let text = out.join('\n').replace(/\n{3,}/g, '\n\n');
if (!text.endsWith('\n')) text += '\n';

fs.writeFileSync(path, text);

if (removed.length === 0) {
  console.log('  no duplicate blocks found');
} else {
  console.log(`  removed ${removed.length} duplicate block(s):`);
  for (const r of removed) console.log(`    - ${r.replace(':', ' ')}`);
}

// report what survived, so you can eyeball it
const kept = [...seen].filter((k) => k.startsWith('model:') || k.startsWith('enum:'));
console.log(`  schema now has ${kept.length} unique models/enums`);
NODEEOF

node .glitz-dedupe.cjs || die "dedupe failed"
rm -f .glitz-dedupe.cjs

say "Validating with Prisma"
if npx prisma validate; then
  ok "schema is valid"
else
  warn "Prisma still reports problems — see above."
  warn "Your original schema is safe at: $BACKUP"
  exit 1
fi

say "Regenerating Prisma client"
npx prisma generate || die "prisma generate failed"
ok "client generated"

say "SCHEMA FIXED"
cat << EOF

Backup of the broken schema: $BACKUP

Now continue where phase-5 stopped:

  npx prisma migrate dev --name quotes
  npm run build
  git add -A && git commit -m "Phase 5: pricing settings + quotations"
  npm run start:dev

EOF
