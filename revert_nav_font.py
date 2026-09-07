import re

files = ['index.html', 'detail.html']

for file_path in files:
    with open(file_path, 'r') as f:
        html = f.read()

    # Revert nav wrapper
    html = re.sub(
        r'<nav class="hidden md:flex items-center space-x-8 text-\[17px\] font-medium tracking-wide">',
        r'<nav class="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">',
        html
    )

    # Revert Log In button
    html = re.sub(
        r'<a class="hidden sm:inline-block text-\[15px\] font-medium font-mono text-zinc-300',
        r'<a class="hidden sm:inline-block text-xs font-mono text-zinc-300',
        html
    )
    
    # Revert Join Community button
    html = re.sub(
        r'text-\[14px\] font-semibold tracking-wider uppercase overflow-hidden',
        r'text-xs font-semibold tracking-wider uppercase overflow-hidden',
        html
    )

    with open(file_path, 'w') as f:
        f.write(html)

print("Reverted nav fonts in both files.")
