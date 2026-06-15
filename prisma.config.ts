import { defineConfig } from "prisma/config";

try {
  require("dotenv").config();
} catch (e) {}

const url = process.env.DATABASE_URL || process.env.database_url;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: url || "postgresql://dummy:dummy@localhost:5432/dummy",
  },
});
