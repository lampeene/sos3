import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@sos-points/database';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  async findAll(params?: {
    search?: string;
    futureOnly?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};

    if (params?.futureOnly) {
      where.date = { gte: new Date() };
    }

    if (params?.search) {
      where.place = {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { city: { contains: params.search, mode: 'insensitive' } },
          { zipcode: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip: params?.skip,
        take: params?.take || 20,
        include: {
          place: {
            select: {
              id: true,
              name: true,
              city: true,
              zipcode: true,
              address1: true,
            },
          },
          psy: { select: { firstName: true, lastName: true } },
          trainer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.session.count({ where }),
    ]);

    // Add free places count
    const data = sessions.map((s) => ({
      ...s,
      freePlaces: s.maxRegistration - s.usersCount,
    }));

    return { data, total, skip: params?.skip || 0, take: params?.take || 20 };
  }

  async findOne(id: number) {
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        place: true,
        psy: { select: { id: true, firstName: true, lastName: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                mobile: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Stage #${id} introuvable`);
    }

    return {
      ...session,
      freePlaces: session.maxRegistration - session.usersCount,
    };
  }

  async create(dto: CreateSessionDto) {
    return prisma.session.create({
      data: {
        ...dto,
        date: new Date(dto.date),
        maxRegistration: dto.maxRegistration ?? 20,
        minRegistration: dto.minRegistration ?? 6,
      },
      include: { place: true },
    });
  }

  async update(id: number, data: Partial<CreateSessionDto>) {
    await this.findOne(id);
    return prisma.session.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: { place: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await prisma.session.delete({ where: { id } });
    return { message: 'Stage supprimé' };
  }
}
