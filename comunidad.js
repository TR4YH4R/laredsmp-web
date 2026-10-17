'use strict';
(() => {
  const result = document.querySelector('.community-result');
  const output = result.querySelector('textarea');
  const status = document.getElementById('community-status');
  document.querySelectorAll('form[data-kind]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const lines = [form.dataset.kind];
      for (const [name, raw] of new FormData(form)) {
        const value = String(raw).trim();
        const field = form.elements.namedItem(name);
        if (field.required && !value) { field.setCustomValidity('Completa este campo.'); field.reportValidity(); return; }
        if (field.type === 'url' && value) {
          let valid = false;
          try { const url = new URL(value); valid = ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; } catch {}
          if (!valid) { field.setCustomValidity('Usa un enlace público http o https, sin credenciales.'); field.reportValidity(); return; }
        }
        if (value) lines.push(name + ': ' + value);
      }
      output.value = lines.join('\n\n');
      result.hidden = false;
      status.textContent = 'Mensaje preparado. No enviado.';
      result.scrollIntoView({block:'start'});
      output.focus({preventScroll:true});
    });
    form.addEventListener('input', event => { if (event.target.setCustomValidity) event.target.setCustomValidity(''); });
  });
  document.getElementById('copy-community').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(output.value); status.textContent = 'Copiado. Abre Discord y pega el mensaje para compartirlo con el equipo.'; }
    catch { output.focus(); output.select(); status.textContent = 'No se pudo copiar automáticamente. Copia el texto seleccionado y pégalo en Discord.'; }
  });
})();
