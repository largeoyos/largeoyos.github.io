(() => {
    const palettes = new Set(['coast', 'forest', 'sand', 'plum', 'slate']);
    const select = document.getElementById('site-palette');
    if (!select) return;
    const apply = value => {
        const palette = palettes.has(value) ? value : 'coast';
        const changed = document.documentElement.dataset.palette !== palette;
        document.documentElement.dataset.palette = palette;
        select.value = palette;
        if (changed) {
            // Embedded market charts use the shared scheme event to redraw.
            window.dispatchEvent(new CustomEvent('stack:scheme', { detail: { dark: document.documentElement.dataset.scheme === 'dark' } }));
        }
    };
    apply(document.documentElement.dataset.palette);
    select.addEventListener('change', () => {
        apply(select.value);
        try { localStorage.setItem('StackPalette', select.value); } catch (_) {}
    });
    window.addEventListener('storage', event => {
        if (event.key === 'StackPalette') apply(event.newValue);
    });
})();
