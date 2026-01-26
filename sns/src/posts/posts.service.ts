import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostsModel } from './entities/posts.entity';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import {
  ENV_HOST_KEY,
  ENV_PROTOCOL_KEY,
} from 'src/common/const/env-keys.const';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find({
      relations: { author: true },
    });
  }

  async paginatePosts(dto: PaginatePostDto) {
    if (dto.page) return this.pagePaginatePosts(dto);

    return this.cursorPaginatePosts(dto);
  }

  async pagePaginatePosts(dto: PaginatePostDto) {
    /**
     * data: Data[],
     * total: number
     */
    const currentPage = dto.page ?? 1;

    const [data, total] = await this.postsRepository.findAndCount({
      skip: dto.take * (currentPage - 1),
      take: dto.take,
      order: { createdAt: dto.order, id: dto.order },
    });

    return {
      data,
      total,
    };
  }

  async cursorPaginatePosts(dto: PaginatePostDto) {
    const where: FindOptionsWhere<PostsModel> = {};

    if (dto.order === 'ASC' && dto.cursorId) {
      where.id = MoreThan(dto.cursorId);
    } else if (dto.order === 'DESC' && dto.cursorId) {
      where.id = LessThan(dto.cursorId);
    }

    const posts = await this.postsRepository.find({
      where,
      take: dto.take + 1, // 다음 요소가 있는지 확인하기 위해 입력받은 take보다 1을 더해줌
    });

    const hasNextPage = posts.length > dto.take;
    const data = hasNextPage ? posts.slice(0, dto.take) : posts;

    // 해당되는 포스트가 0개 이상이면
    // 마지막 포스트를 가져오고
    // 아니라면 null을 반환한다
    const lastItem = hasNextPage ? data[data.length - 1] : null;

    const protocol = process.env[ENV_PROTOCOL_KEY] || 'http';
    const host = process.env[ENV_HOST_KEY] || 'localhost:3000';

    const nextUrl = lastItem && new URL(`${protocol}://${host}/posts`);

    if (nextUrl && hasNextPage) {
      /**
       * dto의 키값들을 루필하면서
       * 키값에 해당되는 밸류가 존재하면
       * param에 그대로 붙여넣는다.
       *
       * 단, where__id_more_than값은 lastITEM의 마지막 값으로 넣어준다.
       */
      nextUrl.searchParams.append('cursorId', String(lastItem.id));

      for (const key of Object.keys(dto) as (keyof PaginatePostDto)[]) {
        const value = dto[key];
        if (value === undefined || value === null) continue;
        if (key !== 'cursorId') {
          nextUrl.searchParams.append(key, value.toString());
        }
      }
    }

    /**
     * Response
     *
     * data: Data[]
     * cursor: {
     *   after: 마지막 Data의 ID
     * },
     * count: 응답한 데이터의 갯수
     * next: 다음 요청을 할때 사용할 URL
     */

    return {
      data,
      count: data.length,
      cursorId: lastItem?.id ?? null,
      hasNextPage,
      next: nextUrl?.toString() ?? null,
    };
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다.');

    return post;
  }

  async createPost(authorId: PostsModel['id'], postDto: CreatePostDto) {
    const post = this.postsRepository.create({
      author: { id: authorId },
      ...postDto,
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async updatePost(id: number, body: UpdatePostDto) {
    const post = await this.postsRepository.preload({ id, ...body });

    if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다.');

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async deletePost(id: number) {
    const post = await this.postsRepository.findOneBy({ id });

    if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다.');

    await this.postsRepository.remove(post);

    return id;
  }
}
