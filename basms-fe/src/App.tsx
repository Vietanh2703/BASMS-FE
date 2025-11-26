import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "./contexts/authContext";
import { EContractAuthProvider } from "./contexts/eContractAuthContext";
import { PublicRoute } from './utils/publicRoute';
import { RoleBasedRoute } from './utils/roleBasedRoute.tsx';
import { EContractRoute } from './utils/eContractRoute';
{/* Public Route */}
import HomePage from './pages/home/homepage';
import Login from './pages/login/login';
import VerifyEmail from './pages/reset-password/verifyEmail';
import VerifyOtpPassword from './pages/reset-password/verifyOtpPassword';
import ForgotPassword from './pages/reset-password/forgotPassword';
{/* Admin Routes */}
import DashboardAdmin from './pages/admin/dashboard/dashboardAdmin';
{/* Director Routes */}
import DashboardDirector from "./pages/director/dashboard/dashboardDirector.tsx";
import EContractLogin from './pages/eContract/eContractLogin';
import EContractDashboard from './pages/eContract/eContractDashboard';
import EContractList from "./pages/eContract/eContractList.tsx";
import EContractCreateNew from "./pages/eContract/eContractCreateNew.tsx";
import TemplateEditor from "./pages/eContract/TemplateEditor.tsx";
import ContractReview from "./pages/eContract/ContractReview.tsx";
import ContractSign from "./pages/eContract/ContractSign.tsx";
import ContractDetail from "./pages/eContract/ContractDetail.tsx";
{/* Manager Routes */}
import DashboardManager from "./pages/manager/dashboard/dashboardManager.tsx";
import { ROLES } from './constants/roles';
import './App.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <EContractAuthProvider>
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

                    <Route path="/verify-email" element={
                        <PublicRoute>
                            <VerifyEmail/>
                        </PublicRoute>
                    }/>

                    <Route path="/verify-otp-password" element={
                        <PublicRoute>
                            <VerifyOtpPassword/>
                        </PublicRoute>
                    }/>

                    <Route path="/forgot-password" element={
                        <PublicRoute>
                            <ForgotPassword/>
                        </PublicRoute>
                    }/>

                    <Route path="/e-contract/login" element={
                        <PublicRoute>
                            <EContractLogin/>
                        </PublicRoute>
                    }/>

                    <Route path="/:documentId/sign" element={
                        <PublicRoute>
                            <ContractSign/>
                        </PublicRoute>
                    }/>

                    {/* EContract pages */}
                    <Route path="/e-contracts/dashboard" element={
                        <EContractRoute>
                            <EContractDashboard/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/list" element={
                        <EContractRoute>
                            <EContractList/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/create-new-contract" element={
                        <EContractRoute>
                            <EContractCreateNew/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/template-editor" element={
                        <EContractRoute>
                            <TemplateEditor/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/review" element={
                        <EContractRoute>
                            <ContractReview/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/item/:documentId" element={
                        <EContractRoute>
                            <ContractDetail/>
                        </EContractRoute>
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
                </EContractAuthProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;