'use strict';
const assert=require('node:assert/strict');
const {db,pool,preflight,A,B}=require('./verify-stage7-real.cjs');
const p=require.resolve('../database/db');require.cache[p]={id:p,filename:p,loaded:true,exports:db};
const {getLeadContext}=require('../controllers/leadReads');
const {updateLead}=require('../controllers/leadsController');
const response=()=>({code:200,status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
(async()=>{try{
 await preflight();
 const foreign=(await db.query('SELECT lead_id FROM action_executions WHERE business_id=$1 AND idempotency_key=$2',[B,'stage726-real-lead-v1'])).rows[0].lead_id;
 let res=response();await getLeadContext({user:{id:A},params:{id:foreign}},res);assert.equal(res.code,404);
 res=response();await updateLead({user:{id:A},params:{id:foreign},body:{name:'Must not persist'}},res);assert.equal(res.code,404);
 res=response();await updateLead({user:{id:A},params:{id:foreign},body:{business_id:B}},res);assert.equal(res.code,400);
 res=response();await getLeadContext({params:{id:foreign}},res);assert.equal(res.code,401);
 const {createBavioLead}=require('../services/bavioLeadAction');
 const injected=await createBavioLead({db,businessId:A,idempotencyKey:'stage726-tenant-payload-injection',sourceType:'verification',lead:{phone:'+12025550124',name:'Synthetic Tenant Injection Probe',business_id:B,businessId:B}});
 assert.equal((await db.query('SELECT business_id FROM leads WHERE id=$1',[injected.leadId])).rows[0].business_id,A);
 // Inspect real RLS posture in a read-only transaction. No tenant SELECT policy
 // exists yet, so client roles must be denied every row (including their own).
 const client=await pool.connect();try{
  await client.query('BEGIN READ ONLY');await client.query('SET LOCAL ROLE authenticated');
  for(const table of ['leads','action_executions','execution_evidence']){
   await client.query('SAVEPOINT read_probe');
   try{assert.equal((await client.query(`SELECT id FROM public.${table}`)).rowCount,0);}
   catch(e){await client.query('ROLLBACK TO SAVEPOINT read_probe');if(e.code!=='42501')throw e;}
  }
 }finally{await client.query('ROLLBACK');client.release();}
 console.log('PASS real lead controllers deny foreign read/update/tenant-field injection and missing identity; authenticated DB role cannot read lead/action/evidence rows. No action/evidence read API exists; positive tenant access is not claimed.');
}finally{await pool.end();}})().catch(e=>{console.error('FAIL',e.code||e.name);process.exitCode=1;});
