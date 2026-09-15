import {createServer} from 'vite';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';
import {sha256} from './guards.mjs';
const before=sha256(await readFile('dist/build-manifest.json'));
const server=await createServer({server:{host:'127.0.0.1',port:4197,strictPort:true},logLevel:'silent'});
try{await server.listen();}finally{await server.close();}
assert.equal(sha256(await readFile('dist/build-manifest.json')),before,'Dev lifecycle changed a build artifact');
const temp=await mkdtemp(path.join(os.tmpdir(),'pear-dev-fixture-'));const file=path.join(temp,'artifact.json');
try{
 await writeFile(file,'verified artifact');const expected=sha256(await readFile(file));
 const broken=await createServer({configFile:false,root:temp,logLevel:'silent',server:{host:'127.0.0.1',port:4197,strictPort:true},plugins:[{name:'deliberately-broken-close-hook',async closeBundle(){await writeFile(file,'unexpected write during dev shutdown');}}]});
 await broken.listen();await broken.close();
 const changed=sha256(await readFile(file));
 assert.notEqual(changed,expected,'The deliberately broken fixture must actually write');
 assert.throws(()=>assert.equal(changed,expected));
}finally{await rm(temp,{recursive:true,force:true});}
await writeFile('verification/generated/dev-isolation.json',JSON.stringify({checkedAt:new Date().toISOString(),status:'pass',currentArtifactUnchanged:true,reverseFixtureDetected:true},null,2));
console.log('PASS dev startup/shutdown leaves build unchanged; deliberate close-hook write is detected.');
