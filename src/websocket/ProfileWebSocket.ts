import WebSocket, { Server } from 'ws';
import { Profile } from '../entities/Profile';
import { logger } from '../utils/logger';

class ProfileWebSocket {
    private static instance: ProfileWebSocket;
    private wss: Server;

    private constructor() {
        this.wss = new Server({ noServer: true });

        this.wss.on('connection', (ws: WebSocket) => {
            ws.on('message', (message: string) => {
                logger.info(`Received message: ${message}`);
            });

            ws.send('Connected to ProfileWebSocket server');
        });

        logger.info('ProfileWebSocket server created');
    }

    public static getInstance(): ProfileWebSocket {
        if (!ProfileWebSocket.instance) {
            ProfileWebSocket.instance = new ProfileWebSocket();
        }
        return ProfileWebSocket.instance;
    }

    public getServer(): Server {
        return this.wss;
    }

    public sendUserGroupStatusUpdate(profile: Profile): void {
        const message = JSON.stringify({
            type: 'PROFILE_UPDATE',
            data: {
                profileId: profile.zohoProfileId,
                displayLabel: profile.displayLabel,
                status: 'updated'
            }
        });

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });

        logger.info(`WebSocket message sent for profile: ${profile.displayLabel} (ID: ${profile.zohoProfileId})`);
    }
}

export const WebSocketServer = ProfileWebSocket.getInstance();
