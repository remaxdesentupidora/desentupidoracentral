/**
 * Gera redirects 301 (consolidação) e redirects 410 (cidades fora da área)
 * para o vercel.json.
 *
 * Uso:
 *   node scripts/generate-redirects.mjs          # dry-run: só lista a contagem
 *   node scripts/generate-redirects.mjs --apply  # mescla e grava vercel.json
 *
 * Reaproveita `cidades`, `bairros` e `slugify` de generate-locations.mjs.
 * Não apaga chaves existentes do vercel.json nem redirects com `source`
 * que este script não gerencia.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bairros, cidades, slugify } from './generate-locations.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERCEL_JSON = path.join(ROOT, 'vercel.json');
const APPLY = process.argv.includes('--apply');

/** @typedef {{ source: string, destination: string, permanent?: boolean, statusCode?: number }} Redirect */
/** @typedef {{ source: string, destination: string }} Rewrite */

function withSlash(pathname) {
  const withLead = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withLead.endsWith('/') ? withLead : `${withLead}/`;
}

function redirect(source, destination) {
  return {
    source: withSlash(source),
    destination: withSlash(destination),
    permanent: true,
  };
}

function goneRedirect(source) {
  return {
    source: withSlash(source),
    destination: withSlash('/removido/'),
    statusCode: 410,
  };
}

function expand(destination, sources) {
  return sources.map((source) => redirect(source, destination));
}

const SERVICE_CONSOLIDATIONS = [
  [
    '/servicos/desentupimento-de-vaso-sanitario/',
    [
      '/desentupidora-de-vaso-curitiba/',
      '/desentupidora-de-vaso-em-curitiba/',
      '/desentupidora-vaso-curitiba/',
      '/desentupidora-de-vaso-sanitario-curitiba/',
      '/desentupidora-de-vaso-sanitario-em-ponta/',
      '/desentupidores-de-vaso-curitiba/',
      '/desentupir-vaso-sanitario-curitiba/',
      '/desentupir-vaso-curitiba/',
      '/vaso-entupido-curitiba/',
      '/vaso-sanitario-entupido-curitiba/',
      '/desentupir-privada-curitiba/',
    ],
  ],
  [
    '/servicos/desentupimento-de-pia/',
    [
      '/desentupidora-de-pia-em-curitiba/',
      '/desentupidora-de-pia-curitiba/',
      '/desentupidora-pia-curitiba/',
      '/desentupir-pia-da-cozinha-curitiba/',
      '/desentupir-pia-de-cozinha-curitiba/',
      '/desentupir-pia-do-banheiro-curitiba/',
      '/desentupir-cano-da-pia-curitiba/',
      '/desentupir-cano-de-pia-curitiba/',
      '/desentupir-canos-cozinha-curitiba/',
      '/desentupir-cano-cozinha-curitiba/',
      '/desentupindo-pia-curitiba/',
      '/pia-entupida-curitiba/',
    ],
  ],
  [
    '/servicos/desentupimento-de-esgoto/',
    [
      '/desentupidora-de-esgoto-em-curitiba/',
      '/desentupidora-de-esgoto-residencial-curitiba/',
      '/desentupidora-de-esgoto-preco-curitiba/',
      '/telefone-desentupidora-de-esgoto-curitiba/',
      '/empresa-desentupir-esgoto-curitiba/',
      '/empresa-de-desentupir-esgoto-curitiba/',
      '/empresa-de-desentupimento-de-esgoto-curitiba/',
      '/desentupidora-de-esgoto-zona-leste-curitiba/',
      '/desentupidora-de-esgoto-zona-norte-curitiba/',
      '/desentupidora-de-esgoto-zona-oeste-curitiba/',
      '/desentupidora-de-esgoto-zona-sul-curitiba/',
      '/desentupimentos-de-esgotos-curitiba/',
      '/desentupimento-de-esgoto-em-curitiba/',
    ],
  ],
  [
    '/servicos/desentupimento-de-ralo/',
    [
      '/desentupidora-de-ralo-curitiba/',
      '/desentupir-ralo-curitiba/',
      '/desentupir-ralo-de-pia-curitiba/',
      '/desentupir-ralo-do-banheiro-curitiba/',
      '/desentupir-ralo-do-chuveiro-curitiba/',
      '/ralo-entupido-curitiba/',
      '/ralo-do-banheiro-entupido-curitiba/',
      '/desentupir-ralo-da-pia-curitiba/',
      '/desentupidora-de-encanamento-curitiba/',
      '/desentupidora-de-cano-em-curitiba/',
      '/desentupidora-de-cano-curitiba/',
      '/desentupidora-cano-curitiba/',
      '/desentupidora-de-cano-de-esgoto-curitiba/',
      '/desentupir-encanamento-curitiba/',
      '/desentupir-cano-de-esgoto-curitiba/',
      '/empresa-desentupir-canos-curitiba/',
      '/empresa-de-desentupir-canos-curitiba/',
      '/empresas-de-desentupimentos-curitiba/',
      '/empresa-de-desentupimentos-curitiba/',
      '/empresa-de-desentupimento-curitiba/',
      '/empresa-de-desentupir-em-curitiba/',
      '/desentupimentos-de-canos-curitiba/',
      '/desentupimentos-curitiba/',
      '/desentupimento-curitiba/',
      '/desentupimento-de-ralo-industrial/',
    ],
  ],
  [
    '/servicos/limpeza-de-caixa-de-gordura/',
    [
      '/desentupidora-de-caixa-de-gordura-curitiba/',
      '/desentupir-caixa-de-gordura-curitiba/',
      '/caixa-de-gordura-entupida-curitiba/',
    ],
  ],
  [
    '/servicos/limpa-fossa/',
    [
      '/desentupidora-de-fossa-em-curitiba/',
      '/desentupidora-de-fossa-curitiba/',
      '/limpa-fossa-em-curitiba-2/',
      '/limpeza-de-fossa-curitiba/',
      '/limpa-fossa-em-curitiba/',
    ],
  ],
  [
    '/servicos/hidrojateamento/',
    [
      '/hidrojateamento-em-curitiba/',
      '/hidrojateamento-para-desentupimento-de-tubulacoes/',
      '/limpeza-de-caixa-de-inspecao-com-hidrojateamento/',
    ],
  ],
  [
    '/locais/curitiba/',
    [
      '/desentupidora-curitiba/',
      '/desentupidoras-em-curitiba/',
      '/desentupidora-24-horas-curitiba/',
      '/desentupidora-24h-curitiba/',
      '/desentupidora-curitiba-24-horas/',
      '/desentupidora-rapida-em-curitiba/',
      '/rapida-desentupidora-em-curitiba/',
      '/desentupidora-perto-de-mim-em-curitiba/',
      '/desentupidora-perto-de-mim-curitiba/',
      '/desentupidora-preco-fixo-curitiba/',
      '/desentupidora-manual-curitiba/',
      '/desentupidora-em-curitiba/',
      '/desentupidora-em-curitiba-24-horas/',
      '/caca-vazamento-curitiba/',
    ],
  ],
  ['/blog/', ['/noticias/']],
  ['/', ['/whatsapp/', '/whatsappeee/', '/mapa-do-site/']],
];

