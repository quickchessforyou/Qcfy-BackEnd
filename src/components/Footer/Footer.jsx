import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaChess, FaWhatsapp } from 'react-icons/fa';
import styles from './Footer.module.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.content}>
                    {/* Brand Section */}
                    <div className={styles.brandSection}>
                        <div className={styles.logo}>
                            <FaChess className={styles.logoIcon} />
                            <span>Quick Chess For You</span>
                        </div>
                        <p className={styles.brandDescription}>
                            Empowering chess enthusiasts with interactive learning, competitive tournaments, and comprehensive training programs.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.linksSection}>
                        <h3>Quick Links</h3>
                        <ul>
                            <li><a href="#hero">Home</a></li>
                            <li><a href="#about">About</a></li>
                            <li><a href="#courses">Courses</a></li>
                            <li><a href="#pricing">Pricing</a></li>
                            <li><a href="#coaching">Coaching</a></li>
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className={styles.linksSection}>
                        <h3>Legal</h3>
                        <ul>
                            <li>
                                <Link
                                    to="/privacy-policy"
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className={styles.contactSection}>
                        <h3>Contact Us</h3>
                        <div className={styles.contactItem}>
                            <FaEnvelope className={styles.contactIcon} />
                            <span>quickchess4kids@gmail.com</span>
                        </div>
                        <div className={styles.contactItem}>
                            <FaPhone className={styles.contactIcon} />
                            <span>+91 99017 39147</span>
                        </div>
                        <div className={styles.contactItem}>
                            <FaMapMarkerAlt className={styles.contactIcon} />
                            <span>Bangalore, India</span>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className={styles.copyright}>
                    <p>&copy; {currentYear} Quick Chess For You. All rights reserved.</p>
                </div>
            </div>

            {/* Floating WhatsApp Icon */}
            <a
                href="https://wa.me/6362957513"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappFloat}
                aria-label="Chat on WhatsApp"
            >
                <FaWhatsapp />
            </a>
        </footer>
    );
};

export default Footer;
