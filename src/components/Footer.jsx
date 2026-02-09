import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-info">
          <div className="footer-left">
            <div className="footer-phone">
              <span className="footer-label">고객센터</span>
              <a href="tel:1877-4463" className="footer-phone-link">1877-4463</a>
            </div>
            <div className="footer-copyright">
              <p>© 2025 비즈블라(BIZBLAH). All rights reserved.</p>
            </div>
            <div className="footer-links">
              <a href="/privacy" className="footer-link">개인정보처리방침</a>
              <span className="footer-divider">|</span>
              <a href="/terms" className="footer-link">이용약관</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
