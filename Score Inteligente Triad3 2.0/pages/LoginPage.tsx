
import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';

const EyeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const EyeOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-2.14 2.14l-3.289-3.29" />
    </svg>
);

const LoginPage: React.FC = () => {
    // 'login' for company login, 'register' for company sign-up, 'admin' for admin login
    const [view, setView] = useState<'login' | 'register' | 'admin'>('login');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { login, register } = useApp();

    const resetFields = () => {
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setName('');
        setCompanyName('');
        setPhone('');
        setError('');
        setSuccess('');
    }

    const handleViewChange = (newView: 'login' | 'register' | 'admin') => {
        resetFields();
        setView(newView);
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (view === 'login' || view === 'admin') {
            setIsLoggingIn(true);
            
            const loginPromise = login(email, password, view === 'admin');
            const timerPromise = new Promise(resolve => setTimeout(resolve, 4000));

            const [loginResult] = await Promise.all([loginPromise, timerPromise]);

            if (loginResult.success) {
                window.location.hash = '#dashboard';
            } else {
                setError(loginResult.message || 'Credenciais inválidas.');
                setIsLoggingIn(false);
            }
        } else { // view === 'register'
             if(!name || !companyName || !email || !password || !phone) {
                setError('Todos os campos são obrigatórios para o cadastro.');
                return;
            }
            setIsRegistering(true);
            
            const registerPromise = register(name, companyName, email, password, phone);
            // Add a timer to ensure loader is visible for a minimum duration.
            const timerPromise = new Promise(resolve => setTimeout(resolve, 3000));

            const [result] = await Promise.all([registerPromise, timerPromise]);

            setIsRegistering(false);

            if (result && result.success) {
                handleViewChange('login');
                setSuccess(result.message || 'Cadastro realizado! Aguarde a aprovação do administrador para acessar.');
            } else {
                setError(result?.message || 'Falha no cadastro. Tente novamente.');
            }
        }
    };
    
    const renderFormContent = () => {
        if (view === 'admin') {
            return (
                <>
                    <h2 className="text-2xl font-bold text-dark-text text-center mb-4">
                        Acesso do Administrador
                    </h2>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <input name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-dark-border rounded-lg bg-dark-card text-dark-text focus:ring-2 focus:ring-blue-500 focus:outline-none transition" placeholder="E-mail de administrador" />
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-dark-border rounded-lg bg-dark-card text-dark-text focus:ring-2 focus:ring-blue-500 focus:outline-none transition pr-10"
                                placeholder="Senha de administrador"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center" aria-label="Toggle password visibility">
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-red-500 transition-all duration-300 ease-in-out">
                            Entrar como Admin
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <button onClick={() => handleViewChange('login')} className="font-medium text-sm text-cyan-400 hover:underline">
                            Voltar para o acesso da empresa
                        </button>
                    </div>
                </>
            );
        }

        // Company login/register view
        return (
            <>
                 <h2 className="text-2xl font-bold text-dark-text text-center mb-4">
                    {view === 'login' ? 'Acessar Plataforma' : 'Criar Nova Conta'}
                </h2>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {view === 'register' && (
                        <>
                             <input name="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 border border-dark-border rounded-lg bg-dark-card text-dark-text focus:ring-2 focus:ring-blue-500 focus:outline-none transition" placeholder="Seu Nome Completo" />
                             <input name="companyName" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="w-full px-4 py-3 border border-dark-border rounded-lg bg-dark-card text-dark-text focus:ring-2 focus:ring-blue-500 focus:outline-none transition" placeholder="Nome da Empresa" />
                        </>
                    )}
                    <input name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-dark-border rounded-lg bg-dark-card text-dark-text focus:ring-2 focus:ring-blue-500 focus:outline-none transition" placeholder="Seu e-mail" />
                    {view === 'register' && (
                         <input name="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-4 py-3 border border-dark-border rounded-lg bg-dark-card text-dark-text focus:ring-2 focus:ring-blue-500 focus:outline-none transition" placeholder="Seu telefone" />
                    )}
                    <div className="relative">
                        <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-dark-border rounded-lg bg-dark-card text-dark-text focus:ring-2 focus:ring-blue-500 focus:outline-none transition pr-10"
                            placeholder="Sua senha"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center" aria-label="Toggle password visibility">
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                    
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    {success && <p className="text-sm text-green-500 text-center">{success}</p>}

                    <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-blue-500 transition-all duration-300 ease-in-out">
                        {view === 'login' ? 'Entrar' : 'Finalizar Cadastro'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => handleViewChange(view === 'login' ? 'register' : 'login')} className="font-medium text-sm text-cyan-400 hover:underline">
                        {view === 'login' ? 'Não tem uma conta? Cadastre-se aqui' : 'Já tem uma conta? Acesse aqui'}
                    </button>
                </div>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-dark-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-dark-card text-gray-400">Ou</span>
                    </div>
                </div>

                <div className="text-center">
                    <button onClick={() => handleViewChange('admin')} className="w-full flex justify-center py-3 px-4 border border-gray-500 text-base font-semibold rounded-lg text-dark-text bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-gray-500 transition-all duration-300 ease-in-out">
                        Acessar como Administrador
                    </button>
                </div>
            </>
        )
    }

    if (isLoggingIn || isRegistering) {
        return (
            <div className="bg-dark-background text-dark-text min-h-screen font-sans flex flex-col justify-center items-center p-4">
                <div className="loader-container">
                    <div className="loader triangle">
                        <svg viewBox="0 0 86 80">
                        <polygon points="43 8 79 72 7 72"></polygon>
                        </svg>
                    </div>
                    <div className="loadingtext">
                        <p>Loading</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-dark-background text-dark-text min-h-screen font-sans flex flex-col justify-center items-center p-4 transition-colors duration-300 relative">
            <div className="text-center mb-8">
                 <img 
                    src="https://edrrnawrhfhoynpiwqsc.supabase.co/storage/v1/object/sign/imagenscientes/Logos%20Triad3/LOGO%20TRIAD3%20%20OFICIAL.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80Y2RiMjE3Ni0xMzVkLTQ2ZTItYjJjYi0zMDlhMTNlNzQxNWIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZW5zY2llbnRlcy9Mb2dvcyBUcmlhZDMvTE9HTyBUUklBRDMgIE9GSUNJQUwucG5nIiwiaWF0IjoxNzUzODg4NTQwLCJleHAiOjIxMzIzMjA1NDB9.c3GxZg4Lrz5Cb62aA69aubnEp0Vcnije64VcC3iAne8" 
                    alt="Logo Triad3"
                    className="login-logo"
                />
                 <h1 className="text-4xl sm:text-5xl font-extrabold">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        Score Inteligente
                    </span>
                    <span className="text-dark-text"> Triad3</span>
                </h1>
                <p className="text-lg text-gray-400 mt-2">Execute um raio-x de áreas vitais de sua empresa.</p>
            </div>

            <div className="w-full max-w-md bg-dark-card p-6 sm:p-8 rounded-xl shadow-2xl border border-dark-border">
                {renderFormContent()}
            </div>
             <div className="absolute bottom-4 text-center text-xs text-gray-400">
                <p>Powered by: <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Triad3 Inteligência Digital</span></p>
            </div>
        </div>
    );
};

export default LoginPage;