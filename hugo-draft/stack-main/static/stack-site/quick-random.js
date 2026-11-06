(() => {
    const layoutButton = document.getElementById('layout-toggle-btn');
    const layoutSlot = document.querySelector('.quick-layout-slot');
    if (layoutButton && layoutSlot) {
        const welcomeCard = layoutButton.closest('.profile-card');
        layoutSlot.append(layoutButton);
        welcomeCard?.remove();
    }
    const randomIndex = count => {
        if (!window.crypto?.getRandomValues) return Math.floor(Math.random() * count);
        const value = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / count) * count;
        do { window.crypto.getRandomValues(value); } while (value[0] >= limit);
        return value[0] % count;
    };
    document.querySelectorAll('[data-quick-random]').forEach(button => {
        button.addEventListener('click', () => {
            const count = Number(button.dataset.quickRandom);
            const output = document.querySelector(`[data-random-result="${count}"]`);
            output.textContent = String(randomIndex(count) + (count === 6 ? 1 : 0));
        });
    });
})();
