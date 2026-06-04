import { env } from '../config/env';

export const validateSql = (sql: string): { isValid: boolean; error?: string } => {
  const trimmed = sql.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'SQL query cannot be empty' };
  }

  if (env.ALLOW_WRITE_QUERIES) {
    return { isValid: true };
  }

  // Only allow specific keywords when write queries are disabled
  const allowedPrefixes = ['SELECT', 'PRAGMA', 'WITH'];
  const upperSql = trimmed.toUpperCase();
  
  const hasAllowedPrefix = allowedPrefixes.some(prefix => upperSql.startsWith(prefix));
  
  if (!hasAllowedPrefix) {
    return { 
      isValid: false, 
      error: 'Only SELECT, PRAGMA, and WITH queries are allowed when ALLOW_WRITE_QUERIES is false' 
    };
  }

  // Prevent chained queries via semicolon, unless the semicolon is at the very end
  const semicolonIndex = trimmed.indexOf(';');
  if (semicolonIndex !== -1 && semicolonIndex < trimmed.length - 1) {
    // Check if there are non-whitespace characters after the semicolon
    const afterSemicolon = trimmed.substring(semicolonIndex + 1).trim();
    if (afterSemicolon.length > 0) {
      return { 
        isValid: false, 
        error: 'Chained SQL queries are not allowed for security reasons' 
      };
    }
  }

  return { isValid: true };
};
