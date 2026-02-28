import React from 'react';
import styles from './Courses.module.css';
import { FaChessKnight, FaChessRook, FaChessQueen, FaClock, FaStar, FaArrowRight } from 'react-icons/fa';
import { PiBookOpenText, PiVideo, PiPencilCircle, PiChartBar } from 'react-icons/pi';
import SectionHeading from '../../components/SectionHeading/SectionHeading';

function Courses() {
  const courses = [
    {
      id: 1,
      title: 'Beginner Fundamentals',
      level: 'Beginner',
      duration: '8 weeks',
      rating: 4.9,
      students: 2500,
      icon: <FaChessKnight />,
      description: 'Master the basics of chess including piece movement, basic tactics, and opening principles.',
      topics: ['Piece Movement', 'Basic Tactics', 'Opening Principles', 'Endgame Basics']
    },
    {
      id: 2,
      title: 'Intermediate Strategy',
      level: 'Intermediate',
      duration: '12 weeks',
      rating: 4.8,
      students: 1800,
      icon: <FaChessRook />,
      description: 'Develop your strategic understanding with advanced tactics, positional play, and middlegame planning.',
      topics: ['Advanced Tactics', 'Positional Play', 'Pawn Structures', 'Strategic Planning']
    },
    {
      id: 3,
      title: 'Advanced Mastery',
      level: 'Advanced',
      duration: '16 weeks',
      rating: 4.9,
      students: 950,
      icon: <FaChessQueen />,
      description: 'Refine your skills with grandmaster-level concepts, deep calculation, and tournament preparation.',
      topics: ['Deep Calculation', 'Complex Endgames', 'Opening Repertoire', 'Tournament Prep']
    }
  ];

  return (
    <section className={styles.coursesWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <SectionHeading title="Featured Courses" />
          <p className={styles.subtitle}>
            Structured learning paths designed by grandmasters to take you from beginner to master.
          </p>
        </div>

        <div className={styles.coursesGrid}>
          {courses.map((course) => (
            <div key={course.id} className={styles.courseCard}>
              <div className={styles.cardHeader}>
                <div className={styles.courseIcon}>{course.icon}</div>
                <div className={styles.levelBadge}>{course.level}</div>
                <h3 className={styles.courseTitle}>{course.title}</h3>
                <p className={styles.courseDescription}>{course.description}</p>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <FaClock /> {course.duration}
                  </div>
                  <div className={styles.statItem}>
                    <FaStar /> {course.rating} ({course.students})
                  </div>
                </div>

                <div className={styles.topicsList}>
                  <h4>Curriculum Highlights</h4>
                  <ul>
                    {course.topics.map((topic, index) => (
                      <li key={index}>{topic}</li>
                    ))}
                  </ul>
                </div>

                <button className={styles.enrollBtn}>
                  Enroll Now <FaArrowRight />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.featuresWrapper}>
          <div className={styles.header} style={{ marginBottom: '60px' }}>
            <SectionHeading title="Why Join Our Courses?" />
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.featureItem}>
              <div className={styles.featureIconWrapper}>
                <PiBookOpenText className={styles.featureIcon} />
              </div>
              <h3>Comprehensive Curriculum</h3>
              <p>Step-by-step progressions covering every phase of the game.</p>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIconWrapper}>
                <PiVideo className={styles.featureIcon} />
              </div>
              <h3>Video Lessons</h3>
              <p>HD video content containing detailed explanations.</p>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIconWrapper}>
                <PiPencilCircle className={styles.featureIcon} />
              </div>
              <h3>Practice Exercises</h3>
              <p>Reinforce learning with interactive puzzles and drills.</p>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIconWrapper}>
                <PiChartBar className={styles.featureIcon} />
              </div>
              <h3>Progress Tracking</h3>
              <p>Monitor your improvement with detailed performance analytics.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Courses;
