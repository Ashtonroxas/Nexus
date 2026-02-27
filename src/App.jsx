import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar';
import MyProjects from './pages/My Projects/MyProjects'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MyProjects />} />
        <Route path="/my-projects" element={<MyProjects />} />
      </Routes>
    </Router>
  )
}

export default App
