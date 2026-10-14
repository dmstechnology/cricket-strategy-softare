// Frontend-only validation helpers for the demo forms.

export const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

export function isValidNumber(v) {
  if (isBlank(v)) return false;
  return Number.isFinite(Number(v));
}

export function toNumberOrNull(v) {
  return isValidNumber(v) ? Number(v) : null;
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

export const isMobile = (v) => /^[+]?[0-9\s-]{10,15}$/.test(String(v).trim());

export const isUsername = (v) => /^[a-zA-Z0-9_.]{3,20}$/.test(String(v).trim());

export function passwordIssues(pw = '') {
  const issues = [];
  if (pw.length < 8) issues.push('at least 8 characters');
  if (!/[A-Z]/.test(pw)) issues.push('an uppercase letter');
  if (!/[a-z]/.test(pw)) issues.push('a lowercase letter');
  if (!/[0-9]/.test(pw)) issues.push('a number');
  return issues;
}

// Cricket overs are written as O.B where B (balls) is 0-5.
export function isValidOvers(v) {
  if (!isValidNumber(v)) return false;
  const n = Number(v);
  if (n < 0 || n > 450) return false;
  const balls = Math.round((n - Math.floor(n)) * 10);
  return balls >= 0 && balls <= 5;
}

export function oversToBalls(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const whole = Math.floor(n);
  const balls = Math.round((n - whole) * 10);
  return whole * 6 + balls;
}

export function maxOversForFormat(format) {
  if (format === 'T20') return 20;
  if (format === 'ODI') return 50;
  return 450;
}

// Returns an errors object for a manual score update.
export function validateScoreUpdate({ score, wickets, overs }, format) {
  const errors = {};
  if (!isValidNumber(score) || Number(score) < 0 || !Number.isInteger(Number(score))) {
    errors.score = 'Enter runs as a whole number (0 or more).';
  }
  if (!isValidNumber(wickets) || !Number.isInteger(Number(wickets)) || Number(wickets) < 0 || Number(wickets) > 10) {
    errors.wickets = 'Wickets must be a whole number from 0 to 10.';
  }
  if (!isValidOvers(overs)) {
    errors.overs = 'Overs must be like 12.3 (balls 0–5 after the decimal).';
  } else if (Number(overs) > maxOversForFormat(format)) {
    errors.overs = `A ${format} innings cannot exceed ${maxOversForFormat(format)} overs.`;
  }
  return errors;
}
