/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface Message {
  name: string;
  text: string;
  receiver: string;
}

interface Chat {
  user_1: string;
  user_2: string;
  messages: Message[];
}

@WebSocketGateway({ cors: true })
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private connectedUsers = [];
  private chats: Chat[] = [];

  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('AppGateway');

  @SubscribeMessage('msgToServer')
  handleMessage(client: Socket, payload: Message): void {
    const chat = this.chats.find(
      (c) =>
        (c.user_1 === payload.name && c.user_2 === payload.receiver) ||
        (c.user_1 === payload.receiver && c.user_2 === payload.name),
    );

    if (!chat) {
      this.chats.push({
        user_1: payload.name,
        user_2: payload.receiver,
        messages: [payload],
      });
    } else {
      chat.messages.push(payload);
    }

    const toUsers = [];
    toUsers.push(client.id);

    const client2 = this.connectedUsers.find(
      (c) => c.name === payload.receiver && c.receiver === payload.name,
    );
    if (client2) toUsers.push(client2.id);

    this.server.to(toUsers).emit('msgToClient', payload);
  }

  afterInit(_server: Server) {
    this.logger.log('Init');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedUsers.push({
      id: client.id,
      name: client.handshake.auth?.token,
      receiver: client.handshake.auth?.receiver,
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedUsers = this.connectedUsers.filter((c) => c.id !== client.id);
  }
}
