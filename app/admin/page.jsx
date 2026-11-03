import AdminPanel from '@/components/AdminPanel';

export const metadata = { title: 'Administrar catálogo', robots: { index: false, follow: false } };

export default function Admin() {
  return <main><AdminPanel /></main>;
}
