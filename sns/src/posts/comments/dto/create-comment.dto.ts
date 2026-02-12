import { IsString } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class CreateCommentDto {
  @IsString({
    message: stringValidationMessage,
  })
  comment: string;
}
