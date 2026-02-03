import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class PaginateMessagesDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  cursorId?: number;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'ASC';

  @IsOptional()
  @IsNumber()
  take: number = 20;
}
