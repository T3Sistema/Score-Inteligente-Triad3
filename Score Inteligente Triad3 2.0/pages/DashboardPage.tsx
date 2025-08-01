

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { UserRole, Submission } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Maturity levels updated with chart colors for visual identity
const maturityLevels = [
    { level: 'Crítico', range: '0 - 30%', icon: '🔴', color: 'bg-red-900/50', chartColor: '#EF4444' },
    { level: 'Precário', range: '31 - 50%', icon: '🟠', color: 'bg-orange-900/50', chartColor: '#F97316' },
    { level: 'Mediano', range: '51 - 70%', icon: '🟡', color: 'bg-yellow-900/50', chartColor: '#EAB308' },
    { level: 'Avançado', range: '71 - 100%', icon: '🟢', color: 'bg-green-900/50', chartColor: '#22C55E' },
];

const getMaturityLevel = (score: number, maxScore: number) => {
    if (maxScore === 0) return maturityLevels[0];
    const percentage = (score / maxScore) * 100;
    if (percentage <= 30) return maturityLevels[0];
    if (percentage <= 50) return maturityLevels[1];
    if (percentage <= 70) return maturityLevels[2];
    return maturityLevels[3];
};


const DashboardPage: React.FC = () => {
    const { currentUser, submissions, users, fetchSubmissions } = useApp();
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    // Fetch data when the component mounts for any logged-in user.
    useEffect(() => {
        if (currentUser && fetchSubmissions) {
            fetchSubmissions();
        }
    }, [currentUser?.id, fetchSubmissions]);

    // Set the selected user and category based on available data.
    useEffect(() => {
        if (currentUser?.role === UserRole.ADMIN) {
            const approvedCompanies = users.filter(u => u.role === UserRole.COMPANY && u.status === 'approved');
            const currentSelectionIsValid = approvedCompanies.some(u => u.id === selectedUserId);

            // If current selection is no longer valid (e.g., users reloaded), select the first one.
            if (approvedCompanies.length > 0 && !currentSelectionIsValid) {
                setSelectedUserId(approvedCompanies[0].id);
            }
        } else {
            setSelectedUserId(currentUser?.id || '');
        }
    }, [currentUser, users, selectedUserId]);

    const { userSubmissions, completedCategories, selectedSubmission } = useMemo(() => {
        const targetUserId = currentUser?.role === UserRole.ADMIN ? selectedUserId : currentUser?.id;
        const selectedUser = users.find(u => u.id === targetUserId);

        if (!targetUserId || !selectedUser) {
            return { userSubmissions: [], completedCategories: [], selectedSubmission: null };
        }

        const submissionsForUser = submissions.filter(sub => sub.userId === targetUserId);
        
        const uniqueCategories = submissionsForUser.reduce((acc, sub) => {
            if (!acc.find(c => c.id === sub.categoryId)) {
                acc.push({ id: sub.categoryId, name: sub.categoryName });
            }
            return acc;
        }, [] as { id: string, name: string }[]);
        
        // Don't calculate an aggregated submission if we are in compare view
        if (selectedCategoryId === 'compare-all') {
             return {
                userSubmissions: submissionsForUser,
                completedCategories: uniqueCategories,
                selectedSubmission: null
            };
        }
        
        let submission: Submission | null = null;
        if (selectedCategoryId === 'all-categories' && submissionsForUser.length > 0) {
            const totalScore = submissionsForUser.reduce((sum, s) => sum + s.totalScore, 0);
            const maxScore = submissionsForUser.reduce((sum, s) => sum + s.maxScore, 0);
            submission = {
                id: 'aggregated-submission',
                userId: targetUserId,
                companyName: selectedUser.companyName,
                categoryId: 'all-categories',
                categoryName: 'Resultado Geral',
                answers: [],
                totalScore,
                maxScore,
                date: new Date().toISOString()
            };
        } else {
            submission = submissionsForUser.find(sub => sub.categoryId === selectedCategoryId) || null;
        }

        return {
            userSubmissions: submissionsForUser,
            completedCategories: uniqueCategories,
            selectedSubmission: submission
        };
    }, [currentUser, users, selectedUserId, selectedCategoryId, submissions]);
    
    // Effect to auto-select a view when the user or available submissions change
    useEffect(() => {
        if (completedCategories.length === 0) {
            setSelectedCategoryId('');
            return;
        }

        const isSelectionValid = selectedCategoryId && (['compare-all', 'all-categories'].includes(selectedCategoryId) || completedCategories.some(c => c.id === selectedCategoryId));

        if (!isSelectionValid) {
            if (completedCategories.length > 1) {
                setSelectedCategoryId('compare-all'); // Default to comparison view
            } else if (completedCategories.length === 1) {
                setSelectedCategoryId(completedCategories[0].id);
            } else {
                setSelectedCategoryId('');
            }
        }
    }, [completedCategories, selectedCategoryId]);


    if (!currentUser) return null;

    const companyList = users.filter(u => u.role === UserRole.COMPANY && u.status === 'approved');
    const selectedUser = users.find(u => u.id === selectedUserId);
    
    const renderContent = () => {
        if (currentUser.role === UserRole.ADMIN && companyList.length === 0) {
            return (
                <div className="text-center py-16 bg-dark-card rounded-xl shadow-lg border border-dark-border">
                    <p className="text-lg text-gray-400">
                       Nenhuma empresa com score foi encontrada no sistema.
                    </p>
                </div>
            );
        }
        
        if (userSubmissions.length === 0) {
            return (
                 <div className="text-center py-16 bg-dark-card rounded-xl shadow-lg border border-dark-border">
                    <p className="text-lg text-gray-400">
                        {currentUser.role === UserRole.ADMIN ? `${selectedUser?.companyName || 'Esta empresa'} ainda não completou nenhum questionário.` : 'Você ainda não completou nenhum questionário.'}
                    </p>
                    {currentUser.role !== UserRole.ADMIN && (
                        <button onClick={() => window.location.hash = '#questionnaire'} className="mt-6 px-6 py-2 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all">
                            Responder um Questionário
                        </button>
                    )}
                </div>
            );
        }

        if (selectedCategoryId === 'compare-all') {
            return (
                <div>
                    <h2 className="text-2xl font-bold mb-6">Visão Comparativa</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {userSubmissions.map(submission => {
                            const maturity = getMaturityLevel(submission.totalScore, submission.maxScore);
                            const percentage = submission.maxScore > 0 ? ((submission.totalScore / submission.maxScore) * 100).toFixed(0) : 0;
                            const chartData = [
                                { name: 'Score', value: submission.totalScore },
                                { name: 'Remaining', value: Math.max(0, submission.maxScore - submission.totalScore) },
                            ];
                            const cardChartColors = [maturity.chartColor, '#374151'];

                            return (
                                <div key={submission.id} className="bg-dark-card p-4 rounded-xl shadow-lg border border-dark-border flex flex-col items-center">
                                    <h3 className="text-lg font-semibold text-center text-cyan-400 mb-2">{submission.categoryName}</h3>
                                    <div style={{ width: '100%', height: 180, position: 'relative' }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={70} startAngle={90} endAngle={450} cornerRadius={5}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={cardChartColors[index]} stroke="none" />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-3xl font-bold">{percentage}%</span>
                                            <span className="text-xs text-gray-400">{submission.totalScore} / {submission.maxScore} pts</span>
                                        </div>
                                    </div>
                                    <div className={`mt-2 text-center font-semibold p-2 rounded-lg w-full ${maturity.color}`}>
                                        {maturity.icon} {maturity.level}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (selectedSubmission) {
            const currentMaturity = getMaturityLevel(selectedSubmission.totalScore, selectedSubmission.maxScore);
            const chartData = [
                { name: 'Pontuação Obtida', value: selectedSubmission.totalScore },
                { name: 'Restante', value: Math.max(0, selectedSubmission.maxScore - selectedSubmission.totalScore) },
            ];
            const chartColors = [currentMaturity.chartColor, '#374151'];

            return (
                 <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Chart */}
                    <div className="lg:col-span-2 bg-dark-card p-6 rounded-xl shadow-lg border border-dark-border flex flex-col items-center justify-center">
                         <h3 className="text-xl font-semibold mb-4 text-center text-cyan-400">Score: {selectedSubmission.categoryName}</h3>
                        <div style={{ width: '100%', height: 250, position: 'relative' }}>
                             <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={90} startAngle={90} endAngle={450} cornerRadius={5} paddingAngle={2}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} stroke={'#1F2937'} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-bold text-dark-text">{selectedSubmission.maxScore > 0 ? ((selectedSubmission.totalScore / selectedSubmission.maxScore) * 100).toFixed(0) : 0}%</span>
                                <span className="text-sm text-gray-400">{selectedSubmission.totalScore} / {selectedSubmission.maxScore} pts</span>
                            </div>
                        </div>
                    </div>
                    {/* Maturity Legend */}
                    <div className="lg:col-span-3 bg-dark-card p-6 rounded-xl shadow-lg border border-dark-border">
                        <h3 className="text-xl font-semibold mb-4 text-cyan-400">Nível de Maturidade</h3>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-dark-border">
                                        <th className="py-2 pr-2 font-semibold">Faixa de Pontuação (%)</th>
                                        <th className="py-2 px-2 font-semibold">Nível de Maturidade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {maturityLevels.map((level, index) => (
                                        <tr key={index} className={`border-b border-dark-border last:border-0 transition-all ${currentMaturity?.level === level.level ? `${level.color} font-bold` : ''}`}>
                                            <td className="py-3 pr-2">{level.range}</td>
                                            <td className="py-3 px-2">{level.icon} {level.level}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }
        
        return null; // Fallback if no view is selected
    }

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Painel de Resultados</h1>
                <div className="flex flex-wrap items-center gap-4">
                    {currentUser.role === UserRole.ADMIN && companyList.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="company-select" className="text-sm font-medium shrink-0">Visualizando:</label>
                            <select
                                id="company-select"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="p-2 border border-dark-border rounded-lg bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {companyList.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                            </select>
                        </div>
                    )}
                    {userSubmissions.length > 0 && (
                         <div className="flex items-center gap-2">
                            <label htmlFor="category-select" className="text-sm font-medium shrink-0">Visualização:</label>
                             <select
                                id="category-select"
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                className="p-2 border border-dark-border rounded-lg bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500"
                             >
                                 <option value="" disabled>-- Selecione --</option>
                                 {completedCategories.length > 1 && <option value="compare-all">Visão Comparativa</option>}
                                 {completedCategories.length > 1 && <option value="all-categories">Resultado Geral</option>}
                                 {completedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                         </div>
                    )}
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default DashboardPage;