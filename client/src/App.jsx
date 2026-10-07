import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './index.css';

// Initialize socket connection (Usa a URL relativa para permitir acesso externo via Proxy)
const socket = io({ path: '/socket.io' });

function App() {
  const [view, setView] = useState('LOBBY'); // LOBBY, ROOM, GAME
  const [myName, setMyName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [players, setPlayers] = useState([]);
  
  // Game State
  const [myCompany, setMyCompany] = useState(null);
  const [myBalance, setMyBalance] = useState(0);
  const [currentScenario, setCurrentScenario] = useState(null);
  
  // Feedback Modal State
  const [feedback, setFeedback] = useState(null); // { text, impact, details }

  useEffect(() => {
    socket.on('match_created', (data) => {
      setCurrentRoom(data.roomCode);
      setPlayers(data.players);
      setView('ROOM');
    });

    socket.on('player_joined', (updatedPlayers) => {
      setPlayers(updatedPlayers);
      setView('ROOM');
    });

    socket.on('game_started', (matchData) => {
      const me = matchData.players.find(p => p.socketId === socket.id);
      if (me) {
        setMyCompany(me.companyId);
        setMyBalance(me.balance);
      }
      setView('GAME');
    });

    socket.on('new_scenario', (scenario) => {
      setCurrentScenario(scenario);
      setFeedback(null); // Clear modal when new scenario arrives
    });

    socket.on('game_over', (matchData) => {
      const me = matchData.players.find(p => p.socketId === socket.id);
      if (me) setMyBalance(me.balance);
      setFeedback({
        text: 'Fim de Jogo!',
        details: 'A simulação chegou ao fim. Verifique seu saldo final e veja se você sobreviveu ao mercado.',
        impact: me?.balance
      });
      // Atrasar a volta ao lobby
      setTimeout(() => {
        setView('LOBBY');
        setFeedback(null);
      }, 5000);
    });

    return () => {
      socket.off('match_created');
      socket.off('player_joined');
      socket.off('game_started');
      socket.off('new_scenario');
      socket.off('game_over');
    };
  }, []); 

  const handleCreateRoom = () => {
    const nameToUse = myName || 'CEO';
    setMyName(nameToUse);
    socket.emit('create_match', { name: nameToUse });
  };

  const handleJoinRoom = () => {
    if (!roomCodeInput) return;
    const nameToUse = myName || 'Sócio';
    setMyName(nameToUse);
    setCurrentRoom(roomCodeInput.toUpperCase());
    socket.emit('join_match', { roomCode: roomCodeInput.toUpperCase(), name: nameToUse });
  };

  const handleStartGame = () => {
    socket.emit('start_game', currentRoom);
  };

  const handleChoice = (choice) => {
    // Exibe o modal customizado com o feedback da escolha em vez do alert feio
    setFeedback({
      text: choice.text,
      details: choice.feedback || 'Sua decisão foi aplicada.',
      impact: choice.financialImpact
    });
    
    setCurrentScenario(null); // Esconde o cenário atual
    
    socket.emit('player_choice', { roomCode: currentRoom, choice });
  };

  return (
    <>
      <header>
        <h1 className="title">Biz & HR Simulator</h1>
      </header>

      {view === 'LOBBY' && (
        <main className="card">
          <h2>Bem-vindo à Diretoria</h2>
          <div>
            <input 
              type="text" 
              placeholder="Digite seu Nome" 
              value={myName} 
              onChange={(e) => setMyName(e.target.value)} 
            />
          </div>
          <button onClick={handleCreateRoom}>Fundar Nova Empresa (Criar Sala)</button>
          
          <div className="join-room">
            <input 
              type="text" 
              placeholder="Código de Convite da Sala" 
              value={roomCodeInput} 
              onChange={(e) => setRoomCodeInput(e.target.value)} 
            />
            <button onClick={handleJoinRoom}>Juntar-se à Sala</button>
          </div>
        </main>
      )}

      {view === 'ROOM' && (
        <main className="card">
          <h2>Código da Sala: <span>{currentRoom}</span></h2>
          <ul className="player-list">
            {players.map((p, idx) => (
              <li key={idx}>{p.name}</li>
            ))}
          </ul>
          <button onClick={handleStartGame}>Iniciar Simulação</button>
        </main>
      )}

      {view === 'GAME' && (
        <main>
          <div className="dashboard">
            <div className="stat-card">
              <h3>Sua Empresa (ID)</h3>
              <p>{myCompany === '1' ? 'Motel' : myCompany === '2' ? 'Açougue' : myCompany === '3' ? 'Startup' : myCompany || 'Carregando...'}</p>
            </div>
            <div className="stat-card">
              <h3>Caixa da Empresa</h3>
              <p>R$ {myBalance.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {currentScenario ? (
            <div className="scenario-card" key={currentScenario.id}>
              <h2>{currentScenario.title}</h2>
              <p>{currentScenario.description}</p>
              <div className="choices">
                {currentScenario.choices.map((choice) => (
                  <button 
                    key={choice.id} 
                    className="choice-btn"
                    onClick={() => handleChoice(choice)}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="scenario-card">
              <h2>Aguardando próximo mês...</h2>
              <p>O mercado está processando as decisões de todos os executivos. Fique atento ao relatório financeiro.</p>
            </div>
          )}

          {/* Modal de Feedback Customizado */}
          {feedback && (
            <div className="feedback-overlay">
              <div className="feedback-modal">
                <h3>Decisão Executada</h3>
                <p>{feedback.details}</p>
                <div className={feedback.impact >= 0 ? 'impact-positive' : 'impact-negative'}>
                  Impacto no Caixa: {feedback.impact > 0 ? '+' : ''}R$ {feedback.impact.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </>
  );
}

export default App;
