const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.json());

// In-memory state (to simulate DB during MVP)
const matches = {};
const companies = [
  { id: '1', name: 'Motel', baseCapital: 50000 },
  { id: '2', name: 'Açougue', baseCapital: 25000 },
  { id: '3', name: 'Startup', baseCapital: 100000 }
];
const scenarios = [
  { id: 's1', companyId: 'all', title: 'O Dilema do Alto Desempenho', description: 'Seu melhor vendedor gera 40% da receita trimestral. Ele foi denunciado anonimamente por assédio moral contra estagiários. A meta do trimestre depende dele.', choices: [
    { id: 'c1', text: 'Abre investigação imediata e o afasta preventivamente', financialImpact: -25000, feedback: 'Você perdeu a meta do trimestre, mas mitigou um passivo trabalhista imenso e a equipe ganhou confiança na liderança.' },
    { id: 'c2', text: 'Convoca uma conversa particular antes de qualquer ação', financialImpact: -15000, feedback: 'A conversa vazou. O vendedor se sentiu perseguido e pediu demissão. Pior dos dois mundos.' },
    { id: 'c3', text: 'Arquiva a denúncia até o fim do trimestre para não comprometer resultados', financialImpact: -80000, feedback: 'Meta batida! Mas no mês seguinte o MPT multou a empresa pesadamente por omissão e danos morais coletivos.' }
  ]},
  { id: 's2', companyId: 'all', title: 'A Promoção Polêmica', description: 'Dois disputam uma promoção. O mais qualificado tem histórico de conflitos. O outro é querido, mas entrega resultados medianos.', choices: [
    { id: 'c1', text: 'O mais qualificado — performance é o critério principal', financialImpact: -10000, feedback: 'A entrega individual subiu, mas ele destruiu a equipe. O turnover (rotatividade) aumentou gerando custos rescisórios altos.' },
    { id: 'c2', text: 'O mais querido — clima organizacional é estratégico', financialImpact: -5000, feedback: 'O clima continuou bom, mas a área estagnou em inovação e perdeu participação de mercado para a concorrência.' },
    { id: 'c3', text: 'Suspende a promoção e busca candidato externo', financialImpact: 15000, feedback: 'Atrasou a área em 3 meses, mas a nova liderança externa pacificou os conflitos e trouxe novas técnicas. Retorno positivo a longo prazo.' }
  ]},
  { id: 's3', companyId: 'all', title: 'A Carta na Manga do Concorrente', description: 'Um colaborador chave recebeu proposta do concorrente 60% acima do salário. Precisa de resposta em 48h. A política só permite 30% de contra-proposta.', choices: [
    { id: 'c1', text: 'Faz a contra-proposta de 30% e aceita o risco', financialImpact: -15000, feedback: 'Ele aceitou ir para o concorrente. Você teve custos com nova contratação e perda temporária de produtividade, mas manteve a justiça interna.' },
    { id: 'c2', text: 'Quebra a política salarial (60%) como exceção estratégica', financialImpact: -45000, feedback: 'A notícia vazou. No mês seguinte, outros 5 talentos pediram 60% de aumento ameaçando sair. Efeito dominó financeiro.' },
    { id: 'c3', text: 'Agradece, deseja boa sorte e inicia sucessão', financialImpact: 10000, feedback: 'Perdeu um talento, mas a rápida promoção de um júnior motivou a base e o custo da folha caiu consideravelmente.' }
  ]},
  { id: 's4', companyId: 'all', title: 'O Esgotamento Invisível', description: 'Uma gestora de alta performance está faltando e isolada. Diz que "está bem", mas o RH percebe sinais claros de burnout.', choices: [
    { id: 'c1', text: 'Respeita a declaração dela e monitora à distância', financialImpact: -30000, feedback: 'Ela colapsou um mês depois, foi internada e ficou 6 meses afastada pelo INSS. A área afundou sem ela.' },
    { id: 'c2', text: 'Convoca uma reunião formal sobre as entregas', financialImpact: -40000, feedback: 'A pressão foi o gatilho final. Ela processou a empresa por assédio moral e adoecimento ocupacional.' },
    { id: 'c3', text: 'Propõe afastamento remunerado e encaminha para suporte', financialImpact: 5000, feedback: 'Afastamento de 15 dias. Ela se recuperou, sentiu-se cuidada e voltou engajada, evitando um passivo gigante.' }
  ]},
  { id: 's5', companyId: 'all', title: 'O Vazamento de Dentro', description: 'Dados de folha de pagamento vazaram no WhatsApp. A investigação aponta para alguém do RH, mas não há prova definitiva.', choices: [
    { id: 'c1', text: 'Demite o suspeito com base nos indícios e gravidade', financialImpact: -50000, feedback: 'Sem provas irrefutáveis, ele reverteu a demissão na Justiça como discriminatória e gerou uma indenização absurda.' },
    { id: 'c2', text: 'Abre processo investigativo formal antes de qualquer decisão', financialImpact: -5000, feedback: 'O processo custou auditoria externa, mas o verdadeiro culpado foi descoberto (era um hack de phishing, não o RH).' },
    { id: 'c3', text: 'Aplica suspensão e aguarda o colaborador se manifestar', financialImpact: -20000, feedback: 'Ilegal. Suspensão sem provas gerou danos morais imediatos.' }
  ]},
  { id: 's6', companyId: 'all', title: 'A Gestante Inconveniente', description: 'Funcionária anuncia gravidez semanas após iniciar um Plano de Melhoria de Performance (PIP). O gestor quer continuar.', choices: [
    { id: 'c1', text: 'Suspende o PIP durante a gestação e licença', financialImpact: -15000, feedback: 'A performance ruim se manteve até a licença, gerando gargalo operacional. Mas blindou 100% o risco jurídico.' },
    { id: 'c2', text: 'Continua o PIP normalmente — a gravidez não muda o desempenho', financialImpact: -60000, feedback: 'A pressão do PIP causou estresse na gestante. A Justiça considerou o ato discriminatório. Multa pesada.' },
    { id: 'c3', text: 'Substitui o PIP por um acompanhamento informal', financialImpact: 8000, feedback: 'Abordagem humana e técnica. O estresse caiu, o desempenho dela surpreendeu e o clima melhorou.' }
  ]},
  { id: 's7', companyId: 'all', title: 'A Cultura do Silêncio', description: 'Pesquisa revela que 70% do time tem medo do gestor (que tem ótimas entregas e proteção da diretoria).', choices: [
    { id: 'c1', text: 'Apresenta os dados à diretoria e propõe coaching', financialImpact: 12000, feedback: 'A diretoria bancou o coaching executivo. O gestor amadureceu, manteve entregas e reduziu o medo da equipe.' },
    { id: 'c2', text: 'Realiza rodas de conversa com o time sem o gestor', financialImpact: -18000, feedback: 'O gestor viu isso como motim do RH e retaliou o time. O clima ficou insuportável e talentos pediram demissão.' },
    { id: 'c3', text: 'Aguarda a próxima pesquisa para confirmar o padrão', financialImpact: -25000, feedback: 'A equipe percebeu a inércia do RH. Os melhores saíram para o concorrente levando os clientes junto.' }
  ]},
  { id: 's8', companyId: 'all', title: 'O Favorito do CEO', description: 'O CEO indica um amigo que não passou nos testes técnicos para liderança.', choices: [
    { id: 'c1', text: 'Adapta o processo para que ele passe sem expor o CEO', financialImpact: -40000, feedback: 'Ele assumiu a área, tomou decisões catastróficas por falta de técnica e destruiu uma margem de lucro importante.' },
    { id: 'c2', text: 'Informa o CEO e sugere uma vaga mais adequada ao perfil', financialImpact: 20000, feedback: 'Postura consultiva. O amigo foi para uma área institucional (onde brilhava) e a vaga original ficou com o talento certo.' },
    { id: 'c3', text: 'Cancela o processo e reabre com critérios tendenciosos', financialImpact: -10000, feedback: 'A equipe interna percebeu a farsa e a credibilidade do RH e do CEO foram para o lixo.' }
  ]},
  { id: 's9', companyId: 'all', title: 'A Demissão que Viralizou', description: 'Ex-funcionário posta relato emocionado (e parcialmente falso) sobre sua demissão que viraliza. O que fazer?', choices: [
    { id: 'c1', text: 'Emite nota oficial rebatendo os pontos', financialImpact: -35000, feedback: 'Efeito Streisand. A nota oficial atraiu a grande mídia e cancelamento na internet. Vendas despencaram.' },
    { id: 'c2', text: 'Entra em contato privado para entender e resolver', financialImpact: 5000, feedback: 'Resolução extrajudicial amigável. Ele apagou o post e publicou uma retratação elogiando a postura humana da empresa.' },
    { id: 'c3', text: 'Não se manifesta publicamente', financialImpact: -15000, feedback: 'A falta de resposta validou a versão dele para o público. A reputação da marca empregadora afundou.' }
  ]},
  { id: 's10', companyId: 'all', title: 'O Talento Tóxico', description: 'Dev sênior é brilhante, mas sabota colegas sutilmente. Três pessoas já pediram transferência por causa dele.', choices: [
    { id: 'c1', text: 'Inicia processo disciplinar usando as transferências como prova', financialImpact: -20000, feedback: 'As transferências não eram provas documentais claras. Ele revidou processando por perseguição e saiu levando códigos-chave.' },
    { id: 'c2', text: 'Confronta o comportamento diretamente antes de formalizar', financialImpact: 10000, feedback: 'Ele achava que era intocável. O choque de realidade alinhou a postura e a equipe voltou a performar.' },
    { id: 'c3', text: 'Redistribui o time para minimizar o contato', financialImpact: -30000, feedback: 'Isolar ele virou um gargalo produtivo imenso. Projetos travaram porque os silos de informação aumentaram.' }
  ]},
  { id: 's11', companyId: 'all', title: 'A Remuneração que Divide', description: 'Dois profissionais com cargo e entregas idênticos têm salário 35% diferente. Um deles é mulher.', choices: [
    { id: 'c1', text: 'Corrige imediatamente e comunica a colaboradora', financialImpact: 20000, feedback: 'Impacto forte no caixa inicial, mas blindou o risco de compliance. Ela virou embaixadora da marca e reteve clientes-chave.' },
    { id: 'c2', text: 'Propõe um plano gradual de correção', financialImpact: -50000, feedback: 'Ela descobriu a diferença antes do plano terminar, considerou má-fé, pediu demissão e processou a empresa por equiparação.' },
    { id: 'c3', text: 'Aguarda aprovação de uma política formal', financialImpact: -80000, feedback: 'Inércia. Uma auditoria do ministério do trabalho flagrou a discrepância estrutural e aplicou multa milionária.' }
  ]},
  { id: 's12', companyId: 'all', title: 'O Processo Viciado', description: 'Gestor eliminou todos os candidatos que não eram do mesmo perfil demográfico que ele.', choices: [
    { id: 'c1', text: 'Cancela o processo e o reconduz com outro avaliador', financialImpact: -5000, feedback: 'Atrasou a vaga, mas evitou a perpetuação de um ambiente segregado e evitou escândalo ESG.' },
    { id: 'c2', text: 'Questiona o gestor e propõe critérios objetivos', financialImpact: 15000, feedback: 'O gestor recuou, aceitou a matriz de competências e um candidato diverso excepcional foi contratado gerando muita inovação.' },
    { id: 'c3', text: 'Homologa o resultado por baixo risco jurídico', financialImpact: -45000, feedback: 'A bolha se fechou. A área ficou míope para o mercado, lançou um produto insensível e perdeu milhões em boicote.' }
  ]},
  { id: 's13', companyId: 'all', title: 'A Liderança que Adoece', description: 'Área com índice altíssimo de burnout, mas o gestor traz as melhores entregas da empresa.', choices: [
    { id: 'c1', text: 'Define metas de saúde atreladas ao bônus de resultado', financialImpact: 25000, feedback: 'Ele entendeu que "como" entrega importa. Mudou a gestão, o burnout zerou e as entregas continuaram altas.' },
    { id: 'c2', text: 'Inicia processo de desligamento por risco organizacional', financialImpact: -60000, feedback: 'Você perdeu a principal fonte de receita da empresa de uma vez só. O fluxo de caixa despencou.' },
    { id: 'c3', text: 'Contrata suporte psicológico para o time', financialImpact: -15000, feedback: 'Enxugar gelo. O psicólogo era pago pela empresa para curar a doença que a própria empresa causava. Turnou-over continuou alto.' }
  ]},
  { id: 's14', companyId: 'all', title: 'A Denúncia de Segunda Mão', description: 'Colaboradora reporta (com sigilo) assédio sexual contra uma colega (que tem medo de falar).', choices: [
    { id: 'c1', text: 'Respeita o sigilo e aguarda a vítima se manifestar', financialImpact: -90000, feedback: 'Omitir-se em caso de assédio gerou conivência. A vítima denunciou no Ministério Público e a empresa foi responsabilizada.' },
    { id: 'c2', text: 'Busca a vítima discretamente para oferecer apoio', financialImpact: 10000, feedback: 'A abordagem empática deu coragem para ela falar. O assediador foi demitido, blindando a empresa de escândalos.' },
    { id: 'c3', text: 'Inicia investigação formal quebrando o sigilo', financialImpact: -30000, feedback: 'Ninguém mais confiou no RH para relatar nada. A vítima negou tudo por medo da exposição abrupta.' }
  ]},
  { id: 's15', companyId: 'all', title: 'Plano de Demissão em Massa', description: 'Corte de 20%. Na lista há grávidas, pessoas em tratamento e membros da CIPA.', choices: [
    { id: 'c1', text: 'Executa a lista e aciona o jurídico', financialImpact: -150000, feedback: 'Reintegração judicial de todos os casos sensíveis com multas enormes e danos morais. Catástrofe financeira.' },
    { id: 'c2', text: 'Devolve a lista com análise de risco para diretoria', financialImpact: 18000, feedback: 'Atuação estratégica. A diretoria ajustou os alvos e a demissão ocorreu sem um único processo trabalhista passivo.' },
    { id: 'c3', text: 'Remove os casos sensíveis por conta própria', financialImpact: -12000, feedback: 'Insubordinação. A diretoria não gostou da sua autonomia e demitiu VOCÊ no processo.' }
  ]},
  { id: 's16', companyId: 'all', title: 'O Estagiário que Viu Demais', description: 'Estagiário presencia o CFO falsificando horas para ganhar bônus. Relata ao RH com medo.', choices: [
    { id: 'c1', text: 'Registra formalmente no canal de compliance', financialImpact: 35000, feedback: 'O comitê global demitiu o CFO, poupou a empresa de fraude financeira e o estagiário foi efetivado.' },
    { id: 'c2', text: 'Aconselha o estagiário a não se envolver', financialImpact: -100000, feedback: 'O CFO roubou milhões ao longo de um ano. Quando descoberto, ele usou você (RH) como cúmplice por saber e não falar.' },
    { id: 'c3', text: 'Confronta o CFO diretamente', financialImpact: -40000, feedback: 'O CFO destruiu as provas antes da auditoria e forçou a demissão do estagiário e a sua.' }
  ]},
  { id: 's17', companyId: 'all', title: 'A Cultura de Puxa-Saco', description: '80% dos promovidos são os que têm visibilidade com a diretoria, independente de performance.', choices: [
    { id: 'c1', text: 'Propõe modelo de avaliação objetiva à diretoria', financialImpact: 22000, feedback: 'A meritocracia reduziu a insatisfação. A empresa parou de perder talentos técnicos para a concorrência e inovou mais.' },
    { id: 'c2', text: 'Usa o modelo atual a favor dos seus talentos', financialImpact: -5000, feedback: 'Isso é "politicagem". A operação continuou ineficiente e os cargos altos inflacionaram sem retorno real.' },
    { id: 'c3', text: 'Documenta o padrão e aguarda nova liderança', financialImpact: -25000, feedback: 'A inércia sangrou o caixa da empresa pagando fortunas para "amigos" improdutivos.' }
  ]},
  { id: 's18', companyId: 'all', title: 'O Retorno que Ninguém Quer', description: 'Colaborador volta de licença psiquiátrica. Gestor pede para o RH "encontrar uma saída".', choices: [
    { id: 'c1', text: 'Nega e estrutura reintegração gradual', financialImpact: 10000, feedback: 'Postura correta. Ele se recuperou incrivelmente bem e a empresa escapou do crime de discriminação no retorno médico.' },
    { id: 'c2', text: 'Avalia se ele se encaixa e propõe realocação', financialImpact: -8000, feedback: 'A realocação forçada gerou insatisfação. Ele se sentiu "rebaixado" e não performou na nova área.' },
    { id: 'c3', text: 'Oferece demissão consensual antes do retorno', financialImpact: -80000, feedback: 'Ato discriminatório claríssimo. Ele não assinou, processou a empresa por assédio e lucrou em cima da má gestão.' }
  ]},
  { id: 's19', companyId: 'all', title: 'A Referência que Destrói', description: 'Em checagem, ex-gestor diz em off que o candidato desviou dinheiro, mas sem registro oficial.', choices: [
    { id: 'c1', text: 'Descarta o candidato com base na informação', financialImpact: -5000, feedback: 'Você perdeu um excelente candidato por conta de uma fofoca de um gestor vingativo (que era mentira).' },
    { id: 'c2', text: 'Aprofunda a investigação buscando outras fontes', financialImpact: 15000, feedback: 'Investigação mostrou que o candidato era íntegro e o antigo gestor era quem desviava. Excelente contratação realizada.' },
    { id: 'c3', text: 'Ignora o relato off the record', financialImpact: -60000, feedback: 'Você contratou e... ele roubou a sua empresa também. Faltou cruzar dados de background check corporativo.' }
  ]},
  { id: 's20', companyId: 'all', title: 'O Whistleblower Inconveniente', description: 'Canal anônimo relata fraude grave. A fraude é real. A liderança pede para você identificar o denunciante para "proteger".', choices: [
    { id: 'c1', text: 'Colabora com a identificação para "proteger"', financialImpact: -200000, feedback: 'A liderança o demitiu. Você vazou dados confidenciais de canal de denúncia. A empresa e VOCÊ viraram réus em escândalo nacional.' },
    { id: 'c2', text: 'Recusa e garante anonimato absoluto', financialImpact: 30000, feedback: 'Você salvou o canal de integridade. A liderança teve que resolver o rombo sem retaliar ninguém, poupando milhões em multas.' },
    { id: 'c3', text: 'Consulta o jurídico antes de revelar', financialImpact: -15000, feedback: 'O jurídico vazou a informação extra-oficialmente. O denunciante sofreu assédio sutil até pedir demissão.' }
  ]}
];

