import re

files = ['index.html', 'detail.html']

for file_path in files:
    with open(file_path, 'r') as f:
        html = f.read()

    # 1. Fix the logo link to point to index.html
    # In the header, the logo link looks like: <a class="flex items-center group focus:outline-none rounded" href="#">
    html = html.replace('<a class="flex items-center group focus:outline-none rounded" href="#">',
                        '<a class="flex items-center group focus:outline-none rounded" href="index.html">')
    
    # 2. Fix the "Explore Reel" buttons for mobile UX (index.html only)
    if file_path == 'index.html':
        # The button currently has: opacity-0 group-hover:opacity-100
        # We change it to: opacity-100 lg:opacity-0 lg:group-hover:opacity-100
        html = html.replace('opacity-0 group-hover:opacity-100', 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100')

    with open(file_path, 'w') as f:
        f.write(html)

print("Updated links and mobile UX.")
