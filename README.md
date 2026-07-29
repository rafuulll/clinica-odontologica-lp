# Meridian Dental Studio — Landing Page

Landing page editorial para uma clínica odontológica fictícia, construída a partir de um design no Figma e implementada em HTML, CSS e JavaScript puros — sem frameworks, sem build step, sem dependências de runtime.

O foco do projeto foi **fidelidade de pixel ao design** e **responsividade real** em três breakpoints (desktop, tablet, mobile), com atenção especial a interações e microanimações que normalmente só existem em stacks com bibliotecas de animação.

## Stack

- **HTML5** semântico
- **CSS3** puro — variáveis nativas (`custom properties`), Grid, Flexbox, `clamp()`, `aspect-ratio`, `@property`, `clip-path`
- **JavaScript vanilla (ES5-compatível)** — sem dependências, sem bundler
- **Node.js** apenas como servidor estático de desenvolvimento (`serve.js`)

Nenhuma biblioteca de terceiros é carregada em produção, exceto as fontes do Google Fonts (Instrument Sans / Instrument Serif).

## Como rodar

```bash
node serve.js
```

Abre em `http://localhost:5173`. O servidor é um static file server minimalista (ver [serve.js](serve.js)) — não há passo de build.

## Estrutura

```
├── index.html              # página completa
├── css/styles.css          # todo o CSS do site, organizado por seção
├── js/main.js              # toda a interatividade, organizada em IIFEs isoladas
├── assets/
│   ├── images/              # fotos (equipe, antes/depois, sobre, hero, logos)
│   └── icons/                # ícones de redes sociais (extraídos do Figma)
├── serve.js                 # servidor estático de dev
├── services-section.html    # protótipo isolado da seção de serviços
└── why-meridian-journey.html # protótipo isolado da seção de jornada
```

## Créditos

Projeto conceitual desenvolvido como peça de portfólio. Design original no Figma; implementação front-end completa (HTML/CSS/JS) e toda a engenharia de responsividade e interação neste repositório.

## Links

https://clinica-odontologica-lp.vercel.app/
https://www.figma.com/proto/tRMZKvYSqiUlvOZ3RyCyCP/Landing-Page-Cl%C3%ADnica-Odontol%C3%B3gica?node-id=0-1&t=o8hi2g3rgVGQLJbT-1