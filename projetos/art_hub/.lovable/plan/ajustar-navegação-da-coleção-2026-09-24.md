# Ajustar navegação da coleção

## Objetivo
- Abrir toda coleção diretamente no modo **Galeria** quando as artes terminarem de carregar.
- Exibir um seletor **Galeria / Grid** no topo da galeria, disponível no celular e no computador.
- Ao escolher **Grid**, voltar para a grade da coleção sem perder a busca ou recarregar a página.
- Reorganizar os controles móveis para que avançar e sair da galeria tenham áreas de toque separadas.

## Implementação
- Alterar o estado inicial da página da coleção para Galeria e selecionar automaticamente a primeira arte disponível.
- Reaproveitar o modo Grid existente e ligar a troca de visualização ao cabeçalho da galeria.
- Isolar eventos de toque/clique dos botões de navegação para impedir que um controle acione outro.
- Manter setas, gesto lateral, miniaturas, zoom e painel de detalhes existentes.

## Validação
- Conferir `/collections/professores` em celular e desktop.
- Validar abertura inicial em Galeria, avanço entre artes, troca para Grid e retorno para Galeria.
