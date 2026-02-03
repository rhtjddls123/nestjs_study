import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessagesModel } from './entity/messages.entity';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import {
  ENV_HOST_KEY,
  ENV_PROTOCOL_KEY,
} from 'src/common/const/env-keys.const';
import { PaginateMessagesDto } from './dto/paginate-messages.dto';
import { CreateMessagesDto } from './dto/create-messages.dto';

@Injectable()
export class ChatsMessagesService {
  constructor(
    @InjectRepository(MessagesModel)
    private readonly messagesRepository: Repository<MessagesModel>,
    private readonly commonService: CommonService,
  ) {}

  async createMessage(dto: CreateMessagesDto, authorId: number) {
    const message = await this.messagesRepository.save({
      chat: {
        id: dto.chatId,
      },
      author: {
        id: authorId,
      },
      message: dto.message,
    });

    return message;
  }

  async cursorPaginateMessages(dto: PaginateMessagesDto, chatId: number) {
    const where: FindOptionsWhere<MessagesModel> = {
      chat: {
        id: chatId,
      },
    };

    if (dto.order === 'ASC' && dto.cursorId) {
      where.id = MoreThan(dto.cursorId);
    } else if (dto.order === 'DESC' && dto.cursorId) {
      where.id = LessThan(dto.cursorId);
    }

    const posts = await this.messagesRepository.find({
      where,
      take: dto.take + 1,
      relations: { author: true, chat: true },
    });

    const hasNextPage = posts.length > dto.take;
    const data = hasNextPage ? posts.slice(0, dto.take) : posts;

    const lastItem = hasNextPage ? data[data.length - 1] : null;

    const protocol = process.env[ENV_PROTOCOL_KEY] || 'http';
    const host = process.env[ENV_HOST_KEY] || 'localhost:3000';

    const nextUrl = lastItem && new URL(`${protocol}://${host}/chats`);

    if (nextUrl && hasNextPage) {
      nextUrl.searchParams.append('cursorId', String(lastItem.id));

      for (const key of Object.keys(dto) as (keyof PaginateMessagesDto)[]) {
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
}
