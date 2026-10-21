// A4 is an editorial series, not a paper size. All variants keep the original paper page.
module.exports=function({c,cv,g,p,T,ims,text,para,rect,rule,placements,violations}){
 const accent=g.coverPalette.accent||{1:'#3056B4',2:'#393D45',3:'#335999',4:'#4B6651',5:'#276A69',6:'#8B594B',7:'#535D6A',8:'#71577F',9:'#3056B4',10:'#35645B',11:'#4B6651',12:'#8B594B',13:'#71577F'}[+g.version.slice(3)];
 const n=+g.version.slice(3);T.accent=accent;T.pale=n===4?'#F1E9DC':n===10?'#E8F0EA':'#EEF1FB';
 const ink=g.coverPalette.ink,muted=g.coverPalette.muted;
 function t(s,x,y,size=50,o={}){return text(s,x,y,size,{color:ink,...o})}
 function block(s,x,y,w,size=50,lead=size*1.5,o={}){return para(s,x,y,w,size,lead,{color:ink,...o})}
 const tab=require('./table4-data.json');
 const paperTones={4:['#BFCFBB','#D8E2D3'],11:['#BFCFBB','#D8E2D3'],12:['#DFBEB2','#F2DDD4'],13:['#C9BED8','#DDD5E9']};
 function paper(x,y,w,{angle=0,shadow=![3,10].includes(n),stack=false,corners=[1,3,6,9,10].includes(n)}={}){
  const im=ims.page1,h=w*im.height/im.width;
  c.save();c.translate(x+w/2,y+h/2);c.rotate(angle*Math.PI/180);
  if(stack){const tones=paperTones[n]||['#CDD9DF','#E3EAED'];c.fillStyle=tones[0];c.fillRect(-w/2+25,-h/2+29,w,h);c.strokeStyle=accent+'66';c.lineWidth=1.5;c.strokeRect(-w/2+25,-h/2+29,w,h);c.fillStyle=tones[1];c.fillRect(-w/2+12,-h/2+14,w,h);c.strokeRect(-w/2+12,-h/2+14,w,h)}
  if(shadow){c.shadowColor='rgba(39,48,62,0.24)';c.shadowBlur=32;c.shadowOffsetY=14;c.shadowOffsetX=5}
  c.fillStyle='#fff';c.fillRect(-w/2,-h/2,w,h);c.shadowColor='transparent';
  c.drawImage(im,-w/2,-h/2,w,h);c.strokeStyle=stack?accent+'88':'#AFBAC7';c.lineWidth=2.3;c.strokeRect(-w/2,-h/2,w,h);
  if(corners){c.strokeStyle=accent;c.lineWidth=3;c.beginPath();for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const xx=sx*(w/2+9),yy=sy*(h/2+9);c.moveTo(xx-sx*42,yy);c.lineTo(xx,yy);c.lineTo(xx,yy-sy*42)}c.stroke()}
  c.restore();
  placements.push({version:g.version,page:1,asset:'page1',sourcePage:1,x,y,width:w,height:h,angle});
  const rad=Math.abs(angle)*Math.PI/180,aw=w*Math.cos(rad)+h*Math.sin(rad),ah=h*Math.cos(rad)+w*Math.sin(rad);
  if(x+w/2-aw/2<38||x+w/2+aw/2>1462||y+h/2-ah/2<115||y+h/2+ah/2>1838)violations.push({version:g.version,page:1,reason:'paper bounds',x,y,w,h});
  return y+h;
 }
 function label(){t('AI 论文推荐',70,55,40,{bold:true,color:accent});t('01 / 08',1430,55,32,{right:true,color:muted})}
 function en(y,size=43){block('Same Scores, Different Decisions',70,y,1360,size,size*1.32,{english:true});}
 function credit(y){t('Fan Zhang、Yankai Chen、Zhuohan Xie 等',70,y,32,{color:muted})}
 function points(x,y,w,ss,size=43){for(let i=0;i<ss.length;i++){y=block(ss[i],x,y,w,size,size*1.48,{color:i===0?accent:ink,bold:i===0});if(i<ss.length-1){rule(x,y+21,w,'#D9DCE0');y+=57}}return y;}
 function foot(){rule(70,1857,1360,'#D8DCE1');t('arxiv.org/abs/2609.27678',70,1891,31,{color:accent})}
 function tableExcerpt(y,compact=false){
  const x=70,w=1360,c1=compact?550:640,c2=compact?415:365,c3=w-c1-c2,head=84,row=compact?125:90;
  t('Table 4',x,y-63,31,{english:true,color:muted});
  rect(x,y,w,head,tab.colors.header);rule(x,y,w,'#292D35');
  t('模型',x+22,y+21,37,{bold:true});t(compact?'答案始终一致':'12次全对',x+c1+20,y+21,37,{bold:true});t('始终同一错答',x+c1+c2+16,y+23,34,{bold:true});
  const rows=compact?[tab.rows[0]]:tab.rows;
  rows.forEach((r,j)=>{const yy=y+head+j*row;rect(x,yy,w,row,'#FFFFFF');rule(x,yy,w,'#D9DFE6');
   if(!compact&&[0,3].includes(j))rect(x+c1+7,yy+10,c2-14,row-20,j===0?tab.colors.second:tab.colors.best);
   t(r.model,x+22,yy+(compact?39:26),compact?47:41,{bold:j===0});
   const value=`${compact?r.same:r.all12}/93`;
   t(value,x+c1+30,yy+(compact?34:17),compact?57:52,{english:true,bold:j===3});
   t(String(r.wrong),x+c1+c2+66,yy+(compact?34:17),compact?57:52,{english:true});
  });rule(x,y+head+rows.length*row,w,'#292D35');
  placements.push({version:g.version,page:1,asset:'table4-redraw',sourcePage:7,x,y,width:w,height:head+rows.length*row,rows:rows.map(r=>r.model),columns:compact?['same','wrong']:['all12','wrong'],colors:tab.colors});
 }
 function correctBars(x,y,w){
  t('12次全对的题数',x,y,43,{bold:true});t('共93道题',x,y+64,33,{color:muted});
  const top=y+160,row=146,bw=w-80;
  for(const tick of [0,30,60,93]){const xx=x+tick/93*bw;c.strokeStyle='#DEE2E8';c.lineWidth=1.3;c.beginPath();c.moveTo(xx,top+35);c.lineTo(xx,top+3*row+100);c.stroke();t(String(tick),xx,top+3*row+117,27,{color:muted})}
  tab.rows.forEach((r,j)=>{const yy=top+j*row;t(r.model,x,yy-12,32,{bold:j===0});const col=j===0?tab.colors.second:j===3?tab.colors.best:tab.colors.header;rect(x,yy+42,r.all12/93*bw,48,col);t(String(r.all12),x+r.all12/93*bw+14,yy+38,46,{english:true})});
  placements.push({version:g.version,page:1,asset:'table4-bars',sourcePage:7,x,y,width:w,height:top+3*row+150-y,domain:[0,93],data:tab.rows.map(r=>({model:r.model,value:r.all12})),colors:tab.colors});
 }
 rect(0,0,1500,2000,g.coverPalette.bg);
 if(n===4)rect(0,0,1500,2000,'#EDF2E8');
 if(n===6)rect(0,0,1500,2000,g.coverPalette.bg);
 if(n===8)rect(0,0,1500,2000,'#EEEAF4');
 if(n===11)rect(0,0,1500,2000,'#EDF2E8');
 if(n===12)rect(0,0,1500,2000,'#F6EBE8');
 if(n===13)rect(0,0,1500,2000,'#EEEAF4');
 label();
 if(n===1){
  block('让AI审批合同，\nJev表现如何？',70,156,1360,111,151,{serif:true});en(489,45);credit(565);
  paper(70,660,850);points(985,685,430,['Jev 合同评测','123份合同\n2,091项判断','模型调用费用低\n也有持续错题','每道题\n重复回答12次'],44);
 }else if(n===2){
  block('Jev的AI合同评测论文，\n讲了什么？',70,151,1360,104,147,{serif:true});en(484,44);
  rule(70,584,1360,'#AAB0B7');paper(342,632,816);
  t('研究比较 Jev 与 9 个语言模型',70,1736,43,{bold:true});t('同一题反复作答，追踪答案变化与保留的错误。',70,1800,35,{color:muted});
 }else if(n===3){
  paper(295,151,910);t('Same Scores, Different Decisions',70,1377,40,{english:true,color:accent});
  block('Jev评测：题没变，\nAI答案却变了',70,1470,1360,104,142,{bold:true});
  t('相同总分下，可能答错了不同的题。',70,1790,42,{color:muted});
 }else if(n===4||n>=11){
  block('让AI审批合同，\nJev表现如何？',70,167,1360,108,147,{serif:true});en(498,44);credit(570);
  paper(115,710,790,{angle:-2.2,shadow:true,stack:true});
  points(1000,795,407,['123份合同','基础准确率\n77.38%','Jev 调用费用\n$0.000228\n每份合同'],43);
  t('合同内容判断 · 每次请求17项答案',72,1800,34,{color:muted});
 }else if(n===5){
  block('AI答题\n稳不稳？',70,220,650,111,154,{bold:true});
  block('Jev同题\n测12次',70,607,550,95,141,{color:accent,bold:true});
  block('Same Scores,\nDifferent Decisions',70,1010,550,39,58,{english:true,color:muted});
  paper(670,215,735,{stack:true});tableExcerpt(1340);
 }else if(n===6){
  t('Jev评测：AI分数一样，',70,165,102,{serif:true});
  rect(64,320,448,133,'#F2DDD4');rect(639,320,448,133,'#F2DDD4');t('表现',80,335,105,{serif:true,color:accent});t('也',530,335,105,{serif:true,color:ink});t('一样吗？',653,335,105,{serif:true,color:accent});
  en(515,44);paper(70,661,838);
  points(981,700,432,['平均分之外','哪些答案变了？\n哪些题一直对？\n哪些错一直留着？','Jev 与\n9个语言模型','ContractNLI\n合同判断任务'],39);
 }else if(n===7){
  block('让AI反复答同一道题，',70,161,1360,103,142,{serif:true});
  t('Jev表现如何？',70,319,65,{color:accent});rule(70,446,1360,'#BFC6CD');
  paper(92,548,593,{stack:true});correctBars(780,548,630);
  tableExcerpt(1530,true);
 }else if(n===8){
  block('Jev评测：题没变，\nAI答案却变了',70,166,1360,103,144,{serif:true});en(500,44);
  rect(110,689,1280,1075,'#DDD5E9');paper(355,651,790,{angle:2,shadow:true});
  t('提问顺序与重复调用，都会进入这项评测。',70,1799,37,{color:muted});
 }else if(n===9){
  rect(0,129,1500,431,'#DCE6F3');block('AI审核一份合同，\nJev花多少钱？',70,179,1360,107,151,{bold:true});
  paper(70,677,800);
  t('模型调用费用',957,693,43,{bold:true,color:accent});rect(948,795,482,93,'#E5ECFD');t('$0.000228',963,811,67,{english:true,color:accent});
  block('每份合同\n一次请求17项判断',957,932,453,43,69);
  rule(957,1145,453,'#CFD6E2');block('约为 Gemini\nFlash 的 1/6',957,1190,453,52,78,{color:accent});
  block('基础准确率\nJev 77.38%\nFlash 82.54%',957,1432,453,41,71);
  t('模型调用费用尚不等于完整合同审批成本。',70,1777,37,{color:muted});
 }else if(n===10){
  rule(70,141,1360,accent);block('Jev评测：AI分数一样，\n表现也一样吗？',70,201,1360,101,145,{bold:true});
  t('合同内容判断 / Jev 与 9 个语言模型',70,547,40,{color:accent});
  paper(538,661,861);c.strokeStyle='#A8B9B1';c.beginPath();c.moveTo(459,661);c.lineTo(459,1778);c.stroke();
  points(70,686,336,['研究对象','123份合同\n2,091项判断','重复测试','30题 + 93题\n分组报告'],36);
  block('Same Scores,\nDifferent\nDecisions',70,1460,335,38,55,{english:true,color:accent});
 }
 foot();return cv;
};
