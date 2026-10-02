import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'iLoveFree - Deterministic Project Extractor & Developer Workbench',
  description: 'Deterministic parser and ZIP packager for markdown transcripts and multi-file code exports with file tree auditing and zero LLM hallucination.',
  openGraph: {
    title: 'iLoveFree - Deterministic Project Extractor & Developer Workbench',
    description: 'Deterministic parser and ZIP packager for markdown transcripts and multi-file code exports with file tree auditing and zero LLM hallucination.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iLoveFree - Deterministic Project Extractor & Developer Workbench',
    description: 'Deterministic parser and ZIP packager for markdown transcripts and multi-file code exports with file tree auditing and zero LLM hallucination.',
  },
};

import { Providers } from '@/components/Providers.tsx';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="bg-black text-white antialiased font-mono selection:bg-white selection:text-black min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
