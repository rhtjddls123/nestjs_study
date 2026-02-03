import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ChatsMessagesService } from './messages.service';
import { PaginateMessagesDto } from './dto/paginate-messages.dto';

@Controller('chats/:cid/messages')
export class MessagesController {
  constructor(private readonly messagesService: ChatsMessagesService) {}

  @Get()
  paginateMessages(
    @Param('cid', ParseIntPipe) id: number,
    @Query() dto: PaginateMessagesDto,
  ) {
    return this.messagesService.cursorPaginateMessages(dto, id);
  }
}
