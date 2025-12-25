import React from 'react';
import type { IncidentStats } from '../types';

interface IncidentsOverviewProps {
    stats: IncidentStats;
}

const IncidentsOverview: React.FC<IncidentsOverviewProps> = ({ stats }) => {
    const getIncidentTypeLabel = (type: string): string => {
        const labels: { [key: string]: string } = {
            'INTRUSION': 'Xâm nhập',
            'THEFT': 'Trộm cắp',
            'FIRE': 'Hỏa hoạn',
            'MEDICAL': 'Y tế',
            'EQUIPMENT_FAILURE': 'Hỏng thiết bị',
            'VANDALISM': 'Phá hoại',
            'DISPUTE': 'Tranh chấp',
            'OTHER': 'Khác'
        };
        return labels[type] || type;
    };

    return (
        <div className="dd-section dd-section-full">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Tổng quan sự cố</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-stats-grid">
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Tổng sự cố</span>
                        <span className="dd-stat-value">{stats.total}</span>
                    </div>
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Đã báo cáo</span>
                        <span className="dd-stat-value dd-text-warning">{stats.reported}</span>
                    </div>
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Đã xử lý</span>
                        <span className="dd-stat-value dd-text-success">{stats.responded}</span>
                    </div>
                </div>

                <div className="dd-alert-row">
                    <div className="dd-alert-item dd-alert-critical">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z"/>
                        </svg>
                        <span>Critical: {stats.critical}</span>
                    </div>
                    <div className="dd-alert-item dd-alert-warning">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        <span>High: {stats.high}</span>
                    </div>
                    <div className="dd-alert-item dd-alert-info">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                        <span>Medium: {stats.medium}</span>
                    </div>
                    <div className="dd-alert-item dd-alert-success">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span>Low: {stats.low}</span>
                    </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                        Phân loại theo loại sự cố
                    </h3>
                    <div className="dd-metrics-list">
                        {stats.byType.map((item, index) => (
                            <div key={index} className="dd-metric-row">
                                <span className="dd-metric-label">{getIncidentTypeLabel(item.type)}</span>
                                <span className="dd-metric-value">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncidentsOverview;
