const { prisma } = require('@sos-points/database');
const bcrypt = require('bcrypt');

async function main() {
  const email = 'admin@sos-point.com';
  const plainPassword = 'ChangezMoi123!';

  let role = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (!role) {
    role = await prisma.role.create({ data: { name: 'Admin' } });
    console.log('Rôle Admin créé.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Un utilisateur avec cet email existe déjà. Aucune action.');
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'SOS',
      validated: true,
      roleId: role.id,
    },
  });

  console.log('Utilisateur admin créé avec succès :', user.email);
  console.log('Mot de passe :', plainPassword);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
