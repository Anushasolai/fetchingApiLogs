import { DataSource } from "typeorm";
import { Profile } from "./entities/Profile";
import { ProfileStatus } from "./entities/ProfileStatus";
import { RefreshToken } from "./entities/RefreshToken";

require("dotenv").config();

export const AppSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOSTNAME,
  port: Number(process.env.DB_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  logging: false,
  entities: [Profile, ProfileStatus,RefreshToken],
  migrations: ["src/migrations/**/*.ts"],
});

export const checkConnection = async () => {
  try {
    await AppSource.initialize();
    console.log("Successfully Connected to DB");
  } catch (error) {
    console.log("Cannot Connect to DB", error);
  }
};
