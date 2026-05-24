import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number; // percentage
  changeDirection?: 'up' | 'down' | 'neutral';
  status?: 'default' | 'critical' | 'warning' | 'success';
  icon?: React.ReactNode;
  tvSize?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeDirection = 'neutral',
  status = 'default',
  icon,
  tvSize = false,
}) => {
  const getStatusBorder = () => {
    switch (status) {
      case 'critical':
        return 'border-l-4 border-l-industrial-red border-t border-r border-b border-industrial-border';
      case 'warning':
        return 'border-l-4 border-l-industrial-yellow border-t border-r border-b border-industrial-border';
      case 'success':
        return 'border-l-4 border-l-industrial-green border-t border-r border-b border-industrial-border';
      default:
        return 'border border-industrial-border';
    }
  };

  return (
    <div
      className={`relative rounded-xl bg-industrial-card p-5 transition-all duration-200 hover:bg-industrial-card-hover ${getStatusBorder()} shadow-lg backdrop-blur-md`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-industrial-muted font-medium ${tvSize ? 'text-lg' : 'text-xs uppercase tracking-wider'}`}>
          {title}
        </span>
        {icon && <div className={`text-industrial-muted ${tvSize ? 'scale-125' : ''}`}>{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`font-semibold tracking-tight text-white ${tvSize ? 'text-5xl' : 'text-3xl'}`}>
          {value}
        </span>
        
        {change !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              changeDirection === 'up'
                ? 'bg-industrial-green/10 text-industrial-green'
                : changeDirection === 'down'
                ? 'bg-industrial-red/10 text-industrial-red'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {changeDirection === 'up' && <ArrowUpRight size={12} />}
            {changeDirection === 'down' && <ArrowDownRight size={12} />}
            {changeDirection === 'neutral' && <Minus size={12} />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className={`mt-2 text-industrial-muted ${tvSize ? 'text-base' : 'text-xs'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
