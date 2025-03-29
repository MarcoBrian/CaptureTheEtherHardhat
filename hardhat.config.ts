import '@nomicfoundation/hardhat-toolbox';
import { config } from 'dotenv';
config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    compilers: [
      {
        version: '0.8.20',
      }
    ],
  },
};
