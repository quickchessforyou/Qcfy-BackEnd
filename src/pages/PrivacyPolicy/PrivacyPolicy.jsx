import React from 'react';
import styles from './PrivacyPolicy.module.css';

const PrivacyPolicy = () => {
    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Privacy Policy – Quick Chess For You</h1>
                    <p className={styles.lastUpdated}>Last Updated: January 5, 2026</p>
                </div>

                <section className={styles.section}>
                    <h2>Introduction</h2>
                    <p>
                        Welcome to Quick Chess For You. We understand that privacy online is important to users of our App, especially while creating accounts and using interactive services. This Privacy Policy governs our data practices for users who visit the App without registering ("Visitors") and users who register and use the services provided by Quick Chess For You ("Registered Users").
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Personally Identifiable Information</h2>
                    <p>
                        Personally Identifiable Information (PII) refers to any information that identifies or can be used to identify, contact, or locate an individual. This includes, but is not limited to, name, email address, phone number, IP address, location data, device details, and browser information.
                    </p>
                    <p>
                        PII does not include anonymous data or demographic information not linked to an identifiable individual.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>What Personally Identifiable Information is Collected?</h2>
                    <p>We may collect basic profile information from all Visitors.</p>
                    <p>For Registered Users, we may additionally collect:</p>
                    <ul>
                        <li>Name</li>
                        <li>Email address</li>
                        <li>Phone number</li>
                        <li>IP address</li>
                        <li>Location</li>
                        <li>Device and browser information</li>
                        <li>Chess-related data such as rating, game history, puzzles attempted, and performance statistics</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>Who Collects the Information?</h2>
                    <p>Quick Chess For You directly collects user information.</p>
                    <p>
                        In addition, trusted third-party service providers (such as hosting providers, analytics tools, payment processors, and authentication services) may collect limited information as required to provide their services.
                    </p>
                    <p>
                        These third parties are required to use user data only for the intended purpose and in compliance with applicable privacy laws.
                    </p>
                    <p>
                        We do not use any collected data to train generalized AI or machine learning models.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>How Do We Use Personally Identifiable Information?</h2>
                    <p>We use Personally Identifiable Information to:</p>
                    <ul>
                        <li>Create and manage user accounts</li>
                        <li>Provide chess games, puzzles, ratings, and tournaments</li>
                        <li>Improve app performance and user experience</li>
                        <li>Communicate important updates, announcements, or service-related information</li>
                        <li>Respond to user inquiries and support requests</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>With Whom May the Information Be Shared?</h2>
                    <ul>
                        <li>User information may be shared with trusted service providers strictly on a need-to-know basis</li>
                        <li>Aggregated and anonymized data may be shared for analytics and improvement purposes</li>
                        <li>We do not sell or rent personal data to third parties</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>How Is Personally Identifiable Information Stored?</h2>
                    <p>
                        All user data is stored securely using industry-standard security practices.
                    </p>
                    <p>
                        Access to personal data is limited to authorized personnel only and is used strictly for operational purposes.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>User Choices Regarding Data Collection and Use</h2>
                    <p>Users may:</p>
                    <ul>
                        <li>Opt out of non-essential communications</li>
                        <li>Request access, correction, or deletion of personal data</li>
                        <li>Deactivate their account at any time</li>
                    </ul>
                    <p>Requests can be made by contacting us through the details provided below.</p>
                </section>

                <section className={styles.section}>
                    <h2>Cookies and Tracking Technologies</h2>
                    <p>Quick Chess For You may use cookies and similar technologies to:</p>
                    <ul>
                        <li>Maintain login sessions</li>
                        <li>Enhance security</li>
                        <li>Analyze usage patterns</li>
                        <li>Improve gameplay experience</li>
                    </ul>
                    <p>Users can control cookie preferences through their device or browser settings.</p>
                </section>

                <section className={styles.section}>
                    <h2>Use of Log Information</h2>
                    <p>
                        We may automatically collect log information such as IP address, device type, operating system, and app usage patterns to:
                    </p>
                    <ul>
                        <li>Monitor performance</li>
                        <li>Diagnose technical issues</li>
                        <li>Prevent fraud and abuse</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>Disclosure to Comply With Legal Obligations</h2>
                    <p>
                        We may disclose Personally Identifiable Information if required to do so by law, court order, or government request, or when necessary to protect the safety and rights of users and the platform.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Data Security</h2>
                    <p>
                        We take commercially reasonable steps to protect user data using encryption, access controls, and regular security audits.
                    </p>
                    <p>
                        However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Updating or Correcting Personal Information</h2>
                    <p>
                        Users may update or correct their personal information by accessing their account settings or by contacting us directly.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Deleting or Deactivating Personal Information</h2>
                    <p>Users may request deletion or deactivation of their personal data.</p>
                    <p>
                        Some residual data may remain in backups for legal or operational reasons, but such data will not be actively used or shared.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Contact Details for Privacy Requests</h2>
                    <div className={styles.contactInfo}>
                        <p><strong>📧 Email:</strong> support@quickchess4you.com</p>
                        <p><strong>📍 Address:</strong> Odisha, India</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Changes to This Privacy Policy</h2>
                    <p>
                        Quick Chess For You may update this Privacy Policy from time to time. Any changes will be posted within the App or on our website.
                    </p>
                    <p>
                        If changes significantly affect user privacy, we will notify users accordingly.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
