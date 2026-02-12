import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentDto } from './create-comment.dto';
import { IsNumber, IsOptional } from 'class-validator';
import { numberValidationMessage } from 'src/common/validation-message/number-validation.message';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  @IsNumber({}, { message: numberValidationMessage })
  @IsOptional()
  likeCount?: number;
}
