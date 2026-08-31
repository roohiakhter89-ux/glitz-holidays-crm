import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { HINDI_PAGES, getHindiPage } from '@/lib/hindi-pages';
import { HindiPageContent } from '@/components/hindi-page-content';
import { SITE } from '@/lib/site';

type Params = Promise<{ city: string }>;

export function generateStaticParams() {
  return [{ city: 'delhi' }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city } = await params;
  const guide = getHindiPage(city);
  if (!guide) return {};

  const pageTitle = guide.seoTitle || guide.title;

  return {
    title: pageTitle,
    description: guide.summary,
    alternates: { canonical: `/hi/packages/from/${city}` },
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

export default async function HindiPackagesCityPage({ params }: { params: Params }) {
  const { city } = await params;
  const guide = getHindiPage(city);
  if (!guide) notFound();

  return <HindiPageContent guide={guide} />;
}
