import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = resolve(project, '../..');
const posts = JSON.parse(readFileSync(resolve(repository, 'blog/posts.json'), 'utf8'));
const palette = {
  '技术': ['#dceafa', '#235889'],
  '前端': ['#dceee6', '#216b50'],
  '效率': ['#e9e3f3', '#67508d'],
  '笔记': ['#f6e1e8', '#944461'],
  '日常': ['#f6e9d6', '#90602c']
};

for (const [index, post] of posts.entries()) {
  if (!/^[a-z0-9-]+$/.test(post.id)) throw new Error(`Invalid post id: ${post.id}`);
  const original = readFileSync(resolve(repository, 'blog/posts', `${post.id}.md`), 'utf8');
  const content = original.replace(/^\uFEFF/, '').replace(/^\s*# [^\r\n]+\r?\n(?:\r?\n)?/, '');
  const introduction = content.split(/^\s*(?:#{1,6}\s|```|~~~)/m, 1)[0];
  const paragraph = introduction.split(/\r?\n\s*\r?\n/).find(text => text.trim() && !/^\s*(?:[>|*-]|\d+\.)/.test(text)) || '';
  const description = paragraph.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();
  const metadata = {
    title: post.title,
    slug: post.id,
    date: post.date,
    categories: [post.category],
    sourceMarkdown: `blog/posts/${post.id}.md`,
    originalPrev: posts[index - 1]?.id || '',
    originalNext: posts[index + 1]?.id || '',
    description: [...description].slice(0, 100).join('') + ([...description].length > 100 ? '…' : '')
  };
  const destination = resolve(project, 'generated-content/post', post.id);
  mkdirSync(destination, { recursive: true });
  writeFileSync(resolve(destination, 'index.md'), `${JSON.stringify(metadata, null, 2)}\n\n${content}`, 'utf8');
}

for (const category of new Set(posts.map(post => post.category))) {
  if (!category || /[\\/]/.test(category)) throw new Error(`Invalid category: ${category}`);
  const [background, color] = palette[category] || ['#e0e8f0', '#34516f'];
  const destination = resolve(project, 'generated-content/categories', category);
  mkdirSync(destination, { recursive: true });
  writeFileSync(resolve(destination, '_index.md'), JSON.stringify({ title: category, style: { background, color } }, null, 2) + '\n', 'utf8');
}

console.log(`Imported ${posts.length} original blog posts into the Stack draft.`);
