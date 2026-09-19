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
                Du lundi au vendredi<br />              </p>
              <div className="mt-4 flex gap-4">
                <a href="https://www.instagram.com/sospoint6440" target="_blank" rel="noopener noreferrer" className="hover:text-[#D9A759] transition" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.058-1.28.072-1.689.072-4.948 0-3.259-.014-3.667-.072-4.947-.198-4.354-2.618-6.78-6.98-6.98-1.28-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://www.google.com/maps?q=stage+de+r%C3%A9cup%C3%A9ration+de+points+-+SOS+POINTS,+50+All.+Marines,+64100+Bayonne&ftid=0xd5141b615c66381:0x257af5ccf4a528fb" target="_blank" rel="noopener noreferrer" className="hover:text-[#D9A759] transition" aria-label="Fiche Google">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>
                </a>
              </div>
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
