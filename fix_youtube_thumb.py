import re

with open('index.html', 'r') as f:
    html = f.read()

# Replace the image src for Cosmic Horizon
# Old src might be the long lh3.googleusercontent.com link
# We want to replace it with https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg
# Let's find the Cosmic Horizon card image
old_img = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGDGk7K_iyqyKh6ADXkqC4EUsmAaAaFFMcFcQG_1vqTCNgI2pofWNxFdEo8fuwPyR3w6xBJh2jCymDtiU97ey6f0DuXsjr21Z2a2mD2pKmU2ljrg-0c63xMmJg5FcClLpK3lJP4qCO2MscKv__zGYpX5005C0ipQ31QpAfsy2rAJqakrM0EigVPQEkVW5UbeKQug6I5z1iZAjybmmYX-4SbsCu-5i2pWpEyqSD3C83twkU0coUn9f3Wg'
new_img = 'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg'

if old_img in html:
    html = html.replace(old_img, new_img)

with open('index.html', 'w') as f:
    f.write(html)

print("Updated Cosmic Horizon thumbnail.")
