// Claude integration. GODLIKE is a static site, so calls go straight from the
// browser using the writer's own API key (stored only in their browser).
import { useSettings } from '../store';

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (best quality)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (faster, cheaper)' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fastest)' },
];

export function hasAI() {
  return Boolean(useSettings.getState().apiKey);
}

// The SDK is loaded on first use so it doesn't slow the initial page load.
async function client() {
  const { apiKey } = useSettings.getState();
  if (!apiKey) throw new Error('Add your Claude API key in Settings to use AI features.');
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

const SYSTEM = `You are the writing mentor inside GODLIKE, a screenwriting studio for people who may have never written a script.
Be warm, specific and practical. Teach briefly as you help: one sentence of "why" is better than a lecture.
Respect the writer's ownership: offer options and questions; only draft text when asked to.
Use correct industry formatting conventions for the project's format (screenplay, teleplay, stage play or audio drama).`;

function buildParams({ model, system, messages, maxTokens, schema, effort }) {
  const params = {
    model,
    max_tokens: maxTokens,
    system: system ? `${SYSTEM}\n\n${system}` : SYSTEM,
    messages,
  };
  const isHaiku = model.startsWith('claude-haiku');
  if (!isHaiku) {
    params.output_config = { effort: effort || 'medium' };
    // Server-side refusal fallback on the models that support it.
    params.betas = ['server-side-fallback-2026-07-01'];
    params.fallbacks = 'default';
  }
  if (schema) {
    params.output_config = { ...(params.output_config || {}), format: { type: 'json_schema', schema } };
  }
  return params;
}

/**
 * Ask Claude. `content` may be a string or an array of content blocks
 * (e.g. an image block plus a text block). Returns plain text, or the parsed
 * object when `schema` is given.
 */
export async function ask({ content, system, schema, maxTokens = 16000, effort, history = [] }) {
  const { model } = useSettings.getState();
  const messages = [...history, { role: 'user', content }];
  const params = buildParams({ model, system, messages, maxTokens, schema, effort });
  let response;
  try {
    const c = await client();
    response = params.betas ? await c.beta.messages.create(params) : await c.messages.create(params);
  } catch (err) {
    throw new Error(friendlyError(err));
  }
  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined this request. Try rephrasing it.');
  }
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  if (!schema) return text;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Claude returned an unexpected response. Please try again.');
  }
}

function friendlyError(err) {
  const status = err?.status;
  if (status === 401) return 'Your Claude API key was rejected. Check it in Settings.';
  if (status === 429) return 'Rate limited by the Claude API. Wait a moment and try again.';
  if (status === 529 || status >= 500) return 'Claude is busy right now. Try again shortly.';
  if (status === 400) return `Claude couldn't process that request: ${err.message}`;
  if (!status) return 'Could not reach Claude. Check your internet connection.';
  return err.message || 'Something went wrong talking to Claude.';
}

/** Convert a data URL (from a canvas or upload) into a Claude image block. */
export function imageBlock(dataUrl) {
  const [meta, data] = dataUrl.split(',');
  const media_type = meta.match(/data:(.*?);/)[1];
  return { type: 'image', source: { type: 'base64', media_type, data } };
}

/** A compact plain-text summary of the project for grounding prompts. */
export function projectContext(project, { includeScript = false, maxScriptChars = 400000 } = {}) {
  const lines = [];
  lines.push(`TITLE: ${project.title || 'Untitled'}`);
  lines.push(`FORMAT: ${project.format}`);
  if (project.genres?.length) lines.push(`GENRE: ${project.genres.join(', ')}`);
  if (project.tones?.length) lines.push(`TONE: ${project.tones.join(', ')}`);
  if (project.idea) lines.push(`IDEA: ${project.idea}`);
  if (project.logline) lines.push(`LOGLINE: ${project.logline}`);
  if (project.theme) lines.push(`THEME: ${project.theme}`);
  if (project.characters?.length) {
    lines.push('\nCHARACTERS:');
    for (const c of project.characters) {
      const bits = [c.role, c.age && `age ${c.age}`, c.want && `wants: ${c.want}`, c.need && `needs: ${c.need}`, c.flaw && `flaw: ${c.flaw}`, c.look && `look: ${c.look}`, c.wardrobe && `wardrobe: ${c.wardrobe}`].filter(Boolean);
      lines.push(`- ${c.name || 'Unnamed'}: ${bits.join('; ')}`);
    }
  }
  if (project.locations?.length) {
    lines.push('\nLOCATIONS:');
    for (const l of project.locations) lines.push(`- ${l.name}: ${[l.desc, l.mood].filter(Boolean).join('; ')}`);
  }
  const beats = Object.entries(project.beats || {}).filter(([, v]) => v?.trim());
  if (beats.length) {
    lines.push('\nBEATS:');
    for (const [k, v] of beats) lines.push(`- ${k}: ${v}`);
  }
  if (project.cards?.length) {
    lines.push('\nOUTLINE CARDS:');
    for (const c of project.cards) lines.push(`- [${c.act}] ${c.title}${c.text ? ': ' + c.text : ''}`);
  }
  if (includeScript && project.script?.length) {
    const s = scriptToText(project.script);
    lines.push('\nSCRIPT:\n' + (s.length > maxScriptChars ? s.slice(0, maxScriptChars) + '\n[...truncated]' : s));
  }
  return lines.join('\n');
}

export function scriptToText(blocks) {
  return blocks
    .map((b) => {
      const t = b.text || '';
      switch (b.type) {
        case 'scene': case 'shot': case 'transition': case 'actBreak': case 'coldOpen':
        case 'actHeading': case 'sceneHeading': case 'sound': case 'music':
          return '\n' + t.toUpperCase();
        case 'character': return '\n\t\t' + t.toUpperCase();
        case 'parenthetical': return '\t\t(' + t.replace(/^\(|\)$/g, '') + ')';
        case 'dialogue': return '\t' + t;
        case 'stageDirection': return '\n(' + t.replace(/^\(|\)$/g, '') + ')';
        default: return '\n' + t;
      }
    })
    .join('\n')
    .trim();
}
