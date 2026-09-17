import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@sos-points/database';
import { CreatePlaceDto } from './dto/create-place.dto';

@Injectable()
export class PlacesService {
  async findAll(params?: { search?: string; skip?: number; take?: number }) {
    const where: any = {};

    if (params?.search) {
      const search = params.search;
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { zipcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [places, total] = await Promise.all([
      prisma.place.findMany({
        where,
        skip: params?.skip,
        take: params?.take || 20,
        include: {
          sessions: {
            select: { id: true, date: true, usersCount: true, maxRegistration: true },
            orderBy: { date: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.place.count({ where }),
    ]);

    return { data: places, total, skip: params?.skip || 0, take: params?.take || 20 };
  }

  async findOne(id: number) {
    const place = await prisma.place.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            psy: { select: { firstName: true, lastName: true } },
            trainer: { select: { firstName: true, lastName: true } },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!place) {
      throw new NotFoundException(`Lieu #${id} introuvable`);
    }

    return place;
  }

  async create(dto: CreatePlaceDto) {
    return prisma.place.create({ data: dto });
  }

  async update(id: number, data: Partial<CreatePlaceDto>) {
    await this.findOne(id);
    return prisma.place.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    await prisma.place.delete({ where: { id } });
    return { message: 'Lieu supprimé' };
  }
}
