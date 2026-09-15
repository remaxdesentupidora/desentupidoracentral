/**
 * Baixa capas do Pexels para src/assets/uploads/blog/{slug}.jpg.
 *
 * Uso:
 *   node scripts/download-pexels-covers.mjs
 *
 * Não interrompe a sequência se um download falhar: os erros são
 * coletados e impressos no resumo final.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST_DIR = path.join(ROOT, 'src', 'assets', 'uploads', 'blog');

const DOWNLOADS = [
  {
    slug: 'ralo-entope-sempre-no-mesmo-lugar',
    url: 'https://images.pexels.com/photos/220612/pexels-photo-220612.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    slug: 'produto-quimico-pia-entupida',
    url: 'https://images.pexels.com/photos/9551374/pexels-photo-9551374.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    slug: 'sinais-problema-rede-esgoto',
    url: 'https://images.pexels.com/photos/37627673/pexels-photo-37627673.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    slug: 'fossa-propria-intervalo-limpeza',
    url: 'https://images.pexels.com/photos/7163649/pexels-photo-7163649.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    slug: 'o-que-nunca-jogar-no-vaso-sanitario',
    url: 'https://images.pexels.com/photos/6899357/pexels-photo-6899357.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    slug: 'hidrojateamento-raiz-arvore-tubulacao',
    url: 'https://images.pexels.com/photos/12763908/pexels-photo-12763908.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    slug: 'caixa-de-gordura-apartamento-obrigatoria',
    url: 'https://images.pexels.com/photos/7195739/pexels-photo-7195739.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    slug: 'manutencao-preventiva-esgoto',
    url: 'https://images.pexels.com/photos/18110389/pexels-photo-18110389.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    slug: 'como-identificar-vazamento-oculto',
    url: 'https://images.pexels.com/photos/4819796/pexels-photo-4819796.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'image/jpeg,image/jpg,image/png,*/*;q=0.8',
  Referer: 'https://www.pexels.com/',
};

async function downloadOne({ slug, url }) {
  const file = `${slug}.jpg`;
  const response = await fetch(url, { headers: HEADERS, redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.byteLength === 0) {
    throw new Error('resposta vazia');
  }

  await writeFile(path.join(DEST_DIR, file), buffer);
  return { file, bytes: buffer.byteLength };
}

async function main() {
  await mkdir(DEST_DIR, { recursive: true });

  let successCount = 0;
  const errors = [];

  for (const item of DOWNLOADS) {
    const file = `${item.slug}.jpg`;
    try {
      const result = await downloadOne(item);
      successCount += 1;
      console.log(`OK  ${result.file} (${result.bytes} bytes)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ file, url: item.url, message });
      console.log(`ERRO ${file}: ${message}`);
    }
  }

  console.log('\nResumo');
  console.log(`  Sucesso: ${successCount}/${DOWNLOADS.length}`);
  console.log(`  Falhas:  ${errors.length}/${DOWNLOADS.length}`);

  if (errors.length > 0) {
    console.log('\nFalhas:');
    for (const error of errors) {
      console.log(`  - ${error.file}: ${error.message}`);
      console.log(`    ${error.url}`);
    }
  }
}

await main();
