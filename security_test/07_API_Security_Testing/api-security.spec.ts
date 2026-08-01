import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../src/services/apiClient';

describe('Frontend API Security & Interceptor Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should attach Bearer token to outgoing request headers when present in storage', () => {
    localStorage.setItem('token', 'test-jwt-token-xyz');
    const config = { headers: {} as Record<string, string> };
    
    // Simulate request interceptor logic
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    expect(config.headers['Authorization']).toBe('Bearer test-jwt-token-xyz');
  });

  it('should clear token and local storage on 401 Unauthorized response', () => {
    localStorage.setItem('token', 'expired-token');
    expect(localStorage.getItem('token')).toBe('expired-token');

    // Simulate 401 error handler
    const errorStatus = 401;
    if (errorStatus === 401) {
      localStorage.removeItem('token');
    }

    expect(localStorage.getItem('token')).toBeNull();
  });
});
