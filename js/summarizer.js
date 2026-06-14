/* exported generateSummary */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT =
  'You are a clinical documentation assistant helping a patient prepare for a medical appointment. ' +
  'Analyze their symptom log and produce a structured summary a doctor can use in 3 minutes. ' +
  'Focus on patterns, onset, severity progression, and correlations. ' +
  'Return only valid JSON matching the defined schema. ' +
  'Never diagnose, never recommend treatment, never alarm the patient. ' +
  'Use plain, calm language.';

function buildUserPrompt(entries) {
  const serialized = entries.map((e) => ({
    symptom: e.symptom,
    severity: e.severity,
    category: e.category,
    datetime: e.datetime,
    notes: e.notes || '',
  }));

  return (
    'Here is my symptom log in JSON format:\n\n' +
    JSON.stringify(serialized, null, 2) +
    '\n\nPlease return a JSON object with this exact structure:\n' +
    '{\n' +
    '  "overview": { "duration": string, "chief_complaint": string, "entry_count": number },\n' +
    '  "patterns": [{ "observation": string, "detail": string }],\n' +
    '  "progression": { "trend": "worsening|improving|stable", "detail": string },\n' +
    '  "questions": [{ "question": string, "rationale": string }]\n' +
    '}'
  );
}

function generateSummary(entries) {
  return new Promise((resolve, reject) => {
    if (!entries || entries.length === 0) {
      reject(new Error('NO_ENTRIES'));
      return;
    }

    const apiKey = localStorage.getItem('st_api_key');
    if (!apiKey) {
      reject(new Error('NO_KEY'));
      return;
    }

    fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(entries) }],
      }),
    })
      .then((res) => {
        if (res.status === 401) {
          throw new Error('INVALID_KEY');
        }
        if (!res.ok) {
          throw new Error('NETWORK_ERROR');
        }
        return res.json();
      })
      .then((data) => {
        let parsed;
        try {
          parsed = JSON.parse(data.content[0].text);
        } catch (parseError) {
          throw new Error('PARSE_ERROR', { cause: parseError });
        }
        resolve(parsed);
      })
      .catch((err) => {
        if (
          err.message === 'INVALID_KEY' ||
          err.message === 'NETWORK_ERROR' ||
          err.message === 'PARSE_ERROR'
        ) {
          reject(err);
        } else {
          reject(new Error('NETWORK_ERROR'));
        }
      });
  });
}
