import React from 'react';

const EnhancedArchitectureDiagram = () => {
  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Enhanced Story Generation Architecture</h1>
      
      {/* Main Architecture Flow */}
      <div className="w-full max-w-5xl">
        {/* Frontend Layer */}
        <div className="bg-blue-100 p-6 rounded-lg mb-4 border-2 border-blue-300">
          <h3 className="font-bold text-lg mb-3 text-blue-800">Frontend Layer (React/Next.js)</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded shadow-sm border text-center">
              <div className="font-medium text-sm mb-1">Story Form</div>
              <div className="text-xs text-gray-600">Topic, pages, style, quality</div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border text-center">
              <div className="font-medium text-sm mb-1">Progress Display</div>
              <div className="text-xs text-gray-600">Real-time status & progress bar</div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border text-center">
              <div className="font-medium text-sm mb-1">Progressive Reader</div>
              <div className="text-xs text-gray-600">Shows pages as completed</div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border text-center">
              <div className="font-medium text-sm mb-1">Media Controls</div>
              <div className="text-xs text-gray-600">TTS, Images (future)</div>
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-200 px-3 py-1 rounded-full text-sm">
              <span>📡</span>
              <span className="font-medium">SSE/WebSocket Connection</span>
              <span>📡</span>
            </div>
          </div>
        </div>

        {/* Service Bridge Layer - Enhanced */}
        <div className="bg-purple-100 p-6 rounded-lg mb-4 border-2 border-purple-300">
          <h3 className="font-bold text-lg mb-3 text-purple-800">Service Bridge Layer (Node.js/API)</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded shadow-sm border">
              <div className="font-medium text-sm mb-2 text-purple-700">Event Listener</div>
              <div className="text-xs text-gray-600 mb-2">
                • Listens to all orchestrator events<br/>
                • Maintains session state<br/>
                • Handles error recovery<br/>
                • Manages reconnections
              </div>
            </div>
            <div className="bg-white p-4 rounded shadow-sm border">
              <div className="font-medium text-sm mb-2 text-purple-700">Session Manager</div>
              <div className="text-xs text-gray-600 mb-2">
                • Tracks active story sessions<br/>
                • Manages client connections<br/>
                • Handles cancellations<br/>
                • Cleanup dead connections
              </div>
            </div>
            <div className="bg-white p-4 rounded shadow-sm border">
              <div className="font-medium text-sm mb-2 text-purple-700">Event Streamer</div>
              <div className="text-xs text-gray-600 mb-2">
                • Formats events for frontend<br/>
                • Streams via SSE/WebSocket<br/>
                • Handles client multiplexing<br/>
                • Heartbeat management
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-purple-200 px-3 py-1 rounded-full text-sm">
              <span>⚡</span>
              <span className="font-medium">Event Stream (with error recovery)</span>
              <span>⚡</span>
            </div>
          </div>
        </div>

        {/* Orchestrator Layer - Enhanced */}
        <div className="bg-green-100 p-6 rounded-lg mb-4 border-2 border-green-300">
          <h3 className="font-bold text-lg mb-3 text-green-800">Event-Emitting Orchestrator</h3>
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded shadow-sm border text-center">
              <div className="font-medium text-base mb-2 text-green-700">Story Orchestrator</div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Sequential Page Processing:</strong><br/>
                Plan → Write → Critique → Edit → Complete
              </div>
              <div className="text-xs text-gray-500">
                Quality settings control revision cycles<br/>
                Each page emits events at every step
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-green-200 px-3 py-1 rounded-full text-sm">
              <span>🔄</span>
              <span className="font-medium">Detailed Module Events</span>
              <span>🔄</span>
            </div>
          </div>
        </div>

        {/* AI Modules Layer - Enhanced */}
        <div className="bg-yellow-100 p-6 rounded-lg border-2 border-yellow-300">
          <h3 className="font-bold text-lg mb-3 text-yellow-800">AI Processing Modules</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded shadow-sm border text-center">
                <div className="font-medium text-sm mb-1">Story Planner</div>
                <div className="text-xs text-gray-600">Overall narrative arc</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm border text-center">
                <div className="font-medium text-sm mb-1">Page Planner</div>
                <div className="text-xs text-gray-600">Individual page details</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm border text-center">
                <div className="font-medium text-sm mb-1">Writer</div>
                <div className="text-xs text-gray-600">Content generation</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm border text-center">
                <div className="font-medium text-sm mb-1">Critic & Editor</div>
                <div className="text-xs text-gray-600">Quality improvement</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded shadow-sm border">
              <div className="font-medium text-sm mb-2 text-yellow-700">Future Extensions</div>
              <div className="text-xs text-gray-600">
                • <strong>Image Generator:</strong> Visual content per page<br/>
                • <strong>TTS Service:</strong> Audio narration<br/>
                • <strong>Translation:</strong> Multi-language support<br/>
                • <strong>Format Export:</strong> PDF, EPUB, etc.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Event Flow */}
      <div className="w-full max-w-5xl mt-8">
        <h2 className="text-xl font-bold mb-4 text-center">Page Generation Cycle</h2>
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Single Page Cycle */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">Per-Page Event Cycle</h3>
              <div className="space-y-2">
                {[
                  { event: 'PAGE_PLAN_CREATED', desc: 'Plan what happens on this page', color: 'bg-yellow-200' },
                  { event: 'PAGE_CONTENT_CREATED', desc: 'Generate the page content', color: 'bg-blue-200' },
                  { event: 'PAGE_CRITIQUE_CREATED', desc: 'Analyze and critique content', color: 'bg-orange-200' },
                  { event: 'PAGE_EDITED', desc: 'Improve based on critique', color: 'bg-purple-200' },
                  { event: 'PAGE_COMPLETED', desc: '✅ Page available to users!', color: 'bg-green-200' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <div className="flex-1 text-sm">
                      <span className="font-mono text-xs font-semibold">{item.event}</span>
                      <span className="ml-2 text-gray-600">- {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Flow */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">Overall Story Flow</h3>
              <div className="space-y-2">
                {[
                  { event: 'STORY_STARTED', desc: 'User submits story request', color: 'bg-blue-200' },
                  { event: 'STORY_PLAN_CREATED', desc: 'Overall story structure planned', color: 'bg-green-200' },
                  { event: '🔄 REPEAT CYCLE', desc: 'For each page (1 to N)', color: 'bg-gray-200' },
                  { event: 'STORY_COMPLETED', desc: 'All pages finished', color: 'bg-emerald-200' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <div className="flex-1 text-sm">
                      <span className="font-mono text-xs font-semibold">{item.event}</span>
                      <span className="ml-2 text-gray-600">- {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Callout */}
      <div className="w-full max-w-5xl">
        <div className="bg-indigo-50 p-6 rounded-lg border-2 border-indigo-200">
          <h3 className="font-bold text-lg mb-4 text-indigo-800">Key Architecture Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="font-semibold text-sm mb-2 text-indigo-700">Progressive Display</h4>
              <p className="text-xs text-gray-600">
                Pages appear in the reader as soon as they're completed, 
                not waiting for the entire story to finish.
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="font-semibold text-sm mb-2 text-indigo-700">Quality Control</h4>
              <p className="text-xs text-gray-600">
                Quality settings (0-2) control how many critique/edit 
                cycles each page goes through.
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="font-semibold text-sm mb-2 text-indigo-700">Extensible Design</h4>
              <p className="text-xs text-gray-600">
                Ready for future features like image generation, 
                text-to-speech, and export formats.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Handling & Recovery */}
      <div className="w-full max-w-5xl">
        <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
          <h3 className="font-bold text-lg mb-4 text-red-800">Error Handling & Recovery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="font-semibold text-sm mb-2 text-red-700">Connection Management</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Automatic reconnection with exponential backoff</li>
                <li>• Heartbeat monitoring for dead connections</li>
                <li>• State recovery when reconnecting</li>
                <li>• Graceful degradation on errors</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="font-semibold text-sm mb-2 text-red-700">Generation Recovery</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Individual page failures don't stop the story</li>
                <li>• Retry logic for LLM API failures</li>
                <li>• Cancellation support at any point</li>
                <li>• Session persistence across server restarts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedArchitectureDiagram;
