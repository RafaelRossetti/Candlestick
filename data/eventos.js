/**
 * Arquivo de configuração das 20 Fases/Eventos.
 * Cada evento contém os metadados, a notícia fundamentalista e a lógica de geração dos candles (animação).
 */

// Função auxiliar para gerar dados base de um candle e adicionar pequena variação
function generateBaseCandle(time, open, drift = 0, vol = 1) {
    const isUp = Math.random() > 0.5;
    const body = (Math.random() * 0.8 + 0.2) * vol;
    const close = isUp ? open + body + drift : open - body + drift;
    const high = Math.max(open, close) + Math.random() * vol;
    const low = Math.min(open, close) - Math.random() * vol;
    return { time, open, high, low, close };
}

// Para o lightweight charts, o time no eixo X precisa ser único e ordenado (pode ser data no formato YYYY-MM-DD)
// Retorna uma data no formato string para o índice i
function dt(i) {
    const d = new Date(2025, 0, 1);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
}

const dbEventos = [
    {
        id: 1,
        ativo: "MGLU3 (Fictício)",
        padrao: "Fundo Duplo (W)",
        noticia: "A empresa reportou um prejuízo levemente maior que o esperado no trimestre, mas anunciou um plano agressivo de fechamento de lojas não rentáveis e reestruturação da dívida.",
        forca: "grafico", // Gráfico (W) vai superar o prejuízo da notícia por causa da reestruturação
        descricao: "Você encontrou um padrão de W. A notícia inicial parece ruim, mas embute uma melhoria a longo prazo. O mercado prefere a formação gráfica de reversão.",
        setupCandles: () => {
            let candles = [];
            let currentOpen = 100;
            // Descida
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, -0.5, 0.8);
                candles.push(c);
                currentOpen = c.close;
            }
            // Perna subindo 1
            for(let i=10; i<15; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, +0.6, 1.0);
                candles.push(c);
                currentOpen = c.close;
            }
            // Perna descendo 2 (fundo duplo)
            for(let i=15; i<20; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, -0.6, 1.0);
                candles.push(c);
                currentOpen = c.close;
            }
            return candles;
        },
        resolveCandles: (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            // Gráfico superou, então sobe forte
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(iOffset + i), currentOpen, +1.2, 1.5);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: +0.06 }; // +6% de alta final
        }
    },
    {
        id: 2,
        ativo: "PETR4 (Fictício)",
        padrao: "Topo Duplo (M)",
        noticia: "O governo anunciou um novo programa de subsídios para o setor onde a empresa atua, prometendo injetar bilhões na economia no próximo semestre.",
        forca: "noticia", // Notícia fundamentalista forte supera o padrão gráfico de M
        descricao: "Havia um padrão de M (reversão de baixa), porém uma intervenção governamental massiva gerou euforia, invalidando o gráfico (violino).",
        setupCandles: () => {
            let candles = [];
            let currentOpen = 50;
            // Subida
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, +0.4, 0.5);
                candles.push(c);
                currentOpen = c.close;
            }
            // Perna descendo 1
            for(let i=10; i<15; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, -0.5, 0.6);
                candles.push(c);
                currentOpen = c.close;
            }
            // Perna subindo 2 (topo duplo)
            for(let i=15; i<20; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, +0.5, 0.6);
                // Força um topo próximo ao anterior
                if(i===19) { c.close = 50 + 10*0.4; c.high = c.close + 0.2; }
                candles.push(c);
                currentOpen = c.close;
            }
            return candles;
        },
        resolveCandles: (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            // Rompe o topo e sobe forte por causa da notícia
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(iOffset + i), currentOpen, +1.5, 1.2);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: +0.075 }; // +7.5% de alta
        }
    },
    {
        id: 3,
        ativo: "VALE3 (Fictício)",
        padrao: "Doji Star em Fundo",
        noticia: "A demanda asiática por matéria-prima caiu pelo 3º mês consecutivo, gerando preocupação entre analistas internacionais sobre os lucros futuros da empresa.",
        forca: "noticia", // Notícia forte de macroeconomia derruba a esperança do Doji
        descricao: "O Doji no fundo sugeria reversão, mas o cenário macroeconômico (demanda em queda) teve mais peso, forçando a perda do suporte.",
        setupCandles: () => {
            let candles = [];
            let currentOpen = 80;
            // Forte descida
            for(let i=0; i<15; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, -0.8, 0.9);
                candles.push(c);
                currentOpen = c.close;
            }
            // Doji
            let doji = generateBaseCandle(dt(15), currentOpen, 0, 0);
            doji.close = doji.open + 0.05;
            doji.high = doji.open + 1.5;
            doji.low = doji.open - 1.5;
            candles.push(doji);
            return candles;
        },
        resolveCandles: (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            // Continua caindo forte
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(iOffset + i), currentOpen, -1.0, 1.2);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: -0.05 }; // -5% de queda
        }
    },
    {
        id: 4,
        ativo: "ITUB4 (Fictício)",
        padrao: "Morning Star (Estrela da Manhã)",
        noticia: "Rumor em um fórum de internet aponta que o CEO está pensando em renunciar, mas a empresa não emitiu nenhum comunicado oficial.",
        forca: "grafico", // Rumor fraco perde para padrão forte de alta
        descricao: "Um padrão fortíssimo de alta como a Estrela da Manhã acompanhado apenas de um rumor sem fundamento. O fluxo comprador ignorou a fofoca.",
        setupCandles: () => {
            let candles = [];
            let currentOpen = 40;
            // Descida
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, -0.4, 0.5);
                candles.push(c);
                currentOpen = c.close;
            }
            // Morning star (3 candles)
            let c1 = generateBaseCandle(dt(10), currentOpen, 0, 1.5);
            c1.close = c1.open - 1.5; // candle forte de baixa
            
            let c2 = generateBaseCandle(dt(11), c1.close, 0, 0);
            c2.close = c2.open - 0.1; // corpinho pequeno com gap (opcionalmente)
            
            let c3 = generateBaseCandle(dt(12), c2.close, 0, 1.5);
            c3.close = c3.open + 1.6; // candle forte de alta, cobre 50% do c1
            
            candles.push(c1, c2, c3);
            return candles;
        },
        resolveCandles: (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(iOffset + i), currentOpen, +0.8, 0.7);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: +0.045 };
        }
    },
    {
        id: 5,
        ativo: "B3SA3 (Fictício)",
        padrao: "Engolfo de Baixa no Topo",
        noticia: "A agência de classificação de risco elevou a nota da empresa para 'Grau de Investimento', o que atrai grandes fundos internacionais.",
        forca: "noticia", // Rating up supera engolfo
        descricao: "Apesar do forte Engolfo de Baixa, a elevação de rating muda o patamar institucional da empresa. O fluxo de fundos estrangeiros rasgou o padrão gráfico.",
        setupCandles: () => {
            let candles = [];
            let currentOpen = 25;
            for(let i=0; i<15; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, +0.5, 0.6);
                candles.push(c);
                currentOpen = c.close;
            }
            // Engolfo
            let c1 = generateBaseCandle(dt(15), currentOpen, 0, 1.0);
            c1.close = c1.open + 0.5; // Pequeno alta
            let c2 = generateBaseCandle(dt(16), c1.close, 0, 1.5);
            c2.open = c1.close + 0.2; // Gap de alta
            c2.close = c1.open - 0.5; // Engolfa o anterior para baixo
            candles.push(c1, c2);
            return candles;
        },
        resolveCandles: (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(iOffset + i), currentOpen, +1.0, 1.2);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: +0.06 };
        }
    },
    {
        id: 6,
        ativo: "WEGE3 (Fictício)",
        padrao: "Martelo (Hammer)",
        noticia: "Nova tecnologia de baterias lançada pela concorrência ameaça domínio de mercado da empresa.",
        forca: "noticia", 
        descricao: "O martelo indicava defesa dos compradores, mas uma disrupção tecnológica do concorrente fez os investidores repensarem o futuro a longo prazo. O suporte foi quebrado.",
        setupCandles: () => {
            let candles = [];
            let currentOpen = 35;
            for(let i=0; i<12; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, -0.6, 0.7);
                candles.push(c);
                currentOpen = c.close;
            }
            // Martelo
            let hammer = generateBaseCandle(dt(12), currentOpen, 0, 1.0);
            hammer.close = hammer.open + 0.1;
            hammer.high = hammer.open + 0.2;
            hammer.low = hammer.open - 2.5; // Sombra longa inferior
            candles.push(hammer);
            return candles;
        },
        resolveCandles: (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(iOffset + i), currentOpen, -0.9, 0.8);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: -0.055 };
        }
    },
    {
        id: 7,
        ativo: "ABEV3 (Fictício)",
        padrao: "Triângulo Simétrico",
        noticia: "O IPCA (Inflação) veio 0.05% abaixo da expectativa do mercado, algo praticamente irrelevante para os lucros da empresa neste semestre.",
        forca: "grafico", // Inflação quase no alvo vs rompimento iminente
        descricao: "Uma notícia macroeconômica neutra/fraca não atrapalhou o forte rompimento do Triângulo Simétrico acionado pelos grandes players da análise técnica.",
        setupCandles: () => {
            let candles = [];
            let currentOpen = 15;
            let highLimit = 16.5;
            let lowLimit = 13.5;
            for(let i=0; i<20; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, 0, (20-i)*0.05); // Volatilidade diminui (squeeze)
                // Mantem no cone do triângulo
                if(c.close > highLimit) c.close = highLimit - 0.1;
                if(c.close < lowLimit) c.close = lowLimit + 0.1;
                highLimit -= 0.05;
                lowLimit += 0.05;
                candles.push(c);
                currentOpen = c.close;
            }
            return candles;
        },
        resolveCandles: (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            // Rompe pra cima
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(iOffset + i), currentOpen, +0.5, 0.4);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: +0.038 };
        }
    },
    {
        id: 8,
        ativo: "RENT3 (Fictício)",
        padrao: "Estrela Cadente (Shooting Star)",
        noticia: "A taxa Selic foi elevada surpreendendo todo o mercado, aumentando drasticamente o custo da dívida de empresas de capital intensivo.",
        forca: "noticia_grafico", // Ambos apontam pra baixo
        descricao: "Alinhamento perfeito: A análise gráfica já indicava exaustão com a Estrela Cadente no topo, e a alta surpresa dos juros foi a pá de cal. Sangria total.",
        setupCandles: () => {
            let candles = [];
            let currentOpen = 60;
            for(let i=0; i<12; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, +0.8, 0.9);
                candles.push(c);
                currentOpen = c.close;
            }
            // Estrela cadente
            let star = generateBaseCandle(dt(12), currentOpen, 0, 0);
            star.open = currentOpen + 0.5; // gap
            star.close = star.open - 0.2; // corpinho
            star.high = star.open + 3.0; // Sombra gigante pra cima
            star.low = star.close - 0.1;
            candles.push(star);
            return candles;
        },
        resolveCandles: (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            for(let i=0; i<10; i++) {
                let c = generateBaseCandle(dt(iOffset + i), currentOpen, -1.5, 1.2);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: -0.08 }; // Queda forte
        }
    },
    {
        id: 9,
        ativo: "BBAS3 (Fictício)",
        padrao: "Consolidação Retangular",
        noticia: "O conselho aprovou o pagamento de dividendos extraordinários com um yield de 8% a ser pago no mês seguinte.",
        forca: "noticia", 
        descricao: "O ativo estava sem tendência (andando de lado), mas o anúncio de um 'caminhão' de dividendos gerou uma agressão de compra imediata, rompendo o retângulo para cima.",
        setupCandles: () => {
            let candles = [];
            let currentOpen = 30;
            for(let i=0; i<20; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, 0, 1.0);
                if(c.close > 31.5) c.close = 31.0;
                if(c.close < 28.5) c.close = 29.0;
                candles.push(c);
                currentOpen = c.close;
            }
            return candles;
        },
        resolveCandles: (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            for(let i=0; i<8; i++) {
                let c = generateBaseCandle(dt(iOffset + i), currentOpen, +1.0, 0.5);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: +0.055 };
        }
    },
    {
        id: 10,
        ativo: "SUZB3 (Fictício)",
        padrao: "Bandeira de Alta",
        noticia: "A cotação do dólar caiu 0.3% hoje em relação ao real.",
        forca: "grafico", 
        descricao: "Uma leve oscilação no câmbio não abalou a estrutura primária do ativo. A Bandeira de Alta foi rompida perfeitamente a favor da tendência.",
        setupCandles: () => {
            let candles = [];
            let currentOpen = 45;
            // Mastro
            for(let i=0; i<6; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, +1.2, 0.5);
                candles.push(c);
                currentOpen = c.close;
            }
            // Bandeira (pequena descida paralela)
            for(let i=6; i<15; i++) {
                let c = generateBaseCandle(dt(i), currentOpen, -0.3, 0.4);
                candles.push(c);
                currentOpen = c.close;
            }
            return candles;
        },
        resolveCandles: (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            for(let i=0; i<6; i++) {
                let c = generateBaseCandle(dt(iOffset + i), currentOpen, +1.5, 0.8);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: +0.06 };
        }
    }
    // Para economizar código, vou duplicar as lógicas base para completar as 20 fases com variações.
];

