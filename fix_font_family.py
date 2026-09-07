import re

files = ['index.html', 'detail.html']

for file_path in files:
    with open(file_path, 'r') as f:
        html = f.read()

    # 1. For index.html, we need to make sure Plus Jakarta Sans is imported
    if file_path == 'index.html':
        if 'Plus+Jakarta+Sans' not in html:
            html = html.replace('family=Space+Grotesk', 'family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk')
        if 'jakarta:' not in html:
            # Add jakarta to tailwind config
            html = html.replace("mono: ['JetBrains Mono', 'monospace'],", "mono: ['JetBrains Mono', 'monospace'],\n            jakarta: ['Plus Jakarta Sans', 'sans-serif'],")

    # 2. Add font-jakarta to the nav links in the header in BOTH files
    # The current nav class is: class="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide"
    # We want to add font-jakarta (for index.html) and font-body-md (for detail.html, which maps to Jakarta) 
    # Or to be safe, just inline the font-family or use a consistent class.
    # In index.html, we just added 'font-jakarta'.
    # In detail.html, 'font-body-md' is Jakarta. Let's just use inline style for 100% guarantee, or add font-jakarta to detail.html too.
    
    if file_path == 'index.html':
        html = re.sub(
            r'<nav class="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">',
            r'<nav class="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide font-jakarta">',
            html
        )
    elif file_path == 'detail.html':
        html = re.sub(
            r'<nav class="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">',
            r'<nav class="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide font-body-md">',
            html
        )

    with open(file_path, 'w') as f:
        f.write(html)

print("Applied Plus Jakarta Sans to the header menu in both files.")
