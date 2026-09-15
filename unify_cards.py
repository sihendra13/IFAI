import re

with open('index.html', 'r') as f:
    html = f.read()

# Replace the class content for all showcase cards
class_pattern = r'class="[^"]*rounded-2xl overflow-hidden bg-cosmic-850 border border-zinc-800[^"]*"'
unified_class = 'class="group relative rounded-2xl overflow-hidden bg-cosmic-850 border border-zinc-800/80 hover:border-neon-emerald/50 hover:shadow-[0_0_30px_rgba(0,255,157,0.25)] transition-all duration-300 flex flex-col h-full"'
html = re.sub(class_pattern, unified_class, html)

# 2. Make sure the inner div is flex-grow so h-full works on Commercial, Music, Visual Art
html = html.replace('<div class="p-4">', '<div class="p-4 flex flex-col justify-between flex-grow">')

# 3. Add the Explore Reel button to all images that don't have it
# Film already has it. Commercial, Music, Visual Art don't.
# They look like: <span class="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white border border-white/10">Commercial AI</span>\n</div>
# Let's add the button right before the closing </div> of the image container.
button_html = '''
<a href="detail.html" class="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-1.5 rounded-full bg-white/10 hover:bg-neon-emerald hover:text-black backdrop-blur-md border border-white/20 text-xs font-mono text-white">
                Explore Reel →
              </a>
</div>'''
# Replace </span>\n</div> with </span>\n{button_html} for Commercial, Music, Visual Art
# We can match </span>\n</div> in the context of the chips.
chip_pattern = r'(<span class="absolute top-3 right-3[^>]*>.*?</span>)\s*</div>'
def add_button(match):
    chip = match.group(1)
    # Check if we're in Film section (it already has the button)
    # Wait, Film has the button, so it looks like:
    # <span ...>Film</span>\n<a ...>Explore Reel</a>\n</div>
    # The regex only matches if it's </span>\n</div> directly!
    return f'{chip}{button_html}'

html = re.sub(chip_pattern, add_button, html)

with open('index.html', 'w') as f:
    f.write(html)

print("Unified cards successfully.")
