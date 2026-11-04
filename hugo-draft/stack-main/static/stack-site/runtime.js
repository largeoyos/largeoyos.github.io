(function () {
    'use strict';
    const nativeDocument = document;
    const root = () => nativeDocument.querySelector('[data-stack-app]');
    const query = (selector, all) => {
        if (/^(?:html|body|:root)$/.test(selector)) return all ? nativeDocument.querySelectorAll(selector) : nativeDocument.querySelector(selector);
        const application = root();
        const found = application ? (all ? application.querySelectorAll(selector) : application.querySelector(selector)) : null;
        if (all ? found?.length : found) return found;
        return all ? nativeDocument.querySelectorAll(selector) : nativeDocument.querySelector(selector);
    };
    window.StackPage = {
        querySelector: selector => query(selector, false),
        querySelectorAll: selector => query(selector, true),
        getElementById: id => root()?.querySelector('#' + CSS.escape(id)) || nativeDocument.getElementById(id),
        getElementsByClassName: names => root()?.getElementsByClassName(names) || nativeDocument.getElementsByClassName(names),
        getElementsByTagName: tag => root()?.getElementsByTagName(tag) || nativeDocument.getElementsByTagName(tag)
    };
    nativeDocument.documentElement.dataset.stackTheme = 'stack';
    if (window.self !== window.top) nativeDocument.documentElement.dataset.stackEmbedded = 'true';
    function syncScheme() {
        const dark = nativeDocument.documentElement.dataset.scheme === 'dark';
        const application = root();
        if (application) {
            application.classList.toggle('dark', dark);
            application.dataset.theme = dark ? 'dark' : 'light';
            application.dataset.scheme = dark ? 'dark' : 'light';
            application.querySelectorAll('.source-document').forEach(source => {
                source.classList.toggle('dark', dark);
                source.dataset.theme = dark ? 'dark' : 'light';
            });
        }
        nativeDocument.body?.classList.toggle('dark', dark);
        window.dispatchEvent(new CustomEvent('stack:scheme', { detail: { dark } }));
    }
    const observer = new MutationObserver(syncScheme);
    observer.observe(nativeDocument.documentElement, { attributes: true, attributeFilter: ['data-scheme'] });
    nativeDocument.addEventListener('DOMContentLoaded', () => {
        syncScheme();
        const application = root();
        if (!application) return;
        const source = application.querySelector('.source-document');
        const directory = application.querySelector('#sidebar')?.closest('.stack-source-toc');
        const mirrored = new Set();
        let menuOpen = false;
        const mirrorBodyState = () => {
            const classes = new Set(nativeDocument.body.classList);
            for (const name of mirrored) if (!classes.has(name)) {
                if (!['stack-app', 'article-content', 'stack-workspace'].includes(name)) application.classList.remove(name);
                if (name !== 'source-document') source?.classList.remove(name);
            }
            for (const name of classes) { application.classList.add(name); source?.classList.add(name); }
            mirrored.clear(); classes.forEach(name => mirrored.add(name));
            const expanded = ['menu-open', 'nav-open', 'sidebar-open'].some(name => classes.has(name));
            if (directory && expanded !== menuOpen) {
                directory.open = expanded;
                if (expanded) directory.querySelector('input[type="search"]')?.focus();
            }
            menuOpen = expanded;
        };
        mirrorBodyState();
        new MutationObserver(mirrorBodyState).observe(nativeDocument.body, { attributes: true, attributeFilter: ['class'] });
        if (directory && application.dataset.source.includes('digital-electronics-course/dist/index.html')) {
            directory.addEventListener('toggle', () => {
                nativeDocument.body.classList.toggle('menu-open', directory.open);
                application.querySelector('#menu')?.setAttribute('aria-expanded', String(directory.open));
            });
        }
        // Theme changes inside an imported course also update the shared Stack switch.
        nativeDocument.addEventListener('click', event => {
            if (!event.target.closest('#themeButton, #theme-button, [data-toggle-theme]')) return;
            setTimeout(() => {
                const dark = nativeDocument.body.classList.contains('dark');
                nativeDocument.documentElement.dataset.scheme = dark ? 'dark' : 'light';
                localStorage.setItem('StackColorScheme', dark ? 'dark' : 'light');
            }, 0);
        });
        // Keep decorative confetti inside the application stylesheet scope.
        new MutationObserver(records => {
            for (const record of records) for (const node of record.addedNodes) {
                if (node.nodeType === 1 && node.parentElement === nativeDocument.body && /confetti/.test(node.className)) application.appendChild(node);
            }
        }).observe(nativeDocument.body, { childList: true });
    });
})();
