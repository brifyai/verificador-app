import path from "node:path";
import { defineConfig } from "prisma/config";

// Cargar variables de entorno
import "dotenv/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx --require dotenv/config scripts/seed.ts"
  }
});