'use client';

import { clearAuth, getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Utilisateurs' },
  { href: '/admin/places', label: 'Lieux' },
  { href: '/admin/sessions', label: 'Stages' },
];

export default function AdminLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#08717e] text-white">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">
            SOS <span className="text-[#f9be00]">Admin</span>
          </span>
          <nav className="flex items-center gap-5 text-sm">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-[#f9be00] transition"
              >
                {item.label}
              </a>
            ))}
            <a href="/" className="hover:text-[#f9be00]">
              ← Site
            </a>
            <button
              onClick={handleLogout}
              className="rounded bg-white/20 px-3 py-1 hover:bg-white/30"
            >
              Déconnexion
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {user && (
              <p className="text-sm text-gray-500 mt-1">
                Connecté en tant que {user.firstName} {user.lastName}
              </p>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
