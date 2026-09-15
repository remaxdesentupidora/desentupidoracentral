/**
 * Segunda busca de capas no Pexels — só os 3 artigos com foto inadequada.
 *
 * Uso:
 *   node scripts/search-pexels-covers-retry.mjs
 *
 * Requer PEXELS_API_KEY no .env. Não baixa arquivos — só imprime opções.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  process.loadEnvFile(path.join(ROOT, '.env'));
} catch {
  // Sem .env: segue só com variáveis já presentes no ambiente.
}

const apiKey = process.env.PEXELS_API_KEY?.trim();
if (!apiKey) {
  console.error('PEXELS_API_KEY ausente. Cole a chave no .env local e rode de novo.');
  process.exit(1);
}

const queries = [
  { slug: 'sinais-problema-rede-esgoto', query: 'sewage pipe underground' },
  { slug: 'manutencao-preventiva-esgoto', query: 'sewer inspection camera' },
  { slug: 'como-identificar-vazamento-oculto', query: 'water damage wall stain' },
];

async function searchPexels(query) {
  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '5');
  url.searchParams.set('orientation', 'landscape');

  const response = await fetch(url, {
    headers: { Authorization: apiKey },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pexels ${response.status} para "${query}": ${body}`);
  }

  const data = await response.json();
  return Array.isArray(data.photos) ? data.photos : [];
}

for (const item of queries) {
  console.log('');
  console.log('═'.repeat(72));
  console.log(`Artigo: ${item.slug}`);
  console.log(`Query:  ${item.query}`);
  console.log('─'.repeat(72));

  try {
    const photos = await searchPexels(item.query);
    if (photos.length === 0) {
      console.log('Nenhuma foto retornada.');
      continue;
    }

    photos.forEach((photo, index) => {
      console.log(`Opção ${index + 1}`);
      console.log(`  id:          ${photo.id}`);
      console.log(`  fotógrafo:   ${photo.photographer}`);
      console.log(`  página:      ${photo.url}`);
      console.log(`  imagem large:${photo.src?.large ?? '(sem src.large)'}`);
    });
  } catch (error) {
    console.error(`Erro em ${item.slug}: ${error instanceof Error ? error.message : error}`);
  }
}

console.log('');
