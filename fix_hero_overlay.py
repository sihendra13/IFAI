with open('index.html', 'r') as f:
    html = f.read()

# 1. Change video opacity from opacity-80 to opacity-100 so it's bright and clear
html = html.replace('class="absolute top-0 left-0 w-full h-full object-cover opacity-80 pointer-events-none"',
                    'class="absolute top-0 left-0 w-full h-full object-cover opacity-100 pointer-events-none"')

# 2. Change the black overlay gradient
old_gradient = '<div class="absolute inset-0 bg-gradient-to-b from-cosmic-950/40 via-cosmic-900/60 to-cosmic-950 z-0 pointer-events-none"></div>'
# Make it mostly transparent, dark only at the very top (for navbar) and bottom (for text)
new_gradient = '<div class="absolute inset-0 bg-gradient-to-b from-cosmic-950/30 via-transparent to-cosmic-950 z-0 pointer-events-none"></div>'

html = html.replace(old_gradient, new_gradient)

with open('index.html', 'w') as f:
    f.write(html)

print("Updated hero overlay.")
