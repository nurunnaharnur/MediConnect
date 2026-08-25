import WellbeingCheckin from '../models/WellbeingCheckin.js';

// Calculate non-diagnostic score and neutral indication
function evaluateScreening(screeningType, responses) {
  const totalScore = responses.reduce((acc, r) => acc + (Number(r.answerValue) || 0), 0);
  let maxScore = 21;
  let indicationLevel = 'minimal';
  let summary = '';
  let hasSafetyAlert = false;
  const recommendations = [];

  if (screeningType === 'depression') {
    maxScore = 27; // 9 questions * 3
    // Check Question 9 (self-harm/severe distress question index)
    const safetyQuestion = responses.find((r) => r.questionIndex === 8 || r.questionIndex === 9);
    if (safetyQuestion && safetyQuestion.answerValue > 0) {
      hasSafetyAlert = true;
    }

    if (totalScore <= 4) {
      indicationLevel = 'minimal';
      summary = 'Your responses reflect minimal or low indicators of depressive symptoms over the evaluated timeframe.';
      recommendations.push('Continue maintaining healthy daily habits including regular sleep, hydration, and social connections.');
      recommendations.push('Regular self-awareness check-ins can help you monitor ongoing emotional balance.');
    } else if (totalScore <= 9) {
      indicationLevel = 'mild';
      summary = 'Your responses reflect some mild depressive symptom patterns that may occasionally affect your energy or mood.';
      recommendations.push('Prioritize restorative self-care, consistent sleep routines, and daily physical movement.');
      recommendations.push('Consider mentioning these patterns to your healthcare provider if they persist.');
    } else if (totalScore <= 14) {
      indicationLevel = 'moderate';
      summary = 'Your responses indicate moderate depressive patterns that may be noticeably impacting your day-to-day routine.';
      recommendations.push('Consider scheduling a conversation with a qualified counselor, therapist, or physician.');
      recommendations.push('Share how you are feeling with trusted friends or loved ones.');
    } else {
      indicationLevel = 'higher';
      summary = 'Your responses reflect higher indication levels of depressive patterns.';
      recommendations.push('We strongly recommend consulting a qualified mental-health professional or medical doctor for supportive guidance.');
      recommendations.push('Explore professional therapy, counseling, or psychiatric consultation to discuss personalized support.');
    }
  } else if (screeningType === 'anxiety') {
    maxScore = 21; // 7 questions * 3
    if (totalScore <= 4) {
      indicationLevel = 'minimal';
      summary = 'Your responses indicate minimal or low anxiety-related symptoms.';
      recommendations.push('Continue practicing mindful relaxation, balanced nutrition, and regular downtime.');
    } else if (totalScore <= 9) {
      indicationLevel = 'mild';
      summary = 'Your responses reflect mild anxiety patterns or occasional feelings of being on edge or restless.';
      recommendations.push('Incorporate deep-breathing exercises, meditation, and structured breaks into stressful days.');
      recommendations.push('Notice specific triggers that may be contributing to elevated tension.');
    } else if (totalScore <= 14) {
      indicationLevel = 'moderate';
      summary = 'Your responses indicate moderate anxiety patterns that may frequently cause worry or difficulty relaxing.';
      recommendations.push('Consider consulting a licensed therapist or mental-health counselor to learn evidence-based anxiety management tools.');
      recommendations.push('Limit caffeine intake and maintain consistent physical activity.');
    } else {
      indicationLevel = 'higher';
      summary = 'Your responses reflect higher indication levels of persistent anxiety and excessive worry.';
      recommendations.push('We recommend speaking with a qualified mental-health professional or doctor for structured coping strategies and guidance.');
      recommendations.push('Reach out to supportive individuals in your network when feeling overwhelmed.');
    }
  } else if (screeningType === 'ocd') {
    maxScore = 21; // 7 questions * 3
    if (totalScore <= 5) {
      indicationLevel = 'minimal';
      summary = 'Your responses reflect minimal indication of repetitive, intrusive, or compulsive thought patterns.';
      recommendations.push('Continue monitoring your daily habits and mental wellness.');
    } else if (totalScore <= 11) {
      indicationLevel = 'mild';
      summary = 'Your responses reflect some mild intrusive thoughts or repetitive behaviors that cause occasional distress.';
      recommendations.push('Practice mindfulness techniques when experiencing repetitive or distressing thoughts.');
      recommendations.push('Notice how much time during your day is spent on repetitive rituals.');
    } else if (totalScore <= 17) {
      indicationLevel = 'moderate';
      summary = 'Your responses indicate moderate patterns of intrusive thoughts or urges that may interfere with daily activities.';
      recommendations.push('Consider speaking with a psychologist or counselor specializing in cognitive-behavioral approaches.');
      recommendations.push('Discussing these experiences with a specialist can provide supportive, tailored strategies.');
    } else {
      indicationLevel = 'higher';
      summary = 'Your responses reflect higher indications of distressing intrusive thoughts or repetitive actions.';
      recommendations.push('We encourage reaching out to a qualified mental-health specialist for a comprehensive clinical assessment and support plan.');
      recommendations.push('Remember that these experiences are very common and effective professional support options exist.');
    }
  }

  return {
    totalScore,
    maxScore,
    indicationLevel,
    summary,
    recommendations,
    hasSafetyAlert
  };
}

