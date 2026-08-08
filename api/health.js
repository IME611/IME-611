export default function handler(req,res){res.status(200).json({ok:true,service:'E.I.L API',runtime:'Node.js',database:!!process.env.DATABASE_URL})}
