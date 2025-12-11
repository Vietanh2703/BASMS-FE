import React, { useEffect, useState, useRef } from 'react';
import './snackbarWarning.css';

interface SnackbarWarningProps {
    message: string;
    isOpen: boolean;
    duration?: number;
    onClose: () => void;
}

const SnackbarWarning: React.FC<SnackbarWarningProps> = ({
                                                             message,
                                                             isOpen,
                                                             duration = 3000,
                                                             onClose
                                                         }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const onCloseRef = useRef(onClose);

    // Keep onCloseRef up to date
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

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
                onCloseRef.current();
            }, duration + 300);

            return () => {
                clearTimeout(exitTimer);
                clearTimeout(closeTimer);
            };
        }
    }, [isOpen, duration]);

    if (!isOpen && !isVisible) return null;

    return (
        <div className={`snackbar-warning ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}>
            <div className="snackbar-content">
                <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="snackbar-message">{message}</span>
            </div>
            <div className="snackbar-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    );
};

export default SnackbarWarning;
