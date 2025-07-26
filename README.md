# 🌱 EcoSnap

<img width="400" height="400" alt="Image" src="https://github.com/user-attachments/assets/60624a24-eeac-42ef-89f1-c97122acbe91" />

> Promovendo ciência cidadã, educação participativa e preservação ambiental do Cerrado brasileiro.


## 📖 Sobre o Projeto

O **EcoSnap** é uma plataforma digital, um aplicativo, uma rede social educativa que transforma o Cerrado em uma sala de aula viva. O aplicativo conecta estudantes e professores em uma rede colaborativa para registrar, explorar e aprender sobre a biodiversidade do Cerrado de forma prática e tecnológica.

Mais do que um app, é uma ferramenta que une educação e preservação, incentivando a ciência cidadã desde a escola e formando jovens mais conscientes sobre o meio ambiente.

## 🎯 Objetivos

- **Educação Ambiental**: Facilitar o aprendizado sobre biodiversidade através de experiências práticas
- **Ciência Cidadã**: Permitir que estudantes contribuam para pesquisas ambientais
- **Preservação**: Desenvolver consciência ambiental através do conhecimento
- **Colaboração**: Criar uma rede de aprendizado entre estudantes e professores

## ⚡ Funcionalidades

### 👨‍🎓 Para Estudantes
- ✅ Registro de observações ambientais com fotos e textos
- ✅ Diário pessoal de aprendizado
- ✅ Participação em comunidades educativas
- ✅ Interface intuitiva estilo rede social

### 👩‍🏫 Para Professores
- ✅ Criação e gestão de turmas
- ✅ Acompanhamento de atividades por aluno
- ✅ Relatórios de participação
- ✅ Controle administrativo das comunidades

## 🚀 Recursos Principais

### 📝 Diário Pessoal
Permite aos estudantes registrar:
- Atividades realizadas
- Aprendizados obtidos
- Sentimentos e reflexões
- Dificuldades encontradas
- Mídias e observações

### 🏫 Comunidades Educacionais
- Espaços privados por turma
- Mural de postagens organizadas
- Ambiente seguro e controlado

### 🔍 Recursos Avançados
- **Motor de Pesquisa**: Busca por plantas, animais, datas, locais ou hashtags
- **Geolocalização**: Mapeamento automático de onde as fotos foram tiradas
- **Base de Dados Colaborativa**: Contribuição para banco de dados ambiental

## 🏗️ Arquitetura do Sistema

```
EcoSnap/
├── Frontend/          # Interface do usuário
├── Backend/           # lógica de negócio
├── Database/          # Banco de dados
├── Media/            # Armazenamento de imagens
└── Docs/             # Documentação
```

## 🛠️ Tecnologias

- **Frontend**: REACT
- **Backend com serviço**: SUPABASE
- **Banco de Dados**: SUPABASE
- **Geolocalização**: Leaflet biblioteca do javascript
- **Armazenamento**: TELEGRAM

## 📱 Como Usar

1. **Cadastro**: Crie sua conta (estudante/professor)
2. **Participação**: Entre em uma comunidade ou crie uma turma
3. **Registro**: Comece a documentar suas observações sobre o Cerrado
4. **Aprendizado**: Explore, compartilhe e aprenda colaborativamente

## 📋 Roadmap

- [ ] **Fase 1**: Desenvolvimento do autenticação
- [ ] **Fase 2**: Sistema de comunidades e perfis
- [ ] **Fase 3**: Recursos de configurações e de pesquisa
- [ ] **Fase 4**: Geolocalização
- [ ] **Fase 5**: Banco de Dados

## instruções necessárias para configurar o ambiente de desenvolvimento e começar a contribuir com o projeto.
Este documento contém todas as instruções necessárias para configurar o ambiente de desenvolvimento e começar a contribuir com o projeto.

🚀 Tecnologias e Bibliotecas
Este projeto foi construído utilizando um stack de tecnologias web modernas, empacotado para mobile com Capacitor.

Framework Principal: React (com Vite)

Backend como Serviço: Supabase (para banco de dados, autenticação e storage)

Plataforma Nativa: Capacitor (para transformar o código web em um aplicativo nativo para Android)

Navegação: React Router (react-router-dom)

Ícones: Lucide React

Notificações: React Hot Toast

Plugins Nativos do Capacitor
@capacitor/camera: Para acesso à câmera do dispositivo.

@capacitor/geolocation: Para acesso à localização do usuário.

@capacitor/preferences: Para armazenamento de dados simples no dispositivo.

@capacitor/splash-screen: Para gerenciamento da tela de abertura.

@capacitor/status-bar: Para controle da barra de status nativa.

⚙️ Configuração do Ambiente
Siga os passos abaixo para preparar seu ambiente de desenvolvimento local.

