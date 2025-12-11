import { useContext } from 'react';
import { EContractAuthContext } from '../contexts/eContractAuthContext';

export const useEContractAuth = () => {
    const context = useContext(EContractAuthContext);

    if (!context) {
        throw new Error('useEContractAuth must be used within EContractAuthProvider');
    }

    return context;
};
