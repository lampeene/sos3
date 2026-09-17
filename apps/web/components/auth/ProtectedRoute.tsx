'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isAdmin, getUser } from '@/lib/auth';

type Props = {
  children: React.ReactNode;
  adminOnly?: boolean;
};

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    if (adminOnly && !isAdmin()) {
      router.replace('/');
      return;
    }

    setReady(true);
  }, [router, adminOnly]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Vérification de l’authentification...</div>
      </div>
    );
  }

  return <>{children}</>;
}
