// Função para animar a rolagem dos ganhadores
function animateWinners() {
    const wrapper = document.querySelector('.winners-swiper .swiper-wrapper');
    if (!wrapper) return;

    // Clonar os slides para criar um efeito de loop contínuo
    const slides = wrapper.querySelectorAll('.swiper-slide');
    if (slides.length === 0) return;
    
    // Adicionar clones apenas se não existirem ainda
    if (wrapper.children.length <= slides.length) {
        // Criar um fragmento para melhor performance
        const fragment = document.createDocumentFragment();
        slides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true'); // Melhorar acessibilidade
            fragment.appendChild(clone);
        });
        wrapper.appendChild(fragment);
    }

    // Configurar a animação
    let position = 0;
    const slideWidth = 300; // Largura aproximada de cada slide
    const speed = 1; // Velocidade de rolagem (pixels por frame)
    let animationId;
    let lastTime = 0;
    const fps = 60;
    const interval = 1000 / fps;
    let then = window.performance.now();

    function scroll(timestamp) {
        // Controlar FPS para melhor performance
        const now = timestamp || new Date().getTime();
        const delta = now - then;

        if (delta > interval) {
            then = now - (delta % interval);
            
            position -= speed;
            const totalWidth = slideWidth * slides.length;
            
            // Resetar a posição quando todos os slides originais saírem da tela
            if (position <= -totalWidth) {
                position = 0;
            }
            
            // Usar transform3d para aceleração por hardware
            wrapper.style.transform = `translate3d(${position}px, 0, 0)`;
        }
        
        animationId = requestAnimationFrame(scroll);
    }

    // Iniciar a animação
    if (slides.length > 0) {
        // Forçar layout e pintura antes de iniciar a animação
        wrapper.style.willChange = 'transform';
        wrapper.style.backfaceVisibility = 'hidden';
        wrapper.style.perspective = '1000px';
        
        // Iniciar com um pequeno atraso para garantir que o DOM esteja pronto
        setTimeout(() => {
            animationId = requestAnimationFrame(scroll);
        }, 100);
    }

    // Pausar animação quando o mouse estiver sobre a seção
    const winnersSection = document.querySelector('.winners-section');
    if (winnersSection) {
        let isPaused = false;
        let isScrolling = false;
        let startX, scrollLeft;
        
        // Pausar ao passar o mouse
        winnersSection.addEventListener('mouseenter', () => {
            isPaused = true;
            cancelAnimationFrame(animationId);
        });
        
        // Retomar quando o mouse sair
        winnersSection.addEventListener('mouseleave', () => {
            isPaused = false;
            if (!isPaused) {
                then = window.performance.now(); // Resetar o tempo para evitar saltos
                animationId = requestAnimationFrame(scroll);
            }
        });
        
        // Suporte para toque em dispositivos móveis
        wrapper.addEventListener('touchstart', (e) => {
            isPaused = true;
            cancelAnimationFrame(animationId);
            
            const touch = e.touches[0];
            startX = touch.clientX;
            scrollLeft = position;
            isScrolling = true;
        }, { passive: true });
        
        wrapper.addEventListener('touchmove', (e) => {
            if (!isScrolling) return;
            const touch = e.touches[0];
            const x = touch.clientX;
            const walk = (x - startX) * 2; // Velocidade de arrasto
            position = scrollLeft - walk;
            wrapper.style.transform = `translate3d(${position}px, 0, 0)`;
        }, { passive: true });
        
        wrapper.addEventListener('touchend', () => {
            isScrolling = false;
            isPaused = false;
            if (!isPaused) {
                then = window.performance.now();
                animationId = requestAnimationFrame(scroll);
            }
        }, { passive: true });
        
        // Pausar animação quando a janela não estiver visível
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationId);
            } else if (!isPaused) {
                then = window.performance.now();
                animationId = requestAnimationFrame(scroll);
            }
        });
        
        // Otimização: Reduzir a velocidade da animação quando a aba estiver inativa
        let hidden, visibilityChange;
        if (typeof document.hidden !== 'undefined') {
            hidden = 'hidden';
            visibilityChange = 'visibilitychange';
        } else if (typeof document.msHidden !== 'undefined') {
            hidden = 'msHidden';
            visibilityChange = 'msvisibilitychange';
        } else if (typeof document.webkitHidden !== 'undefined') {
            hidden = 'webkitHidden';
            visibilityChange = 'webkitvisibilitychange';
        }
        
        if (typeof document.addEventListener !== 'undefined' && hidden !== undefined) {
            document.addEventListener(visibilityChange, () => {
                if (document[hidden]) {
                    cancelAnimationFrame(animationId);
                } else if (!isPaused) {
                    then = window.performance.now();
                    animationId = requestAnimationFrame(scroll);
                }
            }, false);
        }
    }
    
    // Limpar a animação quando a página for descarregada
    window.addEventListener('beforeunload', () => {
        cancelAnimationFrame(animationId);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const jogo = urlParams.get('jogo');
    
    // Mapeamento de jogos para títulos e descrições
    const jogosInfo = {
        'centavo-sorte': {
            titulo: 'Centavo da Sorte',
            descricao: 'Raspou, ganhou! Prêmios a partir de R$ 1,00',
            imagem: '/images/centavo.png',
            valor: 'R$ 0,50',
            premios: [
                { nome: 'R$ 1.000,00 em Dinheiro', valor: 'R$ 1.000,00', imagem: '/images/valoresaltos.png' },
                { nome: 'Smartphone', valor: 'R$ 2.500,00', imagem: '/images/smartphone.png' },
                { nome: 'TV 50"', valor: 'R$ 3.000,00', imagem: '/images/tv50.png' }
            ]
        },
        'sorte-instantanea': {
            titulo: 'Sorte Instantânea',
            descricao: 'Prêmios incríveis! Até R$ 2.500,00',
            imagem: '/images/sorteinstantanea.png',
            valor: 'R$ 1,00',
            premios: [
                { nome: 'R$ 2.500,00 em Dinheiro', valor: 'R$ 2.500,00', imagem: '/images/valoresaltos.png' },
                { nome: 'PlayStation 5', valor: 'R$ 4.500,00', imagem: '/images/playstation5.png' },
                { nome: 'iPhone 15', valor: 'R$ 7.500,00', imagem: '/images/iphone15.png' }
            ]
        },
        'raspa-suprema': {
            titulo: 'Raspa Suprema',
            descricao: 'Grandes prêmios! Até R$ 5.000,00',
            imagem: '/images/raspadinhasuprema.png',
            valor: 'R$ 5,00',
            premios: [
                { nome: 'R$ 5.000,00 em Dinheiro', valor: 'R$ 5.000,00', imagem: '/images/valoresaltos.png' },
                { nome: 'Notebook', valor: 'R$ 4.000,00', imagem: '/images/notebook.png' },
                { nome: 'Viagem', valor: 'R$ 6.000,00', imagem: '/images/viagem.png' }
            ]
        },
        'raspa-relampago': {
            titulo: 'Raspa Relâmpago',
            descricao: 'Prêmios rápidos! Até R$ 15.000,00',
            imagem: '/images/rasparelampago.png',
            valor: 'R$ 10,00',
            premios: [
                { nome: 'R$ 15.000,00 em Dinheiro', valor: 'R$ 15.000,00', imagem: '/images/valoresaltos.png' },
                { nome: 'Moto', valor: 'R$ 11.500,00', imagem: '/images/pop110.png' },
                { nome: 'Viagem Internacional', valor: 'R$ 12.000,00', imagem: '/images/viagem-internacional.png' }
            ]
        },
        'raspadinha-magica': {
            titulo: 'Raspadinha Mágica',
            descricao: 'Prêmios especiais! Até R$ 50.000,00',
            imagem: '/images/raspadinhamagica.png',
            valor: 'R$ 50,00',
            premios: [
                { nome: 'R$ 50.000,00 em Dinheiro', valor: 'R$ 50.000,00', imagem: '/images/valoresaltos.png' },
                { nome: 'Carro 0km', valor: 'R$ 80.000,00', imagem: '/images/carro.png' },
                { nome: 'Casa Própria', valor: 'R$ 150.000,00', imagem: '/images/casa.png' }
            ]
        }
    };
    
    // Elementos da página
    const jogoSelecionadoEl = document.getElementById('jogo-selecionado');
    const premiosGrid = document.querySelector('.premios-grid');
    
    // Função para criar os cards de prêmio
    function criarCardsPremios(premios) {
        return premios.map(premio => `
            <div class="premio-card">
                <img src="${premio.imagem}" alt="${premio.nome}" class="premio-imagem">
                <div class="premio-info">
                    <h3 class="premio-nome">${premio.nome}</h3>
                    <div class="premio-valor">${premio.valor}</div>
                    <button class="jogar-btn" data-premio="${premio.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">
                        Jogar Agora
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Atualizar a página com base no jogo selecionado
    if (jogo && jogosInfo[jogo]) {
        const info = jogosInfo[jogo];
        
        // Atualizar o cabeçalho
        document.querySelector('.premios-header h1').textContent = info.titulo;
        document.querySelector('.premios-header p').textContent = info.descricao;
        
        // Atualizar a seção do jogo selecionado
        jogoSelecionadoEl.innerHTML = `
            <div class="jogo-selecionado-card">
                <img src="${info.imagem}" alt="${info.titulo}" class="jogo-imagem">
                <div class="jogo-info">
                    <h2>${info.titulo}</h2>
                    <p>${info.descricao}</p>
                    <div class="jogo-valor">Apenas ${info.valor}</div>
                </div>
            </div>
        `;
        
        // Exibir apenas os prêmios deste jogo
        premiosGrid.innerHTML = criarCardsPremios(info.premios);
        
    } else {
        // Se nenhum jogo específico for selecionado, mostrar todos os prêmios
        document.querySelector('.premios-header h1').textContent = 'Todos os Prêmios';
        document.querySelector('.premios-header p').textContent = 'Confira os prêmios disponíveis em nossos jogos!';
        
        // Coletar todos os prêmios de todos os jogos
        const todosPremios = [];
        Object.values(jogosInfo).forEach(jogo => {
            jogo.premios.forEach(premio => {
                todosPremios.push(premio);
            });
        });
        
        // Exibir todos os prêmios
        premiosGrid.innerHTML = criarCardsPremios(todosPremios);
    }
    
    // Adicionar evento de clique nos botões de jogar
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('jogar-btn')) {
            e.preventDefault();
            const premio = e.target.getAttribute('data-premio');
            const jogoAtual = jogo || 'geral';
            // Redirecionar para a página do jogo com o prêmio selecionado
            window.location.href = `jogar.html?jogo=${jogoAtual}&premio=${premio}`;
        }
    });
    
    // Adicionar classe ativa ao menu de navegação
    const menuLinks = document.querySelectorAll('#mainNav a');
    menuLinks.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Iniciar a animação dos ganhadores
    animateWinners();
});
