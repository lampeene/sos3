'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const tracker = searchParams.get('tracker');
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    if (!tracker) {
      setStatus('error');
      return;
    }

    async function check() {
      try {
        const data = await api(`/payments/tracker/${tracker}`);
        setPayment(data);
        if (data?.status === 'SUCCESS') {
          setStatus('success');
        } else if (data?.status === 'CREATED') {
          setStatus('pending');
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('pending'); // IPN may not have arrived yet
      }
    }

    check();
  }, [tracker]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-lg text-center">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900">Vérification du paiement...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-700">Paiement confirmé !</h1>
            <p className="mt-4 text-gray-600">
              Votre inscription au stage a bien été enregistrée.
              Vous allez recevoir un email de confirmation.
            </p>
            {payment?.registration?.session && (
              <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left text-sm">
                <p>
                  <strong>Lieu :</strong>{' '}
                  {payment.registration.session.place?.name}
                </p>
                <p>
                  <strong>Date :</strong>{' '}
                  {new Date(payment.registration.session.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            <a
              href="/"
              className="mt-8 inline-block rounded-lg bg-[#08717e] px-6 py-3 font-semibold text-white hover:bg-teal-800"
            >
              Retour à l’accueil
            </a>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="text-5xl mb-4">⌛</div>
            <h1 className="text-2xl font-bold text-amber-600">Paiement en cours de validation</h1>
            <p className="mt-4 text-gray-600">
              Votre paiement est en cours de traitement. Vous recevrez un email
              dès qu’il sera confirmé (généralement en quelques secondes).
            </p>
            <a
              href="/"
              className="mt-8 inline-block rounded-lg border px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Retour à l’accueil
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600">Paiement non confirmé</h1>
            <p className="mt-4 text-gray-600">
              Nous n’avons pas pu confirmer votre paiement. Si vous avez été débité,
              contactez-nous.
            </p>
            <a
              href="/stages"
              className="mt-8 inline-block rounded-lg bg-[#f9be00] px-6 py-3 font-semibold text-[#08717e] hover:bg-yellow-400"
            >
              Réessayer
            </a>
          </>
        )}
      </div>
    </div>
  );
}
