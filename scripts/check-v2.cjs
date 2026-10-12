const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),pub=path.join(root,'public'),out=path.join(root,'checks');
const V1='58f7d4c033c802879dcd1a7bdaeb90a5ae76b52d';
const report={versions:[],viewports:[],links:0,preservedImages:0,preservedDownloads:0,clipboardChecks:0,errors:[]};
let server,browser;
const clipboard=async p=>(await p.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n');
const ready=async p=>{await p.waitForSelector('.note-card');await p.locator('.note-cover').evaluateAll(ims=>Promise.all(ims.map(im=>{im.loading='eager';return im.decode().catch(()=>{});})));};
const noOverflow=async(p,label)=>{
 await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await p.waitForFunction(()=>document.querySelector('#postDialog').open||document.documentElement.scrollWidth<=innerWidth,{},{timeout:5000});
 const s=await p.evaluate(()=>({w:innerWidth,d:document.documentElement.scrollWidth,post:document.querySelector('#postDialog').scrollWidth,pw:document.querySelector('#postDialog').clientWidth,open:document.querySelector('#postDialog').open}));
 // While a modal is open Chrome may defer layout of the inert background.
 if(!s.open)assert(s.d<=s.w,JSON.stringify({label,...s}));else assert(s.post<=s.pw+1,'post overflow '+label);report.viewports.push({label,width:s.w});
};
(async()=>{
 fs.mkdirSync(out,{recursive:true});const data=JSON.parse(fs.readFileSync(path.join(pub,'site-data.json'),'utf8'));
 for(const g of data.groups){
  const caption=fs.readFileSync(path.join(pub,g.caption),'utf8').replace(/\r\n/g,'\n').trim();assert.equal(g.fullText,caption);assert.equal(g.title,caption.split('\n')[0]);assert.equal(g.body,caption.split('\n').slice(1).join('\n').trimStart());
  for(const im of g.pages){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(pub,im.url))).digest('hex'),im.sha256);report.preservedImages++;}
 }
 const immutable=execFileSync('git',['ls-tree','-r','--name-only',V1,'public/downloads','public/versions'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>!f.endsWith('.html'));
 for(const file of immutable){assert.equal(execFileSync('git',['hash-object',file],{cwd:root,encoding:'utf8'}).trim(),execFileSync('git',['rev-parse',`${V1}:${file}`],{cwd:root,encoding:'utf8'}).trim(),file);if(file.startsWith('public/downloads/'))report.preservedDownloads++;}
 console.log('Original assets verified. Starting browser checks.');
 const types={'.html':'text/html; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8','.png':'image/png','.pdf':'application/pdf','.zip':'application/zip','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
 server=http.createServer((req,res)=>{
  let f=path.resolve(pub,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(f!==pub&&!f.startsWith(pub+path.sep)){res.writeHead(403);res.end();return;}
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Content-Length':fs.statSync(f).size,'X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')res.end();else fs.createReadStream(f).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(base);await ready(page);assert.equal(await page.locator('.note-card').count(),5);
 await page.locator('.category-tabs [data-category=read]').click();assert.equal(await page.locator('.note-card').count(),4);
 await page.locator('.desktop-search input').fill('A4-1-5');assert.equal(await page.locator('.note-card').count(),1);
 await page.locator('.desktop-search input').fill('unmatched-query');assert(await page.locator('#emptyState').isVisible());await page.locator('#emptyState [data-action=reset]').click();assert.equal(await page.locator('.note-card').count(),4);
 await page.locator('[data-save="A3-2"]').click();await page.reload();await ready(page);assert.equal(await page.locator('[data-save="A3-2"]').getAttribute('aria-pressed'),'true');
 await page.locator('.side-nav [data-action=mixed]').click();assert.equal(await page.locator('.note-card').count(),9);
 const mixedOrder=['A4-1-1','A1-3','A2-3','A4-1-2','A4-1-3','A2-4','A3-2','A4-1-4','A4-1-5'];
 assert.deepEqual(await page.locator('.note-card').evaluateAll(cards=>cards.map(c=>c.dataset.version)),mixedOrder);
 assert.deepEqual(await page.locator('.brand-mark').allTextContents(),['红','红']);
 await ready(page);await page.screenshot({path:path.join(out,'v2-mixed-desktop.png'),fullPage:true});
 await page.locator('.note-card .cover-link').first().click();await page.waitForSelector('#postDialog[open]');await page.locator('[data-action=back]').click();await page.waitForSelector('#postDialog[open]',{state:'detached'});assert.equal(new URL(page.url()).hash,'#feed/mixed');
 await page.reload();await ready(page);assert.deepEqual(await page.locator('.note-card').evaluateAll(cards=>cards.map(c=>c.dataset.version)),mixedOrder);
 await page.locator('.desktop-search input').fill('A3-2');assert.equal(await page.locator('.note-card').count(),1);await page.locator('.desktop-search input').fill('');assert.equal(await page.locator('.note-card').count(),9);
 await page.goto(base+'/#saved');await ready(page);assert.equal(new URL(page.url()).hash,'#feed/mixed');assert.equal(await page.locator('.note-card').count(),9);
 const links=new Set();
 for(const g of data.groups){
  await page.goto(base+g.preview);await page.waitForSelector('#postDialog[open]');assert.equal(await page.locator('#postTitle').innerText(),g.title);assert.equal(await page.locator('.slide').count(),g.pages.length);
  await page.locator('.post-actions [data-copy=full]').click();assert.equal(await clipboard(page),g.fullText);report.clipboardChecks++;
  assert(await page.locator('#toast').isVisible());await page.locator('[data-action=post-menu]').click();
  for(const kind of ['title','body']){await page.locator(`#postMenuDialog [data-copy=${kind}]`).click();assert.equal(await clipboard(page),g[kind]);report.clipboardChecks++;}
  await page.locator('[data-close=postMenuDialog]').click();await page.locator('#carousel').focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('#imageCounter').textContent.startsWith('2 /'));
  await page.locator('#imageDots button').last().click();await page.waitForFunction(n=>document.querySelector('#imageCounter').textContent===`${n} / ${n}`,g.pages.length);await noOverflow(page,g.version);
  for(const href of await page.locator('a[href]').evaluateAll(as=>as.map(a=>a.href)))if(href.startsWith(base))links.add(href.split('#')[0]);
  report.versions.push({version:g.version,images:g.pages.length,copy:true,carousel:true});
 }
 for(const route of ['/versions/a4-1/#v05','/versions/a3-2/']){await page.goto(base+route);await page.waitForSelector('#postDialog[open]');assert.equal(await page.locator('#postVersion').textContent(),route.includes('v05')?'A4-1-5':'A3-2');await page.keyboard.press('Escape');await page.waitForSelector('#postDialog[open]',{state:'detached'});}
 await page.goto(base);await ready(page);await page.locator('.side-nav [data-action=captions]').click();
 for(const g of data.groups){await page.locator('#captionSelect').selectOption(g.version);assert.equal(await page.locator('#captionText').inputValue(),g.fullText);}
 await page.locator('[data-caption-copy=full]').click();assert.equal(await clipboard(page),data.groups.at(-1).fullText);report.clipboardChecks++;await page.keyboard.press('Escape');
 for(const route of ['/v1/','/v1/versions/a4-1/','/v1/versions/a1-3/','/v1/versions/a2-3/','/v1/versions/a2-4/','/v1/versions/a3-2/']){
  await page.goto(base+route);assert.equal(await page.locator('h1').count(),1);
  for(const href of await page.locator('a[href],img[src]').evaluateAll(es=>es.map(e=>e.href||e.src)))if(href.startsWith(base))links.add(href.split('#')[0]);
  assert.equal(await page.locator('a[href^="/versions/"]').evaluateAll(as=>as.filter(a=>/^\/versions\/(a4-1|a1-3|a2-3|a2-4|a3-2)\/(?:index\.html)?$/.test(new URL(a.href).pathname)).length),0,'V1 page navigation must stay inside V1; assets are shared');
 }
 for(const href of links){assert((await context.request.head(href)).ok(),href);report.links++;}
 await page.goto(base+'/#feed/read');await ready(page);
 for(const width of [320,375,393,768,820,1024,1440,1728]){await page.setViewportSize({width,height:1000});await noOverflow(page,'feed');}
 await page.setViewportSize({width:1440,height:1000});await ready(page);await page.screenshot({path:path.join(out,'v2-desktop-feed.png'),fullPage:true});
 await page.locator('.note-card[data-version="A3-2"] .cover-link').click();await page.waitForSelector('#postDialog[open]');await page.locator('#imageDots button').nth(2).click();await page.waitForFunction(()=>document.querySelector('#imageCounter').textContent==='3 / 8');await page.locator('.slide img').nth(2).evaluate(im=>im.decode());await page.screenshot({path:path.join(out,'v2-desktop-detail.png')});
 for(const width of [320,375,393,768,820,1024]){await page.setViewportSize({width,height:852});await noOverflow(page,'detail');assert.equal(await page.locator('#imageCounter').textContent(),'3 / 8','Rotation keeps current image');}
 const mobile=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'}),phone=await mobile.newPage();phone.on('pageerror',e=>report.errors.push(e.message));
 await phone.goto(base);await ready(phone);await phone.screenshot({path:path.join(out,'v2-mobile-promotion.png')});await phone.locator('.mobile-menu').click();await phone.screenshot({path:path.join(out,'v2-mobile-menu.png')});await phone.locator('[data-close=menuDialog]').click();
 await phone.locator('.mobile-bottom [data-action=mixed]').click();await ready(phone);assert.deepEqual(await phone.locator('.note-card').evaluateAll(cards=>cards.map(c=>c.dataset.version)),mixedOrder);await noOverflow(phone,'mixed-feed');await phone.screenshot({path:path.join(out,'v2-mixed-mobile.png')});
 await phone.locator('.category-tabs [data-category=read]').click();await ready(phone);await phone.screenshot({path:path.join(out,'v2-mobile-feed.png')});
 await phone.locator('.mobile-search').click();await phone.locator('.mobile-search-row input').fill('A4-1-5');assert.equal(await phone.locator('.note-card').count(),1);await phone.locator('[data-action=close-search]').click();await ready(phone);
 await phone.locator('.note-card[data-version="A3-2"] .cover-link').click();await phone.waitForSelector('#postDialog[open]');await phone.locator('.slide img').first().evaluate(im=>im.decode());await phone.screenshot({path:path.join(out,'v2-mobile-detail.png')});
 const cdp=await mobile.newCDPSession(phone);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:330,y:310}]});for(let x=300;x>=50;x-=25)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:310}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await phone.waitForFunction(()=>!document.querySelector('#imageCounter').textContent.startsWith('1 /'));report.touchSwipe=true;
 await phone.locator('#postDialog').evaluate(d=>d.scrollTop=600);await phone.screenshot({path:path.join(out,'v2-mobile-caption.png')});await phone.locator('.post-actions [data-copy=full]').click();assert.equal(await clipboard(phone),data.groups.at(-1).fullText);report.clipboardChecks++;
 await phone.locator('[data-action=back]').click();await phone.waitForSelector('#postDialog[open]',{state:'detached'});await phone.locator('.mobile-bottom [data-action=captions]').click();await phone.screenshot({path:path.join(out,'v2-mobile-copy-sheet.png')});await noOverflow(phone,'caption-sheet');
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'browser-v2.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));});
