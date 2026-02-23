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
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from 'src/users/decorator/user.decorator';
import { UsersModel } from 'src/users/entities/users.entity';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { PostsModel } from '../entities/posts.entity';
import { HttpExceptionFilter } from 'src/common/exception-filter/http.exception-filter';
import { PaginateCommentDto } from './dto/paginate-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { IsPublic } from 'src/common/decorator/is-public.decorator';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @IsPublic()
  getComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() body: PaginateCommentDto,
  ) {
    return this.commentsService.paginateComments(postId, body);
  }

  @Get(':commentId')
  @IsPublic()
  getComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.commentsService.getCommentsById(postId, commentId);
  }

  @Post()
  @UseFilters(HttpExceptionFilter)
  postComment(
    @Body() body: CreateCommentDto,
    @User('id') userId: UsersModel['id'],
    @Param('postId', ParseIntPipe) postId: PostsModel['id'],
  ) {
    return this.commentsService.createComment(userId, postId, body);
  }

  @Patch(':commentId')
  patchPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() body: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(postId, commentId, body);
  }

  @Delete(':commentId')
  deletePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.commentsService.deleteComment(postId, commentId);
  }
}
