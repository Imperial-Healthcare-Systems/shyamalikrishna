import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategory, getCategoryProducts, getPartners } from '@/lib/data';
import { CategoryPage } from '@/views/public/CategoryPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category) return { title: 'Not Found' };
  return {
    title: category.name,
    description: category.short_description || category.description || undefined,
    alternates: { canonical: `https://www.shyamalikrishna.com` + `/portfolio/${categorySlug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category) notFound();
  const [products, partners] = await Promise.all([
    getCategoryProducts(category.id),
    getPartners(),
  ]);
  return <CategoryPage initialCategory={category} initialProducts={products} initialPartners={partners} />;
}
