// gradioClient.ts  — drop-in replacement for @gradio/client in React Native
// Uses Gradio's raw HTTP API (two-step POST → SSE GET)

const SPACE_BASE = 'https://jonorl-voice-clone.hf.space';
const ENDPOINT   = '/generate_speech';

export type SpaceStatus = 'checking' | 'ready' | 'sleeping' | 'error';

// ── Check if the space is awake ───────────────────────────────────────────────
export async function checkSpace(token: string): Promise<SpaceStatus> {
  try {
    const res = await fetch(`${SPACE_BASE}/gradio_api/info`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok ? 'ready' : 'sleeping';
  } catch {
    return 'sleeping';
  }
}

// ── Wake the space by hitting the info endpoint ───────────────────────────────
export async function wakeSpace(token: string): Promise<SpaceStatus> {
  // Just hitting the space URL is enough to wake a sleeping ZeroGPU space
  try {
    const res = await fetch(`${SPACE_BASE}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok ? 'ready' : 'sleeping';
  } catch {
    return 'error';
  }
}

interface GenerateParams {
  text: string;
  temperature: number;
  top_p: number;
  top_k: number;
  seed: number;
}

// ── Main generation call ──────────────────────────────────────────────────────
export default async function generateSpeech(
  params: GenerateParams,
  token: string
): Promise<string> {
  // Step 1: POST to queue the job, get back an event_id
  const postRes = await fetch(`${SPACE_BASE}/gradio_api/call${ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: [
        params.text,
        params.temperature,
        params.top_p,
        params.top_k,
        params.seed,
      ],
    }),
  });

  if (!postRes.ok) {
    const err = await postRes.text();
    throw new Error(`Queue POST failed (${postRes.status}): ${err}`);
  }

  const { event_id } = await postRes.json() as { event_id: string };
  if (!event_id) throw new Error('No event_id returned from Gradio');

  // Step 2: Poll the SSE stream until we get a "complete" event
  // React Native doesn't support EventSource natively, so we read the
  // SSE response body as a stream using fetch + ReadableStream.
  const sseRes = await fetch(
    `${SPACE_BASE}/gradio_api/call${ENDPOINT}/${event_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!sseRes.ok) throw new Error(`SSE GET failed (${sseRes.status})`);

  // Parse the SSE text/event-stream body
  const audioUrl = await parseSSEForAudioUrl(sseRes);
  return audioUrl;
}

// ── SSE parser ────────────────────────────────────────────────────────────────
async function parseSSEForAudioUrl(response: Response): Promise<string> {
  // expo/fetch returns a ReadableStream body we can read as text
  const text = await response.text();

  // SSE format: lines starting with "data: " after an "event: complete" line
  // Example:
  //   event: complete
  //   data: [{"url": "https://..."}]
  const lines = text.split('\n');

  let lastEventType = '';
  for (const line of lines) {
    if (line.startsWith('event: ')) {
      lastEventType = line.slice('event: '.length).trim();
    } else if (line.startsWith('data: ') && lastEventType === 'complete') {
      const raw = line.slice('data: '.length).trim();
      try {
        const parsed = JSON.parse(raw);
        // Gradio returns an array; the audio output is the first element
        // It's either { url: "..." } or a plain string URL
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        if (first?.url) return first.url as string;
        if (typeof first === 'string') return first;
      } catch {
        throw new Error(`Failed to parse Gradio response: ${raw}`);
      }
    } else if (line.startsWith('data: ') && lastEventType === 'error') {
      const raw = line.slice('data: '.length).trim();
      throw new Error(`Gradio returned an error: ${raw}`);
    }
  }

  throw new Error('No complete event found in Gradio SSE response');
}