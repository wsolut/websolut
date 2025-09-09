import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { JobStatusEntity } from './job-status.entity';
import { JobStatusSerializerService } from './job-status-serializer.service';

@WebSocketGateway({ namespace: '/job-statuses' })
export class JobStatusesGateway {
  constructor(
    private readonly jobStatusSerializerService: JobStatusSerializerService,
  ) {}

  private readonly logger = new Logger(JobStatusesGateway.name);

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

  publishCreate(jobStatus: JobStatusEntity) {
    this.server.emit(`create`, {
      jobStatus: this.jobStatusSerializerService.serialize(jobStatus),
    });
  }

  publishUpdate(jobStatus: JobStatusEntity) {
    this.server.emit(`update`, {
      jobStatus: this.jobStatusSerializerService.serialize(jobStatus),
    });
  }

  publishDelete(jobStatus: JobStatusEntity) {
    this.server.emit(`delete`, {
      jobStatus: this.jobStatusSerializerService.serialize(jobStatus),
    });
  }

  publishPreviewUpdate(jobStatus: JobStatusEntity, content: string) {
    this.server.emit(`preview-update`, {
      jobStatus: this.jobStatusSerializerService.serialize(jobStatus),
      content,
    });
  }
}
