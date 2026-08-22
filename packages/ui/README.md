# @abrigo/ui

Componentes visuais compartilháveis entre os painéis público e administrativo.

Os componentes são exportados por subcaminho, por exemplo:

```tsx
import { Button } from "@abrigo/ui/Button";
```

As variáveis CSS usadas pelos componentes ainda pertencem ao tema de cada
aplicação. Antes de adotar um componente no admin, mapeie os tokens usados pelo
respectivo CSS Module no tema do admin para preservar sua identidade visual.
