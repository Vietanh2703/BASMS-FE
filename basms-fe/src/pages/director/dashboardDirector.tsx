import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import KPICards from './components/KPICards';
import { ContractPerformance, PersonnelAnalytics } from './components/PerformanceCharts';
import { ReportAnalytics, FinancialOverview, OperationalExcellence } from './components/AnalyticsSection';
import { RegionalDistribution, TrendAnalysis, TopPerformersAlerts, ExecutiveSummary } from './components/SummaryTables';
import type {
    DashboardStats,
    ContractStats,
    ReportStats,
    PerformanceMetrics,
    TrendData,
    RegionalData,
    TopPerformer,
    ExecutiveSummaryItem,
    ChartDataItem
} from './types';
import './dashboardDirector.css';

// Move all mock data outside component to prevent re-creation on every render
const MOCK_CONTRACT_TREND_DATA: TrendData[] = [
    { month: 'T1', signed: 65, pending: 8, expired: 3 },
    { month: 'T2', signed: 72, pending: 6, expired: 2 },
    { month: 'T3', signed: 68, pending: 9, expired: 4 },
    { month: 'T4', signed: 75, pending: 7, expired: 3 },
    { month: 'T5', signed: 70, pending: 5, expired: 2 },
    { month: 'T6', signed: 78, pending: 8, expired: 5 },
    { month: 'T7', signed: 82, pending: 6, expired: 3 },
    { month: 'T8', signed: 76, pending: 7, expired: 4 },
    { month: 'T9', signed: 80, pending: 9, expired: 2 },
    { month: 'T10', signed: 85, pending: 5, expired: 3 },
    { month: 'T11', signed: 79, pending: 8, expired: 4 },
    { month: 'T12', signed: 84, pending: 6, expired: 2 }
];

const MOCK_PERSONNEL_TREND_DATA: TrendData[] = [
    { month: 'T1', managers: 38, guards: 950, customers: 110 },
    { month: 'T2', managers: 39, guards: 968, customers: 112 },
    { month: 'T3', managers: 40, guards: 985, customers: 115 },
    { month: 'T4', managers: 41, guards: 1002, customers: 118 },
    { month: 'T5', managers: 42, guards: 1015, customers: 120 },
    { month: 'T6', managers: 42, guards: 1028, customers: 122 },
    { month: 'T7', managers: 43, guards: 1035, customers: 123 },
    { month: 'T8', managers: 43, guards: 1042, customers: 124 },
    { month: 'T9', managers: 44, guards: 1050, customers: 125 },
    { month: 'T10', managers: 44, guards: 1058, customers: 126 },
    { month: 'T11', managers: 45, guards: 1066, customers: 127 },
    { month: 'T12', managers: 45, guards: 1074, customers: 128 }
];

const MOCK_REPORT_TREND_DATA: TrendData[] = [
    { month: 'T1', security: 35, patrol: 95, equipment: 28, performance: 22 },
    { month: 'T2', security: 38, patrol: 102, equipment: 30, performance: 25 },
    { month: 'T3', security: 42, patrol: 108, equipment: 32, performance: 26 },
    { month: 'T4', security: 40, patrol: 110, equipment: 35, performance: 28 },
    { month: 'T5', security: 43, patrol: 112, equipment: 33, performance: 29 },
    { month: 'T6', security: 45, patrol: 115, equipment: 36, performance: 30 },
    { month: 'T7', security: 44, patrol: 118, equipment: 37, performance: 31 },
    { month: 'T8', security: 46, patrol: 120, equipment: 38, performance: 32 },
    { month: 'T9', security: 45, patrol: 117, equipment: 36, performance: 30 },
    { month: 'T10', security: 47, patrol: 122, equipment: 39, performance: 33 },
    { month: 'T11', security: 44, patrol: 119, equipment: 37, performance: 31 },
    { month: 'T12', security: 45, patrol: 120, equipment: 38, performance: 31 }
];

