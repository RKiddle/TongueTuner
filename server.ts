import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for resilient text generation with fallback on transient 503 / 429
async function generateWithRetry(params: any, preferredModel = 'gemini-3.1-flash-lite') {
  const modelsToTry = [preferredModel, 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed (${err?.status || err?.message}), trying fallback...`);
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Chat endpoint: Analyzes learner message, generates sentiment feedback & replies, and generates Gemini 3.8 TTS audio
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        language,
        userMessage,
        messages = [],
        scenario = '',
        voice = 'Kore',
        speed = 'normal',
      } = req.body;

      if (!userMessage || !language) {
        return res.status(400).json({ error: 'Language and userMessage are required.' });
      }

      const langMap: Record<string, { name: string; native: string; tutorName: string }> = {
        thai: { name: 'Thai', native: 'ภาษาไทย', tutorName: 'Kru Pim (ครูพิมพ์)' },
        mandarin: { name: 'Mandarin Chinese', native: '普通话', tutorName: 'Li Laoshi (李老师)' },
        japanese: { name: 'Japanese', native: '日本語', tutorName: 'Yuki Sensei (由紀先生)' },
      };

      const currentLang = langMap[language] || langMap.thai;

      // Step 1: Detailed Sentiment, Tone, and Linguistic Analysis + Contextual Reply
      const systemInstruction = `You are ${currentLang.tutorName}, an expert native language tutor and empathetic vocal coach for ${currentLang.name} (${currentLang.native}).
You specialize in real-time voice conversations and sentiment-aware feedback.

When the learner speaks or writes:
1. Deeply analyze their emotional tone and sentiment (e.g. Hesitant, Nervous, Overly Direct, Confident, Warm, Frustrated, Apologetic, Cheerful).
2. Evaluate their politeness and formality:
   - For Thai: assess use of polite particles (ครับ/ค่ะ), sentence endings, tone markers, honorifics, softening words.
   - For Mandarin: assess polite address (请, 您, 不好意思), tone flow, 3rd-tone sandhi awareness, natural conversational rhythm.
   - For Japanese: assess formality level (Teineigo 〜です/〜ます vs Casual Tameguchi vs Keigo), particle usage, conversational manners.
3. Assess tonal / pitch accuracy pointers specific to ${currentLang.name}:
   - Thai: 5 phonemic tones (Mid, Low, Falling, High, Rising). Point out tonal traps.
   - Mandarin: 4 tones + neutral tone. Point out tone pairs and sandhi.
   - Japanese: Pitch accent (Heiban, Atamadaka, Nakadaka, Odaka) and mora pacing.
4. Adapt your own emotional reaction based on the learner's state!
   - If they seem nervous, hesitant, or made an error: respond with warm reassurance, gentle encouragement, and a comforting tone.
   - If they are confident and playful: banter along warmly with lively enthusiasm.
   - If they are overly blunt: gently demonstrate a softer, more culturally polite alternative.
5. Provide your tutor reply in the native script, phonetic Romanization (Pinyin with tone marks for Mandarin, Romaji for Japanese, RTGS/phonetic transcription with tone indicators for Thai), and an English translation.
6. Provide a concise speech prompt designed for Gemini 3.8 TTS. Keep it natural, conversational, and avoid markdown or weird brackets.

Current Scenario Context: ${scenario || 'Friendly everyday cultural conversation'}
Conversation History:
${messages
  .slice(-6)
  .map((m: { role: string; text: string }) => `${m.role === 'user' ? 'Learner' : 'Tutor'}: ${m.text}`)
  .join('\n')}`;

      const analysisPrompt = `Learner said: "${userMessage}".
Provide the complete structured linguistic and sentiment analysis along with your tutor reply.`;

      const analysisResponse = await generateWithRetry({
        contents: analysisPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sentiment: {
                type: Type.STRING,
                description: 'Brief emotional sentiment label, e.g. "Hesitant & Polite", "Casual & Confident"',
              },
              sentimentSummary: {
                type: Type.STRING,
                description: 'Empathetic one-sentence description of the user\'s tone and vocal posture',
              },
              politenessLevel: {
                type: Type.STRING,
                description: 'Formal, Polite, Casual, or Blunt',
              },
              politenessScore: {
                type: Type.INTEGER,
                description: '0 to 100 percentage',
              },
              confidenceScore: {
                type: Type.INTEGER,
                description: '0 to 100 percentage',
              },
              emotionalTone: {
                type: Type.STRING,
                description: 'Hesitant, Neutral, Confident, Warm, Playful, Apologetic, or Frustrated',
              },
              tonalPitchNotes: {
                type: Type.STRING,
                description: 'Concrete tonal or pitch accent guidance for the user\'s words',
              },
              grammarPointers: {
                type: Type.STRING,
                description: 'Grammar or vocabulary refinement suggestion if needed',
              },
              encouragement: {
                type: Type.STRING,
                description: 'Warm motivating feedback line',
              },
              tutorReactionEmotion: {
                type: Type.STRING,
                description: 'How the tutor reacts emotionally to the learner\'s mood',
              },
              replyNative: {
                type: Type.STRING,
                description: 'Tutor\'s reply in native script',
              },
              replyRomanized: {
                type: Type.STRING,
                description: 'Phonetic Romanization with tone marks or pitch cues',
              },
              replyEnglish: {
                type: Type.STRING,
                description: 'English translation of tutor reply',
              },
              ttsText: {
                type: Type.STRING,
                description: 'Clean text strictly in target language for Gemini 3.8 TTS voice synthesis',
              },
              ttsStylePrompt: {
                type: Type.STRING,
                description: 'Speech style description for Gemini 3.8 TTS metadata (e.g. Warm encouraging tone)',
              },
            },
            required: [
              'sentiment',
              'sentimentSummary',
              'politenessLevel',
              'politenessScore',
              'confidenceScore',
              'emotionalTone',
              'tonalPitchNotes',
              'encouragement',
              'tutorReactionEmotion',
              'replyNative',
              'replyRomanized',
              'replyEnglish',
              'ttsText',
            ],
          },
        },
      });

      const parsedData = JSON.parse(analysisResponse.text || '{}');

      // Step 2: Synthesize audio using Gemini 3.8 TTS
      let audioBase64: string | null = null;
      try {
        const textForTts = parsedData.ttsText || parsedData.replyNative;
        const voiceStyle = parsedData.ttsStylePrompt || `Clear, warm, natural ${currentLang.name} language tutor speaking to a student`;

        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: textForTts,
                  speechMetadata: {
                    style: speed === 'slow' ? `Slow, clear, educational ${voiceStyle}` : voiceStyle,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
              },
            },
          },
        });

        const rawAudio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawAudio) {
          audioBase64 = rawAudio;
        }
      } catch (ttsErr) {
        console.error('Gemini 3.8 TTS synthesis error:', ttsErr);
      }

      return res.json({
        replyNative: parsedData.replyNative,
        replyRomanized: parsedData.replyRomanized,
        replyEnglish: parsedData.replyEnglish,
        analysis: {
          sentiment: parsedData.sentiment,
          sentimentSummary: parsedData.sentimentSummary,
          politenessLevel: parsedData.politenessLevel,
          politenessScore: parsedData.politenessScore,
          confidenceScore: parsedData.confidenceScore,
          emotionalTone: parsedData.emotionalTone,
          tonalPitchNotes: parsedData.tonalPitchNotes,
          grammarPointers: parsedData.grammarPointers,
          encouragement: parsedData.encouragement,
          tutorReactionEmotion: parsedData.tutorReactionEmotion,
        },
        audioBase64,
        tutorEmotion: parsedData.tutorReactionEmotion,
      });
    } catch (err: any) {
      console.error('Error in /api/chat:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Dedicated TTS synthesis endpoint for any text, drill, or phrase
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, language = 'thai', voice = 'Kore', speed = 'normal', style } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required for TTS synthesis.' });
      }

      const styleDescription = style || (speed === 'slow'
        ? `Slow, deliberate, educational pronunciation for ${language} language practice`
        : `Natural, friendly, articulate ${language} native pronunciation`);

      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text,
                speechMetadata: {
                  style: styleDescription,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });

      const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioBase64) {
        return res.status(500).json({ error: 'TTS did not return audio data.' });
      }

      return res.json({ audioBase64 });
    } catch (err: any) {
      console.error('Error in /api/tts:', err);
      res.status(500).json({ error: err.message || 'TTS generation failed' });
    }
  });

  // Audio transcription endpoint (transcribes user voice recording via Gemini)
  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm', language = 'thai' } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: 'audioBase64 is required.' });
      }

      const langHints: Record<string, string> = {
        thai: 'Transcribe this spoken Thai audio accurately into Thai script (ภาษาไทย). Return only the transcription.',
        mandarin: 'Transcribe this spoken Chinese audio accurately into simplified Chinese characters (普通话). Return only the transcription.',
        japanese: 'Transcribe this spoken Japanese audio accurately into Japanese script (Kanji, Hiragana, Katakana). Return only the transcription.',
      };

      const prompt = langHints[language] || 'Transcribe the audio accurately. Return only the transcription.';

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType.split(';')[0],
                data: audioBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      const transcription = response.text ? response.text.trim() : '';
      return res.json({ transcription });
    } catch (err: any) {
      console.error('Error in /api/transcribe:', err);
      res.status(500).json({ error: err.message || 'Transcription failed' });
    }
  });

  // Pronunciation & Tonal Clinic Drill Evaluation
  app.post('/api/pronunciation-clinic', async (req, res) => {
    try {
      const { drillId, targetNative, targetRomanized, userAudioBase64, userText, language } = req.body;

      // Analyze user pronunciation attempt
      const clinicPrompt = `Target Phrase in ${language}: "${targetNative}" (${targetRomanized}).
The user attempted this phrase: "${userText || 'Audio attempt'}".
Please evaluate the tonal accuracy, vowel lengths, consonant articulation, and overall pitch fidelity.
Provide:
1. Overall score (0-100)
2. Syllable-by-syllable tonal review
3. Specific phonetic mistakes and correction tips
4. Motivational encouragement`;

      const clinicResponse = await generateWithRetry({
        contents: clinicPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER },
              accuracyGrade: { type: Type.STRING, description: 'Excellent, Good, Needs Tone Practice, or Retry' },
              syllableBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    syllable: { type: Type.STRING },
                    targetTone: { type: Type.STRING },
                    feedback: { type: Type.STRING },
                    status: { type: Type.STRING, description: 'correct, close, or incorrect' },
                  },
                  required: ['syllable', 'targetTone', 'feedback', 'status'],
                },
              },
              coachingTip: { type: Type.STRING },
              encouragement: { type: Type.STRING },
            },
            required: ['overallScore', 'accuracyGrade', 'syllableBreakdown', 'coachingTip', 'encouragement'],
          },
        },
      });

      const result = JSON.parse(clinicResponse.text || '{}');

      // Also generate master native reference audio with Gemini 3.8 TTS
      let referenceAudioBase64 = null;
      try {
        const ttsRef = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: targetNative,
                  speechMetadata: {
                    style: `Slow, pristine, crystal-clear standard pronunciation demonstration for ${language} tone learners`,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });
        referenceAudioBase64 = ttsRef.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      } catch (e) {
        console.error('Reference TTS error:', e);
      }

      return res.json({
        ...result,
        referenceAudioBase64,
      });
    } catch (err: any) {
      console.error('Error in /api/pronunciation-clinic:', err);
      res.status(500).json({ error: err.message || 'Clinic evaluation failed' });
    }
  });

  // Serve static assets in production, or mount Vite middlewares in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TongueTuner AI server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
