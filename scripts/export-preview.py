"""Export only approved current publication materials into a static Pages site."""
from pathlib import Path
from html import escape, unescape
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import argparse
import hashlib
import json
import re
import shutil
import zipfile

repo = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=repo.parent / 'JEV-论文内容制作')
args = parser.parse_args()
source = args.source.resolve()
versions = source / 'jev-xhs-versions-20261009'
delivery = source / '汇总交付'
public = repo / 'public'
public.mkdir(exist_ok=True)
mapping = {}
written = set()
def register(old, dest):
    mapping[old.resolve()] = '/' + dest
def write(dest, data):
    target = public / dest
    assert target.resolve().is_relative_to(public.resolve())
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data if isinstance(data, bytes) else data.encode('utf-8'))
    written.add(dest)
def copy(old, dest):
    write(dest, old.read_bytes())
    register(old, dest)

promo = json.loads((versions / 'A4-1/manifest.json').read_text(encoding='utf-8'))
groups = [dict(v, category='论文推广', sourceRoot=versions/'A4-1') for v in promo['variants']]
for name in ['A1-3','A2-3','A2-4','A3-2']:
    groups.append(dict(json.loads((versions/name/'manifest.json').read_text(encoding='utf-8')), versionId=name, category='论文解读', sourceRoot=versions/name))

pdf_name = 'JEV-论文推广与解读-全部版本汇总.pdf'
copy(delivery/pdf_name, 'downloads/jev-all-versions.pdf')
copy(delivery/'JEV-九版图文发布包-无二维码.zip', 'downloads/jev-all-versions.zip')
for old in [delivery/'预览.html', source/'开始阅读.html', versions/'版本总览.html']:
    register(old, 'index.html')
for name in ['A1-3','A2-3','A2-4','A3-2','A4-1']:
    register(versions/name/'预览.html', f'versions/{name.lower()}/index.html')

site_groups = []
for g in groups:
    key=g['versionId'];slug=key.lower();folder=g['sourceRoot']
    caption = folder / (g['file'] if g['category']=='论文推广' else '发布文案.txt')
    copy(caption, f'versions/{slug}/caption.txt')
    pages=[]
    for p in g['pages']:
        original=folder/p['file'];dest=f'versions/{slug}/images/{p["order"]:02d}.png'
        assert hashlib.sha256(original.read_bytes()).hexdigest()==p['sha256']
        copy(original, dest)
        pages.append({'order':p['order'],'title':p['title'],'url':'/'+dest,'sha256':p['sha256']})
    notes='论文：Same Scores, Different Decisions: Evaluating JEV and Language Models for Legal Document Understanding\nFan Zhang等 · arXiv:2609.27678v1 · 2026-09-23 · 预印本 · CC BY 4.0\nhttps://arxiv.org/abs/2609.27678\n代码：https://github.com/ZF-Utokyo/Jev-Benchmark\n\n按编号上传图片，发布文案第一行为标题，其余为正文。\n推广版首图为完整原论文首页。所有图片1500×2000。\n结果对应论文所测配置与样本；实际任务是根据合同原文回答问题，未检验完整合同审批流程。\n'
    write(f'versions/{slug}/sources.txt',notes)
    for name in ['制作与来源.txt','使用说明.txt','使用与来源说明.txt']:
        if g['category']=='论文解读':register(folder/name,f'versions/{slug}/sources.txt')
    if g['category']=='论文解读' and (folder/'八页总览.png').exists():
        copy(folder/'八页总览.png',f'versions/{slug}/overview.png')
    dest=f'downloads/{slug}.zip';target=public/dest
    target.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
        for p in g['pages']:z.write(folder/p['file'],'发布图片/'+Path(p['file']).name)
        z.write(caption,'发布文案.txt');z.writestr('来源与使用说明.txt',notes)
    written.add(dest)
    if g['category']=='论文推广':
        register(folder/g['zip'],dest)
        preview='/versions/a4-1/index.html#v'+g['id']
    else:
        old_zip=f'JEV-{key}-{len(g["pages"])}张发布包.zip'
        register((folder if key=='A3-2' else versions)/old_zip,dest)
        preview=f'/versions/{slug}/index.html'
    site_groups.append({'version':key,'category':g['category'],'title':g['title'],'preview':preview,'caption':f'/versions/{slug}/caption.txt','download':'/'+dest,'pages':pages})

