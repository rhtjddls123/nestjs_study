import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    /**
     * 요청이 들어올때 REQ 요청이 들어온 타임스탬프를 찍는다.
     * [REQ] {요청 path} {요청 시간}
     */
    const now = Date.now();
    const req = context.switchToHttp().getRequest<Request>();

    const path = req.originalUrl;
    console.log(`[REQ] ${path} ${new Date().toLocaleString('kr')}`);

    // return next.handle()을 실행하는 순간
    // 라우트의 로직이 전부 실행되고 응답이 반환된다.
    return next.handle().pipe(
      // map((v) => ({ message: '변경됨', data: v })),
      tap(() =>
        console.log(
          `[RES] ${path} ${new Date().toLocaleString('kr')} ${Date.now() - now}ms`,
        ),
      ),
    );
  }
}
