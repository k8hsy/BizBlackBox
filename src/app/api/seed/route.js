import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashPassword, getCurrentUser } from "@/lib/auth";
import {
  buildTeams,
  buildSubmissions,
  buildUsers,
  buildQna,
  buildAnnouncements,
  buildSchedule,
  buildMentorsSM,
  buildVenue,
  buildPrelim,
  buildRoomMap,
  buildTransport,
  SEED_PASSWORD,
} from "@/lib/seedData";

export async function POST() {
  const db = await getDb();

  // Allow seeding only when the DB is empty (first-run bootstrap) or by an admin.
  const userCount = await db.collection("users").countDocuments();
  if (userCount > 0) {
    const me = await getCurrentUser();
    if (!me || me.role !== "admin") {
      return NextResponse.json(
        { error: "forbidden — only admins can re-seed once data exists" },
        { status: 403 }
      );
    }
  }

  const collections = [
    "teams", "submissions", "users", "qna", "announcements",
    "schedule", "mentors_sm", "venue", "prelim", "room_map",
    "transport", "sessions",
  ];
  await Promise.all(collections.map((c) => db.collection(c).deleteMany({})));

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const usersWithHash = buildUsers().map((u) => ({ ...u, passwordHash }));

  await Promise.all([
    db.collection("teams").insertMany(buildTeams()),
    db.collection("submissions").insertMany(buildSubmissions()),
    db.collection("users").insertMany(usersWithHash),
    db.collection("qna").insertMany(buildQna()),
    db.collection("announcements").insertMany(buildAnnouncements()),
    db.collection("schedule").insertMany(buildSchedule()),
    db.collection("mentors_sm").insertMany(buildMentorsSM()),
    db.collection("venue").insertMany(buildVenue()),
    db.collection("prelim").insertMany(buildPrelim()),
    db.collection("room_map").insertMany(buildRoomMap()),
    db.collection("transport").insertOne(buildTransport()),
  ]);

  await db.collection("submissions").createIndex({ teamId: 1 }, { unique: true });
  await db.collection("users").createIndex({ username: 1 }, { unique: true, sparse: true });
  await db.collection("users").createIndex({ email: 1 }, { sparse: true });
  await db.collection("schedule").createIndex({ day: 1, order: 1 });
  await db.collection("room_map").createIndex({ person: 1 });
  await db.collection("sessions").createIndex({ token: 1 }, { unique: true });
  await db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  return NextResponse.json({
    ok: true,
    message: "Seeded all collections",
    seedPassword: SEED_PASSWORD,
    note: "All seeded users have this initial password (except admin) and must change it on first login. Admin password is also this value but no forced change.",
  });
}
