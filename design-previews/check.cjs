const { JSDOM } = require('jsdom');
const fs = require('fs');
const script = fs.readFileSync('design-previews/preview.js', 'utf8');
for (const design of ['a', 'b', 'c']) {
  for (const page of ['workspace', 'personal']) {
    const dom = new JSDOM('<body></body>', { runScripts: 'outside-only' });
    dom.window.document.body.dataset.design = design;
    dom.window.document.body.dataset.page = page;
    dom.window.eval(script);
    const doc = dom.window.document;
    if (!doc.querySelector('h1') || !doc.querySelector('main')) throw Error(`${design}/${page}: missing content`);
    if (page === 'workspace' && doc.querySelectorAll('.space').length !== 8) throw Error(`${design}: missing spaces`);
    if (page === 'personal' && [...doc.querySelectorAll('a')].some(a => a.getAttribute('href').startsWith('../'))) throw Error(`${design}: personal page links to main site`);
    console.log(`${design}/${page}: OK`);
  }
}
