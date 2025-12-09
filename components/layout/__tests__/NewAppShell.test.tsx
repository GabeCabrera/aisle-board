
import React from 'react';
import { render, screen } from '@testing-library/react';
import NewAppShell from '@/components/layout/NewAppShell';
import { useSession } from 'next-auth/react';

// Mock ESM modules
jest.mock('react-markdown', () => (props: any) => {
  return <div className={props.className}>{props.children}</div>;
});
jest.mock('remark-gfm', () => () => {});

// Mock next-auth
jest.mock('next-auth/react');
const mockedUseSession = useSession as jest.Mock;

// Mock the browser context
jest.mock('@/components/layout/browser-context', () => ({
  ...jest.requireActual('@/components/layout/browser-context'),
  useBrowser: () => ({
    openTool: jest.fn(),
    goHome: jest.fn(),
    activeTabId: 'chat', // Mock active tab for testing purposes
    tabs: [],
  }),
  tools: [ // Mock the tools array as it's used in NewAppShell
    { id: 'dashboard', label: 'Dashboard', icon: () => <svg /> },
    { id: 'budget', label: 'Budget', icon: () => <svg /> },
  ]
}));

describe('NewAppShell', () => {
  it('renders the main components', () => {
    // Mock the session
    mockedUseSession.mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });

    render(<NewAppShell><div>Test Children</div></NewAppShell>);

    // Check for the main title (sidebar title, more specific selection)
    expect(screen.getByText('Scribe & Stem', { selector: '.font-serif.text-2xl' })).toBeInTheDocument();

    // Check for the child content
    expect(screen.getByText('Test Children')).toBeInTheDocument();

    // Check for a navigation item
    expect(screen.getByText('Chat')).toBeInTheDocument();
  });
});
