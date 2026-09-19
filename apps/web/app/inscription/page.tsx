'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { sessionsApi, registrationsApi, paymentsApi } from '@/lib/api';
import { getToken, isAuthenticated, setAuth } from '@/lib/auth';
import FileUpload from '@/components/upload/FileUpload';
import { validateDocumentsForCase, DOCUMENT_REQUIREMENTS, CASE_LABELS } from '@/lib/document-validation';

const STEPS = [
  { id: 1, title: 'Compte' },
  { id: 2, title: 'Permis' },
  { id: 3, title: 'Cas & Documents' },
  { id: 4, title: 'Paiement' },
];

type SessionInfo = {
  id: number;
  date: string;
  price: number;
  place: { name: string; city: string };
};

function InscriptionForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [currentStep, setCurrentStep] = useState(1);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'TRANSFER'>('CARD');
  const [transferInfo, setTransferInfo] = useState<{
    bankName: string;
    iban: string;
    bic: string;
    holder: string;
    reference: string;
  } | null>(null);

  // Form data
  const [form, setForm] = useState({
    // Step 1 - Account
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    // Step 2 - License
    drivingLicenseNumber: '',
    placeOfIssue: '',
    dateOfIssue: '',
    licenseFileName: '',
    licenseUrl: '',
    // Step 3 - Case
    caseNumber: '',
    // Case 2 fields
    infracPlace: '',
    letterNumber: '',
    letterCode: '',
    doc48nFileName: '',
    doc48nUrl: '',
  });

  // Load session info
  useEffect(() => {
    if (!sessionId) return;
    sessionsApi
      .findOne(Number(sessionId))
      .then((data) => setSession(data))
      .catch(() =>
        setSession({
          id: Number(sessionId),
          date: '2026-10-15',
          price: 250,
          place: { name: 'Centre (démo)', city: 'Bordeaux' },
        }),
      );
  }, [sessionId]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canGoNext = () => {
    if (currentStep === 1) {
      return form.firstName && form.lastName && form.email && form.password.length >= 6;
    }
    if (currentStep === 2) {
      return (
        form.drivingLicenseNumber &&
        form.placeOfIssue &&
        form.dateOfIssue &&
        form.licenseUrl
      );
    }
    if (currentStep === 3) {
      if (!form.caseNumber) return false;
      const docErrors = validateDocumentsForCase({
        caseNumber: form.caseNumber,
        licenseUrl: form.licenseUrl,
        doc48nUrl: form.doc48nUrl,
        letterNumber: form.letterNumber,
        letterCode: form.letterCode,
      });
      return docErrors.length === 0;
    }
    return true;
  };

  // Create registration then redirect to PayPlug
  const handlePay = async () => {
    if (!sessionId || !session) {
      setError('Stage introuvable');
      return;
    }

    // Final document validation
    const docErrors = validateDocumentsForCase({
      caseNumber: form.caseNumber,
      licenseUrl: form.licenseUrl,
      doc48nUrl: form.doc48nUrl,
      letterNumber: form.letterNumber,
      letterCode: form.letterCode,
    });
    if (docErrors.length > 0) {
      setError(docErrors.join(' · '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        setError('Vous devez être connecté pour finaliser l’inscription. Connectez-vous d’abord.');
        setLoading(false);
        return;
      }

      // 1. Create registration
      const registration = await registrationsApi.create(
        {
          caseNumber: form.caseNumber,
          sessionId: Number(sessionId),
          // userId will be taken from JWT on the backend in a real flow
          // For now we send a placeholder – adapt when user is linked
          userId: 1,
          drivingLicense: {
            drivingLicenseNumber: form.drivingLicenseNumber,
            placeOfIssue: form.placeOfIssue,
            dateOfIssue: form.dateOfIssue,
            fileName: form.licenseFileName || 'permis.jpg',
            url: form.licenseUrl || '',
          },
          ...(form.caseNumber === 'CASE_2' && {
            docCat2: {
              infracPlace: form.infracPlace,
              infracDate: new Date().toISOString().slice(0, 10),
              infracTime: new Date().toISOString(),
              infracReason: 'À préciser',
              letterNumber: form.letterNumber,
              letterCode: form.letterCode,
              numPoints48n: 1,
              receiptDate: new Date().toISOString().slice(0, 10),
              fileName: form.doc48nFileName || '48n.jpg',
              url: form.doc48nUrl || '',
            },
          }),
        },
        token,
      );

      setRegistrationId(registration.id);

      // 2. Create payment (SumUp card/Apple Pay/Google Pay, or bank transfer)
      const payment = await paymentsApi.create(
        registration.id,
        session.price,
        token,
        paymentMethod,
      );

      // 3. Handle result depending on the chosen method
      if (paymentMethod === 'TRANSFER') {
        setTransferInfo(payment.bankTransfer || null);
      } else if (payment.redirectUrl || payment.paymentUrl) {
        window.location.href = payment.redirectUrl || payment.paymentUrl;
      } else {
        setError('URL de paiement introuvable');
      }
    } catch (err: any) {
      setError(err.displayMessage || err.message || 'Erreur lors de la création du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aucun stage sélectionné.</p>
          <a href="/stages" className="mt-4 inline-block text-[#1E3A4C] font-semibold">
            Voir les stages →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#A8D0E6] text-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <a href="/stages" className="text-sm hover:text-[#D9A759]">
            ← Retour aux stages
          </a>
          <h1 className="mt-2 text-2xl font-bold">Inscription au stage</h1>
          {session && (
            <p className="mt-1 text-sky-100 text-sm">
              {session.place.name} –{' '}
              {new Date(session.date).toLocaleDateString('fr-FR')} –{' '}
              <strong>{session.price} €</strong>
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    currentStep >= step.id
                      ? 'bg-[#A8D0E6] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.id}
                </div>
                <span
                  className={`ml-2 hidden text-sm font-medium sm:block ${
                    currentStep >= step.id ? 'text-[#1E3A4C]' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-4 h-1 flex-1 rounded ${
                      currentStep > step.id ? 'bg-[#A8D0E6]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
          {/* STEP 1 – Account */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Vos informations</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Prénom *"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  className="rounded-lg border px-4 py-3 focus:border-[#1E3A4C] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Nom *"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  className="rounded-lg border px-4 py-3 focus:border-[#1E3A4C] focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="rounded-lg border px-4 py-3 focus:border-[#1E3A4C] focus:outline-none sm:col-span-2"
                />
                <input
                  type="password"
                  placeholder="Mot de passe * (min. 6 caractères)"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className="rounded-lg border px-4 py-3 focus:border-[#1E3A4C] focus:outline-none sm:col-span-2"
                />
              </div>
              <p className="text-sm text-gray-500">
                Déjà un compte ?{' '}
                <a href="/login" className="text-[#1E3A4C] font-medium">
                  Connectez-vous
                </a>
              </p>
            </div>
          )}

          {/* STEP 2 – License */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Informations du permis</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Numéro de permis *"
                  value={form.drivingLicenseNumber}
                  onChange={(e) => update('drivingLicenseNumber', e.target.value)}
                  className="rounded-lg border px-4 py-3 focus:border-[#1E3A4C] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Lieu de délivrance *"
                  value={form.placeOfIssue}
                  onChange={(e) => update('placeOfIssue', e.target.value)}
                  className="rounded-lg border px-4 py-3 focus:border-[#1E3A4C] focus:outline-none"
                />
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    Date de délivrance *
                  </label>
                  <input
                    type="date"
                    value={form.dateOfIssue}
                    onChange={(e) => update('dateOfIssue', e.target.value)}
                    className="w-full rounded-lg border px-4 py-3 focus:border-[#1E3A4C] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <FileUpload
                    label="Photo / scan du permis"
                    required
                    folder="sos-points/permis"
                    onUploaded={(res) => {
                      setForm((prev) => ({
                        ...prev,
                        licenseFileName: res.originalFilename || res.publicId,
                        licenseUrl: res.url,
                      }));
                    }}
                    onError={(msg) => setError(msg)}
                  />
                  {form.licenseUrl && (
                    <p className="mt-1 text-xs text-green-600">Document téléversé</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 – Case */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Votre situation</h2>
              <div className="space-y-3">
                {[
                  { value: 'CASE_1', label: 'Cas 1 – Points restants uniquement' },
                  { value: 'CASE_2', label: 'Cas 2 – Lettre 48N reçue' },
                  { value: 'CASE_3', label: 'Cas 3 – Ordonnance / Décision judiciaire' },
                  { value: 'CASE_4', label: 'Cas 4 – Alternative aux poursuites' },
                ].map((c) => (
                  <label
                    key={c.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                      form.caseNumber === c.value
                        ? 'border-[#1E3A4C] bg-sky-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="case"
                      value={c.value}
                      checked={form.caseNumber === c.value}
                      onChange={(e) => update('caseNumber', e.target.value)}
                      className="h-4 w-4 text-[#1E3A4C]"
                    />
                    <span className="font-medium">{c.label}</span>
                  </label>
                ))}
              </div>

              {form.caseNumber && DOCUMENT_REQUIREMENTS[form.caseNumber as keyof typeof DOCUMENT_REQUIREMENTS] && (
                <p className="text-sm text-[#1E3A4C] bg-sky-50 rounded-lg px-4 py-2">
                  {DOCUMENT_REQUIREMENTS[form.caseNumber as keyof typeof DOCUMENT_REQUIREMENTS].description}
                </p>
              )}

              {form.caseNumber === 'CASE_2' && (
                <div className="mt-6 rounded-lg bg-gray-50 p-4 space-y-4">
                  <p className="text-sm font-medium text-gray-700">
                    Informations lettre 48N
                  </p>
                  <input
                    type="text"
                    placeholder="Lieu de l’infraction"
                    value={form.infracPlace}
                    onChange={(e) => update('infracPlace', e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Numéro du recommandé"
                    value={form.letterNumber}
                    onChange={(e) => update('letterNumber', e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Code du recommandé"
                    value={form.letterCode}
                    onChange={(e) => update('letterCode', e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                  />
                  <FileUpload
                    label="Scan de la lettre 48N"
                    required
                    folder="sos-points/48n"
                    onUploaded={(res) => {
                      setForm((prev) => ({
                        ...prev,
                        doc48nFileName: res.originalFilename || res.publicId,
                        doc48nUrl: res.url,
                      }));
                    }}
                    onError={(msg) => setError(msg)}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4 – Payment */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center">
              <h2 className="text-xl font-semibold">Paiement</h2>

              {transferInfo && (
                <div className="space-y-4 text-left max-w-md mx-auto">
                  <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 text-center">
                    Votre inscription est enregistrée. Merci d'effectuer le virement ci-dessous ; elle sera validée dès réception.
                  </div>
                  <div className="rounded-lg bg-gray-50 p-6 space-y-2 text-sm">
                    <p><span className="text-gray-500">Bénéficiaire :</span> <strong>{transferInfo.holder}</strong></p>
                    <p><span className="text-gray-500">Banque :</span> {transferInfo.bankName}</p>
                    <p><span className="text-gray-500">IBAN :</span> {transferInfo.iban}</p>
                    <p><span className="text-gray-500">BIC :</span> {transferInfo.bic}</p>
                    <p><span className="text-gray-500">Montant :</span> <strong>{session?.price} €</strong></p>
                    <p><span className="text-gray-500">Référence à indiquer :</span> <strong>{transferInfo.reference}</strong></p>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Merci d'indiquer cette référence dans le libellé de votre virement.
                  </p>
                </div>
              )}

              {!transferInfo && (
                <div className="max-w-sm mx-auto space-y-3 text-left">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${paymentMethod === 'CARD' ? 'border-[#1E3A4C] bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="paymentMethod" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} className="h-4 w-4 text-[#1E3A4C]" />
                    <span className="font-medium">Carte bancaire / Apple Pay / Google Pay</span>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${paymentMethod === 'TRANSFER' ? 'border-[#1E3A4C] bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="paymentMethod" checked={paymentMethod === 'TRANSFER'} onChange={() => setPaymentMethod('TRANSFER')} className="h-4 w-4 text-[#1E3A4C]" />
                    <span className="font-medium">Virement bancaire</span>
                  </label>
                </div>
              )}

              {!transferInfo && (
                <>
                  <div className="rounded-lg bg-gray-50 p-6 max-w-sm mx-auto">
                    <p className="text-sm text-gray-500">Montant à régler</p>
                    <p className="text-4xl font-bold text-[#1E3A4C]">
                      {session?.price ?? '—'} €
                    </p>
                    {session && (
                      <p className="mt-2 text-sm text-gray-500">
                        {session.place.name} –{' '}
                        {new Date(session.date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>

                  {!isAuthenticated() && (
                    <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Vous devez être connecté pour payer.{' '}
                      <a href="/login" className="font-semibold underline">
                        Se connecter
                      </a>
                    </div>
                  )}

                  <button
                    onClick={handlePay}
                    disabled={loading || !isAuthenticated()}
                    className="rounded-lg bg-[#D9A759] px-10 py-4 text-lg font-semibold text-[#1E3A4C] hover:bg-[#c2925a] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? 'Traitement...'
                      : paymentMethod === 'TRANSFER'
                      ? 'Confirmer mon inscription'
                      : 'Payer en ligne'}
                  </button>

                  <p className="text-xs text-gray-400">
                    {paymentMethod === 'TRANSFER'
                      ? 'Vous recevrez les coordonnées bancaires après validation.'
                      : 'Paiement sécurisé par SumUp – Vos données bancaires ne transitent pas par notre serveur.'}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex justify-between">
            <button
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1 || loading}
              className="rounded-lg border px-6 py-2 font-medium disabled:opacity-40"
            >
              Précédent
            </button>
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
                disabled={!canGoNext() || loading}
                className="rounded-lg bg-[#A8D0E6] px-6 py-2 font-medium text-white hover:bg-sky-900 disabled:opacity-40"
              >
                Suivant
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <InscriptionForm />
    </Suspense>
  );
}
