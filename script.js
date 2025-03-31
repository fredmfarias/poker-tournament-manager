const blindSound = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');

// Pré-carregar o som para melhorar a resposta
blindSound.load();

// Função para tocar o som com várias tentativas para contornar restrições do navegador
function playBlindSound() {
  // Configurar som para melhor compatibilidade
  blindSound.volume = 1.0;
  blindSound.currentTime = 0;
  
  const playPromise = blindSound.play();
  
  // Tratar erro de reprodução 
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log("Erro ao reproduzir som:", error);
      
      // Segunda tentativa com delay
      setTimeout(() => {
        blindSound.play().catch(e => {
          console.log("Segunda tentativa falhou:", e);
          
          // Criar notificação visual como backup
          showBlindNotification();
        });
      }, 200);
    });
  }

  showBlindNotification();
}

// Notificação visual como backup quando o som falha
function showBlindNotification() {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = 'blind-notification';
  notification.textContent = `BLIND AUMENTOU!`;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.backgroundColor = '#ff5722';
  notification.style.color = 'white';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '4px';
  notification.style.zIndex = '1000';
  notification.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
  
  document.body.appendChild(notification);
  
  // Fazer a notificação piscar para chamar atenção
  let visible = true;
  const blinkInterval = setInterval(() => {
    notification.style.visibility = visible ? 'visible' : 'hidden';
    visible = !visible;
  }, 500);
  
  // Remover após alguns segundos
  setTimeout(() => {
    clearInterval(blinkInterval);
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const tournamentForm = document.getElementById('tournament-form');
  const configSection = document.getElementById('config-section');
  const tournamentSection = document.getElementById('tournament-section');
  const paidPositionsInput = document.getElementById('paid-positions');
  const homePotInput = document.getElementById('home-pot');
  const prizeDistribution = document.getElementById('prize-distribution');
  const prizeSumWarning = document.getElementById('prize-sum-warning');
  const saveConfigBtn = document.getElementById('save-config');
  const clearConfigBtn = document.getElementById('clear-config');
  const backToConfigBtn = document.getElementById('back-to-config');
  const startPauseTournamentBtn = document.getElementById('start-pause-tournament');
  
  // Botões de controle do torneio
  const addBuyinBtn = document.getElementById('add-buyin');
  const removePlayerBtn = document.getElementById('remove-player');
  const addRebuyBtn = document.getElementById('add-rebuy');
  const addAddonBtn = document.getElementById('add-addon');
  
  // Elementos de exibição
  const tournamentTitle = document.getElementById('tournament-title');
  const levelDisplay = document.getElementById('level');
  const totalTimeDisplay = document.getElementById('total-time');
  const blindsDisplay = document.getElementById('blinds');
  const nextIncreaseDisplay = document.getElementById('next-increase');
  const buyinDisplay = document.getElementById('buyin');
  const playersDisplay = document.getElementById('players');
  const rebuysDisplay = document.getElementById('rebuys');
  const addonsDisplay = document.getElementById('addons');
  const totalChipsDisplay = document.getElementById('total-chips');
  const totalPrizeDisplay = document.getElementById('total-prize');
  const averageStackDisplay = document.getElementById('average-stack');
  const prizeTableBody = document.getElementById('prize-table-body');
  
  // Estado do torneio
  let tournament = {
    // Configurações
    title: '',
    buyInValue: 0,
    buyInChips: 0,
    addonValue: 0,
    addonChips: 0,
    paidPositions: 0,
    homePot: 0,
    prizeDistribution: [],
    initBlind: 0,
    timeToIncrease: 0,
    increase: 0,
    levelMaxRebuy: 0,
    
    // Estado atual
    isRunning: false,
    level: 1,
    totalSeconds: 0,
    remainingSeconds: 0,
    buyin: 0,
    players: 0,
    rebuys: 0,
    addons: 0,
    smallBlind: 0,
    bigBlind: 0,
    
    // Temporizadores e timestamps
    animationFrameId: null,
    startTimestamp: 0,
    lastUpdateTimestamp: 0,
    pausedTotalTime: 0,
    pausedRemainingTime: 0,
    timeHiddenAt: 0,
    
    // Controle de som
    pendingBlindChanges: []
  };
  
  // Carregar configurações salvas
  function loadSavedConfig() {
    const savedConfig = localStorage.getItem('pokerTournamentConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      
      // Preencher formulário
      document.getElementById('title').value = config.title || '';
      document.getElementById('buy-in-value').value = config.buyInValue || '';
      document.getElementById('buy-in-chips').value = config.buyInChips || '';
      document.getElementById('addon-value').value = config.addonValue || '';
      document.getElementById('addon-chips').value = config.addonChips || '';
      document.getElementById('paid-positions').value = config.paidPositions || '';
      document.getElementById('home-pot').value = config.homePot || '';
      document.getElementById('init-blind').value = config.initBlind || '';
      document.getElementById('time-to-increase').value = config.timeToIncrease || '';
      document.getElementById('increase').value = config.increase || '';
      document.getElementById('level-max-rebuy').value = config.levelMaxRebuy || '';
      
      // Se tiver posições pagas configuradas, renderizar os campos de distribuição
      if (config.paidPositions > 0) {
        renderPrizeDistribution(config.paidPositions, config.prizeDistribution);
      }
      
      // Retornar as configurações carregadas
      return config;
    }
    return null;
  }
  
  // Salvar configurações
  function saveConfig() {
    const config = {
      title: document.getElementById('title').value,
      buyInValue: parseFloat(document.getElementById('buy-in-value').value),
      buyInChips: parseInt(document.getElementById('buy-in-chips').value),
      addonValue: parseFloat(document.getElementById('addon-value').value),
      addonChips: parseInt(document.getElementById('addon-chips').value),
      paidPositions: parseInt(document.getElementById('paid-positions').value),
      homePot: parseFloat(document.getElementById('home-pot').value),
      prizeDistribution: [],
      initBlind: parseInt(document.getElementById('init-blind').value),
      timeToIncrease: parseInt(document.getElementById('time-to-increase').value),
      increase: parseInt(document.getElementById('increase').value),
      levelMaxRebuy: parseInt(document.getElementById('level-max-rebuy').value)
    };
    
    // Obter a distribuição de prêmios
    for (let i = 0; i < config.paidPositions; i++) {
      const prizeInput = document.getElementById(`prize-position-${i+1}`);
      config.prizeDistribution.push(parseFloat(prizeInput.value));
    }
    
    // Validar se a soma dos prêmios mais o home pot é 100%
    const prizeSum = config.prizeDistribution.reduce((sum, value) => sum + value, 0);
    
    if (Math.abs(prizeSum - 100) > 0.01) {
      prizeSumWarning.textContent = `A soma dos prêmios deve ser 100%. Atual: ${prizeSum.toFixed(2)}%`;
      return false;
    }
    
    // Limpar aviso se estiver tudo certo
    prizeSumWarning.textContent = '';
    
    // Salvar no localStorage
    localStorage.setItem('pokerTournamentConfig', JSON.stringify(config));
    
    // Atualizar o estado do torneio
    Object.assign(tournament, config);
    tournament.level = 1;
    tournament.totalSeconds = 0;
    tournament.remainingSeconds = config.timeToIncrease * 60;
    tournament.smallBlind = Math.floor(config.initBlind / 2);
    tournament.bigBlind = config.initBlind;
    tournament.buyin = 0;
    tournament.players = 0;
    tournament.rebuys = 0;
    tournament.addons = 0;
    tournament.pausedTotalTime = 0;
    tournament.pausedRemainingTime = config.timeToIncrease * 60;
    tournament.pendingBlindChanges = [];
    
    startPauseTournamentBtn.textContent = 'Iniciar Torneio';

    return true;
  }
  
  // Limpar configurações
  function clearConfig() {
    localStorage.removeItem('pokerTournamentConfig');
    tournamentForm.reset();
    prizeDistribution.innerHTML = '';
    prizeSumWarning.textContent = '';
  }
  
  // Renderizar campos para distribuição de prêmios
  function renderPrizeDistribution(positions, values = []) {
    prizeDistribution.innerHTML = '';
    
    for (let i = 0; i < positions; i++) {
      const row = document.createElement('div');
      row.className = 'form-row';
      
      const label = document.createElement('label');
      label.htmlFor = `prize-position-${i+1}`;
      label.textContent = `Posição ${i+1} (%)`;
      
      const input = document.createElement('input');
      input.type = 'number';
      input.id = `prize-position-${i+1}`;
      input.min = '0';
      input.max = '100';
      input.step = '0.1';
      input.placeholder = `Percentual para a posição ${i+1}`;
      input.required = true;
      input.value = values[i] || '';
      
      row.appendChild(label);
      row.appendChild(input);
      prizeDistribution.appendChild(row);
    }
  }
  
  // Atualizar o painel do torneio
  function updateTournamentPanel() {
    // Atualizar informações básicas
    tournamentTitle.textContent = tournament.title;
    levelDisplay.textContent = tournament.level;
    blindsDisplay.textContent = `${tournament.smallBlind}/${tournament.bigBlind}`;
    
    // Atualizar o tempo total
    totalTimeDisplay.textContent = formatTime(tournament.totalSeconds);
    
    // Atualizar o tempo para o próximo aumento
    nextIncreaseDisplay.textContent = formatTime(tournament.remainingSeconds);
    
    // Atualizar status
    buyinDisplay.textContent = tournament.buyin;
    playersDisplay.textContent = tournament.players;
    rebuysDisplay.textContent = tournament.rebuys;
    addonsDisplay.textContent = tournament.addons;
    
    // Calcular e atualizar estatísticas
    const totalBuyIns = tournament.buyin + tournament.rebuys;
    const totalChips = (totalBuyIns * tournament.buyInChips) + (tournament.addons * tournament.addonChips);
    const totalPrize = (totalBuyIns * tournament.buyInValue) + (tournament.addons * tournament.addonValue);
    const averageStack = tournament.players > 0 ? Math.floor(totalChips / tournament.players) : 0;
    
    totalChipsDisplay.textContent = totalChips.toLocaleString();
    totalPrizeDisplay.textContent = `R$ ${totalPrize.toFixed(2)}`;
    averageStackDisplay.textContent = averageStack.toLocaleString();
    
    // Atualizar tabela de premiação
    updatePrizeTable(totalPrize);
  }
  
  // Atualizar a tabela de premiação
  function updatePrizeTable(totalPrize) {
    prizeTableBody.innerHTML = '';
    
    // Calcular o valor disponível para premiação (total menos home pot)
    const availablePrize = totalPrize * (1 - tournament.homePot / 100);
    
    for (let i = 0; i < tournament.paidPositions; i++) {
      const row = document.createElement('tr');
      
      const positionCell = document.createElement('td');
      positionCell.textContent = `${i+1}º lugar`;
      
      const percentCell = document.createElement('td');
      percentCell.textContent = `${tournament.prizeDistribution[i]}%`;
      
      const valueCell = document.createElement('td');
      const prizeValue = availablePrize * (tournament.prizeDistribution[i] / 100);
      valueCell.textContent = `R$ ${prizeValue.toFixed(2)}`;
      
      row.appendChild(positionCell);
      row.appendChild(percentCell);
      row.appendChild(valueCell);
      prizeTableBody.appendChild(row);
    }
    
    // Adicionar a linha do home pot
    if (tournament.homePot > 0) {
      const row = document.createElement('tr');
      
      const positionCell = document.createElement('td');
      positionCell.textContent = 'Home Pot';
      
      const percentCell = document.createElement('td');
      percentCell.textContent = `${tournament.homePot}%`;
      
      const valueCell = document.createElement('td');
      const homePotValue = totalPrize * (tournament.homePot / 100);
      valueCell.textContent = `R$ ${homePotValue.toFixed(2)}`;
      
      row.appendChild(positionCell);
      row.appendChild(percentCell);
      row.appendChild(valueCell);
      prizeTableBody.appendChild(row);
    }
  }
  
  // Função de atualização do temporizador baseada em timestamps
  function updateTimer(timestamp) {
    if (!tournament.isRunning) return;
    
    if (!tournament.lastUpdateTimestamp) {
      // Primeira execução após iniciar/continuar
      tournament.lastUpdateTimestamp = timestamp;
      tournament.animationFrameId = requestAnimationFrame(updateTimer);
      return;
    }
    
    // Calcular o tempo decorrido desde a última atualização (em segundos)
    const elapsed = (timestamp - tournament.lastUpdateTimestamp) / 1000;
    tournament.lastUpdateTimestamp = timestamp;
    
    // Atualizar os contadores de tempo
    tournament.totalSeconds += elapsed;
    tournament.remainingSeconds -= elapsed;
    
    // Verificar se é hora de aumentar os blinds
    if (tournament.remainingSeconds <= 0) {
      // Aumentar o nível e atualizar blinds
      tournament.level++;
      tournament.smallBlind += tournament.increase;
      tournament.bigBlind = tournament.smallBlind * 2;
      tournament.remainingSeconds = tournament.timeToIncrease * 60;
      
      // Registrar o aumento de blind para rastreamento
      const blindChangeRecord = {
        timestamp: Date.now(),
        level: tournament.level,
        smallBlind: tournament.smallBlind,
        bigBlind: tournament.bigBlind,
        soundPlayed: false
      };
      
      // Adicionar à lista de mudanças pendentes
      tournament.pendingBlindChanges.push(blindChangeRecord);
      
      // Salvar no localStorage para persistência
      localStorage.setItem('pendingBlindChanges', JSON.stringify(tournament.pendingBlindChanges));
      
      // Sempre tentar tocar o som, independentemente da visibilidade
      playBlindSound();
      
      // Marcar esta mudança como reproduzida
      blindChangeRecord.soundPlayed = true;
    }
    
    // Atualizar o painel com os novos valores
    updateTournamentPanel();
    
    // Continuar o loop de animação
    tournament.animationFrameId = requestAnimationFrame(updateTimer);
  }
  
  // Iniciar o temporizador do torneio
  function startTimer() {
    if (tournament.isRunning) return;
    
    tournament.isRunning = true;
    tournament.lastUpdateTimestamp = null;
    tournament.animationFrameId = requestAnimationFrame(updateTimer);
    
    startPauseTournamentBtn.textContent = 'Pausar Torneio';
  }
  
  // Pausar o temporizador
  function pauseTimer() {
    if (!tournament.isRunning) return;
    
    if (tournament.animationFrameId) {
      cancelAnimationFrame(tournament.animationFrameId);
      tournament.animationFrameId = null;
    }
    
    tournament.isRunning = false;
    tournament.pausedTotalTime = tournament.totalSeconds;
    tournament.pausedRemainingTime = tournament.remainingSeconds;
    
    startPauseTournamentBtn.textContent = 'Continuar Torneio';
  }
  
  // Formatar tempo em HH:MM:SS ou MM:SS
  function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
    } else {
      return `${padZero(minutes)}:${padZero(remainingSeconds)}`;
    }
  }
  
  // Adicionar zero à esquerda para números menores que 10
  function padZero(num) {
    return num < 10 ? `0${num}` : num;
  }
  
  // Exibir o painel do torneio
  function showTournamentPanel() {
    configSection.style.display = 'none';
    tournamentSection.style.display = 'block';
    updateTournamentPanel();
  }
  
  // Exibir a configuração do torneio
  function showConfigPanel() {
    pauseTimer();
    tournamentSection.style.display = 'none';
    configSection.style.display = 'block';
  }
  
  // Tratar eventos de visibilidade da página
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // A página ficou oculta (tela bloqueada ou aba em segundo plano)
      tournament.timeHiddenAt = performance.now();
      
      // Pausamos o loop de animação, mas não o estado do torneio
      if (tournament.isRunning && tournament.animationFrameId) {
        cancelAnimationFrame(tournament.animationFrameId);
        tournament.animationFrameId = null;
      }
    } else {
      // A página voltou a ficar visível
      if (tournament.isRunning) {
        // Calcular quanto tempo a página ficou oculta
        const hiddenTime = (performance.now() - tournament.timeHiddenAt) / 1000;
        
        // Atualizar os tempos para compensar o período oculto
        if (hiddenTime > 0) {
          tournament.totalSeconds += hiddenTime;
          const previousRemainingSeconds = tournament.remainingSeconds;
          tournament.remainingSeconds -= hiddenTime;
          
          // Verificar se ocorreram mudanças de nível durante o tempo oculto
          const levelsBefore = tournament.level;
          let blindsChanged = false;
          
          while (tournament.remainingSeconds <= 0) {
            tournament.level++;
            tournament.smallBlind += tournament.increase;
            tournament.bigBlind = tournament.smallBlind * 2;
            tournament.remainingSeconds += tournament.timeToIncrease * 60;
            blindsChanged = true;
          }
          
          // Se houve mudança de nível enquanto a página estava oculta
          if (blindsChanged) {
            // Tocar o som quando a página volta à visibilidade
            playBlindSound();
            
            // Registrar as mudanças
            const blindChangeRecord = {
              timestamp: Date.now(),
              level: tournament.level,
              smallBlind: tournament.smallBlind,
              bigBlind: tournament.bigBlind
            };
            
            // Atualizar a notificação visual para informar a mudança mais recente
            showBlindNotification();
          }
          
          // Atualizar o painel
          updateTournamentPanel();
        }
        
        // Reiniciar o loop de animação
        tournament.lastUpdateTimestamp = null;
        tournament.animationFrameId = requestAnimationFrame(updateTimer);
      }
      
      // Verificar e reproduzir mudanças de blind pendentes
      const pendingChanges = JSON.parse(localStorage.getItem('pendingBlindChanges') || '[]');
      if (pendingChanges.length > 0) {
        // Encontrar mudanças não reproduzidas
        const unplayedChanges = pendingChanges.filter(change => !change.soundPlayed);
        
        if (unplayedChanges.length > 0) {
          // Tocar o som apenas uma vez para todas as mudanças pendentes
          playBlindSound();
          
          // Marcar todas como reproduzidas
          pendingChanges.forEach(change => change.soundPlayed = true);
          localStorage.setItem('pendingBlindChanges', JSON.stringify(pendingChanges));
        }
      }
    }
  });
  
  // Setup de Worker para continuar contagem em segundo plano
  if (window.Worker) {
    try {
      const timerWorker = new Worker(URL.createObjectURL(new Blob([`
        let timerInterval;
        
        self.onmessage = function(e) {
          if (e.data.command === 'start') {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
              self.postMessage({type: 'tick'});
            }, 1000);
          } else if (e.data.command === 'stop') {
            clearInterval(timerInterval);
          }
        };
      `], {type: 'text/javascript'})));

      timerWorker.onmessage = function(e) {
        if (e.data.type === 'tick' && tournament.isRunning && document.hidden) {
          // Processar tick em segundo plano
          tournament.totalSeconds += 1;
          tournament.remainingSeconds -= 1;
          
          // Verificar mudanças de blind
          if (tournament.remainingSeconds <= 0) {
            tournament.level++;
            tournament.smallBlind += tournament.increase;
            tournament.bigBlind = tournament.smallBlind * 2;
            tournament.remainingSeconds = tournament.timeToIncrease * 60;
            
            // Registrar mudança para notificação quando visível
            const blindChangeRecord = {
              timestamp: Date.now(),
              level: tournament.level,
              smallBlind: tournament.smallBlind,
              bigBlind: tournament.bigBlind,
              soundPlayed: false
            };
            
            // Salvar no localStorage
            const pendingChanges = JSON.parse(localStorage.getItem('pendingBlindChanges') || '[]');
            pendingChanges.push(blindChangeRecord);
            localStorage.setItem('pendingBlindChanges', JSON.stringify(pendingChanges));
          }
        }
      };
      
      // Iniciar e parar worker conforme estado do torneio
      function updateWorkerState() {
        if (tournament.isRunning) {
          timerWorker.postMessage({command: 'start'});
        } else {
          timerWorker.postMessage({command: 'stop'});
        }
      }
      
      // Monitorar mudanças de estado
      const originalStartTimer = startTimer;
      startTimer = function() {
        originalStartTimer();
        updateWorkerState();
      };
      
      const originalPauseTimer = pauseTimer;
      pauseTimer = function() {
        originalPauseTimer();
        updateWorkerState();
      };
    } catch (e) {
      console.log("Web Worker não suportado ou erro:", e);
    }
  }
  
  // Habilitar o som ao primeiro clique do usuário na página (para contornar restrições de autoplay)
  document.addEventListener('click', function initialUserInteraction() {
    // Tentar reproduzir e pausar imediatamente (em volume 0) para habilitar o áudio
    blindSound.volume = 0;
    blindSound.play().then(() => {
      blindSound.pause();
      blindSound.currentTime = 0;
      blindSound.volume = 1.0;
    }).catch(e => {
      console.log("Não foi possível habilitar áudio automaticamente:", e);
    });
    
    // Remover esse listener após a primeira interação
    document.removeEventListener('click', initialUserInteraction);
  }, { once: true });
  
  // *********** Event Listeners ***********
  
  // Mudar o número de posições pagas
  paidPositionsInput.addEventListener('change', () => {
    const positions = parseInt(paidPositionsInput.value) || 0;
    renderPrizeDistribution(positions);
  });
  
  // Salvar configuração
  tournamentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (saveConfig()) {
      showTournamentPanel();
    }
  });
  
  // Limpar configuração
  clearConfigBtn.addEventListener('click', clearConfig);
  
  // Voltar para configuração
  backToConfigBtn.addEventListener('click', showConfigPanel);
  
  // Iniciar ou pausar o torneio
  startPauseTournamentBtn.addEventListener('click', () => {
    if (tournament.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });
  
  // Adicionar jogador
  addBuyinBtn.addEventListener('click', () => {
    tournament.buyin++;
    tournament.players++;
    updateTournamentPanel();
  });
  
  // Remover jogador
  removePlayerBtn.addEventListener('click', () => {
    if (tournament.players > 0) {
      tournament.players--;
      updateTournamentPanel();
    }
  });
  
  // Adicionar rebuy
  addRebuyBtn.addEventListener('click', () => {
    // Verificar se ainda está dentro do nível permitido para rebuy
    if (tournament.level <= tournament.levelMaxRebuy) {
      tournament.rebuys++;
      updateTournamentPanel();
    } else {
      alert(`Rebuys não permitidos após o nível ${tournament.levelMaxRebuy}`);
    }
  });
  
  // Adicionar addon
  addAddonBtn.addEventListener('click', () => {
    tournament.addons++;
    updateTournamentPanel();
  });
  
  // Carregar configurações salvas ao iniciar
  const savedConfig = loadSavedConfig();
  if (savedConfig) {
    // Se tiver configurações salvas, atualizar o objeto tournament
    Object.assign(tournament, savedConfig);
    tournament.smallBlind = Math.floor(savedConfig.initBlind / 2);
    tournament.bigBlind = savedConfig.initBlind;
    tournament.remainingSeconds = savedConfig.timeToIncrease * 60;
    tournament.pausedRemainingTime = savedConfig.timeToIncrease * 60;
  }
  
  // Carregar quaisquer mudanças de blind pendentes
  tournament.pendingBlindChanges = JSON.parse(localStorage.getItem('pendingBlindChanges') || '[]');
});
