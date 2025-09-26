# ⚡ Revolts⚡

**EnergyControl Pro** é uma aplicação web completa para monitoramento e gerenciamento de consumo de energia elétrica, desenvolvida como um projeto full-stack utilizando Python com Flask no backend e uma interface rica com HTML, CSS e JavaScript no frontend. A aplicação se conecta a um banco de dados PostgreSQL (via Supabase) para armazenar e processar dados de consumo em tempo real.

## 📜 Visão Geral do Projeto

O objetivo do EnergyControl Pro é fornecer aos usuários uma visão clara e detalhada sobre seus hábitos de consumo de energia, permitindo-lhes tomar decisões mais inteligentes para economizar na conta de luz e reduzir seu impacto ambiental. A plataforma transforma dados brutos de consumo em insights visuais e acionáveis.

## ✨ Funcionalidades Principais

O projeto é dividido em várias telas, cada uma com uma finalidade específica:

### 1. **Tela de Login**
* Sistema de autenticação seguro que valida as credenciais do usuário contra o banco de dados.
* As senhas são armazenadas de forma segura utilizando hash (bcrypt).

### 2. **Dashboard de Energia**
* **Visão Geral:** A tela principal após o login. Apresenta os indicadores mais importantes do consumo de energia.
* **Cards de KPI:** Mostra o consumo do dia e do mês atual, tanto em kWh quanto em Reais (R$), além de uma projeção da fatura.
* **Gráfico de Custo Mensal:** Um gráfico de barras que compara o custo dos últimos 6 meses, destacando o mês atual.
* **Gráfico de Consumo Diário:** Um gráfico de linha que mostra o padrão de consumo (custo por hora) ao longo do dia atual, com a marcação "Agora" indicando a hora corrente.
* **Cards de Insights:** O sistema analisa os dados e fornece mensagens dinâmicas sobre economia detectada, horário de pico de consumo e progresso em relação à meta mensal.

### 3. **Métricas Avançadas**
* **Análise Detalhada:** Uma tela para análises mais profundas, com uma visão geral e uma análise por dispositivo.
* **Visão Geral ("Consumo por Tempo"):**
    * Gráfico de consumo das últimas 24 horas.
    * Gráfico de consumo para cada dia da semana atual.
    * Gráfico de pizza (donut) mostrando a distribuição do consumo entre os diferentes tipos de aparelhos (Eletrodomésticos, Climatização, etc.).
    * Card de resumo estatístico (consumo médio, pico e mínimo).
* **Análise por Dispositivo:**
    * Um menu dropdown permite que o usuário selecione um dispositivo específico.
    * Ao selecionar um aparelho, os gráficos e o resumo estatístico são atualizados para mostrar os dados **apenas daquele dispositivo**.

### 4. **Simulador de Economia**
* **Ferramenta Interativa:** Permite que o usuário simule o impacto financeiro de mudar seus hábitos de consumo.
* **Lógica Dinâmica:** O simulador é populado com os dispositivos reais do usuário e seu consumo médio (calculado a partir do histórico no banco de dados).
* **Cálculos em Tempo Real:** O usuário pode ajustar o "tempo de uso desejado" de um aparelho, e a interface recalcula instantaneamente a economia mensal em kWh, em Reais (R$) e a redução na emissão de CO₂.
* **Projeção Anual:** Um gráfico de linhas mostra a projeção de custo acumulado ao longo de 12 meses, comparando o cenário atual com o simulado.

### 5. **Previsões Inteligentes**
* **Projeção Futura:** Utiliza a média de consumo dos últimos 6 meses para gerar uma previsão estatística de consumo e custo para os próximos 7 meses.
* **Visualização Completa:** Apresenta um gráfico de linhas com as projeções e cards detalhados para cada mês futuro.

### 6. **Gerador de Relatórios**
* **Exportação de Dados:** Permite ao usuário gerar um relatório em **PDF** com base em filtros customizados.
* **Filtros:** É possível selecionar um período de datas (início e fim) e filtrar por um dispositivo específico ou todos.
* **PDF Profissional:** O relatório gerado contém uma capa, um resumo executivo, um gráfico de consumo diário e uma tabela detalhada com o consumo e custo de cada dispositivo no período selecionado.

### 7. **Configurações**
* **Personalização:** Uma tela onde o usuário pode visualizar e (no futuro) alterar suas informações de perfil e limites de consumo. Atualmente, a funcionalidade de salvar está implementada no backend, mas a interação é focada no frontend.

## 🛠️ Arquitetura e Tecnologias

* **Backend:**
    * **Linguagem:** Python 3
    * **Framework:** Flask
    * **Banco de Dados:** PostgreSQL (hospedado no Supabase)
    * **Comunicação:** API RESTful que serve dados em formato JSON.
* **Frontend:**
    * **Estrutura:** HTML5, CSS3, JavaScript (ES Modules)
    * **Estilização:** CSS puro, sem frameworks, com variáveis para fácil manutenção do tema.
    * **Gráficos:**
        * **Dashboard:** Uma biblioteca de gráficos customizada (`charts.js`) usando a API Canvas.
        * **Outras Telas:** A biblioteca `Chart.js` para maior flexibilidade.
    * **Geração de PDF:** As bibliotecas `jsPDF` e `jspdf-autotable`.
* **Ambiente:**
    * Gerenciamento de dependências Python com `venv`.
    * Variáveis de ambiente (credenciais do banco) gerenciadas com um arquivo `.env`.

## 🚀 Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-seu-repositorio>
    cd <pasta-do-projeto>
    ```
2.  **Crie e ative o ambiente virtual:**
    ```bash
    python -m venv .venv
    # No Windows
    .\.venv\Scripts\activate
    # No macOS/Linux
    source .venv/bin/activate
    ```
3.  **Instale as dependências do Python:**
    ```bash
    pip install Flask Flask-Bcrypt psycopg2-binary python-dotenv python-dateutil
    ```
4.  **Configure as Variáveis de Ambiente:**
    * Crie um arquivo `.env` na raiz do projeto.
    * Adicione as credenciais do seu banco de dados Supabase:
        ```
        SB_HOST=seu_host_supabase
        SB_PORT=5432
        SB_DATABASE=postgres
        SB_USER=postgres
        SB_PASSWORD=sua_senha_supabase
        ```
5.  **Prepare o Banco de Dados:**
    * Acesse o SQL Editor no seu projeto Supabase.
    * Execute o script `01_schema_definitivo.sql` para criar toda a estrutura do banco.
    * Em seguida, execute o script `02_dados_definitivos.sql` para popular o banco com dados de teste realistas.
6.  **Inicie o Servidor Backend:**
    ```bash
    python app.py
    ```
7.  **Acesse a Aplicação:**
    * Abra seu navegador e acesse `http://localhost:5000`.

---
