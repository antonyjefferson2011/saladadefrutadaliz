import {useEffect,useMemo,useState} from 'react';
import {addDoc,collection,onSnapshot,serverTimestamp} from 'firebase/firestore';
import {db} from '../firebase';
import {BRAND,WHATSAPP} from '../config';
import {brl,Media,Product} from '../lib';

const LOCAL: Media[] = [
  {id:'l1',type:'image',url:'/media/foto3.jpg'},{id:'l2',type:'video',url:'/media/video1.mp4'},
  {id:'l3',type:'image',url:'/media/foto2.jpg'},{id:'l4',type:'image',url:'/media/foto1.jpg'}];

export default function Home() {
  const [products,setProducts] = useState<Product[]>([]);
  const [extra,setExtra] = useState<Media[]>([]);
  const [qty,setQty] = useState<Record<string,number>>({});
  const [name,setName] = useState(''); const [notes,setNotes] = useState('');
  const [busy,setBusy] = useState(false); const [err,setErr] = useState('');
  useEffect(()=>{
    const a = onSnapshot(collection(db,'products'),s=>setProducts(s.docs.map(d=>({id:d.id,...d.data()} as Product)).filter(p=>p.active!==false)),()=>{});
    const b = onSnapshot(collection(db,'gallery'),s=>setExtra(s.docs.map(d=>({id:d.id,...d.data()} as Media))),()=>{});
    return ()=>{a();b();};
  },[]);
  const items = useMemo(()=>products.filter(p=>qty[p.id]>0).map(p=>({id:p.id,name:p.name,price:p.price,qty:qty[p.id]})),[products,qty]);
  const total = items.reduce((t,i)=>t+i.price*i.qty,0);
  const setQ = (id:string,d:number)=>setQty(q=>({...q,[id]:Math.max(0,(q[id]||0)+d)}));

  async function send() {
    if(!name.trim()) return setErr('Informe seu nome.');
    if(!items.length) return setErr('Escolha pelo menos um produto.');
    setErr(''); setBusy(true);
    try {
      await addDoc(collection(db,'orders'),{name:name.trim(),items,total,notes:notes.trim(),status:'novo',createdAt:serverTimestamp()});
      const msg = `*Novo pedido - ${BRAND}*\nCliente: ${name.trim()}\n\n${items.map(i=>`• ${i.qty}x ${i.name} (${brl(i.price*i.qty)})`).join('\n')}\n\n${notes.trim()?`Obs: ${notes.trim()}\n`:''}*Total: ${brl(total)}*`;
      window.location.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    } catch { setErr('Não foi possível registrar o pedido. Tente de novo em instantes.'); }
    setBusy(false);
  }
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Quero fazer um pedido de salada de frutas.')}`;
  const gallery = [...LOCAL,...extra];
  const nav = [['Sobre','#sobre'],['Cardápio','#cardapio'],['Galeria','#galeria'],['Contato','#contato']];

  return (<div>
    <header className="sticky top-0 z-30 border-b border-rose-100 bg-creme/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#" className="font-display text-xl font-extrabold text-morango">🍓 Salada da Liz</a>
        <nav className="hidden gap-6 font-bold md:flex">{nav.map(([n,h])=><a key={h} href={h} className="hover:text-morango">{n}</a>)}</nav>
        <a href="#pedido" className="btn-sm">Fazer pedido</a>
      </div>
    </header>

    <section className="relative overflow-hidden">
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-manga/30 blur-3xl"/><div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-kiwi/20 blur-3xl"/>
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
        <div>
          <h1 className="text-5xl font-extrabold leading-[1.02] md:text-7xl">Fresquinha, saudável e feita com amor.</h1>
          <p className="mt-5 max-w-md text-lg">Salada de frutas cremosa no copo, com morango, kiwi e frutas selecionadas. Escolha, monte seu pedido e finalize pelo WhatsApp.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href="#cardapio" className="btn">Ver cardápio</a><a href={wa} className="btn-alt">Chamar no WhatsApp</a></div>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute inset-4 rotate-6 rounded-[2.5rem] bg-morango"/>
          <img src="/media/foto3.jpg" alt="Copo de salada de frutas cremosa com morangos" className="relative aspect-[3/4] w-full animate-flutua rounded-[2.5rem] object-cover shadow-2xl"/>
        </div>
      </div>
    </section>

    <section id="sobre" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
      <video src="/media/video1.mp4" poster="/media/video1.jpg" autoPlay muted loop playsInline className="mx-auto aspect-[9/16] max-h-[520px] rounded-[2rem] object-cover shadow-xl"/>
      <div>
        <h2 className="text-4xl font-extrabold">Uma salada de frutas com cara de sobremesa</h2>
        <p className="mt-4 text-lg">A {BRAND} prepara cada copo com frutas selecionadas e muito sabor. Qualidade em cada porção, do jeitinho que você gosta de pedir.</p>
        <ul className="mt-6 space-y-2 font-bold"><li>🍓 Frutas selecionadas</li><li>🥝 Muito sabor</li><li>💛 Qualidade em cada porção</li></ul>
      </div>
    </section>

    <section id="cardapio" className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-4xl font-extrabold">Cardápio</h2>
        {!products.length && <div className="card mt-6 text-center"><p>O cardápio está sendo atualizado. Enquanto isso, faça seu pedido direto pelo WhatsApp.</p><a href={wa} className="btn mt-4">Pedir pelo WhatsApp</a></div>}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p=>(<article key={p.id} className="card flex flex-col">
            {p.image?<img src={p.image} alt={p.name} loading="lazy" className="aspect-square w-full rounded-2xl object-cover"/>:<div className="aspect-square rounded-2xl bg-rose-50"/>}
            <h3 className="mt-4 text-xl font-bold">{p.name}</h3><p className="mt-1 flex-1 text-sm text-tinta/80">{p.description}</p>
            <div className="mt-4 flex items-center justify-between"><strong className="text-xl text-morango">{brl(p.price)}</strong>
              <div className="flex items-center gap-3"><button aria-label={`Remover ${p.name}`} onClick={()=>setQ(p.id,-1)} className="h-9 w-9 rounded-full bg-rose-100 text-xl font-bold">−</button>
                <span className="w-5 text-center font-bold">{qty[p.id]||0}</span>
                <button aria-label={`Adicionar ${p.name}`} onClick={()=>setQ(p.id,1)} className="h-9 w-9 rounded-full bg-morango text-xl font-bold text-white">+</button></div></div>
          </article>))}
        </div>
      </div>
    </section>

    {!!products.length && <section id="pedido" className="mx-auto max-w-2xl px-4 py-16">
      <div className="card">
        <h2 className="text-3xl font-extrabold">Seu pedido</h2>
        {items.length?<ul className="mt-4 divide-y divide-rose-100">{items.map(i=><li key={i.id} className="flex justify-between py-2"><span>{i.qty}x {i.name}</span><span className="font-bold">{brl(i.qty*i.price)}</span></li>)}</ul>:<p className="mt-3 text-tinta/70">Escolha seus produtos no cardápio acima.</p>}
        <div className="mt-4 grid gap-3"><input className="input" placeholder="Seu nome" value={name} maxLength={80} onChange={e=>setName(e.target.value)}/>
          <textarea className="input" rows={3} placeholder="Observações (ex.: sem granola)" maxLength={500} value={notes} onChange={e=>setNotes(e.target.value)}/></div>
        <p className="mt-4 text-right text-2xl font-extrabold">Total: <span className="text-morango">{brl(total)}</span></p>
        {err&&<p role="alert" className="mt-2 font-bold text-morangoescuro">{err}</p>}
        <button className="btn mt-4 w-full" disabled={busy} onClick={send}>{busy?'Registrando…':'Finalizar pelo WhatsApp'}</button>
      </div>
    </section>}

    <section id="galeria" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-4xl font-extrabold">Galeria</h2>
      <div className="mt-8 columns-2 gap-4 md:columns-3">{gallery.map(m=><div key={m.id} className="mb-4 break-inside-avoid overflow-hidden rounded-3xl shadow-lg">
        {m.type==='video'?<video src={m.url} controls muted loop playsInline preload="metadata" className="w-full"/>:<img src={m.url} alt="Salada de frutas" loading="lazy" className="w-full"/>}</div>)}</div>
    </section>

    <footer id="contato" className="bg-tinta py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
        <p className="font-display text-2xl font-extrabold">🍓 {BRAND}</p>
        <p>Pedidos e dúvidas pelo WhatsApp: <a className="font-bold underline" href={wa}>(86) 99826-5488</a></p>
        <a href={wa} className="btn">Chamar no WhatsApp</a>
        <p className="mt-4 text-sm text-white/60">© {new Date().getFullYear()} {BRAND}. Todos os direitos reservados.</p>
      </div>
    </footer>
    {total>0&&<a href="#pedido" className="btn fixed bottom-4 left-1/2 z-40 -translate-x-1/2 shadow-xl md:hidden">Ver pedido · {brl(total)}</a>}
  </div>);
}
