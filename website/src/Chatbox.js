import React, { useState, useRef, useEffect } from 'react';
import Hls from "hls.js";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import './Chatbox.css';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const Chatbox = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState({});
  const [announcements, setAnnouncements] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState({});
  const [error, setError] = useState(null);
  const [typedMessage, setTypedMessage] = useState([]); // Example info state array
  const navigate = useNavigate();

  const textareaRef = useRef(null);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);  // Ref to scroll to the bottom
  const messagesContainerRef = useRef(null);
  
  // Scroll to the bottom of the messages container when messages change
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]); // This effect runs when the `messages` state changes
  
  useEffect(() => {
    fetchAnnouncements();
    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket.current) {
      socket.current.on('server_response', handleServerResponse);
      socket.current.on('conversation_ids', handleConversationIds);
      socket.current.on('past_messages', handlePastMessages);
    }

    return () => {
      if (socket.current) {
        socket.current.off('server_response');
        socket.current.off('conversation_ids');
        socket.current.off('past_messages');
      }
    };
  }, [socket.current]);
	// HLS Video Player Component

const VideoPlayer = React.memo(({ src }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (src.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src; // Directly set MP4 or other formats
    }
  }, [src]); // The effect only runs when `src` changes

  return (
    <video
      ref={videoRef}
      controls
      style={{
        width: "100%",
        height: "auto",
        borderRadius: "10px",
      }}
    />
  );
});

const Message = React.memo(({ message, userId, imageUrls }) => {
  return (
    <div ref={messagesContainerRef} className={`message ${message.sender === "user" || message.sender === userId ? 'sent' : 'received'}`}>
      
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
}, (prevProps, nextProps) => {
  // Only re-render if the message, userId, or imageUrls actually change
  return (
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.image === nextProps.message.image
  );
});

const MessageList = React.memo(({ messages, userId, imageUrls }) => {
  return (
    <div className="chatbox-body">
      <div className="messages">
        {messages.map((message, index) => (
          <Message
            key={index}
            message={message}
            userId={userId}
            imageUrls={imageUrls} // Pass the image URLs here if necessary
          />
        ))}
      </div>
	  <div ref={messagesEndRef} />
    </div>
  );
});

const TextArea = React.memo(({ newMessage, onChange, onKeyDown }) => {
  return (
    <textarea
      value={newMessage}
      onChange={onChange}
      onKeyDown={onKeyDown}  // Detect 'Enter' key press
      placeholder="Type your message..."
      rows="1"
    />
  );
});

const handleChange = (e) => {
  setNewMessage(e.target.value); // Updates newMessage without causing other parts to re-render
};

// Handle 'Enter' key press to send the message
const handleKeyDown = (e) => {
if (e.key === 'Enter' && !e.shiftKey) {
  e.preventDefault(); // Prevents the default behavior of adding a new line
  // Update the state with the value of the textarea when 'Enter' is pressed
  handleSendMessage();
}
};

const MessageFooter = React.memo(({ newMessage, setNewMessage, handleKeyDown, handleChange }) => {
  return (
	<div className="chatbox-footer">
	  <textarea
		value={newMessage}
		onChange={handleChange}  // Update state as the user types
		onKeyDown={handleKeyDown}  // Update state on 'Enter' key press
		placeholder="Type your message..."
		rows="1"
	  ></textarea>
	</div>
	  );
	});

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/yourusername/yourrepo/main/announcements.txt');
      const text = await response.text();
      setAnnouncements(text);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('token='));
        if (token) {
          const tokenValue = token.split('=')[1];
          
          // If token exists in cookies, verify it by sending it to the backend
          const response = await axios.post('http://localhost:5000/verify-token', { token: tokenValue });
          
          if (response.status === 200) {
            // User is logged in, set the user data
            setUser(response.data.user);
            setUserId(response.data.userId);
			
			connectSocket();
          }
        }
      } catch (error) {
        console.error('Error verifying token', error);
      }
    };

    checkLogin();
  }, []);

  const handleSuccess = async (credentialResponse) => {
	  try {
		const { credential } = credentialResponse;
		
		// Send the Google credential to your backend to validate
		const response = await axios.post('http://localhost:5000/login', { credential });

		if (response.status === 200) {
		  // Set the user data in state and save token in cookies
		  setUser(response.data.user);
		  setUserId(response.data.userId);
		  document.cookie = `token=${response.data.token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7-day expiration
		  
		  connectSocket();
		}
	  } catch (err) {
		console.error('Failed to login', err);
	  }
	};

  const handleFailure = (error) => {
    console.error('Google login failed', error);
  };

  const handleLogout = () => {
    setUser(null);
    setUserId('');
    document.cookie = 'token=; path=/; max-age=0'; // Clear the token cookie
  };

  const connectSocket = async () => {
    if (socket.current || isConnected || !userId) return;

    try {
      const ngrokUrl = await fetchNgrokUrl();
      socket.current = io("http://localhost:5000", { query: { user_id: userId }, transports: ['websocket'] });
      setIsConnected(true);
      socket.current.emit('get_conversation_ids', { user_id: userId });
    } catch (error) {
      console.error('Failed to fetch ngrok URL:', error);
    }
  };

  const fetchNgrokUrl = async () => {
    try {
      const timestamp = Date.now();
      const ngrokResponse = await fetch(`https://raw.githubusercontent.com/sprites20/ngrok-links/refs/heads/main/ngrok-link.json?timestamp=${timestamp}`);
      const ngrokData = await ngrokResponse.json();
      return extractNgrokUrl(ngrokData.ngrok_url);
    } catch (error) {
      console.error('Error fetching ngrok URL:', error);
    }
  };

  const extractNgrokUrl = (ngrokTunnelString) => {
    const match = ngrokTunnelString.match(/https?:\/\/[^\s]+/);
    if (match) return match[0].replace(/"$/, '');
    console.error('No valid ngrok URL found.');
    return null;
  };

  const handleServerResponse = (data) => {
    setMessages((prevMessages) => [...prevMessages, data]);
    setConversationMessages((prev) => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), data],
    }));
  };

  const handleConversationIds = (data) => {
    setConversations(data.conversationIds);
  };

  const handlePastMessages = (data) => {
    setMessages(data.messages);
	console.log(data.messages)
    setConversationMessages((prev) => ({
        ...prev,
        [data.conversation_id]: data.messages
    }));
};

  const handleFileChange = (event) => setSelectedFile(event.target.files[0]);

  const handleFileUpload = async () => {
    if (!selectedFile || !isConnected) return alert('Please select a file and connect to the server first!');

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user_id', userId);

    try {
      const response = await fetch(`${socket.current.io.uri}/upload`, { method: 'POST', body: formData });
      const result = await response.json();
      if (response.ok) {
        setUploadedFileUrl(result.file_url);
        alert(`File uploaded: ${selectedFile.name}`);
      } else {
        console.error('Error uploading file:', result.error);
      }
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const fetchImageWithHeaders = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl, { method: 'GET', headers: { 'ngrok-skip-browser-warning': 'true' } });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      const newImageUrls = {};
      for (const message of messages) {
        if (message.image && !imageUrls[message.image]) {
          const imageUrl = await fetchImageWithHeaders(message.image);
          newImageUrls[message.image] = imageUrl;
        }
      }
      setImageUrls((prev) => ({ ...prev, ...newImageUrls }));
    };

    fetchImages();
  }, [messages]);

  const handleLogin = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      
      // Send the Google credential to your backend to validate
      const response = await axios.post('http://localhost:5000/login', { credential });

      if (response.status === 200) {
        // User is logged in, retrieve user details if necessary
        setUser(credentialResponse.profileObj);
      }
    } catch (err) {
      setError('Failed to login');
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && !uploadedFileUrl) return;
    if (!isConnected) return alert('Please connect to the server first!');
    
    const messageToSend = { text: newMessage, image: uploadedFileUrl, sender: userId, conversation_id: selectedConversation };
    setConversationMessages((prev) => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), messageToSend],
    }));
    setMessages((prevMessages) => [...prevMessages, messageToSend]);

    socket.current.emit('client_event', messageToSend);
    setNewMessage('');
    setUploadedFileUrl(null);
    textareaRef.current.style.height = 'auto';
  };

  const handleConversationChange = (event) => {
    const selectedId = event.target.value;
    setSelectedConversation(selectedId);
    socket.current.emit('get_past_messages', { conversation_id: selectedId, user_id: userId });
	console.log(conversationMessages[selectedId])
    setMessages(conversationMessages[selectedId] || []);
  };

  const startNewConversation = () => {
    const newConvId = Date.now();
    setConversations((prev) => [...prev, newConvId]);
    setMessages([]);
    setConversationMessages((prev) => ({ ...prev, [newConvId]: [] }));
  };

  function replaceNgrokWithLocalhost(url) {
	  try {
		const parsedUrl = new URL(url);
		parsedUrl.protocol = "http:"; // Force HTTP when using localhost
		parsedUrl.hostname = "localhost";
		parsedUrl.port = "5000";
		return parsedUrl.toString();
	  } catch (error) {
		console.error("Invalid URL:", error);
		return url; // Fallback to original if parsing fails
	  }
}