1. Pré-requisitos do Sistema
Antes de começar, certifique-se de que você tem todas as ferramentas necessárias instaladas e configuradas corretamente.

Node.js: É essencial ter o Node.js instalado. Recomendamos a versão LTS mais recente.

Download do Node.js

Java Development Kit (JDK) - Versão 17: O build do Android para este projeto exige especificamente o JDK 17.

Recomendamos o download do Temurin 17 (LTS) pela Adoptium: Download do JDK 17

Durante a instalação, na tela de "Custom Setup", é crucial ativar as opções Set JAVA_HOME variable e Modify PATH variable.

Android Studio: Necessário para o Android SDK e para as ferramentas de build.

Download do Android Studio

2. Variáveis de Ambiente
Variáveis do Sistema: Configure as variáveis JAVA_HOME e ANDROID_HOME no seu sistema operacional, apontando para os respectivos diretórios de instalação. Adicione também %JAVA_HOME%\bin e %ANDROID_HOME%\platform-tools à sua variável de ambiente Path.

Variáveis do Projeto (Supabase): O aplicativo precisa das chaves de acesso ao Supabase.

Na pasta raiz do projeto, crie um novo arquivo chamado .env.

Abra o arquivo .env e cole o seguinte conteúdo:

VITE_SUPABASE_URL=https://lbhlglpfndwzpdztvscw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiaGxnbHBmbmR3enBkenR2c2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4Nzk4MTksImV4cCI6MjA2NjQ1NTgxOX0.RulB7AHY-gGCJHP7hBPuQp2UbyCHjPwnpYm6NSx9w1I

IMPORTANTE: O arquivo .env não deve ser enviado para o GitHub. Certifique-se de que ele está listado no seu arquivo .gitignore.

3. Configuração do Banco de Dados (Supabase)
O banco de dados do projeto é gerenciado através de um script SQL. Para configurar o seu ambiente, você deve executar este script no SQL Editor do seu projeto Supabase.

Acesse o painel do seu projeto no supabase.com.

No menu lateral esquerdo, clique no ícone de banco de dados para ir até o SQL Editor.

Clique em "+ New query".

Copie todo o conteúdo do script abaixo e cole na janela do editor.

Clique no botão "RUN" para executar o script e criar todas as tabelas necessárias.

<details> <summary><strong>Clique para ver o Script SQL de Criação das Tabelas</strong></summary>

-- Tabela: public.profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username character varying NOT NULL UNIQUE,
  full_name character varying,
  bio text,
  avatar_url text,
  location jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'estudante'::text,
  institution text,
  website text,
  preferences jsonb,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Tabela: public.communities
CREATE TABLE public.communities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid NOT NULL,
  CONSTRAINT communities_pkey PRIMARY KEY (id),
  CONSTRAINT communities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Tabela: public.community_members
CREATE TABLE public.community_members (
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'membro'::text,
  CONSTRAINT community_members_pkey PRIMARY KEY (community_id, user_id),
  CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Tabela: public.posts
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  location jsonb,
  tags ARRAY,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  visibility character varying DEFAULT 'public'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  media_telegram_message_id bigint,
  community_id uuid,
  media_metadata jsonb,
  media_urls text[] DEFAULT '{}'::text[],
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT posts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id)
);

-- Tabela: public.comments
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id)
);

-- Tabela: public.comment_likes
CREATE TABLE public.comment_likes (
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid DEFAULT gen_random_uuid(),
  CONSTRAINT comment_likes_pkey PRIMARY KEY (comment_id, user_id),
  CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id),
  CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Tabela: public.follows
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id)
);

-- Tabela: public.likes
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Tabela: public.telegram_messages
CREATE TABLE public.telegram_messages (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id uuid,
  telegram_chat_id bigint NOT NULL,
  telegram_message_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT telegram_messages_pkey PRIMARY KEY (id),
  CONSTRAINT telegram_messages_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);

</details>

💻 Instalação e Execução do Projeto
Com o ambiente devidamente configurado, siga estes passos para rodar o projeto:

1. Clone o Repositório:

git clone https://github.com/SEU_USUARIO/App-EcoSnapV2.git
cd App-EcoSnapV2

2. Instale as Dependências:

npm install

3. Execute o Aplicativo em um Dispositivo:
Conecte seu celular Android com a Depuração USB ativada ou inicie um emulador. Em seguida, execute o comando abaixo:

npx cap run android

✨ Scripts Úteis
Sincronizar Código Web: Se você fizer alterações no código web e quiser apenas atualizar o projeto nativo sem rodar o app:

npx cap sync android

Gerar Ícones e Splash Screen:

npx capacitor-assets generate

Abrir no Android Studio:

npx cap open android

## 👥 Equipe

        Lucas Santana Camilo
        211060666
   
        Wisley Silva
        200029011
