// Concept-art generation. Pollinations.ai is free and keyless: an image URL
// is built from the prompt. OpenAI is optional if the writer adds a key.
import { useSettings } from '../store';

export async function generateImage(prompt, { width = 768, height = 768, seed } = {}) {
  const { imageProvider, openaiKey } = useSettings.getState();
  if (imageProvider === 'none') throw new Error('Image generation is turned off in Settings.');

  if (imageProvider === 'openai') {
    if (!openaiKey) throw new Error('Add an OpenAI key in Settings, or switch to Pollinations (free).');
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024', n: 1 }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || 'OpenAI image request failed.');
    return `data:image/png;base64,${json.data[0].b64_json}`;
  }

  // Pollinations: fetch the image and turn it into a data URL so it is saved
  // with the project and works offline later.
  const s = seed ?? Math.floor(Math.random() * 1e9);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${s}&nologo=true`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    // Network/CORS hiccup: fall back to the hosted URL so the image still shows.
    return url;
  }
  if (!res.ok) throw new Error('The free image service is busy. Try again in a moment.');
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Could not read the generated image.'));
    r.readAsDataURL(blob);
  });
}
