import { IsNumber, IsString } from 'class-validator';

export class CreateMessagesDto {
  @IsString()
  message: string;

  @IsNumber()
  chatId: number;
}
