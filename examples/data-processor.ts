import DOMPurify from 'dompurify';

export function renderUserProfile(username: string, bio: string) {
  return `
    <div class="profile">
      <h1>${username}</h1>
      <p>${bio}</p>
    </div>
  `;
}

export function displaySearchResults(query: string, results: any[]) {
  return `
    <div class="search-results">
      <h2>Results for: ${query}</h2>
      <ul>
        ${results.map(r => `<li>${r.title}</li>`).join('')}
      </ul>
    </div>
  `;
}

export function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input);
}

export function createCommentHtml(comment: string, author: string) {
  const sanitizedComment = sanitizeUserInput(comment);
  return `<div class="comment"><strong>${author}:</strong> ${sanitizedComment}</div>`;
}

export function generateBreadcrumb(path: string) {
  const parts = path.split('/');
  return parts.map(part => `<a href="#">${part}</a>`).join(' > ');
}

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  const regex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
  return regex.test(phone);
}

export function parseUserInput(input: string): any {
  try {
    return JSON.parse(input);
  } catch (error) {
    return null;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderNotification(message: string, type: string) {
  const escapedMessage = escapeHtml(message);
  return `<div class="notification ${type}">${escapedMessage}</div>`;
}

export function createDynamicScript(code: string): string {
  return `<script>${code}</script>`;
}

export function injectAnalytics(trackingId: string, customData: string) {
  return `<script>window.analytics.track('${trackingId}', ${customData});</script>`;
}
