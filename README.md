# GODLIKE

A guided screenwriting studio for people who have never written a script. It teaches the craft as you go and helps you plan, write, design and polish films, TV, stage plays and audio dramas.

## What's inside

- **Story Wizard:** eight guided steps from "What if…?" to logline, hero, cast and story beats, each with a short lesson.
- **Script editor:** industry formatting as you type. Enter picks the next element, Tab cycles, `int.` becomes a scene heading, and names and locations autocomplete. Page breaks and undo included.
- **Scene Assistant:** a slider sets how much help you get (questions → options → drafts). Includes place, time, conflict, opening and ending ideas, plus a mentor chat that knows your story.
- **Beat Board:** drag-and-drop index cards by act. Dashed "holes" show unplanned beats, and AI can suggest fills.
- **Story Bible:** guided character profiles, an "interview your character" chat, a voice check, a relationship map, locations and world notes.
- **Design Studio:** a layered drawing tool with pressure-sensitive pen, pencil, marker, airbrush, watercolor and eraser, plus shapes, fill, text, eyedropper, select/move/scale/rotate, image import and collage. Guides include perspective grids, front/side/back turnarounds, pose mannequins and film frames. Claude writes look briefs, sketches SVGs and critiques drawings; free concept art comes from Pollinations.ai.
- **Script Doctor:** instant offline checks for format, pacing, dialogue and character, plus full AI coverage that finds plot holes and unpaid setups.
- **Craft Library:** a searchable glossary, format guides and story structures.
- **Formats:** feature, short, animated feature, TV single-cam, multi-cam, one-hour drama, animated TV, web series, vertical micro-drama, stage play, audio drama, commercial/music video.
- **Export:** industry-standard PDF (Courier 12pt, title page, page numbers) and a full JSON project backup.

## AI

Everything works without AI. To unlock personalized help, add your own Claude API key in **Settings**. It is stored only in your browser and sent only to Anthropic. Concept art uses Pollinations.ai (free, no key), or OpenAI if you add a key.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

## Deploy

It's a static site. The included GitHub Actions workflow publishes to GitHub Pages on every push to `main`. Enable it under **Settings → Pages → Source: GitHub Actions**.
