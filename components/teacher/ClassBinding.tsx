'use client';

import React from 'react';

interface Class {
  class_id: string;
  class_name: string;
  grade: string;
  is_connected: boolean;
}

interface ClassBindingProps {
  classes: Class[];
  onToggleConnection: (classId: string, isConnected: boolean) => void;
}

export default function ClassBinding({ classes, onToggleConnection }: ClassBindingProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">班级绑定</h3>
      <p className="text-gray-600 mb-4">选择要绑定到本课程的班级：</p>
      
      {classes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无班级
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <div key={cls.class_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50">
              <div>
                <h4 className="font-medium text-gray-900">{cls.class_name}</h4>
                <div className="text-sm text-gray-500">年级: {cls.grade}</div>
              </div>
              <button
                onClick={() => onToggleConnection(cls.class_id, cls.is_connected)}
                className={`py-2 px-4 rounded-md focus:outline-none ${cls.is_connected ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                {cls.is_connected ? '解绑' : '绑定'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
