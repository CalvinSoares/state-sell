# Deploy na Vercel

> Um projeto Next.js. Deploy = conectar o repo à Vercel, setar env vars, e pronto.
> Os crons vêm de `vercel.json`. O e-mail só sai de verdade com domínio verificado + trava liberada.

---

## 1. Variáveis de ambiente (Vercel → Project → Settings → Environment Variables)

| Variável | Exemplo | Obrigatória | Notas |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://…neon.tech/neondb?sslmode=require` | ✅ | Neon (pooled) |
| `AUTH_SECRET` | string aleatória longa | ✅ | assina sessão e magic link. `openssl rand -hex 32` |
| `CRON_SECRET` | string aleatória longa | ✅ | a Vercel envia como `Authorization: Bearer` nos crons |
| `ADMIN_EMAILS` | `voce@dominio.com` | ✅ | allowlist do `/admin` (vírgula separa vários) |
| `RESEND_API_KEY` | `re_…` | ✅ p/ enviar | chave do Resend |
| `RESEND_MODE` | `dry` \| `live` | ✅ | **manter `dry` até validar**; `live` libera envio real |
| `APP_URL` | `https://statesell.com.br` | ✅ | usado em links absolutos server-side |
| `NEXT_PUBLIC_APP_URL` | `https://statesell.com.br` | ✅ | idem, lado cliente |

`NODE_ENV=production` é setado pela Vercel automaticamente — não precisa criar.

---

## 2. Crons (`vercel.json`, já no repo)

```jsonc
{
  "crons": [
    { "path": "/api/cron/tick",           "schedule": "0 9 * * *" },  // pipeline diário
    { "path": "/api/cron/resumo-semanal", "schedule": "0 12 * * 6" }  // sábado
  ]
}
```

- **Plano Hobby**: cron roda **1×/dia** com precisão de ±59 min. Os dois acima cabem. Justificativa em ADR-002 (janela mediana de proposta ~6 dias — coleta diária entrega).
- `/api/cron/tick` roda coleta → casar → alertar → enviar em sequência, numa invocação. Cada etapa é idempotente.
- **Plano Pro**: para rodar de hora em hora, trocar o schedule do tick para `0 */3 * * *`. As rotas granulares (`/api/cron/coletar`, `/casar`, `/alertar`, `/enviar`) continuam existindo para acionar etapas isoladas.
- A Vercel protege os crons com `CRON_SECRET` automaticamente; o `autorizarCron` valida o header.

> Se a Vercel recusar a quantidade de crons no seu plano, mantenha só o `tick` e dispare o resumo manualmente por enquanto — ou faça o tick verificar o dia da semana.

---

## 3. Migration do banco

O deploy **não** roda migration sozinho. Antes (ou depois) do primeiro deploy, com a `DATABASE_URL` de produção no ambiente local:

```bash
pnpm db:migrate
```

---

## 4. O que falta para os e-mails saírem DE VERDADE

A `RESEND_API_KEY` **sozinha não basta**. Três coisas precisam estar verdadeiras ao mesmo tempo:

1. **`NODE_ENV=production` E `RESEND_MODE=live`** — a trava anti-disparo (`decidir-envio.ts`). Em qualquer outra combinação o e-mail é apenas simulado no log. É proposital: evita mandar teste para assinante real.

2. **Domínio verificado no Resend.** O remetente é `avisos@statesell.com.br` (`enviar.action.ts`). Sem verificar o domínio, o Resend **só** deixa enviar de `onboarding@resend.dev` e **só** para o e-mail dono da conta. Para valer em produção:
   - Resend → Domains → Add Domain → `statesell.com.br`
   - Publicar no DNS os registros que o Resend mostrar: **SPF** (TXT), **DKIM** (CNAMEs) e idealmente **DMARC** (TXT). Ver `alertas-e-envio.md` (entregabilidade).
   - Esperar verificar (minutos a horas).

3. **O remetente do código bater com o domínio verificado.** Se o domínio verificado for outro, ajustar `REMETENTE` em `src/server/alerta/enviar.action.ts`.

> **Resposta direta:** além da API key, você precisa **verificar o domínio de envio no Resend (DNS: SPF/DKIM/DMARC)** e **setar `RESEND_MODE=live` em produção**. Sem o domínio, o Resend recusa ou restringe; sem a trava liberada, o app simula.

### Roteiro seguro de virada
1. Subir com `RESEND_MODE=dry`. Rodar o `tick` manualmente e conferir nos logs os `email.simulado`.
2. Verificar o domínio no Resend.
3. Cadastrar **o seu próprio e-mail** como assinante e mudar `RESEND_MODE=live`.
4. Rodar o `tick` e confirmar que **você** recebeu. Só então divulgar.
5. Começar com volume baixo (aquecimento) e vigiar taxa de bounce/reclamação.

---

## 5. Disparar um cron manualmente (teste)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-APP.vercel.app/api/cron/tick
```

---

## 6. Checklist de primeiro deploy

- [ ] Repo conectado à Vercel
- [ ] Todas as env vars da seção 1 setadas (Production)
- [ ] `RESEND_MODE=dry` no primeiro deploy
- [ ] `pnpm db:migrate` rodado contra o banco de produção
- [ ] Build passou na Vercel
- [ ] `/` (landing) e `/cadastro` abrem
- [ ] `/admin` retorna 404 sem sessão; login em `/admin/entrar` com e-mail da allowlist funciona
- [ ] `tick` manual retorna contagens e loga `email.simulado`
- [ ] Domínio verificado no Resend antes de `RESEND_MODE=live`
- [ ] Teste de ponta com o próprio e-mail antes de abrir ao público
