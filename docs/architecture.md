# Arquitetura do OctoFit Tracker

O OctoFit Tracker é uma aplicação de três camadas para um programa de atividades físicas escolar. O código inicial inclui contratos de API e pontos de implementação intencionalmente incompletos para que você use o modo agent do GitHub Copilot em um ciclo guiado por testes.

```mermaid
flowchart LR
    Browser["Navegador"]
    UI["Apresentação<br/>React 19 · Vite · React Router · Bootstrap<br/>Porta 3000 · pública"]
    API["Lógica<br/>Express · TypeScript · serviços<br/>Porta 8000 · pública"]
    DB["Dados<br/>Mongoose · MongoDB<br/>Porta 27017 · privada"]
    Contracts["Contratos executáveis<br/>Atividades · Equipes · Placar · Sugestões"]

    Browser --> UI
    UI -->|HTTP /api via proxy Vite| API
    API -->|Mongoose| DB
    Contracts -. verificam .-> UI
    Contracts -. verificam .-> API
    Contracts -. verificam .-> DB
```

## Limites entre as camadas

- **Camada de apresentação**: React 19, Vite, React Router, Bootstrap e um cliente compartilhado da API em `octofit-tracker/frontend/src`.
- **Camada de lógica**: rotas e serviços Express com TypeScript em `octofit-tracker/backend/src` expõem o comportamento `/api/*` na porta `8000`.
- **Camada de dados**: modelos Mongoose e dados de demonstração em `octofit-tracker/backend/src/models` e `src/scripts/seed.ts` são persistidos no MongoDB na porta `27017`.

## Portas e regras de ambiente

- MongoDB: `27017` (privada)
- API Express: `8000` (pública)
- Interface Vite: `3000` (pública)
- O navegador acessa caminhos relativos `/api`. O Vite os encaminha para `http://localhost:8000`; `VITE_API_BASE_URL` pode substituir a URL-base.
- Não encaminhe nem torne públicas outras portas.

## Contrato da API

| Capacidade | Método e caminho | Comportamento esperado |
| --- | --- | --- |
| Registro de atividades | `GET /api/activities`, `POST /api/activities` | Lista e cria atividades válidas. POST recebe `userId`, `teamId`, `type` e `minutes`; `userId` e `teamId` devem ser IDs bem-formados de uma pessoa e uma equipe existentes, caso contrário a API retorna um 4xx intencional (nunca um 500 causado por erro de conversão). Uma atividade criada armazena `user`, `team`, `type` e `minutes` enviados, além de `points` e `occurredAt` calculados. |
| Equipes | `GET /api/teams`, `POST /api/teams` | Lista e cria equipes com integrantes. As equipes criadas e listadas mantêm os valores enviados em `name` e `mascot`. Rejeita uma equipe sem nome com `400`. |
| Placar | `GET /api/leaderboard` | Retorna as equipes ordenadas pela soma dos pontos de suas atividades, da maior para a menor. Cada item contém `teamName`, `totalPoints` e uma `rank` iniciada em 1. |
| Sugestões de treino | `GET /api/workouts/suggestions/:userEmail` | Recomenda treinos com base nos padrões de atividade recentes da pessoa correspondente ao e-mail seed. O foco da primeira sugestão (`focus`) corresponde à meta ou à atividade recente dessa pessoa, e o campo `reason` explica o motivo. Um e-mail sem pessoa correspondente retorna um 4xx intencional (por exemplo, `404`). |

## Decisões de implementação

Registre seu plano aqui antes de editar o código.

- Decisão da camada de apresentação: componentes consomem a API somente pelo `getJson` de `api/client.ts` e exibem estados de carregamento (`role="status"`), erro (`role="alert"`) e vazio em português.
- Decisão da camada de lógica: rotas finas em `routes/api.ts` delegam a `services/octofitService.ts`; entrada inválida vira 4xx via `HttpError`, nunca 500.
- Decisão da camada de dados: modelos Mongoose com validação `required` e seed idempotente via `updateOne` com `upsert`, sem scripts diretos no MongoDB.
- Abordagem para registro de atividades: validar `userId` e `teamId` como ObjectId de pessoa e equipe existentes antes de criar; calcular `points` e `occurredAt` no serviço.
- Abordagem para gerenciamento de equipes: exigir `name` com resposta 400 e listar equipes com `name`, `mascot` e integrantes.
- Abordagem para o placar: agregar `points` por equipe no banco (`$group` e `$sort` descendente) e numerar `rank` a partir de 1.
- Abordagem para sugestões de treino: localizar a pessoa pelo e-mail (404 se ausente), derivar `focus` da meta ou da atividade recente e incluir `reason`.

## Plano de testes

Registre os comandos executados e o significado de cada falha.

- Testes da camada de dados: `npm run test:data --prefix octofit-tracker/backend`
- Testes da API: `npm run test:api --prefix octofit-tracker/backend`
- Testes do frontend: `npm test --prefix octofit-tracker/frontend`
- Compilação do backend: `npm run build --prefix octofit-tracker/backend`
- Compilação do frontend: `npm run build --prefix octofit-tracker/frontend`

Resultados atuais:

- Dados: 4 de 5 falham. Faltam validações `required` em User, Team, Activity e Workout.
- API: 4 de 4 falham. POST de atividades e equipes retorna 501 em vez de 400, o placar vem vazio e a sugestão não traz `reason`.
- Frontend: 15 de 15 falham. Componentes não exibem dados reais nem os estados ARIA (`role="status"`, `role="alert"`) e vazios.
- Validador (`node --test tests/exercise-validation.test.mjs`): 38 de 42 passam. Falham 4 testes do badge "Copy Exercise" do README, que não aponta para `dev-pods`. É metadado do template, fora das camadas da aplicação.
