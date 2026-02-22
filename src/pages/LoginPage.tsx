import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logoImg from '@/assets/educlashlogo.png';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/play" replace />;

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-2">
        <img src={logoImg} alt="EduClash" className="h-24 object-contain" />
        <p className="text-muted-foreground text-center">
          Turn your lectures into battles. Quiz your friends. Climb the leaderboard.
        </p>
      </div>

      <Button size="lg" className="w-full max-w-xs" onClick={signInWithGoogle}>
        Continue with Google
      </Button>
    </div>
  );
}
