import { useAuthContext } from '../contexts/AuthContext';

export function useAuthUser() {
  return useAuthContext().user;
}
