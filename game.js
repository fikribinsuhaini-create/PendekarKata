// Pendekar Kata - Educational Typing Game

// Global game state
const gameState = {
    score: 0,
    lives: 3,
    combo: 0,
    maxCombo: 0,
    difficulty: 1,
    isMobile: false,
    soundEnabled: true
};

// Utility functions
function isMobileDevice() {
    const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const touchCapable = ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0) || ('ontouchstart' in window);

    // Avoid treating small desktop windows as "mobile" just because width is narrow.
    // Use width as a hint only when touch-capable.
    return uaMobile || (touchCapable && window.innerWidth < 768);
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Check orientation
function checkOrientation() {
    const orientationMsg = document.getElementById('orientation-message');
    if (window.innerWidth < window.innerHeight && isMobileDevice()) {
        orientationMsg.style.display = 'flex';
    } else {
        orientationMsg.style.display = 'none';
    }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
checkOrientation();

// ===========================================
// PRELOAD SCENE
// ===========================================
class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Update loading bar
        const loadingProgress = document.getElementById('loading-progress');
        
        this.load.on('progress', (value) => {
            loadingProgress.style.width = (value * 100) + '%';
        });

        this.load.on('complete', () => {
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
            }, 500);
        });

        // Load placeholder sounds (using Web Audio API for simple beeps)
        // In production, replace with actual audio files

        // Assets
        // NOTE: some spritesheets are extremely wide and can exceed mobile GPU MAX_TEXTURE_SIZE.
        // On mobile, fall back to single-frame idle images to avoid black-square textures.
        const mobile = isMobileDevice();
        if (mobile) {
            this.load.image('pendekar_silat', 'assets/pendekar-idle.png');
            this.load.image('ghost_hantucina', 'assets/hantucina-idle.png');
            this.load.image('ghost_toyol', 'assets/toyol-idle.png');
            this.load.image('ghost_pocong', 'assets/pocong-idle.png');
            this.load.image('ghost_pontianak', 'assets/pontianak-idle.png');
        } else {
            this.load.spritesheet('pendekar_silat', 'assets/pendekar-spritesheet.png', {
                frameWidth: 1536,
                frameHeight: 1024
            });
            this.load.spritesheet('ghost_hantucina', 'assets/hantucina-spritesheet.png', {
                frameWidth: 1536,
                frameHeight: 1024
            });
            this.load.spritesheet('ghost_toyol', 'assets/toyol-spritesheet.png', {
                frameWidth: 1536,
                frameHeight: 1024
            });
            this.load.spritesheet('ghost_pocong', 'assets/pocong-spritesheet.png', {
                frameWidth: 1536,
                frameHeight: 1024
            });
            this.load.spritesheet('ghost_pontianak', 'assets/pontianak-spritesheet.png', {
                frameWidth: 1536,
                frameHeight: 1024
            });
        }

        this.load.image('kubur_1', 'assets/kubur-1.png');
        this.load.image('rumah_usang', 'assets/rumah-usang.png');

        // Audio
        this.load.audio('sound_intro', 'assets/sound-intro.mp3');
        this.load.audio('sound_game', 'assets/sound-game.mp3');

        // Environment sprites (Trees_Alt_Outlined.png is 448x224 => 7x2 grid => 64x112 frames)
        this.load.spritesheet('trees_alt_outlined', 'assets/Trees_Alt_Outlined.png', {
            frameWidth: 64,
            frameHeight: 112
        });
        // tree-set.png is 512x128 => 4x1 grid => 128x128 frames
        this.load.spritesheet('tree_set', 'assets/tree-set.png', {
            frameWidth: 128,
            frameHeight: 128
        });
    }

    create() {
        // Check if mobile
        gameState.isMobile = isMobileDevice();
        
        // Create simple sound effects using Web Audio
        this.createSoundEffects();
        
        this.scene.start('MenuScene');
    }

    createSoundEffects() {
        // Store sound generators in registry
        this.registry.set('playSound', (type) => {
            if (!gameState.soundEnabled) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch(type) {
                case 'correct':
                    oscillator.frequency.value = 800;
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                    break;
                case 'wrong':
                    oscillator.frequency.value = 200;
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;
                case 'damage':
                    oscillator.frequency.value = 150;
                    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                    break;
                case 'attack':
                    oscillator.frequency.value = 600;
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.15);
                    break;
                case 'combo':
                    oscillator.frequency.value = 1000;
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;
                case 'click':
                    oscillator.frequency.value = 400;
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.05);
                    break;
            }
        });
    }
}

