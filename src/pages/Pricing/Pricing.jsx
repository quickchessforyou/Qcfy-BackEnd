import React, { useState } from 'react';
import styles from './Pricing.module.css';
import { FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import SectionHeading from '../../components/SectionHeading/SectionHeading';

function Pricing() {
  const [activeFaq, setActiveFaq] = useState(0);

  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
      features: [
        '100 puzzles per month',
        'Basic tournaments access',
        'Community forums',
        'Basic progress tracking'
      ],
      limitations: [
        'Advanced analytics',
        'Personal coaching',
        'Opening database'
      ]
    },
    {
      name: 'Premium',
      price: 'Coming Soon',
      period: 'month',
      popular: true,
      features: [
        'Unlimited interactive puzzles',
        'All tournament access',
        'Priority support',
        'Advanced analytics dashboard',
        '1 coaching session/month',
        'Opening explorer tools',
        'Stockfish game analysis'
      ],
      limitations: []
    },
    {
      name: 'Pro',
      price: 'Coming Soon',
      period: 'month',
      features: [
        'Everything in Premium',
        '4 coaching sessions/month',
        'Personalized training plan',
        'Exclusive GM masterclasses',
        'Tournament preparation',
        'Priority tournament entry',
        'Team battles access'
      ],
      limitations: []
    }
  ];

  const faqs = [
    {
      question: 'Can I change my plan later?',
      answer: 'Yes, you can upgrade, downgrade, or cancel your plan at any time from your account settings.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'We offer a 7-day free trial for Premium and Pro plans so you can experience the full power of our platform.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, UPI, and net banking options secured by Razorpay.'
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(prev => prev === index ? -1 : index);
  };

  return (
    <section className={styles.pricingWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <SectionHeading title="Simple, Transparent Pricing" />
          <p className={styles.subtitle}>
            Choose the plan that best fits your chess journey.
          </p>
        </div>

        <div className={styles.pricingGrid}>
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`${styles.priceCard} ${plan.popular ? styles.popularCard : ''}`}
            >
              {plan.popular && <div className={styles.badge}>Most Popular</div>}

              <h3 className={styles.planName}>{plan.name}</h3>

              <div className={styles.price}>
                {plan.price === 'Coming Soon' ? (
                  <span className={styles.priceText}>{plan.price}</span>
                ) : (
                  <>
                    <span className={styles.currency}>₹</span>
                    {plan.price}
                    <span className={styles.period}>/{plan.period}</span>
                  </>
                )}
              </div>

              <ul className={styles.featuresList}>
                {plan.features.map((feature, i) => (
                  <li key={`feat-${i}`}>
                    <FaCheck className={styles.iconCheck} />
                    {feature}
                  </li>
                ))}
                {plan.limitations && plan.limitations.map((lim, i) => (
                  <li key={`lim-${i}`} className={styles.limitation}>
                    <FaTimes className={styles.iconCross} />
                    {lim}
                  </li>
                ))}
              </ul>

              <button className={`${styles.ctaBtn} ${plan.popular ? styles.primaryBtn : ''}`}>
                {plan.price === '0' ? 'Get Started Free' : 'Notify Me'}
              </button>
            </div>
          ))}
        </div>

        <div className={styles.faqSection}>
          <SectionHeading title="Frequently Asked Questions" center={false} />
          <div className={styles.faqGrid}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`${styles.faqItem} ${activeFaq === index ? styles.active : ''}`}
                onClick={() => toggleFaq(index)}
              >
                <div className={styles.faqHeader}>
                  <h4>{faq.question}</h4>
                  <div className={styles.faqIcon}>
                    {activeFaq === index ? <FaTimes /> : <FaPlus />}
                  </div>
                </div>
                <div className={styles.faqContent}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Pricing;
