/**
 * Atualiza frontmatter da collection `locations` com população IBGE (cidades)
 * e regional oficial (bairros), sem alterar `blocks` nem outros campos.
 *
 * Uso:
 *   node scripts/update-locations-data.mjs          # dry-run: só lista o que mudaria
 *   node scripts/update-locations-data.mjs --apply  # grava de fato
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { load } from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCATIONS_DIR = path.join(ROOT, 'src', 'content', 'locations');
const APPLY = process.argv.includes('--apply');
const POPULATION_SOURCE = 'IBGE, estimativa populacional 2024';

const CITY_POPULATION = {
  curitiba: 1829225,
  'sao-jose-dos-pinhais': 345644,
  colombo: 240720,
  'fazenda-rio-grande': 161506,
  araucaria: 160038,
  pinhais: 131199,
  piraquara: 124934,
  'almirante-tamandare': 124788,
  'campina-grande-do-sul': 49971,
  itaperucu: 32890,
  mandirituba: 28761,
  'quatro-barras': 25109,
  contenda: 19827,
  quitandinha: 18823,
  'tijucas-do-sul': 18279,
};

/** Slugs que existem no projeto mas não são bairros administrativos oficiais. */
const SKIP_REGIONAL = new Set(['centro-historico']);

const REGIONAL_BY_SLUG = {
  ganchinho: 'Bairro Novo',
  'sitio-cercado': 'Bairro Novo',
  umbara: 'Bairro Novo',
  abranches: 'Boa Vista',
  atuba: 'Boa Vista',
  bacacheri: 'Boa Vista',
  'bairro-alto': 'Boa Vista',
  barreirinha: 'Boa Vista',
  'boa-vista': 'Boa Vista',
  cachoeira: 'Boa Vista',
  pilarzinho: 'Boa Vista',
  'santa-candida': 'Boa Vista',
  'sao-lourenco': 'Boa Vista',
  taboao: 'Boa Vista',
  tingui: 'Boa Vista',
  'alto-boqueirao': 'Boqueirão',
  boqueirao: 'Boqueirão',
  hauer: 'Boqueirão',
  xaxim: 'Boqueirão',
  cajuru: 'Cajuru',
  'capao-da-imbuia': 'Cajuru',
  'jardim-das-americas': 'Cajuru',
  guabirotuba: 'Cajuru',
  uberaba: 'Cajuru',
  taruma: 'Cajuru',
  augusta: 'CIC',
  'cidade-industrial': 'CIC',
  riviera: 'CIC',
  'sao-miguel': 'CIC',
  'agua-verde': 'Fazendinha/Portão',
  fazendinha: 'Fazendinha/Portão',
  guaira: 'Fazendinha/Portão',
  parolin: 'Fazendinha/Portão',
  portao: 'Fazendinha/Portão',
  'santa-quiteria': 'Fazendinha/Portão',
  seminario: 'Fazendinha/Portão',
  'vila-izabel': 'Fazendinha/Portão',
  ahu: 'Matriz',
  'alto-da-gloria': 'Matriz',
  'alto-da-xv': 'Matriz',
  batel: 'Matriz',
  bigorrilho: 'Matriz',
  'bom-retiro': 'Matriz',
  cabral: 'Matriz',
  centro: 'Matriz',
  'centro-civico': 'Matriz',
  'cristo-rei': 'Matriz',
  'hugo-lange': 'Matriz',
  'jardim-botanico': 'Matriz',
  'jardim-social': 'Matriz',
  juveve: 'Matriz',
  merces: 'Matriz',
  'prado-velho': 'Matriz',
  reboucas: 'Matriz',
  'sao-francisco': 'Matriz',
  'capao-raso': 'Pinheirinho',
  fanny: 'Pinheirinho',
  lindoia: 'Pinheirinho',
  'novo-mundo': 'Pinheirinho',
  pinheirinho: 'Pinheirinho',
  butiatuvinha: 'Santa Felicidade',
  'campina-do-siqueira': 'Santa Felicidade',
  'campo-comprido': 'Santa Felicidade',
  cascatinha: 'Santa Felicidade',
  'lamenha-pequena': 'Santa Felicidade',
  'mossungue-ecoville': 'Santa Felicidade',
  orleans: 'Santa Felicidade',
  'santa-felicidade': 'Santa Felicidade',
  'santo-inacio': 'Santa Felicidade',
  'sao-braz': 'Santa Felicidade',
  'sao-joao': 'Santa Felicidade',
  'vista-alegre': 'Santa Felicidade',
  'campo-de-santana': 'Tatuquara',
  caximba: 'Tatuquara',
  tatuquara: 'Tatuquara',
};

function yamlScalar(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    if (/^[\p{L}\p{N}][\p{L}\p{N} .'-]*$/u.test(value)) {
      return value;
    }

    return JSON.stringify(value);
  }

  throw new Error(`Valor YAML não suportado: ${String(value)}`);
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

function upsertFields(yamlBlock, fields) {
  let next = yamlBlock.replace(/\s+$/, '');
  const toInsert = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) {
      continue;
    }

    const line = `${key}: ${yamlScalar(value)}`;
    const re = new RegExp(`^${key}:[^\\n]*$`, 'm');

    if (re.test(next)) {
      next = next.replace(re, line);
    } else {
      toInsert.push(line);
    }
  }

  if (toInsert.length === 0) {
    return next;
  }

  const insertion = toInsert.join('\n');
  const anchors = [/^parentLocationSlug:[^\n]*$/m, /^officialServiceArea:[^\n]*$/m, /^locationType:[^\n]*$/m];

  for (const anchor of anchors) {
    const match = next.match(anchor);

    if (match && match.index !== undefined) {
      const end = match.index + match[0].length;
      return `${next.slice(0, end)}\n${insertion}${next.slice(end)}`;
    }
  }

  const blocksMatch = next.match(/^blocks:/m);

  if (blocksMatch && blocksMatch.index !== undefined) {
    return `${next.slice(0, blocksMatch.index)}${insertion}\n${next.slice(blocksMatch.index)}`;
  }

  return `${next}\n${insertion}`;
}

