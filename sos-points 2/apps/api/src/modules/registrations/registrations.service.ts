import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@sos-points/database';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import {
  DOCUMENT_REQUIREMENTS,
  CaseNumber,
  isAllowedMimeType,
} from '../../common/document-rules';

@Injectable()
export class RegistrationsService {
  async findAll(params?: { sessionId?: number; userId?: number }) {
    const where: any = {};
    if (params?.sessionId) where.sessionId = params.sessionId;
    if (params?.userId) where.userId = params.userId;

    return prisma.registration.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        session: {
          include: { place: { select: { name: true, city: true } } },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        user: true,
        session: { include: { place: true } },
        drivingLicense: true,
        docCat2: true,
        docCat3Cat4: true,
        payment: true,
      },
    });

    if (!registration) {
      throw new NotFoundException(`Inscription #${id} introuvable`);
    }

    return registration;
  }

  private validateDocuments(dto: CreateRegistrationDto) {
    const rules = DOCUMENT_REQUIREMENTS[dto.caseNumber as CaseNumber];
    if (!rules) {
      throw new BadRequestException(`Cas invalide: ${dto.caseNumber}`);
    }

    const errors: string[] = [];

    if (rules.drivingLicense && !dto.noLicense) {
      if (!dto.drivingLicense) {
        errors.push('Le permis de conduire est obligatoire pour ce cas');
      } else {
        if (!dto.drivingLicense.url) {
          errors.push('Le document du permis (scan/photo) est obligatoire');
        }
        if (
          dto.drivingLicense.mimeType &&
          !isAllowedMimeType(dto.drivingLicense.mimeType)
        ) {
          errors.push(
            'Format de fichier du permis non autorisé (JPG, PNG, WebP ou PDF)',
          );
        }
      }
    }

    if (rules.docCat2) {
      if (!dto.docCat2) {
        errors.push('La lettre 48N est obligatoire pour le cas 2');
      } else {
        if (!dto.docCat2.url) {
          errors.push('Le scan de la lettre 48N est obligatoire');
        }
        if (
          dto.docCat2.mimeType &&
          !isAllowedMimeType(dto.docCat2.mimeType)
        ) {
          errors.push(
            'Format de fichier 48N non autorisé (JPG, PNG, WebP ou PDF)',
          );
        }
        if (!dto.docCat2.letterNumber || !dto.docCat2.letterCode) {
          errors.push(
            'Le numéro et le code du recommandé 48N sont obligatoires',
          );
        }
      }
    }

    if (rules.docCat3Cat4) {
      if (!dto.docCat3Cat4) {
        errors.push(
          'Le document de jugement / ordonnance est obligatoire pour ce cas',
        );
      } else {
        if (!dto.docCat3Cat4.url) {
          errors.push('Le scan du jugement est obligatoire');
        }
        if (
          dto.docCat3Cat4.mimeType &&
          !isAllowedMimeType(dto.docCat3Cat4.mimeType)
        ) {
          errors.push(
            'Format de fichier jugement non autorisé (JPG, PNG, WebP ou PDF)',
          );
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Documents incomplets ou invalides',
        errors,
      });
    }
  }

  async create(dto: CreateRegistrationDto) {
    this.validateDocuments(dto);

    const session = await prisma.session.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Stage introuvable');
    }

    if (session.usersCount >= session.maxRegistration) {
      throw new BadRequestException('Ce stage est complet');
    }

    const existing = await prisma.registration.findFirst({
      where: {
        userId: dto.userId,
        sessionId: dto.sessionId,
      },
    });
    if (existing) {
      throw new BadRequestException('Vous êtes déjà inscrit à ce stage');
    }

    return prisma.$transaction(async (tx) => {
      const registration = await tx.registration.create({
        data: {
          caseNumber: dto.caseNumber as any,
          noLicense: dto.noLicense ?? false,
          sessionId: dto.sessionId,
          userId: dto.userId,
        },
      });

      if (dto.drivingLicense && !dto.noLicense) {
        await tx.drivingLicense.create({
          data: {
            drivingLicenseNumber: dto.drivingLicense.drivingLicenseNumber,
            placeOfIssue: dto.drivingLicense.placeOfIssue,
            dateOfIssue: new Date(dto.drivingLicense.dateOfIssue),
            numberOfPoints: dto.drivingLicense.numberOfPoints,
            fileName: dto.drivingLicense.fileName,
            url: dto.drivingLicense.url,
            mimeType: dto.drivingLicense.mimeType,
            registrationId: registration.id,
          },
        });
      }

      if (dto.docCat2) {
        await tx.docCat2.create({
          data: {
            infracPlace: dto.docCat2.infracPlace,
            infracDate: new Date(dto.docCat2.infracDate),
            infracTime: new Date(dto.docCat2.infracTime),
            infracReason: dto.docCat2.infracReason,
            letterNumber: dto.docCat2.letterNumber,
            letterCode: dto.docCat2.letterCode,
            numPoints48n: dto.docCat2.numPoints48n,
            receiptDate: new Date(dto.docCat2.receiptDate),
            fileName: dto.docCat2.fileName,
            url: dto.docCat2.url,
            mimeType: dto.docCat2.mimeType,
            registrationId: registration.id,
          },
        });
      }

      if (dto.docCat3Cat4) {
        await tx.docCat3Cat4.create({
          data: {
            dateOfJudgement: new Date(dto.docCat3Cat4.dateOfJudgement),
            judgementNumber: dto.docCat3Cat4.judgementNumber,
            fileName: dto.docCat3Cat4.fileName,
            url: dto.docCat3Cat4.url,
            mimeType: dto.docCat3Cat4.mimeType,
            registrationId: registration.id,
          },
        });
      }

      return tx.registration.findUnique({
        where: { id: registration.id },
        include: {
          drivingLicense: true,
          docCat2: true,
          docCat3Cat4: true,
          session: { include: { place: true } },
        },
      });
    });
  }

  async remove(id: number) {
    const registration = await this.findOne(id);

    await prisma.$transaction(async (tx) => {
      await tx.registration.delete({ where: { id } });

      if (registration.session.usersCount > 0) {
        await tx.session.update({
          where: { id: registration.sessionId },
          data: { usersCount: { decrement: 1 } },
        });
      }
    });

    return { message: 'Inscription supprimée' };
  }
}
