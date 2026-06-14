/* exported getEntries, saveEntry, updateEntry, deleteEntry, clearEntries */

const STORAGE_KEY = 'st_entries';

function getEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function saveEntry(data) {
  const entries = getEntries();
  const entry = {
    id: crypto.randomUUID(),
    symptom: data.symptom.trim(),
    severity: Number(data.severity),
    category: data.category,
    datetime: data.datetime,
    notes: (data.notes || '').trim(),
  };
  entries.push(entry);
  persistEntries(entries);
  return entry;
}

function updateEntry(id, patch) {
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...patch };
  persistEntries(entries);
  return entries[idx];
}

function deleteEntry(id) {
  persistEntries(getEntries().filter((e) => e.id !== id));
}

function clearEntries() {
  localStorage.removeItem(STORAGE_KEY);
}
