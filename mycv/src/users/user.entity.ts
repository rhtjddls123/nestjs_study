import { Exclude } from 'class-transformer';
import {
  AfterInsert,
  AfterUpdate,
  BeforeRemove,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  @Exclude()
  password: string;

  @AfterInsert()
  logInsert() {
    console.log('Inserted User with id', this.id);
  }

  @AfterUpdate()
  logUpdate() {
    console.log('Updated User with id', this.id);
  }

  @BeforeRemove()
  logRemove() {
    console.log('Removed User with id', this.id);
  }
}
