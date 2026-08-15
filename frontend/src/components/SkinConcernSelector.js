import React from 'react';

const SKIN_CONCERNS = [
  {
    id: 'acne',
    label: 'Acne',
    description: 'Pimples, breakouts',
    imageUrl: '/images/concerns/acne.jpg',
    fallback: '/images/concerns/acne.jpeg',
  },
  {
    id: 'dark_spots',
    label: 'Dark Spots',
    description: 'Hyperpigmentation',
    imageUrl: '/images/concerns/darkspots.jpg',
    fallback: '/images/concerns/darkspots.jpeg',
  },
  {
    id: 'wrinkles',
    label: 'Wrinkles',
    description: 'Fine lines, aging',
    imageUrl: '/images/concerns/wrinkles.jpg',
    fallback: '/images/concerns/wrinkles.jpeg',
  },
  {
    id: 'oily_skin',
    label: 'Oily Skin',
    description: 'Excess shine',
    imageUrl: '/images/concerns/oilyskin.png',
    fallback: null,
  },
  {
    id: 'dry_skin',
    label: 'Dry Skin',
    description: 'Flaky, tight',
    imageUrl: '/images/concerns/dryskin.png',
    fallback: null,
  },
  {
    id: 'redness',
    label: 'Redness',
    description: 'Irritation, rosacea',
    imageUrl: '/images/concerns/redness.png',
    fallback: null,
  },
  {
    id: 'sensitive',
    label: 'Sensitive',
    description: 'Reactive skin',
    imageUrl: '/images/concerns/sensitive.png',
    fallback: null,
  },
  {
    id: 'pigmentation',
    label: 'Pigmentation',
    description: 'Uneven skin tone',
    imageUrl: '/images/concerns/pigmentation.png',
    fallback: null,
  },
  {
    id: 'pores',
    label: 'Large Pores',
    description: 'Visible pores',
    imageUrl: '/images/concerns/pores.png',
    fallback: null,
  },
];

function SkinConcernSelector({ selected, onChange }) {
  const toggleConcern = (concernId) => {
    if (selected.includes(concernId)) {
      onChange(selected.filter(id => id !== concernId));
    } else {
      onChange([...selected, concernId]);
    }
  };

  const handleImageError = (e, concern) => {
    if (concern.fallback) {
      e.target.onerror = null;
      e.target.src = concern.fallback;
    } else {
      e.target.onerror = null;
      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23FAF0E6" rx="10"/%3E%3Ctext x="100" y="105" font-size="16" text-anchor="middle" fill="%23B8A99A" font-family="Times New Roman, serif"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
  };

  return (
    <div style={styles.grid}>
      {SKIN_CONCERNS.map((concern) => {
        const isSelected = selected.includes(concern.id);
        return (
          <div
            key={concern.id}
            onClick={() => toggleConcern(concern.id)}
            style={{
              ...styles.card,
              ...(isSelected ? styles.cardSelected : {}),
            }}
          >
            <div style={styles.imageWrapper}>
              <img
                src={concern.imageUrl}
                alt={concern.label}
                style={styles.image}
                onError={(e) => handleImageError(e, concern)}
              />
            </div>
            <div style={styles.label}>{concern.label}</div>
            <div style={styles.description}>{concern.description}</div>
            {isSelected && <div style={styles.checkmark}>✓</div>}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '16px',
    marginTop: '10px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E8DCC8',
    borderRadius: '12px',
    padding: '16px 12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    position: 'relative',
    minHeight: '180px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardSelected: {
    borderColor: '#556B2F',
    backgroundColor: '#F0F5E8',
    boxShadow: '0 4px 16px rgba(85, 107, 47, 0.15)',
  },
  imageWrapper: {
    width: '100%',
    height: '90px',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '10px',
    backgroundColor: '#FAF8F5',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  label: {
    fontSize: '15px',
    fontWeight: 'normal',
    color: '#3D2B1F',
    marginBottom: '2px',
    fontFamily: '"Times New Roman", Times, serif',
  },
  description: {
    fontSize: '11px',
    color: '#8FBC8F',
    lineHeight: '1.3',
    fontFamily: '"Times New Roman", Times, serif',
  },
  checkmark: {
    position: 'absolute',
    top: '8px',
    right: '10px',
    fontSize: '16px',
    color: '#556B2F',
    fontWeight: 'bold',
  },
};

export default SkinConcernSelector;