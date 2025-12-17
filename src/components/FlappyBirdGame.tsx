import { useEffect, useRef, useCallback, useState } from 'react';
import { Bird, Pipe, Cloud, GameState, GameConfig } from '../types/game';
import { useGameAudio } from '../hooks/useGameAudio';
import { useHighScore } from '../hooks/useHighScore';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

const BASE_CONFIG: GameConfig = {
  gravity: 0.35,
  jumpForce: -7,
  pipeSpeed: 2.5,
  pipeGap: 160,
  pipeSpawnInterval: 2000,
  groundHeight: 80,
};

const createBird = (): Bird => ({
  x: 80,
  y: CANVAS_HEIGHT / 2,
  velocity: 0,
  rotation: 0,
  width: 40,
  height: 30,
});

const createCloud = (x?: number): Cloud => ({
  x: x ?? CANVAS_WIDTH + Math.random() * 100,
  y: 50 + Math.random() * 150,
  scale: 0.5 + Math.random() * 0.5,
  speed: 0.5 + Math.random() * 0.5,
});

export const FlappyBirdGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const lastPipeTimeRef = useRef<number>(0);
  const configRef = useRef<GameConfig>({ ...BASE_CONFIG });

  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const birdRef = useRef<Bird>(createBird());
  const pipesRef = useRef<Pipe[]>([]);
  const cloudsRef = useRef<Cloud[]>([
    createCloud(100),
    createCloud(250),
    createCloud(400),
  ]);

  const { playJump, playScore, playHit, playNewHighScore } = useGameAudio();
  const { highScore, updateHighScore } = useHighScore();

  // Draw cute bird
  const drawBird = useCallback((ctx: CanvasRenderingContext2D, bird: Bird, isFlapping: boolean) => {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    // Body
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    gradient.addColorStop(0, '#FFE566');
    gradient.addColorStop(1, '#FFB800');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = '#FFF5CC';
    ctx.beginPath();
    ctx.ellipse(5, 5, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#E69500';
    ctx.beginPath();
    const wingY = isFlapping ? -5 : 2;
    ctx.ellipse(-5, wingY, 10, 6, isFlapping ? -0.3 : 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eye (white)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(10, -5, 8, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(12, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(13, -7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(28, 3);
    ctx.lineTo(18, 6);
    ctx.closePath();
    ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse(5, 5, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  // Draw pipe
  const drawPipe = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    const pipeWidth = pipe.width;
    const capHeight = 30;
    const capOverhang = 5;

    // Top pipe
    const topGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
    topGradient.addColorStop(0, '#4A9D4A');
    topGradient.addColorStop(0.3, '#6BBF6B');
    topGradient.addColorStop(0.7, '#4A9D4A');
    topGradient.addColorStop(1, '#357A35');

    ctx.fillStyle = topGradient;
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight - capHeight);

    // Top pipe cap
    ctx.fillStyle = topGradient;
    ctx.fillRect(pipe.x - capOverhang, pipe.topHeight - capHeight, pipeWidth + capOverhang * 2, capHeight);

    // Top pipe cap border
    ctx.strokeStyle = '#2D5A2D';
    ctx.lineWidth = 3;
    ctx.strokeRect(pipe.x - capOverhang, pipe.topHeight - capHeight, pipeWidth + capOverhang * 2, capHeight);

    // Top pipe highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(pipe.x + 5, 0, 8, pipe.topHeight - capHeight);

    // Bottom pipe
    ctx.fillStyle = topGradient;
    ctx.fillRect(pipe.x, pipe.bottomY + capHeight, pipeWidth, CANVAS_HEIGHT - pipe.bottomY - capHeight - BASE_CONFIG.groundHeight);

    // Bottom pipe cap
    ctx.fillRect(pipe.x - capOverhang, pipe.bottomY, pipeWidth + capOverhang * 2, capHeight);

    // Bottom pipe cap border
    ctx.strokeRect(pipe.x - capOverhang, pipe.bottomY, pipeWidth + capOverhang * 2, capHeight);

    // Bottom pipe highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(pipe.x + 5, pipe.bottomY + capHeight, 8, CANVAS_HEIGHT - pipe.bottomY - capHeight - BASE_CONFIG.groundHeight);
  }, []);

  // Draw cloud
  const drawCloud = useCallback((ctx: CanvasRenderingContext2D, cloud: Cloud) => {
    ctx.save();
    ctx.translate(cloud.x, cloud.y);
    ctx.scale(cloud.scale, cloud.scale);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.arc(25, -5, 20, 0, Math.PI * 2);
    ctx.arc(50, 0, 25, 0, Math.PI * 2);
    ctx.arc(20, 10, 20, 0, Math.PI * 2);
    ctx.arc(35, 8, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  // Draw ground
  const drawGround = useCallback((ctx: CanvasRenderingContext2D, offset: number) => {
    const groundY = CANVAS_HEIGHT - BASE_CONFIG.groundHeight;

    // Grass top
    ctx.fillStyle = '#7EC850';
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 15);

    // Grass pattern
    for (let x = (offset % 20) - 20; x < CANVAS_WIDTH; x += 20) {
      ctx.fillStyle = '#5EAA30';
      ctx.beginPath();
      ctx.moveTo(x, groundY + 15);
      ctx.lineTo(x + 10, groundY);
      ctx.lineTo(x + 20, groundY + 15);
      ctx.fill();
    }

    // Ground
    const groundGradient = ctx.createLinearGradient(0, groundY + 15, 0, CANVAS_HEIGHT);
    groundGradient.addColorStop(0, '#C4A35A');
    groundGradient.addColorStop(1, '#8B7355');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY + 15, CANVAS_WIDTH, BASE_CONFIG.groundHeight - 15);

    // Ground pattern
    ctx.fillStyle = '#A68B5B';
    for (let x = (offset % 40) - 40; x < CANVAS_WIDTH; x += 40) {
      ctx.fillRect(x, groundY + 30, 20, 10);
      ctx.fillRect(x + 20, groundY + 50, 20, 10);
    }
  }, []);

  // Draw background
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.7, '#B0E0E6');
    skyGradient.addColorStop(1, '#E0F4FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Jump handler
  const jump = useCallback(() => {
    if (gameState === 'playing') {
      birdRef.current.velocity = configRef.current.jumpForce;
      playJump();
    }
  }, [gameState, playJump]);

  // Start game
  const startGame = useCallback(() => {
    birdRef.current = createBird();
    pipesRef.current = [];
    configRef.current = { ...BASE_CONFIG };
    lastPipeTimeRef.current = 0;
    setScore(0);
    setIsNewHighScore(false);
    setGameState('playing');
  }, []);

  // Reset to start
  const goToStart = useCallback(() => {
    birdRef.current = createBird();
    pipesRef.current = [];
    setScore(0);
    setIsNewHighScore(false);
    setGameState('start');
  }, []);

  // Spawn pipe
  const spawnPipe = useCallback(() => {
    const minTopHeight = 80;
    const maxTopHeight = CANVAS_HEIGHT - BASE_CONFIG.groundHeight - configRef.current.pipeGap - 80;
    const topHeight = minTopHeight + Math.random() * (maxTopHeight - minTopHeight);

    pipesRef.current.push({
      x: CANVAS_WIDTH,
      topHeight,
      bottomY: topHeight + configRef.current.pipeGap,
      width: 60,
      passed: false,
    });
  }, []);

  // Check collision
  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]): boolean => {
    // Ground collision
    if (bird.y + bird.height / 2 >= CANVAS_HEIGHT - BASE_CONFIG.groundHeight) {
      return true;
    }

    // Ceiling collision
    if (bird.y - bird.height / 2 <= 0) {
      return true;
    }

    // Pipe collision
    for (const pipe of pipes) {
      const birdLeft = bird.x - bird.width / 2 + 8;
      const birdRight = bird.x + bird.width / 2 - 8;
      const birdTop = bird.y - bird.height / 2 + 5;
      const birdBottom = bird.y + bird.height / 2 - 5;

      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + pipe.width;

      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
          return true;
        }
      }
    }

    return false;
  }, []);

  // Update difficulty
  const updateDifficulty = useCallback((currentScore: number) => {
    const speedIncrease = Math.min(currentScore * 0.1, 3);
    const gapDecrease = Math.min(currentScore * 2, 30);

    configRef.current.pipeSpeed = BASE_CONFIG.pipeSpeed + speedIncrease;
    configRef.current.pipeGap = BASE_CONFIG.pipeGap - gapDecrease;
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let groundOffset = 0;
    let animationFrame = 0;
    let lastTime = 0;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      animationFrame++;

      // Draw background
      drawBackground(ctx);

      // Update and draw clouds
      cloudsRef.current.forEach((cloud) => {
        cloud.x -= cloud.speed;
        if (cloud.x < -100) {
          cloud.x = CANVAS_WIDTH + 50;
          cloud.y = 50 + Math.random() * 150;
        }
        drawCloud(ctx, cloud);
      });

      if (gameState === 'playing') {
        // Update bird
        const bird = birdRef.current;
        bird.velocity += configRef.current.gravity;
        bird.y += bird.velocity;

        // Rotation based on velocity
        bird.rotation = Math.max(-0.5, Math.min(bird.velocity * 0.05, 1.2));

        // Spawn pipes
        if (currentTime - lastPipeTimeRef.current > configRef.current.pipeSpawnInterval) {
          spawnPipe();
          lastPipeTimeRef.current = currentTime;
        }

        // Update pipes
        pipesRef.current = pipesRef.current.filter((pipe) => {
          pipe.x -= configRef.current.pipeSpeed;

          // Score when passing pipe
          if (!pipe.passed && pipe.x + pipe.width < bird.x) {
            pipe.passed = true;
            setScore((prev) => {
              const newScore = prev + 1;
              updateDifficulty(newScore);
              playScore();
              return newScore;
            });
          }

          return pipe.x > -pipe.width;
        });

        // Check collision
        if (checkCollision(bird, pipesRef.current)) {
          playHit();
          const isNew = updateHighScore(score);
          if (isNew) {
            setIsNewHighScore(true);
            playNewHighScore();
          }
          setGameState('gameover');
        }

        // Update ground offset
        groundOffset = (groundOffset + configRef.current.pipeSpeed) % 40;
      }

      // Draw pipes
      pipesRef.current.forEach((pipe) => drawPipe(ctx, pipe));

      // Draw ground
      drawGround(ctx, groundOffset);

      // Draw bird
      const isFlapping = gameState === 'playing' && birdRef.current.velocity < 0;
      if (gameState === 'start') {
        // Floating animation on start screen
        birdRef.current.y = CANVAS_HEIGHT / 2 + Math.sin(animationFrame * 0.05) * 15;
        birdRef.current.rotation = 0;
      }
      drawBird(ctx, birdRef.current, isFlapping);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, score, drawBackground, drawCloud, drawPipe, drawGround, drawBird, spawnPipe, checkCollision, updateDifficulty, playScore, playHit, playNewHighScore, updateHighScore]);

  // Input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (gameState === 'start') {
          startGame();
        } else if (gameState === 'playing') {
          jump();
        } else if (gameState === 'gameover') {
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump, startGame]);

  const handleCanvasClick = () => {
    if (gameState === 'start') {
      startGame();
    } else if (gameState === 'playing') {
      jump();
    }
  };

  return (
    <div className="relative select-none">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="rounded-2xl shadow-2xl cursor-pointer"
        style={{ touchAction: 'manipulation' }}
      />

      {/* Score display during game */}
      {gameState === 'playing' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <span className="score-display text-5xl">{score}</span>
        </div>
      )}

      {/* Start screen overlay */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-2xl">
          <h1 className="game-title text-4xl mb-4">Flappy Bird</h1>
          <div className="game-panel text-center animate-bounce-in">
            <p className="text-lg mb-2 text-foreground/80">最高分: {highScore}</p>
            <button onClick={startGame} className="game-btn mb-3">
              开始游戏
            </button>
            <p className="text-sm text-foreground/60">点击或按空格键飞行</p>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-2xl">
          <div className="game-panel text-center animate-slide-up">
            <h2 className="text-2xl font-bold text-foreground mb-4">游戏结束</h2>

            {isNewHighScore && (
              <div className="animate-pulse-glow mb-4">
                <span className="text-lg font-bold" style={{ color: 'hsl(45 100% 50%)' }}>
                  🎉 新纪录！
                </span>
              </div>
            )}

            <div className="flex justify-around mb-6 gap-8">
              <div>
                <p className="text-sm text-foreground/60">本次得分</p>
                <p className="text-3xl font-bold text-foreground">{score}</p>
              </div>
              <div>
                <p className="text-sm text-foreground/60">最高分</p>
                <p className="text-3xl font-bold" style={{ color: 'hsl(45 100% 50%)' }}>
                  {Math.max(score, highScore)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={startGame} className="game-btn">
                再玩一次
              </button>
              <button onClick={goToStart} className="game-btn-secondary">
                返回主菜单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
