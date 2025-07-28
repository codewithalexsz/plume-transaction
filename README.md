# plume-transaction

# PLUME Wrapper Bot

A Node.js bot that automatically wraps and unwraps random amounts of PLUME tokens at random intervals on the Plume mainnet.

## Features

- 🔄 Random wrapping of PLUME to wPLUME
- 🔄 Random unwrapping of wPLUME to PLUME
- ⏰ Random intervals between operations (configurable)
- 💰 Random amounts for each operation (configurable)
- 🛡️ Proper error handling and retry logic
- 📊 Real-time balance tracking
- 🎯 Gas optimization with EIP-1559

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure the Bot

Copy the configuration file and update it with your settings:

```bash
nano config.js
```

Edit `config.js` with your settings:

```javascript
module.exports = {
  // Your private key (without 0x prefix)
  privateKey: 'your_private_key_here',
  
  // Plume mainnet RPC URL
  rpcUrl: 'https://your-plume-rpc-url.com',
  
  // Contract address
  plumeWrapperContract: '0xea237441c92cae6fc17caaf9a7acb3f953be4bd1',
  
  // Randomization settings
  minAmountPlume: 0.1,    // Minimum amount in PLUME
  maxAmountPlume: 10,      // Maximum amount in PLUME
  minIntervalMinutes: 5,   // Minimum interval between operations
  maxIntervalMinutes: 60,  // Maximum interval between operations
  
  // Gas settings
  gasLimit: 300000,
  maxPriorityFeeGwei: 2,
  maxFeeGwei: 50
};
```


## Usage

### Test the Bot

```bash
node test
```

Or run directly:

```bash
node main.js
```

### Bot Behavior

The bot will:

1. **Randomly choose** between wrapping and unwrapping (50/50 chance)
2. **Generate random amounts** between your configured min/max values
3. **Wait random intervals** between operations
4. **Display real-time logs** of all operations
5. **Handle errors gracefully** with automatic retries

### Example Output

```
🚀 Starting PLUME wrapper bot...
📋 Configuration:
   - Amount range: 0.1 - 10 PLUME
   - Interval range: 5 - 60 minutes
   - Contract: 0xea237441c92cae6fc17caaf9a7acb3f953be4bd1
   - Wallet: 0x1234...

🎲 Operation #1
📊 Type: WRAP
💰 Amount: 2.5 PLUME

🔄 Wrapping 2.5 PLUME to wPLUME...
📝 Transaction hash: 0xabc123...
⏳ Waiting for confirmation...
✅ Wrap successful! Block: 12345
💼 Current wPLUME balance: 15.5

⏰ Next operation in 23.4 minutes...
🕐 Current time: 12/25/2023, 2:30:15 PM
```

### Stop the Bot

Press `Ctrl+C` to gracefully stop the bot.

## Configuration Options

### Amount Settings
- `minAmountPlume`: Minimum amount to wrap/unwrap (in PLUME)
- `maxAmountPlume`: Maximum amount to wrap/unwrap (in PLUME)

### Interval Settings
- `minIntervalMinutes`: Minimum time between operations (in minutes)
- `maxIntervalMinutes`: Maximum time between operations (in minutes)

### Gas Settings
- `gasLimit`: Maximum gas limit for transactions
- `maxPriorityFeeGwei`: Maximum priority fee in Gwei
- `maxFeeGwei`: Maximum total fee in Gwei

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never share your private key** - Keep it secure and never commit it to version control
2. **Use a dedicated wallet** - Don't use your main wallet for bot operations
3. **Monitor gas prices** - Adjust gas settings based on network conditions
4. **Test with small amounts** - Start with small amounts to test the bot
5. **Monitor the bot** - Regularly check the bot's operation logs

## Troubleshooting

### Common Issues

1. **"Invalid private key"**
   - Ensure your private key is correct and doesn't include the `0x` prefix

2. **"Network error"**
   - Check your RPC URL and ensure it's accessible
   - Verify you're connected to Plume mainnet

3. **"Insufficient funds"**
   - Ensure your wallet has enough PLUME for wrapping
   - Ensure your wallet has enough wPLUME for unwrapping
   - Ensure you have enough native tokens for gas fees

4. **"Transaction failed"**
   - Check gas settings and adjust if needed
   - Verify contract address is correct
   - Check network congestion

### Debug Mode

To enable more detailed logging, you can modify the main.js file to include additional console.log statements for debugging.

## License

MIT License - See LICENSE file for details.

## Disclaimer

This bot is for educational purposes. Use at your own risk. The authors are not responsible for any financial losses incurred while using this bot. Always test with small amounts first and monitor the bot's operation carefully. 
