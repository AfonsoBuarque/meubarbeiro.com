import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleOAuthCallback } from '../lib/google-calendar';
import { auth } from '../lib/firebase';
import { Loader2 } from 'lucide-react';

export function OAuth2Callback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        if (!code) throw new Error('No authorization code received');
        // Get tokens from Google
        const tokens = await handleOAuthCallback(code);
        // Get current Firebase user
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user found');
        // Store tokens in Firebase
        await user.getIdTokenResult(true);
        const tokenResult = await user.getIdTokenResult();
        const token = tokenResult.token;
        const credential = auth.GoogleAuthProvider.credential(token);
        await auth().signInWithCredential(credential);
        // Redirect back to profile
        navigate('/barber/profile');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect Google Calendar');
      }
    };
    handleCallback();
  }, [location, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Erro na Conexão</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/barber/profile')}
            className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
          >
            Voltar ao Perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
        <p className="text-gray-600">Conectando ao Google Calendar...</p>
      </div>
    </div>
  );
}