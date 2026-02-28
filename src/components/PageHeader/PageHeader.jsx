import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import styles from './PageHeader.module.css';

const PageHeader = ({
    title,
    subtitle,
    icon,
    actions,
    showBackButton = false,
    onBack
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <header className={styles.pageHeader}>
            <div className={styles.headerContent}>
                <div className={styles.headerLeft}>
                    {showBackButton && (
                        <button className={styles.backButton} onClick={handleBack}>
                            <FaArrowLeft />
                        </button>
                    )}

                    <div className={styles.titleSection}>
                        {icon && <div className={styles.headerIcon}>{icon}</div>}
                        <div className={styles.textContent}>
                            <h1 className={styles.title}>{title}</h1>
                            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                        </div>
                    </div>
                </div>

                {actions && (
                    <div className={styles.headerActions}>
                        {actions}
                    </div>
                )}
            </div>
        </header>
    );
};

export default PageHeader;
