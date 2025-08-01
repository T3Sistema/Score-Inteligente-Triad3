import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { Category, Question } from '../types';

const QuestionnairePage: React.FC = () => {
    const { currentUser, categories, questions, addSubmission, submissions } = useApp();
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    // Store selected answer ID for each question to ensure unique selection
    const [currentAnswers, setCurrentAnswers] = useState<{ [questionId: string]: string }>({});
    const [message, setMessage] = useState('');

    const availableCategories = useMemo(() => {
        if (!currentUser) return [];
        
        const completedCategoryIds = submissions
            .filter(s => s.userId === currentUser.id)
            .map(s => s.categoryId);

        // Filter out completed categories AND categories with no questions
        return categories.filter(category => {
            const isCompleted = completedCategoryIds.includes(category.id);
            const hasQuestions = questions.some(q => q.categoryId === category.id);
            return !isCompleted && hasQuestions;
        });
    }, [categories, questions, submissions, currentUser]);

    const questionsForCategory = useMemo(() => {
        return selectedCategory ? questions.filter(q => q.categoryId === selectedCategory.id) : [];
    }, [selectedCategory, questions]);

    const handleSelectCategory = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        setSelectedCategory(category || null);
        setCurrentAnswers({});
        setMessage('');
    };
    
    // Store the ID of the answer, not the score, to handle unique selections
    const handleAnswerSelect = (questionId: string, answerId: string) => {
        setCurrentAnswers(prev => ({ ...prev, [questionId]: answerId }));
    };

    const handleSubmit = () => {
        if (!currentUser || !selectedCategory) return;

        const answersWithScores: { questionId: string; score: number }[] = [];
        let totalScore = 0;

        // Calculate total score based on the selected answer IDs
        for (const questionId in currentAnswers) {
            const selectedAnswerId = currentAnswers[questionId];
            const question = questionsForCategory.find(q => q.id === questionId);
            const answer = question?.answers.find(a => a.id === selectedAnswerId);

            if (answer) {
                answersWithScores.push({ questionId, score: answer.score });
                totalScore += answer.score;
            }
        }
        
        const maxScore = questionsForCategory.reduce((sum, q) => {
             const questionMaxScore = q.answers.length > 0 ? Math.max(...q.answers.map(a => a.score)) : 0;
             return sum + questionMaxScore;
        }, 0);


        addSubmission({
            userId: currentUser.id,
            companyName: currentUser.companyName,
            categoryId: selectedCategory.id,
            categoryName: selectedCategory.name,
            answers: answersWithScores,
            totalScore,
            maxScore,
        });

        setMessage('Questionário enviado com sucesso! Veja seus resultados no painel.');
        setSelectedCategory(null);
    };

    if (!currentUser) return <p>Por favor, faça login para responder a um questionário.</p>;

    if (message) {
        return (
             <div className="max-w-2xl mx-auto text-center bg-light-card dark:bg-dark-card p-8 rounded-xl shadow-lg border border-light-border dark:border-dark-border">
                <p className="text-xl text-green-600 dark:text-green-400">{message}</p>
                <button onClick={() => window.location.hash = '#dashboard'} className="mt-6 px-6 py-2 font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all">Ir para o Painel</button>
             </div>
        );
    }
    
    if (!selectedCategory) {
        return (
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center">Selecione um Questionário</h1>
                {availableCategories.length > 0 ? (
                    <div className="space-y-4">
                        {availableCategories.map(cat => (
                            <button key={cat.id} onClick={() => handleSelectCategory(cat.id)} className="w-full text-left p-6 bg-light-card dark:bg-dark-card rounded-xl shadow-md border border-light-border dark:border-dark-border hover:shadow-xl hover:border-blue-500 dark:hover:border-cyan-400 hover:-translate-y-1 transition-all duration-300 ease-in-out">
                                <h2 className="text-xl font-semibold text-blue-600 dark:text-cyan-400">{cat.name}</h2>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-center p-8 bg-light-card dark:bg-dark-card rounded-xl shadow-md border border-light-border dark:border-dark-border">Você completou todos os questionários disponíveis.</p>
                )}
            </div>
        );
    }

    const allQuestionsAnswered = Object.keys(currentAnswers).length === questionsForCategory.length;

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={() => setSelectedCategory(null)} className="mb-6 text-sm font-medium text-blue-600 dark:text-cyan-400 hover:underline">&larr; Voltar para as categorias</button>
            <h1 className="text-4xl font-extrabold mb-2">{selectedCategory.name}</h1>
            <p className="mb-8 text-gray-600 dark:text-gray-400">Por favor, responda a todas as perguntas da melhor maneira possível.</p>
            
            <div className="space-y-8">
                {questionsForCategory.map((q, index) => (
                    <div key={q.id} className="p-6 bg-light-card dark:bg-dark-card rounded-xl shadow-md border border-light-border dark:border-dark-border">
                        <p className="font-semibold text-lg mb-4">({index + 1}) {q.text}</p>
                        <div className="space-y-3">
                            {q.answers.map(ans => (
                                <label key={ans.id} className={`block p-4 rounded-lg border-2 transition-all cursor-pointer ${currentAnswers[q.id] === ans.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 dark:border-cyan-400' : 'border-light-border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-blue-400'}`}>
                                    <input type="radio" name={q.id} value={ans.id} checked={currentAnswers[q.id] === ans.id} onChange={() => handleAnswerSelect(q.id, ans.id)} className="hidden" />
                                    <span>{ans.text}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 text-center">
                <button 
                    onClick={handleSubmit} 
                    disabled={!allQuestionsAnswered}
                    className="px-8 py-3 text-lg font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                >
                    Enviar Questionário
                </button>
                 {!allQuestionsAnswered && <p className="text-xs text-red-500 mt-2">Por favor, responda todas as perguntas antes de enviar.</p>}
            </div>
        </div>
    );
};

export default QuestionnairePage;