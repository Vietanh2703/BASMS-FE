import React from 'react';
import type { DashboardKPIStats } from '../types';

interface DashboardKPIProps {
    stats: DashboardKPIStats;
}

const DashboardKPI: React.FC<DashboardKPIProps> = ({ stats }) => {
    return (
        <div className="dd-kpi-row">
            <div className="dd-kpi-card dd-kpi-primary">
                <div className="dd-kpi-header">
                    <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                    </svg>
                    <span className="dd-kpi-label">Bảo vệ</span>
                </div>
                <div className="dd-kpi-value">{stats.totalGuards.toLocaleString()}</div>
                <div className="dd-kpi-footer">
                    <span className="dd-kpi-subtitle">Tổng số bảo vệ</span>
                </div>
            </div>

            <div className="dd-kpi-card dd-kpi-manager">
                <div className="dd-kpi-header">
                    <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span className="dd-kpi-label">Quản lý</span>
                </div>
                <div className="dd-kpi-value">{stats.totalManagers}</div>
                <div className="dd-kpi-footer">
                    <span className="dd-kpi-subtitle">Tổng managers</span>
                </div>
            </div>


            <div className="dd-kpi-card dd-kpi-active">
                <div className="dd-kpi-header">
                    <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                    <span className="dd-kpi-label">Đang hoạt động</span>
                </div>
                <div className="dd-kpi-value">{stats.activeGuards}</div>
                <div className="dd-kpi-footer">
                    <span className="dd-kpi-subtitle">Bảo vệ active</span>
                </div>
            </div>

            <div className="dd-kpi-card dd-kpi-revenue">
                <div className="dd-kpi-header">
                    <svg className="dd-kpi-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    <span className="dd-kpi-label">Sự cố</span>
                </div>
                <div className="dd-kpi-value">{stats.totalIncidents}</div>
                <div className="dd-kpi-footer">
                    <span className="dd-kpi-subtitle">
                        Trong đó: <span className="dd-text-danger">{stats.criticalIncidents} critical</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DashboardKPI;
