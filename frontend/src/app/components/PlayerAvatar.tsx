import { getAvatarColor, getInitials } from '../../lib/avatar';

interface PlayerAvatarProps {
  name: string;
  size?: number;
  className?: string;
  showBorder?: boolean;
  borderColor?: string;
}

export function PlayerAvatar({
  name,
  size = 40,
  className = '',
  showBorder = true,
  borderColor,
}: PlayerAvatarProps) {
  const color = getAvatarColor(name);
  const initials = getInitials(name);
  const border = borderColor ?? color + '80';

  return (
    <div
      className={`flex items-center justify-center rounded-xl font-black text-white shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color + '25',
        border: showBorder ? `2px solid ${border}` : undefined,
        fontSize: Math.max(10, size * 0.32),
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  );
}
