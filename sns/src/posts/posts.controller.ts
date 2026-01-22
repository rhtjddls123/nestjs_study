import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PostsService } from './posts.service';

interface PostModel {
  id: number;
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

let posts: PostModel[] = [
  {
    id: 1,
    author: '고성인',
    title: '내 이야기',
    content: '안녕하세요',
    commentCount: 1,
    likeCount: 2,
  },
  {
    id: 2,
    author: '고성인',
    title: '오늘 먹은거',
    content: '봉구스 밥버거',
    commentCount: 23,
    likeCount: 12,
  },
  {
    id: 3,
    author: '고성인',
    title: '내일 할일',
    content: '공부',
    commentCount: 5,
    likeCount: 43,
  },
  {
    id: 4,
    author: '누구게',
    title: '뭐라하지',
    content: '그냥 내용',
    commentCount: 9,
    likeCount: 8,
  },
];

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // 1) GET /posts
  //    모든 post를 다 가져온다.
  @Get()
  getPosts(): PostModel[] {
    return posts;
  }

  // 2) GET /posts/:id
  //    id에 해당되는 post를 가져온다
  //    예를 들어서 id=1일경우 id가 1인 포스트를 가져온다.
  @Get(':id')
  getPost(@Param('id') id: string): PostModel {
    const post = posts.find((post) => post.id === +id);

    if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다.');

    return post;
  }

  // 3) POST /posts
  //    post를 생성한다.
  @Post()
  postPosts(
    @Body() body: Pick<PostModel, 'author' | 'title' | 'content'>,
  ): PostModel {
    const { author, title, content } = body;
    console.log(body);
    const post: PostModel = {
      id: posts[posts.length - 1].id + 1,
      author,
      title,
      content,
      likeCount: 0,
      commentCount: 0,
    };

    posts = [...posts, post];

    return post;
  }

  // 4) PUT /posts/:id
  //    id에 해당되는 post를 변경한다.
  @Patch(':id')
  patchtPost(
    @Param('id') id: string,
    @Body() body: Partial<Pick<PostModel, 'author' | 'title' | 'content'>>,
  ): PostModel[] {
    const post = posts.find((post) => post.id === +id);

    if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다.');

    Object.assign(post, body);

    posts = posts.map((prevPost) => (prevPost.id === +id ? post : prevPost));

    return posts;
  }

  // 5) DELETE /posts/:id
  //    id에 해당되는 post를 삭제한다.
  @Delete(':id')
  deletePost(@Param('id') id: string) {
    const post = posts.find((post) => post.id === +id);

    if (!post) throw new NotFoundException('게시물을 찾을 수 없습니다.');

    posts = posts.filter((post) => post.id !== +id);

    return id;
  }
}
