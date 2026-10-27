// gradioClient.ts  — targets self-hosted Gradio on voice.jonathan-orlowski.dev
// Uses Gradio's raw HTTP API (two-step POST → SSE GET)

const SPACE_BASE = 'https://voice.jonathan-orlowski.dev';
const ENDPOINT   = '/generate_speech';

export type SpaceStatus = 'checking' | 'ready' | 'error';

// ── Check if the server can generate ──────────────────────────────────────────
// /health answers 503 when the server is up but the model files are missing, so a reachable server is not enough.
export async function checkSpace(): Promise<SpaceStatus> {
  try {
    const res = await fetch(`${SPACE_BASE}/health`);
    if (!res.ok) return 'error';
    const body = (await res.json()) as { status?: string };
    return body.status === 'ok' ? 'ready' : 'error';
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

  if (!postRes.ok) throw new Error(`The server could not take the request (${postRes.status})`);

  const { event_id } = await postRes.json() as { event_id: string };
  if (!event_id) throw new Error('No event_id returned from Gradio');

  // Step 2: Poll the SSE stream until we get a "complete" event.
  // React Native doesn't support EventSource natively, so we read the
  // SSE response body as a stream using fetch + ReadableStream.
  const sseRes = await fetch(
    `${SPACE_BASE}/gradio_api/call${ENDPOINT}/${event_id}`,
  );

  if (!sseRes.ok) throw new Error(`The server stopped responding (${sseRes.status})`);

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
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('The server sent a response the app could not read');
      }
      // Gradio returns [audio, status]. The audio is { url } or a plain URL; when the server refuses the request
      // (empty or overlong text) the audio is null and the status says why.
      const [first, status] = Array.isArray(parsed) ? parsed : [parsed];
      const url: string | undefined =
        (first as { url?: string } | null)?.url ?? (typeof first === 'string' ? first : undefined);

      if (!url) throw new Error(typeof status === 'string' && status ? status : 'The server returned no audio');

      // Self-hosted Gradio often returns a root-relative path like
      // /gradio_api/file=tmp1234.wav — resolve it against SPACE_BASE.
      return url.startsWith('http') ? url : `${SPACE_BASE}${url}`;
    } else if (line.startsWith('data: ') && lastEventType === 'error') {
      // Gradio's own validation (e.g. a slider value out of range) arrives as { error: "..." }.
      const raw = line.slice('data: '.length).trim();
      let message = 'The server could not generate the audio';
      try {
        message = (JSON.parse(raw) as { error?: string } | null)?.error || message;
      } catch {}
      throw new Error(message);
    }
  }

  throw new Error('The server closed the connection before the audio was ready');
}