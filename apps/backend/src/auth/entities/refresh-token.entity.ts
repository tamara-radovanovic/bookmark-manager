import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  token_hash!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "timestamp" })
  expires_at!: Date;

  @CreateDateColumn()
  created_at!: Date;
}