// @desc    Submit a mental well-being check-in questionnaire
// @route   POST /api/wellbeing/checkin
export const submitCheckin = async (req, res) => {
  try {
    const { screeningType, responses } = req.body;

    if (!screeningType || !['depression', 'anxiety', 'ocd'].includes(screeningType)) {
      return res.status(400).json({ message: 'A valid screening type (depression, anxiety, ocd) is required.' });
    }

    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: 'Questionnaire responses are required.' });
    }

    const evaluation = evaluateScreening(screeningType, responses);

    const checkin = await WellbeingCheckin.create({
      patientId: req.user._id,
      screeningType,
      responses,
      totalScore: evaluation.totalScore,
      maxScore: evaluation.maxScore,
      indicationLevel: evaluation.indicationLevel,
      summary: evaluation.summary,
      recommendations: evaluation.recommendations,
      hasSafetyAlert: evaluation.hasSafetyAlert,
      completedAt: new Date()
    });

    res.status(201).json(checkin);
  } catch (error) {
    console.error('Error submitting mental wellbeing checkin:', error);
    res.status(500).json({ message: error.message || 'Failed to submit check-in questionnaire.' });
  }
};

// @desc    Get patient's screening check-in history with comparison trends
// @route   GET /api/wellbeing/history
export const getCheckinHistory = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { patientId: req.user._id };
    if (type && ['depression', 'anxiety', 'ocd'].includes(type)) {
      query.screeningType = type;
    }

    const checkins = await WellbeingCheckin.find(query).sort({ completedAt: -1 });

    // Group by screening type and calculate comparison against previous check-in
    const historyWithComparison = checkins.map((item, idx) => {
      // Find the immediately preceding checkin of the same type
      const prevSameType = checkins.slice(idx + 1).find((c) => c.screeningType === item.screeningType);
      let comparison = 'First Check-in';
      let scoreDiff = 0;

      if (prevSameType) {
        scoreDiff = item.totalScore - prevSameType.totalScore;
        if (scoreDiff < 0) {
          comparison = 'Improving';
        } else if (scoreDiff > 0) {
          comparison = 'Increasing';
        } else {
          comparison = 'Stable';
        }
      }

      return {
        ...item.toObject(),
        comparison,
        scoreDiff
      };
    });

    res.json(historyWithComparison);
  } catch (error) {
    console.error('Error fetching checkin history:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve check-in history.' });
  }
};

// @desc    Get checkin analytics and progression trend
// @route   GET /api/wellbeing/analytics
export const getCheckinAnalytics = async (req, res) => {
  try {
    const checkins = await WellbeingCheckin.find({ patientId: req.user._id }).sort({ completedAt: 1 });

    const totalCheckins = checkins.length;
    const byType = {
      depression: checkins.filter((c) => c.screeningType === 'depression'),
      anxiety: checkins.filter((c) => c.screeningType === 'anxiety'),
      ocd: checkins.filter((c) => c.screeningType === 'ocd')
    };

    // Calculate progression for each type
    const computeTypeTrend = (typeList) => {
      if (typeList.length === 0) return { count: 0, latest: null, trend: 'No data', historyPoints: [] };
      const latest = typeList[typeList.length - 1];
      let trend = 'Stable';
      if (typeList.length >= 2) {
        const prev = typeList[typeList.length - 2];
        const diff = latest.totalScore - prev.totalScore;
        if (diff < 0) trend = 'Improving';
        else if (diff > 0) trend = 'Increasing';
        else trend = 'Stable';
      }

      const historyPoints = typeList.map((c) => ({
        id: c._id,
        date: c.completedAt,
        displayDate: new Date(c.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: c.totalScore,
        maxScore: c.maxScore,
        indicationLevel: c.indicationLevel
      }));

      return {
        count: typeList.length,
        latest,
        trend,
        historyPoints
      };
    };

    res.json({
      totalCheckins,
      depression: computeTypeTrend(byType.depression),
      anxiety: computeTypeTrend(byType.anxiety),
      ocd: computeTypeTrend(byType.ocd)
    });
  } catch (error) {
    console.error('Error calculating wellbeing analytics:', error);
    res.status(500).json({ message: error.message || 'Failed to compute wellbeing analytics.' });
  }
};
