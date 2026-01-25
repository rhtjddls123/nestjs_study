import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService, JwtPayload } from '../auth.service';
import { UsersService } from 'src/users/users.service';
import { AuthenticatedRequest } from './basic-token.guard';

export interface BearerAuthenticatedRequest extends AuthenticatedRequest {
  token: string;
  tokenType: JwtPayload['type'];
}

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<BearerAuthenticatedRequest>();
    const rawToken = req.headers['authorization'];

    if (!rawToken) {
      throw new UnauthorizedException('토큰이 없습니다!');
    }

    const token = this.authService.extractTokenFromHeader(rawToken, true);

    const result = this.authService.verifyToken(token);

    /**
     * request에 넣을 정보
     *
     * 1) 사용자 정보
     * 2) token - token
     * 3) tokenType - access | refresh
     */
    const user = await this.usersService.getUserByEmail(result.email);

    if (!user) {
      throw new UnauthorizedException('유저 정보가 존재하지 않습니다!');
    }

    req.token = token;
    req.tokenType = result.type;
    req.user = user;

    return true;
  }
}

@Injectable()
export class AccessTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest<BearerAuthenticatedRequest>();

    if (req.tokenType !== 'access') {
      throw new UnauthorizedException('Access Token이 아닙니다.');
    }

    return true;
  }
}

@Injectable()
export class RefreshTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const req = context.switchToHttp().getRequest<BearerAuthenticatedRequest>();

    if (req.tokenType !== 'refresh') {
      throw new UnauthorizedException('refresh Token이 아닙니다.');
    }

    return true;
  }
}
