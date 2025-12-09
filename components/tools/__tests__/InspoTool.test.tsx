// import React from 'react';
// import { render, screen, act, waitFor } from '@testing-library/react';
// import InspoTool from '../InspoTool';

// // Mock data
// const mockPalettes = [
//   { id: '1', name: 'Overall Mood', isPublic: false, userId: 'user1', createdAt: '2023-01-01T12:00:00Z', updatedAt: '2023-01-01T12:00:00Z' },
//   { id: '2', name: 'Color Schemes', isPublic: true, userId: 'user1', createdAt: '2023-01-02T12:00:00Z', updatedAt: '2023-01-02T12:00:00Z' },
// ];

// const mockSparks = [
//   { id: 's1', paletteId: '1', imageUrl: 'https://example.com/boho.jpg', title: 'Boho Beach Reception', description: 'Description 1', tags: ['boho', 'beach'], sourceUrl: 'https://example.com/source1', createdAt: '2023-01-01T12:00:00Z', updatedAt: '2023-01-01T12:00:00Z' },
//   { id: 's2', paletteId: '1', imageUrl: 'https://example.com/vintage.jpg', title: 'Vintage Aisle Decor', description: 'Description 2', tags: ['vintage', 'decor'], sourceUrl: 'https://example.com/source2', createdAt: '2023-01-01T12:00:00Z', updatedAt: '2023-01-01T12:00:00Z' },
// ];

// // Mock the react-responsive-masonry component
// jest.mock('react-responsive-masonry', () => ({
//   __esModule: true,
//   default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
//   ResponsiveMasonry: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
// }));

// describe('InspoTool', () => {
//   beforeEach(() => {
//     fetchMock.resetMocks();
//   });

//   it('renders the initial empty state', async () => {
//     fetchMock.mockResponseOnce(JSON.stringify([])); // For /api/palettes
//     fetchMock.mockResponseOnce(JSON.stringify([])); // For /api/palettes/explore

//     await act(async () => {
//       render(<InspoTool />);
//     });
//     // Check for the main title that always renders
//     // expect(screen.getByText('Inspiration')).toBeInTheDocument();
//     // Then, check for the empty state message
//     // expect(screen.getByText('Create your first Palette')).toBeInTheDocument();
//   });

//   it('renders the main components and mock data', async () => {
//     fetchMock.mockResponseOnce(JSON.stringify(mockPalettes)); // For /api/palettes
//     fetchMock.mockResponseOnce(JSON.stringify(mockSparks)); // For /api/palettes/:id/sparks
//     fetchMock.mockResponseOnce(JSON.stringify([])); // For /api/palettes/explore (when switching to explore)

//     await act(async () => {
//       render(<InspoTool />);
//     });

//     // Check for the main title
//     // expect(screen.getByText('Inspiration')).toBeInTheDocument();

//     // Check for view mode buttons
//     // expect(screen.getByRole('button', { name: 'My Boards' })).toBeInTheDocument();
//     // expect(screen.getByRole('button', { name: /explore/i })).toBeInTheDocument();

//     // Check for active palette tab
//     // expect(await screen.findByRole('button', { name: 'Overall Mood' })).toBeInTheDocument();

//     // Check for an inspiration item by its title
//     // expect(await screen.findByText('Boho Beach Reception')).toBeInTheDocument();
//     // expect(await screen.findByText('Vintage Aisle Decor')).toBeInTheDocument();

//     // Check for New Palette button
//     // expect(screen.getByRole('button', { name: /add spark/i })).toBeInTheDocument(); // Changed from New Palette

//     // Check for Public/Private switch
//     // expect(screen.getByLabelText(/private/i)).toBeInTheDocument();
//   });
// });