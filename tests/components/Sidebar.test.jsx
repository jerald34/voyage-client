// Voyage-Client/tests/components/Sidebar.test.jsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Sidebar from '../../app/components/navigation/Sidebar';

test('renders sidebar with navigation links', () => {
  render(<Sidebar />);
  expect(screen.getByText('Dashboard')).toBeDefined();
  expect(screen.getByText('Clients')).toBeDefined();
});
