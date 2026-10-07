const dns = require('dns').promises;
(async () => { 
  const regions = ['us-east-1','us-west-1','eu-west-1','eu-central-1','ap-southeast-1','ap-northeast-1','ap-south-1','sa-east-1']; 
  for (const r of regions) { 
    try { 
      await dns.lookup('aws-0-' + r + '.pooler.supabase.com'); 
      console.log(r + ' resolves!'); 
    } catch (e) {} 
  } 
})();
