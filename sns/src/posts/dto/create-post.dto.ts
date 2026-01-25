import { IsString } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class CreatePostDto {
  @IsString({
    message: stringValidationMessage,
  })
  title: string;

  @IsString({
    message: stringValidationMessage,
  })
  content: string;
}
