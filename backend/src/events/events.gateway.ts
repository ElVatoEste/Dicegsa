import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { TokenPayload } from '../auth/access';
import { roomsFor, type Event, type Room } from './rooms';

@WebSocketGateway({ cors: { origin: true } })
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer() private server: Server;
  private readonly log = new Logger(EventsGateway.name);

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth?.token as string | undefined;
    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(token ?? '');
    } catch {
      socket.disconnect(true);
      return;
    }

    // Una cuenta con contraseña de un solo uso todavía no accedió al sistema y
    // tampoco escucha eventos.
    if (payload.mustChangePassword) {
      socket.disconnect(true);
      return;
    }

    const rooms = roomsFor(payload.role);
    await socket.join(rooms);
    socket.emit('ready', { rooms });
    this.log.log(`${payload.accountName} escucha [${rooms.join(', ')}]`);
  }

  /**
   * Emite a todas las conexiones suscritas a la sala.
   *
   * El reparto es en proceso: con una sola instancia de API alcanza. Una segunda
   * instancia necesita un adaptador de Redis, porque cada proceso solo conoce sus
   * propias conexiones.
   */
  emit<T>(room: Room, type: string, data: T) {
    const event: Event<T> = { type, room, data, emittedAt: new Date().toISOString() };
    this.server?.to(room).emit('event', event);
  }
}
