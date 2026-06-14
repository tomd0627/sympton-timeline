/* global getEntries, saveEntry, updateEntry, deleteEntry, clearEntries */
/* global renderTimeline, renderSummary */
/* global generateSummary */

const API_KEY_STORAGE = 'st_api_key';

let editingId = null;
let dialogOpener = null;
let dialogKeydownHandler = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentDatetimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function updateEntryCount(count) {
  const badge = document.getElementById('entry-count-badge');
  badge.textContent = String(count);
  badge.setAttribute('aria-label', `${count} ${count === 1 ? 'entry' : 'entries'} logged`);
}

function updateButtonStates(count) {
  document.getElementById('prepare-btn').disabled = count === 0;
  document.getElementById('clear-btn').disabled = count === 0;
}

function refreshHeader() {
  const count = getEntries().length;
  updateEntryCount(count);
  updateButtonStates(count);
}

function resetForm() {
  const form = document.getElementById('entry-form');
  form.reset();
  form.querySelectorAll('[aria-invalid]').forEach((el) => {
    el.removeAttribute('aria-invalid');
  });
  form.querySelectorAll('.field-error').forEach((el) => {
    el.hidden = true;
    el.textContent = '';
  });
  document.getElementById('datetime-input').value = getCurrentDatetimeLocal();
}

// ─── Edit Mode ────────────────────────────────────────────────────────────────

function enterEditMode(entry) {
  editingId = entry.id;
  document.getElementById('form-heading-text').textContent = 'Edit Symptom';
  document.getElementById('submit-btn-label').textContent = 'Update Entry';
  document.getElementById('edit-cancel-btn').hidden = false;

  document.getElementById('symptom-input').value = entry.symptom;
  document.getElementById('category-input').value = entry.category;
  document.getElementById('datetime-input').value = entry.datetime.slice(0, 16);
  document.getElementById('notes-input').value = entry.notes;

  const radio = document.querySelector(`input[name="severity"][value="${entry.severity}"]`);
  if (radio) radio.checked = true;

  document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => document.getElementById('symptom-input').focus(), 200);
}

