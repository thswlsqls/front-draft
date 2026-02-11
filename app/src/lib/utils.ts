import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters with 2+ types (uppercase, lowercase, digit, special character).";
  }

  let categories = 0;
  if (/[A-Z]/.test(password)) categories++;
  if (/[a-z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[^A-Za-z0-9]/.test(password)) categories++;

  if (categories < 2) {
    return "Password must be at least 8 characters with 2+ types (uppercase, lowercase, digit, special character).";
  }

  return null;
}

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address.";
  }
  return null;
}

export function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 50) {
    return "Username must be 3-50 characters.";
  }
  return null;
}
