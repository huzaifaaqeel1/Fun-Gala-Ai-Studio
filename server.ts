import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Storage directories
const DATA_DIR = path.resolve(__dirname, 'storage');
const AUDIO_DIR = path.resolve(DATA_DIR, 'audio');
const JOBS_DIR = path.resolve(DATA_DIR, 'jobs');
const LIBRARY_FILE = path.resolve(DATA_DIR, 'library.json');

[DATA_DIR, AUDIO_DIR, JOBS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

if (!fs.existsSync(LIBRARY_FILE)) {
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify([], null, 2));
}

// Serve saved audio files statically
app.use('/storage/audio', express.static(AUDIO_DIR));

// Initialize Gemini AI client with v1alpha and required User-Agent
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        apiVersion: 'v1alpha',
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Helper to pause execution
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Intelligent text chunker that NEVER drops sentences or truncates content.
 * Splits along paragraph boundaries first, then sentence endings (Urdu '۔', Hindi '।', English '.?!', etc.)
 * Configurable chunk limit: default 1200 characters for optimal neural voice continuity and quota safety.
 */
function splitTextIntoStoryChunks(text: string, maxChunkLength: number = 1200): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxChunkLength) return [clean];

  // 1. Split by double newlines (paragraphs)
  const paragraphs = clean.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 2 <= maxChunkLength) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
      continue;
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }

    if (trimmedPara.length <= maxChunkLength) {
      currentChunk = trimmedPara;
      continue;
    }

    // Split long paragraph by sentence boundaries: Urdu '۔', Hindi '।', '؟', '?', '!', '.'
    const sentenceRegex = /[^۔।!?؟\r\n]+[۔।!?؟\r\n]*/g;
    const sentences = trimmedPara.match(sentenceRegex) || [trimmedPara];
    let sentenceBuffer = '';

    for (const sentence of sentences) {
      if (sentenceBuffer.length + sentence.length <= maxChunkLength) {
        sentenceBuffer += sentence;
      } else {
        if (sentenceBuffer.trim()) {
          chunks.push(sentenceBuffer.trim());
        }
        // If an individual sentence exceeds maxChunkLength, split by words
        if (sentence.length > maxChunkLength) {
          const words = sentence.split(/\s+/);
          let wordBuffer = '';
          for (const w of words) {
            if ((wordBuffer + ' ' + w).length <= maxChunkLength) {
              wordBuffer = wordBuffer ? `${wordBuffer} ${w}` : w;
            } else {
              if (wordBuffer.trim()) chunks.push(wordBuffer.trim());
              wordBuffer = w;
            }
          }
          sentenceBuffer = wordBuffer;
        } else {
          sentenceBuffer = sentence;
        }
      }
    }
    if (sentenceBuffer.trim()) {
      currentChunk = sentenceBuffer.trim();
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [clean];
}

/**
 * Concatenate multiple 24kHz 16-bit mono WAV buffers into one seamless WAV file
 */
function concatenateWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return buffers[0];

  let totalDataLength = 0;
  for (const buf of buffers) {
    if (buf.length > 44) {
      totalDataLength += buf.length - 44;
    }
  }

  const firstHeader = buffers[0].subarray(0, 44);
  const outBuffer = Buffer.alloc(44 + totalDataLength);
  firstHeader.copy(outBuffer, 0, 0, 44);

  // Update ChunkSize at offset 4: 36 + SubChunk2Size
  outBuffer.writeUInt32LE(36 + totalDataLength, 4);
  // Update Subchunk2Size at offset 40: totalDataLength
  outBuffer.writeUInt32LE(totalDataLength, 40);

  let currentOffset = 44;
  for (const buf of buffers) {
    if (buf.length > 44) {
      const pcmData = buf.subarray(44);
      pcmData.copy(outBuffer, currentOffset);
      currentOffset += pcmData.length;
    }
  }

  return outBuffer;
}

/**
 * Generate audio with robust exponential backoff for 429 Rate Limits / Quotas
 */
