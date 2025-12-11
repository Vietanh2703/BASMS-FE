// Role IDs từ hệ thống
export const ROLES = {
    ADMIN: 'ddbd5bad-ba6e-11f0-bcac-00155dca8f48',
    DIRECTOR: 'ddbd5fad-ba6e-11f0-bcac-00155dca8f48',
    MANAGER: 'ddbd612f-ba6e-11f0-bcac-00155dca8f48',
} as const;

// Role names để hiển thị
export const ROLE_NAMES = {
    [ROLES.ADMIN]: 'Admin',
    [ROLES.DIRECTOR]: 'Director',
    [ROLES.MANAGER]: 'Manager',
} as const;

// Dashboard routes theo role
export const ROLE_DASHBOARDS = {
    [ROLES.ADMIN]: '/admin/dashboard',
    [ROLES.DIRECTOR]: '/director/dashboard',
    [ROLES.MANAGER]: '/manager/dashboard',
} as const;

// Helper function để lấy dashboard path theo roleId
export const getDashboardByRole = (roleId: string): string => {
    return ROLE_DASHBOARDS[roleId as keyof typeof ROLE_DASHBOARDS] || '/';
};

// Helper function để lấy tên role
export const getRoleName = (roleId: string): string => {
    return ROLE_NAMES[roleId as keyof typeof ROLE_NAMES] || 'Unknown';
};

// Kiểm tra quyền
export const isAdmin = (roleId: string): boolean => roleId === ROLES.ADMIN;
export const isDirector = (roleId: string): boolean => roleId === ROLES.DIRECTOR;
export const isManager = (roleId: string): boolean => roleId === ROLES.MANAGER;