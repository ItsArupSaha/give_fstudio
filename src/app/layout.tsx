import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gaura-vāṇī Institute for Vaiṣṇava Education (GIVE)',
  description: 'Nurturing spiritual growth and understanding through the timeless wisdom of Vaiṣṇava teachings.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
      </head>
      <body className={cn('font-body antialiased flex flex-col min-h-screen')}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
