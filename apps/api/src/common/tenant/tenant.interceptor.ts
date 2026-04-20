import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from 'nestjs-cls';

/**
 * אינטרספטור שמעביר את נתוני המשתמש מה-JWT ל-CLS
 * רץ אחרי JwtAuthGuard — כך שה-request.user כבר מאוכלס
 *
 * שומר ב-CLS: userId, organizationId, platformRole, systemRole
 * PrismaService קורא מ-CLS כדי לסנן אוטומטית לפי שוכר
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user) {
      this.cls.set('userId', user.sub || user.id);
      this.cls.set('organizationId', user.organizationId || null);
      this.cls.set('platformRole', user.platformRole || null);
      this.cls.set('systemRole', user.systemRole || null);
    }

    return next.handle();
  }
}
