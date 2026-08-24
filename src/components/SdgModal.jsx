import React from 'react'

export default function SdgModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const sdgs = [
    {
      number: 7,
      title: 'Affordable & Clean Energy',
      targets: 'Target 7.2 & 7.3',
      color: '#e5ad23',
      icon: '⚡',
      headline: '+10% to +18% Solar Harvest Recovery',
      description:
        'Recovers lost generation without deploying any new physical hardware, directly increasing the generation efficiency, lifetime output, and ROI of distributed photovoltaic installations.',
    },
    {
      number: 6,
      title: 'Clean Water & Sanitation',
      targets: 'Target 6.4',
      color: '#27b2d5',
      icon: '💧',
      headline: 'Zero Water Waste on Arbitrary Washes',
      description:
        'Eliminates blind calendar-based panel cleanings in arid regions (e.g. Rajasthan, Tamil Nadu) by syncing with 72-hour precipitation forecasts and scheduling washes strictly when economically optimal.',
    },
    {
      number: 9,
      title: 'Industry, Innovation & Infrastructure',
      targets: 'Target 9.4',
      color: '#e7672e',
      icon: '🏭',
      headline: 'Zero-CAPEX Virtual Sensing Intelligence',
      description:
        'Upgrades distributed solar grid assets through pure software virtual sensing, bringing utility-grade predictive maintenance to small commercial and residential rooftops with zero added manufacturing footprint.',
    },
    {
      number: 13,
      title: 'Climate Action',
      targets: 'Target 13.2',
      color: '#3e7e43',
      icon: '🌍',
      headline: 'Maximized Peak Clean Electricity Yield',
      description:
        'Maximizing daytime solar yield directly prevents electric grids from firing up fossil-fuel peaker plants during high-demand daytime peak hours, lowering carbon intensity.',
    },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-badge">KRXGEN'26</span>
            <h2 className="modal-heading">UN Sustainable Development Goals (SDGs) Alignment</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <p className="modal-intro">
          HelioSense connects advanced physics-informed software engineering directly with measurable global environmental and economic sustainability targets.
        </p>

        <div className="sdg-grid">
          {sdgs.map((sdg) => (
            <div key={sdg.number} className="sdg-card" style={{ borderColor: `${sdg.color}55` }}>
              <div className="sdg-top" style={{ background: `${sdg.color}22` }}>
                <span className="sdg-pill" style={{ background: sdg.color }}>SDG {sdg.number}</span>
                <span className="sdg-icon">{sdg.icon}</span>
              </div>
              <div className="sdg-body">
                <h4 className="sdg-card-title">{sdg.title}</h4>
                <span className="sdg-target-tag">{sdg.targets}</span>
                <div className="sdg-headline" style={{ color: sdg.color }}>
                  {sdg.headline}
                </div>
                <p className="sdg-desc">{sdg.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <div className="modal-impact-stats">
            <div className="stat-pill">
              <strong>₹0</strong> Added Hardware Cost
            </div>
            <div className="stat-pill">
              <strong>100%</strong> Pure Software / Zero Carbon Footprint
            </div>
            <div className="stat-pill">
              <strong>~450 L</strong> Water Saved Per Clean Avoided
            </div>
          </div>
          <button className="modal-done-btn" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  )
}
