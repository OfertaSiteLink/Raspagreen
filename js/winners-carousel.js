console.log('Arquivo winners-carousel.js carregado');

// Verifica se o carrossel já foi inicializado
if (!window.winnersCarouselInitialized) {
    'use strict';
    console.log('Inicializando carrossel...');
    
    window.winnersCarouselInitialized = true;
    
    // Função para animar a rolagem dos ganhadores
    function animateWinners() {
        console.log('Iniciando animação do carrossel...');
        const wrapper = document.querySelector('.winners-swiper .swiper-wrapper');
        
        if (!wrapper) {
            console.log('Wrapper do carrossel não encontrado, tentando novamente em 500ms...');
            setTimeout(animateWinners, 500);
            return;
        }

        // Verificar se já existem clones para evitar duplicação
        const slides = Array.from(wrapper.querySelectorAll('.swiper-slide'));
        if (slides.length === 0) {
            console.log('Nenhum slide encontrado, tentando novamente em 500ms...');
            setTimeout(animateWinners, 500);
            return;
        }
        
        // Adicionar clones apenas se não existirem ainda
        if (wrapper.children.length === slides.length) {
            console.log('Clonando slides...');
            // Duplicar os slides para um loop suave
            const fragment = document.createDocumentFragment();
            slides.forEach(slide => {
                const clone = slide.cloneNode(true);
                fragment.appendChild(clone);
            });
            wrapper.appendChild(fragment);
        }

        // Configurar o wrapper para largura total
        const firstSlide = wrapper.firstElementChild;
        if (!firstSlide) {
            console.log('Primeiro slide não encontrado, tentando novamente em 500ms...');
            setTimeout(animateWinners, 500);
            return;
        }
        
        // Calcular a largura total dos slides originais
        let totalWidth = 0;
        const slideWidths = slides.map(slide => {
            const width = slide.offsetWidth + 30; // 30px de margem
            totalWidth += width;
            return width;
        });
        
        // Configurações iniciais do wrapper
        wrapper.style.width = `${totalWidth * 2}px`;
        wrapper.style.display = 'flex';
        wrapper.style.willChange = 'transform';
        wrapper.style.transform = 'translateX(0)';
        
        // Forçar layout e pintura antes de iniciar a animação
        wrapper.offsetHeight;

        let position = 0;
        const speed = 1.8; // pixels por frame (ajustado para melhor fluidez)
        let animationId = null;
        let isPaused = false;
        let lastTime = performance.now();
        let deltaTime = 0;
        const targetFPS = 60;
        const frameDuration = 1000 / targetFPS;
        
        // Função para reiniciar a posição quando necessário
        function resetPosition() {
            const firstChild = wrapper.firstElementChild;
            if (!firstChild) return;
            
            const firstChildWidth = firstChild.offsetWidth + 30;
            if (position <= -firstChildWidth) {
                position += firstChildWidth;
                wrapper.appendChild(firstChild);
                wrapper.style.transition = 'none';
                wrapper.style.transform = `translateX(${position}px)`;
                // Forçar reflow sem causar layout
                void wrapper.offsetHeight;
            }
        }

        // Função otimizada para animação
        function animate(currentTime) {
            if (!animationId) return;
            
            if (isPaused) {
                lastTime = currentTime;
                animationId = requestAnimationFrame(animate);
                return;
            }
            
            // Calcular tempo decorrido desde o último frame
            const elapsed = currentTime - lastTime;
            lastTime = currentTime;
            
            // Acumular tempo para lidar com frames perdidos
            deltaTime += elapsed;
            
            // Processar frames acumulados para manter velocidade consistente
            while (deltaTime >= frameDuration) {
                position -= speed;
                deltaTime -= frameDuration;
                
                // Verificar se precisamos mover o primeiro slide para o final
                resetPosition();
                
                // Atualizar a posição sem causar reflow desnecessário
                wrapper.style.transform = `translateX(${position}px)`;
            }
            
            // Continuar a animação
            animationId = requestAnimationFrame(animate);
        }
        
        // Iniciar a animação
        function startAnimation() {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            lastTime = performance.now();
            deltaTime = 0;
            animationId = requestAnimationFrame(animate);
        }

        // Iniciar a animação
        if (slides.length > 0) {
            console.log('Iniciando animação com', slides.length, 'slides');
            
            // Configurações iniciais de estilo para otimização
            wrapper.style.willChange = 'transform';
            wrapper.style.backfaceVisibility = 'hidden';
            wrapper.style.transformStyle = 'preserve-3d';
            wrapper.style.transform = 'translate3d(0, 0, 0)';
            
            // Forçar layout e pintura antes de iniciar a animação
            wrapper.offsetHeight;
            
            // Iniciar a animação após um pequeno atraso para garantir que tudo esteja pronto
            const startDelay = setTimeout(() => {
                clearTimeout(startDelay);
                startAnimation();
                
                // Pausar a animação quando o mouse estiver sobre o carrossel
                const carousel = wrapper.closest('.winners-swiper');
                if (carousel) {
                    const handleMouseEnter = () => { isPaused = true; };
                    const handleMouseLeave = () => { 
                        isPaused = false; 
                        lastTime = performance.now();
                    };
                    
                    carousel.addEventListener('mouseenter', handleMouseEnter);
                    carousel.addEventListener('mouseleave', handleMouseLeave);
                    
                    // Limpar event listeners quando a página for descarregada
                    window.addEventListener('beforeunload', () => {
                        carousel.removeEventListener('mouseenter', handleMouseEnter);
                        carousel.removeEventListener('mouseleave', handleMouseLeave);
                        if (animationId) {
                            cancelAnimationFrame(animationId);
                            animationId = null;
                        }
                    });
                }
                
                // Pausar a animação quando a aba não estiver visível
                const handleVisibilityChange = () => {
                    isPaused = document.hidden;
                    if (!document.hidden) {
                        lastTime = performance.now();
                    }
                };
                
                document.addEventListener('visibilitychange', handleVisibilityChange);
                
                // Limpar tudo quando a página for descarregada
                const cleanup = () => {
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                    window.removeEventListener('beforeunload', cleanup);
                    window.removeEventListener('pagehide', cleanup);
                };
                
                window.addEventListener('beforeunload', cleanup);
                window.addEventListener('pagehide', cleanup);
                
                console.log('Animação do carrossel iniciada com sucesso!');
                
                // Remover classe de carregamento quando a animação começar
                document.body.classList.remove('winners-carousel-loading');
                
            }, 150); // Pequeno atraso para garantir que tudo esteja pronto
        }
    }

    // Inicializar o carrossel
    function initCarousel() {
        console.log('Iniciando inicialização do carrossel...');
        // Verificar se o carrossel já existe
        const container = document.getElementById('winners-carousel-container');
        if (!container) {
            console.log('Container do carrossel não encontrado, tentando novamente em 500ms...');
            setTimeout(initCarousel, 500);
            return;
        }
        
        // Verificar se o carrossel já foi carregado
        const swiper = document.querySelector('.winners-swiper');
        if (swiper) {
            console.log('Carrossel encontrado, iniciando animação...');
            // Pequeno atraso para garantir que o CSS foi aplicado
            setTimeout(animateWinners, 300);
            return;
        }
        
        // Se chegou aqui, o carrossel ainda não foi carregado
        console.log('Aguardando carregamento do carrossel...');
        setTimeout(initCarousel, 500);
    }
    
    // Iniciar a inicialização do carrossel
    console.log('Registrando evento de inicialização do carrossel');
    if (document.readyState === 'loading') {
        console.log('Documento ainda não carregado, aguardando DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOMContentLoaded disparado, inicializando carrossel');
            initCarousel();
        });
    } else {
        console.log('Documento já carregado, inicializando carrossel imediatamente');
        setTimeout(initCarousel, 0);
    }
}

