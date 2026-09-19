'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { usersApi } from '@/lib/api';
import { getToken } from '@/lib/auth';

function NewUserContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: '',
    phone: '',
    mobile: '',
    city: '',
    zipCode: '',
    roleId: 2, // User by default
  });

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = getToken();
      if (!token) throw new Error('Non authentifié');

      await usersApi.create(
        {
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender || undefined,
          phone: form.phone || undefined,
          mobile: form.mobile || undefined,
          city: form.city || undefined,
          zipCode: form.zipCode || undefined,
          roleId: Number(form.roleId),
        },
        token,
      );

      router.push('/admin/users');
    } catch (err: any) {
      setError(err.displayMessage || err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Nouvel utilisateur">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-lg">Identité</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                required
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Genre
              </label>
              <select
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              >
                <option value="">—</option>
                <option value="MALE">Homme</option>
                <option value="FEMALE">Femme</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle *
              </label>
              <select
                required
                value={form.roleId}
                onChange={(e) => update('roleId', Number(e.target.value))}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              >
                <option value={1}>Admin</option>
                <option value={2}>User</option>
                <option value={3}>Psy</option>
                <option value={4}>Trainer</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-lg">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile
              </label>
              <input
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <input
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal
              </label>
              <input
                value={form.zipCode}
                onChange={(e) => update('zipCode', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#A8D0E6] px-6 py-3 font-semibold text-white hover:bg-sky-900 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer l’utilisateur'}
          </button>
          <a
            href="/admin/users"
            className="rounded-lg border px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </a>
        </div>
      </form>
    </AdminLayout>
  );
}

export default function NewUserPage() {
  return (
    <ProtectedRoute adminOnly>
      <NewUserContent />
    </ProtectedRoute>
  );
}
