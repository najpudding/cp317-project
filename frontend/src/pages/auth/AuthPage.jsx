import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../../components/auth/Login';
import SignUp from '../../components/auth/SignUp';

export default function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);
  const navigate = useNavigate();

  // Handler to redirect after login/signup
  const handleAuthSuccess = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white shadow-2xl rounded-3xl w-[400px] max-w-full p-8 flex flex-col items-center">
        <div className="w-full">
          {showLogin ? (
            <Login onToggle={() => setShowLogin(false)} onAuthSuccess={handleAuthSuccess} />
          ) : (
            <SignUp onToggle={() => setShowLogin(true)} onAuthSuccess={handleAuthSuccess} />
          )}
        </div>
      </div>
    </div>
  );
}
