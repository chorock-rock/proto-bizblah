import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, getDoc, orderBy } from 'firebase/firestore';
import './BrandReview.css';

// 스크롤 방지
const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLocked]);
};

const BrandReview = () => {
  const { currentUser, getBrandLabel, selectedBrand, getNickname } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 팝업 열릴 때 스크롤 방지
  useScrollLock(showReviewForm || showCommentForm);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 리뷰 점수 상태
  const [scores, setScores] = useState({
    profitability: 0,      // 수익성 만족도
    support: 0,             // 본사 지원 만족도
    logistics: 0,           // 물류·원가 합리성
    competitiveness: 0,     // 브랜드 경쟁력
    communication: 0        // 소통·정책 신뢰도
  });

  useEffect(() => {
    if (!selectedBrand) return;
    fetchReviews();
  }, [selectedBrand]);

  // 리뷰가 없으면 자동으로 팝업 열기
  useEffect(() => {
    if (!loading && currentUser && !myReview) {
      setShowReviewForm(true);
    }
  }, [loading, currentUser, myReview]);

  const fetchReviews = async () => {
    if (!selectedBrand) return;

    try {
      setLoading(true);
      const brandLabel = getBrandLabel();
      
      // 현재 사용자의 브랜드만 가져오기 (브랜드가 없으면 리턴)
      if (!brandLabel || brandLabel === '점주') {
        setReviews([]);
        setLoading(false);
        return;
      }

      // 해당 브랜드의 모든 리뷰 가져오기 (현재 사용자의 브랜드만)
      const reviewsQuery = query(
        collection(db, 'brandReviews'),
        where('brand', '==', brandLabel)
      );

      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = await Promise.all(
        reviewsSnapshot.docs.map(async (docSnapshot) => {
          const reviewData = docSnapshot.data();
          // 작성자 닉네임 가져오기
          let authorName = '익명';
          if (reviewData.authorId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', reviewData.authorId));
              if (userDoc.exists()) {
                authorName = userDoc.data().nickname || '익명';
              }
            } catch (error) {
              console.error('작성자 정보 가져오기 오류:', error);
            }
          }

          return {
            id: docSnapshot.id,
            ...reviewData,
            authorName,
            createdAt: reviewData.createdAt?.toDate() || new Date()
          };
        })
      );

      // 작성일 기준 내림차순 정렬
      reviewsData.sort((a, b) => b.createdAt - a.createdAt);

      setReviews(reviewsData);

      // 내 리뷰 찾기
      if (currentUser) {
        const myReviewData = reviewsData.find(r => r.authorId === currentUser.uid);
        if (myReviewData) {
          setMyReview(myReviewData);
          setScores({
            profitability: myReviewData.profitability || 0,
            support: myReviewData.support || 0,
            logistics: myReviewData.logistics || 0,
            competitiveness: myReviewData.competitiveness || 0,
            communication: myReviewData.communication || 0
          });
        } else {
          setMyReview(null);
        }
      }
    } catch (error) {
      console.error('리뷰 가져오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 평균 점수 계산
  const calculateAverage = () => {
    if (reviews.length === 0) {
      return {
        overall: 0,
        profitability: 0,
        support: 0,
        logistics: 0,
        competitiveness: 0,
        communication: 0
      };
    }

    const totals = reviews.reduce((acc, review) => {
      return {
        profitability: acc.profitability + (review.profitability || 0),
        support: acc.support + (review.support || 0),
        logistics: acc.logistics + (review.logistics || 0),
        competitiveness: acc.competitiveness + (review.competitiveness || 0),
        communication: acc.communication + (review.communication || 0)
      };
    }, {
      profitability: 0,
      support: 0,
      logistics: 0,
      competitiveness: 0,
      communication: 0
    });

    const averages = {
      profitability: totals.profitability / reviews.length,
      support: totals.support / reviews.length,
      logistics: totals.logistics / reviews.length,
      competitiveness: totals.competitiveness / reviews.length,
      communication: totals.communication / reviews.length
    };

    const overallAverage = (
      averages.profitability +
      averages.support +
      averages.logistics +
      averages.competitiveness +
      averages.communication
    ) / 5;

    return {
      overall: overallAverage || 0,
      profitability: averages.profitability || 0,
      support: averages.support || 0,
      logistics: averages.logistics || 0,
      competitiveness: averages.competitiveness || 0,
      communication: averages.communication || 0
    };
  };

  // 별점 렌더링 (0-5점, 0.5 단위)
  const renderStars = (score) => {
    const safeScore = score || 0;
    const roundedScore = Math.round(safeScore * 2) / 2; // 0.5 단위로 반올림
    const fullStars = Math.floor(roundedScore);
    const hasHalfStar = roundedScore % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="stars-container">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star full">★</span>
        ))}
        {hasHalfStar && (
          <span className="star half">
            <span className="star-half-filled">★</span>
            <span className="star-half-empty">★</span>
          </span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star empty">★</span>
        ))}
      </div>
    );
  };

  const handleScoreChange = (category, value) => {
    setScores(prev => ({
      ...prev,
      [category]: parseFloat(value)
    }));
  };


  // 별점 입력 후 텍스트 입력으로 이동
  const handleScoreSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지
    // 상태를 동시에 업데이트
    setShowReviewForm(false);
    setShowCommentForm(true);
  };

  // 최종 리뷰 제출
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser || !selectedBrand) return;

    // 이미 리뷰가 있으면 제출 불가
    if (myReview) {
      return;
    }

    setSubmitting(true);
    try {
      const brandLabel = getBrandLabel();
      // 현재 사용자의 브랜드가 없으면 제출 불가
      if (!brandLabel || brandLabel === '점주') {
        setSubmitting(false);
        return;
      }
      
      const authorName = getNickname();
      const reviewData = {
        brand: brandLabel, // 현재 사용자의 브랜드로만 저장
        authorId: currentUser.uid,
        comment: comment.trim() || '', // 텍스트 입력 (빈 값 허용)
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 새 리뷰 추가
      await addDoc(collection(db, 'brandReviews'), {
        ...reviewData,
        authorName
      });

      await fetchReviews();
      setShowReviewForm(false);
      setShowCommentForm(false);
      // 폼 초기화
      setScores({
        profitability: 0,
        support: 0,
        logistics: 0,
        competitiveness: 0,
        communication: 0
      });
      setComment('');
    } catch (error) {
      console.error('리뷰 제출 오류:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="brand-review-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  // 리뷰를 작성하지 않은 사용자는 접근 불가 (팝업이 열려있으면 내용 표시)
  if (currentUser && !myReview && !showReviewForm && !showCommentForm) {
    return (
      <div className="brand-review-container">
        <div className="no-access-message">
          <h2>리뷰 작성 후 이용 가능합니다</h2>
          <p>브랜드 리뷰를 보시려면 먼저 리뷰를 작성해주세요.</p>
        </div>
      </div>
    );
  }

  const averages = calculateAverage();
  const reviewCategories = [
    { key: 'profitability', label: '수익성 만족도' },
    { key: 'support', label: '본사 지원 만족도' },
    { key: 'logistics', label: '물류·원가 합리성' },
    { key: 'competitiveness', label: '브랜드 경쟁력' },
    { key: 'communication', label: '소통·정책 신뢰도' }
  ];

  return (
    <div className={`brand-review-container ${showReviewForm ? 'blurred' : ''}`}>
      <div className="brand-review-header">
        <h2 className="brand-review-title">브랜드 리뷰</h2>
        <p className="brand-review-subtitle">{getBrandLabel()} 점주님들의 평가</p>
      </div>

      <div className="brand-review-summary">
        <div className="average-score-section">
          <div className="average-score">
            <div className="average-score-value">{(averages.overall || 0).toFixed(1)}</div>
            <div className="average-score-label">평균 점수</div>
          </div>
          <div className="average-stars">
            {renderStars(averages.overall || 0)}
          </div>
          <div className="review-count">
            총 {reviews.length}명이 평가했습니다
          </div>
        </div>

        <div className="review-details-section">
          {reviewCategories.map(category => (
            <div key={category.key} className="review-item">
              <div className="review-item-label">{category.label}</div>
              <div className="review-item-stars">
                {renderStars(averages[category.key] || 0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentUser && (
        <>
          {!showReviewForm && !myReview && reviews.length === 0 && (
            <div className="brand-review-form-section">
              <button
                className="write-review-button"
                onClick={() => setShowReviewForm(true)}
              >
                리뷰 작성하기
              </button>
            </div>
          )}

          {showReviewForm && !showCommentForm && createPortal(
            <div className="review-form-overlay" onClick={(e) => {
              e.stopPropagation();
              setShowReviewForm(false);
            }}>
              <div className="review-form-modal" onClick={(e) => e.stopPropagation()}>
                <button className="review-form-close" onClick={(e) => {
                  e.stopPropagation();
                  setShowReviewForm(false);
                  setShowCommentForm(false);
                }}>×</button>
                <form className="review-form" onSubmit={handleScoreSubmit} onClick={(e) => e.stopPropagation()}>
                  {reviewCategories.map(category => (
                    <div key={category.key} className="form-item">
                      <div className="form-item-row">
                        <label className="form-label">{category.label}</label>
                        <div
                          className="star-rating-input"
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const starSize = isMobile ? 28 : 32;
                            const gap = isMobile ? 6 : 8;
                            const totalStarWidth = starSize + gap;

                            // 별 인덱스 계산 (0-4)
                            let starIndex = Math.floor(x / totalStarWidth);
                            if (starIndex >= 5) starIndex = 4;
                            if (starIndex < 0) starIndex = 0;

                            // 별 내부 위치 계산 (0-1)
                            const offsetInStar = x - (starIndex * totalStarWidth);
                            const positionInStar = Math.max(0, Math.min(1, offsetInStar / starSize));

                            // 왼쪽 절반(0-0.5)이면 0.5점, 오른쪽 절반(0.5-1)이면 1점
                            const value = starIndex + (positionInStar < 0.5 ? 0.5 : 1);

                            if (e.buttons === 1 && starIndex >= 0 && starIndex < 5) {
                              handleScoreChange(category.key, Math.min(5, value));
                            }
                          }}
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const starSize = isMobile ? 28 : 32;
                            const gap = isMobile ? 6 : 8;
                            const totalStarWidth = starSize + gap;

                            let starIndex = Math.floor(x / totalStarWidth);
                            if (starIndex >= 5) starIndex = 4;
                            if (starIndex < 0) starIndex = 0;

                            const offsetInStar = x - (starIndex * totalStarWidth);
                            const positionInStar = Math.max(0, Math.min(1, offsetInStar / starSize));

                            const value = starIndex + (positionInStar < 0.5 ? 0.5 : 1);

                            if (starIndex >= 0 && starIndex < 5) {
                              handleScoreChange(category.key, Math.min(5, value));
                            }
                          }}
                          onTouchMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const touch = e.touches[0];
                            const x = touch.clientX - rect.left;
                            const starSize = isMobile ? 28 : 32;
                            const gap = isMobile ? 6 : 8;
                            const totalStarWidth = starSize + gap;

                            let starIndex = Math.floor(x / totalStarWidth);
                            if (starIndex >= 5) starIndex = 4;
                            if (starIndex < 0) starIndex = 0;

                            const offsetInStar = x - (starIndex * totalStarWidth);
                            const positionInStar = Math.max(0, Math.min(1, offsetInStar / starSize));

                            const value = starIndex + (positionInStar < 0.5 ? 0.5 : 1);

                            if (starIndex >= 0 && starIndex < 5) {
                              handleScoreChange(category.key, Math.min(5, value));
                            }
                          }}
                          onTouchStart={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const touch = e.touches[0];
                            const x = touch.clientX - rect.left;
                            const starSize = isMobile ? 28 : 32;
                            const gap = isMobile ? 6 : 8;
                            const totalStarWidth = starSize + gap;

                            let starIndex = Math.floor(x / totalStarWidth);
                            if (starIndex >= 5) starIndex = 4;
                            if (starIndex < 0) starIndex = 0;

                            const offsetInStar = x - (starIndex * totalStarWidth);
                            const positionInStar = Math.max(0, Math.min(1, offsetInStar / starSize));

                            const value = starIndex + (positionInStar < 0.5 ? 0.5 : 1);

                            if (starIndex >= 0 && starIndex < 5) {
                              handleScoreChange(category.key, Math.min(5, value));
                            }
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((starNum) => {
                            const value = starNum;
                            const halfValue = starNum - 0.5;
                            const isFull = scores[category.key] >= value;
                            const isHalf = scores[category.key] >= halfValue && scores[category.key] < value;
                            return (
                              <span
                                key={starNum}
                                className={`star-rating-star ${isFull ? 'active' : ''} ${isHalf ? 'half' : ''}`}
                              >
                                ★
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setScores({
                          profitability: 0,
                          support: 0,
                          logistics: 0,
                          competitiveness: 0,
                          communication: 0
                        });
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="submit-button"
                      disabled={submitting}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleScoreSubmit(e);
                      }}
                    >
                      다음
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}

          {showCommentForm && createPortal(
            <div className="review-form-overlay" onClick={() => {
              setShowCommentForm(false);
              setShowReviewForm(false);
            }}>
              <div className="review-form-modal" onClick={(e) => e.stopPropagation()}>
                <button className="review-form-close" onClick={() => {
                  setShowCommentForm(false);
                  setShowReviewForm(false);
                }}>×</button>
                <form className="review-form" onSubmit={handleSubmitReview}>
                  <div className="form-item">
                    <label className="form-label">하고 싶은 말 (선택사항)</label>
                    <textarea
                      className="review-comment-input"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="리뷰에 대한 추가 의견을 작성해주세요"
                      rows={6}
                      maxLength={500}
                    />
                    <div className="comment-length">{comment.length}/500</div>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setShowCommentForm(false);
                        setShowReviewForm(true);
                        setComment('');
                      }}
                    >
                      이전
                    </button>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={submitting}
                    >
                      {submitting ? '제출 중...' : '제출하기'}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      <div className="reviews-list-section">
        <h3 className="reviews-list-title">작성된 리뷰 ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <div className="no-reviews">
            아직 작성된 리뷰가 없습니다.
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => {
              const reviewAverage = (
                (review.profitability || 0) +
                (review.support || 0) +
                (review.logistics || 0) +
                (review.competitiveness || 0) +
                (review.communication || 0)
              ) / 5;

              const formatDate = (date) => {
                if (!date) return '';
                const now = new Date();
                const diff = now - date;
                const days = Math.floor(diff / 86400000);
                const months = Math.floor(days / 30);

                if (days < 1) return '오늘';
                if (days < 7) return `${days}일 전`;
                if (days < 30) return `${Math.floor(days / 7)}주 전`;
                if (months < 12) return `${months}개월 전`;
                return date.toLocaleDateString('ko-KR');
              };

              return (
                <div key={review.id} className="review-card">
                  <div className="review-card-header">
                    <div className="review-author">{review.authorName || '익명'}</div>
                    <div className="review-date">{formatDate(review.createdAt)}</div>
                  </div>
                  <div className="review-card-average">
                    <div className="review-average-score">{(reviewAverage || 0).toFixed(1)}</div>
                    <div className="review-average-stars">
                      {renderStars(reviewAverage || 0)}
                    </div>
                  </div>
                  <div className="review-card-details">
                    {reviewCategories.map(category => (
                      <div key={category.key} className="review-card-item">
                        <span className="review-card-label">{category.label}</span>
                        <div className="review-card-stars">
                          {renderStars(review[category.key] || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {review.comment && (
                    <div className="review-card-comment">
                      {review.comment}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandReview;
