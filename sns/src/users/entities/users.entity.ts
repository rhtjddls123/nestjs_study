import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { RolesEnum } from '../const/roles.const';
import { PostsModel } from 'src/posts/entities/posts.entity';
import { BaseModel } from 'src/common/entiies/base.entity';
import { Exclude } from 'class-transformer';
import { ChatsModel } from 'src/chats/entity/chats.entity';
import { MessagesModel } from 'src/chats/messages/entity/messages.entity';
import { CommentsModel } from 'src/posts/comments/entities/comments.entity';

@Entity()
export class UsersModel extends BaseModel {
  @Column({
    // 1) 길이가 20을 넘지 않을 것
    length: 20,
    // 2) 유일무이한 값이 될 것
    unique: true,
  })
  nickname: string;

  @Column({
    // 1) 유일무이한 값이 될 것
    unique: true,
  })
  email: string;

  @Column()
  /**
   * Request
   * frontent -> backend
   * plain object (JSON) -> class instance (dto)
   *
   * Response
   * backend -> frontend
   * class instance (dto) -> plain object (JSON)
   *
   * toClassOnly -> class instance로 변환될때만
   * toPlainOnly -> plain object로 변환될때만
   */
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({
    enum: Object.values(RolesEnum),
    default: RolesEnum.USER,
  })
  role: RolesEnum;

  @OneToMany(() => PostsModel, (posts) => posts.author)
  posts: PostsModel[];

  @ManyToMany(() => ChatsModel, (chats) => chats.users)
  chats: ChatsModel[];

  @OneToMany(() => MessagesModel, (message) => message.chat)
  messages: MessagesModel[];

  @OneToMany(() => CommentsModel, (comments) => comments.author)
  comments: CommentsModel[];
}
