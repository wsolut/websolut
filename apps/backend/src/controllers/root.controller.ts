import { Controller, Get, Redirect } from '@nestjs/common';

@Controller('/')
export class RootController {
  @Get()
  @Redirect('/spa', 301)
  root() {
    return;
  }
}
