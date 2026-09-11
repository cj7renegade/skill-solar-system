// Authoring-environment smoke check. Uses an explicit viewer stub: this does
// NOT verify WebGL or the production bundle. Set PLAYWRIGHT_MODULE to a local
// playwright ESM entry point if Playwright is not installed in this project.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=resolve('src');
const server=createServer(async(req,res)=>{
  try{
    if(req.url==='/viewer.js'){res.setHeader('Content-Type','text/javascript');res.end('export function createViewer(){window.viewerCalls=[];return {setGraph(){},setEdit(){},labels(){},selectedConnections(){},spacing(){},proficiency(v){window.viewerCalls.push(["proficiency",v])},pan(x,y){window.viewerCalls.push(["pan",x,y])},fit(){},focus(){}}}');return;}
    const path=resolve(root,'.'+(req.url==='/'?'/index.html':req.url));
    if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    let content=await readFile(path,'utf8');
    if(extname(path)==='.html')content=content.replace('<script src="app.js">','<script type="module" src="app.js">');
    res.setHeader('Content-Type',extname(path)==='.js'?'text/javascript':extname(path)==='.css'?'text/css':'text/html');res.end(content);
  }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.locator('#counts').filter({hasText:'18 subjects'}).waitFor();
 await page.getByRole('button',{name:'Arithmetic',exact:true}).click();
 assert.equal(await page.locator('#details-dialog').evaluate(e=>e.open),false);
 await page.getByRole('button',{name:'Arithmetic',exact:true}).click();
 assert.equal(await page.locator('#details-dialog').evaluate(e=>e.open),true);
 assert.match(await page.textContent('#details-body'),/Arithmetic covers operations/);
 assert.ok(await page.locator('#inspector svg').count());
 await page.locator('#details-body').getByRole('button',{name:'Yes',exact:true}).click();
 assert.match(await page.locator('#details-body .proficiency-state').textContent(),/Yes/);
 await page.click('#details-close');await page.check('#show-proficiency');
 assert.match(await page.textContent('#legend'),/Manual self-report/);
 await page.locator('#canvas').focus();await page.keyboard.press('ArrowRight');
 assert.deepEqual(await page.evaluate(()=>window.viewerCalls.at(-1)),['pan',1,0]);
 await page.keyboard.press('w');
 assert.deepEqual(await page.evaluate(()=>window.viewerCalls.at(-1)),['pan',0,1]);
 await page.fill('#search','Arith');await page.keyboard.press('ArrowLeft');
 assert.deepEqual(await page.evaluate(()=>window.viewerCalls.at(-1)),['pan',0,1]);
 await page.fill('#search','');
 await page.check('#edit-mode');await page.click('#add-node');
 await page.fill('#node-name','Test subject');await page.fill('#node-description','A saved description');await page.click('#apply-node');
 assert.match(await page.textContent('#counts'),/19 subjects/);
 await page.selectOption('#edge-target','algebra');await page.selectOption('#edge-type','supports');await page.click('#connect');
 assert.match(await page.textContent('#status'),/Connection added/);
 await page.click('#connect');assert.match(await page.textContent('#status'),/already exists/);
 await page.fill('#node-x','345');await page.check('#node-pinned');await page.click('#apply-node');await page.click('#arrange');
 assert.equal(await page.inputValue('#node-x'),'345');
 const download=page.waitForEvent('download');await page.click('#save');const file=await download;const data=JSON.parse(await readFile(await file.path(),'utf8'));
 assert.equal(data.nodes.find(n=>n.name==='Test subject').description,'A saved description');assert.equal(data.nodes.find(n=>n.id==='arithmetic').proficiency80,true);
 await page.click('#delete-node');assert.match(await page.textContent('#counts'),/18 subjects/);
 await page.click('#undo');assert.match(await page.textContent('#counts'),/19 subjects/);
 await page.setInputFiles('#file',{name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":7}')});
 assert.match(await page.textContent('#status'),/Could not open map/);assert.match(await page.textContent('#counts'),/19 subjects/);
 await page.setInputFiles('#file',{name:'saved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});assert.match(await page.textContent('#status'),/Opened saved.json/);
 await page.reload();await page.locator('#counts').filter({hasText:'19 subjects'}).waitFor();
 if(process.env.QA_SCREENSHOT)await page.screenshot({path:process.env.QA_SCREENSHOT});
 assert.deepEqual(errors,[]);console.log('PASS: add/edit/connect/duplicate rejection/pin/arrange/export/delete/undo/import validation/import/draft recovery. Viewer explicitly stubbed.');
}finally{await browser.close();await new Promise(done=>server.close(done));}
