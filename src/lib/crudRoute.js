import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { requireUser, requireAdmin } from "./auth";

function withId(doc) {
  return { ...doc, id: doc._id?.toString?.() ?? doc._id };
}

async function gate(opts = {}) {
  if (opts.adminOnly) {
    const r = await requireAdmin();
    if (r.error) return r.error;
  } else {
    const r = await requireUser();
    if (r.error) return r.error;
  }
  return null;
}

export function listAndCreate(collectionName, sort = {}, opts = {}) {
  return {
    GET: async () => {
      const err = await gate({ adminOnly: false });
      if (err) return err;
      const db = await getDb();
      const items = await db.collection(collectionName).find({}).sort(sort).toArray();
      return NextResponse.json(items.map(withId));
    },
    POST: async (req) => {
      const err = await gate({ adminOnly: opts.adminOnlyWrite });
      if (err) return err;
      const body = await req.json();
      delete body.id;
      delete body._id;
      const db = await getDb();
      const result = await db.collection(collectionName).insertOne(body);
      return NextResponse.json(withId({ ...body, _id: result.insertedId }));
    },
  };
}

export function updateAndDelete(collectionName, opts = {}) {
  return {
    PATCH: async (req, { params }) => {
      const err = await gate({ adminOnly: opts.adminOnlyWrite });
      if (err) return err;
      const { id } = await params;
      const body = await req.json();
      delete body.id;
      delete body._id;
      const db = await getDb();
      const result = await db.collection(collectionName).updateOne(
        { _id: new ObjectId(id) },
        { $set: body }
      );
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    },
    DELETE: async (_req, { params }) => {
      const err = await gate({ adminOnly: opts.adminOnlyWrite });
      if (err) return err;
      const { id } = await params;
      const db = await getDb();
      const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return NextResponse.json({ error: "not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    },
  };
}
