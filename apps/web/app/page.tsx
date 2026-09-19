'use client';

import UpcomingSessions from '@/components/stages/UpcomingSessions';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header / Navbar */}
      <header className="bg-[#A8D0E6] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="SOS Permis à points" className="h-10 w-auto" />
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="/" className="hover:text-[#D9A759] transition">
                Accueil
              </a>
              <a href="/stages" className="hover:text-[#D9A759] transition">
                Stages
              </a>
              <a href="/about" className="hover:text-[#D9A759] transition">
                À propos
              </a>
              <a
                href="/login"
                className="rounded-md bg-[#D9A759] px-4 py-2 text-[#1E3A4C] font-semibold hover:bg-[#c2925a] transition"
              >
                Connexion
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1E3A4C] to-[#153044] text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Récupérez vos points
              <span className="block text-[#D9A759]">en toute confiance</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-sky-100">
              Stages de récupération de points agréés par les préfectures.
              Des centres au Pays Basque et dans les Landes, des formateurs expérimentés.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/stages"
                className="rounded-lg bg-[#D9A759] px-6 py-3 text-base font-semibold text-[#1E3A4C] shadow-lg hover:bg-[#c2925a] transition"
              >
                Trouver un stage
              </a>
              <a
                href="/about"
                className="rounded-lg border-2 border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition"
              >
                Comment ça marche ?
              </a>
            </div>
          </div>
            <div className="mt-10 lg:mt-0">
              <img src="/images/hero-photo.jpeg" alt="Conducteur souriant, ceinture attachée, pouce levé" className="rounded-2xl shadow-xl w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Comment récupérer vos points ?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Un parcours simple en 3 étapes
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Choisissez votre stage',
                desc: 'Sélectionnez une date et un lieu près de chez vous parmi nos centres agréés.',
              },
              {
                step: '2',
                title: 'Inscrivez-vous en ligne',
                desc: 'Remplissez votre dossier (permis, documents) et réglez en toute sécurité.',
              },
              {
                step: '3',
                title: 'Récupérez vos points',
                desc: 'Participez au stage de 2 jours et récupérez jusqu’à 4 points sur votre permis.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl bg-white p-8 shadow-sm border border-gray-100"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D9A759] text-xl font-bold text-[#1E3A4C]">
                  {item.step}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}      {/* Prochains stages */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Prochains stages</h2>
            <p className="mt-4 text-lg text-gray-600">Consultez les prochaines dates disponibles</p>
          </div>
          <UpcomingSessions limit={5} />
          <div className="text-center mt-8">
            <a href="/stages" className="inline-block text-[#1E3A4C] font-semibold hover:text-[#D9A759] transition">
              Voir tous les stages →
            </a>
          </div>
        </div>
      </section>
      <section className="bg-[#A8D0E6] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Prêt à récupérer vos points ?
          </h2>
          <p className="mt-4 text-sky-100 text-lg">
            Des places disponibles au Pays Basque et dans les Landes. Inscrivez-vous dès maintenant.
          </p>
          <a
            href="/stages"
            className="mt-8 inline-block rounded-lg bg-[#D9A759] px-8 py-4 text-lg font-semibold text-[#1E3A4C] hover:bg-[#c2925a] transition shadow-lg"
          >
            Voir les prochains stages
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#575756] text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-bold">SOS Permis à points</h3>
              <p className="mt-3 text-sm text-gray-300">
                Stages de récupération de points agréés par les préfectures.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Contact</h4>
              <p className="mt-3 text-sm text-gray-300">
                07 82 97 72 97<br />
                Du lundi au vendredi<br />
                9h00 – 18h00
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Liens utiles</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li>
                  <a href="/stages" className="hover:text-[#D9A759]">
                    Stages
                  </a>
                </li>
                <li>
                  <a href="/about" className="hover:text-[#D9A759]">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="/login" className="hover:text-[#D9A759]">
                    Espace client
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-600 pt-6 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} SOS Permis à points – Tous droits réservés
          </div>
        </div>
      </footer>
    </div>
  );
}
