import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostsModel } from './entities/posts.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

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
