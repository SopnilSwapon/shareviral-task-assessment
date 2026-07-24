import { renderHook } from '@testing-library/react-native';
import { useFilteredSortedTasks } from '../hooks/useFilteredSortedTasks';
import { TaskWithStarred } from '../types';

describe('useFilteredSortedTasks', () => {
  const mockTasks: TaskWithStarred[] = [
    {
      id: '1',
      title: 'Buy Milk',
      description: 'Need grocery stuff',
      status: 'open',
      category_id: 'shopping',
      due_date: '2026-07-28T12:00:00Z',
      created_at: '2026-07-20T08:00:00Z',
      starred: false,
    },
    {
      id: '2',
      title: 'Finish Assignment',
      description: 'Expo, React Native code',
      status: 'done',
      category_id: 'work',
      due_date: '2026-07-24T18:00:00Z',
      created_at: '2026-07-22T09:00:00Z',
      starred: true,
    },
    {
      id: '3',
      title: 'Gym Workout',
      description: 'Leg day today',
      status: 'open',
      category_id: 'health',
      due_date: null,
      created_at: '2026-07-23T07:00:00Z',
      starred: false,
    },
  ];

  it('should return all tasks when filters are empty', async () => {
    const { result } = await renderHook(() =>
      useFilteredSortedTasks(mockTasks, '', null, 'all', 'created_at', 'desc')
    );
    expect(result.current).toHaveLength(3);
  });

  it('should filter tasks by search query', async () => {
    const { result: r1 } = await renderHook(() =>
      useFilteredSortedTasks(mockTasks, 'milk', null, 'all', 'created_at', 'desc')
    );
    expect(r1.current).toHaveLength(1);
    expect(r1.current[0].id).toBe('1');

    const { result: r2 } = await renderHook(() =>
      useFilteredSortedTasks(mockTasks, 'expo', null, 'all', 'created_at', 'desc')
    );
    expect(r2.current).toHaveLength(1);
    expect(r2.current[0].id).toBe('2');
  });

  it('should filter tasks by category_id', async () => {
    const { result } = await renderHook(() =>
      useFilteredSortedTasks(mockTasks, '', 'work', 'all', 'created_at', 'desc')
    );
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('2');
  });

  it('should filter tasks by completion status', async () => {
    // Open tasks only
    const { result: rOpen } = await renderHook(() =>
      useFilteredSortedTasks(mockTasks, '', null, 'open', 'created_at', 'desc')
    );
    expect(rOpen.current).toHaveLength(2);
    expect(rOpen.current.map((t) => t.id)).toEqual(expect.arrayContaining(['1', '3']));

    // Completed tasks only
    const { result: rComp } = await renderHook(() =>
      useFilteredSortedTasks(mockTasks, '', null, 'completed', 'created_at', 'desc')
    );
    expect(rComp.current).toHaveLength(1);
    expect(rComp.current[0].id).toBe('2');
  });

  it('should sort tasks correctly', async () => {
    // Sort by Title ASC
    const { result: rTitleAsc } = await renderHook(() =>
      useFilteredSortedTasks(mockTasks, '', null, 'all', 'title', 'asc')
    );
    expect(rTitleAsc.current.map((t) => t.title)).toEqual([
      'Buy Milk',
      'Finish Assignment',
      'Gym Workout',
    ]);

    // Sort by Title DESC
    const { result: rTitleDesc } = await renderHook(() =>
      useFilteredSortedTasks(mockTasks, '', null, 'all', 'title', 'desc')
    );
    expect(rTitleDesc.current.map((t) => t.title)).toEqual([
      'Gym Workout',
      'Finish Assignment',
      'Buy Milk',
    ]);

    // Sort by Due Date ASC
    const { result: rDueAsc } = await renderHook(() =>
      useFilteredSortedTasks(mockTasks, '', null, 'all', 'due_date', 'asc')
    );
    expect(rDueAsc.current[0].id).toBe('2'); // July 24
    expect(rDueAsc.current[1].id).toBe('1'); // July 28
    expect(rDueAsc.current[2].id).toBe('3'); // null (Infinity)
  });
});
