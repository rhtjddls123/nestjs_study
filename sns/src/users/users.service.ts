import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';
import { Repository } from 'typeorm';
import { UserFollowersModel } from './entities/user-followers.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersModel)
    private readonly usersRepository: Repository<UsersModel>,
    @InjectRepository(UserFollowersModel)
    private readonly userFollowersRepository: Repository<UserFollowersModel>,
  ) {}

  async createUser(user: Pick<UsersModel, 'email' | 'nickname' | 'password'>) {
    // 1) nickname 중복이 없는지 확인
    // exist() -> 만약에 조건에 해당되는 값이 있으면 true 반환
    const nicknameExists = await this.usersRepository.exists({
      where: {
        nickname: user.nickname,
      },
    });

    if (nicknameExists) {
      throw new BadRequestException('이미 존재하는 nickname 입니다!');
    }

    const emailExists = await this.usersRepository.exists({
      where: {
        email: user.email,
      },
    });

    if (emailExists) {
      throw new BadRequestException('이미 가입한 이메일 입니다!');
    }

    const userObject = this.usersRepository.create({
      nickname: user.nickname,
      email: user.email,
      password: user.password,
    });

    const newUser = await this.usersRepository.save(userObject);

    return newUser;
  }

  async getAllUsers() {
    return this.usersRepository.find({
      relations: { followees: true, followers: true },
    });
  }

  async getUserByEmail(email: string) {
    if (!email) {
      throw new UnauthorizedException('이메일이 존재하지 않습니다!');
    }

    return this.usersRepository.findOneBy({ email });
  }

  // async followUser(followerId: number, followeeId: number) {
  //   const user = await this.usersRepository.findOne({
  //     where: { id: followerId },
  //     relations: { followees: true },
  //   });

  //   if (!user) {
  //     throw new BadRequestException('존재하지 않는 팔로워입니다.');
  //   }

  //   await this.usersRepository.save({
  //     ...user,
  //     followees: [
  //       ...user.followees,
  //       {
  //         id: followeeId,
  //       },
  //     ],
  //   });
  // }

  async followUser(followerId: number, followeeId: number) {
    await this.userFollowersRepository.save({
      follower: {
        id: followerId,
      },
      followee: {
        id: followeeId,
      },
    });

    return true;
  }

  async getFollowers(userId: number, includeNotConfirmed: boolean) {
    const where = { followee: { id: userId } };

    if (!includeNotConfirmed) {
      where['isConfirmed'] = true;
    }

    const result = await this.userFollowersRepository.find({
      where,
      relations: { followee: true, follower: true },
    });

    return result.map((v) => ({
      id: v.id,
      followerId: v.follower.id,
      nickname: v.follower.nickname,
      email: v.follower.email,
      isConfirmed: v.isConfirmed,
    }));
  }

  async confirmFollow(followerId: number, followeeId: number) {
    const existing = await this.userFollowersRepository.findOne({
      where: {
        follower: {
          id: followerId,
        },
        followee: { id: followeeId },
      },
      relations: {
        followee: true,
        follower: true,
      },
    });

    if (!existing) {
      throw new BadRequestException('존재하지 않는 팔로우 요청입니다.');
    }

    await this.userFollowersRepository.save({
      ...existing,
      isConfirmed: true,
    });
  }

  async deleteFollow(followerId: number, followeeId: number) {
    await this.userFollowersRepository.delete({
      follower: { id: followerId },
      followee: { id: followeeId },
    });

    return true;
  }
}
