# CMS Pro

## O que é este projeto

Template Astro 7 estático (`output: 'static'`) com CMS custom. O admin é Preact (`client:only`), sem banco de dados: artigos, páginas, configurações e mídia vivem no próprio repositório Git (Markdown, JSON e arquivos em `src/assets/uploads/`).

O cliente edita pelo `/admin`. O painel grava via GitHub Contents API e a Vercel reconstrói o site. O HTTP Basic Auth protege `/admin` no Edge da Vercel com duas fontes:

- **Conta mestre** — `ADMIN_BASIC_AUTH_USER` / `ADMIN_BASIC_AUTH_PASSWORD`, reservada ao desenvolvedor.
- **Usuários do painel** — hashes PBKDF2 em `src/data/users.json`, gerenciáveis na aba **Usuários** do admin.

O `pnpm build` local valida o Astro. O Edge Middleware (`middleware.ts`, matcher `/admin/:path*`) só roda de verdade no deploy da Vercel.

O sitemap (`/sitemap-index.xml`) é gerado no build. A URL canônica (`site` no `astro.config.mjs`) é lida em build-time de `siteSettings.siteUrl` (`src/data/site-settings.json`). Cada cliente precisa ter a URL real nesse campo — o placeholder do template é `https://exemplo.com.br`. A rota `/admin` não entra no sitemap. O link copiável fica na aba **Configurações** do admin, para colar no Google Search Console.

## Modelo de entrega

O desenvolvedor (dono deste template) instala e configura o CMS **nas contas GitHub e Vercel de cada cliente**. O cliente não clica em “Use this template” sozinho — é o desenvolvedor que faz isso em nome dele.

Depois da instalação, o desenvolvedor permanece como **colaborador no GitHub** e **membro do time na Vercel**, para suporte e manutenção contínuos.

O cliente **nunca recebe a conta mestre** do Basic Auth. Ele entra no `/admin` com o username/senha criados na aba **Usuários** e gera o próprio Personal Access Token (PAT) do GitHub para o segundo login do painel.

## Checklist de instalação para um cliente novo

1. **GitHub do cliente.** Peça para o cliente criar (ou usar) uma conta GitHub e te adicionar como colaborador na organização/conta dele, com permissão para criar repositórios.
2. **Repositório.** A partir deste template (**Use this template**, ou push manual do conteúdo), crie o repositório **dentro da conta do cliente**.
3. **Vercel do cliente.** Peça para o cliente criar (ou usar) uma conta Vercel e te convidar como membro do time.
4. **Importar.** Na Vercel do cliente, importe o repositório. Framework: Astro. Build padrão (`pnpm build` / output `dist`).
5. **Environment Variables** (Project Settings → Environment Variables, Production, Preview e Development quando fizer sentido):

   | Variável | Notas |
   |---|---|
   | `PUBLIC_GITHUB_OWNER` | User ou org dono do repositório deste cliente. |
   | `PUBLIC_GITHUB_REPO` | Nome do repositório criado no passo 2. |
   | `PUBLIC_GITHUB_BRANCH` | Branch que o admin lê e grava (em geral `main`). |
   | `ADMIN_BASIC_AUTH_USER` | Conta mestre. Gerada e guardada **somente pelo desenvolvedor**. Única por cliente. Sem prefixo `PUBLIC_`. |
   | `ADMIN_BASIC_AUTH_PASSWORD` | Senha mestre. Gerada e guardada **somente pelo desenvolvedor**. Única por cliente. Nunca compartilhada. Não commite em `.env`. |
   | `PUBLIC_DEPLOY_HOOK_URL` | Deixe vazio neste passo; preencha no passo 7. |

   O PAT do GitHub **não** é variável de ambiente. Quem for usar o admin cola o token no `/admin`; ele fica só no `localStorage` daquele navegador.
