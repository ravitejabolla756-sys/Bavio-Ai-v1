require('dotenv').config();
const axios = require('axios');

async function test() {
  const DODO_API_KEY = process.env.DODO_API_KEY;
  const DEMO_PRODUCT_ID = process.env.DODO_DEMO_PRODUCT_ID || 'pdt_0Nl1J57f2MHnLBxSbFHNO';
  const isLive = process.env.DODO_ENV === 'live' || (process.env.NODE_ENV === 'production' && process.env.DODO_ENV !== 'test');
  const DODO_BASE_URL = isLive ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
  
  console.log('Testing Dodo Payments Connection...');
  console.log('DODO_API_KEY:', DODO_API_KEY ? DODO_API_KEY.substring(0, 10) + '...' : 'MISSING');
  console.log('isLive:', isLive);
  console.log('DODO_BASE_URL:', DODO_BASE_URL);
  console.log('DEMO_PRODUCT_ID:', DEMO_PRODUCT_ID);

  try {
    const response = await axios.post(
      `${DODO_BASE_URL}/checkouts`,
      {
        product_cart: [
          {
            product_id: DEMO_PRODUCT_ID,
            quantity: 1
          }
        ],
        customer: {
          email: 'test-demo@bavio.in'
        },
        billing_address: {
          country: 'US'
        },
        metadata: {
          demo_session_id: 'test_session_id',
          is_public_demo: 'true',
          industry: 'REAL_ESTATE',
          language: 'en'
        },
        return_url: 'https://bavio.in/workspace/demo'
      },
      {
        headers: {
          Authorization: `Bearer ${DODO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ SUCCESS! Checkout URL:', response.data.checkout_url);
    console.log('Checkout ID:', response.data.id);
  } catch (err) {
    console.error('❌ FAILED!');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error Message:', err.message);
    }
  }
}

test();
