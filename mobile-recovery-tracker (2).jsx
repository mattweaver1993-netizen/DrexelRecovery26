import React, { useState, useEffect } from 'react';
import { Plus, Minus, RotateCcw, TrendingUp, TrendingDown, Activity, Calendar, Menu, X, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

// Helper function to get week start date (Monday)
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

// Format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Get week string for display
const getWeekString = (date) => {
  const weekStart = getWeekStart(date);
  const month = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const day = weekStart.getDate();
  return `Week of ${month} ${day}`;
};

export default function RecoveryTracker() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    return getWeekStart(new Date());
  });

  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return today;
  });
  
  const [allWeeksData, setAllWeeksData] = useState(() => {
    const saved = window.storage ? null : localStorage.getItem('allRecoveryData');
    if (saved) {
      return JSON.parse(saved);
    }
    return {};
  });

  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [athleteName, setAthleteName] = useState(() => {
    return localStorage.getItem('athleteName') || '';
  });
  const [showNamePrompt, setShowNamePrompt] = useState(() => {
    return !localStorage.getItem('athleteName');
  });

  // Get current week key
  const currentWeekKey = formatDate(currentWeekStart);

  // Get or initialize current week data
  const weekData = allWeeksData[currentWeekKey] || {
    Monday: { positives: {}, negatives: {} },
    Tuesday: { positives: {}, negatives: {} },
    Wednesday: { positives: {}, negatives: {} },
    Thursday: { positives: {}, negatives: {} },
    Friday: { positives: {}, negatives: {} },
    Saturday: { positives: {}, negatives: {} },
    Sunday: { positives: {}, negatives: {} },
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const positiveFactors = [
    { id: 'mobility20', label: '20\' mobility', points: 1, type: 'count', unit: 'sets' },
    { id: 'cooldown10', label: '10\' cooldown', points: 1, type: 'count', unit: 'sets' },
    { id: 'sleep9plus', label: 'Hours sleep over 8', points: 1, type: 'count', unit: 'hrs' },
    { id: 'shake30', label: 'Protein shake within 30\'', points: 1, type: 'check' },
    { id: 'meal90', label: 'Meal within 90\'', points: 1, type: 'check' },
    { id: 'nap30', label: '30\' nap', points: 1, type: 'count', unit: 'sets' },
    { id: 'callParents', label: 'Called parents', points: 1, type: 'check' },
    { id: 'sleepBefore12', label: 'Sleep hours before 12am', points: 1, type: 'count', unit: 'hrs' },
    { id: 'supplements', label: 'All supplements', points: 1, type: 'check' },
  ];

  const negativeFactors = [
    { id: 'practiceHours', label: 'Hours of practice', points: -1, type: 'count', unit: 'hrs' },
    { id: 'sleepUnder8', label: 'Hours under 8hrs sleep', points: -1, type: 'count', unit: 'hrs' },
    { id: 'saturdayDrinks', label: 'Saturday drinks (over 2)', points: -1, type: 'count', unit: 'drinks' },
    { id: 'weeknightDrinks', label: 'Weeknight drinks', points: -1, type: 'count', unit: 'drinks' },
    { id: 'lateBedtime', label: 'Hours past bedtime', points: -1, type: 'count', unit: 'hrs' },
    { id: 'fluidDeficit', label: 'Lbs fluid not replaced', points: -1, type: 'count', unit: 'lbs' },
    { id: 'calorieDeficit', label: '500 cal deficits', points: -1, type: 'count', unit: 'units' },
  ];

  useEffect(() => {
    if (!window.storage) {
      localStorage.setItem('allRecoveryData', JSON.stringify(allWeeksData));
    }
  }, [allWeeksData]);

  useEffect(() => {
    if (athleteName) {
      localStorage.setItem('athleteName', athleteName);
    }
  }, [athleteName]);

  const updateFactor = (day, category, factorId, value) => {
    setAllWeeksData(prev => ({
      ...prev,
      [currentWeekKey]: {
        ...prev[currentWeekKey],
        [day]: {
          ...(prev[currentWeekKey]?.[day] || { positives: {}, negatives: {} }),
          [category]: {
            ...(prev[currentWeekKey]?.[day]?.[category] || {}),
            [factorId]: value
          }
        }
      }
    }));
  };

  const calculateDayScore = (day, weekKey = currentWeekKey) => {
    const data = allWeeksData[weekKey]?.[day] || { positives: {}, negatives: {} };
    let score = 0;

    positiveFactors.forEach(factor => {
      const value = data.positives[factor.id] || 0;
      if (factor.type === 'check') {
        score += value ? factor.points : 0;
      } else {
        score += value * factor.points;
      }
    });

    negativeFactors.forEach(factor => {
      const value = data.negatives[factor.id] || 0;
      score += value * factor.points;
    });

    return score;
  };

  const calculateWeekScore = (weekKey = currentWeekKey) => {
    return days.reduce((total, day) => total + calculateDayScore(day, weekKey), 0);
  };

  const calculateCumulativeScore = () => {
    return Object.keys(allWeeksData).reduce((total, weekKey) => {
      return total + calculateWeekScore(weekKey);
    }, 0);
  };

  const getScoreColor = (score) => {
    if (score < 0) return 'text-red-600 bg-red-50';
    if (score === 0) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getWeekStatus = (score) => {
    if (score < 0) return { 
      text: 'Tougher next week ahead', 
      color: 'bg-red-500 text-white', 
      icon: TrendingDown,
      emoji: '⚠️'
    };
    if (score === 0) return { 
      text: 'Treading water', 
      color: 'bg-yellow-500 text-white', 
      icon: Activity,
      emoji: '⚡'
    };
    return { 
      text: 'Ready to attack training!', 
      color: 'bg-green-500 text-white', 
      icon: TrendingUp,
      emoji: '🚀'
    };
  };

  const resetDay = (day) => {
    setAllWeeksData(prev => ({
      ...prev,
      [currentWeekKey]: {
        ...prev[currentWeekKey],
        [day]: { positives: {}, negatives: {} }
      }
    }));
  };

  const resetWeek = () => {
    if (confirm('Reset entire week? This cannot be undone.')) {
      setAllWeeksData(prev => {
        const newData = { ...prev };
        delete newData[currentWeekKey];
        return newData;
      });
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const isCurrentWeek = formatDate(getWeekStart(new Date())) === currentWeekKey;

  const weekScore = calculateWeekScore();
  const cumulativeScore = calculateCumulativeScore();
  const weekStatus = getWeekStatus(weekScore);
  const StatusIcon = weekStatus.icon;
  const todayScore = calculateDayScore(selectedDay);
  
  // Get all weeks sorted
  const allWeeks = Object.keys(allWeeksData).sort().reverse();

  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🚣</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Rower!</h1>
            <p className="text-gray-600">Let's track your recovery</p>
          </div>
          <input
            type="text"
            placeholder="Enter your name"
            value={athleteName}
            onChange={(e) => setAthleteName(e.target.value)}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-transparent mb-4"
            autoFocus
          />
          <button
            onClick={() => {
              if (athleteName.trim()) {
                setShowNamePrompt(false);
              }
            }}
            disabled={!athleteName.trim()}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Start Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className={`${weekStatus.color} sticky top-0 z-10 shadow-lg`}>
        <div className="px-4 py-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={goToPreviousWeek}
              className="text-white p-2 hover:bg-white/20 rounded-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center flex-1">
              <div className="text-white text-sm font-medium opacity-90">{getWeekString(currentWeekStart)}</div>
              {!isCurrentWeek && (
                <button 
                  onClick={goToCurrentWeek}
                  className="text-white text-xs underline opacity-75 hover:opacity-100"
                >
                  Go to current week
                </button>
              )}
            </div>
            <button 
              onClick={goToNextWeek}
              className="text-white p-2 hover:bg-white/20 rounded-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white text-sm font-medium opacity-90">Hey {athleteName}!</div>
              <div className="text-white text-2xl font-bold">Week {weekScore > 0 ? '+' : ''}{weekScore}</div>
              <div className="text-white text-xs opacity-75">All-time: {cumulativeScore > 0 ? '+' : ''}{cumulativeScore}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-4xl">{weekStatus.emoji}</div>
              <button onClick={() => setShowMenu(!showMenu)} className="text-white p-2">
                {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          <div className="text-white text-sm font-medium">{weekStatus.text}</div>
        </div>

        {/* Day Selector */}
        <div className="overflow-x-auto px-4 pb-3 hide-scrollbar">
          <div className="flex gap-2">
            {days.map(day => {
              const dayScore = calculateDayScore(day);
              const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
              const isToday = day === today && isCurrentWeek;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold transition-all ${
                    selectedDay === day
                      ? 'bg-white text-gray-900 shadow-lg scale-105'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <div className="text-xs">{day.slice(0, 3)}</div>
                  <div className="text-lg font-bold">{dayScore > 0 ? '+' : ''}{dayScore}</div>
                  {isToday && <div className="text-xs opacity-75">Today</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Dropdown */}
      {showMenu && (
        <div className="bg-white border-b shadow-lg">
          <button
            onClick={() => {
              setShowHistory(true);
              setShowMenu(false);
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b flex items-center gap-3"
          >
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <span>View History ({allWeeks.length} weeks)</span>
          </button>
          <button
            onClick={() => {
              resetDay(selectedDay);
              setShowMenu(false);
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b flex items-center gap-3"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
            <span>Reset {selectedDay}</span>
          </button>
          <button
            onClick={() => {
              resetWeek();
              setShowMenu(false);
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b flex items-center gap-3"
          >
            <Calendar className="w-5 h-5 text-gray-600" />
            <span>Reset This Week</span>
          </button>
          <button
            onClick={() => {
              setShowNamePrompt(true);
              setShowMenu(false);
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
          >
            <span className="text-lg">👤</span>
            <span>Change Name</span>
          </button>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Recovery History</h2>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-4">
                <div className="text-sm font-medium opacity-90">All-Time Score</div>
                <div className="text-5xl font-bold">{cumulativeScore > 0 ? '+' : ''}{cumulativeScore}</div>
                <div className="text-sm opacity-75 mt-1">{allWeeks.length} weeks tracked</div>
              </div>

              <div className="space-y-3">
                {allWeeks.map(weekKey => {
                  const weekDate = new Date(weekKey);
                  const score = calculateWeekScore(weekKey);
                  const status = getWeekStatus(score);
                  
                  return (
                    <button
                      key={weekKey}
                      onClick={() => {
                        setCurrentWeekStart(weekDate);
                        setShowHistory(false);
                      }}
                      className="w-full bg-white border-2 rounded-xl p-4 hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{getWeekString(weekDate)}</div>
                          <div className="text-sm text-gray-500">{status.text}</div>
                        </div>
                        <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                          {score > 0 ? '+' : ''}{score}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {days.map(day => {
                          const dayScore = calculateDayScore(day, weekKey);
                          return (
                            <div 
                              key={day} 
                              className={`flex-1 h-2 rounded ${
                                dayScore > 0 ? 'bg-green-500' : dayScore < 0 ? 'bg-red-500' : 'bg-yellow-500'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
                
                {allWeeks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No history yet. Start tracking!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Day Score */}
      <div className="px-4 py-4">
        <div className={`rounded-2xl p-4 ${getScoreColor(todayScore)} border-2 ${
          todayScore < 0 ? 'border-red-200' : todayScore === 0 ? 'border-yellow-200' : 'border-green-200'
        }`}>
          <div className="text-sm font-semibold opacity-75">{selectedDay}'s Score</div>
          <div className="text-4xl font-bold">{todayScore > 0 ? '+' : ''}{todayScore}</div>
        </div>
      </div>

      {/* Positive Factors */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Recovery Boosters</h2>
        </div>
        <div className="space-y-2">
          {positiveFactors.map(factor => (
            <div key={factor.id} className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
              <div className="flex items-start justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex-1">{factor.label}</label>
                <span className="text-lg font-bold text-green-600 ml-2">
                  {factor.type === 'check' 
                    ? (weekData[selectedDay].positives[factor.id] ? `+${factor.points}` : '0')
                    : `+${(weekData[selectedDay].positives[factor.id] || 0) * factor.points}`
                  }
                </span>
              </div>
              {factor.type === 'check' ? (
                <label className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={weekData[selectedDay].positives[factor.id] || false}
                    onChange={(e) => updateFactor(selectedDay, 'positives', factor.id, e.target.checked)}
                    className="w-8 h-8 text-green-600 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </label>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateFactor(selectedDay, 'positives', factor.id, Math.max(0, (weekData[selectedDay].positives[factor.id] || 0) - 1))}
                    className="bg-gray-200 text-gray-700 w-12 h-12 rounded-lg font-bold text-xl active:bg-gray-300"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={weekData[selectedDay].positives[factor.id] || 0}
                    onChange={(e) => updateFactor(selectedDay, 'positives', factor.id, Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 px-4 py-3 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => updateFactor(selectedDay, 'positives', factor.id, (weekData[selectedDay].positives[factor.id] || 0) + 1)}
                    className="bg-green-500 text-white w-12 h-12 rounded-lg font-bold text-xl active:bg-green-600"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Negative Factors */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-red-500 p-2 rounded-lg">
            <Minus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Recovery Detractors</h2>
        </div>
        <div className="space-y-2">
          {negativeFactors.map(factor => (
            <div key={factor.id} className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
              <div className="flex items-start justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex-1">{factor.label}</label>
                <span className="text-lg font-bold text-red-600 ml-2">
                  {(weekData[selectedDay].negatives[factor.id] || 0) * factor.points}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateFactor(selectedDay, 'negatives', factor.id, Math.max(0, (weekData[selectedDay].negatives[factor.id] || 0) - 1))}
                  className="bg-gray-200 text-gray-700 w-12 h-12 rounded-lg font-bold text-xl active:bg-gray-300"
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  value={weekData[selectedDay].negatives[factor.id] || 0}
                  onChange={(e) => updateFactor(selectedDay, 'negatives', factor.id, Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 px-4 py-3 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  onClick={() => updateFactor(selectedDay, 'negatives', factor.id, (weekData[selectedDay].negatives[factor.id] || 0) + 1)}
                  className="bg-red-500 text-white w-12 h-12 rounded-lg font-bold text-xl active:bg-red-600"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
