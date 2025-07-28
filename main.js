const { ethers } = require('ethers');
const config = require('./config.js');

// Contract ABIs for wrapping/unwrapping operations
const WRAP_ABI = '0xd0e30db0'; // deposit() function
const UNWRAP_ABI = '0x2e1a7d4d'; // withdraw(uint256 amount) function

class PlumeWrapper {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.plumeWrapperContract,
      [
        'function deposit() payable',
        'function withdraw(uint256 amount)',
        'function balanceOf(address owner) view returns (uint256)'
      ],
      this.wallet
    );
    
    this.isRunning = false;
    this.operationCount = 0;
    this.lastGasPrice = null;
    this.lastGasUpdate = 0;
    this.gasUpdateInterval = 5 * 60 * 1000; // Update gas price every 5 minutes
  }

  // Fetch current gas price from blockchain
  async getDynamicGasPrice() {
    try {
      const now = Date.now();
      
      // Use cached gas price if it's recent enough
      if (this.lastGasPrice && (now - this.lastGasUpdate) < this.gasUpdateInterval) {
        return this.lastGasPrice;
      }

      console.log('⛽ Fetching current gas price from blockchain...');
      
      // Get current fee data from network
      const feeData = await this.provider.getFeeData();
      
      let priorityFee = feeData.maxPriorityFeePerGas;
      let maxFee = feeData.maxFeePerGas;
      
      // If network doesn't support EIP-1559, use gas price
      if (!priorityFee || !maxFee) {
        const gasPrice = feeData.gasPrice;
        if (gasPrice) {
          priorityFee = gasPrice;
          maxFee = gasPrice;
        } else {
          throw new Error('Unable to get gas price from network');
        }
      }
      
      // Ensure maxFee is at least 1.5x the base fee for safety
      const baseFee = feeData.lastBaseFeePerGas;
      if (baseFee) {
        const minMaxFee = baseFee * BigInt(150) / BigInt(100); // 1.5x base fee
        if (maxFee < minMaxFee) {
          maxFee = minMaxFee;
        }
      }
      
      // Apply safety multiplier
      priorityFee = priorityFee * BigInt(Math.floor(config.gasMultiplier * 100)) / BigInt(100);
      maxFee = maxFee * BigInt(Math.floor(config.gasMultiplier * 100)) / BigInt(100);
      
      // Apply min/max limits
      const minGasPrice = ethers.parseUnits(config.minGasPriceGwei.toString(), 'gwei');
      const maxGasPrice = ethers.parseUnits(config.maxGasPriceGwei.toString(), 'gwei');
      
      if (priorityFee < minGasPrice) priorityFee = minGasPrice;
      if (priorityFee > maxGasPrice) priorityFee = maxGasPrice;
      if (maxFee < minGasPrice) maxFee = minGasPrice;
      if (maxFee > maxGasPrice) maxFee = maxGasPrice;
      
      // Cache the gas price
      this.lastGasPrice = { priorityFee, maxFee };
      this.lastGasUpdate = now;
      
      const priorityFeeGwei = ethers.formatUnits(priorityFee, 'gwei');
      const maxFeeGwei = ethers.formatUnits(maxFee, 'gwei');
      
      console.log(`⛽ Gas price updated - Priority: ${priorityFeeGwei} Gwei, Max: ${maxFeeGwei} Gwei`);
      
      return { priorityFee, maxFee };
    } catch (error) {
      console.error('❌ Error fetching gas price:', error.message);
      
      // Try alternative gas estimation method
      try {
        console.log('🔄 Trying alternative gas estimation...');
        
        // Get the latest block to estimate gas
        const latestBlock = await this.provider.getBlock('latest');
        if (latestBlock && latestBlock.baseFeePerGas) {
          const baseFee = latestBlock.baseFeePerGas;
          const priorityFee = baseFee * BigInt(20) / BigInt(100); // 20% of base fee
          const maxFee = baseFee * BigInt(150) / BigInt(100); // 150% of base fee
          
          this.lastGasPrice = { priorityFee, maxFee };
          this.lastGasUpdate = Date.now();
          
          const priorityFeeGwei = ethers.formatUnits(priorityFee, 'gwei');
          const maxFeeGwei = ethers.formatUnits(maxFee, 'gwei');
          
          console.log(`⛽ Alternative gas estimation - Priority: ${priorityFeeGwei} Gwei, Max: ${maxFeeGwei} Gwei`);
          
          return { priorityFee, maxFee };
        }
      } catch (altError) {
        console.error('❌ Alternative gas estimation also failed:', altError.message);
      }
      
      // Final fallback to config values
      const fallbackPriorityFee = ethers.parseUnits(config.maxPriorityFeeGwei.toString(), 'gwei');
      const fallbackMaxFee = ethers.parseUnits(config.maxFeeGwei.toString(), 'gwei');
      
      console.log(`⚠️ Using fallback gas prices - Priority: ${config.maxPriorityFeeGwei} Gwei, Max: ${config.maxFeeGwei} Gwei`);
      
      return { priorityFee: fallbackPriorityFee, maxFee: fallbackMaxFee };
    }
  }

  // Generate random amount between min and max
  getRandomAmount() {
    const min = config.minAmountPlume;
    const max = config.maxAmountPlume;
    return Math.random() * (max - min) + min;
  }

  // Generate random interval between min and max minutes
  getRandomInterval() {
    const min = config.minIntervalMinutes;
    const max = config.maxIntervalMinutes;
    return (Math.random() * (max - min) + min) * 60 * 1000; // Convert to milliseconds
  }

  // Convert PLUME amount to Wei (assuming 18 decimals)
  plumeToWei(plumeAmount) {
    return ethers.parseEther(plumeAmount.toString());
  }

  // Convert Wei to PLUME amount
  weiToPlume(weiAmount) {
    return ethers.formatEther(weiAmount);
  }

  // Get current balance of wPLUME
  async getWPlumeBalance() {
    try {
      const balance = await this.contract.balanceOf(this.wallet.address);
      return this.weiToPlume(balance);
    } catch (error) {
      console.error('Error getting wPLUME balance:', error.message);
      return 0;
    }
  }

  // Wrap PLUME to wPLUME
  async wrapPlume(amount) {
    try {
      console.log(`\n🔄 Wrapping ${amount} PLUME to wPLUME...`);
      
      const amountWei = this.plumeToWei(amount);
      const gasPrice = await this.getDynamicGasPrice();
      
      const tx = await this.contract.deposit({
        value: amountWei,
        gasLimit: config.gasLimit,
        maxPriorityFeePerGas: gasPrice.priorityFee,
        maxFeePerGas: gasPrice.maxFee
      });

      console.log(`📝 Transaction hash: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log(`✅ Wrap successful! Block: ${receipt.blockNumber}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Wrap failed: ${error.message}`);
      return false;
    }
  }

  // Unwrap wPLUME to PLUME
  async unwrapPlume(amount) {
    try {
      console.log(`\n🔄 Unwrapping ${amount} wPLUME to PLUME...`);
      
      const amountWei = this.plumeToWei(amount);
      const gasPrice = await this.getDynamicGasPrice();
      
      const tx = await this.contract.withdraw(amountWei, {
        gasLimit: config.gasLimit,
        maxPriorityFeePerGas: gasPrice.priorityFee,
        maxFeePerGas: gasPrice.maxFee
      });

      console.log(`📝 Transaction hash: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log(`✅ Unwrap successful! Block: ${receipt.blockNumber}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Unwrap failed: ${error.message}`);
      return false;
    }
  }

  // Perform random operation (wrap or unwrap)
  async performRandomOperation() {
    this.operationCount++;
    const isWrap = Math.random() < 0.5; // 50% chance for wrap/unwrap
    const amount = this.getRandomAmount();

    console.log(`\n🎲 Operation #${this.operationCount}`);
    console.log(`📊 Type: ${isWrap ? 'WRAP' : 'UNWRAP'}`);
    console.log(`💰 Amount: ${amount} ${isWrap ? 'PLUME' : 'wPLUME'}`);

    let success = false;
    if (isWrap) {
      success = await this.wrapPlume(amount);
    } else {
      success = await this.unwrapPlume(amount);
    }

    if (success) {
      const balance = await this.getWPlumeBalance();
      console.log(`💼 Current wPLUME balance: ${balance}`);
    }

    return success;
  }

  // Main loop for random operations
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Bot is already running!');
      return;
    }

    console.log('🚀 Starting PLUME wrapper bot...');
    console.log(`📋 Configuration:`);
    console.log(`   - Amount range: ${config.minAmountPlume} - ${config.maxAmountPlume} PLUME`);
    console.log(`   - Interval range: ${config.minIntervalMinutes} - ${config.maxIntervalMinutes} minutes`);
    console.log(`   - Contract: ${config.plumeWrapperContract}`);
    console.log(`   - Wallet: ${this.wallet.address}`);
    console.log(`   - Gas settings: Dynamic (fetched from blockchain)`);
    
    this.isRunning = true;

    while (this.isRunning) {
      try {
        await this.performRandomOperation();
        
        const nextInterval = this.getRandomInterval();
        const nextIntervalMinutes = (nextInterval / 1000 / 60).toFixed(1);
        
        console.log(`\n⏰ Next operation in ${nextIntervalMinutes} minutes...`);
        console.log(`🕐 Current time: ${new Date().toLocaleString()}`);
        
        await new Promise(resolve => setTimeout(resolve, nextInterval));
        
      } catch (error) {
        console.error(`❌ Error in main loop: ${error.message}`);
        console.log('🔄 Retrying in 5 minutes...');
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      }
    }
  }

  // Stop the bot
  stop() {
    console.log('🛑 Stopping PLUME wrapper bot...');
    this.isRunning = false;
  }

  // Get bot status
  getStatus() {
    return {
      isRunning: this.isRunning,
      operationCount: this.operationCount,
      walletAddress: this.wallet.address,
      contractAddress: config.plumeWrapperContract,
      lastGasPrice: this.lastGasPrice,
      lastGasUpdate: this.lastGasUpdate
    };
  }
}

