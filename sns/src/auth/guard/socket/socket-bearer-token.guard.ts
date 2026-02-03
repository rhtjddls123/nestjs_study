import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService, JwtPayload } from 'src/auth/auth.service';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';

export interface BearerAuthenticatedSocket extends Socket {
  user: UsersModel;
  token: string;
  tokenType: JwtPayload['type'];
}

@Injectable()
export class SocketBearerTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient<BearerAuthenticatedSocket>();

    const header = socket.handshake.headers;

    const rawToken = header.authorization;

    if (!rawToken) {
      throw new WsException('토큰이 없습니다!');
    }

    try {
      const token = this.authService.extractTokenFromHeader(rawToken, true);
      const payload = this.authService.verifyToken(token);
      const user = await this.usersService.getUserByEmail(payload.email);
      if (!user) throw new Error();

      socket.user = user;
      socket.token = token;
      socket.tokenType = payload.type;

      return true;
    } catch {
      throw new WsException('토큰이 유효하지 않습니다.');
    }
  }
}
