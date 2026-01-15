import { CanActivate, ExecutionContext } from '@nestjs/common';
import { SessionRequest } from 'src/users/decorators/current-user.decorator';

export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<SessionRequest>();

    return !!request.session?.userId;
  }
}
