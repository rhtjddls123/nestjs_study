import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';
import { ChatsModel } from 'src/chats/entity/chats.entity';
import { UserFollowersModel } from './entities/user-followers.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersModel, ChatsModel, UserFollowersModel]),
  ],
  exports: [UsersService],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
