'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { usersApi } from '@/lib/api';
import { getToken } from '@/lib/auth';

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  city?: string;
  validated: boolean;
  role?: { name: string };
  createdAt: string;
};

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await usersApi.findAll(
        { search: search || undefined },
        token || undefined,
      );
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      const token = getToken();
      if (!token) return;
      await usersApi.remove(id, token);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout title="Utilisateurs">
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Rechercher (nom, email, ville...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border px-4 py-2 w-full max-w-sm focus:border-[#08717e] focus:outline-none"
        />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{total} utilisateur(s)</span>
          <a
            href="/admin/users/new"
            className="rounded-lg bg-[#08717e] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            + Nouvel utilisateur
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
              <th className="px-4 py-3 font-semibold text-gray-600">Nom</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Ville</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Rôle</th>
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
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Aucun utilisateur
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.city || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-[#08717e]">
                      {u.role?.name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.validated ? (
                      <span className="text-green-600 text-xs font-medium">Validé</span>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium">En attente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <a
                      href={`/admin/users/${u.id}/edit`}
                      className="text-[#08717e] hover:underline text-xs font-medium"
                    >
                      Modifier
                    </a>
                    <button
                      onClick={() => handleDelete(u.id)}
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

export default function AdminUsersPage() {
  return (
    <ProtectedRoute adminOnly>
      <UsersContent />
    </ProtectedRoute>
  );
}
