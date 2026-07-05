# Shitpost Generator

An interactive meme generation system developed as part of a Bachelor's thesis in Graphic Design & Visual Communication.

The project explores how user control can be disrupted through probabilistic interaction systems, sound feedback, and multi-stage meme assembly.

## Live Prototype

https://shitpost-navy.vercel.app

## Concept

The system is built as a 4-stage interactive pipeline:

1. Background selection
2. Face selection
3. Body selection (probabilistic click-based interaction)
4. Text selection (hover-based escape behavior)
5. Final meme generation

Each stage gradually reduces user control through behavioral logic and randomness.

## Interaction System

- Click-based sound triggers (Stage 3)
- Hover-based escape behavior + sound (Stage 4)
- Probabilistic interaction (40% / 60% outcomes)
- Dynamic feedback loop between user and system

## Run Locally

```bash
npm install
npm run dev
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
