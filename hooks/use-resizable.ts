'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseResizableOptions {
  initialSize: number;
  minSize: number;
  maxSize: number;
  direction?: 'horizontal' | 'vertical';
  reverse?: boolean; // If dragging from the right or bottom
  onResize?: (size: number) => void;
}

export function useResizable({
  initialSize,
  minSize,
  maxSize,
  direction = 'horizontal',
  reverse = false,
  onResize,
}: UseResizableOptions) {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(initialSize);

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
      startSizeRef.current = size;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    },
    [direction, size]
  );

  useEffect(() => {
    if (!isDragging) return;

    // Prevent iframes from swallowing mouse events during resize
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((f) => {
      f.style.pointerEvents = 'none';
    });

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = reverse
        ? startPosRef.current - currentPos
        : currentPos - startPosRef.current;

      const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + delta));
      setSize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      iframes.forEach((f) => {
        f.style.pointerEvents = '';
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      iframes.forEach((f) => {
        f.style.pointerEvents = '';
      });
    };
  }, [isDragging, direction, minSize, maxSize, reverse, onResize]);

  return {
    size,
    setSize,
    isDragging,
    startDrag,
  };
}
