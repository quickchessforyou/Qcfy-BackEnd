import styles from './Contact.module.css';
import { FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { PiPhoneCall } from 'react-icons/pi';

function Contact() {
  return (
    <section className={styles.contactWrapper}>
      <div className={styles.container}>
        {/* Top Row: Label + Big Email */}
        <div className={styles.topSection}>
          <div className={styles.emailGroup}>
            <span className={styles.smallLabel}>Uncover the potency<br />of Chess at</span>
            <a href="mailto:quickchess4kids@gmail.com" className={styles.emailLink}>
              quickchess4kids@gmail.com
            </a>
          </div>

          <a href="tel:+916362957513" className={styles.ctaCard}>
            <span className={styles.ctaLabel}>Call Us</span>
            <div className={styles.ctaAction}>
              <PiPhoneCall className={styles.ctaIcon} size={24} />
              <span className={styles.phoneNumber}>+91 63629 57513</span>

            </div>
          </a>
        </div>

        {/* Middle Row: Info Grid */}
        <div className={styles.middleSection}>
          <div className={styles.linksGroup}>
            <a href="#courses" className={styles.linkItem}>Courses</a>
            <a href="#pricing" className={styles.linkItem}>Pricing</a>
            <a href="#coaching" className={styles.linkItem}>Coaching</a>
          </div>

          {/* <div className={styles.addressGroup}>
            <h4 className={styles.addressTitle}>Office</h4>
            <p className={styles.addressText}>
              Odisha, India<br />
              Mon - Fri: 9AM - 6PM
            </p>
          </div> */}
        </div>

        {/* Bottom: Massive Brand Text */}
        {/* <div className={styles.bottomSection}>
          <h1 className={styles.brandTitle}>QuickChess</h1>
        </div> */}

        {/* Footer Strip */}
        <div className={styles.footerStrip}>
          <span>Copyright © QuickChess 2024</span>
          <span>Odisha, IN</span>
          <span>Instagram</span>
          <span>LinkedIn</span>
        </div>
      </div>
    </section>
  );
}

export default Contact;
