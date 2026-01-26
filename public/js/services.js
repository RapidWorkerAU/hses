(() => {
  const pills = document.querySelectorAll('#services-pills .pill');
  const panels = {
    strategy: document.getElementById('panel-strategy'),
    operational: document.getElementById('panel-operational'),
    assurance: document.getElementById('panel-assurance'),
    incident: document.getElementById('panel-incident')
  };
  if (!pills.length) return;

  function activate(key) {
    // pills
    pills.forEach(p => {
      const active = p.dataset.target === key;
      p.classList.toggle('is-active', active);
      p.setAttribute('aria-selected', String(active));
    });
    // panels
    Object.entries(panels).forEach(([k, el]) => {
      if (!el) return;
      if (k === key) { el.classList.add('is-active'); el.removeAttribute('hidden'); }
      else { el.classList.remove('is-active'); el.setAttribute('hidden',''); }
    });
    // update hash
    const url = new URL(window.location);
    url.hash = `services=${key}`;
    history.replaceState(null, '', url);
  }

  pills.forEach(p => p.addEventListener('click', () => activate(p.dataset.target)));

  // deep-link
  const match = (window.location.hash || '').match(/services=([a-z-]+)/);
  const initial = match ? match[1] : 'strategy';
  if (panels[initial]) activate(initial); else activate('strategy');
})();

