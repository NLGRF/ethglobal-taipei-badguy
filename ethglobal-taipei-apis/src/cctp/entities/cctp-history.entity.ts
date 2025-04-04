import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cctp_history')
export class CctpHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceChain: string;

  @Column()
  destinationChain: string;

  @Column()
  sourceAddress: string;

  @Column()
  destinationAddress: string;

  @Column()
  amount: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  transactionHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
