import React from 'react';
import styles from './SectionHeading.module.css';

function SectionHeading({ title, as: Tag = 'h2', className = '', center = true }) {
  return (
    <Tag
      className={`${styles.sectionHeading} ${center ? styles.center : ''} ${className}`}
    >
      {title}
    </Tag>
  );
}

export default SectionHeading;
