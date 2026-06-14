/* exported renderTimeline, renderSummary */

const SEVERITY_LABELS = ['', 'Mild', 'Mild–Moderate', 'Moderate', 'Moderate–Severe', 'Severe'];

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDatetime(isoStr) {
  const d = new Date(isoStr);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function getMondayKey(datetimeStr) {
  const d = new Date(datetimeStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function formatWeekLabel(mondayKey) {
  const d = new Date(mondayKey + 'T12:00:00');
  return (
    'Week of ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  );
}

function buildEntryCard(entry) {
  const sev = entry.severity;
  const sevLabel = SEVERITY_LABELS[sev] || String(sev);
  const categoryLabel = entry.category.charAt(0).toUpperCase() + entry.category.slice(1);
  const datetimeFormatted = formatDatetime(entry.datetime);

  const li = document.createElement('li');
  li.className = 'entry-card';
  li.dataset.id = entry.id;

  li.innerHTML = `
    <div class="entry-body">
      <div class="entry-header">
        <span
          class="entry-severity sev-${esc(String(sev))}"
          data-severity-label="${esc(sevLabel)}"
          aria-label="Severity ${esc(String(sev))} — ${esc(sevLabel)}"
        >
          <span class="entry-severity-num" aria-hidden="true">${esc(String(sev))}</span>
          <span class="entry-severity-text">${esc(sevLabel)}</span>
        </span>
        <h3 class="entry-symptom">${esc(entry.symptom)}</h3>
      </div>
      <div class="entry-meta">
        <span class="entry-category">
          <i data-lucide="tag" aria-hidden="true"></i>
          ${esc(categoryLabel)}
        </span>
        <time class="entry-time" datetime="${esc(entry.datetime)}">${esc(datetimeFormatted)}</time>
      </div>
      ${entry.notes ? `<p class="entry-notes">${esc(entry.notes)}</p>` : ''}
      <div class="entry-actions">
        <button
          class="btn-link"
          data-action="edit"
          data-id="${esc(entry.id)}"
          aria-label="Edit ${esc(entry.symptom)} entry"
        >
          <i data-lucide="pencil" aria-hidden="true"></i>
          Edit
        </button>
        <button
          class="btn-link btn-link-danger"
          data-action="delete"
          data-id="${esc(entry.id)}"
          aria-label="Delete ${esc(entry.symptom)} entry"
        >
          <i data-lucide="trash-2" aria-hidden="true"></i>
          Delete
        </button>
      </div>
    </div>
  `;

  return li;
}

function renderTimeline(entries) {
  const list = document.getElementById('timeline-list');
  const emptyState = document.getElementById('empty-state');
  const fewWarning = document.getElementById('few-entries-warning');

  list.innerHTML = '';

  if (entries.length === 0) {
    list.hidden = true;
    emptyState.hidden = false;
    fewWarning.hidden = true;
    return;
  }

  emptyState.hidden = true;
  list.hidden = false;
  fewWarning.hidden = entries.length >= 3;

  // Sort newest first
  const sorted = entries.slice().sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  // Group by ISO week (Monday-keyed)
  const weeks = new Map();
  sorted.forEach((entry) => {
    const key = getMondayKey(entry.datetime);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key).push(entry);
  });

  weeks.forEach((weekEntries, mondayKey) => {
    const separator = document.createElement('li');
    separator.className = 'week-separator';
    separator.setAttribute('role', 'presentation');
    separator.innerHTML = `<span class="week-label">${esc(formatWeekLabel(mondayKey))}</span>`;
    list.appendChild(separator);

    weekEntries.forEach((entry) => list.appendChild(buildEntryCard(entry)));
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function renderSummary(data) {
  const overviewEl = document.getElementById('overview-content');
  const patternsList = document.getElementById('patterns-list');
  const progressionEl = document.getElementById('progression-content');
  const questionsList = document.getElementById('questions-list');

  overviewEl.innerHTML = `
    <p><strong>Duration:</strong> ${esc(data.overview.duration)}</p>
    <p><strong>Chief concern:</strong> ${esc(data.overview.chief_complaint)}</p>
    <p class="summary-meta">${esc(String(data.overview.entry_count))} symptom ${data.overview.entry_count === 1 ? 'entry' : 'entries'} analyzed.</p>
  `;

  patternsList.innerHTML = '';
  (data.patterns || []).forEach((p) => {
    const li = document.createElement('li');
    li.className = 'summary-list-item';
    li.innerHTML = `<strong>${esc(p.observation)}</strong>${esc(p.detail)}`;
    patternsList.appendChild(li);
  });

  const trend = (data.progression.trend || 'stable').toLowerCase();
  const trendClass =
    trend === 'worsening'
      ? 'trend-worsening'
      : trend === 'improving'
        ? 'trend-improving'
        : 'trend-stable';
  const trendLabel = trend.charAt(0).toUpperCase() + trend.slice(1);
  progressionEl.innerHTML = `
    <span class="progression-trend ${esc(trendClass)}">${esc(trendLabel)}</span>
    <p>${esc(data.progression.detail)}</p>
  `;

  questionsList.innerHTML = '';
  (data.questions || []).forEach((q) => {
    const li = document.createElement('li');
    li.className = 'summary-question-item';
    li.innerHTML = `
      <strong>${esc(q.question)}</strong>
      <p class="question-rationale">${esc(q.rationale)}</p>
    `;
    questionsList.appendChild(li);
  });
}
