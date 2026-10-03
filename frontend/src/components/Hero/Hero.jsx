import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;


const HeroSection = styled.section`
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: transparent;
  margin-top: 80px;
`;

const OnboardingSection = styled.div`
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: var(--space-16) 0;
  position: relative;
  min-height: calc(70vh - 80px);
  background: #ffffff;
`;


const OnboardingContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 2rem;
  align-items: center;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 16px;
  overflow: hidden;
  background: #f3f4f6;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
`;

const slideIn = keyframes`
  from { opacity: 0; transform: scale(1.02); }
  to { opacity: 1; transform: scale(1); }
`;

const Slide = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${slideIn} 600ms ease-out;
`;

const SlideImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: bottom center;
`;

const Bullets = styled.div`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
`;

const Bullet = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: none;
  background: ${props => (props.$active ? '#2563eb' : 'rgba(255,255,255,0.7)')};
  box-shadow: 0 0 0 1px rgba(0,0,0,0.05) inset;
  cursor: pointer;
  transition: background 200ms ease;
`;

const SidePanel = styled.aside`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  padding: 1rem;
  border-radius: 16px;
  background: #f8fafc;
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);

  @media (max-width: 960px) {
    background: transparent;
    box-shadow: none;
    padding: 0;
  }
`;

const Title = styled.h1`
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 700;
  margin-bottom: 1rem;
  animation: ${fadeIn} 1s ease-out 0.3s backwards;
  color: #1a202c;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-align: left;
  padding-left: 1rem;

  @media (max-width: 768px) {
    font-size: clamp(2rem, 4vw, 2.5rem);
    margin-bottom: 0.8rem;
  }
`;

const Description = styled.p`
  font-size: clamp(1.1rem, 2.2vw, 1.3rem);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 0 2rem 0;
  opacity: 0.9;
  animation: ${fadeIn} 1s ease-out 0.5s backwards;
  color: #2d3748;
  font-weight: 500;
  text-align: left;
  padding-left: 1rem;

  @media (max-width: 768px) {
    font-size: clamp(1rem, 2.5vw, 1.2rem);
    margin-bottom: 1.5rem;
  }
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 1.2rem 2.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  animation: ${fadeIn} 1s ease-out 0.7s backwards;
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.3);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.3px;
  width: 100%;
  max-width: 100%;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s;
  }

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(59, 130, 246, 0.4);
    letter-spacing: 0.5px;

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 1rem 2rem;
    font-size: 1rem;
    max-width: 280px;
  }
`;


const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const menuItems = [
    {
      title: t('hero.bookstore'),
      path: '/marketplace'
    },
    {
      title: t('hero.myBookstore'),
      path: '/mybookstore'
    },
    {
      title: t('hero.map'),
      path: '/hongikmap'
    }
  ];

  const slides = useMemo(() => (
    [
      { src: '/images/onboarding-marketplace.png', alt: t('hero.bookstore') },
      { src: '/images/onboarding-mybookstore.png', alt: t('hero.myBookstore') },
      { src: '/images/onboarding-map.png', alt: t('hero.map') }
    ]
  ), [t]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <HeroSection>
      <OnboardingSection>
        <OnboardingContainer>
          <div>
            <Title>{t('title')}</Title>
            <Description>{t('heroDescription')}</Description>
            <CarouselContainer>
              {slides.map((slide, idx) => (
                idx === current ? (
                  <Slide key={slide.src}>
                    <SlideImage src={slide.src} alt={slide.alt} />
                  </Slide>
                ) : null
              ))}
              <Bullets>
                {slides.map((_, idx) => (
                  <Bullet key={idx} $active={idx === current} onClick={() => setCurrent(idx)} aria-label={`slide-${idx + 1}`} />
                ))}
              </Bullets>
            </CarouselContainer>
          </div>

          <SidePanel>
            {menuItems.map((item, index) => (
              <MenuButton
                key={index}
                onClick={() => handleMenuClick(item.path)}
                style={{ animationDelay: `${0.7 + index * 0.1}s` }}
              >
                {item.title}
                <span>→</span>
              </MenuButton>
            ))}
          </SidePanel>
        </OnboardingContainer>
      </OnboardingSection>
    </HeroSection>
  );
};

export default Hero; 
