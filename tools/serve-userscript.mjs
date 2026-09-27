import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';

const file=new URL('../src/magnific-memory.user.js',import.meta.url);
const server=createServer(async(req,res)=>{
  if(req.method!=='GET'||req.url!=='/magnific-memory.user.js'){
    res.writeHead(404);res.end();return;
  }
  try{
    const source=await readFile(file);
    res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(source);
  }catch{res.writeHead(500);res.end('Userscript file unavailable');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(43129,'127.0.0.1',()=>console.log('Development beta: http://127.0.0.1:43129/magnific-memory.user.js'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
