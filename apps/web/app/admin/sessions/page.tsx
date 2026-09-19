'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { sessionsApi } from '@/lib/api';
import { getToken } from '@/lib/auth';

type Session = {
  id: number;
  date: string;
  price: number;
  maxRegistration: number;
  usersCount: number;
  freePlaces: number;
  status: boolean;
  place: {
    name: string;
    city: string;
    zipcode: string;
  };
  psy?: { firstName: string; lastName: string };
  trainer?: { firstName: string; lastName: string };
};

function SessionsContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sessionsApi.findAll({
        search: search || undefined,
        futureOnly: false,
      });
      setSessions(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce stage ?')) return;
    try {
      const token = getToken();
      if (!token) return;
      await sessionsApi.remove(id, token);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout title="Stages">
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Rechercher (ville, centre...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border px-4 py-2 w-full max-w-sm focus:border-[#1E3A4C] focus:outline-none"
        />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{total} stage(s)</span>
          <a
            href="/admin/sessions/new"
            className="rounded-lg bg-[#A8D0E6] px-4 py-2 text-sm font-semibold text-white hover:bg-sky-900"
          >
            + Nouveau stage
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Lieu</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Prix</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Places</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Statut</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Chargement...
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Aucun stage
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {new Date(s.date).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.place.name}</div>
                    <div className="text-xs text-gray-500">
                      {s.place.zipcode} {s.place.city}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1E3A4C]">
                    {s.price} €
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        s.freePlaces <= 3
                          ? 'text-red-600 font-medium'
                          : 'text-gray-700'
                      }
                    >
                      {s.usersCount} / {s.maxRegistration}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({s.freePlaces} libres)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.status ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        Validé
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <a
                      href={`/admin/sessions/${s.id}/edit`}
                      className="text-[#1E3A4C] hover:underline text-xs font-medium"
                    >
                      Modifier
                    </a>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default function AdminSessionsPage() {
  return (
    <ProtectedRoute adminOnly>
      <SessionsContent />
    </ProtectedRoute>
  );
}
