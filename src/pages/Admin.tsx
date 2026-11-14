import {FormEvent,useEffect,useMemo,useState} from 'react';
import {EmailAuthProvider,User,onAuthStateChanged,reauthenticateWithCredential,sendPasswordResetEmail,signInWithEmailAndPassword,signOut,updatePassword} from 'firebase/auth';
import {addDoc,collection,deleteDoc,doc,onSnapshot,orderBy,query,setDoc,updateDoc} from 'firebase/firestore';
import {auth,db} from '../firebase';
import {brl,Media,Order,Product,STATUS,uploadImg} from '../lib';

export default function Admin() {
  const [user,setUser] = useState<User|null|undefined>(undefined);
  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  if(user===undefined) return <p className="p-8">Carregando…</p>;
  return user?<Panel user={user}/>:<Login/>;
}

function Login() {
  const [email,setEmail] = useState(''); const [pw,setPw] = useState(''); const [err,setErr] = useState('');
  async function go(e:FormEvent){e.preventDefault();setErr('');
    try{await signInWithEmailAndPassword(auth,email,pw);}catch{setErr('E-mail ou senha incorretos.');}}
  return (<main className="grid min-h-screen place-items-center bg-rose-50 p-4">
    <form onSubmit={go} className="card w-full max-w-sm space-y-3">
      <h1 className="text-2xl font-extrabold text-morango">🍓 Painel administrativo</h1>
      <input className="input" type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input className="input" type="password" placeholder="Senha" value={pw} onChange={e=>setPw(e.target.value)} required/>
      {err&&<p role="alert" className="font-bold text-morangoescuro">{err}</p>}
      <button className="btn w-full">Entrar</button></form></main>);
}

const TABS = ['Painel','Pedidos','Produtos','Galeria','Config'];

function Panel({user}:{user:User}) {
  const [tab,setTab] = useState('Painel');
  const [orders,setOrders] = useState<Order[]>([]); const [products,setProducts] = useState<Product[]>([]); const [media,setMedia] = useState<Media[]>([]);
  const [key,setKey] = useState(''); const [denied,setDenied] = useState(false);
  useEffect(()=>{
    const d=()=>setDenied(true);
    const u=[onSnapshot(query(collection(db,'orders'),orderBy('createdAt','desc')),s=>setOrders(s.docs.map(x=>({id:x.id,...x.data()} as Order))),d),
      onSnapshot(collection(db,'products'),s=>setProducts(s.docs.map(x=>({id:x.id,...x.data()} as Product)))),
      onSnapshot(collection(db,'gallery'),s=>setMedia(s.docs.map(x=>({id:x.id,...x.data()} as Media)))),
      onSnapshot(doc(db,'settings','integrations'),s=>setKey(s.data()?.imgbbKey||''),()=>{})];
    return ()=>u.forEach(f=>f());
  },[]);
  return (<div className="min-h-screen bg-rose-50">
    <header className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 shadow">
      <strong className="font-display text-xl text-morango">🍓 Admin</strong>
      <nav className="flex flex-wrap gap-1">{TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={`rounded-full px-4 py-1.5 font-bold ${tab===t?'bg-morango text-white':'hover:bg-rose-100'}`}>{t}</button>)}</nav>
      <button onClick={()=>signOut(auth)} className="font-bold underline">Sair</button></header>
    <main className="mx-auto max-w-5xl space-y-6 p-4">
      {denied&&<p role="alert" className="card font-bold text-morangoescuro">Esta conta não tem permissão de administrador. Confira o e-mail em firestore.rules.</p>}
      {tab==='Painel'&&<Dashboard orders={orders}/>}
      {tab==='Pedidos'&&<Orders orders={orders}/>}
      {tab==='Produtos'&&<Products products={products} k={key}/>}
      {tab==='Galeria'&&<Gallery media={media} k={key}/>}
      {tab==='Config'&&<Config user={user} k={key}/>}
    </main></div>);
}

