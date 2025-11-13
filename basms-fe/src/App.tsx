import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "./contexts/authContext";
import HomePage from './pages/home/homepage';
import Login from './pages/login/login';
import { ProtectedRoute } from './utils/protectedRoute';
import { PublicRoute } from './utils/publicRoute';
import DashboardAdmin from './pages/admin/dashboard/dashboardAdmin';
import './App.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
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
                    <Route path="/admin/dashboard" element={
                        <ProtectedRoute>
                            <DashboardAdmin/>
                        </ProtectedRoute>
                    }/>
                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;