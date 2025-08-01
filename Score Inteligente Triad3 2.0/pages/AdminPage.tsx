





import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../hooks/useApp';
import { User, UserStatus, Question, Category, UserRole, LogEntry, LogType } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

// Icons
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);
const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const CancelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface PendingApprovalsProps {
    onApproveRequest: (user: User) => void;
}

// Sub-component for pending approvals
const PendingApprovals: React.FC<PendingApprovalsProps> = ({ onApproveRequest }) => {
    const { users, updateUserStatus } = useApp();
    const pendingUsers = users.filter(u => u.status === UserStatus.PENDING);

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md border border-light-border dark:border-dark-border">
            <h3 className="text-xl font-semibold mb-4">Aprovações Pendentes</h3>
            {pendingUsers.length > 0 ? (
                <ul className="space-y-4">
                    {pendingUsers.map(user => (
                        <li key={user.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-light-background dark:bg-dark-background rounded-lg border border-light-border dark:border-dark-border">
                            <div>
                                <p className="font-bold">{user.companyName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.name} ({user.email} | {user.phone})</p>
                            </div>
                            <div className="flex space-x-2 mt-2 sm:mt-0">
                                <button onClick={() => onApproveRequest(user)} className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">Aprovar</button>
                                <button onClick={() => updateUserStatus(user.id, UserStatus.REJECTED)} className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">Rejeitar</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">Nenhuma aprovação pendente.</p>
            )}
        </div>
    );
};

interface AdminUserManagerProps {
    admins: User[];
    isLoading: boolean;
    onAddRequest: (data: { name: string; email: string; password: string, phone: string }) => void;
    onUpdateRequest: (user: User, updates: { name?: string; email?: string; phone?: string; password?: string }) => void;
    onDeleteRequest: (user: User) => void;
}

const AdminUserManager: React.FC<AdminUserManagerProps> = ({ admins, isLoading, onAddRequest, onUpdateRequest, onDeleteRequest }) => {
    const { currentUser } = useApp();
    const [formState, setFormState] = useState({ name: '', email: '', password: '', phone: '' });
    const [editingState, setEditingState] = useState<{ id: string, name: string, email: string, phone: string, password: '', confirmPassword: '' } | null>(null);
    const [editError, setEditError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAddAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, email, password, phone } = formState;
        if (name.trim() && email.trim() && password.trim() && phone.trim()) {
            onAddRequest({ name: name.trim(), email: email.trim(), password: password.trim(), phone: phone.trim() });
            setFormState({ name: '', email: '', password: '', phone: '' });
        }
    };

    const handleEditClick = (user: User) => {
        setEditingState({ id: user.id, name: user.name, email: user.email, phone: user.phone || '', password: '', confirmPassword: '' });
        setEditError('');
    };

    const handleCancelEdit = () => {
        setEditingState(null);
        setEditError('');
    };

    const handleSaveEdit = () => {
        if (!editingState) return;

        const { id, name, email, phone, password, confirmPassword } = editingState;

        if (!name.trim() || !email.trim() || !phone.trim()) {
            setEditError('Nome, e-mail e telefone não podem estar vazios.');
            return;
        }

        if (password && password !== confirmPassword) {
            setEditError('As novas senhas não coincidem.');
            return;
        }

        const originalAdmin = admins.find(a => a.id === id);
        if (!originalAdmin) {
            setEditError('Administrador original não encontrado.');
            return;
        }

        const updates: { name?: string; email?: string; phone?: string; password?: string } = {};
        if (name.trim() && name.trim() !== originalAdmin.name) updates.name = name.trim();
        if (email.trim() && email.trim() !== originalAdmin.email) updates.email = email.trim();
        if (phone.trim() && phone.trim() !== originalAdmin.phone) updates.phone = phone.trim();
        if (password) updates.password = password;

        if (Object.keys(updates).length > 0) {
            onUpdateRequest(originalAdmin, updates);
        }
        
        handleCancelEdit();
    };

    const handleEditingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editingState) {
            setEditingState({ ...editingState, [e.target.name]: e.target.value });
        }
    };

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md border border-light-border dark:border-dark-border">
            <h3 className="text-xl font-semibold mb-4">Gerenciar Administradores</h3>
            <form onSubmit={handleAddAdmin} className="space-y-3 mb-6 pb-4 border-b border-light-border dark:border-dark-border">
                <input type="text" name="name" value={formState.name} onChange={handleInputChange} placeholder="Nome do novo admin" className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="email" name="email" value={formState.email} onChange={handleInputChange} placeholder="E-mail do novo admin" className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="tel" name="phone" value={formState.phone} onChange={handleInputChange} placeholder="Telefone do novo admin" className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="password" name="password" value={formState.password} onChange={handleInputChange} placeholder="Senha temporária" className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <button type="submit" className="w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all">Adicionar Administrador</button>
            </form>
            <h4 className="font-semibold mb-2">Administradores Atuais</h4>
            {isLoading ? (
                <p className="text-gray-500 dark:text-gray-400">Carregando administradores...</p>
            ) : (
                <ul className="space-y-2">
                    {admins.length > 0 ? admins.map(user => (
                        <li key={user.id} className="p-3 bg-light-background dark:bg-dark-background rounded-lg border border-light-border dark:border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            {editingState?.id === user.id ? (
                                <div className="flex-grow space-y-2 w-full">
                                    <input type="text" name="name" value={editingState.name} onChange={handleEditingChange} className="w-full px-2 py-1 border border-light-border dark:border-dark-border rounded-md bg-light-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
                                    <input type="email" name="email" value={editingState.email} onChange={handleEditingChange} className="w-full px-2 py-1 border border-light-border dark:border-dark-border rounded-md bg-light-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <input type="tel" name="phone" value={editingState.phone} onChange={handleEditingChange} className="w-full px-2 py-1 border border-light-border dark:border-dark-border rounded-md bg-light-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <input type="password" name="password" value={editingState.password} onChange={handleEditingChange} placeholder="Nova senha (deixe em branco para manter)" className="w-full px-2 py-1 border border-light-border dark:border-dark-border rounded-md bg-light-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <input type="password" name="confirmPassword" value={editingState.confirmPassword} onChange={handleEditingChange} placeholder="Confirmar nova senha" className="w-full px-2 py-1 border border-light-border dark:border-dark-border rounded-md bg-light-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    {editError && <p className="text-xs text-red-500 mt-1">{editError}</p>}
                                </div>
                            ) : (
                               <div className="flex-grow">
                                   <p className="font-medium">{user.name}</p>
                                   <p className="text-sm text-gray-500 dark:text-gray-400">{user.email} | {user.phone}</p>
                               </div>
                            )}
                            
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                               {editingState?.id === user.id ? (
                                    <>
                                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800"><SaveIcon /></button>
                                        <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800"><CancelIcon /></button>
                                    </>
                               ) : (
                                    <>
                                        <button onClick={() => handleEditClick(user)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                        {currentUser?.id !== user.id && (
                                            <button onClick={() => onDeleteRequest(user)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                        )}
                                    </>
                               )}
                            </div>
                        </li>
                    )) : (
                         <p className="text-gray-500 dark:text-gray-400">Nenhum administrador cadastrado.</p>
                    )}
                </ul>
            )}
        </div>
    );
};

