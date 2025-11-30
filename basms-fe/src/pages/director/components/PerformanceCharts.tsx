import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import type {ContractStats, DashboardStats, TrendData, ChartDataItem} from '../types';

interface ContractPerformanceProps {
    stats: ContractStats;
    distributionData: ChartDataItem[];
}

export const ContractPerformance: React.FC<ContractPerformanceProps> = React.memo(({ stats, distributionData }) => {
    const total = stats.signed + stats.pending + stats.expired;
    const calculatePercent = (value: number) => total > 0 ? ((value / total) * 100).toFixed(0) : '0';

    return (
        <div className="dd-section dd-section-half">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Hợp đồng tổng quan</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-stats-grid">
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Đã ký</span>
                        <span className="dd-stat-value dd-text-success">{stats.signed}</span>
                        <span className="dd-stat-percent">({calculatePercent(stats.signed)}%)</span>
                    </div>
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Chờ ký</span>
                        <span className="dd-stat-value dd-text-warning">{stats.pending}</span>
                        <span className="dd-stat-percent">({calculatePercent(stats.pending)}%)</span>
                    </div>
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Quá hạn</span>
                        <span className="dd-stat-value dd-text-danger">{stats.expired}</span>
                        <span className="dd-stat-percent">({calculatePercent(stats.expired)}%)</span>
                    </div>
                </div>

                <div className="dd-chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={distributionData as any}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {distributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="dd-metrics-list">
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">HĐ lao động quản lý:</span>
                        <span className="dd-metric-value">{stats.managerLabor} (5%)</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">HĐ lao động bảo vệ:</span>
                        <span className="dd-metric-value">{stats.guardLabor} (87%)</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">HĐ dịch vụ bảo vệ:</span>
                        <span className="dd-metric-value">{stats.guardService} (8%)</span>
                    </div>
                    <div className="dd-metric-row dd-metric-highlight">
                        <span className="dd-metric-label">Thời gian duyệt TB:</span>
                        <span className="dd-metric-value">{stats.avgApprovalTime} ngày</span>
                    </div>
                    <div className="dd-metric-row dd-metric-highlight">
                        <span className="dd-metric-label">Tỷ lệ ký thành công:</span>
                        <span className="dd-metric-value">{stats.successRate}%</span>
                    </div>
                    <div className="dd-metric-row dd-metric-highlight">
                        <span className="dd-metric-label">Sắp hết hạn (30 ngày):</span>
                        <span className="dd-metric-value dd-text-warning">{stats.expiringContracts}</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

ContractPerformance.displayName = 'ContractPerformance';

interface PersonnelAnalyticsProps {
    data: TrendData[];
    dashboardStats: DashboardStats;
}

export const PersonnelAnalytics: React.FC<PersonnelAnalyticsProps> = React.memo(({ data, dashboardStats }) => {
    return (
        <div className="dd-section dd-section-half">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Phân tích nhân sự</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-chart-container" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="managers" name="Managers" fill="#8b5cf6" radius={[4, 4, 0, 0] as [number, number, number, number]} />
                            <Bar dataKey="guards" name="Guards" fill="#10b981" radius={[4, 4, 0, 0] as [number, number, number, number]} />
                            <Bar dataKey="customers" name="Customers" fill="#3b82f6" radius={[4, 4, 0, 0] as [number, number, number, number]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="dd-metrics-list">
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Manager/Guard Ratio:</span>
                        <span className="dd-metric-value">
                            1:{dashboardStats.managers > 0 ? (dashboardStats.guards / dashboardStats.managers).toFixed(1) : '0'}
                        </span>
                        <span className="dd-metric-badge dd-badge-success">Tốt</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Customer/Manager Ratio:</span>
                        <span className="dd-metric-value">
                            {dashboardStats.managers > 0 ? (dashboardStats.customers / dashboardStats.managers).toFixed(1) : '0'}:1
                        </span>
                        <span className="dd-metric-badge dd-badge-success">Tốt</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

PersonnelAnalytics.displayName = 'PersonnelAnalytics';
