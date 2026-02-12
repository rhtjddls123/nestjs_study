import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class PostExistsMiddleware implements NestMiddleware {
  constructor(private readonly postsService: PostsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const postId = req.params.postId as string;

    if (!postId) {
      throw new BadRequestException('Post ID 파라미터는 필수입니다.');
    }

    const exists = await this.postsService.checkPostExistById(parseInt(postId));

    if (!exists) {
      throw new BadRequestException('Post가 존재하지 않습니다.');
    }

    next();
  }
}
