import React, { useState } from 'react';
import FileUploadComponent from './FileUploadComponent';

const TaskCreateForm = ({ workers, onSubmit, onCancel, currentUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    department: 'cutting',
    priority: 'medium',
    due_date: '',
    tags: [],
    estimated_hours: '',
    frequency: 'once',
    recurrence_pattern: '',
    start_date: '',
    specific_dates: [],
    reminder_enabled: false,
    reminder_before_hours: 24,
    initial_attachments: []
  });

  const [tagInput, setTagInput] = useState('');
  const [specificDateInput, setSpecificDateInput] = useState('');
  const [attachmentForm, setAttachmentForm] = useState({
    file_name: '',
    file_url: '',
    file_type: 'document'
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const departments = ['cutting', 'stitching', 'finishing', 'qc', 'packaging', 'admin'];
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleAddSpecificDate = () => {
    if (specificDateInput && !formData.specific_dates.includes(specificDateInput)) {
      setFormData({ ...formData, specific_dates: [...formData.specific_dates, specificDateInput] });
      setSpecificDateInput('');
    }
  };

  const handleRemoveSpecificDate = (dateToRemove) => {
    setFormData({ ...formData, specific_dates: formData.specific_dates.filter(d => d !== dateToRemove) });
  };

  const handleAddAttachment = () => {
    if (attachmentForm.file_name.trim() && attachmentForm.file_url.trim()) {
      const newAttachment = {
        file_name: attachmentForm.file_name,
        file_url: attachmentForm.file_url,
        file_type: attachmentForm.file_type,
        uploaded_by: currentUser.name
      };
      setFormData({ 
        ...formData, 
        initial_attachments: [...formData.initial_attachments, newAttachment] 
      });
      setAttachmentForm({ file_name: '', file_url: '', file_type: 'document' });
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          file_name: file.name,
          file_url: e.target.result, // Base64 data URL
          file_type: getFileTypeFromName(file.name),
          uploaded_by: currentUser.name,
          file_size: file.size,
          original_file: true
        };

        setFormData(prev => ({
          ...prev,
          initial_attachments: [...prev.initial_attachments, fileData]
        }));
      };
      
      reader.readAsDataURL(file);
    });

    // Reset file input
    event.target.value = '';
  };

  const getFileTypeFromName = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp3', 'wav', 'aac', 'ogg'].includes(ext)) return 'audio';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'video';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
    return 'document';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleRemoveAttachment = (index) => {
    setFormData({
      ...formData,
      initial_attachments: formData.initial_attachments.filter((_, idx) => idx !== index)
    });
  };

  const getFileIcon = (fileType) => {
    const icons = {
      image: '🖼️',
      audio: '🎵',
      video: '🎬',
      document: '📄',
      pdf: '📕',
      link: '🔗'
    };
    return icons[fileType] || '📎';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      created_by: currentUser.id
    };
    onSubmit(submitData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Task</h2>
      <form onSubmit={handleSubmit}>
        
        {/* Basic Info */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs mr-2">1</span>
            Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Inspect fabric shipment"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                rows="3"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Describe the task in detail..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
              <select
                required
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Worker</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} - {worker.department}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 2.5"
              />
            </div>
          </div>
        </div>

        {/* Task Frequency */}
        <div className="mb-6 border-t pt-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs mr-2">2</span>
            Frequency & Schedule
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Frequency *</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="once">⏱️ Once (One-time task)</option>
                <option value="daily">📅 Daily</option>
                <option value="weekly">📆 Weekly</option>
                <option value="monthly">🗓️ Monthly</option>
                <option value="specific_dates">📌 Specific Dates</option>
              </select>
            </div>

            {formData.frequency !== 'once' && formData.frequency !== 'specific_dates' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  required={formData.frequency !== 'once'}
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {formData.frequency === 'once' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {formData.frequency === 'weekly' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Repeat On (Days) *</label>
                <div className="flex gap-2 flex-wrap">
                  {weekdays.map((day, index) => {
                    const shortDay = day.substring(0, 3).toLowerCase();
                    const isSelected = formData.recurrence_pattern?.includes(shortDay);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const current = formData.recurrence_pattern ? formData.recurrence_pattern.split(',') : [];
                          const updated = isSelected 
                            ? current.filter(d => d !== shortDay)
                            : [...current, shortDay];
                          setFormData({ ...formData, recurrence_pattern: updated.join(',') });
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required={formData.frequency === 'monthly'}
                  value={formData.recurrence_pattern}
                  onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 15 for 15th of each month"
                />
              </div>
            )}

            {formData.frequency === 'specific_dates' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Specific Dates *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="date"
                    value={specificDateInput}
                    onChange={(e) => setSpecificDateInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecificDate}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add Date
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specific_dates.map((date, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                      {date}
                      <button type="button" onClick={() => handleRemoveSpecificDate(date)} className="hover:text-purple-900">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reminders */}
        <div className="mb-6 border-t pt-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs mr-2">3</span>
            Reminders
          </h3>
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.reminder_enabled}
                onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Enable Reminder</span>
            </label>
          </div>
          {formData.reminder_enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remind Before (Hours)</label>
              <select
                value={formData.reminder_before_hours}
                onChange={(e) => setFormData({ ...formData, reminder_before_hours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="1">1 hour before</option>
                <option value="2">2 hours before</option>
                <option value="4">4 hours before</option>
                <option value="8">8 hours before</option>
                <option value="24">1 day before</option>
                <option value="48">2 days before</option>
                <option value="72">3 days before</option>
                <option value="168">1 week before</option>
              </select>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mb-6 border-t pt-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs mr-2">4</span>
            Tags & Labels
          </h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Add tags (e.g., urgent, quality-check)"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add Tag
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, idx) => (
              <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-purple-900 font-bold">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Attachments */}
        <div className="mb-6 border-t pt-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs mr-2">5</span>
            Attachments ({formData.initial_attachments.length})
          </h3>
          
          {/* File Upload from Device */}
          <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 mb-4 text-center">
            <div className="text-4xl mb-2">📁</div>
            <h4 className="font-medium text-gray-800 mb-2">Upload Files from Your Device</h4>
            <p className="text-sm text-gray-600 mb-4">
              Drag & drop files here or click to browse<br/>
              <span className="text-xs">Supports: Images, Audio, Video, Documents (Max 10MB each)</span>
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
              <span className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm">
                🗂️ Browse Files from Device
              </span>
            </label>
          </div>

          {/* Manual URL/Link Entry */}
          <div className="bg-gray-50 p-4 rounded-lg mb-3">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🔗</span>
              Or Add Links Manually
            </h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">File Type</label>
                <select
                  value={attachmentForm.file_type}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, file_type: e.target.value })}
                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="image">🖼️ Image (JPG, PNG, GIF)</option>
                  <option value="audio">🎵 Audio (MP3, WAV)</option>
                  <option value="video">🎬 Video (MP4, AVI)</option>
                  <option value="pdf">📕 PDF Document</option>
                  <option value="document">📄 Document (DOCX, XLSX)</option>
                  <option value="link">🔗 Link/URL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">File Name</label>
                <input
                  type="text"
                  value={attachmentForm.file_name}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, file_name: e.target.value })}
                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  placeholder="e.g., Fabric specs.pdf"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">File URL/Link</label>
                <input
                  type="url"
                  value={attachmentForm.file_url}
                  onChange={(e) => setAttachmentForm({ ...attachmentForm, file_url: e.target.value })}
                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddAttachment}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              ➕ Add Link
            </button>
          </div>

          {/* Attachment List */}
          {formData.initial_attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 mb-2">📎 Attached Files ({formData.initial_attachments.length})</h4>
              {formData.initial_attachments.map((att, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(att.file_type)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{att.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="capitalize">{att.file_type}</span>
                        {att.file_size && <span>• {formatFileSize(att.file_size)}</span>}
                        {att.original_file ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">📱 Device Upload</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">🔗 Link</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Remove attachment"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition shadow-sm"
          >
            ✅ Create Task
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreateForm;
