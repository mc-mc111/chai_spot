import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  RefreshCw, 
  Flag, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X,
  Navigation
} from 'lucide-react';

const getManeuverIcon = (step) => {
  const type = step.maneuver?.type || '';
  const modifier = step.maneuver?.modifier || '';

  if (type === 'arrive') return <Flag size={24} className="nav-step-icon arrive" />;
  if (type === 'depart') return <ArrowUp size={24} className="nav-step-icon straight" />;
  if (type.includes('roundabout')) return <RefreshCw size={24} className="nav-step-icon roundabout" />;
  if (modifier.includes('uturn')) return <RotateCcw size={24} className="nav-step-icon uturn" />;
  if (modifier.includes('left')) return <ArrowLeft size={24} className="nav-step-icon left" />;
  if (modifier.includes('right')) return <ArrowRight size={24} className="nav-step-icon right" />;
  return <ArrowUp size={24} className="nav-step-icon straight" />;
};

const getManeuverText = (step) => {
  const type = step.maneuver?.type || 'drive';
  const modifier = step.maneuver?.modifier ? ` ${step.maneuver.modifier}` : '';
  const street = step.name ? ` onto ${step.name}` : '';
  let text = `${type.charAt(0).toUpperCase() + type.slice(1)}${modifier}${street}`;
  if (type === 'depart') text = `Head out${modifier}${street}`;
  if (type === 'arrive') text = `Arrive at destination! ☕`;
  return text;
};

const NavSimulationHUD = ({ steps, currentStepIdx, onStepChange, onClose }) => {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    let timer = null;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        onStepChange((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsAutoPlaying(false);
            return prev;
          }
        });
      }, 3500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoPlaying, steps.length, onStepChange]);

  if (!steps || steps.length === 0) return null;
  const currentStep = steps[currentStepIdx] || steps[0];

  const handlePrev = () => {
    if (currentStepIdx > 0) onStepChange(currentStepIdx - 1);
  };

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) onStepChange(currentStepIdx + 1);
  };

  return (
    <div className="nav-simulation-hud">
      <div className="hud-top-bar">
        <div className="hud-icon-box">
          {getManeuverIcon(currentStep)}
        </div>

        <div className="hud-instruction">
          <span className="hud-step-counter">Step {currentStepIdx + 1} of {steps.length}</span>
          <h3 className="hud-text">{getManeuverText(currentStep)}</h3>
          <span className="hud-distance">In {(currentStep.distance / 1000).toFixed(1)} km</span>
        </div>

        <button className="hud-close-btn" onClick={onClose} title="Exit Drive Mode">
          <X size={20} />
        </button>
      </div>

      <div className="hud-controls">
        <button 
          className="hud-ctrl-btn" 
          onClick={handlePrev} 
          disabled={currentStepIdx === 0}
          title="Previous Turn"
        >
          <SkipBack size={16} />
          <span>Prev</span>
        </button>

        <button 
          className={`hud-ctrl-btn play-btn ${isAutoPlaying ? 'playing' : ''}`}
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        >
          {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
          <span>{isAutoPlaying ? 'Pause Drive' : 'Auto Drive'}</span>
        </button>

        <button 
          className="hud-ctrl-btn" 
          onClick={handleNext} 
          disabled={currentStepIdx === steps.length - 1}
          title="Next Turn"
        >
          <span>Next</span>
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  );
};

export default NavSimulationHUD;
