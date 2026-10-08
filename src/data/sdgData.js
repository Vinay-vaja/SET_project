// SDG Data — SDG 7 and related goals reference data
export const SDG_GOALS = [
  {
    id: 7,
    name: 'Affordable and Clean Energy',
    color: '#FFC107',
    icon: '⚡',
    description: 'Ensure access to affordable, reliable, sustainable and modern energy for all.',
    targets: [
      '7.1 Universal access to modern energy services',
      '7.2 Increase share of renewable energy',
      '7.3 Double global rate of energy efficiency improvement',
    ],
    metrics: ['Renewable share', 'Energy access', 'Energy efficiency', 'Affordability'],
    weight: 0.40,
  },
  {
    id: 9,
    name: 'Industry, Innovation and Infrastructure',
    color: '#FF6D00',
    icon: '🏗️',
    description: 'Build resilient infrastructure, promote inclusive and sustainable industrialization.',
    targets: [
      '9.4 Upgrade industries to adopt clean technologies',
      '9.a Facilitate sustainable infrastructure development',
    ],
    metrics: ['Clean technology adoption', 'Infrastructure resilience'],
    weight: 0.20,
  },
  {
    id: 11,
    name: 'Sustainable Cities and Communities',
    color: '#FF8F00',
    icon: '🏙️',
    description: 'Make cities inclusive, safe, resilient and sustainable.',
    targets: [
      '11.6 Reduce environmental impact of cities',
      '11.b Implement integrated policies for resource efficiency',
    ],
    metrics: ['Urban energy efficiency', 'Sustainable transport', 'Waste management'],
    weight: 0.15,
  },
  {
    id: 12,
    name: 'Responsible Consumption and Production',
    color: '#BF8600',
    icon: '♻️',
    description: 'Ensure sustainable consumption and production patterns.',
    targets: [
      '12.2 Sustainable management of natural resources',
      '12.5 Reduce waste generation',
    ],
    metrics: ['Resource efficiency', 'Waste reduction', 'Energy intensity'],
    weight: 0.15,
  },
  {
    id: 13,
    name: 'Climate Action',
    color: '#1B5E20',
    icon: '🌍',
    description: 'Take urgent action to combat climate change and its impacts.',
    targets: [
      '13.2 Integrate climate change measures into policies',
      '13.3 Improve education on climate change mitigation',
    ],
    metrics: ['CO₂ avoided', 'Emissions reduction', 'Climate resilience'],
    weight: 0.10,
  },
];

export const SDG7_SUB_METRICS = [
  { id: 'affordable', label: 'Affordable Energy', maxScore: 25, description: 'Cost savings vs grid-only scenario' },
  { id: 'clean', label: 'Clean Energy', maxScore: 25, description: 'CO₂ avoided and emissions reduction' },
  { id: 'efficiency', label: 'Energy Efficiency', maxScore: 25, description: 'Optimal use of energy resources' },
  { id: 'renewable', label: 'Renewable Adoption', maxScore: 25, description: 'Share of renewables in total generation' },
];

export const IMPACT_THRESHOLDS = {
  renewableShare: { excellent: 80, good: 60, fair: 40, poor: 0 },
  gridDependency: { excellent: 10, good: 25, fair: 50, poor: 100 },
  co2Avoided: { excellent: 50, good: 30, fair: 15, poor: 0 },
  costSaving: { excellent: 40, good: 25, fair: 10, poor: 0 },
};
