import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseModel } from './base.entity';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PostsModel } from 'src/posts/entities/posts.entity';

@Entity()
export class ImageModel extends BaseModel {
  @Column({ default: 0 })
  @IsInt()
  @IsOptional()
  order: number;

  @Column()
  @IsString()
  path: string;

  @ManyToOne(() => PostsModel, (post) => post.images)
  @JoinColumn()
  post?: PostsModel;
}
