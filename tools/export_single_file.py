"""Optional packaging, NOT a runtime build step.
index.html is already deployable as-is. Run this to refresh the offline single-file edition.
Uses only Python's standard library. Embeds local fonts, CSS, scripts, favicon and licenses.
"""
from pathlib import Path
import base64, re, html as html_utils
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'index.html').read_text()
css=(ROOT/'styles.css').read_text()
for font in ['cinzel','outfit']:
    data=base64.b64encode((ROOT/f'assets/fonts/{font}.woff2').read_bytes()).decode()
    css=css.replace(f"url('assets/fonts/{font}.woff2')",f"url('data:font/woff2;base64,{data}')")
source=re.sub(r'<link rel="preload"[^>]*>','',source)
source=source.replace('<link rel="stylesheet" href="styles.css">','<style>\n'+css+'\n</style>')
favicon=base64.b64encode((ROOT/'assets/favicon.svg').read_bytes()).decode()
source=source.replace('href="assets/favicon.svg"','href="data:image/svg+xml;base64,'+favicon+'"')
files=re.findall(r'<script src="([^"]+)" defer></script>',source)
assert len(files)==11,'Expected exactly the eleven tested native scripts'
script='\n\n'.join('/* ===== '+f+' ===== */\n'+(ROOT/f).read_text() for f in files)
# Avoid an accidental HTML raw-text closing tag if future comments contain it.
script=script.replace('</script','<\\/script')
source=re.sub(r'<script src="([^"]+)" defer></script>','',source)
licenses='\n\n'.join((ROOT/f'assets/fonts/{f}-OFL.txt').read_text() for f in ['Cinzel','Outfit'])
license_template='<template id="embeddedFontLicenses"><pre>'+html_utils.escape(licenses)+'</pre></template>'
source=source.replace('</body>',license_template+'\n<script>\n'+script+'\n</script>\n</body>')
source=source.replace('<html lang="en">','<html lang="en">\n<!-- Self-contained Golden Ace Royale edition. Generated from the same static source; no network required. -->',1)
output=ROOT/'Golden-Ace-Royale.html';output.write_text(source)
print(f'Exported {output.name}: {output.stat().st_size:,} bytes; fonts, art and logic all embedded.')
