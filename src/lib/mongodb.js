import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "bbb_portal";

let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In dev, Next.js HMR keeps recreating modules — cache on globalThis so we
  // don't open a new pool on every reload.
  if (!globalThis._mongoClientPromise) {
    globalThis._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = globalThis._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}
