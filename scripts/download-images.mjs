/**
 * Baixa as imagens do site atual para src/assets/uploads/servicos/.
 *
 * Uso:
 *   node scripts/download-images.mjs
 *
 * Não interrompe a sequência se um download falhar: os erros são
 * coletados e impressos no resumo final.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST_DIR = path.join(ROOT, 'src', 'assets', 'uploads', 'servicos');

const DOWNLOADS = [
  {
    url: 'https://desentupidoracentral.com.br/wp-content/uploads/desentupidora-em-curitiba.png',
    file: 'logo.png',
  },
  {
    url: 'https://desentupidoracentral.com.br/wp-content/uploads/16-1.png',
    file: 'hero-fundo.png',
  },
  {
    url: 'https://desentupidoracentral.com.br/wp-content/uploads/desentupidora-em-curitiba-1.jpg',
    file: 'hero-foto.jpg',
  },
  {
    url: 'https://desentupidoracentral.com.br/wp-content/uploads/desentupimento-de-ralo-curitiba.png',
    file: 'ralo.png',
  },
  {
    url: 'https://desentupidoracentral.com.br/wp-content/uploads/limpeza-de-fossa-em-curitiba.png',
    file: 'fossa.png',
  },
  {
    url: 'https://desentupidoracentral.com.br/wp-content/uploads/desentupimento-de-pia-curitiba.png',
    file: 'pia.png',
  },
  {
    url: 'https://desentupidoracentral.com.br/wp-content/uploads/desentupimento-de-esgoto-curitiba.png',
    file: 'esgoto.png',
  },
  {
    url: 'https://desentupidoracentral.com.br/wp-content/uploads/hidrojateamento-em-curitiba-rapida-desentupidora.png',
    file: 'hidrojateamento.png',
  },
  {
    url: 'https://desentupidoracentral.com.br/wp-content/uploads/desentupimento-de-vaso-sanitario-em-curitiba.png',
    file: 'vaso-sanitario.png',
  },
  {
    url: 'https://desentupidoracentral.com.br/wp-content/uploads/limpeza-de-caixa-de-esgoto-em-curitiba.png',
    file: 'caixa-de-gordura.png',
  },
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'image/png,image/jpeg,image/jpg,*/*;q=0.8',
  Referer: 'https://desentupidoracentral.com.br/',
};

async function downloadOne({ url, file }) {
  const response = await fetch(url, { headers: HEADERS, redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.byteLength === 0) {
    throw new Error('resposta vazia');
  }

  await writeFile(path.join(DEST_DIR, file), buffer);
  return buffer.byteLength;
}

async function main() {
  await mkdir(DEST_DIR, { recursive: true });

  let successCount = 0;
  const errors = [];

  for (const item of DOWNLOADS) {
    try {
      const bytes = await downloadOne(item);
      successCount += 1;
      console.log(`OK  ${item.file} (${bytes} bytes)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ file: item.file, url: item.url, message });
      console.log(`ERRO ${item.file}: ${message}`);
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
