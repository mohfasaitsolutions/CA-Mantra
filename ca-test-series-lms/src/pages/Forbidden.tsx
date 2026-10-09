import { Link, useLocation } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { dashboardPathForRole } from '@/constants/roles';
import { useAuth } from '@/hooks/use-auth';

const Forbidden = () => {
  const { role } = useAuth();
  const location = useLocation();
  const dash = dashboardPathForRole(role);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <h1 className="text-7xl font-extrabold tracking-tight bg-gradient-to-br from-destructive to-foreground bg-clip-text text-transparent">403</h1>
      <h2 className="mt-4 text-2xl font-semibold">Access Denied</h2>
      <p className="mt-2 max-w-md text-muted-foreground text-sm">
        You don't have permission to view <code className="px-1 py-0.5 rounded bg-muted text-xs">{location.pathname}</code>.
        If you believe this is a mistake, please contact support or switch to the correct account.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 items-center justify-center">
        <Link to={dash} className={buttonVariants({ variant: 'default' })}>Go to Dashboard</Link>
        <Link to="/" className={buttonVariants({ variant: 'outline' })}>Home</Link>
        <Link to="/contact" className={buttonVariants({ variant: 'ghost' })}>Contact Support</Link>
      </div>
    </div>
  );
};

export default Forbidden;