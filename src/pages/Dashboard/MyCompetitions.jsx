import React from 'react';
import { FaTrophy } from 'react-icons/fa';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './DashboardPages.module.css';

const MyCompetitions = () => {
    // Static data for now
    const competitions = [
        { id: 1, name: 'Weekly Rapid Arena', date: '2025-01-01', rank: '5th', score: 25, status: 'Completed' },
        { id: 2, name: 'Beginner Blitz', date: '2024-12-28', rank: '12th', score: 18, status: 'Completed' },
    ];

    return (
        <div className={styles.pageContainer}>
            <PageHeader
                title="My Competitions"
                subtitle="Track your tournament performance and history"
                icon={<FaTrophy />}
            />

            <div className={styles.contentGrid}>
                {competitions.length > 0 ? (
                    <div className={styles.card}>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Event Name</th>
                                        <th>Date</th>
                                        <th>Rank</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {competitions.map(comp => (
                                        <tr key={comp.id}>
                                            <td>{comp.name}</td>
                                            <td>{comp.date}</td>
                                            <td>{comp.rank}</td>
                                            <td>{comp.score}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[comp.status.toLowerCase()]}`}>
                                                    {comp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>No competitions joined yet.</p>
                        <button className={styles.actionBtn}>Find Tournaments</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCompetitions;
