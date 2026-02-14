-- Prevent all writes to canonical biblical text tables.
-- Run this migration in production to enforce immutability at DB level.

create or replace function block_biblical_text_writes()
returns trigger
language plpgsql
as $$
begin
	raise exception 'Writes to canonical biblical text tables are disabled.';
end;
$$;

drop trigger if exists trg_block_hebrew_books_write on hebrew_books;
create trigger trg_block_hebrew_books_write
before insert or update or delete on hebrew_books
for each row execute function block_biblical_text_writes();

drop trigger if exists trg_block_hebrew_chapters_write on hebrew_chapters;
create trigger trg_block_hebrew_chapters_write
before insert or update or delete on hebrew_chapters
for each row execute function block_biblical_text_writes();

drop trigger if exists trg_block_hebrew_verses_write on hebrew_verses;
create trigger trg_block_hebrew_verses_write
before insert or update or delete on hebrew_verses
for each row execute function block_biblical_text_writes();

drop trigger if exists trg_block_hebrew_words_write on hebrew_words;
create trigger trg_block_hebrew_words_write
before insert or update or delete on hebrew_words
for each row execute function block_biblical_text_writes();
