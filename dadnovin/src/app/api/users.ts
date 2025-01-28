import mysql from "mysql2/promise";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  if (req.method === "GET") {
    const [rows] = await db.execute("SELECT * FROM users");
    res.status(200).json(rows);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
