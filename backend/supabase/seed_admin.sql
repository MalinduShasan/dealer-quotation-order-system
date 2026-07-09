insert into public.users (name, email, password, role)
values (
  'System Admin',
  'admin@example.com',
  '$2b$10$replace_with_bcrypt_hash',
  'admin'
);

insert into public.users (name, email, password, role)
values (
  'Default Dealer',
  'dealer@example.com',
  '$2b$10$replace_with_bcrypt_hash',
  'dealer'
);
