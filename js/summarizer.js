/* exported generateSummary */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT =
  'You are a clinical documentation assistant helping a patient prepare for a medical appointment. ' +
  'Analyze their symptom log and produce a structured summary a doctor can use in 3 minutes. ' +
  'Focus on patterns, onset, severity progression, and correlations. ' +
  'Return only valid JSON matching the defined schema. No markdown, no code fences, no preamble. ' +
  'Never diagnose, never recommend treatment, never alarm the patient. ' +
  'Use plain, calm language. ' +
  'The "questions" field must contain questions the PATIENT should proactively raise with their doctor — not questions the doctor would ask the patient. ' +
  'Think: what should the patient advocate for, request clarification on, or bring up unprompted?';

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
    '\nFor "questions": generate questions the PATIENT should ask their doctor (e.g. "Should I keep a trigger diary?", "Could this be related to X?"). ' +
    'Do NOT generate questions the doctor would ask the patient.\n' +
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
          const block = data?.content?.[0];
          if (!block || block.type !== 'text' || !block.text) throw new SyntaxError('empty');
          let text = block.text.trim();
          const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
          if (fenceMatch) text = fenceMatch[1];
          parsed = JSON.parse(text);
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
