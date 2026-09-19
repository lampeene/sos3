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

export default function UpcomingSessions({ limit = 5 }: { limit?: number }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await sessionsApi.findAll({ futureOnly: true });
        if (!cancelled) {
          setSessions((res.data || []).slice(0, limit));
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Impossible de charger les stages');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading) {
    return <p className="text-gray-500 text-center py-8">Chargement des prochains stages...</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 text-center">
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return <p className="text-gray-500 text-center py-8">Aucun stage à venir pour le moment.</p>;
  }

  return (
    <div className="divide-y divide-gray-200 rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      {sessions.map((session) => {
        const dateObj = new Date(session.date);
        const mois = dateObj.toLocaleDateString('fr-FR', { month: 'short' });
        const jour = dateObj.getDate();
        const dispo = session.freePlaces > 0;
        const linkClass = dispo
          ? "rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition bg-[#D9A759] text-[#1E3A4C] hover:bg-[#c2925a]"
          : "rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none";
        const linkHref = "/inscription?sessionId=" + session.id;
        return (
          <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-gray-50 transition">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center rounded-lg bg-[#A8D0E6] text-[#1E3A4C] w-14 h-14 flex-shrink-0">
                <span className="text-xs font-semibold uppercase leading-none">{mois}</span>
                <span className="text-xl font-bold leading-tight">{jour}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{session.place.name}</p>
                <p className="text-sm text-gray-500">{session.place.city} ({session.place.zipcode})</p>
                <p className="text-xs text-gray-400 mt-0.5">Horaires : J1 8h15-12h30 / 13h30-16h30 · J2 8h30-12h30 / 13h30-16h30</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="text-sm text-gray-500">{session.freePlaces} place{session.freePlaces > 1 ? 's' : ''} restante{session.freePlaces > 1 ? 's' : ''}</span>
              <span className="font-bold text-[#1E3A4C]">{session.price} EUR</span>
              <a href={linkHref} className={linkClass}>{dispo ? "S'inscrire" : "Complet"}</a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
