const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  console.log('Connected');
  client.end();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
