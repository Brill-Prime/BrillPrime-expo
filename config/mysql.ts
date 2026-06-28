import mysql from 'mysql2/promise';
import Constants from 'expo-constants';

const host = process.env.EXPO_PUBLIC_MYSQL_HOST || Constants.expoConfig?.extra?.mysqlHost || process.env.MYSQL_HOST || '127.0.0.1';
const port = parseInt(process.env.EXPO_PUBLIC_MYSQL_PORT || Constants.expoConfig?.extra?.mysqlPort || process.env.MYSQL_PORT || '3306', 10);
const user = process.env.EXPO_PUBLIC_MYSQL_USER || Constants.expoConfig?.extra?.mysqlUser || process.env.MYSQL_USER || 'bravo';
const password = process.env.EXPO_PUBLIC_MYSQL_PASSWORD || Constants.expoConfig?.extra?.mysqlPassword || process.env.MYSQL_PASSWORD || 'bravo_pass';
const database = process.env.EXPO_PUBLIC_MYSQL_DATABASE || Constants.expoConfig?.extra?.mysqlDatabase || process.env.MYSQL_DATABASE || 'brillprime';

export const mysqlPool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default mysqlPool;
