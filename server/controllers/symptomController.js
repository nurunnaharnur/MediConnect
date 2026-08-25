import { SymptomModel } from '../models/symptomModel.js';

export async function checkSymptoms(req, res) {
  try {
    const { symptoms, severity, durationDays } = req.body;

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: 'Please select at least one symptom to analyze.' });
    }

    const prediction = SymptomModel.runPrediction(symptoms);
    
    const record = await SymptomModel.saveCheck({
      symptoms,
      severity: severity || 'Moderate',
      durationDays: durationDays || 1,
      prediction
    });

    return res.status(200).json({
      message: 'Symptom analysis completed successfully!',
      result: record
    });
  } catch (error) {
    console.error('Error in checkSymptoms:', error);
    return res.status(500).json({ error: 'Failed to perform symptom check.' });
  }
}

export async function getSymptomHistory(req, res) {
  try {
    const history = await SymptomModel.getHistory(20);
    return res.status(200).json({
      count: history.length,
      history
    });
  } catch (error) {
    console.error('Error fetching symptom history:', error);
    return res.status(500).json({ error: 'Failed to retrieve symptom history.' });
  }
}

export async function clearSymptomHistory(req, res) {
  try {
    await SymptomModel.clearHistory();
    return res.status(200).json({
      message: 'Symptom history cleared successfully!'
    });
  } catch (error) {
    console.error('Error clearing symptom history:', error);
    return res.status(500).json({ error: 'Failed to clear symptom history.' });
  }
}
