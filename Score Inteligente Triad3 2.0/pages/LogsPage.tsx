
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { LogType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LogsPage: React.FC = () => {
    const { logs, currentUser, fetchLoginLogs, fetchApprovedUsersLogs } = useApp();
    const [logTypeFilter, setLogTypeFilter] = useState<LogType>(LogType.USER_APPROVAL);

    // Fetch logs when filter changes or component mounts
    useEffect(() => {
        if (currentUser?.role !== 'admin') return;

        const fetchData = async () => {
            if (logTypeFilter === LogType.USER_LOGIN) {
                await fetchLoginLogs();
            } else if (logTypeFilter === LogType.USER_APPROVAL) {
                await fetchApprovedUsersLogs();
            }
        };

        fetchData();
    }, [logTypeFilter, fetchLoginLogs, fetchApprovedUsersLogs, currentUser]);

    const filteredLogs = useMemo(() => {
        return logs
            .filter(log => log.type === logTypeFilter)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [logs, logTypeFilter]);

    const chartData = useMemo(() => {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0); // Start of 7 days ago

        const dataMap = new Map<string, number>();
        // Initialize map with all 7 days to ensure they appear on the chart
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateString = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            dataMap.set(dateString, 0);
        }

        // Populate map with data from logs
        filteredLogs.forEach(log => {
            const logDate = new Date(log.timestamp);
            if (logDate >= startDate && logDate <= today) {
                 const dateString = logDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                 if (dataMap.has(dateString)) {
                     dataMap.set(dateString, (dataMap.get(dateString) || 0) + 1);
                 }
            }
        });

        return Array.from(dataMap.entries()).map(([date, count]) => ({
            date,
            count
        }));
    }, [filteredLogs]);

    const chartTitle = logTypeFilter === LogType.USER_APPROVAL ? 'Aprovações por Dia' : 'Logins de Usuários por Dia';

    // Redirect if not admin (safety measure)
    if (currentUser?.role !== 'admin') {
        window.location.hash = '#dashboard';
        return null;
    }

    return (
        <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Registros de Atividades (Logs)</h1>
                <div className="flex items-center gap-2">
                    <label htmlFor="log-type-select" className="text-sm font-medium shrink-0">Filtrar por:</label>
                    <select
                        id="log-type-select"
                        value={logTypeFilter}
                        onChange={(e) => setLogTypeFilter(e.target.value as LogType)}
                        className="p-2 border border-dark-border rounded-lg bg-dark-card focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={LogType.USER_APPROVAL}>Logs de Aprovação</option>
                        <option value={LogType.USER_LOGIN}>Logs de Login</option>
                    </select>
                </div>
            </div>
            
            {/* Chart */}
            <div className="bg-dark-card p-6 rounded-xl shadow-lg border border-dark-border mb-8">
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">{chartTitle} (Últimos 7 dias)</h2>
                 {filteredLogs.length > 0 ? (
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9CA3AF" />
                                <YAxis allowDecimals={false} stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        borderColor: '#374151',
                                        color: '#F3F4F6'
                                    }}
                                    labelStyle={{ color: '#9CA3AF' }}
                                />
                                <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                                <Bar dataKey="count" name="Eventos" fill="#17A2B8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 ) : (
                    <p className="text-center text-gray-400 py-10">Não há dados suficientes para exibir o gráfico.</p>
                 )}
            </div>

            {/* Log List */}
            <div className="bg-dark-card p-6 rounded-xl shadow-lg border border-dark-border">
                <h2 className="text-xl font-semibold mb-4">Detalhes dos Logs</h2>
                {filteredLogs.length > 0 ? (
                    <div className="max-h-[600px] overflow-y-auto pr-2">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-dark-card z-10">
                                <tr className="border-b border-dark-border">
                                    <th className="py-2 pr-2 font-semibold">Data e Hora</th>
                                    <th className="py-2 px-2 font-semibold">Mensagem</th>
                                    {logTypeFilter === LogType.USER_APPROVAL && <th className="py-2 pl-2 font-semibold">Aprovado Por</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="border-b border-dark-border last:border-0 hover:bg-dark-background/50 transition-colors">
                                        <td className="py-3 pr-2 whitespace-nowrap text-sm text-gray-400 font-mono">
                                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="py-3 px-2 text-sm">{log.message}</td>
                                        {logTypeFilter === LogType.USER_APPROVAL && (
                                            <td className="py-3 pl-2 text-sm text-gray-300">{log.adminName || 'N/A'}</td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-10">Nenhum log encontrado para este filtro.</p>
                )}
            </div>
        </div>
    );
};

export default LogsPage;
