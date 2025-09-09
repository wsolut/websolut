import { Inject, Logger, forwardRef } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { PageEntity } from './page.entity';
import { PageSerializerService } from './page-serializer.service';

@WebSocketGateway({ namespace: '/pages' })
export class PagesGateway {
  constructor(
    @Inject(forwardRef(() => PageSerializerService))
    private readonly pageSerializerService: PageSerializerService,
  ) {}

  private readonly logger = new Logger(PagesGateway.name);

  @WebSocketServer() server: Server;

  @SubscribeMessage('ping')
  handleMessage(client: Socket, data: string) {
    this.logger.log(`Message received from client id: ${client.id}`);
    this.logger.debug(`Payload: ${data}`);

    return {
      event: 'pong',
      data: 'Wrong data that will make the test fail',
    };
  }

  publishCreate(page: PageEntity) {
    this.server.emit(`create`, {
      page: this.pageSerializerService.serialize(page),
    });
  }

  publishUpdate(page: PageEntity) {
    this.server.emit(`update`, {
      page: this.pageSerializerService.serialize(page),
    });
  }

  publishDelete(page: PageEntity) {
    this.server.emit(`delete`, {
      page: this.pageSerializerService.serialize(page),
    });
  }

  publishPreviewUpdate(page: PageEntity, content: string) {
    this.server.emit(`preview-update`, {
      page: this.pageSerializerService.serialize(page),
      content,
    });
  }
}
