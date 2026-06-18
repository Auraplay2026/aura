import fs from 'fs';
import path from 'path';

export interface GameConfig {
  disabled: boolean;
  name: string;
}

export interface PaymentConfig {
  disabled: boolean;
  name: string;
}

export interface SystemConfig {
  houseEdge: number;
  games: Record<string, GameConfig>;
  paymentMethods: Record<string, PaymentConfig>;
  demoWinRate: number;
  realWinRate: number;
  strategyFrequency: number;
  maintenanceMode?: boolean;
}

const CONFIG_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'system_config.json');

const DEFAULT_CONFIG: SystemConfig = {
  houseEdge: 2.0,
  demoWinRate: 80,
  realWinRate: 30,
  strategyFrequency: 30,
  maintenanceMode: false,
  games: {
    dice: { disabled: false, name: "Dice" },
    mines: { disabled: false, name: "Mines" },
    plinko: { disabled: false, name: "Plinko" },
    limbo: { disabled: false, name: "Limbo" },
    crash: { disabled: false, name: "Crash" },
    keno: { disabled: false, name: "Keno" },
    coinflip: { disabled: false, name: "Coin Flip" },
    blackjack: { disabled: false, name: "Blackjack" }
  },
  paymentMethods: {
    upi: { disabled: false, name: "UPI Transfer" },
    bank: { disabled: false, name: "Direct Bank Transfer" },
    crypto: { disabled: false, name: "Crypto Transfer" }
  }
};

function initConfig() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  }
}

export function getSystemConfig(): SystemConfig {
  initConfig();
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read system config", err);
    return DEFAULT_CONFIG;
  }
}

export function saveSystemConfig(config: SystemConfig) {
  initConfig();
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to write system config", err);
  }
}