function exitEditMode() {
  editingId = null;
  document.getElementById('form-heading-text').textContent = 'Log a Symptom';
  document.getElementById('submit-btn-label').textContent = 'Add to Timeline';
  document.getElementById('edit-cancel-btn').hidden = true;
  resetForm();
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm() {
  let firstInvalidEl = null;

  const symptomInput = document.getElementById('symptom-input');
  const symptomError = document.getElementById('symptom-error');
  const datetimeInput = document.getElementById('datetime-input');
  const datetimeError = document.getElementById('datetime-error');
  const severityError = document.getElementById('severity-error');
  const severityChecked = document.querySelector('input[name="severity"]:checked');

  [symptomInput, datetimeInput].forEach((el) => {
    el.removeAttribute('aria-invalid');
  });
  [symptomError, datetimeError, severityError].forEach((el) => {
    el.hidden = true;
    el.textContent = '';
  });

  if (!symptomInput.value.trim()) {
    symptomInput.setAttribute('aria-invalid', 'true');
    symptomError.textContent = 'Please describe the symptom.';
    symptomError.hidden = false;
    firstInvalidEl = firstInvalidEl || symptomInput;
  }

  if (!datetimeInput.value) {
    datetimeInput.setAttribute('aria-invalid', 'true');
    datetimeError.textContent = 'Please select a date and time.';
    datetimeError.hidden = false;
    firstInvalidEl = firstInvalidEl || datetimeInput;
  }

  if (!severityChecked) {
    severityError.textContent = 'Please select a severity level.';
    severityError.hidden = false;
    firstInvalidEl = firstInvalidEl || document.querySelector('input[name="severity"]');
  }

  if (firstInvalidEl) {
    firstInvalidEl.focus();
    return false;
  }
  return true;
}

// ─── Clear All Dialog ─────────────────────────────────────────────────────────

function openClearDialog() {
  dialogOpener = document.activeElement;

  const dialog = document.getElementById('clear-dialog');
  const backdrop = document.getElementById('dialog-backdrop');
  dialog.hidden = false;
  backdrop.hidden = false;

  const focusableEls = [...dialog.querySelectorAll('button')];
  const first = focusableEls[0];
  const last = focusableEls[focusableEls.length - 1];
  first.focus();

  dialogKeydownHandler = (e) => {
    if (e.key === 'Escape') {
      closeClearDialog();
      return;
    }
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  dialog.addEventListener('keydown', dialogKeydownHandler);
}

function closeClearDialog() {
  const dialog = document.getElementById('clear-dialog');
  dialog.hidden = true;
  document.getElementById('dialog-backdrop').hidden = true;

  if (dialogKeydownHandler) {
    dialog.removeEventListener('keydown', dialogKeydownHandler);
    dialogKeydownHandler = null;
  }
  if (dialogOpener) {
    dialogOpener.focus();
    dialogOpener = null;
  }
}

// ─── Summary Panel ────────────────────────────────────────────────────────────

function showSummaryLoading() {
  document.getElementById('summary-panel').hidden = false;
  document.getElementById('summary-loading').hidden = false;
  document.getElementById('summary-error').hidden = true;
  document.getElementById('summary-content').hidden = true;
}

function showSummaryError(message) {
  document.getElementById('summary-loading').hidden = true;
  document.getElementById('summary-error').hidden = false;
  document.getElementById('summary-error-message').textContent =
    message || 'Something went wrong. Please try again.';
}

function handleSummarySuccess(data) {
  renderSummary(data);
  document.getElementById('summary-loading').hidden = true;
  document.getElementById('summary-error').hidden = true;
  document.getElementById('summary-content').hidden = false;
}

function hideSummaryPanel() {
  document.getElementById('summary-panel').hidden = true;
  document.getElementById('summary-loading').hidden = true;
  document.getElementById('summary-error').hidden = true;
  document.getElementById('summary-content').hidden = true;
}

const ERROR_MESSAGES = {
  NO_ENTRIES: 'Add at least one entry before generating a summary.',
  NO_KEY: 'No API key found. Please enter your key to continue.',
  INVALID_KEY:
    'Your API key was rejected. Verify it is active and your account has billing credits in the Anthropic console.',
  NETWORK_ERROR: 'Could not reach the Claude API. Check your internet connection and try again.',
  PARSE_ERROR: 'The AI response could not be parsed. Please try again — this is usually transient.',
};

function runSummary() {
  showSummaryLoading();
  generateSummary(getEntries())
    .then((data) => handleSummarySuccess(data))
    .catch((err) => {
      showSummaryError(
        ERROR_MESSAGES[err.message] || err.message || 'An unexpected error occurred.'
      );
    });
}

// ─── API Key Gate ─────────────────────────────────────────────────────────────

function showApp() {
  document.getElementById('api-key-gate').hidden = true;
  document.getElementById('main-layout').hidden = false;
  document.getElementById('app').hidden = false;
}

function showGate() {
  document.getElementById('app').hidden = true;
  document.getElementById('main-layout').hidden = true;
  document.getElementById('api-key-gate').hidden = false;
  setTimeout(() => document.getElementById('api-key-input').focus(), 50);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // Set datetime default to now before checking key (avoids double-set)
  document.getElementById('datetime-input').value = getCurrentDatetimeLocal();

  const savedKey = localStorage.getItem(API_KEY_STORAGE);
  if (savedKey) {
    showApp();
    renderTimeline(getEntries());
    refreshHeader();
  }

  // ── API key form ──
  document.getElementById('api-key-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('api-key-input');
    const errorEl = document.getElementById('api-key-error');
    const key = input.value.trim();

    errorEl.hidden = true;
    errorEl.textContent = '';

    if (!key) {
      errorEl.textContent = 'Please enter your Anthropic API key.';
      errorEl.hidden = false;
      input.focus();
      return;
    }

    localStorage.setItem(API_KEY_STORAGE, key);
    input.value = '';
    showApp();
    renderTimeline(getEntries());
    refreshHeader();
    document.getElementById('main-content').focus();
  });

  // ── Change key ──
  document.getElementById('change-key-btn').addEventListener('click', () => {
    const existingKey = localStorage.getItem(API_KEY_STORAGE);
    localStorage.removeItem(API_KEY_STORAGE);
    showGate();
    if (existingKey) {
      document.getElementById('api-key-input').value = existingKey;
    }
  });

  // ── Entry form ──
  document.getElementById('entry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      symptom: document.getElementById('symptom-input').value,
      severity: document.querySelector('input[name="severity"]:checked').value,
      category: document.getElementById('category-input').value,
      datetime: document.getElementById('datetime-input').value,
      notes: document.getElementById('notes-input').value,
    };

    if (editingId) {
      updateEntry(editingId, data);
      exitEditMode();
    } else {
      saveEntry(data);
      resetForm();
    }

    renderTimeline(getEntries());
    refreshHeader();
  });

  // ── Cancel edit ──
  document.getElementById('edit-cancel-btn').addEventListener('click', () => exitEditMode());

  // ── Timeline: delegated edit / delete ──
  document.getElementById('timeline-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const { action, id } = btn.dataset;

    if (action === 'edit') {
      const entry = getEntries().find((en) => en.id === id);
      if (entry) enterEditMode(entry);
    }

    if (action === 'delete') {
      if (editingId === id) exitEditMode();
      deleteEntry(id);
      renderTimeline(getEntries());
      refreshHeader();
    }
  });

  // ── Clear All ──
  document.getElementById('clear-btn').addEventListener('click', () => openClearDialog());
  document.getElementById('clear-cancel-btn').addEventListener('click', () => closeClearDialog());
  document.getElementById('dialog-backdrop').addEventListener('click', () => closeClearDialog());
  document.getElementById('clear-confirm-btn').addEventListener('click', () => {
    clearEntries();
    exitEditMode();
    hideSummaryPanel();
    closeClearDialog();
    renderTimeline([]);
    refreshHeader();
  });

  // ── Prepare / Retry ──
  document.getElementById('prepare-btn').addEventListener('click', () => runSummary());
  document.getElementById('retry-btn').addEventListener('click', () => runSummary());
});
