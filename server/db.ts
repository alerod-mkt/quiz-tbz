import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Configuração para o banco PostgreSQL do usuário
const dbConfig = {
  host: '185.143.228.72',
  port: 5432,
  user: 'postgres',
  password: 'ro3006di',
  database: 'quiz_app',
};

console.log(`🔗 Conectando ao PostgreSQL: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

export const pool = new Pool({
  ...dbConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: false
});

export const db = drizzle(pool, { schema });