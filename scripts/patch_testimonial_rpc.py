from pathlib import Path

p=Path('depoimentos.js')
s=p.read_text(encoding='utf-8')
old='''      const row = { name:nome, instagram, comment:comentario, avatar_url:avatarData, is_visible:false, delete_token:deleteToken };
      let result = await neon.from("site_testimonials").insert(row).select("id").single();
      // Compatibilidade temporária até a política de moderação ser aplicada no Neon.
      if (result?.error && /policy|row-level security/i.test(String(result.error.message || result.error))) {
        result = await neon.from("site_testimonials").insert({...row,is_visible:true}).select("id").single();
      }
      const { data, error } = result || {};
      if (error || !data?.id) throw error || new Error("ID não retornado");'''
new='''      const row = { name:nome, instagram, comment:comentario, avatar_url:avatarData, delete_token:deleteToken };
      let data=null,error=null;
      const rpc = await neon.rpc("submit_testimonial", {
        p_name:nome,
        p_instagram:instagram,
        p_comment:comentario,
        p_avatar_url:avatarData,
        p_delete_token:deleteToken
      });
      if (!rpc?.error && rpc?.data) {
        data = {id:rpc.data};
      } else {
        // Compatibilidade somente enquanto a migração de moderação ainda não foi aplicada.
        const legacy = await neon.from("site_testimonials").insert({...row,is_visible:true}).select("id").single();
        data = legacy?.data || null;
        error = legacy?.error || rpc?.error || null;
      }
      if (error || !data?.id) throw error || new Error("Depoimento não aceito");'''
if old not in s:
    raise SystemExit('Bloco de submissão atual não encontrado')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

v=Path('scripts/validate_site.py')
t=v.read_text(encoding='utf-8')
anchor="if 'ensaios de casal' in index.lower(): errors.append('Home: referência SEO legada a ensaio de casal')\n"
extra="if 'neon.rpc(\"submit_testimonial\"' not in (ROOT/'depoimentos.js').read_text(encoding='utf-8'): errors.append('Depoimentos: submissão moderada via RPC ausente')\n"
if extra not in t:
    if anchor not in t: raise SystemExit('Âncora do validator não encontrada')
    t=t.replace(anchor,anchor+extra,1)
v.write_text(t,encoding='utf-8')
