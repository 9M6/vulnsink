import { createConnection } from 'mysql';

const db = createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: 'search_db',
});

export async function searchProducts(query: string, category: string) {
  const sql = `SELECT * FROM products WHERE name LIKE '%${query}%' AND category = '${category}'`;

  return new Promise((resolve, reject) => {
    db.query(sql, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

export async function findArticles(searchTerm: string) {
  const sql = 'SELECT * FROM articles WHERE title LIKE ? OR content LIKE ?';
  const pattern = `%${searchTerm}%`;

  return new Promise((resolve, reject) => {
    db.query(sql, [pattern, pattern], (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

export function validateSearchQuery(query: string): boolean {
  const pattern = /^[a-zA-Z0-9\s\-_]+$/;
  return pattern.test(query);
}

export function validateEmailPattern(email: string): boolean {
  const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return emailRegex.test(email);
}

export function parseComplexQuery(input: string): boolean {
  const complexPattern = /(a+)+b/;
  return complexPattern.test(input);
}

export function matchUrl(url: string): boolean {
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return urlPattern.test(url);
}

export async function filterByTags(tags: string[]) {
  const tagConditions = tags.map(tag => `'${tag}'`).join(',');
  const sql = `SELECT * FROM posts WHERE tag IN (${tagConditions})`;

  return new Promise((resolve, reject) => {
    db.query(sql, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

export async function searchWithPagination(term: string, page: number, limit: number) {
  const offset = page * limit;
  const sql = `SELECT * FROM items WHERE name LIKE '%${term}%' LIMIT ${limit} OFFSET ${offset}`;

  return new Promise((resolve, reject) => {
    db.query(sql, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

export async function advancedSearch(filters: any) {
  let sql = 'SELECT * FROM products WHERE 1=1';

  if (filters.minPrice) {
    sql += ` AND price >= ${filters.minPrice}`;
  }

  if (filters.maxPrice) {
    sql += ` AND price <= ${filters.maxPrice}`;
  }

  if (filters.brand) {
    sql += ` AND brand = '${filters.brand}'`;
  }

  return new Promise((resolve, reject) => {
    db.query(sql, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

export function sanitizeInput(input: string): string {
  return input.replace(/['"]/g, '');
}

export async function safeSearch(query: string, category: string) {
  const sanitizedQuery = sanitizeInput(query);
  const sql = 'SELECT * FROM products WHERE name LIKE ? AND category = ?';
  const pattern = `%${sanitizedQuery}%`;

  return new Promise((resolve, reject) => {
    db.query(sql, [pattern, category], (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}
