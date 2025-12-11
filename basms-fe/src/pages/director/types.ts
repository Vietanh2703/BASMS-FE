// Director Dashboard Types & Interfaces

export interface DashboardStats {
    totalUsers: number;
    totalContracts: number;
    totalReports: number;
    revenue: number;
    managers: number;
    customers: number;
    guards: number;
    activeRate: number;
    userGrowth: number;
    contractGrowth: number;
    reportGrowth: number;
    revenueGrowth: number;
}

export interface ContractStats {
    signed: number;
    pending: number;
    expired: number;
    managerLabor: number;
    guardLabor: number;
    guardService: number;
    avgApprovalTime: number;
    successRate: number;
    expiringContracts: number;
}

export interface ReportStats {
    total: number;
    processed: number;
    pending: number;
    security: number;
    patrol: number;
    equipment: number;
    performance: number;
    critical: number;
    urgent: number;
}

export interface PerformanceMetrics {
    customerSatisfaction: number;
    slaCompliance: number;
    serviceQuality: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    patrolOnTime: number;
    attendanceOnTime: number;
    totalIncidents: number;
}

export interface TrendData {
    month: string;
    [key: string]: number | string;
}

export interface RegionalData {
    region: string;
    guards: number;
    customers: number;
    contracts: number;
    revenue: number;
}

export interface TopPerformer {
    name: string;
    [key: string]: string | number;
}

export interface ExecutiveSummaryItem {
    metric: string;
    current: number;
    target: number;
    unit: string;
    growth: number;
}

export interface ChartDataItem {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number;
}
