// Security utilities for input validation and sanitization

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Accept international format: +1234567890
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .trim()
    .slice(0, 500); // Limit length
};

export const sanitizeName = (name: string): string => {
  return name
    .replace(/[^a-zA-Z\s'-]/g, '') // Only allow letters, spaces, hyphens, apostrophes
    .trim()
    .slice(0, 100);
};

// Rate limiting using localStorage
export class RateLimiter {
  private key: string;
  private maxAttempts: number;
  private windowMs: number;

  constructor(key: string, maxAttempts: number = 5, windowMs: number = 60000) {
    this.key = `rate_limit_${key}`;
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  canAttempt(): boolean {
    const data = this.getData();
    const now = Date.now();
    
    // Clear old attempts outside the window
    const recentAttempts = data.attempts.filter(
      (timestamp: number) => now - timestamp < this.windowMs
    );
    
    if (recentAttempts.length >= this.maxAttempts) {
      const oldestAttempt = recentAttempts[0];
      const waitTime = Math.ceil((oldestAttempt + this.windowMs - now) / 1000);
      throw new Error(`Too many attempts. Please wait ${waitTime} seconds.`);
    }
    
    recentAttempts.push(now);
    this.setData({ attempts: recentAttempts });
    return true;
  }

  private getData(): { attempts: number[] } {
    try {
      const stored = localStorage.getItem(this.key);
      return stored ? JSON.parse(stored) : { attempts: [] };
    } catch {
      return { attempts: [] };
    }
  }

  private setData(data: { attempts: number[] }): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      // Ignore localStorage errors
    }
  }

  reset(): void {
    try {
      localStorage.removeItem(this.key);
    } catch {
      // Ignore localStorage errors
    }
  }
}

// Create rate limiters for different actions
export const authRateLimiter = new RateLimiter('auth', 5, 60000); // 5 attempts per minute
export const otpRateLimiter = new RateLimiter('otp', 3, 300000); // 3 attempts per 5 minutes
