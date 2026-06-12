import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireUser, requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  const db = await getDb();
  const doc = await db.collection("transport").findOne({ _id: "transport" });
  return NextResponse.json(doc || null);
}

export async function PUT(req) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  delete body._id;
  delete body.id;
  const db = await getDb();
  await db.collection("transport").updateOne(
    { _id: "transport" },
    { $set: body },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}
