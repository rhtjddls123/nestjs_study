import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersModel } from '../entities/users.entity';
import { AuthenticatedRequest } from 'src/auth/guard/basic-token.guard';

export const User = createParamDecorator(
  (data: keyof UsersModel | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = req.user;

    if (!user) {
      throw new InternalServerErrorException(
        'Request에 user 프로퍼티가 존재하지 않습니다!',
      );
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);
