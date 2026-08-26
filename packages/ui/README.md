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
import { Dialog, DialogContent } from "@jaci/ui/Dialog";
```

Componentes de aplicação, como navegação e layouts de página, permanecem nos
respectivos aplicativos. Primitivos, comportamento acessível e identidade
visual pertencem ao Jaci UI.
