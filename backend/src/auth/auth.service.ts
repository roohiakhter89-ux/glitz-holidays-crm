import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Invalid credentials');

    const access_token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      return { message: 'If the email is registered, a reset link will be sent.' };
    }
    const secret = this.config.get<string>('JWT_SECRET') + user.passwordHash;
    const token = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { secret, expiresIn: '15m' }
    );
    // In a real app, send an email here.
    console.log(`[DEV ONLY] Password reset token for ${user.email}: ${token}`);
    return { 
      message: 'If the email is registered, a reset link will be sent.',
      _devToken: token // for testing 
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const decoded = this.jwt.decode(dto.token) as any;
      if (!decoded || !decoded.sub) throw new UnauthorizedException('Invalid token');
      
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new UnauthorizedException('Invalid token');
      
      const secret = this.config.get<string>('JWT_SECRET') + user.passwordHash;
      await this.jwt.verifyAsync(dto.token, { secret });
      
      const passwordHash = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });
      return { message: 'Password reset successfully' };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}