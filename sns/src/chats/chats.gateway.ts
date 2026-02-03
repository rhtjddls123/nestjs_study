import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsService } from './chats.service';
import { EnterChatDto } from './dto/enter-chat.dto';
import { CreateMessagesDto } from './messages/dto/create-messages.dto';
import { ChatsMessagesService } from './messages/messages.service';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { SocketCatchHttpExceptionFilter } from 'src/common/exception-filter/socket-catch-http.exception-filter';
import type { BearerAuthenticatedSocket } from 'src/auth/guard/socket/socket-bearer-token.guard';
import { UsersModel } from 'src/users/entities/users.entity';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({
  // ws://localhost:3000/chats
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: ChatsMessagesService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}
  @WebSocketServer()
  server: Server;

  async handleConnection(socket: Socket & { user: UsersModel }) {
    try {
      const auth = socket.handshake.headers.authorization;

      if (!auth) {
        socket.emit('exception', {
          code: 'NO_TOKEN',
          message: 'Authentication token is missing',
        });
        return socket.disconnect();
      }

      const token = this.authService.extractTokenFromHeader(auth, true);
      const payload = this.authService.verifyToken(token);

      const user = await this.usersService.getUserByEmail(payload.email);
      if (!user) {
        socket.emit('exception', {
          code: 'NO_USER',
          message: 'User is missing',
        });
        return socket.disconnect();
      }

      socket.user = user;
    } catch {
      socket.emit('exception', {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      });
      socket.disconnect();
    }
  }

  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  @UseFilters(SocketCatchHttpExceptionFilter)
  // @UseGuards(SocketBearerTokenGuard)
  @SubscribeMessage('create_chat')
  async createChat(@MessageBody() data: CreateChatDto) {
    await this.chatsService.createChat(data);
  }

  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  @UseFilters(SocketCatchHttpExceptionFilter)
  // @UseGuards(SocketBearerTokenGuard)
  @SubscribeMessage('enter_chat')
  async enterChat(
    // 방의 chat ID들을 리스트로 받는다.
    @MessageBody() data: EnterChatDto,
    @ConnectedSocket() socket: Socket,
  ) {
    for (const chatId of data.chatIds) {
      const exists = await this.chatsService.checkIfChatExists(chatId);

      if (!exists) {
        throw new WsException({
          message: `존재하지 않는 chat 입니다. chatId: ${chatId}`,
        });
      }
    }

    await socket.join(data.chatIds.map((v) => v.toString()));
  }

  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  @UseFilters(SocketCatchHttpExceptionFilter)
  // @UseGuards(SocketBearerTokenGuard)
  @SubscribeMessage('send_message')
  async sendMessage(
    @MessageBody() dto: CreateMessagesDto,
    @ConnectedSocket() socket: BearerAuthenticatedSocket,
  ) {
    const chatExists = await this.chatsService.checkIfChatExists(dto.chatId);

    if (!chatExists) {
      throw new WsException(
        `존재하지 않는 채팅방입니다. Chat ID : ${dto.chatId}`,
      );
    }

    const message = await this.messagesService.createMessage(
      dto,
      socket.user.id,
    );

    // this.server
    //   .in(message.chatId.toString())
    //   .emit('receive_message', message.message);
    socket
      .to(message.chat.id.toString())
      .emit('receive_message', message.message);
  }
}