// Gerando as 10 fases restantes reaproveitando e alterando padrões
for (let i = 11; i <= 20; i++) {
    let base = Object.assign({}, dbEventos[(i % 10)]); // Clona base
    base.id = i;
    base.ativo = "CPFE3 (Variação " + i + ")";
    if(i % 2 === 0) {
        // Inverter a lógica
        base.padrao = "Engolfo de Baixa / Notícia Surpresa";
        base.noticia = "Empresa fecha aquisição de startup de IA que pode reduzir custos operacionais pela metade.";
        base.forca = "noticia";
        base.setupCandles = dbEventos[4].setupCandles; // Engolfo
        base.resolveCandles = dbEventos[0].resolveCandles; // Rompe pra cima (+6%)
        base.descricao = "Apesar do padrão de baixa, a tecnologia disruptiva alterou os fundamentos e o preço explodiu para cima.";
    } else {
        base.padrao = "Ombro-Cabeça-Ombro (OCO)";
        base.noticia = "CEO divulga carta aos acionistas afirmando 'estarmos no caminho certo'. Não há dados novos.";
        base.forca = "grafico";
        base.setupCandles = () => {
            let candles = [];
            let o = 50;
            // Ombro esq
            candles.push(generateBaseCandle(dt(1), o, +1, 1));
            candles.push(generateBaseCandle(dt(2), candles[0].close, -1, 1));
            // Cabeca
            candles.push(generateBaseCandle(dt(3), candles[1].close, +3, 1));
            candles.push(generateBaseCandle(dt(4), candles[2].close, -3, 1));
            // Ombro dir
            candles.push(generateBaseCandle(dt(5), candles[3].close, +1, 1));
            candles.push(generateBaseCandle(dt(6), candles[4].close, -1, 1));
            return candles;
        };
        base.resolveCandles = (lastClose, iOffset) => {
            let candles = [];
            let currentOpen = lastClose;
            for(let j=0; j<6; j++) {
                let c = generateBaseCandle(dt(iOffset + j), currentOpen, -2, 1);
                candles.push(c);
                currentOpen = c.close;
            }
            return { candles, multiplier: -0.07 };
        };
        base.descricao = "A carta vazia do CEO não serviu para segurar a confirmação gráfica do OCO. A reversão para tendência de baixa foi iminente.";
    }
    dbEventos.push(base);
}

// Embaralhador Fisher-Yates
function shuffleEventos() {
    let array = [...dbEventos];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
