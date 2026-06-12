import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  const db = await getDb();
  const teams = await db.collection("teams").find({}).sort({ _id: 1 }).toArray();
  return NextResponse.json(teams.map((t) => ({ ...t, id: t._id })));
}
