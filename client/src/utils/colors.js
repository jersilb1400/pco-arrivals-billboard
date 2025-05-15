export const householdThemes = [
  { 
    color: '#2E77BB',      // Blue
    icon: '🏠'             // House
  },
  { 
    color: '#48BB78',      // Green
    icon: '🌟'             // Star
  },
  { 
    color: '#9F7AEA',      // Purple
    icon: '🌸'             // Flower
  },
  { 
    color: '#ED64A6',      // Pink
    icon: '🎨'             // Art palette
  },
  { 
    color: '#F6AD55',      // Orange
    icon: '🌞'             // Sun
  },
  { 
    color: '#4299E1',      // Light Blue
    icon: '🌊'             // Wave
  },
  { 
    color: '#48BB78',      // Green
    icon: '🌳'             // Tree
  },
  { 
    color: '#805AD5',      // Purple
    icon: '🎵'             // Music note
  }
];

export const getHouseholdTheme = (householdName) => {
  const hash = householdName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const index = Math.abs(hash) % householdThemes.length;
  return householdThemes[index];
}; 