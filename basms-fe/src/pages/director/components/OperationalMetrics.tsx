import React from 'react';
import type { OperationalMetrics as OperationalMetricsType } from '../types';

interface OperationalMetricsProps {
    metrics: OperationalMetricsType;
}

const OperationalMetrics: React.FC<OperationalMetricsProps> = ({ metrics }) => {
    const getStatusClass = (value: number, threshold: number = 85): string => {
        return value >= threshold ? 'dd-status-success' : 'dd-status-danger';
    };

    const getGaugeColor = (value: number, threshold: number = 85): string => {
        return value >= threshold ? 'dd-gauge-success' : 'dd-gauge-warning';
    };

    return (
        <div className="dd-section dd-section-full">
            <div className="dd-section-header">
                <h2 className="dd-section-title">Hiệu suất vận hành</h2>
            </div>
            <div className="dd-section-content">
                <div className="dd-gauge-grid">
                    <div className="dd-gauge-item">
                        <span className="dd-gauge-label">Tỷ lệ đủ nhân lực</span>
                        <span className="dd-gauge-value">{metrics.staffingRate}%</span>
                        <div className="dd-gauge-bar">
                            <div className={`dd-gauge-fill ${getGaugeColor(metrics.staffingRate, 90)}`} style={{ width: `${metrics.staffingRate}%` }}></div>
                        </div>
                        <span className={`dd-gauge-status ${getStatusClass(metrics.staffingRate, 90)}`}>
                            {metrics.staffingRate >= 90 ? 'Tốt' : 'Cần cải thiện'}
                        </span>
                    </div>

                    <div className="dd-gauge-item">
                        <span className="dd-gauge-label">Tỷ lệ đúng giờ</span>
                        <span className="dd-gauge-value">{metrics.onTimeRate}%</span>
                        <div className="dd-gauge-bar">
                            <div className={`dd-gauge-fill ${getGaugeColor(metrics.onTimeRate)}`} style={{ width: `${metrics.onTimeRate}%` }}></div>
                        </div>
                        <span className={`dd-gauge-status ${getStatusClass(metrics.onTimeRate)}`}>
                            {metrics.onTimeRate >= 85 ? 'Tốt' : 'Cần cải thiện'}
                        </span>
                    </div>

                    <div className="dd-gauge-item">
                        <span className="dd-gauge-label">Tỷ lệ chuyên cần</span>
                        <span className="dd-gauge-value">{metrics.attendanceRate}%</span>
                        <div className="dd-gauge-bar">
                            <div className={`dd-gauge-fill ${getGaugeColor(metrics.attendanceRate)}`} style={{ width: `${metrics.attendanceRate}%` }}></div>
                        </div>
                        <span className={`dd-gauge-status ${getStatusClass(metrics.attendanceRate)}`}>
                            {metrics.attendanceRate >= 85 ? 'Tốt' : 'Cần cải thiện'}
                        </span>
                    </div>
                </div>

                <div className="dd-metrics-list" style={{ marginTop: '24px' }}>
                    <div className="dd-metric-row dd-metric-highlight">
                        <span className="dd-metric-label">Thời gian xử lý sự cố trung bình</span>
                        <span className="dd-metric-value">{metrics.avgIncidentResponseTime} phút</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add warning gauge color style
const style = document.createElement('style');
style.textContent = `
.dd-gauge-warning {
    background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%) !important;
}
`;
document.head.appendChild(style);

export default OperationalMetrics;
