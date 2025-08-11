# Dezy Clinic Chatbot

Chatbot assistant built with Next.js App Router, Zustand, and the Gemini API (OpenAI-compatible endpoint).

Deployed URL: [dezy-clinic-chatbot.vercel.app](https://dezy-clinic-chatbot.vercel.app/)


## Prerequisites
- Node.js 18+ and npm
- A Gemini API key from Google AI Studio

## Setup
1. Install dependencies:
```bash
npm install
```

2. Create an `.env.local` at the project root:
```bash
# Gemini API (OpenAI-compatible endpoint)
GEMINI_API_KEY=your_api_key_here
# Choose a Gemini chat model (examples: gemini-2.5-flash, gemini-2.0-flash)
LLM_MODEL=gemini-2.5-flash
```

## Run locally
```bash
npm run dev
```
Then open http://localhost:3000

- Chat at `/`
- Dashboard at `/dashboard`

## Features
- Function-calling for booking, cancel, reschedule, availability checks
- LocalStorage persistence with cross-tab sync (Zustand)
- Markdown rendering for rich assistant responses