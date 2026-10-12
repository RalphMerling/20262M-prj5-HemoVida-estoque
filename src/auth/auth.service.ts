
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async validarToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        token,
        {
          algorithms: ['HS256'],
        },
      );

      if (
        !payload ||
        typeof payload.sub !== 'number' ||
        typeof payload.email !== 'string' ||
        typeof payload.role !== 'string'
      ) {
        throw new UnauthorizedException(
          'Token com dados invalidos',
        );
      }

      return payload;
    } catch {
      throw new UnauthorizedException(
        'Token invalido ou expirado',
      );
    }
  }
}
