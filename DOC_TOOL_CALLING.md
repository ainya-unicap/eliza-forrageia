# Tool Calling no Nest.js com Groq

Este documento explica como usar a feature de tool calling implementada nesta aplicação.

## Visão geral

A feature permite que o modelo LLM escolha ferramentas conforme o contexto da conversa e execute funções do backend antes de responder ao usuário.

Fluxo:

1. O cliente envia uma mensagem para o endpoint de chat.
2. O serviço de LLM envia ao Groq a mensagem e a lista de ferramentas disponíveis.
3. O modelo decide se precisa chamar uma ferramenta.
4. A aplicação executa a função registrada.
5. O resultado da ferramenta é enviado de volta ao modelo.
6. O modelo responde ao usuário com base no contexto obtido.

Isso permite criar integrações reutilizáveis e escaláveis, como:

- consulta a base de conhecimento
- busca em banco de dados
- consulta de funcionários
- consulta de documentos
- busca em sistemas externos

---

## Estrutura principal

Os pontos principais da implementação são:

- `src/llm/tool-registry.service.ts`: registro e execução das ferramentas
- `src/llm/llm.service.ts`: orquestração do fluxo com tool calling
- `src/llm/groq/groqRepository.ts`: integração com a API do Groq
- `src/chat/chat.controller.ts`: endpoint HTTP de conversa

---

## Como registrar uma nova ferramenta

No `ToolRegistryService`, cada ferramenta precisa ter:

- `name`: nome único da ferramenta
- `description`: descrição clara para o LLM
- `parameters`: schema JSON da entrada
- `executor`: função que executa a ação real

Exemplo:

```ts
this.register({
  name: 'get_employees',
  description: 'Consulta os funcionários da empresa.',
  parameters: {
    type: 'object',
    properties: {
      department: {
        type: 'string',
        description: 'Departamento para filtrar os funcionários.',
      },
      limit: {
        type: 'number',
        description: 'Quantidade máxima de funcionários a retornar.',
      },
    },
    required: ['department'],
  },
  executor: async ({ department, limit = 10 }) => {
    return [
      { id: 1, name: 'Ana', department: department },
      { id: 2, name: 'Bruno', department: department },
    ];
  },
});
```

Esse registro é enviado ao Groq no formato de tools, então o modelo pode decidir chamar essa função automaticamente quando fizer sentido.

---

## Exemplo real: consultar funcionários da empresa

### Pergunta do usuário

> Quais funcionários da empresa trabalham no setor financeiro?

### Chamada HTTP

```http
POST /chat
Content-Type: application/json

{
  "message": "Quais funcionários da empresa trabalham no setor financeiro?",
  "system": "Você é um assistente útil. Use ferramentas quando necessário."
}
```

### Exemplo de comportamento esperado

O modelo percebe que a pergunta exige consultar uma base de dados/funcionários e chama uma ferramenta como:

```json
{
  "tool_calls": [
    {
      "id": "call_1",
      "type": "function",
      "function": {
        "name": "get_employees",
        "arguments": "{\"department\":\"financeiro\",\"limit\":10}"
      }
    }
  ]
}
```

A função executa algo como:

```ts
executor: async ({ department, limit = 10 }) => {
  const employees = [
    { id: 1, name: 'Maria Silva', department: 'financeiro', role: 'Analista Financeiro' },
    { id: 2, name: 'João Pereira', department: 'financeiro', role: 'Gerente Financeiro' },
    { id: 3, name: 'Laura Costa', department: 'financeiro', role: 'Contadora' },
  ];

  return employees.slice(0, limit);
}
```

### Retorno da ferramenta

```json
[
  {
    "id": 1,
    "name": "Maria Silva",
    "department": "financeiro",
    "role": "Analista Financeiro"
  },
  {
    "id": 2,
    "name": "João Pereira",
    "department": "financeiro",
    "role": "Gerente Financeiro"
  },
  {
    "id": 3,
    "name": "Laura Costa",
    "department": "financeiro",
    "role": "Contadora"
  }
]
```

### Resposta final do LLM

```json
{
  "message": "No setor financeiro, os funcionários são: Maria Silva, João Pereira e Laura Costa."
}
```

Ou, dependendo da implementação do cliente, pode ser retornado em formato mais estruturado para UI/SPA:

```json
{
  "employees": [
    {
      "id": 1,
      "name": "Maria Silva",
      "department": "financeiro",
      "role": "Analista Financeiro"
    },
    {
      "id": 2,
      "name": "João Pereira",
      "department": "financeiro",
      "role": "Gerente Financeiro"
    },
    {
      "id": 3,
      "name": "Laura Costa",
      "department": "financeiro",
      "role": "Contadora"
    }
  ]
}
```

---

## Dica de uso em produção

Para aplicações reais, o ideal é:

- separar a lógica da empresa por módulos
- permitir que a ferramenta consulte banco de dados de forma segura
- validar parâmetros de entrada
- não expor dados sensíveis sem autorização
- usar `department`, `id`, `cpf`, `email` e filtros conforme necessidade

---

## Exemplo de integração com Prisma

Você pode ligar a ferramenta diretamente ao Prisma:

```ts
this.register({
  name: 'get_employees',
  description: 'Busca funcionários por departamento.',
  parameters: {
    type: 'object',
    properties: {
      department: { type: 'string' },
    },
    required: ['department'],
  },
  executor: async ({ department }) => {
    return prisma.employee.findMany({
      where: { department },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
    });
  },
});
```

Isso torna o LLM capaz de responder perguntas como:

- quem trabalha no setor financeiro?
- qual funcionário está no departamento de vendas?
- me liste os colaboradores ativos da empresa

---

## Resumo

A feature de tool calling transforma o assistente em um agente capaz de:

- interpretar contexto
- executar funções do backend
- consultar dados reais
- devolver resposta contextualizada e precisa

Ela é a base para construir sistemas de IA com ações reais, em vez de apenas texto gerado.