return (
  <GoogleOAuthProvider clientId="">
    <div className="chatbox">
      {/* Header */}
      <div className="chatbox-header">
        <span>Chatbox</span>
        <button onClick={() => navigate("/usage-statistics")}>
          Usage Statistics
        </button>
        <button onClick={startNewConversation}>New Conversation</button>
        <select value={selectedConversation} onChange={handleConversationChange}>
          <option value="">Select Conversation</option>
          {conversations.map((convId) => (
            <option key={convId} value={convId}>{convId}</option>
          ))}
        </select>
        {!user ? (
          <GoogleLogin
            onSuccess={handleSuccess}
            onFailure={handleFailure}
            cookiePolicy="single_host_origin"
          />
        ) : (
          <div>
            <span>{user.name}</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        )}
        <button onClick={connectSocket} disabled={isConnected || !user} className="connect-button">
          {isConnected ? 'Connected' : 'Connect'}
        </button>
      </div>

      {/* Announcements Section */}
      <div className="announcements">
        <h4>Announcements</h4>
        <p>{announcements || 'Loading announcements...'}</p>
      </div>

      {/* Messages Section */}
      <MessageList
        messages={messages}
        userId={userId}
        imageUrls={imageUrls}  // Pass the image URLs here if necessary
      />

      {/* Input Section */}
      <div className="chatbox-footer">
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}  // Detect 'Enter' key press
          placeholder="Type your message..."
          rows="1"
        />
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleSendMessage} disabled={uploading}>
          Send
        </button>
        <button onClick={handleFileUpload} disabled={uploading || !selectedFile}>
          Upload File
        </button>
      </div>
    </div>
  </GoogleOAuthProvider>
);
};

export default Chatbox;
