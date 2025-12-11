import { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: Date;
  onExpire?: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate, onExpire }) => {
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        onExpire?.();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTime({ days, hours, minutes, seconds, expired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const TimeUnit = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-gradient-to-br from-[#0F5F3A] to-[#166C47] dark:from-[#22C55E] dark:to-[#34D399] rounded-lg p-4 min-w-20">
        <span className="text-2xl md:text-3xl font-bold text-white">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
        {label}
      </span>
    </div>
  );

  if (time.expired) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl font-bold text-[#0F5F3A] dark:text-[#22C55E]">
          🎉 Season 0 Has Started! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-3 md:gap-6 py-8">
      <TimeUnit label="Days" value={time.days} />
      <div className="flex items-center text-2xl md:text-3xl font-bold text-gray-600 dark:text-gray-400">
        :
      </div>
      <TimeUnit label="Hours" value={time.hours} />
      <div className="flex items-center text-2xl md:text-3xl font-bold text-gray-600 dark:text-gray-400">
        :
      </div>
      <TimeUnit label="Minutes" value={time.minutes} />
      <div className="flex items-center text-2xl md:text-3xl font-bold text-gray-600 dark:text-gray-400">
        :
      </div>
      <TimeUnit label="Seconds" value={time.seconds} />
    </div>
  );
};
