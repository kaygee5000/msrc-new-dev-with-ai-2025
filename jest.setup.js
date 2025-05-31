// Import Jest DOM matchers
import '@testing-library/jest-dom';
import React from 'react';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/dashboard/admin/rtp',
  useParams: () => ({}),
  useSearchParams: () => ({
    get: jest.fn()
  })
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }) => {
    return React.createElement('a', { href }, children);
  };
});

// Set up global fetch mock
global.fetch = jest.fn();

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
