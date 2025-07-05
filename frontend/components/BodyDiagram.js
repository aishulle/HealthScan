// components/BodyDiagram.js
import React from 'react';

const BodyDiagram = ({ affectedParts = [], mostAffected = '' }) => {
  // Define body parts and their corresponding CSS classes
  const bodyParts = {
    'Head': { 
      className: 'head', 
      position: 'top-[0%] left-[40%] w-[20%] h-[15%] rounded-full' 
    },
    'Neck': { 
      className: 'neck', 
      position: 'top-[15%] left-[45%] w-[10%] h-[5%]' 
    },
    'Chest': { 
      className: 'chest', 
      position: 'top-[20%] left-[30%] w-[40%] h-[20%] rounded-t-lg' 
    },
    'Abdomen': { 
      className: 'abdomen', 
      position: 'top-[40%] left-[35%] w-[30%] h-[15%]' 
    },
    'Pelvis': { 
      className: 'pelvis', 
      position: 'top-[55%] left-[30%] w-[40%] h-[10%] rounded-b-lg' 
    },
    'Arm': { 
      className: 'arm', 
      position: 'top-[25%] left-[15%] w-[15%] h-[30%]' 
    },
    'Leg': { 
      className: 'leg', 
      position: 'top-[65%] left-[40%] w-[20%] h-[35%]' 
    },
    'Full Body': { 
      className: 'full-body', 
      position: 'top-[0%] left-[30%] w-[40%] h-[100%]' 
    },
  };

  return (
    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
      {/* Base body outline */}
      <div className="absolute top-[0%] left-[40%] w-[20%] h-[15%] rounded-full bg-gray-300"></div>
      <div className="absolute top-[15%] left-[45%] w-[10%] h-[5%] bg-gray-300"></div>
      <div className="absolute top-[20%] left-[30%] w-[40%] h-[20%] rounded-t-lg bg-gray-300"></div>
      <div className="absolute top-[40%] left-[35%] w-[30%] h-[15%] bg-gray-300"></div>
      <div className="absolute top-[55%] left-[30%] w-[40%] h-[10%] rounded-b-lg bg-gray-300"></div>
      <div className="absolute top-[25%] left-[15%] w-[15%] h-[30%] bg-gray-300"></div>
      <div className="absolute top-[25%] left-[70%] w-[15%] h-[30%] bg-gray-300"></div>
      <div className="absolute top-[65%] left-[40%] w-[20%] h-[35%] bg-gray-300"></div>

      {/* Highlight affected parts */}
      {affectedParts.map(part => {
        const isMostAffected = part === mostAffected;
        const partData = bodyParts[part] || bodyParts['Full Body'];
        
        return (
          <div
            key={part}
            className={`absolute ${partData.position} ${
              isMostAffected 
                ? 'bg-red-400 opacity-80 border-2 border-red-600 animate-pulse' 
                : 'bg-yellow-400 opacity-60'
            } transition-all duration-300`}
            title={part}
          >
            {isMostAffected && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                Most Affected
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white p-2 rounded text-xs shadow">
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 bg-yellow-400 mr-1"></div>
          <span>Affected Area</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-400 mr-1"></div>
          <span>Most Affected</span>
        </div>
      </div>
    </div>
  );
};

export default BodyDiagram;