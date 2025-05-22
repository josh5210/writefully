import React from 'react';

const EventDrivenDiagram = () => {
  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <h2 className="text-xl font-bold">Event-Driven Story Generation Architecture</h2>
      
      {/* Main Architecture Flow */}
      <div className="w-full max-w-4xl">
        {/* Frontend Layer */}
        <div className="bg-blue-100 p-4 rounded-lg mb-4 border border-blue-300">
          <h3 className="font-semibold mb-2">Frontend (React)</h3>
          <div className="flex justify-around">
            <div className="bg-white px-3 py-2 rounded shadow text-sm">Story Form</div>
            <div className="bg-white px-3 py-2 rounded shadow text-sm">Real-time Progress</div>
            <div className="bg-white px-3 py-2 rounded shadow text-sm">Book Reader</div>
          </div>
          <div className="text-center text-sm mt-2 text-blue-700">
            ⬆️ SSE/WebSocket Connection ⬆️
          </div>
        </div>

        {/* Service Bridge Layer */}
        <div className="bg-purple-100 p-4 rounded-lg mb-4 border border-purple-300">
          <h3 className="font-semibold mb-2">Story Service Bridge</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow">
              <div className="font-medium text-sm mb-1">Event Listener</div>
              <div className="text-xs text-gray-600">
                • Listens to orchestrator events<br/>
                • Maintains story state<br/>
                • Handles error recovery
              </div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="font-medium text-sm mb-1">Frontend Adapter</div>
              <div className="text-xs text-gray-600">
                • Streams events to frontend<br/>
                • Formats progress updates<br/>
                • Manages client connections
              </div>
            </div>
          </div>
          <div className="text-center text-sm mt-2 text-purple-700">
            ⬆️ Event Stream ⬆️
          </div>
        </div>

        {/* Orchestrator Layer */}
        <div className="bg-green-100 p-4 rounded-lg mb-4 border border-green-300">
          <h3 className="font-semibold mb-2">Event-Emitting Orchestrator</h3>
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded shadow text-center">
              <div className="font-medium text-sm mb-2">Orchestrator</div>
              <div className="text-xs text-gray-600">
                Emits events at each step:<br/>
                STORY_STARTED → PLAN_CREATED → <br/>
                PAGE_CONTENT_CREATED → etc.
              </div>
            </div>
          </div>
          <div className="text-center text-sm mt-2 text-green-700">
            ⬆️ Module Events ⬆️
          </div>
        </div>

        {/* AI Modules Layer */}
        <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
          <h3 className="font-semibold mb-2">AI Modules</h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white px-2 py-2 rounded shadow text-center text-sm">
              Story<br/>Planner
            </div>
            <div className="bg-white px-2 py-2 rounded shadow text-center text-sm">
              Page<br/>Planner
            </div>
            <div className="bg-white px-2 py-2 rounded shadow text-center text-sm">
              Writer
            </div>
            <div className="bg-white px-2 py-2 rounded shadow text-center text-sm">
              Critic &<br/>Editor
            </div>
          </div>
        </div>
      </div>

      {/* Event Flow Timeline */}
      <div className="w-full max-w-3xl mt-8">
        <h3 className="text-lg font-semibold mb-4 text-center">Event Flow Timeline</h3>
        <div className="flex flex-col space-y-2">
          {[
            { event: 'STORY_STARTED', description: 'User submits story request', color: 'bg-blue-200' },
            { event: 'STORY_PLAN_CREATED', description: 'Overall story structure planned', color: 'bg-green-200' },
            { event: 'PAGE_PLAN_CREATED', description: 'Individual page planned (repeats)', color: 'bg-yellow-200' },
            { event: 'PAGE_CONTENT_CREATED', description: 'Page content written', color: 'bg-orange-200' },
            { event: 'PAGE_CRITIQUE_CREATED', description: 'Page critiqued', color: 'bg-pink-200' },
            { event: 'PAGE_EDITED', description: 'Page refined based on critique', color: 'bg-purple-200' },
            { event: 'PAGE_COMPLETED', description: 'Page finalized and available', color: 'bg-indigo-200' },
            { event: 'STORY_COMPLETED', description: 'All pages complete', color: 'bg-emerald-200' },
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
              <div className="flex-1 text-sm">
                <span className="font-mono font-semibold">{item.event}</span>
                <span className="ml-2 text-gray-600">- {item.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventDrivenDiagram;
