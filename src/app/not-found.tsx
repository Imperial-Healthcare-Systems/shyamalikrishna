import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NotFoundPage } from '@/views/public/NotFoundPage';

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main-content"><NotFoundPage /></main>
      <Footer />
    </>
  );
}
