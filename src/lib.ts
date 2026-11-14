export type Product = {id: string; name: string; description: string; price: number; image: string; active: boolean};
export type Item = {id: string; name: string; price: number; qty: number};
export type Order = {id: string; name: string; items: Item[]; total: number; notes: string; status: string; createdAt?: {toDate: () => Date}};
export type Media = {id: string; type: 'image' | 'video'; url: string};
export const STATUS = ['novo', 'em preparo', 'pronto', 'entregue', 'cancelado'];
export const brl = (n: number) => n.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
export async function uploadImg(file: File, key: string) {
  if (!key) throw new Error('Cadastre a chave do ImgBB na aba Config.');
  const f = new FormData(); f.append('image', file);
  const r = await fetch('https://api.imgbb.com/1/upload?key=' + encodeURIComponent(key), {method: 'POST', body: f});
  const j = await r.json(); if (!j.success) throw new Error('Falha no upload da imagem.');
  return j.data.display_url as string;
}
