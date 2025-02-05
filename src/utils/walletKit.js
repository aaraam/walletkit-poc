// src/walletKit.js
import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';

const projectId = '59b8f4b8f8153ff97e652204f24f0442'; // Replace with your WalletConnect Project ID

const core = new Core({
  projectId,
});

const walletKit = await WalletKit.init({
  core,
  metadata: {
    name: 'WalletKit POC',
    description: 'WalletKit POC',
    url: '',
    icons: [],
  },
});

export default walletKit;
