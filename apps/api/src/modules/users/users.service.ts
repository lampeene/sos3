import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { prisma } from '@sos-points/database';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  async findAll(params?: { search?: string; roleId?: number; skip?: number; take?: number }) {
    const where: any = {};

    if (params?.roleId) {
      where.roleId = params.roleId;
    }

    if (params?.search) {
      const search = params.search;
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: params?.skip,
        take: params?.take || 20,
        include: { role: { select: { name: true } } },
        orderBy: { lastName: 'asc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          phone: true,
          mobile: true,
          city: true,
          zipCode: true,
          validated: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data: users, total, skip: params?.skip || 0, take: params?.take || 20 };
  }

  async findOne(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        registrations: {
          include: {
            session: {
              include: { place: { select: { city: true, name: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur #${id} introuvable`);
    }

    const { password, ...result } = user;
    return result;
  }

  async create(dto: CreateUserDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await prisma.user.create({
      data: {
        ...dto,
        email: dto.email.toLowerCase(),
        password: hashedPassword,
      },
      include: { role: true },
    });

    const { password, ...result } = user;
    return result;
  }

  async update(id: number, data: Partial<CreateUserDto>) {
    await this.findOne(id);

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    if (data.email) {
      data.email = data.email.toLowerCase();
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });

    const { password, ...result } = user;
    return result;
  }

  async remove(id: number) {
    await this.findOne(id);
    await prisma.user.delete({ where: { id } });
    return { message: 'Utilisateur supprimé' };
  }
}
