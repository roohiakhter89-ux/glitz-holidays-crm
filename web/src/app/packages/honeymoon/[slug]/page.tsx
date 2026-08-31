import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { HONEYMOON_COLLECTIONS, getHoneymoonCollection } from '@/lib/honeymoon-collections';
import { CollectionPage } from '@/components/collection-page';
import { SITE } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return HONEYMOON_COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const c = getHoneymoonCollection(slug);
  if (!c) return {};

  return {
    title: c.seoTitle,
    description: c.metaDescription,
    alternates: { canonical: `/packages/honeymoon/${c.slug}` },
    openGraph: {
      title: c.seoTitle,
      description: c.metaDescription,
      url: `${SITE.domain}/packages/honeymoon/${c.slug}`,
      type: 'website',
    },
  };
}

export default async function HoneymoonCollectionPage({ params }: { params: Params }) {
  const { slug } = await params;
  const c = getHoneymoonCollection(slug);
  if (!c) notFound();

  return <CollectionPage c={c} />;
}
