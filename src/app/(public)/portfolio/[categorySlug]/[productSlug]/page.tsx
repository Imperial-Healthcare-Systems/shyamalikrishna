import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct, getProducts, getSiteSettings } from '@/lib/data';
import { ProductDetailPage } from '@/views/public/ProductDetailPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ productSlug: string; categorySlug: string }> }): Promise<Metadata> {
  const { productSlug, categorySlug } = await params;
  const product = await getProduct(productSlug);
  if (!product) return { title: 'Not Found' };
  return {
    title: product.name,
    description: product.positioning || product.overview || undefined,
    alternates: { canonical: `https://www.shyamalikrishna.com` + `/portfolio/${categorySlug}/${productSlug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ productSlug: string; categorySlug: string }> }) {
  const { productSlug, categorySlug } = await params;
  const product = await getProduct(productSlug);
  if (!product) notFound();
  const [products, settings] = await Promise.all([
    getProducts(),
    getSiteSettings(),
  ]);
  return <ProductDetailPage initialProduct={product} initialProducts={products} initialSettings={settings} />;
}
