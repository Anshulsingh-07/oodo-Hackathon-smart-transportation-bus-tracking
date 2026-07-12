import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../src/app';

describe('App Component', () => {
  test('renders the main application', () => {
    render(<App />);
    const linkElement = screen.getByText(/Welcome to TransitOps/i);
    expect(linkElement).toBeInTheDocument();
  });
});