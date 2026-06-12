import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  delete body.id;
  delete body._id;
  delete body.passwordHash;
  delete body.initialPassword;
  if (body.teamId != null && body.teamId !== "") body.teamId = parseInt(body.teamId);
  else if (body.teamId === "") body.teamId = null;

  const db = await getDb();
  const result = await db.collection("users").updateOne(
    { _id: new ObjectId(id) },
    { $set: body }
  );
  if (result.matchedCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const db = await getDb();
  const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
