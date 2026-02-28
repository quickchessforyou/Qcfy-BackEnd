import React from 'react';
import styles from './HighlightsStrip.module.css';

const HighlightsStrip = () => {
  const items = [
    '10K+ STUDENTS',
    '50K+ PUZZLES',
    '500+ TOURNAMENTS',
    '50+ MASTERS',
  ];

  // We need enough duplicates to ensure we can scroll smoothly. 
  // 12 sets of items ensures we cover even very large screens multiple times.
  const marqueeItems = [...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items];

  return (
    <div className={styles.servicesStrip}>
      <div className={styles.track}>
        {marqueeItems.map((item, index) => (
          <React.Fragment key={index}>
            <span className={styles.item}>{item}</span>
            <div className={styles.dot}></div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default HighlightsStrip;