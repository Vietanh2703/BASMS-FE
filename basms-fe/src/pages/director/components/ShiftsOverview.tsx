import React from 'react';
import type { ShiftStats } from '../types';

interface ShiftsOverviewProps {
    stats: ShiftStats;
}

const ShiftsOverview: React.FC<ShiftsOverviewProps> = ({ stats }) => {
    return (
        <div className="dd-section dd-section-full">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Tổng quan ca làm việc</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-stats-grid dd-stats-grid-3">
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Đã lên lịch</span>
                        <span className="dd-stat-value">{stats.totalScheduled}</span>
                        <span className="dd-stat-percent">ca làm việc</span>
                    </div>
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Hoàn thành</span>
                        <span className="dd-stat-value dd-text-success">{stats.totalCompleted}</span>
                        <span className="dd-stat-percent">ca làm việc</span>
                    </div>
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Đang diễn ra</span>
                        <span className="dd-stat-value dd-text-warning">{stats.totalInProgress}</span>
                        <span className="dd-stat-percent">ca làm việc</span>
                    </div>
                </div>

                <div className="dd-stats-grid dd-stats-grid-3" style={{ marginTop: '16px' }}>
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Đã hủy</span>
                        <span className="dd-stat-value dd-text-danger">{stats.totalCancelled}</span>
                        <span className="dd-stat-percent">ca làm việc</span>
                    </div>
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Tỷ lệ hoàn thành</span>
                        <span className="dd-stat-value dd-text-success">{stats.completionRate}%</span>
                        <div className="dd-gauge-bar" style={{ marginTop: '8px' }}>
                            <div className="dd-gauge-fill dd-gauge-success" style={{ width: `${stats.completionRate}%` }}></div>
                        </div>
                    </div>
                    <div className="dd-stat-item">
                        <span className="dd-stat-label">Thiếu nhân lực</span>
                        <span className="dd-stat-value dd-text-warning">{stats.understaffedCount}</span>
                        <span className="dd-stat-percent">ca làm việc</span>
                    </div>
                </div>

                <div className="dd-metrics-list" style={{ marginTop: '24px' }}>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Bảo vệ được phân công</span>
                        <span className="dd-metric-value">{stats.guardsAssigned} người</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Bảo vệ đã xác nhận</span>
                        <span className="dd-metric-value">{stats.guardsConfirmed} người</span>
                    </div>
                    <div className="dd-metric-row">
                        <span className="dd-metric-label">Không đến làm (No-show)</span>
                        <span className="dd-metric-value dd-text-danger">{stats.noShowCount} người</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftsOverview;
