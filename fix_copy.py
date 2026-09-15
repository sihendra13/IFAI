with open('detail.html', 'r') as f:
    html = f.read()

html = html.replace('Recommended Catalog', 'UP NEXT')
html = html.replace('Related AI Works', 'More to Explore')

with open('detail.html', 'w') as f:
    f.write(html)
print("Copy updated.")
