import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const { studentId, checkedIn } = await req.json();
  const teamId = parseInt(id);

  const db = await getDb();
  const result = await db.collection("teams").updateOne(
    { _id: teamId, "students.id": studentId },
    { $set: { "students.$.checkedIn": !!checkedIn } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "team or student not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
