import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireUser, requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  const db = await getDb();
  const items = await db.collection("announcements").find({}).sort({ pinned: -1, ts: -1 }).toArray();
  return NextResponse.json(items.map((x) => ({ ...x, id: x._id.toString() })));
}

export async function POST(req) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { title, body, author } = await req.json();
  if (!title || !body || !author) {
    return NextResponse.json({ error: "title, body, author required" }, { status: 400 });
  }
  const db = await getDb();
  const doc = { title, body, author, ts: Date.now(), pinned: false };
  const result = await db.collection("announcements").insertOne(doc);
  return NextResponse.json({ ...doc, id: result.insertedId.toString() });
}
