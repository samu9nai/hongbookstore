import styled, { css } from 'styled-components';

const buttonVariants = {
  primary: css`
    background: var(--primary);
    color: white;
    border: 1px solid var(--primary);

    &:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    &:active {
      transform: translateY(0);
    }
  `,
  secondary: css`
    background: transparent;
    color: var(--primary);
    border: 1px solid var(--primary-200);

    &:hover {
      background: var(--primary-50);
      border-color: var(--primary-300);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  `,
  outline: css`
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-medium);

    &:hover {
      background: var(--gray-50);
      border-color: var(--border-dark);
      transform: translateY(-1px);
    }
  `,
  ghost: css`
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid transparent;

    &:hover {
      background: var(--gray-100);
      color: var(--text-primary);
    }
  `,
  danger: css`
    background: var(--error);
    color: white;
    border: 1px solid var(--error);

    &:hover {
      background: var(--error-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
  `,
  success: css`
    background: var(--success);
    color: white;
    border: 1px solid var(--success);

    &:hover {
      background: var(--success-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
  `
};

const buttonSizes = {
  sm: css`
    padding: var(--space-2) var(--space-3);
    font-size: 0.875rem;
    border-radius: var(--radius-lg);
  `,
  md: css`
    padding: var(--space-3) var(--space-4);
    font-size: 1rem;
    border-radius: var(--radius-lg);
  `,
  lg: css`
    padding: var(--space-4) var(--space-6);
    font-size: 1.125rem;
    border-radius: var(--radius-xl);
  `,
  xl: css`
    padding: var(--space-5) var(--space-8);
    font-size: 1.25rem;
    border-radius: var(--radius-2xl);
  `
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  border: none;
  outline: none;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  user-select: none;

  /* Variant styles */
  ${props => buttonVariants[props.$variant] || buttonVariants.primary}

  /* Size styles */
  ${props => buttonSizes[props.$size] || buttonSizes.md}

  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  /* Loading state */
  ${props => props.$loading && css`
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  `}

  /* Full width */
  ${props => props.$fullWidth && css`
    width: 100%;
  `}

  /* Icon only */
  ${props => props.$iconOnly && css`
    padding: var(--space-2);
    min-width: 40px;
    min-height: 40px;
  `}

  /* Focus styles */
  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  /* Shimmer effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    transition: var(--transition-normal);
  }

  &:hover::before {
    left: 100%;
  }
`;

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  fullWidth = false, 
  iconOnly = false,
  ...props 
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $loading={loading}
      $fullWidth={fullWidth}
      $iconOnly={iconOnly}
      disabled={loading}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button; 