import React from 'react';
import type { SystemAlert } from '../types';

interface SystemAlertsProps {
    alerts: SystemAlert[];
}

const SystemAlerts: React.FC<SystemAlertsProps> = ({ alerts }) => {
    if (alerts.length === 0) {
        return (
            <div className="dd-section dd-section-full">
                <div className="dd-section-header">
                    <h2 className="dd-section-title">Cảnh báo hệ thống</h2>
                </div>
                <div className="dd-section-content">
                    <div className="dd-alert-item dd-alert-success">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span>Hệ thống hoạt động bình thường</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dd-section dd-section-full">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Cảnh báo hệ thống</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-alerts-list">
                    {alerts.map(alert => (
                        <div key={alert.id} className={`dd-alert-item dd-alert-${alert.type}`}>
                            {alert.type === 'critical' && (
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v2h2v-2h-2zm0-6v4h2v-4h-2z"/>
                                </svg>
                            )}
                            {alert.type === 'warning' && (
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                </svg>
                            )}
                            {alert.type === 'info' && (
                                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                </svg>
                            )}
                            <span>
                                {alert.message}
                                {alert.count > 0 && <strong> ({alert.count})</strong>}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SystemAlerts;