// Sub-component for category management
const CategoryManager: React.FC<{
    onAddRequest: (name: string) => void;
    onUpdateRequest: (category: Category, newName: string) => void;
    onDeleteRequest: (category: Category) => void;
}> = ({ onAddRequest, onUpdateRequest, onDeleteRequest }) => {
    const { categories } = useApp();
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategory.trim()) {
            onAddRequest(newCategory.trim());
            setNewCategory('');
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setEditingName(category.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleSaveEdit = () => {
        if (editingId && editingName.trim()) {
            const originalCategory = categories.find(c => c.id === editingId);
            if(originalCategory) {
              onUpdateRequest(originalCategory, editingName.trim());
            }
            handleCancelEdit();
        }
    };


    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md border border-light-border dark:border-dark-border">
            <h3 className="text-xl font-semibold mb-4">Gerenciar Categorias</h3>
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nome da nova categoria" className="flex-grow px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="px-4 py-2 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all">Adicionar</button>
            </form>
            <ul className="space-y-2">
                {categories.map(cat => (
                    <li key={cat.id} className="p-3 bg-light-background dark:bg-dark-background rounded-lg border border-light-border dark:border-dark-border flex items-center justify-between gap-2">
                        {editingId === cat.id ? (
                            <input type="text" value={editingName} onChange={e => setEditingName(e.target.value)} className="flex-grow px-2 py-1 border border-light-border dark:border-dark-border rounded-md bg-light-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
                        ) : (
                           <span className="flex-grow">{cat.name}</span>
                        )}
                        
                        <div className="flex items-center gap-2 shrink-0">
                           {editingId === cat.id ? (
                                <>
                                    <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800"><SaveIcon /></button>
                                    <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800"><CancelIcon /></button>
                                </>
                           ) : (
                                <>
                                    <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                    <button onClick={() => onDeleteRequest(cat)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                </>
                           )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

interface QuestionManagerProps {
    onAddRequest: (data: { categoryId: string; text: string; answers: { text: string; score: number }[] }) => void;
    onDeleteRequest: (question: Question) => void;
    onUpdateRequest: (question: Question) => void;
}


// Sub-component for question management
const QuestionManager: React.FC<QuestionManagerProps> = ({ onAddRequest, onDeleteRequest, onUpdateRequest }) => {
    const { categories, questions } = useApp();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [questionText, setQuestionText] = useState('');
    const [answers, setAnswers] = useState<{ text: string; score: number }[]>([{ text: '', score: 0 }]);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    
    useEffect(() => {
        if(editingQuestion) {
            setSelectedCategory(editingQuestion.categoryId);
            setQuestionText(editingQuestion.text);
            setAnswers(editingQuestion.answers.map(a => ({ text: a.text, score: a.score })));
        } else {
            setQuestionText('');
            setAnswers([{ text: '', score: 0 }]);
        }
    }, [editingQuestion]);
    
    const resetForm = () => {
        setEditingQuestion(null);
    };

    const handleAddAnswer = () => setAnswers([...answers, { text: '', score: 0 }]);
    const handleAnswerChange = (index: number, field: 'text' | 'score', value: string | number) => {
        const newAnswers = [...answers];
        if(field === 'score') newAnswers[index][field] = Number(value);
        else newAnswers[index][field] = String(value);
        setAnswers(newAnswers);
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!questionText.trim() || !answers.every(a => a.text.trim())) {
            return;
        }

        if (editingQuestion) {
            const updatedQuestion: Question = {
                ...editingQuestion,
                text: questionText,
                answers: answers.map((a, i) => ({
                    id: editingQuestion.answers[i]?.id || `new-ans-${Date.now()}-${i}`,
                    text: a.text,
                    score: a.score,
                })),
                categoryId: selectedCategory,
            };
            onUpdateRequest(updatedQuestion);
            resetForm();
        } else {
            if (selectedCategory === 'all') {
                alert('Por favor, selecione uma categoria para adicionar uma nova pergunta.');
                return;
            }
            onAddRequest({ categoryId: selectedCategory, text: questionText, answers });
            setQuestionText('');
            setAnswers([{ text: '', score: 0 }]);
        }
    };

    const renderQuestionItem = (q: Question) => (
        <li key={q.id} className="p-3 bg-light-background dark:bg-dark-background rounded-lg border border-light-border dark:border-dark-border">
            <div className="flex justify-between items-start gap-2">
                <div className="flex-grow">
                    <p className="font-medium">{q.text}</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside pl-2 mt-1">
                       {q.answers.map(a => <li key={a.id}>{a.text} <span className="font-semibold">({a.score} pts)</span></li>)}
                    </ul>
                </div>
                 <div className="flex items-center gap-2 shrink-0">
                     <button onClick={() => setEditingQuestion(q)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                     <button onClick={() => onDeleteRequest(q)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                </div>
            </div>
        </li>
    );

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md border border-light-border dark:border-dark-border">
            <h3 className="text-xl font-semibold mb-4">Gerenciar Perguntas</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4 mb-6">
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">-- Todas as Categorias --</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Texto da pergunta" className="w-full p-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2}></textarea>
                
                <h4 className="font-semibold pt-2">Respostas e Pontuações:</h4>
                {answers.map((ans, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input type="text" value={ans.text} onChange={e => handleAnswerChange(i, 'text', e.target.value)} placeholder={`Opção de resposta ${i + 1}`} className="flex-grow p-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        <input type="number" value={ans.score} onChange={e => handleAnswerChange(i, 'score', e.target.value)} placeholder="Pontos" className="w-24 p-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                    <button type="button" onClick={handleAddAnswer} className="text-sm font-medium text-blue-600 dark:text-cyan-400 hover:underline">Adicionar Resposta</button>
                    <div className="flex gap-2">
                        {editingQuestion && (
                            <button type="button" onClick={resetForm} className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all">Cancelar</button>
                        )}
                        <button type="submit" className="px-4 py-2 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all">{editingQuestion ? 'Atualizar Pergunta' : 'Adicionar Pergunta'}</button>
                    </div>
                </div>
            </form>
            
            {selectedCategory === 'all' ? (
                <div className="space-y-6 border-t border-light-border dark:border-dark-border pt-4">
                    <h4 className="font-semibold text-lg mb-2">Todas as Perguntas</h4>
                    {questions.length > 0 ? (
                        categories.map(category => {
                            const categoryQuestions = questions.filter(q => q.categoryId === category.id);
                            if (categoryQuestions.length === 0) return null;
                            return (
                                <div key={category.id}>
                                    <h5 className="font-semibold text-cyan-400 mb-2">{category.name}</h5>
                                    <ul className="space-y-2 pl-4 border-l-2 border-dark-border">
                                        {categoryQuestions.map(q => renderQuestionItem(q))}
                                    </ul>
                                </div>
                            );
                        })
                    ) : (
                         <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma pergunta cadastrada.</p>
                    )}
                </div>
            ) : (
                <>
                    <h4 className="font-semibold mb-2 border-t border-light-border dark:border-dark-border pt-4">Perguntas em "{categories.find(c => c.id === selectedCategory)?.name || 'N/A'}"</h4>
                     <ul className="space-y-2">
                        {(() => {
                            const questionsForCategory = questions.filter(q => q.categoryId === selectedCategory);
                            return questionsForCategory.length > 0 ? (
                                questionsForCategory.map(q => renderQuestionItem(q))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma pergunta nesta categoria ainda.</p>
                            );
                        })()}
                    </ul>
                </>
            )}
        </div>
    );
}

const ActivityLog: React.FC = () => {
    const { logs } = useApp();

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-md border border-light-border dark:border-dark-border">
            <h3 className="text-xl font-semibold mb-4">Registro de Atividades</h3>
            {logs.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {logs.map(log => (
                        <li key={log.id} className="text-sm p-3 bg-light-background dark:bg-dark-background rounded-lg border border-light-border dark:border-dark-border">
                            <p className="text-gray-800 dark:text-gray-200">{log.message}</p>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between items-center">
                                <span>
                                    {log.type === LogType.USER_APPROVAL && log.adminName && (
                                        `Aprovado por: ${log.adminName}`
                                    )}
                                </span>
                                <span className="font-mono">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">Nenhuma atividade registrada.</p>
            )}
        </div>
    );
};

// Main Admin Page Component
const AdminPage: React.FC = () => {
    const { addAdmin, addCategory, deleteCategory, addQuestion, deleteQuestion, deleteAdmin, categories, fetchAdminQuestionnaireData, fetchPendingUsers, fetchApprovedUsersLogs, approveUser, updateCategory, updateQuestion, updateAdmin } = useApp();
    
    type QuestionDataType = { categoryId: string; text: string; answers: { text: string; score: number }[] };
    type AdminDataType = { name: string, email: string, password: string, phone: string };
    type AdminUpdateType = { name?: string; email?: string; phone?: string; password?: string };


    const [modalState, setModalState] = useState<
        { isOpen: false } | 
        { isOpen: true, type: 'delete-category', category: Category } |
        { isOpen: true, type: 'edit-category', category: Category, newName: string } |
        { isOpen: true, type: 'delete-question', question: Question } |
        { isOpen: true, type: 'edit-question', question: Question } |
        { isOpen: true, type: 'user', user: User } |
        { isOpen: true, type: 'add-admin', data: AdminDataType } |
        { isOpen: true, type: 'edit-admin', user: User, updates: AdminUpdateType } |
        { isOpen: true, type: 'add-category', name: string } |
        { isOpen: true, type: 'add-question', data: QuestionDataType } |
        { isOpen: true, type: 'approve-user', user: User }
    >({ isOpen: false });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiAdmins, setApiAdmins] = useState<User[]>([]);
    const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);

    const fetchAdmins = useCallback(async () => {
        setIsLoadingAdmins(true);
        try {
            const response = await fetch('https://webhook.triad3.io/webhook/buscaradmsscore');
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            const text = await response.text();
            const data = text ? JSON.parse(text) : []; // Handle empty response

            if (Array.isArray(data)) {
                const mappedAdmins: User[] = data.map((admin: any) => ({
                    id: String(admin.id),
                    name: admin.nome,
                    email: admin.email,
                    companyName: 'Triad3',
                    role: UserRole.ADMIN,
                    status: UserStatus.APPROVED,
                    phone: admin.telefone || '',
                    passwordHash: '',
                }));
                setApiAdmins(mappedAdmins);
            } else {
                console.error("API para buscar admins não retornou um array.");
                setApiAdmins([]); // Clear admins on invalid response
            }
        } catch (error) {
            console.error("Erro ao processar busca de admins:", error);
            setApiAdmins([]); // Clear admins on error
        } finally {
            setIsLoadingAdmins(false);
        }
    }, []);

    useEffect(() => {
        const initialFetch = async () => {
            if (fetchPendingUsers) {
                await fetchPendingUsers();
            }
            if (fetchApprovedUsersLogs) {
                await fetchApprovedUsersLogs();
            }
            await fetchAdmins();
            if (fetchAdminQuestionnaireData) {
                await fetchAdminQuestionnaireData();
            }
        }
        
        initialFetch();
    }, [fetchAdminQuestionnaireData, fetchPendingUsers, fetchApprovedUsersLogs, fetchAdmins]);

    const openDeleteCategoryModal = (category: Category) => {
        setModalState({ isOpen: true, type: 'delete-category', category });
    };

    const openUpdateCategoryModal = (category: Category, newName: string) => {
        setModalState({ isOpen: true, type: 'edit-category', category, newName });
    };
    
    const openDeleteQuestionModal = (question: Question) => {
        setModalState({ isOpen: true, type: 'delete-question', question });
    };

    const openUpdateQuestionModal = (question: Question) => {
        setModalState({ isOpen: true, type: 'edit-question', question });
    };

    const openDeleteUserModal = (user: User) => {
        setModalState({ isOpen: true, type: 'user', user });
    };

    const openAddAdminModal = (data: AdminDataType) => {
        setModalState({ isOpen: true, type: 'add-admin', data });
    };

    const openUpdateAdminModal = (user: User, updates: AdminUpdateType) => {
        setModalState({ isOpen: true, type: 'edit-admin', user, updates });
    };
    
    const openAddCategoryModal = (name: string) => {
        setModalState({ isOpen: true, type: 'add-category', name });
    };

    const openAddQuestionModal = (data: QuestionDataType) => {
        setModalState({ isOpen: true, type: 'add-question', data });
    };

    const handleApproveRequest = (user: User) => {
        setModalState({ isOpen: true, type: 'approve-user', user });
    };

    const closeModal = () => {
        setModalState({ isOpen: false });
    };

    const handleConfirm = async () => {
        if (!modalState.isOpen) return;

        const commonAction = async (action: () => Promise<any>) => {
            closeModal();
            setIsSubmitting(true);
            try {
                const result = await action();
                if (result && result.success === false) {
                    throw new Error(result.message || "A operação falhou.");
                }
            } catch (error) {
                console.error("Action failed:", error);
                alert(`Ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            } finally {
                setIsSubmitting(false);
            }
        };

        switch (modalState.type) {
            case 'add-admin':
                 await commonAction(async () => {
                    const { name, email, password, phone } = modalState.data;
                    const result = await addAdmin(name, email, password, phone);
                    if (result.success) {
                        await fetchAdmins(); // refetch admin list
                    }
                    return result; // Pass result to commonAction to check success
                });
                break;
            case 'edit-admin':
                 await commonAction(async () => {
                    const result = await updateAdmin(modalState.user, modalState.updates);
                    if (result.success) {
                        await fetchAdmins();
                    }
                    return result;
                });
                break;
            case 'add-category':
                await commonAction(() => addCategory(modalState.name));
                break;
            case 'add-question':
                await commonAction(() => addQuestion(modalState.data.categoryId, modalState.data.text, modalState.data.answers));
                break;
             case 'approve-user':
                await commonAction(async () => {
                    const result = await approveUser(modalState.user);
                    if (result.success && fetchApprovedUsersLogs) {
                        await fetchApprovedUsersLogs();
                        await fetchPendingUsers();
                    }
                    return result;
                });
                break;
            case 'delete-category':
                await commonAction(() => deleteCategory(modalState.category));
                break;
            case 'edit-category':
                await commonAction(() => updateCategory(modalState.category, modalState.newName));
                break;
            case 'delete-question':
                await commonAction(() => deleteQuestion(modalState.question));
                break;
            case 'edit-question':
                 await commonAction(() => updateQuestion(modalState.question));
                break;
            case 'user':
                await commonAction(async () => {
                    const result = await deleteAdmin(modalState.user);
                    if (result.success) {
                        await fetchAdmins();
                    }
                    return result;
                });
                break;
        }
    };
    
    const modalContent = useMemo(() => {
        if (!modalState.isOpen) return { title: '', children: null, confirmButtonText: undefined, confirmButtonClass: undefined };

        switch (modalState.type) {
            case 'delete-category': {
                const categoryBeingDeleted = modalState.category;
                return {
                    title: 'Confirmar Exclusão de Categoria',
                    children: (
                        <>
                            <p>Você tem certeza que deseja excluir a categoria?</p>
                            <span className="font-bold text-red-500 block mt-2">
                                Atenção: As perguntas dentro da categoria "{categoryBeingDeleted?.name}" NÃO serão excluídas.
                            </span>
                             <p className="mt-2">Esta ação não pode ser desfeita.</p>
                        </>
                    ),
                    confirmButtonText: 'Confirmar Exclusão',
                    confirmButtonClass: 'bg-red-600 hover:bg-red-700'
                };
            }
            case 'edit-category': {
                return {
                    title: 'Confirmar Atualização de Categoria',
                    children: (
                        <>
                           <p>Você tem certeza que deseja renomear a categoria</p>
                           <p className="font-bold my-2">"{modalState.category.name}"</p>
                           <p>para</p>
                           <p className="font-bold my-2">"{modalState.newName}"?</p>
                        </>
                    ),
                    confirmButtonText: 'Confirmar Atualização',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700'
                };
            }
            case 'delete-question':
                return {
                    title: 'Confirmar Exclusão de Pergunta',
                    children: <p>Você tem certeza que deseja excluir a pergunta "<strong>{modalState.question.text}</strong>"? Esta ação não pode ser desfeita.</p>,
                    confirmButtonText: 'Confirmar Exclusão',
                    confirmButtonClass: 'bg-red-600 hover:bg-red-700'
                };
             case 'edit-question': {
                return {
                    title: 'Confirmar Atualização de Pergunta',
                    children: (
                        <p>Você tem certeza que deseja salvar as alterações para a pergunta "<strong>{modalState.question.text}</strong>"?</p>
                    ),
                    confirmButtonText: 'Confirmar Atualização',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700'
                };
            }
            case 'user': {
                return {
                    title: 'Confirmar Exclusão de Administrador',
                    children: <p>Você tem certeza que deseja excluir o administrador "<strong>{modalState.user.name}</strong>"? Esta ação não pode ser desfeita.</p>,
                    confirmButtonText: 'Confirmar Exclusão',
                    confirmButtonClass: 'bg-red-600 hover:bg-red-700'
                };
            }
             case 'add-admin':
                return {
                    title: 'Confirmar Adição de Administrador',
                    children: <p>Você tem certeza que deseja adicionar <strong>{modalState.data.name}</strong> como um novo administrador?</p>,
                    confirmButtonText: 'Confirmar Adição',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700'
                };
            case 'edit-admin':
                 return {
                    title: 'Confirmar Atualização de Administrador',
                    children: <p>Você tem certeza que deseja salvar as alterações para o administrador <strong>{modalState.user.name}</strong>?</p>,
                    confirmButtonText: 'Confirmar Atualização',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700'
                };
            case 'add-category':
                return {
                    title: 'Confirmar Adição de Categoria',
                    children: <p>Você tem certeza que deseja adicionar a nova categoria: <strong>"{modalState.name}"</strong>?</p>,
                    confirmButtonText: 'Confirmar Adição',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700'
                };
            case 'add-question':
                return {
                    title: 'Confirmar Adição de Pergunta',
                    children: <p>Você tem certeza que deseja adicionar a nova pergunta?</p>,
                    confirmButtonText: 'Confirmar Adição',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700'
                };
            case 'approve-user':
                 return {
                    title: 'Confirmar Aprovação de Usuário',
                    children: <p>Você tem certeza que deseja aprovar o usuário <strong>{modalState.user.name}</strong> da empresa <strong>{modalState.user.companyName}</strong>?</p>,
                    confirmButtonText: 'Confirmar Aprovação',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700'
                };
            default:
                return { title: '', children: null, confirmButtonText: undefined, confirmButtonClass: undefined };
        }
    }, [modalState, categories]);

    const FullScreenLoader = () => (
        <div className="fixed inset-0 bg-dark-background bg-opacity-90 z-50 flex flex-col justify-center items-center p-4">
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

    return (
        <>
            {isSubmitting && <FullScreenLoader />}
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold mb-8">Painel do Administrador</h1>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    <div className="space-y-8">
                        <PendingApprovals onApproveRequest={handleApproveRequest} />
                        <AdminUserManager 
                           admins={apiAdmins} 
                           isLoading={isLoadingAdmins}
                           onAddRequest={openAddAdminModal}
                           onUpdateRequest={openUpdateAdminModal}
                           onDeleteRequest={openDeleteUserModal} />
                    </div>
                    <div className="space-y-8">
                        <CategoryManager 
                            onAddRequest={openAddCategoryModal}
                            onUpdateRequest={openUpdateCategoryModal}
                            onDeleteRequest={openDeleteCategoryModal} 
                        />
                        <QuestionManager 
                            onAddRequest={openAddQuestionModal} 
                            onDeleteRequest={openDeleteQuestionModal}
                            onUpdateRequest={openUpdateQuestionModal}
                        />
                    </div>
                </div>
                <div className="mt-8">
                  <ActivityLog />
                </div>
            </div>
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                onConfirm={handleConfirm}
                title={modalContent.title}
                confirmButtonText={modalContent.confirmButtonText}
                confirmButtonClass={modalContent.confirmButtonClass}
            >
                {modalContent.children}
            </ConfirmationModal>
        </>
    );
};

export default AdminPage;