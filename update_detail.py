import re

with open('detail.html', 'r') as f:
    html = f.read()

# 1. Reduce font size in Synopsis
html = html.replace('font-body-lg text-body-lg', 'font-body-md text-body-md')
html = html.replace('font-body-md text-body-md', 'text-[14px] leading-relaxed')

# 2. Translate Indonesian text to English
translations = {
    # Breadcrumbs & Header
    "Arsip Karya": "Archive",
    "Film Sinematik": "Cinematic Film",
    
    # Title & Meta
    "SCI-FI SPEKULATIF": "SPECULATIVE SCI-FI",
    "SINEMA SINTETIS": "SYNTHETIC CINEMA",
    "NUSANTARA MYTHOS": "NUSANTARA MYTHOS",
    "KARYA RESIDENSI IFAI BIENNALE 2025 // ARSIP SINEMA GENERATIF ID-884": "IFAI BIENNALE 2025 RESIDENCY // GENERATIVE CINEMA ARCHIVE ID-884",
    
    # Synopsis
    "Sinopsis &amp; Konsep Kurasi": "Synopsis &amp; Curatorial Concept",
    "Di pengujung siklus kosmik abad ke-32, stasiun navigasi <span class=\"text-primary font-medium\">Suryakanta-7</span> melintasi anomali topologi ruang latent yang dikenal sebagai <em class=\"text-on-surface italic\">Lembah Awan Aethel</em>. Menggabungkan geometri mandala Candi Borobudur dengan fisika lubang cacing hiperdimensi, ekspedisi ini menguji batas kesadaran para pelaut bintang yang dipandu oleh kecerdasan buatan arkais berbasis kidung Sunda Kuno.": "At the cosmic cycle's end in the 32nd century, the <span class=\"text-primary font-medium\">Suryakanta-7</span> navigation station traverses a latent space topological anomaly known as the <em class=\"text-on-surface italic\">Aethel Cloud Valley</em>. Fusing the mandala geometry of Borobudur Temple with hyperdimensional wormhole physics, this expedition tests the limits of star-sailors' consciousness, guided by an archaic AI based on ancient Sundanese hymns.",
    "Karya ini merupakan meditasi sinematik atas spiritualitas Nusantara di tengah mekanika komputasi kuantum. Visual yang terus bermutasi menantang persepsi pemirsa tentang kontinuitas temporal, di mana setiap artefak candi, nebula gas neon, dan relik kuno saling berkelindan melalui tensor matematis probabilistik.": "This work is a cinematic meditation on Nusantara spirituality amidst quantum computational mechanics. The ever-mutating visuals challenge the viewer's perception of temporal continuity, where every temple artifact, neon gas nebula, and ancient relic intertwines through probabilistic mathematical tensors.",
    "Dewan Kurator IFAI:": "IFAI Curatorial Board:",
    "Akreditasi Klasik Generatif A+": "Generative Classic Accreditation A+",
    
    # Tech Notes
    "Tahap 01 // Sintesis Visual": "Stage 01 // Visual Synthesis",
    "Eksplorasi estetika menggunakan <span class=\"text-on-surface\">Flux.1 Schnell &amp; Midjourney v6</span> yang kemudian disuntikkan ke checkpoint SDXL berbobot LoRA ukiran candi abad ke-8.": "Aesthetic exploration using <span class=\"text-on-surface\">Flux.1 Schnell &amp; Midjourney v6</span> injected into an SDXL checkpoint weighted with an 8th-century temple carving LoRA.",
    "Tahap 02 // Dinamika Gerak": "Stage 02 // Motion Dynamics",
    "Interpolasi gerak kamera berkecepatan variabel dengan vector field ComfyUI kustom untuk mempertahankan konsistensi partikel debu antariksa dan tenun kabut nebula.": "Variable-speed camera motion interpolation with custom ComfyUI vector fields to maintain the consistency of space dust particles and nebula mist weaving.",
    "Tahap 03 // Spatial Upscaling": "Stage 03 // Spatial Upscaling",
    "Pemulihan frekuensi tinggi dan upscaling native 1080p ke 4K DCI 60FPS dengan modul de-flicker neural untuk menghilangkan temporal micro-jittering.": "High-frequency restoration and native upscaling from 1080p to 4K DCI 60FPS with a neural de-flicker module to eliminate temporal micro-jittering.",
    
    # Prompt Inspector
    "Salin Prompt": "Copy Prompt",
    "Tersalin!": "Copied!",
    
    # Gallery
    "Galeri Frame Stills &amp; Latent Milestones": "Frame Stills &amp; Latent Milestones Gallery",
    "4 KEYFRAMES DIARSIPKAN": "4 ARCHIVED KEYFRAMES",
    "Orbit Suryakanta": "Suryakanta Orbit",
    "Antarmuka Astronav": "Astronav Interface",
    "Lembah Awan Aethel": "Aethel Cloud Valley",
    "Inti Sintetis Nirwana": "Synthetic Nirvana Core",
    
    # Creator
    "Bandung, Jawa Barat // ID": "Bandung, West Java // ID",
    "Pengikut Arsip": "Archive Followers",
    "Kolektif sinematik AI independen pelopor fusi fiksi ilmiah spekulatif dengan ontologi mitos lokal Nusantara. Berbasis di laboratorium riset komputasi Bandung.": "Independent AI cinematic collective pioneering the fusion of speculative sci-fi with local Nusantara myth ontology. Based in a Bandung computational research lab.",
    "Ikuti Kolektif": "Follow Collective",
    
    # Specs
    "LISENSI ARSIP &amp; MODEL": "ARCHIVE &amp; MODEL LICENSE",
    "HASH TANDA TANGAN KRIPTOGRAFIS": "CRYPTOGRAPHIC SIGNATURE HASH",
    "Tertarik Mengkaji Model Ini?": "Interested in Studying This Model?",
    "Anggota komputasi IFAI Creator Hub dapat mengajukan akses langsung ke checkpoint LoRA dan dataset pelatihan karya ini untuk keperluan riset non-komersial.": "IFAI Creator Hub computational members can request direct access to this work's LoRA checkpoint and training dataset for non-commercial research purposes.",
    "Ajukan Akses Riset →": "Request Research Access →",
    
    # More Works
    "Katalog Rekomendasi": "Recommended Catalog",
    "Karya AI Terkait": "Related AI Works",
    "Lihat Seluruh Arsip Sinema": "View Full Cinema Archive",
    "Oleh Neon Heart Lab // Jakarta": "By Neon Heart Lab // Jakarta",
    "Eksplorasi emosi komputasional dan residu afeksi manusia dalam replika android yang tersisa di megacity Nusantara 2089.": "Exploration of computational emotion and residual human affection in the remaining android replicas in the Nusantara 2089 megacity.",
    "Skor Kurasi:": "Curation Score:",
    "Lihat Detail": "View Details",
    "Oleh Halcyon Lab // Bali": "By Halcyon Lab // Bali",
    "Koreografi algoritma pertumbuhan flora endemik nusantara dengan simulasi metabolisme sintetis dan lanskap suara organik.": "Algorithmic choreography of endemic Nusantara flora growth with synthetic metabolism simulation and organic soundscapes.",
    "Oleh NovaWorks // Yogyakarta": "By NovaWorks // Yogyakarta",
    "Rekonstruksi arsip memori kolektif era transisi digital Nusantara menggunakan model rekursif temporal auto-regresif.": "Reconstruction of the collective memory archive of Nusantara's digital transition era using an auto-regressive temporal recursive model.",
    
    # Action Bar
    "Bagikan": "Share",
    "Tautan karya disalin ke clipboard!": "Artwork link copied to clipboard!"
}

for indo, eng in translations.items():
    html = html.replace(indo, eng)

with open('detail.html', 'w') as f:
    f.write(html)

print("Updated font size and translated to English.")
