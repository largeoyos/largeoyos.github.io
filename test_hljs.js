const { marked } = require('marked');
const hljs = require('highlight.js');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const md = [
  '# Test',
  '```html',
  '<h1>Welcome to freeCodeCamp</h1>',
  '```'
].join('\n');

const html = marked.parse(md);
const dom = new JSDOM(html);
dom.window.document.querySelectorAll('pre code').forEach((el) => {
  hljs.highlightElement(el);
});

console.log(dom.window.document.body.innerHTML);
