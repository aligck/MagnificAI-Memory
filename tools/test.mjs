import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const modes=['', '--native', '--refs', '--editor', '--voice', '--audio', '--music', '--duplicates', '--unlabeled', '--rich-prompt'];
const cases=[
  ...modes.map(mode=>['tests/test-generic-memory.mjs',...(mode?[mode]:[])]),
  ['tests/test-relight-memory.mjs'],
  ['tests/test-adjust-memory.mjs'],
  ['tests/test-video-upscale-memory.mjs']
];
for(const args of cases){
  console.log('\nTest: '+args.join(' '));
  const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});
  if(result.error){console.error(result.error.message);process.exit(1);}
  if(result.status!==0)process.exit(result.status??1);
}
console.log('\nAll '+cases.length+' test scenarios passed.');
