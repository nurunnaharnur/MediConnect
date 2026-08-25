import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VITALS_FILE = path.join(__dirname, '..', 'data', 'vitals.json');

function ensureDataFile() {
  const dir = path.dirname(VITALS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(VITALS_FILE)) {
    fs.writeFileSync(VITALS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function loadVitals() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(VITALS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error loading vitals:', error);
    return [];
  }
}

export function saveVitals(vitals) {
  ensureDataFile();
  fs.writeFileSync(VITALS_FILE, JSON.stringify(vitals, null, 2), 'utf-8');
}

export class VitalsModel {
  static classifyBloodPressure(sys, dia) {
    const systolic = parseInt(sys, 10);
    const diastolic = parseInt(dia, 10);

    if (systolic > 180 || diastolic > 120) {
      return {
        status: 'Hypertensive Crisis',
        alert: true,
        recommendation: '⚠️ WARNING: Hypertensive Crisis! Please seek immediate emergency medical care.'
      };
    }
    if (systolic >= 140 || diastolic >= 90) {
      return {
        status: 'Stage 2 Hypertension',
        alert: true,
        recommendation: '⚠️ High Blood Pressure (Stage 2). Consult your healthcare provider soon.'
      };
    }
    if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
      return {
        status: 'Stage 1 Hypertension',
        alert: false,
        recommendation: 'High Blood Pressure (Stage 1). Monitor your reading regularly and speak to a doctor.'
      };
    }
    if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
      return {
        status: 'Elevated',
        alert: false,
        recommendation: 'Elevated blood pressure. Focus on a heart-healthy diet, exercise, and hydration.'
      };
    }
    return {
      status: 'Normal',
      alert: false,
      recommendation: 'Your blood pressure is within the normal healthy range.'
    };
  }

  static async create(data) {
    const systolic = parseInt(data.systolic, 10) || 120;
    const diastolic = parseInt(data.diastolic, 10) || 80;
    const pulse = parseInt(data.pulse, 10) || 72;

    const classification = VitalsModel.classifyBloodPressure(systolic, diastolic);

    const newVital = {
      id: 'vital_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      systolic,
      diastolic,
      pulse,
      status: classification.status,
      alert: classification.alert,
      recommendation: classification.recommendation,
      loggedAt: new Date().toISOString()
    };

    const db = await getDB();
    if (db) {
      try {
        await db.collection('vitals').insertOne(newVital);
        return newVital;
      } catch (err) {
        console.error("MongoDB insert vitals failed, falling back:", err);
      }
    }

    const vitals = loadVitals();
    vitals.unshift(newVital);
    saveVitals(vitals);
    return newVital;
  }

  static async getRecent(limit = 20) {
    const db = await getDB();
    if (db) {
      try {
        let vitals = await db.collection('vitals')
          .find({})
          .sort({ loggedAt: -1 })
          .limit(limit)
          .toArray();
        if (vitals.length === 0) {
          const localVitals = loadVitals();
          if (localVitals.length > 0) {
            console.log(`Migrating ${localVitals.length} local vitals to MongoDB...`);
            await db.collection('vitals').insertMany(localVitals);
            vitals = await db.collection('vitals')
              .find({})
              .sort({ loggedAt: -1 })
              .limit(limit)
              .toArray();
          }
        }
        return vitals;
      } catch (err) {
        console.warn("⚠️ MongoDB offline, falling back to local files database for vitals.");
      }
    }

    return loadVitals().slice(0, limit);
  }

  static async clear() {
    const db = await getDB();
    if (db) {
      try {
        await db.collection('vitals').deleteMany({});
        return true;
      } catch (err) {
        console.error("MongoDB clear vitals failed, falling back:", err);
      }
    }

    saveVitals([]);
    return true;
  }
}