6. **Primeiro deploy manual.** Dispare o deploy (o import já faz isso, ou um Redeploy). Confirme que o site público sobe e que `https://DOMINIO-DO-CLIENTE/admin` pede Basic Auth.
7. **Deploy Hook.** Em **Settings → Git → Deploy Hooks**, crie um hook (branch = `PUBLIC_GITHUB_BRANCH`), cole a URL em `PUBLIC_DEPLOY_HOOK_URL` e faça um **redeploy**. Sem isso, o commit do admin funciona, mas o site não reconstrói sozinho.
8. **Validar o painel.** Entre em `/admin` com a **conta mestre** (Basic Auth) e um PAT temporário seu — ou o PAT do cliente, se ele já quiser gerar o dele agora. Confirme login, dashboard e um save de teste.
9. **Primeiro usuário do cliente.** Na aba **Usuários**, crie o username e a senha que **ele** vai usar — diferentes da conta mestre. O save grava o hash em `src/data/users.json`; a autenticação nova só vale depois do deploy automático (~1 minuto).
10. **Entregar ao cliente:**
    - URL do site
    - URL do `/admin`
    - username/senha criados na aba **Usuários** (não a conta mestre)
    - instruções para ele gerar o próprio PAT **fine-grained** do GitHub: escopo **somente** aquele repositório, permissão **Contents** (read and write), com data de expiração. Esse PAT é o segundo login do `/admin`. Não compartilhe PAT entre clientes e não o coloque na Vercel.

## Variáveis e onde vivem (tabela de referência rápida)

| Nome da variável | Onde é configurada | Quem sabe o valor | Vai para o bundle público? |
|---|---|---|---|
| `PUBLIC_GITHUB_OWNER` | Vercel (Environment Variables) | Desenvolvedor (e quem tem acesso ao projeto na Vercel) | Sim |
| `PUBLIC_GITHUB_REPO` | Vercel | Desenvolvedor (e quem tem acesso ao projeto na Vercel) | Sim |
| `PUBLIC_GITHUB_BRANCH` | Vercel | Desenvolvedor (e quem tem acesso ao projeto na Vercel) | Sim |
| `PUBLIC_DEPLOY_HOOK_URL` | Vercel (depois do passo 7) | Desenvolvedor (e quem tem acesso ao projeto na Vercel) | Sim |
| `ADMIN_BASIC_AUTH_USER` | Vercel | **Somente o desenvolvedor** | Não (só o Edge Middleware) |
| `ADMIN_BASIC_AUTH_PASSWORD` | Vercel | **Somente o desenvolvedor** | Não (só o Edge Middleware) |
| PAT fine-grained do GitHub | Gerado por quem usa o admin; `localStorage` do browser | A pessoa que gerou (cliente ou desenvolvedor, no próprio token) | Não (nunca entra no build) |

## Suporte contínuo

Como desenvolvedor, você mantém acesso de colaborador no GitHub e membro do time na Vercel de cada cliente. Use a **conta mestre** do Basic Auth para entrar no `/admin` quando precisar dar suporte — sem pedir a senha do usuário do cliente.

O PAT que você usa no suporte pode ser o seu (fine-grained, só aquele repositório). O cliente continua com o token dele no navegador dele.

## Solução de problemas comuns

- **"PUBLIC_DEPLOY_HOOK_URL não está configurado" no admin:** falta o passo 7. O arquivo já foi commitado; dispare um rebuild manual na Vercel e preencha a variável antes do próximo save.
- **`git push` rejeitado (non-fast-forward):** o admin também commita neste repositório. Rode `git pull` (ou `git pull --rebase`) antes de enviar de novo; não use force push em `main`.
- **Basic Auth não aparece em `pnpm dev` / `pnpm preview`:** esperado. O `middleware.ts` só roda no Edge da Vercel após o deploy — o mesmo vale para usuários criados na aba **Usuários**.
- **Usuário novo do admin ainda não entra no Basic Auth:** o middleware só vê o `users.json` do último build. Espere o deploy automático (~1 min) ou dispare um Redeploy.
- **Esqueci a senha de um usuário do cliente:** entre com a conta mestre, abra a aba **Usuários** e recrie ou troque a senha dele. Depois do deploy automático, a senha nova passa a valer.
- **Mídia ou conteúdo não aparece no site depois de salvar:** o commit no GitHub existe, mas o rebuild ainda não rodou. Confira o Deploy Hook (passo 7) e a fila de deploys na Vercel.
