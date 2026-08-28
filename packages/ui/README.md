# Jaci UI

Design system compartilhado pelos aplicativos público e administrativo do
Abrigo do Wlad. O pacote npm do workspace é `@jaci/ui`.

## Fundação visual

Importe a fundação uma única vez no ponto de entrada de cada aplicação:

```css
@import "@jaci/ui/styles.css";
```

Esse arquivo fornece a paleta original do painel público, tokens semânticos,
tema escuro, tipografia, foco, reset e utilitários globais. Aplicações podem
ajustar densidade e composição, mas devem consumir tokens como
`--text-primary`, `--surface-card`, `--border` e `--primary` em vez de declarar
novas cores.

## Componentes

Os componentes são exportados por subcaminho:

```tsx
import { Button } from "@jaci/ui/Button";
import { Input, NativeSelect, Textarea } from "@jaci/ui/Field";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@jaci/ui/Dialog";
```

Diálogos simples continuam usando o layout padrão. Superfícies maiores, com
cabeçalho, conteúdo rolável e ações persistentes, devem optar pelo layout
estruturado e por um tamanho oficial:

```tsx
<DialogContent size="xl" layout="structured" mobileMode="fullscreen">
  <DialogHeader>...</DialogHeader>
  <DialogBody>...</DialogBody>
  <DialogFooter>...</DialogFooter>
</DialogContent>
```

Os tamanhos disponíveis são `sm`, `md`, `lg`, `xl` e `fullscreen-mobile`.
O último preserva a geometria padrão ou definida pelo consumidor em telas
maiores e ocupa a área útil do viewport em telas pequenas.

Quando o diálogo precisa combinar um tamanho explícito no desktop com tela
cheia no mobile, use `mobileMode="fullscreen"`. O valor legado
`size="fullscreen-mobile"` continua disponível para consumidores que não
definem outra largura de desktop.

Componentes de aplicação, como navegação e layouts de página, permanecem nos
respectivos aplicativos. Primitivos, comportamento acessível e identidade
visual pertencem ao Jaci UI.
