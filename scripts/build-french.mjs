#!/usr/bin/env node
/**
 * Generate the complete static French page from the approved English layout.
 * Run `node scripts/build-french.mjs` after editing index.html or locales/fr.json.
 * `--check` verifies that the checked-in French page is current without writing it.
 * No runtime localization framework or build step is needed to serve either page.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(root, 'index.html');
const outputPath = resolve(root, 'fr/index.html');
const source = await readFile(sourcePath, 'utf8');
const locale = JSON.parse(await readFile(resolve(root, 'locales/fr.json'), 'utf8'));
const invariantText = new Set(locale.invariantText);
const invariantAttributes = new Set(locale.invariantAttributes);
const missing = new Set();
const usedText = new Set();
const usedAttributes = new Set();

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
const decode = (value) => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity) => {
  if (entity[0] === '#') {
    const hexadecimal = entity[1].toLowerCase() === 'x';
    const point = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return point <= 0x10ffff ? String.fromCodePoint(point) : '\ufffd';
  }
  return entities[entity.toLowerCase()];
});
const escapeText = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const escapeAttribute = (value, quote) => escapeText(value).replaceAll(quote, quote === '"' ? '&quot;' : '&#39;');

function translateText(raw) {
  const [, before, middle, after] = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!middle) return raw;
  const text = decode(middle);
  if (Object.hasOwn(locale.text, text)) {
    usedText.add(text);
    return `${before}${escapeText(locale.text[text])}${after}`;
  }
  if (invariantText.has(text) || /^\d+$/.test(text)) return raw;
  missing.add(`Text: ${text}`);
  return raw;
}

function translateTag(raw) {
  if (/^<!/.test(raw) || /^<\//.test(raw)) return raw;
  const description = /^<meta\b/i.test(raw) && /\bname\s*=\s*["']description["']/i.test(raw);
  const html = /^<html\b/i.test(raw);
  const languageLink = /^<a\b/i.test(raw) && /\bdata-language-link(?:\s|=|>)/i.test(raw);
  const frenchLink = languageLink && /\bhref\s*=\s*["']\/fr\/["']/i.test(raw);
  let translated = raw.replace(/(\s)([\w:-]+)(\s*=\s*)(["'])([\s\S]*?)\4/g,
    (attribute, space, rawName, equals, quote, rawValue) => {
      const name = rawName.toLowerCase();
      const value = decode(rawValue);
      let replacement;
      if (html && name === 'lang') replacement = locale.language;
      else if (description && name === 'content') replacement = locale.description;
      else if (['aria-label', 'placeholder', 'alt', 'title'].includes(name)) {
        if (Object.hasOwn(locale.attributes, value)) {
          usedAttributes.add(value);
          replacement = locale.attributes[value];
        } else if (!invariantAttributes.has(value) && value) {
          missing.add(`Attribute ${rawName}: ${value}`);
        }
      } else if (['href', 'src', 'action'].includes(name)
        && value && !value.startsWith('/') && !value.startsWith('#')
        && !/^[a-z][a-z\d+.-]*:/i.test(value)) {
        replacement = `/${value}`;
      }
      if (replacement === undefined) return attribute;
      return `${space}${rawName}${equals}${quote}${escapeAttribute(replacement, quote)}${quote}`;
    });
  if (languageLink) {
    translated = translated.replace(/\s+aria-current\s*=\s*(["'])[^"']*\1/gi, '');
    if (frenchLink) translated = translated.replace(/>$/, ' aria-current="page">');
  }
  return translated;
}

// Translate only the marked current-language code; option names stay intact.
function localizeLanguageDisplay(html) {
  return html.replace(/(<span\b(?=[^>]*\bdata-current-language(?:\s|=|>))[^>]*>)[\s\S]*?(<\/span>)/g, '$1FR$2');
}

// The French service selector intentionally contains the three supplied options.
// Keep field names and values, and leave the independent update-type selector intact.
const template = localizeLanguageDisplay(source).replace(/<select\b(?=[^>]*\bid=["']website-type["'])[^>]*>[\s\S]*?<\/select>/i,
  (select) => select.replace(/<option\b[^>]*\bvalue=["'](?:management|guidance)["'][^>]*>[\s\S]*?<\/option>/gi, ''));
// Quote-aware HTML tokens preserve all tags, attributes, whitespace and layout hooks.
const tokens = template.match(/<(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+/g) || [];
if (tokens.join('') !== template) throw new Error('Could not tokenize the complete English source.');
const output = tokens.map((token) => token.startsWith('<') ? translateTag(token) : translateText(token)).join('');
if (missing.size) throw new Error(`French copy is missing for:\n${[...missing].join('\n')}`);
if (!/<html\s+lang="fr"/.test(output)) throw new Error('French language metadata was not generated.');
if (!output.includes('/api/update-request.php')) throw new Error('Shared update endpoint was not retained.');

if (process.argv.includes('--check')) {
  if (await readFile(outputPath, 'utf8') !== output) throw new Error('fr/index.html is stale. Run node scripts/build-french.mjs.');
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);
}
console.log(JSON.stringify({ output: 'fr/index.html', language: locale.language,
  textEntriesUsed: usedText.size, attributeEntriesUsed: usedAttributes.size,
  missingTranslations: 0, mode: process.argv.includes('--check') ? 'check' : 'write' }));
