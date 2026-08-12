import{getDb}from'../server/shared/postgres.js';
import{withHardening,safeError}from'./_lib/hardening.js';

async function health(req,res){
 if(req.method!=='GET')return res.status(405).json({ok:false,error:'method not allowed'});
 if(!process.env.DATABASE_URL)return res.status(503).json({ok:false,service:'E.I.L API',database:false,error:'database unavailable'});
 try{
  const started=Date.now();
  await getDb().query('SELECT 1');
  return res.status(200).json({ok:true,service:'E.I.L API',runtime:'Node.js',database:true,latencyMs:Date.now()-started,timestamp:new Date().toISOString()});
 }catch(error){
  return res.status(503).json({ok:false,service:'E.I.L API',database:false,error:safeError(error,'database health check failed')});
 }
}

export default withHardening(health,{rateLimit:{limit:60,windowMs:60_000,keyPrefix:'health'},maxBytes:32_000});
