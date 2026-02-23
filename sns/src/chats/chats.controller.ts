import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { CreateChatDto } from './dto/create-chat.dto';
import { PaginateChatDto } from './dto/paginate-chat.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  getChats(@Query() dto: PaginateChatDto) {
    return this.chatsService.cursorPaginateChats(dto);
  }

  @Post('create')
  createChat(@Body() body: CreateChatDto) {
    return this.chatsService.createChat(body);
  }
}
