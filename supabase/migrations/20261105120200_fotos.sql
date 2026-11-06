-- Bucket das fotos (spec: "Storage"): leitura pública pela URL; envio, troca e remoção só para admins.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vitrine', 'vitrine', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Bucket público já serve a URL pública; a leitura pela API (listar, sobrescrever) fica só para o admin.
create policy "admin lê fotos da vitrine" on storage.objects
  for select to authenticated using (bucket_id = 'vitrine' and (select private.is_admin()));
create policy "admin envia fotos da vitrine" on storage.objects
  for insert to authenticated with check (bucket_id = 'vitrine' and (select private.is_admin()));
create policy "admin troca fotos da vitrine" on storage.objects
  for update to authenticated
  using (bucket_id = 'vitrine' and (select private.is_admin()))
  with check (bucket_id = 'vitrine' and (select private.is_admin()));
create policy "admin apaga fotos da vitrine" on storage.objects
  for delete to authenticated using (bucket_id = 'vitrine' and (select private.is_admin()));
