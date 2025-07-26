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

🚀 Tecnologias Utilizadas
Este projeto foi construído utilizando um stack de tecnologias web modernas, empacotado para mobile com Capacitor:

[Framework Principal]: (Ex: React, Vue, Angular ou JavaScript puro)

Capacitor: Para transformar o código web em um aplicativo nativo para Android.

Node.js: Para gerenciamento de dependências e execução de scripts.

Gradle: Para automação do build do projeto Android.

🛠️ Pré-requisitos do Ambiente
Antes de começar, certifique-se de que você tem todas as ferramentas necessárias instaladas e configuradas corretamente.

Node.js: É essencial ter o Node.js instalado. Recomendamos a versão LTS mais recente.

Download do Node.js

Java Development Kit (JDK) - Versão 17: O build do Android para este projeto exige especificamente o JDK 17. Versões mais novas ou mais antigas causarão erros.

Recomendamos o download do Temurin 17 (LTS) pela Adoptium: Download do JDK 17

Durante a instalação, na tela de "Custom Setup", é crucial ativar as opções Set JAVA_HOME variable e Modify PATH variable.

Android Studio: Necessário para o Android SDK e para as ferramentas de build.

Download do Android Studio

Após a instalação, abra o Android Studio, vá em More Actions > SDK Manager e certifique-se de que você tem pelo menos uma versão do "Android SDK Platform" instalada.

⚙️ Configuração das Variáveis de Ambiente
Para que os comandos de build funcionem corretamente no terminal, as seguintes variáveis de ambiente precisam estar configuradas no seu sistema:

JAVA_HOME: Deve apontar para o diretório de instalação do JDK 17.

Exemplo: C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot

ANDROID_HOME (ou ANDROID_SDK_ROOT): Deve apontar para o diretório onde o Android SDK foi instalado.

Exemplo: C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk

Além disso, o Path do sistema deve conter as seguintes entradas:

%JAVA_HOME%\bin

%ANDROID_HOME%\platform-tools

Nota: Se você ativou as opções corretas durante a instalação do JDK 17, o JAVA_HOME e seu respectivo Path já devem estar configurados.

💻 Instalação e Execução do Projeto
Com o ambiente devidamente configurado, siga estes passos para rodar o projeto:

1. Clone o Repositório:

git clone https://github.com/SEU_USUARIO/App-EcoSnapV2.git
cd App-EcoSnapV2

2. Instale as Dependências:
Use o npm para instalar todos os pacotes necessários definidos no package.json.

npm install

3. Sincronize o Projeto com o Android:
Este comando atualiza o projeto nativo do Android com o seu código web mais recente.

npx cap sync android

4. Execute o Aplicativo em um Dispositivo:
Conecte seu celular Android com a Depuração USB ativada ou inicie um emulador. Em seguida, execute o comando abaixo. Ele irá compilar, instalar e iniciar o aplicativo no seu dispositivo.

npx cap run android

✨ Scripts Úteis
Gerar Ícones e Splash Screen: Para gerar todos os ícones e a tela de abertura a partir de uma imagem fonte, use a ferramenta @capacitor/assets. Primeiro, coloque seus arquivos icon.png (1024x1024) e splash.png (2732x2732) na pasta resources. Depois, execute:

# Instale a ferramenta (apenas uma vez)
npm install @capacitor/assets --save-dev

# Gere os assets
npx capacitor-assets generate

Abrir o Projeto no Android Studio:
Se precisar fazer alguma configuração nativa, você pode abrir a pasta android no Android Studio:

npx cap open android

## 👥 Equipe

        Lucas Santana Camilo
        211060666
   
        Wisley Silva
        200029011
