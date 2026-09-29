# TongueTuner

TongueTuner is a voice-first language learning app focused on pronunciation coaching, sentiment-aware feedback, and conversational practice.

## Overview

The app currently supports practice for:

- Thai
- Mandarin
- Japanese

It combines real-time chat, synthesized speech, pronunciation support, and guided practice scenarios to help learners speak more confidently.

## Features

- Voice and text conversation practice
- Real-time sentiment-aware feedback
- Pronunciation clinic mode
- Guided practice scenarios
- Language switching between Thai, Mandarin, and Japanese
- Audio playback with selectable voice and speed settings
- Romanization support
- Gemini-powered chat and TTS API integration

## Tech Stack

- TypeScript
- React
- Vite
- Express
- Tailwind CSS
- Google Gen AI
- Lucide React
- Motion

## Getting Started

### Prerequisites

- Node.js
- npm or another compatible package manager

### Install dependencies

```bash
npm install
```

### Run the app in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - start the development server
- `npm run start` - start the server
- `npm run build` - build the app with Vite
- `npm run preview` - preview the production build
- `npm run lint` - type-check the project
- `npm run clean` - remove generated build output

## Project Notes

The app uses API endpoints such as:

- `POST /api/chat`
- `POST /api/tts`

These power the conversational experience and audio generation features.

## License

No license has been specified yet.
