# Automação de Geração de ZIPs a partir de XML (NF-e)

## Visão Geral

Aplicação desenvolvida em Node.js para automatizar a separação e compactação de imagens de produtos com base em arquivos XML de NF-e.

Elimina a busca manual de imagens, garantindo consistência e ganho de produtividade.

## O que o script faz

Leitura dos XMLs
Extração dos dados relevantes
Identificação dos códigos de produto (`cProd`)
Busca das imagens correspondentes
Geração de arquivos `.zip` organizados

## Configuração

Arquivo `config.txt`:

```
xml: caminho/para/xml
fotos: caminho/para/fotos
zips: caminho/para/saida
```

