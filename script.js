/**
 * Script Principal - Mercado em Jogo
 */

// Estado global do Jogo
const gameState = {
    playerName: "",
    capital: 1000000,
    round: 1,
    maxRounds: 20,
    events: [],
    currentEvent: null,
    history: [],
    chart: null,
    candleSeries: null,
    baseData: [], // Candles até a pausa
    resolutionData: [], // Candles após a decisão
    decisionMultiplier: 0
};

// Elementos da DOM
const els = {
    screenLogin: document.getElementById('screen-login'),
    screenTutorial: document.getElementById('screen-tutorial'),
    screenGame: document.getElementById('screen-game'),
    screenFinal: document.getElementById('screen-final'),
    
    playerNameInput: document.getElementById('player-name'),
    btnStart: document.getElementById('btn-start'),
    btnUnderstand: document.getElementById('btn-understand'),
    
    header: document.getElementById('game-header'),
    playerNameDisplay: document.getElementById('player-name-display'),
    roundDisplay: document.getElementById('round-display'),
    capitalDisplay: document.getElementById('capital-display'),
    
    chartContainer: document.getElementById('tvchart'),
    assetName: document.getElementById('asset-name'),
    newsBox: document.getElementById('news-box'),
    newsText: document.getElementById('news-text'),
    actionBox: document.getElementById('action-box'),
    investAmount: document.getElementById('investment-amount'),
    quickBtns: document.querySelectorAll('.btn-quick'),
    btnBuy: document.getElementById('btn-buy'),
    btnSell: document.getElementById('btn-sell'),
    btnHold: document.getElementById('btn-hold'),
    
    modal: document.getElementById('round-result-modal'),
    assetVariation: document.getElementById('asset-variation'),
    playerDecision: document.getElementById('player-decision'),
    financialResult: document.getElementById('financial-result'),
    pedagogicalFeedback: document.getElementById('pedagogical-feedback'),
    btnNextRound: document.getElementById('btn-next-round'),

    finalCapital: document.getElementById('final-capital'),
    finalProfitPct: document.getElementById('final-profit-pct'),
    finalProfile: document.getElementById('final-profile'),
    historyTable: document.querySelector('#history-table tbody'),
    btnCopyReport: document.getElementById('btn-copy-report'),
    btnRestart: document.getElementById('btn-restart')
};

// Utils: Formatação de Moeda
const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatPct = (value) => {
    return (value * 100).toFixed(2) + '%';
};

// Transições de Tela
function showScreen(screenEl) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    screenEl.classList.remove('hidden');
    screenEl.classList.add('active');
}

// Inicialização
els.btnStart.addEventListener('click', () => {
    const name = els.playerNameInput.value.trim();
    if (!name) { alert("Por favor, insira seu nome."); return; }
    
    gameState.playerName = name;
    gameState.events = shuffleEventos().slice(0, 20); // Pega 20 rodadas aleatórias
    gameState.capital = 1000000;
    gameState.round = 1;
    gameState.history = [];
    
    els.playerNameDisplay.textContent = name;
    els.capitalDisplay.textContent = formatBRL(gameState.capital);
    
    showScreen(els.screenTutorial);
});

els.btnUnderstand.addEventListener('click', () => {
    els.header.classList.remove('hidden');
    showScreen(els.screenGame);
    initChart();
    loadRound();
});

// Setup do Gráfico Lightweight
function initChart() {
    if (gameState.chart) {
        gameState.chart.remove();
    }
    
    const chartOptions = { 
        layout: { 
            textColor: '#d1d4dc', 
            background: { type: 'solid', color: '#181a20' } 
        },
        grid: {
            vertLines: { color: '#2b3139' },
            horzLines: { color: '#2b3139' }
        },
        timeScale: {
            timeVisible: false,
        }
    };
    gameState.chart = LightweightCharts.createChart(els.chartContainer, chartOptions);
    gameState.candleSeries = gameState.chart.addCandlestickSeries({
        upColor: '#0ecb81',
        downColor: '#f6465d',
        borderVisible: false,
        wickUpColor: '#0ecb81',
        wickDownColor: '#f6465d'
    });
}

