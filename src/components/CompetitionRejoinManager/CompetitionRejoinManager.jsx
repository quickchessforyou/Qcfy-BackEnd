import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { liveCompetitionAPI } from '../../services/liveCompetitionAPI';
import CompetitionRejoinModal from '../CompetitionRejoinModal/CompetitionRejoinModal';
import { useLocation } from 'react-router-dom';

const CompetitionRejoinManager = () => {
    const { user, isAuthenticated } = useAuth();
    const [activeCompetition, setActiveCompetition] = useState(null);
    const location = useLocation();

    console.log('[RejoinManager] Render. Auth:', isAuthenticated, 'Path:', location.pathname);

    useEffect(() => {
        const checkActiveParticipation = async () => {
            console.log('[RejoinManager] Checking participation...', { isAuthenticated, user: user?.username, path: location.pathname });

            // Don't check if not logged in
            if (!isAuthenticated || !user) {
                console.log('[RejoinManager] Not authenticated yet');
                return;
            }

            // Don't check if we are already in a competition page
            if (location.pathname.includes('/competition/') || location.pathname.includes('/live-competition/')) {
                console.log('[RejoinManager] Already on competition page');
                return;
            }

            try {
                console.log('[RejoinManager] Calling API...');
                const response = await liveCompetitionAPI.getActiveParticipation();
                console.log('[RejoinManager] API Response:', response);

                if (response.success && response.hasActiveParticipation) {
                    console.log('[RejoinManager] Active competition found:', response.competition);
                    setActiveCompetition(response.competition);
                } else {
                    console.log('[RejoinManager] No active participation response');
                }
            } catch (error) {
                console.error('[RejoinManager] Failed to check active participation:', error);
            }
        };

        // Check on mount and when location changes (in case they leave a competition)
        checkActiveParticipation();
    }, [isAuthenticated, user, location.pathname]);

    const handleClose = () => {
        setActiveCompetition(null);
    };

    if (!activeCompetition) return null;

    return (
        <CompetitionRejoinModal
            competition={activeCompetition}
            onClose={handleClose}
        />
    );
};

export default CompetitionRejoinManager;
