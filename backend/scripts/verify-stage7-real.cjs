'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const env = require('dotenv').parse(fs.readFileSync(path.resolve(__dirname,'../../.env.verification.local')));
const url = new URL(env.DATABASE_URL);
assert.equal(url.hostname,'db.qninimnubfjmyriafdgj.supabase.co');
assert.equal(new URL(env.SUPABASE_URL).hostname,'qninimnubfjmyriafdgj.supabase.co');
const config = {host:'aws-0-ap-south-1.pooler.supabase.com',port:5432,user:'postgres.qninimnubfjmyriafdgj',password:decodeURIComponent(url.password),database:'postgres',ssl:{rejectUnauthorized:false},connectionTimeoutMillis:10000};
const pool = new Pool(config);
const db = {pool,query:(...args)=>pool.query(...args)};
const A='00000000-0000-4000-8000-00000000000a', B='00000000-0000-4000-8000-00000000000b';
async function preflight() {
 const client=await pool.connect();
 try {
  await client.query('BEGIN READ ONLY');
  assert.deepEqual((await client.query('SELECT id,name FROM businesses ORDER BY id')).rows,[{id:A,name:'Bavio Verification Tenant A'},{id:B,name:'Bavio Verification Tenant B'}]);
  const columns=(await client.query("SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public'")).rows;
  for(const t of ['businesses','leads','webhooks','webhook_deliveries','action_executions','execution_evidence']) assert(columns.some(c=>c.table_name===t&&c.column_name==='id'&&c.data_type==='uuid'),t);
  for(const [t,names] of Object.entries({action_executions:['idempotency_key','attempt_count','duration_ms'],webhooks:['signing_secret_encrypted','signing_secret_version'],execution_evidence:['webhook_configuration_id','delivery_id','http_status','metadata']})) for(const name of names) assert(columns.some(c=>c.table_name===t&&c.column_name===name),name);
  const idx=(await client.query("SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND indexname='idx_action_executions_idempotency'")).rows[0];
  assert.match(idx.indexdef,/CREATE UNIQUE INDEX/);assert.match(idx.indexdef,/\(business_id, action_type, idempotency_key\)/);assert.match(idx.indexdef,/WHERE \(idempotency_key IS NOT NULL\)/);
  await client.query('COMMIT'); console.log('PASS remote schema, UUID tenants, Stage 7 fields, unique idempotency index; exactly two synthetic tenants');
 }finally{await client.query('ROLLBACK').catch(()=>{});client.release();}
}
async function leads() {
 const {createBavioLead}=require('../services/bavioLeadAction');
 const key='stage726-real-lead-v1';
 const input={db,businessId:A,idempotencyKey:key,sourceType:'verification',lead:{phone:'+12025550123',name:'Synthetic Verification Lead'}};
 const first=await createBavioLead(input); const second=await createBavioLead(input);
 assert.equal(first.leadId,second.leadId);assert.equal(second.duplicate,true);
 const concurrent=await Promise.all(Array.from({length:3},()=>createBavioLead({...input,idempotencyKey:key+'-concurrent'})));
 assert.equal(new Set(concurrent.map(r=>r.leadId)).size,1);
 const other=await createBavioLead({...input,businessId:B});assert.notEqual(other.leadId,first.leadId);
 const fresh=new Pool(config);
 try{
  for(const [id,tenant] of [[first.executionId,A],[concurrent[0].executionId,A],[other.executionId,B]]){
   const rows=(await fresh.query(`SELECT a.status,a.action_type,a.started_at,a.completed_at,l.id AS lead_id,l.business_id,e.record_id,e.recorded_at
    FROM action_executions a JOIN leads l ON l.id=a.lead_id AND l.business_id=a.business_id
    JOIN execution_evidence e ON e.execution_id=a.id AND e.business_id=a.business_id WHERE a.id=$1 AND a.business_id=$2`,[id,tenant])).rows;
   assert.equal(rows.length,1);const r=rows[0];assert.equal(r.status,'succeeded');assert.equal(r.action_type,'bavio.lead.create');assert.equal(r.record_id,r.lead_id);assert(r.started_at&&r.completed_at&&r.recorded_at);
  }
  const before=(await fresh.query('SELECT count(*) FROM leads')).rows;
  await assert.rejects(createBavioLead({...input,idempotencyKey:key+'-invalid',lead:{phone:''}}),e=>e.code==='LEAD_INPUT_INVALID'&&e.message==='A lead phone number is required.');
  assert.deepEqual((await fresh.query('SELECT count(*) FROM leads')).rows,before);
  assert.equal((await fresh.query('SELECT id FROM action_executions WHERE idempotency_key=$1',[key+'-invalid'])).rowCount,0);
  console.log('PASS real lead service: persisted lead/action/evidence and timestamps across reconnect; sequential/concurrent replay; independent tenant key; invalid input has no mutation or false success');
 }finally{await fresh.end();}
}
module.exports={db,pool,preflight,A,B,env};
if(require.main===module)(async()=>{try{await preflight();if(process.argv.includes('--leads'))await leads();}finally{await pool.end();}})().catch(e=>{console.error('FAIL',e.code||e.name,e instanceof assert.AssertionError?e.message:'Verification failed; no secret details logged');process.exitCode=1;});
