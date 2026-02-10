import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, getDoc, addDoc, doc, serverTimestamp, setDoc, updateDoc, increment, onSnapshot, where } from 'firebase/firestore';
import './AdminPostManagement.css';

const AdminPostManagement = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [selectedCommentId, setSelectedCommentId] = useState('');
  const [comments, setComments] = useState([]);
  
  // 닉네임 생성
  const [nickname, setNickname] = useState('');
  const [nicknameBrand, setNicknameBrand] = useState('CU');
  const [nicknameBrandLabel, setNicknameBrandLabel] = useState('CU');
  const [customBrand, setCustomBrand] = useState('');
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [generatingNickname, setGeneratingNickname] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const brandDropdownRef = useRef(null);

  // 닉네임 생성용 영어 단어 목록
  const words = [
    'zap', 'blip', 'flip', 'snap', 'pop', 'bop', 'hop', 'zip',
    'wiz', 'buzz', 'fizz', 'jazz', 'jolt', 'bolt', 'volt', 'zest',
    'blink', 'twink', 'spark', 'flash', 'dash', 'crash', 'smash', 'splash',
    'zoom', 'boom', 'doom', 'gloom', 'bloom', 'room', 'loom', 'broom',
    'chip', 'clip', 'flip', 'grip', 'skip', 'slip', 'trip', 'whip',
    'blob', 'glob', 'slob', 'snob', 'knob', 'mob', 'rob', 'sob',
    'flap', 'clap', 'slap', 'snap', 'trap', 'wrap', 'scrap', 'strap',
    'blink', 'clink', 'drink', 'link', 'pink', 'sink', 'think', 'wink',
    'blot', 'clot', 'plot', 'slot', 'spot', 'tot', 'dot', 'hot',
    'blur', 'slur', 'spur', 'stir', 'fir', 'sir', 'fur', 'purr',
    'blip', 'clip', 'dip', 'flip', 'grip', 'hip', 'lip', 'rip',
    'blob', 'cob', 'gob', 'job', 'lob', 'mob', 'rob', 'sob',
    'blot', 'clot', 'dot', 'got', 'hot', 'jot', 'lot', 'not',
    'blur', 'cur', 'fur', 'her', 'purr', 'sir', 'stir', 'whir',
    'blip', 'dip', 'flip', 'grip', 'hip', 'kip', 'lip', 'nip',
    'blob', 'cob', 'gob', 'job', 'lob', 'mob', 'rob', 'sob'
  ];

  // 고유한 닉네임 생성 함수
  const generateUniqueNickname = async () => {
    setGeneratingNickname(true);
    setMessage('');

    try {
      let attempts = 0;
      const maxAttempts = 50;

      while (attempts < maxAttempts) {
        // 영어 단어 + 숫자 조합
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const randomNumber = Math.floor(Math.random() * 9999) + 1;
        const generatedNickname = `${randomWord}${randomNumber}`;

        // 중복 확인
        const nicknameCheck = await getDoc(doc(db, 'nicknames', generatedNickname));
        
        if (!nicknameCheck.exists()) {
          setNickname(generatedNickname);
          setGeneratingNickname(false);
          return;
        }

        attempts++;
      }

      // 최대 시도 횟수 초과 시 타임스탬프 추가
      const randomWord = words[Math.floor(Math.random() * words.length)];
      const timestamp = Date.now().toString().slice(-6);
      const generatedNickname = `${randomWord}${timestamp}`;
      
      setNickname(generatedNickname);
      setGeneratingNickname(false);
    } catch (err) {
      console.error('닉네임 생성 오류:', err);
      setMessage('닉네임 생성에 실패했습니다. 다시 시도해주세요.');
      setGeneratingNickname(false);
    }
  };
  
  // 게시글 생성
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postAuthorId, setPostAuthorId] = useState('');
  
  // 댓글 생성
  const [commentText, setCommentText] = useState('');
  const [commentAuthorId, setCommentAuthorId] = useState('');
  
  // 대댓글 생성
  const [replyText, setReplyText] = useState('');
  const [replyAuthorId, setReplyAuthorId] = useState('');
  
  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [postsLoading, setPostsLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // 게시글 목록 로드
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setPostsLoading(true);
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(postsQuery);
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setPosts(postsData);
      } catch (error) {
        console.error('게시글 로드 오류:', error);
        setMessage('게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setPostsLoading(false);
      }
    };

    loadPosts();
  }, []);

  // 사용자 목록 로드
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (error) {
        console.error('사용자 로드 오류:', error);
      }
    };

    loadUsers();
  }, []);

  // 브랜드 목록 로드
  useEffect(() => {
    const loadBrands = async () => {
      try {
        setBrandsLoading(true);
        const brandsQuery = query(
          collection(db, 'brands'),
          where('isActive', '==', true),
          orderBy('name', 'asc')
        );
        const snapshot = await getDocs(brandsQuery);
        const brandsData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          ...doc.data()
        }));
        setBrands(brandsData);
        
        // CU 브랜드가 있으면 기본값으로 설정
        const cuBrand = brandsData.find(b => b.name === 'CU');
        if (cuBrand) {
          setNicknameBrand('CU');
          setNicknameBrandLabel('CU');
        }
        setFilteredBrands(brandsData);
      } catch (error) {
        console.error('브랜드 로드 오류:', error);
        // 인덱스 오류일 수 있으므로 name 없이 다시 시도
        try {
          const brandsQuery = query(
            collection(db, 'brands'),
            where('isActive', '==', true)
          );
          const snapshot = await getDocs(brandsQuery);
          const brandsData = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            ...doc.data()
          })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setBrands(brandsData);
          
          // CU 브랜드가 있으면 기본값으로 설정
          const cuBrand = brandsData.find(b => b.name === 'CU');
          if (cuBrand) {
            setNicknameBrand('CU');
            setNicknameBrandLabel('CU');
          }
          setFilteredBrands(brandsData);
        } catch (retryError) {
          console.error('브랜드 로드 재시도 오류:', retryError);
        }
      } finally {
        setBrandsLoading(false);
      }
    };

    loadBrands();
  }, []);

  // 브랜드 검색 필터링
  useEffect(() => {
    if (!brandSearchQuery.trim()) {
      setFilteredBrands(brands);
    } else {
      const searchLower = brandSearchQuery.toLowerCase();
      const filtered = brands.filter(brand => 
        brand.name.toLowerCase().includes(searchLower)
      );
      setFilteredBrands(filtered);
    }
  }, [brandSearchQuery, brands]);

  // 브랜드 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
        setIsBrandDropdownOpen(false);
        setBrandSearchQuery('');
      }
    };

    if (isBrandDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBrandDropdownOpen]);

  // 게시글 선택 시 댓글 목록 실시간 구독
  useEffect(() => {
    if (!selectedPostId) {
      setComments([]);
      setSelectedCommentId('');
      return;
    }

    setCommentsLoading(true);
    const commentsQuery = query(
      collection(db, 'posts', selectedPostId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setComments(commentsData);
      setCommentsLoading(false);
    }, (error) => {
      console.error('댓글 구독 오류:', error);
      setMessage('댓글을 불러오는 중 오류가 발생했습니다.');
      setCommentsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedPostId]);

  // 게시글 생성
  const handleCreatePost = async () => {
    if (!postTitle.trim()) {
      setMessage('제목을 입력해주세요.');
      return;
    }

    if (!postContent.trim()) {
      setMessage('내용을 입력해주세요.');
      return;
    }

    if (!postAuthorId) {
      setMessage('작성자를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const selectedUser = users.find(u => u.id === postAuthorId);
      if (!selectedUser) {
        setMessage('선택한 사용자를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 게시글 추가
      await addDoc(collection(db, 'posts'), {
        title: postTitle.trim(),
        content: postContent.trim(),
        authorId: postAuthorId,
        authorName: selectedUser.nickname || '익명',
        authorBrand: selectedUser.brand || '점주',
        views: 0,
        likes: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setMessage('게시글 생성 완료');
      setPostTitle('');
      setPostContent('');
      setPostAuthorId('');
      
      // 게시글 목록 새로고침
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(postsQuery);
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setPosts(postsData);
    } catch (error) {
      console.error('게시글 생성 오류:', error);
      setMessage('게시글 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 닉네임 생성
  const handleCreateNickname = async () => {
    if (!nickname.trim()) {
      setMessage('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      setMessage('닉네임은 2자 이상 20자 이하여야 합니다.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      // 중복 확인
      const nicknameDoc = await getDoc(doc(db, 'nicknames', nickname.trim()));
      if (nicknameDoc.exists()) {
        setMessage('이미 사용 중인 닉네임입니다.');
        setLoading(false);
        return;
      }

      const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 브랜드 값 처리
      const brandValue = isCustomBrand 
        ? (customBrand.trim() || 'CU')
        : (nicknameBrand.trim() || 'CU');

      // users 컬렉션에 사용자 추가
      await setDoc(doc(db, 'users', userId), {
        nickname: nickname.trim(),
        brand: brandValue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // nicknames 컬렉션에 인덱스 추가
      await setDoc(doc(db, 'nicknames', nickname.trim()), {
        userId: userId,
        createdAt: serverTimestamp()
      });

      setMessage(`닉네임 "${nickname.trim()}" 생성 완료`);
      setNickname('');
      
      // 사용자 목록 새로고침
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('닉네임 생성 오류:', error);
      setMessage('닉네임 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 댓글 생성
  const handleCreateComment = async () => {
    if (!selectedPostId) {
      setMessage('게시글을 선택해주세요.');
      return;
    }

    if (!commentText.trim()) {
      setMessage('댓글 내용을 입력해주세요.');
      return;
    }

    if (!commentAuthorId) {
      setMessage('작성자를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const selectedUser = users.find(u => u.id === commentAuthorId);
      if (!selectedUser) {
        setMessage('선택한 사용자를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 댓글 추가
      await addDoc(
        collection(db, 'posts', selectedPostId, 'comments'),
        {
          authorId: commentAuthorId,
          authorName: selectedUser.nickname || '익명',
          content: commentText.trim(),
          likes: 0,
          createdAt: serverTimestamp()
        }
      );

      // 게시글의 댓글 수 증가
      await updateDoc(
        doc(db, 'posts', selectedPostId),
        {
          commentsCount: increment(1)
        }
      );

      setMessage('댓글 생성 완료');
      setCommentText('');
      setCommentAuthorId('');
      // 댓글 목록은 onSnapshot으로 자동 업데이트됨
    } catch (error) {
      console.error('댓글 생성 오류:', error);
      setMessage('댓글 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 대댓글 생성
  const handleCreateReply = async () => {
    if (!selectedPostId || !selectedCommentId) {
      setMessage('게시글과 댓글을 선택해주세요.');
      return;
    }

    if (!replyText.trim()) {
      setMessage('대댓글 내용을 입력해주세요.');
      return;
    }

    if (!replyAuthorId) {
      setMessage('작성자를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const selectedUser = users.find(u => u.id === replyAuthorId);
      if (!selectedUser) {
        setMessage('선택한 사용자를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 대댓글 추가
      await addDoc(
        collection(db, 'posts', selectedPostId, 'comments', selectedCommentId, 'replies'),
        {
          authorId: replyAuthorId,
          authorName: selectedUser.nickname || '익명',
          content: replyText.trim(),
          createdAt: serverTimestamp()
        }
      );

      setMessage('대댓글 생성 완료');
      setReplyText('');
      setReplyAuthorId('');
      setSelectedCommentId('');
      // 댓글 목록은 onSnapshot으로 자동 업데이트됨
    } catch (error) {
      console.error('대댓글 생성 오류:', error);
      setMessage('대댓글 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-post-management-container">
      <h2 className="admin-post-management-title">게시글 종합 관리</h2>

      <div className="admin-post-management-content">
        {/* 게시글 생성 */}
        <div className="admin-post-management-section">
          <h3 className="section-title">게시글 생성</h3>
          <p className="section-description">
            새로운 게시글을 생성합니다.
          </p>
          <div className="form-group">
            <label htmlFor="postAuthor">작성자 선택</label>
            <select
              id="postAuthor"
              value={postAuthorId}
              onChange={(e) => setPostAuthorId(e.target.value)}
              disabled={loading || users.length === 0}
              className="select-input"
            >
              <option value="">작성자를 선택하세요</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nickname || '익명'} ({user.brand || '점주'})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="postTitle">제목</label>
            <input
              id="postTitle"
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="게시글 제목을 입력하세요"
              maxLength={100}
              disabled={loading}
              className="text-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="postContent">내용</label>
            <textarea
              id="postContent"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="게시글 내용을 입력하세요"
              rows={8}
              disabled={loading}
              className="textarea-input"
            />
          </div>
          <button
            onClick={handleCreatePost}
            disabled={loading || !postTitle.trim() || !postContent.trim() || !postAuthorId}
            className="generate-button"
          >
            {loading ? '생성 중...' : '게시글 생성'}
          </button>
        </div>

        {/* 닉네임 생성 */}
        <div className="admin-post-management-section">
          <h3 className="section-title">닉네임 생성</h3>
          <p className="section-description">
            새로운 사용자 닉네임을 생성합니다. users 컬렉션과 nicknames 컬렉션에 추가됩니다.
          </p>
          <div className="form-group">
            <label htmlFor="nickname">닉네임 (2-20자)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                maxLength={20}
                disabled={loading || generatingNickname}
                className="text-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={generateUniqueNickname}
                disabled={loading || generatingNickname}
                className="dice-button"
                title="랜덤 닉네임 생성"
              >
                🎲
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="nicknameBrand">브랜드</label>
            {brandsLoading ? (
              <div className="loading">브랜드 로딩 중...</div>
            ) : (
              <div className="brand-select-wrapper" ref={brandDropdownRef}>
                <div className="brand-search-input-wrapper">
                  <input
                    type="text"
                    value={isBrandDropdownOpen ? brandSearchQuery : nicknameBrandLabel}
                    onChange={(e) => {
                      setBrandSearchQuery(e.target.value);
                      setIsBrandDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsBrandDropdownOpen(true);
                      setBrandSearchQuery('');
                    }}
                    placeholder="브랜드를 검색하거나 선택해주세요"
                    disabled={loading || isCustomBrand}
                    className="text-input"
                  />
                  <svg 
                    className="brand-dropdown-icon" 
                    viewBox="0 0 12 12" 
                    onClick={() => !isCustomBrand && setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                  >
                    <path fill="#333" d="M6 9L1 4h10z"/>
                  </svg>
                </div>
                
                {isBrandDropdownOpen && !isCustomBrand && (
                  <div className="brand-dropdown">
                    {filteredBrands.length > 0 ? (
                      <>
                        {filteredBrands.map((brand) => (
                          <div
                            key={brand.id}
                            className={`brand-option ${nicknameBrand === brand.name ? 'selected' : ''}`}
                            onClick={() => {
                              setNicknameBrand(brand.name);
                              setNicknameBrandLabel(brand.name);
                              setBrandSearchQuery('');
                              setIsBrandDropdownOpen(false);
                            }}
                          >
                            {brand.name}
                          </div>
                        ))}
                        <div
                          className="brand-option custom-brand-option"
                          onClick={() => {
                            setIsCustomBrand(true);
                            setCustomBrand('');
                            setIsBrandDropdownOpen(false);
                            setBrandSearchQuery('');
                          }}
                        >
                          직접 입력
                        </div>
                      </>
                    ) : (
                      <div className="brand-option no-results">
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                )}
                
                {isCustomBrand && (
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="브랜드명을 직접 입력하세요"
                    disabled={loading}
                    className="text-input"
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleCreateNickname}
            disabled={loading || !nickname.trim()}
            className="generate-button"
          >
            {loading ? '생성 중...' : '닉네임 생성'}
          </button>
        </div>

        {/* 댓글 생성 */}
        <div className="admin-post-management-section">
          <h3 className="section-title">댓글 생성</h3>
          <p className="section-description">
            선택한 게시글에 댓글을 생성합니다.
          </p>
          <div className="form-group">
            <label htmlFor="postSelect">게시글 선택</label>
            {postsLoading ? (
              <div className="loading">게시글 로딩 중...</div>
            ) : (
              <select
                id="postSelect"
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                disabled={loading}
                className="select-input"
              >
                <option value="">게시글을 선택하세요</option>
                {posts.map(post => (
                  <option key={post.id} value={post.id}>
                    {post.title} ({post.authorName || '익명'})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="commentAuthor">작성자 선택</label>
            <select
              id="commentAuthor"
              value={commentAuthorId}
              onChange={(e) => setCommentAuthorId(e.target.value)}
              disabled={loading || users.length === 0}
              className="select-input"
            >
              <option value="">작성자를 선택하세요</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nickname || '익명'} ({user.brand || '점주'})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="commentText">댓글 내용</label>
            <textarea
              id="commentText"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글 내용을 입력하세요"
              rows={4}
              disabled={loading}
              className="textarea-input"
            />
          </div>
          <button
            onClick={handleCreateComment}
            disabled={loading || !selectedPostId || !commentText.trim() || !commentAuthorId}
            className="generate-button"
          >
            {loading ? '생성 중...' : '댓글 생성'}
          </button>
        </div>

        {/* 대댓글 생성 */}
        <div className="admin-post-management-section">
          <h3 className="section-title">대댓글 생성</h3>
          <p className="section-description">
            선택한 게시글의 댓글에 대댓글을 생성합니다.
          </p>
          <div className="form-group">
            <label htmlFor="replyPostSelect">게시글 선택</label>
            {postsLoading ? (
              <div className="loading">게시글 로딩 중...</div>
            ) : (
              <select
                id="replyPostSelect"
                value={selectedPostId}
                onChange={(e) => {
                  setSelectedPostId(e.target.value);
                  setSelectedCommentId(''); // 게시글 변경 시 댓글 선택 초기화
                }}
                disabled={loading}
                className="select-input"
              >
                <option value="">게시글을 선택하세요</option>
                {posts.map(post => (
                  <option key={post.id} value={post.id}>
                    {post.title} ({post.authorName || '익명'})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="commentSelect">댓글 선택</label>
            {!selectedPostId ? (
              <div className="info-message">먼저 게시글을 선택해주세요.</div>
            ) : commentsLoading ? (
              <div className="loading">댓글 로딩 중...</div>
            ) : comments.length === 0 ? (
              <div className="info-message">댓글이 없습니다.</div>
            ) : (
              <select
                id="commentSelect"
                value={selectedCommentId}
                onChange={(e) => setSelectedCommentId(e.target.value)}
                disabled={loading}
                className="select-input"
              >
                <option value="">댓글을 선택하세요</option>
                {comments.map(comment => (
                  <option key={comment.id} value={comment.id}>
                    {comment.authorName || '익명'}: {comment.content?.substring(0, 30)}...
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="replyAuthor">작성자 선택</label>
            <select
              id="replyAuthor"
              value={replyAuthorId}
              onChange={(e) => setReplyAuthorId(e.target.value)}
              disabled={loading || users.length === 0}
              className="select-input"
            >
              <option value="">작성자를 선택하세요</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nickname || '익명'} ({user.brand || '점주'})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="replyText">대댓글 내용</label>
            <textarea
              id="replyText"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="대댓글 내용을 입력하세요"
              rows={4}
              disabled={loading}
              className="textarea-input"
            />
          </div>
          <button
            onClick={handleCreateReply}
            disabled={loading || !selectedPostId || !selectedCommentId || !replyText.trim() || !replyAuthorId}
            className="generate-button"
          >
            {loading ? '생성 중...' : '대댓글 생성'}
          </button>
        </div>

        {message && (
          <div className={`admin-post-management-message ${message.includes('오류') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPostManagement;
