#!/usr/bin/env bash
# ==============================================================================
# Glitz Holidays CRM — Backend  |  PHASE 2: Auth + Users + Roles
# ------------------------------------------------------------------------------
# Adds JWT login, a global auth guard, role-based authorization, and a Users
# module (create/list/update staff). No new npm packages (already installed
# in Phase 1). No schema change (the User table already exists).
#
# RUN THIS FROM INSIDE YOUR BACKEND FOLDER:
#   cd glitz/backend      (or  cd glitz-backend  if you didn't restructure)
#   bash phase-2.sh
#
# The script type-checks with `nest build` before committing. If it doesn't
# compile, it stops and commits nothing.
#
# Options:
#   SKIP_BUILD=1  skip the type-check (not recommended)
#   SKIP_SEED=1   don't create/refresh the OWNER account
# ==============================================================================
set -euo pipefail

say()  { printf "\n\033[1;36m==>\033[0m %s\n" "$1"; }
ok()   { printf "\033[1;32m  ok\033[0m %s\n" "$1"; }
warn() { printf "\033[1;33m  ! \033[0m %s\n" "$1"; }
die()  { printf "\033[1;31m  x \033[0m %s\n" "$1"; exit 1; }

# --- verify we're inside the backend ----------------------------------------
say "Checking this is the backend folder"
[ -f package.json ] || die "No package.json here. cd into your backend folder (glitz/backend) and re-run."
[ -f prisma/schema.prisma ] || die "No prisma/schema.prisma here. This doesn't look like the Glitz backend."
[ -f src/app.module.ts ] || die "No src/app.module.ts here. Wrong folder?"
grep -q '@nestjs/core' package.json || die "This package.json isn't the NestJS backend."
ok "backend confirmed ($(pwd))"

mkdir -p src/common/decorators src/common/guards src/auth/dto src/users/dto

# ============================================================================
# COMMON: decorators + guards
# ============================================================================
say "Writing common decorators + guards"

cat > src/common/decorators/public.decorator.ts << 'EOF'
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
EOF

cat > src/common/decorators/roles.decorator.ts << 'EOF'
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
EOF

cat > src/common/decorators/current-user.decorator.ts << 'EOF'
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return data ? req.user?.[data] : req.user;
  },
);
EOF

cat > src/common/guards/jwt-auth.guard.ts << 'EOF'
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
EOF

cat > src/common/guards/roles.guard.ts << 'EOF'
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Not authenticated');
    if (!required.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
EOF
ok "common/*"

# ============================================================================
# AUTH module
# ============================================================================
say "Writing auth module"

cat > src/auth/dto/login.dto.ts << 'EOF'
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
EOF

cat > src/auth/jwt.strategy.ts << 'EOF'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
EOF

cat > src/auth/auth.service.ts << 'EOF'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
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
}
EOF

cat > src/auth/auth.controller.ts << 'EOF'
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
EOF

cat > src/auth/auth.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
EOF
ok "auth/*"

# ============================================================================
# USERS module
# ============================================================================
say "Writing users module"

cat > src/users/dto/create-user.dto.ts << 'EOF'
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
EOF

cat > src/users/dto/update-user.dto.ts << 'EOF'
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
EOF

cat > src/users/users.service.ts << 'EOF'
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const publicSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email,
        name: dto.name,
        passwordHash,
        role: dto.role ?? Role.SALES_EXEC,
      },
      select: publicSelect,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: publicSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: publicSelect,
    });
  }
}
EOF

cat > src/users/users.controller.ts << 'EOF'
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles(Role.OWNER, Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Roles(Role.OWNER, Role.SUPER_ADMIN, Role.SALES_MANAGER)
  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Roles(Role.OWNER, Role.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }
}
EOF

cat > src/users/users.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
EOF
ok "users/*"

# ============================================================================
# WIRE IT UP: overwrite app.module.ts + make health public
# ============================================================================
say "Wiring modules + global guards into app.module.ts"

cat > src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    // Order matters: authenticate first, then authorize.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
EOF

# health must be public now that the JWT guard is global
cat > src/health/health.controller.ts << 'EOF'
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  root() {
    return {
      status: 'ok',
      service: 'glitz-backend',
      ts: new Date().toISOString(),
    };
  }

  @Get('db')
  async db() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up' };
    } catch {
      return { status: 'error', db: 'down' };
    }
  }
}
EOF
ok "app.module.ts + health made public"

# ============================================================================
# TYPE-CHECK -> SEED -> COMMIT
# ============================================================================
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  say "Type-checking (nest build)"
  if npm run build; then
    ok "build passed"
  else
    die "Build failed — see errors above. Files are written; fix and re-run 'npm run build'. Nothing was committed."
  fi
else
  warn "SKIP_BUILD=1 — skipping type-check"
fi

if [ "${SKIP_SEED:-0}" != "1" ]; then
  say "Creating/refreshing the OWNER account (prisma db seed)"
  npx prisma db seed || warn "Seed failed (DB unreachable?). Run 'npx prisma db seed' yourself once the DB is up."
else
  warn "SKIP_SEED=1 — skipping seed"
fi

say "Committing"
if command -v git >/dev/null 2>&1 && { git rev-parse --git-dir >/dev/null 2>&1; }; then
  git add -A
  git commit -qm "Phase 2: auth (JWT login, global guard, roles) + users module" || warn "git commit skipped (nothing to commit or no identity)"
  ok "committed"
else
  warn "no git repo detected here — skipping commit"
fi

# ============================================================================
say "PHASE 2 COMPLETE"
cat << 'EOF'

Test it (run these in Git Bash):

  npm run start:dev

  # 1) Log in as the owner (email/password come from your .env SEED_ADMIN_*).
  #    Defaults if you never changed them: admin@glitz.local / ChangeMe123!
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@glitz.local","password":"ChangeMe123!"}'

  # -> copy the "access_token" from the response, then:

  TOKEN="paste-the-access_token-here"

  # 2) Who am I?  (should return your user)
  curl http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"

  # 3) No token = 401 (proves the global guard works)
  curl -i http://localhost:3000/api/users

  # 4) With owner token = list of users
  curl http://localhost:3000/api/users -H "Authorization: Bearer $TOKEN"

  # 5) Create a staff member (owner only)
  curl -X POST http://localhost:3000/api/users \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Sales Person","email":"sales@glitz.local","password":"secret123","role":"SALES_EXEC"}'

When login returns a token and step 3 gives 401 while step 4 lists users,
Phase 2 is confirmed. Then we do Phase 3: Leads (attribution + scoring).
EOF
