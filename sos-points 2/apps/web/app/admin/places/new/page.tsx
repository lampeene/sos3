'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { placesApi } from '@/lib/api';
import { getToken } from '@/lib/auth';

function NewPlaceContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    address1: '',
    address2: '',
    zipcode: '',
    city: '',
    region: '',
    description: '',
    certifLastName: '',
    certifFirstName: '',
    certifNumber: '',
    fileName: 'certificat.pdf',
    url: 'https://placeholder.cloudinary.com/certificat.pdf',
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = getToken();
      if (!token) throw new Error('Non authentifié');

      await placesApi.create(form, token);
      router.push('/admin/places');
    } catch (err: any) {
      setError(err.displayMessage || err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Nouveau lieu / centre">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-lg">Informations du centre</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du centre *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Centre Bordeaux – Chartrons"
                className="w-full rounded-lg border px-4 py-2 focus:border-[#08717e] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse *
              </label>
              <input
                required
                value={form.address1}
                onChange={(e) => update('address1', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#08717e] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complément d’adresse
              </label>
              <input
                value={form.address2}
                onChange={(e) => update('address2', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#08717e] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal *
              </label>
              <input
                required
                value={form.zipcode}
                onChange={(e) => update('zipcode', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#08717e] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville *
              </label>
              <input
                required
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#08717e] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Région *
              </label>
              <input
                required
                value={form.region}
                onChange={(e) => update('region', e.target.value)}
                placeholder="Nouvelle-Aquitaine"
                className="w-full rounded-lg border px-4 py-2 focus:border-[#08717e] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#08717e] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-lg">Certificat d’agrément</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du titulaire *
              </label>
              <input
                required
                value={form.certifLastName}
                onChange={(e) => update('certifLastName', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#08717e] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom du titulaire *
              </label>
              <input
                required
                value={form.certifFirstName}
                onChange={(e) => update('certifFirstName', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#08717e] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro d’agrément *
              </label>
              <input
                required
                value={form.certifNumber}
                onChange={(e) => update('certifNumber', e.target.value)}
                placeholder="AG-33-2024-001"
                className="w-full rounded-lg border px-4 py-2 focus:border-[#08717e] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#08717e] px-6 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer le lieu'}
          </button>
          <a
            href="/admin/places"
            className="rounded-lg border px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </a>
        </div>
      </form>
    </AdminLayout>
  );
}

export default function NewPlacePage() {
  return (
    <ProtectedRoute adminOnly>
      <NewPlaceContent />
    </ProtectedRoute>
  );
}
