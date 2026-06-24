// One-time reconciliation: link embedded roster students (teams.students[]) to
// their login accounts (users collection) by stamping `userId` on the roster
// entry. Match is by (teamId + name), falling back to (teamId + email).
//
// Dry-run by default (no writes). Pass --apply to write the links.
// Reads MONGODB_URI / MONGODB_DB from .env.local.
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");

// Minimal .env.local parser (standalone scripts don't get Next's env loading).
const env = {};
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const uri = env.MONGODB_URI || process.env.MONGODB_URI;
const dbName = env.MONGODB_DB || process.env.MONGODB_DB || "bbb_portal";
if (!uri) { console.error("No MONGODB_URI found"); process.exit(1); }

const norm = (s) => String(s || "").trim().toLowerCase();

const client = await new MongoClient(uri).connect();
const db = client.db(dbName);
console.log(`DB: ${dbName} @ ${uri.replace(/\/\/[^@]*@/, "//***@")}`);
console.log(APPLY ? "MODE: APPLY (writing links)\n" : "MODE: DRY-RUN (no writes)\n");

const teams = await db.collection("teams").find({}).toArray();
const users = await db.collection("users").find({ role: "student" }).toArray();

// Index student users by teamId for fast lookup.
const byTeam = new Map();
for (const u of users) {
  if (u.teamId == null) continue;
  if (!byTeam.has(u.teamId)) byTeam.set(u.teamId, []);
  byTeam.get(u.teamId).push(u);
}

const usedUserIds = new Set();        // users already linked (this run or pre-existing)
for (const t of teams) for (const s of t.students || []) if (s.userId) usedUserIds.add(String(s.userId));

const toLink = [];        // { teamId, studentId, name, userId }
const alreadyLinked = [];
const orphanRoster = [];  // roster student, no matching user
const ambiguous = [];     // roster student, >1 candidate

for (const t of teams) {
  for (const s of t.students || []) {
    if (s.userId) { alreadyLinked.push(`${t.name} / ${s.name}`); continue; }
    const cands = (byTeam.get(t._id) || []).filter((u) => !usedUserIds.has(String(u._id)));
    let match = cands.filter((u) => norm(u.name) === norm(s.name));
    if (match.length === 0 && s.email) match = cands.filter((u) => norm(u.email) === norm(s.email));
    if (match.length === 1) {
      usedUserIds.add(String(match[0]._id));
      toLink.push({ teamId: t._id, studentId: s.id, name: s.name, userId: String(match[0]._id) });
    } else if (match.length === 0) {
      orphanRoster.push(`${t.name} / ${s.name} (roster id ${s.id})`);
    } else {
      ambiguous.push(`${t.name} / ${s.name} -> ${match.length} candidates`);
    }
  }
}

// Student users that have a teamId but never got matched to a roster entry.
const linkedNow = new Set(toLink.map((x) => x.userId).concat([...usedUserIds]));
const usersNoRoster = users.filter((u) => u.teamId != null && !linkedNow.has(String(u._id)) && !toLink.find((x)=>x.userId===String(u._id)))
  // a user is "covered" if some roster entry already links to it OR we will link it
  .filter((u) => !toLink.find((x) => x.userId === String(u._id)));

console.log(`Will link:        ${toLink.length}`);
console.log(`Already linked:   ${alreadyLinked.length}`);
console.log(`Orphan roster (no user):  ${orphanRoster.length}`);
console.log(`Ambiguous (skipped):      ${ambiguous.length}`);

if (toLink.length) {
  console.log("\n-- linking --");
  for (const x of toLink.slice(0, 20)) console.log(`  ${x.name}  (team ${x.teamId}, roster ${x.studentId}) -> user ${x.userId}`);
  if (toLink.length > 20) console.log(`  ... and ${toLink.length - 20} more`);
}
if (orphanRoster.length) {
  console.log("\n-- ORPHAN roster students (no matching user) --");
  for (const o of orphanRoster) console.log(`  ${o}`);
}
if (ambiguous.length) {
  console.log("\n-- AMBIGUOUS (left unlinked, resolve manually) --");
  for (const a of ambiguous) console.log(`  ${a}`);
}

if (APPLY && toLink.length) {
  console.log("\nApplying...");
  let n = 0;
  for (const x of toLink) {
    const r = await db.collection("teams").updateOne(
      { _id: x.teamId, "students.id": x.studentId },
      { $set: { "students.$.userId": x.userId } }
    );
    n += r.modifiedCount;
  }
  console.log(`Stamped userId on ${n} roster entries.`);
} else if (!APPLY) {
  console.log("\n(dry-run — re-run with --apply to write these links)");
}

await client.close();
