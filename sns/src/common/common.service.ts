import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UsersModel } from 'src/users/entities/users.entity';
import { SupabaseClientProvider } from './client/supabase.client';

@Injectable()
export class CommonService {
  constructor(private readonly supabase: SupabaseClientProvider) {}

  async upload(file: Express.Multer.File, email: UsersModel['email']) {
    const ext = file.mimetype.split('/')[1];
    const fileName = `${uuid()}.${ext}`;
    const path = `images/${email}/${fileName}`;

    const { error, data } = await this.supabase.client.storage
      .from('s3_study')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return {
      path: data.path,
    };
  }
}
