import generateSpeech, { checkSpace } from '../gradioClient';

const BASE = 'https://voice.jonathan-orlowski.dev';
const PARAMS = { text: 'Hola', temperature: 0.7, top_p: 0.85, top_k: 50, seed: 42 };

const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

const json = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) });
const sse = (event: string, data: unknown) =>
  Promise.resolve({ ok: true, status: 200, text: async () => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n` });

// The queue POST answers with an event id, then the result arrives on the SSE stream for that id.
const respondWith = (event: string, data: unknown) => {
  mockFetch.mockImplementationOnce(() => json({ event_id: 'abc' })).mockImplementationOnce(() => sse(event, data));
};

beforeEach(() => mockFetch.mockReset());

describe('checkSpace', () => {
  it('is ready when /health reports ok', async () => {
    mockFetch.mockImplementationOnce(() => json({ status: 'ok', version: 'sha' }));

    await expect(checkSpace()).resolves.toBe('ready');
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/health`);
  });

  it('is an error when the model files are missing', async () => {
    mockFetch.mockImplementationOnce(() => json({ status: 'error', missing: ['models/sample5.wav'] }, 503));

    await expect(checkSpace()).resolves.toBe('error');
  });

  it('is an error when the server cannot be reached', async () => {
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('offline')));

    await expect(checkSpace()).resolves.toBe('error');
  });
});

describe('generateSpeech', () => {
  it('queues the text and settings in the order the endpoint expects', async () => {
    respondWith('complete', [{ url: `${BASE}/gradio_api/file=a.wav` }, 'ok']);

    await generateSpeech(PARAMS);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/gradio_api/call/generate_speech`);
    expect(JSON.parse(init.body)).toEqual({ data: ['Hola', 0.7, 0.85, 50, 42] });
    expect(mockFetch.mock.calls[1][0]).toBe(`${BASE}/gradio_api/call/generate_speech/abc`);
  });

  it('resolves a root-relative audio path against the server', async () => {
    respondWith('complete', [{ url: '/gradio_api/file=a.wav' }, 'ok']);

    await expect(generateSpeech(PARAMS)).resolves.toBe(`${BASE}/gradio_api/file=a.wav`);
  });

  it('accepts the audio URL as a plain string', async () => {
    respondWith('complete', [`${BASE}/gradio_api/file=a.wav`, 'ok']);

    await expect(generateSpeech(PARAMS)).resolves.toBe(`${BASE}/gradio_api/file=a.wav`);
  });

  it("shows the server's reason when it refuses the text", async () => {
    respondWith('complete', [null, 'Please keep the text under 1000 characters.']);

    await expect(generateSpeech(PARAMS)).rejects.toThrow('Please keep the text under 1000 characters.');
  });

  it("shows Gradio's own validation errors", async () => {
    respondWith('error', { error: 'Value 5 is greater than maximum value 1.0.' });

    await expect(generateSpeech(PARAMS)).rejects.toThrow('Value 5 is greater than maximum value 1.0.');
  });

  it('fails cleanly when the queue rejects the request', async () => {
    mockFetch.mockImplementationOnce(() => json({ detail: 'busy' }, 503));

    await expect(generateSpeech(PARAMS)).rejects.toThrow('The server could not take the request (503)');
  });

  it('fails cleanly when the stream ends without a result', async () => {
    mockFetch
      .mockImplementationOnce(() => json({ event_id: 'abc' }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, status: 200, text: async () => 'event: heartbeat\n' }));

    await expect(generateSpeech(PARAMS)).rejects.toThrow('closed the connection');
  });
});
