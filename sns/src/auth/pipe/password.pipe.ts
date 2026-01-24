import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PasswordPipe implements PipeTransform {
  transform(value: string) {
    if (value.length > 8) {
      throw new BadRequestException('비밀번호는 8자 이하로 입력해주세요!');
    }
    return value;
  }
}

@Injectable()
export class MaxLengthPipe implements PipeTransform {
  constructor(
    private readonly length: number,
    private readonly subject: string,
  ) {}

  transform(value: string) {
    if (value.length > this.length) {
      throw new BadRequestException(
        `${this.subject}의 최대 길이는 ${this.length}입니다.`,
      );
    }
    return value;
  }
}

@Injectable()
export class MinLengthPipe implements PipeTransform {
  constructor(private readonly length: number) {}

  transform(value: string) {
    if (value.length < this.length) {
      throw new BadRequestException(`최소 길이는 ${this.length}입니다.`);
    }
    return value;
  }
}
