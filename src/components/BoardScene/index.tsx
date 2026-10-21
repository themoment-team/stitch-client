import { useEffect, useRef } from "react";
import type { BoardDrawing, Drawing } from "@/types";

interface BoardSceneProps {
  drawings: BoardDrawing[];
}

interface Sprite {
  id: string;
  /** 칸 하나를 1px로 그린 원본. 그릴 때 정수 배율 없이 키워도 칸 경계가 번지지 않게 보간을 끔 */
  image: HTMLCanvasElement;
  /** 색이 칠해진 칸의 범위(그림 크기에 대한 비율). 그림자를 빈 칸이 아닌 실제 그림 아래에 맞춤 */
  bounds: { left: number; right: number; bottom: number };
  /** 반짝이 효과에 쓸 그림 속 색 */
  colors: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 떠다니려는 방향(라디안). 조금씩 흔들려 제각각 돌아다님 */
  heading: number;
  /** 둥실거리는 움직임이 모두 같은 박자로 맞춰지지 않도록 그림마다 다르게 둠 */
  phase: number;
  /** 등장 애니메이션 시작 시각. 처음 띄울 때는 순서대로 하나씩 나타나도록 미래 시각을 줌 */
  bornAt: number;
  /** 보드를 띄운 뒤 새로 저장된 그림. 가운데에 크게 등장했다가 무리에 합류함 */
  isArrival: boolean;
  hasBurst: boolean;
  hopAt: number | null;
  leftAt: number | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornAt: number;
  life: number;
  color: string;
  size: number;
}

interface Ripple {
  x: number;
  y: number;
  bornAt: number;
}

/** 떠다니는 속도(px/ms) */
const SPEED = 0.03;
/** 목표 속도로 따라가는 정도(1ms당). 밀려나거나 점프한 뒤 원래 움직임으로 서서히 돌아옴 */
const STEER = 0.002;
/** 떠다니는 방향이 흔들리는 정도(1ms당 라디안) */
const WANDER = 0.003;
/** 손가락·마우스가 가까이 오면 피하는 힘 */
const REPEL_FORCE = 0.004;
/** 누른 자리 주변 그림이 튕겨 나가는 속도(px/ms) */
const TAP_IMPULSE = 0.6;

const ENTER_DURATION = 700;
/** 새 그림이 가운데에서 커졌다가 무리 크기로 돌아올 때까지 걸리는 시간 */
const ARRIVAL_DURATION = 2400;
const ARRIVAL_SCALE = 2.4;
const HOP_DURATION = 700;
const LEAVE_DURATION = 600;
const RIPPLE_DURATION = 700;
/** 탭이 다른 화면에 가 있다 돌아와도 한 번에 멀리 순간이동하지 않도록 한 프레임 시간을 제한 */
const MAX_FRAME_MS = 50;

const BACKGROUND_TOP = "#f6e9ec";
const BACKGROUND_BOTTOM = "#f8f8f8";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// 살짝 넘쳤다가 돌아오는 등장 곡선
const easeOutBack = (t: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** 그림 수가 많을수록 작게 그려 화면에 고르게 퍼지게 함 */
const getSpriteSize = (width: number, height: number, count: number) =>
  clamp(Math.sqrt((width * height) / Math.max(count, 8)) * 0.6, 64, 200);

const createSpriteImage = ({ size, pixels }: Drawing) => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  pixels.forEach((color, index) => {
    if (!color || !context) return;
    context.fillStyle = color;
    context.fillRect(index % size, Math.floor(index / size), 1, 1);
  });
  return canvas;
};

const getContentBounds = ({ size, pixels }: Drawing) => {
  let left: number = size;
  let right = 0;
  let bottom = 0;
  pixels.forEach((color, index) => {
    if (!color) return;
    left = Math.min(left, index % size);
    right = Math.max(right, (index % size) + 1);
    bottom = Math.max(bottom, Math.floor(index / size) + 1);
  });
  // 빈 그림이면 가운데 아래에 작은 그림자만 남김
  if (left >= right) return { left: 0.45, right: 0.55, bottom: 1 };
  return { left: left / size, right: right / size, bottom: bottom / size };
};

