import React from 'react';

// Memoized message component
const Message = React.memo(({ message, userId, imageUrls }) => {
  return (
    <div className={`message ${message.sender === "user" || message.sender === userId ? 'sent' : 'received'}`}>
      <div>
        <strong>{message.sender === "user" || message.sender === userId ? "User" : "Bot"}</strong>: {message.text}
      </div>
      {message.image && (
        message.image.endsWith(".mp4") ? (
          <VideoPlayer src={message.image} />
        ) : (
          <img
            src={imageUrls[message.image] || "Loading..."}
            alt={"Uploaded image: " + message.image}
            className="uploaded-image"
          />
        )
      )}
    </div>
  );
});

export default Message;
