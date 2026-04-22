// Hitech City / Madhapur, Hyderabad
export const HEATMAP_REGIONS = [
  // Green (Safe)
  { id: '1', lat: 17.4345, lng: 78.3861, type: 'safe', radius: 400 }, // Inorbit Mall area
  { id: '2', lat: 17.4491, lng: 78.3846, type: 'safe', radius: 300 }, // Mindspace IT Park
  { id: '3', lat: 17.4435, lng: 78.3882, type: 'safe', radius: 250 }, // Image Garden Road

  // Amber (Caution)
  { id: '4', lat: 17.4485, lng: 78.3908, type: 'caution', radius: 200 }, // Madhapur Main Road
  { id: '5', lat: 17.4402, lng: 78.3963, type: 'caution', radius: 200 }, // Ayyappa Society

  // Red (Danger)
  { id: '6', lat: 17.4524, lng: 78.3751, type: 'danger', radius: 150 }, // Cyber Towers back roads
  { id: '7', lat: 17.4916, lng: 78.3920, type: 'danger', radius: 200 }, // JNTU flyover isolated stretches
];

export const MOCK_ALERTS = [
  {
    id: 'a1',
    type: 'harassment',
    title: 'Harassment reported',
    location: 'Near Cyber Towers B block gate',
    description: 'Verbal harassment reported near the main gate. Several witnesses confirmed.',
    distance: '0.3 km',
    timeAgo: '11m ago',
    upvotes: 14,
    severity: 'high',
  },
  {
    id: 'a2',
    type: 'poor-lighting',
    title: 'Poor lighting',
    location: 'Underpass near Hitech City Metro Station',
    description: 'Street lights are off on the entire stretch near the underpass.',
    distance: '0.7 km',
    timeAgo: '28m ago',
    upvotes: 9,
    severity: 'medium',
  },
  {
    id: 'a3',
    type: 'suspicious',
    title: 'Suspicious activity',
    location: 'Madhapur Main Road, near petrol pump',
    description: 'Group of people standing in dark area near pump. Felt unsafe while walking.',
    distance: '1.2 km',
    timeAgo: '1h ago',
    upvotes: 31,
    severity: 'high',
  },
  {
    id: 'a4',
    type: 'road',
    title: 'Unsafe footpath',
    location: 'Road adjoining construction site, near DLF',
    description: 'Broken footpath and no lighting. Risky for pedestrians at night.',
    distance: '1.9 km',
    timeAgo: '3h ago',
    upvotes: 7,
    severity: 'medium',
  },
];

export const TRUSTED_CONTACTS = [
  { id: 'c1', name: 'Priya', initial: 'P' },
  { id: 'c2', name: 'Nisha', initial: 'N' },
  { id: 'c3', name: 'Mom', initial: 'M' },
];
