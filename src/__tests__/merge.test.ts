import { mergeRemoteWithLocalStarred } from '../utils/merge';
import { Task } from '../types';

describe('mergeRemoteWithLocalStarred', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      description: 'Desc 1',
      status: 'open',
      category_id: 'cat-1',
      due_date: null,
      created_at: '2026-07-23T00:00:00Z',
    },
    {
      id: 'task-2',
      title: 'Task 2',
      description: 'Desc 2',
      status: 'done',
      category_id: null,
      due_date: '2026-07-25T00:00:00Z',
      created_at: '2026-07-23T00:00:00Z',
    },
    {
      id: 'task-3',
      title: 'Task 3',
      description: 'Desc 3',
      status: 'open',
      category_id: 'cat-2',
      due_date: null,
      created_at: '2026-07-23T00:00:00Z',
    },
  ];

  it('correctly maps starred state to true for local starred tasks and false for others', () => {
    const starredIds = ['task-1', 'task-3'];
    const result = mergeRemoteWithLocalStarred(mockTasks, starredIds);

    expect(result).toHaveLength(3);

    expect(result[0].id).toBe('task-1');
    expect(result[0].starred).toBe(true);

    expect(result[1].id).toBe('task-2');
    expect(result[1].starred).toBe(false);

    expect(result[2].id).toBe('task-3');
    expect(result[2].starred).toBe(true);
  });

  it('returns empty array if remoteTasks is empty or null', () => {
    expect(mergeRemoteWithLocalStarred([], ['task-1'])).toEqual([]);
    // @ts-ignore
    expect(mergeRemoteWithLocalStarred(null, ['task-1'])).toEqual([]);
  });

  it('marks all as false if starredIds is empty', () => {
    const result = mergeRemoteWithLocalStarred(mockTasks, []);
    expect(result.every((task) => !task.starred)).toBe(true);
  });
});
