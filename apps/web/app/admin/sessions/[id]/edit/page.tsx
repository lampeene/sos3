'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { sessionsApi, placesApi, usersApi } from '@/lib/api';
import { getToken } from '@/lib/auth';

function EditSessionContent() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [places, setPlaces] = useState<{ id: number; name: string; city: string }[]>([]);
  const [psys, setPsys] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [trainers, setTrainers] = useState<{ id: number; firstName: string; lastName: string }[]>([]);

  const [form, setForm] = useState({
    date: '',
    price: 250,
    maxRegistration: 20,
    minRegistration: 6,
    placeId: 0,
    psyId: 0,
    trainerId: 0,
  });

  useEffect(() => {
    const token = getToken();
    if (!token || !id) return;

    Promise.all([
      sessionsApi.findOne(id),
      placesApi.findAll({}, token),
      usersApi.findAll({ roleId: 3 }, token),
      usersApi.findAll({ roleId: 4 }, token),
    ])
      .then(([session, placesRes, psysRes, trainersRes]) => {
        setPlaces(placesRes.data || []);
        setPsys(psysRes.data || []);
        setTrainers(trainersRes.data || []);

        const dateStr = session.date
          ? new Date(session.date).toISOString().slice(0, 10)
          : '';

        setForm({
          date: dateStr,
          price: session.price || 250,
          maxRegistration: session.maxRegistration || 20,
          minRegistration: session.minRegistration || 6,
          placeId: session.placeId || session.place?.id || 0,
          psyId: session.psyId || session.psy?.id || 0,
          trainerId: session.trainerId || session.trainer?.id || 0,
        });
      })
      .catch((err) => setError(err.message || 'Stage introuvable'))
      .finally(() => setLoadingData(false));
  }, [id]);

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
      if (!form.placeId) throw new Error('Sélectionnez un lieu');

      await sessionsApi.update(
        id,
        {
          date: form.date,
          price: Number(form.price),
          maxRegistration: Number(form.maxRegistration),
          minRegistration: Number(form.minRegistration),
          placeId: Number(form.placeId),
          psyId: form.psyId || undefined,
          trainerId: form.trainerId || undefined,
        },
        token,
      );

      router.push('/admin/sessions');
    } catch (err: any) {
      setError(err.displayMessage || err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <AdminLayout title="Modifier le stage">
        <p className="text-gray-500">Chargement...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Modifier le stage">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-lg">Informations du stage</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€) *</label>
              <input
                type="number"
                required
                min={1}
                value={form.price}
                onChange={(e) => update('price', Number(e.target.value))}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Places max *</label>
              <input
                type="number"
                required
                min={1}
                max={30}
                value={form.maxRegistration}
                onChange={(e) => update('maxRegistration', Number(e.target.value))}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Places min</label>
              <input
                type="number"
                min={1}
                max={30}
                value={form.minRegistration}
                onChange={(e) => update('minRegistration', Number(e.target.value))}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu *</label>
              <select
                required
                value={form.placeId}
                onChange={(e) => update('placeId', Number(e.target.value))}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              >
                <option value={0}>— Sélectionner —</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Psychologue</label>
              <select
                value={form.psyId}
                onChange={(e) => update('psyId', Number(e.target.value))}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              >
                <option value={0}>— Optionnel —</option>
                {psys.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formateur</label>
              <select
                value={form.trainerId}
                onChange={(e) => update('trainerId', Number(e.target.value))}
                className="w-full rounded-lg border px-4 py-2 focus:border-[#1E3A4C] focus:outline-none"
              >
                <option value={0}>— Optionnel —</option>
                {trainers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#A8D0E6] px-6 py-3 font-semibold text-white hover:bg-sky-900 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <a
            href="/admin/sessions"
            className="rounded-lg border px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </a>
        </div>
      </form>
    </AdminLayout>
  );
}

export default function EditSessionPage() {
  return (
    <ProtectedRoute adminOnly>
      <EditSessionContent />
    </ProtectedRoute>
  );
}
