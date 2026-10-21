"""Apply the 2026-10-21 cover/status release; preserve all other publication content."""
from pathlib import Path
import hashlib, json, re, shutil, zipfile
import fitz

REPO = Path(__file__).resolve().parents[2]
PUBLIC = REPO/'public'
CHECK = REPO/'checks/20261021'
COVERS = CHECK/'covers'
PUBLISHED = {'A4-4','A4-5','A4-8','A4-9'}
data = json.loads((PUBLIC/'site-data.json').read_text('utf-8'))
(CHECK/'baseline').mkdir(parents=True,exist_ok=True)
pdf_baseline = CHECK/'baseline/jev-all-versions.pdf'
if not pdf_baseline.exists(): shutil.copy2(PUBLIC/'downloads/jev-all-versions.pdf',pdf_baseline)
manifest = json.loads((COVERS/'manifest.json').read_text('utf-8'))
colors = {g['version']:g for g in manifest['manifest']}
assert not manifest['violations']
assert set(colors) == {g['version'] for g in data['groups'] if g['category']=='论文推广' and g['version'] not in PUBLISHED}
replacement = {}
for g in data['groups']:
    v = g['version']
    if v in PUBLISHED:
        g['published'] = True
    if v in colors:
        cover = (COVERS/f'{v}.png').read_bytes()
        assert hashlib.sha256(cover).hexdigest() == colors[v]['sha256']
        (PUBLIC/g['pages'][0]['url'].lstrip('/')).write_bytes(cover)
        g['pages'][0]['sha256'] = colors[v]['sha256']
        replacement[v+'/发布图片/01.png'] = cover
data['updated'] = '2026-10-21'
(PUBLIC/'site-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

packages = [g['download'].lstrip('/') for g in data['groups'] if g['version'] in colors]
packages += ['downloads/a4-1-all.zip','downloads/other-versions.zip']
for rel in packages:
    current = PUBLIC/rel
    backup = CHECK/'baseline'/rel
    backup.parent.mkdir(exist_ok=True,parents=True)
    if not backup.exists(): shutil.copy2(current,backup)
    dest = current.with_suffix('.next.zip')
    with zipfile.ZipFile(current) as old, zipfile.ZipFile(dest,'w') as new:
        new.comment = old.comment
        for info in old.infolist():
            new.writestr(info,replacement.get(info.filename,old.read(info.filename)))
    dest.replace(current)

# Swap only each cover's PDF image object. Text, page arrangement and other images remain intact.
pdf = PUBLIC/'downloads/jev-all-versions.pdf'
doc = fitz.open(CHECK/'baseline/jev-all-versions.pdf')
pdf_pages = []
offset = 0
for g in data['groups']:
    if g['version'] in colors:
        page = doc[offset]
        assert g['version'] in page.get_text()
        first = min(page.get_image_info(xrefs=True),key=lambda im:im['bbox'][0])
        assert first['bbox'][0] == 32
        page.replace_image(first['xref'],filename=str(COVERS/(g['version']+'.jpg')))
        pdf_pages.append(offset)
    offset += (len(g['pages'])+3)//4+1
assert offset == len(doc) == 58
doc.save(pdf,garbage=4,deflate=True)
doc.close()
(CHECK/'pdf-cover-pages.json').write_text(json.dumps(pdf_pages),encoding='utf-8')

comparison = (PUBLIC/'covers.html').read_text('utf-8')
comparison = comparison.replace('A4-4 鼠尾草绿 · A4-6 陶土粉 · A4-8 灰紫。点击首图查看完整图文。','未发布首图采用蓝、绿、陶土粉底色。A4-4、A4-5、A4-8、A4-9 已发布，不可选中。')
comparison = comparison.replace('A4-4、A4-5、A4-8 已发布','A4-4、A4-5、A4-8、A4-9 已发布')
def status(match):
    figure = match.group(0)
    v = re.search(r'#post/(A4-\d+)',figure)
    if v and v.group(1) in PUBLISHED:
        figure = re.sub(r'<a href="[^"]+">','<div>',figure,count=1).replace('</a>','</div>')
        figure = figure.replace('</figcaption>','<br><strong>已发布 不可选中</strong></figcaption>')
    return figure
comparison = re.sub(r'<figure>.*?</figure>',status,comparison,flags=re.S)
(PUBLIC/'covers.html').write_text(comparison,encoding='utf-8')
assert max(p.stat().st_size for p in PUBLIC.rglob('*') if p.is_file()) < 25*1024*1024
print(json.dumps({'published':sorted(PUBLISHED),'covers':len(colors),'packages':len(packages),'pdfPages':58,'pdfMiB':round(pdf.stat().st_size/1024**2,2)}))
