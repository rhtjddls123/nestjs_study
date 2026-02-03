import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatsModel } from './entity/chats.entity';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { PaginateChatDto } from './dto/paginate-chat.dto';
import {
  ENV_HOST_KEY,
  ENV_PROTOCOL_KEY,
} from 'src/common/const/env-keys.const';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatsModel)
    private readonly chatsRepository: Repository<ChatsModel>,
  ) {}

  async cursorPaginateChats(dto: PaginateChatDto) {
    const where: FindOptionsWhere<ChatsModel> = {};

    if (dto.order === 'ASC' && dto.cursorId) {
      where.id = MoreThan(dto.cursorId);
    } else if (dto.order === 'DESC' && dto.cursorId) {
      where.id = LessThan(dto.cursorId);
    }

    const posts = await this.chatsRepository.find({
      where,
      take: dto.take + 1,
      relations: { users: true },
    });

    const hasNextPage = posts.length > dto.take;
    const data = hasNextPage ? posts.slice(0, dto.take) : posts;

    const lastItem = hasNextPage ? data[data.length - 1] : null;

    const protocol = process.env[ENV_PROTOCOL_KEY] || 'http';
    const host = process.env[ENV_HOST_KEY] || 'localhost:3000';

    const nextUrl = lastItem && new URL(`${protocol}://${host}/chats`);

    if (nextUrl && hasNextPage) {
      nextUrl.searchParams.append('cursorId', String(lastItem.id));

      for (const key of Object.keys(dto) as (keyof PaginateChatDto)[]) {
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

  async createChat(dto: CreateChatDto) {
    const chat = await this.chatsRepository.save({
      users: dto.userIds.map((id) => ({ id })),
    });

    return this.chatsRepository.findOne({
      where: { id: chat.id },
    });
  }

  async checkIfChatExists(chatId: number) {
    const exists = await this.chatsRepository.exists({
      where: {
        id: chatId,
      },
    });

    return exists;
  }
}
