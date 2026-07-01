import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "schema.prisma",
  migrations: {
    path: "migrations",
  },
  datasource: {
    url: process.env["MESSAGES_DATABASE_URL"] ?? process.env["DATABASE_URL"],
  },
});
