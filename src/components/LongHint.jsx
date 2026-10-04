import { Tip } from './ui';

// A gentle nudge when one answer starts holding several kinds of information.
const FOCUS = { want: 'The clearest want fits in one sentence: what they are chasing.', need: 'A need is usually one short phrase: the inner change.', flaw: 'Name the one flaw that matters most to the ending.', look: 'One or two telling details beat a full description.' };
export default function LongHint({ field, text }) {
  if (!FOCUS[field] || (text || '').length < 220) return null;
  return <Tip>{FOCUS[field]} Backstory belongs in <b>Wound</b>, and setting or other details in <b>Notes</b> or the <b>World</b> tab.</Tip>;
}
