import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";

// Force load the .env file right away
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Now we can safely grab it from the standard process.env
    url: process.env.DATABASE_URL as string, 
  },
});