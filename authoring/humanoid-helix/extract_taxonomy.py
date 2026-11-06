"""Extracts the "Full Taxonomy" sheet of Humanoid-Skill-Helix-Taxonomy.xlsx to JSON (standard library only).

    python authoring/humanoid-helix/extract_taxonomy.py

Reads imports/humanoid-helix/Humanoid-Skill-Helix-Taxonomy.xlsx and writes
imports/humanoid-helix/Full-Taxonomy.json: one record per node, keyed by the Node ID column. The Skill
Code column is kept for reference only; it is regenerated on every export and is never an identifier.
"""
import hashlib, json, re, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'imports' / 'humanoid-helix' / 'Humanoid-Skill-Helix-Taxonomy.xlsx'
OUT = ROOT / 'imports' / 'humanoid-helix' / 'Full-Taxonomy.json'
M = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def col(ref):
    n = 0
    for ch in re.match(r'[A-Z]+', ref).group(0):
        n = n * 26 + ord(ch) - 64
    return n - 1


def sheet_rows(path, wanted):
    z = zipfile.ZipFile(path)
    shared = [''.join(t.text or '' for t in si.iter(f'{{{M}}}t'))
              for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(f'{{{M}}}si')]
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    part = None
    for s in ET.fromstring(z.read('xl/workbook.xml')).find(f'{{{M}}}sheets'):
        if s.get('name') == wanted:
            target = rels[s.get(f'{{{R}}}id')]
            part = target.lstrip('/') if target.startswith('/') else 'xl/' + target
    if part is None:
        raise SystemExit(f'No sheet named {wanted!r}.')
    for row in ET.fromstring(z.read(part)).iter(f'{{{M}}}row'):
        cells = {}
        for c in row.findall(f'{{{M}}}c'):
            v, t = c.find(f'{{{M}}}v'), c.get('t')
            if t == 's' and v is not None:
                val = shared[int(v.text)]
            elif t == 'inlineStr':
                val = ''.join(x.text or '' for x in c.iter(f'{{{M}}}t'))
            else:
                val = v.text if v is not None else None
            cells[col(c.get('r'))] = val
        if cells:
            yield [cells.get(i) for i in range(max(cells) + 1)]


def main():
    rows = list(sheet_rows(SRC, 'Full Taxonomy'))
    header = rows[0]
    records = {}
    for r in rows[1:]:
        rec = dict(zip(header, r + [None] * (len(header) - len(r))))
        node_id = rec['Node ID']
        if not node_id:
            continue
        if node_id in records:
            raise SystemExit(f'Duplicate Node ID {node_id!r} in the Full Taxonomy sheet.')
        records[node_id] = {k: rec[k] for k in header}
    out = {'source': SRC.name, 'sha256': hashlib.sha256(SRC.read_bytes()).hexdigest(), 'sheet': 'Full Taxonomy',
           'columns': header, 'count': len(records), 'nodes': records}
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Wrote {OUT.relative_to(ROOT)}: {len(records)} nodes, columns {header}')


if __name__ == '__main__':
    main()