const MOCK_REVENUE_TREND_DATA: TrendData[] = [
    { month: 'T1', revenue: 12.5, cost: 9.2, profit: 3.3 },
    { month: 'T2', revenue: 13.2, cost: 9.6, profit: 3.6 },
    { month: 'T3', revenue: 13.8, cost: 10.0, profit: 3.8 },
    { month: 'T4', revenue: 14.2, cost: 10.3, profit: 3.9 },
    { month: 'T5', revenue: 14.5, cost: 10.5, profit: 4.0 },
    { month: 'T6', revenue: 15.0, cost: 10.8, profit: 4.2 },
    { month: 'T7', revenue: 14.8, cost: 10.7, profit: 4.1 },
    { month: 'T8', revenue: 15.2, cost: 11.0, profit: 4.2 },
    { month: 'T9', revenue: 14.9, cost: 10.8, profit: 4.1 },
    { month: 'T10', revenue: 15.5, cost: 11.2, profit: 4.3 },
    { month: 'T11', revenue: 15.0, cost: 10.9, profit: 4.1 },
    { month: 'T12', revenue: 15.2, cost: 11.0, profit: 4.2 }
];

const MOCK_REGIONAL_DATA: RegionalData[] = [
    { region: 'Hà Nội', guards: 456, customers: 52, contracts: 345, revenue: 67.2 },
    { region: 'TP.HCM', guards: 389, customers: 48, contracts: 312, revenue: 58.4 },
    { region: 'Đà Nẵng', guards: 229, customers: 28, contracts: 199, revenue: 41.7 }
];

const MOCK_TOP_MANAGERS: TopPerformer[] = [
    { name: 'Nguyễn Văn A', contracts: 28, onTimeRate: 98, rating: 4.8 },
    { name: 'Trần Thị B', contracts: 24, onTimeRate: 96, rating: 4.9 },
    { name: 'Lê Văn C', contracts: 22, onTimeRate: 97, rating: 4.7 }
];

const MOCK_TOP_GUARDS: TopPerformer[] = [
    { name: 'Lê Văn C', attendance: 100, rating: 5.0, incidents: 0 },
    { name: 'Phạm Thị D', attendance: 100, rating: 5.0, incidents: 0 },
    { name: 'Hoàng Văn E', attendance: 99, rating: 4.9, incidents: 1 }
];

const MOCK_TOP_CUSTOMERS: TopPerformer[] = [
    { name: 'Công ty ABC', value: 15.2, years: 3 },
    { name: 'Tập đoàn XYZ', value: 12.8, years: 5 },
    { name: 'Doanh nghiệp DEF', value: 10.5, years: 2 }
];

const MOCK_EXECUTIVE_SUMMARY: ExecutiveSummaryItem[] = [
    { metric: 'Total Active Users', current: 1247, target: 1200, unit: '', growth: 4 },
    { metric: 'Total Contracts (active)', current: 856, target: 800, unit: '', growth: 7 },
    { metric: 'Monthly Reports', current: 234, target: 200, unit: '', growth: 17 },
    { metric: 'Customer Satisfaction', current: 94, target: 90, unit: '%', growth: 4 },
    { metric: 'SLA Compliance', current: 98, target: 95, unit: '%', growth: 3 },
    { metric: 'Revenue (tháng này)', current: 15.2, target: 14.5, unit: ' tỷ', growth: 5 },
    { metric: 'Profit Margin', current: 27, target: 25, unit: '%', growth: 2 },
    { metric: 'Guard Utilization', current: 92, target: 85, unit: '%', growth: 7 },
    { metric: 'Contract Renewal Rate', current: 89, target: 85, unit: '%', growth: 4 },
    { metric: 'Average Response Time', current: 12, target: 15, unit: ' min', growth: -20 }
];

