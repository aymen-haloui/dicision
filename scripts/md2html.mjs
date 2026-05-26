import fs from 'fs'
import path from 'path'

const mdPath = path.resolve('docs', 'CDSS-Architecture.md')
const outPath = path.resolve('docs', 'CDSS-Architecture.html')
if (!fs.existsSync(mdPath)) {
  console.error('Markdown source not found:', mdPath)
  process.exit(1)
}
let md = fs.readFileSync(mdPath, 'utf8')

// Very small markdown -> HTML converter for printing purposes
// Handles headings, bold, italics, codeblocks, lists, paragraphs, preformatted

// Escape HTML
md = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Code fences
md = md.replace(/(^|\n)```([\s\S]*?)```/g, (m, p1, code) => `\n<pre><code>${code.replace(/^\n/, '').replace(/\n$/, '')}</code></pre>\n`)

// Headings
md = md.replace(/^###### (.*$)/gim, '<h6>$1</h6>')
md = md.replace(/^##### (.*$)/gim, '<h5>$1</h5>')
md = md.replace(/^#### (.*$)/gim, '<h4>$1</h4>')
md = md.replace(/^### (.*$)/gim, '<h3>$1</h3>')
md = md.replace(/^## (.*$)/gim, '<h2>$1</h2>')
md = md.replace(/^# (.*$)/gim, '<h1>$1</h1>')

// Bold and italics
md = md.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
md = md.replace(/\*(.*?)\*/g, '<em>$1</em>')

// Unordered lists
md = md.replace(/(^|\n)(?:\s*)[-\*] (.+)(?:\n|$)/g, (m, p1, item) => `${p1}<ul>\n<li>${item}</li>\n`)
// close consecutive ULs
md = md.replace(/<ul>\n<li>([\s\S]*?)<\/li>\n/g, (m, items) => {
  // collapse multiple <ul><li> into single ul with multiple li
  const lis = md.match(/<ul>\n<li>([\s\S]*?)<\/li>\n/g)
  return m
})

// Numbered lists (simple)
md = md.replace(/(^|\n)\d+\. (.+)(?:\n|$)/g, (m, p1, item) => `${p1}<ol>\n<li>${item}</li>\n`)

// Paragraphs
md = md.replace(/\n{2,}/g, '\n\n')
const lines = md.split('\n')
let html = ''
let inUl = false
let inOl = false
for (let line of lines) {
  if (line.startsWith('<h') || line.startsWith('<pre') || line.startsWith('<ul') || line.startsWith('<ol') || line.startsWith('<li') || line.startsWith('</')) {
    html += line + '\n'
    continue
  }
  if (/^\s*[-\*] /.test(line)) {
    if (!inUl) { html += '<ul>\n'; inUl = true }
    html += '<li>' + line.replace(/^\s*[-\*] /, '') + '</li>\n'
    continue
  } else {
    if (inUl) { html += '</ul>\n'; inUl = false }
  }
  if (/^\s*\d+\. /.test(line)) {
    if (!inOl) { html += '<ol>\n'; inOl = true }
    html += '<li>' + line.replace(/^\s*\d+\. /, '') + '</li>\n'
    continue
  } else {
    if (inOl) { html += '</ol>\n'; inOl = false }
  }
  if (line.trim() === '') { html += '\n' } else {
    html += '<p>' + line + '</p>\n'
  }
}
if (inUl) html += '</ul>\n'
if (inOl) html += '</ol>\n'

const style = `
body{font-family: Inter, Arial, Helvetica, sans-serif; margin:40px; color:#111}
h1{font-size:28px}
h2{font-size:22px}
h3{font-size:18px}
pre{background:#f6f8fa;padding:12px;border-radius:6px;overflow:auto}
code{background:#f6f8fa;padding:2px 4px;border-radius:4px}
@media print{body{margin:20mm}}`;

const final = `<!doctype html><html><head><meta charset="utf-8"><title>CDSS Architecture</title><style>${style}</style></head><body>${html}</body></html>`
fs.writeFileSync(outPath, final, 'utf8')
console.log('Wrote', outPath)
