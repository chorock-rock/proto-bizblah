import { useEffect } from 'react';

/**
 * SEO 메타 태그를 동적으로 업데이트하는 훅
 * @param {Object} options - SEO 옵션
 * @param {string} options.title - 페이지 제목
 * @param {string} options.description - 페이지 설명
 * @param {string} options.image - OG 이미지 URL
 * @param {string} options.url - 페이지 URL
 * @param {string} options.type - OG 타입 (기본값: 'website')
 */
export const useSEO = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website' 
}) => {
  useEffect(() => {
    const baseUrl = window.location.origin;
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
    const defaultImage = `${baseUrl}/og-image.png`;
    const defaultDescription = 'BIZBLAH - 프랜차이즈 점주를 위한 익명 커뮤니티. 안전하고 자유로운 소통 공간에서 정보를 공유하고 네트워킹하세요.';
    const defaultTitle = 'BIZBLAH - 프랜차이즈 점주 익명 커뮤니티';
    
    const finalTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
    const finalDescription = description || defaultDescription;
    const finalImage = image || defaultImage;
    const finalUrl = fullUrl;

    // Title 업데이트
    document.title = finalTitle;

    // Meta description 업데이트
    updateMetaTag('name', 'description', finalDescription);
    
    // Open Graph 태그 업데이트
    updateMetaTag('property', 'og:title', finalTitle);
    updateMetaTag('property', 'og:description', finalDescription);
    updateMetaTag('property', 'og:image', finalImage);
    updateMetaTag('property', 'og:url', finalUrl);
    updateMetaTag('property', 'og:type', type);
    
    // Twitter Card 태그 업데이트
    updateMetaTag('name', 'twitter:title', finalTitle);
    updateMetaTag('name', 'twitter:description', finalDescription);
    updateMetaTag('name', 'twitter:image', finalImage);
    updateMetaTag('name', 'twitter:url', finalUrl);
    
    // Canonical URL 업데이트
    updateCanonical(finalUrl);
  }, [title, description, image, url, type]);
};

/**
 * 메타 태그를 업데이트하거나 생성하는 헬퍼 함수
 */
const updateMetaTag = (attribute, value, content) => {
  let meta = document.querySelector(`meta[${attribute}="${value}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, value);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

/**
 * Canonical URL을 업데이트하는 헬퍼 함수
 */
const updateCanonical = (url) => {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
};
