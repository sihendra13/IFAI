import re

files = ['index.html', 'detail.html']

for file_path in files:
    with open(file_path, 'r') as f:
        html = f.read()

    # Change the nav wrapper to use a slightly larger font size
    # From: <nav class="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">
    # To:   <nav class="hidden md:flex items-center space-x-8 text-[17px] font-medium tracking-wide">
    html = re.sub(
        r'<nav class="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">',
        r'<nav class="hidden md:flex items-center space-x-8 text-[17px] font-medium tracking-wide">',
        html
    )

    # Change the Log In button text size
    # From: <a class="hidden sm:inline-block text-xs font-mono text-zinc-300
    # To:   <a class="hidden sm:inline-block text-[15px] font-medium font-mono text-zinc-300
    html = re.sub(
        r'<a class="hidden sm:inline-block text-xs font-mono text-zinc-300',
        r'<a class="hidden sm:inline-block text-[15px] font-medium font-mono text-zinc-300',
        html
    )
    
    # Change the Join Community button text size
    # From: text-xs font-semibold tracking-wider uppercase
    # To:   text-[14px] font-semibold tracking-wider uppercase
    html = re.sub(
        r'text-xs font-semibold tracking-wider uppercase overflow-hidden',
        r'text-[14px] font-semibold tracking-wider uppercase overflow-hidden',
        html
    )

    with open(file_path, 'w') as f:
        f.write(html)

print("Updated nav fonts in both files.")
