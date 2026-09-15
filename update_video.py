with open('index.html', 'r') as f:
    html = f.read()

# Replace the current hero video source with the optimized balloon video
if 'image/hero-video.mp4' in html:
    html = html.replace('image/hero-video.mp4', 'image/balon_optimized.mp4')
elif 'hero-video.mp4' in html:
    html = html.replace('hero-video.mp4', 'image/balon_optimized.mp4')
else:
    print("Could not find hero-video.mp4 in html")

with open('index.html', 'w') as f:
    f.write(html)

print("Updated video source.")
