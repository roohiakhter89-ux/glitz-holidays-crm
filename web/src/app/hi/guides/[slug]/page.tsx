import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { HINDI_PAGES, getHindiPage } from '@/lib/hindi-pages';
import { HindiPageContent } from '@/components/hindi-page-content';
import { SITE } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  const guideHindiSlugs = [
    'kashmir-by-month',
    'places-to-visit-in-kashmir',
    'best-time-to-visit-kashmir',
    'how-to-reach-srinagar',
  ];
  return guideHindiSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getHindiPage(slug);
  if (!guide) return {};

  const pageTitle = guide.seoTitle || guide.title;

  return {
    title: pageTitle,
    description: guide.summary,
    alternates: { canonical: `/hi/guides/${guide.slug}` },
    openGraph: {
      title: pageTitle,
      description: guide.summary,
      url: `${SITE.domain}${guide.urlPath}`,
      type: 'article',
      publishedTime: guide.publishedAt,
      modifiedTime: guide.verifiedOnISO || guide.updatedAt,
      authors: [guide.author],
    },
  };
}

export default async function HindiGuidesSlugPage({ params }: { params: Params }) {
  const { slug } = await params;
  const guide = getHindiPage(slug);
  if (!guide) notFound();

  return <HindiPageContent guide={guide} />;
}