const DashboardDirector = () => {
    useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days' | '90days' | 'year'>('30days');
    const profileRef = useRef<HTMLDivElement>(null);

    // API Endpoints - Replace these with your actual API URLs
    // @ts-ignore - Keep for future API integration
    const API_ENDPOINTS = {
        dashboardStats: '/api/director/dashboard/stats',          // GET
        contractStats: '/api/director/contracts/stats',           // GET
        reportStats: '/api/director/reports/stats',              // GET
        performanceMetrics: '/api/director/performance/metrics',  // GET
        contractTrends: '/api/director/contracts/trends',        // GET
        personnelTrends: '/api/director/personnel/trends',       // GET
        reportTrends: '/api/director/reports/trends',            // GET
        revenueTrends: '/api/director/revenue/trends',           // GET
        regionalData: '/api/director/regional/data',             // GET
        topPerformers: '/api/director/top-performers',           // GET
        executiveSummary: '/api/director/executive-summary'      // GET
    };

    // Mock Data - Replace with API calls
    const [dashboardStats] = useState<DashboardStats>({
        totalUsers: 1247,
        totalContracts: 856,
        totalReports: 234,
        revenue: 15200000000,
        managers: 45,
        customers: 128,
        guards: 1074,
        activeRate: 98.5,
        userGrowth: 12,
        contractGrowth: 8,
        reportGrowth: 15,
        revenueGrowth: 10
    });

    const [contractStats] = useState<ContractStats>({
        signed: 756,
        pending: 67,
        expired: 33,
        managerLabor: 45,
        guardLabor: 745,
        guardService: 66,
        avgApprovalTime: 1.8,
        successRate: 92,
        expiringContracts: 23
    });

    const [reportStats] = useState<ReportStats>({
        total: 234,
        processed: 198,
        pending: 36,
        security: 45,
        patrol: 120,
        equipment: 38,
        performance: 31,
        critical: 3,
        urgent: 12
    });

    const [performanceMetrics] = useState<PerformanceMetrics>({
        customerSatisfaction: 94,
        slaCompliance: 98,
        serviceQuality: 4.7,
        avgResponseTime: 12,
        avgResolutionTime: 2.3,
        patrolOnTime: 99.2,
        attendanceOnTime: 97.8,
        totalIncidents: 23
    });

    // Use useMemo for computed values that depend on stats
    const contractDistributionData = useMemo<ChartDataItem[]>(() => [
        { name: 'Đã ký', value: contractStats.signed, color: '#10b981' },
        { name: 'Chờ ký', value: contractStats.pending, color: '#f59e0b' },
        { name: 'Quá hạn', value: contractStats.expired, color: '#ef4444' }
    ], [contractStats.signed, contractStats.pending, contractStats.expired]);

    const reportDistributionData = useMemo<ChartDataItem[]>(() => [
        { name: 'Sự cố an ninh', value: reportStats.security, color: '#ef4444' },
        { name: 'Tuần tra định kỳ', value: reportStats.patrol, color: '#10b981' },
        { name: 'Thiết bị/Kỹ thuật', value: reportStats.equipment, color: '#f59e0b' },
        { name: 'Hiệu suất nhân sự', value: reportStats.performance, color: '#3b82f6' }
    ], [reportStats.security, reportStats.patrol, reportStats.equipment, reportStats.performance]);

    // Effects
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };
        if (isProfileDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileDropdownOpen]);

    // Handlers
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);
    const handleLogout = async () => {
        await logout();
    };

    // Use useCallback to memoize format functions and prevent unnecessary re-renders
    const formatDateTime = useCallback((date: Date) => {
        const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${days[date.getDay()]}, ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }, []);

    const formatCurrency = useCallback((value: number) => {
        return value >= 1000000000 ? `${(value / 1000000000).toFixed(1)} tỷ` : `${(value / 1000000).toFixed(1)} tr`;
    }, []);

    const formatPercent = useCallback((value: number, showSign: boolean = true) => {
        const sign = value > 0 ? '+' : '';
        return showSign ? `${sign}${value}%` : `${value}%`;
    }, []);

    // Example function to fetch data - Replace with actual API calls
    /*
    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ENDPOINTS.dashboardStats, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setDashboardStats(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    */

    return (
        <div className="dd-container">
            {/* Sidebar */}
            <aside className={`dd-sidebar ${isMenuOpen ? 'dd-sidebar-open' : 'dd-sidebar-closed'}`}>
                <div className="dd-sidebar-header">
                    <div className="dd-sidebar-logo">
                        <div className="dd-logo-icon">D</div>
                        {isMenuOpen && <span className="dd-logo-text">Director</span>}
                    </div>
                </div>
                <nav className="dd-sidebar-nav">
                    <ul className="dd-nav-list">
                        <li className="dd-nav-item dd-nav-active">
                            <Link to="/director/dashboard" className="dd-nav-link">
                                <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                                {isMenuOpen && <span>Tổng quan</span>}
                            </Link>
                        </li>
                        <li className="dd-nav-item">
                            <Link to="/director/customer-list" className="dd-nav-link">
                                <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                                {isMenuOpen && <span>Khách hàng</span>}
                            </Link>
                        </li>
                        <li className="dd-nav-item">
                            <Link to="/director/analytics" className="dd-nav-link">
                                <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                                </svg>
                                {isMenuOpen && <span>Phân tích</span>}
                            </Link>
                        </li>
                        <li className="dd-nav-item">
                            <Link to="/director/reports" className="dd-nav-link">
                                <svg className="dd-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                                {isMenuOpen && <span>Báo cáo</span>}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`dd-main-content ${isMenuOpen ? 'dd-content-expanded' : 'dd-content-collapsed'}`}>
                <header className="dd-header">
                    <div className="dd-header-left">
                        <button className="dd-menu-toggle" onClick={toggleMenu}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <div className="dd-datetime">{formatDateTime(currentTime)}</div>
                    </div>
                    <div className="dd-header-right">
                        <button className="dd-notification-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span className="dd-notification-badge">5</span>
                        </button>
                        <div ref={profileRef} className="dd-user-profile" onClick={toggleProfileDropdown}>
                            <div className="dd-user-avatar">
                                <span>{user?.fullName?.charAt(0).toUpperCase() || 'D'}</span>
                            </div>
                            <div className="dd-user-info">
                                <span className="dd-user-name">{user?.fullName || 'Director'}</span>
                                <span className="dd-user-role">Giám đốc điều hành</span>
                            </div>
                            {isProfileDropdownOpen && (
                                <div className="dd-profile-dropdown">
                                    <div className="dd-dropdown-item">
                                        <svg className="dd-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                        </svg>
                                        Thông tin cá nhân
                                    </div>
                                    <div className="dd-dropdown-item" onClick={handleLogout}>
                                        <svg className="dd-dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        Đăng xuất
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="dd-main">
                    <div className="dd-page-header">
                        <h1 className="dd-page-title">Director Dashboard</h1>
                        <p className="dd-page-subtitle">Tổng quan quản lý điều hành hệ thống BASMS</p>
                    </div>

                    {/* Time Filter */}
                    <div className="dd-filter-bar">
                        <div className="dd-filter-group">
                            {(['today', '7days', '30days', '90days', 'year'] as const).map(filter => (
                                <button
                                    key={filter}
                                    className={`dd-filter-btn ${timeFilter === filter ? 'dd-filter-active' : ''}`}
                                    onClick={() => setTimeFilter(filter)}
                                >
                                    {filter === 'today' ? 'Hôm nay' : filter === '7days' ? '7 ngày' : filter === '30days' ? '30 ngày' : filter === '90days' ? '90 ngày' : 'Năm'}
                                </button>
                            ))}
                        </div>
                        <div className="dd-filter-actions">
                            <button className="dd-export-btn">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                                </svg>
                                Export
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <KPICards stats={dashboardStats} formatCurrency={formatCurrency} formatPercent={formatPercent} />

                    {/* Contract Performance & Personnel Analytics */}
                    <div className="dd-row-split">
                        <ContractPerformance stats={contractStats} distributionData={contractDistributionData} />
                        <PersonnelAnalytics data={MOCK_PERSONNEL_TREND_DATA} dashboardStats={dashboardStats} />
                    </div>

                    {/* Report Analytics */}
                    <ReportAnalytics stats={reportStats} trendData={MOCK_REPORT_TREND_DATA} distributionData={reportDistributionData} />

                    {/* Financial Overview & Operational Excellence */}
                    <div className="dd-row-split">
                        <FinancialOverview trendData={MOCK_REVENUE_TREND_DATA} />
                        <OperationalExcellence metrics={performanceMetrics} />
                    </div>

                    {/* Regional Distribution */}
                    <RegionalDistribution data={MOCK_REGIONAL_DATA} />

                    {/* Trend Analysis */}
                    <TrendAnalysis data={MOCK_CONTRACT_TREND_DATA} />

                    {/* Top Performers & Alerts */}
                    <TopPerformersAlerts managers={MOCK_TOP_MANAGERS} guards={MOCK_TOP_GUARDS} customers={MOCK_TOP_CUSTOMERS} />

                    {/* Executive Summary */}
                    <ExecutiveSummary data={MOCK_EXECUTIVE_SUMMARY} formatPercent={formatPercent} />
                </main>
            </div>
        </div>
    );
};

export default DashboardDirector;
