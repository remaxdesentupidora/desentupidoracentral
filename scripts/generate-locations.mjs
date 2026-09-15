/**
 * Gera arquivos Markdown da collection `locations` a partir das listas
 * de cidades da RMC e bairros de Curitiba embutidas abaixo.
 *
 * Uso:
 *   node scripts/generate-locations.mjs          # dry-run: só lista o que seria criado
 *   node scripts/generate-locations.mjs --apply  # grava de fato em src/content/locations/
 *
 * Não sobrescreve arquivos que já existem (incluindo curitiba.md e bairro-alto.md).
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOCATIONS_DIR = path.join(ROOT, 'src', 'content', 'locations');
const APPLY = process.argv.includes('--apply');

const RELATED_SERVICE_SLUGS = [
  'desentupimento-de-ralo',
  'desentupimento-de-esgoto',
  'desentupimento-de-vaso-sanitario',
];

const FEMININE_BAIRROS = new Set([
  'Água Verde',
  'Augusta',
  'Barreirinha',
  'Boa Vista',
  'Cachoeira',
  'Campina do Siqueira',
  'Cascatinha',
  'Caximba',
  'Cidade Industrial',
  'Fazendinha',
  'Lamenha Pequena',
  'Riviera',
  'Santa Cândida',
  'Santa Felicidade',
  'Santa Quitéria',
  'Vila Izabel',
  'Vista Alegre',
]);

export const cidades = [
  { nome: 'Almirante Tamandaré', slug: 'almirante-tamandare' },
  { nome: 'Araucária', slug: 'araucaria' },
  { nome: 'Campina Grande do Sul', slug: 'campina-grande-do-sul' },
  { nome: 'Campo Largo', slug: 'campo-largo' },
  { nome: 'Colombo', slug: 'colombo' },
  { nome: 'Contenda', slug: 'contenda' },
  { nome: 'Fazenda Rio Grande', slug: 'fazenda-rio-grande' },
  { nome: 'Itaperuçu', slug: 'itaperucu' },
  { nome: 'Mandirituba', slug: 'mandirituba' },
  { nome: 'Pinhais', slug: 'pinhais' },
  { nome: 'Piraquara', slug: 'piraquara' },
  { nome: 'Quatro Barras', slug: 'quatro-barras' },
  { nome: 'Quitandinha', slug: 'quitandinha' },
  { nome: 'São José dos Pinhais', slug: 'sao-jose-dos-pinhais' },
  { nome: 'Tijucas do Sul', slug: 'tijucas-do-sul' },
];

export const bairros = [
  'Abranches',
  'Água Verde',
  'Ahú',
  'Alto Boqueirão',
  'Alto da Glória',
  'Alto da XV',
  'Atuba',
  'Augusta',
  'Bacacheri',
  'Barreirinha',
  'Batel',
  'Bigorrilho',
  'Boa Vista',
  'Bom Retiro',
  'Boqueirão',
  'Butiatuvinha',
  'Cabral',
  'Cachoeira',
  'Cajuru',
  'Campina do Siqueira',
  'Campo Comprido',
  'Campo de Santana',
  'Capão da Imbuia',
  'Capão Raso',
  'Cascatinha',
  'Caximba',
  'Centro',
  'Centro Cívico',
  'Centro Histórico',
  'Cidade Industrial',
  'Cristo Rei',
  'Fanny',
  'Fazendinha',
  'Ganchinho',
  'Guabirotuba',
  'Guaíra',
  'Hauer',
  'Hugo Lange',
  'Jardim Botânico',
  'Jardim das Américas',
  'Jardim Social',
  'Juvevê',
  'Lamenha Pequena',
  'Lindóia',
  'Mercês',
  'Mossunguê (Ecoville)',
  'Novo Mundo',
  'Orleans',
  'Parolin',
  'Pilarzinho',
  'Pinheirinho',
  'Portão',
  'Prado Velho',
  'Rebouças',
  'Riviera',
  'Santa Cândida',
  'Santa Felicidade',
  'Santa Quitéria',
  'Santo Inácio',
  'São Braz',
  'São Francisco',
  'São João',
  'São Lourenço',
  'São Miguel',
  'Seminário',
  'Sítio Cercado',
  'Taboão',
  'Tarumã',
  'Tatuquara',
  'Tingui',
  'Uberaba',
  'Umbará',
  'Vila Izabel',
  'Vista Alegre',
  'Xaxim',
];

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function clipMeta(text) {
  return text.length <= 160 ? text : text.slice(0, 160);
}

function neighborhoodPrep(nome) {
  return FEMININE_BAIRROS.has(nome) ? 'na' : 'no';
}

function yamlList(items, indent = 2) {
  const pad = ' '.repeat(indent);
  return items.map((item) => `${pad}- ${item}`).join('\n');
}

function indentBlock(text, spaces) {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => `${pad}${line}`)
    .join('\n');
}

function renderLocationMarkdown({
  title,
  slug,
  seoTitle,
  metaDescription,
  locationType,
  parentLocationSlug,
  publishedDate,
  heroHeading,
  heroSubheading,
  textHeading,
  textBody,
}) {
  const parentLine = parentLocationSlug ? `parentLocationSlug: ${parentLocationSlug}\n` : '';

  return `---
title: ${title}
slug: ${slug}
seoTitle: ${seoTitle}
metaDescription: ${metaDescription}
locationType: ${locationType}
${parentLine}relatedServiceSlugs:
${yamlList(RELATED_SERVICE_SLUGS)}
publishedDate: ${publishedDate}
blocks:
  - type: hero
    heading: ${heroHeading}
    subheading: ${heroSubheading}
    cta:
      label: Solicitar orçamento
      href: /whatsapp
  - type: text
    heading: ${textHeading}
    body: |
${indentBlock(textBody, 6)}
---
`;
}

function buildCidade(cidade, publishedDate) {
  const { nome, slug } = cidade;

  return {
    slug,
    kind: 'cidade',
    markdown: renderLocationMarkdown({
      title: `Desentupidora em ${nome}`,
      slug,
      seoTitle: `Desentupidora em ${nome} 24h | Desentupidora Central`,
      metaDescription: clipMeta(
        `Desentupidora em ${nome} e região. Ralo, pia, esgoto, vaso sanitário e fossa. Atendimento 24h.`,
      ),
      locationType: 'cidade',
      publishedDate,
      heroHeading: `Desentupidora em ${nome}`,
      heroSubheading: 'Atendimento 24 horas para ralo, pia, esgoto, fossa e vaso sanitário.',
      textHeading: `Atendimento em ${nome}`,
      textBody: `Atendemos ${nome} e região com desentupimento de ralos, pias, vasos sanitários, esgoto e fossas, com equipe pronta para deslocamento rápido até o local.`,
    }),
  };
}

function buildBairro(nome, publishedDate) {
  const slug = slugify(nome);
  const prep = neighborhoodPrep(nome);

  return {
    slug,
    kind: 'bairro',
    markdown: renderLocationMarkdown({
      title: `Desentupidora ${prep} ${nome} - Curitiba`,
      slug,
      seoTitle: `Desentupidora ${prep} ${nome} Curitiba 24h | Desentupidora Central`,
      metaDescription: clipMeta(
        `Desentupidora ${prep} ${nome}, Curitiba. Ralo, pia, esgoto, vaso sanitário e fossa. Atendimento 24h.`,
      ),
      locationType: 'bairro',
      parentLocationSlug: 'curitiba',
      publishedDate,
      heroHeading: `Desentupidora ${prep} ${nome} - Curitiba`,
      heroSubheading: `Atendimento rápido para desentupimento ${prep} ${nome} e região.`,
      textHeading: `Atendimento ${prep} ${nome}`,
      textBody: `<!-- TODO(senna): confirmar dado demográfico atualizado antes de publicar, se quiser incluí-lo -->
Atendemos ${nome} e arredores com desentupimento de ralos, pias, vasos sanitários e sistemas de esgoto, com equipe pronta para deslocamento rápido até o local. O atendimento é 24 horas, incluindo emergências.`,
    }),
  };
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const publishedDate = todayIsoDate();
  const planned = [
    ...cidades.map((cidade) => buildCidade(cidade, publishedDate)),
    ...bairros.map((nome) => buildBairro(nome, publishedDate)),
  ];

  const toCreate = [];
  const skipped = [];

  for (const item of planned) {
    const relativePath = path.posix.join('src/content/locations', `${item.slug}.md`);
    const absolutePath = path.join(LOCATIONS_DIR, `${item.slug}.md`);
    const exists = await fileExists(absolutePath);
    const record = { ...item, relativePath, absolutePath };

    if (exists) {
      skipped.push(record);
    } else {
      toCreate.push(record);
    }
  }

  console.log(APPLY ? 'Modo --apply (grava em disco)\n' : 'Modo dry-run (nenhum arquivo será gravado)\n');

  console.log('Seriam criados:');
  for (const item of toCreate) {
    console.log(`  + ${item.relativePath} (${item.kind})`);
  }

  if (skipped.length > 0) {
    console.log('\nIgnorados (já existem, não sobrescreve):');
    for (const item of skipped) {
      console.log(`  - ${item.relativePath} (${item.kind})`);
    }
  }

  console.log('\nResumo');
  console.log(`  Cidades na lista: ${cidades.length}`);
  console.log(`  Bairros na lista: ${bairros.length}`);
  console.log(`  Arquivos a criar: ${toCreate.length}`);
  console.log(`  Arquivos ignorados: ${skipped.length}`);

  if (!APPLY) {
    return;
  }

  await mkdir(LOCATIONS_DIR, { recursive: true });

  for (const item of toCreate) {
    await writeFile(item.absolutePath, item.markdown, 'utf8');
    console.log(`Gravado ${item.relativePath}`);
  }

  console.log(`\nConcluído: ${toCreate.length} arquivo(s) gravado(s).`);
}

const invokedDirectly =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) {
  await main();
}
