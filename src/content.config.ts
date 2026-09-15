import { defineCollection, type ImageFunction } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Informe um hex válido (#RGB ou #RRGGBB)');

const seoTitle = z.string();
const metaDescription = z.string().max(160);

const textBlock = z.object({
  type: z.literal('text'),
  layout: z.enum(['simple', 'centered']).optional().default('simple'),
  heading: z.string().optional(),
  body: z.string(),
});

const ctaBlock = z.object({
  type: z.literal('cta'),
  heading: z.string(),
  body: z.string().optional(),
  buttonLabel: z.string(),
  buttonHref: z.string(),
});

const recentArticlesBlock = z.object({
  type: z.literal('recentArticles'),
  heading: z.string().optional(),
  count: z.number().int().min(1).max(12).default(3),
});

const faqBlock = z.object({
  type: z.literal('faq'),
  heading: z.string().optional(),
  items: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
});

const serviceGridBlock = z.object({
  type: z.literal('serviceGrid'),
  heading: z.string().optional(),
});

const locationGridBlock = z.object({
  type: z.literal('locationGrid'),
  heading: z.string().optional(),
  locationType: z.enum(['cidade', 'bairro']).optional(),
});

const featureBannerBlock = (image: ImageFunction) =>
  z.object({
    type: z.literal('featureBanner'),
    heading: z.string().optional(),
    image: image().optional(),
    imageAlt: z.string().optional(),
    items: z.array(z.string()).min(1),
  });

const galleryBlock = (image: ImageFunction) =>
  z.object({
    type: z.literal('gallery'),
    images: z.array(
      z.object({
        src: image(),
        alt: z.string(),
      }),
    ),
  });

const heroBlock = (image: ImageFunction) =>
  z.object({
    type: z.literal('hero'),
    layout: z.enum(['simple', 'background', 'centered']).optional().default('simple'),
    heading: z.string(),
    subheading: z.string().optional(),
    badge: z.string().optional(),
    image: image().optional(),
    alt: z.string().optional(),
    overlayImage: image().optional(),
    overlayAlt: z.string().optional(),
    checklist: z.array(z.string()).optional(),
    cta: z
      .object({
        label: z.string(),
        href: z.string(),
      })
      .optional(),
  });

const pageBlocks = (image: ImageFunction) =>
  z.discriminatedUnion('type', [
    heroBlock(image),
    textBlock,
    galleryBlock(image),
    ctaBlock,
    recentArticlesBlock,
    faqBlock,
    serviceGridBlock,
    locationGridBlock,
    featureBannerBlock(image),
  ]);

const pageBlocksArray = (image: ImageFunction) =>
  z.array(pageBlocks(image)).superRefine((blocks, ctx) => {
    blocks.forEach((block, index) => {
      if (block.type !== 'hero' || block.image === undefined) {
        return;
      }

      if (typeof block.alt === 'string' && block.alt.trim() !== '') {
        return;
      }

      ctx.addIssue({
        code: 'custom',
        message: 'alt é obrigatório quando image está definido no bloco hero',
        path: [index, 'alt'],
      });
    });
  });

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      seoTitle,
      metaDescription,
      ogImage: z.string().optional(),
      blocks: pageBlocksArray(image),
      publishedDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
    }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      seoTitle,
      metaDescription,
      ogImage: z.string(),
      excerpt: z.string(),
      featuredImage: z.object({
        src: image(),
        alt: z.string(),
        credit: z.string().optional(),
      }),
      author: z.string(),
      tags: z.array(z.string()).optional(),
      relatedServiceSlug: z.string().optional(),
      publishedDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
    }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      seoTitle,
      metaDescription,
      ogImage: z.string().optional(),
      serviceType: z.string(),
      excerpt: z.string().max(200).optional(),
      blocks: pageBlocksArray(image),
      relatedLocationSlugs: z.array(z.string()).optional(),
      publishedDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
    }),
});

const locations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/locations' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      seoTitle,
      metaDescription,
      ogImage: z.string().optional(),
      locationType: z.enum(['cidade', 'bairro']),
      officialServiceArea: z.boolean().default(true),
      parentLocationSlug: z.string().optional(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
      population: z.number().optional(),
      populationSource: z.string().optional(),
      regional: z.string().optional(),
      blocks: pageBlocksArray(image),
      relatedServiceSlugs: z.array(z.string()).optional(),
      publishedDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
    }),
});

const siteSettings = defineCollection({
  loader: file('src/data/site-settings.json'),
  schema: z.object({
    id: z.string(),
    siteName: z.string(),
    siteUrl: z.string().url(),
    logo: z.object({
      // SVG de favicon/marca: image() rasteriza e o <Image /> não otimiza SVG de forma útil.
      // Mantemos string para apontar a /public/uploads/logo.svg (ou URL) sem passar pelo pipeline.
      path: z.string(),
      alt: z.string(),
    }),
    colors: z.object({
      primary: hexColor,
      secondary: hexColor,
      accent: hexColor,
      background: hexColor,
      text: hexColor,
    }),
    fonts: z.object({
      primaryFamily: z.string(),
      primaryWeights: z.array(z.number()),
      secondaryFamily: z.string().optional(),
      secondaryWeights: z.array(z.number()).optional(),
    }),
    socialLinks: z
      .array(
        z.object({
          platform: z.string(),
          url: z.string().url(),
        }),
      )
      .optional(),
    organization: z.object({
      name: z.string().optional(),
      legalName: z.string().optional(),
      logo: z.string().optional(),
      sameAs: z.array(z.string()).optional(),
      telephone: z.string().optional(),
      areaServed: z.array(z.string()).optional(),
      whatsappNumber: z.string().optional(),
    }),
    theme: z.enum(['modern', 'classic']).default('modern'),
  }),
});

export const collections = {
  pages,
  articles,
  services,
  locations,
  siteSettings,
};
