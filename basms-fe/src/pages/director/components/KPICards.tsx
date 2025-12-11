import React from 'react';
import type {DashboardStats} from '../types';

interface KPICardsProps {
    stats: DashboardStats;
    formatCurrency: (value: number) => string;
    formatPercent: (value: number, showSign?: boolean) => string;
}

const KPICards: React.FC<KPICardsProps> = React.memo(({ stats, formatCurrency, formatPercent }) => {
    return (
        <>
            {/* Row 1: Core Metrics */}
            <div className="dd-kpi-row">
                <div className="dd-kpi-card dd-kpi-primary">
                    <div className="dd-kpi-header">
                        <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        <span className="dd-kpi-label">Tổng Users</span>
                    </div>
                    <div className="dd-kpi-value">{stats.totalUsers.toLocaleString()}</div>
                    <div className="dd-kpi-footer">
                        <span className="dd-kpi-subtitle">(trừ admin)</span>
                        <span className={`dd-kpi-trend ${stats.userGrowth > 0 ? 'dd-trend-up' : 'dd-trend-down'}`}>
                            {stats.userGrowth > 0 ? '↑' : '↓'} {formatPercent(stats.userGrowth)} t.trước
                        </span>
                    </div>
                </div>

                <div className="dd-kpi-card dd-kpi-success">
                    <div className="dd-kpi-header">
                        <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        <span className="dd-kpi-label">Hợp đồng</span>
                    </div>
                    <div className="dd-kpi-value">{stats.totalContracts.toLocaleString()}</div>
                    <div className="dd-kpi-footer">
                        <span className="dd-kpi-subtitle">(trừ template)</span>
                        <span className={`dd-kpi-trend ${stats.contractGrowth > 0 ? 'dd-trend-up' : 'dd-trend-down'}`}>
                            {stats.contractGrowth > 0 ? '↑' : '↓'} {formatPercent(stats.contractGrowth)} t.trước
                        </span>
                    </div>
                </div>

                <div className="dd-kpi-card dd-kpi-info">
                    <div className="dd-kpi-header">
                        <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                        <span className="dd-kpi-label">Báo cáo</span>
                    </div>
                    <div className="dd-kpi-value">{stats.totalReports.toLocaleString()}</div>
                    <div className="dd-kpi-footer">
                        <span className="dd-kpi-subtitle">(tháng này)</span>
                        <span className={`dd-kpi-trend ${stats.reportGrowth > 0 ? 'dd-trend-up' : 'dd-trend-down'}`}>
                            {stats.reportGrowth > 0 ? '↑' : '↓'} {formatPercent(stats.reportGrowth)} t.trước
                        </span>
                    </div>
                </div>

                <div className="dd-kpi-card dd-kpi-revenue">
                    <div className="dd-kpi-header">
                        <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                        </svg>
                        <span className="dd-kpi-label">Doanh thu</span>
                    </div>
                    <div className="dd-kpi-value">{formatCurrency(stats.revenue)} VNĐ</div>
                    <div className="dd-kpi-footer">
                        <span className="dd-kpi-subtitle">(tháng này)</span>
                        <span className={`dd-kpi-trend ${stats.revenueGrowth > 0 ? 'dd-trend-up' : 'dd-trend-down'}`}>
                            {stats.revenueGrowth > 0 ? '↑' : '↓'} {formatPercent(stats.revenueGrowth)} t.trước
                        </span>
                    </div>
                </div>
            </div>

            {/* Row 2: Personnel Breakdown */}
            <div className="dd-kpi-row">
                <div className="dd-kpi-card dd-kpi-manager">
                    <div className="dd-kpi-header">
                        <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <span className="dd-kpi-label">Managers</span>
                    </div>
                    <div className="dd-kpi-value">{stats.managers}</div>
                    <div className="dd-kpi-footer">
                        <span className="dd-kpi-subtitle">Quản lý</span>
                    </div>
                    <div className="dd-kpi-progress">
                        <div className="dd-kpi-progress-bar" style={{ width: '75%' }}></div>
                    </div>
                </div>

                <div className="dd-kpi-card dd-kpi-customer">
                    <div className="dd-kpi-header">
                        <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                        </svg>
                        <span className="dd-kpi-label">Customers</span>
                    </div>
                    <div className="dd-kpi-value">{stats.customers}</div>
                    <div className="dd-kpi-footer">
                        <span className="dd-kpi-subtitle">Khách hàng</span>
                    </div>
                    <div className="dd-kpi-progress">
                        <div className="dd-kpi-progress-bar" style={{ width: '85%' }}></div>
                    </div>
                </div>

                <div className="dd-kpi-card dd-kpi-guard">
                    <div className="dd-kpi-header">
                        <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                        </svg>
                        <span className="dd-kpi-label">Guards</span>
                    </div>
                    <div className="dd-kpi-value">{stats.guards.toLocaleString()}</div>
                    <div className="dd-kpi-footer">
                        <span className="dd-kpi-subtitle">Bảo vệ</span>
                    </div>
                    <div className="dd-kpi-progress">
                        <div className="dd-kpi-progress-bar" style={{ width: '92%' }}></div>
                    </div>
                </div>

                <div className="dd-kpi-card dd-kpi-active">
                    <div className="dd-kpi-header">
                        <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                        <span className="dd-kpi-label">Active</span>
                    </div>
                    <div className="dd-kpi-value">{stats.activeRate}%</div>
                    <div className="dd-kpi-footer">
                        <span className="dd-kpi-subtitle">Tỷ lệ hoạt động</span>
                    </div>
                    <div className="dd-kpi-progress">
                        <div className="dd-kpi-progress-bar" style={{ width: `${stats.activeRate}%` }}></div>
                    </div>
                </div>
            </div>
        </>
    );
});

KPICards.displayName = 'KPICards';

export default KPICards;
