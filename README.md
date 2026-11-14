# Salada de Fruta da Linds

React + TypeScript + Tailwind + Firebase (Auth, Firestore) + ImgBB. Pedidos finalizados pelo WhatsApp (86 99826-5488).

## Configuração (uma vez)
1. **Firebase Console > Authentication**: ative *E-mail/senha* e crie o usuário administrador (e-mail à sua escolha, senha inicial `acesso2026`).
2. **Firestore**: crie o banco e abra `firestore.rules`. Troque `COLOQUE_O_EMAIL_DO_ADMIN@exemplo.com` pelo e-mail do admin e publique as regras (`firebase deploy --only firestore:rules`).
3. Abra `/admin`, entre e, na aba **Config**, cole a chave do ImgBB (fica no Firestore, legível só pelo admin, fora do código público) e **altere a senha inicial**.
4. Cadastre os produtos na aba **Produtos**.

## Rodar e publicar
```
npm install
npm run dev
npm run build && firebase deploy --only hosting
```
Em **Authentication > Settings > Authorized domains**, adicione o domínio de produção.

## Notas
- Fotos e vídeo do site estão otimizados em `public/media`. Galeria extra e fotos de produtos vêm do painel.
- Vídeos extras entram por link direto `.mp4` (o ImgBB só hospeda imagens).
