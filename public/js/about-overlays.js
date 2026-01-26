(() => {
  const shots = document.querySelectorAll('.about-shot');
  shots.forEach((shot) => {
    const img = shot.querySelector('img');
    if (!img) return;
    const alt = (img.getAttribute('alt') || '').trim();
    if (alt) {
      shot.dataset.label = alt;
      if (!shot.hasAttribute('tabindex')) shot.setAttribute('tabindex', '0');
      shot.setAttribute('role', 'img');
      shot.setAttribute('aria-label', alt);
    }
  });
})();

