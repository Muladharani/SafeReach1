const test = async () => {
  const baseUrl = 'http://localhost:5000';
  
  // POST an alert
  console.log('=== TEST CREATE ===');
  const res1 = await fetch(baseUrl + '/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'flood',
      severity: 'high',
      title: 'Test Flood Alert',
      message: 'This is a real database test alert.',
      location: 'Test City',
      latitude: 10.0,
      longitude: 20.0,
      radiusKm: 10,
      recommendedAction: 'Evacuate immediately',
      sirenEnabled: false,
      notificationEnabled: true
    })
  });
  const alert = await res1.json();
  console.log('CREATE:', alert);
  
  if (!alert.id) {
    console.error('Failed to create:', alert);
    return;
  }
  
  // GET
  console.log('\n=== TEST READ ===');
  const res2 = await fetch(baseUrl + '/api/alerts/' + alert.id);
  console.log('GET:', await res2.json());
  
  // PATCH
  console.log('\n=== TEST UPDATE ===');
  const res3 = await fetch(baseUrl + '/api/alerts/' + alert.id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'published' })
  });
  console.log('UPDATE:', await res3.json());
  
  // DELETE
  console.log('\n=== TEST DELETE ===');
  const res4 = await fetch(baseUrl + '/api/alerts/' + alert.id, { method: 'DELETE' });
  console.log('DELETE status:', res4.status);
  
  // GET (List)
  console.log('\n=== TEST LIST ===');
  const res5 = await fetch(baseUrl + '/api/alerts');
  console.log('LIST:', await res5.json());
};
test().catch(console.error);
