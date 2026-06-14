# Symptom Timeline

> Build your health timeline. Walk into appointments prepared.

A lightweight, privacy-first tool for logging symptoms over time and generating a structured AI-powered summary before medical appointments. Your data never leaves your browser.

## Features

- **Timeline journal** — log symptoms with severity, category, date/time, and notes
- **Grouped by week** — chronological view with weekly groupings
- **AI appointment summary** — Claude generates a structured narrative with pattern analysis, severity progression, and suggested questions for your doctor
- **Print-ready** — formatted for printing or saving as a PDF
- **Offline-first** — all entries persist in your browser's localStorage

## Usage

1. Get a free API key from [console.anthropic.com](https://console.anthropic.com)
2. Open the app and enter your key (stored locally, never transmitted to this site)
3. Log symptoms as they occur
4. Before your appointment, click **Prepare My Summary**

## Privacy

Your symptom data is stored exclusively in your browser via `localStorage`. Your Anthropic API key is also stored locally and sent only to Anthropic's servers to generate summaries — never to this site.

## Tech

Vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no server.
