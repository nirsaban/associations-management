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

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
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

    const errorResponse: ErrorResponse = {
      error,
      message,
      statusCode: status,
    };

    response.status(status).json(errorResponse);
  }
}
