import { ApiProperty } from '@nestjs/swagger';

export class InvalidArgumentErrorDataDto {
  [propertyName: string]: string[];
}

export class HttpResponsePaginatedMetaDto {
  @ApiProperty({
    description: 'Total number of records',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  pages!: number;
}

export class HttpResponseDto<T = undefined> {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  code!: number;

  @ApiProperty({
    description: 'Description of the response',
    example: 'Success',
    required: false,
  })
  message?: string;

  data?: T | T[];

  errors?: InvalidArgumentErrorDataDto;

  meta?: HttpResponsePaginatedMetaDto;
}

export class HttpRecordResponseDto<T> extends HttpResponseDto<T> {
  @ApiProperty({ description: 'Record details' })
  declare data: T;
}

export class HttpRecordsResponseDto<T> extends HttpResponseDto<T[]> {
  @ApiProperty({ description: 'List of records' })
  declare data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: HttpResponsePaginatedMetaDto,
  })
  declare meta: HttpResponsePaginatedMetaDto;
}

export class HttpNotFoundErrorResponseDto extends HttpResponseDto<undefined> {
  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  declare code: number;

  @ApiProperty({
    description: 'Description of the response',
    example: 'Resource not found',
  })
  declare message: string;
}

export class HttpInvalidArgumentErrorResponseDto extends HttpResponseDto<undefined> {
  @ApiProperty({
    description: 'HTTP status code',
    example: 422,
  })
  declare code: number;

  @ApiProperty({
    description: 'Description of the response',
    example: 'Missing or invalid arguments',
  })
  declare message: string;

  @ApiProperty({
    description: 'Data properties and its error messages',
    type: InvalidArgumentErrorDataDto,
  })
  declare errors: InvalidArgumentErrorDataDto;
}
