import 'reflect-metadata';
import 'dotenv/config';
import { Manager } from './manager';

async function bootstrap() {
  const manager = new Manager({
    outDirPath: process.env.OUT_DIR_PATH || './tmp',
  });

  await manager.startServer(Number(process.env.BACKEND_PORT || '5555'));
}

void bootstrap();
