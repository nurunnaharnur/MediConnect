import mongoose from 'mongoose';
import MenstrualCycle, { CYCLE_FLOW_LEVELS } from '../models/MenstrualCycle.js';
import { predictCycle } from '../utils/cyclePrediction.js';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateDates(periodStartDate, periodEndDate) {
  const start = new Date(periodStartDate);
  if (Number.isNaN(start.getTime())) {
    return 'A valid periodStartDate is required';
  }
  if (periodEndDate) {
    const end = new Date(periodEndDate);
    if (Number.isNaN(end.getTime())) {
      return 'periodEndDate is not a valid date';
    }
    if (end < start) {
      return 'periodEndDate cannot be before periodStartDate';
    }
  }
  return null;
}

// @desc    Add a menstrual cycle record
// @route   POST /api/cycles
export const createCycle = async (req, res) => {
  const { periodStartDate, periodEndDate, flowLevel, symptoms, notes, dailyFlow } = req.body;

  if (!periodStartDate) {
    return res.status(400).json({ message: 'periodStartDate is required' });
  }
  const dateError = validateDates(periodStartDate, periodEndDate);
  if (dateError) return res.status(400).json({ message: dateError });

  if (flowLevel && !CYCLE_FLOW_LEVELS.includes(flowLevel)) {
    return res.status(400).json({ message: `flowLevel must be one of: ${CYCLE_FLOW_LEVELS.join(', ')}` });
  }

  try {
    const cycle = await MenstrualCycle.create({
      patientId: req.user._id,
      periodStartDate,
      periodEndDate: periodEndDate || null,
      flowLevel: flowLevel || 'Medium',
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      notes: notes || '',
      dailyFlow: Array.isArray(dailyFlow) ? dailyFlow : []
    });
    res.status(201).json(cycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all cycle records for the logged-in patient
// @route   GET /api/cycles
export const getCycles = async (req, res) => {
  try {
    const cycles = await MenstrualCycle.find({ patientId: req.user._id }).sort({ periodStartDate: -1 });
    res.json(cycles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get cycle + fertile-window prediction for the logged-in patient
// @route   GET /api/cycles/prediction
export const getCyclePrediction = async (req, res) => {
  try {
    const cycles = await MenstrualCycle.find({ patientId: req.user._id }).sort({ periodStartDate: 1 });
    const prediction = predictCycle(cycles);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a cycle record
// @route   PUT /api/cycles/:id
export const updateCycle = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid cycle id' });
  }

  const { periodStartDate, periodEndDate, flowLevel, symptoms, notes, dailyFlow } = req.body;

  if (flowLevel && !CYCLE_FLOW_LEVELS.includes(flowLevel)) {
    return res.status(400).json({ message: `flowLevel must be one of: ${CYCLE_FLOW_LEVELS.join(', ')}` });
  }

  try {
    const cycle = await MenstrualCycle.findOne({ _id: id, patientId: req.user._id });
    if (!cycle) return res.status(404).json({ message: 'Cycle record not found' });

    const nextStart = periodStartDate || cycle.periodStartDate;
    const nextEnd = periodEndDate !== undefined ? periodEndDate : cycle.periodEndDate;
    const dateError = validateDates(nextStart, nextEnd);
    if (dateError) return res.status(400).json({ message: dateError });

    if (periodStartDate) cycle.periodStartDate = periodStartDate;
    if (periodEndDate !== undefined) cycle.periodEndDate = periodEndDate || null;
    if (flowLevel) cycle.flowLevel = flowLevel;
    if (symptoms !== undefined) cycle.symptoms = Array.isArray(symptoms) ? symptoms : [];
    if (notes !== undefined) cycle.notes = notes;
    if (dailyFlow !== undefined) cycle.dailyFlow = Array.isArray(dailyFlow) ? dailyFlow : [];

    await cycle.save();
    res.json(cycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a cycle record
// @route   DELETE /api/cycles/:id
export const deleteCycle = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid cycle id' });
  }

  try {
    const cycle = await MenstrualCycle.findOneAndDelete({ _id: id, patientId: req.user._id });
    if (!cycle) return res.status(404).json({ message: 'Cycle record not found' });
    res.json({ message: 'Cycle record deleted', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};