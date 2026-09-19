export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-lg text-center">
        <div className="text-5xl mb-4">↩️</div>
        <h1 className="text-2xl font-bold text-gray-900">Paiement annulé</h1>
        <p className="mt-4 text-gray-600">
          Vous avez annulé le paiement. Votre inscription n’a pas été validée.
          Vous pouvez réessayer quand vous le souhaitez.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <a
            href="/stages"
            className="rounded-lg bg-[#D9A759] px-6 py-3 font-semibold text-[#1E3A4C] hover:bg-[#c2925a]"
          >
            Retour aux stages
          </a>
          <a
            href="/"
            className="rounded-lg border px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}
