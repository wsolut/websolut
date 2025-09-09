import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ProjectEntity } from './project.entity';
import { ProjectSerializerService } from './project-serializer.service';

@WebSocketGateway({ namespace: '/projects' })
export class ProjectsGateway {
  constructor(
    private readonly projectSerializerService: ProjectSerializerService,
  ) {}

  private readonly logger = new Logger(ProjectsGateway.name);

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

  publishCreate(project: ProjectEntity) {
    this.server.emit(`create`, {
      project: this.projectSerializerService.serialize(project),
    });
  }

  publishUpdate(project: ProjectEntity) {
    this.server.emit(`update`, {
      project: this.projectSerializerService.serialize(project),
    });
  }

  publishDelete(project: ProjectEntity) {
    this.server.emit(`delete`, {
      project: this.projectSerializerService.serialize(project),
    });
  }

  publishPreviewUpdate(project: ProjectEntity, content: string) {
    this.server.emit(`preview-update`, {
      project: this.projectSerializerService.serialize(project),
      content,
    });
  }
}
