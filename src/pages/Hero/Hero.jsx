

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChessKing, FaChessQueen, FaChessPawn } from 'react-icons/fa';
import { BsArrowRight, BsPlayCircle } from "react-icons/bs";
import styles from './Hero.module.css';
import chess1 from "../../assets/Chess-1.png";
import chess2 from "../../assets/Chess-2.png";

const Hero = () => {
    const navigate = useNavigate();
    const heroRef = useRef(null);

    useEffect(() => {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = heroRef.current?.querySelectorAll(`.${styles.fadeIn}`);
        elements?.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <section className={styles.heroWrapper} id="home" ref={heroRef}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundDecor}>
                <div className={styles.decorCircle1}></div>
                <div className={styles.decorCircle2}></div>
                <div className={styles.gridPattern}></div>
            </div>

            <div className={styles.container}>
                {/* LEFT SIDE: Content */}
                <div className={styles.heroContent}>
                    <div className={`${styles.badge} ${styles.fadeIn}`}>
                        <span className={styles.badgeIcon}>
                            <FaChessKing />
                        </span>
                        <span className={styles.badgeText}>World's #1 Chess Platform</span>
                        <span className={styles.badgePulse}></span>
                    </div>

                    <h1 className={`${styles.heroTitle} ${styles.fadeIn}`}>
                        <span className={styles.titlePrimary}>Master Strategy</span>
                        <span className={styles.titleSecondary}>One Move at a Time</span>
                    </h1>

                    <p className={`${styles.heroSubtitle} ${styles.fadeIn}`}>
                        Sharpen your tactical vision with curated puzzles designed by grandmasters.
                        Join <span className={styles.highlight}>10,000+ players</span> elevating their game daily.
                    </p>

                    {/* Stats Row */}

                    {/* Trust Indicators */}
                    {/* <div className={`${styles.trustRow} ${styles.fadeIn}`}>
                        <span className={styles.trustText}>Trusted by players worldwide</span>
                        <div className={styles.ratingStars}>
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={styles.star}>★</span>
                            ))}
                        </div>
                        <span className={styles.ratingText}>4.9/5.0</span>
                    </div> */}
                    <div className={`${styles.ctaGroupRight} ${styles.fadeIn}`}>
                        <button
                            className={styles.btnSecondary}
                            onClick={() => navigate('/puzzle')}
                        >
                            <span>Start Solving</span>
                            <BsPlayCircle className={styles.btnPlayIcon} />
                            <div className={styles.btnShine}></div>
                        </button>

                        <button
                            className={styles.btnPrimary}
                            onClick={() => navigate('/dashboard')}
                        >
                            <BsArrowRight className={styles.btnIcon} />

                            <span>Puzzle Arena</span>
                        </button>
                    </div>
                </div>


                {/* RIGHT SIDE: Visual Showcase + Buttons */}
                <div className={styles.heroVisual}>
                    <div className={styles.rightColumnWrapper}>
                        <div className={styles.visualContainer}>
                            {/* Main Video Card */}
                            <div className={`${styles.videoCard} ${styles.fadeIn}`}>
                                <div className={styles.videoWrapper}>
                                    <video
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className={styles.heroVideo}
                                        poster={chess1}
                                    >
                                        <source
                                            src="https://assets.mixkit.co/videos/preview/mixkit-chess-pieces-on-a-chessboard-4265-large.mp4"
                                            type="video/mp4"
                                        />
                                    </video>
                                    <div className={styles.videoOverlay}>
                                        <div className={styles.liveBadge}>
                                            <span className={styles.liveDot}></span>
                                            LIVE
                                        </div>
                                    </div>
                                    <div className={styles.videoGradient}></div>
                                </div>
                            </div>

                            {/* Image Cards Grid */}
                            <div className={styles.imageGrid}>
                                <div className={`${styles.imageCard} ${styles.imageCard1} ${styles.fadeIn}`}>
                                    <img src={chess1} alt="Chess Strategy" />
                                    <div className={styles.imageOverlay}>
                                        <span className={styles.imageLabel}>Daily Puzzles</span>
                                    </div>
                                </div>

                                <div className={`${styles.imageCard} ${styles.imageCard2} ${styles.fadeIn}`}>
                                    <img src={chess2} alt="Chess Mastery" />
                                    <div className={styles.imageOverlay}>
                                        <span className={styles.imageLabel}>Master Level</span>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Stats Card */}
                            <div className={`${styles.floatingCard} ${styles.fadeIn}`}>
                                <div className={styles.floatingCardInner}>
                                    <div className={styles.floatingIcon}>🏆</div>
                                    <div className={styles.floatingContent}>
                                        <span className={styles.floatingNumber}>2,847</span>
                                        <span className={styles.floatingLabel}>Solutions Today</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons - Moved to Right Side */}

                        <div className={`${styles.statsRow} ${styles.fadeIn}`}>
                            <div className={styles.statItem}>
                                <div className={styles.statIcon}>
                                    <FaChessQueen />
                                </div>
                                <div className={styles.statContent}>
                                    <span className={styles.statNumber}>10K+</span>
                                    <span className={styles.statLabel}>Active Players</span>
                                </div>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statItem}>
                                <div className={styles.statIcon}>
                                    <FaChessPawn />
                                </div>
                                <div className={styles.statContent}>
                                    <span className={styles.statNumber}>50K+</span>
                                    <span className={styles.statLabel}>Puzzles Solved</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className={styles.scrollIndicator}>
                <div className={styles.scrollMouse}>
                    <div className={styles.scrollWheel}></div>
                </div>
            </div>
        </section>
    );
};

export default Hero;