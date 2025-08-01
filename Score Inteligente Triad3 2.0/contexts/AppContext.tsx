
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Category, Question, Submission, UserStatus, UserRole, LogEntry, LogType, AnswerOption } from '../types';
import { INITIAL_USERS, INITIAL_CATEGORIES, INITIAL_QUESTIONS } from '../constants';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  categories: Category[];
  questions: Question[];
  submissions: Submission[];
  logs: LogEntry[];
  loading: boolean;
  login: (email: string, password: string, isAdminLogin: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (name: string, companyName: string, email: string, password: string, phone: string) => Promise<{ success: boolean; message?: string }>;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  approveUser: (userToApprove: User) => Promise<{ success: boolean; message?: string }>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (category: Category, newName: string) => Promise<{ success: boolean; message?: string }>;
  deleteCategory: (category: Category) => Promise<{ success: boolean; message?: string }>;
  addQuestion: (categoryId: string, text: string, answers: { text: string; score: number }[]) => Promise<void>;
  updateQuestion: (question: Question) => Promise<{ success: boolean; message?: string }>;
  deleteQuestion: (question: Question) => Promise<{ success: boolean; message?: string }>;
  addSubmission: (submission: Omit<Submission, 'id' | 'date'>) => Promise<void>;
  addAdmin: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; message?: string }>;
  updateAdmin: (originalUser: User, updates: { name?: string; email?: string; phone?: string; password?: string }) => Promise<{ success: boolean; message: string }>;
  deleteAdmin: (userToDelete: User) => Promise<{ success: boolean; message: string }>;
  changePassword: (user: User, currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string; }>;
  changeAdminPassword: (userId: string, email: string, currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string; }>;
  fetchAdminQuestionnaireData: () => Promise<void>;
  fetchPendingUsers: () => Promise<void>;
  fetchApprovedUsersLogs: () => Promise<void>;
  fetchLoginLogs: () => Promise<void>;
  fetchSubmissions: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading from a DB like NOCODB
    setUsers(INITIAL_USERS);
    setCategories(INITIAL_CATEGORIES);
    setQuestions(INITIAL_QUESTIONS);
    
    // Add a default submission for demo purposes
    const initialSubmissions: Submission[] = [
        {
            id: 'sub-initial-1',
            userId: 'company-2-approved',
            companyName: 'Soluções Tech',
            categoryId: 'cat-atendimento',
            categoryName: 'Atendimento ao Cliente',
            answers: [], // Not needed for dashboard view
            totalScore: 42,
            maxScore: 50,
            date: new Date().toISOString()
        }
    ];
    setSubmissions(initialSubmissions);

    const initialLogs: LogEntry[] = [
      {
          id: 'log-initial-1',
          timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
          type: LogType.QUESTIONNAIRE_SUBMISSION,
          message: `Questionário "Atendimento ao Cliente" foi enviado por Soluções Tech.`,
      }
    ];
    setLogs(initialLogs);

    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        setCurrentUser(JSON.parse(loggedInUser));
    }

    setLoading(false);
  }, []);
  
  const addLogEntry = useCallback((type: LogType, message: string, adminDetails?: { id: string; name: string }) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      adminId: adminDetails?.id,
      adminName: adminDetails?.name,
    };
    setLogs(prev => [newLog, ...prev]);
  }, []);

  const login = useCallback(async (email: string, password: string, isAdminLogin: boolean): Promise<{ success: boolean; message?: string }> => {
    if (isAdminLogin) {
      try {
        const response = await fetch('https://webhook.triad3.io/webhook/loginadmscoretriad3', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.resposta === "Sejá bem-vind@") {
          const loggedInUser: User = {
            id: `admin-${email}`,
            name: data.nome,
            email: email,
            companyName: 'Triad3',
            role: UserRole.ADMIN,
            status: UserStatus.APPROVED,
            phone: '',
            passwordHash: '',
          };
          setCurrentUser(loggedInUser);
          localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
          return { success: true };
        } else {
          return { success: false, message: data.resposta || "Usuário ou senha incorretos." };
        }
      } catch (error) {
        console.error('Admin login API error:', error);
        return { success: false, message: "Ocorreu um erro de comunicação ao tentar fazer login." };
      }
    } else {
      try {
        const response = await fetch('https://webhook.triad3.io/webhook/loginusuarioscoretriad3', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.resposta === "Sejá bem-vind@") {
            const loggedInUser: User = {
                id: `user-${email}`,
                name: data.nome,
                email: email,
                companyName: data.empresa,
                phone: data.telefone,
                role: UserRole.COMPANY,
                status: UserStatus.APPROVED,
                passwordHash: '',
            };
            setCurrentUser(loggedInUser);
            // Adiciona ou atualiza o usuário na lista global de usuários para que o Dashboard o encontre.
            setUsers(prev => {
                const otherUsers = prev.filter(u => u.id !== loggedInUser.id);
                return [...otherUsers, loggedInUser];
            });
            localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
            return { success: true };
        } else {
            return { success: false, message: data.resposta || "Credenciais inválidas ou conta não aprovada." };
        }
    } catch (error) {
        console.error('User login API error:', error);
        return { success: false, message: "Ocorreu um erro de comunicação ao tentar fazer login." };
    }
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    window.location.hash = '#login';
  }, []);
  
  const register = useCallback(async (name: string, companyName: string, email: string, password: string, phone: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await fetch('https://webhook.triad3.io/webhook/criacaocontascoreuser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nome: name,
                nome_empresa: companyName,
                email: email,
                senha: password,
                telefone: phone,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // Still add the user to local state for the admin approval flow
            const newUser: User = {
                id: `user-${Date.now()}`,
                name,
                companyName,
                email,
                phone,
                passwordHash: password,
                role: UserRole.COMPANY,
                status: UserStatus.PENDING,
            };
            setUsers(prev => [...prev, newUser]);
            return { success: true, message: data.resposta };
        } else {
            return { success: false, message: data.resposta || "Ocorreu um erro durante o cadastro." };
        }
    } catch (error) {
        console.error('Registration API error:', error);
        return { success: false, message: "Ocorreu um erro de comunicação. Tente novamente." };
    }
  }, []);

  const updateUserStatus = useCallback((userId: string, status: UserStatus) => {
    // Log entries for approvals are now handled by fetching from the API
    setUsers(prevUsers => prevUsers.map(user => (user.id === userId ? { ...user, status } : user)));
  }, []);
  
  const approveUser = useCallback(async (userToApprove: User): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
        return { success: false, message: "Apenas administradores podem aprovar usuários." };
    }

    try {
        const payload: any = {
            nome: userToApprove.name,
            empresa: userToApprove.companyName,
            email: userToApprove.email,
            telefone: userToApprove.phone,
            senha: userToApprove.passwordHash,
            nome_adm: currentUser.name,
            email_adm: currentUser.email,
        };

        const userIdMatch = userToApprove.id.match(/^api-user-(\d+)$/);
        if (userIdMatch && userIdMatch[1]) {
            payload.id = userIdMatch[1];
        }

        const response = await fetch('https://webhook.triad3.io/webhook/aceitarnovouserscore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.resposta === "Usuário cadastrado com sucesso!") {
            updateUserStatus(userToApprove.id, UserStatus.APPROVED);
            return { success: true, message: data.resposta };
        } else {
            return { success: false, message: data.resposta || "A API retornou uma resposta inesperada." };
        }
    } catch (error) {
        console.error('Approve user API error:', error);
        return { success: false, message: "Ocorreu um erro de comunicação ao tentar aprovar o usuário." };
    }
  }, [currentUser, updateUserStatus]);

  const fetchPendingUsers = useCallback(async () => {
    try {
        const response = await fetch('https://webhook.triad3.io/webhook/puxarnovosuserscore');
        if (!response.ok) {
            console.error('Falha ao buscar usuários pendentes da API. Status:', response.status);
            return;
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : []; // Handle empty response

        if (Array.isArray(data)) {
            const apiPendingUsers: User[] = data.map((apiUser: any) => ({
                id: `api-user-${apiUser.id}`,
                name: apiUser.nome,
                companyName: apiUser.empresa,
                email: apiUser.email,
                phone: apiUser.telefone,
                passwordHash: '', 
                role: UserRole.COMPANY,
                status: UserStatus.PENDING,
            }));

            setUsers(prevUsers => {
                const nonPendingUsers = prevUsers.filter(u => u.status !== UserStatus.PENDING);
                const localPendingUsers = prevUsers.filter(u => u.status === UserStatus.PENDING);

                const mergedPendingUsers = apiPendingUsers.map(apiUser => {
                    const localMatch = localPendingUsers.find(localUser => localUser.email === apiUser.email);
                    if (localMatch && localMatch.passwordHash) {
                        return {
                            ...apiUser,
                            passwordHash: localMatch.passwordHash,
                        };
                    }
                    return apiUser;
                });

                return [...nonPendingUsers, ...mergedPendingUsers];
            });
        } else {
             console.error('API para buscar usuários pendentes não retornou um array. Resposta:', data);
        }
    } catch (error) {
        console.error('Erro ao processar busca de usuários pendentes da API:', error);
    }
  }, []);

  const fetchApprovedUsersLogs = useCallback(async () => {
    try {
        const response = await fetch('https://webhook.triad3.io/webhook/puxaruseraprovadoscore');
        if (!response.ok) {
            console.error('Falha ao buscar logs de aprovação da API. Status:', response.status);
            return;
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : []; // Handle empty response

        if (Array.isArray(data)) {
            const approvalLogs: LogEntry[] = data.map((apiLog: any) => {
                const [day, month, year] = apiLog.data.split('/');
                // Create a date object that is timezone-aware to prevent off-by-one day errors.
                const timestamp = new Date(`${year}-${month}-${day}T${apiLog.horario}:00`).toISOString();
                
                return {
                    id: `log-approved-${apiLog.id}`,
                    timestamp,
                    type: LogType.USER_APPROVAL,
                    message: `Usuário "${apiLog.nome}" da empresa "${apiLog.empresa}" foi aprovado.`,
                    adminName: apiLog.aprovado_por,
                };
            });
            
            // Replace existing approval logs with fresh data from the API, keeping other log types.
            setLogs(prevLogs => [
                ...approvalLogs,
                ...prevLogs.filter(log => log.type !== LogType.USER_APPROVAL)
            ]);

        } else {
            console.error('API para buscar logs de aprovação não retornou um array. Resposta:', data);
        }
    } catch (error) {
        console.error('Erro ao processar busca de logs de aprovação da API:', error);
    }
  }, []);

  const fetchLoginLogs = useCallback(async () => {
    try {
        const response = await fetch('https://webhook.triad3.io/webhook/puxarlogscore');
        if (!response.ok) {
            console.error('Falha ao buscar logs de login da API. Status:', response.status);
            return;
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];

        if (Array.isArray(data)) {
            const loginLogs: LogEntry[] = data.map((apiLog: any) => {
                const [day, month, year] = apiLog.data.split('/');
                const timestamp = new Date(`${year}-${month}-${day}T${apiLog.horario}:00`).toISOString();
                
                return {
                    id: `log-login-${apiLog.id}`,
                    timestamp,
                    type: LogType.USER_LOGIN,
                    message: `Usuário "${apiLog.nome}" da empresa "${apiLog.empresa}" fez login.`,
                };
            });
            
            // Replace existing login logs with fresh data from the API
            setLogs(prevLogs => [
                ...loginLogs,
                ...prevLogs.filter(log => log.type !== LogType.USER_LOGIN)
            ]);

        } else {
            console.error('API para buscar logs de login não retornou um array. Resposta:', data);
        }
    } catch (error) {
        console.error('Erro ao processar busca de logs de login da API:', error);
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    if (!categories.length || !questions.length) {
        console.warn("Pré-requisitos (categorias, perguntas) ainda não atendidos para buscar submissões.");
        return;
    }

    try {
        const response = await fetch('https://webhook.triad3.io/webhook/buscarnotasuserscore');
        if (!response.ok) {
            throw new Error(`Falha ao buscar scores da API. Status: ${response.status}`);
        }
        const text = await response.text();
        const apiData = text ? JSON.parse(text) : [];

        if (!Array.isArray(apiData)) {
            console.error('API de busca de scores não retornou um array. Resposta:', apiData);
            setSubmissions([]);
            return;
        }

        if (currentUser?.role === UserRole.ADMIN) {
            // Admin Logic: Aggregate scores by company
            const companyDataMap = new Map<string, any>();
            apiData.forEach(item => {
                if (!companyDataMap.has(item.empresa)) {
                    companyDataMap.set(item.empresa, item);
                }
            });

            const newCompanyUsers: User[] = Array.from(companyDataMap.values()).map((item: any, index: number) => ({
                id: `company-api-${item.empresa.replace(/\s+/g, '-')}-${index}`,
                name: item.nome,
                companyName: item.empresa,
                email: `${item.empresa.toLowerCase().replace(/\s/g, '')}@placeholder.com`,
                phone: item.telefone,
                passwordHash: '',
                role: UserRole.COMPANY,
                status: UserStatus.APPROVED,
            }));
            
            setUsers(prevUsers => [
                ...prevUsers.filter(u => u.status !== UserStatus.APPROVED || u.role === UserRole.ADMIN),
                ...newCompanyUsers
            ]);
            
            const groupedSubmissions = new Map<string, { totalScore: number; count: number; items: any[] }>();
            apiData.forEach((item: any) => {
                const key = `${item.empresa}__${item.categoria}`;
                if (!groupedSubmissions.has(key)) {
                    groupedSubmissions.set(key, { totalScore: 0, count: 0, items: [] });
                }
                const group = groupedSubmissions.get(key)!;
                group.totalScore += item.pontos;
                group.count += 1;
                group.items.push(item);
            });
            
            const aggregatedSubmissions: Submission[] = [];
            for (const [key, group] of groupedSubmissions.entries()) {
                const [companyName, categoryName] = key.split('__');
                
                const user = newCompanyUsers.find(u => u.companyName === companyName);
                const category = categories.find(c => c.name === categoryName);

                if (!user || !category) {
                    console.warn(`Não foi possível encontrar usuário para a empresa "${companyName}" ou categoria "${categoryName}". A submissão agregada será ignorada.`);
                    continue;
                }

                const questionsForCategory = questions.filter(q => q.categoryId === category.id);
                const categoryMaxScore = questionsForCategory.reduce((sum, q) => {
                    const questionMaxScore = q.answers.length > 0 ? Math.max(...q.answers.map(a => a.score)) : 0;
                    return sum + questionMaxScore;
                }, 0);
                
                const totalMaxScoreForGroup = categoryMaxScore > 0 ? (categoryMaxScore * group.count) : 0;
                if (totalMaxScoreForGroup === 0 && group.totalScore > 0) {
                     console.warn(`Pontuação máxima para a categoria "${categoryName}" é zero, mas a pontuação total é ${group.totalScore}. Verifique as perguntas e pontuações.`);
                }

                aggregatedSubmissions.push({
                    id: `sub-agg-${companyName.replace(/\s+/g, '-')}-${category.id}`,
                    userId: user.id,
                    companyName: companyName,
                    categoryId: category.id,
                    categoryName: categoryName,
                    answers: [],
                    totalScore: group.totalScore,
                    maxScore: totalMaxScoreForGroup,
                    date: new Date().toISOString()
                });
            }
            setSubmissions(aggregatedSubmissions);
        } else if (currentUser?.role === UserRole.COMPANY) {
            // Company User Logic: Show only their own scores, not aggregated.
            const userScores = apiData.filter((item: any) =>
                item.telefone === currentUser.phone && item.empresa === currentUser.companyName
            );

            const userSubmissions: Submission[] = userScores.map((item: any) => {
                const category = categories.find(c => c.name === item.categoria);
                if (!category) {
                    console.warn(`Categoria "${item.categoria}" não encontrada para a submissão do usuário.`);
                    return null;
                }

                const questionsForCategory = questions.filter(q => q.categoryId === category.id);
                const maxScore = questionsForCategory.reduce((sum, q) => {
                   const questionMaxScore = q.answers.length > 0 ? Math.max(...q.answers.map(a => a.score)) : 0;
                   return sum + questionMaxScore;
                }, 0);

                return {
                   id: `sub-user-${currentUser.id}-${category.id}-${item.id}`,
                   userId: currentUser.id,
                   companyName: currentUser.companyName,
                   categoryId: category.id,
                   categoryName: category.name,
                   answers: [],
                   totalScore: item.pontos,
                   maxScore: maxScore,
                   date: new Date().toISOString(),
                };
            }).filter((s): s is Submission => s !== null);

            setSubmissions(userSubmissions);
        } else {
            // No user or unknown role, clear submissions
            setSubmissions([]);
        }
        
    } catch (error) {
        console.error('Erro ao processar busca de scores da API:', error);
        // Only clear users if it was an admin fetch that failed
        if (currentUser?.role === UserRole.ADMIN) {
            setUsers(prevUsers => prevUsers.filter(u => u.status !== UserStatus.APPROVED || u.role === UserRole.ADMIN));
        }
        setSubmissions([]);
    }
  }, [categories, questions, currentUser]);

  const fetchAdminQuestionnaireData = useCallback(async () => {
    // Fetch questions first to derive the categories from a single source of truth.
    // This is more robust against inconsistencies between different API endpoints.
    try {
        const response = await fetch('https://webhook.triad3.io/webhook/buscarperguntasscore');
        if (!response.ok) {
            throw new Error(`Falha ao buscar perguntas da API. Status: ${response.status}`);
        }
        const text = await response.text();
        const questionsApiData = text ? JSON.parse(text) : [];

        if (Array.isArray(questionsApiData)) {
            const categoriesFromQuestions = new Map<string, string>();

            // First pass: collect all unique category names to create stable IDs
            questionsApiData.forEach((apiQuestion: any, index: number) => {
                if (apiQuestion.categoria && !categoriesFromQuestions.has(apiQuestion.categoria)) {
                    // Use a more stable ID based on name if possible, fallback to index
                    const id = `cat-derived-${apiQuestion.categoria.toLowerCase().replace(/\s+/g, '-')}`;
                    categoriesFromQuestions.set(apiQuestion.categoria, id);
                }
            });

            const finalCategories: Category[] = Array.from(categoriesFromQuestions.entries())
              .map(([name, id]) => ({ id, name }));
            
            setCategories(finalCategories);

            // Second pass: map questions using the derived category IDs
            const mappedQuestions: Question[] = questionsApiData.map((apiQuestion: any) => {
                const categoryId = categoriesFromQuestions.get(apiQuestion.categoria);
                if (!categoryId) {
                     // This case should ideally not happen due to the first pass
                    return null;
                }
                
                const answers: AnswerOption[] = (apiQuestion.respostas || []).map((apiAnswer: any, index: number) => ({
                    id: `ans-api-${apiQuestion.id}-${index}`,
                    text: apiAnswer.texto,
                    score: apiAnswer.pontos
                }));

                return {
                    id: `q-api-${apiQuestion.id}`,
                    categoryId: categoryId,
                    text: apiQuestion.pergunta,
                    answers: answers
                };
            }).filter((q): q is Question => q !== null);

            setQuestions(mappedQuestions);

        } else {
            console.error('API de perguntas não retornou um array.');
            setQuestions([]);
            setCategories([]);
        }
    } catch (error) {
        console.error("Erro ao processar busca de perguntas da API:", error);
        setQuestions([]);
        setCategories([]);
    }
  }, []);

  const addCategory = useCallback(async (name: string) => {
    try {
      const response = await fetch('https://webhook.triad3.io/webhook/addcategoriascore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (response.ok && data.resposta === "Categoria adicionada com sucesso!") {
        const newCategory: Category = { id: `cat-${Date.now()}`, name };
        setCategories(prev => [...prev, newCategory]);
      } else {
        console.error('Failed to add category via API:', data);
        throw new Error(data.resposta || 'Falha ao adicionar categoria.');
      }
    } catch (error) {
      console.error('API error while adding category:', error);
      throw error;
    }
  }, []);
  
  const updateCategory = useCallback(async (category: Category, newName:string): Promise<{ success: boolean; message?: string; }> => {
    try {
      const response = await fetch('https://webhook.triad3.io/webhook/editarcategoriascore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'editar-categoria',
          id: category.id,
          nome_antigo: category.name,
          nome_novo: newName,
        }),
      });
      const data = await response.json();
      if (response.ok && data.resposta === "Categoria atualizada com sucesso!") {
        setCategories(cats => cats.map(cat => cat.id === category.id ? { ...cat, name: newName } : cat));
        return { success: true, message: data.resposta };
      } else {
        return { success: false, message: data.resposta || 'Falha ao atualizar categoria.' };
      }
    } catch (error) {
       console.error('API error while updating category:', error);
       return { success: false, message: 'Ocorreu um erro de comunicação.' };
    }
  }, []);

  const deleteCategory = useCallback(async (category: Category): Promise<{ success: boolean; message?: string; }> => {
    try {
      const response = await fetch('https://webhook.triad3.io/webhook/editarcategoriascore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'excluir-categoria',
          id: category.id,
          nome: category.name,
        }),
      });
      const data = await response.json();
      if (response.ok && data.resposta === "Categoria excluida com sucesso!") {
        setCategories(cats => cats.filter(cat => cat.id !== category.id));
        // As per user request, questions are no longer deleted when their category is deleted.
        // setQuestions(qs => qs.filter(q => q.categoryId !== category.id));
        return { success: true, message: data.resposta };
      } else {
         return { success: false, message: data.resposta || 'Falha ao excluir categoria.' };
      }
    } catch (error) {
      console.error('API error while deleting category:', error);
      return { success: false, message: 'Ocorreu um erro de comunicação.' };
    }
  }, []);

  const addQuestion = useCallback(async (categoryId: string, text: string, answersData: { text: string; score: number }[]) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
        const errorMessage = "Categoria não encontrada para adicionar a pergunta.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    try {
      const response = await fetch('https://webhook.triad3.io/webhook/addperguntasscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            categoryId, 
            categoria: category.name, 
            text, 
            answers: answersData 
        }),
      });
      const data = await response.json();
      if (response.ok && data.resposta === "Pergunta adicionada com sucesso!") {
        const newQuestion: Question = {
          id: `q-${Date.now()}`,
          categoryId,
          text,
          answers: answersData.map((a, i) => ({ id: `ans-${Date.now()}-${i}`, ...a })),
        };
        setQuestions(prev => [...prev, newQuestion]);
      } else {
        console.error('Failed to add question via API:', data);
        throw new Error(data.resposta || 'Falha ao adicionar pergunta.');
      }
    } catch (error) {
      console.error('API error while adding question:', error);
      throw error;
    }
  }, [categories]);

  const updateQuestion = useCallback(async (question: Question): Promise<{ success: boolean; message?: string; }> => {
    const category = categories.find(c => c.id === question.categoryId);
    if (!category) {
        return { success: false, message: 'Categoria da pergunta não encontrada.' };
    }

    try {
        const payload = {
            id: question.id,
            pergunta: question.text,
            categoria_id: question.categoryId,
            categoria_nome: category.name,
            respostas: question.answers.map(a => ({ texto: a.text, pontos: a.score }))
        };

        const response = await fetch('https://webhook.triad3.io/webhook/editarperguntascore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.resposta === "Pergunta editada com sucesso!") {
            setQuestions(qs => qs.map(q => (q.id === question.id ? question : q)));
            return { success: true, message: data.resposta };
        } else {
            return { success: false, message: data.resposta || 'Falha ao atualizar pergunta.' };
        }
    } catch (error) {
        console.error('API error while updating question:', error);
        return { success: false, message: 'Ocorreu um erro de comunicação.' };
    }
  }, [categories]);

  const deleteQuestion = useCallback(async (question: Question): Promise<{ success: boolean; message?: string; }> => {
    try {
        const response = await fetch('https://webhook.triad3.io/webhook/excluirperguntascore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(question),
        });

        const data = await response.json();

        if (response.ok && data.resposta === "Pergunta excluida com sucesso!") {
            setQuestions(qs => qs.filter(q => q.id !== question.id));
            return { success: true, message: data.resposta };
        } else {
            return { success: false, message: data.resposta || 'Falha ao excluir pergunta.' };
        }
    } catch (error) {
        console.error('API error while deleting question:', error);
        return { success: false, message: 'Ocorreu um erro de comunicação.' };
    }
  }, []);
  
  const addSubmission = useCallback(async (submissionData: Omit<Submission, 'id' | 'date'>) => {
    if (!currentUser) {
      console.error("Não há usuário logado para enviar o questionário.");
      return;
    }
    
    // 1. Update local state for immediate UI feedback.
    const newSubmission: Submission = {
      ...submissionData,
      id: `sub-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setSubmissions(prev => [...prev, newSubmission]);
    addLogEntry(
      LogType.QUESTIONNAIRE_SUBMISSION,
      `Questionário "${newSubmission.categoryName}" foi enviado por ${newSubmission.companyName}.`
    );

    // 2. Prepare and send the detailed payload to the webhook.
    try {
      const detailedAnswers = submissionData.answers.map(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        const selectedAnswerOption = question?.answers.find(a => a.score === answer.score);
        return {
          questionId: answer.questionId,
          questionText: question?.text || 'Não encontrado',
          selectedAnswerText: selectedAnswerOption?.text || 'Não encontrado',
          score: answer.score
        };
      });

      const payload = {
        userData: {
          id: currentUser.id,
          name: currentUser.name,
          companyName: currentUser.companyName,
          email: currentUser.email,
          phone: currentUser.phone,
        },
        questionnaireData: {
          categoryId: submissionData.categoryId,
          categoryName: submissionData.categoryName,
          totalScore: submissionData.totalScore,
          maxScore: submissionData.maxScore,
          submissionDate: newSubmission.date,
          answers: detailedAnswers
        }
      };

      const response = await fetch('https://webhook.triad3.io/webhook/receberrespostasscore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || data.resposta !== "Respostas recebidas com sucesso!") {
        // Log error but don't disrupt user flow as UI is already updated.
        console.error('Falha ao enviar respostas para a API:', data.resposta || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro de rede ao enviar respostas para a API:', error);
    }
  }, [currentUser, questions, addLogEntry]);

  const addAdmin = useCallback(async (name: string, email: string, password: string, phone: string): Promise<{ success: boolean; message?: string; }> => {
    try {
        const response = await fetch('https://webhook.triad3.io/webhook/addadmscore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome: name, email, senha: password, telefone: phone }),
        });

        const data = await response.json();

        if (response.ok && data.resposta === "ADM adicionado com sucesso!") {
            return { success: true, message: data.resposta };
        } else {
            return { success: false, message: data.resposta || "Falha ao adicionar administrador." };
        }
    } catch (error) {
        console.error('Add admin API error:', error);
        return { success: false, message: "Ocorreu um erro de comunicação ao tentar adicionar o administrador." };
    }
  }, []);

  const updateAdmin = useCallback(async (originalUser: User, updates: { name?: string; email?: string; phone?: string; password?: string }): Promise<{ success: boolean; message: string; }> => {
    const endpoint = 'https://webhook.triad3.io/webhook/editaradmscore';

    const makeRequest = async (payload: any) => {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok || data.resposta !== "Dados atualizados com sucesso!") {
            throw new Error(data.resposta || 'Falha ao atualizar dados.');
        }
    };

    try {
        let updatesMade = 0;
        if (updates.name && updates.name !== originalUser.name) {
            await makeRequest({ id: originalUser.id, tipo_dado: 'Nome', nome_atual: originalUser.name, atualizacao: updates.name });
            updatesMade++;
        }
        if (updates.email && updates.email !== originalUser.email) {
            await makeRequest({ id: originalUser.id, tipo_dado: 'E-mail', email_atual: originalUser.email, atualizacao: updates.email });
            updatesMade++;
        }
        if (updates.phone && updates.phone !== originalUser.phone) {
            await makeRequest({ id: originalUser.id, tipo_dado: 'Telefone', telefone_atual: originalUser.phone, atualizacao: updates.phone });
            updatesMade++;
        }
        if (updates.password) {
            await makeRequest({ id: originalUser.id, tipo_dado: 'Senha', atualizacao: updates.password });
            updatesMade++;
        }

        if (updatesMade > 0) {
            return { success: true, message: 'Dados atualizados com sucesso!' };
        } else {
            return { success: true, message: 'Nenhuma alteração para salvar.' };
        }
    } catch (error) {
        console.error('API error while updating admin:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Ocorreu um erro de comunicação.' };
    }
  }, []);

  const deleteAdmin = useCallback(async (userToDelete: User): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await fetch('https://webhook.triad3.io/webhook/excluiradmscore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userToDelete),
        });

        const data = await response.json();

        if (response.ok && data.resposta === "Excluído com sucesso!") {
            return { success: true, message: data.resposta };
        } else {
            return { success: false, message: data.resposta || "A API retornou uma resposta inesperada." };
        }
    } catch (error) {
        console.error('Delete admin API error:', error);
        return { success: false, message: "Ocorreu um erro de comunicação ao tentar excluir o administrador." };
    }
  }, []);
  
  const changePassword = useCallback(async (user: User, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string; }> => {
    try {
        const response = await fetch('https://webhook.triad3.io/webhook/novasenhauserscore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: user.id,
                nome: user.name,
                empresa: user.companyName,
                email: user.email,
                telefone: user.phone,
                senha_atual: currentPassword,
                senha_nova: newPassword
            }),
        });

        const data = await response.json();

        if (response.ok && data.resposta === "Aatualizado com sucesso!") {
            return { success: true, message: "Senha alterada com sucesso!" };
        } else {
            return { success: false, message: data.resposta || "Falha ao alterar a senha." };
        }
    } catch (error) {
        console.error('Change user password API error:', error);
        return { success: false, message: "Ocorreu um erro de comunicação ao tentar alterar a senha." };
    }
  }, []);

  const changeAdminPassword = useCallback(async (userId: string, email: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string; }> => {
    try {
        const response = await fetch('https://webhook.triad3.io/webhook/novasenhaadmscore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: userId,
                email: email,
                senha_atual: currentPassword,
                senha_nova: newPassword
            }),
        });

        const data = await response.json();

        if (response.ok && data.resposta === "Aatualizado com sucesso!") {
            return { success: true, message: "Senha alterada com sucesso!" };
        } else {
            return { success: false, message: data.resposta || "Falha ao alterar a senha." };
        }
    } catch (error) {
        console.error('Change admin password API error:', error);
        return { success: false, message: "Ocorreu um erro de comunicação ao tentar alterar a senha." };
    }
  }, []);

  const contextValue = React.useMemo(() => ({
    currentUser, users, categories, questions, submissions, loading, logs,
    login, logout, register, updateUserStatus, addCategory, updateCategory, deleteCategory,
    addQuestion, updateQuestion, deleteQuestion, addSubmission, addAdmin, updateAdmin, deleteAdmin,
    changePassword, changeAdminPassword, fetchAdminQuestionnaireData, fetchPendingUsers, approveUser, fetchApprovedUsersLogs,
    fetchLoginLogs,
    fetchSubmissions
  }), [
    currentUser, users, categories, questions, submissions, loading, logs,
    login, logout, register, updateUserStatus, addCategory, updateCategory, deleteCategory,
    addQuestion, updateQuestion, deleteQuestion, addSubmission, addAdmin, updateAdmin, deleteAdmin,
    changePassword, changeAdminPassword, fetchAdminQuestionnaireData, fetchPendingUsers, approveUser, fetchApprovedUsersLogs,
    fetchLoginLogs,
    fetchSubmissions
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
