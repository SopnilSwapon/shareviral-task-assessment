
import { act, renderHook } from '@testing-library/react-native';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', async () => {
    const { result } = await renderHook(() => useDebounce('hello', 300));

    expect(result.current).toBe('hello');
  });

  it('should update the value only after the delay has passed', async () => {
    const { result, rerender } = await renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    // Update value prop
    await rerender({ value: 'updated', delay: 300 });

    // Should still have old value before delay
    expect(result.current).toBe('initial');

    // Advance 200ms
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('initial');

    // Advance another 100ms (total 300ms)
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe('updated');
  });

  it('should debounce multiple quick consecutive changes', async () => {
    const { result, rerender } = await renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    // First change
    await rerender({ value: 'change1', delay: 300 });

    await act(async () => {
      jest.advanceTimersByTime(150);
    });

    expect(result.current).toBe('initial');

    // Second change resets timer
    await rerender({ value: 'change2', delay: 300 });

    await act(async () => {
      jest.advanceTimersByTime(150);
    });

    expect(result.current).toBe('initial');

    // Another 150ms (300ms after change2)
    await act(async () => {
      jest.advanceTimersByTime(150);
    });

    expect(result.current).toBe('change2');
  });
});