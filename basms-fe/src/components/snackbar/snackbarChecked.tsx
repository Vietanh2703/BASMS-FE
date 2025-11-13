import React, { useEffect, useState } from 'react';
import './snackbarChecked.css';

interface SnackbarCheckedProps {
    message: string;
    isOpen: boolean;
    duration?: number;
    onClose: () => void;
}

const SnackbarChecked: React.FC<SnackbarCheckedProps> = ({
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
        <div className={`snackbar-checked ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}>
            <div className="snackbar-content">
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="snackbar-message">{message}</span>
            </div>
            <div className="snackbar-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    );
};

export default SnackbarChecked;
