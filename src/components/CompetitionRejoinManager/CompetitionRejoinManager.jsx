import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { liveCompetitionAPI } from '../../services/liveCompetitionAPI';
import CompetitionRejoinModal from '../CompetitionRejoinModal/CompetitionRejoinModal';
import { useLocation } from 'react-router-dom';

const CompetitionRejoinManager = () => {
    const { user, isAuthenticated } = useAuth();
    const [activeCompetition, setActiveCompetition] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const checkActiveParticipation = async () => {
            // Don't check if not logged in
            if (!isAuthenticated || !user) return;

            // Skip on competition-related pages (user is already in-competition)
            if (location.pathname.includes('/competition/') ||
                location.pathname.includes('/live-competition/') ||
                location.pathname.includes('/leaderboard/')) {
                return;
            }

            // PERFORMANCE: Only check once per session to avoid API call on every route change
            const sessionKey = `rejoin_checked_${user.id || user._id}`;
            const lastCheck = sessionStorage.getItem(sessionKey);
            if (lastCheck) {
                // Already checked this session — use cached result
                try {
                    const cached = JSON.parse(lastCheck);
                    if (cached.hasActive && cached.competition) {
                        setActiveCompetition(cached.competition);
                    }
                } catch (e) { /* ignore parse errors */ }
                return;
            }

            try {
                const response = await liveCompetitionAPI.getActiveParticipation();

                if (response.success && response.hasActiveParticipation) {
                    setActiveCompetition(response.competition);
                    sessionStorage.setItem(sessionKey, JSON.stringify({
                        hasActive: true,
                        competition: response.competition
                    }));
                } else {
                    sessionStorage.setItem(sessionKey, JSON.stringify({ hasActive: false }));
                }
            } catch (error) {
                // Silently fail — don't block navigation
            }
        };

        checkActiveParticipation();
    }, [isAuthenticated, user, location.pathname]);

    const handleClose = () => {
        setActiveCompetition(null);
        // Clear cache so it doesn't show again
        const sessionKey = `rejoin_checked_${user?.id || user?._id}`;
        sessionStorage.setItem(sessionKey, JSON.stringify({ hasActive: false }));
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