// Socket.io for Multiplayer Lobby
io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  socket.on('create_match', (data) => {
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    matches[roomCode] = {
      roomCode,
      status: 'LOBBY',
      players: [{ socketId: socket.id, name: data.name, companyId: null }]
    };
    socket.join(roomCode);
    socket.emit('match_created', { roomCode, players: matches[roomCode].players });
  });

  socket.on('join_match', (data) => {
    const { roomCode, name } = data;
    if (matches[roomCode]) {
      matches[roomCode].players.push({ socketId: socket.id, name, companyId: null });
      socket.join(roomCode);
      io.to(roomCode).emit('player_joined', matches[roomCode].players);
    }
  });
  
  socket.on('start_game', (roomCode) => {
    if (matches[roomCode]) {
      // Assign random companies to players
      matches[roomCode].players.forEach((p, index) => {
         p.companyId = companies[index % companies.length].id;
         p.balance = companies[index % companies.length].baseCapital;
      });
      matches[roomCode].status = 'IN_PROGRESS';
      matches[roomCode].currentRound = 1;
      
      io.to(roomCode).emit('game_started', matches[roomCode]);
      
      // Simulate sending a scenario
      setTimeout(() => {
        io.to(roomCode).emit('new_scenario', scenarios[0]);
      }, 2000);
    }
  });

  socket.on('player_choice', (data) => {
    const { roomCode, choice } = data;
    const match = matches[roomCode];
    if (match) {
      // Find the player and update their balance
      const player = match.players.find(p => p.socketId === socket.id);
      if (player) {
         player.balance += choice.financialImpact;
      }
      
      // Advance to next round (MVP simple logic)
      match.currentRound++;
      
      // Update players state
      io.to(roomCode).emit('game_started', match); 
      
      if (match.currentRound <= scenarios.length) {
         // Send next scenario after a short delay to simulate "processing"
         setTimeout(() => {
           io.to(roomCode).emit('new_scenario', scenarios[match.currentRound - 1]);
         }, 1500);
      } else {
         // End game
         io.to(roomCode).emit('game_over', match);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Jogador desconectou:', socket.id);
  });
});

// Servir o Frontend React (Vite) construído no mesmo servidor (Apenas Produção)
const path = require('path');
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
