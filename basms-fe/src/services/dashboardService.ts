import apiClient from '../clients/apiClients';
import type {
    DashboardKPIStats,
    ShiftStats,
    IncidentStats,
    PersonnelStats,
    OperationalMetrics,
    SystemAlert,
    DashboardData
} from '../pages/director/types';

// API Response interfaces
interface Guard {
    id: string;
    employmentStatus: string;
    certificationLevel: string;
    currentAvailability: string;
    attendanceRate: number;
    punctualityRate: number;
    noShowCount: number;
}

interface Manager {
    id: string;
    employmentStatus: string;
}

interface Team {
    id: string;
    isActive: boolean;
}

interface Shift {
    id: string;
    status: string;
    isFullyStaffed: boolean;
    isUnderstaffed: boolean;
    assignedGuardsCount: number;
    confirmedGuardsCount: number;
    requiredGuards: number;
}

interface Incident {
    id: string;
    status: string;
    severity: string;
    incidentType: string;
    reportedTime: string;
    respondedAt?: string;
}

class DashboardService {
    /**
     * Fetch all guards
     */
    private async getGuards(): Promise<Guard[]> {
        try {
            const response = await apiClient.get('/shifts/guards');
            console.log('Guards API Response:', response.data);
            // Handle both array and object responses
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            }
            // If response is wrapped in an object, try to find the array
            if (data && typeof data === 'object') {
                // Try common wrapper keys
                if (Array.isArray(data.data)) return data.data;
                if (Array.isArray(data.guards)) return data.guards;
                if (Array.isArray(data.items)) return data.items;
                if (Array.isArray(data.result)) return data.result;
            }
            console.warn('Guards API returned unexpected format:', data);
            return [];
        } catch (error) {
            console.error('Error fetching guards:', error);
            return [];
        }
    }

    /**
     * Fetch all managers
     */
    private async getManagers(): Promise<Manager[]> {
        try {
            const response = await apiClient.get('/shifts/managers');
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            }
            if (data && typeof data === 'object') {
                if (Array.isArray(data.data)) return data.data;
                if (Array.isArray(data.managers)) return data.managers;
                if (Array.isArray(data.items)) return data.items;
            }
            console.warn('Managers API returned unexpected format:', data);
            return [];
        } catch (error) {
            console.error('Error fetching managers:', error);
            return [];
        }
    }

    /**
     * Fetch all teams
     */
    private async getTeams(): Promise<Team[]> {
        try {
            // Teams API requires managerId parameter, skip for now if not available
            // Will be implemented when we have manager context
            return [];
        } catch (error) {
            console.error('Error fetching teams:', error);
            return [];
        }
    }

    /**
     * Fetch all shifts with optional filters
     */
    private async getShifts(fromDate?: string, toDate?: string): Promise<Shift[]> {
        try {
            const params: any = {};
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;

            const response = await apiClient.get('/shifts/get-all', { params });
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            }
            if (data && typeof data === 'object') {
                if (Array.isArray(data.data)) return data.data;
                if (Array.isArray(data.shifts)) return data.shifts;
                if (Array.isArray(data.items)) return data.items;
            }
            console.warn('Shifts API returned unexpected format:', data);
            return [];
        } catch (error) {
            console.error('Error fetching shifts:', error);
            return [];
        }
    }

    /**
     * Fetch all incidents
     */
    private async getIncidents(): Promise<Incident[]> {
        try {
            const response = await apiClient.get('/incidents/get-all');
            console.log('Incidents API Response:', response.data);
            const data = response.data;
            if (Array.isArray(data)) {
                return data;
            }
            if (data && typeof data === 'object') {
                if (Array.isArray(data.data)) return data.data;
                if (Array.isArray(data.incidents)) return data.incidents;
                if (Array.isArray(data.items)) return data.items;
                if (Array.isArray(data.result)) return data.result;
            }
            console.warn('Incidents API returned unexpected format:', data);
            return [];
        } catch (error) {
            console.error('Error fetching incidents:', error);
            return [];
        }
    }

    /**
     * Calculate KPI stats from data
     */
    private calculateKPIStats(guards: Guard[], managers: Manager[], teams: Team[], shifts: Shift[], incidents: Incident[]): DashboardKPIStats {
        // Ensure all inputs are arrays
        const safeGuards = Array.isArray(guards) ? guards : [];
        const safeManagers = Array.isArray(managers) ? managers : [];
        const safeTeams = Array.isArray(teams) ? teams : [];
        const safeShifts = Array.isArray(shifts) ? shifts : [];
        const safeIncidents = Array.isArray(incidents) ? incidents : [];

        const activeGuards = safeGuards.filter(g => g.employmentStatus === 'ACTIVE').length;
        const totalGuards = safeGuards.length;
        const totalManagers = safeManagers.length;
        const totalTeams = safeTeams.filter(t => t.isActive).length;

        // Get today's shifts
        const todayShifts = safeShifts.filter(() => {
            // This assumes shifts have a date field, adjust based on actual API response
            return true; // Simplified for now
        });

        const criticalIncidents = safeIncidents.filter(i => i.severity === 'CRITICAL').length;

        // Calculate average attendance
        const attendanceRates = safeGuards
            .filter(g => g.attendanceRate !== undefined && g.attendanceRate !== null)
            .map(g => g.attendanceRate);
        const averageAttendance = attendanceRates.length > 0
            ? Math.round(attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length)
            : 0;

        return {
            totalGuards,
            totalManagers,
            totalTeams,
            totalShiftsToday: todayShifts.length,
            totalIncidents: safeIncidents.length,
            criticalIncidents,
            activeGuards,
            averageAttendance
        };
    }

    /**
     * Calculate shift statistics
     */
    private calculateShiftStats(shifts: Shift[]): ShiftStats {
        const safeShifts = Array.isArray(shifts) ? shifts : [];

        const totalScheduled = safeShifts.filter(s => s.status === 'SCHEDULED').length;
        const totalCompleted = safeShifts.filter(s => s.status === 'COMPLETED').length;
        const totalCancelled = safeShifts.filter(s => s.status === 'CANCELLED').length;
        const totalInProgress = safeShifts.filter(s => s.status === 'IN_PROGRESS').length;

        const completionRate = safeShifts.length > 0
            ? Math.round((totalCompleted / safeShifts.length) * 100)
            : 0;

        const guardsAssigned = safeShifts.reduce((sum, s) => sum + (s.assignedGuardsCount || 0), 0);
        const guardsConfirmed = safeShifts.reduce((sum, s) => sum + (s.confirmedGuardsCount || 0), 0);
        const understaffedCount = safeShifts.filter(s => s.isUnderstaffed).length;

        return {
            totalScheduled,
            totalCompleted,
            totalCancelled,
            totalInProgress,
            completionRate,
            guardsAssigned,
            guardsConfirmed,
            noShowCount: 0, // Need to calculate from ShiftAssignments
            understaffedCount
        };
    }

    /**
     * Calculate incident statistics
     */
    private calculateIncidentStats(incidents: Incident[]): IncidentStats {
        const safeIncidents = Array.isArray(incidents) ? incidents : [];

        const reported = safeIncidents.filter(i => i.status === 'REPORTED').length;
        const responded = safeIncidents.filter(i => i.status === 'RESPONDED' || i.status === 'RESOLVED').length;
        const resolved = safeIncidents.filter(i => i.status === 'RESOLVED').length;

        const critical = safeIncidents.filter(i => i.severity === 'CRITICAL').length;
        const high = safeIncidents.filter(i => i.severity === 'HIGH').length;
        const medium = safeIncidents.filter(i => i.severity === 'MEDIUM').length;
        const low = safeIncidents.filter(i => i.severity === 'LOW').length;

        // Group by type
        const byTypeMap = safeIncidents.reduce((acc, incident) => {
            const type = incident.incidentType || 'OTHER';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byType = Object.entries(byTypeMap).map(([type, count]) => ({
            type,
            count
        }));

        return {
            total: safeIncidents.length,
            reported,
            responded,
            resolved,
            critical,
            high,
            medium,
            low,
            byType
        };
    }

    /**
     * Calculate personnel statistics
     */
    private calculatePersonnelStats(guards: Guard[]): PersonnelStats {
        const safeGuards = Array.isArray(guards) ? guards : [];

        const levelI = safeGuards.filter(g => g.certificationLevel === 'I').length;
        const levelII = safeGuards.filter(g => g.certificationLevel === 'II').length;
        const levelIII = safeGuards.filter(g => g.certificationLevel === 'III').length;

        const active = safeGuards.filter(g => g.employmentStatus === 'ACTIVE').length;
        const inactive = safeGuards.filter(g => g.employmentStatus === 'INACTIVE').length;
        const terminated = safeGuards.filter(g => g.employmentStatus === 'TERMINATED').length;

        const available = safeGuards.filter(g => g.currentAvailability === 'AVAILABLE').length;
        const busy = safeGuards.filter(g => g.currentAvailability === 'BUSY').length;
        const onLeave = safeGuards.filter(g => g.currentAvailability === 'ON_LEAVE').length;

        return {
            guardsByLevel: {
                levelI,
                levelII,
                levelIII
            },
            guardsByStatus: {
                active,
                inactive,
                terminated
            },
            guardsByAvailability: {
                available,
                busy,
                onLeave
            }
        };
    }

    /**
     * Calculate operational metrics
     */
    private calculateOperationalMetrics(guards: Guard[], shifts: Shift[], incidents: Incident[]): OperationalMetrics {
        const safeGuards = Array.isArray(guards) ? guards : [];
        const safeShifts = Array.isArray(shifts) ? shifts : [];
        const safeIncidents = Array.isArray(incidents) ? incidents : [];

        const fullyStaffed = safeShifts.filter(s => s.isFullyStaffed).length;
        const staffingRate = safeShifts.length > 0
            ? Math.round((fullyStaffed / safeShifts.length) * 100)
            : 0;

        // Calculate on-time rate from guards' punctuality
        const punctualityRates = safeGuards
            .filter(g => g.punctualityRate !== undefined && g.punctualityRate !== null)
            .map(g => g.punctualityRate);
        const onTimeRate = punctualityRates.length > 0
            ? Math.round(punctualityRates.reduce((a, b) => a + b, 0) / punctualityRates.length)
            : 0;

        // Calculate attendance rate
        const attendanceRates = safeGuards
            .filter(g => g.attendanceRate !== undefined && g.attendanceRate !== null)
            .map(g => g.attendanceRate);
        const attendanceRate = attendanceRates.length > 0
            ? Math.round(attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length)
            : 0;

        // Calculate average incident response time
        const responseTimes = safeIncidents
            .filter(i => i.respondedAt && i.reportedTime)
            .map(i => {
                const reported = new Date(i.reportedTime).getTime();
                const responded = new Date(i.respondedAt!).getTime();
                return (responded - reported) / (1000 * 60); // minutes
            });
        const avgIncidentResponseTime = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0;

        return {
            staffingRate,
            onTimeRate,
            attendanceRate,
            avgIncidentResponseTime
        };
    }

    /**
     * Generate system alerts based on data
     */
    private generateAlerts(shifts: Shift[], incidents: Incident[]): SystemAlert[] {
        const safeShifts = Array.isArray(shifts) ? shifts : [];
        const safeIncidents = Array.isArray(incidents) ? incidents : [];
        const alerts: SystemAlert[] = [];

        // Check for understaffed shifts
        const understaffed = safeShifts.filter(s => s.isUnderstaffed).length;
        if (understaffed > 0) {
            alerts.push({
                id: 'understaffed',
                type: 'critical',
                message: 'Ca làm việc thiếu nhân lực',
                count: understaffed
            });
        }

        // Check for unresolved critical incidents
        const criticalUnresolved = safeIncidents.filter(i =>
            i.severity === 'CRITICAL' && i.status !== 'RESOLVED'
        ).length;
        if (criticalUnresolved > 0) {
            alerts.push({
                id: 'critical-incidents',
                type: 'critical',
                message: 'Sự cố nghiêm trọng chưa giải quyết',
                count: criticalUnresolved
            });
        }

        // Check for incidents pending > 24h
        const now = new Date().getTime();
        const overdueIncidents = safeIncidents.filter(i => {
            if (i.status !== 'REPORTED') return false;
            const reported = new Date(i.reportedTime).getTime();
            const hoursSince = (now - reported) / (1000 * 60 * 60);
            return hoursSince > 24;
        }).length;
        if (overdueIncidents > 0) {
            alerts.push({
                id: 'overdue-incidents',
                type: 'warning',
                message: 'Sự cố chưa xử lý quá 24h',
                count: overdueIncidents
            });
        }

        return alerts;
    }

    /**
     * Fetch complete dashboard data
     */
    async getDashboardData(): Promise<DashboardData> {
        try {
            // Fetch all data in parallel
            const [guards, managers, teams, shifts, incidents] = await Promise.all([
                this.getGuards(),
                this.getManagers(),
                this.getTeams(),
                this.getShifts(),
                this.getIncidents()
            ]);

            // Calculate all metrics
            const kpi = this.calculateKPIStats(guards, managers, teams, shifts, incidents);
            const shiftStats = this.calculateShiftStats(shifts);
            const incidentStats = this.calculateIncidentStats(incidents);
            const personnel = this.calculatePersonnelStats(guards);
            const operational = this.calculateOperationalMetrics(guards, shifts, incidents);
            const alerts = this.generateAlerts(shifts, incidents);

            return {
                kpi,
                shifts: shiftStats,
                incidents: incidentStats,
                personnel,
                operational,
                locations: [],
                trends: [],
                topPerformers: {
                    guards: [],
                    teams: []
                },
                alerts
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }
}

export default new DashboardService();
