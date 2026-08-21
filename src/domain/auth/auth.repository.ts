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
}