/** 화면 속 그림들이 살아 움직이는 캔버스. 가까이 가면 피하고, 누르면 점프하며 반짝임 */
const BoardScene = ({ drawings }: BoardSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef({
    sprites: new Map<string, Sprite>(),
    particles: [] as Particle[],
    ripples: [] as Ripple[],
    pointer: null as { x: number; y: number } | null,
    width: 0,
    height: 0,
    hasLoaded: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const scene = sceneRef.current;
    // 움직임을 줄이도록 설정한 사용자에게는 느리고 잔잔하게 보여줌
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.3 : 1;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      scene.width = window.innerWidth;
      scene.height = window.innerHeight;
      canvas.width = scene.width * ratio;
      canvas.height = scene.height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();

    const burst = (x: number, y: number, colors: string[], count: number, now: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.1 + Math.random() * 0.25;
        scene.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.1,
          bornAt: now,
          life: 600 + Math.random() * 500,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.floor(Math.random() * 3) * 2,
        });
      }
    };

    const updateSprites = (now: number, dt: number, size: number) => {
      const { width, height, pointer } = scene;
      const sprites = [...scene.sprites.values()];
      const half = size / 2;
      const repelRadius = size * 1.6;

      sprites.forEach((sprite) => {
        const age = now - sprite.bornAt;
        if (age < 0 || (sprite.isArrival && age < ARRIVAL_DURATION)) return;

        sprite.heading += (Math.random() - 0.5) * WANDER * dt;
        // 화면 가장자리에 닿으면 가운데 쪽으로 방향을 틂
        const margin = size * 0.8;
        if (sprite.x < margin || sprite.x > width - margin || sprite.y < margin || sprite.y > height - margin) {
          sprite.heading = Math.atan2(height / 2 - sprite.y, width / 2 - sprite.x) + (Math.random() - 0.5);
        }

        const speed = SPEED * motion;
        sprite.vx += (Math.cos(sprite.heading) * speed - sprite.vx) * STEER * dt;
        sprite.vy += (Math.sin(sprite.heading) * speed - sprite.vy) * STEER * dt;

        if (pointer) {
          const dx = sprite.x - pointer.x;
          const dy = sprite.y - pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < repelRadius) {
            const force = (1 - distance / repelRadius) * REPEL_FORCE * dt;
            sprite.vx += (dx / distance) * force;
            sprite.vy += (dy / distance) * force;
          }
        }

        // 그림끼리 겹쳐 가려지지 않도록 가까우면 서로 밀어냄
        sprites.forEach((other) => {
          if (other === sprite || now < other.bornAt) return;
          const dx = sprite.x - other.x;
          const dy = sprite.y - other.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < size * 0.9) {
            const force = (1 - distance / (size * 0.9)) * 0.002 * dt;
            sprite.vx += (dx / distance) * force;
            sprite.vy += (dy / distance) * force;
          }
        });

        sprite.x = clamp(sprite.x + sprite.vx * dt, half, width - half);
        sprite.y = clamp(sprite.y + sprite.vy * dt, half, height - half);
      });
    };

    const drawBackground = () => {
      const { width, height } = scene;
      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, BACKGROUND_TOP);
      gradient.addColorStop(1, BACKGROUND_BOTTOM);
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    };

    const drawSprite = (sprite: Sprite, now: number, size: number) => {
      const age = now - sprite.bornAt;
      let { x, y } = sprite;
      let scale = 1;

      if (sprite.isArrival && age < ARRIVAL_DURATION) {
        // 가운데에서 크게 튀어나와 잠시 머문 뒤, 무리 크기로 작아지며 제자리로 감
        x = scene.width / 2;
        y = scene.height / 2;
        if (age >= 600 && !sprite.hasBurst) {
          burst(x, y, sprite.colors, 40, now);
          sprite.hasBurst = true;
        }
        if (age < 600) scale = ARRIVAL_SCALE * easeOutBack(age / 600);
        else if (age < 1600) scale = ARRIVAL_SCALE + Math.sin((age - 600) * 0.01) * 0.08;
        else scale = ARRIVAL_SCALE + (1 - ARRIVAL_SCALE) * easeInOut((age - 1600) / (ARRIVAL_DURATION - 1600));
        sprite.x = x;
        sprite.y = y;
      } else if (age < ENTER_DURATION) {
        scale = easeOutBack(age / ENTER_DURATION);
      }

      let alpha = 1;
      if (sprite.leftAt !== null) alpha = clamp(1 - (now - sprite.leftAt) / LEAVE_DURATION, 0, 1);

      const bob = Math.sin(now * 0.0025 + sprite.phase) * size * 0.06 * motion;
      let jump = 0;
      let spin = 0;
      if (sprite.hopAt !== null) {
        const progress = (now - sprite.hopAt) / HOP_DURATION;
        if (progress < 1) {
          jump = Math.sin(Math.PI * progress) * size * 0.6;
          spin = easeInOut(progress) * Math.PI * 2;
        } else sprite.hopAt = null;
      }
      // 움직이는 쪽으로 살짝 기울어 헤엄치듯 보이게 함
      const tilt = clamp(sprite.vx * 5, -0.25, 0.25) + Math.sin(now * 0.002 + sprite.phase) * 0.05 * motion;
      const drawSize = size * scale;

      const { left, right, bottom } = sprite.bounds;
      context.globalAlpha = alpha * 0.12 * (1 - jump / (size * 1.2));
      context.fillStyle = "#222222";
      context.beginPath();
      context.ellipse(
        x + ((left + right) / 2 - 0.5) * drawSize,
        y + (bottom - 0.5) * drawSize + drawSize * 0.08,
        Math.max((right - left) * drawSize * 0.45, 4),
        drawSize * 0.06,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();

      context.globalAlpha = alpha;
      context.save();
      context.translate(x, y + bob - jump);
      context.rotate(tilt + spin);
      context.drawImage(sprite.image, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      context.restore();
      context.globalAlpha = 1;
    };

    const drawEffects = (now: number, dt: number, size: number) => {
      scene.ripples = scene.ripples.filter((ripple) => now - ripple.bornAt < RIPPLE_DURATION);
      scene.ripples.forEach(({ x, y, bornAt }) => {
        const progress = (now - bornAt) / RIPPLE_DURATION;
        context.globalAlpha = 1 - progress;
        context.strokeStyle = "#d8c2c8";
        context.lineWidth = 4;
        context.beginPath();
        context.arc(x, y, size * 1.4 * easeInOut(progress), 0, Math.PI * 2);
        context.stroke();
      });

      scene.particles = scene.particles.filter((particle) => now - particle.bornAt < particle.life);
      scene.particles.forEach((particle) => {
        particle.vy += 0.0005 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        context.globalAlpha = 1 - (now - particle.bornAt) / particle.life;
        context.fillStyle = particle.color;
        context.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
      });
      context.globalAlpha = 1;
    };

    let lastTime = performance.now();
    let frameId = 0;
    const frame = (now: number) => {
      const dt = Math.min(now - lastTime, MAX_FRAME_MS);
      lastTime = now;

      scene.sprites.forEach((sprite) => {
        if (sprite.leftAt !== null && now - sprite.leftAt > LEAVE_DURATION) scene.sprites.delete(sprite.id);
      });
      const size = getSpriteSize(scene.width, scene.height, scene.sprites.size);

      updateSprites(now, dt, size);
      context.imageSmoothingEnabled = false;
      drawBackground();
      // 아래쪽 그림이 앞에 보이도록 위에서부터 그림. 막 도착한 그림은 맨 앞에 둠
      const isArriving = (sprite: Sprite) => sprite.isArrival && now - sprite.bornAt < ARRIVAL_DURATION;
      [...scene.sprites.values()]
        .filter((sprite) => now >= sprite.bornAt)
        .sort((a, b) => Number(isArriving(a)) - Number(isArriving(b)) || a.y - b.y)
        .forEach((sprite) => drawSprite(sprite, now, size));
      drawEffects(now, dt, size);

      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);

    const toScenePoint = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const handlePointerMove = (event: PointerEvent) => {
      scene.pointer = toScenePoint(event);
    };

    const handlePointerLeave = () => {
      scene.pointer = null;
    };

    const handlePointerUp = (event: PointerEvent) => {
      // 터치는 손을 떼면 그 자리에 포인터가 남지 않도록 지움
      if (event.pointerType === "touch") handlePointerLeave();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const point = toScenePoint(event);
      const now = performance.now();
      const size = getSpriteSize(scene.width, scene.height, scene.sprites.size);

      // 앞에 그려진(아래쪽) 그림부터 눌렸는지 확인
      const touched = [...scene.sprites.values()]
        .filter((sprite) => now >= sprite.bornAt && sprite.leftAt === null)
        .sort((a, b) => b.y - a.y)
        .find((sprite) => Math.abs(sprite.x - point.x) < size / 2 && Math.abs(sprite.y - point.y) < size / 2);

      if (touched) {
        touched.hopAt = now;
        burst(touched.x, touched.y, touched.colors, 18, now);
        return;
      }

      // 빈 곳을 누르면 물결이 퍼지며 주변 그림이 놀라 흩어짐
      scene.ripples.push({ ...point, bornAt: now });
      scene.sprites.forEach((sprite) => {
        const dx = sprite.x - point.x;
        const dy = sprite.y - point.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance > size * 2.5) return;
        const force = (1 - distance / (size * 2.5)) * TAP_IMPULSE;
        sprite.vx += (dx / distance) * force;
        sprite.vy += (dy / distance) * force;
        sprite.heading = Math.atan2(dy, dx);
      });
    };

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("pointerup", handlePointerUp);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const now = performance.now();
    const ids = new Set(drawings.map(({ id }) => id));
    // 처음 받은 그림은 차례로 튀어나오고, 그 뒤에 들어온 그림은 새로 도착한 그림으로 크게 보여줌
    const isFirstLoad = !scene.hasLoaded;
    const size = getSpriteSize(scene.width, scene.height, drawings.length);

    drawings.forEach((drawing, index) => {
      if (scene.sprites.has(drawing.id)) return;
      const colors = [...new Set(drawing.pixels.filter((color): color is string => color !== null))].slice(0, 12);
      scene.sprites.set(drawing.id, {
        id: drawing.id,
        image: createSpriteImage(drawing),
        bounds: getContentBounds(drawing),
        colors: colors.length > 0 ? colors : ["#d8c2c8"],
        x: size / 2 + Math.random() * Math.max(0, scene.width - size),
        y: size / 2 + Math.random() * Math.max(0, scene.height - size),
        vx: 0,
        vy: 0,
        heading: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        bornAt: isFirstLoad ? now + index * 60 : now,
        isArrival: !isFirstLoad,
        hasBurst: false,
        hopAt: null,
        leftAt: null,
      });
    });

    scene.sprites.forEach((sprite) => {
      if (!ids.has(sprite.id) && sprite.leftAt === null) sprite.leftAt = now;
    });
    if (drawings.length > 0) scene.hasLoaded = true;
  }, [drawings]);

  return <canvas ref={canvasRef} className="absolute inset-0 size-full touch-none" />;
};

export default BoardScene;
