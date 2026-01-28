import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { UsersModel } from 'src/users/entities/users.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
import { HttpExceptionFilter } from 'src/common/exception-filter/http.exception-filter';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // 1) GET /posts
  //    모든 post를 다 가져온다.
  @Get()
  getPosts(@Query() body: PaginatePostDto) {
    return this.postsService.paginatePosts(body);
  }

  // 2) GET /posts/:id
  //    id에 해당되는 post를 가져온다
  //    예를 들어서 id=1일경우 id가 1인 포스트를 가져온다.
  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  // 3) POST /posts
  //    post를 생성한다.
  /**
   * A Model, B Model
   * Post API -> A 모델을 저장하고, B 모델을 저장한다.
   * await repository.save(a)
   * await repository.save(b)
   *
   * 만약 A 모델을 저장하다가 실패하면 B 모델을 저장하면 안될 경우
   * all or nothing
   *
   * transaction
   * start -> 시작
   * commit -> 저장
   * rollback -> 원상복구ㅜ
   * 모든 변경사항을 한번에 저장하는 방식으로
   * 시작과 커밋 사이에 오류가 생기면 롤백을 통해 이전 상태로 복구한다.
   */
  @Post()
  @UseInterceptors(LogInterceptor)
  @UseGuards(AccessTokenGuard)
  @UseFilters(HttpExceptionFilter)
  async postPosts(
    @Body() body: CreatePostDto,
    @User('id') userId: UsersModel['id'],
  ) {
    return this.postsService.createPostWithImage(userId, body);
  }

  // 4) PUT /posts/:id
  //    id에 해당되는 post를 변경한다.
  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  patchtPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, {
      ...body,
    });
  }

  // 5) DELETE /posts/:id
  //    id에 해당되는 post를 삭제한다.
  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
