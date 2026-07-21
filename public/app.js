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

  // Initializations
  updatePushPermissionUI();
  fetchReminders();
  fetchNotificationLogs();

  // Background polling for due reminders every 10 seconds
  setInterval(checkDueNotifications, 10000);
});
