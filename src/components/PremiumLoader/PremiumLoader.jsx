import React from 'react';
import { FaChessKnight } from 'react-icons/fa';
import styles from './PremiumLoader.module.css';

const PremiumLoader = ({ text = "LOADING..." }) => {
    return (
        <div className={styles.premiumLoaderOverlay}>
            <div className={styles.loaderSpinner}>
                <div className={styles.loaderRing}></div>
                <div className={styles.loaderRingInner}></div>
                <FaChessKnight className={styles.loaderIcon} />
            </div>
            {text && <div className={styles.loaderText}>{text}</div>}
        </div>
    );
};

export default PremiumLoader;
