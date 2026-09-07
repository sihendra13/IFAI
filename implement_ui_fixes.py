import re

with open('index.html', 'r') as f:
    html = f.read()

# 1. Add Marquee CSS
marquee_css = '''
    /* Hide scrollbars in showcase reels while maintaining touch scroll */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    
    /* Marquee Animation */
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      display: flex;
      width: max-content;
      animation: marquee 30s linear infinite;
    }
    .animate-marquee:hover {
      animation-play-state: paused;
    }
'''
html = html.replace('''    /* Hide scrollbars in showcase reels while maintaining touch scroll */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }''', marquee_css)

# 2. Modify Logo Container
logo_html = '''<div class="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
<span class="text-sm sm:text-base font-mono font-bold tracking-tighter text-zinc-300 hover:text-white">OpenAI</span>
<span class="text-sm sm:text-base font-sans font-bold tracking-tight text-zinc-300 hover:text-white">Adobe Firefly</span>
<span class="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 hover:text-white">Runway</span>
<span class="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 hover:text-white">NVIDIA</span>
<span class="text-sm sm:text-base font-serif italic text-zinc-300 hover:text-white">Midjourney</span>
<span class="text-sm sm:text-base font-sans font-medium text-zinc-300 hover:text-white">Google Cloud</span>
<span class="text-sm sm:text-base font-mono text-zinc-300 hover:text-white">Azure AI</span>
<span class="text-sm sm:text-base font-sans font-bold tracking-wider text-zinc-300 hover:text-white">EKRAF</span>
</div>'''

marquee_html = '''<div class="relative overflow-hidden w-full max-w-full flex">
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
html = html.replace(logo_html, marquee_html)

# 3. Standardize Cards (h-full + uniform glow + uniform hover text color)
# Find all <article class="group relative rounded-2xl overflow-hidden bg-cosmic-850 border border-zinc-800/80 hover:border-... transition-all duration-300 flex flex-col">
# Replace with: <article class="group relative rounded-2xl overflow-hidden bg-cosmic-850 border border-zinc-800/80 hover:border-neon-emerald/50 hover:shadow-[0_0_30px_rgba(0,255,157,0.15)] transition-all duration-300 flex flex-col h-full">
article_pattern = r'<article class="group relative rounded-2xl overflow-hidden bg-cosmic-850 border border-zinc-800/80 hover:border-[^"]+ transition-all duration-300 flex flex-col">'
standard_article = '<article class="group relative rounded-2xl overflow-hidden bg-cosmic-850 border border-zinc-800/80 hover:border-neon-emerald/50 hover:shadow-[0_0_30px_rgba(0,255,157,0.15)] transition-all duration-300 flex flex-col h-full">'
html = re.sub(article_pattern, standard_article, html)

# We also want to make sure the card title hover and button hover is consistent.
# Cyan titles -> Emerald titles
html = html.replace('group-hover:text-neon-cyan', 'group-hover:text-neon-emerald')
# Amber titles -> Emerald titles
html = html.replace('group-hover:text-amber-400', 'group-hover:text-neon-emerald')

# Cyan buttons -> Emerald buttons
html = html.replace('hover:bg-neon-cyan', 'hover:bg-neon-emerald')
# Amber buttons -> Emerald buttons
html = html.replace('hover:bg-amber-400', 'hover:bg-neon-emerald')

with open('index.html', 'w') as f:
    f.write(html)

print("Updated index.html successfully.")
