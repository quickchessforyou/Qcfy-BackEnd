import React from 'react';
import Hero from '../Hero/Hero';
import About from '../About/About';
import Courses from '../Courses/Courses';
import Pricing from '../Pricing/Pricing';
import Coaching from '../Coaching/Coaching';
import Contact from '../Contact/Contact';
import Footer from '../../components/Footer/Footer';
import styles from './Home.module.css';
import HighlightsStrip from '../HighlightsStrip/HighlightsStrip';

const Home = () => {
  return (
    <div className={styles.mainWrapper}>
      <Hero />
      <HighlightsStrip />

      <div id="about" className={styles.sectionWrapper}>
        <About />
      </div>

      <div id="courses" className={styles.sectionWrapper}>
        <Courses />
      </div>

      <div id="pricing" className={styles.sectionWrapper}>
        <Pricing />
      </div>

      <div id="coaching" className={styles.sectionWrapper}>
        <Coaching />
      </div>

      <div id="contact" className={styles.sectionWrapper}>
        <Contact />
      </div>

      <Footer />
    </div>
  );
};

export default Home;