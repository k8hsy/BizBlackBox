import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  const db = await getDb();
  const items = await db.collection("qna").find({}).sort({ ts: -1 }).toArray();
  return NextResponse.json(items.map((x) => ({ ...x, id: x._id.toString() })));
}

export async function POST(req) {
  const { error } = await requireUser();
  if (error) return error;
  const { q, by, tm, category } = await req.json();
  if (!q || !by) {
    return NextResponse.json({ error: "q and by required" }, { status: 400 });
  }
  const db = await getDb();
  const doc = {
    q,
    by,
    tm: tm ?? null,
    a: null,
    aBy: null,
    ts: Date.now(),
    category: category || "general",
  };
  const result = await db.collection("qna").insertOne(doc);
  return NextResponse.json({ ...doc, id: result.insertedId.toString() });
}
