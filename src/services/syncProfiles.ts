import { Profile } from "../entities/Profile";
import { ProfileStatus } from "../entities/ProfileStatus";
import { ProfileStatusType } from "../entities/enum";
import { fetchProfiles } from "../middleware/externalApi";
import { rateLimiter } from "../utils/rateLimiter";
import { logger } from "../utils/logger";
import { WebSocketServer } from "../websocket/ProfileWebSocket";
import { AppSource } from "../datasource";
import { updateProfileStatus, retryProfileStatusUpdate } from "../services/updateProfileStatus";

export const syncProfiles = async () => {
    const profileRepository = AppSource.getRepository(Profile);
    const profilesData = await fetchProfiles();

    for (const profileData of profilesData) {
        if (rateLimiter.tryRemoveToken()) {
            if (rateLimiter.tryIncreaseConcurrency()) {
                try {
                    let profile = await profileRepository.findOne({
                        where: { zohoProfileId: profileData.id },
                        relations: ["statuses"],
                    });

                    if (!profile) {
                        profile = new Profile();
                        profile.zohoProfileId = profileData.id;
                        profile.displayLabel = profileData.display_label;
                        profile.createdTime = new Date(); 
                        profile.modifiedTime = profile.createdTime;
                        profile.custom = profileData.custom;

                        await profileRepository.save(profile);
                        logger.info(`Profile created: ${profile.displayLabel} (ID: ${profile.zohoProfileId})`);
                    } else {
                        logger.info(`Profile already exists: ${profile.displayLabel} (ID: ${profile.zohoProfileId})`);
                    }

                   
                    await updateProfileStatus(profile.zohoProfileId, ProfileStatusType.InProgress);

                  
                    await processProfile(profileData, profile.zohoProfileId);

                    WebSocketServer.sendUserGroupStatusUpdate(profile);
                } catch (error: any) {
                    logger.error(`Error processing profile ${profileData.id}: ${error}`);
                    await retryProfileStatusUpdate(profileData.id, ProfileStatusType.Failed, error.message);
                } finally {
                    rateLimiter.decreaseConcurrency();
                }
            } else {
                logger.warn("Concurrency limit exceeded. Skipping request.");
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        } else {
            logger.warn("Rate limit exceeded. Skipping request.");
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
};

const processProfile = async (profileData:any, profileId: string) => {
    try {
        
        logger.info(`Processing profile ID: ${profileId}`);
        
         const isSuccess = Math.random() > 0.2; 

        if (isSuccess) {
         
            await updateProfileStatus(profileId, ProfileStatusType.Completed);
        } else {
            
            throw new Error("Profile processing failed due to some reason");
        }

        logger.info(`Profile processed successfully: ID ${profileId}`);
    } catch (error: any) {
       
        await updateProfileStatus(profileId, ProfileStatusType.Failed, error.message);

      
        const profileStatusRepository = AppSource.getRepository(ProfileStatus);
        const profileStatus = await profileStatusRepository.findOne({
            where: { profile: { zohoProfileId: profileId } },
            order: { createdAt: "DESC" }
        });

        const retryCount = profileStatus ? profileStatus.retryCount : 0;

        if (retryCount < 3) {
            logger.info(`Retrying profile: ID ${profileId}, retry count: ${retryCount + 1}`);
            await updateProfileStatus(profileId, ProfileStatusType.Retrying, error.message, retryCount + 1);
            setTimeout(() => processProfile(profileData, profileId), 5000); // Retry after 5 seconds
        } else {
            logger.error(`Maximum retry attempts reached for profile ID: ${profileId}`);
        }
    }
};
export { updateProfileStatus };


export const getProfileById = async (profileId: string) => {
    try {
        const profileRepository = AppSource.getRepository(Profile);
        return await profileRepository.findOne({
            where: { zohoProfileId: profileId },
            relations: ["statuses"],
        });
    } catch (error) {
        logger.error(`Error fetching profile ${profileId}: ${error}`);
        throw error;
    }
};


export const getAllProfiles = async () => {
    try {
        const profileRepository = AppSource.getRepository(Profile);
        return await profileRepository.find({ relations: ["statuses"] });
    } catch (error) {
        logger.error(`Error fetching all profiles: ${error}`);
        throw error;
    }
};


export const deleteProfileById = async (profileId: string) => {
    try {
        const profileRepository = AppSource.getRepository(Profile);

        const profile = await profileRepository.findOne({
            where: { zohoProfileId: profileId },
            relations: ["statuses"],
        });
        
        if (!profile) {
            throw new Error("Profile not found");
        }

        await profileRepository.remove(profile);
        logger.info(`Profile deleted: ${profile.displayLabel} (ID: ${profile.zohoProfileId})`);
    } catch (error) {
        logger.error(`Error deleting profile ${profileId}: ${error}`);
        throw error;
    }
};


export const deleteProfileStatusById = async (profileStatusId: number) => {
    try {
        const profileStatusRepository = AppSource.getRepository(ProfileStatus);

        const profileStatus = await profileStatusRepository.findOne({
            where: { id: profileStatusId },
            relations: ["profile"],
        });

        if (!profileStatus) {
            throw new Error("Profile status not found");
        }

        await profileStatusRepository.remove(profileStatus);
        logger.info(`Profile status deleted: ID ${profileStatusId}`);
    } catch (error) {
        logger.error(`Error deleting profile status ${profileStatusId}: ${error}`);
        throw error;
    }
};