// CLI interface
async function main() {
  const wrapper = new PlumeWrapper();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    wrapper.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    wrapper.stop();
    process.exit(0);
  });

  try {
    // Check if wallet is configured
    if (config.privateKey === 'your_private_key_here') {
      console.error('❌ Please configure your private key in config.js');
      console.error('📝 Copy config.example.js to config.js and update the values');
      process.exit(1);
    }

    if (config.rpcUrl === 'https://plume-rpc-url-here') {
      console.error('❌ Please configure your RPC URL in config.js');
      console.error('📝 Copy config.example.js to config.js and update the values');
      process.exit(1);
    }

    // Test connection and gas fetching
    console.log('🔗 Testing connection to Plume mainnet...');
    const blockNumber = await wrapper.provider.getBlockNumber();
    console.log(`✅ Connected! Current block: ${blockNumber}`);
    
    // Test gas price fetching
    console.log('⛽ Testing gas price fetching...');
    const gasPrice = await wrapper.getDynamicGasPrice();
    const priorityFeeGwei = ethers.formatUnits(gasPrice.priorityFee, 'gwei');
    const maxFeeGwei = ethers.formatUnits(gasPrice.maxFee, 'gwei');
    console.log(`✅ Gas price test successful - Priority: ${priorityFeeGwei} Gwei, Max: ${maxFeeGwei} Gwei`);

    // Start the bot
    await wrapper.start();
    
  } catch (error) {
    console.error(`❌ Failed to start bot: ${error.message}`);
    process.exit(1);
  }
}

// Run the bot if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PlumeWrapper;
