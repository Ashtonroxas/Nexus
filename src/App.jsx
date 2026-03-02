import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MyProjects from './pages/MyProjects/MyProjects';
import NexusLayout from './layouts/NexusLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<NexusLayout />}>
          {/* Main Pages */}
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<MyProjects />} />
          <Route path="/profile" element={<div>Coming Soon</div>} />
        
          {/* Project Pages */}
          <Route path="/projects/:projectId" element={<div>Coming Soon</div>} />
          <Route path="/projects/:projectId/report" element={<div>Coming Soon</div>} />
          <Route path="/projects/:projectId/team" element={<div>Coming Soon</div>} />

        </Route>
      
      
      
      </Routes>
    </Router>
  );
}

export default App;
