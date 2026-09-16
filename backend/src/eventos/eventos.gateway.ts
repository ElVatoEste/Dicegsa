import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { TokenPayload } from '../auth/acceso';
import { salasPara, type Evento, type Sala } from './salas';

@WebSocketGateway({ cors: { origin: true } })
export class EventosGateway implements OnGatewayConnection {
  @WebSocketServer() private servidor: Server;
  private readonly log = new Logger(EventosGateway.name);

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
    if (payload.debeCambiarPassword) {
      socket.disconnect(true);
      return;
    }

    const salas = salasPara(payload.rol);
    await socket.join(salas);
    socket.emit('listo', { salas });
    this.log.log(`${payload.nombreCuenta} escucha [${salas.join(', ')}]`);
  }

  /**
   * Emite a todas las conexiones suscritas a la sala.
   *
   * El reparto es en proceso: con una sola instancia de API alcanza. Una segunda
   * instancia necesita un adaptador de Redis, porque cada proceso solo conoce sus
   * propias conexiones.
   */
  emitir<T>(sala: Sala, tipo: string, datos: T) {
    const evento: Evento<T> = { tipo, sala, datos, emitidoEn: new Date().toISOString() };
    this.servidor?.to(sala).emit('evento', evento);
  }
}
