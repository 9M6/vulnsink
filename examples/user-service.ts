import { createConnection } from 'mysql';
import * as bcrypt from 'bcrypt';

const db = createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: 'app_db',
});

export async function findUserByEmail(email: string) {
  const query = `SELECT * FROM users WHERE email = '${email}'`;

  return new Promise((resolve, reject) => {
    db.query(query, (error, results) => {
      if (error) reject(error);
      else resolve(results[0]);
    });
  });
}

export async function getUserById(id: number) {
  const query = 'SELECT * FROM users WHERE id = ?';

  return new Promise((resolve, reject) => {
    db.query(query, [id], (error, results) => {
      if (error) reject(error);
      else resolve(results[0]);
    });
  });
}

export async function searchUsers(searchTerm: string) {
  const query = `SELECT id, username, email FROM users WHERE username LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%'`;

  return new Promise((resolve, reject) => {
    db.query(query, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

export async function updateUserProfile(userId: number, data: any) {
  const fields = Object.keys(data).map(key => `${key} = '${data[key]}'`).join(', ');
  const query = `UPDATE users SET ${fields} WHERE id = ${userId}`;

  return new Promise((resolve, reject) => {
    db.query(query, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

export async function deleteUser(userId: string) {
  const query = 'DELETE FROM users WHERE id = ?';

  return new Promise((resolve, reject) => {
    db.query(query, [userId], (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

export async function getUsersByRole(role: string) {
  const allowedRoles = ['admin', 'user', 'moderator'];

  if (!allowedRoles.includes(role)) {
    throw new Error('Invalid role');
  }

  const query = `SELECT * FROM users WHERE role = '${role}'`;

  return new Promise((resolve, reject) => {
    db.query(query, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}
