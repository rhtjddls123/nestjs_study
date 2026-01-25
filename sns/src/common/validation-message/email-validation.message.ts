import { ValidationArguments } from 'class-validator';

export const emailValidationMessage = (args: ValidationArguments) => {
  return `${args.property}에 정확힌 이메일을 입력해주세요!`;
};
