import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostsModel } from './entities/posts.entity';
import {
  DataSource,
  FindOptionsWhere,
  LessThan,
  MoreThan,
  QueryRunner,
  Repository,
} from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import {
  ENV_HOST_KEY,
  ENV_PROTOCOL_KEY,
} from 'src/common/const/env-keys.const';
import { ImageModel } from 'src/common/entiies/image.entity';
import { DEFAULT_POST_FIND_OPTIONS } from './const/default-post-find-options.const';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
    private readonly dataSource: DataSource,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find({
      ...DEFAULT_POST_FIND_OPTIONS,
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
      ...DEFAULT_POST_FIND_OPTIONS,
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
      ...DEFAULT_POST_FIND_OPTIONS,
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
      ...DEFAULT_POST_FIND_OPTIONS,
      where: { id },
    });

    if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다.');

    return post;
  }

  async createPostWithImage(authorId: PostsModel['id'], dto: CreatePostDto) {
    // 트랜잭션과 관련된 모든 쿼리를 담당할 쿼리 러너 생성
    const qr = this.dataSource.createQueryRunner();

    // 쿼리 러너에 연결
    await qr.connect();
    // 쿼리 러너에서 트랜잭션을 시작한다.
    // 이 시점부터 같은 쿼리 러너를 사용하면
    // 트랜잭션 안에서 데이터베이스 액션을 실행할 수 있다.
    await qr.startTransaction();

    // 로직 실행
    try {
      const post = await this.createPost(authorId, dto, qr);
      const result = await this.createPostImage(dto, post, qr);
      await qr.commitTransaction();

      return result;
    } catch (e) {
      // 어떤 에러든 에러가 던져지면
      // 트랜잭션을 종료하고 원래 상태로 되돌린다.
      await qr.rollbackTransaction();
      console.error('게시글 작성 실패:', e);

      throw new InternalServerErrorException(
        '게시글 작성중 문제가 발생하였습니다.',
      );
    } finally {
      if (!qr.isReleased) await qr.release();
    }
  }

  async createPost(
    authorId: PostsModel['id'],
    dto: CreatePostDto,
    qr?: QueryRunner,
  ) {
    const repository = qr
      ? qr.manager.getRepository(PostsModel)
      : this.postsRepository;

    const post = repository.create({
      author: { id: authorId },
      title: dto.title,
      content: dto.content,
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await repository.save(post);

    return newPost;
  }

  async createPostImage(
    dto: CreatePostDto,
    post: PostsModel,
    qr?: QueryRunner,
  ) {
    if (!dto.images || dto.images.length === 0) {
      return post;
    }

    const repository = qr
      ? qr.manager.getRepository(ImageModel)
      : this.imageRepository;

    const images = dto.images.map((path, index) =>
      repository.create({
        path,
        order: index,
        post,
      }),
    );

    const savedImages = await repository.save(images);
    post.images = savedImages.map(({ post: _, ...rest }) => rest);

    return post;
  }

  async updatePost(id: number, body: UpdatePostDto) {
    const post = await this.postsRepository.preload({
      id,
      title: body.title,
      content: body.content,
    });

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

  async checkPostExistById(id: number) {
    return this.postsRepository.exists({ where: { id } });
  }

  async isPostMine(userId: number, postId: number) {
    return this.postsRepository.exists({
      where: { id: postId, author: { id: userId } },
      relations: { author: true },
    });
  }
}
