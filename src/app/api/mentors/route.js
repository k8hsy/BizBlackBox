import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireActiveUser } from "@/lib/auth";

// Read-only mentor directory derived from the users collection, so the Contacts
// page (and the admin Senior Mentors view) stay in sync with the Users tab.
// Available to any active user; exposes contact fields only (no auth data).
export async function GET() {
  const { error } = await requireActiveUser();
  if (error) return error;
  const db = await getDb();
  const items = await db
    .collection("users")
    .find({ role: { $in: ["junior_mentor", "senior_mentor"] } })
    .sort({ role: 1, teamId: 1, name: 1 })
    .toArray();
  return NextResponse.json(
    items.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      role: u.role,
      teamId: u.teamId ?? null,
      phone: u.phone ?? null,
      email: u.email ?? null,
    }))
  );
}
