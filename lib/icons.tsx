import Svg, { Circle, Path, Line } from "react-native-svg";

/**
 * Iconos propios en SVG. No se usan emoji en ningún lado de la interfaz:
 * el glifo lo dibuja la fuente del sistema, así que un emoji cambia de
 * forma entre iOS, Android y web y nunca coincide con la línea del resto
 * del set. Estos son trazos consistentes (mismo grosor, mismo remate) y
 * heredan el color de donde se usen.
 */

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
});

export function DropletIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M12 3.2c3.1 3.5 5.4 6.3 5.4 9.1A5.4 5.4 0 0 1 12 17.7a5.4 5.4 0 0 1-5.4-5.4c0-2.8 2.3-5.6 5.4-9.1Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SproutIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 20v-7.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path
        d="M12 13.5C12 10.4 9.8 8 6.6 8c0 3.1 2.2 5.5 5.4 5.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M12 12c0-3.4 2.4-6 5.9-6 0 3.4-2.5 6-5.9 6Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SunIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  const rays = [
    [12, 2.6, 12, 4.8],
    [12, 19.2, 12, 21.4],
    [2.6, 12, 4.8, 12],
    [19.2, 12, 21.4, 12],
    [5.5, 5.5, 7, 7],
    [17, 17, 18.5, 18.5],
    [18.5, 5.5, 17, 7],
    [7, 17, 5.5, 18.5],
  ];
  return (
    <Svg {...base(size)}>
      <Circle cx="12" cy="12" r="4.2" stroke={color} strokeWidth={strokeWidth} />
      {rays.map(([x1, y1, x2, y2], i) => (
        <Line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

export function MoonIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M20 14.4A8.2 8.2 0 0 1 9.6 4a8.4 8.4 0 1 0 10.4 10.4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HeartIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M12 20s-7.3-4.4-7.3-9.3A4 4 0 0 1 12 8.2a4 4 0 0 1 7.3 2.5C19.3 15.6 12 20 12 20Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BookIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M4 4.8h5.2c1.5 0 2.8 1.1 2.8 2.5V20c0-1.2-1.1-2.1-2.4-2.1H4V4.8Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M20 4.8h-5.2c-1.5 0-2.8 1.1-2.8 2.5V20c0-1.2 1.1-2.1 2.4-2.1H20V4.8Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PulseIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M3 12.5h3.6l2-5.2 3.2 9.6 2.2-5.6 1.6 1.2H21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LinkPeopleIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx="8.4" cy="8.6" r="3.1" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="16" cy="11" r="2.6" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M3.2 19.4c0-2.6 2.3-4.5 5.2-4.5s5.2 1.9 5.2 4.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M15.4 16.1c2.6 0 5.4 1.1 5.4 3.3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CalendarPlusIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M4.4 6.8h15.2v13H4.4z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Line x1="4.4" y1="10.6" x2="19.6" y2="10.6" stroke={color} strokeWidth={strokeWidth} />
      <Line x1="8.6" y1="4.2" x2="8.6" y2="7.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="15.4" y1="4.2" x2="15.4" y2="7.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="12" y1="13.2" x2="12" y2="17.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="9.9" y1="15.3" x2="14.1" y2="15.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M4.4 6.8h15.2v13H4.4z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Line x1="4.4" y1="10.6" x2="19.6" y2="10.6" stroke={color} strokeWidth={strokeWidth} />
      <Line x1="8.6" y1="4.2" x2="8.6" y2="7.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="15.4" y1="4.2" x2="15.4" y2="7.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx="8.6" cy="14" r="1.1" fill={color} stroke="none" />
      <Circle cx="12" cy="14" r="1.1" fill={color} stroke="none" />
      <Circle cx="15.4" cy="14" r="1.1" fill={color} stroke="none" />
      <Circle cx="8.6" cy="17.2" r="1.1" fill={color} stroke="none" />
      <Circle cx="12" cy="17.2" r="1.1" fill={color} stroke="none" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 24, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M9.5 5.5 16 12l-6.5 6.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 24, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M14.5 5.5 8 12l6.5 6.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShieldIcon({ size = 24, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M12 3.4 19 6v5.6c0 4-2.9 7.3-7 8.9-4.1-1.6-7-4.9-7-8.9V6l7-2.6Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
