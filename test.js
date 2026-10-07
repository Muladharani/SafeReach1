fetch('http://localhost:5000/api/shelters', {
  method: 'POST', 
  headers:{'Content-Type':'application/json'}, 
  body: JSON.stringify({
    name:'Test Shelter', 
    latitude:14.19, 
    longitude:79.15, 
    capacity:100, 
    status:'open', 
    type:'school', 
    address:'Test Address'
  })
}).then(r=>r.json()).then(console.log);
