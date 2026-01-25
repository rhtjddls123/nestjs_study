import { Exclude } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validationMessage.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class RegisterUserDto {
  @IsString({ message: stringValidationMessage })
  @Length(1, 20, {
    message: lengthValidationMessage,
  })
  nickname: string;

  @IsString({ message: stringValidationMessage })
  @IsEmail({}, { message: emailValidationMessage })
  email: string;

  @IsString({ message: stringValidationMessage })
  @Length(3, 8, {
    message: lengthValidationMessage,
  })
  password: string;
}
