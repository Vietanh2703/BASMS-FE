import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type {RegionalData, TrendData, TopPerformer, ExecutiveSummaryItem} from '../types';

interface RegionalDistributionProps {
    data: RegionalData[];
}

export const RegionalDistribution: React.FC<RegionalDistributionProps> = React.memo(({ data }) => {
    return (
        <div className="dd-section dd-section-full">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Phân bố địa lý</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-table-container">
                    <table className="dd-table">
                        <thead>
                            <tr>
                                <th>Khu vực</th>
                                <th>Guards</th>
                                <th>Customers</th>
                                <th>Contracts</th>
                                <th>Revenue (tỷ VNĐ)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((region, index) => (
                                <tr key={index}>
                                    <td className="dd-table-region">{region.region}</td>
                                    <td>{region.guards}</td>
                                    <td>{region.customers}</td>
                                    <td>{region.contracts}</td>
                                    <td className="dd-table-revenue">{region.revenue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});

RegionalDistribution.displayName = 'RegionalDistribution';

interface TrendAnalysisProps {
    data: TrendData[];
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = React.memo(({ data }) => {
    return (
        <div className="dd-section dd-section-full">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Phân tích xu hướng & Dự báo</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-chart-container" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Line type="monotone" dataKey="signed" name="Đã ký" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="pending" name="Chờ ký" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="expired" name="Quá hạn" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="dd-forecast-grid">
                    <div className="dd-forecast-item">
                        <div className="dd-forecast-label">Dự báo tháng tới:</div>
                        <div className="dd-forecast-value">
                            <span>Số hợp đồng mới: </span>
                            <strong>28-32</strong>
                        </div>
                        <div className="dd-forecast-value">
                            <span>Doanh thu: </span>
                            <strong>15.8-16.5 tỷ VNĐ</strong>
                        </div>
                        <div className="dd-forecast-value">
                            <span>Nhu cầu tuyển guards: </span>
                            <strong>15-20 người</strong>
                        </div>
                    </div>
                    <div className="dd-forecast-item">
                        <div className="dd-forecast-label">Seasonal Patterns:</div>
                        <div className="dd-forecast-value">
                            <span>Peak season: </span>
                            <strong>Q4 (tăng 35% doanh thu)</strong>
                        </div>
                        <div className="dd-forecast-value">
                            <span>Low season: </span>
                            <strong>Q2 (giảm 12% doanh thu)</strong>
                        </div>
                    </div>
                    <div className="dd-forecast-item">
                        <div className="dd-forecast-label">Growth Metrics:</div>
                        <div className="dd-forecast-value">
                            <span>YoY growth rate: </span>
                            <strong className="dd-text-success">+18.5%</strong>
                        </div>
                        <div className="dd-forecast-value">
                            <span>Customer acquisition: </span>
                            <strong>+2.3/tháng</strong>
                        </div>
                        <div className="dd-forecast-value">
                            <span>Guard retention: </span>
                            <strong>87%</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

TrendAnalysis.displayName = 'TrendAnalysis';

interface TopPerformersAlertsProps {
    managers: TopPerformer[];
    guards: TopPerformer[];
    customers: TopPerformer[];
}

export const TopPerformersAlerts: React.FC<TopPerformersAlertsProps> = React.memo(({ managers, guards, customers }) => {
    return (
        <div className="dd-row-split">
            <div className="dd-section" style={{ flex: 2 }}>
                <div className="dd-section-header">
                    <h2 className="dd-section-title">Top Performers</h2>
                </div>
                <div className="dd-section-content">
                    <div className="dd-performers-grid">
                        <div className="dd-performer-category">
                            <h3 className="dd-performer-title">Managers</h3>
                            {managers.map((manager, index) => (
                                <div key={index} className="dd-performer-item">
                                    <div className="dd-performer-rank">{index + 1}</div>
                                    <div className="dd-performer-info">
                                        <div className="dd-performer-name">{manager.name}</div>
                                        <div className="dd-performer-stats">
                                            {manager.contracts} hợp đồng • {manager.onTimeRate}% on-time • {manager.rating}/5 rating
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="dd-performer-category">
                            <h3 className="dd-performer-title">Guards</h3>
                            {guards.map((guard, index) => (
                                <div key={index} className="dd-performer-item">
                                    <div className="dd-performer-rank">{index + 1}</div>
                                    <div className="dd-performer-info">
                                        <div className="dd-performer-name">{guard.name}</div>
                                        <div className="dd-performer-stats">
                                            {guard.attendance}% attendance • {guard.rating}/5 rating • {guard.incidents} incidents
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="dd-performer-category">
                            <h3 className="dd-performer-title">Customers</h3>
                            {customers.map((customer, index) => (
                                <div key={index} className="dd-performer-item">
                                    <div className="dd-performer-rank">{index + 1}</div>
                                    <div className="dd-performer-info">
                                        <div className="dd-performer-name">{customer.name}</div>
                                        <div className="dd-performer-stats">
                                            {customer.value} tỷ contract value • {customer.years} năm partnership
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dd-section" style={{ flex: 1 }}>
                <div className="dd-section-header">
                    <h2 className="dd-section-title">Cảnh báo & Hành động</h2>
                </div>
                <div className="dd-section-content">
                    <div className="dd-alerts-list">
                        <div className="dd-alert-group">
                            <div className="dd-alert-group-title">Critical Actions</div>
                            <div className="dd-alert-item dd-alert-critical">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <circle cx="12" cy="12" r="10"/>
                                </svg>
                                <span>3 hợp đồng hết hạn hôm nay</span>
                            </div>
                            <div className="dd-alert-item dd-alert-warning">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <circle cx="12" cy="12" r="10"/>
                                </svg>
                                <span>12 guards chấm công muộn &gt;3 lần/tháng</span>
                            </div>
                            <div className="dd-alert-item dd-alert-info">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <circle cx="12" cy="12" r="10"/>
                                </svg>
                                <span>5 khách hàng chưa thanh toán &gt;30 ngày</span>
                            </div>
                        </div>

                        <div className="dd-alert-group">
                            <div className="dd-alert-group-title">Opportunities</div>
                            <div className="dd-alert-item dd-alert-success">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                </svg>
                                <span>8 leads mới cần follow up</span>
                            </div>
                            <div className="dd-alert-item dd-alert-success">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                </svg>
                                <span>15 hợp đồng đến kỳ gia hạn</span>
                            </div>
                        </div>

                        <div className="dd-alert-group">
                            <div className="dd-alert-group-title">System Health</div>
                            <div className="dd-alert-item dd-alert-success">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                </svg>
                                <span>System uptime: 99.8%</span>
                            </div>
                            <div className="dd-alert-item dd-alert-warning">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <circle cx="12" cy="12" r="10"/>
                                </svg>
                                <span>2 servers need update</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

TopPerformersAlerts.displayName = 'TopPerformersAlerts';

interface ExecutiveSummaryProps {
    data: ExecutiveSummaryItem[];
    formatPercent: (value: number, showSign?: boolean) => string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = React.memo(({ data, formatPercent }) => {
    return (
        <div className="dd-section dd-section-full">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Báo cáo điều hành</h2>
                <button className="dd-export-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                    </svg>
                    Export PDF/Excel
                </button>
            </div>
            <div className="dd-section-content">
                <div className="dd-table-container">
                    <table className="dd-table dd-table-summary">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Current</th>
                                <th>Target</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index}>
                                    <td className="dd-table-metric">{item.metric}</td>
                                    <td>{item.current}{item.unit}</td>
                                    <td>{item.target}{item.unit}</td>
                                    <td>
                                        <span className={`dd-status-badge ${item.growth > 0 || (item.metric.includes('Response') && item.growth < 0) ? 'dd-status-success' : 'dd-status-danger'}`}>
                                            {item.growth > 0 || (item.metric.includes('Response') && item.growth < 0) ? '✓' : '✗'} {formatPercent(Math.abs(item.growth))}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="dd-overall-score">
                    <span className="dd-score-label">Overall Performance Score:</span>
                    <span className="dd-score-value">96/100</span>
                    <span className="dd-score-stars">⭐⭐⭐⭐⭐</span>
                </div>
            </div>
        </div>
    );
});

ExecutiveSummary.displayName = 'ExecutiveSummary';
