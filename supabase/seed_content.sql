-- Optional demo content for the Content Library. Run AFTER setup_all.sql.
do $$
declare a_surg uuid; a_im uuid; a_ped uuid; s1 uuid; s2 uuid; s3 uuid; t1 uuid; au1 uuid; au2 uuid; au3 uuid; i uuid;
begin
  insert into attachments (name) values ('Surgery') on conflict (name) do nothing;
  insert into attachments (name) values ('Internal Medicine') on conflict (name) do nothing;
  insert into attachments (name) values ('Pediatrics') on conflict (name) do nothing;
  select id into a_surg from attachments where name = 'Surgery';
  select id into a_im from attachments where name = 'Internal Medicine';
  select id into a_ped from attachments where name = 'Pediatrics';

  insert into subjects (attachment_id, name) values (a_surg, 'Acute abdomen') on conflict do nothing;
  insert into subjects (attachment_id, name) values (a_im, 'Hypertension') on conflict do nothing;
  insert into subjects (attachment_id, name) values (a_ped, 'Neonatal jaundice') on conflict do nothing;
  select id into s1 from subjects where attachment_id = a_surg and name = 'Acute abdomen';
  select id into s2 from subjects where attachment_id = a_im and name = 'Hypertension';
  select id into s3 from subjects where attachment_id = a_ped and name = 'Neonatal jaundice';

  insert into topics (subject_id, name) values (s1, 'Appendicitis') on conflict do nothing;
  select id into t1 from topics where subject_id = s1 and name = 'Appendicitis';

  insert into authors (name) values ('Dr. Najeeb') on conflict (name) do nothing;
  insert into authors (name) values ('Ninja Nerd') on conflict (name) do nothing;
  insert into authors (name) values ('Osmosis') on conflict (name) do nothing;
  select id into au1 from authors where name = 'Dr. Najeeb';
  select id into au2 from authors where name = 'Ninja Nerd';
  select id into au3 from authors where name = 'Osmosis';

  insert into content_items (kind, title, attachment_id, subject_id, topic_id, author_id, access, is_published)
    values ('video', 'Appendicitis — Complete Lecture', a_surg, s1, t1, au1, 'premium', true) returning id into i;
  insert into content_assets (item_id, source_type, url) values (i, 'external', 'https://www.youtube.com/results?search_query=Dr+Najeeb+appendicitis');

  insert into content_items (kind, title, attachment_id, subject_id, author_id, access, is_published)
    values ('video', 'Hypertension Made Simple', a_im, s2, au2, 'public', true) returning id into i;
  insert into content_assets (item_id, source_type, url) values (i, 'external', 'https://www.youtube.com/results?search_query=Ninja+Nerd+hypertension');

  insert into content_items (kind, title, attachment_id, subject_id, author_id, access, is_published)
    values ('book', 'Neonatal Jaundice — Quick Notes', a_ped, s3, au3, 'free', true) returning id into i;
  insert into content_assets (item_id, source_type, url) values (i, 'external', 'https://archive.org/search?query=neonatal+jaundice');
end $$;