const CITY_SOURCE_TEMPLATES = [
  '/desentupidora-em-{slug}/',
  '/hidrojateamento-em-{slug}/',
  '/limpa-fossa-em-{slug}/',
  '/limpeza-de-caixa-de-gordura-em-{slug}/',
  '/desentupimento-de-esgoto-em-{slug}/',
  '/desentupidoras-em-{slug}/',
];

const IRREGULAR_BAIRRO_REDIRECTS = [
  [
    '/locais/santa-felicidade/',
    ['/desentupidora-santa-felicidade-curitiba/', '/desentupidora-na-santa-felicidade/'],
  ],
  ['/locais/sao-braz/', ['/desentupidora-sao-braz/']],
  ['/locais/fazendinha/', ['/desentupidora-fazendinha-curitiba/']],
  ['/locais/xaxim/', ['/desentupidora-xaxim-curitiba/']],
  ['/locais/sitio-cercado/', ['/desentupidora-sitio-cercado-curitiba/']],
  ['/locais/bairro-alto/', ['/desentupidora-bairro-alto-curitiba/']],
  ['/locais/boqueirao/', ['/desentupidora-boqueirao-curitiba/']],
];

const MANUAL_EXTRA_REDIRECTS = [
  ['/locais/campo-largo/', ['/desentupidora-campo-largo/']],
  ['/locais/pinheirinho/', ['/desentupidora-no-pinheirinho/']],
  ['/locais/fazenda-rio-grande/', ['/desentupidora-fazenda-rio-grande/']],
  ['/', ['/87541-2/']],
];