async function generateGeminiSpeechWithRetry(
  aiClient: GoogleGenAI,
  text: string,
  prebuiltVoice: string,
  maxRetries: number = 3
): Promise<Buffer> {
  let attempt = 0;
  let delay = 2500;

  const validVoice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'].includes(prebuiltVoice)
    ? prebuiltVoice
    : 'Fenrir';

  while (attempt <= maxRetries) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text: text.trim() }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: validVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('API completed but returned no audio bytes.');
      }

      return Buffer.from(base64Audio, 'base64');
    } catch (err: any) {
      attempt++;
      const errMsg = err?.message || '';
      const isRateLimit =
        errMsg.includes('429') ||
        errMsg.includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        err?.status === 429;

      const isTemporary =
        isRateLimit ||
        errMsg.includes('503') ||
        errMsg.includes('500') ||
        errMsg.includes('overloaded') ||
        errMsg.includes('temporarily');

      if (attempt <= maxRetries && isTemporary) {
        console.warn(`[TTS Retry] Attempt ${attempt} hit ${isRateLimit ? 'Rate Limit (429)' : 'Transient Error'}. Backing off for ${delay}ms...`);
        await sleep(delay);
        delay *= 2; // exponential backoff
      } else {
        throw err;
      }
    }
  }
  throw new Error('Maximum retry attempts exceeded during voice synthesis.');
}

/**
 * Generate audio via ElevenLabs with retry
 */
