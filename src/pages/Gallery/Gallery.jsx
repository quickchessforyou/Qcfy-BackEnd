import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './Gallery.module.css';

const Gallery = () => {
    const [selectedImage, setSelectedImage] = useState(null);

    // Load all images from assets/gallery using Vite's import.meta.glob
    const imageModules = import.meta.glob('../../assets/gallery/*.jpeg', { eager: true });

    // Convert to array, sort numerically (img1, img2, ..., img10), and map to object structure
    const photos = Object.keys(imageModules)
        .sort((a, b) => {
            const numA = parseInt(a.match(/img(\d+)\./)?.[1] || 0);
            const numB = parseInt(b.match(/img(\d+)\./)?.[1] || 0);
            return numA - numB;
        })
        .map((path) => ({
            url: imageModules[path].default,
            alt: 'Chess Academy Moment'
        }));

    // Assign random sizes for masonry effect
    const photoSizes = photos.map((photo, idx) => ({
        ...photo,
        size: idx % 5 === 0 ? 'large' : idx % 3 === 0 ? 'medium' : 'small'
    }));

    const openModal = (index) => {
        setSelectedImage(index);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    const navigateImage = (direction) => {
        if (selectedImage === null) return;

        if (direction === 'prev') {
            setSelectedImage(selectedImage === 0 ? photos.length - 1 : selectedImage - 1);
        } else {
            setSelectedImage(selectedImage === photos.length - 1 ? 0 : selectedImage + 1);
        }
    };

    return (
        <div className={styles.galleryPage}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Our Gallery</h1>
                <p className={styles.pageSubtitle}>Moments captured at our chess academy</p>
            </div>

            <div className={styles.galleryGrid}>
                {photoSizes.map((photo, index) => (
                    <div
                        key={index}
                        className={`${styles.galleryItem} ${styles[photo.size]}`}
                        onClick={() => openModal(index)}
                    >
                        <img src={photo.url} alt={`${photo.alt} ${index + 1}`} />
                        <div className={styles.imageOverlay}>
                            <span className={styles.viewText}>View Full Size</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedImage !== null && (
                <div className={styles.modal} onClick={closeModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={closeModal}>
                            <FaTimes />
                        </button>

                        <button
                            className={`${styles.navBtn} ${styles.prevBtn}`}
                            onClick={() => navigateImage('prev')}
                        >
                            ❮
                        </button>

                        <img
                            src={photos[selectedImage].url}
                            alt={`${photos[selectedImage].alt} ${selectedImage + 1}`}
                            className={styles.modalImage}
                        />

                        <button
                            className={`${styles.navBtn} ${styles.nextBtn}`}
                            onClick={() => navigateImage('next')}
                        >
                            ❯
                        </button>

                        <div className={styles.imageCounter}>
                            {selectedImage + 1} / {photos.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;
