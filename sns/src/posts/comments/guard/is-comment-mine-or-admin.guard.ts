import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CommentsService } from '../comments.service';
import { Request } from 'express';
import { UsersModel } from 'src/users/entities/users.entity';
import { RolesEnum } from 'src/users/const/roles.const';

interface IsCommentMineOrAdminRequest extends Request {
  user: UsersModel;
  params: Request['params'] & { commentId: string };
}

@Injectable()
export class IsCommentMineOrAdminGuard implements CanActivate {
  constructor(private readonly commentsService: CommentsService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<IsCommentMineOrAdminRequest>();

    const { user } = req;

    if (!user) {
      throw new UnauthorizedException('사용자 정보를 불러올 수 없습니다.');
    }

    if (user.role === RolesEnum.ADMIN) {
      return true;
    }

    const commentId = req.params.commentId;

    if (!commentId) {
      throw new BadRequestException('Comment ID가 파라미터로 제공 돼야합니다.');
    }

    const isOk = await this.commentsService.isCommentMine(
      user.id,
      parseInt(commentId),
    );

    if (!isOk) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return true;
  }
}
