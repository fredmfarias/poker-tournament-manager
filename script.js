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
  const addPlayerBtn = document.getElementById('add-player');
  const removePlayerBtn = document.getElementById('remove-player');
  const addRebuyBtn = document.getElementById('add-rebuy');
  const addAddonBtn = document.getElementById('add-addon');
  
  // Elementos de exibição
  const tournamentTitle = document.getElementById('tournament-title');
  const levelDisplay = document.getElementById('level');
  const totalTimeDisplay = document.getElementById('total-time');
  const blindsDisplay = document.getElementById('blinds');
  const nextIncreaseDisplay = document.getElementById('next-increase');
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
    players: 0,
    rebuys: 0,
    addons: 0,
    smallBlind: 0,
    bigBlind: 0,
    
    // Temporizadores
    timer: null
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
    const totalSum = prizeSum + config.homePot;
    
    if (Math.abs(totalSum - 100) > 0.01) {
      prizeSumWarning.textContent = `A soma dos prêmios e do home pot deve ser 100%. Atual: ${totalSum.toFixed(2)}%`;
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
    tournament.players = 0;
    tournament.rebuys = 0;
    tournament.addons = 0;
    
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
      label.textContent = `Posição ${i+1} (%):`;
      
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
    playersDisplay.textContent = tournament.players;
    rebuysDisplay.textContent = tournament.rebuys;
    addonsDisplay.textContent = tournament.addons;
    
    // Calcular e atualizar estatísticas
    const totalBuyIns = tournament.players + tournament.rebuys;
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
  
  // Iniciar o temporizador do torneio
  function startTimer() {
    if (tournament.timer) clearInterval(tournament.timer);
    
    tournament.timer = setInterval(() => {
      tournament.totalSeconds++;
      tournament.remainingSeconds--;
      
      // Verificar se é hora de aumentar os blinds
      if (tournament.remainingSeconds <= 0) {
        tournament.level++;
        tournament.smallBlind += tournament.increase;
        tournament.bigBlind = tournament.smallBlind * 2;
        tournament.remainingSeconds = tournament.timeToIncrease * 60;
      }
      
      updateTournamentPanel();
    }, 1000);
    
    tournament.isRunning = true;
    startPauseTournamentBtn.textContent = 'Pausar Torneio';
  }
  
  // Pausar o temporizador
  function pauseTimer() {
    if (tournament.timer) {
      clearInterval(tournament.timer);
      tournament.timer = null;
    }
    tournament.isRunning = false;
    startPauseTournamentBtn.textContent = 'Continuar Torneio';
  }
  
  // Formatar tempo em HH:MM:SS ou MM:SS
  function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
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
  addPlayerBtn.addEventListener('click', () => {
    tournament.players++;
    updateTournamentPanel();
  });
  
  // Remover jogador
  /*removePlayerBtn.addEventListener('click', () => {
    if (tournament.players > 0) {
      tournament.players--;
      updateTournamentPanel();
    }
  });*/
  
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
  }
});
