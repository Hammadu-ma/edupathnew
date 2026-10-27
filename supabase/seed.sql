-- Optional demo data. Run AFTER schema.sql. Creates one university with a small curriculum.
do $$
declare uni uuid; prog uuid; y2 uuid; y3 uuid; t1 uuid; t2 uuid; c1 uuid; c2 uuid; ex uuid;
begin
  insert into universities (name, code, country) values ('University of Cambridge','CAM','United Kingdom') returning id into uni;
  insert into programs (university_id, name, code, description) values (uni,'Computer Science','CS','BA Computer Science') returning id into prog;
  insert into study_years (program_id, name, sort_order) values (prog,'Year 2',2) returning id into y2;
  insert into study_years (program_id, name, sort_order) values (prog,'Year 3',3) returning id into y3;
  insert into terms (study_year_id, name, kind, sort_order) values (y2,'Michaelmas Term','semester',1) returning id into t1;
  insert into terms (study_year_id, name, kind, sort_order) values (y2,'Lent Term','semester',2) returning id into t2;

  insert into courses (university_id, program_id, study_year_id, term_id, code, title, description, credits, cover_color, is_published)
  values (uni, prog, y2, t1, 'CS201', 'Algorithms & Data Structures', 'Fundamental algorithms, complexity analysis and data structure design.', 12, '#8b5cf6', true)
  returning id into c1;
  insert into courses (university_id, program_id, study_year_id, term_id, code, title, description, credits, cover_color, is_published)
  values (uni, prog, y2, t2, 'CS202', 'Operating Systems', 'Processes, memory management, file systems and concurrency.', 12, '#0ea5e9', true)
  returning id into c2;
  insert into courses (university_id, program_id, study_year_id, code, title, description, credits, cover_color, is_published)
  values (uni, prog, y3, 'CS301', 'Distributed Systems', 'Consensus, replication and fault tolerance.', 12, '#f59e0b', true);

  insert into resources (course_id, title, description, type, external_url) values
   (c1, 'Big-O Cheat Sheet', 'Quick reference for common complexities.', 'link', 'https://www.bigocheatsheet.com/'),
   (c1, 'MIT 6.006 Lectures', 'Video lectures on algorithms.', 'video', 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/'),
   (c2, 'OSTEP Textbook', 'Operating Systems: Three Easy Pieces (free online).', 'book', 'https://pages.cs.wisc.edu/~remzi/OSTEP/');

  insert into past_exams (course_id, title, exam_year, exam_type, semester_label, has_answers, has_explanations)
  values (c1, 'Algorithms Practice Set 1', 2024, 'practice', 'Michaelmas', true, true) returning id into ex;

  insert into questions (course_id, exam_id, question_text, options, correct_option_id, explanation, difficulty, points, order_index) values
   (c1, ex, 'What is the time complexity of binary search on a sorted array of n elements?',
    '[{"id":"a","text":"O(n)"},{"id":"b","text":"O(log n)"},{"id":"c","text":"O(n log n)"},{"id":"d","text":"O(1)"}]', 'b',
    'Each comparison halves the search space, giving O(log n).', 'easy', 2, 0),
   (c1, ex, 'Which data structure uses LIFO ordering?',
    '[{"id":"a","text":"Queue"},{"id":"b","text":"Stack"},{"id":"c","text":"Linked list"},{"id":"d","text":"Hash table"}]', 'b',
    'A stack removes the most recently added element first.', 'easy', 2, 1),
   (c1, ex, 'Worst-case time complexity of quicksort?',
    '[{"id":"a","text":"O(n log n)"},{"id":"b","text":"O(n)"},{"id":"c","text":"O(n^2)"},{"id":"d","text":"O(log n)"}]', 'c',
    'Bad pivots on every partition degrade quicksort to quadratic time.', 'medium', 3, 2);
end $$;
