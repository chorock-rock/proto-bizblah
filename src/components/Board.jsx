import { useState } from 'react';
import './Board.css';

const Board = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: '샘플 게시글입니다',
      content: '이것은 샘플 게시글입니다. 실제 게시판 기능은 곧 추가될 예정입니다.',
      author: '익명',
      date: '2026-01-29',
      views: 0
    }
  ]);

  return (
    <div className="board-container">
      <div className="board-header">
        <h2 className="board-title">게시판</h2>
        <button className="write-button">글쓰기</button>
      </div>
      
      <div className="board-content">
        {posts.length === 0 ? (
          <div className="empty-board">
            <p>아직 게시글이 없습니다.</p>
            <p>첫 번째 게시글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="post-item">
                <div className="post-header">
                  <h3 className="post-title">{post.title}</h3>
                  <span className="post-date">{post.date}</span>
                </div>
                <p className="post-content">{post.content}</p>
                <div className="post-footer">
                  <span className="post-author">{post.author}</span>
                  <span className="post-views">조회 {post.views}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Board;
