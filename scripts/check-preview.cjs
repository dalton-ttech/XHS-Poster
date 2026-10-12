const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const http=require('node:http');
let base=process.env.PREVIEW_URL,server;
const normalize=s=>s.replace(/\r\n/g,'\n').trim();
(async()=>{
 if(!base){
  const publicRoot=path.join(root,'public');
  const types={'.html':'text/html; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8','.png':'image/png','.pdf':'application/pdf','.zip':'application/zip'};
  server=http.createServer((req,res)=>{
   let target=path.resolve(publicRoot,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
   if(target!==publicRoot&&!target.startsWith(publicRoot+path.sep)){res.writeHead(403);res.end();return;}
   if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
   if(!fs.existsSync(target)){res.writeHead(404);res.end();return;}
   res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Content-Length':fs.statSync(target).size});
   if(req.method==='HEAD')res.end();else fs.createReadStream(target).pipe(res);
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  base='http://127.0.0.1:'+server.address().port;
 }
 const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,headless:true}:{headless:true});
 const report={versions:[],errors:[],widths:[],links:0};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  const data=await(await context.request.get(base+'/site-data.json')).json();
  const links=new Set();
  const routes=['/','/versions/a4-1/','/versions/a1-3/','/versions/a2-3/','/versions/a2-4/','/versions/a3-2/'];
  for(const route of routes){
   await page.goto(base+route);
   await page.waitForFunction(()=>Array.from(document.images).every(im=>im.complete&&im.naturalWidth>0));
   for(const href of await page.locator('a').evaluateAll(as=>as.map(a=>a.href)))if(href.startsWith(base))links.add(href.split('#')[0]);
   for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:1000});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert.equal(overflow,false,`${route} ${width}`);report.widths.push({route,width,overflow});
   }
  }
  for(const href of links){const response=await context.request.head(href);assert.equal(response.ok(),true,href);report.links++;}
  for(const g of data.groups){
   await page.goto(base+g.preview);await page.waitForFunction(()=>Array.from(document.images).every(im=>im.complete&&im.naturalWidth>0));
   const caption=normalize(await(await context.request.get(base+g.caption)).text());
   assert.equal(caption.split('\n')[0],g.title);
   if(g.category==='论文推广'){
    const id=g.version.split('-').at(-1).padStart(2,'0');
    const section=page.locator('#v'+id);
    assert.equal(await section.locator('h2').innerText(),g.title);
    assert.equal(await section.locator('img').count(),7);
    for(const kind of ['title','body']){
     await section.locator(`[data-copy="${kind}"]`).click();
     await page.waitForFunction(id=>document.querySelector('#status-'+id).textContent.includes('已复制'),id);
     const expected=kind==='title'?g.title:caption.split('\n\n').slice(1).join('\n\n');
     assert.equal(normalize(await page.evaluate(()=>navigator.clipboard.readText())),expected);
    }
   }else{
    assert.equal(await page.locator('h1').innerText(),g.title);
    assert.equal(await page.locator('main img').count(),g.pages.length);
    await page.locator('details').evaluateAll(ds=>ds.forEach(d=>d.open=true));
    await page.locator('#copyButton,#copy-button').click();
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('[role=status]')).some(e=>e.textContent.includes('已复制')));
    assert.equal(normalize(await page.evaluate(()=>navigator.clipboard.readText())),caption);
   }
   report.versions.push({version:g.version,title:g.title,images:g.pages.length,copyPassed:true});
  }
  const out=path.join(root,'checks');fs.mkdirSync(out,{recursive:true});
  await page.goto(base+'/');await page.waitForFunction(()=>Array.from(document.images).every(im=>im.complete&&im.naturalWidth>0));
  await page.setViewportSize({width:1440,height:1100});await page.screenshot({path:path.join(out,'home-desktop.png'),fullPage:true});
  await page.setViewportSize({width:375,height:950});await page.screenshot({path:path.join(out,'home-mobile.png')});
  await page.goto(base+'/versions/a4-1/#v05');await page.locator('#v05').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'a4-1-5-mobile.png')});
  assert.deepEqual(report.errors,[]);
  fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({versions:report.versions.length,clipboardChecks:14,localLinks:report.links,viewports:report.widths.length,errors:report.errors}));
 }finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
