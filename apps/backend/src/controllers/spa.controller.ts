import { Controller, Get, Req, Res, Inject, Next } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { Config } from '../config';

@Controller('/spa')
export class SpaController {
  constructor(@Inject('CONFIG') readonly config: Config) {}

  @Get()
  root(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return this.serveSpaFallback(req, res, next);
  }

  @Get('*path')
  index(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return this.serveSpaFallback(req, res, next);
  }

  private serveSpaFallback(
    @Req() req: Request,
    @Res() res: Response,
    next: NextFunction,
  ) {
    const requestedPath = req.url;

    // Skip SPA fallback for assets - let other middleware handle them
    if (requestedPath.startsWith('/spa/assets')) {
      return next();
    }

    const indexPath = join(this.config.spaDirPath, 'index.html');

    console.log(`Serving SPA fallback for path: ${requestedPath}`);

    return res.sendFile(indexPath);
  }
}
