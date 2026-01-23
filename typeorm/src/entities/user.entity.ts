import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { ProfileModel } from './profile.entity';
import { PostModel } from './post.entity';

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity()
export class UserModel {
  // @PrimaryGeneratedColumn(): 해당 칼럼을 primary칼럼으로 설정하고, 자동으로 ID를 생성한다.
  // @PrimaryGeneratedColumn('uuid'): primaryKey를 중복이 없는 랜덤한 문자열로 자동 생성한다.
  // @PrimaryColumn(): 해당 칼럼을 primary칼럼으로 설정하지만 값은 직접 넣어줘야 함
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  email: string;

  // @Column({
  //   // 데이터베이스에서 인지하는 칼럼 타입
  //   // 자동으로 유추됨
  //   type: 'varchar',
  //   // 데이터베이스 칼럼 이름
  //   // 프로퍼티 이름으로 자동 유추됨
  //   name: '_title',
  //   // 값의 최대 길이
  //   length: 300,
  //   // null이 가능한지
  //   nullable: true,
  //   // false면 처음 저장할때만 값 지정 가능
  //   // 이후에는 값 변경이 불가
  //   update: false,
  //   // find()를 실행할 때 기본으로 값을 불러올지 설정
  //   // 기본값은 true
  //   select: true,
  //   // 기본 값을 지정
  //   // 아무것도 입력 안했을 때 기본으로 입력되는 값
  //   default: 'default value',
  //   // 칼럼중에서 유일무이한 값이 돼야 하는지
  //   unique: false,
  // })
  // title: string;

  @Column({
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  // @CreateDateColumn(): 데이터가 생성되는 날짜와 시간이 자동으로 저장된다.
  @CreateDateColumn()
  createdAt: Date;

  // @UpdateDateColumn(): 데이터가 업데이트되는 날짜와 시간이 자동으로 저장된다.
  @UpdateDateColumn()
  updatedAt: Date;

  // @VersionColumn(): 데이터가 업데이트 될때마다 1씩 올라간다.
  // 처음 생성시 값은 1, save() 함수가 몇 번 호출되었는지 기억한다.
  @VersionColumn()
  version: number;

  // @Generated('uuid'): 데이터가 생성될 때 랜덤한 uuid값을 생성한다.
  @Column()
  @Generated('uuid')
  additionalId: number;

  @OneToOne(() => ProfileModel, (profile) => profile.user, {
    // find() 실행 할때마다 항상 같이 가져올 relation
    eager: false,
    // 저장할때 relation을 한번에 같이 저장 가능
    cascade: true,
    // null이 가능한지
    nullable: true,
    // 관계가 삭제됐을 때
    // no action -> 아무것도 안함
    // cascade -> 참조하는 Row도 같이 삭제
    // set null -> 잠조하는 Row에서 참조 id를 null로 변경
    // set default -> 기본 세팅으로 설정(테이블의 기본 세팅)
    // restrict -> 참조하고 있는 Row가 있는 경우 참조 당하는 Row삭제 불가
    onDelete: 'RESTRICT',
  })
  @JoinColumn()
  profile: ProfileModel;

  @OneToMany(() => PostModel, (post) => post.author)
  posts: PostModel[];
}
