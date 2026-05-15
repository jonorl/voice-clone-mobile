// gradioClient.ts  — targets self-hosted Gradio on voice.jonathan-orlowski.dev
// Uses Gradio's raw HTTP API (two-step POST → SSE GET)

const SPACE_BASE = 'https://voice.jonathan-orlowski.dev';
const ENDPOINT   = '/generate_speech';

export type SpaceStatus = 'checking' | 'ready' | 'sleeping' | 'error';

// ── Check if the server is reachable ─────────────────────────────────────────
export async function checkSpace(): Promise<SpaceStatus> {
  try {
    const res = await fetch(`${SPACE_BASE}/gradio_api/info`);
    return res.ok ? 'ready' : 'error';
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
): Promise<string> {
  // Step 1: POST to queue the job, get back an event_id
  const postRes = await fetch(`${SPACE_BASE}/gradio_api/call${ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

  // Step 2: Poll the SSE stream until we get a "complete" event.
  // React Native doesn't support EventSource natively, so we read the
  // SSE response body as a stream using fetch + ReadableStream.
  const sseRes = await fetch(
    `${SPACE_BASE}/gradio_api/call${ENDPOINT}/${event_id}`,
  );

  if (!sseRes.ok) throw new Error(`SSE GET failed (${sseRes.status})`);

  const audioUrl = await parseSSEForAudioUrl(sseRes);
  return audioUrl;
}

// ── SSE parser ────────────────────────────────────────────────────────────────
async function parseSSEForAudioUrl(response: Response): Promise<string> {
  const text = await response.text();

  // SSE format: lines starting with "data: " after an "event: complete" line
  // Example:
  //   event: complete
  //   data: [{"url": "/gradio_api/file=tmpXXXX.wav"}]
  const lines = text.split('\n');

  let lastEventType = '';
  for (const line of lines) {
    if (line.startsWith('event: ')) {
      lastEventType = line.slice('event: '.length).trim();
    } else if (line.startsWith('data: ') && lastEventType === 'complete') {
      const raw = line.slice('data: '.length).trim();
      try {
        const parsed = JSON.parse(raw);
        // Gradio returns an array; the audio output is the first element.
        // It's either { url: "..." } or a plain string URL.
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        const url: string | undefined =
          first?.url ?? (typeof first === 'string' ? first : undefined);

        if (!url) throw new Error('No URL found in Gradio response');

        // Self-hosted Gradio often returns a root-relative path like
        // /gradio_api/file=tmp1234.wav — resolve it against SPACE_BASE.
        return url.startsWith('http') ? url : `${SPACE_BASE}${url}`;
      } catch (e) {
        throw new Error(`Failed to parse Gradio response: ${raw} — ${e}`);
      }
    } else if (line.startsWith('data: ') && lastEventType === 'error') {
      const raw = line.slice('data: '.length).trim();
      throw new Error(`Gradio returned an error: ${raw}`);
    }
  }

  throw new Error('No complete event found in Gradio SSE response');
}