import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FaGithub, FaTwitter, FaInstagram, FaLinkedin, FaHeart } from 'react-icons/fa';

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const FooterContainer = styled.footer`
  width: 100%;
  background: var(--gray-100);
  color: var(--gray-600);
  font-size: 0.85rem;
  padding: 0.5rem 0;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-fixed);
  box-shadow: 0 -1px 8px 0 rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const FloatingElement = styled.div`
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  animation: ${float} 6s ease-in-out infinite;

  &:nth-child(1) {
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }

  &:nth-child(2) {
    top: 30%;
    right: 15%;
    animation-delay: 2s;
    width: 40px;
    height: 40px;
  }

  &:nth-child(3) {
    bottom: 20%;
    left: 20%;
    animation-delay: 4s;
    width: 30px;
    height: 30px;
  }
`;

const FooterContent = styled.div`
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-16);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-24);
  margin-bottom: var(--space-16);
  position: relative;
  z-index: 1;

  @media (max-width: 1440px) {
    padding: 0 var(--space-12);
  }

  @media (max-width: 1024px) {
    padding: 0 var(--space-8);
    gap: var(--space-16);
  }

  @media (max-width: 768px) {
    padding: 0 var(--space-6);
    grid-template-columns: 1fr;
    gap: var(--space-12);
  }
`;

const FooterSection = styled.div`
  animation: ${fadeInUp} 0.6s ease-out ${props => props.$delay || '0s'} backwards;

  h3 {
    font-size: clamp(1.5rem, 2.5vw, 1.75rem);
    font-weight: 700;
    margin-bottom: var(--space-10);
    background: linear-gradient(135deg, white, rgba(255, 255, 255, 0.8));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
    letter-spacing: -0.025em;

    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 50px;
      height: 3px;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      border-radius: var(--radius-full);
    }
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    margin-bottom: var(--space-5);
  }
`;


const SocialLinks = styled.div`
  display: flex;
  gap: var(--space-6);
  margin-top: var(--space-6);

  @media (max-width: 768px) {
    gap: var(--space-4);
  }
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-full);
  text-decoration: none;
  transition: var(--transition-normal);
  box-shadow: var(--shadow-sm);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    background: var(--primary-dark);
  }
`;

const ContactInfo = styled.div`
  margin-top: var(--space-6);

  p {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: var(--space-3);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: 1rem;
    line-height: 1.6;
  }

  strong {
    color: white;
    font-weight: 600;
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: var(--space-8);
  text-align: center;
  position: relative;
  z-index: 1;
`;

const Copyright = styled.p`
  color: var(--gray-400);
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
`;


const NewsletterSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  backdrop-filter: blur(10px);
  margin-top: var(--space-6);

  h4 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: var(--space-4);
    color: white;
  }

  p {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: var(--space-4);
    line-height: 1.6;
  }
`;

const NewsletterForm = styled.form`
  display: flex;
  gap: var(--space-3);

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const NewsletterInput = styled.input`
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  transition: var(--transition-normal);

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: var(--primary);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const NewsletterButton = styled.button`
  padding: var(--space-3) var(--space-6);
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  white-space: nowrap;

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
`;

const Footer = () => {
  const { t } = useTranslation();

  return (
    <FooterContainer>
      <Copyright>© {t('title')}. {t('allRightsReserved')}</Copyright>
    </FooterContainer>
  );
};

export default Footer;