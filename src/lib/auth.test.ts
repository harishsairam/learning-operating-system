import { describe, expect, it } from 'vitest';
import { withUserScope } from './auth';

describe('withUserScope', () => {
  it('adds the authenticated user id to payloads', () => {
    expect(withUserScope({ name: 'Example' }, 'user-123')).toEqual({
      name: 'Example',
      user_id: 'user-123',
    });
  });
});
