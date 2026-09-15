import re

with open('index.html', 'r') as f:
    html = f.read()

# The grid line to remove
grid_div = r'<div class="absolute inset-0 bg-\[linear-gradient\(to_right,#161820_1px,transparent_1px\),linear-gradient\(to_bottom,#161820_1px,transparent_1px\)\] bg-\[size:4rem_4rem\] \[mask-image:radial-gradient\(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%\)\] opacity-30 pointer-events-none"></div>'

html = re.sub(grid_div, '', html)

with open('index.html', 'w') as f:
    f.write(html)

print("Removed grid overlay.")
