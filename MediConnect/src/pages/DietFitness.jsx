import { useState, useEffect } from 'react';
import {
  fetchMeals,
  logMeal,
  clearMeals,
  fetchWorkouts,
  logWorkout,
  clearWorkouts,
} from '../api/healthApi';
import '../styles/DietFitness.css';

const RECOMMENDATIONS = {
  'weight-loss': {
    title: 'Weight Loss & Fat Reduction Plan',
    diet: [
      'Eat at a 300–500 kcal deficit from your maintenance level',
      'Prioritize lean proteins: chicken breast, fish, eggs, tofu',
      'Increase soluble fiber through green vegetables and whole grains',
      'Avoid sugary beverages, sweetened sodas, and refined carbohydrates',
      'Drink 8–10 glasses of water daily for optimal metabolic function',
    ],
    exercise: [
      '30 min brisk walking, cycling, or jogging 5x/week',
      'Add 2–3 HIIT sessions (20 min each) per week',
      'Include bodyweight strength exercises for lean muscle preservation',
      'Target burning 300–500 kcal per active workout session',
    ],
  },
  'muscle-gain': {
    title: 'Muscle Gain & Strength Building Plan',
    diet: [
      'Eat at a 300–500 kcal surplus above maintenance',
      'Target 1.6–2.2g of protein per kg of bodyweight daily',
      'Include complex carbohydrates: oats, brown rice, sweet potatoes, quinoa',
      'Consume healthy unsaturated fats: avocados, almonds, extra-virgin olive oil',
      'Have a high-protein recovery meal within 1 hour post-training',
    ],
    exercise: [
      'Progressive overload: increase weights or reps by 2.5–5% weekly',
      'Train each major muscle group 2x per week with adequate volume',
      'Focus on compound lifts: squats, deadlifts, bench presses, pull-ups',
      'Allow 48 hours of recovery before retraining identical muscle groups',
    ],
  },
  'heart-health': {
    title: 'Cardiovascular & Healthy Heart Plan',
    diet: [
      'Follow the evidence-based DASH diet rich in fruits and vegetables',
      'Limit daily sodium intake to under 2,300 mg per day',
      'Consume omega-3 rich fatty fish (salmon, mackerel) or flaxseeds',
      'Strictly avoid saturated fats, deep-fried snacks, and trans-fats',
      'Limit alcohol intake and drink polyphenol-rich green tea',
    ],
    exercise: [
      '150 min of moderate aerobic activity weekly (brisk walking, swimming)',
      'Incorporate daily 10-minute deep breathing or mindfulness stress reduction',
      'Monitor heart rate during workouts (target 50–70% of maximum HR)',
      'Avoid sudden heavy straining if resting blood pressure is elevated',
    ],
  },
  'diabetic-care': {
    title: 'Diabetic Sugar Control & Glycemic Plan',
    diet: [
      'Choose low glycemic index (GI) carbohydrates with high fiber',
      'Eat at consistent scheduled meal intervals to avoid glucose spikes',
      'Eliminate refined sugars, white flour, and sweetened desserts',
      'Include legumes, lentils, leafy greens, and chia seeds',
      'Control carbohydrate portions to 45–60g per main meal',
    ],
    exercise: [
      '30 min of moderate low-impact exercise daily after meals',
      'Monitor blood sugar before and after intense physical activity',
      'Include resistance training 2–3x/week to enhance insulin sensitivity',
      'Stay properly hydrated with electrolytes and water',
    ],
  },
};

