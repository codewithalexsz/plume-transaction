const { ethers } = require('ethers');
const config = require('./config.js');

async function testConnection() {
  try {
    console.log('🧪 Testing PLUME wrapper bot connection...\n');
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    
    console.log(`📋 Configuration:`);
    console.log(`   - RPC URL: ${config.rpcUrl}`);
    console.log(`   - Contract: ${config.plumeWrapperContract}`);
    console.log(`   - Wallet: ${wallet.address}`);
    
    // Test connection
    console.log('\n🔗 Testing network connection...');
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Connected! Current block: ${blockNumber}`);
    
    // Test gas price fetching
    console.log('\n⛽ Testing gas price fetching...');
    try {
      const feeData = await provider.getFeeData();
      console.log('✅ Fee data available:');
      if (feeData.lastBaseFeePerGas) {
        const baseFeeGwei = ethers.formatUnits(feeData.lastBaseFeePerGas, 'gwei');
        console.log(`   - Base fee: ${baseFeeGwei} Gwei`);
      }
      if (feeData.maxPriorityFeePerGas) {
        const priorityFeeGwei = ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei');
        console.log(`   - Max priority fee: ${priorityFeeGwei} Gwei`);
      }
      if (feeData.maxFeePerGas) {
        const maxFeeGwei = ethers.formatUnits(feeData.maxFeePerGas, 'gwei');
        console.log(`   - Max fee: ${maxFeeGwei} Gwei`);
      }
      if (feeData.gasPrice) {
        const gasPriceGwei = ethers.formatUnits(feeData.gasPrice, 'gwei');
        console.log(`   - Gas price: ${gasPriceGwei} Gwei`);
      }
    } catch (error) {
      console.error(`❌ Gas price test failed: ${error.message}`);
    }
    
    // Test contract interaction
    console.log('\n📜 Testing contract interaction...');
    const contract = new ethers.Contract(
      config.plumeWrapperContract,
      [
        'function balanceOf(address owner) view returns (uint256)',
        'function totalSupply() view returns (uint256)'
      ],
      wallet
    );
    
    // Get wallet balance
    const balance = await contract.balanceOf(wallet.address);
    const balanceFormatted = ethers.formatEther(balance);
    console.log(`💼 Your wPLUME balance: ${balanceFormatted}`);
    
    // Get total supply
    const totalSupply = await contract.totalSupply();
    const totalSupplyFormatted = ethers.formatEther(totalSupply);
    console.log(`📊 Total wPLUME supply: ${totalSupplyFormatted}`);
    
    // Get native token balance
    const nativeBalance = await provider.getBalance(wallet.address);
    const nativeBalanceFormatted = ethers.formatEther(nativeBalance);
    console.log(`💰 Native token balance: ${nativeBalanceFormatted}`);
    
    console.log('\n✅ All tests passed! Bot is ready to run.');
    console.log('\n📝 Next steps:');
    console.log('   1. Copy config.example.js to config.js');
    console.log('   2. Update config.js with your settings');
    console.log('   3. Update main.js to import config.js');
    console.log('   4. Run: node main.js');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check your RPC URL');
    console.log('   - Verify your private key');
    console.log('   - Ensure you have network connectivity');
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testConnection().catch(console.error);
}

module.exports = { testConnection }; 
