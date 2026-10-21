const fs=require('fs'),path=require('path'),crypto=require('crypto');
const RT='C:/Users/ACER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,loadImage,GlobalFonts}=require(path.join(RT,'@napi-rs/canvas'));
const ROOT=__dirname, W=1500,H=2000,L=70,R=1430;
GlobalFonts.registerFromPath('C:/Windows/Fonts/NotoSerifSC-VF.ttf','PaperSerif');
GlobalFonts.registerFromPath('C:/Windows/Fonts/msyh.ttc','PaperSans');
GlobalFonts.registerFromPath('C:/Windows/Fonts/msyhbd.ttc','PaperBold');
GlobalFonts.registerFromPath('C:/Windows/Fonts/georgia.ttf','PaperEnglish');
const data=JSON.parse(fs.readFileSync(path.join(ROOT,'source.json'),'utf8'));
const themes={
 editorial:{bg:'#FFFFFF',ink:'#292925',muted:'#65645F',accent:'#3056B4',pale:'#EFF0FB',rule:'#DDDAD3'},
 navy:{bg:'#F5F5F0',ink:'#173247',muted:'#59707D',accent:'#2C608F',pale:'#E6EDF2',rule:'#C8D1D7'},
 mint:{bg:'#FFFCF2',ink:'#294039',muted:'#68746A',accent:'#3A745E',pale:'#E7EFD9',rule:'#D2DDCC'},
 blue:{bg:'#F6F8FD',ink:'#263953',muted:'#66748A',accent:'#4666A5',pale:'#E5EBF7',rule:'#D3DDEB'},
 teal:{bg:'#F4F8FC',ink:'#172C47',muted:'#586D82',accent:'#147C8E',pale:'#E1EFF2',rule:'#CCDDE4'},
};
const bounds=[],placements=[],violations=[];let c,g,p,index,T;
const ims={};
function rect(x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
function rule(x,y,w,col=T.rule){rect(x,y,w,1.5,col)}
function font(size,o={}){c.font=`${o.serif?'700 ':''}${size}px "${o.serif?'PaperSerif':o.english?'PaperEnglish':o.bold?'PaperBold':'PaperSans'}"`;c.textBaseline='alphabetic';c.textAlign='left'}
function text(s,x,y,size=50,o={}){
 font(size,o);const m=c.measureText(s);let left=o.right?x-m.width:x;
 c.fillStyle=o.color||T.ink;const baseline=y+m.actualBoundingBoxAscent;c.fillText(s,left,baseline);
 const h=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
 const b={version:g.version,page:index,text:s,x:left,y,width:m.width,height:h,size};bounds.push(b);
 if(left<40||left+m.width>1460||y<38||y+h>1970)violations.push(b);
 return {w:m.width,h};
}
function wrap(s,width,size,o={}){
 font(size,o);const lines=[];let line='';
 for(const ch of (s.match(/[A-Za-z0-9]+(?:[.\-/][A-Za-z0-9]+)*|[^A-Za-z0-9]/gu)||[])){
  if(ch==='\n'){lines.push(line);line='';continue}
  if(line&&c.measureText(line+ch).width>width){
   if('，。；：！？、）】”》'.includes(ch)&&line.length>1){const last=line.slice(-1);lines.push(line.slice(0,-1));line=last+ch}
   else{lines.push(line);line=ch}
  }else line+=ch;
 }
 if(line)lines.push(line);return lines;
}
function para(s,x,y,width,size=50,lead=79,o={}){
 const lines=wrap(s,width,size,o);for(const ln of lines){if(ln){
  if(o.highlight){font(size,o);rect(x-2,y-5,c.measureText(ln).width+7,size+17,T.pale)}
  text(ln,x,y,size,o);
 }y+=lead}return y;
}
function fitTitle(s,x,y,width,size=92,color=T.ink){
 while(wrap(s,width,size,{serif:g.theme==='editorial',bold:g.theme!=='editorial'}).length>2&&size>76)size-=2;
 return para(s,x,y,width,size,size*1.38,{serif:g.theme==='editorial',bold:g.theme!=='editorial',color});
}
function base(){const cv=createCanvas(W,H);c=cv.getContext('2d');T={...themes[g.theme],...g.coverPalette};rect(0,0,W,H,T.bg);
 if(g.theme==='teal')rect(0,0,W,11,T.accent);
 text(g.category==='论文推广'?'AI 论文推荐':'AI 论文解读',L,57,31,{color:T.accent,bold:true});
 text(`${String(index).padStart(2,'0')} / ${'08'}`,R,54,34,{color:T.muted,right:true});return cv;
}
function footer(source){
 rule(L,1857,R-L);para(source,L,1880,1360,27,38,{color:T.muted});
}

function fig(key,x,y,maxW,maxH,frame=false){
 const im=ims[key],scale=Math.min(maxW/im.width,maxH/im.height),w=im.width*scale,h=im.height*scale;
 const xx=x+(maxW-w)/2,yy=y+(maxH-h)/2;
 if(frame&&key==='page1'&&p.kind==='cover'){c.save();c.shadowColor='rgba(30,48,65,.22)';c.shadowBlur=25;c.shadowOffsetY=12;rect(xx-5,yy-5,w+10,h+10,'#FFFFFF');c.restore();rect(xx-2,yy-2,w+4,h+4,'#AEBBCB')}
 if(frame){rect(xx-2,yy-2,w+4,h+4,key==='page1'?'#AEBBCB':T.rule);rect(xx,yy,w,h,'#FFFFFF')}
 c.drawImage(im,xx,yy,w,h);
 placements.push({version:g.version,page:index,asset:key,x:xx,y:yy,width:w,height:h,sourcePage:1});
 return {x:xx,y:yy,w,h};
}
function editorialCover(){const cv=base();
 if(g.coverStyle)return require('./a4-covers.cjs')({c,cv,g,p,T,ims,text,para,rect,rule,placements,violations});
 const coverTitles={"A4-1-1": "让AI审批合同，Jev表现如何？", "A4-1-2": "Jev评测：AI分数一样，\n表现也一样吗？", "A4-1-3": "Jev评测：题没变，\nAI答案却变了", "A4-1-4": "AI答题稳不稳？\nJev同题测12次", "A4-1-5": "AI审核合同，\nJev能省多少调用费？"};
 const end=fitTitle(coverTitles[g.version]||g.title,L,134,g.version==='A4-1-1'?1400:1360,102);
 let y=end+29;
 y=para('Same Scores, Different Decisions',L,y,1360,57,71,{english:true});
 y=para('Evaluating Jev and Language Models\nfor Legal Document Understanding',L,y+12,1360,43,57,{english:true});
 text('Fan Zhang、Yankai Chen、Zhuohan Xie 等',L,y+29,36,{color:T.muted});
 text('MBZUAI、东京大学等多机构合作',L,y+87,36,{color:T.muted});
 const top=y+164,fh=1808-top;
 const im=ims.page1,fw=Math.min(900,fh*im.width/im.height);
 const item=fig('page1',L,top,fw,fh,true);
 const sideX=L+fw+38,sideW=R-sideX;let sy=top+17;
 for(let i=0;i<p.sidebar.length;i++){
  const s=p.sidebar[i],sz=i===0?44:(i===2?51:44),color=i===0||i===2?T.accent:T.ink;
  sy=para(s,sideX,sy,sideW,sz,sz*1.55,{bold:i===0,color});
  if(i<p.sidebar.length-1){sy+=26;rule(sideX,sy,sideW);sy+=30;}
 }
 if(sy>1810)violations.push({version:g.version,page:index,reason:'cover sidebar overflow',y:sy});
 footer('论文首页原图 · arXiv:2609.27678 · 公开入口见末页');return cv;
}
async function main(){
 const output=path.resolve(process.argv[2]||path.join(ROOT,'../../checks/20261021/covers'));
 fs.mkdirSync(output,{recursive:true});
 ims.page1=await loadImage(path.join(ROOT,'paper-page1.png'));
 const manifest=[];
 for(g of data.groups){
  p=g.pages[0];index=1;const cv=editorialCover();const buf=cv.toBuffer('image/png');
  fs.writeFileSync(path.join(output,g.version+'.png'),buf);
  const thumb=createCanvas(1050,1400);thumb.getContext('2d').drawImage(cv,0,0,1050,1400);
  fs.writeFileSync(path.join(output,g.version+'.jpg'),thumb.toBuffer('image/jpeg',91));
  manifest.push({version:g.version,palette:g.coverPalette,sha256:crypto.createHash('sha256').update(buf).digest('hex')});
 }
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({manifest,placements,bounds,violations},null,2));
 console.log(JSON.stringify({covers:manifest.length,violations:violations.length}));
 if(violations.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exit(1)});
