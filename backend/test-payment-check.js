const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function test() {
  try {
    // Register user
    console.log('\n📝 Registering test user...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Payment Test',
      email: `test_${Date.now()}@local.dev`,
      password: 'Test@123456'
    });
    
    const token = registerRes.data.token;
    const user = registerRes.data.user;
    console.log('✅ Registered: ' + user.email);
    console.log('   Credits: ' + user.credits);
    
    // Initiate payment
    console.log('\n💳 Initiating payment...');
    const paymentRes = await axios.post(`${API_URL}/auth/demo-payment/initiate`, {
      planKey: 'starter_plus',
      paymentMethod: 'card',
      paymentDetails: { cardNumber: '4111111111111111' }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Payment initiated');
    console.log('   Status:', paymentRes.data.status);
    console.log('   OTP:', paymentRes.data.demoOtp);
    console.log('   Email sent:', paymentRes.data.debug?.emailSent);
    console.log('   Mode:', paymentRes.data.debug?.mode);
    
    if (paymentRes.data.emailDelivery?.previewUrl) {
      console.log('   Preview: ' + paymentRes.data.emailDelivery.previewUrl);
    }
    
  } catch (err) {
    console.error('\n❌ Error:', err.response?.data?.message || err.message);
  }
}

test();
