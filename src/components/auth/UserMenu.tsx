import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../../contexts/AuthContext';
import { signOut } from '../../api/auth';

export function UserMenu() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const handleLogout = async () => {
    await queryClient.clear();
    await signOut();
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm">
      <span className="truncate text-secondary">{user?.email ?? 'Signed in'}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-primary"
      >
        Logout
      </button>
    </div>
  );
}
