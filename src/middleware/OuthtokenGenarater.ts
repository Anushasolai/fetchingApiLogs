import axios, { AxiosError } from "axios";
import qs from "qs";
import { RefreshToken } from "../entities/RefreshToken";
import { AppSource } from "../datasource";

require("dotenv").config();

interface OAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

const generateRefreshToken = async () => {
  try {
    const response = await axios.post<OAuthResponse>(
      "https://accounts.zoho.com/oauth/v2/token",
      qs.stringify({
        grant_type: "authorization_code",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: process.env.AUTH_CODE,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("OAuth response:", response.data);

    if (!response.data.refresh_token) {
      throw new Error("No refresh token in response");
    }

    const refreshTokenRepository = AppSource.getRepository(RefreshToken);
    const refreshToken = new RefreshToken();
    refreshToken.token = response.data.refresh_token;
    await refreshTokenRepository.save(refreshToken);

    console.log("Refresh token saved successfully.");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`Axios error: ${axiosError.message}`, axiosError.response?.data);
      throw new Error(`Axios error: ${axiosError.message}`);
    } else {
      const unknownError = error as Error;
      console.error(`Error getting OAuth token: ${unknownError.message}`);
      throw new Error(`Error getting OAuth token: ${unknownError.message}`);
    }
  }
};

generateRefreshToken().catch(console.error);

const getOAuthToken = async (): Promise<string> => {
  const refreshTokenRepository = AppSource.getRepository(RefreshToken);
  const refreshToken = await refreshTokenRepository.findOne({ where: {} });

  if (!refreshToken) {
    throw new Error("Refresh token not found. Please generate it first.");
  }

  try {
    const response = await axios.post<OAuthResponse>(
      "https://accounts.zoho.com/oauth/v2/token",
      qs.stringify({
        grant_type: "refresh_token",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: refreshToken.token,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("OAuth response:", response.data);

    if (!response.data.access_token) {
      throw new Error("No access token in response");
    }

    console.log(response.data.access_token);
    return response.data.access_token;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`Axios error: ${axiosError.message}`, axiosError.response?.data);
      throw new Error(`Axios error: ${axiosError.message}`);
    } else {
      const unknownError = error as Error;
      console.error(`Error getting OAuth token: ${unknownError.message}`);
      throw new Error(`Error getting OAuth token: ${unknownError.message}`);
    }
  }
};

export default getOAuthToken;
