document.addEventListener('DOMContentLoaded', async () => {
    const config = window.StackArticle;
    const content = document.querySelector('.article-content');
    if (!config || !content) return;
    const url = path => new URL(window.StackSiteBase + path, location.origin).href;
    let markdown;
    try {
        const response = await fetch(url(config.source));
        if (!response.ok) throw new Error('正文源文件无法加载');
        markdown = await response.text();
        const headings = [...content.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(heading => ({ id: heading.id, tag: heading.tagName }));
        if (window.ArticleMath && window.marked) {
            content.innerHTML = ArticleMath.parse(markdown.replace(/^\uFEFF/, '').replace(/^\s*# [^\r\n]+\r?\n(?:\r?\n)?/, ''));
            [...content.querySelectorAll('h1,h2,h3,h4,h5,h6')].forEach((heading, index) => { if (headings[index]?.tag === heading.tagName) heading.id = headings[index].id; });
            window.CollectionMath?.refresh();
        }
    } catch (error) {
        console.error(error);
        return;
    }
    content.id ||= 'content';
    content.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
        heading.tabIndex = 0;
        heading.setAttribute('role', 'button');
        heading.setAttribute('aria-expanded', 'true');
        heading.classList.add('stack-fold-heading');
        const icon = document.createElement('span');
        icon.className = 'stack-fold-icon';
        icon.textContent = '▼';
        icon.setAttribute('aria-hidden', 'true');
        heading.prepend(icon);
        const toggle = event => {
            if (event.target.closest('a')) return;
            const expanding = heading.getAttribute('aria-expanded') === 'false';
            heading.setAttribute('aria-expanded', String(expanding));
            let sibling = heading.nextElementSibling;
            while (sibling) {
                if (/^H[1-6]$/.test(sibling.tagName) && Number(sibling.tagName[1]) <= Number(heading.tagName[1])) break;
                if (expanding) sibling.style.display = sibling.dataset.originalDisplay || '';
                else { if (sibling.style.display !== 'none') sibling.dataset.originalDisplay = sibling.style.display; sibling.style.display = 'none'; }
                sibling = sibling.nextElementSibling;
            }
        };
        heading.addEventListener('click', toggle);
        heading.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); heading.click(); } });
    });
    const copy = (button, value, normal, success, failure) => button.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(value); button.textContent = success; }
        catch { button.textContent = failure; }
        setTimeout(() => { button.textContent = normal; }, 2000);
    });
    content.querySelectorAll('pre').forEach(pre => {
        const code = pre.querySelector('code');
        if (code && window.hljs) hljs.highlightElement(code);
        pre.querySelectorAll('.copyCodeButton, .copy-code-btn').forEach(button => button.remove());
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.type = 'button';
        button.textContent = '复制';
        copy(button, (code || pre).textContent, '复制', '已复制!', '失败');
        pre.append(button);
    });
    const controls = document.createElement('div');
    controls.className = 'stack-reader-controls';
    const all = document.createElement('button');
    all.type = 'button';
    all.dataset.copyMarkdown = 'true';
    all.textContent = '📋 复制全文 (Markdown)';
    copy(all, markdown, all.textContent, '✅ 全文已复制!', '❌ 复制失败');
    controls.append(all);
    const nav = document.createElement('nav');
    nav.className = 'stack-reader-navigation';
    const link = (label, href) => { const element = document.createElement('a'); element.textContent = label; element.href = href; return element; };
    nav.append(config.previous ? link('⏮ 上一篇', url('blog/post.html?id=' + config.previous)) : link('🏠 返回博客大厅', url('blog/index.html')));
    const top = link('⬆️ 回到最上', '#content');
    top.addEventListener('click', event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    nav.append(top, config.next ? link('下一篇 ⏭', url('blog/post.html?id=' + config.next)) : link('🏠 返回博客大厅', url('blog/index.html')));
    controls.append(nav);
    content.append(controls);
    content.dataset.readerReady = 'true';
});