async function generateElevenLabsSpeechWithRetry(
  apiKey: string,
  voiceId: string,
  text: string,
  stability: number = 75,
  similarity: number = 85,
  maxRetries: number = 3
): Promise<Buffer> {
  let attempt = 0;
  let delay = 2000;

  while (attempt <= maxRetries) {
    try {
      const elResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: stability / 100,
            similarity_boost: similarity / 100,
          },
        }),
      });

      if (!elResponse.ok) {
        const errJson = await elResponse.json().catch(() => ({}));
        throw new Error(errJson.detail?.message || `ElevenLabs HTTP error ${elResponse.status}`);
      }

      const arrayBuffer = await elResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err: any) {
      attempt++;
      if (attempt <= maxRetries) {
        console.warn(`[ElevenLabs Retry] Attempt ${attempt} failed. Backing off ${delay}ms...`);
        await sleep(delay);
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
  throw new Error('ElevenLabs voice generation exceeded maximum retries.');
}

// ==========================================
// BACKGROUND JOB PROCESSING FOR LONG STORIES
// ==========================================
interface JobRecord {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  language: string;
  languageCode: string;
  accent: string;
  prebuiltVoice: string;
  provider: 'gemini' | 'elevenlabs';
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  totalCharacters: number;
  totalWords: number;
  totalSections: number;
  completedSections: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  statusMessage: string;
  progressPercent: number;
  sections: {
    index: number;
    text: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    audioPath?: string;
    error?: string;
  }[];
  finalAudioUrl?: string;
  finalDuration?: number;
  createdAt: number;
  updatedAt: number;
}

const activeJobs = new Map<string, JobRecord>();

function saveJobState(job: JobRecord) {
  job.updatedAt = Date.now();
  activeJobs.set(job.id, job);
  const filePath = path.resolve(JOBS_DIR, `${job.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(job, null, 2));
}

function loadJobState(jobId: string): JobRecord | null {
  if (activeJobs.has(jobId)) return activeJobs.get(jobId)!;
  const filePath = path.resolve(JOBS_DIR, `${jobId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      activeJobs.set(jobId, data);
      return data;
    } catch {
      return null;
    }
  }
  return null;
}

async function processJobQueue(jobId: string) {
  const job = loadJobState(jobId);
  if (!job) return;

  job.status = 'processing';
  saveJobState(job);

  const sectionWavBuffers: Buffer[] = [];

  for (let i = 0; i < job.sections.length; i++) {
    const section = job.sections[i];

    // If already completed in a previous attempt, load existing audio
    if (section.status === 'completed' && section.audioPath && fs.existsSync(section.audioPath)) {
      sectionWavBuffers.push(fs.readFileSync(section.audioPath));
      continue;
    }

    section.status = 'processing';
    job.statusMessage = `Synthesizing section ${i + 1} of ${job.totalSections}...`;
    job.progressPercent = Math.round(((i) / job.totalSections) * 90);
    saveJobState(job);

    try {
      let audioBuf: Buffer;

      if (job.provider === 'elevenlabs' && (job.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY)) {
        const apiKey = job.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY!;
        const vId = job.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB';
        audioBuf = await generateElevenLabsSpeechWithRetry(apiKey, vId, section.text);
      } else {
        if (!ai) throw new Error('Gemini API is not configured on the server.');
        audioBuf = await generateGeminiSpeechWithRetry(ai, section.text, job.prebuiltVoice);
      }

      // Save section audio file
      const sectionFileName = `${job.id}_part_${i}.wav`;
      const sectionFilePath = path.resolve(AUDIO_DIR, sectionFileName);
      fs.writeFileSync(sectionFilePath, audioBuf);

      section.status = 'completed';
      section.audioPath = sectionFilePath;
      sectionWavBuffers.push(audioBuf);
      job.completedSections++;

      // Polite inter-chunk pacing delay to prevent quota spikes on long stories
      if (i < job.sections.length - 1) {
        await sleep(1500);
      }
    } catch (err: any) {
      console.error(`[Job ${job.id}] Error on section ${i + 1}:`, err);
      section.status = 'failed';
      section.error = err.message || 'Generation failed for this section';
      job.status = 'failed';
      job.statusMessage = `Failed at section ${i + 1}: ${section.error}`;
      saveJobState(job);
      return;
    }
  }

  // All sections complete! Concatenate into master file
  try {
    job.statusMessage = 'Mastering and merging audio sections...';
    saveJobState(job);

    const masterWav = concatenateWavBuffers(sectionWavBuffers);
    const masterFileName = `${job.id}_complete.wav`;
    const masterFilePath = path.resolve(AUDIO_DIR, masterFileName);
    fs.writeFileSync(masterFilePath, masterWav);

    const pcmBytes = Math.max(0, masterWav.length - 44);
    const calculatedDuration = Math.round((pcmBytes / 48000) * 10) / 10;

    job.status = 'completed';
    job.statusMessage = 'Complete!';
    job.progressPercent = 100;
    job.finalAudioUrl = `data:audio/wav;base64,${masterWav.toString('base64')}`;
    job.finalDuration = calculatedDuration || Math.max(1, Math.round(job.totalWords / 2.5));
    saveJobState(job);

    // Automatically register into library
    let libraryItems: any[] = [];
    try {
      libraryItems = JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf-8'));
    } catch {
      libraryItems = [];
    }

    const firstWords = job.text.trim().split(/\s+/).slice(0, 6).join(' ');
    const libraryEntry = {
      id: job.id,
      title: `${job.voiceName} — ${firstWords}...`,
      text: job.text,
      voiceId: job.voiceId,
      voiceName: job.voiceName,
      language: job.language,
      accent: job.accent,
      createdAt: Date.now(),
      duration: job.finalDuration,
      audioUrl: job.finalAudioUrl,
      format: 'wav',
      wordCount: job.totalWords,
    };

    libraryItems.unshift(libraryEntry);
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify(libraryItems.slice(0, 100), null, 2));
  } catch (err: any) {
    job.status = 'failed';
    job.statusMessage = `Failed to merge sections: ${err.message}`;
    saveJobState(job);
  }
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiAvailable: Boolean(process.env.GEMINI_API_KEY),
    elevenLabsEnvConfigured: Boolean(process.env.ELEVENLABS_API_KEY),
  });
});

