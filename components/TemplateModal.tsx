import type { Template } from "@/app/page";

type Props = {
  templates: Template[];
  darkMode: boolean;
  onApply: (template: Template) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export default function TemplateModal({ templates, darkMode, onApply, onDelete, onClose }: Props) {
  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-white/5' : 'bg-gray-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderClass}`}>
          <div>
            <h3 className="text-lg font-bold">📋 Schedule Templates</h3>
            <p className={`text-sm ${textMuted} mt-1`}>Reuse your favorite schedules</p>
          </div>
          <button
            onClick={onClose}
            className={`p-1 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-6">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📝</div>
              <p className={textMuted}>No templates saved yet</p>
              <p className={`text-sm ${textMuted} mt-2`}>
                Create a schedule and save it as a template to reuse later
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map(template => (
                <div 
                  key={template.id}
                  className={`${cardBg} border ${borderClass} rounded-lg p-4 hover:border-blue-500 transition-colors`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{template.name}</h4>
                      <p className={`text-sm ${textMuted}`}>
                        {template.tasks.length} tasks
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onApply(template)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium text-white transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete template "${template.name}"?`)) {
                            onDelete(template.id);
                          }
                        }}
                        className={`px-3 py-2 ${darkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'} rounded-lg text-sm font-medium transition-colors`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-1">
                    {template.tasks.slice(0, 3).map((task, i) => (
                      <div 
                        key={i}
                        className={`text-xs ${textMuted} pl-3 border-l-2 ${darkMode ? 'border-white/20' : 'border-gray-300'}`}
                      >
                        {task.title} ({task.startTime}:00 - {task.endTime}:00)
                      </div>
                    ))}
                    {template.tasks.length > 3 && (
                      <div className={`text-xs ${textMuted} pl-3`}>
                        +{template.tasks.length - 3} more tasks
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}