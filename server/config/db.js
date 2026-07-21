import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

// Detect whether the URI uses the SRV format or the standard format
const isSRV = uri && uri.startsWith('mongodb+srv://');

const clientOptions = isSRV
  ? {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    }
  : {
      tls: true,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      }
    };

export const client = new MongoClient(uri, clientOptions);

export let db = null;

export async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("🟢 Pinged your deployment. You successfully connected to MongoDB Atlas Cloud!");
    db = client.db();
    return db;
  } catch (error) {
    console.error("🔴 MongoDB Connection Failed:", error);
    // Don't kill the server process immediately on initial failure to allow configuration correction
    console.warn("Continuing server start in fallback/offline mode.");
  }
}
