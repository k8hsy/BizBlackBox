import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "./mongodb";

export const SESSION_COOKIE = "bbb_session";
const SESSION_DAYS = 7;

// Skip visually-confusing chars (0/O, 1/l/I, etc).
const PWD_CHARSET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(len = 12) {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += PWD_CHARSET[bytes[i] % PWD_CHARSET.length];
  // Insert separators for readability: 4-4-4
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const db = await getDb();
  await db.collection("sessions").insertOne({ token, userId, createdAt: now, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return token;
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.collection("sessions").deleteOne({ token });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const session = await db.collection("sessions").findOne({ token });
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) return null;
  const user = await db.collection("users").findOne({ _id: new ObjectId(session.userId) });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  return { user };
}

export async function requireAdmin() {
  const r = await requireUser();
  if (r.error) return r;
  if (r.user.role !== "admin") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return r;
}

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u._id?.toString?.() ?? u._id,
    name: u.name,
    username: u.username || null,
    email: u.email || null,
    role: u.role,
    team: u.teamId ?? null,
    mustChangePassword: !!u.mustChangePassword,
  };
}