export default function DietFitness() {
  const [activeTab, setActiveTab] = useState('diet'); // 'diet', 'workout', 'plan'
  const [healthGoal, setHealthGoal] = useState('weight-loss');
  const [meals, setMeals] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [mealForm, setMealForm] = useState({
    name: '',
    type: 'Breakfast',
    calories: '',
    protein: '0',
    carbs: '0',
    fat: '0',
  });
  const [workoutForm, setWorkoutForm] = useState({
    name: '',
    category: 'Cardio',
    durationMinutes: '',
    reps: '0',
    caloriesBurned: '',
  });
  const [savingMeal, setSavingMeal] = useState(false);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [mealsRes, workoutsRes] = await Promise.all([
          fetchMeals().catch(() => ({ meals: [] })),
          fetchWorkouts().catch(() => ({ workouts: [] })),
        ]);
        if (isMounted) {
          setMeals(mealsRes.meals || []);
          setWorkouts(workoutsRes.workouts || []);
        }
      } catch (err) {
        console.error('Error loading diet & fitness data:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalCaloriesIntake = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (Number(w.caloriesBurned) || 0), 0);
  const netCalories = totalCaloriesIntake - totalCaloriesBurned;

  const INTAKE_GOAL = 2000;
  const BURN_GOAL = 400;

  async function handleMealSubmit(e) {
    e.preventDefault();
    if (!mealForm.name.trim()) return;
    setSavingMeal(true);
    try {
      await logMeal(mealForm);
      setFeedback(`🍳 Logged "${mealForm.name}" (${mealForm.calories || 0} kcal)`);
      setMealForm({ name: '', type: 'Breakfast', calories: '', protein: '0', carbs: '0', fat: '0' });
      const res = await fetchMeals();
      setMeals(res.meals || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingMeal(false);
    }
  }

  async function handleWorkoutSubmit(e) {
    e.preventDefault();
    if (!workoutForm.name.trim()) return;
    setSavingWorkout(true);
    try {
      await logWorkout(workoutForm);
      setFeedback(`🏃 Logged "${workoutForm.name}" (🔥 ${workoutForm.caloriesBurned || 0} kcal burned)`);
      setWorkoutForm({ name: '', category: 'Cardio', durationMinutes: '', reps: '0', caloriesBurned: '' });
      const res = await fetchWorkouts();
      setWorkouts(res.workouts || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingWorkout(false);
    }
  }

  async function handleClearMeals() {
    if (!window.confirm('Clear all meal logs for today?')) return;
    try {
      await clearMeals();
      setMeals([]);
      setFeedback('🗑️ Meal logs cleared.');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleClearWorkouts() {
    if (!window.confirm('Clear all workout logs for today?')) return;
    try {
      await clearWorkouts();
      setWorkouts([]);
      setFeedback('🗑️ Workout logs cleared.');
    } catch (err) {
      alert(err.message);
    }
  }

  const rec = RECOMMENDATIONS[healthGoal] || RECOMMENDATIONS['weight-loss'];

  return (
    <div className="df-page">
      <div className="df-shell">
        <div className="df-header">
          <p className="df-eyebrow">Nutrition & Exercise Tracking</p>
          <h1>Diet & Fitness Hub</h1>
          <p className="df-subtext">
            Log your daily nutrition meals, record workout reps and calorie burn, and view personalized target plans.
          </p>
        </div>

        {feedback && (
          <div className="df-banner-success">
            {feedback}
            <button className="df-close-btn" onClick={() => setFeedback('')}>✕</button>
          </div>
        )}

        {/* Live Calorie Balance Overview Bar */}
        <div className="df-summary-grid">
          <div className="df-summary-card intake">
            <span className="df-sum-label">Daily Calorie Intake</span>
            <div className="df-sum-val">{totalCaloriesIntake} <small>kcal</small></div>
            <div className="df-progress-bar-wrap">
              <div
                className="df-progress-fill intake"
                style={{ width: `${Math.min(100, (totalCaloriesIntake / INTAKE_GOAL) * 100)}%` }}
              />
            </div>
            <span className="df-sum-goal">Target: {INTAKE_GOAL} kcal ({Math.round((totalCaloriesIntake / INTAKE_GOAL) * 100)}%)</span>
          </div>

          <div className="df-summary-card burn">
            <span className="df-sum-label">Active Calorie Burn</span>
            <div className="df-sum-val">🔥 {totalCaloriesBurned} <small>kcal</small></div>
            <div className="df-progress-bar-wrap">
              <div
                className="df-progress-fill burn"
                style={{ width: `${Math.min(100, (totalCaloriesBurned / BURN_GOAL) * 100)}%` }}
              />
            </div>
            <span className="df-sum-goal">Target: {BURN_GOAL} kcal ({Math.round((totalCaloriesBurned / BURN_GOAL) * 100)}%)</span>
          </div>

          <div className="df-summary-card balance">
            <span className="df-sum-label">Net Calorie Balance</span>
            <div className="df-sum-val" style={{ color: netCalories > 0 ? '#146356' : '#DC2626' }}>
              {netCalories > 0 ? `+${netCalories}` : netCalories} <small>kcal</small>
            </div>
            <span className="df-sum-goal">Intake ({totalCaloriesIntake}) - Burned ({totalCaloriesBurned})</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="df-tabs">
          <button
            type="button"
            className={`df-tab-btn ${activeTab === 'diet' ? 'active' : ''}`}
            onClick={() => setActiveTab('diet')}
          >
            🥗 Meal & Diet Logging
          </button>
          <button
            type="button"
            className={`df-tab-btn ${activeTab === 'workout' ? 'active' : ''}`}
            onClick={() => setActiveTab('workout')}
          >
            🏋️ Exercise & Workout Logging
          </button>
          <button
            type="button"
            className={`df-tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            🎯 Goal-Based Recommendations
          </button>
        </div>

        {/* TAB 1: MEAL LOGGING */}
        {activeTab === 'diet' && (
          <div className="df-tab-layout">
            <div className="df-card">
              <h3>Log a Meal</h3>
              <form onSubmit={handleMealSubmit} style={{ marginTop: '1rem' }}>
                <div className="df-field">
                  <label htmlFor="mealName">Meal / Food Description</label>
                  <input
                    id="mealName"
                    type="text"
                    className="df-input"
                    placeholder="e.g. Oatmeal with blueberries & chia seeds"
                    value={mealForm.name}
                    onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="df-form-row">
                  <div className="df-field">
                    <label htmlFor="mealType">Meal Category</label>
                    <select
                      id="mealType"
                      className="df-select"
                      value={mealForm.type}
                      onChange={(e) => setMealForm({ ...mealForm, type: e.target.value })}
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Healthy Snack</option>
                    </select>
                  </div>
                  <div className="df-field">
                    <label htmlFor="mealCalories">Calories (kcal)</label>
                    <input
                      id="mealCalories"
                      type="number"
                      min="0"
                      className="df-input"
                      placeholder="e.g. 450"
                      value={mealForm.calories}
                      onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="df-form-row" style={{ marginTop: '0.5rem' }}>
                  <div className="df-field">
                    <label htmlFor="mealProtein">Protein (g)</label>
                    <input
                      id="mealProtein"
                      type="number"
                      min="0"
                      className="df-input"
                      value={mealForm.protein}
                      onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })}
                    />
                  </div>
                  <div className="df-field">
                    <label htmlFor="mealCarbs">Carbs (g)</label>
                    <input
                      id="mealCarbs"
                      type="number"
                      min="0"
                      className="df-input"
                      value={mealForm.carbs}
                      onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })}
                    />
                  </div>
                  <div className="df-field">
                    <label htmlFor="mealFat">Fat (g)</label>
                    <input
                      id="mealFat"
                      type="number"
                      min="0"
                      className="df-input"
                      value={mealForm.fat}
                      onChange={(e) => setMealForm({ ...mealForm, fat: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="df-btn-primary" disabled={savingMeal} style={{ marginTop: '1.25rem' }}>
                  {savingMeal ? 'Logging Meal…' : '🍳 Add Meal Entry'}
                </button>
              </form>
            </div>

            <div className="df-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Today's Food Diary ({meals.length})</h3>
                {meals.length > 0 && (
                  <button className="df-btn-text" onClick={handleClearMeals}>Clear All</button>
                )}
              </div>

              {meals.length === 0 ? (
                <div className="df-empty">
                  <span>🥗</span>
                  <p>No meals logged today yet. Record your breakfast or lunch on the left!</p>
                </div>
              ) : (
                <div className="df-logs-list">
                  {meals.map((m) => (
                    <div key={m.id || m._id} className="df-log-item">
                      <div>
                        <strong>{m.name}</strong>
                        <p className="df-log-meta">
                          {m.type} • P: {m.protein}g | C: {m.carbs}g | F: {m.fat}g
                        </p>
                      </div>
                      <span className="df-log-val">{m.calories} kcal</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WORKOUT LOGGING */}
        {activeTab === 'workout' && (
          <div className="df-tab-layout">
            <div className="df-card">
              <h3>Log an Exercise / Workout</h3>
              <form onSubmit={handleWorkoutSubmit} style={{ marginTop: '1rem' }}>
                <div className="df-field">
                  <label htmlFor="workoutName">Activity / Exercise Name</label>
                  <input
                    id="workoutName"
                    type="text"
                    className="df-input"
                    placeholder="e.g. 5km Treadmill Run or Barbell Squats"
                    value={workoutForm.name}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="df-form-row">
                  <div className="df-field">
                    <label htmlFor="workoutCategory">Category</label>
                    <select
                      id="workoutCategory"
                      className="df-select"
                      value={workoutForm.category}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, category: e.target.value })}
                    >
                      <option value="Cardio">Cardio / Running</option>
                      <option value="Strength Training">Strength & Weightlifting</option>
                      <option value="HIIT">HIIT & Circuit</option>
                      <option value="Yoga / Flexibility">Yoga & Stretching</option>
                      <option value="Sports">Sports / Swimming</option>
                    </select>
                  </div>

                  <div className="df-field">
                    <label htmlFor="workoutDuration">Duration (Minutes)</label>
                    <input
                      id="workoutDuration"
                      type="number"
                      min="1"
                      className="df-input"
                      placeholder="e.g. 35"
                      value={workoutForm.durationMinutes}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, durationMinutes: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="df-form-row" style={{ marginTop: '0.5rem' }}>
                  <div className="df-field">
                    <label htmlFor="workoutReps">Repetitions / Sets (Optional)</label>
                    <input
                      id="workoutReps"
                      type="number"
                      min="0"
                      className="df-input"
                      placeholder="e.g. 45"
                      value={workoutForm.reps}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, reps: e.target.value })}
                    />
                  </div>
                  <div className="df-field">
                    <label htmlFor="workoutCalories">Calories Burned (kcal)</label>
                    <input
                      id="workoutCalories"
                      type="number"
                      min="0"
                      className="df-input"
                      placeholder="e.g. 280"
                      value={workoutForm.caloriesBurned}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, caloriesBurned: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="df-btn-primary" disabled={savingWorkout} style={{ marginTop: '1.25rem' }}>
                  {savingWorkout ? 'Recording Workout…' : '🔥 Log Workout Session'}
                </button>
              </form>
            </div>

            <div className="df-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Today's Workout Sessions ({workouts.length})</h3>
                {workouts.length > 0 && (
                  <button className="df-btn-text" onClick={handleClearWorkouts}>Clear All</button>
                )}
              </div>

              {workouts.length === 0 ? (
                <div className="df-empty">
                  <span>🏃</span>
                  <p>No workouts recorded today yet. Log your exercise on the left to track calories burned!</p>
                </div>
              ) : (
                <div className="df-logs-list">
                  {workouts.map((w) => (
                    <div key={w.id || w._id} className="df-log-item">
                      <div>
                        <strong>{w.name}</strong>
                        <p className="df-log-meta">
                          {w.category} • {w.durationMinutes} mins {w.reps > 0 ? `• ${w.reps} reps` : ''}
                        </p>
                      </div>
                      <span className="df-log-val burn">🔥 {w.caloriesBurned} kcal</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TARGET RECOMMENDATIONS */}
        {activeTab === 'plan' && (
          <div className="df-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Target Health Goal & Guidance</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#5B6B65' }}>
                  Select your primary fitness or clinical focus to view customized nutrition and exercise strategies:
                </p>
              </div>

              <select
                className="df-select"
                style={{ minWidth: '240px' }}
                value={healthGoal}
                onChange={(e) => setHealthGoal(e.target.value)}
              >
                <option value="weight-loss">🎯 Weight Loss & Fat Reduction</option>
                <option value="muscle-gain">💪 Muscle Gain & Bodybuilding</option>
                <option value="heart-health">🫀 Healthy Heart (DASH Plan)</option>
                <option value="diabetic-care">🩸 Diabetic Sugar Control Plan</option>
              </select>
            </div>

            <div className="df-plan-layout">
              <div className="df-plan-box diet">
                <h4>🥗 Nutrition & Meal Recommendations</h4>
                <ul>
                  {rec.diet.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>

              <div className="df-plan-box exercise">
                <h4>🏋️ Physical Activity & Workout Guidelines</h4>
                <ul>
                  {rec.exercise.map((ex, idx) => (
                    <li key={idx}>{ex}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
