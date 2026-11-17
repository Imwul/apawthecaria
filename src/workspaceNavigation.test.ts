import { describe, expect, it } from 'vitest';
import { playTaskPanelForId } from './workspaceNavigation';

describe('play task shelf targets', () => {
  it('opens the panel that holds a nested action target', () => {
    expect(playTaskPanelForId('downtime-panel')).toBe('downtime-panel');
    // The "choose a Downtime activity" action must mark Downtime, not New Journey, as the current task.
    expect(playTaskPanelForId('downtime-activity-choice')).toBe('downtime-panel');
    expect(playTaskPanelForId('treatment-workspace')).toBe('patient-clinic-panel');
    expect(playTaskPanelForId('unknown-target')).toBeNull();
  });
});
