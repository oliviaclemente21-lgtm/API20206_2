import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const conmysql = createPool({
    host: process.env.BD_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.BD_DATABASE || 'base2026',
    port: Number(process.env.DB_PORT) || 3306
});