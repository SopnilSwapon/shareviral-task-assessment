import { renderHook, act } from '@testing-library/react-native';
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
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    // Update value prop
    await rerender({ value: 'updated', delay: 300 });

    // Instantly check (should still be initial due to debounce)
    expect(result.current).toBe('initial');

    // Advance time by 200ms (not yet 300ms)
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('initial');

    // Advance time by another 100ms (total 300ms)
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('updated');
  });

  it('should debounce multiple quick consecutive changes', async () => {
    const { result, rerender } = await renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    // Consecutively change prop
    await rerender({ value: 'change1', delay: 300 });
    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe('initial');

    await rerender({ value: 'change2', delay: 300 });
    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe('initial'); // 300ms from start, but reset by change2

    // Advance 150ms more (total 300ms from change2)
    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe('change2');
  });
});
