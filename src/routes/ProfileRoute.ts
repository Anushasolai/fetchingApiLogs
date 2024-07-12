import { Router } from 'express';
import {
    syncProfilesController,
    updateProfileStatusController,
    getProfileByIdController,
    getAllProfilesController,
    deleteProfileByIdController,
    deleteProfileStatusByIdController,
} from '../controllers/ProfileController';
import { rateLimiterMiddleware } from '../utils/rateLimiter';

const router = Router();

router.post('/sync', rateLimiterMiddleware, syncProfilesController);
router.put('/status', rateLimiterMiddleware, updateProfileStatusController);
router.get('/:profileId', rateLimiterMiddleware, getProfileByIdController);
router.get('/', rateLimiterMiddleware, getAllProfilesController); 
router.delete('/profile/:profileId', rateLimiterMiddleware, deleteProfileByIdController);
router.delete('/profile-status/:profileStatusId', rateLimiterMiddleware, deleteProfileStatusByIdController);

export default router;
