
import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { UserRole } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

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

const ProfilePage: React.FC = () => {
    const { currentUser, changePassword, changeAdminPassword } = useApp();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!currentUser) {
            setError('Você precisa estar logado para alterar a senha.');
            return;
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Todos os campos são obrigatórios.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('A nova senha e a confirmação não coincidem.');
            return;
        }
        
        if (newPassword.length < 6) {
             setError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        
        setIsModalOpen(true);
    };
    
    const handleConfirmChange = async () => {
        if (!currentUser) return;
        
        setIsModalOpen(false);
        setIsSubmitting(true);

        let result;
        if (currentUser.role === UserRole.ADMIN) {
            result = await changeAdminPassword(currentUser.id, currentUser.email, currentPassword, newPassword);
        } else {
            result = await changePassword(currentUser, currentPassword, newPassword);
        }

        if (result.success) {
            setSuccess(result.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setError(result.message);
        }
        setIsSubmitting(false);
    };


    if (!currentUser) {
        return <p>Acesso negado. Por favor, faça o login.</p>;
    }

    return (
        <div className="container mx-auto max-w-lg">
            <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>
            
            <div className="bg-dark-card p-6 sm:p-8 rounded-xl shadow-md border border-dark-border">
                <h2 className="text-xl font-semibold mb-6 text-dark-text">Alterar Senha</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">Senha Atual</label>
                        <div className="relative">
                            <input
                                id="currentPassword"
                                name="currentPassword"
                                type={showCurrentPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                             <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center" aria-label="Toggle password visibility">
                                {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">Nova Senha</label>
                         <div className="relative">
                            <input
                                id="newPassword"
                                name="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                             <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center" aria-label="Toggle password visibility">
                                {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Confirmar Nova Senha</label>
                         <div className="relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                             <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center" aria-label="Toggle password visibility">
                                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    {success && <p className="text-sm text-green-500 text-center">{success}</p>}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-blue-500 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
             <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmChange}
                title="Confirmar Alteração de Senha"
                confirmButtonText="Confirmar"
                confirmButtonClass="bg-green-600 hover:bg-green-700"
            >
                <p>Você tem certeza que deseja alterar sua senha?</p>
            </ConfirmationModal>
        </div>
    );
};

export default ProfilePage;
