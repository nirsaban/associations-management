import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      this.logger.error(`HTTP Exception: ${status}`, exception.stack);

      let message: string;
      let error: string;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const exObj = exceptionResponse as Record<string, unknown>;
        message = (exObj.message as string) || exception.message;
        error = (exObj.error as string) || HttpStatus[status];
      } else {
        message = exception.message;
        error = HttpStatus[status] || 'Unknown Error';
      }

      response.status(status).json({ error, message, statusCode: status } satisfies ErrorResponse);
      return;
    }

    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(`Unhandled Exception: ${err.message}`, err.stack);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'Internal Server Error',
      message: 'שגיאה פנימית בשרת',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    } satisfies ErrorResponse);
  }
}
