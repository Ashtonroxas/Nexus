import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MyProjects from './pages/MyProjects/MyProjects';
import NexusLayout from './layouts/NexusLayout';
import DependencyGraph from './pages/DependencyGraph/DependencyGraph';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import AuthPage from './pages/Auth/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import Team from './pages/Team/Team';
// import ActivityFeed from './pages/ActivityFeed/ActivityFeed'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route element={ /* Make sure layout is only displayed for authenticated users */
          <ProtectedRoute>
            <NexusLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<MyProjects />} />
          
          {/* Activity Feed temporarily commented */}
          {/* <Route path="/activity" element={<ActivityFeed />} /> */}
          
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/projects/:projectId" element={<DependencyGraph />} />
          <Route path="/projects/:projectId/report" element={<div>Coming Soon</div>} />
          <Route path="/projects/:projectId/team" element={<Team />} />

          <Route path="/*" element={<Navigate to="/projects" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;