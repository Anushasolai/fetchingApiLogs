import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProfileStatus } from './ProfileStatus';

@Entity()
export class Profile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    zohoProfileId: string;

    @Column()
    displayLabel: string;

    @Column({ type: 'timestamp', nullable: true })
    createdTime: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    modifiedTime: Date | null;

    @Column()
    custom: boolean;

    @OneToMany(() => ProfileStatus, (profileStatus) => profileStatus.profile)
    statuses: ProfileStatus[];
}
