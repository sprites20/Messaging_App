import React from 'react';
import './SideBox.css';

const SideBox = () => {
  return (
    <div className="sidebox">
      <div className="sidebox-header">Side Box</div>
      <div className="sidebox-body">
        <div className="scrolling-frame">
          {/* Content for scrolling frame */}
          <p>The server is running on localhost so it doesn't work yet</p>
          <p>Item 2</p>
          <p>Item 3</p>
          <p>Item 4</p>
          <p>Item 5</p>
          <p>Item 6</p>
          {/* Add more content as needed */}
        </div>
      </div>
      <div className="sidebox-footer">
        <button>Button 1</button>
        <button>Button 2</button>
      </div>
    </div>
  );
};

export default SideBox;
