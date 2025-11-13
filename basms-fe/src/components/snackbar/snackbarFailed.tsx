import React, { useEffect, useState } from 'react';
import './snackbarFailed.css';

interface SnackbarFailedProps {
    message: string;
    isOpen: boolean;
    duration?: number;
    onClose: () => void;
}

const SnackbarFailed: React.FC<SnackbarFailedProps> = ({
                                                           message,
                                                           isOpen,
                                                           duration = 3000,
                                                           onClose
                                                       }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(false);
            setIsExiting(false);
            setTimeout(() => setIsVisible(true), 10);

            const exitTimer = setTimeout(() => {
                setIsExiting(true);
            }, duration);

            const closeTimer = setTimeout(() => {
                setIsVisible(false);
                onClose();
            }, duration + 300);

            return () => {
                clearTimeout(exitTimer);
                clearTimeout(closeTimer);
            };
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen && !isVisible) return null;

    return (
        <div className={`snackbar-failed ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}>
            <div className="snackbar-content">
                <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="snackbar-message">{message}</span>
            </div>
            <div className="snackbar-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    );
};

export default SnackbarFailed;
