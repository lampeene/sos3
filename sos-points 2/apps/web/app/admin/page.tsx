'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';

function AdminContent() {
  return (
    <AdminLayout title="Tableau de bord">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Utilisateurs', href: '/admin/users', color: 'bg-blue-500' },
          { label: 'Lieux', href: '/admin/places', color: 'bg-green-500' },
          { label: 'Stages', href: '/admin/sessions', color: 'bg-yellow-500' },
          { label: 'Inscriptions', href: '/admin/sessions', color: 'bg-purple-500' },
        ].map((card) => (
          <a
            key={card.label}
            href={card.href}
            className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <div className={`h-2 w-12 rounded ${card.color} mb-4`} />
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              Gérer →
            </p>
          </a>
        ))}
      </div>

      <div className="mt-12 rounded-xl bg-white p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Administration SOS Permis à points</h2>
        <p className="text-gray-600 leading-relaxed">
          Utilisez le menu pour gérer les utilisateurs, les centres agréés et les stages.
          Les données sont chargées en temps réel depuis l’API NestJS.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li>• <strong>Utilisateurs</strong> — recherche, rôles, suppression</li>
          <li>• <strong>Lieux</strong> — centres agréés par région</li>
          <li>• <strong>Stages</strong> — dates, places disponibles, statut de validation</li>
        </ul>
      </div>
    </AdminLayout>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute adminOnly>
      <AdminContent />
    </ProtectedRoute>
  );
}
