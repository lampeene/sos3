'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(email, password);
      setAuth(data.access_token, data.user);

      if (data.user.role === 'Admin' || data.user.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.displayMessage || err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#08717e] to-[#065a64] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            SOS <span className="text-[#08717e]">Permis à points</span>
          </h1>
          <p className="mt-2 text-gray-600">Connexion à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#08717e] focus:outline-none focus:ring-2 focus:ring-[#08717e]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#08717e] focus:outline-none focus:ring-2 focus:ring-[#08717e]/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#08717e] py-3 font-semibold text-white hover:bg-teal-800 transition disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <a href="/" className="hover:text-[#08717e]">
            ← Retour à l’accueil
          </a>
        </p>
      </div>
    </div>
  );
}