// Start long-form background generation job
app.post('/api/tts/start-job', async (req: Request, res: Response) => {
  try {
    const {
      text,
      voiceId = 'urdu-tariq-master',
      voiceName = 'Tariq (طارق)',
      language = 'Urdu',
      languageCode = 'ur-PK',
      accent = 'Pakistani',
      prebuiltVoice = 'Fenrir',
      provider = 'gemini',
      elevenLabsApiKey,
      elevenLabsVoiceId,
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text content is required.' });
    }

    const cleanText = text.trim();
    const chunks = splitTextIntoStoryChunks(cleanText, 1200);
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newJob: JobRecord = {
      id: jobId,
      text: cleanText,
      voiceId,
      voiceName,
      language,
      languageCode,
      accent,
      prebuiltVoice,
      provider,
      elevenLabsApiKey,
      elevenLabsVoiceId,
      totalCharacters: cleanText.length,
      totalWords: cleanText.split(/\s+/).length,
      totalSections: chunks.length,
      completedSections: 0,
      status: 'pending',
      statusMessage: `Queued ${chunks.length} section(s) for synthesis...`,
      progressPercent: 5,
      sections: chunks.map((chunk, idx) => ({
        index: idx,
        text: chunk,
        status: 'pending',
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveJobState(newJob);

    // Launch background execution
    processJobQueue(jobId).catch((err) => {
      console.error(`Unhandled error in job ${jobId}:`, err);
    });

    return res.json({
      success: true,
      jobId,
      totalSections: chunks.length,
      totalCharacters: cleanText.length,
      totalWords: cleanText.split(/\s+/).length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to start long generation job.' });
  }
});

// Get job status
app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const job = loadJobState(id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  return res.json(job);
});

// Retry failed job
app.post('/api/jobs/:id/retry', (req: Request, res: Response) => {
  const { id } = req.params;
  const job = loadJobState(id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  // Reset failed sections to pending
  job.sections.forEach((sec) => {
    if (sec.status === 'failed') {
      sec.status = 'pending';
      sec.error = undefined;
    }
  });

  job.status = 'pending';
  job.statusMessage = 'Retrying failed sections...';
  saveJobState(job);

  processJobQueue(id).catch(console.error);
  return res.json({ success: true, message: 'Job retry initiated.' });
});

// Direct generation endpoint (handles standard & medium stories with backoff)
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  try {
    const {
      text,
      voiceId,
      voiceName,
      language = 'Urdu',
      languageCode = 'ur-PK',
      accent = 'Pakistani',
      prebuiltVoice = 'Fenrir',
      emotion = 'Storytelling',
      settings = {},
      provider = 'gemini',
      elevenLabsApiKey,
      elevenLabsVoiceId,
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text content is required for voice generation.' });
    }

    const cleanText = text.trim();
    const stability = settings.stability ?? 75;
    const similarity = settings.similarity ?? 85;

    // Split text into safe natural chunks (1200 chars each)
    const chunks = splitTextIntoStoryChunks(cleanText, 1200);

    // --- Provider 1: ElevenLabs API ---
    if (provider === 'elevenlabs') {
      const elKey = elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;
      if (!elKey) {
        return res.status(400).json({
          error:
            'ElevenLabs API key is missing. Please add your key in the Settings modal, or use the built-in AI Voice Engine.',
        });
      }

      const vId = elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB';
      const audioBuffers: Buffer[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const buf = await generateElevenLabsSpeechWithRetry(elKey, vId, chunk, stability, similarity);
        audioBuffers.push(buf);
        if (i < chunks.length - 1) await sleep(1200);
      }

      // Combine MP3 buffers
      const mergedMp3 = Buffer.concat(audioBuffers);
      const audioId = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const fileName = `${audioId}.mp3`;
      fs.writeFileSync(path.resolve(AUDIO_DIR, fileName), mergedMp3);

      return res.json({
        success: true,
        audioUrl: `data:audio/mp3;base64,${mergedMp3.toString('base64')}`,
        fileUrl: `/storage/audio/${fileName}`,
        durationEstimate: Math.max(1, Math.round(cleanText.split(/\s+/).length / 2.5)),
        format: 'mp3',
        wordCount: cleanText.split(/\s+/).length,
      });
    }

    // --- Provider 2: Built-in Gemini AI Voice Engine (Gemini 3.8 Flash Lite TTS) ---
    if (!ai) {
      return res.status(500).json({
        error:
          'Server-side GEMINI_API_KEY is not configured in environment. Please check your AI Studio secrets.',
      });
    }

    const wavBuffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk.trim()) continue;

      // Call Gemini TTS with rate limit exponential backoff
      const audioBuf = await generateGeminiSpeechWithRetry(ai, chunk, prebuiltVoice);
      wavBuffers.push(audioBuf);

      // Polite delay between consecutive chunks
      if (i < chunks.length - 1) {
        await sleep(1400);
      }
    }

    // Concatenate WAV buffers
    const combinedWav = concatenateWavBuffers(wavBuffers);
    const audioId = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fileName = `${audioId}.wav`;
    fs.writeFileSync(path.resolve(AUDIO_DIR, fileName), combinedWav);

    const audioBase64 = `data:audio/wav;base64,${combinedWav.toString('base64')}`;

    // Calculate approximate duration based on 24kHz 16-bit mono (48,000 bytes/sec)
    const pcmBytes = Math.max(0, combinedWav.length - 44);
    const calculatedDuration = Math.round((pcmBytes / 48000) * 10) / 10;

    return res.json({
      success: true,
      audioUrl: audioBase64,
      fileUrl: `/storage/audio/${fileName}`,
      durationEstimate: calculatedDuration || Math.max(1, Math.round(cleanText.split(/\s+/).length / 2.5)),
      format: 'wav',
      sectionsCount: chunks.length,
      wordCount: cleanText.split(/\s+/).length,
    });
  } catch (error: any) {
    console.error('Error in /api/tts/generate:', error);
    const errMsg = error?.message || '';
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        error:
          'Google AI Studio Free Tier daily limit (10 requests/day for gemini-3.8-flash-lite-tts) reached. To generate unlimited audio, please connect your ElevenLabs API key in Settings or attach a billing-enabled Gemini API key in AI Studio Secrets.',
        isQuotaLimit: true,
      });
    }
    return res.status(500).json({
      error: errMsg || 'An error occurred during voice generation.',
      details: error?.stack,
    });
  }
});

