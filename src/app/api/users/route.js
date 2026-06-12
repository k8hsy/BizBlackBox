import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin, hashPassword, generatePassword } from "@/lib/auth";
import { sendCredentialsEmail } from "@/lib/email";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const db = await getDb();
  const items = await db.collection("users").find({}).sort({ role: 1, name: 1 }).toArray();
  // Never leak password hashes.
  return NextResponse.json(items.map((x) => ({
    id: x._id.toString(),
    name: x.name,
    username: x.username || null,
    email: x.email || null,
    role: x.role,
    teamId: x.teamId ?? null,
    mustChangePassword: !!x.mustChangePassword,
  })));
}

export async function POST(req) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, username, email, role, teamId } = body;
  if (!name || !username || !role) {
    return NextResponse.json({ error: "name, username, and role required" }, { status: 400 });
  }

  const tempPassword = generatePassword();
  const passwordHash = await hashPassword(tempPassword);

  const doc = {
    name,
    username: username.trim(),
    email: email || null,
    role,
    teamId: teamId != null && teamId !== "" ? parseInt(teamId) : null,
    passwordHash,
    mustChangePassword: true,
  };

  const db = await getDb();
  let inserted;
  try {
    inserted = await db.collection("users").insertOne(doc);
  } catch (e) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "username already exists" }, { status: 409 });
    }
    throw e;
  }

  // Best-effort credentials email; we still return the temp password so admin can share manually.
  const emailResult = await sendCredentialsEmail({
    to: doc.email,
    name: doc.name,
    username: doc.username,
    tempPassword,
    isReset: false,
  });

  return NextResponse.json({
    id: inserted.insertedId.toString(),
    name: doc.name,
    username: doc.username,
    email: doc.email,
    role: doc.role,
    teamId: doc.teamId,
    mustChangePassword: true,
    initialPassword: tempPassword,
    emailSent: emailResult.sent,
    emailError: emailResult.error || null,
  });
}
