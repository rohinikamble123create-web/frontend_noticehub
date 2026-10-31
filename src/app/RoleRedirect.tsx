import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { loadSession } from '@/core/auth/session';

export function RoleRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const session = loadSession();
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }
    const role = session.user.role;
    switch (role) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'faculty':
        navigate('/faculty', { replace: true });
        break;
      case 'office_staff':
        navigate('/staff', { replace: true });
        break;
      case 'student':
        navigate('/student', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  }, [navigate]);

  return null;
}
