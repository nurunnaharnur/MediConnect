import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKOUTS_FILE = path.join(__dirname, '..', 'data', 'workouts.json');

function ensureDataFile() {
  const dir = path.dirname(WORKOUTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(WORKOUTS_FILE)) {
    fs.writeFileSync(WORKOUTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function loadWorkouts() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(WORKOUTS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error loading workouts:', error);
    return [];
  }
}

export function saveWorkouts(workouts) {
  ensureDataFile();
  fs.writeFileSync(WORKOUTS_FILE, JSON.stringify(workouts, null, 2), 'utf-8');
}

export class WorkoutModel {
  static async create(data) {
    const newWorkout = {
      id: 'work_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: data.name,
      category: data.category || 'Cardio',
      durationMinutes: parseInt(data.durationMinutes, 10) || 0,
      reps: parseInt(data.reps, 10) || 0,
      caloriesBurned: parseInt(data.caloriesBurned, 10) || 0,
      loggedAt: new Date().toISOString()
    };

    const db = await getDB();
    if (db) {
      try {
        await db.collection('workouts').insertOne(newWorkout);
        return newWorkout;
      } catch (err) {
        console.error("MongoDB insert workout failed, falling back:", err);
      }
    }

    const workouts = loadWorkouts();
    workouts.unshift(newWorkout);
    saveWorkouts(workouts);
    return newWorkout;
  }

  static async getToday() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const db = await getDB();
    if (db) {
      try {
        let workouts = await db.collection('workouts')
          .find({ loggedAt: { $gte: todayStart.toISOString() } })
          .sort({ loggedAt: -1 })
          .toArray();
        if (workouts.length === 0) {
          const localWorkouts = loadWorkouts();
          const todayLocal = localWorkouts.filter(w => new Date(w.loggedAt) >= todayStart);
          if (todayLocal.length > 0) {
            console.log(`Migrating ${todayLocal.length} local workouts to MongoDB...`);
            await db.collection('workouts').insertMany(localWorkouts);
            workouts = await db.collection('workouts')
              .find({ loggedAt: { $gte: todayStart.toISOString() } })
              .sort({ loggedAt: -1 })
              .toArray();
          }
        }
        return workouts;
      } catch (err) {
        console.warn("⚠️ MongoDB offline, falling back to local files database for workouts.");
      }
    }

    const workouts = loadWorkouts();
    return workouts.filter(w => new Date(w.loggedAt) >= todayStart);
  }

  static async clear() {
    const db = await getDB();
    if (db) {
      try {
        await db.collection('workouts').deleteMany({});
        return true;
      } catch (err) {
        console.error("MongoDB clear workouts failed, falling back:", err);
      }
    }

    saveWorkouts([]);
    return true;
  }
}
