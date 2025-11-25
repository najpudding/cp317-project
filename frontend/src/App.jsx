

import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AuthPage from './pages/auth/AuthPage';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import MyProfile from './pages/MyProfile';
import Footer from './components/Footer';
import { useLocation } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-red-300 relative">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      <Footer />
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/' && location.pathname !== '/auth';
  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/myprofile" element={<MyProfile />} />
      </Routes>
    </>
  );
}

export default App;
