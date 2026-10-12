"""Build V2 UI without rewriting approved images, captions or download packages."""
from pathlib import Path
import json
import re
import subprocess

REPO = Path(__file__).resolve().parents[1]
V1_COMMIT = '58f7d4c033c802879dcd1a7bdaeb90a5ae76b52d'
HTML_ROUTES = ['index.html'] + [f'versions/{name}/index.html' for name in ['a4-1', 'a1-3', 'a2-3', 'a2-4', 'a3-2']]

def build_ui():
    public = REPO / 'public'
    written = set()
    def write(name, content):
        dest = public / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content if isinstance(content, bytes) else content.encode('utf-8'))
        written.add(name)

    # V1 shares the immutable original media. Only navigation is scoped to /v1/.
    for route in HTML_ROUTES:
        dest = public / 'v1' / route
        if not dest.exists():
            original = subprocess.check_output(['git', 'show', f'{V1_COMMIT}:public/{route}'], cwd=REPO).decode('utf-8')
            def keep_v1(match):
                url = match.group(2)
                if url == '/' or re.match(r'^/versions/(a4-1|a1-3|a2-3|a2-4|a3-2)/(?:index\.html)?(?:#.*)?$', url):
                    url = '/v1' + url
                return match.group(1) + url + match.group(3)
            original = re.sub(r'(href=["\'])([^"\']+)(["\'])', keep_v1, original)
            write('v1/' + route, original)
        else:
            written.add('v1/' + route)

    shell = (REPO / 'web/index.html').read_bytes()
    for route in HTML_ROUTES:
        write(route, shell)
    for name in ['style.css', 'app.js', 'icon.svg']:
        write('app/' + name, (REPO / 'web' / name).read_bytes())
    data = json.loads((public / 'site-data.json').read_text(encoding='utf-8'))
    captions = []
    for group in data['groups']:
        full = (public / group['caption'].lstrip('/')).read_text(encoding='utf-8').replace('\r\n', '\n').strip()
        assert full.split('\n', 1)[0] == group['title'], group['version']
        group['fullText'] = full
        group['body'] = full.split('\n', 1)[1].lstrip('\n')
        group['preview'] = '/#post/' + group['version']
        captions.append(group['version'] + ' · ' + group['category'] + '\n\n' + full)
    data['uiVersion'] = 'V2'
    data['previousPreview'] = '/v1/'
    write('site-data.json', json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    write('downloads/jev-all-captions.txt', '\n\n' + ('\n\n' + '=' * 40 + '\n\n').join(captions) + '\n')
    return written

if __name__ == '__main__':
    written = build_ui()
    print(json.dumps({'uiVersion': 'V2', 'previousPreview': '/v1/', 'updatedFiles': len(written)}, ensure_ascii=False))
