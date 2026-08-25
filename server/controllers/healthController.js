import { MealModel } from '../models/mealModel.js';
import { WorkoutModel } from '../models/workoutModel.js';
import { VitalsModel } from '../models/vitalsModel.js';

// --- Diet / Meal Log Handlers ---
export async function logMeal(req, res) {
  try {
    const { name, type, calories, protein, carbs, fat } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Meal name is required.' });
    }

    const meal = await MealModel.create({
      name: name.trim(),
      type: type || 'Breakfast',
      calories: parseInt(calories, 10) || 0,
      protein: parseInt(protein, 10) || 0,
      carbs: parseInt(carbs, 10) || 0,
      fat: parseInt(fat, 10) || 0
    });

    return res.status(201).json({
      message: 'Meal logged successfully!',
      meal
    });
  } catch (err) {
    console.error('Error logging meal:', err);
    return res.status(500).json({ error: 'Failed to log meal.' });
  }
}

export async function getMeals(req, res) {
  try {
    const meals = await MealModel.getToday();
    return res.status(200).json({ meals });
  } catch (err) {
    console.error('Error fetching meals:', err);
    return res.status(500).json({ error: 'Failed to fetch meals.' });
  }
}

// --- Fitness / Workout Handlers ---
export async function logWorkout(req, res) {
  try {
    const { name, category, durationMinutes, reps, caloriesBurned } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Workout name is required.' });
    }

    const workout = await WorkoutModel.create({
      name: name.trim(),
      category: category || 'Cardio',
      durationMinutes: parseInt(durationMinutes, 10) || 0,
      reps: parseInt(reps, 10) || 0,
      caloriesBurned: parseInt(caloriesBurned, 10) || 0
    });

    return res.status(201).json({
      message: 'Workout logged successfully!',
      workout
    });
  } catch (err) {
    console.error('Error logging workout:', err);
    return res.status(500).json({ error: 'Failed to log workout.' });
  }
}

export async function getWorkouts(req, res) {
  try {
    const workouts = await WorkoutModel.getToday();
    return res.status(200).json({ workouts });
  } catch (err) {
    console.error('Error fetching workouts:', err);
    return res.status(500).json({ error: 'Failed to fetch workouts.' });
  }
}

// --- Vitals / BP Handlers ---
export async function logVital(req, res) {
  try {
    const { systolic, diastolic, pulse } = req.body;

    if (!systolic || !diastolic) {
      return res.status(400).json({ error: 'Systolic and Diastolic values are required.' });
    }

    const vital = await VitalsModel.create({
      systolic: parseInt(systolic, 10),
      diastolic: parseInt(diastolic, 10),
      pulse: parseInt(pulse, 10) || 72
    });

    return res.status(201).json({
      message: 'Blood pressure logged successfully!',
      vital
    });
  } catch (err) {
    console.error('Error logging vital:', err);
    return res.status(500).json({ error: 'Failed to log blood pressure vitals.' });
  }
}

export async function getVitals(req, res) {
  try {
    const vitals = await VitalsModel.getRecent(20);
    return res.status(200).json({ vitals });
  } catch (err) {
    console.error('Error fetching vitals:', err);
    return res.status(500).json({ error: 'Failed to fetch vitals.' });
  }
}

// --- Global Clear Handler ---
export async function clearHealthLogs(req, res) {
  try {
    const { type } = req.query; // 'meals', 'workouts', 'vitals' or 'all'
    
    if (type === 'meals') {
      await MealModel.clear();
    } else if (type === 'workouts') {
      await WorkoutModel.clear();
    } else if (type === 'vitals') {
      await VitalsModel.clear();
    } else {
      await MealModel.clear();
      await WorkoutModel.clear();
      await VitalsModel.clear();
    }

    return res.status(200).json({
      message: `Health logs (${type || 'all'}) cleared successfully!`
    });
  } catch (err) {
    console.error('Error clearing health logs:', err);
    return res.status(500).json({ error: 'Failed to clear health logs.' });
  }
}
