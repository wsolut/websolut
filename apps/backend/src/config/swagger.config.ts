import { DocumentBuilder } from '@nestjs/swagger';

const swaggerConfig = new DocumentBuilder()
  .setTitle('Backend example')
  .setDescription('The backend API description')
  .setVersion('1.0')
  .build();

export default swaggerConfig;
