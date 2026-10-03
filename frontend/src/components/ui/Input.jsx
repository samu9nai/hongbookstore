import styled, { css } from 'styled-components';

const inputVariants = {
  default: css`
    background: var(--surface);
    border: 1px solid var(--border-medium);
    color: var(--text-primary);

    &:hover {
      border-color: var(--border-dark);
    }

    &:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-100);
    }
  `,
  outline: css`
    background: transparent;
    border: 2px solid var(--border-medium);
    color: var(--text-primary);

    &:hover {
      border-color: var(--border-dark);
    }

    &:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-100);
    }
  `,
  ghost: css`
    background: transparent;
    border: none;
    border-bottom: 2px solid var(--border-medium);
    border-radius: 0;
    color: var(--text-primary);

    &:hover {
      border-bottom-color: var(--border-dark);
    }

    &:focus {
      border-bottom-color: var(--primary);
      box-shadow: none;
    }
  `,
  filled: css`
    background: var(--gray-50);
    border: 1px solid transparent;
    color: var(--text-primary);

    &:hover {
      background: var(--gray-100);
    }

    &:focus {
      background: var(--surface);
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-100);
    }
  `
};

const inputSizes = {
  sm: css`
    padding: var(--space-2) var(--space-3);
    font-size: 0.875rem;
    border-radius: var(--radius-lg);
    height: 36px;
  `,
  md: css`
    padding: var(--space-3) var(--space-4);
    font-size: 1rem;
    border-radius: var(--radius-lg);
    height: 44px;
  `,
  lg: css`
    padding: var(--space-4) var(--space-5);
    font-size: 1.125rem;
    border-radius: var(--radius-xl);
    height: 52px;
  `,
  xl: css`
    padding: var(--space-5) var(--space-6);
    font-size: 1.25rem;
    border-radius: var(--radius-2xl);
    height: 60px;
  `
};

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
`;

const StyledInput = styled.input`
  width: 100%;
  font-family: inherit;
  transition: var(--transition-normal);
  outline: none;
  resize: none;

  /* Variant styles */
  ${props => inputVariants[props.$variant] || inputVariants.default}

  /* Size styles */
  ${props => inputSizes[props.$size] || inputSizes.md}

  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--gray-100);
  }

  /* Error state */
  ${props => props.$error && css`
    border-color: var(--error);
    
    &:focus {
      border-color: var(--error);
      box-shadow: 0 0 0 3px var(--error-100);
    }
  `}

  /* Success state */
  ${props => props.$success && css`
    border-color: var(--success);
    
    &:focus {
      border-color: var(--success);
      box-shadow: 0 0 0 3px var(--success-100);
    }
  `}

  /* With icon */
  ${props => props.$hasLeftIcon && css`
    padding-left: calc(var(--space-4) + 20px);
  `}

  ${props => props.$hasRightIcon && css`
    padding-right: calc(var(--space-4) + 20px);
  `}

  /* Placeholder styles */
  &::placeholder {
    color: var(--text-disabled);
    transition: var(--transition-normal);
  }

  &:focus::placeholder {
    opacity: 0.7;
  }

  /* Autofill styles */
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px var(--surface) inset;
    -webkit-text-fill-color: var(--text-primary);
  }
`;

const InputIcon = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
  transition: var(--transition-normal);
  pointer-events: none;
  z-index: 1;

  ${props => props.$position === 'left' && css`
    left: var(--space-3);
  `}

  ${props => props.$position === 'right' && css`
    right: var(--space-3);
  `}

  svg {
    width: 20px;
    height: 20px;
  }

  ${StyledInput}:focus + & {
    color: var(--primary);
  }

  ${StyledInput}[data-error="true"] + & {
    color: var(--error);
  }

  ${StyledInput}[data-success="true"] + & {
    color: var(--success);
  }
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  transition: var(--transition-normal);

  ${props => props.$required && css`
    &::after {
      content: ' *';
      color: var(--error);
    }
  `}
`;

const InputError = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--error);
  font-size: 0.875rem;
  margin-top: var(--space-2);
  animation: fadeInUp 0.2s ease-out;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const InputHint = styled.div`
  color: var(--text-tertiary);
  font-size: 0.875rem;
  margin-top: var(--space-2);
  line-height: 1.4;
`;

const InputGroup = styled.div`
  display: flex;
  gap: var(--space-2);

  ${StyledInput} {
    border-radius: 0;
    
    &:first-child {
      border-top-left-radius: var(--radius-lg);
      border-bottom-left-radius: var(--radius-lg);
    }
    
    &:last-child {
      border-top-right-radius: var(--radius-lg);
      border-bottom-right-radius: var(--radius-lg);
    }
  }
`;

const Input = ({ 
  label,
  error,
  success,
  hint,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  required = false,
  fullWidth = true,
  ...props 
}) => {
  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon;

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <InputLabel $required={required}>
          {label}
        </InputLabel>
      )}
      
      <InputWrapper>
        <StyledInput
          $variant={variant}
          $size={size}
          $error={error}
          $success={success}
          $hasLeftIcon={hasLeftIcon}
          $hasRightIcon={hasRightIcon}
          data-error={!!error}
          data-success={!!success}
          {...props}
        />
        
        {leftIcon && (
          <InputIcon $position="left">
            {leftIcon}
          </InputIcon>
        )}
        
        {rightIcon && (
          <InputIcon $position="right">
            {rightIcon}
          </InputIcon>
        )}
      </InputWrapper>
      
      {error && (
        <InputError>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {error}
        </InputError>
      )}
      
      {hint && !error && (
        <InputHint>{hint}</InputHint>
      )}
    </div>
  );
};

Input.Group = InputGroup;

export default Input; 