const GONE_PATHS = [
  '/desentupidora-central-em-paranagua-24h/',
  '/melhor-desentupidora-emergencial-em-registro-sp-24h/',
  '/desentupidora-em-rio-negro-pr-24-horas/',
  '/desentupidora-itarare-sp-24-horas-atendimento-rapido-e-profissional/',
  '/desentupimento-de-esgoto-em-ponta-grossa-24-horas/',
  '/desentupidora-em-paranagua-24-horas/',
  '/desentupidora-urgente-em-registro/',
  '/desentupidora-paranagua/',
  '/desentupidora-lapa-parana/',
  '/desentupidora-ponta-grossa/',
  '/desentupidora-24-horas-em-sp/',
  '/desentupidora-registro-sp-2/',
  '/desentupidora-registro-sp/',
  '/desentupidora-em-registro-sp/',
  '/desentupidora-de-campinas/',
  '/desentupidora-de-vaso-campinas/',
];

function buildRedirects() {
  /** @type {Redirect[]} */
  const redirects = [];

  for (const [destination, sources] of SERVICE_CONSOLIDATIONS) {
    redirects.push(...expand(destination, sources));
  }

  for (const cidade of cidades) {
    if (cidade.slug === 'curitiba') {
      continue;
    }

    const destination = `/locais/${cidade.slug}/`;
    for (const template of CITY_SOURCE_TEMPLATES) {
      redirects.push(redirect(template.replace('{slug}', cidade.slug), destination));
    }
  }

  for (const nome of bairros) {
    const slug = slugify(nome);
    const destination = `/locais/${slug}/`;
    redirects.push(redirect(`/desentupidora-no-${slug}-curitiba/`, destination));
    redirects.push(redirect(`/desentupidora-na-${slug}-curitiba/`, destination));
  }

  for (const [destination, sources] of IRREGULAR_BAIRRO_REDIRECTS) {
    redirects.push(...expand(destination, sources));
  }

  for (const [destination, sources] of MANUAL_EXTRA_REDIRECTS) {
    redirects.push(...expand(destination, sources));
  }

  for (const source of GONE_PATHS) {
    redirects.push(goneRedirect(source));
  }

  const bySource = new Map();
  for (const item of redirects) {
    bySource.set(item.source, item);
  }

  return [...bySource.values()];
}

function mergeBySource(existing = [], generated = []) {
  const bySource = new Map();

  for (const item of existing) {
    if (item && typeof item.source === 'string') {
      bySource.set(item.source, item);
    }
  }

  for (const item of generated) {
    bySource.set(item.source, item);
  }

  return [...bySource.values()];
}

async function readExistingConfig() {
  try {
    const raw = await readFile(VERCEL_JSON, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

async function main() {
  const redirects = buildRedirects();
  const goneSources = new Set(GONE_PATHS.map(withSlash));
  const goneCount = redirects.filter((item) => item.statusCode === 410).length;

  console.log(APPLY ? 'Modo --apply (grava vercel.json)\n' : 'Modo dry-run (nenhum arquivo será gravado)\n');
  console.log(`Redirects gerados: ${redirects.length}`);
  console.log(`  Redirects 410 (cidades descartadas): ${goneCount}`);
  console.log(`  Cidades (exceto Curitiba) × 6 padrões: ${cidades.filter((item) => item.slug !== 'curitiba').length * 6}`);
  console.log(`  Bairros × 2 variantes (no/na): ${bairros.length * 2}`);

  if (!APPLY) {
    return;
  }

  const existing = await readExistingConfig();
  const nextRewrites = (existing.rewrites ?? []).filter(
    (item) => item && typeof item.source === 'string' && !goneSources.has(withSlash(item.source)),
  );

  const next = {
    ...existing,
    redirects: mergeBySource(existing.redirects, redirects),
  };

  if (nextRewrites.length > 0) {
    next.rewrites = nextRewrites;
  } else {
    delete next.rewrites;
  }

  await writeFile(VERCEL_JSON, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`\nGravado ${path.relative(ROOT, VERCEL_JSON)}`);
  console.log(`  redirects no arquivo: ${next.redirects.length}`);
  console.log(`  rewrites no arquivo: ${next.rewrites?.length ?? 0}`);
}

await main();
