import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentsModel } from './entities/comments.entity';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginateCommentDto } from './dto/paginate-comment.dto';
import { DEFAULT_COMMENT_FIND_OPTIONS } from './const/default-comment-find-options.const';
import {
  ENV_HOST_KEY,
  ENV_PROTOCOL_KEY,
} from 'src/common/const/env-keys.const';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentsModel)
    private readonly commentsRepository: Repository<CommentsModel>,
  ) {}

  async getAllComments(postId: number) {
    return this.commentsRepository.find({ where: { post: { id: postId } } });
  }

  async getCommentsById(postId: number, commentId: number) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId, post: { id: postId } },
      ...DEFAULT_COMMENT_FIND_OPTIONS,
    });

    if (!comment)
      throw new NotFoundException(
        `id: ${commentId} Comment는 존재하지 않습니다.`,
      );

    return comment;
  }

  async paginateComments(postId: number, dto: PaginateCommentDto) {
    if (dto.page) return this.pagePaginateComments(postId, dto);

    return this.cursorPaginateComments(postId, dto);
  }

  async pagePaginateComments(postId: number, dto: PaginateCommentDto) {
    const currentPage = dto.page ?? 1;

    const [data, total] = await this.commentsRepository.findAndCount({
      ...DEFAULT_COMMENT_FIND_OPTIONS,
      where: { post: { id: postId } },
      skip: dto.take * (currentPage - 1),
      take: dto.take,
      order: { createdAt: dto.order, id: dto.order },
    });

    return {
      data,
      total,
    };
  }

  async cursorPaginateComments(postId: number, dto: PaginateCommentDto) {
    const where: FindOptionsWhere<CommentsModel> = { post: { id: postId } };

    if (dto.order === 'ASC' && dto.cursorId) {
      where.id = MoreThan(dto.cursorId);
    } else if (dto.order === 'DESC' && dto.cursorId) {
      where.id = LessThan(dto.cursorId);
    }

    const posts = await this.commentsRepository.find({
      ...DEFAULT_COMMENT_FIND_OPTIONS,
      where,
      take: dto.take + 1,
    });

    const hasNextPage = posts.length > dto.take;
    const data = hasNextPage ? posts.slice(0, dto.take) : posts;

    const lastItem = hasNextPage ? data[data.length - 1] : null;

    const protocol = process.env[ENV_PROTOCOL_KEY] || 'http';
    const host = process.env[ENV_HOST_KEY] || 'localhost:3000';

    const nextUrl = lastItem && new URL(`${protocol}://${host}/posts`);

    if (nextUrl && hasNextPage) {
      nextUrl.searchParams.append('cursorId', String(lastItem.id));

      for (const key of Object.keys(dto) as (keyof PaginateCommentDto)[]) {
        const value = dto[key];
        if (value === undefined || value === null) continue;
        if (key !== 'cursorId') {
          nextUrl.searchParams.append(key, value.toString());
        }
      }
    }

    return {
      data,
      count: data.length,
      cursorId: lastItem?.id ?? null,
      hasNextPage,
      next: nextUrl?.toString() ?? null,
    };
  }

  async createComment(
    authorId: CommentsModel['author']['id'],
    postId: CommentsModel['post']['id'],
    dto: CreateCommentDto,
  ) {
    const comment = this.commentsRepository.create({
      author: { id: authorId },
      comment: dto.comment,
      likeCount: 0,
      post: { id: postId },
    });

    const newComment = await this.commentsRepository.save(comment);

    return newComment;
  }

  async updateComment(
    postId: number,
    commentId: number,
    body: UpdateCommentDto,
  ) {
    const comment = await this.getCommentsById(postId, commentId);

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    comment.comment = body.comment ?? comment.comment;
    comment.likeCount = body.likeCount ?? comment.likeCount;

    return await this.commentsRepository.save(comment);
  }

  async deleteComment(postId: number, commentId: number) {
    const comment = await this.commentsRepository.findOneBy({
      id: commentId,
      post: { id: postId },
    });

    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');

    await this.commentsRepository.remove(comment);

    return commentId;
  }
}
