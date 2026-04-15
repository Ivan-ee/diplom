import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Мок upload
vi.mock('@/lib/upload', () => ({
  uploadFileToMinio: vi.fn(),
}));

// Мок next/image
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    const { fill: _fill, ...rest } = props;
    return <img {...rest} />;
  },
}));

// Мок @dnd-kit — изолируем от drag-and-drop для юнит-тестов
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  PointerSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  rectSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  arrayMove: vi.fn((arr: unknown[], from: number, to: number) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}));

// Мок sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { ProductPhotoManager } from '../ProductPhotoManager';

describe('ProductPhotoManager', () => {
  const noop = vi.fn();

  beforeEach(() => {
    noop.mockClear();
  });

  it('рендерит drop zone когда photos пуст', () => {
    render(<ProductPhotoManager photos={[]} onChange={noop} />);
    expect(screen.getByText(/перетащите фото/i)).toBeInTheDocument();
  });

  it('рендерит превью-картинки для каждого URL в photos', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
    ];
    render(<ProductPhotoManager photos={photos} onChange={noop} />);
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', photos[0]);
    expect(images[1]).toHaveAttribute('src', photos[1]);
  });

  it('первое фото имеет badge "Главное"', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
    ];
    render(<ProductPhotoManager photos={photos} onChange={noop} />);
    expect(screen.getByText('Главное')).toBeInTheDocument();
  });

  it('клик по кнопке удаления вызывает onChange без этого URL', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
    ];
    render(<ProductPhotoManager photos={photos} onChange={noop} />);
    const deleteButtons = screen.getAllByLabelText(/удалить фото/i);
    expect(deleteButtons).toHaveLength(2);
    fireEvent.click(deleteButtons[0]);
    expect(noop).toHaveBeenCalledOnce();
    expect(noop).toHaveBeenCalledWith(['https://example.com/photo2.jpg']);
  });

  it('drop zone скрыта при достижении maxPhotos', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
    ];
    render(<ProductPhotoManager photos={photos} onChange={noop} maxPhotos={2} />);
    expect(screen.queryByText(/перетащите фото/i)).not.toBeInTheDocument();
  });
});
