# Kairo

Landing page do Kairo, plataforma de prontidão profissional que acompanha cada aluno do 1º período até o primeiro estágio.

## Tecnologia

Site estático em HTML, CSS e JavaScript, sem framework e sem etapa de build.

- Formulário de interesse via Netlify Forms
- Métricas de acesso com Umami, sem cookies
- Fonte Source Sans Pro servida pelo próprio site

## Estrutura

```
netlify.toml        configuração do Netlify (pasta publicada e cabeçalhos)
site/
├── index.html      página principal
├── obrigado.html   confirmação do formulário (quando o JavaScript está desativado)
├── styles.css      identidade visual e layout
├── main.js         animação do anel de prontidão, painel da turma e formulário
├── brand/          logos e banner
├── fonts/          Source Sans Pro 400, 600 e 700
└── img/            ilustrações de fundo
```

## Rodar localmente

```bash
npx serve site
```

A aluna, a turma e os números exibidos na página são fictícios e servem apenas como exemplo.

## Direitos

© 2026 Kairo. O nome, o logo e a identidade visual do Kairo não podem ser reutilizados sem autorização.
