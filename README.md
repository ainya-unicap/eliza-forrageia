# Eliza x Forrageia

Microsserviço de Agentes de IA moldado para as funcionalidades do projeto Forrageia.

## Eliza
Se trata de uma arquitetura de microserviços de IA adaptado para expansão e integração com projetos diversos feito por [Deivyson Santos](https://github.com/Deivyson05).

## O Agente
O sistema consiste em um agente que lê documentações do projeto, acessa base específica de dados do projeto pela API principal e gera um relatório organizado com base nesses dados.

### RAG
O sistema usa ferramentas de RAG acoplada a um tool calling onde o agente poderá decidir qual usar primeiro.

### Tool Calling
O Agente tem acesso ao RAG e a API principal do projeto via Tool Calling onde o agente poderá decidir qual ferramenta usar.
