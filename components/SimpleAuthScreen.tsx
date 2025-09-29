import React, { useState } from 'react';

interface SimpleAuthScreenProps {
  onLogin: () => void;
}

const SimpleAuthScreen: React.FC<SimpleAuthScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Senha simples para teste
    if (password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true');
      onLogin();
    } else {
      setError('Senha incorreta. Use: admin123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-4">
      <div className="w-full max-w-sm bg-brand-card-bg rounded-2xl shadow-xl p-8 text-center border border-pink-100/10">
        <h1 className="text-3xl font-extrabold text-brand-accent mb-3">
          Acesso ao Dashboard
        </h1>
        <p className="text-lg text-brand-card-text-muted mb-8">
          Digite a senha para acessar o painel.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Digite a senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-brand-bg/20 border-2 border-transparent focus:border-brand-accent text-brand-card-text placeholder-brand-card-text-muted/70 rounded-lg py-3 px-4 text-lg"
          />
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-brand-accent text-brand-text font-bold text-xl py-3 px-6 rounded-full hover:bg-brand-accent-dark transition-colors"
          >
            Entrar
          </button>
        </form>
        
        <p className="text-xs text-brand-card-text-muted/50 mt-6">
          Senha de teste: admin123
        </p>
      </div>
    </div>
  );
};

export default SimpleAuthScreen;