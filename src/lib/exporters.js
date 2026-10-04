// Export: industry-format PDF and a full-project JSON backup.
import { jsPDF } from 'jspdf';
import { paginate, LINES_PER_PAGE } from './layout';
import { FORMATS } from '../data/formats';

const LINE = 12; // points: 6 lines per inch
const TOP = 72;  // 1 inch

function safeName(title) {
  return (title || 'untitled').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'untitled';
}

export function exportPDF(project) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(12);
  const W = 612;

  // Title page
  const title = (project.title || 'Untitled').toUpperCase();
  doc.text(title, W / 2, 252, { align: 'center' });
  doc.text('Written by', W / 2, 288, { align: 'center' });
  doc.text(project.author || '', W / 2, 312, { align: 'center' });
  const fmt = FORMATS[project.format];
  if (fmt && fmt.group !== 'Film') doc.text(`(${fmt.name})`, W / 2, 348, { align: 'center' });
  const contact = (project.contact || '').split('\n');
  contact.forEach((l, i) => doc.text(l, 108, 648 + i * LINE - (contact.length - 1) * LINE));

  const { pages } = paginate(project.script || []);
  pages.forEach((page, pi) => {
    doc.addPage();
    doc.setFont('courier', 'normal');
    if (pi > 0) doc.text(`${pi + 1}.`, W - 72, 36, { align: 'right' });
    let y = TOP;
    for (const item of page) {
      y += item.before * LINE;
      const { el } = item;
      const style = el.italic ? 'italic' : 'normal';
      doc.setFont('courier', style);
      for (const line of item.lines) {
        let x = el.left * 72;
        if (el.align === 'right') x = (el.left + el.width) * 72 - doc.getTextWidth(line);
        if (el.align === 'center') x = (el.left + el.width / 2) * 72 - doc.getTextWidth(line) / 2;
        doc.text(line, x, y + 9);
        if (el.underline && line) doc.line(x, y + 11, x + doc.getTextWidth(line), y + 11);
        y += LINE;
      }
    }
    if (y > TOP + LINES_PER_PAGE * LINE + 1) console.warn('page overflow', pi + 1);
  });

  doc.save(`${safeName(project.title)}.pdf`);
}

export function exportJSON(project) {
  const blob = new Blob([JSON.stringify({ godlike: 1, project }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${safeName(project.title)}.godlike.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function readBackup(file) {
  const data = JSON.parse(await file.text());
  if (!data?.project || !Array.isArray(data.project.script)) throw new Error('That file is not a GODLIKE backup.');
  return data.project;
}
