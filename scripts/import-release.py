"""Stage a validated static release; no dependency installation is required for Pages."""
from pathlib import Path
import argparse,hashlib,json,shutil

repo=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,required=True,help='Release directory containing site/ and manifest.json')
args=parser.parse_args();source=args.source.resolve();site=source/'site'
data=json.loads((site/'site-data.json').read_text('utf8'))
assert len(data['groups'])==19
assert sum(len(g['pages']) for g in data['groups'])==154
assert (site/'previous/site-data.json').exists() and (site/'v1/index.html').exists()
for g in data['groups']:
 for p in g['pages']:
  assert hashlib.sha256((site/p['url'].lstrip('/')).read_bytes()).hexdigest()==p['sha256']
for f in site.rglob('*'):
 if f.is_file():assert f.stat().st_size<=25*1024*1024,f
stage=(repo/'checks/public-next').resolve()
assert stage.parent==repo/'checks' and not stage.exists()
shutil.copytree(site,stage)
# Only website-ready assets are copied. Authoring sources, research PDFs and checks remain local.
for name in ['index.html']:
 shutil.copy2(stage/name,repo/'web'/name)
for name in ['app.js','style.css','icon.svg']:
 shutil.copy2(stage/'app'/name,repo/'web'/name)
print(json.dumps({'staged':str(stage),'versions':len(data['groups']),'images':154},ensure_ascii=False))
