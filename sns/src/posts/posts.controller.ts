import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsModel } from './entities/posts.entity';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // 1) GET /posts
  //    모든 post를 다 가져온다.
  @Get()
  getPosts() {
    return this.postsService.getAllPosts();
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
  @Post()
  postPosts(@Body() body: Pick<PostsModel, 'author' | 'title' | 'content'>) {
    return this.postsService.createPost(body);
  }

  // 4) PUT /posts/:id
  //    id에 해당되는 post를 변경한다.
  @Patch(':id')
  patchtPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<Pick<PostsModel, 'author' | 'title' | 'content'>>,
  ) {
    return this.postsService.updatePost(id, body);
  }

  // 5) DELETE /posts/:id
  //    id에 해당되는 post를 삭제한다.
  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
