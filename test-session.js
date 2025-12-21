async function testSessionDetection() {
  console.log('=== Session Detection Test ===');
  
  // Get current token
  const sessionData = localStorage.getItem('pos-session');
  if (!sessionData) {
    console.log('❌ Not logged in');
    return;
  }
  
  const session = JSON.parse(sessionData);
  console.log('✅ Current user:', session.username);
  console.log('📝 Token (first 30 chars):', session.token.substring(0, 30) + '...');
  
  // Validate session
  try {
    const response = await fetch('http://localhost:3000/api/auth/validate-session', {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
    });
    
    const result = await response.json();
    console.log('🔍 Session validation result:', result);
    
    if (result.valid) {
      console.log('✅ Session is VALID - this is the active browser');
    } else {
      console.log('❌ Session is INVALID - user logged in from another browser');
    }
  } catch (error) {
    console.error('❌ Validation error:', error);
  }
}

// Run the test
testSessionDetection();
