import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "./contexts/authContext";
import { PublicRoute } from './utils/publicRoute';
import { RoleBasedRoute } from './utils/roleBasedRoute.tsx';
{/* Public Route */}
import HomePage from './pages/home/homepage';
import Login from './pages/login/login';
{/* Admin Routes */}
import DashboardAdmin from './pages/admin/dashboard/dashboardAdmin';
{/* Director Routes */}
import DashboardDirector from "./pages/director/dashboard/dashboardDirector.tsx";
{/* Manager Routes */}
import DashboardManager from "./pages/manager/dashboard/dashboardManager.tsx";
import { ROLES } from './constants/roles';
import './App.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={
                        <PublicRoute>
                            <HomePage/>
                        </PublicRoute>
                    }/>

                    <Route path="/login" element={
                        <PublicRoute>
                            <Login/>
                        </PublicRoute>
                    }/>

                    {/* Admin role */}
                    <Route path="/admin/dashboard" element={
                        <RoleBasedRoute allowedRoles={[ROLES.ADMIN]}>
                            <DashboardAdmin/>
                        </RoleBasedRoute>
                    }/>

                    {/* Director role */}
                    <Route path="/director/dashboard" element={
                        <RoleBasedRoute allowedRoles={[ROLES.DIRECTOR]}>
                            <DashboardDirector />
                        </RoleBasedRoute>
                    }/>

                    {/* Manager role */}
                    <Route path="/manager/dashboard" element={
                        <RoleBasedRoute allowedRoles={[ROLES.MANAGER]}>
                            <DashboardManager />
                        </RoleBasedRoute>
                    }/>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;