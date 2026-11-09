# Correção da galeria responsiva

## Objetivo
Reorganizar a visualização da galeria sem alterar dados ou funcionalidades existentes.

## Alterações
- No celular, trocar o painel inferior por uma página vertical: arte completa no topo e informações logo abaixo.
- Garantir que a imagem use ajuste proporcional, sem cortes, e reservar altura adequada para seus controles e miniaturas.
- No desktop, manter a arte à esquerda e ampliar/organizar o painel de informações à direita.
- Permitir quebra de títulos e textos longos, corrigir grades internas estreitas e tornar o conteúdo lateral rolável sem ser ocultado.
- Preservar navegação, zoom, apresentação, compartilhamento, metadados de IA e miniaturas.

## Validação
- Abrir a coleção Professores em larguras de celular e desktop.
- Confirmar que a arte inteira aparece, o texto permanece legível e a troca entre artes continua funcionando.
- Conferir ausência de sobreposição, corte horizontal e erros no navegador.

## Detalhes técnicos
- Ajustar `GalleryLayout`, `ArtworkPanel`, `ImageZoom` e, se necessário, `ThumbnailFilmstrip`.
- Usar a estrutura responsiva existente e os componentes visuais atuais, sem mudanças no backend.
