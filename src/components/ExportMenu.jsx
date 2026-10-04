import { useState } from 'react';
import { exportPDF, exportJSON } from '../lib/exporters';
import { toast } from '../store';
import { Modal, Field } from './ui';
import { useProjects } from '../store';

export default function ExportMenu({ project }) {
  const [open, setOpen] = useState(false);
  const update = useProjects((s) => s.update);
  return (
    <>
      <button className="btn sm" onClick={() => setOpen(true)}>⤓ Export</button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2>Export</h2>
          <p className="muted">Your title page uses these details.</p>
          <div className="col">
            <Field label="Written by">
              <input className="input" value={project.author} onChange={(e) => update({ author: e.target.value })} placeholder="Your name" />
            </Field>
            <Field label="Contact info" help="Bottom-left of the title page: email, phone, or agent.">
              <textarea className="textarea" rows={3} value={project.contact} onChange={(e) => update({ contact: e.target.value })} />
            </Field>
          </div>
          <div className="divider" />
          <div className="grid c2">
            <button className="card hover" style={{ textAlign: 'left' }} onClick={() => { exportPDF(project); toast('PDF downloaded', 'ok'); }}>
              <h3>📄 PDF (industry format)</h3>
              <div className="muted small">Courier 12pt, standard margins, title page and page numbers. Ready to send to readers and contests.</div>
            </button>
            <button className="card hover" style={{ textAlign: 'left' }} onClick={() => { exportJSON(project); toast('Backup downloaded', 'ok'); }}>
              <h3>💾 Project backup</h3>
              <div className="muted small">Everything: script, beats, bible, drawings and images. Re-import it from the Projects page.</div>
            </button>
          </div>
          <div className="row" style={{ marginTop: 16 }}><div className="spacer" /><button className="btn" onClick={() => setOpen(false)}>Done</button></div>
        </Modal>
      )}
    </>
  );
}
