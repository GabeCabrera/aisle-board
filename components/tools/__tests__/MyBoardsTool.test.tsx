import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MyBoardsTool from '../MyBoardsTool';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock IdeaList sub-component to avoid complex nested rendering
jest.mock('../inspo-tool/IdeaList', () => ({
  IdeaList: ({ board }: { board: any }) => (
    <div data-testid="idea-list">
      Idea List for {board.name}
    </div>
  ),
}));

// Mock fetch
const fetchMock = global.fetch as jest.Mock;

describe('MyBoardsTool', () => {
  const mockInitialBoards = [
    { id: '1', name: 'Wedding Dress', isPublic: false, tenantId: 't1', createdAt: new Date(), updatedAt: new Date(), description: '', position: 0, viewCount: 0 },
    { id: '2', name: 'Venue Ideas', isPublic: true, tenantId: 't1', createdAt: new Date(), updatedAt: new Date(), description: '', position: 1, viewCount: 0 },
  ];

  beforeEach(() => {
    fetchMock.mockClear();
    mockPush.mockClear();
  });

  it('renders with initial boards', () => {
    render(<MyBoardsTool initialBoards={mockInitialBoards} />);
    
    expect(screen.getByText('My Boards')).toBeInTheDocument();
    expect(screen.getByText('Wedding Dress')).toBeInTheDocument();
    expect(screen.getByText('Venue Ideas')).toBeInTheDocument();
    
    // Should show the first board's content by default
    expect(screen.getByText('Idea List for Wedding Dress')).toBeInTheDocument();
  });

  it('navigates to explore page when explore button is clicked', () => {
    render(<MyBoardsTool initialBoards={mockInitialBoards} />);
    
    const exploreBtn = screen.getByText('Explore Ideas');
    fireEvent.click(exploreBtn);
    
    expect(mockPush).toHaveBeenCalledWith('/planner/inspo/explore');
  });

  it('switches active board when tab is clicked', () => {
    render(<MyBoardsTool initialBoards={mockInitialBoards} />);
    
    // Initially showing first board
    expect(screen.getByText('Idea List for Wedding Dress')).toBeInTheDocument();
    
    // Click second board
    const secondBoardBtn = screen.getByText('Venue Ideas');
    fireEvent.click(secondBoardBtn);
    
    // Should now show second board
    expect(screen.getByText('Idea List for Venue Ideas')).toBeInTheDocument();
  });

  it('opens create board dialog', () => {
    render(<MyBoardsTool initialBoards={mockInitialBoards} />);
    
    // Find the "New Board" button (it's hidden on md screens in the code, but visible in test env usually, 
    // but there is a mobile one "New Palette" -> "New Board" in text now)
    // Actually the code has: <Button variant="outline" ...> <Plus ... /> New Board </Button>
    const newBoardBtns = screen.getAllByText('New Board');
    fireEvent.click(newBoardBtns[0]);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create a New Board')).toBeInTheDocument();
  });

  it('handles empty state', () => {
    render(<MyBoardsTool initialBoards={[]} />);
    
    expect(screen.getByText('Create your first Board')).toBeInTheDocument();
    expect(screen.getByText('Boards are where you can save and organize your ideas. Create one for your Venue, Dress, Cake, or anything else!')).toBeInTheDocument();
  });
});
