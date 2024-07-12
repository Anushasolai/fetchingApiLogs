import { Request, Response } from 'express';
import { syncProfiles,updateProfileStatus, getProfileById, getAllProfiles, deleteProfileById, deleteProfileStatusById } from '../services/syncProfiles';
import { ProfileStatusType } from '../entities/enum';
import { logger } from '../utils/logger';

export const syncProfilesController = async (req: Request, res: Response) => {
    try {
        await syncProfiles();
        res.status(200).json({ message: 'Profiles synchronized successfully' });
    } catch (error: any) {
        logger.error(`Error synchronizing profiles: ${error.message}`);
        res.status(500).json({ message: 'Error synchronizing profiles', error: error.messagez });
    }
};

export const updateProfileStatusController = async (req: Request, res: Response) => {
    const { profileId, status, failureReason, retryCount } = req.body;

    try {
        await updateProfileStatus(profileId, status as ProfileStatusType, failureReason, retryCount);
        res.status(200).json({ message: 'Profile status updated successfully' });
    } catch (error: any) {
        logger.error(`Error updating profile status: ${error.message}`);
        res.status(500).json({ message: 'Error updating profile status', error: error});
    }
};

export const retryProfileController = async (req: Request, res: Response) => {
    const { profileId } = req.body;

    try {
        await (profileId);
        res.status(200).json({ message: 'Profile retry initiated successfully' });
    } catch (error: any) {
        logger.error(`Error retrying profile: ${error.message}`);
        res.status(500).json({ message: 'Error retrying profile', error: error });
    }
};

export const getProfileByIdController = async (req: Request, res: Response) => {
    const { profileId } = req.params;

    try {
        const profile = await getProfileById(profileId);
        if (!profile) {
            res.status(404).json({ message: 'Profile not found' });
        } else {
            res.status(200).json(profile);
        }
    } catch (error: any) {
        logger.error(`Error fetching profile: ${error.message}`);
        res.status(500).json({ message: 'Error fetching profile', error: error});
    }
};

export const getAllProfilesController = async (req: Request, res: Response) => {
    try {
        const profiles = await getAllProfiles();
        res.status(200).json(profiles);
    } catch (error: any) {
        logger.error(`Error fetching all profiles: ${error.message}`);
        res.status(500).json({ message: 'Error fetching all profiles', error: error });
    }
};

export const deleteProfileByIdController = async (req: Request, res: Response) => {
    const { profileId } = req.params;

    try {
        await deleteProfileById(profileId);
        res.status(200).json({ message: 'Profile deleted successfully' });
    } catch (error: any) {
        logger.error(`Error deleting profile: ${error.message}`);
        res.status(500).json({ message: 'Error deleting profile', error: error});
    }
};

export const deleteProfileStatusByIdController = async (req: Request, res: Response) => {
    const profileStatusId = parseInt(req.params.profileStatusId, 10);

    if (isNaN(profileStatusId)) {
        return res.status(400).json({ message: 'Invalid profile status ID' });
    }

    try {
        await deleteProfileStatusById(profileStatusId);
        res.status(200).json({ message: 'Profile status deleted successfully' });
    } catch (error: any) {
        logger.error(`Error deleting profile status: ${error.message}`);
        res.status(500).json({ message: 'Error deleting profile status', error: error });
    }
};