// Lógica de Carregamento da Rodada
function loadRound() {
    els.roundDisplay.textContent = `Rodada ${gameState.round} / ${gameState.maxRounds}`;
    els.capitalDisplay.textContent = formatBRL(gameState.capital);
    
    // Reset da UI
    els.newsBox.classList.add('disabled');
    els.actionBox.classList.add('disabled');
    els.newsBox.classList.remove('attention');
    els.newsText.textContent = "Aguardando desenrolar do mercado...";
    els.investAmount.max = gameState.capital;
    els.investAmount.value = 0;
    
    gameState.currentEvent = gameState.events[gameState.round - 1];
    els.assetName.textContent = `${gameState.currentEvent.ativo} - Analisando Padrão`;

    // Gerar dados do gráfico pré-decisão
    gameState.baseData = gameState.currentEvent.setupCandles();
    
    // CORREÇÃO: Sanitizar os candles para evitar erro do Lightweight Charts
    gameState.baseData.forEach(c => {
        c.high = Math.max(c.high, c.open, c.close);
        c.low = Math.min(c.low, c.open, c.close);
    });

    gameState.candleSeries.setData([]);
    
    // Animação de desenho dos candles
    let currentIdx = 0;
    const drawInterval = setInterval(() => {
        if (currentIdx < gameState.baseData.length) {
            gameState.candleSeries.update(gameState.baseData[currentIdx]);
            currentIdx++;
        } else {
            clearInterval(drawInterval);
            onChartPaused();
        }
    }, 150); // Velocidade do desenho (150ms por candle)
}

function onChartPaused() {
    els.assetName.textContent = `${gameState.currentEvent.ativo} - Decisão Pendente`;
    
    // Mostrar notícia
    els.newsText.textContent = gameState.currentEvent.noticia;
    els.newsBox.classList.remove('disabled');
    els.newsBox.classList.add('attention');
    
    // Habilitar controles
    els.actionBox.classList.remove('disabled');
}

// Controles de Investimento Rápidos
els.quickBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const pct = parseFloat(e.target.dataset.pct);
        els.investAmount.value = Math.floor(gameState.capital * pct);
    });
});

// Ações
function handleDecision(decision) {
    let investVal = parseFloat(els.investAmount.value);
    if (isNaN(investVal) || investVal < 0) investVal = 0;
    if (investVal > gameState.capital) {
        alert("Valor acima do capital disponível!");
        return;
    }
    
    // Desabilita ações
    els.actionBox.classList.add('disabled');
    els.newsBox.classList.remove('attention');
    
    // Resolve mercado
    const lastCandle = gameState.baseData[gameState.baseData.length - 1];
    // Pegar o index da data final para continuar
    const lastDataIndex = gameState.baseData.length; 
    
    const resolution = gameState.currentEvent.resolveCandles(lastCandle.close, lastDataIndex);
    gameState.resolutionData = resolution.candles;
    
    // Anima resolução
    let currentIdx = 0;
    const drawInterval = setInterval(() => {
        if (currentIdx < gameState.resolutionData.length) {
            gameState.candleSeries.update(gameState.resolutionData[currentIdx]);
            currentIdx++;
        } else {
            clearInterval(drawInterval);
            showResultModal(decision, investVal, resolution.multiplier);
        }
    }, 100);
}

els.btnBuy.addEventListener('click', () => handleDecision('COMPRAR'));
els.btnSell.addEventListener('click', () => handleDecision('VENDER'));
els.btnHold.addEventListener('click', () => handleDecision('MANTER'));

