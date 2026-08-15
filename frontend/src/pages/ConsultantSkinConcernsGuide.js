// frontend/src/pages/ConsultantSkinConcernsGuide.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

function ConsultantSkinConcernsGuide() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('consultant');
  const [selectedConcern, setSelectedConcern] = useState('acne');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('role') || 'consultant';
    setUserName(name || 'Consultant');
    setUserRole(role);
  }, [navigate]);

  // Dynamic labels
  const pageTitle = userRole === 'dermatologist' ? '📖 Skin Conditions Guide' : '📖 Skin Concerns Guide';
  const pageSubtitle = userRole === 'dermatologist' ? 'Reference guide for common skin conditions and treatments.' : 'Reference guide for common skin concerns and treatments.';
  const sectionTitle = userRole === 'dermatologist' ? 'Skin Conditions' : 'Skin Concerns';

  const skinConcerns = {
    acne: {
      title: 'Acne',
      icon: '🔴',
      description: 'Acne occurs when hair follicles become clogged with oil and dead skin cells. It can appear as whiteheads, blackheads, or inflamed red pimples.',
      causes: [
        'Excess oil (sebum) production',
        'Clogged hair follicles',
        'Bacteria (Propionibacterium acnes)',
        'Hormonal changes',
        'Genetics',
        'Stress',
        'Diet (high glycemic foods)'
      ],
      symptoms: [
        'Whiteheads (closed clogged pores)',
        'Blackheads (open clogged pores)',
        'Papules (small red, tender bumps)',
        'Pustules (pimples with pus at tips)',
        'Nodules (large, solid, painful lumps)',
        'Cystic lesions (painful, pus-filled lumps)'
      ],
      treatments: [
        { name: 'Salicylic Acid', description: 'Unclogs pores and exfoliates skin. Best for blackheads and whiteheads.', strength: '0.5% - 2%', frequency: 'Daily' },
        { name: 'Benzoyl Peroxide', description: 'Kills acne-causing bacteria and helps remove excess oil.', strength: '2.5% - 10%', frequency: 'Daily' },
        { name: 'Retinoids', description: 'Unclogs pores and promotes cell turnover. Effective for all types of acne.', strength: '0.025% - 0.1%', frequency: 'Nightly (start slow)' },
        { name: 'Niacinamide', description: 'Reduces inflammation, regulates oil production, and improves skin barrier.', strength: '2% - 10%', frequency: 'Daily (AM/PM)' }
      ],
      products: [
        'CeraVe Acne Foaming Cream Cleanser',
        'The Ordinary Salicylic Acid 2% Solution',
        'La Roche-Posay Effaclar Duo',
        "Paula's Choice CLEAR Regular Strength Kit"
      ],
      tips: [
        'Wash face twice daily with gentle cleanser',
        'Avoid picking or popping pimples',
        'Use non-comedogenic products',
        'Change pillowcases regularly',
        'Wash hair regularly, especially if oily',
        'Manage stress levels'
      ]
    },
    hyperpigmentation: {
      title: 'Hyperpigmentation',
      icon: '🟤',
      description: 'Hyperpigmentation is a common condition where patches of skin become darker than the surrounding skin due to excess melanin production.',
      causes: [
        'Sun exposure and UV damage',
        'Hormonal changes (melasma)',
        'Post-inflammatory hyperpigmentation (acne scars)',
        'Medications',
        'Skin inflammation',
        'Genetics'
      ],
      symptoms: [
        'Dark patches on face, hands, or body',
        'Uneven skin tone',
        'Dark spots after acne heals',
        'Melasma patches (typically on cheeks, forehead)',
        'Age spots or liver spots'
      ],
      treatments: [
        { name: 'Vitamin C (L-Ascorbic Acid)', description: 'Brightens skin, inhibits melanin production, and provides antioxidant protection.', strength: '10% - 20%', frequency: 'Daily (AM)' },
        { name: 'Niacinamide', description: 'Reduces pigmentation, improves skin barrier, and evens skin tone.', strength: '2% - 10%', frequency: 'Daily (AM/PM)' },
        { name: 'Alpha Arbutin', description: 'Gentle skin brightener that inhibits melanin production.', strength: '1% - 2%', frequency: 'Daily (AM/PM)' },
        { name: 'Retinoids', description: 'Promotes cell turnover and fades dark spots over time.', strength: '0.025% - 0.1%', frequency: 'Nightly' },
        { name: 'Tranexamic Acid', description: 'Targets melanin production and helps fade dark spots.', strength: '2% - 5%', frequency: 'Daily (AM/PM)' }
      ],
      products: [
        'SkinCeuticals C E Ferulic Serum',
        'The Ordinary Alpha Arbutin 2% + HA',
        "Paula's Choice C15 Super Booster",
        'La Roche-Posay Mela-D Pigment Control'
      ],
      tips: [
        'Wear SPF 50+ sunscreen every single day',
        'Reapply sunscreen every 2 hours',
        'Use antioxidants (Vitamin C) in the morning',
        'Be patient - it takes 8-12 weeks to see results',
        'Avoid picking at skin',
        'Consider professional treatments (laser, chemical peels)'
      ]
    },
    dry_skin: {
      title: 'Dry Skin',
      icon: '💧',
      description: 'Dry skin occurs when the skin lacks sufficient moisture in its outer layer. It can be due to environmental factors, genetics, or skin conditions.',
      causes: [
        'Cold or dry weather',
        'Central heating and air conditioning',
        'Hot baths and showers',
        'Harsh soaps and detergents',
        'Genetics',
        'Age (skin becomes drier with age)',
        'Skin conditions (eczema, psoriasis)'
      ],
      symptoms: [
        'Flaky, scaly, or peeling skin',
        'Rough texture',
        'Tightness, especially after bathing',
        'Redness or irritation',
        'Fine lines and cracks',
        'Itching'
      ],
      treatments: [
        { name: 'Hyaluronic Acid', description: 'Attracts and retains moisture in the skin. Powerful humectant.', strength: '0.5% - 2%', frequency: 'Daily (AM/PM)' },
        { name: 'Ceramides', description: 'Restores skin barrier and locks in moisture.', strength: 'Varies by product', frequency: 'Daily (AM/PM)' },
        { name: 'Squalane', description: 'Mimics skin\'s natural oils and provides deep hydration.', strength: '100%', frequency: 'Daily (AM/PM)' },
        { name: 'Shea Butter', description: 'Rich moisturizer that soothes and softens dry skin.', strength: 'Varies by product', frequency: 'Daily (PM)' }
      ],
      products: [
        'CeraVe Hydrating Cleanser',
        'The Ordinary Hyaluronic Acid 2% + B5',
        "Kiehl's Ultra Facial Cream",
        'La Roche-Posay Lipikar Balm'
      ],
      tips: [
        'Use lukewarm water for bathing',
        'Apply moisturizer immediately after bathing',
        'Use a humidifier in dry environments',
        'Avoid harsh soaps and fragrances',
        'Drink plenty of water',
        'Exfoliate gently once a week'
      ]
    },
    oily_skin: {
      title: 'Oily Skin',
      icon: '🟡',
      description: 'Oily skin is characterized by excess sebum production, leading to a shiny appearance and enlarged pores. It can be genetic or hormone-related.',
      causes: [
        'Genetics',
        'Hormonal changes (puberty, menstrual cycle)',
        'Stress',
        'Climate (hot, humid weather)',
        'Over-cleansing (stripping natural oils)',
        'Using harsh products'
      ],
      symptoms: [
        'Shiny or greasy appearance',
        'Enlarged pores',
        'Blackheads and whiteheads',
        'Acne breakouts',
        'Thick, rough texture',
        "Makeup doesn't stay"
      ],
      treatments: [
        { name: 'Salicylic Acid', description: 'Unclogs pores and regulates oil production.', strength: '0.5% - 2%', frequency: 'Daily' },
        { name: 'Niacinamide', description: 'Regulates sebum production and minimizes pores.', strength: '2% - 10%', frequency: 'Daily (AM/PM)' },
        { name: 'Retinoids', description: 'Promotes cell turnover and unclogs pores.', strength: '0.025% - 0.1%', frequency: 'Nightly' },
        { name: 'Clay Masks', description: 'Absorbs excess oil and purifies pores.', strength: 'Use 1-2x/week', frequency: 'Weekly' }
      ],
      products: [
        'CeraVe Foaming Facial Cleanser',
        'The Ordinary Niacinamide 10% + Zinc 1%',
        "Paula's Choice BHA 2% Liquid Exfoliant",
        'La Roche-Posay Effaclar Mat'
      ],
      tips: [
        'Wash face twice daily but don\'t over-wash',
        'Use oil-free, non-comedogenic products',
        "Don't skip moisturizer (use lightweight gel formulas)",
        'Use clay masks once a week',
        'Blot excess oil throughout the day',
        'Avoid touching your face'
      ]
    },
    sensitive_skin: {
      title: 'Sensitive Skin',
      icon: '🟣',
      description: 'Sensitive skin is prone to redness, irritation, and reactions to products or environmental factors. It requires gentle care and soothing ingredients.',
      causes: [
        'Compromised skin barrier',
        'Genetics',
        'Skin conditions (rosacea, eczema)',
        'Environmental triggers (weather, pollution)',
        'Harsh skincare products',
        'Allergies'
      ],
      symptoms: [
        'Redness and flushing',
        'Stinging or burning sensation',
        'Itching',
        'Dryness and flaking',
        'Reactions to new products',
        'Sensitivity to sun and wind'
      ],
      treatments: [
        { name: 'Centella Asiatica (Cica)', description: 'Soothes and repairs sensitive, irritated skin.', strength: 'Varies by product', frequency: 'Daily (AM/PM)' },
        { name: 'Ceramides', description: 'Restores and strengthens skin barrier.', strength: 'Varies by product', frequency: 'Daily (AM/PM)' },
        { name: 'Aloe Vera', description: 'Soothes irritation and provides hydration.', strength: 'Varies by product', frequency: 'Daily (AM/PM)' },
        { name: 'Panthenol (Vitamin B5)', description: 'Calms and repairs sensitive skin.', strength: 'Varies by product', frequency: 'Daily (AM/PM)' }
      ],
      products: [
        'La Roche-Posay Toleriane Cleanser',
        'Avène Tolerance Control Skin Soothing Recovery Cream',
        'CeraVe Hydrating Cleanser',
        'Dr. Jart+ Cicapair Cream'
      ],
      tips: [
        'Patch test all new products',
        'Use fragrance-free and alcohol-free products',
        'Avoid physical exfoliants',
        'Apply products gently (no rubbing)',
        'Protect skin from sun with mineral sunscreen',
        'Keep routine simple with fewer products'
      ]
    },
    aging: {
      title: 'Aging & Wrinkles',
      icon: '⏳',
      description: 'Skin aging is a natural process characterized by the loss of collagen, elastin, and moisture. It can be accelerated by environmental factors.',
      causes: [
        'Natural aging process',
        'Sun exposure (photoaging)',
        'Loss of collagen and elastin',
        'Decreased cell turnover',
        'Reduced oil production',
        'Genetics',
        'Smoking and pollution'
      ],
      symptoms: [
        'Fine lines and wrinkles',
        'Loss of firmness and elasticity',
        'Sagging skin',
        'Dull complexion',
        'Uneven skin tone',
        'Thinning skin'
      ],
      treatments: [
        { name: 'Retinoids (Retinol/Tretinoin)', description: 'Stimulates collagen production and increases cell turnover. Gold standard for anti-aging.', strength: '0.025% - 0.1%', frequency: 'Nightly (start slow)' },
        { name: 'Peptides', description: 'Boosts collagen and elastin production. Supports skin firmness.', strength: 'Varies by product', frequency: 'Daily (AM/PM)' },
        { name: 'Vitamin C (L-Ascorbic Acid)', description: 'Antioxidant that protects from free radicals and brightens skin.', strength: '10% - 20%', frequency: 'Daily (AM)' },
        { name: 'Hyaluronic Acid', description: 'Hydrates and plumps skin, reducing appearance of fine lines.', strength: '0.5% - 2%', frequency: 'Daily (AM/PM)' },
        { name: 'Coenzyme Q10', description: 'Antioxidant that reduces free radical damage and supports collagen.', strength: 'Varies by product', frequency: 'Daily (AM/PM)' }
      ],
      products: [
        'SkinCeuticals C E Ferulic Serum',
        'The Ordinary Retinol 0.5% in Squalane',
        "Paula's Choice Resist Anti-Aging Serum",
        'La Roche-Posay Redermic C'
      ],
      tips: [
        'Wear SPF 50+ sunscreen every single day',
        'Start retinol slowly (2-3x per week initially)',
        'Use antioxidants in the morning',
        'Hydrate skin properly',
        'Get adequate sleep (7-8 hours)',
        'Stay hydrated and eat antioxidant-rich foods'
      ]
    }
  };

  const concernKeys = Object.keys(skinConcerns);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  const handleConcernSelect = (key) => {
    setSelectedConcern(key);
  };

  const getFilteredConcerns = () => {
    if (!searchTerm) return concernKeys;
    return concernKeys.filter(key => 
      skinConcerns[key].title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skinConcerns[key].description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const concern = skinConcerns[selectedConcern];
  const accentColor = userRole === 'dermatologist' ? '#6c63d9' : '#0d9488';

  return (
    <div className={`professional-page role-${userRole}`}>
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">{userRole === 'dermatologist' ? 'SKIN CONDITIONS GUIDE' : 'SKIN CONCERNS GUIDE'}</div>
            <h1 className="professional-title">{pageTitle}</h1>
            <p className="professional-subtitle">{pageSubtitle}</p>
          </div>
          <input
            type="text"
            placeholder={`Search ${userRole === 'dermatologist' ? 'conditions' : 'concerns'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', width: '200px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          <div className="professional-surface" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
              {sectionTitle}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {getFilteredConcerns().map((key) => {
                const c = skinConcerns[key];
                const isActive = selectedConcern === key;
                return (
                  <button
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      backgroundColor: isActive ? (userRole === 'dermatologist' ? '#EEECFF' : '#E4F7F4') : 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      color: isActive ? accentColor : '#778198',
                      fontWeight: isActive ? '600' : '400',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleConcernSelect(key)}
                  >
                    <span style={{ fontSize: '18px' }}>{c.icon}</span>
                    <span>{c.title}</span>
                  </button>
                );
              })}
              {getFilteredConcerns().length === 0 && (
                <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>
                  No {userRole === 'dermatologist' ? 'conditions' : 'concerns'} found matching "{searchTerm}"
                </p>
              )}
            </div>
          </div>

          <div>
            {concern && (
              <>
                <div className="professional-surface">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '40px' }}>{concern.icon}</span>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#17233C', margin: 0 }}>{concern.title}</h2>
                      <p style={{ fontSize: '14px', color: '#778198', marginTop: '4px' }}>{concern.description}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="professional-surface">
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#17233C', marginTop: 0, marginBottom: '12px' }}>🔍 Causes</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {concern.causes.map((cause, i) => (
                        <li key={i} style={{ padding: '6px 0', fontSize: '13px', color: '#34415B', borderBottom: '1px solid #F0F2F6' }}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="professional-surface">
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#17233C', marginTop: 0, marginBottom: '12px' }}>🩺 Symptoms</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {concern.symptoms.map((symptom, i) => (
                        <li key={i} style={{ padding: '6px 0', fontSize: '13px', color: '#34415B', borderBottom: '1px solid #F0F2F6' }}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="professional-surface">
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#17233C', marginTop: 0, marginBottom: '12px' }}>💊 Recommended Treatments</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {concern.treatments.map((treatment, i) => (
                      <div key={i} style={{ backgroundColor: '#F5F7FB', padding: '14px', borderRadius: '12px', border: '1px solid #E7EAF1' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#17233C' }}>{treatment.name}</div>
                        <div style={{ fontSize: '13px', color: '#778198', marginTop: '4px' }}>{treatment.description}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', backgroundColor: '#E7EAF1', padding: '2px 10px', borderRadius: '12px', color: '#34415B' }}>💪 {treatment.strength}</span>
                          <span style={{ fontSize: '11px', backgroundColor: '#E7EAF1', padding: '2px 10px', borderRadius: '12px', color: '#34415B' }}>📅 {treatment.frequency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="professional-surface">
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#17233C', marginTop: 0, marginBottom: '12px' }}>🛍️ Recommended Products</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {concern.products.map((product, i) => (
                        <li key={i} style={{ padding: '6px 0', fontSize: '13px', color: '#34415B', borderBottom: '1px solid #F0F2F6' }}>✓ {product}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="professional-surface">
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#17233C', marginTop: 0, marginBottom: '12px' }}>💡 Tips</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {concern.tips.map((tip, i) => (
                        <li key={i} style={{ padding: '6px 0', fontSize: '13px', color: '#34415B', borderBottom: '1px solid #F0F2F6' }}>✓ {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ConsultantSkinConcernsGuide;