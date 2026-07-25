# JEC Krona Performance — PWA

Aplicativo web progressivo para avaliação de atletas de futsal.

## Como executar

A pasta precisa ser servida por HTTP/HTTPS para que o modo offline e a instalação funcionem.

Opção simples no computador:

```bash
python -m http.server 8080
```

Depois abra `http://localhost:8080`.

## Recursos

- Elenco profissional 2026 pré-cadastrado
- Cadastro de atletas separados por posição
- Goleiros com métricas próprias
- Cadastro e seleção de partidas individuais
- Lançamento de estatísticas por jogo
- Rating por posição sem métrica de intensidade
- Chances criadas e chances bloqueadas com pesos específicos
- Ranking por posição
- Dashboard e MVP
- Backup e restauração em JSON
- Instalação como PWA e funcionamento offline

Os dados são armazenados no navegador do aparelho usando localStorage.

## Novidades desta versão
- Mapa de ações clicável por coordenadas
- Duas seções de legendas selecionáveis: zonas longitudinais e corredores
- Classificação automática em zona de finalização, construção, pressão e zona morta
- Classificação automática em corredor lateral ou central
- Bola parada com lateral, escanteio, falta, tiro de 6 metros e pênalti
- Resultado de bola parada com passe certo, passe errado, chance criada, finalização, gol e perda de posse

## Calendário oficial
Esta versão inclui uma aba de calendário com os próximos jogos publicados pelo JEC Futsal em 24/07/2026.
Cada jogo pode ser adicionado diretamente ao cadastro de partidas para liberar estatísticas e mapa de ações.

## Monitoramento automático do calendário

O aplicativo agora:
- consulta um serviço remoto ao abrir;
- atualiza novamente quando volta ao primeiro plano;
- tenta sincronizar quando a internet retorna;
- repete a verificação no intervalo configurado;
- atualiza data, horário, competição e local de partidas já adicionadas;
- mantém o último calendário salvo quando estiver offline.

A pasta `cloudflare-worker` contém o serviço necessário para ler a página oficial do JEC Futsal. Ele precisa ser publicado uma única vez e sua URL deve ser informada nas configurações do PWA.

## Elenco atualizado pelo oGol

O elenco principal foi atualizado conforme a página do Joinville Futsal no oGol consultada em 24/07/2026.

- 4 goleiros
- 3 fixos
- 13 alas
- 5 pivôs

Jogadores antigos que já possuam estatísticas ou ações são mantidos como **Histórico**, evitando perda de dados.

## Ações separadas por período

O mapa de ações agora registra:
- 1º tempo
- 2º tempo
- 1º tempo da prorrogação
- 2º tempo da prorrogação
- total geral automático

A prorrogação pode ser ativada individualmente em cada partida. O sistema mostra quantidade e principais ações de cada período, além da soma total.

## Correção de ações

Agora é possível tocar em qualquer ação registrada e:
- alterar jogador;
- alterar período;
- alterar tipo da ação;
- alterar horário;
- corrigir bola parada e resultado;
- mover a ação para outro ponto da quadra;
- duplicar;
- excluir.

O botão **Desfazer última ação** continua disponível. As mudanças atualizam automaticamente os mapas, contagens por período e totais.

## Registro rápido durante o jogo

A tela de mapa de ações foi simplificada para reduzir o número de toques:
- jogadores exibidos como botões grandes por número e posição;
- busca rápida por nome ou número;
- ações principais em botões grandes;
- atalhos de teclado de 1 a 9;
- troca rápida entre 1ºT, 2ºT e prorrogação;
- barra fixa no celular com jogador, ação e desfazer;
- destaque visual quando o sistema está pronto para receber o toque na quadra;
- após registrar, o jogador permanece selecionado e apenas a ação é limpa.

## Relação de 16 jogadores por partida
- seleção de 16 relacionados;
- definição de 5 titulares;
- apenas os relacionados aparecem no registro;
- em quadra e banco separados;
- substituições registradas com período e horário.