// ===========================================
// MENU SCENE
// ===========================================
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.scale;
        const playSound = this.registry.get('playSound');

        // Background
        this.createBackground();

        // Title
        const title = this.add.text(width / 2, height * 0.25, 'PENDEKAR KATA', {
            fontFamily: 'Cinzel',
            fontSize: '72px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 6,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#000',
                blur: 8,
                fill: true
            }
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height * 0.35, 'Game Educational Typing Peribahasa Melayu', {
            fontFamily: 'Noto Sans',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Buttons
        this.createButton(width / 2, height * 0.55, 'MULA MAIN', () => {
            playSound('click');
            // Enter game screen first; GameScene will play intro then start ghosts
            this.scene.start('GameScene', { playIntro: true });
        });

        this.createButton(width / 2, height * 0.68, 'CARA MAIN', () => {
            playSound('click');
            this.showHowToPlay();
        });

        // Mode indicator
        const modeText = gameState.isMobile ? 'MOD: Mobile (Pilihan Jawapan)' : 'MOD: Desktop (Typing)';
        this.add.text(width / 2, height * 0.85, modeText, {
            fontFamily: 'Noto Sans',
            fontSize: '16px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Credits
        this.add.text(width / 2, height * 0.95, 'Dibuat dengan Phaser 3 • Educational Game', {
            fontFamily: 'Noto Sans',
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);
    }

    // (intro flow handled inside GameScene)

    createBackground() {
        const { width, height } = this.scale;
        
        // Gradient background
        const graphics = this.add.graphics().setDepth(-10);
        graphics.fillGradientStyle(0x0f0c29, 0x0f0c29, 0x302b63, 0x302b63, 1);
        graphics.fillRect(0, 0, width, height);

        // Stars
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height * 0.5);
            const star = this.add.circle(x, y, 1, 0xffffff, 0.8);
            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1
            });
        }

        // Moon
        this.add.circle(width * 0.85, height * 0.15, 40, 0xffffe0, 0.9);
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 300, 60, 0x2d2742);
        bg.setStrokeStyle(2, 0xffd700);
        
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Noto Sans',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffd700'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(300, 60);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            bg.setFillStyle(0x3d3752);
            this.tweens.add({
                targets: button,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        button.on('pointerout', () => {
            bg.setFillStyle(0x2d2742);
            this.tweens.add({
                targets: button,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        button.on('pointerdown', callback);

        return button;
    }

    showHowToPlay() {
        const { width, height } = this.scale;
        
        // Overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
        
        // Modal
        const modal = this.add.container(width / 2, height / 2);
        const modalBg = this.add.rectangle(0, 0, 600, 400, 0x1a1625);
        modalBg.setStrokeStyle(3, 0xffd700);
        
        const title = this.add.text(0, -160, 'CARA MAIN', {
            fontFamily: 'Cinzel',
            fontSize: '32px',
            color: '#ffd700'
        }).setOrigin(0.5);

        const instructions = gameState.isMobile 
            ? 'MOD MOBILE:\n\n• Hantu akan datang dari kanan\n• Soalan peribahasa akan dipaparkan\n• Pilih jawapan yang betul\n• Jawab sebelum hantu sampai!\n• Combo jawapan betul untuk skor bonus'
            : 'MOD DESKTOP:\n\n• Hantu akan datang dari kanan\n• Soalan peribahasa akan dipaparkan\n• Taip jawapan menggunakan keyboard\n• Tekan ENTER untuk submit\n• Jawab sebelum hantu sampai!\n• Combo jawapan betul untuk skor bonus';

        const text = this.add.text(0, 0, instructions, {
            fontFamily: 'Noto Sans',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        const closeBtn = this.add.text(0, 150, 'TUTUP', {
            fontFamily: 'Noto Sans',
            fontSize: '20px',
            color: '#ffd700',
            backgroundColor: '#2d2742',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            modal.destroy();
        });

        modal.add([modalBg, title, text, closeBtn]);
    }
}

// ===========================================
// GAME SCENE
// ===========================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        gameState.score = 0;
        gameState.lives = 3;
        gameState.combo = 0;
        gameState.maxCombo = 0;
        gameState.difficulty = 1;

        // Game variables
        this.ghosts = [];
        this.currentQuestion = null;
        this.currentAnswer = '';
        this.usedProverbs = [];
        this.spawnTimer = null;
        this.ghostSpeed = 50;

        // --- Pendekar typing/attack anim state (see handleKeyboardInput) ---
        this.lastTypingAnimAt = 0;
        this.typingAnimToggle = false;

        this.playIntro = data?.playIntro ?? false;
        this.playBgm = true;
        this.gameplayStarted = false;
    }

    create() {
        const { width, height } = this.scale;
        const playSound = this.registry.get('playSound');

        // Reduce texture blur when scaling sprites
        this.cameras.main.setRoundPixels(true);
        if (this.textures.exists('pendekar_silat')) {
            this.textures.get('pendekar_silat').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        if (this.textures.exists('ghost_hantucina')) {
            this.textures.get('ghost_hantucina').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        if (this.textures.exists('ghost_toyol')) {
            this.textures.get('ghost_toyol').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        if (this.textures.exists('ghost_pocong')) {
            this.textures.get('ghost_pocong').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        if (this.textures.exists('ghost_pontianak')) {
            this.textures.get('ghost_pontianak').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        if (this.textures.exists('trees_alt_outlined')) {
            this.textures.get('trees_alt_outlined').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
        if (this.textures.exists('tree_set')) {
            this.textures.get('tree_set').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }

        // Background
        this.createGameBackground();

        // Pendekar (player) - align to same visual ground as props (house/graves have bottom padding)
        const groundY = this.groundY ?? (height - 60);
        const entityGroundY = groundY + 30;
        this.entityGroundY = entityGroundY;
        const pendekarIsSheet = this.textures.get('pendekar_silat')?.frameTotal > 1;
        if (pendekarIsSheet && !this.anims.exists('pendekar_idle')) {
            this.anims.create({
                key: 'pendekar_idle',
                frames: [
                    { key: 'pendekar_silat', frame: 0 },
                    { key: 'pendekar_silat', frame: 1 }
                ],
                frameRate: 6,
                repeat: -1
            });
        }

        if (pendekarIsSheet && !this.anims.exists('pendekar_attack')) {
            this.anims.create({
                key: 'pendekar_attack',
                frames: [
                    { key: 'pendekar_silat', frame: 3 },
                    { key: 'pendekar_silat', frame: 4 }
                ],
                frameRate: 12,
                repeat: 0
            });
        }

        // NOTE: tweak frame numbers to match your spritesheet's "attack keris" frames.
        if (pendekarIsSheet && !this.anims.exists('pendekar_attack_keris')) {
            this.anims.create({
                key: 'pendekar_attack_keris',
                frames: [
                    { key: 'pendekar_silat', frame: 5 },
                    { key: 'pendekar_silat', frame: 6 },
                    { key: 'pendekar_silat', frame: 7 },
                    { key: 'pendekar_silat', frame: 8 }
                ],
                frameRate: 14,
                repeat: 0
            });
        }
        const ghostHantuIsSheet = this.textures.get('ghost_hantucina')?.frameTotal > 1;
        if (ghostHantuIsSheet && !this.anims.exists('ghost_hantucina_loop')) {
            this.anims.create({
                key: 'ghost_hantucina_loop',
                frames: this.anims.generateFrameNumbers('ghost_hantucina', { start: 0, end: 2 }),
                frameRate: 6,
                repeat: -1
            });
        }
        const ghostToyolIsSheet = this.textures.get('ghost_toyol')?.frameTotal > 1;
        if (ghostToyolIsSheet && !this.anims.exists('ghost_toyol_loop')) {
            this.anims.create({
                key: 'ghost_toyol_loop',
                frames: this.anims.generateFrameNumbers('ghost_toyol', { start: 0, end: 2 }),
                frameRate: 8,
                repeat: -1
            });
        }
        const ghostPocongIsSheet = this.textures.get('ghost_pocong')?.frameTotal > 1;
        if (ghostPocongIsSheet && !this.anims.exists('ghost_pocong_loop')) {
            this.anims.create({
                key: 'ghost_pocong_loop',
                frames: this.anims.generateFrameNumbers('ghost_pocong', { start: 0, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
        }
        const ghostPontiIsSheet = this.textures.get('ghost_pontianak')?.frameTotal > 1;
        if (ghostPontiIsSheet && !this.anims.exists('ghost_pontianak_loop')) {
            this.anims.create({
                key: 'ghost_pontianak_loop',
                frames: this.anims.generateFrameNumbers('ghost_pontianak', { start: 0, end: 8 }),
                frameRate: 8,
                repeat: -1
            });
        }

        this.pendekar = this.add.sprite(150, entityGroundY, 'pendekar_silat', 0)
            .setOrigin(0.5, 1)
            .setDisplaySize(225, 150);
        if (pendekarIsSheet) this.pendekar.play('pendekar_idle');

        // HUD
        this.createHUD();

        // Question display
        this.questionText = this.add.text(width / 2, 80, '', {
            fontFamily: 'Noto Sans',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffd700',
            backgroundColor: '#1a1625dd',
            padding: { x: 20, y: 10 },
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        // Input UI (typed answer) - keep above ground and make it more "panel" like
        const inputY = (this.groundY ?? (height - 60)) - 310;
        this.inputPanel = this.add.container(width / 2, inputY);

        const inputBg = this.add.graphics();
        inputBg.fillStyle(0x1a1625, 0.85);
        inputBg.lineStyle(2, 0xffd700, 0.6);
        inputBg.fillRoundedRect(-280, -28, 560, 56, 12);
        inputBg.strokeRoundedRect(-280, -28, 560, 56, 12);

        this.inputDisplay = this.add.text(0, 0, '', {
            fontFamily: 'Noto Sans',
            fontSize: '26px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.inputHint = this.add.text(0, -38, gameState.isMobile ? 'Pilih jawapan' : 'Taip jawapan (ENTER untuk hantar)', {
            fontFamily: 'Noto Sans',
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        this.inputPanel.add([inputBg, this.inputHint, this.inputDisplay]);

        // Mobile controls
        if (gameState.isMobile) {
            this.createMobileControls();
        } else {
            // Desktop keyboard input
            this.input.keyboard.on('keydown', (event) => {
                this.handleKeyboardInput(event);
            });
        }

        // Play intro inside game screen, then start gameplay (ghost spawn + bgm)
        this.startIntroThenGameplay();
    }

    startIntroThenGameplay() {
        if (!gameState.soundEnabled || !this.playIntro) {
            this.startGameplay();
            return;
        }

        try {
            const intro = this.sound.add('sound_intro', { volume: 0.9, loop: false });
            intro.once('complete', () => this.startGameplay());
            intro.play();
        } catch (e) {
            this.startGameplay();
        }
    }

    startGameplay() {
        if (this.gameplayStarted) return;
        this.gameplayStarted = true;

        // Background music
        if (this.playBgm && gameState.soundEnabled) {
            try {
                // stop any previous bgm
                const existingBgm = this.registry.get('bgmSound');
                if (existingBgm?.isPlaying) existingBgm.stop();

                const bgm = this.sound.add('sound_game', { loop: true, volume: 0.35 });
                bgm.play();
                this.registry.set('bgmSound', bgm);

                this.events.once('shutdown', () => {
                    const s = this.registry.get('bgmSound');
                    if (s?.isPlaying) s.stop();
                    this.registry.set('bgmSound', null);
                });
            } catch (e) {
                // ignore audio failures
            }
        }

        // Start spawning ghosts
        this.startGhostSpawning();

        // Difficulty increase over time
        this.time.addEvent({
            delay: 15000,
            callback: () => this.increaseDifficulty(),
            loop: true
        });
    }

    createGameBackground() {
        const { width, height } = this.scale;
        
        const graphics = this.add.graphics().setDepth(-10);
        // Deeper purple night sky for better separation vs hills
        graphics.fillGradientStyle(0x0b0820, 0x0b0820, 0x2b2056, 0x2b2056, 1);
        graphics.fillRect(0, 0, width, height);

        // Reference-style night scene: big moon + rolling hills
        const addMoon = () => {
            const moonX = width * 0.12;
            const moonY = height * 0.18;
            const moonR = 46;

        // Glow
        this.add.circle(moonX, moonY, moonR * 2.2, 0xffffe0, 0.06).setDepth(-9);
        this.add.circle(moonX, moonY, moonR * 1.7, 0xffffe0, 0.09).setDepth(-9);

            // Moon body
        this.add.circle(moonX, moonY, moonR, 0xffffe0, 0.92).setDepth(-9);

            // Craters
        this.add.circle(moonX - 14, moonY + 6, 7, 0xd9d9bf, 0.35).setDepth(-9);
        this.add.circle(moonX + 10, moonY - 8, 5, 0xd9d9bf, 0.28).setDepth(-9);
        this.add.circle(moonX + 16, moonY + 12, 4, 0xd9d9bf, 0.22).setDepth(-9);
        };

        const drawHills = (color, alpha, baseY, amplitude, waveCount) => {
            const hill = this.add.graphics().setAlpha(alpha).setDepth(-8);
            hill.fillStyle(color, 1);
            hill.beginPath();
            hill.moveTo(0, height);

            const step = width / waveCount;
            for (let i = 0; i <= waveCount; i++) {
                const x = i * step;
                const y = baseY + Math.sin((i / waveCount) * Math.PI * 2) * amplitude;
                hill.lineTo(x, y);
            }

            hill.lineTo(width, height);
            hill.closePath();
            hill.fillPath();
            return hill;
        };

        addMoon();

        const farHills = drawHills(0x070611, 0.5, height * 0.55, 22, 6);
        const nearHills = drawHills(0x0d0a1f, 0.62, height * 0.62, 28, 7);

        // Slow drift for subtle life
        this.tweens.add({ targets: farHills, x: -22, duration: 22000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: nearHills, x: 16, duration: 17000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Ground (must be above hills)
        const groundHeight = 60;
        const groundY = height - groundHeight;
        this.groundHeight = groundHeight;
        this.groundY = groundY;

        const ground = this.add.graphics().setDepth(-6);
        ground.fillStyle(0x2d5016, 1);
        ground.fillRect(0, groundY, width, groundHeight);
        // Some props have transparent padding at bottom; push slightly below ground line.
        const propGroundY = groundY + 47;
        const graveGroundY = groundY + 30;

        // House (left)
        if (this.textures.exists('rumah_usang')) {
            this.add.image(30, propGroundY, 'rumah_usang')
                .setOrigin(0, 1)
                .setDisplaySize(360, 240)
                .setAlpha(0.85)
                .setDepth(-5);
        }

        // Graves (right) - 3 units
        if (this.textures.exists('kubur_1')) {
            const graveW = 150;
            const graveH = 120;
            const graveY = graveGroundY;
            const graveXs = [width - 110, width - 270, width - 430];
            graveXs.forEach((x) => {
                this.add.image(x, graveY, 'kubur_1')
                    .setOrigin(1, 1)
                    .setDisplaySize(graveW, graveH)
                    .setAlpha(0.9)
                    .setDepth(-5);
            });
        }

        // Trees (simple)
        // for (let i = 0; i < 5; i++) {
        //     const x = Phaser.Math.Between(100, width - 100);
        //     const tree = this.add.text(x, height - 80, '🌴', {
        //         fontSize: '40px'
        //     }).setAlpha(0.6);
        // }

        // Trees (2 types from tree-set.png, placed on left side)
        // Frame index: 4 columns (128x128 each).
        // Pilih 2 jenis pokok dari spritesheet `tree_set` (frame 0..3)
        const treeFrames = [0, 2]; // UBAH SINI: tukar nombor (0..3) untuk jenis pokok

        // Berapa banyak pokok nak spawn
        for (let i = 0; i < 3; i++) { // UBAH SINI: 3 = jumlah pokok

        // Kedudukan X (kiri/kanan) - random dalam range
        // UBAH SINI:
        // - 100: lebih besar = start lebih ke kanan (kurang pokok dekat tepi kiri)
        // - width*0.45: lebih besar = boleh pergi lebih kanan (contoh 0.6), lebih kecil = lebih kiri (contoh 0.3)
        const x = Phaser.Math.Between(100, Math.floor(width * 0.25));

        // Pilih frame ikut giliran: 0,2,0,2...
        const frame = treeFrames[i % treeFrames.length];

        if (this.textures.exists('tree_set')) {
            this.add.sprite(x, groundY, 'tree_set', frame) // UBAH Y: groundY + 10 (turun), groundY - 10 (naik)
            .setOrigin(0.5, 1) // anchor bawah sprite ke tanah (1 = bottom)
            .setAlpha(0.55)    // UBAH transparency: 1.0 solid, 0.3 lebih samar
            .setScale(2.9)    // UBAH SIZE: besar/kecil pokok
            .setDepth(-7);     // UBAH layer: lagi kecil (cth -9) = lagi belakang, lagi besar (cth -3) = depan
        }
        }

        // Stars (more + slight twinkle)
        for (let i = 0; i < 90; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height * 0.4);
            const r = Phaser.Math.Between(1, 2);
            const star = this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.35, 0.9)).setDepth(-9);
            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.15, 0.6),
                duration: Phaser.Math.Between(900, 2800),
                yoyo: true,
                repeat: -1
            });
        }
    }

    createHUD() {
        const { width } = this.scale;

        // Lives
        this.livesText = this.add.text(20, 20, '❤️'.repeat(gameState.lives), {
            fontSize: '32px'
        });

        // Score
        this.scoreText = this.add.text(width - 20, 20, `Skor: ${gameState.score}`, {
            fontFamily: 'Noto Sans',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(1, 0);

        // Combo
        this.comboText = this.add.text(width / 2, 20, '', {
            fontFamily: 'Noto Sans',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffd700'
        }).setOrigin(0.5, 0).setVisible(false);
    }

    createMobileControls() {
        // Answer buttons container
        this.answerButtons = this.add.container(0, 0);
        this.answerButtons.setVisible(false);
    }

    showMobileAnswers(correctAnswer, wrongAnswers) {
        this.answerButtons.removeAll(true);
        
        const { width, height } = this.scale;
        const answers = shuffleArray([correctAnswer, ...wrongAnswers]);
        const buttonY = height - 100;
        const buttonWidth = 250;
        const spacing = 20;
        const totalWidth = (buttonWidth * answers.length) + (spacing * (answers.length - 1));
        const startX = (width - totalWidth) / 2;

        answers.forEach((answer, index) => {
            const x = startX + (buttonWidth + spacing) * index + buttonWidth / 2;
            const button = this.createAnswerButton(x, buttonY, answer, correctAnswer);
            this.answerButtons.add(button);
        });

        this.answerButtons.setVisible(true);
    }

    createAnswerButton(x, y, text, correctAnswer) {
        const button = this.add.container(x, y);
        const playSound = this.registry.get('playSound');
        
        const bg = this.add.rectangle(0, 0, 240, 50, 0x2d2742);
        bg.setStrokeStyle(2, 0x4a90e2);
        
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Noto Sans',
            fontSize: '18px',
            color: '#ffffff',
            wordWrap: { width: 220 }
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(240, 50);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {
            playSound('click');

            // Mobile "typing" equivalent: play pendekar attack/keris anim on tap
            this.playPendekarTypingAnim();

            // Mobile: wrong answer should not hide all options.
            // Only remove/disable clicked wrong option; hide all only when correct.
            const normalizedUser = text.trim().toLowerCase();
            const normalizedCorrect = correctAnswer.trim().toLowerCase();
            const isCorrect = normalizedUser === normalizedCorrect;

            this.checkAnswer(text, correctAnswer);

            if (isCorrect) {
                this.answerButtons.setVisible(false);
            } else {
                button.disableInteractive();
                this.tweens.add({
                    targets: button,
                    alpha: 0,
                    duration: 180,
                    onComplete: () => button.destroy()
                });
            }
        });

        button.on('pointerover', () => {
            bg.setFillStyle(0x3d3752);
        });

        button.on('pointerout', () => {
            bg.setFillStyle(0x2d2742);
        });

        return button;
    }

    handleKeyboardInput(event) {
        const playSound = this.registry.get('playSound');

        if (!this.currentQuestion) return;

        if (event.key === 'Enter') {
            if (this.currentAnswer.length > 0) {
                this.checkAnswer(this.currentAnswer, this.currentQuestion.answer);
            }
        } else if (event.key === 'Backspace') {
            this.currentAnswer = this.currentAnswer.slice(0, -1);
            this.updateInputDisplay();
        } else if (event.key.length === 1 && /[a-zA-Z ]/.test(event.key)) {
            playSound('click');
            this.currentAnswer += event.key.toLowerCase();
            this.updateInputDisplay();

            // --- Pendekar anim while typing (attack / attack keris) ---
            // If you want different behavior, edit playPendekarTypingAnim().
            this.playPendekarTypingAnim();
        }
    }

    // Pendekar anim trigger while typing (called from handleKeyboardInput)
    playPendekarTypingAnim() {
        if (!this.pendekar?.anims) return;
        const pendekarIsSheet = this.textures.get('pendekar_silat')?.frameTotal > 1;
        if (!pendekarIsSheet) return;

        const now = this.time?.now ?? Date.now();
        const cooldownMs = 80; // prevent restarting anim every key repeat
        if (now - this.lastTypingAnimAt < cooldownMs) return;
        this.lastTypingAnimAt = now;

        // Alternate between normal attack and keris attack for "typing feels active"
        const key = this.typingAnimToggle ? 'pendekar_attack_keris' : 'pendekar_attack';
        this.typingAnimToggle = !this.typingAnimToggle;

        this.pendekar.play(key, true);
        this.pendekar.once(`animationcomplete-${key}`, () => {
            if (this.pendekar?.anims) this.pendekar.play('pendekar_idle');
        });
    }

    updateInputDisplay() {
        this.inputDisplay.setText(this.currentAnswer || '_');
    }

    startGhostSpawning() {
        this.spawnTimer = this.time.addEvent({
            delay: 4000 / gameState.difficulty,
            callback: () => this.spawnGhost(),
            loop: true
        });

        // Spawn first ghost immediately
        this.spawnGhost();
    }

    spawnGhost() {
        const { width, height } = this.scale;
        
        // Get random proverb that hasn't been used
        const availableProverbs = proverbData.filter(p => !this.usedProverbs.includes(p));
        if (availableProverbs.length === 0) {
            this.usedProverbs = [];
        }
        
        const proverb = Phaser.Utils.Array.GetRandom(availableProverbs);
        this.usedProverbs.push(proverb);

        // Ground ghosts: same level as pendekar (no floating)
        const baseGroundY = this.groundY ?? (height - 60);
        const ghostY = this.entityGroundY ?? (baseGroundY + 30);

        const ghostTypes = ['ghost_hantucina', 'ghost_pocong', 'ghost_toyol', 'ghost_pontianak'];
        const ghostType = Phaser.Utils.Array.GetRandom(ghostTypes);

        const ghostSizeByType = {
            ghost_hantucina: { w: 240, h: 160 },
            ghost_pocong: { w: 230, h: 170 },
            ghost_toyol: { w: 170, h: 125 },
            ghost_pontianak: { w: 220, h: 165 }
        };
        const size = ghostSizeByType[ghostType] ?? { w: 220, h: 150 };

        // Ghost sprite
        const ghost = this.add.sprite(width + 50, ghostY, ghostType, 0)
            .setOrigin(0.5, 1)
            .setDisplaySize(size.w, size.h);
        const ghostIsSheet = this.textures.get(ghostType)?.frameTotal > 1;
        if (ghostIsSheet) ghost.play(`${ghostType}_loop`);
        ghost.setData('ghostType', ghostType);
        ghost.setData('proverb', proverb);
        ghost.setData('answered', false);

        this.ghosts.push(ghost);

        // No floating: ground ghosts stay on ground

        // If this is the first ghost, show its question
        if (this.ghosts.length === 1) {
            this.showQuestion(proverb);
        }
    }

    showQuestion(proverb) {
        this.currentQuestion = proverb;
        this.currentAnswer = '';
        this.questionText.setText(proverb.question);
        this.questionText.setVisible(true);
        this.updateInputDisplay();

        // Mobile: show answer buttons
        if (gameState.isMobile) {
            this.showMobileAnswers(proverb.answer, proverb.wrongAnswers);
        }
    }

    checkAnswer(userAnswer, correctAnswer) {
        const playSound = this.registry.get('playSound');

        // Normalize answers
        const normalizedUser = userAnswer.trim().toLowerCase();
        const normalizedCorrect = correctAnswer.trim().toLowerCase();

        if (normalizedUser === normalizedCorrect) {
            // Correct answer!
            playSound('correct');
            this.handleCorrectAnswer();
        } else {
            // Wrong answer
            playSound('wrong');
            this.handleWrongAnswer();
        }
    }

    handleCorrectAnswer() {
        const playSound = this.registry.get('playSound');

        // Find the current ghost
        const ghost = this.ghosts[0];
        if (!ghost) return;

        // Mark as answered
        ghost.setData('answered', true);

        // Attack animation
        this.attackGhost(ghost);

        // Update combo
        gameState.combo++;
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
        
        // Update score
        const baseScore = 100;
        const comboBonus = gameState.combo > 1 ? gameState.combo * 25 : 0;
        gameState.score += baseScore + comboBonus;
        
        this.scoreText.setText(`Skor: ${gameState.score}`);

        // Show combo
        if (gameState.combo > 1) {
            playSound('combo');
            this.showComboText();
        }

        // Remove ghost
        this.ghosts.shift();

        // Clear current question
        this.currentQuestion = null;
        this.currentAnswer = '';
        this.questionText.setVisible(false);
        this.inputDisplay.setText('');

        // Show next question if available
        if (this.ghosts.length > 0) {
            this.time.delayedCall(500, () => {
                if (this.ghosts[0]) {
                    this.showQuestion(this.ghosts[0].getData('proverb'));
                }
            });
        }
    }

    handleWrongAnswer() {
        // Shake input
        this.tweens.add({
            targets: this.inputPanel ?? this.inputDisplay,
            x: (this.inputPanel ?? this.inputDisplay).x + 10,
            duration: 50,
            yoyo: true,
            repeat: 3
        });

        // Flash red
        this.inputDisplay.setTint(0xff6666);
        this.time.delayedCall(200, () => {
            this.inputDisplay.clearTint();
        });

        // Clear input
        this.currentAnswer = '';
        this.updateInputDisplay();
    }

    attackGhost(ghost) {
        const playSound = this.registry.get('playSound');
        playSound('attack');

        // Pendekar attack animation (then return to idle)
        // NOTE: this triggers on correct answer submit (Enter).
        if (this.pendekar?.anims) {
            this.pendekar.play('pendekar_attack', true);
            this.pendekar.once('animationcomplete-pendekar_attack', () => {
                if (this.pendekar?.anims) this.pendekar.play('pendekar_idle');
            });
        }

        // Pendekar slash animation
        this.tweens.add({
            targets: this.pendekar,
            x: this.pendekar.x + 50,
            duration: 100,
            yoyo: true
        });

        // Ghost death animation
        this.tweens.add({
            targets: ghost,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 300,
            onComplete: () => {
                ghost.destroy();
            }
        });

        // Particle effect
        for (let i = 0; i < 10; i++) {
            const particle = this.add.circle(ghost.x, ghost.y, 3, 0xffd700);
            this.tweens.add({
                targets: particle,
                x: particle.x + Phaser.Math.Between(-50, 50),
                y: particle.y + Phaser.Math.Between(-50, 50),
                alpha: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }

    showComboText() {
        this.comboText.setText(`COMBO x${gameState.combo}!`);
        this.comboText.setVisible(true);
        this.comboText.setScale(1.5);
        
        this.tweens.add({
            targets: this.comboText,
            scaleX: 1,
            scaleY: 1,
            duration: 200
        });

        this.time.delayedCall(1500, () => {
            this.comboText.setVisible(false);
        });
    }

    damagePlayer() {
        const playSound = this.registry.get('playSound');
        playSound('damage');

        gameState.lives--;
        gameState.combo = 0;
        
        this.livesText.setText('❤️'.repeat(Math.max(0, gameState.lives)));

        // Knockback animation
        this.tweens.add({
            targets: this.pendekar,
            x: this.pendekar.x - 30,
            duration: 100,
            yoyo: true
        });

        // Blink animation
        this.tweens.add({
            targets: this.pendekar,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 3
        });

        if (gameState.lives <= 0) {
            this.gameOver();
        }
    }

    increaseDifficulty() {
        gameState.difficulty = Math.min(gameState.difficulty + 0.2, 3);
        this.ghostSpeed = 50 + (gameState.difficulty * 20);
    }

    gameOver() {
        this.scene.start('GameOverScene');
    }

    update() {
        // Move ghosts
        this.ghosts.forEach((ghost, index) => {
            if (!ghost.getData('answered')) {
                ghost.x -= this.ghostSpeed * 0.016;

                // Check collision with pendekar
                if (ghost.x < this.pendekar.x + 50 && index === 0) {
                    this.damagePlayer();
                    ghost.destroy();
                    this.ghosts.shift();
                    
                    // Show next question
                    this.currentQuestion = null;
                    this.questionText.setVisible(false);
                    
                    if (this.ghosts.length > 0) {
                        this.showQuestion(this.ghosts[0].getData('proverb'));
                    }
                }
            }
        });
    }
}

// ===========================================
// GAME OVER SCENE
// ===========================================
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const { width, height } = this.scale;
        const playSound = this.registry.get('playSound');

        // Background
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a0000, 0x1a0000, 0x2d1a1a, 0x2d1a1a, 1);
        graphics.fillRect(0, 0, width, height);

        // Game Over text
        this.add.text(width / 2, height * 0.25, 'TAMAT', {
            fontFamily: 'Cinzel',
            fontSize: '72px',
            color: '#ff6666',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Stats
        const statsY = height * 0.45;
        this.add.text(width / 2, statsY, `Skor Akhir: ${gameState.score}`, {
            fontFamily: 'Noto Sans',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, statsY + 50, `Combo Tertinggi: ${gameState.maxCombo}`, {
            fontFamily: 'Noto Sans',
            fontSize: '24px',
            color: '#ffd700'
        }).setOrigin(0.5);

        // Buttons
        this.createButton(width / 2, height * 0.68, 'MAIN LAGI', () => {
            playSound('click');
            this.scene.start('GameScene');
        });

        this.createButton(width / 2, height * 0.8, 'MENU UTAMA', () => {
            playSound('click');
            this.scene.start('MenuScene');
        });
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 300, 60, 0x2d2742);
        bg.setStrokeStyle(2, 0xffd700);
        
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Noto Sans',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffd700'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(300, 60);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            bg.setFillStyle(0x3d3752);
        });

        button.on('pointerout', () => {
            bg.setFillStyle(0x2d2742);
        });

        button.on('pointerdown', callback);

        return button;
    }
}

// ===========================================
// GAME INIT (after scenes declared)
// ===========================================
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#1a1625',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [PreloadScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
