import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  const db = await getDb();
  const subs = await db.collection("submissions").find({}).sort({ teamId: 1 }).toArray();
  return NextResponse.json(subs);
}

export async function PATCH(req) {
  const { error } = await requireUser();
  if (error) return error;
  const { teamId, submitted, by } = await req.json();
  const db = await getDb();
  await db.collection("submissions").updateOne(
    { teamId: parseInt(teamId) },
    { $set: { submitted: !!submitted, by: by || null, ts: Date.now() } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}
