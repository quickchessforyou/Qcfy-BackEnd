import React from 'react';
import { FaHistory } from 'react-icons/fa';
import PageHeader from '../../components/PageHeader/PageHeader';
import styles from './DashboardPages.module.css';

const PuzzleHistory = () => {
    const history = [
        { id: 101, theme: 'Fork', rating: 1200, result: 'Solved', date: '2025-01-01 10:30 AM' },
        { id: 102, theme: 'Pin', rating: 1250, result: 'Failed', date: '2025-01-01 10:35 AM' },
        { id: 103, theme: 'Mate in 2', rating: 1180, result: 'Solved', date: '2025-01-01 10:40 AM' },
    ];

    return (
        <div className={styles.pageContainer}>
            <PageHeader
                title="Puzzle History"
                subtitle="Review your recent tactical exercises"
                icon={<FaHistory />}
            />

            <div className={styles.statsOverview}>
                <div className={styles.statBox}>
                    <h3>Today</h3>
                    <p className={styles.statNumber}>15</p>
                    <span className={styles.statLabel}>Solved</span>
                </div>
                <div className={styles.statBox}>
                    <h3>Accuracy</h3>
                    <p className={styles.statNumber}>85%</p>
                </div>
                <div className={styles.statBox}>
                    <h3>Current Streak</h3>
                    <p className={styles.statNumber}>3</p>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Theme</th>
                                <th>Rating</th>
                                <th>Result</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(item => (
                                <tr key={item.id}>
                                    <td>{item.theme}</td>
                                    <td>{item.rating}</td>
                                    <td>
                                        <span className={item.result === 'Solved' ? styles.textSuccess : styles.textDanger}>
                                            {item.result}
                                        </span>
                                    </td>
                                    <td>{item.date}</td>
                                    <td><button className={styles.linkBtn}>Review</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PuzzleHistory;
