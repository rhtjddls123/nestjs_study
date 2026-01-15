import { createParamDecorator } from '@nestjs/common';
import { User } from '../user.entity';
import { SessionData } from '../users.controller';

export interface SessionRequest extends Request {
  session?: SessionData;
  currentUser?: User | null;
}

export const CurrentUser = createParamDecorator((data: never, context) => {
  const request = context.switchToHttp().getRequest<SessionRequest>();

  return request.currentUser;
});
