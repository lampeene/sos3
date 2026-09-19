'use client';

import { useEffect, useState } from 'react';
import { sessionsApi } from '@/lib/api';

type Session = {
  id: number;
  date: string;
  price: number;
  freePlaces: number;
  maxRegistration: number;
  usersCount: number;
  place: {
    id: number;
    name: string;
    city: string;
    zipcode: string;
    address1: string;
  };
};

export default function StagesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await sessionsApi.findAll({
          futureOnly: true,
          search: search || undefined,
        });
        if (!cancelled) {
          setSessions(res.data || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Impossible de charger les stages');
          // Fallback mock for demo when API is not running
          setSessions([
            {
              id: 1,
              date: '2026-10-15',
              price: 250,
              freePlaces: 8,
              maxRegistration: 20,
              usersCount: 12,
              place: {
                id: 1,
                name: 'Centre Bordeaux',
                city: 'Bordeaux',
                zipcode: '33000',
                address1: '12 rue des Stages',
              },
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#A8D0E6] text-white">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold">
            SOS <span className="text-[#D9A759]">Permis à points</span>
          </a>
          <a href="/" className="text-sm hover:text-[#D9A759]">
            ← Accueil
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prochains stages
        </h1>
        <p className="text-gray-600 mb-8">
          Trouvez un stage de récupération de points près de chez vous
        </p>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Ville, code postal, nom du centre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 focus:border-[#1E3A4C] focus:outline-none focus:ring-2 focus:ring-[#1E3A4C]/20"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error} (données de démonstration affichées)
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Chargement des stages...</p>
        ) : sessions.length === 0 ? (
          <p className="text-gray-500">Aucun stage trouvé.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="inline-block rounded-md bg-[#A8D0E6] px-3 py-1 text-sm font-semibold text-white">
                      {new Date(session.date).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-lg font-bold text-[#1E3A4C]">
                      {session.price} €
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {session.place.name}
                  </h2>
                  <p className="text-gray-600">
                    {session.place.address1}, {session.place.zipcode}{' '}
                    {session.place.city}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Horaires : Jour 1 : 8h15-12h30 / 13h30-16h30 · Jour 2 : 8h30-12h30 / 13h30-16h30
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {session.freePlaces} place
                    {session.freePlaces > 1 ? 's' : ''} restante
                    {session.freePlaces > 1 ? 's' : ''} sur{' '}
                    {session.maxRegistration}
                  </p>
                </div>
                <a
                  href={`/inscription?sessionId=${session.id}`}
                  className={`rounded-lg px-6 py-3 text-center font-semibold transition ${
                    session.freePlaces > 0
                      ? 'bg-[#D9A759] text-[#1E3A4C] hover:bg-[#c2925a]'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  {session.freePlaces > 0 ? "S'inscrire" : 'Complet'}
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
