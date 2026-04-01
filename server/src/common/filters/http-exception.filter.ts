import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const msg = (exceptionResponse as Record<string, unknown>).message;
        message = Array.isArray(msg) ? msg.join(', ') : (msg as string) || exception.message;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Record already exists';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Referenced record not found';
          break;
        case 'P2021':
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Database table not found';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Database error: ${exception.code}`;
      }
    }

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
