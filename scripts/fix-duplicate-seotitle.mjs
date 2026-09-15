/**
 * Remove o sufixo duplicado de marca em `seoTitle` das collections de conteúdo.
 * Todas usam o campo `seoTitle` (pages, services, locations e articles).
 *
 * Uso:
 *   node scripts/fix-duplicate-seotitle.mjs          # dry-run
 *   node scripts/fix-duplicate-seotitle.mjs --apply  # grava de fato
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { load } from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const CONTENT_DIRS = [
  path.join(ROOT, 'src', 'content', 'pages'),
  path.join(ROOT, 'src', 'content', 'services'),
  path.join(ROOT, 'src', 'content', 'locations'),
  path.join(ROOT, 'src', 'content', 'articles'),
];

const SUFFIX_RE = /\s*(?:\||-)\s*Desentupidora Central\s*$/i;

function stripDuplicateBrand(value) {
  return value.replace(SUFFIX_RE, '').trimEnd();
}

function splitFrontmatter(raw) {
  const newline = raw.includes('\r\n') ? '\r\n' : '\n';
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

  if (!text.startsWith('---\n')) {
    throw new Error('arquivo sem frontmatter YAML');
  }

  const closer = text.indexOf('\n---', 3);

  if (closer === -1) {
    throw new Error('frontmatter YAML sem fechamento');
  }

  return {
    yamlBlock: text.slice(4, closer),
    suffix: text.slice(closer),
    newline,
  };
}

function formatSeoTitleLine(originalLine, nextValue) {
  const usedDouble = /^\s*seoTitle:\s*"/.test(originalLine);
  const usedSingle = /^\s*seoTitle:\s*'/.test(originalLine);

  let rendered = nextValue;

  if (usedDouble) {
    rendered = JSON.stringify(nextValue);
  } else if (usedSingle) {
    rendered = `'${nextValue.replaceAll("'", "''")}'`;
  } else if (/[:#]|^\s|\s$/.test(nextValue)) {
    rendered = JSON.stringify(nextValue);
  }

  return `seoTitle: ${rendered}`;
}

function replaceSeoTitle(yamlBlock, nextValue) {
  const match = yamlBlock.match(/^seoTitle:\s*.*$/m);

  if (!match) {
    throw new Error('campo seoTitle não encontrado no frontmatter');
  }

  return yamlBlock.replace(match[0], formatSeoTitleLine(match[0], nextValue));
}

async function listMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

async function main() {
  const updates = [];
  const skipped = [];

  for (const dir of CONTENT_DIRS) {
    const files = await listMarkdownFiles(dir);

    for (const absolutePath of files) {
      const raw = await readFile(absolutePath, 'utf8');
      const { yamlBlock, suffix, newline } = splitFrontmatter(raw);
      const data = load(yamlBlock);

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error(`${absolutePath}: frontmatter inválido`);
      }

      if (typeof data.seoTitle !== 'string') {
        skipped.push({
          relativePath: path.posix.join(path.relative(ROOT, absolutePath).replaceAll('\\', '/')),
          reason: 'seoTitle ausente ou não é string',
        });
        continue;
      }

      const nextTitle = stripDuplicateBrand(data.seoTitle);

      if (nextTitle === data.seoTitle) {
        continue;
      }

      if (!nextTitle) {
        throw new Error(`${absolutePath}: seoTitle ficaria vazio após remover o sufixo`);
      }

      const nextYaml = replaceSeoTitle(yamlBlock, nextTitle);
      const nextRaw = `---\n${nextYaml}${suffix}`.replace(/\n/g, newline);
      const relativePath = path.posix.join(path.relative(ROOT, absolutePath).replaceAll('\\', '/'));

      updates.push({
        relativePath,
        before: data.seoTitle,
        after: nextTitle,
        absolutePath,
        nextRaw,
      });
    }
  }

  console.log(APPLY ? 'Modo --apply (grava em disco)\n' : 'Modo dry-run (nenhum arquivo será gravado)\n');
  console.log(`Arquivos a alterar: ${updates.length}`);

  const examples = updates.slice(0, 5);
  if (examples.length > 0) {
    console.log('\nExemplos (antes → depois):');
    for (const item of examples) {
      console.log(`  ${item.relativePath}`);
      console.log(`    - ${item.before}`);
      console.log(`    + ${item.after}`);
    }
  }

  if (skipped.length > 0) {
    console.log('\nIgnorados:');
    for (const item of skipped) {
      console.log(`  - ${item.relativePath} (${item.reason})`);
    }
  }

  if (!APPLY) {
    return;
  }

  for (const item of updates) {
    await writeFile(item.absolutePath, item.nextRaw, 'utf8');
    console.log(`Gravado ${item.relativePath}`);
  }

  console.log(`\nConcluído: ${updates.length} arquivo(s) gravado(s).`);
}

const invokedDirectly =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) {
  await main();
}
