import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Profile } from './Profile';
import { ProfileStatusType } from './enum';

@Entity()
export class ProfileStatus {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Profile, (profile) => profile.statuses)
    profile: Profile;

    @Column({
        type: 'enum',
        enum: ProfileStatusType,
    })
    status: ProfileStatusType;

    @Column({ nullable: true })
    failureReason: string;

    @Column({ default: 0 })
    retryCount: number;

    @CreateDateColumn()
    createdAt: Date; 
}
