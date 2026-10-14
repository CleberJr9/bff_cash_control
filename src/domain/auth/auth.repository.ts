import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export type User = {
  name: string;
  email: string;
  id: string;
};

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        tx_email: email,
      },
    });
    return user;
  }
  async findbyId(id: string) {
    const user = await this.prismaService.user.findFirst({
      where: { user_id: id },
    });
    return user;
  }
  async createUser(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<User | undefined> {
    try {
      const newUser = await this.prismaService.user.create({
        data: {
          tx_email: email,
          tx_passwordHash: passwordHash,
          tx_name: name,
        },
      });
      return {
        name: newUser.tx_name,
        email: newUser.tx_email,
        id: newUser.user_id,
      };
    } catch (e) {
      // colocar um log aqui após configurar no projeto
      console.log(e);
    }
  }

  async invalidatePasswordResets(userId: string) {
    await this.prismaService.passwordReset.updateMany({
      where: { userId, dt_usedAt: null },
      data: { dt_usedAt: new Date() },
    });
  }

  async createPasswordReset(userId: string, codeHash: string, expiresAt: Date) {
    return this.prismaService.passwordReset.create({
      data: { userId, tx_codeHash: codeHash, dt_expiresAt: expiresAt },
    });
  }

  async findActivePasswordReset(userId: string) {
    return this.prismaService.passwordReset.findFirst({
      where: { userId, dt_usedAt: null, dt_expiresAt: { gt: new Date() } },
      orderBy: { dt_createdAt: 'desc' },
    });
  }

  async incrementPasswordResetAttempts(passwordResetId: string) {
    await this.prismaService.passwordReset.update({
      where: { passwordReset_id: passwordResetId },
      data: { num_attempts: { increment: 1 } },
    });
  }

  async updatePasswordWithReset(
    userId: string,
    passwordResetId: string,
    passwordHash: string,
  ) {
    await this.prismaService.$transaction([
      this.prismaService.user.update({
        where: { user_id: userId },
        data: { tx_passwordHash: passwordHash },
      }),
      this.prismaService.passwordReset.update({
        where: { passwordReset_id: passwordResetId },
        data: { dt_usedAt: new Date() },
      }),
    ]);
  }
}
