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
      description: 'Build a strong chess foundation — learn every rule, understand the board, and discover your first winning tactics.',
      topics: [
        'Piece names, values & movements',
        'Board visualization & center control',
        'Castling, En Passant & Pawn Promotion',
        'King safety & illegal moves',
        'Forks, Pins & Skewers',
        'Beginner puzzles & tactical exercises',
      ]
    },
    {
      id: 2,
      title: 'Intermediate Strategy',
      level: 'Intermediate',
      duration: '12 weeks',
      rating: 4.8,
      students: 1800,
      icon: <FaChessRook />,
      description: 'Learn to finish games decisively — master checkmate patterns and the key endgame techniques every player needs.',
      topics: [
        'King + Queen, Rook & Two-Rook mates',
        'Mate in 1, 2 & 3–5 move sequences',
        'Anastasia, Smothered & Back Rank mates',
        'Pawn endgames & opposition concepts',
        'Passed pawns & geometrical square',
        'Endgame puzzles & winning technique',
      ]
    },
    {
      id: 3,
      title: 'Advanced Mastery',
      level: 'Advanced',
      duration: '16 weeks',
      rating: 4.9,
      students: 950,
      icon: <FaChessQueen />,
      description: 'Play with confidence from move one — study essential openings and master the most complex endgame scenarios.',
      topics: [
        'Opening principles: center, development & king safety',
        'Italian Game, Ruy Lopez & Sicilian Defense',
        'Caro-Kann, French, Queen\'s Gambit & King\'s Indian',
        'Two bishops mate & Bishop + Knight mate',
        'Queen vs Rook & Rook vs minor piece endgames',
        'Advanced endgame calculation & technique',
      ]
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
