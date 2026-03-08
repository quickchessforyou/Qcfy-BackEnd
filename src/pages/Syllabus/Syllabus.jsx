import React, { useState, useEffect, useRef } from 'react';
import styles from './Syllabus.module.css';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import {
    FaChessPawn,
    FaChessBoard,
    FaChessKnight,
    FaStar,
    FaPuzzlePiece,
    FaChessKing,
    FaGamepad,
    FaTrophy,
    FaTimes,
    FaBookOpen,
    FaBullseye,
    FaClipboardList,
    FaHome,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';

const syllabusData = [
    {
        id: 1,
        title: 'Introduction to Chess',
        icon: <FaChessPawn />,
        color: '#b58863',
        description: 'Build your chess foundation from the very first square.',
        objectives: [
            'Understand the chessboard structure',
            'Learn the names of all chess pieces',
            'Understand piece values',
            'Recognize white vs black sides',
        ],
        topics: [
            'Chessboard layout (Ranks, Files, Squares)',
            'King, Queen, Rook, Bishop, Knight & Pawn',
            'Piece values & relative strength',
            'Basic rules of the game',
        ],
        activities: [
            'Identify pieces on the board',
            'Set up the board correctly',
            'Mini quiz on piece names',
        ],
    },
    {
        id: 2,
        title: 'Chessboard Visualization',
        icon: <FaChessBoard />,
        color: '#6c9bd2',
        description: 'Train your mind to see the board without looking.',
        objectives: [
            'Develop board awareness',
            'Visualize squares and coordinates',
            'Improve memory of board positions',
        ],
        topics: [
            'Board coordinates (A–H, 1–8)',
            'Square identification techniques',
            'Visualization exercises',
        ],
        activities: [
            'Close-eyes board visualization',
            'Square calling exercises',
            '"Find the square" game',
        ],
    },
    {
        id: 3,
        title: 'Piece Movements',
        icon: <FaChessKnight />,
        color: '#e8a838',
        description: 'Master how every piece conquers the board.',
        objectives: [
            'Learn how each chess piece moves',
            'Understand capturing rules',
            'Practice movement patterns',
        ],
        topics: [
            'Pawn movement and captures',
            'Rook & Bishop movement',
            'Knight\'s unique L-shape',
            'Queen & King movement',
        ],
        activities: [
            'Piece movement drills',
            'Movement puzzles',
            'Capture practice games',
        ],
    },
    {
        id: 4,
        title: ' Grab the Stars',
        icon: <FaStar />,
        color: '#d94f70',
        description: 'Interactive training to build speed and accuracy.',
        objectives: [
            'Practice movement through interactive exercises',
            'Build speed and accuracy',
        ],
        topics: [
            '"Grab the Stars" exercise using all pieces',
            'Timed challenges',
            'Score tracking & improvement',
        ],
        activities: [
            'Complete 3 rounds of Grab the Stars',
            'Beat your personal best',
            'Challenge a classmate',
        ],

    },
    {
        id: 5,
        title: 'Puzzle Training',
        icon: <FaPuzzlePiece />,
        color: '#629924',
        description: 'Sharpen your tactical eye with real game puzzles.',
        objectives: [
            'Improve tactical awareness',
            'Learn how to capture pieces strategically',
        ],
        topics: [
            'Basic tactical thinking',
            'Identifying free pieces',
            'Safe capturing techniques',
        ],
        activities: [
            '"Capture the Pieces" puzzles',
            'Beginner puzzle solving',
            'Puzzle race challenges',
        ],
        homework: 'Solve 5 puzzles daily',

        duration: '2 Sessions',
    },
    {
        id: 6,
        title: 'Basic Game Concepts',
        icon: <FaChessKing />,
        color: '#8b5cf6',
        description: 'Understand the heart of chess — check, checkmate, and stalemate.',
        objectives: [
            'Understand the objective of chess',
            'Learn basic strategy concepts',
        ],
        topics: [
            'Check & Checkmate',
            'Stalemate situations',
            'Piece safety fundamentals',
            'Basic piece development',
        ],
        activities: [
            'Checkmate examples walkthrough',
            'Identify check situations',
            'Mini board exercises',
        ],
    },
    {
        id: 7,
        title: 'Playing Full Games',
        icon: <FaGamepad />,
        color: '#06b6d4',
        description: 'Apply everything you\'ve learned in real game situations.',
        objectives: [
            'Apply learned concepts in real games',
            'Develop confidence in playing',
        ],
        topics: [
            'Guided practice games',
            'Friendly matches with peers',
            'Instructor feedback & review',
        ],
        activities: [
            'Play 3 games per week',
            'Analyze one game with instructor',
            'Record and review key moves',
        ],
    },
    {
        id: 8,
        title: 'Assessment & Tournament',
        icon: <FaTrophy />,
        color: '#fbbf24',
        description: 'Show what you know and earn your certificate!',
        objectives: [
            'Demonstrate understanding of chess basics',
            'Experience tournament style play',
        ],
        topics: [
            'Mini tournament format',
            'Puzzle challenge competition',
            'Certificate of completion',
        ],
        activities: [
            'Compete in mini tournament',
            'Solve challenge puzzles',
            'Receive your certificate!',
        ],
        evaluation: [
            'Piece movement knowledge',
            'Puzzle solving ability',
            'Game participation & sportsmanship',
        ],
    },
];

function Syllabus() {
    const [selectedModule, setSelectedModule] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [visibleCards, setVisibleCards] = useState(new Set());
    const cardRefs = useRef([]);

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.dataset.index);
                        setVisibleCards((prev) => new Set([...prev, index]));
                    }
                });
            },
            { threshold: 0.15 }
        );

        cardRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    const openModal = (module) => {
        setSelectedModule(module);
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedModule(null), 300);
        document.body.style.overflow = '';
    };

    const navigateModule = (direction) => {
        if (!selectedModule) return;
        const currentIndex = syllabusData.findIndex(m => m.id === selectedModule.id);
        const nextIndex = direction === 'next'
            ? (currentIndex + 1) % syllabusData.length
            : (currentIndex - 1 + syllabusData.length) % syllabusData.length;
        setSelectedModule(syllabusData[nextIndex]);
    };

    return (
        <section className={styles.syllabusWrapper}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <SectionHeading title="Course Syllabus" />
                    <p className={styles.subtitle}>
                        8 carefully crafted modules designed to transform beginners into confident chess players.
                    </p>
                    <div className={styles.practiceNote}>
                        <FaBookOpen />
                        <span>15–20 min daily practice recommended • Solve puzzles regularly • Play online or offline</span>
                    </div>
                </div>

                {/* Module Cards Grid */}
                <div className={styles.modulesGrid}>
                    {syllabusData.map((module, index) => (
                        <div
                            key={module.id}
                            ref={(el) => (cardRefs.current[index] = el)}
                            data-index={index}
                            className={`${styles.moduleCard} ${visibleCards.has(index) ? styles.visible : ''}`}
                            style={{
                                '--module-color': module.color,
                                '--animation-delay': `${index * 0.08}s`,
                            }}
                            onClick={() => openModal(module)}
                        >
                            <div className={styles.moduleNumber}>
                                <span>{String(module.id).padStart(2, '0')}</span>
                            </div>
                            <div className={styles.moduleIconWrap}>
                                {module.icon}
                            </div>
                            <h3 className={styles.moduleTitle}>{module.title}</h3>
                            <p className={styles.moduleDesc}>{module.description}</p>
                            <div className={styles.moduleFooter}>
                                {module.platform && (
                                    <span className={styles.platformBadge}>{module.platform}</span>
                                )}
                                <span className={styles.topicCount}>{module.topics.length} topics</span>
                                <span className={styles.viewMore}>View Details →</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── DETAIL MODAL ─── */}
            {isModalOpen && selectedModule && (
                <div className={`${styles.modalOverlay} ${isModalOpen ? styles.modalOpen : ''}`} onClick={closeModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className={styles.modalHeader} style={{ '--module-color': selectedModule.color }}>
                            <button className={styles.modalClose} onClick={closeModal}>
                                <FaTimes />
                            </button>
                            <div className={styles.modalNavButtons}>
                                <button className={styles.navBtn} onClick={() => navigateModule('prev')}>
                                    <FaChevronLeft />
                                </button>
                                <button className={styles.navBtn} onClick={() => navigateModule('next')}>
                                    <FaChevronRight />
                                </button>
                            </div>
                            <div className={styles.modalModuleNumber}>Module {selectedModule.id}</div>
                            <div className={styles.modalIcon}>{selectedModule.icon}</div>
                            <h2 className={styles.modalTitle}>{selectedModule.title}</h2>
                            <p className={styles.modalDescription}>{selectedModule.description}</p>
                            {selectedModule.platform && (
                                <span className={styles.modalPlatform}>{selectedModule.platform}</span>
                            )}
                            {selectedModule.duration && (
                                <span className={styles.modalDuration}>{selectedModule.duration}</span>
                            )}
                        </div>

                        {/* Modal Body */}
                        <div className={styles.modalBody}>
                            {/* Learning Objectives */}
                            <div className={styles.modalSection}>
                                <div className={styles.sectionLabel}>
                                    <FaBullseye />
                                    <h4>Learning Objectives</h4>
                                </div>
                                <ul className={styles.objectivesList}>
                                    {selectedModule.objectives.map((obj, i) => (
                                        <li key={i}>{obj}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Topics */}
                            <div className={styles.modalSection}>
                                <div className={styles.sectionLabel}>
                                    <FaBookOpen />
                                    <h4>Topics Covered</h4>
                                </div>
                                <div className={styles.topicsChips}>
                                    {selectedModule.topics.map((topic, i) => (
                                        <span key={i} className={styles.topicChip} style={{ '--module-color': selectedModule.color }}>
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Activities */}
                            <div className={styles.modalSection}>
                                <div className={styles.sectionLabel}>
                                    <FaClipboardList />
                                    <h4>Practice Activities</h4>
                                </div>
                                <ul className={styles.activitiesList}>
                                    {selectedModule.activities.map((act, i) => (
                                        <li key={i}>
                                            <span className={styles.activityDot} style={{ backgroundColor: selectedModule.color }}></span>
                                            {act}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Homework */}
                            {selectedModule.homework && (
                                <div className={styles.homeworkBanner} style={{ '--module-color': selectedModule.color }}>
                                    <FaHome />
                                    <div>
                                        <strong>Homework</strong>
                                        <p>{selectedModule.homework}</p>
                                    </div>
                                </div>
                            )}

                            {/* Evaluation */}
                            {selectedModule.evaluation && (
                                <div className={styles.modalSection}>
                                    <div className={styles.sectionLabel}>
                                        <FaTrophy />
                                        <h4>Evaluation Criteria</h4>
                                    </div>
                                    <ul className={styles.objectivesList}>
                                        {selectedModule.evaluation.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Syllabus;
