// Higher-level AI helpers shared by the wizard, beat board, bible and editor.
import { ask, projectContext } from './ai';
import { FORMATS } from '../data/formats';

const OPTIONS_SCHEMA = {
  type: 'object',
  properties: {
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, text: { type: 'string' }, why: { type: 'string' } },
        required: ['title', 'text', 'why'],
        additionalProperties: false,
      },
    },
  },
  required: ['options'],
  additionalProperties: false,
};

/** Ask for N distinct options for a task. Returns [{title, text, why}]. */
export async function suggestOptions(project, task, n = 3) {
  const res = await ask({
    system: `Return ${n} distinct, specific options. "title" is a 2-5 word label, "text" is the option itself (1-3 sentences, ready to use), "why" is one short sentence teaching the craft reason it works.`,
    content: `PROJECT SO FAR:\n${projectContext(project)}\n\nTASK: ${task}`,
    schema: OPTIONS_SCHEMA,
    maxTokens: 4000,
    effort: 'low',
  });
  return res.options || [];
}

const QUESTIONS_SCHEMA = {
  type: 'object',
  properties: { questions: { type: 'array', items: { type: 'string' } } },
  required: ['questions'],
  additionalProperties: false,
};

/** Ask for probing questions that help the writer think (assist level 0). */
export async function suggestQuestions(project, task) {
  const res = await ask({
    system: 'Return 4 short, probing questions that help the writer figure this out themselves. Do not answer them.',
    content: `PROJECT SO FAR:\n${projectContext(project)}\n\nTHE WRITER IS WORKING ON: ${task}`,
    schema: QUESTIONS_SCHEMA,
    maxTokens: 2000,
    effort: 'low',
  });
  return res.questions || [];
}

const BLOCKS_SCHEMA = {
  type: 'object',
  properties: {
    note: { type: 'string' },
    blocks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot', 'sound', 'music', 'stageDirection', 'sceneHeading', 'narrator'] },
          text: { type: 'string' },
        },
        required: ['type', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['note', 'blocks'],
  additionalProperties: false,
};

/** Draft script blocks (assist level 2). Returns { note, blocks }. */
export async function draftBlocks(project, { sceneText, request }) {
  const fmt = FORMATS[project.format];
  return ask({
    system: `Draft script content as an ordered list of formatted elements for a ${fmt.name}. Allowed element types for this format: ${fmt.elements.join(', ')}.
Character cues contain only the name (plus V.O./O.S. extension if needed). Parentheticals have no surrounding parentheses. Keep it lean and in the writer's voice; this is a draft for them to rewrite.
"note" is one sentence explaining the choice you made, as a teacher would.`,
    content: `PROJECT:\n${projectContext(project)}\n\nCURRENT SCENE SO FAR:\n${sceneText || '(empty)'}\n\nREQUEST: ${request}`,
    schema: BLOCKS_SCHEMA,
    maxTokens: 8000,
    effort: 'medium',
  });
}
