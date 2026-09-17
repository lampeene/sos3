import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SOS Permis à Points',
  description: 'Stages de récupération de points sur le permis de conduire',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}
