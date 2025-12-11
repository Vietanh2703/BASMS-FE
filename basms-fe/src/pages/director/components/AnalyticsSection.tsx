import React from 'react';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type {ReportStats, TrendData, ChartDataItem, PerformanceMetrics} from '../types';

interface ReportAnalyticsProps {
    stats: ReportStats;
    trendData: TrendData[];
    distributionData: ChartDataItem[];
}

export const ReportAnalytics: React.FC<ReportAnalyticsProps> = React.memo(({ stats, trendData, distributionData }) => {
    const calculatePercent = (value: number) => stats.total > 0 ? ((value / stats.total) * 100).toFixed(0) : '0';

    return (
        <div className="dd-section dd-section-full">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Phân tích báo cáo</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-stats-grid dd-stats-grid-3">
                    <div className="dd-stat-card">
                        <span className="dd-stat-card-label">Tổng báo cáo</span>
                        <span className="dd-stat-card-value">{stats.total}</span>
                        <span className="dd-stat-card-subtitle">(tháng này)</span>
                    </div>
                    <div className="dd-stat-card">
                        <span className="dd-stat-card-label">Đã xử lý</span>
                        <span className="dd-stat-card-value dd-text-success">{stats.processed}</span>
                        <span className="dd-stat-card-subtitle">({calculatePercent(stats.processed)}%)</span>
                    </div>
                    <div className="dd-stat-card">
                        <span className="dd-stat-card-label">Chờ xử lý</span>
                        <span className="dd-stat-card-value dd-text-warning">{stats.pending}</span>
                        <span className="dd-stat-card-subtitle">({calculatePercent(stats.pending)}%)</span>
                    </div>
                </div>

                <div className="dd-row-split">
                    <div className="dd-chart-container" style={{ flex: 2 }}>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Line type="monotone" dataKey="security" name="Sự cố an ninh" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="patrol" name="Tuần tra" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="equipment" name="Thiết bị" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="performance" name="Hiệu suất" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="dd-chart-container" style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={distributionData as any}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="dd-alert-row">
                    <div className="dd-alert-item dd-alert-critical">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span>{stats.critical} báo cáo khẩn cấp chưa xử lý</span>
                    </div>
                    <div className="dd-alert-item dd-alert-warning">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        <span>{stats.urgent} báo cáo cần phản hồi trong 24h</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

ReportAnalytics.displayName = 'ReportAnalytics';

interface FinancialOverviewProps {
    trendData: TrendData[];
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = React.memo(({ trendData }) => {
    return (
        <div className="dd-section dd-section-half">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Tổng quan tài chính</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-chart-container" style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="revenue" name="Doanh thu (tỷ)" fill="#8b5cf6" radius={[4, 4, 0, 0] as [number, number, number, number]} />
                            <Bar dataKey="cost" name="Chi phí (tỷ)" fill="#ef4444" radius={[4, 4, 0, 0] as [number, number, number, number]} />
                            <Bar dataKey="profit" name="Lợi nhuận (tỷ)" fill="#10b981" radius={[4, 4, 0, 0] as [number, number, number, number]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="dd-metrics-list">
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">HĐ dịch vụ bảo vệ:</span>
                        <span className="dd-metric-value">12.5 tỷ (82%)</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">HĐ lao động:</span>
                        <span className="dd-metric-value">2.7 tỷ (18%)</span>
                    </div>
                    <div className="dd-metric-row dd-metric-highlight">
                        <span className="dd-metric-label">Tổng doanh thu năm:</span>
                        <span className="dd-metric-value">167.3 tỷ VNĐ</span>
                    </div>
                    <div className="dd-metric-row dd-metric-highlight">
                        <span className="dd-metric-label">Lợi nhuận:</span>
                        <span className="dd-metric-value">45.2 tỷ VNĐ (27% margin)</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Revenue per Guard:</span>
                        <span className="dd-metric-value">155.7 triệu/năm</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Customer retention:</span>
                        <span className="dd-metric-value dd-text-success">94%</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

FinancialOverview.displayName = 'FinancialOverview';

interface OperationalExcellenceProps {
    metrics: PerformanceMetrics;
}

export const OperationalExcellence: React.FC<OperationalExcellenceProps> = React.memo(({ metrics }) => {
    return (
        <div className="dd-section dd-section-half">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Hiệu suất vận hành</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-gauge-grid">
                    <div className="dd-gauge-item">
                        <div className="dd-gauge-label">Độ hài lòng KH</div>
                        <div className="dd-gauge-value">{metrics.customerSatisfaction}%</div>
                        <div className="dd-gauge-bar">
                            <div className="dd-gauge-fill dd-gauge-success" style={{ width: `${metrics.customerSatisfaction}%` }}></div>
                        </div>
                        <div className="dd-gauge-status dd-status-success">Tốt</div>
                    </div>
                    <div className="dd-gauge-item">
                        <div className="dd-gauge-label">Tuân thủ SLA</div>
                        <div className="dd-gauge-value">{metrics.slaCompliance}%</div>
                        <div className="dd-gauge-bar">
                            <div className="dd-gauge-fill dd-gauge-success" style={{ width: `${metrics.slaCompliance}%` }}></div>
                        </div>
                        <div className="dd-gauge-status dd-status-success">Tốt</div>
                    </div>
                    <div className="dd-gauge-item">
                        <div className="dd-gauge-label">Chất lượng DV</div>
                        <div className="dd-gauge-value">{metrics.serviceQuality}/5</div>
                        <div className="dd-gauge-bar">
                            <div className="dd-gauge-fill dd-gauge-success" style={{ width: `${(metrics.serviceQuality / 5) * 100}%` }}></div>
                        </div>
                        <div className="dd-gauge-status dd-status-success">Tốt</div>
                    </div>
                </div>

                <div className="dd-metrics-list">
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Thời gian phản hồi sự cố TB:</span>
                        <span className="dd-metric-value">{metrics.avgResponseTime} phút</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Thời gian giải quyết sự cố TB:</span>
                        <span className="dd-metric-value">{metrics.avgResolutionTime} giờ</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Tỷ lệ tuần tra đúng lịch:</span>
                        <span className="dd-metric-value dd-text-success">{metrics.patrolOnTime}%</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Tỷ lệ chấm công đúng giờ:</span>
                        <span className="dd-metric-value dd-text-success">{metrics.attendanceOnTime}%</span>
                    </div>
                    <div className="dd-metric-row dd-metric-highlight">
                        <span className="dd-metric-label">Tổng sự cố tháng này:</span>
                        <span className="dd-metric-value">{metrics.totalIncidents} (↓ 8 so với t.trước)</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

OperationalExcellence.displayName = 'OperationalExcellence';