function Dashboard({orders}:{orders:Order[]}) {
  const valid = orders.filter(o=>o.status!=='cancelado');
  const revenue = valid.reduce((t,o)=>t+o.total,0);
  const days = useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const k=d.toDateString();
    const os=valid.filter(o=>o.createdAt?.toDate().toDateString()===k);return {l:d.toLocaleDateString('pt-BR',{weekday:'short'}),n:os.length,v:os.reduce((t,o)=>t+o.total,0)};}),[orders]);
  const max = Math.max(1,...days.map(d=>d.n)); const maxV = Math.max(1,...days.map(d=>d.v));
  const stat = [['Pedidos',String(orders.length)],['Novos',String(orders.filter(o=>o.status==='novo').length)],['Faturamento',brl(revenue)],['Ticket médio',brl(valid.length?revenue/valid.length:0)]];
  return (<>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{stat.map(([l,v])=><div key={l} className="card"><p className="text-sm font-bold text-tinta/60">{l}</p><p className="text-2xl font-extrabold text-morango">{v}</p></div>)}</div>
    <div className="grid gap-4 md:grid-cols-2">
      <Chart title="Pedidos nos últimos 7 dias" data={days.map(d=>({l:d.l,t:String(d.n),h:d.n/max}))} color="bg-morango"/>
      <Chart title="Faturamento nos últimos 7 dias" data={days.map(d=>({l:d.l,t:d.v?brl(d.v):'',h:d.v/maxV}))} color="bg-kiwi"/></div>
    <div className="card"><h3 className="mb-3 font-bold">Pedidos por status</h3>{STATUS.map(s=>{const n=orders.filter(o=>o.status===s).length;return (
      <div key={s} className="mb-2 flex items-center gap-3"><span className="w-24 text-sm capitalize">{s}</span><div className="h-3 flex-1 rounded-full bg-rose-100"><div className="h-3 rounded-full bg-manga" style={{width:`${orders.length?n/orders.length*100:0}%`}}/></div><span className="w-6 text-right font-bold">{n}</span></div>);})}</div>
  </>);
}
function Chart({title,data,color}:{title:string;data:{l:string;t:string;h:number}[];color:string}) {
  return (<div className="card"><h3 className="mb-3 font-bold">{title}</h3><div className="flex h-40 items-end gap-2">{data.map((d,i)=>
    <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] font-bold">{d.t}</span><div className={`w-full rounded-t-lg ${color}`} style={{height:`${Math.max(d.h*100,2)}%`}}/><span className="text-xs capitalize">{d.l}</span></div>)}</div></div>);
}

function Orders({orders}:{orders:Order[]}) {
  if(!orders.length) return <p className="card">Nenhum pedido recebido ainda.</p>;
  return (<div className="space-y-3">{orders.map(o=><details key={o.id} className="card">
    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-bold"><span>{o.name} · {brl(o.total)}</span>
      <span className="text-sm font-normal text-tinta/60">{o.createdAt?.toDate().toLocaleString('pt-BR')}</span></summary>
    <ul className="mt-3 list-disc pl-5">{o.items.map(i=><li key={i.id}>{i.qty}x {i.name} — {brl(i.qty*i.price)}</li>)}</ul>
    {o.notes&&<p className="mt-2"><b>Obs:</b> {o.notes}</p>}
    <select className="input mt-3 max-w-xs capitalize" value={o.status} onChange={e=>updateDoc(doc(db,'orders',o.id),{status:e.target.value})}>{STATUS.map(s=><option key={s}>{s}</option>)}</select>
  </details>)}</div>);
}

function Upload({value,onChange,k}:{value:string;onChange:(u:string)=>void;k:string}) {
  const [msg,setMsg] = useState('');
  async function pick(f?:File){if(!f)return;setMsg('Enviando…');try{onChange(await uploadImg(f,k));setMsg('');}catch(e){setMsg((e as Error).message);}}
  return (<div className="flex items-center gap-3">{value&&<img src={value} alt="" className="h-16 w-16 rounded-xl object-cover"/>}
    <label className="btn-sm cursor-pointer">{value?'Trocar imagem':'Enviar imagem'}<input type="file" accept="image/*" hidden onChange={e=>pick(e.target.files?.[0])}/></label>{msg&&<span className="text-sm font-bold">{msg}</span>}</div>);
}

const EMPTY = {name:'',description:'',price:'',image:'',active:true};
function Products({products,k}:{products:Product[];k:string}) {
  const [f,setF] = useState(EMPTY); const [id,setId] = useState('');
  async function save(e:FormEvent){e.preventDefault();const price=parseFloat(String(f.price).replace(',','.'));if(!f.name||!(price>0))return;
    const data={name:f.name.trim(),description:f.description.trim(),price,image:f.image,active:f.active};
    if(id) await updateDoc(doc(db,'products',id),data); else await addDoc(collection(db,'products'),data);
    setF(EMPTY);setId('');}
  return (<>
    <form onSubmit={save} className="card grid gap-3"><h3 className="font-bold">{id?'Editar produto':'Novo produto'}</h3>
      <input className="input" placeholder="Nome" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/>
      <textarea className="input" placeholder="Descrição" rows={2} value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
      <input className="input" placeholder="Preço (ex.: 12,50)" inputMode="decimal" value={f.price} onChange={e=>setF({...f,price:e.target.value})} required/>
      <Upload value={f.image} onChange={u=>setF({...f,image:u})} k={k}/>
      <label className="flex items-center gap-2"><input type="checkbox" checked={f.active} onChange={e=>setF({...f,active:e.target.checked})}/> Visível no site</label>
      <div className="flex gap-2"><button className="btn">Salvar</button>{id&&<button type="button" className="btn-alt" onClick={()=>{setF(EMPTY);setId('');}}>Cancelar</button>}</div></form>
    <div className="grid gap-3 md:grid-cols-2">{products.map(p=><div key={p.id} className="card flex gap-3">
      {p.image&&<img src={p.image} alt="" className="h-20 w-20 rounded-xl object-cover"/>}
      <div className="flex-1"><p className="font-bold">{p.name} {p.active===false&&<em className="text-sm">(oculto)</em>}</p><p className="font-bold text-morango">{brl(p.price)}</p>
        <div className="mt-2 flex gap-3 text-sm font-bold"><button onClick={()=>{setId(p.id);setF({name:p.name,description:p.description,price:String(p.price),image:p.image,active:p.active!==false});scrollTo({top:0,behavior:'smooth'});}}>Editar</button>
          <button className="text-morangoescuro" onClick={()=>confirm(`Excluir "${p.name}"?`)&&deleteDoc(doc(db,'products',p.id))}>Excluir</button></div></div></div>)}</div></>);
}

function Gallery({media,k}:{media:Media[];k:string}) {
  const [url,setUrl] = useState('');
  const add=(type:'image'|'video',u:string)=>u&&addDoc(collection(db,'gallery'),{type,url:u});
  return (<><div className="card space-y-3"><h3 className="font-bold">Adicionar à galeria</h3>
    <Upload value="" onChange={u=>add('image',u)} k={k}/>
    <form className="flex gap-2" onSubmit={e=>{e.preventDefault();add('video',url.trim());setUrl('');}}><input className="input" type="url" placeholder="Link direto de vídeo (.mp4)" value={url} onChange={e=>setUrl(e.target.value)} required/><button className="btn">Adicionar</button></form></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{media.map(m=><div key={m.id} className="card p-2">
      {m.type==='video'?<video src={m.url} className="aspect-square w-full rounded-xl object-cover" muted/>:<img src={m.url} alt="" className="aspect-square w-full rounded-xl object-cover"/>}
      <button className="mt-2 text-sm font-bold text-morangoescuro" onClick={()=>deleteDoc(doc(db,'gallery',m.id))}>Excluir</button></div>)}</div></>);
}

function Config({user,k}:{user:User;k:string}) {
  const [key,setKey] = useState(k); useEffect(()=>setKey(k),[k]);
  const [cur,setCur] = useState(''); const [nw,setNw] = useState(''); const [msg,setMsg] = useState('');
  async function change(e:FormEvent){e.preventDefault();
    try{await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email!,cur));await updatePassword(user,nw);setMsg('Senha alterada.');setCur('');setNw('');}
    catch{setMsg('Não foi possível alterar. Confira a senha atual (mínimo 8 caracteres na nova).');}}
  return (<>
    <form className="card space-y-3" onSubmit={async e=>{e.preventDefault();await setDoc(doc(db,'settings','integrations'),{imgbbKey:key.trim()});setMsg('Chave salva.');}}>
      <h3 className="font-bold">Chave da API do ImgBB</h3><p className="text-sm">Guardada no Firestore e legível só pelo administrador — não fica no código público.</p>
      <input className="input" value={key} onChange={e=>setKey(e.target.value)} placeholder="API key"/><button className="btn">Salvar chave</button></form>
    <form className="card space-y-3" onSubmit={change}><h3 className="font-bold">Alterar senha</h3>
      <input className="input" type="password" placeholder="Senha atual" value={cur} onChange={e=>setCur(e.target.value)} required/>
      <input className="input" type="password" placeholder="Nova senha" minLength={8} value={nw} onChange={e=>setNw(e.target.value)} required/>
      <div className="flex gap-2"><button className="btn">Alterar senha</button><button type="button" className="btn-alt" onClick={()=>sendPasswordResetEmail(auth,user.email!).then(()=>setMsg('E-mail de redefinição enviado.'))}>Enviar e-mail de redefinição</button></div></form>
    {msg&&<p role="status" className="card font-bold">{msg}</p>}</>);
}
