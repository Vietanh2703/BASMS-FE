// Director Dashboard Types & Interfaces

// KPI Stats
export interface DashboardKPIStats {
    totalGuards: number;
    totalManagers: number;
    totalTeams: number;
    totalShiftsToday: number;
    totalIncidents: number;
    criticalIncidents: number;
    activeGuards: number;
    averageAttendance: number;
}

// Shift Statistics
export interface ShiftStats {
    totalScheduled: number;
    totalCompleted: number;
    totalCancelled: number;
    totalInProgress: number;
    completionRate: number;
    guardsAssigned: number;
    guardsConfirmed: number;
    noShowCount: number;
    understaffedCount: number;
}

// Incident Statistics
export interface IncidentStats {
    total: number;
    reported: number;
    responded: number;
    resolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byType: IncidentByType[];
}

export interface IncidentByType {
    type: string;
    count: number;
}

// Personnel Statistics
export interface PersonnelStats {
    guardsByLevel: {
        levelI: number;
        levelII: number;
        levelIII: number;
    };
    guardsByStatus: {
        active: number;
        inactive: number;
        terminated: number;
    };
    guardsByAvailability: {
        available: number;
        busy: number;
        onLeave: number;
    };
}

// Operational Metrics
export interface OperationalMetrics {
    staffingRate: number;
    onTimeRate: number;
    attendanceRate: number;
    avgIncidentResponseTime: number;
}

// Location/Regional Data
export interface LocationData {
    locationId: string;
    locationName: string;
    totalShifts: number;
    activeGuards: number;
    teamsAssigned: number;
    completionRate: number;
    incidentsCount: number;
}

// Trend Data for Charts
export interface TrendDataItem {
    date: string;
    shifts: number;
    completed: number;
    cancelled: number;
    incidents: number;
}

// Top Performers
export interface TopPerformer {
    id: string;
    name: string;
    metric: number;
    rank: number;
}

// Alerts
export interface SystemAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    count: number;
}

// Complete Dashboard Data
export interface DashboardData {
    kpi: DashboardKPIStats;
    shifts: ShiftStats;
    incidents: IncidentStats;
    personnel: PersonnelStats;
    operational: OperationalMetrics;
    locations: LocationData[];
    trends: TrendDataItem[];
    topPerformers: {
        guards: TopPerformer[];
        teams: TopPerformer[];
    };
    alerts: SystemAlert[];
}
