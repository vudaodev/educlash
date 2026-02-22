import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const SetupUsernamePage = lazy(() => import('./pages/SetupUsernamePage'));
const PlayPage = lazy(() => import('./pages/PlayPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const QuizPlayer = lazy(() => import('./pages/QuizPlayer'));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Auth required but no profile needed yet */}
        <Route
          path="/setup-username"
          element={
            <ProtectedRoute>
              <SetupUsernamePage />
            </ProtectedRoute>
          }
        />

        {/* Main app routes with bottom nav */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/play" element={<PlayPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Route>

        {/* Quiz player (no bottom nav) */}
        <Route
          path="/quiz/:quizId"
          element={
            <ProtectedRoute>
              <QuizPlayer />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/play" replace />} />
      </Routes>
    </Suspense>
  );
}