function sameFields(current, next) {
  return Object.entries(next).every(([key, value]) => current[key] === value);
}

function plannedFields(slug, locationType) {
  if (locationType === 'cidade' && Object.hasOwn(CITY_POPULATION, slug)) {
    return {
      population: CITY_POPULATION[slug],
      populationSource: POPULATION_SOURCE,
    };
  }

  if (locationType === 'bairro' && Object.hasOwn(REGIONAL_BY_SLUG, slug) && !SKIP_REGIONAL.has(slug)) {
    return {
      regional: REGIONAL_BY_SLUG[slug],
    };
  }

  return null;
}

function describeChange(fields) {
  return Object.entries(fields)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(', ');
}

async function main() {
  const files = (await readdir(LOCATIONS_DIR)).filter((name) => name.endsWith('.md')).sort();
  const existingSlugs = new Set(files.map((name) => name.slice(0, -3)));

  const cityUpdates = [];
  const neighborhoodUpdates = [];
  const skipped = [];
  const typeMismatches = [];

  for (const fileName of files) {
    const slug = fileName.slice(0, -3);
    const absolutePath = path.join(LOCATIONS_DIR, fileName);
    const raw = await readFile(absolutePath, 'utf8');
    const { yamlBlock, suffix, newline } = splitFrontmatter(raw);
    const data = load(yamlBlock);

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(`${fileName}: frontmatter inválido`);
    }

    const locationType = data.locationType;
    const fields = plannedFields(slug, locationType);

    if (!fields) {
      if (Object.hasOwn(CITY_POPULATION, slug) && locationType !== 'cidade') {
        typeMismatches.push({ slug, expected: 'cidade', actual: locationType });
      }

      if (Object.hasOwn(REGIONAL_BY_SLUG, slug) && locationType !== 'bairro') {
        typeMismatches.push({ slug, expected: 'bairro', actual: locationType });
      }

      if (SKIP_REGIONAL.has(slug)) {
        skipped.push({ slug, reason: 'não é bairro administrativo oficial' });
      }

      continue;
    }

    if (sameFields(data, fields)) {
      skipped.push({ slug, reason: 'já está atualizado' });
      continue;
    }

    const nextYaml = upsertFields(yamlBlock, fields);
    const nextRaw = `---\n${nextYaml}${suffix}`.replace(/\n/g, newline);
    const record = {
      slug,
      locationType,
      fields,
      relativePath: path.posix.join('src/content/locations', fileName),
      absolutePath,
      nextRaw,
    };

    if (locationType === 'cidade') {
      cityUpdates.push(record);
    } else {
      neighborhoodUpdates.push(record);
    }
  }

  const unmatched = [
    ...Object.keys(CITY_POPULATION)
      .filter((slug) => !existingSlugs.has(slug))
      .map((slug) => ({ slug, kind: 'cidade', value: CITY_POPULATION[slug] })),
    ...Object.keys(REGIONAL_BY_SLUG)
      .filter((slug) => !SKIP_REGIONAL.has(slug) && !existingSlugs.has(slug))
      .map((slug) => ({ slug, kind: 'bairro', value: REGIONAL_BY_SLUG[slug] })),
  ];

  console.log(APPLY ? 'Modo --apply (grava em disco)\n' : 'Modo dry-run (nenhum arquivo será gravado)\n');

  console.log(`Cidades a atualizar: ${cityUpdates.length}`);
  for (const item of cityUpdates) {
    console.log(`  ~ ${item.relativePath}  ${describeChange(item.fields)}`);
  }

  console.log(`\nBairros a atualizar: ${neighborhoodUpdates.length}`);
  for (const item of neighborhoodUpdates) {
    console.log(`  ~ ${item.relativePath}  ${describeChange(item.fields)}`);
  }

  if (skipped.length > 0) {
    console.log('\nIgnorados:');
    for (const item of skipped) {
      console.log(`  - ${item.slug} (${item.reason})`);
    }
  }

  if (typeMismatches.length > 0) {
    console.log('\nlocationType incompatível com o mapeamento:');
    for (const item of typeMismatches) {
      console.log(`  ! ${item.slug} (esperado ${item.expected}, arquivo tem ${item.actual})`);
    }
  }

  if (unmatched.length > 0) {
    console.log('\nSlugs do mapeamento sem arquivo:');
    for (const item of unmatched) {
      console.log(`  ? ${item.slug} (${item.kind}: ${item.value})`);
    }
  } else {
    console.log('\nSlugs do mapeamento sem arquivo: nenhum');
  }

  console.log('\nResumo');
  console.log(`  Cidades: ${cityUpdates.length}`);
  console.log(`  Bairros: ${neighborhoodUpdates.length}`);
  console.log(`  Slugs sem arquivo: ${unmatched.length}`);

  if (!APPLY) {
    return;
  }

  const updates = [...cityUpdates, ...neighborhoodUpdates];

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
