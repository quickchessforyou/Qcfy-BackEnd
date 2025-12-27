import { createClient } from 'redis';

async function testRedis() {
  console.log('🧪 Testing Redis connection...');
  
  const client = createClient({
    socket: {
      host: 'localhost',
      port: 6379,
      connectTimeout: 5000
    }
  });

  client.on('error', (err) => {
    console.error('❌ Redis Error:', err.message);
  });

  try {
    await client.connect();
    console.log('✅ Redis connected successfully!');
    
    // Test basic operations
    await client.set('test', 'Hello Redis!');
    const value = await client.get('test');
    console.log('📝 Test value:', value);
    
    await client.del('test');
    console.log('🧹 Test cleanup complete');
    
    await client.disconnect();
    console.log('👋 Redis disconnected');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Run: docker run -d --name redis-chess -p 6379:6379 redis:latest');
    console.log('2. Or install Redis natively for Windows');
    console.log('3. Or use WSL: sudo service redis-server start');
  }
}

testRedis();