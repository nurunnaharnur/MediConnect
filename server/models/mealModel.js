import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEALS_FILE = path.join(__dirname, '..', 'data', 'meals.json');

function ensureDataFile() {
  const dir = path.dirname(MEALS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(MEALS_FILE)) {
    fs.writeFileSync(MEALS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function loadMeals() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(MEALS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error loading meals:', error);
    return [];
  }
}

export function saveMeals(meals) {
  ensureDataFile();
  fs.writeFileSync(MEALS_FILE, JSON.stringify(meals, null, 2), 'utf-8');
}

export class MealModel {
  static async create(data) {
    const newMeal = {
      id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: data.name,
      type: data.type || 'Breakfast',
      calories: parseInt(data.calories, 10) || 0,
      protein: parseInt(data.protein, 10) || 0,
      carbs: parseInt(data.carbs, 10) || 0,
      fat: parseInt(data.fat, 10) || 0,
      loggedAt: new Date().toISOString()
    };

    const db = await getDB();
    if (db) {
      try {
        await db.collection('meals').insertOne(newMeal);
        return newMeal;
      } catch (err) {
        console.error("MongoDB insert meal failed, falling back:", err);
      }
    }

    const meals = loadMeals();
    meals.unshift(newMeal);
    saveMeals(meals);
    return newMeal;
  }

  static async getToday() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const db = await getDB();
    if (db) {
      try {
        let meals = await db.collection('meals')
          .find({ loggedAt: { $gte: todayStart.toISOString() } })
          .sort({ loggedAt: -1 })
          .toArray();
        if (meals.length === 0) {
          const localMeals = loadMeals();
          // Filter local meals for today
          const todayLocal = localMeals.filter(m => new Date(m.loggedAt) >= todayStart);
          if (todayLocal.length > 0) {
            console.log(`Migrating ${todayLocal.length} local meals to MongoDB...`);
            // Insert all local meals to DB safely (avoiding duplicate _ids if any)
            await db.collection('meals').insertMany(localMeals);
            meals = await db.collection('meals')
              .find({ loggedAt: { $gte: todayStart.toISOString() } })
              .sort({ loggedAt: -1 })
              .toArray();
          }
        }
        return meals;
      } catch (err) {
        console.warn("⚠️ MongoDB offline, falling back to local files database for meals.");
      }
    }

    const meals = loadMeals();
    return meals.filter(m => new Date(m.loggedAt) >= todayStart);
  }

  static async clear() {
    const db = await getDB();
    if (db) {
      try {
        await db.collection('meals').deleteMany({});
        return true;
      } catch (err) {
        console.error("MongoDB clear meals failed, falling back:", err);
      }
    }

    saveMeals([]);
    return true;
  }
}
