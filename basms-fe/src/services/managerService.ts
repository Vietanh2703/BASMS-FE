import axiosInstance from '../utils/axiosInstance';

export interface ManagerData {
    id: string;
    identityNumber: string;
    employeeCode: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    phoneNumber: string;
    currentAddress: string;
    gender: string;
    dateOfBirth: string;
    role: string;
    position: string | null;
    department: string | null;
    managerLevel: number;
    reportsToManagerId: string | null;
    employmentStatus: string;
    canCreateShifts: boolean;
    canApproveShifts: boolean;
    canAssignGuards: boolean;
    canApproveOvertime: boolean;
    canManageTeams: boolean;
    maxTeamSize: number | null;
    totalTeamsManaged: number;
    totalGuardsSupervised: number;
    totalShiftsCreated: number;
    isActive: boolean;
    lastSyncedAt: string;
    syncStatus: string;
    userServiceVersion: number;
    createdAt: string;
    updatedAt: string | null;
}

export interface ManagerResponse {
    manager: ManagerData;
}

export const getManagerById = async (managerId: string): Promise<ManagerData> => {
    const response = await axiosInstance.get<ManagerResponse>(`/managers/${managerId}`);
    return response.data.manager;
};
