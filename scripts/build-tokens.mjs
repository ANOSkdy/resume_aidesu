import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const tokensPath = resolve(root, 'tokens/design-tokens.json');
const cssPath = resolve(root, 'styles/tokens.css');
const designPath = resolve(root, 'docs/DESIGN.md');

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

function flatten(prefix, value, out = {}) {
  for (const [key, nested] of Object.entries(value)) {
    const next = prefix ? `${prefix}-${key}` : key;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      flatten(next, nested, out);
    } else {
      out[next] = String(nested);
    }
  }
  return out;
}

const cssVars = flatten('wa', {
  colors: tokens.colors,
  spacing: tokens.spacing,
  radii: tokens.radii,
  typography: tokens.typography,
  elevation: tokens.elevation,
  motion: tokens.motion,
});

const css = `:root {\n${Object.entries(cssVars)
  .map(([name, val]) => `  --${name}: ${val};`)
  .join('\n')}\n}\n`;

writeFileSync(cssPath, css);

const design = readFileSync(designPath, 'utf8');
const tokenRows = Object.entries(tokens)
  .filter(([k]) => !['meta'].includes(k))
  .map(([group, values]) => {
    const keys = Object.keys(values).map((k) => `\`${k}\``).join(', ');
    return `- **${group}**: ${keys}`;
  })
  .join('\n');

const cssRef = [
  '```css',
  ':root {',
  ...Object.keys(cssVars).map((k) => `  --${k}: ...;`),
  '}',
  '```',
].join('\n');

function replaceSection(content, start, end, body) {
  const s = content.indexOf(start);
  const e = content.indexOf(end);
  if (s === -1 || e === -1 || e < s) return content;
  return `${content.slice(0, s + start.length)}\n${body}\n${content.slice(e)}`;
}

let next = replaceSection(design, '<!-- TOKENS:START -->', '<!-- TOKENS:END -->', tokenRows);
next = replaceSection(next, '<!-- CSS_REF:START -->', '<!-- CSS_REF:END -->', cssRef);
writeFileSync(designPath, next);

console.log('Generated styles/tokens.css and refreshed docs/DESIGN.md sections.');