# The all-promotion ZIP includes each image and caption once, without nested ZIPs.
dest='downloads/a4-1-all.zip'
with zipfile.ZipFile(public/dest,'w',zipfile.ZIP_DEFLATED) as z:
    for g in groups[:5]:
        for p in g['pages']:z.write(g['sourceRoot']/p['file'],g['versionId']+'/发布图片/'+Path(p['file']).name)
        z.write(g['sourceRoot']/g['file'],g['versionId']+'/发布文案.txt')
written.add(dest)
register(versions/'A4-1/JEV-A4-1-五版图文发布包.zip',dest)
copy(versions/'A4-1/五版文案合集.txt','downloads/a4-1-captions.txt')

def transform(old):
    html=old.read_text(encoding='utf-8')
    def rewrite(match):
        attribute,quote,raw=match.group(1),match.group(2),match.group(3)
        url=unescape(raw);parts=urlsplit(url)
        if not parts.path or parts.scheme or parts.netloc:return match.group(0)
        local=(old.parent/unquote(parts.path)).resolve()
        assert local in mapping, (str(old),url)
        replacement=mapping[local]
        if replacement.endswith('/index.html'):replacement=replacement[:-10]
        if replacement=='/index.html':replacement='/'
        replacement+=('?' + parts.query if parts.query else '')+('#'+parts.fragment if parts.fragment else '')
        return attribute+'='+quote+escape(replacement,quote=True)+quote
    html=re.sub(r'\b(href|src)=([\"\'])(.*?)\2',rewrite,html)
    html=html.replace('恢复原版标题，保留更新后的正文与图表。6张图拆解这篇合同评测论文。','6张图介绍JEV与语言模型在合同理解任务中的表现。')
    html=html.replace('其他版本','全部版本')
    html=html.replace('<head>','<head><meta name="robots" content="noindex,nofollow"><link rel="icon" href="data:,">',1)
    assert not re.search(r'file:|[CE]:[/\\]|\\\\Users\\|AppData|历史存档',html)
    return html

write('index.html',transform(delivery/'预览.html'))
for name in ['A1-3','A2-3','A2-4','A3-2','A4-1']:
    write(f'versions/{name.lower()}/index.html',transform(versions/name/'预览.html'))
write('site-data.json',json.dumps({'updated':'2026-10-12','paper':'https://arxiv.org/abs/2609.27678','pdf':'/downloads/jev-all-versions.pdf','allDownload':'/downloads/jev-all-versions.zip','groups':site_groups},ensure_ascii=False,indent=2))
write('404.html','<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>页面不存在</title><body style="font:18px/1.8 system-ui;padding:8vw;color:#1b3443"><h1>页面不存在</h1><p><a href="/">返回JEV图文预览</a></p></body></html>')
write('robots.txt','User-agent: *\nDisallow: /\n')
write('_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: public, max-age=0, must-revalidate\n')

# Keep the app and the preserved V1 preview when regenerating publication assets.
import runpy
written.update(runpy.run_path(str(repo/'scripts/build-ui.py'))['build_ui']())

class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        self.links.extend(v for k,v in attrs if k in ['src','href'])
link_count=0
for file in public.rglob('*.html'):
    parsed=Links();parsed.feed(file.read_text(encoding='utf-8'))
    for url in parsed.links:
        parts=urlsplit(url)
        if parts.scheme or parts.netloc or not parts.path:continue
        target=public/unquote(parts.path.lstrip('/'))
        if parts.path.endswith('/'):target/='index.html'
        assert target.is_file(),(file,url)
        link_count+=1
files=[p for p in public.rglob('*') if p.is_file()]
assert {str(p.relative_to(public)).replace('\\','/') for p in files}==written
assert len(files)<20000
for file in files:
    assert file.stat().st_size<=25*1024*1024,(file,file.stat().st_size)
    if file.suffix=='.zip':
        with zipfile.ZipFile(file) as z:
            assert z.testzip() is None
            assert all(not n.endswith(('.py','.cjs','.env')) and '历史存档' not in n and '检查/' not in n for n in z.namelist())
report={'versions':9,'publicationImages':65,'htmlPages':len(list(public.rglob('*.html'))),'files':len(files),'localLinks':link_count,'largestAssetBytes':max(p.stat().st_size for p in files),'totalBytes':sum(p.stat().st_size for p in files),'allAssetsUnder25MiB':True}
(repo/'checks').mkdir(exist_ok=True)
(repo/'checks/export.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report))
