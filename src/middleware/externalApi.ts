import getOAuthToken from "./OuthtokenGenarater"; 
import axios, { AxiosError } from "axios";
require("dotenv").config();

const API_BASE_URL = "https://www.zohoapis.com/crm/v6/settings/profiles"; 

export const fetchProfiles = async (): Promise<any[]> => {
  const accessToken = await getOAuthToken();
  try {
    const response = await axios.get(
      `${API_BASE_URL}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );
    return response.data.profiles;
  } catch (error: any) {
    handleApiError(error);
    throw new Error("Failed to fetch profiles");
  }
};

const handleApiError = (error: AxiosError) => {
  if (axios.isAxiosError(error)) {
    console.error(
      "API Request Failed:",
      error.response?.status,
      error.response?.data
    );
    throw new Error(`API Request Failed: ${error.message}`);
  } else {
    console.error("Error:", error);
    throw new Error(`Error: ${error}`);
  }
};
