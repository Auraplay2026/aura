import fs from 'fs';
import path from 'path';

export interface BtcAddressConfig {
  id: string;
  label: string;
  address: string;
  qrImageUrl?: string;
  isActive: boolean;
}

export interface PaymentSettings {
  upiId: string;
  gpayId: string;
  phonepeId: string;
  whatsappNumber?: string;
  upiQrType: 'dynamic' | 'custom';
  upiQrImageUrl?: string;
  btcAddresses: BtcAddressConfig[];
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankHolderName: string;
}

const CONFIG_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'payment_settings.json');

const DEFAULT_SETTINGS: PaymentSettings = {
  upiId: "aurabet@okaxis",
  gpayId: "aurabet.gpay@okaxis",
  phonepeId: "aurabet.ybl@okaxis",
  whatsappNumber: "+16232822738",
  upiQrType: "dynamic",
  upiQrImageUrl: "",
  btcAddresses: [
    {
      id: "btc_1",
      label: "VIP High-Roller Safe",
      address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      isActive: true
    },
    {
      id: "btc_2",
      label: "Standard Escrow Wallet",
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      isActive: false
    }
  ],
  bankName: "State Bank of India",
  bankAccountNo: "999888777666",
  bankIfsc: "SBIN0001234",
  bankHolderName: "AuraBet Operations Pvt Ltd"
};

function initConfig() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
  }
}

export function getPaymentSettings(): PaymentSettings {
  initConfig();
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Auto-migrate if old structure is loaded
    if (!parsed.btcAddresses) {
      parsed.btcAddresses = [
        {
          id: "btc_1",
          label: "Escrow Storage",
          address: parsed.btcAddress || DEFAULT_SETTINGS.btcAddresses[0].address,
          isActive: true
        }
      ];
      delete parsed.btcAddress;
    }
    if (!parsed.upiQrType) {
      parsed.upiQrType = "dynamic";
      parsed.upiQrImageUrl = "";
    }
    return parsed;
  } catch (err) {
    console.error("Failed to read payment settings", err);
    return DEFAULT_SETTINGS;
  }
}

export function savePaymentSettings(settings: PaymentSettings) {
  initConfig();
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to write payment settings", err);
  }
}
