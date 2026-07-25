# Serviço automático do calendário

Este Worker lê a página oficial `https://jecfutsal.com.br/competicoes/`, transforma os próximos jogos em JSON e libera CORS para o PWA.

## Publicar no Cloudflare Workers

1. Crie uma conta no Cloudflare.
2. Instale o Wrangler: `npm install -g wrangler`
3. Entre nesta pasta.
4. Execute `wrangler login`
5. Execute `wrangler deploy`
6. Copie a URL exibida, por exemplo `https://jec-krona-calendar.seuusuario.workers.dev`
7. No PWA, abra **Pesos > Sincronização automática do calendário**, cole a URL e salve.

O PWA verificará o calendário ao abrir, ao voltar para a tela, quando a internet retornar e no intervalo escolhido.