// Voice sample generation / preview
app.post('/api/tts/sample', async (req: Request, res: Response) => {
  try {
    const { voiceId, prebuiltVoice = 'Fenrir', sampleText, languageCode = 'ur-PK' } = req.body;
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API key not configured.' });
    }

    const textToSpeak = sampleText || 'Hello, this is a voice sample preview from TEXT TO SPEECH GENERATOR.';
    const audioBuf = await generateGeminiSpeechWithRetry(ai, textToSpeak, prebuiltVoice);

    return res.json({
      success: true,
      audioUrl: `data:audio/wav;base64,${audioBuf.toString('base64')}`,
    });
  } catch (err: any) {
    console.error('Error generating sample:', err);
    return res.status(500).json({ error: err?.message || 'Failed to generate voice preview.' });
  }
});

// Verify ElevenLabs API key
app.post('/api/settings/verify-elevenlabs', async (req: Request, res: Response) => {
  try {
    const apiKey = req.body.apiKey || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ valid: false, message: 'No ElevenLabs API key provided.' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        valid: false,
        message: errData.detail?.message || `ElevenLabs returned HTTP ${response.status}`,
      });
    }

    const userData = await response.json();
    return res.json({
      valid: true,
      subscription: userData.subscription?.tier || 'active',
      characterLimit: userData.subscription?.character_limit,
      characterCount: userData.subscription?.character_count,
    });
  } catch (error: any) {
    return res.status(500).json({ valid: false, message: error?.message || 'Connection failed' });
  }
});

// Fetch live ElevenLabs voices
app.post('/api/elevenlabs/voices', async (req: Request, res: Response) => {
  try {
    const apiKey = req.body.apiKey || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'ElevenLabs API key required to fetch custom ElevenLabs voices.' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Audio Library persistence endpoints
app.get('/api/library', (_req: Request, res: Response) => {
  try {
    const raw = fs.readFileSync(LIBRARY_FILE, 'utf-8');
    const items = JSON.parse(raw);
    res.json(items);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/library/save', (req: Request, res: Response) => {
  try {
    const item = req.body;
    if (!item || !item.id) {
      return res.status(400).json({ error: 'Invalid audio item.' });
    }

    let items: any[] = [];
    try {
      items = JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf-8'));
    } catch {
      items = [];
    }

    const existingIndex = items.findIndex((i: any) => i.id === item.id);
    if (existingIndex >= 0) {
      items[existingIndex] = { ...items[existingIndex], ...item };
    } else {
      items.unshift(item);
    }

    fs.writeFileSync(LIBRARY_FILE, JSON.stringify(items, null, 2));
    res.json({ success: true, count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/library/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let items: any[] = [];
    try {
      items = JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf-8'));
    } catch {
      items = [];
    }

    const filtered = items.filter((i: any) => i.id !== id);
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// VITE DEV SERVER / STATIC PRODUCTION SETUP
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TTS GENERATOR] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
