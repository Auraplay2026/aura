export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  pointsReward: number;
  category: 'casino' | 'sports' | 'predictions' | 'vip' | 'special';
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_spin',
    title: 'First Spin',
    description: 'Play your first casino game',
    icon: '🎰',
    xpReward: 100,
    pointsReward: 50,
    category: 'casino'
  },
  {
    id: 'hot_streak',
    title: 'Hot Streak',
    description: 'Win 5 games in a row',
    icon: '🔥',
    xpReward: 300,
    pointsReward: 150,
    category: 'special'
  },
  {
    id: 'high_roller',
    title: 'High Roller',
    description: 'Place a single bet over ₹10,000',
    icon: '💰',
    xpReward: 500,
    pointsReward: 250,
    category: 'special'
  },
  {
    id: 'tournament_victor',
    title: 'Tournament Victor',
    description: 'Claim a tournament reward',
    icon: '🏆',
    xpReward: 1000,
    pointsReward: 500,
    category: 'special'
  },
  {
    id: 'diamond_hands',
    title: 'Diamond Hands',
    description: 'Hold a prediction position for 24+ hours',
    icon: '📈',
    xpReward: 400,
    pointsReward: 200,
    category: 'predictions'
  },
  {
    id: 'sharpshooter',
    title: 'Sharpshooter',
    description: 'Win 3 predictions in a row',
    icon: '🎯',
    xpReward: 350,
    pointsReward: 175,
    category: 'predictions'
  },
  {
    id: 'vip_ascension',
    title: 'VIP Ascension',
    description: 'Reach VIP Silver tier or higher',
    icon: '👑',
    xpReward: 600,
    pointsReward: 300,
    category: 'vip'
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Place a bet between 12:00 AM and 5:00 AM',
    icon: '🌙',
    xpReward: 150,
    pointsReward: 75,
    category: 'special'
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Place 10 wagers in under 2 minutes',
    icon: '⚡',
    xpReward: 250,
    pointsReward: 125,
    category: 'special'
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Visit 5 different sections of the platform',
    icon: '🎪',
    xpReward: 200,
    pointsReward: 100,
    category: 'special'
  },
  {
    id: 'jackpot_hunter',
    title: 'Jackpot Hunter',
    description: 'Win 100x your wager in any casino game',
    icon: '🌟',
    xpReward: 800,
    pointsReward: 400,
    category: 'casino'
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Place 100 wagers total',
    icon: '🛡️',
    xpReward: 500,
    pointsReward: 250,
    category: 'special'
  },
  {
    id: 'big_spender',
    title: 'Big Spender',
    description: 'Wager a total of ₹1,00,000',
    icon: '💸',
    xpReward: 600,
    pointsReward: 300,
    category: 'special'
  },
  {
    id: 'steady_earner',
    title: 'Steady Earner',
    description: 'Claim daily rewards 5 days in a row',
    icon: '📅',
    xpReward: 300,
    pointsReward: 150,
    category: 'vip'
  },
  {
    id: 'lucky_break',
    title: 'Lucky Break',
    description: 'Win a casino game with under 10% chance',
    icon: '🍀',
    xpReward: 400,
    pointsReward: 200,
    category: 'casino'
  },
  {
    id: 'sports_fanatic',
    title: 'Sports Fanatic',
    description: 'Place 10 sports bets',
    icon: '⚽',
    xpReward: 200,
    pointsReward: 100,
    category: 'sports'
  },
  {
    id: 'underdog',
    title: 'Underdog',
    description: 'Win a bet with odds higher than 5.0',
    icon: '🐕',
    xpReward: 400,
    pointsReward: 200,
    category: 'sports'
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Play between 5:00 AM and 8:00 AM',
    icon: '☀️',
    xpReward: 150,
    pointsReward: 75,
    category: 'special'
  },
  {
    id: 'half_century',
    title: 'Half Century',
    description: 'Win ₹50,000 in a single payout',
    icon: '🏅',
    xpReward: 700,
    pointsReward: 350,
    category: 'special'
  },
  {
    id: 'risk_taker',
    title: 'Risk Taker',
    description: 'Place a wager with your entire account balance',
    icon: '💣',
    xpReward: 500,
    pointsReward: 250,
    category: 'special'
  },
  {
    id: 'wealthy_investor',
    title: 'Wealthy Investor',
    description: 'Have an account balance of ₹5,00,000+',
    icon: '💎',
    xpReward: 800,
    pointsReward: 400,
    category: 'vip'
  },
  {
    id: 'aura_legend',
    title: 'Aura Legend',
    description: 'Unlock 10 other achievements',
    icon: '👑',
    xpReward: 1500,
    pointsReward: 750,
    category: 'vip'
  }
];
