import { Profile } from "../entities/Profile";
import { ProfileStatus } from "../entities/ProfileStatus";
import { ProfileStatusType } from "../entities/enum";
import { AppSource } from "../datasource";
import { logger } from "../utils/logger";
import { WebSocketServer } from "../websocket/ProfileWebSocket";

export const updateProfileStatus = async (
    profileId: string,
    status: ProfileStatusType,
    failureReason?: string,
    retryCount?: number
) => {
    const profileRepository = AppSource.getRepository(Profile);
    const profileStatusRepository = AppSource.getRepository(ProfileStatus);

    try {
        const profile = await profileRepository.findOne({
            where: { zohoProfileId: profileId },
            relations: ["statuses"],
        });

        if (!profile) {
            throw new Error("Profile not found");
        }

        const profileStatus = new ProfileStatus();
        profileStatus.profile = profile;
        profileStatus.status = status;
        profileStatus.failureReason = failureReason || "";

        if (status === ProfileStatusType.Retrying) {
            profileStatus.retryCount = (retryCount || 0) + 1;
        } else {
            profileStatus.retryCount = retryCount || 0;
        }

        await profileStatusRepository.save(profileStatus);

        logger.info(`Profile status updated: ${profile.displayLabel} (ID: ${profile.zohoProfileId}) to status ${status}`);
        WebSocketServer.sendUserGroupStatusUpdate(profile);
    } catch (error) {
        logger.error(`Error updating profile status ${profileId}: ${error}`);
        throw error;
    }
};

const MAX_RETRY_COUNT = 3;
const RETRY_INTERVAL_MS = 5000; 

export const retryProfileStatusUpdate = async (
  profileId: string,
  status: ProfileStatusType,
  failureReason?: string,
  currentRetryCount: number = 0
) => {
  try {
    if (currentRetryCount >= MAX_RETRY_COUNT) {
      await updateProfileStatus(profileId, ProfileStatusType.Failed, `Failed after ${MAX_RETRY_COUNT} retries`);
      return;
    }

    await updateProfileStatus(profileId, ProfileStatusType.Retrying, failureReason, currentRetryCount);

   
    processProfile(profileId);

    await updateProfileStatus(profileId, ProfileStatusType.Completed);
  } catch (error: any) {
    logger.error(`Error updating profile status for profileId: ${profileId}, retry count: ${currentRetryCount}, error: ${error.message}`);

    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
    await retryProfileStatusUpdate(profileId, status, failureReason, currentRetryCount + 1);
  }
};






function processProfile(profileId: string) {
    throw new Error("Function not implemented.");
}

