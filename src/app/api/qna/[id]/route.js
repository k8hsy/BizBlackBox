import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { a, aBy } = await req.json();

  const db = await getDb();
  const result = await db.collection("qna").updateOne(
    { _id: new ObjectId(id) },
    { $set: { a: a || null, aBy: aBy || null } }
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
