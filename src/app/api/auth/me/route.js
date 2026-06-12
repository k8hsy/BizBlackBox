import { NextResponse } from "next/server";
import { getCurrentUser, publicUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(publicUser(user));
}
