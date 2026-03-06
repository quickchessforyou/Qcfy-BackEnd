import React from 'react';
import styles from './HighlightsStrip.module.css';

const HighlightsStrip = () => {
  const items = [
    '10K+ STUDENTS',
    '50K+ PUZZLES',
    '500+ TOURNAMENTS',
    '50+ MASTERS',
  ];

  return (
    <div className={styles.servicesStrip}>
      <div className={styles.marqueeTrack}>
        {/* Two identical sets — when first set scrolls off, second takes over seamlessly */}
        <div className={styles.marqueeContent} aria-hidden="false">
          {items.map((item, index) => (
            <React.Fragment key={`a-${index}`}>
              <span className={styles.item}>{item}</span>
              <span className={styles.dot} />
            </React.Fragment>
          ))}
        </div>
        <div className={styles.marqueeContent} aria-hidden="true">
          {items.map((item, index) => (
            <React.Fragment key={`b-${index}`}>
              <span className={styles.item}>{item}</span>
              <span className={styles.dot} />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HighlightsStrip;