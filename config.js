module.exports = {
  // Plume Mainnet Configuration
  privateKey: '',
  rpcUrl: 'https://rpc.plume.org',
  
  // Contract Addresses
  plumeWrapperContract: '0xea237441c92cae6fc17caaf9a7acb3f953be4bd1',
  
  // Randomization Settings
  minAmountPlume: 1, // Minimum amount in PLUME
  maxAmountPlume: 5,   // Maximum amount in PLUME
  minIntervalMinutes: 1, // Minimum interval between operations
  maxIntervalMinutes: 2, // Maximum interval between operations
  
  // Gas Settings
  gasLimit: 300000,
  maxPriorityFeeGwei: 2,
  maxFeeGwei: 50
}; 
