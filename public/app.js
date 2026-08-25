document.addEventListener('DOMContentLoaded', () => {
  const reminderForm = document.getElementById('reminderForm');
  const remindersList = document.getElementById('remindersList');
  const notificationLogsList = document.getElementById('notificationLogsList');
  const refreshBtn = document.getElementById('refreshBtn');
  const refreshLogsBtn = document.getElementById('refreshLogsBtn');
  const testNotifBtn = document.getElementById('testNotifBtn');
  const enablePushBtn = document.getElementById('enablePushBtn');
  const pushStatusBadge = document.getElementById('pushStatusBadge');
  const toastContainer = document.getElementById('toastContainer');
  const filterBtns = document.querySelectorAll('.tab-btn');

  const frequencySelect = document.getElementById('frequency');
  const secondTimeGroup = document.getElementById('secondTimeGroup');
  const customDaysGroup = document.getElementById('customDaysGroup');

  let remindersData = [];
  let notificationLogsData = [];
  let currentFilter = 'all';

  // Set default start date to today
  const startDateInput = document.getElementById('startDate');
  if (startDateInput) {
    startDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Set default time to current time + 1 minute (for easy testing!)
  const timeInput = document.getElementById('reminderTime');
  if (timeInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${hours}:${mins}`;
  }

  // --- Dynamic Form Fields Toggle ---
  frequencySelect.addEventListener('change', () => {
    const val = frequencySelect.value;
    if (val === 'Twice Daily') {
      secondTimeGroup.style.display = 'flex';
      customDaysGroup.style.display = 'none';
    } else if (val === 'Custom') {
      customDaysGroup.style.display = 'flex';
      secondTimeGroup.style.display = 'none';
    } else {
      secondTimeGroup.style.display = 'none';
      customDaysGroup.style.display = 'none';
    }
  });

  // --- Browser Push Notification Permission Handler ---
  function updatePushPermissionUI() {
    if (!('Notification' in window)) {
      pushStatusBadge.textContent = 'Push: Unsupported Browser';
      pushStatusBadge.className = 'status-pill disabled';
      enablePushBtn.style.display = 'none';
      return;
    }

    const perm = Notification.permission;
    if (perm === 'granted') {
      pushStatusBadge.textContent = '🔔 Push Permission: Granted';
      pushStatusBadge.className = 'status-pill active';
      enablePushBtn.textContent = 'Push Enabled ✓';
      enablePushBtn.classList.remove('btn-accent');
      enablePushBtn.classList.add('btn-secondary');
      enablePushBtn.disabled = true;
    } else if (perm === 'denied') {
      pushStatusBadge.textContent = '🚫 Push Permission: Blocked';
      pushStatusBadge.className = 'status-pill disabled';
      enablePushBtn.textContent = 'Unblock in Browser Settings';
      enablePushBtn.disabled = true;
    } else {
      pushStatusBadge.textContent = 'Push Permission: Default';
      pushStatusBadge.className = 'status-pill disabled';
      enablePushBtn.textContent = 'Enable Push Notifications';
      enablePushBtn.disabled = false;
    }
  }

  enablePushBtn.addEventListener('click', async () => {
    // Feature 14: Automated reminder notifications (enable browser push permissions)
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      updatePushPermissionUI();
      if (result === 'granted') {
        showToast('🔔 Browser push notifications enabled!');
        sendDesktopNotification('MediConnect Notifications Enabled', 'You will now receive desktop popups for medicine reminders!');
      } else {
        showToast('⚠️ Push notification permission denied.', 'danger');
      }
    }
  });

  function sendDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '💊',
          tag: 'mediconnect-reminder'
        });
      } catch (err) {
        console.error('Error firing desktop notification:', err);
      }
    }
  }

  // --- API Functions ---
  async function fetchReminders() {
    try {
      const res = await fetch('/api/reminders');
      if (!res.ok) throw new Error('Failed to fetch reminders');
      const data = await res.json();
      remindersData = data.reminders || [];
      renderReminders();
      updateCounts();
    } catch (err) {
      console.error(err);
      showToast('⚠️ Error connecting to server backend', 'danger');
    }
  }

  async function fetchNotificationLogs() {
    try {
      const res = await fetch('/api/reminders/notifications/logs');
      if (!res.ok) throw new Error('Failed to fetch notification logs');
      const data = await res.json();
      notificationLogsData = data.logs || [];
      renderNotificationLogs();
    } catch (err) {
      console.error(err);
    }
  }

  async function checkDueNotifications() {
    try {
      const res = await fetch('/api/reminders/notifications/check');
      if (!res.ok) return;
      const data = await res.json();
      if (data.newlyTriggered && data.newlyTriggered.length > 0) {
        data.newlyTriggered.forEach(notif => {
          showToast(`🔔 [${notif.channel.toUpperCase()}] ${notif.message}`, 'info');
          if (notif.channel === 'push') {
            sendDesktopNotification(`💊 Medicine Reminder: ${notif.medicineName}`, notif.detail);
          }
        });
        fetchReminders();
        fetchNotificationLogs();
      }
    } catch (err) {
      console.error('Error checking due notifications:', err);
    }
  }

  // --- Render Functions ---
  function renderReminders() {
    let filtered = remindersData;
    if (currentFilter !== 'all') {
      filtered = remindersData.filter(r => r.status === currentFilter);
    }

    if (filtered.length === 0) {
      remindersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💊</div>
          <p>No ${currentFilter !== 'all' ? currentFilter : ''} medicine reminders found.</p>
          <small>Use the form to schedule a medicine reminder.</small>
        </div>
      `;
      return;
    }

    remindersList.innerHTML = filtered.map(r => {
      const channelsHtml = (r.channels || ['push']).map(ch => `<span class="badge-chip badge-${ch}">${ch.toUpperCase()}</span>`).join(' ');
      
      let timeDisplay = `⏰ ${escapeHtml(r.time)}`;
      if (r.frequency === 'Twice Daily' && r.secondTime) {
        timeDisplay = `⏰ ${escapeHtml(r.time)} & ${escapeHtml(r.secondTime)}`;
      }

      let freqDisplay = `📅 ${escapeHtml(r.frequency)}`;
      if (r.frequency === 'Custom' && r.customDays && r.customDays.length > 0) {
        freqDisplay = `📅 Custom (${r.customDays.join(', ')})`;
      }

      const progressColor = r.isExpired ? 'bg-expired' : (r.progressPercent > 80 ? 'bg-warning' : 'bg-primary');

      return `
        <div class="reminder-item status-${r.status}" data-id="${r.id}">
          <div class="item-main">
            <div class="item-title">
              💊 ${escapeHtml(r.medicineName)}
              <span class="status-badge ${r.status}">${r.status}</span>
            </div>
            <div class="item-meta">
              <span>🥄 ${escapeHtml(r.dosage)}</span>
              <span>${timeDisplay}</span>
              <span>${freqDisplay}</span>
            </div>

            <!-- Course Progress Bar (Feature 16) -->
            <div class="course-progress-wrapper">
              <div class="progress-bar-container">
                <div class="progress-fill ${progressColor}" style="width: ${r.progressPercent}%"></div>
              </div>
              <div class="progress-details">
                <small>Course: Day ${r.daysPassed} of ${r.daysTotal} (${r.progressPercent}%)</small>
                <small class="expiry-date">${r.isExpired ? '🏁 Course Expired' : `Ends: ${r.endDate}`}</small>
              </div>
            </div>

            <div class="item-channels">
              <span class="channel-label">Channels:</span> ${channelsHtml}
            </div>
          </div>

          <div class="item-actions">
            ${(r.status !== 'taken' && r.status !== 'expired') ? `
              <button class="btn-icon take" onclick="updateStatus('${r.id}', 'taken')" title="Mark Taken">
                ✓ Taken
              </button>
            ` : ''}
            ${r.status === 'pending' ? `
              <button class="btn-icon snooze" onclick="updateStatus('${r.id}', 'snoozed')" title="Snooze 15m">
                💤 Snooze
              </button>
              <button class="btn-icon" onclick="updateStatus('${r.id}', 'skipped')" title="Skip Dose">
                ⏭️ Skip
              </button>
            ` : ''}
            <button class="btn-icon delete" onclick="deleteReminder('${r.id}')" title="Delete Reminder">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderNotificationLogs() {
    if (!notificationLogsData || notificationLogsData.length === 0) {
      notificationLogsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔕</div>
          <p>No automated notifications dispatched yet.</p>
          <small>Click "Test Instant Notification" or set a reminder for the current time.</small>
        </div>
      `;
      return;
    }

    notificationLogsList.innerHTML = notificationLogsData.map(log => {
      const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateFormatted = new Date(log.timestamp).toLocaleDateString();
      return `
        <div class="log-item channel-${log.channel}">
          <div class="log-header">
            <span class="badge-chip badge-${log.channel}">${log.channel.toUpperCase()}</span>
            <span class="log-time">🕒 ${dateFormatted} ${timeFormatted}</span>
            ${log.isTest ? '<span class="log-test-badge">TEST RUN</span>' : '<span class="log-auto-badge">AUTO SCHEDULER</span>'}
          </div>
          <div class="log-body">
            <strong>💊 ${escapeHtml(log.medicineName)} (${escapeHtml(log.dosage)})</strong>
            <p>${escapeHtml(log.detail)}</p>
          </div>
          <div class="log-footer">
            <span>Recipient: <code>${escapeHtml(log.recipient)}</code></span>
            <span class="status-delivered">Status: Delivered ✓</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateCounts() {
    document.getElementById('countAll').textContent = remindersData.length;
    document.getElementById('countPending').textContent = remindersData.filter(r => r.status === 'pending').length;
    document.getElementById('countTaken').textContent = remindersData.filter(r => r.status === 'taken').length;
    document.getElementById('countSnoozed').textContent = remindersData.filter(r => r.status === 'snoozed').length;
    document.getElementById('countExpired').textContent = remindersData.filter(r => r.status === 'expired' || r.isExpired).length;
  }

  // --- Form Submission Handler ---
  reminderForm.addEventListener('submit', async (e) => {
    // Feature 13: Medicine reminder creation (dosage, time, frequency configuration)
    // Feature 16: Recurring & auto-expiring medicine schedules (duration/expiry)
    e.preventDefault();

    const selectedChannels = [];
    if (document.getElementById('chPush').checked) selectedChannels.push('push');
    if (document.getElementById('chSMS').checked) selectedChannels.push('sms');
    if (document.getElementById('chEmail').checked) selectedChannels.push('email');

    if (selectedChannels.length === 0) {
      showToast('⚠️ Please select at least one notification channel.', 'danger');
      return;
    }

    const freq = frequencySelect.value;
    let secondTimeVal = '';
    if (freq === 'Twice Daily') {
      secondTimeVal = document.getElementById('secondTime').value;
    }

    const selectedCustomDays = [];
    if (freq === 'Custom') {
      document.querySelectorAll('.custom-day:checked').forEach(cb => {
        selectedCustomDays.push(cb.value);
      });
      if (selectedCustomDays.length === 0) {
        showToast('⚠️ Please select at least one recurrence day for Custom schedule.', 'danger');
        return;
      }
    }

    const payload = {
      medicineName: document.getElementById('medicineName').value,
      dosage: document.getElementById('dosage').value,
      time: document.getElementById('reminderTime').value,
      secondTime: secondTimeVal,
      frequency: freq,
      customDays: selectedCustomDays,
      startDate: document.getElementById('startDate').value,
      durationDays: document.getElementById('durationDays').value,
      channels: selectedChannels,
      phoneNumber: document.getElementById('phoneNumber').value,
      email: document.getElementById('email').value
    };

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Creation failed');

      showToast(`✅ Scheduled "${data.reminder.medicineName}" (${data.reminder.frequency}, ${data.reminder.durationDays} days)`);
      reminderForm.reset();
      
      // Re-populate defaults
      startDateInput.value = new Date().toISOString().split('T')[0];
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      secondTimeGroup.style.display = 'none';
      customDaysGroup.style.display = 'none';
      document.getElementById('chPush').checked = true;
      document.getElementById('chSMS').checked = true;
      document.getElementById('chEmail').checked = true;
      document.getElementById('phoneNumber').value = '+1 (555) 019-2834';
      document.getElementById('email').value = 'patient@mediconnect.health';

      fetchReminders();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'danger');
    }
  });

  // --- Test Instant Notification Button ---
  testNotifBtn.addEventListener('click', async () => {
    // Feature 14: Automated reminder notifications (manual/instant notification test run)
    try {
      const res = await fetch('/api/reminders/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: document.getElementById('phoneNumber').value,
          email: document.getElementById('email').value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test notification failed');

      showToast('🧪 Test Notification Dispatched (Push, SMS, Email)!');
      sendDesktopNotification('🧪 Test Alert: Paracetamol 500mg', 'Time to take Paracetamol 500mg (1 Tablet after meal)');
      fetchNotificationLogs();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'danger');
    }
  });

  // Filter tab buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderReminders();
    });
  });

  // Global functions for inline action buttons
  window.updateStatus = async (id, status) => {
    // Feature 15: Mark reminder as taken / skipped / snoozed
    try {
      const res = await fetch(`/api/reminders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, snoozeMinutes: 15 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      showToast(`Updated: ${data.message}`);
      fetchReminders();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'danger');
    }
  };

  window.deleteReminder = async (id) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      showToast(`🗑️ ${data.message}`);
      fetchReminders();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'danger');
    }
  };

  // Toast notification helper
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  refreshBtn.addEventListener('click', fetchReminders);
  refreshLogsBtn.addEventListener('click', fetchNotificationLogs);

  // --- Symptom Checker Feature ---
  const analyzeSymptomsBtn = document.getElementById('analyzeSymptomsBtn');
  const clearSymptomHistoryBtn = document.getElementById('clearSymptomHistoryBtn');
  const symptomSeverityInput = document.getElementById('symptomSeverity');
  const symptomDurationInput = document.getElementById('symptomDuration');
  const symptomResultPlaceholder = document.getElementById('symptomResultPlaceholder');
  const symptomResultContent = document.getElementById('symptomResultContent');
  const symptomHistoryList = document.getElementById('symptomHistoryList');

  async function fetchSymptomHistory() {
    try {
      const res = await fetch('/api/symptoms/history');
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      renderSymptomHistory(data.history || []);
    } catch (err) {
      console.error(err);
    }
  }

  function renderSymptomHistory(history) {
    if (history.length === 0) {
      symptomHistoryList.innerHTML = `
        <div class="empty-state">
          <p>No recent symptom checks.</p>
        </div>
      `;
      return;
    }

    symptomHistoryList.innerHTML = history.map(h => {
      const dateStr = new Date(h.checkedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const severityClass = h.severity.toLowerCase();
      const topPrediction = h.prediction.topPrediction || {};
      
      return `
        <div class="history-item">
          <div class="history-header">
            <div class="history-header-left">
              <span>📅 ${dateStr}</span>
              <span class="history-severity-badge ${severityClass}">${escapeHtml(h.severity)}</span>
            </div>
            <span>Conf: ${topPrediction.confidence || 0}%</span>
          </div>
          <div class="history-disease">Predicted: ${escapeHtml(topPrediction.disease)}</div>
          <div class="history-symptoms" title="${escapeHtml(h.symptoms.join(', '))}">Symptoms: ${escapeHtml(h.symptoms.join(', '))}</div>
        </div>
      `;
    }).join('');
  }

  analyzeSymptomsBtn.addEventListener('click', async () => {
    const selectedSymptoms = [];
    document.querySelectorAll('input[name="symptoms"]:checked').forEach(cb => {
      selectedSymptoms.push(cb.value);
    });

    if (selectedSymptoms.length === 0) {
      showToast('⚠️ Please select at least one symptom to analyze.', 'danger');
      return;
    }

    const severityMap = { '1': 'Mild', '2': 'Moderate', '3': 'Severe' };
    const severity = severityMap[symptomSeverityInput.value] || 'Moderate';
    const durationDays = parseInt(symptomDurationInput.value, 10) || 1;

    try {
      analyzeSymptomsBtn.disabled = true;
      analyzeSymptomsBtn.innerText = 'Analyzing...';

      const res = await fetch('/api/symptoms/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          severity,
          durationDays
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      showToast('🔮 Symptom check analysis completed!');
      displaySymptomResult(data.result);
      fetchSymptomHistory();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'danger');
    } finally {
      analyzeSymptomsBtn.disabled = false;
      analyzeSymptomsBtn.innerText = '🔍 Analyze Symptoms & Predict';
    }
  });

  function displaySymptomResult(record) {
    symptomResultPlaceholder.style.display = 'none';
    symptomResultContent.style.display = 'flex';

    const topPrediction = record.prediction.topPrediction;
    const allPredictions = record.prediction.allPredictions || [];

    const urgencyClass = topPrediction.urgency.toLowerCase();
    
    // Build medicines HTML
    const medsHtml = topPrediction.medicines.map(m => {
      const isEmergency = topPrediction.urgency === 'Critical' || m.name === 'Emergency Care Required';
      const buttonHtml = isEmergency
        ? ''
        : `<button class="btn-quick-schedule" onclick="quickSchedule('${escapeHtml(m.name)}', '${escapeHtml(m.dosage)}')">📅 Quick Schedule</button>`;
      
      return `
        <div class="med-card">
          <div class="med-info">
            <span class="med-name">💊 ${escapeHtml(m.name)}</span>
            <span class="med-dosage">${escapeHtml(m.dosage)}</span>
          </div>
          ${buttonHtml}
        </div>
      `;
    }).join('');

    // Build differential diagnosis list HTML if any
    let diffHtml = '';
    if (allPredictions.length > 0) {
      diffHtml = `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 0.775rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Other Possible matches:</span>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
            ${allPredictions.map(ap => `
              <span class="status-badge" style="font-size: 0.7rem; background: rgba(255,255,255,0.05); color: #fff; padding: 2px 8px; border-radius: 4px;">
                ${escapeHtml(ap.disease)} (${ap.confidence}%)
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }

    symptomResultContent.innerHTML = `
      <div class="prediction-header">
        <div class="prediction-title-group">
          <h4>Top Predicted Match</h4>
          <div class="prediction-disease">${escapeHtml(topPrediction.disease)}</div>
          <div class="prediction-confidence">Match Confidence: ${topPrediction.confidence}%</div>
        </div>
        <span class="urgency-badge ${urgencyClass}">${escapeHtml(topPrediction.urgency)} Alert</span>
      </div>

      <div class="guidelines-group">
        <h5>📋 Recommended Action & Care</h5>
        <p>${escapeHtml(topPrediction.recommendation)}</p>
      </div>

      <div class="meds-group">
        <h5>💊 Recommended Remedy / Medications</h5>
        ${medsHtml}
      </div>

      ${diffHtml}
    `;
  }

  clearSymptomHistoryBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear all symptom check logs?')) return;
    try {
      const res = await fetch('/api/symptoms/history', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Clear failed');

      showToast('🗑️ Symptom logs cleared successfully.');
      fetchSymptomHistory();
      
      // Reset prediction view
      symptomResultPlaceholder.style.display = 'flex';
      symptomResultContent.style.display = 'none';
      symptomResultContent.innerHTML = '';
      
      // Uncheck all symptom boxes
      document.querySelectorAll('input[name="symptoms"]:checked').forEach(cb => {
        cb.checked = false;
      });
      symptomSeverityInput.value = '2';
      symptomDurationInput.value = '1';
    } catch (err) {
      showToast(`❌ ${err.message}`, 'danger');
    }
  });

  window.quickSchedule = (medName, dosage) => {
    document.getElementById('medicineName').value = medName;
    document.getElementById('dosage').value = dosage;
    
    // Auto-select push notification channel
    document.getElementById('chPush').checked = true;

    // Switch to meds tab first
    switchTab('meds-tab');

    // Smooth scroll to card
    const formCard = document.querySelector('.form-card');
    if (formCard) {
      setTimeout(() => {
        formCard.scrollIntoView({ behavior: 'smooth' });
        formCard.classList.remove('flash-highlight');
        void formCard.offsetWidth;
        formCard.classList.add('flash-highlight');
      }, 200);
    }
    
    showToast(`📝 Ready! Pre-filled reminder form with "${medName}".`, 'info');
  };

  // === TAB SWITCHING ===
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(tabId) {
    tabLinks.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    const targetLink = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
    if (targetLink) targetLink.classList.add('active');
  }

  tabLinks.forEach(link => {
    link.addEventListener('click', () => {
      const tabId = link.dataset.tab;
      switchTab(tabId);
      // Lazy-load data for the tab on first switch
      if (tabId === 'diet-tab') { fetchMeals(); fetchWorkouts(); updateRecommendations(); }
      if (tabId === 'vitals-tab') { fetchVitals(); }
    });
  });

  // === DIET & FITNESS ===
  const mealForm = document.getElementById('mealForm');
  const workoutForm = document.getElementById('workoutForm');
  const mealsList = document.getElementById('mealsList');
  const workoutsList = document.getElementById('workoutsList');
  const clearMealsBtn = document.getElementById('clearMealsBtn');
  const clearWorkoutsBtn = document.getElementById('clearWorkoutsBtn');
  const healthGoalSelect = document.getElementById('healthGoal');
  const goalRecommendationsDiv = document.getElementById('goalRecommendations');

  let mealsData = [];
  let workoutsData = [];

  async function fetchMeals() {
    try {
      const res = await fetch('/api/health/meals');
      const data = await res.json();
      mealsData = data.meals || [];
      renderMeals();
      updateCalorieWidgets();
    } catch (err) { console.error(err); }
  }

  async function fetchWorkouts() {
    try {
      const res = await fetch('/api/health/workouts');
      const data = await res.json();
      workoutsData = data.workouts || [];
      renderWorkouts();
      updateCalorieWidgets();
    } catch (err) { console.error(err); }
  }

  function renderMeals() {
    if (mealsData.length === 0) {
      mealsList.innerHTML = '<div class="empty-state"><p>No meals logged today.</p></div>';
      return;
    }
    mealsList.innerHTML = mealsData.map(m => {
      const time = new Date(m.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="health-item">
          <div class="health-item-info">
            <span class="health-item-name">${escapeHtml(m.name)}</span>
            <span class="health-item-meta">${escapeHtml(m.type)} · ${time} · P:${m.protein}g C:${m.carbs}g F:${m.fat}g</span>
          </div>
          <span class="health-item-value">${m.calories} kcal</span>
        </div>
      `;
    }).join('');
  }

  function renderWorkouts() {
    if (workoutsData.length === 0) {
      workoutsList.innerHTML = '<div class="empty-state"><p>No workouts logged today.</p></div>';
      return;
    }
    workoutsList.innerHTML = workoutsData.map(w => {
      const time = new Date(w.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const repsStr = w.reps > 0 ? ` · ${w.reps} reps` : '';
      return `
        <div class="health-item">
          <div class="health-item-info">
            <span class="health-item-name">${escapeHtml(w.name)}</span>
            <span class="health-item-meta">${escapeHtml(w.category)} · ${w.durationMinutes} min${repsStr} · ${time}</span>
          </div>
          <span class="health-item-value">🔥 ${w.caloriesBurned} kcal</span>
        </div>
      `;
    }).join('');
  }

  function updateCalorieWidgets() {
    const INTAKE_GOAL = 2000;
    const BURN_GOAL = 400;
    const totalIntake = mealsData.reduce((s, m) => s + (m.calories || 0), 0);
    const totalBurn = workoutsData.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
    const balance = totalIntake - totalBurn;

    document.getElementById('calorieIntake').textContent = totalIntake;
    document.getElementById('calorieBurnt').textContent = totalBurn;
    document.getElementById('calorieBalance').textContent = balance;

    document.getElementById('intakeProgress').style.width = Math.min(100, (totalIntake / INTAKE_GOAL) * 100) + '%';
    document.getElementById('burnProgress').style.width = Math.min(100, (totalBurn / BURN_GOAL) * 100) + '%';
    document.getElementById('balanceProgress').style.width = Math.min(100, Math.abs(balance) / INTAKE_GOAL * 100) + '%';
  }

  mealForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/health/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('mealName').value,
          type: document.getElementById('mealType').value,
          calories: document.getElementById('mealCalories').value,
          protein: document.getElementById('mealProtein').value,
          carbs: document.getElementById('mealCarbs').value,
          fat: document.getElementById('mealFat').value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`🍳 Logged "${data.meal.name}" (${data.meal.calories} kcal)`);
      mealForm.reset();
      document.getElementById('mealProtein').value = '0';
      document.getElementById('mealCarbs').value = '0';
      document.getElementById('mealFat').value = '0';
      fetchMeals();
    } catch (err) { showToast(`❌ ${err.message}`, 'danger'); }
  });

  workoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/health/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('workoutName').value,
          category: document.getElementById('workoutCategory').value,
          durationMinutes: document.getElementById('workoutDuration').value,
          reps: document.getElementById('workoutReps').value,
          caloriesBurned: document.getElementById('workoutCalories').value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`🏃 Logged "${data.workout.name}" (🔥${data.workout.caloriesBurned} kcal)`);
      workoutForm.reset();
      document.getElementById('workoutReps').value = '0';
      fetchWorkouts();
    } catch (err) { showToast(`❌ ${err.message}`, 'danger'); }
  });

  clearMealsBtn.addEventListener('click', async () => {
    if (!confirm('Clear all meal logs?')) return;
    await fetch('/api/health/logs?type=meals', { method: 'DELETE' });
    showToast('🗑️ Meal logs cleared.'); fetchMeals();
  });

  clearWorkoutsBtn.addEventListener('click', async () => {
    if (!confirm('Clear all workout logs?')) return;
    await fetch('/api/health/logs?type=workouts', { method: 'DELETE' });
    showToast('🗑️ Workout logs cleared.'); fetchWorkouts();
  });

  // --- Health Recommendations ---
  const RECOMMENDATIONS = {
    'weight-loss': {
      title: 'Weight Loss & Fat Reduction Plan',
      diet: ['Eat at a 300–500 kcal deficit from your maintenance level', 'Prioritize lean proteins: chicken breast, fish, tofu', 'Increase fiber intake through vegetables and whole grains', 'Avoid processed sugars and refined carbohydrates', 'Drink 8+ glasses of water daily'],
      exercise: ['30 min brisk walking or jogging 5x/week', 'Add 2–3 HIIT sessions (20 min) per week', 'Include bodyweight strength exercises for muscle preservation', 'Aim to burn 300–500 kcal per workout session']
    },
    'muscle-gain': {
      title: 'Muscle Gain & Body Building Plan',
      diet: ['Eat at a 300–500 kcal surplus from your maintenance level', 'Consume 1.6–2.2g protein per kg bodyweight', 'Include complex carbs: oats, brown rice, sweet potatoes', 'Healthy fats: avocado, nuts, olive oil', 'Post-workout meal within 1 hour of training'],
      exercise: ['Progressive overload: increase weights 2.5–5% weekly', 'Train each muscle group 2x/week', 'Focus on compound lifts: squats, deadlifts, bench press', 'Rest 48 hours between training same muscle groups']
    },
    'heart-health': {
      title: 'Healthy Heart Plan',
      diet: ['Follow the DASH diet: fruits, vegetables, whole grains', 'Limit sodium intake to < 2,300mg per day', 'Omega-3 fatty acids: salmon, walnuts, flaxseed', 'Reduce saturated fats and avoid trans fats', 'Limit alcohol to ≤ 1 drink/day'],
      exercise: ['150 min moderate aerobic activity per week', 'Include walking, cycling, or swimming', 'Practice stress-reducing exercises: yoga, meditation', 'Monitor heart rate during exercise; aim for 50-70% of max HR']
    },
    'diabetic-care': {
      title: 'Diabetic Sugar Control Plan',
      diet: ['Choose low glycemic index (GI) foods', 'Eat at regular scheduled intervals (no skipping meals)', 'Limit refined sugar and white flour products', 'Include high-fiber foods: legumes, whole grains, vegetables', 'Monitor carb portions: 45–60g per meal'],
      exercise: ['30 min moderate exercise daily (walking, swimming)', 'Check blood sugar before and after exercise', 'Avoid exercise if blood sugar > 250 mg/dL', 'Strength training 2–3x/week to improve insulin sensitivity']
    }
  };

  function updateRecommendations() {
    const goal = healthGoalSelect.value;
    const rec = RECOMMENDATIONS[goal];
    if (!rec) return;

    goalRecommendationsDiv.innerHTML = `
      <div class="rec-section">
        <h6>🎯 ${escapeHtml(rec.title)}</h6>
      </div>
      <div class="rec-section">
        <h6>🥗 Diet & Nutrition</h6>
        <ul class="rec-list">${rec.diet.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
      </div>
      <div class="rec-section">
        <h6>🏋️ Exercise & Activity</h6>
        <ul class="rec-list">${rec.exercise.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul>
      </div>
    `;
  }

  healthGoalSelect.addEventListener('change', updateRecommendations);

  // === BLOOD PRESSURE VITALS ===
  const vitalsForm = document.getElementById('vitalsForm');
  const vitalsHistoryList = document.getElementById('vitalsHistoryList');
  const clearVitalsBtn = document.getElementById('clearVitalsBtn');
  const bpCrisisBanner = document.getElementById('bpCrisisBanner');
  const bpChartContainer = document.getElementById('bpChartContainer');

  let vitalsData = [];

  async function fetchVitals() {
    try {
      const res = await fetch('/api/health/vitals');
      const data = await res.json();
      vitalsData = data.vitals || [];
      renderVitals();
      renderBPChart();
    } catch (err) { console.error(err); }
  }

  function getBpBadgeClass(status) {
    const s = status.toLowerCase();
    if (s.includes('crisis')) return 'crisis';
    if (s.includes('stage 2')) return 'stage2';
    if (s.includes('stage 1')) return 'stage1';
    if (s.includes('elevated')) return 'elevated';
    return 'normal';
  }

  function renderVitals() {
    let hasCrisis = false;
    if (vitalsData.length === 0) {
      vitalsHistoryList.innerHTML = '<div class="empty-state"><p>No BP readings logged yet.</p></div>';
      bpCrisisBanner.style.display = 'none';
      return;
    }

    vitalsHistoryList.innerHTML = vitalsData.map(v => {
      if (v.alert) hasCrisis = true;
      const dateStr = new Date(v.loggedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const badgeClass = getBpBadgeClass(v.status);
      return `
        <div class="vital-item ${v.alert ? 'has-alert' : ''}">
          <div class="vital-left">
            <div class="vital-reading">${v.systolic}/${v.diastolic} <small>mmHg</small></div>
            <div class="vital-meta"><span>❤️ ${v.pulse} bpm</span><span>📅 ${dateStr}</span></div>
          </div>
          <span class="bp-badge ${badgeClass}">${escapeHtml(v.status)}</span>
        </div>
      `;
    }).join('');

    bpCrisisBanner.style.display = hasCrisis ? 'flex' : 'none';
  }

  vitalsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/health/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systolic: document.getElementById('bpSystolic').value,
          diastolic: document.getElementById('bpDiastolic').value,
          pulse: document.getElementById('bpPulse').value
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const v = data.vital;
      showToast(`📈 Logged BP ${v.systolic}/${v.diastolic} — ${v.status}`);
      if (v.alert) showToast(`🚨 ${v.recommendation}`, 'danger');
      vitalsForm.reset();
      document.getElementById('bpPulse').value = '72';
      fetchVitals();
    } catch (err) { showToast(`❌ ${err.message}`, 'danger'); }
  });

  clearVitalsBtn.addEventListener('click', async () => {
    if (!confirm('Clear all BP readings?')) return;
    await fetch('/api/health/logs?type=vitals', { method: 'DELETE' });
    showToast('🗑️ BP logs cleared.'); fetchVitals();
  });

  // --- SVG BP Trend Chart ---
  function renderBPChart() {
    const readings = [...vitalsData].reverse().slice(-15);
    if (readings.length < 2) {
      bpChartContainer.innerHTML = '<div class="empty-state"><p>Need at least 2 readings to draw a trend chart.</p></div>';
      return;
    }

    const W = 800, H = 300;
    const PAD = { top: 25, right: 25, bottom: 45, left: 50 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;

    const allVals = readings.flatMap(r => [r.systolic, r.diastolic]);
    const minVal = Math.max(40, Math.min(...allVals) - 15);
    const maxVal = Math.min(250, Math.max(...allVals) + 15);

    const xStep = cW / (readings.length - 1);
    const yScale = (val) => PAD.top + cH - ((val - minVal) / (maxVal - minVal)) * cH;
    const xPos = (i) => PAD.left + i * xStep;

    // Build grid lines
    const gridSteps = [60, 80, 100, 120, 140, 160, 180, 200].filter(v => v >= minVal && v <= maxVal);
    let gridLines = gridSteps.map(v => `<line x1="${PAD.left}" y1="${yScale(v)}" x2="${W - PAD.right}" y2="${yScale(v)}" class="chart-grid-line"/><text x="${PAD.left - 8}" y="${yScale(v) + 4}" class="chart-label y-axis">${v}</text>`).join('');

    // Build systolic and diastolic paths
    let sysPoints = '', diaPoints = '';
    let sysDots = '', diaDots = '', labels = '';
    readings.forEach((r, i) => {
      const x = xPos(i);
      const ySys = yScale(r.systolic);
      const yDia = yScale(r.diastolic);
      sysPoints += (i === 0 ? 'M' : 'L') + `${x},${ySys} `;
      diaPoints += (i === 0 ? 'M' : 'L') + `${x},${yDia} `;
      sysDots += `<circle cx="${x}" cy="${ySys}" r="5" class="chart-point-sys"><title>${r.systolic} mmHg (sys)</title></circle>`;
      diaDots += `<circle cx="${x}" cy="${yDia}" r="5" class="chart-point-dia"><title>${r.diastolic} mmHg (dia)</title></circle>`;
      const lbl = new Date(r.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      labels += `<text x="${x}" y="${H - 8}" class="chart-label">${lbl}</text>`;
    });

    bpChartContainer.innerHTML = `
      <svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <!-- Grid -->
        ${gridLines}
        <!-- Axes -->
        <line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${H - PAD.bottom}" class="chart-axis-line"/>
        <line x1="${PAD.left}" y1="${H - PAD.bottom}" x2="${W - PAD.right}" y2="${H - PAD.bottom}" class="chart-axis-line"/>
        <!-- Lines -->
        <path d="${sysPoints}" class="chart-line-sys"/>
        <path d="${diaPoints}" class="chart-line-dia"/>
        <!-- Points -->
        ${sysDots}
        ${diaDots}
        <!-- Labels -->
        ${labels}
      </svg>
      <div class="chart-legend-box">
        <div class="legend-item"><span class="legend-color sys"></span> Systolic (mmHg)</div>
        <div class="legend-item"><span class="legend-color dia"></span> Diastolic (mmHg)</div>
      </div>
    `;
  }

  // Initializations
  updatePushPermissionUI();
  fetchReminders();
  fetchNotificationLogs();
  fetchSymptomHistory();
  updateRecommendations();

  // Background polling for due reminders every 10 seconds
  setInterval(checkDueNotifications, 10000);
});

