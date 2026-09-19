'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { placesApi } from '@/lib/api';
import { getToken } from '@/lib/auth';

type Place = {
  id: number;
  name: string;
  address1: string;
  city: string;
  zipcode: string;
  region: string;
  sessions?: { id: number }[];
};

function PlacesContent() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await placesApi.findAll(
        { search: search || undefined },
        token || undefined,
      );
      setPlaces(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce lieu ? Les stages associés doivent être vides.')) return;
    try {
      const token = getToken();
      if (!token) return;
      await placesApi.remove(id, token);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout title="Lieux / Centres">
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Rechercher (nom, ville, CP...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border px-4 py-2 w-full max-w-sm focus:border-[#1E3A4C] focus:outline-none"
        />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{total} lieu(x)</span>
          <a
            href="/admin/places/new"
            className="rounded-lg bg-[#A8D0E6] px-4 py-2 text-sm font-semibold text-white hover:bg-sky-900"
          >
            + Nouveau lieu
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-gray-400 col-span-full text-center py-8">Chargement...</p>
        ) : places.length === 0 ? (
          <p className="text-gray-400 col-span-full text-center py-8">Aucun lieu</p>
        ) : (
          places.map((p) => (
            <div
              key={p.id}
              className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
            >
              <h3 className="font-semibold text-lg text-gray-900">{p.name}</h3>
              <p className="mt-2 text-sm text-gray-600">
                {p.address1}
                <br />
                {p.zipcode} {p.city}
              </p>
              <p className="mt-1 text-xs text-gray-400">{p.region}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {p.sessions?.length || 0} stage(s)
                </span>
                <div className="space-x-3">
                  <a
                    href={`/admin/places/${p.id}/edit`}
                    className="text-[#1E3A4C] hover:underline text-xs font-medium"
                  >
                    Modifier
                  </a>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminPlacesPage() {
  return (
    <ProtectedRoute adminOnly>
      <PlacesContent />
    </ProtectedRoute>
  );
}
