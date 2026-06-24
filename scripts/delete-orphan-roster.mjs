// Delete roster students (teams.students[]) that have no linked user account
// (no `userId`). Run AFTER link-roster-users.mjs --apply so real students are
// already linked. Dry-run by default; pass --apply to delete.
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const client = await new MongoClient(env.MONGODB_URI).connect();
const db = client.db(env.MONGODB_DB || "bbb_portal");
const teams = await db.collection("teams").find({}).toArray();
let orphans = 0, linked = 0;
for (const t of teams) for (const s of t.students || []) (s.userId ? linked++ : orphans++);
console.log(`MODE: ${APPLY ? "APPLY (deleting)" : "DRY-RUN"}`);
console.log(`linked roster students (kept): ${linked}`);
console.log(`orphan roster students (no userId, to delete): ${orphans}`);
if (APPLY) {
  let removed = 0;
  for (const t of teams) {
    const before = (t.students || []).length;
    const r = await db.collection("teams").updateOne(
      { _id: t._id },
      { $pull: { students: { userId: { $exists: false } } } }
    );
    if (r.modifiedCount) {
      const after = (await db.collection("teams").findOne({ _id: t._id })).students.length;
      removed += before - after;
    }
  }
  console.log(`Deleted ${removed} orphan roster students.`);
  const remain = (await db.collection("teams").find({}).toArray()).reduce((a,t)=>a+(t.students||[]).length,0);
  console.log(`Roster students remaining: ${remain}`);
} else {
  console.log("(dry-run — re-run with --apply to delete)");
}
await client.close();
