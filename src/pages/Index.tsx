import { FlappyBirdGame } from '../components/FlappyBirdGame';

const Index = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, hsl(196 100% 70%) 0%, hsl(199 100% 85%) 60%, hsl(100 60% 75%) 100%)'
      }}
    >
      {/* Decorative clouds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-32 h-16 bg-white/80 rounded-full blur-sm animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[15%] right-[10%] w-40 h-20 bg-white/70 rounded-full blur-sm animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-[25%] left-[15%] w-24 h-12 bg-white/60 rounded-full blur-sm animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[8%] right-[30%] w-28 h-14 bg-white/75 rounded-full blur-sm animate-float" style={{ animationDelay: '0.3s' }} />
      </div>

      {/* Game container */}
      <div className="relative z-10">
        <FlappyBirdGame />
      </div>

      {/* Footer */}
      <p className="mt-6 text-sm text-foreground/50 relative z-10">
        点击或按空格键控制小鸟飞行
      </p>
    </div>
  );
};

export default Index;
