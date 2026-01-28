import { BadRequestException, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { SupabaseClientProvider } from './client/supabase.client';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageModel } from './entiies/image.entity';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        // 바이트 단위
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        /**
         * cb(에러, boolean)
         *
         * 첫번째 파라미터에는 에러가 있을경우 에러 정보를 넣어준다.
         * 두번째 파라미터는 파일을 받을지 말지 boolean을 넣어준다.
         */
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('jpg/jpeg/png 파일만 업로드 가능합니다!'),
            false,
          );
        }
        return cb(null, true);
      },
      storage: multer.memoryStorage(),
    }),
    TypeOrmModule.forFeature([ImageModel]),
    UsersModule,
    AuthModule,
  ],
  controllers: [CommonController],
  exports: [SupabaseClientProvider],
  providers: [CommonService, SupabaseClientProvider],
})
export class CommonModule {}
