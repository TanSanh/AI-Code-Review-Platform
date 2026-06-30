import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = exception.message;
      error = HttpStatus[status];

      if (typeof exResponse === 'object' && exResponse !== null) {
        const exObj = exResponse as Record<string, unknown>;
        if (typeof exObj.message === 'string') {
          message = exObj.message;
        }
        if (typeof exObj.error === 'string') {
          error = exObj.error;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Exception:', exception);
    }

    response.status(status).json({
      success: false,
      error: {
        code: error,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
