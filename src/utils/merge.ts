import { Task, TaskWithStarred } from '../types';

/**
 * Deterministically merges remote-fetched tasks with the device-only starred IDs.
 * Preserves the local starred state by checking if each task ID exists in the local store's starred list.
 *
 * @param remoteTasks Array of tasks fetched from Supabase
 * @param starredIds Array of task IDs that are starred on the device
 * @returns Array of tasks annotated with their local starred status
 */
export function mergeRemoteWithLocalStarred(
  remoteTasks: Task[],
  starredIds: string[]
): TaskWithStarred[] {
  if (!remoteTasks) return [];
  const starredSet = new Set(starredIds);
  return remoteTasks.map((task) => ({
    ...task,
    starred: starredSet.has(task.id),
  }));
}
