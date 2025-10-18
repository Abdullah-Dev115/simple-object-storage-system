import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private prisma: DatabaseService,
  ) {}

  async register(createUserDto: Prisma.UserCreateInput) {
    const user = await this.userService.findOne(createUserDto.username);

    if (user) {
      throw new ConflictException('User already exists');
    }

    const newUser = await this.prisma.user.create({
      data: createUserDto,
    });

    return newUser;
  }

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.userService.findOne(username);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user?.password !== pass) {
      throw new UnauthorizedException('Invalid password');
    }

    const payload = { sub: user.id, username: user.username };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
