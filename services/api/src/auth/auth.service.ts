import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }]
      }
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (dto.grant_type === "password") {
      const ok = await bcrypt.compare(dto.password || "", user.passwordHash);
      if (!ok) {
        throw new UnauthorizedException("Invalid credentials");
      }
    }
    const payload = { sub: user.id, role: user.role, roles: [user.role] };
    const access_token = this.jwt.sign(payload);
    return {
      access_token,
      refresh_token: null,
      redirect_hint: user.role === "CUSTOMER" ? "customer" : "ops",
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone
      }
    };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
