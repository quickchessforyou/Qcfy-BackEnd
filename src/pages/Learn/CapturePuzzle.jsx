import React from 'react';
import styles from './CapturePuzzle.module.css';
import { useNavigate } from 'react-router-dom';

const CapturePuzzle = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={`${styles.blob} ${styles.blob1}`} />
            <div className={`${styles.blob} ${styles.blob2}`} />

            <div className={styles.content}>
                <div className={styles.badge}>Development in Progress</div>

                <div className={styles.iconWrapper}>
                    🚀
                </div>

                <h1 className={styles.title}>Something Epic<br />Is Coming Soon</h1>

                <p className={styles.subtitle}>
                    We are crafting an extraordinary interactive learning experience for you.
                    Get ready to master your chess skills with our upcoming Capture Puzzles.
                </p>

                <button className={styles.button} onClick={() => navigate(-1)}>
                    Go Back
                </button>
            </div>
        </div>
    );
};

export default CapturePuzzle;
