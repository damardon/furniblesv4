import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { User, UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export interface FindAllUsersOptions {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private excludeFields<T extends Record<string, any>>(
    user: T,
    keys: (keyof T)[]
  ): Omit<T, keyof T> {
    const result = { ...user };
    keys.forEach(key => delete result[key]);
    return result;
  }

  async create(createUserData: any) {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserData.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Crear el usuario (la contraseña ya viene hasheada desde AuthService)
    const user = await this.prisma.user.create({
      data: {
        email: createUserData.email,
        password: createUserData.password,
        firstName: createUserData.firstName,
        lastName: createUserData.lastName,
        role: createUserData.role || UserRole.BUYER,
        emailVerificationToken: createUserData.emailVerificationToken,
        // Crear perfiles automáticamente según el rol
        ...(createUserData.role === UserRole.SELLER || createUserData.role === UserRole.ADMIN ? {
          sellerProfile: {
            create: {
              storeName: `${createUserData.firstName} ${createUserData.lastName} Store`,
              slug: `${createUserData.firstName.toLowerCase()}-${createUserData.lastName.toLowerCase()}-${Date.now()}`,
            }
          }
        } : {}),
        ...(createUserData.role === UserRole.BUYER || createUserData.role === UserRole.ADMIN ? {
          buyerProfile: {
            create: {
              preferences: {}
            }
          }
        } : {}),
      },
      include: {
        sellerProfile: true,
        buyerProfile: true,
      }
    });

    // Eliminar campos sensibles antes de retornar
    return this.excludeFields(user, ['password', 'emailVerificationToken', 'resetPasswordToken']);
  }

  async findAll(options: FindAllUsersOptions = {}) {
    const { page = 1, limit = 10, role, isActive } = options;
    
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sellerProfile: true,
          buyerProfile: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Eliminar campos sensibles de todos los usuarios
    const safeUsers = users.map(user => 
      this.excludeFields(user, ['password', 'emailVerificationToken', 'resetPasswordToken'])
    );

    return {
      data: safeUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        sellerProfile: true,
        buyerProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    // Eliminar campos sensibles
    return this.excludeFields(user, ['password', 'emailVerificationToken', 'resetPasswordToken']);
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });
  }

  async update(id: string, updateData: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        sellerProfile: true,
        buyerProfile: true,
      },
    });

    // Eliminar campos sensibles
    return this.excludeFields(updatedUser, ['password', 'emailVerificationToken', 'resetPasswordToken']);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        isActive: true,
      },
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      include: {
        sellerProfile: true,
        buyerProfile: true,
      },
    });

    // Eliminar campos sensibles
    return this.excludeFields(updatedUser, ['password', 'emailVerificationToken', 'resetPasswordToken']);
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

async savePasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      resetPasswordToken: token,
      resetPasswordExpiresAt: expiresAt,
    },
  });
}

async findByResetToken(token: string): Promise<User | null> {
  return this.prisma.user.findUnique({
    where: { resetPasswordToken: token },
  });
}

async resetUserPassword(userId: string, hashedPassword: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    },
  });
}


  async validateUserPassword(email: string, password: string) {
    const user = await this.findByEmailWithPassword(email);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    // Retornar usuario sin campos sensibles
    return this.excludeFields(user, ['password', 'emailVerificationToken', 'resetPasswordToken']);
  }
}