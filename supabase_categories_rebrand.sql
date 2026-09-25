-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- Renames the categories table's name_en/name_id to match the new
-- Showcase branding already live in index.html's code (homepage titles),
-- so /category?slug=... pages and anywhere else that reads categories.name_en
-- /name_id (e.g. admin.html's Works list) show the same names.

update public.categories set name_en = 'Film Showcase', name_id = 'Film Showcase' where slug = 'film';
update public.categories set name_en = 'Commercial Showcase', name_id = 'Iklan Showcase' where slug = 'commercial';
update public.categories set name_en = 'Animation Showcase', name_id = 'Animasi Showcase' where slug = 'animation';
update public.categories set name_en = 'Music & Vocal Showcase', name_id = 'Musik & Vocal Showcase' where slug = 'music';
update public.categories set name_en = 'Visual Art Showcase', name_id = 'Visual Art Showcase' where slug = 'visual-art';
