import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthForm } from './components/auth/AuthForm';
import { ClientDashboard } from './pages/client/Dashboard';
import { BarberSearch } from './pages/public/BarberSearch';
import { Home } from './pages/public/Home';
import { BarberProfile } from './pages/barber/Profile';
import { EstablishmentForm } from './pages/barber/EstablishmentForm';
import { OAuth2Callback } from './pages/OAuth2Callback';
import { BookingPage } from './pages/public/BookingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buscar" element={<BarberSearch />} />
        <Route path="/barber/login" element={<AuthForm />} />
        <Route path="/barber/profile" element={<BarberProfile />} />
        <Route path="/barber/establishment" element={<EstablishmentForm />} />
        <Route path="/barber/dashboard" element={<ClientDashboard />} />
        <Route path="/oauth2callback" element={<OAuth2Callback />} />
        <Route path="/agendar/:establishmentId" element={<BookingPage />} />
      </Routes>
    </Router>
  );
}

export default App;