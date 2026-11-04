// Remote charts and experiments must not postpone the site's menu and theme switch.
(() => {
    const stack = (window as any).Stack;
    if (!stack) return;
    const initialize = stack.init.bind(stack);
    let initialized = false;
    stack.init = () => {
        if (initialized) return;
        initialized = true;
        initialize();
        document.documentElement.dataset.stackReady = 'true';
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stack.init, { once: true });
    else stack.init();
})();
