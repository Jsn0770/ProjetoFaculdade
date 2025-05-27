import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import CadastroGestor from "./pages/CadastroGestor";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Motoristas from "./pages/Motoristas";
import Carros from "./pages/Carros";
import Eventos from "./pages/Eventos";

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    console.log("Usuário logado:", userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      {user && <Navbar onLogout={handleLogout} />}

      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/cadastro-gestor" element={<CadastroGestor />} />

        {/* Rotas privadas */}
        <Route
          path="/"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/motoristas"
          element={user ? <Motoristas /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/carros"
          element={user ? <Carros /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/eventos"
          element={user ? <Eventos /> : <Navigate to="/login" replace />}
        />

        {/* Qualquer outra rota */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}
