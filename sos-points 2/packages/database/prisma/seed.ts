/**
 * Seed script – creates roles, admin user, sample places & sessions.
 *
 * Run: npx prisma db seed
 * (configured in package.json)
 */

import { PrismaClient, Gender, CaseNumber } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ========== Roles ==========
  const roles = [
    { name: 'Admin' },
    { name: 'User' },
    { name: 'Psy' },
    { name: 'Trainer' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('✓ Roles');

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'User' } });
  const psyRole = await prisma.role.findUnique({ where: { name: 'Psy' } });
  const trainerRole = await prisma.role.findUnique({
    where: { name: 'Trainer' },
  });

  if (!adminRole || !userRole || !psyRole || !trainerRole) {
    throw new Error('Roles not found');
  }

  // ========== Admin user ==========
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sos-point.com' },
    update: {},
    create: {
      email: 'admin@sos-point.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'SOS',
      gender: Gender.MALE,
      validated: true,
      roleId: adminRole.id,
    },
  });
  console.log('✓ Admin user (admin@sos-point.com / Admin123!)');

  // ========== Demo users ==========
  const userPassword = await bcrypt.hash('User123!', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'jean.dupont@example.com' },
    update: {},
    create: {
      email: 'jean.dupont@example.com',
      password: userPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      gender: Gender.MALE,
      phone: '0612345678',
      city: 'Bordeaux',
      zipCode: '33000',
      validated: true,
      roleId: userRole.id,
    },
  });

  const psy = await prisma.user.upsert({
    where: { email: 'psy@sos-point.com' },
    update: {},
    create: {
      email: 'psy@sos-point.com',
      password: userPassword,
      firstName: 'Marie',
      lastName: 'Martin',
      gender: Gender.FEMALE,
      validated: true,
      roleId: psyRole.id,
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: 'formateur@sos-point.com' },
    update: {},
    create: {
      email: 'formateur@sos-point.com',
      password: userPassword,
      firstName: 'Pierre',
      lastName: 'Bernard',
      gender: Gender.MALE,
      validated: true,
      roleId: trainerRole.id,
    },
  });
  console.log('✓ Demo users (password: User123!)');

  // ========== Places ==========
  const placeBordeaux = await prisma.place.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Centre Bordeaux – Chartrons',
      address1: '12 rue des Chartrons',
      zipcode: '33000',
      city: 'Bordeaux',
      region: 'Nouvelle-Aquitaine',
      description: 'Centre agréé préfecture de la Gironde',
      latitude: 44.857,
      longitude: -0.566,
      certifLastName: 'Durand',
      certifFirstName: 'Sophie',
      certifNumber: 'AG-33-2024-001',
      fileName: 'certif-bordeaux.pdf',
      url: 'https://res.cloudinary.com/demo/certif-bordeaux.pdf',
    },
  });

  const placeNantes = await prisma.place.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Centre Nantes – Centre-ville',
      address1: '5 avenue de la République',
      zipcode: '44000',
      city: 'Nantes',
      region: 'Pays de la Loire',
      description: 'Centre agréé préfecture de Loire-Atlantique',
      latitude: 47.218,
      longitude: -1.554,
      certifLastName: 'Leroy',
      certifFirstName: 'Thomas',
      certifNumber: 'AG-44-2024-002',
      fileName: 'certif-nantes.pdf',
      url: 'https://res.cloudinary.com/demo/certif-nantes.pdf',
    },
  });

  const placeLyon = await prisma.place.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Centre Lyon – Part-Dieu',
      address1: '28 rue de la Villette',
      zipcode: '69003',
      city: 'Lyon',
      region: 'Auvergne-Rhône-Alpes',
      description: 'Centre agréé préfecture du Rhône',
      latitude: 45.76,
      longitude: 4.86,
      certifLastName: 'Moreau',
      certifFirstName: 'Claire',
      certifNumber: 'AG-69-2024-003',
      fileName: 'certif-lyon.pdf',
      url: 'https://res.cloudinary.com/demo/certif-lyon.pdf',
    },
  });
  console.log('✓ Places (Bordeaux, Nantes, Lyon)');

  // ========== Sessions (future dates) ==========
  const now = new Date();
  const sessionsData = [
    {
      date: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      price: 250,
      placeId: placeBordeaux.id,
      psyId: psy.id,
      trainerId: trainer.id,
      maxRegistration: 20,
      minRegistration: 6,
    },
    {
      date: new Date(now.getFullYear(), now.getMonth() + 1, 22),
      price: 240,
      placeId: placeNantes.id,
      psyId: psy.id,
      trainerId: trainer.id,
      maxRegistration: 18,
      minRegistration: 6,
    },
    {
      date: new Date(now.getFullYear(), now.getMonth() + 2, 5),
      price: 260,
      placeId: placeLyon.id,
      psyId: psy.id,
      trainerId: trainer.id,
      maxRegistration: 20,
      minRegistration: 6,
    },
    {
      date: new Date(now.getFullYear(), now.getMonth() + 2, 12),
      price: 250,
      placeId: placeBordeaux.id,
      psyId: psy.id,
      trainerId: trainer.id,
      maxRegistration: 20,
      minRegistration: 6,
    },
  ];

  // Clear existing sessions for clean seed (optional)
  const existingSessions = await prisma.session.count();
  if (existingSessions === 0) {
    for (const s of sessionsData) {
      await prisma.session.create({ data: s });
    }
    console.log(`✓ ${sessionsData.length} sessions`);
  } else {
    console.log(`✓ Sessions already exist (${existingSessions}), skipped`);
  }

  console.log('');
  console.log('✅ Seed completed successfully');
  console.log('');
  console.log('Comptes de test :');
  console.log('  Admin  → admin@sos-point.com / Admin123!');
  console.log('  User   → jean.dupont@example.com / User123!');
  console.log('  Psy    → psy@sos-point.com / User123!');
  console.log('  Trainer→ formateur@sos-point.com / User123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
