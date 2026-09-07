import re

with open('index.html', 'r') as f:
    html = f.read()

# 1. Add whitespace-nowrap to all spans in the marquee
# Let's replace the marquee block completely
marquee_html_old = '''<div class="relative overflow-hidden w-full max-w-full flex">
<div class="animate-marquee flex items-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
<span class="text-sm sm:text-base font-mono font-bold tracking-tighter text-zinc-300 hover:text-white">OpenAI</span>
<span class="text-sm sm:text-base font-sans font-bold tracking-tight text-zinc-300 hover:text-white">Adobe Firefly</span>
<span class="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 hover:text-white">Runway</span>
<span class="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 hover:text-white">NVIDIA</span>
<span class="text-sm sm:text-base font-serif italic text-zinc-300 hover:text-white">Midjourney</span>
<span class="text-sm sm:text-base font-sans font-medium text-zinc-300 hover:text-white">Google Cloud</span>
<span class="text-sm sm:text-base font-mono text-zinc-300 hover:text-white">Azure AI</span>
<span class="text-sm sm:text-base font-sans font-bold tracking-wider text-zinc-300 hover:text-white pl-8 sm:pl-14">EKRAF</span>
<!-- DUPLICATE FOR INFINITE LOOP -->
<span class="text-sm sm:text-base font-mono font-bold tracking-tighter text-zinc-300 hover:text-white">OpenAI</span>
<span class="text-sm sm:text-base font-sans font-bold tracking-tight text-zinc-300 hover:text-white">Adobe Firefly</span>
<span class="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 hover:text-white">Runway</span>
<span class="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 hover:text-white">NVIDIA</span>
<span class="text-sm sm:text-base font-serif italic text-zinc-300 hover:text-white">Midjourney</span>
<span class="text-sm sm:text-base font-sans font-medium text-zinc-300 hover:text-white">Google Cloud</span>
<span class="text-sm sm:text-base font-mono text-zinc-300 hover:text-white">Azure AI</span>
<span class="text-sm sm:text-base font-sans font-bold tracking-wider text-zinc-300 hover:text-white pr-8 sm:pr-14">EKRAF</span>
</div>
</div>'''

marquee_html_new = '''<div class="relative overflow-hidden w-full max-w-full flex">
<div class="animate-marquee flex items-center gap-12 sm:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-300 whitespace-nowrap">
<span class="text-sm sm:text-base font-mono font-bold tracking-tighter text-zinc-300 hover:text-white whitespace-nowrap">OpenAI</span>
<span class="text-sm sm:text-base font-sans font-bold tracking-tight text-zinc-300 hover:text-white whitespace-nowrap">Adobe Firefly</span>
<span class="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 hover:text-white whitespace-nowrap">Runway</span>
<span class="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 hover:text-white whitespace-nowrap">NVIDIA</span>
<span class="text-sm sm:text-base font-serif italic text-zinc-300 hover:text-white whitespace-nowrap">Midjourney</span>
<span class="text-sm sm:text-base font-sans font-medium text-zinc-300 hover:text-white whitespace-nowrap">Google Cloud</span>
<span class="text-sm sm:text-base font-mono text-zinc-300 hover:text-white whitespace-nowrap">Azure AI</span>
<span class="text-sm sm:text-base font-sans font-bold tracking-wider text-zinc-300 hover:text-white whitespace-nowrap pr-8 sm:pr-16">EKRAF</span>
<!-- DUPLICATE FOR INFINITE LOOP -->
<span class="text-sm sm:text-base font-mono font-bold tracking-tighter text-zinc-300 hover:text-white whitespace-nowrap">OpenAI</span>
<span class="text-sm sm:text-base font-sans font-bold tracking-tight text-zinc-300 hover:text-white whitespace-nowrap">Adobe Firefly</span>
<span class="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 hover:text-white whitespace-nowrap">Runway</span>
<span class="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 hover:text-white whitespace-nowrap">NVIDIA</span>
<span class="text-sm sm:text-base font-serif italic text-zinc-300 hover:text-white whitespace-nowrap">Midjourney</span>
<span class="text-sm sm:text-base font-sans font-medium text-zinc-300 hover:text-white whitespace-nowrap">Google Cloud</span>
<span class="text-sm sm:text-base font-mono text-zinc-300 hover:text-white whitespace-nowrap">Azure AI</span>
<span class="text-sm sm:text-base font-sans font-bold tracking-wider text-zinc-300 hover:text-white whitespace-nowrap pr-8 sm:pr-16">EKRAF</span>
</div>
</div>'''

html = html.replace(marquee_html_old, marquee_html_new)

# If the strict replace failed due to spaces, let's just use regex for span tags inside the marquee
if 'whitespace-nowrap' not in html:
    print("Direct replace failed, using regex for logos")

# 2. Fix the aspect ratio of Commercial, Music, Visual Art cards
# They currently use <div class="relative aspect-square overflow-hidden">
# Film uses <div class="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
# Let's replace aspect-square with aspect-[3/4] and aspect-video (if any) with aspect-[3/4]
# to make them perfectly uniform!

html = html.replace('aspect-square', 'aspect-[3/4]')
html = html.replace('aspect-video', 'aspect-[3/4]')

# Also add w-full and bg-zinc-900 to ensure they match exactly
html = html.replace('class="relative aspect-[3/4] overflow-hidden"', 'class="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900"')

with open('index.html', 'w') as f:
    f.write(html)

print("Updated index.html successfully.")
