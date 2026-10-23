// Runs before the stylesheet so the saved appearance is applied before paint.
(() => {
  const key = 'mi-balance-appearance';
  const choices = ['dark', 'light', 'system'];
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'dark';
  try {
    const saved = localStorage.getItem(key);
    if (choices.includes(saved)) preference = saved;
  } catch { /* Appearance still works when storage is unavailable. */ }

  function apply() {
    const theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#182329' : '#f5f7fa';
    document.querySelectorAll('[data-theme-select]').forEach(select => { select.value = preference; });
  }

  window.balanceTheme = {
    get: () => preference,
    set(value) {
      if (!choices.includes(value)) return;
      preference = value;
      try { localStorage.setItem(key, value); } catch { /* Keep the choice for this visit. */ }
      apply();
    },
  };
  system.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = choices.includes(event.newValue) ? event.newValue : 'dark';
    apply();
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-theme-select]')) window.balanceTheme.set(event.target.value);
  });
  apply();
})();
