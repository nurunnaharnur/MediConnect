import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SYMPTOMS_FILE = path.join(__dirname, '..', 'data', 'symptoms.json');

const DISEASE_RULES = [
  {
    disease: "COVID-19",
    symptoms: ["Loss of Smell / Taste", "Fever", "Cough", "Fatigue"],
    urgency: "High",
    recommendation: "Self-isolate immediately, monitor blood oxygen levels, and get a PCR test.",
    medicines: [
      { name: "Paracetamol 500mg", dosage: "1 Tablet every 6 hours" },
      { name: "Vitamin C & Zinc", dosage: "1 Tablet daily after meal" }
    ]
  },
  {
    disease: "Pneumonia",
    symptoms: ["Shortness of Breath", "Fever", "Cough", "Chest Pain"],
    urgency: "Critical",
    recommendation: "Consult a doctor immediately. Complete physical and radiographic examination is required.",
    medicines: [
      { name: "Azithromycin 500mg", dosage: "1 Tablet daily for 5 days" },
      { name: "Paracetamol 500mg", dosage: "1 Tablet every 6 hours as needed" }
    ]
  },
  {
    disease: "Influenza (Flu)",
    symptoms: ["Fever", "Headache", "Body Ache", "Fatigue"],
    urgency: "Medium",
    recommendation: "Get plenty of bed rest, stay hydrated with fluids, and isolate from household members.",
    medicines: [
      { name: "Paracetamol 500mg", dosage: "1 Tablet every 6 hours" },
      { name: "Antihistamine (Fexofenadine)", dosage: "1 Tablet daily before sleeping" }
    ]
  },
  {
    disease: "Common Cold",
    symptoms: ["Runny Nose", "Sore Throat", "Cough"],
    urgency: "Low",
    recommendation: "Drink warm fluids, perform saltwater gargles, and rest.",
    medicines: [
      { name: "Cough Syrup (Guaifenesin)", dosage: "10ml (2 teaspoons) three times a day" },
      { name: "Antihistamine (Cetirizine)", dosage: "1 Tablet daily before sleeping" }
    ]
  },
  {
    disease: "Gastroenteritis (Food Poisoning)",
    symptoms: ["Nausea / Vomiting", "Diarrhea", "Fatigue"],
    urgency: "Medium",
    recommendation: "Replenish lost fluids with Oral Rehydration Salts (ORS). Eat light, non-greasy foods.",
    medicines: [
      { name: "Oral Rehydration Salts (ORS)", dosage: "1 Sachet dissolved in 1 Litre of clean water" },
      { name: "Domperidone 10mg", dosage: "1 Tablet 30 mins before meals" }
    ]
  },
  {
    disease: "Meningitis Warning",
    symptoms: ["Fever", "Headache", "Stiff Neck"],
    urgency: "Critical",
    recommendation: "Seek immediate emergency medical care. Do not wait for symptoms to worsen.",
    medicines: [
      { name: "Emergency Care Required", dosage: "Immediately proceed to the nearest hospital ER" }
    ]
  }
];

function ensureDataFile() {
  const dir = path.dirname(SYMPTOMS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(SYMPTOMS_FILE)) {
    fs.writeFileSync(SYMPTOMS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function loadSymptomsHistory() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(SYMPTOMS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error loading symptoms history:', error);
    return [];
  }
}

export function saveSymptomsHistory(history) {
  ensureDataFile();
  fs.writeFileSync(SYMPTOMS_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

export class SymptomModel {
  static runPrediction(selectedSymptoms) {
    const symptomsLower = selectedSymptoms.map(s => s.toLowerCase().trim());
    
    const results = DISEASE_RULES.map(rule => {
      const matches = rule.symptoms.filter(s => symptomsLower.includes(s.toLowerCase().trim()));
      const matchCount = matches.length;
      const matchPercent = Math.round((matchCount / rule.symptoms.length) * 100);

      return {
        disease: rule.disease,
        matches,
        matchCount,
        totalCount: rule.symptoms.length,
        matchPercent,
        urgency: rule.urgency,
        recommendation: rule.recommendation,
        medicines: rule.medicines
      };
    });

    const matchingResults = results.filter(r => r.matchCount > 0);
    matchingResults.sort((a, b) => b.matchPercent - a.matchPercent || b.matchCount - a.matchCount);

    if (matchingResults.length === 0) {
      return {
        topPrediction: {
          disease: "Undetermined / General Viral Symptoms",
          confidence: 0,
          matchPercent: 0,
          urgency: "Low",
          recommendation: "Keep tracking your symptoms. Drink plenty of water and rest. If symptoms persist or worsen, consult a medical practitioner.",
          medicines: [
            { name: "Paracetamol 500mg", dosage: "1 Tablet every 6 hours as needed for body ache or fever" }
          ],
          matches: []
        },
        allPredictions: []
      };
    }

    const topMatch = matchingResults[0];

    return {
      topPrediction: {
        disease: topMatch.disease,
        confidence: topMatch.matchPercent,
        matchPercent: topMatch.matchPercent,
        urgency: topMatch.urgency,
        recommendation: topMatch.recommendation,
        medicines: topMatch.medicines,
        matches: topMatch.matches
      },
      allPredictions: matchingResults.slice(1).map(r => ({
        disease: r.disease,
        confidence: r.matchPercent,
        urgency: r.urgency
      }))
    };
  }

  static async saveCheck({ symptoms, severity, durationDays, prediction }) {
    const record = {
      id: 'symp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      symptoms,
      severity,
      durationDays: parseInt(durationDays, 10) || 1,
      prediction,
      checkedAt: new Date().toISOString()
    };

    const db = await getDB();
    if (db) {
      try {
        await db.collection('symptoms').insertOne(record);
        return record;
      } catch (err) {
        console.error("MongoDB insert symptom history failed, falling back:", err);
      }
    }

    const history = loadSymptomsHistory();
    history.unshift(record);
    saveSymptomsHistory(history);
    return record;
  }

  static async getHistory(limit = 20) {
    const db = await getDB();
    if (db) {
      try {
        let history = await db.collection('symptoms')
          .find({})
          .sort({ checkedAt: -1 })
          .limit(limit)
          .toArray();
        if (history.length === 0) {
          const localHistory = loadSymptomsHistory();
          if (localHistory.length > 0) {
            console.log(`Migrating ${localHistory.length} local symptom logs to MongoDB...`);
            await db.collection('symptoms').insertMany(localHistory);
            history = await db.collection('symptoms')
              .find({})
              .sort({ checkedAt: -1 })
              .limit(limit)
              .toArray();
          }
        }
        return history;
      } catch (err) {
        console.warn("⚠️ MongoDB offline, loading local symptoms history.");
      }
    }

    return loadSymptomsHistory().slice(0, limit);
  }

  static async clearHistory() {
    const db = await getDB();
    if (db) {
      try {
        await db.collection('symptoms').deleteMany({});
        return true;
      } catch (err) {
        console.error("MongoDB clear symptom history failed, falling back:", err);
      }
    }

    saveSymptomsHistory([]);
    return true;
  }
}
