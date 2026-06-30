// One-time:
//  - rename every team to "Team <id>" (drop the alpha names)
//  - backfill phone onto mentor user records: JM phone from team.jmPhone
//    (matched by teamId), SM phone/email from the old mentors_sm (matched by
//    name) so the new Contacts/SM views keep existing contact info
//  - drop the retired mentors_sm collection (on --apply)
// Dry-run by default; --apply to write.
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
const APPLY=process.argv.includes("--apply");
const DROP=process.argv.includes("--drop-sm");
const env={};for(const l of readFileSync(new URL("../.env.local",import.meta.url),"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,"");}
const norm=(x)=>String(x||"").trim().toLowerCase();
const c=await new MongoClient(env.MONGODB_URI).connect();
const db=c.db(env.MONGODB_DB||"bbb_portal");

const teams=await db.collection("teams").find({}).toArray();
let renamed=0;
for(const t of teams){const want=`Team ${t._id}`;if(t.name!==want){renamed++;if(APPLY)await db.collection("teams").updateOne({_id:t._id},{$set:{name:want}});}}

const users=await db.collection("users").find({}).toArray();
const teamById=new Map(teams.map(t=>[t._id,t]));
let jmPhones=0;
for(const u of users.filter(u=>u.role==="junior_mentor"&&u.teamId!=null&&!u.phone)){
  const t=teamById.get(u.teamId);
  if(t&&t.jmPhone){jmPhones++;if(APPLY)await db.collection("users").updateOne({_id:u._id},{$set:{phone:t.jmPhone}});}
}
let smList=[];try{smList=await db.collection("mentors_sm").find({}).toArray();}catch{}
const smByName=new Map(smList.map(x=>[norm(x.name),x]));
let smPhones=0;
for(const u of users.filter(u=>u.role==="senior_mentor")){
  const sm=smByName.get(norm(u.name));if(!sm)continue;
  const set={};if(!u.phone&&sm.phone)set.phone=sm.phone;if(!u.email&&sm.email)set.email=sm.email;
  if(Object.keys(set).length){smPhones++;if(APPLY)await db.collection("users").updateOne({_id:u._id},{$set:set});}
}

console.log(`${APPLY?"APPLIED":"DRY-RUN"}`);
console.log(`teams renamed to "Team N": ${renamed}`);
console.log(`JM users backfilled phone (from team): ${jmPhones}`);
console.log(`SM users backfilled phone/email (from mentors_sm): ${smPhones}`);
console.log(`mentors_sm rows present (now unused): ${smList.length}${APPLY&&DROP?" -> dropping":APPLY?" (kept; pass --drop-sm to remove)":""}`);
if(APPLY&&DROP&&smList.length){await db.collection("mentors_sm").drop().catch(()=>{});console.log("dropped mentors_sm");}
console.log(APPLY?"Done.":"(re-run with --apply)");
await c.close();
