import {emptyState,validateState} from './finance.mjs';
import {assets} from './assets.mjs';
const json=(d,status=200)=>Response.json(d,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/finance'){
    const user=request.headers.get('oai-authenticated-user-id');
    if(!user)return json({error:'Inicia sesión para consultar tus registros.'},401);
    if(!env.DB)return json({error:'La base de datos no está disponible.'},503);
    if(request.method==='GET'){
      try{const row=await env.DB.prepare('SELECT data, revision FROM finances WHERE user_id = ?').bind(user).first();return json(row?{state:JSON.parse(row.data),revision:row.revision}:{state:emptyState(),revision:0});}
      catch{return json({error:'No pudimos cargar tus registros. Intenta nuevamente.'},500);}
    }
    if(request.method!=='PUT')return json({error:'Método no permitido.'},405);
    if(request.headers.get('origin')!==url.origin)return json({error:'Origen no permitido.'},403);
    if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Formato no permitido.'},415);
    let parsed;
    try{const body=await request.text();if(body.length>4000000)return json({error:'La copia supera el tamaño permitido.'},413);parsed=JSON.parse(body);validateState(parsed.state);if(!Number.isSafeInteger(parsed.revision)||parsed.revision<0)throw new Error('Versión inválida.');}
    catch(e){return json({error:e.message||'Revisa los campos del registro.'},400);}
    try{
      const result=parsed.revision===0
        ?await env.DB.prepare('INSERT INTO finances (user_id,data,revision) VALUES (?,?,1) ON CONFLICT(user_id) DO NOTHING RETURNING revision').bind(user,JSON.stringify(parsed.state)).first()
        :await env.DB.prepare('UPDATE finances SET data = ?, revision = revision + 1 WHERE user_id = ? AND revision = ? RETURNING revision').bind(JSON.stringify(parsed.state),user,parsed.revision).first();
      if(!result)return json({error:'Tus datos cambiaron en otra pestaña. Recarga la página antes de guardar nuevamente.'},409);
      return json({revision:result.revision});
    }catch{return json({error:'No se pudo guardar. Tus registros anteriores siguen intactos.'},500);}
  }
  const file=assets[url.pathname==='/'?'/index.html':url.pathname];
  if(!file)return new Response('Página no encontrada',{status:404});
  return new Response(file.body,{headers:{'Content-Type':file.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'"}});
}};
