
import React from 'react';
import { useApp } from '../hooks/useApp';
import { UserRole } from '../types';

const Header: React.FC = () => {
    const { currentUser, logout } = useApp();
    
    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };


    return (
        <header className="bg-dark-background sticky top-0 z-40 w-full border-b border-dark-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <a href="#login" onClick={(e) => handleNav(e, '#login')} className="flex items-center gap-4 text-xl font-bold">
                             <img 
                                src="https://edrrnawrhfhoynpiwqsc.supabase.co/storage/v1/object/sign/imagenscientes/Logos%20Triad3/LOGO%20TRIAD3%20%20OFICIAL.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80Y2RiMjE3Ni0xMzVkLTQ2ZTItYjJjYi0zMDlhMTNlNzQxNWIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZW5zY2llbnRlcy9Mb2dvcyBUcmlhZDMvTE9HTyBUUklBRDMgIE9GSUNJQUwucG5nIiwiaWF0IjoxNzUzODg4NTQwLCJleHAiOjIxMzIzMjA1NDB9.c3GxZg4Lrz5Cb62aA69aubnEp0Vcnije64VcC3iAne8" 
                                alt="Logo Triad3" 
                                className="app-logo"
                            />
                             <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                Score Inteligente
                            </span>
                        </a>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {currentUser && (
                            <>
                                <a href="#dashboard" onClick={(e) => handleNav(e, '#dashboard')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-dark-border transition-colors">Painel</a>
                                <a href="#questionnaire" onClick={(e) => handleNav(e, '#questionnaire')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-dark-border transition-colors">Questionário</a>
                                {currentUser.role === UserRole.ADMIN && (
                                    <>
                                        <a href="#admin" onClick={(e) => handleNav(e, '#admin')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-dark-border transition-colors">Admin</a>
                                        <a href="#logs" onClick={(e) => handleNav(e, '#logs')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-dark-border transition-colors">Logs</a>
                                    </>
                                )}
                                <a href="#profile" onClick={(e) => handleNav(e, '#profile')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-dark-border transition-colors">Meu Perfil</a>
                                <button
                                    onClick={logout}
                                    className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                    Sair
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