// Resultado
function showResultModal(decision, amount, assetVariation) {
    let profitLoss = 0;
    let descDecision = decision;
    
    if (decision === 'COMPRAR') {
        profitLoss = amount * assetVariation;
    } else if (decision === 'VENDER') {
        profitLoss = amount * (-assetVariation); // Se vendeu e caiu, ganha. Se subiu, perde.
    } else {
        profitLoss = 0; // Manter não arrisca
        descDecision = "MANTER (Sem exposição)";
    }
    
    gameState.capital += profitLoss;
    
    // Salvar histórico
    gameState.history.push({
        round: gameState.round,
        asset: gameState.currentEvent.ativo,
        pattern: gameState.currentEvent.padrao,
        decision: decision,
        amount: amount,
        variation: assetVariation,
        profitLoss: profitLoss,
        feedback: gameState.currentEvent.descricao
    });
    
    // Atualiza modal
    els.assetVariation.textContent = formatPct(assetVariation);
    els.assetVariation.className = assetVariation >= 0 ? 'color-up' : 'color-down';
    
    els.playerDecision.textContent = `${descDecision} - R$ ${formatBRL(amount)}`;
    
    els.financialResult.textContent = formatBRL(profitLoss);
    els.financialResult.className = profitLoss > 0 ? 'color-up' : (profitLoss < 0 ? 'color-down' : 'neutral');
    
    els.pedagogicalFeedback.textContent = gameState.currentEvent.descricao;
    
    els.capitalDisplay.textContent = formatBRL(gameState.capital);
    
    els.modal.classList.remove('hidden');
}

els.btnNextRound.addEventListener('click', () => {
    els.modal.classList.add('hidden');
    gameState.round++;
    
    if (gameState.round > gameState.maxRounds) {
        finishGame();
    } else {
        loadRound();
    }
});

// Finalização
function finishGame() {
    els.header.classList.add('hidden');
    showScreen(els.screenFinal);
    
    els.finalCapital.textContent = formatBRL(gameState.capital);
    const profitPct = (gameState.capital - 1000000) / 1000000;
    els.finalProfitPct.textContent = formatPct(profitPct);
    els.finalProfitPct.className = profitPct >= 0 ? 'color-up' : 'color-down';
    
    let profile = "Conservador (Sem operações)";
    if (profitPct > 0.5) profile = "Lobo de Wall Street (Agressivo/Vitorioso)";
    else if (profitPct > 0) profile = "Especulador Disciplinado";
    else if (profitPct > -0.2) profile = "Iniciante Resiliente";
    else profile = "Apostador Arriscado (Prejuízo Alto)";
    
    els.finalProfile.textContent = profile;
    
    // Renderiza tabela
    els.historyTable.innerHTML = '';
    gameState.history.forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${h.round}</td>
            <td><strong>${h.asset}</strong><br><small>${h.pattern}</small></td>
            <td>${h.decision} (${formatBRL(h.amount)})</td>
            <td class="${h.profitLoss > 0 ? 'color-up' : (h.profitLoss < 0 ? 'color-down' : '')}">
                ${h.profitLoss > 0 ? '+' : ''}${formatBRL(h.profitLoss)}
            </td>
        `;
        els.historyTable.appendChild(tr);
    });
}

// Copiar para professor
els.btnCopyReport.addEventListener('click', () => {
    const profitPct = (gameState.capital - 1000000) / 1000000;
    let report = `📈 RELATÓRIO DO ALUNO - MERCADO EM JOGO 📉\n`;
    report += `Nome: ${gameState.playerName}\n`;
    report += `Capital Final: ${formatBRL(gameState.capital)}\n`;
    report += `Rentabilidade: ${formatPct(profitPct)}\n`;
    report += `Perfil: ${els.finalProfile.textContent}\n`;
    report += `-------------------------\n`;
    report += `RESUMO DAS 20 RODADAS:\n`;
    
    gameState.history.forEach(h => {
        report += `[R${h.round}] ${h.asset} | ${h.decision} | Result: ${h.profitLoss > 0 ? '+' : ''}${formatBRL(h.profitLoss)}\n`;
    });
    
    navigator.clipboard.writeText(report).then(() => {
        alert("Relatório copiado para a área de transferência! Cole no chat do professor.");
    }).catch(err => {
        alert("Erro ao copiar. Seu navegador pode não suportar esta ação.");
    });
});

els.btnRestart.addEventListener('click', () => {
    window.location.reload();
});
