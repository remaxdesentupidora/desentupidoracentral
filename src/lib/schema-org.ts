import type { CollectionEntry } from 'astro:content';
import { resolveSiteUrl, toAbsoluteUrl } from './site-url';

type JsonLd = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function buildLocalBusinessJsonLd(
  settings: CollectionEntry<'siteSettings'>['data'],
  location?: CollectionEntry<'locations'>,
): JsonLd | null {
  if (location && location.data.officialServiceArea === false) {
    return null;
  }

  const organization = settings.organization;
  const siteUrl = resolveSiteUrl(settings.siteUrl);
  const name = organization.legalName ?? settings.siteName;

  const jsonLd: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    url: siteUrl,
  };

  if (organization.logo) {
    jsonLd.logo = organization.logo;
    jsonLd.image = organization.logo;
  }

  if (organization.sameAs?.length) {
    jsonLd.sameAs = organization.sameAs;
  }

  if (organization.telephone) {
    jsonLd.telephone = organization.telephone;
  }

  if (location) {
    const place: JsonLd = {
      '@type': 'Place',
      name: location.data.title,
    };

    if (location.data.coordinates) {
      place.geo = {
        '@type': 'GeoCoordinates',
        latitude: location.data.coordinates.lat,
        longitude: location.data.coordinates.lng,
      };

      jsonLd.geo = place.geo;
    }

    jsonLd.areaServed = place;
  } else if (organization.areaServed?.length) {
    jsonLd.areaServed = organization.areaServed;
  }

  return jsonLd;
}

export function buildServiceJsonLd(
  service: CollectionEntry<'services'>,
  siteUrl: string,
  providerName: string,
): JsonLd {
  const base = resolveSiteUrl(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.data.title,
    serviceType: service.data.serviceType,
    description: service.data.metaDescription,
    url: toAbsoluteUrl(`/servicos/${service.data.slug}`, base),
    provider: {
      '@type': 'LocalBusiness',
      name: providerName,
      url: base,
    },
  };
}

export function buildFaqPageJsonLd(items: FaqItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[], siteUrl: string): JsonLd {
  const base = resolveSiteUrl(siteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path, base),
    })),
  };
}
