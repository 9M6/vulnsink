// Example vulnerable code for testing VulnSink

import { createConnection } from 'mysql';

// SQL Injection vulnerability
export function getUserById(userId: string) {
  const connection = createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb',
  });

  // VULNERABLE: Direct string interpolation in SQL query
  const query = `SELECT * FROM users WHERE id = ${userId}`;

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

// XSS vulnerability
export function renderUserProfile(userName: string) {
  // VULNERABLE: Unsanitized user input in HTML
  return `<div class="profile">
    <h1>Welcome, ${userName}!</h1>
  </div>`;
}

// Command Injection vulnerability
export function pingHost(host: string) {
  const { exec } = require('child_process');

  // VULNERABLE: Unsanitized user input in shell command
  exec(`ping -c 4 ${host}`, (error: any, stdout: any, stderr: any) => {
    console.log(stdout);
  });
}

// Path Traversal vulnerability
export function readUserFile(filename: string) {
  const fs = require('fs');

  // VULNERABLE: No path validation
  const path = `/var/data/${filename}`;

  return fs.readFileSync(path, 'utf-8');
}
