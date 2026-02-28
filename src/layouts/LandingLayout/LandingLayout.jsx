import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import LoginModal from '../../components/LoginModal/LoginModal';
import styles from './LandingLayout.module.css';

const LandingLayout = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('login');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.openLogin) {
            setIsLoginModalOpen(true);
            // Clear state to prevent reopening on reload
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const handleLoginClick = () => {
        setModalMode('login');
        setIsLoginModalOpen(true);
    };

    const handleSignupClick = () => {
        setModalMode('signup');
        setIsLoginModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <Navbar onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
            <main className={styles.main}>
                <Outlet />
            </main>
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                initialMode={modalMode}
            />
        </div>
    );
};

export default LandingLayout;
