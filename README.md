# Salada de Fruta da Liz

## Configurar (3 passos, uma vez)
1. Firebase > **Authentication** > Começar > ative **E-mail/senha** > aba Usuários > **Adicionar usuário**:
   e-mail `admin@saladadaliz.com`, senha `acesso123`.
2. Firebase > **Firestore Database** > crie o banco > aba **Regras** > cole o conteúdo de `firestore.rules` > Publicar.
3. Rode `npm install` e `npm run dev`. O painel fica em `/admin` e pede só a senha.

Depois, na aba **Senha** do painel, troque a senha por uma mais forte.

Publicar: `npm run build` e `firebase deploy`.
