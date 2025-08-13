export default function LogoDeutschMe({ size = 64 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="flagGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="33%" stopColor="#dd0000" />
          <stop offset="66%" stopColor="#ffce00" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#flagGradient)" stroke="#222" strokeWidth="4"/>
      <text
        x="50%"
        y="55%"
        fontSize="36"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fill="#fff"
        textAnchor="middle"
      >
        Deutsch
      </text>
      <text
        x="50%"
        y="75%"
        fontSize="28"
        fontFamily="Arial, sans-serif"
        fill="#fff"
        textAnchor="middle"
      >
        Me
      </text>
    </svg>
  );
}
