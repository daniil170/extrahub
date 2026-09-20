import coinIconImg from '../../assets/icons/coin-icon.png';

/**
 * Custom scalable Coin Icon component for ExtraHub currency
 * @param {Object} props
 * @param {number} [props.size=18] - Dimension in pixels (width and height)
 * @param {string} [props.className] - CSS classes
 * @param {import('react').CSSProperties} [props.style] - Inline styles
 * @param {boolean} [props.inline=true] - Whether to render inline with text alignment
 */
export function CoinIcon({ size = 18, className = '', style = {}, inline = true }) {
  return (
    <img
      src={coinIconImg}
      alt="Extra-монеты"
      width={size}
      height={size}
      className={`extrahub-coin-icon ${className}`.trim()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        objectFit: 'contain',
        verticalAlign: inline ? 'middle' : 'baseline',
        display: inline ? 'inline-block' : 'block',
        flexShrink: 0,
        ...style,
      }}
      loading="eager"
      decoding="async"
    />
  );
}
