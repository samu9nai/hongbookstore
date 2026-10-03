import styled, { css } from 'styled-components';

const cardVariants = {
  default: css`
    background: var(--surface);
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-sm);
  `,
  elevated: css`
    background: var(--surface);
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-md);
  `,
  outlined: css`
    background: transparent;
    border: 1px solid var(--border-medium);
    box-shadow: none;
  `,
  ghost: css`
    background: transparent;
    border: none;
    box-shadow: none;
  `,
  glass: css`
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: var(--shadow-lg);
  `
};

const cardSizes = {
  sm: css`
    padding: var(--space-4);
    border-radius: var(--radius-lg);
  `,
  md: css`
    padding: var(--space-6);
    border-radius: var(--radius-xl);
  `,
  lg: css`
    padding: var(--space-8);
    border-radius: var(--radius-2xl);
  `,
  xl: css`
    padding: var(--space-10);
    border-radius: var(--radius-3xl);
  `
};

const StyledCard = styled.div`
  position: relative;
  transition: var(--transition-normal);
  overflow: hidden;

  /* Variant styles */
  ${props => cardVariants[props.$variant] || cardVariants.default}

  /* Size styles */
  ${props => cardSizes[props.$size] || cardSizes.md}

  /* Hover effects */
  ${props => props.$hoverable && css`
    cursor: pointer;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
  `}

  /* Interactive */
  ${props => props.$interactive && css`
    cursor: pointer;
    transition: var(--transition-normal);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    &:active {
      transform: translateY(0);
    }
  `}

  /* Focus styles */
  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  /* Loading state */
  ${props => props.$loading && css`
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      animation: shimmer 1.5s infinite;
    }
  `}
`;

const CardHeader = styled.div`
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-light);

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  p {
    margin: var(--space-2) 0 0 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
`;

const CardContent = styled.div`
  color: var(--text-primary);
  line-height: 1.6;
`;

const CardFooter = styled.div`
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const CardImage = styled.div`
  width: 100%;
  height: 200px;
  background: var(--gray-100);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  ${props => props.$aspectRatio && css`
    aspect-ratio: ${props.$aspectRatio};
    height: auto;
  `}
`;

const CardBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--primary-50);
  color: var(--primary-700);
  border: 1px solid var(--primary-200);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const Card = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  hoverable = false, 
  interactive = false,
  loading = false,
  ...props 
}) => {
  return (
    <StyledCard
      $variant={variant}
      $size={size}
      $hoverable={hoverable}
      $interactive={interactive}
      $loading={loading}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Image = CardImage;
Card.Badge = CardBadge;

export default Card; 