import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const db = await getDb();
  const _id = new ObjectId(id);

  if (body.togglePin) {
    const current = await db.collection("announcements").findOne({ _id });
    if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
    await db.collection("announcements").updateOne({ _id }, { $set: { pinned: !current.pinned } });
    return NextResponse.json({ ok: true });
  }

  const update = {};
  if (typeof body.title === "string") update.title = body.title;
  if (typeof body.body === "string") update.body = body.body;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }
  const result = await db.collection("announcements").updateOne({ _id }, { $set: update });
  if (result.matchedCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const db = await getDb();
  const result = await db.collection("announcements").deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
