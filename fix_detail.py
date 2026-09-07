import re

with open('index.html', 'r') as f:
    index_content = f.read()

# Extract header from index.html
header_match = re.search(r'(<!-- BEGIN: MainHeader -->.*?<!-- END: MainHeader -->)', index_content, re.DOTALL)
if header_match:
    index_header = header_match.group(1)
    
    # We need to change bg-transparent to bg-cosmic-950/80 backdrop-blur-xl border-zinc-800/80 so it's always dark on detail page
    index_header = index_header.replace('bg-transparent border-b border-transparent', 'bg-cosmic-950/80 backdrop-blur-xl border-b border-zinc-800/80')
    index_header = index_header.replace('href="#showcase"', 'href="index.html#showcase"')
    index_header = index_header.replace('href="#programs"', 'href="index.html#programs"')
    index_header = index_header.replace('href="#manifesto"', 'href="index.html#manifesto"')
    
    with open('detail.html', 'r') as f:
        detail_content = f.read()
        
    # Find the header in detail.html
    # It starts with <header class="fixed and ends right before <main
    detail_content = re.sub(r'<header class="fixed.*?</header>', index_header, detail_content, flags=re.DOTALL)
    
    # Let's also fix the duplicate breadcrumb!
    # In detail.html, there's a breadcrumb section: <section class="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
    # Actually, if we replaced the header, the breadcrumb inside the old header is GONE! 
    # That solves the duplicate breadcrumb issue automatically because the index header doesn't have a breadcrumb.
    
    # We should also copy the tailwind config from index.html to detail.html so the header colors (cosmic, neon) work
    # We can inject the cosmic and neon colors into detail.html's tailwind config
    cosmic_neon_colors = '"cosmic-950": "#050507", "cosmic-900": "#0a0a0c", "cosmic-850": "#101116", "cosmic-800": "#161820", "cosmic-700": "#222533", "neon-emerald": "#00FF9D", "neon-cyan": "#00E5FF", "neon-purple": "#A855F7",'
    detail_content = detail_content.replace('"colors": {', f'"colors": {{ {cosmic_neon_colors}')
    
    # We also need the glow classes
    glow_classes = '''
    <style data-purpose="custom-typography-and-scroll">
    .glow-cyan {
      box-shadow: 0 0 25px -4px rgba(0, 229, 255, 0.35);
    }
    .glow-emerald {
      box-shadow: 0 0 25px -4px rgba(0, 255, 157, 0.35);
    }
    .text-glow-neon {
      text-shadow: 0 0 16px rgba(0, 255, 157, 0.45);
    }
    </style>
    '''
    detail_content = detail_content.replace('</head>', f'{glow_classes}</head>')

    with open('detail.html', 'w') as f:
        f.write(detail_content)
    
    print("Successfully replaced header and added Tailwind colors!")
else:
    print("Could not find header in index.html")
