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
import UpdatePassword from "./pages/update-password/updatePassword.tsx";
import ForgotPassword from './pages/reset-password/forgotPassword';
{/* Admin Routes */}
import DashboardAdmin from './pages/admin/dashboard/dashboardAdmin';
{/* Director Routes */}
import DashboardDirector from "./pages/director/dashboardDirector.tsx";
import CustomerList from "./pages/director/CustomerList.tsx";
import CustomerDetail from "./pages/director/CustomerDetail.tsx";
import CustomerEdit from "./pages/director/CustomerEdit.tsx";
import CustomerSchedule from "./pages/director/CustomerSchedule.tsx";
import EmployeeControl from "./pages/director/EmployeeControl.tsx";
import EContractLogin from './pages/eContract/eContractLogin';
import EContractDashboard from './pages/eContract/eContractDashboard';
import EContractList from "./pages/eContract/eContractList.tsx";
import EContractCreateNew from "./pages/eContract/eContractCreateNew.tsx";
import TemplateEditor from "./pages/eContract/TemplateEditor.tsx";
import ContractReview from "./pages/eContract/ContractReview.tsx";
import LaborTemplateEditor from "./pages/eContract/LaborTemplateEditor.tsx";
import LaborContractReview from "./pages/eContract/LaborContractReview.tsx";
import ServiceTemplateEditor from "./pages/eContract/ServiceTemplateEditor.tsx";
import ServiceContractReview from "./pages/eContract/ServiceContractReview.tsx";
import ContractSign from "./pages/eContract/ContractSign.tsx";
import ContractDetail from "./pages/eContract/ContractDetail.tsx";
import ContractApproval from "./pages/eContract/ContractApproval.tsx";
{/* Manager Routes */}
import DashboardManager from "./pages/manager/dashboardManager.tsx";
import ManagerRequest from "./pages/manager/managerRequest.tsx";
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

                    <Route path="/update-password" element={
                        <PublicRoute>
                            <UpdatePassword/>
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

                    <Route path="/e-contracts/guard-template-editor" element={
                        <EContractRoute>
                            <TemplateEditor/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/guard-template-review" element={
                        <EContractRoute>
                            <ContractReview/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/manager-template-editor" element={
                        <EContractRoute>
                            <LaborTemplateEditor/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/manager-template-review" element={
                        <EContractRoute>
                            <LaborContractReview/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/service-template-editor" element={
                        <EContractRoute>
                            <ServiceTemplateEditor/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/service-template-review" element={
                        <EContractRoute>
                            <ServiceContractReview/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/item/:documentId" element={
                        <EContractRoute>
                            <ContractDetail/>
                        </EContractRoute>
                    }/>

                    <Route path="/e-contracts/approve/:documentId" element={
                        <EContractRoute>
                            <ContractApproval/>
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
                    <Route path="/director/customer-list" element={
                        <RoleBasedRoute allowedRoles={[ROLES.DIRECTOR]}>
                            <CustomerList />
                        </RoleBasedRoute>
                    }/>
                    <Route path="/director/customer/:customerId" element={
                        <RoleBasedRoute allowedRoles={[ROLES.DIRECTOR]}>
                            <CustomerDetail />
                        </RoleBasedRoute>
                    }/>
                    <Route path="/director/customer/:customerId/edit" element={
                        <RoleBasedRoute allowedRoles={[ROLES.DIRECTOR]}>
                            <CustomerEdit />
                        </RoleBasedRoute>
                    }/>
                    <Route path="/director/customer/:customerId/view-shift-schedule" element={
                        <RoleBasedRoute allowedRoles={[ROLES.DIRECTOR]}>
                            <CustomerSchedule />
                        </RoleBasedRoute>
                    }/>
                    <Route path="/director/employee-control" element={
                        <RoleBasedRoute allowedRoles={[ROLES.DIRECTOR]}>
                            <EmployeeControl />
                        </RoleBasedRoute>
                    }/>

                    {/* Manager role */}
                    <Route path="/manager/dashboard" element={
                        <RoleBasedRoute allowedRoles={[ROLES.MANAGER]}>
                            <DashboardManager />
                        </RoleBasedRoute>
                    }/>
                    <Route path="/manager/request" element={
                        <RoleBasedRoute allowedRoles={[ROLES.MANAGER]}>
                            <ManagerRequest />
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