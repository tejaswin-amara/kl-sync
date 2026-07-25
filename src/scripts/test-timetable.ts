async function run() {
  console.log('Logging in to local Next.js api...');
  const loginRes = await fetch('https://klhb.vercel.app/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '2500030018', password: 'AmmaNanna123$' })
  });
  
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('Login failed', loginData);
    return;
  }
  
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Got cookie:', cookie ? cookie.split(';')[0] : 'none');
  
  console.log('Fetching timetable...');
  const res = await fetch('https://klhb.vercel.app/api/erp-proxy/timetable', {
    headers: {
      'Cookie': cookie || ''
    }
  });
  
  const resData = await res.json();
  console.log('Raw output:');
  console.dir(resData, { depth: null });
}

run().catch(console.error);
