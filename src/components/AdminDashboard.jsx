import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminPosts from './AdminPosts';
import AdminNotices from './AdminNotices';
import AdminSuggestions from './AdminSuggestions';
import BrandUpload from './BrandUpload';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { isAdmin, logoutAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [brandUserCounts, setBrandUserCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [activeTab, setActiveTab] = useState(() => {
    // URL에 따라 활성 탭 결정
    if (location.pathname === '/admin/posts') {
      return 'posts';
    } else if (location.pathname === '/admin/notices') {
      return 'notices';
    } else if (location.pathname === '/admin/suggestions') {
      return 'suggestions';
    }
    return 'dashboard';
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }

    // 통계용 게시글 구독
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePosts = onSnapshot(postsQuery, async (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setPosts(postsData);

      // 사용자 데이터 가져오기
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || doc.data().createdAt || new Date()
        }));
        setUsers(usersData);

        // 브랜드별 사용자 수 계산
        calculateBrandUserCounts(usersData);

        // 차트 데이터 계산
        calculateChartData(postsData, usersData);
      } catch (error) {
        console.error('사용자 데이터 가져오기 오류:', error);
      }

      setLoading(false);
    }, (error) => {
      console.error('게시글 구독 오류:', error);
      setLoading(false);
    });

    return () => unsubscribePosts();
  }, [isAdmin, navigate]);

  const calculateBrandUserCounts = (usersData) => {
    const counts = {};
    usersData.forEach(user => {
      const brand = user.brand || '브랜드 미지정';
      counts[brand] = (counts[brand] || 0) + 1;
    });
    setBrandUserCounts(counts);
  };

  const calculateChartData = (postsData, usersData) => {
    // 최근 7일 데이터 생성
    const days = 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const chartDataArray = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // 해당 날짜의 게시글 수
      const postsCount = postsData.filter(post => {
        const postDate = new Date(post.createdAt);
        return postDate >= date && postDate < nextDate;
      }).length;
      
      // 해당 날짜의 가입자 수
      const usersCount = usersData.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= date && userDate < nextDate;
      }).length;
      
      const dateLabel = date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
      
      chartDataArray.push({
        date: dateLabel,
        가입자: usersCount,
        게시글: postsCount
      });
    }
    
    setChartData(chartDataArray);
  };

  useEffect(() => {
    // URL 변경 시 탭 업데이트
    if (location.pathname === '/admin/posts') {
      setActiveTab('posts');
    } else if (location.pathname === '/admin/notices') {
      setActiveTab('notices');
    } else if (location.pathname === '/admin/suggestions') {
      setActiveTab('suggestions');
    } else if (location.pathname === '/admin/brands') {
      setActiveTab('brands');
    } else if (location.pathname === '/admin') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  // 메뉴 외부 클릭 시 닫기 (딤 오버레이 클릭)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logoutAdmin();
    setMenuOpen(false);
    navigate('/admin/login');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
    if (tab === 'posts') {
      navigate('/admin/posts');
    } else if (tab === 'notices') {
      navigate('/admin/notices');
    } else if (tab === 'suggestions') {
      navigate('/admin/suggestions');
    } else if (tab === 'brands') {
      navigate('/admin/brands');
    } else {
      navigate('/admin');
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">비즈블라 관리자</h1>
          <div className="admin-menu-container" ref={menuRef}>
            <button 
              className="admin-hamburger-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="메뉴"
            >
              <span className={`admin-hamburger-icon ${menuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            {menuOpen && (
              <>
                <div className="admin-menu-overlay" onClick={() => setMenuOpen(false)}></div>
                <div className="admin-menu-sidebar">
                  <button 
                    className={`admin-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => handleTabChange('dashboard')}
                  >
                    대시보드
                  </button>
                  <button 
                    className={`admin-menu-item ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => handleTabChange('posts')}
                  >
                    게시글 관리
                  </button>
                  <button 
                    className={`admin-menu-item ${activeTab === 'notices' ? 'active' : ''}`}
                    onClick={() => handleTabChange('notices')}
                  >
                    공지사항 관리
                  </button>
                  <button 
                    className={`admin-menu-item ${activeTab === 'suggestions' ? 'active' : ''}`}
                    onClick={() => handleTabChange('suggestions')}
                  >
                    건의 관리
                  </button>
                  <button 
                    className={`admin-menu-item ${activeTab === 'brands' ? 'active' : ''}`}
                    onClick={() => handleTabChange('brands')}
                  >
                    브랜드 업로드
                  </button>
                  <div className="admin-menu-divider"></div>
                  <button className="admin-menu-item admin-logout-item" onClick={handleLogout}>
                    로그아웃
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="admin-main">
        {activeTab === 'dashboard' ? (
          <div className="admin-dashboard-content">
            <div className="admin-stats">
              <div className="stat-card">
                <div className="stat-value">{loading ? '...' : posts.length}</div>
                <div className="stat-label">전체 게시글</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{loading ? '...' : users.length}</div>
                <div className="stat-label">전체 가입자</div>
              </div>
            </div>
            <div className="admin-brand-stats-section">
              <h2 className="chart-title">브랜드별 사용자 수</h2>
              {loading ? (
                <div className="loading">로딩 중...</div>
              ) : (
                <div className="brand-stats-grid">
                  {Object.keys(brandUserCounts).length === 0 ? (
                    <div className="no-brand-data">브랜드 데이터가 없습니다.</div>
                  ) : (
                    Object.entries(brandUserCounts)
                      .sort((a, b) => b[1] - a[1]) // 사용자 수가 많은 순으로 정렬
                      .map(([brand, count]) => (
                        <div key={brand} className="brand-stat-card">
                          <div className="brand-stat-name">{brand}</div>
                          <div className="brand-stat-count">{count}명</div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
            <div className="admin-chart-section">
              <h2 className="chart-title">일일 통계 (최근 7일)</h2>
              {loading ? (
                <div className="loading">로딩 중...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="가입자" stroke="#ED4E39" strokeWidth={2} />
                    <Line type="monotone" dataKey="게시글" stroke="#4285F4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        ) : activeTab === 'posts' ? (
          <AdminPosts />
        ) : activeTab === 'notices' ? (
          <AdminNotices />
        ) : activeTab === 'suggestions' ? (
          <AdminSuggestions />
        ) : (
          <BrandUpload />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
