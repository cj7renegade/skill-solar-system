// Confirmations for risky actions. In the Classic theme they are the browser's own confirm(), exactly
// as before. In the Cyberpunk HUD theme they are a HUD modal: destructive actions (replacing a map,
// deleting a skill, replacing answers, clearing history, replacing a lesson) use the red danger
// variant; other confirmations use the cyan frame. Cancel has focus first, so Enter never destroys.
import { ModalFrame, HudButton, el } from './components.js';

const cyberpunk = () => document.documentElement.dataset.theme === 'cyberpunk';

export function askConfirm(message, { danger = false, title = null, confirmLabel = null } = {}) {
  if (!cyberpunk()) return Promise.resolve(window.confirm(message));
  return new Promise(resolve => {
    const dialog = el('dialog', { class: 'cp-modal cp-confirm', 'aria-label': title || (danger ? 'Confirm a destructive action' : 'Please confirm') });
    let done = false;
    const finish = ok => { if (done) return; done = true; dialog.close(); dialog.remove(); resolve(ok); };
    const cancel = HudButton({ label: 'Cancel', variant: 'secondary', onclick: () => finish(false) });
    const ok = HudButton({ label: confirmLabel || (danger ? 'Confirm' : 'OK'), variant: danger ? 'danger' : 'primary', fill: danger, onclick: () => finish(true) });
    cancel.id = 'confirm-cancel'; ok.id = 'confirm-ok';
    dialog.append(ModalFrame({ title: title || (danger ? 'Destructive action' : 'Please confirm'), variant: danger ? 'alert' : 'active',
      body: el('div', { class: 'cp-prose' }, String(message).split(/\n\s*\n/).map(p => el('p', { text: p }))), actions: [cancel, ok] }));
    dialog.addEventListener('cancel', e => { e.preventDefault(); finish(false); });
    document.body.append(dialog);
    dialog.showModal(); cancel.focus();
  });
}
export const askDanger = (message, options = {}) => askConfirm(message, { ...options, danger: true });
