import React from 'react';
import '../styles/StaffTileSelector.css';

const StaffTileSelector = ({ staffList, selectedStaffId, onSelect }) => {
  return (
    <div className="staff-tiles-container">
      {staffList.map(staff => (
        <div
          key={staff._id}
          className={`staff-tile ${selectedStaffId === staff._id ? 'selected' : ''}`}
          onClick={() => onSelect(staff._id)}
        >
          <div className="staff-photo">
            {staff.profileImage ? (
              <img src={`/uploads/staff-images/${staff.profileImage}`} alt={`${staff.firstName} ${staff.lastName}`} />
            ) : (
              <div className="default-avatar">
                {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
              </div>
            )}
          </div>
          <div className="staff-details">
            <strong>{staff.firstName} {staff.lastName}</strong>
            <span>{staff.position}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StaffTileSelector;
