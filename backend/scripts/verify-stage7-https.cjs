'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const crypto=require('node:crypto');
const {db,pool,preflight,A,B,env}=require('./verify-stage7-real.cjs');
// Substitute only database infrastructure with the real isolated pool. Domain services
// are unchanged; avoids database/db.js import-time unrelated schema initialization.
const dbPath=require.resolve('../database/db');
require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:db};
process.env.WEBHOOK_SECRET_ENCRYPTION_KEY=env.WEBHOOK_SECRET_ENCRYPTION_KEY;
const service=require('../services/webhookService');
const {executeBavioWebhook}=require('../services/bavioWebhookAction');
const base=process.argv[2];
assert(base&&new URL(base).protocol==='https:'&&new URL(base).hostname.endsWith('.loca.lt'),'Expected temporary localtunnel HTTPS URL');
const secrets=new Map(), receipts=[];
const receiver=http.createServer((req,res)=>{
 let body='';req.on('data',chunk=>{body+=chunk;if(body.length>32768)req.destroy();});
 req.on('end',()=>{
  let payload;try{payload=JSON.parse(body);}catch{res.writeHead(400).end();return;}
  const header=req.headers['x-bavio-signature']||'';
  const match=/^t=(\d+),v1=([a-f0-9]{64})$/.exec(header);
  const secret=secrets.get(req.url);
  const verify=key=>!!(match&&key&&crypto.timingSafeEqual(Buffer.from(match[2],'hex'),crypto.createHmac('sha256',key).update(`${match[1]}.${body}`).digest()));
  const signatureValid=verify(secret);
  if(verify('deliberately-wrong-synthetic-secret'))throw Error('Wrong secret accepted');
  receipts.push({correlationId:payload.execution_id,requestCount:receipts.length+1,method:req.method,path:req.url,timestamp:new Date().toISOString(),signatureValid});
  if(req.url==='/slow')setTimeout(()=>res.writeHead(204).end(),6500);
  else if(req.url==='/redirect')res.writeHead(302,{Location:base+'/redirect-target'}).end();
  else res.writeHead(req.url==='/failure'?500:204).end();
 });
});
async function run(){
 await preflight();
 await new Promise(resolve=>receiver.listen(18573,'127.0.0.1',resolve));
 if(process.argv.includes('--legacy-only')){
  const stored=(await db.query('SELECT * FROM webhooks WHERE business_id=$1 AND url=$2',[A,base+'/legacy'])).rows;
  assert.equal(stored.length,1);const hook=stored[0];assert.equal(hook.signing_secret,null);assert.equal(hook.signing_secret_version,'v1');
  secrets.set('/legacy',service.resolveSigningSecret(hook));
  assert.equal((await service.migrateLegacyWebhookSecrets({database:db,dryRun:true})).scanned,0);
  assert.equal((await service.migrateLegacyWebhookSecrets({database:db})).migrated,0);
  assert.equal((await db.query('SELECT signing_secret_encrypted FROM webhooks WHERE id=$1',[hook.id])).rows[0].signing_secret_encrypted,hook.signing_secret_encrypted);
  await executeBavioWebhook({db,businessId:A,webhookConfigurationId:hook.id,eventType:'verification.synthetic',data:{synthetic:true}});
  assert.equal(receipts.length,1);assert(receipts[0].signatureValid);
  console.log('PASS migrated legacy secret: fresh query, unchanged ciphertext on repeat migration, real HTTPS signature accepted');console.log(JSON.stringify(receipts));return;
 }
 const hooks={};
 for(const route of ['/success','/failure','/redirect','/slow']){
  const hook=await service.registerWebhook(A,base+route);
  assert(!JSON.stringify(hook).includes('secret'));
  const stored=(await db.query('SELECT * FROM webhooks WHERE id=$1 AND business_id=$2',[hook.id,A])).rows[0];
  assert.equal(stored.signing_secret,null);assert.equal(stored.signing_secret_version,'v1');
  const [iv,tag,cipher]=stored.signing_secret_encrypted.split('.');assert.equal(Buffer.from(iv,'base64url').length,12);assert.equal(Buffer.from(tag,'base64url').length,16);assert(cipher);
  secrets.set(route,service.resolveSigningSecret(stored));hooks[route]=hook;
 }
 console.log('PASS canonical webhook registration: ciphertext, 12-byte nonce, 16-byte tag, version; response omits secrets');
 for(const route of ['/success','/failure','/redirect','/slow']){
  const invocationId='stage726-'+crypto.randomUUID();
  const input={db,businessId:A,webhookConfigurationId:hooks[route].id,eventType:'verification.synthetic',data:{synthetic:true},invocationId};
  let result,error;try{result=await executeBavioWebhook(input);}catch(e){error=e;}
  const row=(await db.query('SELECT * FROM action_executions WHERE business_id=$1 AND idempotency_key=$2',[A,invocationId])).rows[0];
  const received=receipts.filter(r=>r.correlationId===row.id);
  assert.equal(received.length,1,`Receiver count for ${route}: ${received.length}; error=${error?.code}`);assert.equal(received[0].signatureValid,true);
  assert.equal(row.status,route==='/success'?'succeeded':'failed');assert.equal(row.attempt_count,1);assert(row.completed_at);
  if(route==='/slow'){assert.equal(error.code,'WEBHOOK_TIMEOUT');assert(row.duration_ms<10000);}
  const evidence=(await db.query('SELECT * FROM execution_evidence WHERE execution_id=$1 AND business_id=$2',[row.id,A])).rows;
  assert.equal(evidence.length,1);
  if(route==='/success'){
   assert.equal(evidence[0].http_status,204);assert.equal(result.outcome,'Webhook accepted by configured endpoint.');
   const duplicate=await executeBavioWebhook(input);assert.equal(duplicate.duplicate,true);assert.equal(receipts.filter(r=>r.correlationId===row.id).length,1);
  }
  console.log('PASS real HTTPS',route,'signature, persisted outcome/evidence, one request');
 }
 assert(!receipts.some(r=>r.path==='/redirect-target'));
 const bHook=await service.registerWebhook(B,base+'/success');
 const before=receipts.length;
 await assert.rejects(executeBavioWebhook({db,businessId:A,webhookConfigurationId:bHook.id,eventType:'verification.synthetic',data:{synthetic:true}}),e=>e.code==='WEBHOOK_NOT_FOUND');
 assert.equal(receipts.length,before);console.log('PASS cross-tenant webhook denied before network');
 // Explicitly requested synthetic legacy fixture; not an action result.
 const legacySecret='whsec_'+crypto.randomBytes(24).toString('hex');
 const legacy=(await db.query("INSERT INTO webhooks(business_id,url,events,signing_secret,status) VALUES($1,$2,'[\"*\"]',$3,'active') RETURNING id",[A,base+'/legacy',legacySecret])).rows[0];
 secrets.set('/legacy',legacySecret);
 const dry=await service.migrateLegacyWebhookSecrets({database:db,dryRun:true});assert.deepEqual(dry.candidates,[legacy.id]);
 assert.equal((await service.migrateLegacyWebhookSecrets({database:db})).migrated,1);
 const stored=(await db.query('SELECT * FROM webhooks WHERE id=$1',[legacy.id])).rows[0];assert.equal(stored.signing_secret,null);assert.equal(service.resolveSigningSecret(stored),legacySecret);
 assert.equal((await service.migrateLegacyWebhookSecrets({database:db})).migrated,0);
 await executeBavioWebhook({db,businessId:A,webhookConfigurationId:legacy.id,eventType:'verification.synthetic',data:{synthetic:true}});
 assert(receipts.some(r=>r.path==='/legacy'&&r.signatureValid));console.log('PASS legacy dry run/migration/repeat/signing');
 console.log(JSON.stringify(receipts));
}
run().catch(e=>{console.error('FAIL',e.code||e.name,e instanceof assert.AssertionError?e.message:'HTTPS verification failed');process.exitCode=1;}).finally(async()=>{receiver.closeAllConnections();await new Promise(resolve=>receiver.close(resolve));await pool.end();});
